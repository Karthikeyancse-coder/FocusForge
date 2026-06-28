import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-bT3QXsD3pg2SFImw0je8NYOMNNoBX14",
  authDomain: "gen-lang-client-0068177350.firebaseapp.com",
  projectId: "gen-lang-client-0068177350",
  storageBucket: "gen-lang-client-0068177350.firebasestorage.app",
  messagingSenderId: "942741472672",
  appId: "1:942741472672:web:373c9b40d452d6e2dd10c5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-679e7d52-4892-459d-bcc4-9033b541e139");
export const auth = getAuth(app);
