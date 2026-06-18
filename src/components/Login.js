export class Login {
    constructor(loginCallback) {
        this.loginCallback = loginCallback;
        this.animationFrameId = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.objects = [];
    }

    render() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.height = '100vh';
        container.style.width = '100vw';
        container.style.overflow = 'hidden';
        container.style.background = 'var(--bg-tertiary)';
        container.style.color = 'var(--text-primary)';
        container.style.fontFamily = "'Inter', sans-serif";
        container.className = 'fade-in';

        // 1. Split Screen Layout
        const leftSide = document.createElement('div');
        leftSide.style.flex = '1.3';
        leftSide.style.position = 'relative';
        leftSide.style.background = 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)';
        leftSide.style.display = 'flex';
        leftSide.style.flexDirection = 'column';
        leftSide.style.justifyContent = 'center';
        leftSide.style.alignItems = 'center';
        leftSide.style.borderRight = '1px solid var(--border-color)';
        leftSide.className = 'login-3d-pane';

        // Add 3D Canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        leftSide.appendChild(canvas);

        // Holographic floating text on left side
        const leftText = document.createElement('div');
        leftText.style.position = 'relative';
        leftText.style.zIndex = '5';
        leftText.style.textAlign = 'center';
        leftText.style.pointerEvents = 'none';
        leftText.innerHTML = `
            <div style="font-size: 3rem; filter: drop-shadow(0 0 15px var(--accent-blue)); margin-bottom: 1rem;">🛰️</div>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; background: linear-gradient(90deg, var(--text-primary) 0%, var(--accent-purple) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Autonomous Campus</h2>
            <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 320px; margin: 0 auto; line-height: 1.5;">Holographic system control for real-time institutional management.</p>
        `;
        leftSide.appendChild(leftText);

        const rightSide = document.createElement('div');
        rightSide.style.flex = '1';
        rightSide.style.display = 'flex';
        rightSide.style.justifyContent = 'center';
        rightSide.style.alignItems = 'center';
        rightSide.style.padding = '2rem';
        rightSide.style.position = 'relative';
        rightSide.style.zIndex = '10';

        // Login Card Panel (Futuristic Glassmorphic)
        const loginPanel = document.createElement('div');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        loginPanel.style.width = '100%';
        loginPanel.style.maxWidth = '390px';
        loginPanel.style.padding = '2.5rem 2.25rem';
        loginPanel.style.background = isDark ? 'rgba(11, 16, 35, 0.6)' : 'rgba(255, 255, 255, 0.85)';
        loginPanel.style.border = isDark ? '1px solid rgba(123, 97, 255, 0.2)' : '1px solid rgba(123, 97, 255, 0.15)';
        loginPanel.style.borderRadius = '16px';
        loginPanel.style.boxShadow = isDark 
            ? '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(123, 97, 255, 0.05)'
            : '0 15px 45px rgba(0, 0, 0, 0.06), 0 0 20px rgba(123, 97, 255, 0.03)';
        loginPanel.style.backdropFilter = 'blur(16px)';
        loginPanel.style.webkitBackdropFilter = 'blur(16px)';
        loginPanel.className = 'neon-glow';

        loginPanel.innerHTML = `
            <div style="margin-bottom: 2.5rem; text-align: center;">
                <h1 style="font-family: 'Outfit', sans-serif; color: var(--text-primary); font-size: 1.85rem; letter-spacing: -0.5px; margin: 0; font-weight: 800;">
                    College Result System<span style="font-size: 1rem; color: var(--accent-color);"></span>
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 0;">Sign in to your control center</p>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.8;">Username</label>
                <input type="text" id="username" placeholder="Enter username" style="width: 100%;" autocomplete="off">
            </div>
            
            <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <label style="color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.8;">Password</label>
                    <a href="#" style="color: var(--accent-color); font-size: 0.8rem; text-decoration: none; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='var(--accent-color)'">Forgot?</a>
                </div>
                <input type="password" id="password" placeholder="••••••••" style="width: 100%;">
            </div>

            <button id="loginBtn" class="glass-button" style="width: 100%; padding: 14px !important; font-size: 0.95rem !important; border-radius: 8px !important; margin-bottom: 1.5rem;">
                Authenticate
            </button>

            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
                    <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; width: 100%; text-align: center;">Demo Authentication</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    <button type="button" class="secondary-button demo-fill-btn" style="padding: 10px 12px; text-align: left; cursor: pointer; display: flex; flex-direction: column; align-items: flex-start; width: 100%; border: 1px solid var(--border-color); background: var(--bg-tertiary) !important;">
                        <div style="font-size: 0.72rem; color: var(--text-primary); font-weight: 700; margin-bottom: 2px;">Administrator Access</div>
                        <code style="font-size: 0.75rem; color: var(--accent-color); background: transparent; padding: 0;">admin / admin123</code>
                    </button>
                </div>
            </div>
        `;

        // Click-to-fill demo credentials
        const demoBtn = loginPanel.querySelector('.demo-fill-btn');
        demoBtn.onclick = () => {
            loginPanel.querySelector('#username').value = 'admin';
            loginPanel.querySelector('#password').value = 'admin123';
            // Trigger temporary border pulse on inputs
            const uInput = loginPanel.querySelector('#username');
            const pInput = loginPanel.querySelector('#password');
            uInput.style.borderColor = 'var(--accent-blue)';
            pInput.style.borderColor = 'var(--accent-blue)';
            setTimeout(() => {
                uInput.style.borderColor = '';
                pInput.style.borderColor = '';
            }, 600);
        };

        const btn = loginPanel.querySelector('#loginBtn');
        btn.onclick = async () => {
            const userField = loginPanel.querySelector('#username');
            const passField = loginPanel.querySelector('#password');
            const user = userField.value;
            const pass = passField.value;

            if (!user || !pass) {
                userField.style.borderColor = 'var(--danger)';
                passField.style.borderColor = 'var(--danger)';
                setTimeout(() => {
                    userField.style.borderColor = '';
                    passField.style.borderColor = '';
                }, 1500);
                return;
            }

            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg class="spinner" viewBox="0 0 50 50" style="width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle;"></svg>
                <span style="display: inline-block; vertical-align: middle; margin-left: 8px;">Authenticating...</span>
            `;
            btn.disabled = true;

            try {
                await this.loginCallback(user, pass);
            } catch (err) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        rightSide.appendChild(loginPanel);

        // Append layout splits
        container.appendChild(leftSide);
        container.appendChild(rightSide);

        // Inject Responsive Style Override specifically for login split layout
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            @media (max-width: 868px) {
                .login-3d-pane {
                    display: none !important;
                }
            }
        `;
        container.appendChild(styleTag);

        // Initialize 3D Engine for Left Panel
        this.init3D(canvas);

        return container;
    }

    init3D(canvas) {
        if (!window.THREE) return;

        const width = canvas.parentElement.clientWidth || window.innerWidth * 0.55;
        const height = window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.z = 120;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group
        const objectsGroup = new THREE.Group();
        this.scene.add(objectsGroup);

        // Add 3D Geometric Floating Objects
        // 1. Torus Knot (Metallic Purple)
        const torusGeo = new THREE.TorusKnotGeometry(12, 3.5, 100, 16);
        const torusMat = new THREE.MeshStandardMaterial({
            color: 0x7b61ff,
            roughness: 0.15,
            metalness: 0.85,
            wireframe: false
        });
        const torusKnot = new THREE.Mesh(torusGeo, torusMat);
        torusKnot.position.set(-15, 10, 0);
        objectsGroup.add(torusKnot);
        this.objects.push(torusKnot);

        // 2. Torus (Metallic Blue)
        const sphereGeo = new THREE.TorusGeometry(10, 3, 16, 100);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            roughness: 0.1,
            metalness: 0.9
        });
        const sphereObj = new THREE.Mesh(sphereGeo, sphereMat);
        sphereObj.position.set(20, -12, 10);
        sphereObj.rotation.x = Math.PI / 4;
        objectsGroup.add(sphereObj);
        this.objects.push(sphereObj);

        // 3. Octahedron (Glowing wireframe)
        const octaGeo = new THREE.OctahedronGeometry(9, 0);
        const octaMat = new THREE.MeshStandardMaterial({
            color: 0x00ffb2,
            roughness: 0.2,
            metalness: 0.5,
            wireframe: true
        });
        const octaObj = new THREE.Mesh(octaGeo, octaMat);
        octaObj.position.set(-18, -18, -10);
        objectsGroup.add(octaObj);
        this.objects.push(octaObj);

        // Ambient Light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Directed Colored PointLights for Futuristic Glow
        const light1 = new THREE.PointLight(0x7b61ff, 3, 150);
        light1.position.set(-30, 40, 20);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0x00d4ff, 3, 150);
        light2.position.set(30, -30, 30);
        this.scene.add(light2);

        // Background Particles
        const partGeo = new THREE.BufferGeometry();
        const partCount = 120;
        const partPositions = new Float32Array(partCount * 3);

        for (let i = 0; i < partCount * 3; i += 3) {
            partPositions[i] = (Math.random() - 0.5) * 300;     // X
            partPositions[i + 1] = (Math.random() - 0.5) * 300; // Y
            partPositions[i + 2] = (Math.random() - 0.5) * 100; // Z
        }
        partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        const partMat = new THREE.PointsMaterial({
            color: isDarkTheme ? 0xffffff : 0x7b61ff,
            size: 1.0,
            transparent: true,
            opacity: isDarkTheme ? 0.4 : 0.65
        });
        const particles = new THREE.Points(partGeo, partMat);
        this.scene.add(particles);

        // Mouse Parallax Track
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        const handleMouseMove = (e) => {
            targetX = (e.clientX - window.innerWidth / 4) * 0.04;
            targetY = (e.clientY - window.innerHeight / 2) * 0.04;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation Frame
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);

            // Rotate objects
            torusKnot.rotation.y += 0.006;
            torusKnot.rotation.x += 0.003;

            sphereObj.rotation.y -= 0.004;
            sphereObj.rotation.x += 0.002;

            octaObj.rotation.x += 0.008;
            octaObj.rotation.z += 0.004;

            // Float objects vertically
            const elapsed = Date.now() * 0.0015;
            torusKnot.position.y = 10 + Math.sin(elapsed) * 3;
            sphereObj.position.y = -12 + Math.cos(elapsed * 0.8) * 3;
            octaObj.position.y = -18 + Math.sin(elapsed * 1.2) * 2.5;

            // Ease parallax
            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;

            objectsGroup.rotation.y = currentX * 0.01;
            objectsGroup.rotation.x = currentY * 0.01;

            particles.rotation.y += 0.0005;

            this.renderer.render(this.scene, this.camera);
        };

        animate();

        // Canvas resizing
        const handleResize = () => {
            if (!this.camera || !this.renderer) return;
            const w = canvas.parentElement.clientWidth;
            const h = window.innerHeight;

            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup listener references
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
