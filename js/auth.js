/* ============================================
   MOHINI CSC — Shared Auth Utilities
   ============================================ */

// PBKDF2 hash for password storage (much stronger than plain SHA-256)
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var salt = encoder.encode('mohini_csc_salt_2017_v2');
  var keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  var hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 310000, hash: 'SHA-256' }, keyMaterial, 256);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// ---- Firebase Auth Helpers ----
async function fbSignUp(email, password, displayName) {
  var cred = await fbAuth.createUserWithEmailAndPassword(email, password);
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

// Set auth persistence to SESSION (clears on browser close — safer for shared computers)
try {
  fbAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
} catch(e) {}

// Firestore helpers with timeout (won't hang if Firestore not set up)
function _fsTimeout(ms) {
  return new Promise(function(_, reject) { setTimeout(function(){ reject(new Error('Firestore timeout')); }, ms); });
}

async function fsSetDoc(collection, docId, data) {
  try {
    return await Promise.race([
      db.collection(collection).doc(docId).set(data, { merge: true }),
      _fsTimeout(15000)
    ]);
  } catch(e) { return null; }
}

async function fsGetDoc(collection, docId) {
  try {
    var snap = await Promise.race([
      db.collection(collection).doc(docId).get(),
      _fsTimeout(15000)
    ]);
    return snap && snap.exists ? snap.data() : null;
  } catch(e) { return null; }
}

async function fsGetCollection(collection) {
  try {
    var snap = await Promise.race([
      db.collection(collection).get(),
      _fsTimeout(15000)
    ]);
    return snap && snap.docs ? snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); }) : [];
  } catch(e) { return []; }
}

async function fsDeleteDoc(collection, docId) {
  try {
    return await Promise.race([
      db.collection(collection).doc(docId).delete(),
      _fsTimeout(15000)
    ]);
  } catch(e) { return null; }
}

async function fsQuery(collection, field, op, value) {
  try {
    var snap = await Promise.race([
      db.collection(collection).where(field, op, value).get(),
      _fsTimeout(15000)
    ]);
    return snap && snap.docs ? snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); }) : [];
  } catch(e) { return []; }
}

// XSS-safe escape for HTML content
function escHtml(s) {
  return String(s).replace(/[&<>"'`]/g, function(m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;','`':'&#96;'}[m];
  });
}

// XSS-safe escape for use inside HTML attribute values (double-quoted)
function escAttr(s) {
  return String(s).replace(/[&<>"]/g, function(m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];
  });
}

// Generate cryptographically random ID (for partner IDs, etc.)
function generateRandomId(prefix, digits) {
  var arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  var num = arr[0] % Math.pow(10, digits);
  return prefix + String(num).padStart(digits, '0');
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
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch(e) { return '—'; }
}