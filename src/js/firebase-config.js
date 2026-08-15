import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const myCustomConfig = {
  apiKey: "AIzaSyAkPLcBIwHMTiBstac-0e0JuIMgz60xixg",
  authDomain: "wpms-a9cea.firebaseapp.com",
  projectId: "wpms-a9cea",
  storageBucket: "wpms-a9cea.firebasestorage.app",
  messagingSenderId: "301057334087",
  appId: "1:301057334087:web:609b7552ccb7ebace4a62",
  measurementId: "G-166MRJF86J"
};

import aiStudioConfig from '../../firebase-applet-config.json';

const isUsingCustomConfig = Object.keys(myCustomConfig).length > 0;
const finalConfig = isUsingCustomConfig ? myCustomConfig : aiStudioConfig;

const app = initializeApp(finalConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { app, auth, db };
