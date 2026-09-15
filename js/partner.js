/* ============================================
   MOHINI CSC — Partner Portal Logic
   ============================================ */

// ---- Razorpay Config (Test Mode) ----
const RAZORPAY_KEY_ID = 'rzp_test_TbTdqkIM1BJGI4';
const RAZORPAY_NAME = 'Mohini CSC Centre';

// ---- Check Login ----
function checkLogin() {
  const data = localStorage.getItem('mohini_partner_login');
  if (!data) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    const login = JSON.parse(data);
    if (!login.loggedIn) {
      window.location.href = 'login.html';
      return false;
    }
    // Also verify Firebase Auth state
    var fbUser = fbGetUser();
    if (!fbUser) {
      localStorage.removeItem('mohini_partner_login');
      window.location.href = 'login.html';
      return false;
    }
    // Update UI with login info
    const partnerId = login.partnerId || '';
    const userName = login.name || 'Partner';
    document.querySelectorAll('.sidebar-user small').forEach(el => el.textContent = partnerId ? 'ID: ' + partnerId : 'No Partner ID');
    document.querySelectorAll('.profile-pill small').forEach(el => el.textContent = partnerId ? 'Partner ID: ' + partnerId : 'No Partner ID');
    document.querySelectorAll('.avatar-sm').forEach(el => {
      if (el.textContent === 'MC') el.textContent = userName.charAt(0).toUpperCase();
    });
    return true;
  } catch(e) {
    window.location.href = 'login.html';
    return false;
  }
}

function logout() {
  localStorage.removeItem('mohini_partner_login');
  fbSignOut().catch(function() {});
  window.location.href = 'login.html';
}

function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account?\n\nThis will:\n- Delete your login data\n- Delete all your applications\n- Cannot be undone\n\nType OK to confirm.')) return;
  if (!confirm('FINAL WARNING: Your account and ALL data will be permanently deleted. Continue?')) return;

  var password = prompt('Enter your password to confirm deletion:');
  if (!password) { toast('Deletion cancelled.'); return; }

  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var uid = loginData.uid;
  var user = fbGetUser();
  var email = loginData.contact;

  if (!uid || !user) {
    toast('Not logged in. Please login first.');
    return;
  }

  toast('Re-authenticating...');

  // Re-authenticate with password before deleting
  var credential = firebase.auth.EmailAuthProvider.credential(email, password);
  user.reauthenticateWithCredential(credential).then(function() {
    toast('Deleting account...');
    fsDeleteDoc('partnerApps', uid).catch(function(){});
    fsDeleteDoc('partnerWallets', uid).catch(function(){});
    fsDeleteDoc('partners', uid).catch(function(){});
    return user.delete();
  }).then(function() {
    localStorage.removeItem('mohini_partner_login');
    toast('Account deleted.');
    setTimeout(function() { window.location.href = 'login.html'; }, 1000);
  }).catch(function(e) {
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      toast('Wrong password. Deletion cancelled.');
    } else if (e.code === 'auth/requires-recent-login') {
      toast('Session expired. Please login again and then delete.');
    } else {
      toast('Delete failed. Try again.');
    }
  });
}

// ---- Demo Data ----
let applications = [];

// Default services — will be REPLACED by Firestore data when it loads
var services = {
  'Aadhaar Update': { price:120, icon:'A', iconClass:'aadhaar', docs:['Existing Aadhaar Copy','Proof of Identity / Address','Additional Supporting Document'], requestTypes:[{name:'Address Update',price:100},{name:'Name Update',price:120},{name:'New Application',price:150}], hasPartnerId:false },
  'PAN Services': { price:80, icon:'P', iconClass:'pan', docs:['Proof of Identity','Photograph','Aadhaar Copy'], requestTypes:[{name:'New PAN Card',price:100},{name:'PAN Correction',price:80}], hasPartnerId:false },
  'Ration Services': { price:70, icon:'R', iconClass:'ration', docs:['Ration Card Copy','Address Proof','Identity Proof'], requestTypes:[{name:'New Ration Card',price:100},{name:'Member Addition',price:60}], hasPartnerId:false },
  'Bill Payment': { price:25, icon:'₹', iconClass:'bill', docs:['Previous Bill Copy','Account Number Proof'], requestTypes:[{name:'Electricity Bill',price:25}], hasPartnerId:false },
  'Other CSC Service': { price:100, icon:'+', iconClass:'other', docs:['Supporting Document 1','Supporting Document 2'], requestTypes:[{name:'New Application',price:100}], hasPartnerId:false }
};

// Show default services instantly — will be replaced by Firestore data
setTimeout(function() { renderServiceCards(); }, 0);

function loadServicesFromAdmin() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var myPartnerId = loginData.partnerId || '';

  // Partner status is already determined at login — don't re-query partnerIds
  var hasPartnerId = !!myPartnerId;

  return fsGetCollection('services').then(function(adminSvc) {
    if (!adminSvc || adminSvc.length === 0) {
      // Firestore returned nothing — keep default services but apply partner pricing
      Object.keys(services).forEach(function(name) {
        var s = services[name];
        s.hasPartnerId = hasPartnerId;
        if (hasPartnerId && s.partnerPrice) {
          s.originalPrice = s.price;
          s.price = s.partnerPrice;
        }
      });
      renderServiceCards();
      return;
    }
    // Rebuild services from Firestore
    services = {};
    (adminSvc || []).forEach(function(s) {
      if (s.enabled && !s.maintenance) {
        var iconChar = s.name.charAt(0);
        var iconCls = 'other';
        if (s.name.includes('Aadhaar')) { iconChar = 'A'; iconCls = 'aadhaar'; }
        else if (s.name.includes('PAN')) { iconChar = 'P'; iconCls = 'pan'; }
        else if (s.name.includes('Ration')) { iconChar = 'R'; iconCls = 'ration'; }
        else if (s.name.includes('Bill')) { iconChar = '₹'; iconCls = 'bill'; }
        var showPrice = s.paymentEnabled !== false ? (hasPartnerId ? s.partnerPrice : s.price) : 0;
        services[s.name] = { type: s.type || '', price: showPrice, originalPrice: s.price, partnerPrice: s.partnerPrice, hasPartnerId: hasPartnerId, icon: iconChar, iconClass: iconCls, docs: s.docs || ['Photo', 'ID Proof'], paymentEnabled: s.paymentEnabled !== false, maintenance: s.maintenance || false, requestTypes: s.requestTypes || [{name:'New Application', price: s.price, partnerPrice: s.partnerPrice}], instructions: s.instructions || '' };
      }
    });
    renderServiceCards();
  }).catch(function(e) {
    console.error('Failed to load services from Firestore:', e);
    renderServiceCards();
  });
}

