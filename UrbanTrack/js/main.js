const passwordGroups = document.querySelectorAll(".password-group");

passwordGroups.forEach((group) => {
  const input = group.querySelector("input");
  const show = group.querySelector(".fa-eye");
  const hide = group.querySelector(".fa-eye-slash");

  show.addEventListener("click", () => {
    input.type = "text";
    hide.classList.remove("hide");
    show.classList.add("hide");
  });

  hide.addEventListener("click", () => {
    input.type = "password";
    hide.classList.add("hide");
    show.classList.remove("hide");
  });
});

function validateEmail(value) {
  return /\S+@\S+\.\S+/.test(value);
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

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const loginEmail = document.getElementById("text");
  const loginPassword = document.getElementById("password");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!loginEmail.value.trim()) {
      setError(loginEmail, "Email is required.");
      valid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
      setError(loginEmail, "Please enter a valid email address.");
      valid = false;
    } else {
      clearError(loginEmail);
    }

    if (!loginPassword.value.trim()) {
      setError(loginPassword, "Password is required.");
      valid = false;
    // } else if (loginPassword.value.length < 6) {
    //   setError(loginPassword, "Password must be at least 6 characters.");
    //   valid = false;
    } else {
      clearError(loginPassword);
    }

    if (valid) {
      console.log("Login form valid");
      // loginForm.submit(); // If you want native submit after validation
    }
  });
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const signupSurname = document.getElementById("surname");
  const signupEmail = document.getElementById("email");
  const signupPassword = document.getElementById("Signup-password");
  const signupConfirm = document.getElementById("Signup-confirm-password");

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!signupSurname.value.trim()) {
      setError(signupSurname, "Surname is required.");
      valid = false;
    } else {
      clearError(signupSurname);
    }

    if (!signupEmail.value.trim()) {
      setError(signupEmail, "Email is required.");
      valid = false;
    } else if (!validateEmail(signupEmail.value.trim())) {
      setError(signupEmail, "Please enter a valid email address.");
      valid = false;
    } else {
      clearError(signupEmail);
    }

    if (!signupPassword.value.trim()) {
      setError(signupPassword, "Password is required.");
      valid = false;
    } else if (signupPassword.value.length < 6) {
      setError(signupPassword, "Password must be at least 6 characters.");
      valid = false;
    } else {
      clearError(signupPassword);
    }

    if (!signupConfirm.value.trim()) {
      setError(signupConfirm, "Confirm the password.");
      valid = false;
    } else if (signupConfirm.value !== signupPassword.value) {
      setError(signupConfirm, "Passwords do not match.");
      valid = false;
    } else {
      clearError(signupConfirm);
    }

    if (valid) {
      console.log("Signup form valid");
      // signupForm.submit();
    }
  });
}

//code for home page
 (function () {
            // Mobile menu toggle
            const mobileBtn = document.getElementById('mobileMenuBtn');
            const navLinks = document.querySelector('.nav-links');
            if (mobileBtn && navLinks) {
                mobileBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const isOpen = navLinks.style.display === 'flex' && window.innerWidth <= 768;
                    if (isOpen) {
                        navLinks.style.display = 'none';
                    } else if (window.innerWidth <= 768) {
                        Object.assign(navLinks.style, {
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'absolute',
                            top: '70px',
                            left: '0',
                            right: '0',
                            backgroundColor: 'rgba(15, 23, 42, 0.96)',
                            backdropFilter: 'blur(20px)',
                            padding: '1.5rem',
                            gap: '1.2rem',
                            borderBottom: '1px solid rgba(56,189,248,0.3)',
                            zIndex: '999'
                        });
                    }
                });
                window.addEventListener('resize', function () {
                    if (window.innerWidth > 768) {
                        Object.assign(navLinks.style, {
                            display: 'flex',
                            flexDirection: 'row',
                            position: 'relative',
                            top: 'auto',
                            backgroundColor: 'transparent',
                            padding: '0',
                            gap: '2rem',
                            borderBottom: 'none'
                        });
                    } else if (navLinks.style.display !== 'flex') {
                        navLinks.style.display = 'none';
                    }
                });
            }

            // Report button with toast
            const locationField = document.getElementById('locationInput');
            const reportBtn = document.getElementById('reportCta');
            if (locationField && reportBtn) {
                reportBtn.addEventListener('click', function (e) {
                    const locationVal = locationField.value.trim();
                    if (locationVal !== '') {
                        showToast('📍 Preparing report for: ' + locationVal + ' — redirecting to dashboard.', 'linear-gradient(135deg, #0ea5e9, #4f46e5)');
                        sessionStorage.setItem('urbanTrack_lastLocation', locationVal);
                    } else {
                        e.preventDefault();
                        showToast('📍 Please enter a location first to continue.', '#f59e0b', '#0f172a');
                    }
                });
            }

            function showToast(msg, bg, color) {
                const toast = document.createElement('div');
                toast.textContent = msg;
                Object.assign(toast.style, {
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    background: bg || 'linear-gradient(135deg,#0ea5e9,#4f46e5)',
                    color: color || 'white',
                    padding: '10px 20px',
                    borderRadius: '40px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    zIndex: '9999',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.3)',
                    transition: 'opacity 0.4s'
                });
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 500);
                }, 2000);
            }

            // Smooth scroll
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const targetId = this.getAttribute('href');
                    if (targetId && targetId !== '#') {
                        const targetEl = document.querySelector(targetId);
                        if (targetEl) {
                            e.preventDefault();
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        })();