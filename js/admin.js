/* ============================================
   MOHINI CSC — Admin Panel Logic
   ============================================ */

// ---- Demo Data ----
let adminApps = [];

let partners = [];

let adminServices = [
  { name:'Aadhaar Update', type:'Aadhaar', desc:'Update request & document collection', price:120, partnerPrice:100, enabled:true, maintenance:false, paymentEnabled:true, requestTypes:[{name:'Address Update',price:100,partnerPrice:80},{name:'Name Update',price:120,partnerPrice:100},{name:'Date of Birth Update',price:120,partnerPrice:100},{name:'Mobile / Email Update',price:80,partnerPrice:60},{name:'New Application',price:150,partnerPrice:120},{name:'Other Correction',price:120,partnerPrice:100}], docs:['Existing Aadhaar Copy','Proof of Identity / Address','Additional Supporting Document'], instructions:'Verify all documents carefully. Cross-check customer details with Aadhaar database.' },
  { name:'PAN Services', type:'PAN', desc:'New / correction assistance', price:80, partnerPrice:65, enabled:true, maintenance:false, paymentEnabled:true, requestTypes:[{name:'New PAN Card',price:100,partnerPrice:80},{name:'PAN Correction',price:80,partnerPrice:65},{name:'PAN Update',price:60,partnerPrice:45},{name:'Other',price:80,partnerPrice:65}], docs:['Proof of Identity','Photograph','Aadhaar Copy'], instructions:'Check PAN eligibility. Verify photo quality.' },
  { name:'Ration Services', type:'Ration', desc:'Application assistance', price:70, partnerPrice:55, enabled:true, maintenance:false, paymentEnabled:true, requestTypes:[{name:'New Ration Card',price:100,partnerPrice:80},{name:'Member Addition',price:60,partnerPrice:45},{name:'Member Removal',price:50,partnerPrice:40},{name:'Address Update',price:70,partnerPrice:55},{name:'Other',price:70,partnerPrice:55}], docs:['Ration Card Copy','Address Proof','Identity Proof'], instructions:'Verify family details and address.' },
  { name:'Bill Payment', type:'Bill Payment', desc:'Electricity & utility requests', price:25, partnerPrice:20, enabled:true, maintenance:false, paymentEnabled:true, requestTypes:[{name:'Electricity Bill',price:25,partnerPrice:20},{name:'Water Bill',price:25,partnerPrice:20},{name:'Gas Bill',price:25,partnerPrice:20},{name:'Mobile Recharge',price:15,partnerPrice:10},{name:'DTH Recharge',price:15,partnerPrice:10},{name:'Other',price:25,partnerPrice:20}], docs:['Previous Bill Copy','Account Number Proof'], instructions:'Verify account number before processing.' },
  { name:'Other CSC Service', type:'Other', desc:'Configure additional services later', price:100, partnerPrice:80, enabled:false, maintenance:false, paymentEnabled:true, requestTypes:[{name:'New Application',price:100,partnerPrice:80},{name:'Update',price:80,partnerPrice:60},{name:'Correction',price:80,partnerPrice:60},{name:'Other',price:100,partnerPrice:80}], docs:['Supporting Document 1','Supporting Document 2'], instructions:'Default template — configure per service.' },
];

function saveAdminServices() {
  adminServices.forEach(function(s) {
    fsSetDoc('services', s.name.replace(/[\/\.\#\[\]\$]/g, '_'), s).catch(function(e) {
      console.error('Failed to save service:', s.name, e);
    });
  });
}

async function loadAdminServices() {
  try {
    var saved = await fsGetCollection('services');
    if (saved && saved.length > 0) {
      adminServices = saved.map(function(s) {
        var result = Object.assign({}, s);
        delete result._id;
        return result;
      });
    }
  } catch(e) {
    console.error('Failed to load services from Firestore:', e);
  }
}

const statusMap = {
  'Draft':'draft', 'Payment Pending':'pending', 'Submitted':'submitted',
  'Document Checking':'processing', 'Processing':'processing',
  'Correction Required':'correction', 'Completed':'completed',
  'Rejected':'rejected', 'Cancelled':'cancelled'
};

// ---- State ----
let adminAppPage = 1;
const adminPerPage = 8;
let editingServiceIdx = null;

// ---- Persistence: Save/Load Admin Data via Firestore ----
async function saveAdminApps() {
  try {
    await fsSetDoc('adminData', 'apps', { apps: adminApps });
  } catch(e) {
    console.error('Failed to save admin apps:', e);
  }
}

async function loadAdminApps() {
  // Load from Firestore
  try {
    var doc = await fsGetDoc('adminData', 'apps');
    if (doc && doc.apps) {
      adminApps = doc.apps;
    }
  } catch(e) { adminApps = []; }

  // Also load from all partner app collections
  try {
    var partnerDocs = await fsGetCollection('partnerApps');
    partnerDocs.forEach(function(pData) {
      var partnerUid = pData._id;
      var apps = pData.apps || [];
      apps.forEach(function(a) {
        if (!a.partner) {
          a.partner = partnerUid;
          a.partnerName = partnerUid;
        }
        if (!a.docs) a.docs = [];
        a.docs.forEach(function(d) {
          if (!d.status) d.status = 'Pending Review';
        });
        var existing = adminApps.find(function(x) { return x.id === a.id; });
        if (existing) {
          existing.customer = a.customer;
          existing.mobile = a.mobile;
          existing.service = a.service;
          existing.request = a.request;
          existing.note = a.note;
          existing.docs = a.docs;
        } else {
          adminApps.push(a);
        }
      });
    });
  } catch(e) {
    console.error('Failed to load partner apps:', e);
  }

  // Load partner names from Firestore partners collection
  try {
    var partnerProfiles = await fsGetCollection('partners');
    adminApps.forEach(function(a) {
      var profile = partnerProfiles.find(function(p) { return p._id === a.partner || p.partnerId === a.partner; });
      if (profile) {
        a.partnerName = profile.name;
        a.partner = profile.partnerId || a.partner;
      }
    });
  } catch(e) {}

  saveAdminApps();
}

async function savePartners() {
  try {
    await fsSetDoc('adminData', 'partners', { partners: partners });
  } catch(e) {
    console.error('Failed to save partners:', e);
  }
}

async function loadPartners() {
  // Load from Firestore partners collection (signup data)
  try {
    var partnerProfiles = await fsGetCollection('partners');
    partners = [];
    partnerProfiles.forEach(function(u) {
      partners.push({
        id: u.partnerId || u._id,
        name: u.name,
        mobile: u.mobile || '',
        email: u.email,
        whatsapp: '',
        address: 'Kolkata, West Bengal',
        apps: 0,
        wallet: 0,
        status: u.status || 'Active',
        joined: u.joined ? new Date(u.joined).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''
      });
    });
  } catch(e) { partners = []; }

  // Count applications and wallet per partner from Firestore
  for (var i = 0; i < partners.length; i++) {
    var p = partners[i];
    try {
      var appDoc = await fsGetDoc('partnerApps', p.id);
      if (appDoc && appDoc.apps) p.apps = appDoc.apps.length;
    } catch(e) {}
    try {
      var walletDoc = await fsGetDoc('partnerWallets', p.id);
      if (walletDoc) {
        var txns = walletDoc.txns || [];
        var balance = 0;
        txns.forEach(function(t) { balance += t.amount; });
        p.wallet = balance;
      }
    } catch(e) {}
  }

  savePartners();
}

// ---- Navigation ----
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  var el = document.getElementById(view + 'View');
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  var titles = {
    overview:['Admin','Overview'], adminApps:['Management','Applications'],
    partners:['Network','Partners'], services:['Configuration','Services & Pricing'],
    payments:['Finance','Payments'], adminDocs:['Files','Documents'],
    reports:['Analytics','Reports'], siteStatus:['Monitoring','Site Status'],
    settings:['Config','Settings']
  };
  if (titles[view]) {
    var pk = document.getElementById('pageKicker');
    var pt = document.getElementById('pageTitle');
    if (pk) pk.textContent = titles[view][0];
    if (pt) pt.textContent = titles[view][1];
  }
  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');

  // Refresh data on view switch
  if (view === 'adminApps' || view === 'overview') {
    loadAdminApps();
    renderAdminApps();
    if (view === 'overview') renderOverviewQueue();
  }
  if (view === 'partners') loadPartners();
  if (view === 'payments') renderPayments();
}

// ---- Notifications (setup in initAdmin) ----