function renderServiceCards() {
  var keys = Object.keys(services);
  var serviceDescriptions = {
    'Aadhaar Update': 'Update request & document collection',
    'PAN Services': 'New / correction assistance',
    'Ration Services': 'Application assistance',
    'Bill Payment': 'Electricity & utility requests',
    'Other CSC Service': 'Configure additional services later'
  };

  var html = keys.map(function(name) {
    var s = services[name];
    var desc = serviceDescriptions[name] || 'CSC Service';
    var escName = escHtml(name);
    var escType = s.type ? ' <span style="display:inline-block;background:rgba(22,101,216,.08);color:var(--primary);font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;vertical-align:middle">' + escHtml(s.type) + '</span>' : '';
    var priceHtml = s.paymentEnabled !== false ? '₹' + s.price : '<span style="color:var(--success);font-weight:700">FREE</span>';
    if (s.hasPartnerId && s.originalPrice && s.originalPrice > s.price) {
      priceHtml = '<span style="text-decoration:line-through;color:var(--text-muted);font-size:11px">₹' + s.originalPrice + '</span> <span style="font-weight:700;color:var(--success)">₹' + s.price + '</span> <span style="background:rgba(34,197,94,.12);color:var(--success);font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700">PARTNER</span>';
    }
    return '<button class="service-card" onclick="openService(\'' + name.replace(/'/g, "\\'") + '\')"><div class="service-icon ' + s.iconClass + '">' + s.icon + '</div><div><b>' + escName + '</b>' + escType + '<small>' + desc + '</small><div class="price">' + priceHtml + '</div></div><span class="arrow">→</span></button>';
  }).join('');

  var dashGrid = document.getElementById('dashServiceGrid');
  if (dashGrid) dashGrid.innerHTML = html;

  var svcGrid = document.getElementById('svcServiceGrid');
  if (svcGrid) {
    if (keys.length === 0) {
      svcGrid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);grid-column:1/-1">No services available. Contact admin.</div>';
    } else {
      svcGrid.innerHTML = html;
    }
  }
}

const statusMap = {
  'Draft':'draft', 'Payment Pending':'pending', 'Submitted':'submitted',
  'Document Checking':'processing', 'Processing':'processing',
  'Correction Required':'correction', 'Completed':'completed',
  'Rejected':'rejected', 'Cancelled':'cancelled'
};

// ---- State ----
let currentService = 'Aadhaar Update';
let currentStep = 1;
let selectedPayment = 'Razorpay';
let appPage = 1;
const perPage = 6;
let appCounter = 1049;
let walletBalance = 0;
let walletAdded = 0;
let walletUsed = 0;
let walletTxns = [];
let txnCounter = 7782;

// ---- Persistence: Save/Load Applications via Firestore ----
function saveApplications() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var uid = loginData.uid;
  if (!uid) return;
  fsSetDoc('partnerApps', uid, { apps: applications }).catch(function(e) {
    console.error('Failed to save apps:', e);
  });
}

async function loadApplications() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var uid = loginData.uid;
  if (!uid) return;
  try {
    var doc = await fsGetDoc('partnerApps', uid);
    if (doc && doc.apps) {
      applications = doc.apps;
    }
  } catch(e) {
    applications = [];
  }
  // Restore counters from saved data
  if (applications.length > 0) {
    const maxId = applications.reduce(function(max, a) {
      const num = parseInt(a.id.replace('#MCS-', ''));
      return num > max ? num : max;
    }, 1048);
    appCounter = maxId + 1;
  }
}

async function saveWalletState() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var uid = loginData.uid;
  if (!uid) return;
  try {
    await fsSetDoc('partnerWallets', uid, {
      balance: walletBalance, added: walletAdded, used: walletUsed, txns: walletTxns, txnCounter: txnCounter
    });
  } catch(e) {
    console.error('Failed to save wallet:', e);
  }
}

async function loadWalletState() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var uid = loginData.uid;
  if (!uid) return;
  try {
    var w = await fsGetDoc('partnerWallets', uid);
    if (w) {
      walletTxns = w.txns || [];
      txnCounter = w.txnCounter || 7782;
      // Recalculate all values from transactions for accuracy
      walletBalance = 0;
      walletAdded = 0;
      walletUsed = 0;
      walletTxns.forEach(function(t) {
        walletBalance += t.amount;
        if (t.amount > 0) walletAdded += t.amount;
        else walletUsed += Math.abs(t.amount);
      });
    }
  } catch(e) {}
}

// ---- Update Dashboard Stats ----
function updateDashboardStats() {
  const total = applications.length;
  const processing = applications.filter(a => ['Processing','Submitted','Document Checking'].includes(a.status)).length;
  const completed = applications.filter(a => a.status === 'Completed').length;
  const el = (id) => document.getElementById(id);
  if (el('statTotal')) el('statTotal').textContent = total;
  if (el('statProcessing')) el('statProcessing').textContent = processing;
  if (el('statCompleted')) el('statCompleted').textContent = completed;
  if (el('statWallet')) el('statWallet').textContent = '₹' + walletBalance.toLocaleString();
  renderRecent();
  renderDownloads();
}

