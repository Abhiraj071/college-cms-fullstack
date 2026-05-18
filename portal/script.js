const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const examSelect = document.getElementById('examId');
    const searchForm = document.getElementById('searchForm');
    const resultContainer = document.getElementById('resultContainer');
    const errorMsg = document.getElementById('errorMsg');
    const searchBtn = document.getElementById('searchBtn');
    const btnLoader = document.getElementById('btnLoader');

    // 1. Fetch Exams
    try {
        const response = await fetch(`${API_BASE}/exams`);
        if (!response.ok) throw new Error('Failed to load exams');
        const exams = await response.json();
        
        examSelect.innerHTML = '<option value="">-- Select Exam --</option>';
        exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam._id;
            option.textContent = `${exam.title} (${exam.course})`;
            examSelect.appendChild(option);
        });
        examSelect.disabled = false;
    } catch (err) {
        examSelect.innerHTML = '<option value="">Error loading exams</option>';
        showError('Could not connect to server. Please try again later.');
    }

    // 2. Handle Search
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rollNo = document.getElementById('rollNo').value.trim();
        const examId = examSelect.value;

        if (!rollNo || !examId) return;

        setLoading(true);
        hideError();
        resultContainer.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/exams/public/result?rollNo=${rollNo}&examId=${examId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Result not found');
            }

            displayResult(data);
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    });

    function displayResult(data) {
        const { student, exam, marks } = data;
        
        // Header info
        document.getElementById('resStudentName').textContent = student.name;
        document.getElementById('resRollNo').textContent = student.rollNo;
        document.getElementById('resCourse').textContent = student.course;
        document.getElementById('resExamTitle').textContent = exam.title;
        document.getElementById('resSemester').textContent = exam.semester;
        document.getElementById('resDate').textContent = new Date(exam.date).toLocaleDateString();

        // Table Body
        const tbody = document.getElementById('marksBody');
        tbody.innerHTML = '';
        
        let allPassed = true;
        (marks.subjectMarks || []).forEach(sm => {
            const row = document.createElement('tr');
            const isPassed = (sm.total || 0) >= (sm.maxTotal || 100) * 0.4;
            if (!isPassed) allPassed = false;

            row.innerHTML = `
                <td style="font-weight: 500;">${sm.subjectName} <br><small style="color: #64748b; font-weight: normal;">${sm.subjectCode || ''}</small></td>
                <td>${sm.sessional || 0} / ${sm.maxSessional || 30}</td>
                <td>${sm.theory || 0} / ${sm.maxTheory || 70}</td>
                <td>${sm.viva || 0} / ${sm.maxViva || 0}</td>
                <td style="font-weight: 600;">${sm.total || 0} / ${sm.maxTotal || 100}</td>
                <td><span class="status-pill ${isPassed ? 'status-pass' : 'status-fail'}">${isPassed ? 'PASS' : 'FAIL'}</span></td>
            `;
            tbody.appendChild(row);
        });

        // Summary
        document.getElementById('resGrandTotal').textContent = `${marks.marksObtained} / ${marks.totalPossible}`;
        const percentage = marks.totalPossible > 0 ? ((marks.marksObtained / marks.totalPossible) * 100).toFixed(1) : 0;
        document.getElementById('resPercentage').textContent = `${percentage}%`;
        
        const statusEl = document.getElementById('resStatus');
        statusEl.textContent = allPassed ? 'PASS' : 'FAIL';
        statusEl.className = `status-pill ${allPassed ? 'status-pass' : 'status-fail'}`;

        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function setLoading(isLoading) {
        searchBtn.disabled = isLoading;
        btnLoader.style.display = isLoading ? 'block' : 'none';
        searchBtn.querySelector('span').style.display = isLoading ? 'none' : 'block';
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }

    function hideError() {
        errorMsg.style.display = 'none';
    }
});