// ---- Overview Queue ----
function renderOverviewQueue() {
  const queue = adminApps.filter(a => ['Submitted','Document Checking','Processing','Correction Required'].includes(a.status));
  const el = document.getElementById('overviewQueue');
  if (!el) return;
  if (queue.length === 0) {
    el.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No applications in queue</td></tr>';
    return;
  }
  el.innerHTML = queue.map(a => `
    <tr>
      <td><b>${esc(a.id)}</b></td>
      <td>${esc(a.customer)}</td>
      <td>${esc(a.partnerName || a.partner)}</td>
      <td>${esc(a.service)}</td>
      <td><span class="badge badge-${statusMap[a.status]}">${esc(a.status)}</span></td>
      <td>₹${esc(String(a.amount))}</td>
      <td><button class="btn btn-sm btn-primary" data-admin-review="${escAttr(a.id)}">Review</button></td>
    </tr>
  `).join('');

  // Render correction queue
  const corrections = adminApps.filter(a => a.status === 'Correction Required');
  const corrEl = document.getElementById('adminCorrectionQueue');
  if (corrEl) {
    if (corrections.length === 0) {
      corrEl.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No corrections needed</td></tr>';
    } else {
      corrEl.innerHTML = corrections.map(a => `
        <tr>
          <td><b>${esc(a.id)}</b></td>
          <td>${esc(a.partnerName || a.partner)}</td>
          <td style="font-size:12px">${esc((a.adminMsg || 'Correction needed').substring(0, 60))}</td>
          <td><button class="btn btn-sm btn-primary" data-admin-review="${escAttr(a.id)}">Review</button></td>
        </tr>
      `).join('');
    }
  }

  // Render recent payments from Firestore
  var recentPayments = [];
  fsGetCollection('partnerWallets').then(function(walletDocs) {
    walletDocs.forEach(function(wDoc) {
      var pid = wDoc._id;
      var txns = wDoc.txns || [];
      txns.forEach(function(t) { recentPayments.push({ partner: pid, amount: Math.abs(t.amount), status: t.status || 'Success', date: t.date }); });
    });
    recentPayments.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    recentPayments = recentPayments.slice(0, 5);
    var rpEl = document.getElementById('adminRecentPayments');
    if (rpEl) {
    if (recentPayments.length === 0) {
      rpEl.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">No recent payments</td></tr>';
    } else {
      rpEl.innerHTML = recentPayments.map(p => `
        <tr>
          <td>${esc(p.partner)}</td>
          <td>₹${p.amount}</td>
          <td><span class="badge badge-${p.status==='Success'?'completed':'pending'}">${p.status}</span></td>
          <td>${p.date}</td>
        </tr>
      `).join('');
    }
    }
  }).catch(function() {});

  // Render reports service distribution
  renderServiceDistribution();
}

function renderServiceDistribution() {
  const el = document.getElementById('reportServiceDist');
  if (!el) return;
  if (adminApps.length === 0) {
    el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No service data yet</td></tr>';
    return;
  }
  const svcMap = {};
  adminApps.forEach(a => {
    if (!svcMap[a.service]) svcMap[a.service] = { count: 0, revenue: 0 };
    svcMap[a.service].count++;
    if (a.status === 'Completed') svcMap[a.service].revenue += a.amount;
  });
  const total = adminApps.length;
  const rows = Object.keys(svcMap).map(s => {
    const d = svcMap[s];
    return `<tr><td><b>${s}</b></td><td>${d.count}</td><td>₹${d.revenue}</td><td>₹${d.count > 0 ? Math.round(d.revenue / d.count) : 0}</td><td>${Math.round(d.count / total * 100)}%</td></tr>`;
  }).join('');
  el.innerHTML = rows;
  // Update report stats
  const completed = adminApps.filter(a => a.status === 'Completed').length;
  const reportAvgTime = document.getElementById('reportAvgTime');
  if (reportAvgTime) reportAvgTime.textContent = adminApps.length > 0 ? '1-2 days' : '—';
}

