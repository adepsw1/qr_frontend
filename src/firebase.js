// Firebase client setup for Firestore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCM9QEPR5wkM9l8nwTAghQaDODcDG_OpHA",
  authDomain: "vendorside-8c007.firebaseapp.com",
  databaseURL: "https://vendorside-8c007-default-rtdb.firebaseio.com",
  projectId: "vendorside-8c007",
  storageBucket: "vendorside-8c007.firebasestorage.app",
  messagingSenderId: "1095623362550",
  appId: "1:1095623362550:web:7bde3d501f71a80400e9d7",
  measurementId: "G-WBPQB6CEXC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
