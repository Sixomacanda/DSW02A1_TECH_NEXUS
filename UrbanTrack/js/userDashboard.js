
const myIssues = [
  {id:1,title:'Large pothole on Main Street',category:'Pothole / Road',location:'Rosebank',status:'urgent',date:'2026-04-16',upvotes:34,voted:false,desc:'Deep pothole near the bus stop causing damage to vehicles. About 40cm wide and 15cm deep. Very dangerous at night.'},
  {id:2,title:'Broken streetlight near school',category:'Streetlight',location:'Melville',status:'pending',date:'2026-04-14',upvotes:28,voted:true,desc:'Streetlight has been out for 2 weeks. Children walk past this area daily. Safety hazard at night.'},
  {id:3,title:'Blocked drain causing flooding',category:'Blocked Drain',location:'Sandton',status:'resolved',date:'2026-04-10',upvotes:21,voted:false,desc:'Drain completely blocked with debris. During rain the street floods up to the pavement.'},
  {id:4,title:'Graffiti on community wall',category:'Graffiti / Vandalism',location:'Soweto',status:'in-progress',date:'2026-04-08',upvotes:9,voted:false,desc:'Offensive graffiti appeared overnight on the east-facing wall of the community centre.'},
  {id:5,title:'Water leak on Harris Road',category:'Water Leak',location:'Midrand',status:'in-progress',date:'2026-04-07',upvotes:18,voted:true,desc:'Burst pipe leaking water onto the road. Large puddle forming. Road becoming slippery.'},
  {id:6,title:'Overgrown trees blocking signage',category:'Overgrown Vegetation',location:'Fourways',status:'resolved',date:'2026-03-28',upvotes:7,voted:false,desc:'Tree branches grown over the stop sign at the intersection.'},
  {id:7,title:'Cracked pavement on 5th Ave',category:'Broken Pavement',location:'Randburg',status:'resolved',date:'2026-03-20',upvotes:11,voted:false,desc:'Several sections of pavement cracked and uplifted. Trip hazard.'},
];

// Community issues (not by this user) to allow upvoting
const communityIssues = [
  {id:101,title:'Missing manhole cover on Jan Smuts',category:'Other',location:'Sandton CBD',status:'in-progress',date:'2026-04-12',upvotes:41,voted:false,desc:'Manhole cover missing on Jan Smuts Ave. Extremely dangerous for cyclists and pedestrians.'},
  {id:102,title:'Speed bumps needed on school road',category:'Pothole / Road',location:'Midrand',status:'pending',date:'2026-04-09',upvotes:33,voted:false,desc:'Vehicles speed past school gates every morning during drop-off. Children at serious risk.'},
  {id:103,title:'No lighting in park at night',category:'Streetlight',location:'Melville',status:'pending',date:'2026-04-11',upvotes:22,voted:false,desc:'Park has no functioning lights after sunset. Community members feel unsafe.'},
];

const statusMap = {
  urgent:{badge:'badge-urgent',label:'🔴 Urgent'},
  pending:{badge:'badge-pending',label:'🟡 Pending'},
  'in-progress':{badge:'badge-progress',label:'🔵 In Progress'},
  resolved:{badge:'badge-resolved',label:'🟢 Resolved'},
};

function badge(status){ const s=statusMap[status]||{badge:'badge-pending',label:status}; return `<span class="badge ${s.badge}">${s.label}</span>`; }
function fmtDate(d){ return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}); }
function refTag(id){ return `<span class="ref-tag">#UT-${String(id).padStart(4,'0')}</span>`; }

let curFilter = 'all';

