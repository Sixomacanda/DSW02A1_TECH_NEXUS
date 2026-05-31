import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase config — UNTOUCHED ──
const firebaseConfig = {
  apiKey: "AIzaSyD4Wy3nmsbaUWGF-rh6ubXvCmAAKhho49U",
  authDomain: "urban-track-91e53.firebaseapp.com",
  projectId: "urban-track-91e53",
  storageBucket: "urban-track-91e53.firebasestorage.app",
  messagingSenderId: "519209303536",
  appId: "1:519209303536:web:c212eb58eb836e27047135"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
<<<<<<< HEAD:UrbanTrack/Adminside/Admindashboard.js
const EMAIL_API_BASE = "http://localhost:3000/api/email";
=======
>>>>>>> d71744ac2cc31a3e4eb8fd582d854fe3c6af24fc:google-auth-server/UrbanTrack/Adminside/Admindashboard.js

// ── Global data store (so filters work without re-fetching) ──
let allReports = [];
let allUsers   = [];

// ── NAVIGATION ──
window.showView = function(viewId, btn) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const target = document.getElementById("view-" + viewId);
  if (target) target.classList.add("active");
  if (btn) btn.classList.add("active");

  const titles = {
    overview: "Dashboard Overview",
    issues:   "All Issues",
    users:    "All Users",
    settings: "Platform Settings"
  };
  document.getElementById("topbarTitle").textContent = titles[viewId] || "Dashboard";

  
  if (viewId === "users") {
    renderUsers(allUsers);
  }

  if (viewId === "issues") {
    renderIssues(allReports);
  }
};
// ── TOAST ──
window.showToast = function(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
};

// ── STATUS BADGE HTML ──
function getBadge(status) {
  const map = {
    pending:      "badge-pending",
    "in-progress":"badge-progress",
    resolved:     "badge-resolved",
    urgent:       "badge-urgent"
  };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ") : "Pending";
  return `<span class="badge ${map[status] || "badge-pending"}">${label}</span>`;
}

function getSeverityBadge(sev) {
  if (sev === "high")   return `<span class="badge badge-urgent">High</span>`;
  if (sev === "medium") return `<span class="badge badge-pending">Medium</span>`;
  return `<span class="badge badge-active">Low</span>`;
}

// ── RENDER ISSUES TABLE ──
function renderIssues(reports) {
  const tbody = document.getElementById("issuesTbody");
  if (!reports.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No issues found.</td></tr>`;
    return;
  }
  tbody.innerHTML = reports.map(r => `
    <tr>
      <td>
        <div class="cell-title">${r.title || "Untitled"}</div>
        <div class="cell-sub">${r.category || ""}</div>
      </td>
      <td>
        <div class="cell-title">${r.reporterName || "Anonymous"}</div>
        <div class="cell-sub">${r.reporterEmail || ""}</div>
      </td>
      <td>${r.area || r.address || "—"}</td>
      <td>${getSeverityBadge(r.severity)}</td>
      <td>${getBadge(r.status)}</td>
      <td style="display:flex;gap:.4rem;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="updateStatus('${r.id}','in-progress')">Process</button>
        <button class="btn btn-success" onclick="updateStatus('${r.id}','resolved')">Resolve</button>
      </td>
    </tr>
  `).join("");
}

// ── RENDER USERS TABLE ──
function renderUsers(users) {
  const tbody = document.getElementById("usersTbody");
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No registered users found.</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div class="cell-title">${u.name || u.surname || "User"}</div>
        <div class="cell-sub">UID: ${u.id ? u.id.slice(0,10) + "..." : "—"}</div>
      </td>
      <td style="color:var(--accent);font-weight:500;">${u.email || "—"}</td>
      <td>${u.area || "—"}</td>
      <td style="font-weight:700;color:var(--accent);">${u.reportsCount || 0}</td>
      <td><span class="badge badge-active">${u.status || "Active"}</span></td>
    </tr>
  `).join("");
}

// ── FILTER ISSUES ──
window.filterIssues = function(status, btn) {
  // Update active filter button style
  document.querySelectorAll("#view-issues .btn-ghost, #view-issues .btn-primary")
    .forEach(b => { b.style.borderColor = ""; b.style.color = ""; });
  if (btn) { btn.style.borderColor = "var(--accent)"; btn.style.color = "var(--accent)"; }

  const filtered = status === "all"
    ? allReports
    : allReports.filter(r => r.status === status);
  renderIssues(filtered);
};

// ── SEARCH ──
window.handleSearch = function(q) {
  if (!q.trim()) { renderIssues(allReports); return; }
  const lower = q.toLowerCase();
  const filtered = allReports.filter(r =>
    (r.title || "").toLowerCase().includes(lower) ||
    (r.reporterName || "").toLowerCase().includes(lower) ||
    (r.reporterEmail || "").toLowerCase().includes(lower) ||
    (r.area || "").toLowerCase().includes(lower)
  );
  renderIssues(filtered);
};