// ---- Navigation ----
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  var el = document.getElementById(view + 'View');
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const titles = {
    dashboard:['Overview','Dashboard'], services:['Service Catalog','Services'],
    applications:['Workflow','My Applications'], wallet:['Finance','Wallet & Payments'],
    downloads:['Files','Downloads'], support:['Help Desk','Support']
  };
  if (titles[view]) {
    var pk = document.getElementById('pageKicker');
    var pt = document.getElementById('pageTitle');
    if (pk) pk.textContent = titles[view][0];
    if (pt) pt.textContent = titles[view][1];
  }
  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');
  if (view === 'applications') renderApplications();
  if (view === 'downloads') renderDownloads();
}

document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
var _mobBtn = document.getElementById('mobileMenuBtn'); if (_mobBtn) _mobBtn.onclick = () => { var sb = document.getElementById('sidebar'); if (sb) sb.classList.toggle('open'); };

// ---- Notifications ----
var _notifBtn = document.getElementById('notifBtn');
if (_notifBtn) _notifBtn.onclick = (e) => {
  e.stopPropagation();
  var nd = document.getElementById('notifDropdown');
  if (nd) nd.classList.toggle('show');
};
document.addEventListener('click', () => { var nd = document.getElementById('notifDropdown'); if (nd) nd.classList.remove('show'); });

// ---- Service Drawer ----
function openService(service) {
  currentService = service;
  currentStep = 1;
  document.getElementById('drawerTitle').textContent = service + ' — New Application';
  document.getElementById('applicationForm').reset();
  document.querySelectorAll('.upload-box').forEach(b => { b.classList.remove('has-file'); b.querySelector('.upload-status').textContent = 'Browse'; b.querySelector('.upload-status').classList.remove('ok'); });

  // Populate request type dropdown dynamically from loaded services
  var reqSelect = document.getElementById('requestType');
  // Use the globally loaded services from Firestore (via loadServicesFromAdmin)
  var svcData = services[service];
  var reqTypes = (svcData && svcData.requestTypes) ? svcData.requestTypes : [{name:'New Application',price:svcData?svcData.price:0,partnerPrice:svcData?svcData.partnerPrice:0}];
  reqSelect.innerHTML = reqTypes.map(function(r) {
    var n = typeof r === 'string' ? r : r.name;
    return '<option value="' + escAttr(n) + '">' + escHtml(n) + '</option>';
  }).join('');

  // Set initial price
  var firstReq = reqTypes[0];
  var initPrice = (typeof firstReq === 'object') ? firstReq.price : (svcData ? svcData.price : 0);
  var initPartnerPrice = (typeof firstReq === 'object') ? firstReq.partnerPrice : (svcData ? svcData.partnerPrice : 0);
  window._currentReqPrice = initPrice;
  window._currentReqPartnerPrice = initPartnerPrice;
  updateReqPriceDisplay(initPrice, initPartnerPrice);

  // Listen for type change
  reqSelect.onchange = function() {
    var selected = reqSelect.value;
    var match = reqTypes.find(function(r) { return (typeof r === 'string' ? r : r.name) === selected; });
    if (match && typeof match === 'object') {
      window._currentReqPrice = match.price;
      window._currentReqPartnerPrice = match.partnerPrice;
      updateReqPriceDisplay(match.price, match.partnerPrice);
    }
  };

  document.getElementById('appOverlay').classList.add('open');
  updateSteps();
}

function updateReqPriceDisplay(price, partnerPrice) {
  var hasPartnerId = services[currentService] && services[currentService].hasPartnerId;
  var showPrice = hasPartnerId ? partnerPrice : price;
  var el = document.getElementById('reqPriceDisplay');
  if (el) {
    if (hasPartnerId && price > partnerPrice) {
      el.innerHTML = '<span style="text-decoration:line-through;color:var(--text-muted);font-size:12px">₹' + price + '</span> <span style="font-weight:700;color:var(--success)">₹' + partnerPrice + '</span> <span style="background:rgba(34,197,94,.12);color:var(--success);font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700">PARTNER</span>';
    } else {
      el.innerHTML = '<span style="font-weight:700;font-size:16px">₹' + showPrice + '</span>';
    }
  }
}

function closeDrawer(e) {
  if (e === true || !e || (e.target && e.target === document.getElementById('appOverlay'))) {
    document.getElementById('appOverlay').classList.remove('open');
    currentStep = 1;
  }
}

// ---- Stepper ----
function updateSteps() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('stepDot' + i);
    if (dot) dot.classList.toggle('active', i === currentStep);
    if (dot) dot.classList.toggle('done', i < currentStep);
    const line = document.getElementById('stepLine' + i);
    if (line) line.classList.toggle('done', i < currentStep);
    const form = document.getElementById('formStep' + i);
    if (form) form.classList.toggle('active', i === currentStep);
  }
}

// ---- Validation ----
function validCustomer() {
  const n = document.getElementById('custName').value.trim();
  const m = document.getElementById('custMobile').value.trim();
  if (!n || !/^\d{10}$/.test(m)) { toast('Enter a valid customer name and 10-digit mobile number.'); return false; }
  return true;
}

function validDocs() {
  const required = document.querySelectorAll('#formStep2 .upload-box[data-required="true"] input[type=file]');
  for (const inp of required) { if (!inp.files.length) { toast('Please upload all required documents.'); return false; } }
  return true;
}

// ---- Upload ----
function handleUpload(input, boxId) {
  const box = document.getElementById(boxId);
  const status = box.querySelector('.upload-status');
  if (input.files.length) {
    box.classList.add('has-file');
    status.textContent = input.files[0].name;
    status.classList.add('ok');
  } else {
    box.classList.remove('has-file');
    status.textContent = 'Browse';
    status.classList.remove('ok');
  }
}