// ---- Admin Applications ----
function renderAdminApps() {
  const search = (document.getElementById('adminSearchApp')?.value || '').toLowerCase();
  const statusF = document.getElementById('adminFilterStatus')?.value || '';
  let filtered = adminApps.filter(a => {
    const ms = !search || a.id.toLowerCase().includes(search) || a.customer.toLowerCase().includes(search) || (a.partner || '').toLowerCase().includes(search);
    const mf = !statusF || a.status === statusF;
    return ms && mf;
  });
  const total = filtered.length;
  const pages = Math.ceil(total / adminPerPage);
  if (adminAppPage > pages) adminAppPage = pages || 1;
  const start = (adminAppPage - 1) * adminPerPage;
  const pageData = filtered.slice(start, start + adminPerPage);

  document.getElementById('adminAppsRows').innerHTML = pageData.length === 0
    ? '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No applications found</td></tr>'
    : pageData.map(a => `
    <tr>
      <td><b>${esc(a.id)}</b></td>
      <td>${esc(a.customer)}</td>
      <td>${esc(a.partnerName || a.partner)} <small style="color:var(--text-muted)">(${esc(a.partner)})</small></td>
      <td>${esc(a.service)}</td>
      <td><span class="badge badge-${statusMap[a.status]}">${esc(a.status)}</span></td>
      <td>₹${esc(String(a.amount))}</td>
      <td>${esc(a.submitted)}</td>
      <td><button class="btn btn-sm btn-primary" data-admin-review="${escAttr(a.id)}">Review</button></td>
    </tr>
  `).join('');

  const pag = document.getElementById('adminAppPagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }
  let ph = `<button class="page-btn" onclick="adminAppPageGo(${adminAppPage-1})" ${adminAppPage===1?'disabled':''}>‹</button>`;
  for (let i = 1; i <= pages; i++) ph += `<button class="page-btn ${i===adminAppPage?'active':''}" onclick="adminAppPageGo(${i})">${i}</button>`;
  ph += `<button class="page-btn" onclick="adminAppPageGo(${adminAppPage+1})" ${adminAppPage===pages?'disabled':''}>›</button>`;
  pag.innerHTML = ph;
}

function adminAppPageGo(p) { adminAppPage = p; renderAdminApps(); }
function filterAdminApps() { adminAppPage = 1; renderAdminApps(); }

// ---- Admin Review Application ----
function adminReviewApp(id) {
  const a = adminApps.find(x => x.id === id);
  if (!a) return;
  document.getElementById('reviewModalTitle').textContent = a.id + ' — Review Application';

  let docsHtml = (a.docs || []).map((d, di) => `
    <div class="doc-review-item">
      <div class="doc-icon">📄</div>
      <div class="doc-info"><b>${esc(d.name)}</b><small>${esc(d.fileName || 'N/A')} · ${d.size ? Math.round(d.size/1024) + 'KB' : 'N/A'}</small>
        <span class="badge ${d.status === 'Verified' ? 'badge-completed' : d.status === 'Correction Needed' ? 'badge-rejected' : 'badge-pending'}" style="margin-left:6px;font-size:10px">${d.status}</span>
      </div>
      <div class="doc-actions">
        ${d.data ? `<button class="btn btn-sm btn-primary" onclick="downloadDoc('${escAttr(a.id)}',${di})">Download</button>` : `<button class="btn btn-sm btn-secondary" disabled>No File</button>`}
        ${d.status === 'Verified' ? `<button class="btn btn-sm" style="background:rgba(34,197,94,.1);color:#16a34a;border:1px solid rgba(34,197,94,.2)" disabled>✓ Verified</button>` :
          d.status === 'Correction Needed' ? `<button class="btn btn-sm" style="background:rgba(239,68,68,.1);color:#dc2626;border:1px solid rgba(239,68,68,.2)" disabled>✗ Rejected</button>` :
          `<button class="btn btn-sm btn-ghost" onclick="verifyDoc('${escAttr(a.id)}',${di})">Verify</button>`}
      </div>
    </div>
  `).join('');

  document.getElementById('reviewModalBody').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span class="badge badge-${statusMap[a.status]}" style="font-size:12px">${esc(a.status)}</span>
      <span style="font-size:12px;color:var(--text-muted)">Partner: ${esc(a.partner)} (${esc(a.partnerName)})</span>
    </div>
    <div class="admin-detail-grid">
      <div class="field"><label>Customer Name</label><span>${esc(a.customer)}</span></div>
      <div class="field"><label>Mobile</label><span>${esc(a.mobile)}</span></div>
      ${a.email ? `<div class="field"><label>Email</label><span>${esc(a.email)}</span></div>` : ''}
      <div class="field"><label>Service</label><span>${esc(a.service)}</span></div>
      <div class="field"><label>Request Type</label><span>${esc(a.request)}</span></div>
      <div class="field"><label>Amount</label><span>₹${esc(String(a.amount))}</span></div>
      <div class="field"><label>Payment Method</label><span>${esc(a.paymentMethod || 'N/A')}</span></div>
      <div class="field"><label>Submitted</label><span>${esc(a.submitted)}</span></div>
      ${a.submittedTime ? `<div class="field"><label>Time</label><span>${esc(a.submittedTime)}</span></div>` : ''}
      <div class="field full"><label>Application Note</label><span>${a.note ? esc(a.note) : '—'}</span></div>
    </div>
    <div style="margin-top:16px"><b style="font-size:13px;color:var(--navy)">Uploaded Documents</b></div>
    <div class="doc-review-list">${docsHtml || '<p style="font-size:12px;color:var(--text-muted)">No documents uploaded.</p>'}</div>
    ${a.adminMsg ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:12px;margin-top:12px"><b style="font-size:12px;color:#92400e;display:block">Admin Note:</b><p style="font-size:12px;color:#78350f">${esc(a.adminMsg)}</p></div>` : ''}
    ${a.result ? `<div style="background:var(--success-bg);border:1px solid #bbf7d0;border-radius:var(--radius-sm);padding:12px;margin-top:12px"><b style="font-size:12px;color:var(--success);display:block">Result File: ${esc(a.result)}</b></div>` : ''}
    ${(() => { const p = partners.find(x => x.id === a.partner); return (p && (!p.whatsapp || p.whatsapp.length < 10)) ? '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:10px;margin-top:12px"><b style="font-size:12px;color:#92400e">⚠ Partner WhatsApp number missing — result documents may not be delivered.</b></div>' : ''; })()}
    <div style="margin-top:16px">
      <div class="field full"><label>Application Note</label><span>${a.note ? esc(a.note) : '—'}</span></div>
    </div>
    <div style="margin-top:16px">
      <div class="form-group"><label>Internal Admin Notes</label><textarea id="adminNoteInput" rows="2" placeholder="Add internal processing notes…">${esc(a.adminNotes || '')}</textarea></div>
    </div>
  `;

  let footerHtml = '';
  if (a.status === 'Submitted' || a.status === 'Document Checking') {
    footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal('reviewModal')">Close</button>
      <button class="btn btn-warning" style="color:#fff" onclick="adminAction('${a.id}','correction')">Request Correction</button>
      <button class="btn btn-primary" onclick="adminAction('${a.id}','processing')">Start Processing</button>
    `;
  } else if (a.status === 'Processing') {
    footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal('reviewModal')">Close</button>
      <button class="btn btn-warning" style="color:#fff" onclick="adminAction('${a.id}','correction')">Request Correction</button>
      <button class="btn btn-success" onclick="openUploadResult('${a.id}')">Upload Result & Complete</button>
    `;
  } else if (a.status === 'Correction Required') {
    footerHtml = `
      <button class="btn btn-secondary" onclick="closeModal('reviewModal')">Close</button>
      <button class="btn btn-danger" onclick="adminAction('${a.id}','reject')">Reject Application</button>
    `;
  } else {
    footerHtml = `<button class="btn btn-secondary" onclick="closeModal('reviewModal')">Close</button>`;
  }
  document.getElementById('reviewModalFooter').innerHTML = footerHtml;

  document.getElementById('reviewModal').classList.add('open');
}

function adminAction(id, action) {
  const a = adminApps.find(x => x.id === id);
  if (!a) return;
  const note = document.getElementById('adminNoteInput')?.value || a.adminNotes || '';
  const now = new Date();
  const nowStr = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const dateOnly = now.toLocaleDateString('en-IN', { dateStyle: 'medium' });

  if (action === 'correction') {
    a.status = 'Correction Required';
    a.adminMsg = note || 'Please correct the required information and resubmit.';
    a.adminNotes = note;
    a.updated = dateOnly;
    sendWhatsAppNotification('correction', { appId: a.id, message: a.adminMsg });
    toast('Correction requested for ' + id + '. Partner notified via WhatsApp.');
  } else if (action === 'processing') {
    a.status = 'Processing';
    a.adminNotes = note;
    a.updated = dateOnly;
    toast(id + ' is now being processed. Partner notified.');
  } else if (action === 'upload') {
    a.status = 'Completed';
    a.result = 'Result_' + a.customer.replace(/\s/g, '') + '.pdf';
    a.adminNotes = note;
    a.updated = dateOnly;
    sendWhatsAppNotification('completed', { appId: a.id, customer: a.customer, service: a.service });
    toast(id + ' completed! WhatsApp notification sent to partner.');
  } else if (action === 'reject') {
    a.status = 'Rejected';
    a.adminNotes = note;
    a.updated = dateOnly;
    toast(id + ' has been rejected. Partner notified.');
  }

  saveAdminApps();
  syncAppToPartner(a);
  closeModal('reviewModal');
  renderAdminApps();
  renderOverviewQueue();
  renderDocRows();
  updateAdminStats();
}

function syncAppToPartner(a) {
  var partnerId = a.partnerId || a.partner;
  if (!partnerId) return;

  fsGetDoc('partnerApps', partnerId).then(function(doc) {
    var apps = (doc && doc.apps) ? doc.apps : [];
    var idx = apps.findIndex(function(x) { return x.id === a.id; });
    if (idx !== -1) {
      apps[idx].status = a.status;
      apps[idx].adminMsg = a.adminMsg || '';
      apps[idx].result = a.result || '';
      apps[idx].resultFiles = a.resultFiles || apps[idx].resultFiles || [];
      apps[idx].updated = a.updated;
      apps[idx].docs = a.docs || apps[idx].docs;
    } else {
      apps.push(a);
    }
    fsSetDoc('partnerApps', partnerId, { apps: apps }).catch(function(){});
  }).catch(function(){});
}

// ---- Partners ----
function renderPartners() {
  const search = (document.getElementById('partnerSearch')?.value || '').toLowerCase();
  const statusF = document.getElementById('partnerFilter')?.value || '';
  let filtered = partners.filter(p => {
    const ms = !search || p.id.toLowerCase().includes(search) || p.name.toLowerCase().includes(search);
    const mf = !statusF || p.status === statusF;
    return ms && mf;
  });

  document.getElementById('partnerRows').innerHTML = filtered.length === 0
    ? '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">No partners found</td></tr>'
    : filtered.map(p => `
    <tr>
      <td><b>${esc(p.id)}</b></td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.mobile)}</td>
      <td>${esc(p.email)}</td>
      <td>${esc(String(p.apps))}</td>
      <td>₹${esc(String(p.wallet.toLocaleString()))}</td>
      <td><span class="badge badge-${p.status==='Active'?'completed':p.status==='Pending'?'pending':'rejected'}">${esc(p.status)}</span></td>
      <td>${esc(p.joined)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="viewPartner('${escAttr(p.id)}')">View</button>
        <button class="btn btn-sm btn-ghost" style="color:${p.status==='Active'?'var(--danger)':'var(--success)'}" onclick="togglePartner('${escAttr(p.id)}')">${p.status==='Active'?'Deactivate':'Activate'}</button>
      </td>
    </tr>
  `).join('');
}

function filterPartners() { renderPartners(); }

function viewPartner(id) {
  const p = partners.find(x => x.id === id);
  if (!p) return;
  document.getElementById('partnerModalTitle').textContent = p.id + ' — Partner Details';
  document.getElementById('partnerModalBody').innerHTML = `
    <div class="admin-detail-grid">
      <div class="field"><label>Partner ID</label><span>${esc(p.id)}</span></div>
      <div class="field"><label>Business Name</label><span>${esc(p.name)}</span></div>
      <div class="field"><label>Mobile</label><span>${esc(p.mobile)}</span></div>
      <div class="field"><label>Email</label><span>${esc(p.email)}</span></div>
      <div class="field"><label>WhatsApp</label><span>${esc(p.whatsapp || 'Not set')}</span></div>
      <div class="field full"><label>Address</label><span>${esc(p.address)}</span></div>
      <div class="field"><label>Status</label><span class="badge badge-${p.status==='Active'?'completed':p.status==='Pending'?'pending':'rejected'}">${esc(p.status)}</span></div>
      <div class="field"><label>Joined</label><span>${esc(p.joined)}</span></div>
      <div class="field"><label>Total Applications</label><span>${esc(String(p.apps))}</span></div>
      <div class="field"><label>Wallet Balance</label><span>₹${esc(String(p.wallet.toLocaleString()))}</span></div>
    </div>
    ${(!p.whatsapp || p.whatsapp.length < 10) ? '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:10px 14px;margin-top:14px"><b style="font-size:12px;color:#92400e">⚠ Warning: Partner WhatsApp number is missing or incorrect. Documents may not be delivered.</b></div>' : ''}
  `;
  document.getElementById('partnerModal').classList.add('open');
}

function togglePartner(id) {
  const p = partners.find(x => x.id === id);
  if (!p) return;
  p.status = p.status === 'Active' ? 'Inactive' : 'Active';
  renderPartners();
  toast('Partner ' + id + ' ' + (p.status === 'Active' ? 'activated' : 'deactivated') + '.');
}

// ---- Services & Pricing ----
function renderServices() {
  const el = document.getElementById('servicesGrid');
  if (!el) return;
  if (adminServices.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);grid-column:1/-1">No services added yet. Click "Add New Service" to create one.</div>';
    return;
  }
  el.innerHTML = adminServices.map((s, i) => `
    <div class="admin-service-card" draggable="true" data-idx="${i}" ondragstart="svcDragStart(event)" ondragover="svcDragOver(event)" ondrop="svcDrop(event)" ondragend="svcDragEnd(event)" ondragenter="svcDragEnter(event)" ondragleave="svcDragLeave(event)" style="cursor:grab;transition:all .2s">
      <div class="svc-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="svc-drag-handle" style="cursor:grab;color:rgba(0,0,0,.15);font-size:18px;user-select:none" title="Drag to reorder">⠿</span>
          <div class="service-icon ${s.name.includes('Aadhaar')?'aadhaar':s.name.includes('PAN')?'pan':s.name.includes('Ration')?'ration':s.name.includes('Bill')?'bill':'other'}">${escHtml(s.name.charAt(0))}</div>
          <div>
            <b style="font-size:15px;color:var(--navy)">${escHtml(s.name)}</b>${s.type?'<span style="display:inline-block;background:rgba(22,101,216,.08);color:var(--primary);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;margin-left:6px;vertical-align:middle">'+escHtml(s.type)+'</span>':''}<br>
            <span style="font-size:12px;color:var(--text-muted)">${escHtml(s.desc || '')}</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin:8px 0 12px;flex-wrap:wrap">
        <span class="svc-chip ${s.enabled?'chip-green':'chip-red'}">${s.enabled?'✓ Enabled':'✗ Disabled'}</span>
        <span class="svc-chip ${s.maintenance?'chip-yellow':'chip-gray'}">${s.maintenance?'🔧 Maintenance':'🔧 No Maintenance'}</span>
        <span class="svc-chip ${s.paymentEnabled?'chip-blue':'chip-gray'}">${s.paymentEnabled?'💰 Payment ON':'💰 FREE'}</span>
        ${s.aadhaarRequired?'<span class="svc-chip chip-orange">🏛️ Aadhaar Required</span>':''}
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px">
        <div style="flex:1;background:var(--bg);border-radius:8px;padding:8px 12px;border:1px solid var(--border)">
          <small style="font-size:11px;color:var(--text-muted);display:block">Processing Fee</small>
          <b style="font-size:16px;color:var(--navy)">${s.paymentEnabled?'₹'+s.price:'FREE'}</b>
        </div>
        <div style="flex:1;background:var(--bg);border-radius:8px;padding:8px 12px;border:1px solid var(--border)">
          <small style="font-size:11px;color:var(--text-muted);display:block">Partner Price</small>
          <b style="font-size:16px;color:var(--primary)">${s.paymentEnabled?'₹'+s.partnerPrice:'FREE'}</b>
        </div>
      </div>
      <div class="svc-docs">
        <small style="font-weight:600;color:var(--text)">Required Documents</small>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">
          ${s.docs.map(d => '<span style="display:inline-block;background:rgba(0,0,0,.04);border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:11px;color:var(--text-secondary)">' + escHtml(d) + '</span>').join('')}
        </div>
      </div>
      ${(s.sampleFiles && s.sampleFiles.length > 0) ? `
      <div class="svc-docs" style="margin-top:10px">
        <small style="font-weight:600;color:var(--text)">Reference Files (${s.sampleFiles.length})</small>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${s.sampleFiles.map((f, fi) => `
            <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--primary)">
              📎 ${f.name.length > 20 ? escHtml(f.name.substring(0,20)+'...') : escHtml(f.name)}
              <button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:13px;padding:0;margin-left:2px" onclick="event.stopPropagation();removeSvcFile(${i},${fi})">×</button>
            </span>
          `).join('')}
        </div>
      </div>
      ` : ''}
      <div style="display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
        <button class="btn btn-sm btn-primary" onclick="editService(${i})" style="flex:1">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService(${i})" style="flex:0 0 auto;padding:6px 12px">🗑</button>
      </div>
    </div>
  `).join('');
}

var svcDragIdx = null;
function svcDragStart(e) {
  svcDragIdx = parseInt(e.currentTarget.dataset.idx);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', svcDragIdx);
  setTimeout(function() {
    e.currentTarget.style.opacity = '0.4';
  }, 0);
}
function svcDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function svcDragEnter(e) {
  e.preventDefault();
  var card = e.currentTarget;
  if (parseInt(card.dataset.idx) !== svcDragIdx) {
    card.classList.add('drag-over');
  }
}
function svcDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function svcDrop(e) {
  e.preventDefault();
  var toIdx = parseInt(e.currentTarget.dataset.idx);
  e.currentTarget.classList.remove('drag-over');
  if (svcDragIdx === null || svcDragIdx === toIdx) return;
  var item = adminServices.splice(svcDragIdx, 1)[0];
  adminServices.splice(toIdx, 0, item);
  saveAdminServices();
  svcDragIdx = null;
  renderServices();
  toast('Service order updated!');
}
function svcDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  e.currentTarget.style.opacity = '';
  svcDragIdx = null;
  document.querySelectorAll('.admin-service-card').forEach(function(c) {
    c.classList.remove('drag-over');
  });
}

function editService(idx) {
  editingServiceIdx = idx;
  const s = adminServices[idx];
  document.getElementById('editSvcName').value = s.name;
  document.getElementById('editSvcTitle').value = s.name;
  document.getElementById('editSvcType').value = s.type || '';
  document.getElementById('editSvcPrice').value = s.price;
  document.getElementById('editSvcPartnerPrice').value = s.partnerPrice;
  document.getElementById('editSvcDesc').value = s.desc;
  editReqTypes = (s.requestTypes || []).map(function(r) {
    if (typeof r === 'string') return { name: r, price: s.price, partnerPrice: s.partnerPrice };
    return { name: r.name, price: r.price || s.price, partnerPrice: r.partnerPrice || s.partnerPrice };
  });
  renderReqTypes('edit');
  document.getElementById('editSvcEnabled').checked = s.enabled;
  document.getElementById('editSvcMaintenance').checked = s.maintenance || false;
  document.getElementById('editSvcPaymentEnabled').checked = s.paymentEnabled !== false;
  document.getElementById('editSvcInstructions').value = s.instructions || '';
  editSvcTempFiles = (s.sampleFiles || []).slice();
  renderEditSvcFileList();

  document.querySelectorAll('#editServiceModal .edit-doc-check').forEach(function(cb) {
    cb.checked = (s.docs || []).indexOf(cb.value) !== -1;
  });

  var knownDocs = ['Aadhaar Card','Photo','Address Proof','PAN Card','Signature','Bank Passbook','Voter ID'];
  editCustomDocs = (s.docs || []).filter(function(d) { return knownDocs.indexOf(d) === -1; });
  renderDocTags('edit');

  document.getElementById('editServiceModal').classList.add('open');
}

function saveServiceEdit() {
  const s = adminServices[editingServiceIdx];
  s.type = document.getElementById('editSvcType').value || s.type;
  s.price = parseInt(document.getElementById('editSvcPrice').value) || s.price;
  s.partnerPrice = parseInt(document.getElementById('editSvcPartnerPrice').value) || s.partnerPrice;
  s.desc = document.getElementById('editSvcDesc').value;
  s.requestTypes = editReqTypes.length > 0 ? editReqTypes.slice() : s.requestTypes;
  s.enabled = document.getElementById('editSvcEnabled').checked;
  s.maintenance = document.getElementById('editSvcMaintenance').checked;
  s.paymentEnabled = document.getElementById('editSvcPaymentEnabled').checked;
  s.instructions = document.getElementById('editSvcInstructions').value;
  s.sampleFiles = editSvcTempFiles || [];

  var checkedDocs = gatherEditCheckedDocs();
  var allDocs = checkedDocs.concat(editCustomDocs);
  if (allDocs.length === 0) allDocs = ['Photo', 'ID Proof'];
  s.docs = allDocs;
  s.aadhaarRequired = checkedDocs.indexOf('Aadhaar Card') !== -1;
  saveAdminServices();

  closeModal('editServiceModal');
  renderServices();
  toast(s.name + ' updated successfully.');
}

function toggleService(idx) {
  adminServices[idx].enabled = !adminServices[idx].enabled;
  saveAdminServices();
  renderServices();
  toast(adminServices[idx].name + (adminServices[idx].enabled ? ' enabled.' : ' disabled.'));
}

function toggleMaintenance(idx) {
  adminServices[idx].maintenance = !adminServices[idx].maintenance;
  saveAdminServices();
  renderServices();
  toast(adminServices[idx].name + (adminServices[idx].maintenance ? ' — Maintenance ON' : ' — Maintenance OFF'));
}

function togglePayment(idx) {
  adminServices[idx].paymentEnabled = !adminServices[idx].paymentEnabled;
  saveAdminServices();
  renderServices();
  toast(adminServices[idx].name + (adminServices[idx].paymentEnabled ? ' — Payment enabled' : ' — Payment disabled (FREE)'));
}

function deleteService(idx) {
  var s = adminServices[idx];
  if (!confirm('Delete "' + s.name + '"?\n\nThis cannot be undone.')) return;
  adminServices.splice(idx, 1);
  saveAdminServices();
  renderServices();
  toast(s.name + ' deleted.');
}

// ---- Add New Service ----
var newSvcTempFiles = [];
var editSvcTempFiles = [];
var newCustomDocs = [];
var editCustomDocs = [];

// ---- Request Types per service ----
var newReqTypes = [];
var editReqTypes = [];

function addReqType(mode) {
  var nameEl = document.getElementById(mode === 'new' ? 'newReqTypeName' : 'editReqTypeName');
  var priceEl = document.getElementById(mode === 'new' ? 'newReqTypePrice' : 'editReqTypePrice');
  var partnerPriceEl = document.getElementById(mode === 'new' ? 'newReqTypePartnerPrice' : 'editReqTypePartnerPrice');
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var name = nameEl.value.trim();
  var price = parseInt(priceEl.value) || 0;
  var partnerPrice = parseInt(partnerPriceEl.value) || 0;
  if (!name) { toast('Enter a type name'); return; }
  arr.push({ name: name, price: price, partnerPrice: partnerPrice });
  nameEl.value = ''; priceEl.value = ''; partnerPriceEl.value = '';
  renderReqTypes(mode);
}

function removeReqType(mode, idx) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  arr.splice(idx, 1);
  renderReqTypes(mode);
}

function renderReqTypes(mode) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var el = document.getElementById(mode === 'new' ? 'newSvcReqTypes' : 'editSvcReqTypes');
  if (!el) return;
  if (arr.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = arr.map(function(r, i) {
    return '<div style="display:flex;align-items:center;gap:6px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;margin-bottom:4px;font-size:12px;color:#172033">' +
      '<b style="flex:1">' + r.name + '</b>' +
      '<span style="color:#64748b">₹' + r.price + '</span>' +
      '<span style="color:var(--primary)">P: ₹' + r.partnerPrice + '</span>' +
      '<button onclick="removeReqType(\'' + mode + '\',' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0">✕</button></div>';
  }).join('');
}

function openAddServiceModal() {
  document.getElementById('newSvcName').value = '';
  document.getElementById('newSvcType').value = '';
  document.getElementById('newSvcPrice').value = '';
  document.getElementById('newSvcPartnerPrice').value = '';
  document.getElementById('newSvcDesc').value = '';
  document.getElementById('newSvcInstructions').value = '';
  document.getElementById('newSvcEnabled').checked = true;
  document.getElementById('newSvcMaintenance').checked = false;
  document.getElementById('newSvcPaymentEnabled').checked = true;
  document.getElementById('newSvcFileList').innerHTML = '';
  document.getElementById('newSvcFileInput').value = '';
  document.getElementById('newSvcDocTags').innerHTML = '';
  document.getElementById('newSvcCustomDoc').value = '';
  newSvcTempFiles = [];
  newCustomDocs = [];
  newReqTypes = [];
  renderReqTypes('new');
  document.querySelectorAll('#addServiceModal .svc-doc-check').forEach(function(cb){ cb.checked = false; });
  document.getElementById('addSvcError').style.display = 'none';
  document.getElementById('addServiceModal').classList.add('open');
}

function addCustomDoc(mode) {
  var input = document.getElementById(mode === 'new' ? 'newSvcCustomDoc' : 'editSvcCustomDoc');
  var val = input.value.trim();
  if (!val) return;
  var arr = mode === 'new' ? newCustomDocs : editCustomDocs;
  if (arr.indexOf(val) !== -1) { toast('Already added'); return; }
  arr.push(val);
  input.value = '';
  renderDocTags(mode);
}

function removeCustomDoc(mode, idx) {
  var arr = mode === 'new' ? newCustomDocs : editCustomDocs;
  arr.splice(idx, 1);
  renderDocTags(mode);
}

function renderDocTags(mode) {
  var arr = mode === 'new' ? newCustomDocs : editCustomDocs;
  var el = document.getElementById(mode === 'new' ? 'newSvcDocTags' : 'editSvcDocTags');
  el.innerHTML = arr.map(function(d, i) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);border-radius:6px;padding:3px 10px;font-size:11px;color:#93c5fd">' +
      escHtml(d) +
      '<button onclick="removeCustomDoc(\'' + mode + '\',' + i + ')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:13px;padding:0;margin-left:2px">×</button>' +
    '</span>';
  }).join('');
}

function gatherCheckedDocs() {
  var docs = [];
  document.querySelectorAll('#addServiceModal .svc-doc-check:checked').forEach(function(cb) {
    docs.push(cb.value);
  });
  return docs;
}

function gatherEditCheckedDocs() {
  var docs = [];
  document.querySelectorAll('#editServiceModal .edit-doc-check:checked').forEach(function(cb) {
    docs.push(cb.value);
  });
  return docs;
}

function addNewService() {
  const name = document.getElementById('newSvcName').value.trim();
  const type = document.getElementById('newSvcType').value;
  const price = parseInt(document.getElementById('newSvcPrice').value);
  const partnerPrice = parseInt(document.getElementById('newSvcPartnerPrice').value);
  const desc = document.getElementById('newSvcDesc').value.trim();
  const requestTypes = newReqTypes.length > 0 ? newReqTypes.slice() : [{ name: 'New Application', price: price, partnerPrice: partnerPrice }, { name: 'Update', price: price, partnerPrice: partnerPrice }, { name: 'Correction', price: price, partnerPrice: partnerPrice }, { name: 'Other', price: price, partnerPrice: partnerPrice }];
  const instructions = document.getElementById('newSvcInstructions').value.trim();
  const enabled = document.getElementById('newSvcEnabled').checked;
  const maintenance = document.getElementById('newSvcMaintenance').checked;
  const paymentEnabled = document.getElementById('newSvcPaymentEnabled').checked;
  const errEl = document.getElementById('addSvcError');

  errEl.style.display = 'none';

  if (!name) { errEl.textContent = 'Please enter a service name'; errEl.style.display = 'block'; return; }
  if (!type) { errEl.textContent = 'Please select a service type'; errEl.style.display = 'block'; return; }
  if (!price || price <= 0) { errEl.textContent = 'Please enter a valid processing fee'; errEl.style.display = 'block'; return; }
  if (!partnerPrice || partnerPrice <= 0) { errEl.textContent = 'Please enter a valid partner price'; errEl.style.display = 'block'; return; }
  if (!desc) { errEl.textContent = 'Please enter a description'; errEl.style.display = 'block'; return; }

  if (adminServices.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    errEl.textContent = 'A service with this name already exists';
    errEl.style.display = 'block';
    return;
  }

  var checkedDocs = gatherCheckedDocs();
  var allDocs = checkedDocs.concat(newCustomDocs);
  if (allDocs.length === 0) allDocs = ['Photo', 'ID Proof'];

  var aadhaarRequired = checkedDocs.indexOf('Aadhaar Card') !== -1;

  const newService = {
    name: name,
    type: type,
    price: price,
    partnerPrice: partnerPrice,
    desc: desc,
    requestTypes: requestTypes,
    docs: allDocs,
    enabled: enabled,
    maintenance: maintenance,
    paymentEnabled: paymentEnabled,
    instructions: instructions,
    aadhaarRequired: aadhaarRequired,
    sampleFiles: newSvcTempFiles.slice()
  };

  adminServices.push(newService);
  saveAdminServices();
  closeModal('addServiceModal');
  renderServices();
  toast(name + ' added successfully!');
}

// ---- Payments ----
async function renderPayments(data) {
  var allPayments = [];

  // Load wallet transactions from Firestore
  try {
    var walletDocs = await fsGetCollection('partnerWallets');
    walletDocs.forEach(function(wDoc) {
      var partnerId = wDoc._id;
      var txns = wDoc.txns || [];
      txns.forEach(function(t) {
        allPayments.push({
          id: t.id,
          app: t.app,
          partner: partnerId,
          method: t.method || 'Wallet',
          amount: Math.abs(t.amount),
          status: t.status || 'Success',
          gateway: t.gateway || '—',
          date: t.date
        });
      });
    });
  } catch(e) { console.error('Failed to load wallet txns:', e); }

  // Load Partner ID purchases from Firestore
  try {
    var partnerIdDocs = await fsGetCollection('partnerIds');
    partnerIdDocs.forEach(function(b) {
      if (!b.createdAt) return;
      var d = new Date(b.createdAt);
      allPayments.push({
        id: b.paymentId || 'PID-' + Date.now(),
        app: 'Partner ID — ' + b.partnerId,
        partner: b.name || '—',
        method: 'Razorpay',
        amount: b.price || 0,
        status: 'Success',
        gateway: b.paymentId || '—',
        date: d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      });
    });
  } catch(e) { console.error('Failed to load partner ID purchases:', e); }

  // Also load from payments collection (from signup flow)
  try {
    var paymentDocs = await fsGetCollection('payments');
    paymentDocs.forEach(function(p) {
      var exists = allPayments.find(function(x) { return x.id === p.id; });
      if (!exists) {
        allPayments.push({
          id: p.id,
          app: p.type === 'partner_id' ? 'Partner ID' : (p.app || '—'),
          partner: p.partner || '—',
          method: p.method || 'Razorpay',
          amount: p.amount || 0,
          status: p.status || 'Success',
          gateway: p.gateway || '—',
          date: p.date ? new Date(p.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : ''
        });
      }
    });
  } catch(e) {}

  const list = data || allPayments;
  const el = document.getElementById('paymentRows');
  if (!el) return;
  if (list.length === 0) {
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No payments found</td></tr>';
    return;
  }
  el.innerHTML = list.map(p => `
    <tr>
      <td><b>${p.id}</b></td>
      <td>${p.app}</td>
      <td>${p.partner}</td>
      <td>${p.method}</td>
      <td>₹${p.amount}</td>
      <td><span class="badge badge-${p.status==='Success'?'completed':p.status==='Pending'?'pending':p.status==='Refunded'?'correction':'rejected'}">${p.status}</span></td>
      <td style="font-size:11px;color:var(--text-muted)">${p.gateway}</td>
      <td>${p.date}</td>
    </tr>
  `).join('');
}

function filterPayments(search, status) {
  renderPayments();
}

// ---- Documents ----
function renderDocRows() {
  const docs = [];
  adminApps.forEach(a => {
    (a.docs || []).forEach((d, docIdx) => {
      docs.push({ ...d, appId: a.id, customer: a.customer, partner: a.partner, partnerName: a.partnerName || a.partner, date: a.submitted, docIdx: docIdx });
    });
  });
  const el = document.getElementById('docRows');
  if (!el) return;
  if (docs.length === 0) {
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No documents uploaded yet</td></tr>';
    return;
  }
  el.innerHTML = docs.map((d, i) => `
    <tr>
      <td><b>${esc(d.fileName || d.name)}</b></td>
      <td>${d.appId}</td>
      <td>${esc(d.customer)}</td>
      <td>${esc(d.partnerName)} <small style="color:var(--text-muted)">(${d.partner})</small></td>
      <td>${d.name}</td>
      <td>${d.date}</td>
      <td><span class="badge badge-${d.status==='Verified'?'completed':d.status.includes('Correction')||d.status.includes('Reject')?'correction':'pending'}">${d.status}</span></td>
      <td>
        ${d.data ? `<button class="btn btn-sm btn-primary" onclick="downloadDoc('${escAttr(d.appId)}',${d.docIdx})">Download</button>` : `<button class="btn btn-sm btn-secondary" disabled>No File</button>`}
        <button class="btn btn-sm btn-ghost" onclick="verifyDoc('${escAttr(d.appId)}',${d.docIdx})">Verify</button>
        <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="rejectDoc('${escAttr(d.appId)}',${d.docIdx})">Reject</button>
      </td>
    </tr>
  `).join('');
}

function downloadDoc(appId, docIdx) {
  const a = adminApps.find(x => x.id === appId);
  if (!a || !a.docs[docIdx] || !a.docs[docIdx].data) {
    toast('No file data available for download.');
    return;
  }
  const doc = a.docs[docIdx];
  const link = document.createElement('a');
  link.href = doc.data;
  link.download = doc.fileName || doc.name + '.file';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast('Downloading: ' + (doc.fileName || doc.name));
}

function verifyDoc(appId, docIdx) {
  const a = adminApps.find(x => x.id === appId);
  if (!a || !a.docs[docIdx]) return;
  a.docs[docIdx].status = 'Verified';
  saveAdminApps();
  syncAppToPartner(a);
  renderDocRows();
  toast('Document "' + a.docs[docIdx].name + '" verified.');
  // Re-render review modal if open
  var rm = document.getElementById('reviewModal');
  if (rm && rm.classList.contains('open')) adminReviewApp(appId);
}

function rejectDoc(appId, docIdx) {
  const a = adminApps.find(x => x.id === appId);
  if (!a || !a.docs[docIdx]) return;
  a.docs[docIdx].status = 'Correction Needed';
  saveAdminApps();
  syncAppToPartner(a);
  renderDocRows();
  toast('Document "' + a.docs[docIdx].name + '" needs correction.');
  var rm = document.getElementById('reviewModal');
  if (rm && rm.classList.contains('open')) adminReviewApp(appId);
}

// ---- Upload Result Files ----
var uploadResultFiles = [];

function openUploadResult(appId) {
  document.getElementById('uploadResultAppId').value = appId;
  document.getElementById('uploadResultError').style.display = 'none';
  document.getElementById('uploadResultFileList').innerHTML = '';
  document.getElementById('uploadResultInput').value = '';
  uploadResultFiles = [];
  document.getElementById('uploadResultTitle').textContent = appId + ' — Upload Result Files';
  document.getElementById('uploadResultModal').classList.add('open');
}

function handleUploadResultFiles(input) {
  var files = Array.from(input.files);
  files.forEach(function(f) {
    if (f.size > 50 * 1024 * 1024) { toast(f.name + ' too large (max 50MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      uploadResultFiles.push({ name: f.name, size: f.size, type: f.type, data: e.target.result });
      renderUploadResultList();
    };
    reader.readAsDataURL(f);
  });
  input.value = '';
}

function renderUploadResultList() {
  var el = document.getElementById('uploadResultFileList');
  el.innerHTML = uploadResultFiles.map(function(f, i) {
    return '<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:6px">' +
      '<span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ' + escHtml(f.name) + ' <small style="color:var(--text-muted)">(' + Math.round(f.size/1024) + 'KB)</small></span>' +
      '<button class="btn btn-sm btn-ghost" style="color:var(--danger);padding:2px 6px" onclick="uploadResultFiles.splice('+i+',1);renderUploadResultList()">×</button>' +
    '</div>';
  }).join('');
}

function submitUploadResult() {
  var appId = document.getElementById('uploadResultAppId').value;
  var a = adminApps.find(function(x) { return x.id === appId; });
  if (!a) return;

  if (uploadResultFiles.length === 0) {
    document.getElementById('uploadResultError').textContent = 'Please upload at least one file.';
    document.getElementById('uploadResultError').style.display = 'block';
    return;
  }

  var note = document.getElementById('adminNoteInput')?.value || a.adminNotes || '';
  var now = new Date();
  var dateOnly = now.toLocaleDateString('en-IN', { dateStyle: 'medium' });

  a.status = 'Completed';
  a.result = uploadResultFiles.map(function(f) { return f.name; });
  a.resultFiles = uploadResultFiles.slice();
  a.adminNotes = note;
  a.updated = dateOnly;

  saveAdminApps();
  syncAppToPartner(a);
  closeModal('uploadResultModal');
  closeModal('reviewModal');
  renderAdminApps();
  renderOverviewQueue();
  updateAdminStats();
  toast(appId + ' completed with ' + uploadResultFiles.length + ' file(s).');
}

function filterDocs(search, status) {
  const docs = [];
  adminApps.forEach(a => {
    (a.docs || []).forEach((d, docIdx) => {
      docs.push({ ...d, appId: a.id, customer: a.customer, partner: a.partner, partnerName: a.partnerName || a.partner, date: a.submitted, docIdx: docIdx });
    });
  });
  let filtered = docs;
  if (search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.appId.toLowerCase().includes(search.toLowerCase()) || (d.customer && d.customer.toLowerCase().includes(search.toLowerCase())));
  if (status) filtered = filtered.filter(d => d.status === status);
  const el = document.getElementById('docRows');
  if (!el) return;
  if (filtered.length === 0) {
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No documents found</td></tr>';
    return;
  }
  el.innerHTML = filtered.map((d, i) => `
    <tr>
      <td><b>${esc(d.fileName || d.name)}</b></td>
      <td>${d.appId}</td>
      <td>${esc(d.customer)}</td>
      <td>${esc(d.partnerName)} <small style="color:var(--text-muted)">(${d.partner})</small></td>
      <td>${d.name}</td>
      <td>${d.date}</td>
      <td><span class="badge badge-${d.status==='Verified'?'completed':d.status.includes('Correction')||d.status.includes('Reject')?'correction':'pending'}">${d.status}</span></td>
      <td>
        ${d.data ? `<button class="btn btn-sm btn-primary" onclick="downloadDoc('${escAttr(d.appId)}',${d.docIdx})">Download</button>` : `<button class="btn btn-sm btn-secondary" disabled>No File</button>`}
        <button class="btn btn-sm btn-ghost" onclick="verifyDoc('${escAttr(d.appId)}',${d.docIdx})">Verify</button>
        <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="rejectDoc('${escAttr(d.appId)}',${d.docIdx})">Reject</button>
      </td>
    </tr>
  `).join('');
}

// ---- Modal Close ----
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); }
var _reviewModal = document.getElementById('reviewModal'); if (_reviewModal) _reviewModal.onclick = (e) => { if (e.target === _reviewModal) closeModal('reviewModal'); };
var _partnerModal = document.getElementById('partnerModal'); if (_partnerModal) _partnerModal.onclick = (e) => { if (e.target === _partnerModal) closeModal('partnerModal'); };
var _docModal = document.getElementById('docModal'); if (_docModal) _docModal.onclick = (e) => { if (e.target === _docModal) closeModal('docModal'); };

// ---- Event Delegation for XSS-safe buttons ----
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-admin-review]');
  if (btn) {
    adminReviewApp(btn.getAttribute('data-admin-review'));
  }
});
var _editServiceModal = document.getElementById('editServiceModal'); if (_editServiceModal) _editServiceModal.onclick = (e) => { if (e.target === _editServiceModal) closeModal('editServiceModal'); };

// ---- Utility ----
function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---- Settings Tabs ----
function switchSettingsTab(tab, el) {
  document.querySelectorAll('.settings-tab').forEach(t => { t.style.display = 'none'; t.classList.remove('active'); });
  document.getElementById('settingsTab_' + tab).style.display = 'block';
  document.getElementById('settingsTab_' + tab).classList.add('active');
  document.querySelectorAll('#settingsTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
}

async function saveSettings(section) {
  try {
    if (section === 'General') {
      var data = {
        partnerIdPrice: parseInt(document.getElementById('settPartnerIdPrice').value) || 499,
        partnerPrefix: document.getElementById('settPartnerPrefix').value || 'MCS-'
      };
      await fsSetDoc('settings', 'general', data);
    } else if (section === 'Branding') {
      var data = {
        siteName: document.getElementById('settSiteName') ? document.getElementById('settSiteName').value : '',
        tagline: document.getElementById('settTagline') ? document.getElementById('settTagline').value : '',
        logoUrl: document.getElementById('settLogo') ? document.getElementById('settLogo').value : ''
      };
      await fsSetDoc('settings', 'branding', data);
    } else if (section === 'WhatsApp') {
      var data = {
        number: document.getElementById('settWhatsapp') ? document.getElementById('settWhatsapp').value : '',
        message: document.getElementById('settWhatsappMsg') ? document.getElementById('settWhatsappMsg').value : ''
      };
      await fsSetDoc('settings', 'whatsapp', data);
    } else if (section === 'Notifications') {
      var data = {
        emailEnabled: document.getElementById('settEmailNotif') ? document.getElementById('settEmailNotif').checked : true,
        smsEnabled: document.getElementById('settSmsNotif') ? document.getElementById('settSmsNotif').checked : false
      };
      await fsSetDoc('settings', 'notifications', data);
    } else {
      await fsSetDoc('settings', section.toLowerCase(), { updated: new Date().toISOString() });
    }
    toast(section + ' settings saved successfully!');
  } catch(e) {
    console.error('Failed to save settings:', e);
    toast('Save failed. Check connection.');
  }
}

// ---- Theme ----
function applyTheme() {
  const primary = document.getElementById('settThemePrimary').value;
  const bg = document.getElementById('settThemeBg').value;
  const text = document.getElementById('settThemeText').value;
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--text', text);
  // Convert hex to rgba for proper alpha
  const r = parseInt(primary.slice(1,3),16), g = parseInt(primary.slice(3,5),16), b = parseInt(primary.slice(5,7),16);
  document.documentElement.style.setProperty('--primary-light', `rgba(${r},${g},${b},0.08)`);
  toast('Theme applied! Colors updated across the panel.');
}

function applyCustomCSS() {
  const css = document.getElementById('settCustomCSS').value;
  let el = document.getElementById('customCSSEl');
  if (!el) { el = document.createElement('style'); el.id = 'customCSSEl'; document.head.appendChild(el); }
  el.textContent = css;
  toast('Custom CSS applied!');
}

// ---- Branding Preview ----
document.getElementById('settBrandColor')?.addEventListener('input', function() {
  document.getElementById('settBrandColorHex').value = this.value;
  document.documentElement.style.setProperty('--primary', this.value);
  // Update preview
  const previewLogo = document.getElementById('previewLogo');
  const previewBtn = document.getElementById('previewBtn');
  if (previewLogo) previewLogo.style.background = this.value;
  if (previewBtn) previewBtn.style.background = this.value;
});
document.getElementById('settBrandColorHex')?.addEventListener('input', function() {
  if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
    document.getElementById('settBrandColor').value = this.value;
    document.documentElement.style.setProperty('--primary', this.value);
  }
});
document.getElementById('settBrandColor2')?.addEventListener('input', function() {
  document.getElementById('settBrandColor2Hex').value = this.value;
});
document.getElementById('settThemePrimary')?.addEventListener('input', function() {
  document.getElementById('settThemePrimaryHex').value = this.value;
});
document.getElementById('settThemeBg')?.addEventListener('input', function() {
  document.getElementById('settThemeBgHex').value = this.value;
});
document.getElementById('settThemeText')?.addEventListener('input', function() {
  document.getElementById('settThemeTextHex').value = this.value;
});

// ---- Site Status ----
let maintenanceMode = false;
// Load maintenance status from Firestore on init
fsGetDoc('settings', 'maintenance').then(function(doc) {
  if (doc && doc.enabled === true) { maintenanceMode = true; initMaintenanceUI(); }
}).catch(function() {});
function initMaintenanceUI() {
  const el = document.getElementById('maintenanceStatus');
  if (el) {
    el.textContent = maintenanceMode ? 'ON' : 'OFF';
    el.style.color = maintenanceMode ? 'var(--danger)' : 'var(--success)';
  }
}
function toggleMaintenanceMode() {
  maintenanceMode = !maintenanceMode;
  fsSetDoc('settings', 'maintenance', { enabled: maintenanceMode }).catch(function(){});
  initMaintenanceUI();
  toast(maintenanceMode ? '⚠ Maintenance mode ACTIVATED. Partner portal shows maintenance page.' : '✓ Maintenance mode DEACTIVATED. Portal is live.');
}

function simulateServerDown() {
  document.getElementById('sysStatus').textContent = 'Degraded';
  document.getElementById('sysStatus').style.color = 'var(--warning)';
  toast('⚠ Simulated server degradation. Click again to restore.');
  setTimeout(() => {
    document.getElementById('sysStatus').textContent = 'Operational';
    document.getElementById('sysStatus').style.color = 'var(--success)';
  }, 5000);
}

// ---- WhatsApp ----
function testWhatsApp() {
  toast('WhatsApp notifications are disabled. Login system is active.');
}

function sendWhatsAppNotification(type, data) {
  // WhatsApp notifications disabled — login system active
  // Notification sent
}

// ---- Change Admin Password ----
async function changeAdminPassword() {
  const current = document.getElementById('settCurrentPass').value;
  const newPass = document.getElementById('settNewPass').value;
  const confirm = document.getElementById('settConfirmPass').value;
  const errEl = document.getElementById('passError');
  const okEl = document.getElementById('passSuccess');

  errEl.style.display = 'none';
  okEl.style.display = 'none';

  const stored = localStorage.getItem('mohini_admin_pass');

  if (!current) {
    errEl.textContent = 'Please enter current password';
    errEl.style.display = 'block';
    return;
  }

  const hashedCurrent = await hashPassword(current);
  if (hashedCurrent !== stored) {
    errEl.textContent = 'Current password is incorrect';
    errEl.style.display = 'block';
    return;
  }
  if (newPass.length < 4) {
    errEl.textContent = 'New password must be at least 4 characters';
    errEl.style.display = 'block';
    return;
  }
  if (newPass !== confirm) {
    errEl.textContent = 'New passwords do not match';
    errEl.style.display = 'block';
    return;
  }

  const hashedNew = await hashPassword(newPass);
  localStorage.setItem('mohini_admin_pass', hashedNew);
  sessionStorage.setItem('mohini_admin_auth', hashedNew);

  okEl.textContent = 'Password updated successfully! New password will be required on next login.';
  okEl.style.display = 'block';
  document.getElementById('settCurrentPass').value = '';
  document.getElementById('settNewPass').value = '';
  document.getElementById('settConfirmPass').value = '';
  toast('Admin password updated!');
}

// ---- Support Tickets ----
function renderAdminTickets() {
  var el = document.getElementById('adminTickets');
  if (!el) return;
  el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">Loading tickets...</td></tr>';

  // Load tickets from all partnerApps docs
  var allTickets = [];
  fsGetCollection('partnerApps').then(function(docs) {
    docs.forEach(function(d) {
      var tickets = d.tickets || [];
      tickets.forEach(function(t) { allTickets.push(t); });
    });
    allTickets.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    if (allTickets.length === 0) {
      el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No support tickets</td></tr>';
      return;
    }
    el.innerHTML = allTickets.map(function(t) {
      return '<tr>' +
        '<td><b>' + esc(t.id) + '</b></td>' +
        '<td>' + esc(t.appId) + '</td>' +
        '<td>' + esc(t.partnerId) + '</td>' +
        '<td>' + esc(t.type) + '</td>' +
        '<td>' + esc(t.desc.substring(0, 50)) + (t.desc.length > 50 ? '...' : '') + '</td>' +
        '<td><span class="badge badge-' + (t.status === 'Open' ? 'submitted' : t.status === 'Replied' ? 'completed' : 'pending') + '">' + esc(t.status) + '</span></td>' +
        '<td style="font-size:11px;color:var(--text-muted)">' + esc(t.date) + '</td>' +
        '<td><button class="btn btn-sm btn-primary" onclick="replyTicket(\'' + esc(t.partnerId) + '\',\'' + esc(t.id) + '\')">Reply</button></td>' +
      '</tr>';
    }).join('');
  }).catch(function() {
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">No support tickets</td></tr>';
  });
}

function replyTicket(partnerId, ticketId) {
  var reply = prompt('Enter your reply for ' + ticketId + ':');
  if (!reply || !reply.trim()) return;

  fsGetDoc('partnerApps', partnerId).then(function(doc) {
    var tickets = (doc && doc.tickets) ? doc.tickets : [];
    var ticket = tickets.find(function(t) { return t.id === ticketId; });
    if (ticket) {
      ticket.adminReply = reply.trim();
      ticket.status = 'Replied';
      fsSetDoc('partnerApps', partnerId, { tickets: tickets }).catch(function(){});
      renderAdminTickets();
      toast('Reply sent to ' + ticketId);
    }
  }).catch(function() {
    toast('Error sending reply. Try again.');
  });
}

// ---- Update Admin Stats ----
function updateAdminStats() {
  const total = adminApps.length;
  const processing = adminApps.filter(a => ['Processing','Submitted','Document Checking'].includes(a.status)).length;
  const completed = adminApps.filter(a => a.status === 'Completed').length;
  const revenue = adminApps.filter(a => a.status === 'Completed').reduce((sum, a) => sum + a.amount, 0);
  const el = (id) => document.getElementById(id);
  if (el('adminStatNew')) el('adminStatNew').textContent = total;
  if (el('adminStatProcessing')) el('adminStatProcessing').textContent = processing;
  if (el('adminStatCompleted')) el('adminStatCompleted').textContent = completed;
  if (el('adminStatRevenue')) el('adminStatRevenue').textContent = '₹' + revenue.toLocaleString();
  if (el('payStatRevenue')) el('payStatRevenue').textContent = '₹' + revenue.toLocaleString();
  if (el('payStatSuccess')) el('payStatSuccess').textContent = '₹' + revenue.toLocaleString();
  if (el('payStatPending')) el('payStatPending').textContent = '₹0';
  if (el('payStatRefunded')) el('payStatRefunded').textContent = '₹0';
  if (el('reportTotalApps')) el('reportTotalApps').textContent = total;
  if (el('reportCompRate')) el('reportCompRate').textContent = total > 0 ? Math.round(completed/total*100) + '%' : '0%';
}

// ---- Init ----
function initAdmin() {
  // Load persisted data
  loadAdminApps();
  loadPartners();
  loadAdminServices();
  initMaintenanceUI();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.addEventListener('click', function() { switchView(b.dataset.view); });
  });
  var mb = document.getElementById('mobileMenuBtn');
  if (mb) mb.onclick = function() { document.getElementById('sidebar').classList.toggle('open'); };

  // Notifications
  var nb = document.getElementById('notifBtn');
  if (nb) nb.onclick = function(e) { e.stopPropagation(); document.getElementById('notifDropdown').classList.toggle('show'); };
  document.addEventListener('click', function() {
    var dd = document.getElementById('notifDropdown');
    if (dd) dd.classList.remove('show');
  });

  // Branding color sync
  var bc1 = document.getElementById('settBrandColor');
  var bc1h = document.getElementById('settBrandColorHex');
  if (bc1 && bc1h) bc1.addEventListener('input', function() { bc1h.value = this.value; });
  var bc2 = document.getElementById('settBrandColor2');
  var bc2h = document.getElementById('settBrandColor2Hex');
  if (bc2 && bc2h) bc2.addEventListener('input', function() { bc2h.value = this.value; });

  // Theme color sync
  var tp = document.getElementById('settThemePrimary');
  var tph = document.getElementById('settThemePrimaryHex');
  if (tp && tph) tp.addEventListener('input', function() { tph.value = this.value; });
  var tb = document.getElementById('settThemeBg');
  var tbh = document.getElementById('settThemeBgHex');
  if (tb && tbh) tb.addEventListener('input', function() { tbh.value = this.value; });
  var tt = document.getElementById('settThemeText');
  var tth = document.getElementById('settThemeTextHex');
  if (tt && tth) tt.addEventListener('input', function() { tth.value = this.value; });

  updateAdminStats();
  renderOverviewQueue();
  renderAdminApps();
  renderPartners();
  renderServices();
  renderPayments();
  renderDocRows();
  renderAdminTickets();
}

function refreshAdminData() {
  loadAdminApps();
  loadPartners();
  loadAdminServices();
  updateAdminStats();
  renderOverviewQueue();
  renderAdminApps();
  renderPartners();
  renderPayments();
  renderServices();
  renderDocRows();
  renderAdminTickets();
  toast('Admin data refreshed!');
}

// ---- Service File Upload Handlers ----
function handleNewSvcFiles(input) {
  var files = Array.from(input.files);
  files.forEach(function(f) {
    if (f.size > 10 * 1024 * 1024) { toast(f.name + ' is too large (max 10MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      newSvcTempFiles.push({ name: f.name, size: f.size, type: f.type, data: e.target.result });
      renderNewSvcFileList();
    };
    reader.readAsDataURL(f);
  });
  input.value = '';
}

function renderNewSvcFileList() {
  var el = document.getElementById('newSvcFileList');
  el.innerHTML = newSvcTempFiles.map(function(f, i) {
    return '<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 10px;font-size:12px">' +
      '<span>' + escHtml(f.name.length > 22 ? f.name.substring(0,22)+'...' : f.name) + '</span>' +
      '<button class="btn btn-sm btn-ghost" style="color:var(--danger);padding:0;font-size:14px" onclick="newSvcTempFiles.splice('+i+',1);renderNewSvcFileList()">×</button>' +
    '</div>';
  }).join('');
}

function handleEditSvcFiles(input) {
  var files = Array.from(input.files);
  files.forEach(function(f) {
    if (f.size > 10 * 1024 * 1024) { toast(f.name + ' is too large (max 10MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      editSvcTempFiles.push({ name: f.name, size: f.size, type: f.type, data: e.target.result });
      renderEditSvcFileList();
    };
    reader.readAsDataURL(f);
  });
  input.value = '';
}

function renderEditSvcFileList() {
  var el = document.getElementById('editSvcFileList');
  el.innerHTML = editSvcTempFiles.map(function(f, i) {
    return '<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 10px;font-size:12px">' +
      '<span>' + escHtml(f.name.length > 22 ? f.name.substring(0,22)+'...' : f.name) + '</span>' +
      '<button class="btn btn-sm btn-ghost" style="color:var(--danger);padding:0;font-size:14px" onclick="editSvcTempFiles.splice('+i+',1);renderEditSvcFileList()">×</button>' +
    '</div>';
  }).join('');
}

function removeSvcFile(svcIdx, fileIdx) {
  adminServices[svcIdx].sampleFiles.splice(fileIdx, 1);
  saveAdminServices();
  renderServices();
  toast('File removed.');
}