// ── UPDATE STATUS — UNTOUCHED from original ──
window.updateStatus = async function(id, newStatus) {
  try {
    const report = allReports.find(r => r.id === id);
    await updateDoc(doc(db, "reports", id), { status: newStatus });
    if (
      report &&
      report.status !== newStatus &&
      report.notifyByEmail !== false &&
      report.reporterEmail &&
      report.reporterEmail !== "N/A" &&
      ["in-progress", "resolved"].includes(newStatus)
    ) {
      fetch("http://localhost:3000/api/email/report-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: report.reporterEmail,
          name: report.reporterName,
          ref: report.ref || id,
          title: report.title,
          status: newStatus,
        }),
      }).catch((emailError) => {
        console.warn("Status notification email skipped:", emailError);
      });
    }
<<<<<<< HEAD:UrbanTrack/Adminside/Admindashboard.js

=======
>>>>>>> d71744ac2cc31a3e4eb8fd582d854fe3c6af24fc:google-auth-server/UrbanTrack/Adminside/Admindashboard.js
    showToast(`Status updated to ${newStatus}`, "success");
    loadDashboardData();
  } catch (e) {
    console.error(e);
    showToast("Error updating status", "danger");
  }
};

// ── SAVE SETTINGS TO FIRESTORE ──
window.saveSetting = async function(key, value) {
  try {
    await setDoc(doc(db, "settings", "platform"), { [key]: value }, { merge: true });
    showToast("Setting saved", "success");
  } catch (e) {
    console.error("Setting save failed:", e);
    showToast("Failed to save setting", "danger");
  }
};

// ── LOAD SETTINGS FROM FIRESTORE ──
async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "platform"));
    if (snap.exists()) {
      const d = snap.data();
      if (d.requireApproval !== undefined) document.getElementById("settingRequireApproval").checked = d.requireApproval;
      if (d.autoClose       !== undefined) document.getElementById("settingAutoClose").checked       = d.autoClose;
      if (d.allowPhotos     !== undefined) document.getElementById("settingPhotos").checked          = d.allowPhotos;
      if (d.notifyNewReport !== undefined) document.getElementById("settingNewReport").checked       = d.notifyNewReport;
      if (d.notifyUrgent    !== undefined) document.getElementById("settingUrgentAlert").checked     = d.notifyUrgent;
    }
  } catch (e) {
    console.warn("Could not load settings:", e);
  }
}

// ── LOAD DASHBOARD DATA — UNTOUCHED logic, added allReports/allUsers store ──
async function loadDashboardData() {
  // Reports
  try {
    const reportsSnapshot = await getDocs(query(collection(db, "reports"), orderBy("timestamp", "desc")));
    allReports = reportsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    document.getElementById("statTotal").textContent    = allReports.length;
    document.getElementById("issuesBadge").textContent  = allReports.length;

    const resolved = allReports.filter(r => r.status === "resolved").length;
    const progress = allReports.filter(r => r.status === "in-progress").length;
    const urgent   = allReports.filter(r => r.severity === "high" && r.status !== "resolved").length;

    document.getElementById("statResolved").textContent = resolved;
    document.getElementById("statProgress").textContent = progress;
    document.getElementById("statUrgent").textContent   = urgent;

    // Overview table — last 5
    const overviewTbody = document.getElementById("overviewTbody");
    if (!allReports.length) {
      overviewTbody.innerHTML = `<tr><td colspan="4" class="empty-state">No reports found in database.</td></tr>`;
    } else {
      overviewTbody.innerHTML = allReports.slice(0, 5).map(r => `
        <tr>
          <td>
            <div class="cell-title">${r.title || "Untitled"}</div>
            <div class="cell-sub">${r.area || r.address || ""}</div>
          </td>
          <td>
            <div class="cell-title">${r.reporterName || "Anonymous"}</div>
            <div class="cell-sub">${r.reporterEmail || ""}</div>
          </td>
          <td>${getBadge(r.status)}</td>
          <td>${r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleDateString() : "N/A"}</td>
        </tr>
      `).join("");
    }

    // Render full issues table
    renderIssues(allReports);

  } catch (error) {
    console.error("Reports loading failed:", error);
    showToast("Reports data could not be fetched.", "danger");
  }

  // Users
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    allUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    document.getElementById("usersBadge").textContent = allUsers.length;
    renderUsers(allUsers);

  } catch (error) {
    console.error("Users loading failed:", error);
    showToast("Could not load user data from database.", "danger");
  }

  // Load settings
  loadSettings();
}

// ── AUTH — UNTOUCHED from original ──
await setPersistence(auth, browserLocalPersistence);

let authChecked = false;

onAuthStateChanged(auth, (user) => {
  if (authChecked) return;
  authChecked = true;

  const localUser = JSON.parse(localStorage.getItem("urbanTrack_currentUser") || "null");
  const isAdmin = user || (localUser && localUser.role === "admin");

  if (isAdmin) {
    loadDashboardData();
    const email = user?.email || localUser?.email || "admin@urbantrack.com";
    document.getElementById("adminName").textContent   = email;
    document.getElementById("adminAvatar").textContent = email.charAt(0).toUpperCase();
  } else {
    // location.href = '../pages/login.html';
  }
});
