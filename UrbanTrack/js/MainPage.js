
// UrbanTrack - Complete User Authentication System
// Handles Signup, Login, Local Storage & Dashboard Redirect


// Storage Keys
const STORAGE_USERS = 'urbanTrack_users';
const STORAGE_CURRENT_USER = 'urbanTrack_currentUser';
const STORAGE_ISSUES = 'urbanTrack_issues';

// Admin hardcoded credentials
const ADMIN_EMAIL = 'admin@urbantrack.com';
const ADMIN_PASSWORD = 'Admin@1234';

function initializeUserStorage() {
    // Initialize users if empty
    if (!localStorage.getItem(STORAGE_USERS)) {
        const defaultUsers = [
            {
                id: 'admin_001',
                name: 'Administrator',
                email: 'admin@urbantrack.com',
                password: 'Admin@1234',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_demo_001',
                name: 'Demo User',
                email: 'demo@example.com',
                password: 'Demo@1234',
                role: 'user',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
        console.log('✅ Users database initialized with Admin + Demo User');
    }

    // Initialize sample issues for dashboard
    if (!localStorage.getItem(STORAGE_ISSUES)) {
        const sampleIssues = [
            {
                id: 'issue_1',
                title: 'Broken Streetlight on Main St',
                description: 'The streetlight at the corner of Main and 5th has been out for over a week.',
                location: 'Main Street & 5th Avenue',
                category: 'Lighting',
                severity: 'high',
                status: 'pending',
                upvotes: 24,
                reportedBy: 'user_demo_001',
                reportedByName: 'Demo User',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'issue_2',
                title: 'Large Pothole on Oak Drive',
                description: 'Dangerous pothole near the school entrance causing traffic issues.',
                location: 'Oak Drive, near Jefferson Elementary',
                category: 'Roads',
                severity: 'high',
                status: 'in-progress',
                upvotes: 56,
                reportedBy: 'user_demo_001',
                reportedByName: 'Demo User',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        localStorage.setItem(STORAGE_ISSUES, JSON.stringify(sampleIssues));
        console.log('✅ Sample issues initialized');
    }
}

// ========== HELPER FUNCTIONS ==========
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function findUserByEmail(email) {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(userId) {
    const users = getUsers();
    return users.find(user => user.id === userId);
}

function setCurrentUser(user) {
    // Store user without password for security
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(userWithoutPassword));
}

function getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

// ========== ADD THIS NEW FUNCTION ==========
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function logout() {
    localStorage.removeItem(STORAGE_CURRENT_USER);
    window.location.href = 'login.html';
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, isError = false) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${isError ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 24px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        animation: slideInToast 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: 'Inter', sans-serif;
    `;
    
    // Add animation if not exists
    if (!document.querySelector('#toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = `
            @keyframes slideInToast {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== VALIDATION FUNCTIONS ==========
function validateEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
}

function validateStrongPassword(password) {
    const special = /[!@#$%^&*<>?\/,.=+{}]/;
    const uppercase = /[A-Z]/;
    const number = /[0-9]/;
    return password.length > 8 && special.test(password) && uppercase.test(password) && number.test(password);
}

function setError(input, message) {
    const formGroup = input.closest(".form-group");
    const error = formGroup ? formGroup.querySelector(".error") : null;
    if (error) {
        error.textContent = message;
    }
    input.classList.add("input-error");
}

function clearError(input) {
    const formGroup = input.closest(".form-group");
    const error = formGroup ? formGroup.querySelector(".error") : null;
    if (error) {
        error.textContent = "";
    }
    input.classList.remove("input-error");
}

// ========== PASSWORD TOGGLE FUNCTIONALITY ==========
function setupPasswordToggles() {
    const passwordGroups = document.querySelectorAll(".password-group");
    
    passwordGroups.forEach((group) => {
        const input = group.querySelector("input");
        const show = group.querySelector(".fa-eye");
        const hide = group.querySelector(".fa-eye-slash");
        
        if (show && hide && input) {
            // Remove existing listeners to avoid duplicates
            const newShow = show.cloneNode(true);
            const newHide = hide.cloneNode(true);
            show.parentNode.replaceChild(newShow, show);
            hide.parentNode.replaceChild(newHide, hide);
            
            newShow.addEventListener("click", () => {
                input.type = "text";
                newHide.classList.remove("hide");
                newShow.classList.add("hide");
            });
            
            newHide.addEventListener("click", () => {
                input.type = "password";
                newHide.classList.add("hide");
                newShow.classList.remove("hide");
            });
        }
    });
}

// ========== SIGNUP HANDLER ==========
function initSignup() {
    const signupForm = document.getElementById("signupForm");
    if (!signupForm) return;
    
    const signupSurname = document.getElementById("surname");
    const signupEmail = document.getElementById("email");
    const signupPassword = document.getElementById("Signup-password");
    const signupConfirm = document.getElementById("Signup-confirm-password");
    
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let valid = true;
        
        // Name validation
        if (!signupSurname.value.trim()) {
            setError(signupSurname, "Surname is required.");
            valid = false;
        } else if (signupSurname.value.trim().length < 2) {
            setError(signupSurname, "Surname must be at least 2 characters.");
            valid = false;
        } else {
            clearError(signupSurname);
        }
        
        // Email validation
        if (!signupEmail.value.trim()) {
            setError(signupEmail, "Email is required.");
            valid = false;
        } else if (!validateEmail(signupEmail.value.trim())) {
            setError(signupEmail, "Please enter a valid email address.");
            valid = false;
        } else if (signupEmail.value.trim().toLowerCase() === ADMIN_EMAIL) {
            setError(signupEmail, "This email is reserved for admin login.");
            valid = false;
        } else {
            // Check if email already exists
            const existingUser = findUserByEmail(signupEmail.value.trim());
            if (existingUser) {
                setError(signupEmail, "Email already registered. Please login.");
                valid = false;
            } else {
                clearError(signupEmail);
            }
        }
        
        // Strong password validation
        if (!signupPassword.value.trim()) {
            setError(signupPassword, "Password is required.");
            valid = false;
        } else if (!validateStrongPassword(signupPassword.value)) {
            setError(signupPassword, "Password must:\n- Be longer than 8 characters\n- Include a special character\n- Include an uppercase letter\n- Include a number");
            valid = false;
        } else {
            clearError(signupPassword);
        }
        
        // Confirm password validation
        if (!signupConfirm.value.trim()) {
            setError(signupConfirm, "Please confirm your password.");
            valid = false;
        } else if (signupConfirm.value !== signupPassword.value) {
            setError(signupConfirm, "Passwords do not match.");
            valid = false;
        } else {
            clearError(signupConfirm);
        }
        
        if (valid) {
            // Create new user
            const newUser = {
                id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
                name: signupSurname.value.trim(),
                email: signupEmail.value.trim().toLowerCase(),
                password: signupPassword.value,
                createdAt: new Date().toISOString()
            };
            
            const users = getUsers();
            users.push(newUser);
            saveUsers(users);
            
            // Notify and redirect
            window.alert('You have successfully registered!');
            showToast('🎉 Registration successful! Redirecting to login...');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 700);
        }
    });
}

// ========== LOGIN HANDLER ==========
function initLogin() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;
    
    const loginEmail = document.getElementById("text");
    const loginPassword = document.getElementById("password");
    
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let valid = true;
        
        // Email validation
        if (!loginEmail.value.trim()) {
            setError(loginEmail, "Email is required.");
            valid = false;
        } else if (!validateEmail(loginEmail.value.trim())) {
            setError(loginEmail, "Please enter a valid email address.");
            valid = false;
        } else {
            clearError(loginEmail);
        }
        
        // Password validation
        if (!loginPassword.value.trim()) {
            setError(loginPassword, "Password is required.");
            valid = false;
        } else if (loginPassword.value.length < 6) {
            setError(loginPassword, "Password must be at least 6 characters.");
            valid = false;
        } else {
            clearError(loginPassword);
        }
        
        if (valid) {
            const enteredEmail = loginEmail.value.trim().toLowerCase();
            const enteredPassword = loginPassword.value;

            // Admin login using hardcoded credentials
            if (enteredEmail === ADMIN_EMAIL && enteredPassword === ADMIN_PASSWORD) {
                const adminUser = {
                    id: 'admin_001',
                    name: 'Administrator',
                    email: ADMIN_EMAIL,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                };

                setCurrentUser(adminUser);
                showToast('Welcome Admin! Redirecting to Admin dashboard...');
                setTimeout(() => {
                    window.location.href = "../Adminside/AdminDashboard.html";
                }, 1200);
                return;
            }

            // Authenticate regular user
            const user = findUserByEmail(enteredEmail);
            
            if (!user) {
                setError(loginEmail, "No account found with this email. Please sign up.");
                showToast("Account not found. Please sign up first.", true);
            } else if (user.password !== enteredPassword) {
                setError(loginPassword, "Incorrect password. Please try again.");
            } else {
                // Login success
                setCurrentUser(user);
                showToast(`Welcome back, ${user.name}! Redirecting to Main Page...`);
                
                setTimeout(() => {
                    window.location.href = "MainPage.html";
                }, 1500);
            }
        }
    });
}