// ---- Steps ----
function goStep(step) {
  if (step === 2 && !validCustomer()) return;
  if (step === 3 && !validDocs()) return;
  if (step === 3) buildReview();
  if (step === 4) {
    const svc = services[currentService];
    var showAmt = window._currentReqPrice || svc.price;
    if (svc.hasPartnerId && window._currentReqPartnerPrice) showAmt = window._currentReqPartnerPrice;
    document.getElementById('paymentAmount').textContent = '₹' + showAmt;
    // Check wallet balance if wallet is selected
    if (selectedPayment === 'Wallet' && walletBalance < showAmt) {
      toast('Insufficient wallet balance. Please add money or choose another payment method.');
      return;
    }
  }
  currentStep = step;
  updateSteps();
}

function buildReview() {
  const svc = services[currentService];
  const name = document.getElementById('custName').value;
  const mobile = document.getElementById('custMobile').value;
  const email = document.getElementById('custEmail').value;
  const req = document.getElementById('requestType').value;
  const note = document.getElementById('custNote').value;
  var reviewPrice = window._currentReqPrice || svc.price;
  var reviewPartnerPrice = window._currentReqPartnerPrice || svc.partnerPrice;
  var priceDisplay = '';
  if (svc.hasPartnerId && reviewPrice > reviewPartnerPrice) {
    priceDisplay = '<span style="text-decoration:line-through;color:var(--text-muted)">₹' + reviewPrice + '</span> ₹' + reviewPartnerPrice + ' <span style="background:rgba(34,197,94,.12);color:var(--success);font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700">PARTNER</span>';
  } else {
    priceDisplay = '₹' + reviewPrice;
  }
  let docList = '';
  document.querySelectorAll('#formStep2 .upload-box').forEach(box => {
    const inp = box.querySelector('input[type=file]');
    const label = box.querySelector('.upload-info b').textContent;
    const fname = inp.files.length ? inp.files[0].name : 'Not uploaded';
    const isRequired = box.querySelector('.upload-info small').textContent.includes('Required');
    docList += `<div class="review-row"><span>${label}${isRequired ? ' *' : ''}</span><b>${fname}</b></div>`;
  });
  document.getElementById('reviewBox').innerHTML = `
    <div class="review-row"><span>Service</span><b>${escHtml(currentService)}</b></div>
    <div class="review-row"><span>Customer</span><b>${escHtml(name)}</b></div>
    <div class="review-row"><span>Mobile</span><b>${escHtml(mobile)}</b></div>
    ${email ? `<div class="review-row"><span>Email</span><b>${escHtml(email)}</b></div>` : ''}
    <div class="review-row"><span>Request Type</span><b>${escHtml(req)}</b></div>
    ${note ? `<div class="review-row"><span>Note</span><b>${escHtml(note)}</b></div>` : ''}
    <div class="review-row"><span>Processing Fee</span><b>${priceDisplay}</b></div>
    <div style="border-top:1px solid var(--border);margin:12px 0;padding-top:12px"><b style="font-size:13px;color:var(--navy)">Documents</b></div>
    ${docList}
  `;
}

function togglePay() {
  const checked = document.getElementById('declaration').checked;
  document.getElementById('payBtn').disabled = !checked;
  document.getElementById('lockedPay').style.display = checked ? 'none' : 'block';
}

// ---- Payment ----
function selectPayment(el, method) {
  document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayment = method;
  toast(method + ' selected as payment method.');
}

// ---- Submit ----
function submitApplication() {
  const svc = services[currentService];
  const custName = document.getElementById('custName').value;
  const custMobile = document.getElementById('custMobile').value;
  var payAmount = svc.hasPartnerId ? (window._currentReqPartnerPrice || svc.partnerPrice) : (window._currentReqPrice || svc.price);

  // Wallet balance check
  if (selectedPayment === 'Wallet' && walletBalance < payAmount) {
    toast('Insufficient wallet balance. Please add money or choose another payment method.');
    return;
  }

  if (selectedPayment === 'Razorpay') {
    openRazorpayCheckout(svc, custName, custMobile, payAmount);
  } else {
    finalizeApplication(svc, custName, custMobile, null, payAmount);
  }
}

function openRazorpayCheckout(svc, custName, custMobile, payAmount) {
  if (typeof Razorpay === 'undefined') {
    toast('Payment gateway not loaded. Please refresh and try again.');
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: payAmount * 100, // Razorpay expects paise
    currency: 'INR',
    name: RAZORPAY_NAME,
    description: currentService + ' — Application Fee',
    handler: function(response) {
      // Payment success
      finalizeApplication(svc, custName, custMobile, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id || '',
        razorpay_signature: response.razorpay_signature || ''
      }, payAmount);
    },
    prefill: {
      name: custName,
      contact: custMobile,
      email: document.getElementById('custEmail').value || ''
    },
    theme: {
      color: '#1665d8'
    },
    modal: {
      ondismiss: function() {
        toast('Payment cancelled.');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    toast('Payment failed: ' + (response.error.description || 'Unknown error'));
  });
  rzp.open();
}

