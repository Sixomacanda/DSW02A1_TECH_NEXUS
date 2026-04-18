// ===== HELPERS =====
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('urbanTrack_currentUser') || 'null');
}

function saveCurrentUser(user) {
  localStorage.setItem('urbanTrack_currentUser', JSON.stringify(user));
}

function updateStoredUser(user) {
  const users = JSON.parse(localStorage.getItem('urbanTrack_users') || '[]');
  const index = users.findIndex(u => u.email === user.email);
  if (index > -1) {
    users[index] = { ...users[index], ...user };
    localStorage.setItem('urbanTrack_users', JSON.stringify(users));
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0,2).map(p => p[0].toUpperCase()).join('') || 'U';
}

function setAvatarInitials(initials) {
  const avatar = document.getElementById('avatarDisplay');
  if (!avatar) return;
  const textNode = Array.from(avatar.childNodes).find(node => node.nodeType === 3);
  if (textNode) {
    textNode.textContent = initials;
  } else {
    avatar.insertBefore(document.createTextNode(initials), avatar.firstChild);
  }
}

function parseName(fullName) {
  const clean = (fullName || '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
}

function initUserSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const name = currentUser.name || '';
  const { firstName, lastName } = parseName(name);
  const initials = getInitials(name);
  const displayName = currentUser.displayName || `${firstName}${lastName ? ' ' + lastName[0] + '.' : ''}`.trim();

  document.getElementById('avatarName').textContent = name || 'User';
  document.getElementById('firstName').value = firstName;
  document.getElementById('lastName').value = lastName;
  document.getElementById('displayName').value = displayName;
  document.getElementById('emailField').value = currentUser.email || '';
  setAvatarInitials(initials.slice(0,2));
  document.querySelectorAll('.user-av').forEach(a => a.textContent = initials.slice(0,2));
  const headerNameEl = document.getElementById('settingsHeaderName');
  if (headerNameEl) headerNameEl.textContent = name || 'User';
}

document.addEventListener('DOMContentLoaded', initUserSettings);

