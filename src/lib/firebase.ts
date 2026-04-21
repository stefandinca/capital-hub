import { initializeApp } from 'firebase/app';

// TODO: Replace with your Firebase project config
// Get this from: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyDshoVFhthlyJmbKlDDL3aV591Ji_RQD_8",
  authDomain: "capitalhub-85722.firebaseapp.com",
  projectId: "capitalhub-85722",
  storageBucket: "capitalhub-85722.firebasestorage.app",
  messagingSenderId: "414849857925",
  appId: "1:414849857925:web:da8df15c245769979fecec"
};

export const app = initializeApp(firebaseConfig);