function finalizeApplication(svc, custName, custMobile, paymentInfo, payAmount) {
  const now = new Date();
  const timeStr = formatDate(now);
  const dateStr = now.toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const appId = '#MCS-' + appCounter++;

  // Collect uploaded documents with file data
  const docEntries = [];
  const fileReaders = [];
  document.querySelectorAll('#formStep2 .upload-box').forEach(box => {
    const inp = box.querySelector('input[type=file]');
    const label = box.querySelector('.upload-info b').textContent;
    if (inp.files.length) {
      const file = inp.files[0];
      docEntries.push({ name: label, fileName: file.name, type: file.type, size: file.size, data: '', status: 'Pending Review' });
      fileReaders.push({ idx: docEntries.length - 1, file: file });
    }
  });

  const loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  const myPartnerId = loginData.partnerId || 'MCS-001';
  var appAmount = payAmount || (window._currentReqPrice || svc.price);
  if (svc.hasPartnerId && !payAmount && window._currentReqPartnerPrice) appAmount = window._currentReqPartnerPrice;

  const newApp = {
    id: appId,
    customer: custName,
    mobile: custMobile,
    email: document.getElementById('custEmail').value || '',
    service: currentService,
    request: document.getElementById('requestType').value,
    status: 'Submitted',
    amount: appAmount,
    submitted: dateStr,
    updated: dateStr,
    note: document.getElementById('custNote').value,
    docs: docEntries,
    docStatus: 'Pending Review',
    submittedTime: timeStr,
    paymentMethod: selectedPayment,
    gatewayRef: paymentInfo ? paymentInfo.razorpay_payment_id : 'WALLET',
    orderId: paymentInfo ? paymentInfo.razorpay_order_id : '',
    partnerId: myPartnerId,
    partnerName: loginData.name || 'Partner'
  };
  applications.unshift(newApp);

  // Read file data asynchronously for admin download
  if (fileReaders.length > 0) {
    var promises = fileReaders.map(function(fr) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function() { newApp.docs[fr.idx].data = reader.result; resolve(); };
        reader.onerror = function() { resolve(); };
        reader.readAsDataURL(fr.file);
      });
    });
    Promise.all(promises).then(function() { saveApplications(); });
  } else {
    saveApplications();
  }

  // Deduct from wallet if wallet payment selected
  if (selectedPayment === 'Wallet') {
    walletBalance -= appAmount;
    walletUsed += appAmount;

    // Add wallet transaction only for wallet payments
    const txn = {
      id: '#TXN-' + txnCounter++,
      type: 'Wallet payment',
      app: appId,
      amount: -appAmount,
      status: 'Success',
      method: 'Wallet',
      gateway: 'Wallet',
      date: dateStr
    };
    walletTxns.unshift(txn);
  }

  // Save to localStorage
  saveWalletState();

  // Update wallet UI
  const walletEl = document.getElementById('walletBalance');
  if (walletEl) walletEl.textContent = '₹' + walletBalance.toLocaleString() + '.00';
  renderWalletTxns();
  closeDrawer();
  renderApplications();
  renderRecent();
  renderDownloads();
  updateDashboardStats();

  notifCount++;
  updateNotifBadge();
  toast('Application ' + newApp.id + ' submitted successfully!');
}

// ---- Render Recent ----
function renderRecent() {
  const rows = document.getElementById('recentRows');
  if (!rows) return;
  rows.innerHTML = applications.slice(0, 5).map(a => `
    <tr>
      <td><b>${escHtml(a.id)}</b></td>
      <td>${escHtml(a.customer)}</td>
      <td>${escHtml(a.service)}</td>
      <td><span class="badge badge-${statusMap[a.status] || 'draft'}">${escHtml(a.status)}</span></td>
      <td>₹${escHtml(String(a.amount))}</td>
      <td>${escHtml(a.submitted)}</td>
      <td><button class="btn btn-ghost btn-sm" data-view-app="${escAttr(a.id)}">View</button></td>
    </tr>
  `).join('');
}

// ---- Render Downloads ----
function renderDownloads() {
  const completed = applications.filter(a => a.status === 'Completed' && a.result);
  const rows = document.getElementById('downloadsRows');
  if (!rows) return;
  if (completed.length === 0) {
    rows.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No completed applications with results yet.</td></tr>';
    return;
  }
  rows.innerHTML = completed.map(a => `
    <tr>
      <td><b>${escHtml(a.id)}</b></td>
      <td>${escHtml(a.customer)}</td>
      <td>${escHtml(a.service)}</td>
      <td>${escHtml(Array.isArray(a.result) ? a.result.join(', ') : a.result)}</td>
      <td>${escHtml(a.updated)}</td>
      <td><button class="btn btn-sm btn-primary" onclick="toast('Download started — connect storage for production.')">Download</button></td>
    </tr>
  `).join('');
}

// ---- Render Wallet Transactions ----
function renderWalletTxns() {
  const rows = document.getElementById('walletTxnRows');
  if (!rows) return;
  if (walletTxns.length === 0) {
    rows.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No transactions yet</td></tr>';
    return;
  }
  rows.innerHTML = walletTxns.map(t => `
    <tr>
      <td><b>${escHtml(t.id)}</b></td>
      <td>${escHtml(t.type)}</td>
      <td>${escHtml(t.app)}</td>
      <td>${t.amount < 0 ? '− ' : '+ '}₹${Math.abs(t.amount)}</td>
      <td><span class="badge badge-completed">${escHtml(t.status)}</span></td>
      <td>${escHtml(t.date)}</td>
    </tr>
  `).join('');
  const el = (id) => document.getElementById(id);
  if (el('walletBalance')) el('walletBalance').textContent = '₹' + walletBalance.toLocaleString();
  if (el('walletAdded')) el('walletAdded').textContent = '₹' + walletAdded.toLocaleString();
  if (el('walletUsed')) el('walletUsed').textContent = '₹' + walletUsed.toLocaleString();
  if (el('walletTxnCount')) el('walletTxnCount').textContent = walletTxns.length;
}

