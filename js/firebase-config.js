// Firebase config - loaded after firebase-app-compat.js via CDN
const firebaseConfig = {
  apiKey: "AIzaSyCG13lUCdgDQRASnqtHpkm5mG-EVzktZdM",
  authDomain: "mohini-csc-portal.firebaseapp.com",
  projectId: "mohini-csc-portal",
  storageBucket: "mohini-csc-portal.firebasestorage.app",
  messagingSenderId: "473159335214",
  appId: "1:473159335214:web:d7f82c075fb32d8a2b8ebf",
  measurementId: "G-5ZZT6VQEMP"
};

const fbApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const fbAuth = firebase.auth();
const fbStorage = firebase.storage();
