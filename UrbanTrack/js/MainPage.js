// Storage Keys
const STORAGE_USERS = "urbanTrack_users";
const STORAGE_CURRENT_USER = "urbanTrack_currentUser";
const STORAGE_ISSUES = "urbanTrack_issues";

// Track selected values
let selectedCategory = "";
let selectedSeverity = "";
let uploadedPhotos = [];
let currentStep = 1;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initializeUserStorage();
  setupCategoryButtons();
  setupSeverityButtons();
  setupCharCounters();
  setupLoadMapButton();
  setupMenuButton();
  loadUser();
  loadStats();
});

// ══════════════════════════════════════════════════
// STORAGE INITIALIZATION
// ══════════════════════════════════════════════════
function initializeUserStorage() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    const defaultUsers = [
      {
        id: "admin_001",
        name: "Administrator",
        email: "admin@urbantrack.com",
        password: "Admin@1234",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: "user_demo_001",
        name: "Demo User",
        email: "demo@example.com",
        password: "Demo@1234",
        role: "user",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_ISSUES)) {
    const sampleIssues = [
      {
        id: "issue_1",
        title: "Broken Streetlight on Main St",
        description: "The streetlight at the corner of Main and 5th has been out for over a week.",
        location: "Main Street & 5th Avenue",
        category: "Streetlight",
        severity: "high",
        status: "pending",
        upvotes: 24,
        reportedBy: "user_demo_001",
        reportedByName: "Demo User",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_ISSUES, JSON.stringify(sampleIssues));
  }
}

// ══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(userId) {
  const users = getUsers();
  return users.find((user) => user.id === userId);
}

function setCurrentUser(user) {
  const { password, ...userWithoutPassword } = user;
  localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(userWithoutPassword));
}

function getCurrentUser() {
  const userJson = localStorage.getItem(STORAGE_CURRENT_USER);
  return userJson ? JSON.parse(userJson) : null;
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function logout() {
  if (isGoogleUser()) {
    console.warn("Google-authenticated users remain logged in and logout is disabled.");
    return;
  }
  localStorage.removeItem(STORAGE_CURRENT_USER);
  window.location.href = "login.html";
}

// Logout handler for onclick
function doLogout() {
  logout();
}

// TOAST NOTIFICATION
function showToast(message, isError = false) {
  const existingToast = document.querySelector(".custom-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${isError ? "#ef4444" : "#10b981"};
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

  if (!document.querySelector("#toast-animation-style")) {
    const style = document.createElement("style");
    style.id = "toast-animation-style";
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
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function doLogout() {
  localStorage.removeItem(STORAGE_CURRENT_USER);
  location.href = "../../homePage.html";
}

// ══════════════════════════════════════════════════
// FORM SETUP
// ══════════════════════════════════════════════════
function setupCategoryButtons() {
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCategory = btn.dataset.cat;
    });
  });
}

function setupSeverityButtons() {
  document.querySelectorAll(".severity-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setSeverity(btn, btn.dataset.sev);
      goStep(2);
    });
  });
}

//  LOGIN HANDLER
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
      // } else if (loginPassword.value.length < 6) {
      //     setError(loginPassword, "Password must be at least 6 characters.");
      //     valid = false;
    } else {
      clearError(loginPassword);
    }

    if (valid) {
      const enteredEmail = loginEmail.value.trim().toLowerCase();
      const enteredPassword = loginPassword.value;

      // Admin login using hardcoded credentials
      if (enteredEmail === ADMIN_EMAIL && enteredPassword === ADMIN_PASSWORD) {
        const adminUser = {
          id: "admin_001",
          name: "Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(adminUser);
        showToast("Welcome Admin! Redirecting to Admin dashboard...");
        setTimeout(() => {
          window.location.href = "../Adminside/AdminDashboard.html";
        }, 1200);
        return;
      }

      // Authenticate regular user
      const user = findUserByEmail(enteredEmail);

      if (!user) {
        setError(
          loginEmail,
          "No account found with this email. Please sign up.",
        );
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
        //GOOGlE AUTH HANDLER
        async function loadGoogleUser() {
          const res = await fetch("/auth/user");
          const user = await res.json();

          if (user) {
            showToast(`Welcome, ${user.displayName}!`);
            document.querySelector(".welcome-user").textContent = user.displayName;
          }
        }
        window.onload = loadGoogleUser;
      }
    }
  });
}


