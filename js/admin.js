/* ============================================
   MOHINI CSC — Admin Panel Logic
   ============================================ */

// ---- Demo Data ----
let adminApps = [];

let partners = [];

let adminServices = [
  { name:'Aadhaar Update', type:'Aadhaar', desc:'Update request & document collection', price:120, partnerPrice:100, enabled:true, maintenance:false, paymentEnabled:true,
    requestTypes:[
      {name:'Address Update',price:100,partnerPrice:80, docs:['Existing Aadhaar Copy','New Address Proof','Photo'], instructions:'Naya address proof mandatory hai — electricity bill, water bill ya bank statement.', fields:[{label:'New Address',required:true},{label:'Old Address',required:true}]},
      {name:'Name Update',price:120,partnerPrice:100, docs:['Existing Aadhaar Copy','Gazette Certificate','Photo'], instructions:'Name mismatch ke liye gazette notification ya marriage certificate chahiye.', fields:[{label:'New Name',required:true},{label:'Old Name',required:true},{label:'Reason for Change',required:false}]},
      {name:'Date of Birth Update',price:120,partnerPrice:100, docs:['Existing Aadhaar Copy','Birth Certificate','Photo'], instructions:'Birth certificate ya 10th marksheet lagana hai.', fields:[{label:'New Date of Birth',required:true},{label:'Old Date of Birth',required:true}]},
      {name:'Mobile / Email Update',price:80,partnerPrice:60, docs:['Existing Aadhaar Copy','Photo'], instructions:'Mobile number verify karna hai.', fields:[{label:'New Mobile Number',required:true}]},
      {name:'New Application',price:150,partnerPrice:120, docs:['Proof of Identity','Proof of Address','Photo'], instructions:'Naya Aadhaar banane ke liye identity aur address proof chahiye.', fields:[{label:'Full Name',required:true},{label:'Father / Guardian Name',required:false}]},
      {name:'Other Correction',price:120,partnerPrice:100, docs:['Existing Aadhaar Copy','Supporting Document','Photo'], instructions:'Correction ke liye supporting document lagana hai.', fields:[{label:'Correction Details',required:true}]}
    ],
    docs:['Existing Aadhaar Copy','Proof of Identity / Address','Additional Supporting Document'], instructions:'Verify all documents carefully. Cross-check customer details with Aadhaar database.' },
  { name:'PAN Services', type:'PAN', desc:'New / correction assistance', price:80, partnerPrice:65, enabled:true, maintenance:false, paymentEnabled:true,
    requestTypes:[
      {name:'New PAN Card',price:100,partnerPrice:80, docs:['Aadhaar Copy','Photo','Signature'], instructions:'Naya PAN banane ke liye Aadhaar mandatory hai.', fields:[{label:'Full Name',required:true},{label:'Date of Birth',required:true},{label:'Father Name',required:true}]},
      {name:'PAN Correction',price:80,partnerPrice:65, docs:['Old PAN Copy','Aadhaar Copy','Supporting Document'], instructions:'Correction ke liye old PAN aur supporting document chahiye.', fields:[{label:'What to Correct',required:true},{label:'Correct Value',required:true}]},
      {name:'PAN Update',price:60,partnerPrice:45, docs:['PAN Card Copy','Aadhaar Copy'], instructions:'Update ke liye PAN aur Aadhaar dono chahiye.', fields:[{label:'What to Update',required:true},{label:'New Value',required:true}]},
      {name:'Other',price:80,partnerPrice:65, docs:['PAN Card Copy','Supporting Document'], instructions:'Other PAN services ke liye document verification hoga.', fields:[{label:'Details',required:true}]}
    ],
    docs:['Proof of Identity','Photograph','Aadhaar Copy'], instructions:'Check PAN eligibility. Verify photo quality.' },
  { name:'Ration Services', type:'Ration', desc:'Application assistance', price:70, partnerPrice:55, enabled:true, maintenance:false, paymentEnabled:true,
    requestTypes:[
      {name:'New Ration Card',price:100,partnerPrice:80, docs:['Address Proof','Identity Proof','Income Certificate'], instructions:'Naya ration card ke liye income certificate zaroori hai.', fields:[{label:'Family Head Name',required:true},{label:'Family Members Count',required:true},{label:'Address',required:true}]},
      {name:'Member Addition',price:60,partnerPrice:45, docs:['Ration Card Copy','New Member Aadhaar','Birth Certificate'], instructions:'Naye member ka Aadhaar aur birth certificate chahiye.', fields:[{label:'New Member Name',required:true},{label:'Relationship',required:true},{label:'Date of Birth',required:true}]},
      {name:'Member Removal',price:50,partnerPrice:40, docs:['Ration Card Copy','Request Letter'], instructions:'Member removal ke liye request letter chahiye.', fields:[{label:'Member Name to Remove',required:true},{label:'Reason',required:false}]},
      {name:'Address Update',price:70,partnerPrice:55, docs:['Ration Card Copy','New Address Proof'], instructions:'Naya address proof mandatory hai.', fields:[{label:'New Address',required:true},{label:'Old Address',required:true}]},
      {name:'Other',price:70,partnerPrice:55, docs:['Ration Card Copy','Supporting Document'], instructions:'Other ration services ke liye document verification hoga.', fields:[{label:'Details',required:true}]}
    ],
    docs:['Ration Card Copy','Address Proof','Identity Proof'], instructions:'Verify family details and address.' },
  { name:'Bill Payment', type:'Bill Payment', desc:'Electricity & utility requests', price:25, partnerPrice:20, enabled:true, maintenance:false, paymentEnabled:true,
    requestTypes:[
      {name:'Electricity Bill',price:25,partnerPrice:20, docs:['Previous Bill Copy'], instructions:'Bill number aur amount verify karna hai.', fields:[{label:'Consumer Number',required:true},{label:'Bill Amount',required:true}]},
      {name:'Water Bill',price:25,partnerPrice:20, docs:['Previous Bill Copy'], instructions:'Water bill consumer number verify karna hai.', fields:[{label:'Consumer Number',required:true},{label:'Bill Amount',required:true}]},
      {name:'Gas Bill',price:25,partnerPrice:20, docs:['Previous Bill Copy'], instructions:'Gas bill consumer number verify karna hai.', fields:[{label:'Consumer Number',required:true},{label:'Bill Amount',required:true}]},
      {name:'Mobile Recharge',price:15,partnerPrice:10, docs:[], instructions:'Mobile number aur operator verify karna hai.', fields:[{label:'Mobile Number',required:true},{label:'Operator',required:true},{label:'Recharge Amount',required:true}]},
      {name:'DTH Recharge',price:15,partnerPrice:10, docs:[], instructions:'DTH customer ID verify karna hai.', fields:[{label:'Customer ID',required:true},{label:'Recharge Amount',required:true}]},
      {name:'Other',price:25,partnerPrice:20, docs:['Previous Bill Copy'], instructions:'Other bill payment ke liye bill copy chahiye.', fields:[{label:'Details',required:true},{label:'Bill Amount',required:true}]}
    ],
    docs:['Previous Bill Copy','Account Number Proof'], instructions:'Verify account number before processing.' },
  { name:'Other CSC Service', type:'Other', desc:'Configure additional services later', price:100, partnerPrice:80, enabled:false, maintenance:false, paymentEnabled:true,
    requestTypes:[
      {name:'New Application',price:100,partnerPrice:80, docs:['Supporting Document 1'], instructions:'Configure instructions for this service.', fields:[{label:'Details',required:true}]},
      {name:'Update',price:80,partnerPrice:60, docs:['Supporting Document 1'], instructions:'Configure instructions for this service.', fields:[{label:'Details',required:true}]},
      {name:'Correction',price:80,partnerPrice:60, docs:['Supporting Document 1'], instructions:'Configure instructions for this service.', fields:[{label:'Details',required:true}]},
      {name:'Other',price:100,partnerPrice:80, docs:['Supporting Document 1'], instructions:'Configure instructions for this service.', fields:[{label:'Details',required:true}]}
    ],
    docs:['Supporting Document 1','Supporting Document 2'], instructions:'Default template — configure per service.' },
];

