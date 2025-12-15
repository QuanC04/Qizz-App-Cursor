// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDmiy1OAvEo7Bvo24KJQlkTr8yrFpXrlKA",
  authDomain: "qizz-ace7a.firebaseapp.com",
  projectId: "qizz-ace7a",
  storageBucket: "qizz-ace7a.firebasestorage.app",
  messagingSenderId: "104586870175",
  appId: "1:104586870175:web:f9bee44fbfa1331808d1aa",
  measurementId: "G-VFYEHJ2CZ6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