// ---- Render Applications ----
function renderApplications() {
  const search = (document.getElementById('searchApp')?.value || '').toLowerCase();
  const statusF = document.getElementById('filterStatus')?.value || '';
  let filtered = applications.filter(a => {
    const matchSearch = !search || a.id.toLowerCase().includes(search) || a.customer.toLowerCase().includes(search);
    const matchStatus = !statusF || a.status === statusF;
    return matchSearch && matchStatus;
  });
  const total = filtered.length;
  const pages = Math.ceil(total / perPage);
  if (appPage > pages) appPage = pages || 1;
  const start = (appPage - 1) * perPage;
  const pageData = filtered.slice(start, start + perPage);

  const rows = document.getElementById('applicationsRows');
  if (!rows) return;
  rows.innerHTML = pageData.map(a => `
    <tr>
      <td><b>${escHtml(a.id)}</b></td>
      <td>${escHtml(a.customer)}</td>
      <td>${escHtml(a.service)}</td>
      <td><span class="badge badge-${statusMap[a.status] || 'draft'}">${escHtml(a.status)}</span></td>
      <td>₹${escHtml(String(a.amount))}</td>
      <td>${escHtml(a.submitted)}</td>
      <td>${escHtml(a.updated)}</td>
      <td><button class="btn btn-ghost btn-sm" data-view-app="${escAttr(a.id)}">View</button></td>
    </tr>
  `).join('');

  const pag = document.getElementById('appPagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }
  let ph = '';
  ph += `<button class="page-btn" onclick="appPageGo(${appPage-1})" ${appPage===1?'disabled':''}>&#8249;</button>`;
  for (let i = 1; i <= pages; i++) {
    ph += `<button class="page-btn ${i===appPage?'active':''}" onclick="appPageGo(${i})">${i}</button>`;
  }
  ph += `<button class="page-btn" onclick="appPageGo(${appPage+1})" ${appPage===pages?'disabled':''}>&#8250;</button>`;
  pag.innerHTML = ph;
}

function appPageGo(p) { appPage = p; renderApplications(); }
function filterApplications() { appPage = 1; renderApplications(); }

// ---- View Application Detail ----
function viewApp(id) {
  const a = applications.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modalAppTitle').textContent = a.id + ' — Application Details';

  let correctionHtml = '';
  if (a.status === 'Correction Required' && a.adminMsg) {
    correctionHtml = `
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:14px;margin:16px 0">
        <b style="font-size:13px;color:#92400e;display:block;margin-bottom:4px">Correction Required</b>
        <p style="font-size:12.5px;color:#78350f">${escHtml(a.adminMsg)}</p>
        <button class="btn btn-sm btn-warning" style="margin-top:10px;color:#fff" onclick="openReupload('${a.id}')">Re-upload Document</button>
      </div>
    `;
  }

  let resultHtml = '';
  if (a.result) {
    var fileList = Array.isArray(a.result) ? a.result : [a.result];
    resultHtml = `
      <div style="background:var(--success-bg);border:1px solid #bbf7d0;border-radius:var(--radius-sm);padding:14px;margin:16px 0">
        <b style="font-size:13px;color:var(--success);display:block;margin-bottom:4px">Result Available</b>
        <p style="font-size:12.5px;color:#166534">${fileList.length} file(s): ${fileList.map(escHtml).join(', ')}</p>
        <button class="btn btn-sm btn-success" style="margin-top:8px" onclick="downloadResult('${escAttr(a.id)}')">📥 Download ZIP</button>
      </div>
    `;
  }

  document.getElementById('modalAppBody').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span class="badge badge-${statusMap[a.status] || 'draft'}" style="font-size:12px">${escHtml(a.status)}</span>
      <span style="font-size:12px;color:var(--text-muted)">Updated: ${escHtml(a.updated)}</span>
    </div>
    <div class="detail-grid">
      <div class="detail-field"><label>Customer Name</label><span>${escHtml(a.customer)}</span></div>
      <div class="detail-field"><label>Mobile</label><span>${escHtml(a.mobile)}</span></div>
      <div class="detail-field"><label>Service</label><span>${escHtml(a.service)}</span></div>
      <div class="detail-field"><label>Request Type</label><span>${escHtml(a.request)}</span></div>
      <div class="detail-field"><label>Amount</label><span>₹${escHtml(String(a.amount))}</span></div>
      <div class="detail-field"><label>Submitted</label><span>${escHtml(a.submitted)}</span></div>
      <div class="detail-field"><label>Document Status</label><span>${escHtml(a.docStatus)}</span></div>
      <div class="detail-field"><label>Application Note</label><span>${a.note ? escHtml(a.note) : '—'}</span></div>
    </div>
    ${correctionHtml}
    ${resultHtml}
    <div class="status-timeline">
      <h4>Application Timeline</h4>
      <div class="timeline-item"><div class="timeline-dot done"></div><div><p>Application created</p><small>${escHtml(a.submitted)}</small></div></div>
      ${a.status !== 'Draft' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div><p>Payment confirmed</p><small>${escHtml(a.submitted)}</small></div></div>` : ''}
      ${['Submitted','Document Checking','Processing','Completed','Correction Required','Rejected'].includes(a.status) ? `<div class="timeline-item"><div class="timeline-dot done"></div><div><p>Application submitted</p><small>${escHtml(a.submitted)}</small></div></div>` : ''}
      ${['Processing','Completed'].includes(a.status) ? `<div class="timeline-item"><div class="timeline-dot active"></div><div><p>Processing by Mohini CSC</p><small>${escHtml(a.updated)}</small></div></div>` : ''}
      ${a.status === 'Completed' ? `<div class="timeline-item"><div class="timeline-dot done"></div><div><p>Completed — result ready</p><small>${escHtml(a.updated)}</small></div></div>` : ''}
      ${a.status === 'Correction Required' ? `<div class="timeline-item"><div class="timeline-dot" style="background:var(--warning)"></div><div><p>Correction requested</p><small>${escHtml(a.updated)}</small></div></div>` : ''}
    </div>
  `;
  document.getElementById('appDetailModal').classList.add('open');
}

// ---- Download Result as ZIP ----
function downloadResult(appId) {
  var a = applications.find(function(x) { return x.id === appId; });
  if (!a || !a.resultFiles || a.resultFiles.length === 0) {
    toast('No result files found.');
    return;
  }

  if (a.resultFiles.length === 1) {
    var f = a.resultFiles[0];
    var link = document.createElement('a');
    link.href = f.data;
    link.download = f.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Downloaded: ' + f.name);
    return;
  }

  if (typeof JSZip === 'undefined') {
    toast('ZIP library loading... try again.');
    return;
  }

  var zip = new JSZip();
  a.resultFiles.forEach(function(f) {
    var base64 = f.data.split(',')[1];
    zip.file(f.name, base64, { base64: true });
  });

  zip.generateAsync({ type: 'blob' }).then(function(blob) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = a.id.replace('#', '') + '_Result.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('ZIP downloaded!');
  });
}

function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); }
var _appDetailModal = document.getElementById('appDetailModal'); if (_appDetailModal) _appDetailModal.onclick = (e) => { if (e.target === _appDetailModal) closeModal('appDetailModal'); };
var _reuploadModal = document.getElementById('reuploadModal'); if (_reuploadModal) _reuploadModal.onclick = (e) => { if (e.target === _reuploadModal) closeModal('reuploadModal'); };