//  REPORT PAGE / DASHBOARD PROTECTION
function initReportPage() {
  // Check if user is logged in
  if (!isLoggedIn()) {
    showToast("Please login to report an issue", true);
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  if (titleInput) {
    titleInput.addEventListener("input", () => {
      document.getElementById("titleCount").textContent = titleInput.value.length + " / 100";
    });
  }

  if (descInput) {
    descInput.addEventListener("input", () => {
      document.getElementById("descCount").textContent = descInput.value.length + " / 500";
    });
  }
}

function setupMenuButton() {
  const menuBtn = document.querySelector(".menu-button");
  const navLinks = document.querySelector(".nav-links");
  
  if (menuBtn && navLinks) {
    let menuOpen = false;
    menuBtn.addEventListener("click", () => {
      menuOpen = !menuOpen;
      menuBtn.classList.toggle("open", menuOpen);
      navLinks.classList.toggle("show", menuOpen);
    });
  }
}

// ══════════════════════════════════════════════════
// MAP FUNCTIONALITY
// ══════════════════════════════════════════════════
function setupLoadMapButton() {
  const loadMapBtn = document.getElementById("loadMapBtn");
  if (loadMapBtn) {
    loadMapBtn.addEventListener("click", initializeReportMap);
  }
}

window.setupReportMap = function() {
  if (typeof google === "undefined" || !google.maps) {
    console.warn("Google Maps API not loaded yet");
    return;
  }
  initializeReportMap();
};

function initializeReportMap() {
  const mapContainer = document.getElementById("mapContainer");
  const mapElement = document.getElementById("map");
  const mapPlaceholder = document.getElementById("mapPlaceholder");

  if (!mapElement) {
    console.error("Map element not found");
    return;
  }

  // Hide placeholder
  if (mapPlaceholder) {
    mapPlaceholder.style.display = "none";
  }

  const defaultCenter = { lat: -26.192307, lng: 28.056076 };

  try {
    // Create map with dark theme and no default zoom (we use custom controls)
    window._reportMap = new google.maps.Map(mapElement, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      gestureHandling: 'auto',
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e3a8a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0ea5e9" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });

    // show the map controls once the map is initialized
    const locateBtn = document.getElementById("locateBtn");
    const zoomControls = document.getElementById("zoomControls");
    if (locateBtn) locateBtn.style.display = "flex";
    if (zoomControls) zoomControls.style.display = "flex";

    // Create draggable marker
    window._reportMarker = new google.maps.Marker({
      position: defaultCenter,
      map: window._reportMap,
      title: "Issue location",
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#38bdf8",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    // Update coordinates on marker drag
    window._reportMarker.addListener("dragend", () => {
      const pos = window._reportMarker.getPosition();
      window.updateCoords(pos.lat(), pos.lng());
    });

    // Click map to place marker
    window._reportMap.addListener("click", (event) => {
      window._reportMarker.setPosition(event.latLng);
      window.updateCoords(event.latLng.lat(), event.latLng.lng());
    });

    // Custom zoom controls (replace default zoom UI to avoid overlap)
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const z = window._reportMap.getZoom() || 15;
        window._reportMap.setZoom(Math.min(z + 1, 21));
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const z = window._reportMap.getZoom() || 15;
        window._reportMap.setZoom(Math.max(z - 1, 1));
      });
    }

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          window._reportMap.setCenter(userLoc);
          window._reportMarker.setPosition(userLoc);
          // apply a polished blue circle icon for the user's current location
          try {
            window._reportMarker.setIcon({
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#38bdf8",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            });
          } catch (e) {
            // ignore if API not available
          }
          window.updateCoords(userLoc.lat, userLoc.lng);
        },
        () => {
          console.log("Using default location");
          window.updateCoords(defaultCenter.lat, defaultCenter.lng);
        }
      );
    }

    // wire locate button (top-right) to recentre map on user's current position
    const locateBtn = document.getElementById("locateBtn");
    if (locateBtn) {
      locateBtn.addEventListener("click", () => {
        if (!window._reportMap) {
          initializeReportMap();
          // give map a moment to initialize
          setTimeout(() => doLocate(true), 800);
        } else {
          showToast("Moving back to your current location...");
          doLocate();
        }
      });
    }

    // helper to find and display user location; if animate=true allow for map initialisation wait
    function doLocate(animateFirstLoad = false) {
      if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.", true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const lat = p.coords.latitude;
          const lng = p.coords.longitude;
          const userLatLng = { lat, lng };

          // create or move a dedicated user location marker (non-draggable)
          if (!window._userLocationMarker) {
            try {
              window._userLocationMarker = new google.maps.Marker({
                position: userLatLng,
                map: window._reportMap,
                clickable: false,
                title: "Your location",
                zIndex: 999,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#0ea5e9",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                },
              });
            } catch (e) {
              // fallback: create simple marker
              window._userLocationMarker = new google.maps.Marker({
                position: userLatLng,
                map: window._reportMap,
                clickable: false,
                title: "Your location",
              });
            }
          } else {
            window._userLocationMarker.setPosition(userLatLng);
          }

          // animate map to user
          window._reportMap.panTo(userLatLng);
          window._reportMap.setZoom(15);
          // move the report pin back to the user's current location
          if (window._reportMarker) {
            window._reportMarker.setPosition(userLatLng);
            window.updateCoords(lat, lng);
          }
          showToast("Returned to your current location.");
        },
        (err) => {
          console.warn("Locate failed:", err);
          showToast("Unable to get your location.", true);
        },
      );
    }

    window._googleMapsApiReady = true;
  } catch (error) {
    console.error("Error initializing map:", error);
    if (mapPlaceholder) {
      const errorEl = document.getElementById("mapError");
      if (errorEl) {
        errorEl.style.display = "block";
        errorEl.textContent = "Error loading map. Please refresh the page.";
      }
    }
  }
}