async function saveAdminServices() {
  console.log('[SAVE-SVC] Saving', adminServices.length, 'services...');
  var promises = adminServices.map(function(s, idx) {
    var docId = s.name.replace(/[\/\.\#\[\]\$]/g, '_');
    var data = {
      name: s.name, type: s.type, price: s.price, partnerPrice: s.partnerPrice || 0,
      desc: s.desc, enabled: s.enabled, maintenance: s.maintenance || false,
      paymentEnabled: s.paymentEnabled !== false, requestTypes: s.requestTypes || [],
      docs: s.docs || [], instructions: s.instructions || '', sampleFiles: s.sampleFiles || [],
      aadhaarRequired: s.aadhaarRequired || false, position: idx
    };
    console.log('[SAVE-SVC] Saving:', s.name, 'docId:', docId, 'reqTypes:', (s.requestTypes||[]).length);
    return fsSetDoc('services', docId, data).then(function() {
      console.log('[SAVE-SVC] OK:', s.name);
    }).catch(function(e) {
      console.error('[SAVE-SVC] FAILED:', s.name, e);
    });
  });
  await Promise.all(promises);
  console.log('[SAVE-SVC] All done');
}

async function loadAdminServices() {
  var defaultsByName = {};
  adminServices.forEach(function(d) { defaultsByName[d.name] = d; });

  try {
    var saved = await fsGetCollection('services');
    console.log('[LOAD-SVC] Firestore returned', saved.length, 'services');
    if (saved && saved.length > 0) {
      adminServices = saved.map(function(s) {
        var result = Object.assign({}, s);
        var def = defaultsByName[result.name];
        var hadReqTypes = result.requestTypes && result.requestTypes.length > 0;
        if (def) {
          if (!result.partnerPrice || result.partnerPrice <= 0) result.partnerPrice = def.partnerPrice;
          if (!result.requestTypes || result.requestTypes.length === 0) {
            result.requestTypes = def.requestTypes.map(function(r) { return Object.assign({}, r); });
          }
          if (!result.docs || result.docs.length === 0) {
            result.docs = def.docs.slice();
          }
          if (typeof result.enabled !== 'boolean') result.enabled = def.enabled;
          if (result.enabled === undefined) result.enabled = def.enabled;
        }
        console.log('[LOAD-SVC]', result.name, 'reqTypes:', (result.requestTypes||[]).length, 'fromFirestore:', hadReqTypes);
        return result;
      });
      adminServices.sort(function(a, b) {
        var pa = typeof a.position === 'number' ? a.position : 999;
        var pb = typeof b.position === 'number' ? b.position : 999;
        return pa - pb;
      });
    }
  } catch(e) {
    console.error('[LOAD-SVC] Failed:', e);
  }
  renderServices();
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
    console.log('[ADMIN] partnerApps docs found:', partnerDocs.length);
    partnerDocs.forEach(function(pData) {
      var partnerUid = pData._id;
      var apps = pData.apps || [];
      console.log('[ADMIN] Partner', partnerUid, 'has', apps.length, 'apps');
      apps.forEach(function(a) {
        // Partner saves partnerId field, admin uses partner field — normalize
        if (!a.partner) {
          a.partner = a.partnerId || partnerUid;
        }
        if (!a.partnerName || a.partnerName === partnerUid) {
          a.partnerName = a.partnerId || 'Partner';
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
          existing.partner = a.partner;
          existing.partnerName = a.partnerName;
          existing.amount = a.amount;
          existing.status = a.status;
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
        uid: u._id,
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
  // partnerApps is stored under Firebase Auth UID, not partnerId
  for (var i = 0; i < partners.length; i++) {
    var p = partners[i];
    try {
      var appDoc = await fsGetDoc('partnerApps', p.uid);
      if (appDoc && appDoc.apps) p.apps = appDoc.apps.length;
    } catch(e) {}
    try {
      var walletDoc = await fsGetDoc('partnerWallets', p.uid);
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
    ${(a.customFields && a.customFields.length > 0) ? '<div style="margin-top:12px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><b style="font-size:12px;color:#475569;display:block;margin-bottom:8px">Additional Details</b>' + a.customFields.map(function(f) { return '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span style="color:#64748b">' + esc(f.label) + '</span><b style="color:#1e293b">' + esc(f.value || '—') + '</b></div>'; }).join('') + '</div>' : ''}
    <div style="margin-top:16px"><b style="font-size:13px;color:var(--navy)">Uploaded Documents</b></div>
    <div class="doc-review-list">${docsHtml || '<p style="font-size:12px;color:var(--text-muted)">No documents uploaded.</p>'}</div>
    ${a.adminMsg ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:12px;margin-top:12px"><b style="font-size:12px;color:#92400e;display:block">Admin Note:</b><p style="font-size:12px;color:#78350f">${esc(a.adminMsg)}</p></div>` : ''}
    ${a.result ? `<div style="background:var(--success-bg);border:1px solid #bbf7d0;border-radius:var(--radius-sm);padding:12px;margin-top:12px"><b style="font-size:12px;color:var(--success);display:block">Result File: ${esc(a.result)}</b></div>` : ''}
    ${(() => { const p = partners.find(x => x.id === a.partner); return (p && (!p.whatsapp || p.whatsapp.length < 10)) ? '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:10px;margin-top:12px"><b style="font-size:12px;color:#92400e">⚠ Partner WhatsApp number missing — result documents may not be delivered.</b></div>' : ''; })()}
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
  var docId = a.ownerUid || a.partnerId || a.partner;
  if (!docId) return;

  fsGetDoc('partnerApps', docId).then(function(doc) {
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
    fsSetDoc('partnerApps', docId, { apps: apps }).catch(function(e){ console.warn('syncAppToPartner failed:', e); });
  }).catch(function(e){ console.warn('syncAppToPartner read failed:', e); });
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

async function togglePartner(id) {
  const p = partners.find(x => x.id === id);
  if (!p) return;
  p.status = p.status === 'Active' ? 'Inactive' : 'Active';
  await savePartners();
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
async function svcDrop(e) {
  e.preventDefault();
  var toIdx = parseInt(e.currentTarget.dataset.idx);
  e.currentTarget.classList.remove('drag-over');
  if (svcDragIdx === null || svcDragIdx === toIdx) return;
  var item = adminServices.splice(svcDragIdx, 1)[0];
  adminServices.splice(toIdx, 0, item);
  svcDragIdx = null;
  renderServices();
  await saveAdminServices();
  toast('Service order updated!');
  await saveAdminServices();
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
    if (typeof r === 'string') return { name: r, price: s.price, partnerPrice: s.partnerPrice, docs: [], instructions: '', fields: [] };
    return { name: r.name, price: r.price || s.price, partnerPrice: r.partnerPrice || s.partnerPrice, docs: r.docs || [], instructions: r.instructions || '', fields: r.fields || [] };
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

async function saveServiceEdit() {
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

  toast('Saving...');
  await saveAdminServices();

  closeModal('editServiceModal');
  renderServices();
  toast(s.name + ' updated successfully.');
}

async function toggleService(idx) {
  adminServices[idx].enabled = !adminServices[idx].enabled;
  renderServices();
  await saveAdminServices();
  toast(adminServices[idx].name + (adminServices[idx].enabled ? ' enabled.' : ' disabled.'));
  await saveAdminServices();
}

async function toggleMaintenance(idx) {
  adminServices[idx].maintenance = !adminServices[idx].maintenance;
  renderServices();
  await saveAdminServices();
  toast(adminServices[idx].name + (adminServices[idx].maintenance ? ' — Maintenance ON' : ' — Maintenance OFF'));
  await saveAdminServices();
}

async function togglePayment(idx) {
  adminServices[idx].paymentEnabled = !adminServices[idx].paymentEnabled;
  renderServices();
  await saveAdminServices();
  toast(adminServices[idx].name + (adminServices[idx].paymentEnabled ? ' — Payment enabled' : ' — Payment disabled (FREE)'));
  await saveAdminServices();
}

async function deleteService(idx) {
  var s = adminServices[idx];
  if (!confirm('Delete "' + s.name + '"?\n\nThis cannot be undone.')) return;
  adminServices.splice(idx, 1);
  renderServices();
  await saveAdminServices();
  toast(s.name + ' deleted.');
  await saveAdminServices();
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
  arr.push({ name: name, price: price, partnerPrice: partnerPrice, docs: [], instructions: '', fields: [] });
  nameEl.value = ''; priceEl.value = ''; partnerPriceEl.value = '';
  renderReqTypes(mode);
}

function removeReqType(mode, idx) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  arr.splice(idx, 1);
  renderReqTypes(mode);
}

var _activeReqTypeEdit = { mode: null, idx: null };

function editReqTypeDetail(mode, idx) {
  // Save previous request type data before switching
  if (_activeReqTypeEdit.mode === mode && _activeReqTypeEdit.idx !== null && _activeReqTypeEdit.idx !== idx) {
    saveReqTypeDetailData(mode);
  }
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[idx];
  _activeReqTypeEdit = { mode: mode, idx: idx };
  var panel = document.getElementById(mode === 'new' ? 'newReqTypeDetail' : 'editReqTypeDetail');
  if (!panel) return;
  var knownDocs = ['Existing Aadhaar Copy','Proof of Identity','Proof of Address','Photo','Signature','Birth Certificate','Address Proof','PAN Card Copy','Old PAN Copy','Aadhaar Copy','Ration Card Copy','Income Certificate','Previous Bill Copy','Account Number Proof','Supporting Document','Gazette Certificate','Marriage Certificate','Bank Passbook','Voter ID'];
  var selectedDocs = r.docs || [];
  panel.innerHTML = '<div style="margin-top:12px;padding:14px;background:#fff;border:1px solid #e2e8f0;border-radius:10px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
    '<b style="font-size:14px;color:#172033">' + escHtml(r.name) + '</b>' +
    '<button onclick="closeReqTypeDetail(\'' + mode + '\')" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px">✕</button></div>' +
    '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:6px">REQUIRED DOCUMENTS</label>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
    knownDocs.map(function(d) {
      return '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#1e293b;cursor:pointer;background:#f8fafc;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px"><input type="checkbox" class="reqtype-doc-cb" value="' + escHtml(d) + '"' + (selectedDocs.indexOf(d) !== -1 ? ' checked' : '') + ' onchange="updateReqTypeDocs(\'' + mode + '\')">' + escHtml(d) + '</label>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:8px"><input type="text" id="reqTypeCustomDoc_' + mode + '" placeholder="Custom document name..." style="flex:1;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">' +
    '<button onclick="addCustomReqTypeDoc(\'' + mode + '\')" style="padding:6px 12px;background:#1665d8;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">+ Add</button></div>' +
    '<div id="reqTypeCustomDocList_' + mode + '" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px"></div></div>' +
    '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:6px">INSTRUCTIONS</label>' +
    '<textarea id="reqTypeInstructions_' + mode + '" rows="3" style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;resize:vertical" placeholder="Instructions for this request type...">' + escHtml(r.instructions || '') + '</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:6px">CUSTOM FIELDS (partner ko fill karna hoga)</label>' +
    '<div id="reqTypeFieldsList_' + mode + '"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px"><input type="text" id="reqTypeFieldLabel_' + mode + '" placeholder="Field label (e.g. New Address)" style="flex:1;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px">' +
    '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#1e293b"><input type="checkbox" id="reqTypeFieldReq_' + mode + '" checked> Required</label>' +
    '<button onclick="addCustomReqTypeField(\'' + mode + '\')" style="padding:6px 12px;background:#1665d8;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">+ Add</button></div></div>' +
    '<button onclick="saveReqTypeDetail(\'' + mode + '\')" style="width:100%;margin-top:12px;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Save Details</button></div>';
  renderReqTypeCustomDocs(mode);
  renderReqTypeFields(mode);
}

function closeReqTypeDetail(mode) {
  var panel = document.getElementById(mode === 'new' ? 'newReqTypeDetail' : 'editReqTypeDetail');
  if (panel) panel.innerHTML = '';
  _activeReqTypeEdit = { mode: null, idx: null };
}

function updateReqTypeDocs(mode) {
  saveReqTypeDetailData(mode);
}

function addCustomReqTypeDoc(mode) {
  var input = document.getElementById('reqTypeCustomDoc_' + mode);
  if (!input) return;
  var name = input.value.trim();
  if (!name) return;
  saveReqTypeDetailData(mode);
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  if (!r.docs) r.docs = [];
  if (r.docs.indexOf(name) === -1) r.docs.push(name);
  input.value = '';
  renderReqTypeCustomDocs(mode);
}

function renderReqTypeCustomDocs(mode) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  var el = document.getElementById('reqTypeCustomDocList_' + mode);
  if (!el || !r) return;
  var knownDocs = ['Existing Aadhaar Copy','Proof of Identity','Proof of Address','Photo','Signature','Birth Certificate','Address Proof','PAN Card Copy','Old PAN Copy','Aadhaar Copy','Ration Card Copy','Income Certificate','Previous Bill Copy','Account Number Proof','Supporting Document','Gazette Certificate','Marriage Certificate','Bank Passbook','Voter ID'];
  var customDocs = (r.docs || []).filter(function(d) { return knownDocs.indexOf(d) === -1; });
  el.innerHTML = customDocs.map(function(d, i) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#dbeafe;color:#1e40af;border-radius:4px;font-size:11px">' + escHtml(d) + ' <button onclick="removeCustomReqTypeDoc(\'' + mode + '\',\'' + escHtml(d) + '\')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:12px">✕</button></span>';
  }).join('');
}

function removeCustomReqTypeDoc(mode, docName) {
  saveReqTypeDetailData(mode);
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  r.docs = (r.docs || []).filter(function(d) { return d !== docName; });
  renderReqTypeCustomDocs(mode);
}

function addCustomReqTypeField(mode) {
  var labelEl = document.getElementById('reqTypeFieldLabel_' + mode);
  var reqEl = document.getElementById('reqTypeFieldReq_' + mode);
  if (!labelEl) return;
  var label = labelEl.value.trim();
  if (!label) return;
  saveReqTypeDetailData(mode);
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  if (!r.fields) r.fields = [];
  r.fields.push({ label: label, required: reqEl ? reqEl.checked : true });
  labelEl.value = '';
  renderReqTypeFields(mode);
}

function renderReqTypeFields(mode) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  var el = document.getElementById('reqTypeFieldsList_' + mode);
  if (!el || !r) return;
  var fields = r.fields || [];
  el.innerHTML = fields.map(function(f, i) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:4px;font-size:12px">' +
      '<span style="flex:1;color:#1e293b">' + escHtml(f.label) + '</span>' +
      '<span style="color:' + (f.required ? '#dc2626' : '#64748b') + ';font-size:11px">' + (f.required ? 'Required' : 'Optional') + '</span>' +
      '<button onclick="removeCustomReqTypeField(\'' + mode + '\',' + i + ')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:14px">✕</button></div>';
  }).join('');
}

function removeCustomReqTypeField(mode, idx) {
  saveReqTypeDetailData(mode);
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  r.fields.splice(idx, 1);
  renderReqTypeFields(mode);
}

function saveReqTypeDetailData(mode) {
  if (!_activeReqTypeEdit.mode || _activeReqTypeEdit.mode !== mode) return;
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var r = arr[_activeReqTypeEdit.idx];
  if (!r) return;
  var docCbs = document.querySelectorAll('.reqtype-doc-cb:checked');
  var knownDocs = ['Existing Aadhaar Copy','Proof of Identity','Proof of Address','Photo','Signature','Birth Certificate','Address Proof','PAN Card Copy','Old PAN Copy','Aadhaar Copy','Ration Card Copy','Income Certificate','Previous Bill Copy','Account Number Proof','Supporting Document','Gazette Certificate','Marriage Certificate','Bank Passbook','Voter ID'];
  var checkedDocs = Array.from(docCbs).map(function(cb) { return cb.value; });
  var customDocs = (r.docs || []).filter(function(d) { return knownDocs.indexOf(d) === -1; });
  r.docs = checkedDocs.concat(customDocs);
  var instrEl = document.getElementById('reqTypeInstructions_' + mode);
  if (instrEl) r.instructions = instrEl.value;
}

function saveReqTypeDetail(mode) {
  saveReqTypeDetailData(mode);
  renderReqTypes(mode);
  closeReqTypeDetail(mode);
  toast('Request type details saved!');
}

function renderReqTypes(mode) {
  var arr = mode === 'new' ? newReqTypes : editReqTypes;
  var el = document.getElementById(mode === 'new' ? 'newSvcReqTypes' : 'editSvcReqTypes');
  if (!el) return;
  if (arr.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = arr.map(function(r, i) {
    var docCount = (r.docs || []).length;
    var fieldCount = (r.fields || []).length;
    return '<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px;color:#172033">' +
      '<div style="display:flex;align-items:center;gap:6px">' +
      '<b style="flex:1">' + escHtml(r.name) + '</b>' +
      '<span style="color:#64748b">₹' + r.price + '</span>' +
      '<span style="color:var(--primary)">P: ₹' + r.partnerPrice + '</span>' +
      '<button onclick="editReqTypeDetail(\'' + mode + '\',' + i + ')" style="background:none;border:none;color:#1665d8;cursor:pointer;font-size:13px;padding:2px 6px" title="Edit details">✏️</button>' +
      '<button onclick="removeReqType(\'' + mode + '\',' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0">✕</button></div>' +
      (docCount > 0 || fieldCount > 0 ? '<div style="margin-top:4px;display:flex;gap:8px;font-size:10px;color:#64748b">' +
        (docCount > 0 ? '<span>📄 ' + docCount + ' docs</span>' : '') +
        (fieldCount > 0 ? '<span>📝 ' + fieldCount + ' fields</span>' : '') +
        (r.instructions ? '<span>📋 Has instructions</span>' : '') +
        '</div>' : '') +
      '</div>';
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

async function addNewService() {
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
  toast('Saving...');
  await saveAdminServices();
  closeModal('addServiceModal');
  renderServices();
  toast(name + ' added successfully!');
}

// ---- Payments ----
async function renderPayments(data, search, statusFilter) {
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

  var filtered = allPayments;
  if (search) {
    filtered = filtered.filter(function(p) {
      return (p.id || '').toLowerCase().includes(search) ||
             (p.app || '').toLowerCase().includes(search) ||
             (p.partner || '').toLowerCase().includes(search) ||
             (p.gateway || '').toLowerCase().includes(search);
    });
  }
  if (statusFilter) {
    filtered = filtered.filter(function(p) { return p.status === statusFilter; });
  }
  const list = data || filtered;
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

function filterPayments() {
  var search = (document.getElementById('paymentSearch')?.value || '').toLowerCase();
  var statusF = document.getElementById('paymentFilterStatus')?.value || '';
  renderPayments(null, search, statusF);
}

// ---- Documents ----
function renderDocRows() {
  var filterSearch = (window._docFilterSearch || '').toLowerCase();
  var filterStatus = window._docFilterStatus || '';
  // Group documents by application
  var groups = {};
  adminApps.forEach(function(a) {
    if (!a.docs || a.docs.length === 0) return;
    // Filter: check if any doc matches search/status
    var filteredDocs = a.docs;
    if (filterStatus) {
      filteredDocs = filteredDocs.filter(function(d) { return d.status === filterStatus; });
    }
    if (filteredDocs.length === 0) return;
    if (filterSearch) {
      var matchApp = (a.id || '').toLowerCase().indexOf(filterSearch) !== -1;
      var matchCustomer = (a.customer || '').toLowerCase().indexOf(filterSearch) !== -1;
      var matchPartner = (a.partnerName || '').toLowerCase().indexOf(filterSearch) !== -1 || (a.partner || '').toLowerCase().indexOf(filterSearch) !== -1;
      var matchService = (a.service || '').toLowerCase().indexOf(filterSearch) !== -1;
      var matchDoc = filteredDocs.some(function(d) { return (d.name || '').toLowerCase().indexOf(filterSearch) !== -1 || (d.fileName || '').toLowerCase().indexOf(filterSearch) !== -1; });
      if (!matchApp && !matchCustomer && !matchPartner && !matchService && !matchDoc) return;
    }
    groups[a.id] = {
      appId: a.id,
      customer: a.customer,
      partner: a.partner,
      partnerName: a.partnerName || a.partner,
      service: a.service,
      request: a.request,
      date: a.submitted,
      submittedTime: a.submittedTime || '',
      docs: filteredDocs
    };
  });
  var el = document.getElementById('docGroups');
  if (!el) return;
  var groupArr = Object.values(groups);
  if (groupArr.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:12px">📄</div><p>No documents uploaded yet</p></div>';
    return;
  }
  // Sort by date descending
  groupArr.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  el.innerHTML = groupArr.map(function(g) {
    var pendingCount = g.docs.filter(function(d) { return d.status === 'Pending Review'; }).length;
    var verifiedCount = g.docs.filter(function(d) { return d.status === 'Verified'; }).length;
    var rejectedCount = g.docs.filter(function(d) { return d.status && d.status.includes('Correction'); }).length;
    var statusColor = pendingCount > 0 ? '#d97706' : rejectedCount > 0 ? '#dc2626' : '#16a34a';
    var statusBg = pendingCount > 0 ? '#fffbeb' : rejectedCount > 0 ? '#fef2f2' : '#f0fdf4';
    var statusText = pendingCount > 0 ? 'Pending Review' : rejectedCount > 0 ? 'Correction Needed' : 'All Verified';
    return '<div style="background:var(--bg-white);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:12px;overflow:hidden">' +
      '<div onclick="toggleDocGroup(this)" style="display:flex;align-items:center;gap:16px;padding:16px 20px;cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
            '<b style="font-size:14px;color:var(--navy)">' + esc(g.appId) + '</b>' +
            '<span style="font-size:12px;color:var(--text-muted)">' + esc(g.service) + (g.request ? ' → ' + esc(g.request) : '') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:16px;font-size:12px;color:var(--text-secondary)">' +
            '<span>👤 ' + esc(g.customer) + '</span>' +
            '<span>🤝 ' + esc(g.partnerName) + ' <span style="color:var(--text-muted)">(' + esc(g.partner) + ')</span></span>' +
            '<span>📅 ' + esc(g.date) + (g.submittedTime ? ' ⏰ ' + esc(g.submittedTime) : '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div style="display:flex;gap:6px;font-size:11px">' +
            '<span style="background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:4px;font-weight:600">' + g.docs.length + ' docs</span>' +
            (pendingCount > 0 ? '<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;font-weight:600">' + pendingCount + ' pending</span>' : '') +
            (verifiedCount > 0 ? '<span style="background:#dcfce7;color:#166534;padding:3px 8px;border-radius:4px;font-weight:600">' + verifiedCount + ' verified</span>' : '') +
          '</div>' +
          '<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:' + statusBg + ';color:' + statusColor + '">' + statusText + '</span>' +
          '<span style="font-size:18px;color:var(--text-muted);transition:transform .2s">▸</span>' +
        '</div>' +
      '</div>' +
      '<div class="doc-group-body" style="display:none;padding:0 20px 16px;border-top:1px solid var(--border-light)">' +
        g.docs.map(function(d, di) {
          var docStatusColor = d.status === 'Verified' ? '#16a34a' : d.status && d.status.includes('Correction') ? '#dc2626' : '#d97706';
          var docStatusBg = d.status === 'Verified' ? '#f0fdf4' : d.status && d.status.includes('Correction') ? '#fef2f2' : '#fffbeb';
          return '<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border-light)">' +
            '<div style="font-size:24px">📄</div>' +
            '<div style="flex:1;min-width:0">' +
              '<b style="font-size:13px;color:var(--navy)">' + esc(d.fileName || d.name) + '</b>' +
              '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + esc(d.name) + ' · ' + (d.size ? Math.round(d.size/1024) + 'KB' : 'N/A') + ' · ' + (d.type || 'file') + '</div>' +
            '</div>' +
            '<span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;background:' + docStatusBg + ';color:' + docStatusColor + '">' + esc(d.status || 'Pending') + '</span>' +
            '<div style="display:flex;gap:6px">' +
              (d.data ? '<button class="btn btn-sm btn-primary" onclick="downloadDoc(\'' + escAttr(g.appId) + '\',' + di + ')">Download</button>' : '<button class="btn btn-sm btn-secondary" disabled>No File</button>') +
              '<button class="btn btn-sm btn-ghost" onclick="verifyDoc(\'' + escAttr(g.appId) + '\',' + di + ')">Verify</button>' +
              '<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="rejectDoc(\'' + escAttr(g.appId) + '\',' + di + ')">Reject</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }).join('');
}

function toggleDocGroup(headerEl) {
  var card = headerEl.parentElement;
  var body = card.querySelector('.doc-group-body');
  var arrow = headerEl.querySelector('span:last-child');
  if (!body) return;
  if (body.style.display === 'none') {
    body.style.display = 'block';
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    body.style.display = 'none';
    if (arrow) arrow.style.transform = '';
  }
}

function downloadDoc(appId, docIdx) {
  const a = adminApps.find(x => x.id === appId);
  if (!a || !a.docs[docIdx]) {
    toast('Document not found.');
    return;
  }
  const doc = a.docs[docIdx];

  // Try base64 data
  if (doc.data) {
    var link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.fileName || doc.name + '.file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Downloading: ' + (doc.fileName || doc.name));
    return;
  }

  // Fallback to base64 data (legacy)
  if (doc.data) {
    var link2 = document.createElement('a');
    link2.href = doc.data;
    link2.download = doc.fileName || doc.name + '.file';
    document.body.appendChild(link2);
    link2.click();
    document.body.removeChild(link2);
    toast('Downloading: ' + (doc.fileName || doc.name));
    return;
  }

  toast('No file available for download. Ask partner to re-upload.');
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
  // Temporarily store search/status for renderDocRows
  window._docFilterSearch = search || '';
  window._docFilterStatus = status || '';
  renderDocRows();
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

// toast defined in admin.html inline script

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
let _maintenanceLoaded = false;
function initMaintenanceUI() {
  const el = document.getElementById('maintenanceStatus');
  if (el) {
    el.textContent = _maintenanceLoaded ? (maintenanceMode ? 'ON' : 'OFF') : 'Loading...';
    el.style.color = maintenanceMode ? 'var(--danger)' : 'var(--success)';
  }
}
async function toggleMaintenanceMode() {
  if (!_maintenanceLoaded) { toast('⏳ Please wait, loading maintenance status...'); return; }
  var newState = !maintenanceMode;
  var btn = document.querySelector('[onclick="toggleMaintenanceMode()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Updating...'; }
  try {
    await fsSetDoc('settings', 'maintenance', { enabled: newState });
    maintenanceMode = newState;
    initMaintenanceUI();
    toast(maintenanceMode ? '⚠ Maintenance mode ACTIVATED. Partner portal shows maintenance page.' : '✓ Maintenance mode DEACTIVATED. Portal is live.');
  } catch(e) {
    console.error('Failed to toggle maintenance:', e);
    toast('❌ Failed to update maintenance mode. Check your connection.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔧 Toggle Maintenance Mode'; }
  }
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
  var maintenancePromise = fsGetDoc('settings', 'maintenance').then(function(doc) {
    if (doc && doc.enabled === true) { maintenanceMode = true; }
    _maintenanceLoaded = true;
  }).catch(function() { _maintenanceLoaded = true; });

  Promise.all([
    loadAdminApps(),
    loadPartners(),
    loadAdminServices(),
    maintenancePromise
  ]).then(function() {
    initMaintenanceUI();
    updateAdminStats();
    renderOverviewQueue();
    renderAdminApps();
    renderPartners();
    renderServices();
    renderPayments();
    renderDocRows();
    renderAdminTickets();
  }).catch(function(e) {
    console.error('Admin init error:', e);
    updateAdminStats();
    renderOverviewQueue();
    renderAdminApps();
    renderPartners();
    renderServices();
    renderPayments();
    renderDocRows();
    renderAdminTickets();
    initMaintenanceUI();
  });

  // Navigation (sync — no need to wait)
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
}
function refreshAdminData() {
  Promise.all([
    loadAdminApps(),
    loadPartners(),
    loadAdminServices()
  ]).then(function() {
    updateAdminStats();
    renderOverviewQueue();
    renderAdminApps();
    renderPartners();
    renderPayments();
    renderServices();
    renderDocRows();
    renderAdminTickets();
    toast('Admin data refreshed!');
  }).catch(function() {
    toast('Refresh completed with errors');
  });
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

async function removeSvcFile(svcIdx, fileIdx) {
  adminServices[svcIdx].sampleFiles.splice(fileIdx, 1);
  renderServices();
  await saveAdminServices();
  toast('File removed.');
  await saveAdminServices();
}