// ========== REPORT PAGE / DASHBOARD PROTECTION ==========
function initReportPage() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showToast("Please login to report an issue", true);
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }
    
    const currentUser = getCurrentUser();
    
    // Display user name on page if element exists
    const userNameElements = document.querySelectorAll('.user-name, .welcome-user');
    userNameElements.forEach(el => {
        el.textContent = currentUser.name;
    });
    
    // Setup logout button if exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Initialize report form if on report page
    initReportForm(currentUser);
}

// ========== REPORT FORM HANDLER (for the report-issue.html page) ==========
function initReportForm(currentUser) {
    // Check if we're on the report page (look for report-specific elements)
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;
    
    // Override the existing submitReport function to store in localStorage
    window.submitReport = function() {
        const agreeCheck = document.getElementById('agreeCheck');
        if (!agreeCheck || !agreeCheck.checked) {
            showToast('⚠️ Please confirm the declaration.', true);
            return;
        }
        
        // Collect form data
        const category = selectedCategory || '';
        const severity = selectedSeverity || '';
        const title = document.getElementById('issueTitle')?.value || '';
        const description = document.getElementById('issueDesc')?.value || '';
        const address = document.getElementById('issueAddress')?.value || '';
        const area = document.getElementById('issueArea')?.value || '';
        const notes = document.getElementById('issueNotes')?.value || '';
        
        if (!title || !description || !address) {
            showToast('⚠️ Please fill in all required fields.', true);
            return;
        }
        
        // Create new issue object
        const newIssue = {
            id: 'issue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: title,
            description: description,
            location: address + (area ? ', ' + area : ''),
            category: category || 'Other',
            severity: severity || 'medium',
            status: 'pending',
            upvotes: 0,
            notes: notes,
            reportedBy: currentUser.id,
            reportedByName: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        const issues = JSON.parse(localStorage.getItem(STORAGE_ISSUES) || '[]');
        issues.unshift(newIssue);
        localStorage.setItem(STORAGE_ISSUES, JSON.stringify(issues));
        
        // Show success and redirect
        const btn = document.getElementById('submitBtn');
        if (btn) {
            btn.textContent = '⏳ Submitting…';
            btn.disabled = true;
        }
        
        setTimeout(() => {
            showToast('✅ Issue reported successfully!');
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1500);
        }, 1000);
    };
    
    // Also ensure goStep function works with validation
    if (typeof window.goStep === 'function') {
        const originalGoStep = window.goStep;
        window.goStep = function(n) {
            if (n > currentStep) {
                if (currentStep === 1 && !selectedCategory) {
                    showToast('⚠️ Please select a category.', true);
                    return;
                }
                if (currentStep === 1 && !selectedSeverity) {
                    showToast('⚠️ Please select a severity level.', true);
                    return;
                }
                if (currentStep === 2 && !document.getElementById('issueTitle')?.value.trim()) {
                    showToast('⚠️ Please add a title.', true);
                    return;
                }
                if (currentStep === 2 && !document.getElementById('issueDesc')?.value.trim()) {
                    showToast('⚠️ Please add a description.', true);
                    return;
                }
                if (currentStep === 3 && !document.getElementById('issueAddress')?.value.trim()) {
                    showToast('⚠️ Please enter the issue location.', true);
                    return;
                }
            }
            originalGoStep(n);
        };
    }
}