// ---- Re-upload Documents ----
var reuploadFiles = {};

function openReupload(appId) {
  var a = applications.find(function(x) { return x.id === appId; });
  if (!a) return;
  document.getElementById('reuploadAppId').value = appId;
  document.getElementById('reuploadError').style.display = 'none';
  reuploadFiles = {};

  var svc = services[a.service];
  var docs = svc ? svc.docs : (a.docs || []).map(function(d) { return d.name || d; });

  var html = docs.map(function(docName, i) {
    var existing = (a.docs || [])[i];
    var existingName = existing ? (existing.fileName || existing.name || '') : '';
    return '<div style="margin-bottom:12px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px">' +
      '<label style="font-size:12px;font-weight:600;color:var(--text);display:block;margin-bottom:6px">' + escHtml(docName) + (existingName ? ' <small style="color:var(--text-muted)">(current: ' + escHtml(existingName) + ')</small>' : '') + '</label>' +
      '<input type="file" id="reuploadFile_' + i + '" accept="image/*,.pdf,.doc,.docx" style="font-size:12px;width:100%" onchange="handleReuploadFile(' + i + ', this)">' +
      '<div id="reuploadPreview_' + i + '" style="margin-top:6px;font-size:11px;color:var(--success);display:none"></div>' +
    '</div>';
  }).join('');

  document.getElementById('reuploadDocList').innerHTML = html;
  document.getElementById('reuploadModal').classList.add('open');
}

function handleReuploadFile(idx, input) {
  if (!input.files.length) return;
  var file = input.files[0];
  if (file.size > 10 * 1024 * 1024) { toast('File too large (max 10MB)'); return; }
  var preview = document.getElementById('reuploadPreview_' + idx);
  preview.textContent = '✓ ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
  preview.style.display = 'block';
  reuploadFiles[idx] = file;
}

function submitReupload() {
  var appId = document.getElementById('reuploadAppId').value;
  var a = applications.find(function(x) { return x.id === appId; });
  if (!a) return;

  var svc = services[a.service];
  var docs = svc ? svc.docs : (a.docs || []).map(function(d) { return d.name || d; });
  var hasNew = false;
  var fileReaders = [];

  docs.forEach(function(docName, i) {
    if (reuploadFiles[i]) {
      hasNew = true;
      var file = reuploadFiles[i];
      var reader = new FileReader();
      (function(idx, fileName, fileType, fileSize) {
        reader.onload = function() {
          a.docs[idx] = {
            name: docs[idx],
            fileName: fileName,
            type: fileType,
            size: fileSize,
            data: reader.result,
            status: 'Pending Review'
          };
        };
      })(i, file.name, file.type, file.size);
      reader.readAsDataURL(file);
      fileReaders.push(reader);
    }
  });

  if (!hasNew) {
    document.getElementById('reuploadError').textContent = 'Please select at least one file to re-upload.';
    document.getElementById('reuploadError').style.display = 'block';
    return;
  }

  Promise.all(fileReaders.map(function(r) { return new Promise(function(resolve) { r.onload = function() { resolve(); }; r.onerror = function() { resolve(); }; }); })).then(function() {
    a.status = 'Submitted';
    a.docStatus = 'Pending Review';
    a.updated = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
    saveApplications();
    closeModal('reuploadModal');
    renderApplications();
    toast('Documents re-uploaded! Status set to Submitted.');
  }).catch(function() {
    saveApplications();
    closeModal('reuploadModal');
    renderApplications();
    toast('Documents re-uploaded!');
  });
}
var _addMoneyModal = document.getElementById('addMoneyModal'); if (_addMoneyModal) _addMoneyModal.onclick = (e) => { if (e.target === _addMoneyModal) closeModal('addMoneyModal'); };

// ---- Add Money to Wallet ----
function openAddMoneyModal() {
  document.getElementById('addMoneyAmount').value = '';
  document.getElementById('addMoneyModal').classList.add('open');
}

function payAddMoney() {
  const amount = parseInt(document.getElementById('addMoneyAmount').value);
  if (!amount || amount < 10) {
    toast('Please enter minimum ₹10.');
    return;
  }

  const loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: 'INR',
    name: RAZORPAY_NAME,
    description: 'Add Money to Wallet',
    handler: function(response) {
      walletBalance += amount;
      walletAdded += amount;
      const now = new Date();
      const txn = {
        id: '#TXN-' + txnCounter++,
        type: 'Wallet top-up',
        app: '—',
        amount: amount,
        status: 'Success',
        method: 'Razorpay',
        gateway: response.razorpay_payment_id,
        date: now.toLocaleDateString('en-IN', { dateStyle: 'medium' })
      };
      walletTxns.unshift(txn);
      saveWalletState();
      document.getElementById('walletBalance').textContent = '₹' + walletBalance.toLocaleString() + '.00';
      renderWalletTxns();
      updateDashboardStats();
      closeModal('addMoneyModal');
      toast('₹' + amount + ' added to wallet successfully!');
    },
    prefill: {
      name: loginData.name || '',
      contact: loginData.mobile || ''
    },
    theme: { color: '#1665d8' },
    modal: {
      ondismiss: function() { toast('Payment cancelled.'); }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    toast('Payment failed: ' + (response.error.description || 'Unknown error'));
  });
  rzp.open();
}

// ---- Support ----

