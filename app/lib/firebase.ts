import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, PhoneAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC28qqxKyRTwfaKIwN0PwFGTUAHF8Llb_g",
  authDomain: "my-instagram-clone-b15ac.firebaseapp.com",
  projectId: "my-instagram-clone-b15ac",
  storageBucket: "my-instagram-clone-b15ac.firebasestorage.app",
  messagingSenderId: "439534248588",
  appId: "1:439534248588:web:0dcde1c8058524a4df11a9",
  measurementId: "G-ZZFJXNFWNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const phoneProvider = new PhoneAuthProvider(auth);

export { auth, db, storage, googleProvider, phoneProvider };