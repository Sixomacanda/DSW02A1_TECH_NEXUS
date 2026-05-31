// firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

export const app = initializeApp(firebaseConfig);

//firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4Wy3nmsbaUWGF-rh6ubXvCmAAKhho49U",
  authDomain: "urban-track-91e53.firebaseapp.com",
  databaseURL: "https://urban-track-91e53-default-rtdb.firebaseio.com",
  projectId: "urban-track-91e53",
  storageBucket: "urban-track-91e53.firebasestorage.app",
  messagingSenderId: "519209303536",
  appId: "1:519209303536:web:c212eb58eb836e27047135"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { signInWithPopup, signOut, doc, setDoc };
