const ExamApplication = require('../models/ExamApplication');
const Exam = require('../models/Exam');
const Mark = require('../models/Mark');
const Student = require('../models/Student');

const stripe = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('Placeholder')
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

// Get exams that the student is eligible to apply for
exports.getEligibleExams = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        // Find exams for this course
        const exams = await Exam.find({ course: student.course }).sort({ date: -1 });
        
        // Find existing applications
        const applications = await ExamApplication.find({ studentId: student._id });
        const appliedExamIds = applications.map(app => app.examId.toString());

        const eligibleExams = exams.map(exam => {
            const isApplied = appliedExamIds.includes(exam._id.toString());
            const app = applications.find(a => a.examId.toString() === exam._id.toString());
            return {
                ...exam.toObject(),
                isApplied,
                applicationStatus: app ? app.status : null
            };
        });

        res.json(eligibleExams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get details (subjects, backlog) for the exam form
exports.getExamFormDetails = async (req, res) => {
    try {
        const { examId } = req.params;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Regular subjects for current semester
        const regularSubjects = exam.subjectSchedules.filter(s => 
            !s.semester || parseInt(s.semester) === parseInt(student.semester)
        ).map(s => ({ subjectId: s.subjectId, name: s.name, code: s.code }));

        // Supplementary subjects (logic adapted from getSupplementarySubjects)
        const allMarks = await Mark.find({ studentId: student._id }).populate('examId', 'course semester subjectSchedules');
        const failedSubjectsMap = {};

        allMarks.forEach(m => {
            if (!m.examId) return;
            m.subjectMarks.forEach(sm => {
                const subSem = sm.semester || m.examId.semester;
                if (subSem && subSem < student.semester && !sm.isSupplementary) {
                    const passing = (sm.maxTotal || 100) * 0.4;
                    if (sm.total < passing) {
                        const key = sm.subjectId || sm.subjectName;
                        // Check if passed in supplementary
                        const hasPassedSupp = allMarks.some(m2 =>
                            m2.subjectMarks.some(sm2 =>
                                (sm2.subjectId === sm.subjectId || sm2.subjectName === sm.subjectName)
                                && sm2.isSupplementary && sm2.total >= passing
                            )
                        );

                        if (!hasPassedSupp && !failedSubjectsMap[key]) {
                            failedSubjectsMap[key] = {
                                subjectId: sm.subjectId,
                                name: sm.subjectName,
                                code: sm.subjectCode || '',
                                semester: subSem
                            };
                        }
                    }
                }
            });
        });

        const supplementarySubjects = Object.values(failedSubjectsMap);

        res.json({
            student: {
                name: student.name,
                rollNo: student.rollNo,
                course: student.course,
                semester: student.semester
            },
            exam: {
                title: exam.title,
                date: exam.date
            },
            regularSubjects,
            supplementarySubjects
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Submit application and create Stripe Checkout Session
exports.submitApplication = async (req, res) => {
    try {
        const { examId, regularSubjects, supplementarySubjects, feeAmount } = req.body;
        
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        // Enforce Exam Registration Portal switch toggle
        const Setting = require('../models/Setting');
        const featureToggles = await Setting.findOne({ key: 'feature_toggles' });
        if (featureToggles && featureToggles.value && featureToggles.value.examRegistration === false) {
            return res.status(400).json({ message: 'The Exam Registration Portal is currently closed by the administration.' });
        }

        // Check if already applied (whether paid or pending verification)
        const existing = await ExamApplication.findOne({ studentId: student._id, examId });
        if (existing) {
            // If it exists but is still pending, we allow going to checkout again by deleting the old pending one
            if (existing.status === 'Pending') {
                await ExamApplication.findByIdAndDelete(existing._id);
            } else {
                return res.status(400).json({ message: 'Application already submitted and paid for this exam' });
            }
        }

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Load dynamic payment settings
        const paymentSettingsObj = await Setting.findOne({ key: 'payment_settings' });
        const pSettings = paymentSettingsObj ? paymentSettingsObj.value : null;

        let activeStripe = null;
        const isSandbox = pSettings && pSettings.mode === 'test';
        
        if (!isSandbox) {
            const dynamicKey = pSettings ? pSettings.stripeSecretKey : null;
            const useKey = dynamicKey && !dynamicKey.includes('Placeholder') ? dynamicKey : process.env.STRIPE_SECRET_KEY;
            
            if (useKey && !useKey.includes('Placeholder')) {
                try {
                    activeStripe = require('stripe')(useKey);
                } catch (err) {
                    console.error('Failed to initialize dynamic Stripe instance:', err);
                }
            }
        }

        // Fallback Mode if dynamic stripe is not initialized or sandbox mode is active
        if (!activeStripe) {
            console.warn('⚠️ Sandbox/Test mode active or Stripe key is not configured. Falling back to mock redirect.');
            const application = new ExamApplication({
                studentId: student._id,
                examId,
                course: student.course,
                semester: student.semester,
                regularSubjects,
                supplementarySubjects,
                status: 'Pending',
                feeAmount,
                transactionId: 'PENDING-MOCK-TXN',
                paymentDate: new Date()
            });
            await application.save();

            const mockCheckoutUrl = `${req.headers.origin}/#/exam-registration?success=true&session_id=mock_session_${application._id}&examId=${examId}`;
            return res.status(201).json({ 
                message: 'Sandbox mode active. Redirecting to mock verification.',
                checkoutUrl: mockCheckoutUrl 
            });
        }

        // 1. Create a Pending application in DB
        const application = new ExamApplication({
            studentId: student._id,
            examId,
            course: student.course,
            semester: student.semester,
            regularSubjects,
            supplementarySubjects,
            status: 'Pending',
            feeAmount,
            paymentDate: new Date()
        });
        await application.save();

        // 2. Create Stripe Checkout Session
        const session = await activeStripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: `${exam.title} - Exam Registration`,
                        description: `Course: ${student.course} | Semester: ${student.semester}`,
                    },
                    unit_amount: Math.round(feeAmount * 100), // Stripe expects amount in paise (rupees * 100)
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/#/exam-registration?success=true&session_id={CHECKOUT_SESSION_ID}&examId=${examId}`,
            cancel_url: `${req.headers.origin}/#/exam-registration?canceled=true`,
            metadata: {
                applicationId: application._id.toString(),
                examId: examId.toString(),
                studentId: student._id.toString()
            }
        });

        res.status(201).json({ 
            message: 'Checkout session created', 
            checkoutUrl: session.url 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get admit card details for a specific exam if paid
exports.getAdmitCard = async (req, res) => {
    try {
        const { examId } = req.params;
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const application = await ExamApplication.findOne({ studentId: student._id, examId, status: 'Paid' })
            .populate('examId');

        if (!application) {
            return res.status(404).json({ message: 'Valid exam application not found. Please register and pay the fee first.' });
        }

        res.json({
            student,
            application,
            exam: application.examId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Verify Stripe payment session
exports.verifyPayment = async (req, res) => {
    try {
        const { session_id, examId } = req.query;
        if (!session_id) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        // Handle Fallback Mode
        if (session_id.startsWith('mock_session_')) {
            const appId = session_id.replace('mock_session_', '');
            const application = await ExamApplication.findOne({ _id: appId, studentId: student._id, examId });
            if (!application) {
                return res.status(404).json({ message: 'Mock exam application not found' });
            }

            if (application.status !== 'Paid') {
                application.status = 'Paid';
                application.transactionId = 'TXN-MOCK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                application.paymentDate = new Date();
                await application.save();
            }

            return res.json({ 
                success: true, 
                message: 'Mock payment verified successfully', 
                transactionId: application.transactionId 
            });
        }

        // Dynamic Stripe Mode validation
        const Setting = require('../models/Setting');
        const paymentSettingsObj = await Setting.findOne({ key: 'payment_settings' });
        const pSettings = paymentSettingsObj ? paymentSettingsObj.value : null;

        let activeStripe = null;
        const isSandbox = pSettings && pSettings.mode === 'test';
        
        if (!isSandbox) {
            const dynamicKey = pSettings ? pSettings.stripeSecretKey : null;
            const useKey = dynamicKey && !dynamicKey.includes('Placeholder') ? dynamicKey : process.env.STRIPE_SECRET_KEY;
            
            if (useKey && !useKey.includes('Placeholder')) {
                try {
                    activeStripe = require('stripe')(useKey);
                } catch (err) {
                    console.error('Failed to initialize dynamic Stripe instance:', err);
                }
            }
        }

        if (!activeStripe) {
            return res.status(500).json({ message: 'Stripe is not configured or sandbox mode is active.' });
        }

        const session = await activeStripe.checkout.sessions.retrieve(session_id);
        if (!session) {
            return res.status(404).json({ message: 'Payment session not found' });
        }

        if (session.payment_status === 'paid') {
            const appId = session.metadata.applicationId;
            const application = await ExamApplication.findById(appId);
            
            if (!application) {
                return res.status(404).json({ message: 'Exam application not found for this payment.' });
            }

            application.status = 'Paid';
            application.transactionId = session.payment_intent || session.id;
            application.paymentDate = new Date();
            await application.save();

            return res.json({ 
                success: true, 
                message: 'Payment verified successfully', 
                transactionId: application.transactionId 
            });
        } else {
            return res.status(400).json({ message: 'Payment has not been completed.' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