function loadTickets() {
  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var myId = loginData.uid;
  if (!myId) return Promise.resolve([]);
  return fsGetDoc('partnerApps', myId).then(function(doc) {
    var tickets = (doc && doc.tickets) ? doc.tickets : [];
    return tickets;
  }).catch(function() { return []; });
}

function renderTickets() {
  var list = document.getElementById('ticketsList');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Loading tickets...</div>';

  loadTickets().then(function(tickets) {
    if (tickets.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">No support tickets yet</div>';
      return;
    }
    list.innerHTML = tickets.map(function(t) {
      return '<div style="padding:12px 0;border-bottom:1px solid var(--border-light)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<b style="font-size:13px">#' + escHtml(t.id) + ' — ' + escHtml(t.appId) + '</b>' +
          '<span class="badge badge-' + (t.status === 'Open' ? 'submitted' : t.status === 'Replied' ? 'completed' : 'pending') + '">' + escHtml(t.status) + '</span>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--text-muted)">' + escHtml(t.type) + ': ' + escHtml(t.desc) + '</p>' +
        (t.adminReply ? '<div style="background:var(--success-bg);border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;margin-top:8px"><b style="font-size:11px;color:var(--success)">Admin Reply:</b><p style="font-size:12px;color:#166534;margin-top:4px">' + escHtml(t.adminReply) + '</p></div>' : '') +
        '<small style="font-size:11px;color:var(--text-muted)">Created: ' + escHtml(t.date) + '</small>' +
      '</div>';
    }).join('');
  }).catch(function() {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">No support tickets yet</div>';
  });
}

function submitTicket() {
  var appId = document.getElementById('ticketAppId').value.trim();
  var type = document.getElementById('ticketType').value;
  var desc = document.getElementById('ticketDesc').value.trim();
  if (!appId || !desc) { toast('Please fill in application number and description.'); return; }

  var loginData = JSON.parse(localStorage.getItem('mohini_partner_login') || '{}');
  var myId = loginData.uid;
  var myPartnerId = loginData.partnerId || '';
  var now = formatDate(new Date());

  // Get current ticket count from Firestore for unique ID
  fsGetDoc('settings', 'ticketCounter').then(function(doc) {
    var counter = (doc && doc.counter) ? doc.counter + 1 : 1;
    fsSetDoc('settings', 'ticketCounter', { counter: counter }).catch(function(){});

    var newId = 'TKT-' + String(counter).padStart(3, '0');
    var ticket = {
      id: newId,
      appId: appId,
      type: type,
      desc: desc,
      status: 'Open',
      partnerId: myId,
      partnerName: loginData.name || 'Partner',
      date: now,
      adminReply: ''
    };

    // Append ticket to partner's doc
    fsGetDoc('partnerApps', myId).then(function(doc) {
      var tickets = (doc && doc.tickets) ? doc.tickets : [];
      tickets.unshift(ticket);
      return fsSetDoc('partnerApps', myId, { tickets: tickets }).then(function() {
        renderTickets();
        document.getElementById('ticketAppId').value = '';
        document.getElementById('ticketDesc').value = '';
        toast('Support ticket ' + newId + ' submitted!');
      });
    }).catch(function() {
      // First ticket — create the doc with this ticket
      fsSetDoc('partnerApps', myId, { tickets: [ticket] }).then(function() {
        renderTickets();
        document.getElementById('ticketAppId').value = '';
        document.getElementById('ticketDesc').value = '';
        toast('Support ticket ' + newId + ' submitted!');
      }).catch(function() {
        toast('Error saving ticket. Try again.');
      });
    });
  }).catch(function() {
    toast('Error submitting ticket. Try again.');
  });
}

// ---- Utility ----
function esc(s) { return escHtml(s); }

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---- Init ----
let notifCount = 0;
function updateNotifBadge() {
  const badge = document.querySelector('#notifBtn .badge');
  if (badge) badge.textContent = notifCount;
}

// Check maintenance mode (synced via Firestore from admin)
function checkMaintenance() {
  return fsGetDoc('settings', 'maintenance').then(function(doc) {
    if (doc && doc.enabled === true) {
      showMaintenancePage();
      return true;
    }
    return false;
  }).catch(function() { return false; });
}

function showMaintenancePage() {
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;padding:0;overflow:hidden';
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
  s.onload = function() {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f8fb;font-family:Inter,system-ui,sans-serif;text-align:center;padding:24px">
        <div style="max-width:480px;width:100%">
          <div style="width:300px;height:300px;margin:0 auto 24px">
            <lottie-player src="assets/lottie/maintenance.json" background="transparent" speed="1" style="width:300px;height:300px" loop autoplay></lottie-player>
          </div>
          <h1 style="font-size:28px;font-weight:800;color:#172033;margin-bottom:12px">Under Maintenance</h1>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:32px">We're currently performing some updates to serve you better. We'll be back shortly. Thank you for your patience!</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">Established 2017 · Mohini CSC Centre</p>
        </div>
      </div>
    `;
  };
  document.head.appendChild(s);
}

// Event delegation for View Application buttons (XSS-safe)
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-view-app]');
  if (btn) {
    viewApp(btn.getAttribute('data-view-app'));
  }
});

// Wait for Firebase Auth to initialize, then check login
fbOnAuthStateChanged(function(user) {
  // Remove the listener after first call
  if (window._authChecked) return;
  window._authChecked = true;

  checkMaintenance().then(function(inMaintenance) {
    if (inMaintenance) return;
    if (checkLogin()) {
      // Run all data loads in parallel
      Promise.all([
        loadServicesFromAdmin(),
        loadApplications(),
        loadWalletState(),
        renderTickets()
      ]).then(function() {
        updateDashboardStats();
        renderRecent();
        renderApplications();
        renderDownloads();
        renderWalletTxns();
      }).catch(function() {
        updateDashboardStats();
        renderRecent();
        renderApplications();
        renderDownloads();
        renderWalletTxns();
      });
    }
  });
});
