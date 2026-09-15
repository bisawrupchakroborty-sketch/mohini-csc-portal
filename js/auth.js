/* ============================================
   MOHINI CSC — Shared Auth Utilities
   ============================================ */

// SHA-256 hash for password storage (no plaintext in localStorage)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mohini_csc_salt_2017');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// ---- Firebase Auth Helpers ----
async function fbSignUp(email, password, displayName) {
  const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: displayName });
  return cred;
}

async function fbSignIn(email, password) {
  return await fbAuth.signInWithEmailAndPassword(email, password);
}

async function fbSignOut() {
  return await fbAuth.signOut();
}

async function fbResetPassword(email) {
  return await fbAuth.sendPasswordResetEmail(email);
}

function fbGetUser() {
  return fbAuth.currentUser;
}

function fbOnAuthStateChanged(cb) {
  return fbAuth.onAuthStateChanged(cb);
}

// Firestore helpers with timeout (won't hang if Firestore not set up)
function _fsTimeout(ms) {
  return new Promise(function(_, reject) { setTimeout(function(){ reject(new Error('Firestore timeout')); }, ms); });
}

async function fsSetDoc(collection, docId, data) {
  return await Promise.race([
    db.collection(collection).doc(docId).set(data, { merge: true }),
    _fsTimeout(8000)
  ]);
}

async function fsGetDoc(collection, docId) {
  var snap = await Promise.race([
    db.collection(collection).doc(docId).get(),
    _fsTimeout(8000)
  ]);
  return snap.exists ? snap.data() : null;
}

async function fsGetCollection(collection) {
  var snap = await Promise.race([
    db.collection(collection).get(),
    _fsTimeout(8000)
  ]);
  return snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); });
}

async function fsDeleteDoc(collection, docId) {
  return await Promise.race([
    db.collection(collection).doc(docId).delete(),
    _fsTimeout(8000)
  ]);
}

async function fsQuery(collection, field, op, value) {
  var snap = await Promise.race([
    db.collection(collection).where(field, op, value).get(),
    _fsTimeout(8000)
  ]);
  return snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); });
}

// XSS-safe escape for HTML content
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, function(m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
  });
}

// XSS-safe escape for use inside HTML attributes (e.g. onclick)
function escAttr(s) {
  return String(s).replace(/[&<>"']/g, function(m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
  }).replace(/\\/g, '\\\\');
}

// Time-based greeting
function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Format date for display
function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