// ===== NAVIGATION =====
function showSection(name, el) {
  document.querySelectorAll('.panel-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(b=>b.classList.remove('active'));
  document.getElementById('section-'+name).classList.add('active');
  el.classList.add('active');
}

// ===== PROFILE =====
function saveProfile() {
  const fn = document.getElementById('firstName').value.trim();
  const ln = document.getElementById('lastName').value.trim();
  if(!fn || !ln) { showToast('Please fill in your name fields.','danger'); return; }
  const fullName = fn + ' ' + ln;
  const initials = getInitials(fullName);
  const displayName = document.getElementById('displayName').value.trim() || `${fn} ${ln[0]||''}.`;
  const email = document.getElementById('emailField').value.trim();

  setAvatarInitials(initials.slice(0,2));
  document.getElementById('avatarName').textContent = fullName;
  document.querySelectorAll('.user-av').forEach(a=>a.textContent = initials.slice(0,2));
  const headerNameEl = document.getElementById('settingsHeaderName');
  if (headerNameEl) headerNameEl.textContent = fullName;

  const currentUser = getCurrentUser() || {};
  const updatedUser = {
    ...currentUser,
    name: fullName,
    displayName,
    email
  };
  saveCurrentUser(updatedUser);
  updateStoredUser(updatedUser);

  showSavedMsg('profileSavedMsg');
  showToast('Profile updated successfully!', 'success');
}

function resetProfile() {
  document.getElementById('firstName').value = 'Jane';
  document.getElementById('lastName').value = 'Doe';
  document.getElementById('displayName').value = 'Jane D.';
  document.getElementById('emailField').value = 'jane@email.com';
  showToast('Changes discarded.');
}

// ===== PASSWORD =====
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

function checkStrength(pw) {
  const fill = document.getElementById('pwFill');
  const label = document.getElementById('pwLabel');
  let score = 0;
  if(pw.length >= 8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    {pct:'0%', color:'transparent', text:'Enter a password', textColor:'rgba(255,255,255,.3)'},
    {pct:'25%', color:'#ef4444', text:'Weak', textColor:'#ef4444'},
    {pct:'50%', color:'#f59e0b', text:'Fair', textColor:'#f59e0b'},
    {pct:'75%', color:'#38bdf8', text:'Good', textColor:'#38bdf8'},
    {pct:'100%', color:'#10b981', text:'Strong ✓', textColor:'#10b981'},
  ];
  const lvl = levels[score];
  fill.style.width = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.textColor;
  label.style.opacity = '1';
  checkMatch();
}

function checkMatch() {
  const nw = document.getElementById('newPw').value;
  const cn = document.getElementById('confirmPw').value;
  const hint = document.getElementById('matchHint');
  if(!cn) { hint.textContent=''; hint.className='field-hint'; return; }
  if(nw === cn) { hint.textContent='✓ Passwords match'; hint.className='field-hint success-hint'; }
  else { hint.textContent='✗ Passwords do not match'; hint.className='field-hint error-hint'; }
}

function changePassword() {
  const cur = document.getElementById('currentPw').value;
  const nw  = document.getElementById('newPw').value;
  const cn  = document.getElementById('confirmPw').value;
  if(!cur) { showToast('Please enter your current password.','danger'); return; }
  if(nw.length < 8) { showToast('New password must be at least 8 characters.','danger'); return; }
  if(nw !== cn) { showToast('New passwords do not match.','danger'); return; }
  document.getElementById('currentPw').value = '';
  document.getElementById('newPw').value = '';
  document.getElementById('confirmPw').value = '';
  document.getElementById('pwFill').style.width = '0%';
  document.getElementById('pwLabel').textContent = 'Enter a password';
  document.getElementById('matchHint').textContent = '';
  showSavedMsg('pwSavedMsg');
  showToast('Password changed successfully!','success');
}

// ===== TOGGLES =====
function saveToggle(el, name) {
  showToast((el.checked ? '✓ ' : '✗ ') + name + (el.checked ? ' enabled' : ' disabled'), el.checked ? 'success' : '');
}

function requestPush(el) {
  if(el.checked) {
    showToast('Push notifications enabled','success');
  } else {
    showToast('Push notifications disabled');
  }
}

// ===== SESSIONS =====
function revokeSession(btn, name) {
  const row = btn.closest('.session-item');
  row.style.opacity = '0';
  row.style.transform = 'translateX(20px)';
  row.style.transition = 'all .35s ease';
  setTimeout(()=>row.remove(), 350);
  showToast(name + ' session revoked.', 'success');
}

function signOutAll() {
  closeModal('signoutAllModal');
  const items = document.querySelectorAll('#sessionsList .session-item');
  let delay = 0;
  items.forEach(item => {
    if(!item.querySelector('.session-current')) {
      setTimeout(()=>{
        item.style.opacity='0'; item.style.transform='translateX(20px)'; item.style.transition='all .3s';
        setTimeout(()=>item.remove(),300);
      }, delay);
      delay += 100;
    }
  });
  showToast('Signed out of all other sessions.','success');
}

// ===== DATA EXPORT =====
function requestExport() {
  showToast('📥 Export requested — you\'ll receive an email within 24 hours.','success');
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

// Delete confirm
function checkDeleteConfirm() {
  const val = document.getElementById('deleteConfirmInput').value;
  document.getElementById('deleteConfirmBtn').disabled = val !== 'DELETE';
}

function deleteAccount() {
  const pw = document.getElementById('deletePasswordInput').value;
  if(!pw) { showToast('Please enter your password to confirm.','danger'); return; }
  closeModal('deleteModal');
  showToast('Account deletion initiated. Redirecting…','danger');
  setTimeout(()=>{ window.location.href='index.html'; }, 2500);
}

function deactivateAccount() {
  closeModal('deactivateModal');
  showToast('Account deactivated. Logging you out…','warn');
  setTimeout(()=>{ window.location.href='login.html'; }, 2000);
}

// ===== HELPERS =====
function showSavedMsg(id) {
  const el = document.getElementById(id);
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2500);
}

function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.className='toast', 3500);
}