function renderMyIssues(filter) {
  if(filter) curFilter = filter;
  const list = curFilter==='all' ? myIssues : myIssues.filter(i=>i.status===curFilter);
  const el = document.getElementById('myIssuesList');
  if(!list.length){
    el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-secondary);opacity:.4;"><div style="font-size:2.5rem;margin-bottom:.75rem;">📭</div><p>No reports in this category.</p></div>`;
    return;
  }
  el.innerHTML = list.map(i=>`
    <div class="issue-card fu">
      <div class="issue-card-header">
        <div>
          <div class="issue-title">${i.title}</div>
          <div class="issue-meta">${refTag(i.id)}<span class="meta-dot"></span>${i.location}<span class="meta-dot"></span>${fmtDate(i.date)}</div>
        </div>
        ${badge(i.status)}
      </div>
      <div class="issue-desc">${i.desc}</div>
      <div class="issue-footer">
        <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
          <span class="cat-pill">${i.category}</span>
          <button class="upvote-btn${i.voted?' voted':''}" id="upvote-${i.id}" onclick="toggleUpvote(${i.id},'my')" ${i.status==='resolved'?'disabled title="Resolved issues cannot be upvoted"':''}>
            ▲ ${i.upvotes} ${i.voted?'Upvoted':'Upvote'}
          </button>
        </div>
        <button style="background:none;border:none;color:var(--accent-hover);cursor:pointer;font-size:.8rem;font-weight:600;font-family:inherit;opacity:.8;" onclick="openModal(${i.id},'my')">View Details →</button>
      </div>
    </div>`).join('');
}

function filterMyIssues(f, el) {
  document.querySelectorAll('.filter-tabs .ftab').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  renderMyIssues(f);
}

function toggleUpvote(id, pool) {
  const arr = pool==='my' ? myIssues : communityIssues;
  const issue = arr.find(i=>i.id===id);
  if(!issue) return;
  issue.voted = !issue.voted;
  issue.upvotes += issue.voted ? 1 : -1;
  renderMyIssues();
  showToast(issue.voted ? '👍 Upvoted! This helps prioritise the issue.' : 'Upvote removed.', issue.voted?'success':'');
}

function openModal(id, pool) {
  const arr = pool==='my' ? myIssues : communityIssues;
  const i = arr.find(x=>x.id===id);
  if(!i) return;
  document.getElementById('modalTitle').textContent = i.title;
  document.getElementById('modalSub').textContent = `${i.location} · ${fmtDate(i.date)}`;
  document.getElementById('modalFields').innerHTML = `
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:.75rem;padding:.75rem 1rem;"><label style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);opacity:.55;display:block;margin-bottom:.25rem;">Category</label><p style="font-size:.875rem;">${i.category}</p></div>
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:.75rem;padding:.75rem 1rem;"><label style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);opacity:.55;display:block;margin-bottom:.25rem;">Status</label>${badge(i.status)}</div>
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:.75rem;padding:.75rem 1rem;"><label style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);opacity:.55;display:block;margin-bottom:.25rem;">Upvotes</label><p style="font-size:.875rem;font-weight:700;color:var(--accent-hover);">▲ ${i.upvotes}</p></div>
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:.75rem;padding:.75rem 1rem;"><label style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);opacity:.55;display:block;margin-bottom:.25rem;">Reference</label><p style="font-size:.875rem;font-family:monospace;color:var(--accent-hover);">#UT-${String(i.id).padStart(4,'0')}</p></div>`;
  document.getElementById('modalDesc').textContent = i.desc;
  document.getElementById('issueModal').classList.add('open');
}

function closeModal() { document.getElementById('issueModal').classList.remove('open'); }
document.getElementById('issueModal').addEventListener('click', e=>{ if(e.target===document.getElementById('issueModal')) closeModal(); });

function showToast(msg, type='') {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='toast',3000);
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0,2).map(p => p[0].toUpperCase()).join('') || 'U';
}

// Initialize dashboard with user data
function initUserDashboard() {
  const currentUser = JSON.parse(localStorage.getItem('urbanTrack_currentUser'));
  if (!currentUser) return;

  const welcomeElement = document.querySelector('.welcome-title');
  if (welcomeElement) {
    welcomeElement.textContent = `Welcome back, ${currentUser.name || 'User'} 👋`;
  }

  const navName = document.querySelector('.user-pill');
  const avatarEls = document.querySelectorAll('.user-av');
  const initials = getInitials(currentUser.name || currentUser.email || 'User');

  if (avatarEls.length) {
    avatarEls.forEach(a => a.textContent = initials.slice(0,2));
  }

  if (navName) {
    const nameText = navName.querySelector('span');
    if (nameText) {
      nameText.textContent = currentUser.name || 'User';
    }
  }
}

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', function() {
  initUserDashboard();
  renderMyIssues();
});

// Init
renderMyIssues();
