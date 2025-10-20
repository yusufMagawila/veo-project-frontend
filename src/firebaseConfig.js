// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// **Replace these with your actual Firebase project configuration**
const firebaseConfig = {
  apiKey: "AIzaSyDS9y8IE9tTAkKuF0szAAPHCL0UifrqmVg",
  authDomain: "veo-project-2a1c7.firebaseapp.com",
  projectId: "veo-project-2a1c7",
  storageBucket: "veo-project-2a1c7.firebasestorage.app",
  messagingSenderId: "816713850689",
  appId: "1:816713850689:web:99826d4b28440fc7fccbc0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);