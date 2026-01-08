/// <reference types="vite/client" />

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { AnalysisResult, LocationData } from "../types";

// ==========================================
// 🔴 USER CONFIGURATION AREA 🔴
// 請將您的 Firebase Config 貼在下方物件中
// ==========================================
const getFirebaseConfig = () => {
  // 1. Try to read from Environment Variables
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // 2. If Project ID is missing, we must NOT fallback to hardcoded secrets in public repo
  if (!envConfig.projectId) {
    console.warn("[Firebase] No VITE_FIREBASE_PROJECT_ID found. Please invoke with valid .env variables.");
    return {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: ""
    };
  }

  return envConfig;
};



// Export app so other services can use it (e.g. Vertex AI)
export let app: any = null;
export let db: any = null;
export let storage: any = null;
export let auth: any = null;


export const initFirebase = (config: any = null) => {
  try {
    const envConfig = getFirebaseConfig();
    // Prioritize passed config, then env config
    const configToUse = config || envConfig;

    if (!configToUse.apiKey) {
      console.warn("No Firebase API Key found. Please check .env.local");
      return false;
    }

    console.log(`[Firebase] Initializing with Project Code: ${configToUse.projectId || 'UNKNOWN'}`);

    app = initializeApp(configToUse);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    return true;
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    return false;
  }
};

export const hasHardcodedConfig = () => {
  return !!import.meta.env.VITE_FIREBASE_API_KEY;
};

export const saveVillageReport = async (location: LocationData, result: AnalysisResult) => {
  if (!db) return false;

  const docId = `${location.city}_${location.district}_${location.village}`;
  const reportRef = doc(db, "village_reports", docId);

  try {
    await setDoc(reportRef, {
      location: location,
      markdown: result.markdown,
      sources: result.sources,
      checklist: result.checklist,
      lastUpdated: Timestamp.now(),
      status: "completed"
    });
    return true;
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

export const saveErrorLog = async (location: LocationData, errorMessage: string) => {
  if (!db) return false;

  const docId = `${location.city}_${location.district}_${location.village}_ERROR`;
  const reportRef = doc(db, "village_errors", docId);

  try {
    await setDoc(reportRef, {
      location: location,
      error: errorMessage,
      timestamp: Timestamp.now(),
      status: "error"
    });
    return true;
  } catch (error) {
    console.error("Error saving error log:", error);
    return false;
  }
};