window.updateCoords = function(lat, lng) {
  window.pinnedLat = lat.toFixed(6);
  window.pinnedLng = lng.toFixed(6);
  const coordsText = document.getElementById("coordsText");
  if (coordsText) {
    coordsText.textContent = `${window.pinnedLat}, ${window.pinnedLng}`;
  }
  const pinnedCoords = document.getElementById("pinnedCoords");
  if (pinnedCoords) {
    pinnedCoords.style.display = "block";
  }
};

// ══════════════════════════════════════════════════
// REVIEW & SUBMISSION
// ══════════════════════════════════════════════════
function buildReview() {
  const sevColors = {
    low: "#3b82f6",
    medium: "#f59e0b",
    high: "#ef4444",
  };

  const rows = [
    ["Category", selectedCategory, ""],
    [
      "Severity",
      selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1),
      sevColors[selectedSeverity] || "",
    ],
    ["Title", document.getElementById("issueTitle")?.value || "", ""],
    ["Address", document.getElementById("issueAddress")?.value || "", ""],
    ["Area", document.getElementById("issueArea")?.value || "—", ""],
    [
      "Photos",
      uploadedPhotos.length > 0 ? uploadedPhotos.length + " attached" : "None",
      "",
    ],
  ];

  let html = '<div class="review-table">';
  rows.forEach(([k, v, c]) => {
    html += `<div class="review-row"><span class="review-key">${k}</span><span class="review-val" style="${c ? "color:" + c + ";" : ""}">${v || "—"}</span></div>`;
  });
  html += "</div>";

  const desc = document.getElementById("issueDesc")?.value;
  if (desc) {
    html += `<div style="padding:1rem;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:var(--radius);font-size:.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem;">${desc}</div>`;
  }

  const reviewContent = document.getElementById("reviewContent");
  if (reviewContent) {
    reviewContent.innerHTML = html;
  }
}

function submitReport() {
  const agreeCheck = document.getElementById("agreeCheck");
  if (!agreeCheck || !agreeCheck.checked) {
    showToast("Please confirm the declaration.", true);
    return;
  }

  const btn = document.getElementById("submitBtn");
  if (btn) {
    btn.textContent = "Submitting…";
    btn.disabled = true;
  }

  setTimeout(() => {
    document.querySelectorAll(".form-section").forEach((s) => {
      s.classList.remove("active");
    });
    const stepsIndicator = document.querySelector(".steps-indicator");
    if (stepsIndicator) stepsIndicator.style.display = "none";

    const issueRef = document.getElementById("issueRef");
    if (issueRef) {
      issueRef.textContent = "#UT-" + Math.floor(1000 + Math.random() * 9000);
    }

    const successState = document.getElementById("successState");
    if (successState) {
      successState.classList.add("active");
    }
  }, 1400);
}

