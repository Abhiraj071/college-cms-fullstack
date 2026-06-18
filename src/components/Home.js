export class Home {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.stars = null;
        this.animationFrameId = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.style.position = 'relative';
        this.container.style.width = '100vw';
        this.container.style.minHeight = '100vh';
        this.container.style.background = 'var(--bg-tertiary)';
        this.container.style.color = 'var(--text-primary)';
        this.container.style.fontFamily = "'Inter', sans-serif";
        this.container.style.overflowX = 'hidden';
        this.container.className = 'fade-in';

        // Foreground Content Wrapper
        const foreground = document.createElement('div');
        foreground.style.position = 'relative';
        foreground.style.zIndex = '2';
        foreground.style.width = '100%';
        foreground.style.minHeight = '100vh';
        foreground.style.display = 'flex';
        foreground.style.flexDirection = 'column';
        this.container.appendChild(foreground);

        // 1. Navigation Bar
        const nav = document.createElement('nav');
        nav.style.position = 'fixed';
        nav.style.top = '0';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.padding = '1.25rem 2.5rem';
        nav.style.display = 'flex';
        nav.style.justifyContent = 'space-between';
        nav.style.alignItems = 'center';
        nav.style.backdropFilter = 'blur(12px)';
        nav.style.webkitBackdropFilter = 'blur(12px)';
        nav.style.borderBottom = '1px solid var(--border-color)';
        nav.style.background = 'var(--glass-bg)';
        nav.style.transition = 'all 0.3s ease';
        nav.style.zIndex = '100';

        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" onclick="window.location.hash='#/home'">
                <span style="font-size: 1.8rem; filter: drop-shadow(0 0 10px var(--accent-blue));">🎓</span>
                <span style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; background: linear-gradient(90deg, var(--text-primary) 0%, var(--accent-blue) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">College OS</span>
            </div>
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <a href="#/login" class="secondary-button" style="padding: 8px 18px !important; font-weight: 600;">Live Demo</a>
                <a href="#/login" class="glass-button" style="padding: 8px 20px !important; font-weight: 600;">Sign In</a>
            </div>
        `;

        foreground.appendChild(nav);

        // Shrink on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.style.padding = '0.75rem 2.5rem';
                nav.style.background = 'var(--bg-primary)';
                nav.style.borderBottom = '1px solid var(--border-color-strong)';
            } else {
                nav.style.padding = '1.25rem 2.5rem';
                nav.style.background = 'var(--glass-bg)';
                nav.style.borderBottom = '1px solid var(--border-color)';
            }
        });

        // 2. Hero Section (2-Column Grid on Desktop)
        const hero = document.createElement('section');
        hero.style.flex = '1';
        hero.style.display = 'grid';
        hero.style.gridTemplateColumns = window.innerWidth > 992 ? '1.2fr 1fr' : '1fr';
        hero.style.alignItems = 'center';
        hero.style.gap = '3rem';
        hero.style.padding = '8rem 2.5rem 4rem';
        hero.style.maxWidth = '1200px';
        hero.style.margin = '0 auto';
        hero.style.width = '100%';

        const heroContent = document.createElement('div');
        heroContent.style.textAlign = window.innerWidth > 992 ? 'left' : 'center';
        heroContent.style.display = 'flex';
        heroContent.style.flexDirection = 'column';
        heroContent.style.alignItems = window.innerWidth > 992 ? 'flex-start' : 'center';

        heroContent.innerHTML = `
            <div class="float-slow" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--accent-glow); border: 1px solid rgba(123, 97, 255, 0.2); border-radius: 999px; margin-bottom: 2rem;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px var(--success);"></span>
                <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent-color);">v2.0 Connected</span>
            </div>
            
            <h1 style="font-family: 'Outfit', sans-serif; font-size: clamp(2.2rem, 4.5vw, 4rem); font-weight: 800; line-height: 1.15; letter-spacing: -1px; margin-bottom: 1.5rem; background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-purple) 70%, var(--accent-blue) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Smart ERP for <br>
                <span style="background: linear-gradient(90deg, var(--accent-color) 0%, var(--accent-blue) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 30px var(--accent-glow));">Modern Institutions</span>
            </h1>
            
            <p style="font-size: clamp(0.95rem, 1.8vw, 1.15rem); color: var(--text-secondary); max-width: 600px; line-height: 1.6; margin-bottom: 2.5rem;">
                Manage students, faculty, attendance, examinations, and analytics through an intelligent, unified digital ecosystem. Built for performance and designed for clarity.
            </p>
            
            <div style="display: flex; gap: 1.25rem; flex-wrap: wrap; justify-content: ${window.innerWidth > 992 ? 'flex-start' : 'center'};">
                <button onclick="window.location.hash='#/login'" class="glass-button" style="padding: 14px 32px !important; font-size: 1rem !important; border-radius: 30px !important;">
                    Get Started <span style="margin-left: 6px; transition: transform 0.2s;" class="arrow">→</span>
                </button>
                <button onclick="window.location.hash='#/login'" class="secondary-button" style="padding: 14px 32px !important; font-size: 1rem !important; border-radius: 30px !important;">
                    Explore Features
                </button>
            </div>
        `;

        const heroVisual = document.createElement('div');
        heroVisual.style.position = 'relative';
        heroVisual.style.width = '100%';
        heroVisual.style.height = window.innerWidth > 992 ? '500px' : '350px';
        heroVisual.style.display = 'flex';
        heroVisual.style.alignItems = 'center';
        heroVisual.style.justifyContent = 'center';

        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'auto';
        heroVisual.appendChild(canvas);

        const glowBack = document.createElement('div');
        glowBack.style.cssText = 'position:absolute; width: 250px; height: 250px; border-radius: 50%; background: var(--accent-glow); filter: blur(80px); z-index: -1; pointer-events: none; opacity: 0.6;';
        heroVisual.appendChild(glowBack);

        hero.appendChild(heroContent);
        hero.appendChild(heroVisual);
        foreground.appendChild(hero);

        // 3. Features Section (Stand-Alone)
        const features = document.createElement('section');
        features.style.padding = '4rem 2.5rem 8rem';
        features.style.maxWidth = '1200px';
        features.style.margin = '0 auto';
        features.style.width = '100%';

        features.innerHTML = `
            <div style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 2.2rem; font-family: 'Outfit'; font-weight: 800; margin-bottom: 1rem; background: linear-gradient(90deg, var(--text-primary) 0%, var(--accent-color) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Built for Modern Institutions</h2>
                <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto; font-size: 1.05rem;">An all-in-one control center featuring modules designed for next-generation administration.</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; width: 100%;">
                <!-- Feature 1 -->
                <div class="glass-panel feature-card" style="padding: 2rem; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: default; display: flex; flex-direction: column; gap: 1rem; border-color: var(--glass-border);">
                    <div style="width: 54px; height: 54px; border-radius: 12px; display:flex; align-items:center; justify-content:center; background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.25); color: var(--accent-blue); flex-shrink:0;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    </div>
                    <div>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Live Analytics</h3>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.6;">Real-time stats dashboard monitoring student enrollment, grading distributions, and vital administrative metrics.</p>
                    </div>
                </div>

                <!-- Feature 2 -->
                <div class="glass-panel feature-card" style="padding: 2rem; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: default; display: flex; flex-direction: column; gap: 1rem; border-color: var(--glass-border);">
                    <div style="width: 54px; height: 54px; border-radius: 12px; display:flex; align-items:center; justify-content:center; background: rgba(123, 97, 255, 0.1); border: 1px solid rgba(123, 97, 255, 0.25); color: var(--accent-purple); flex-shrink:0;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Smart Attendance</h3>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.6;">Automated logs, threshold warnings, and student-focused tracking models for modern course structures.</p>
                    </div>
                </div>

                <!-- Feature 3 -->
                <div class="glass-panel feature-card" style="padding: 2rem; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: default; display: flex; flex-direction: column; gap: 1rem; border-color: var(--glass-border);">
                    <div style="width: 54px; height: 54px; border-radius: 12px; display:flex; align-items:center; justify-content:center; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: var(--success); flex-shrink:0;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <div>
                        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Grade Management</h3>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.6;">Seamless marks entries, automated backlog checks, official grade cards, and scheduled exam registration cycles.</p>
                    </div>
                </div>
            </div>
        `;
        foreground.appendChild(features);

        // Inject custom styles for micro-animations
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .feature-card:hover {
                transform: translateY(-8px) scale(1.015);
                border-color: var(--accent-color) !important;
                box-shadow: 0 15px 35px var(--accent-glow), 0 0 15px rgba(0, 212, 255, 0.05);
            }
        `;
        this.container.appendChild(styleTag);

        // Add hover effect for the primary button arrow
        const primaryBtn = hero.querySelector('.glass-button');
        primaryBtn.addEventListener('mouseenter', () => {
            hero.querySelector('.arrow').style.transform = 'translateX(4px)';
        });
        primaryBtn.addEventListener('mouseleave', () => {
            hero.querySelector('.arrow').style.transform = 'translateX(0)';
        });

        // Initialize 3D Engine
        this.init3D(canvas);

        return this.container;
    }

    init3D(canvas) {
        if (!window.THREE) {
            console.error('Three.js library is not loaded');
            return;
        }

        const width = window.innerWidth > 992 ? Math.min(500, window.innerWidth * 0.42) : window.innerWidth;
        const height = window.innerWidth > 992 ? 500 : 350;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.z = 150;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Globe Group
        const globeGroup = new THREE.Group();
        this.scene.add(globeGroup);

        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        const globeColor = isDarkTheme ? 0x00d4ff : 0x7b61ff; // Cyan in dark, Violet in light
        const ringColor = isDarkTheme ? 0x7b61ff : 0x8b5cf6;
        const coreColor = isDarkTheme ? 0x7b61ff : 0x6366f1;

        // Rotating Holographic Globe Geometry (Wireframe Sphere)
        const geometry = new THREE.SphereGeometry(55, 30, 30);
        const material = new THREE.MeshBasicMaterial({
            color: globeColor,
            wireframe: true,
            transparent: true,
            opacity: isDarkTheme ? 0.18 : 0.35
        });
        this.globe = new THREE.Mesh(geometry, material);
        globeGroup.add(this.globe);

        // Inner glowing core
        const coreGeo = new THREE.SphereGeometry(50, 20, 20);
        const coreMat = new THREE.MeshBasicMaterial({
            color: coreColor,
            transparent: true,
            opacity: isDarkTheme ? 0.05 : 0.12
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        globeGroup.add(core);

        // Outer glow orbit rings
        const ringGeo = new THREE.RingGeometry(72, 73, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: ringColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isDarkTheme ? 0.12 : 0.25
        });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 3;
        globeGroup.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.y = Math.PI / 4;
        globeGroup.add(ring2);

        // Stars Particle System
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 450;
        const starPositions = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 800;     // X
            starPositions[i + 1] = (Math.random() - 0.5) * 800; // Y
            starPositions[i + 2] = (Math.random() - 0.5) * 600; // Z
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

        // Custom star material
        const starsMaterial = new THREE.PointsMaterial({
            color: isDarkTheme ? 0xffffff : 0x7b61ff,
            size: isDarkTheme ? 1.5 : 2.0,
            transparent: true,
            opacity: isDarkTheme ? 0.65 : 0.45,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);

        // Position Globe Group centered inside container
        globeGroup.position.x = 0;
        globeGroup.position.y = 0;

        // Mouse Interactivity Parallax
        let targetMouseX = 0;
        let targetMouseY = 0;
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (e) => {
            targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
            targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);

            // Slow rotations
            this.globe.rotation.y += 0.002;
            this.globe.rotation.x += 0.001;
            
            ring1.rotation.z -= 0.001;
            ring2.rotation.z += 0.0015;

            this.stars.rotation.y += 0.0003;

            // Ease mouse parallax
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            globeGroup.rotation.y = mouseX * 0.01;
            globeGroup.rotation.x = mouseY * 0.01;

            this.renderer.render(this.scene, this.camera);
        };

        animate();

        // Responsive Resizing
        const handleResize = () => {
            if (!this.camera || !this.renderer) return;

            const w = canvas.parentElement.clientWidth || (window.innerWidth > 992 ? Math.min(500, window.innerWidth * 0.42) : window.innerWidth);
            const h = canvas.parentElement.clientHeight || (window.innerWidth > 992 ? 500 : 350);

            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup listener references on navigation/removal
        window.addEventListener('hashchange', () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
            if (this.renderer) {
                this.renderer.dispose();
            }
        }, { once: true });
    }
}
