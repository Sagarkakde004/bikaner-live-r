import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvWOiebIB1Y_TdVC3fGUtAkMGm6epwWbA",
  authDomain: "bikanermenu.firebaseapp.com",
  databaseURL: "https://bikanermenu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bikanermenu",
  storageBucket: "bikanermenu.firebasestorage.app",
  messagingSenderId: "1094740606372",
  appId: "1:1094740606372:web:55a762c39e6dd1ca691531",
  measurementId: "G-D07S7TNBWH"
};

const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);
export const auth = getAuth(app);