// ══════════════════════════════════════════════════
// PHOTO HANDLING
// ══════════════════════════════════════════════════
function handlePhotos(input) {
  const files = Array.from(input.files).slice(0, 3 - uploadedPhotos.length);
  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(file.name + " exceeds 5MB.", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhotos.push(e.target.result);
      renderPhotos();
    };
    reader.readAsDataURL(file);
  });
  input.value = "";
}

function renderPhotos() {
  const container = document.getElementById("photoPreview");
  if (!container) return;

  container.innerHTML = "";
  uploadedPhotos.forEach((src, i) => {
    const thumb = document.createElement("div");
    thumb.className = "photo-thumb";
    thumb.innerHTML = `<img src="${src}" alt="photo"><button class="photo-remove" onclick="removePhoto(${i})">×</button>`;
    container.appendChild(thumb);
  });
}

function removePhoto(i) {
  uploadedPhotos.splice(i, 1);
  renderPhotos();
}

// ══════════════════════════════════════════════════
// USER & STATS LOADING
// ══════════════════════════════════════════════════
function loadUser() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
    return;
  }

  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay) {
    userNameDisplay.textContent = currentUser.name || currentUser.email;
  }

  const userAvatar = document.getElementById("userAvatar");
  if (userAvatar && currentUser.name) {
    const initials = currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    userAvatar.textContent = initials;
  }
}

