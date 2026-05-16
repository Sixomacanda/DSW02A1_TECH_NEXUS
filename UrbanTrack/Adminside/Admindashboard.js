import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4Wy3nmsbaUWGF-rh6ubXvCmAAKhho49U",
  authDomain: "urban-track-91e53.firebaseapp.com",
  projectId: "urban-track-91e53",
  storageBucket: "urban-track-91e53.firebasestorage.app",
  messagingSenderId: "519209303536",
  appId: "1:519209303536:web:c212eb58eb836e27047135"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

  // Navigation logic
  window.showView = function(viewId) {
    // Hide all views and remove active class from nav
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show selected view
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');
    
    // Update topbar title
    const titles = { overview: 'Dashboard Overview', issues: 'All Issues', users: 'User Management', pending: 'Pending Approvals', settings: 'Settings' };
    document.getElementById('topbarTitle').textContent = titles[viewId] || 'Dashboard';
  };

  window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  };

  function getStatusBadge(status) {
    const map = {
      pending: { class: 'status-badge', label: 'Pending' },
      'in-progress': { class: 'status-badge', label: 'In Progress' },
      resolved: { class: 'status-badge', label: 'Resolved' }
    };
    const s = map[status] || { class: 'status-badge', label: status };
    return `<span class="${s.class}">${s.label}</span>`;
  }

  window.updateStatus = async function(id, newStatus) {
    try {
      await updateDoc(doc(db, "reports", id), { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      loadDashboardData();
    } catch (e) {
      console.error(e);
      showToast("Error updating status");
    }
  };

  async function loadDashboardData() {
    // 1. Load Reports
    try {
      const reportsSnapshot = await getDocs(query(collection(db, "reports"), orderBy("timestamp", "desc")));
      const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      document.getElementById('statTotal').textContent = reports.length;
      document.getElementById('issuesBadge').textContent = reports.length;
      
      const resolved = reports.filter(r => r.status === 'resolved').length;
      const progress = reports.filter(r => r.status === 'in-progress').length;
      const urgent = reports.filter(r => r.severity === 'high' && r.status !== 'resolved').length;

      document.getElementById('statResolved').textContent = resolved;
      document.getElementById('statProgress').textContent = progress;
      document.getElementById('statUrgent').textContent = urgent;

      const overviewTbody = document.getElementById('overviewTbody');
      if (reports.length === 0) {
        overviewTbody.innerHTML = '<tr><td colspan="4" class="loading">No reports found in database.</td></tr>';
      } else {
        overviewTbody.innerHTML = reports.slice(0, 5).map(r => `
          <tr>
            <td><strong>${r.title}</strong><br><small style="color:#94A3B8">${r.area || r.address}</small></td>
            <td><div style="font-weight:600">${r.reporterName || 'Anonymous'}</div><small style="color:#94A3B8">${r.reporterEmail || ''}</small></td>
            <td>${getStatusBadge(r.status)}</td>
            <td>${r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('');
      }

      const issuesTbody = document.getElementById('issuesTbody');
      if (reports.length === 0) {
        issuesTbody.innerHTML = '<tr><td colspan="5" class="loading">No issues found.</td></tr>';
      } else {
        issuesTbody.innerHTML = reports.map(r => `
          <tr>
            <td><strong>${r.title}</strong><br><small style="color:#94A3B8">${r.category}</small></td>
            <td><div style="font-weight:600">${r.reporterName || 'Anonymous'}</div><small style="color:#94A3B8">${r.reporterEmail || ''}</small></td>
            <td>${r.area || r.address}</td>
            <td>${getStatusBadge(r.status)}</td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="updateStatus('${r.id}', 'in-progress')">Process</button>
              <button class="btn btn-primary btn-sm" onclick="updateStatus('${r.id}', 'resolved')">Resolve</button>
            </td>
          </tr>
        `).join('');
      }
    } catch (error) {
      console.error("Reports loading failed:", error);
      showToast("Reports data could not be fetched.");
    }

    // 2. Load Users
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      document.getElementById('usersBadge').textContent = users.length;
      
      const usersTbody = document.getElementById('usersTbody');
      if (users.length === 0) {
        usersTbody.innerHTML = '<tr><td colspan="4" class="loading">No registered users found.</td></tr>';
      } else {
        usersTbody.innerHTML = users.map(u => `
          <tr>
            <td><strong>${u.surname || 'User'}</strong><br><small style="color:#94A3B8">Reports Filed: ${u.reportsCount || 0}</small></td>
            <td style="color:#60A5FA; font-weight:500;">${u.email || 'N/A'}</td>
            <td><span class="status-badge">${u.status || 'Active'}</span></td>
            <td><button class="btn btn-ghost btn-sm">Manage</button></td>
          </tr>
        `).join('');
      }

      // Populate Pending Approvals (Example: filtering users with 'pending' status)
      const pendingUsers = users.filter(u => u.status === 'pending');
      document.getElementById('pendingBadge').textContent = pendingUsers.length;
      const pendingTbody = document.getElementById('pendingTbody');
      if (pendingUsers.length === 0) {
        pendingTbody.innerHTML = '<tr><td colspan="3" class="loading">No pending approvals.</td></tr>';
      } else {
        pendingTbody.innerHTML = pendingUsers.map(u => `
          <tr>
            <td>${u.surname || 'User'}</td>
            <td style="color:#60A5FA;">${u.email}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="showToast('User Approved')">Approve</button>
              <button class="btn btn-danger btn-sm">Reject</button>
            </td>
          </tr>
        `).join('');
      }
    } catch (error) {
      console.error("Users loading failed:", error);
      showToast("Could not load user data from database.");
    }
  }

import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// keep login even after refresh
await setPersistence(auth, browserLocalPersistence);

let authChecked = false;

onAuthStateChanged(auth, (user) => {
  if (authChecked) return; // prevent double runs
  authChecked = true;

  const localUser = JSON.parse(localStorage.getItem('urbanTrack_currentUser') || 'null');

  const isAdmin = user || (localUser && localUser.role === 'admin');

  if (isAdmin) {
    loadDashboardData();

    const email = user?.email || localUser?.email || 'admin@urbantrack.com';

    document.querySelector('.admin-name').textContent = email;
    document.querySelector('.admin-avatar').textContent = email.charAt(0).toUpperCase();
  } else {
    // location.href = '../pages/login.html';
  }
});