// ========== DASHBOARD PAGE - DISPLAY USER ISSUES ==========
function initDashboard() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    const currentUser = getCurrentUser();
    const issues = JSON.parse(localStorage.getItem(STORAGE_ISSUES) || '[]');
    const userIssues = issues.filter(issue => issue.reportedBy === currentUser.id);
    
    // Display user info
    const userNameElements = document.querySelectorAll('.user-name, .welcome-user, .dashboard-user-name');
    userNameElements.forEach(el => {
        el.textContent = currentUser.name;
    });
    
    // Display issues count
    const issueCountElements = document.querySelectorAll('.issue-count, .total-reports');
    issueCountElements.forEach(el => {
        el.textContent = userIssues.length;
    });
    
    // Display issues list
    const issuesContainer = document.getElementById('issuesList');
    if (issuesContainer) {
        if (userIssues.length === 0) {
            issuesContainer.innerHTML = '<div class="no-issues">No issues reported yet. <a href="report-issue.html">Create your first report!</a></div>';
        } else {
            issuesContainer.innerHTML = userIssues.map(issue => `
                <div class="issue-card" data-id="${issue.id}">
                    <div class="issue-header">
                        <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
                        <span class="status-badge status-${issue.status}">${issue.status}</span>
                    </div>
                    <p class="issue-description">${escapeHtml(issue.description.substring(0, 150))}${issue.description.length > 150 ? '...' : ''}</p>
                    <div class="issue-location">
                        <i class="fas fa-map-marker-alt"></i> ${escapeHtml(issue.location)}
                    </div>
                    <div class="issue-footer">
                        <span class="issue-category">${escapeHtml(issue.category)}</span>
                        <div class="issue-stats">
                            <span class="upvote-count"><i class="fas fa-thumbs-up"></i> ${issue.upvotes}</span>
                            <span class="issue-date"><i class="far fa-calendar-alt"></i> ${formatDate(issue.createdAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== CHECK PAGE TYPE AND INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize storage
    initializeUserStorage();
    
    // Setup password toggles on all pages
    setupPasswordToggles();
    
    // Determine which page we're on based on URL or elements
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('signUpPage.html') || document.getElementById('signupForm')) {
        // Signup page
        initSignup();
        console.log("🔐 Signup page initialized");
    }
    else if (currentPage.includes('login.html') || document.getElementById('loginForm')) {
        // Login page
        initLogin();
        console.log("🔐 Login page initialized");
    }
    else if (currentPage.includes('report-issue.html') || document.getElementById('submitBtn')) {
        // Report issue page
        initReportPage();
        console.log("📝 Report page initialized");
    }
    else if (currentPage.includes('user-dashboard.html') || document.getElementById('issuesList')) {
        // Dashboard page
        initDashboard();
        console.log("📊 Dashboard page initialized");
    }
    
    console.log("✅ UrbanTrack Auth System Ready!");
    console.log("📝 Demo Credentials: demo@example.com / Demo@1234");
});


   let currentStep = 1, selectedCategory = '', selectedSeverity = '', uploadedPhotos = [];

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = btn.dataset.cat;
        });
    });

    function setSeverity(el, sev) {
        document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('sel-low','sel-med','sel-hig'));
        selectedSeverity = sev;
        el.classList.add({ low:'sel-low', medium:'sel-med', high:'sel-hig' }[sev]);
    }

    ['issueTitle:titleCount:100','issueDesc:descCount:500'].forEach(s => {
        const [inp, cnt, max] = s.split(':');
        const el = document.getElementById(inp), co = document.getElementById(cnt);
        if (!el || !co) return;
        el.addEventListener('input', () => {
            const n = el.value.length;
            co.textContent = n + ' / ' + max;
            co.className = 'char-count' + (n >= max ? ' over' : n > max * .85 ? ' warn' : '');
        });
    });

    function goStep(n) {
        if (n > currentStep) {
            if (currentStep === 1 && !selectedCategory)  { showToast('⚠️ Please select a category.'); return; }
            if (currentStep === 1 && !selectedSeverity)  { showToast('⚠️ Please select a severity level.'); return; }
            if (currentStep === 2 && !document.getElementById('issueTitle').value.trim()) { showToast('⚠️ Please add a title.'); return; }
            if (currentStep === 2 && !document.getElementById('issueDesc').value.trim())  { showToast('⚠️ Please add a description.'); return; }
            if (currentStep === 3 && !document.getElementById('issueAddress').value.trim()) { showToast('⚠️ Please enter the issue location.'); return; }
        }
        document.getElementById('step-'+currentStep).classList.remove('active');
        document.getElementById('dot-'+currentStep).classList.remove('active');
        document.getElementById('dot-'+currentStep).classList.add('done');
        currentStep = n;
        for (let i=1; i<n; i++) { document.getElementById('dot-'+i).classList.add('done'); document.getElementById('dot-'+i).classList.remove('active'); }
        for (let i=n+1; i<=4; i++) { document.getElementById('dot-'+i).classList.remove('done','active'); }
        document.getElementById('dot-'+n).classList.add('active');
        document.getElementById('dot-'+n).classList.remove('done');
        document.getElementById('step-'+n).classList.add('active');
        if (n === 4) buildReview();
    }

    function buildReview() {
        const sevColors = { low:'var(--success)', medium:'var(--warning)', high:'var(--destructive)' };
        const rows = [
            ['Category', selectedCategory, ''],
            ['Severity', selectedSeverity.charAt(0).toUpperCase()+selectedSeverity.slice(1), sevColors[selectedSeverity]],
            ['Title',    document.getElementById('issueTitle').value, ''],
            ['Address',  document.getElementById('issueAddress').value, ''],
            ['Area',     document.getElementById('issueArea').value || '—', ''],
            ['Photos',   uploadedPhotos.length > 0 ? uploadedPhotos.length+' attached' : 'None', ''],
        ];
        let html = '<div class="review-table">';
        rows.forEach(([k,v,c]) => {
            html += `<div class="review-row"><span class="review-key">${k}</span><span class="review-val" style="${c?'color:'+c+';':''}">${v||'—'}</span></div>`;
        });
        html += '</div>';
        const desc = document.getElementById('issueDesc').value;
        if (desc) html += `<div style="padding:1rem;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:var(--radius);font-size:.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem;">${desc}</div>`;
        document.getElementById('reviewContent').innerHTML = html;
    }

    function handlePhotos(input) {
        const files = Array.from(input.files).slice(0, 3 - uploadedPhotos.length);
        files.forEach(file => {
            if (file.size > 5*1024*1024) { showToast('⚠️ '+file.name+' exceeds 5MB.'); return; }
            const r = new FileReader();
            r.onload = e => { uploadedPhotos.push(e.target.result); renderPhotos(); };
            r.readAsDataURL(file);
        });
    }
    function renderPhotos() {
        const p = document.getElementById('photoPreview'); p.innerHTML = '';
        uploadedPhotos.forEach((src,i) => {
            const t = document.createElement('div'); t.className = 'photo-thumb';
            t.innerHTML = `<img src="${src}" alt="photo"><button class="photo-remove" onclick="removePhoto(${i})">×</button>`;
            p.appendChild(t);
        });
    }
    function removePhoto(i) { uploadedPhotos.splice(i,1); renderPhotos(); }

    function submitReport() {
        if (!document.getElementById('agreeCheck').checked) { showToast('⚠️ Please confirm the declaration.', true); return; }
        const btn = document.getElementById('submitBtn');
        btn.textContent = '⏳ Submitting…'; btn.disabled = true;
        setTimeout(() => {
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            document.querySelector('.steps-indicator').style.display = 'none';
            document.getElementById('issueRef').textContent = '#UT-'+Math.floor(1000+Math.random()*9000);
            document.getElementById('successState').classList.add('active');
        }, 1400);
    }