function loadStats() {
  try {
    const issues = JSON.parse(localStorage.getItem(STORAGE_ISSUES) || "[]");
    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const myIssues = issues.filter((i) => i.reportedBy === currentUser.id);
    const resolved = myIssues.filter((i) => i.status === "resolved").length;
    const inProgress = myIssues.filter((i) => i.status === "in-progress").length;

    const myReportsEl = document.getElementById("myReportsCount");
    if (myReportsEl) myReportsEl.textContent = myIssues.length;
    
    const resolvedEl = document.getElementById("resolvedCount");
    if (resolvedEl) resolvedEl.textContent = resolved;
    
    const progressEl = document.getElementById("progressCount");
    if (progressEl) progressEl.textContent = inProgress;
    
    const urgentEl = document.getElementById("urgentCount");
    if (urgentEl) urgentEl.textContent = myIssues.filter(
      (i) => i.severity === "high" && i.status !== "resolved"
    ).length;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
window.goStep = function(step) {
  if (step > currentStep) {
    if (currentStep === 1 && !selectedCategory) {
      showToast("⚠️ Please select a category.", true);
      return;
    }
    if (currentStep === 1 && !selectedSeverity) {
      showToast("⚠️ Please select a severity level.", true);
      return;
    }
    if (currentStep === 2 && !document.getElementById("issueTitle")?.value.trim()) {
      showToast("Enter issue title", true);
      return;
    }
    if (currentStep === 2 && !document.getElementById("issueDesc")?.value.trim()) {
      showToast("Enter description", true);
      return;
    }
    if (currentStep === 3 && !document.getElementById("issueAddress")?.value.trim()) {
      showToast("Enter location", true);
      return;
    }
  }

  document.getElementById("step-" + currentStep)?.classList.remove("active");
  document.getElementById("dot-" + currentStep)?.classList.remove("active");
  if (step > currentStep) {
    document.getElementById("dot-" + currentStep)?.classList.add("done");
  }

  currentStep = step;
  document.getElementById("step-" + step)?.classList.add("active");
  document.getElementById("dot-" + step)?.classList.add("active");

  // Initialize map when entering step 3
  if (step === 3) {
    setTimeout(() => {
      if (window._reportMap) {
        google.maps.event.trigger(window._reportMap, "resize");
        if (window._reportMarker) {
          window._reportMap.setCenter(window._reportMarker.getPosition());
        }
      } else if (typeof google !== "undefined" && google.maps) {
        window.setupReportMap();
      }
    }, 100);
  }

  if (step === 4) buildReview();
};

  // Display issues count
  const issueCountElements = document.querySelectorAll(
    ".issue-count, .total-reports",
  );
  issueCountElements.forEach((el) => {
    el.textContent = userIssues.length;
  });

  // Display issues list
  const issuesContainer = document.getElementById("issuesList");
  if (issuesContainer) {
    if (userIssues.length === 0) {
      issuesContainer.innerHTML =
        '<div class="no-issues">No issues reported yet. <a href="report-issue.html">Create your first report!</a></div>';
    } else {
      issuesContainer.innerHTML = userIssues
        .map(
          (issue) => `
                <div class="issue-card" data-id="${issue.id}">
                    <div class="issue-header">
                        <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
                        <span class="status-badge status-${issue.status}">${issue.status}</span>
                    </div>
                    <p class="issue-description">${escapeHtml(issue.description.substring(0, 150))}${issue.description.length > 150 ? "..." : ""}</p>
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
            `,
        )
        .join("");
    }
  }

  // Setup logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }


function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Handle Google user data from OAuth redirect
function handleGoogleUserData() {
  const params = new URLSearchParams(window.location.search);
  const googleUserData = params.get("googleUser");
  
  if (googleUserData) {
    try {
      const userData = JSON.parse(decodeURIComponent(googleUserData));
      userData.isGoogleUser = true;
      // Store in localStorage as current user using the shared helper
      setCurrentUser(userData);
      
      // Display user name and avatar if on MainPage
      displayUserInfo(userData);
      toggleLogoutButton();
      
      // Clean URL by removing the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return userData;
    } catch (error) {
      console.error("Error parsing Google user data:", error);
    }
  }
  
  return null;
}

// Display user name and avatar
function displayUserInfo(user) {
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userAvatar = document.getElementById("userAvatar");
  
  if (userNameDisplay && user && user.name) {
    userNameDisplay.textContent = user.name;
  }
  
  if (userAvatar && user && user.name) {
    // Show first letter initial
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

//  CHECK PAGE TYPE AND INITIALIZE
document.addEventListener("DOMContentLoaded", function () {
  // Initialize storage
  initializeUserStorage();
  
  // Handle Google OAuth user data first
  const googleUser = handleGoogleUserData();
  
  // If no Google user, check localStorage for email user
  if (!googleUser) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      displayUserInfo(currentUser);
    }
  }

  toggleLogoutButton();

  // Setup password toggles on all pages
  setupPasswordToggles();

  // Determine which page we're on based on URL or elements
  const currentPage = window.location.pathname;

  if (
    currentPage.includes("signUpPage.html") ||
    document.getElementById("signupForm")
  ) {
    // Signup page
    initSignup();
    console.log(" Signup page initialized");
  } else if (
    currentPage.includes("login.html") ||
    document.getElementById("loginForm")
  ) {
    // Login page
    initLogin();
    console.log(" Login page initialized");
  } else if (
    currentPage.includes("report-issue.html") ||
    document.getElementById("submitBtn")
  ) {
    // Report issue page
    initReportPage();
    console.log(" Report page initialized");
  } else if (
    currentPage.includes("user-dashboard.html") ||
    document.getElementById("issuesList")
  ) {
    // Dashboard page
    initDashboard();
    console.log(" Dashboard page initialized");
  }

  console.log(" UrbanTrack Auth System Ready!");
  console.log(" Demo Credentials: demo@example.com / Demo@1234");
});

let currentStep = 1,
  selectedCategory = "",
  selectedSeverity = "",
  uploadedPhotos = [];

document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedCategory = btn.dataset.cat;
  });
});

document.querySelectorAll(".severity-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setSeverity(btn, btn.dataset.sev);
    goStep(2);
  });
});

function setSeverity(el, sev) {
  document
    .querySelectorAll(".severity-btn")
    .forEach((b) => b.classList.remove("sel-low", "sel-med", "sel-hig"));
  selectedSeverity = sev;
  el.classList.add({ low: "sel-low", medium: "sel-med", high: "sel-hig" }[sev]);
}

["issueTitle:titleCount:100", "issueDesc:descCount:500"].forEach((s) => {
  const [inp, cnt, max] = s.split(":");
  const el = document.getElementById(inp),
    co = document.getElementById(cnt);
  if (!el || !co) return;
  el.addEventListener("input", () => {
    const n = el.value.length;
    co.textContent = n + " / " + max;
    co.className =
      "char-count" + (n >= max ? " over" : n > max * 0.85 ? " warn" : "");
  });
});

function goStep(n) {
  if (n > currentStep) {
    if (currentStep === 1 && !selectedCategory) {
      showToast("Please select a category.");
      return;
    }
    if (currentStep === 1 && !selectedSeverity) {
      showToast("Please select a severity level.");
      return;
    }
    if (
      currentStep === 2 &&
      !document.getElementById("issueTitle").value.trim()
    ) {
      showToast("Please add a title.");
      return;
    }
    if (
      currentStep === 2 &&
      !document.getElementById("issueDesc").value.trim()
    ) {
      showToast("Please add a description.");
      return;
    }
    if (
      currentStep === 3 &&
      !document.getElementById("issueAddress").value.trim()
    ) {
      showToast("Please enter the issue location.");
      return;
    }
  }
  document.getElementById("step-" + currentStep).classList.remove("active");
  document.getElementById("dot-" + currentStep).classList.remove("active");
  document.getElementById("dot-" + currentStep).classList.add("done");
  currentStep = n;
  for (let i = 1; i < n; i++) {
    document.getElementById("dot-" + i).classList.add("done");
    document.getElementById("dot-" + i).classList.remove("active");
  }
  for (let i = n + 1; i <= 4; i++) {
    document.getElementById("dot-" + i).classList.remove("done", "active");
  }
  document.getElementById("dot-" + n).classList.add("active");
  document.getElementById("dot-" + n).classList.remove("done");
  document.getElementById("step-" + n).classList.add("active");
  if (n === 4) buildReview();
}

function buildReview() {
  const sevColors = {
    low: "var(--success)",
    medium: "var(--warning)",
    high: "var(--destructive)",
  };
  const rows = [
    ["Category", selectedCategory, ""],
    [
      "Severity",
      selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1),
      sevColors[selectedSeverity],
    ],
    ["Title", document.getElementById("issueTitle").value, ""],
    ["Address", document.getElementById("issueAddress").value, ""],
    ["Area", document.getElementById("issueArea").value || "—", ""],
    [
      "Photos",
      uploadedPhotos.length > 0 ? uploadedPhotos.length + " attached" : "None",
      "",
    ],
  ];
  let html = '<div class="review-table">';
  rows.forEach(([k, v, c]) => {
    html += `<div class="review-row"><span class="review-key">${k}</span><span class="review-val" style="${c ? "color:" + c + ";" : ""}">${v || "—"}</span></div>`;
  });
  html += "</div>";
  const desc = document.getElementById("issueDesc").value;
  if (desc)
    html += `<div style="padding:1rem;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:var(--radius);font-size:.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem;">${desc}</div>`;
  document.getElementById("reviewContent").innerHTML = html;
}

function handlePhotos(input) {
  const files = Array.from(input.files).slice(0, 3 - uploadedPhotos.length);
  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(" " + file.name + " exceeds 5MB.");
      return;
    }
    const r = new FileReader();
    r.onload = (e) => {
      uploadedPhotos.push(e.target.result);
      renderPhotos();
    };
    r.readAsDataURL(file);
  });
}
function renderPhotos() {
  const p = document.getElementById("photoPreview");
  p.innerHTML = "";
  uploadedPhotos.forEach((src, i) => {
    const t = document.createElement("div");
    t.className = "photo-thumb";
    t.innerHTML = `<img src="${src}" alt="photo"><button class="photo-remove" onclick="removePhoto(${i})">×</button>`;
    p.appendChild(t);
  });
}
function removePhoto(i) {
  uploadedPhotos.splice(i, 1);
  renderPhotos();
}

function submitReport() {
  if (!document.getElementById("agreeCheck").checked) {
    showToast("Please confirm the declaration.", true);
    return;
  }
  const btn = document.getElementById("submitBtn");
  btn.textContent = "Submitting…";
  btn.disabled = true;
  setTimeout(() => {
    document
      .querySelectorAll(".form-section")
      .forEach((s) => s.classList.remove("active"));
    document.querySelector(".steps-indicator").style.display = "none";
    document.getElementById("issueRef").textContent =
      "#UT-" + Math.floor(1000 + Math.random() * 9000);
    document.getElementById("successState").classList.add("active");
  }, 1400);
}

// Menu button toggle functionality
const menuBtn = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
let menuOpen = false;
menuBtn.addEventListener("click", () => {
  if (!menuOpen) {
    menuBtn.classList.add("open");
    navLinks.classList.add("show");
    menuOpen = true;
  } else {
    menuBtn.classList.remove("open");
    navLinks.classList.remove("show");
    menuOpen = false;
  }
})


