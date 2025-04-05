import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBznEzlZirP0pvdYapdJf0_YEJORmAq8Ls",
    authDomain: "hicaa-staffinfo.firebaseapp.com",
    databaseURL: "https://hicaa-staffinfo-default-rtdb.firebaseio.com",
    projectId: "hicaa-staffinfo",
    storageBucket: "hicaa-staffinfo.firebasestorage.app",
    messagingSenderId: "576458310276",
    appId: "1:576458310276:web:f048e7626adfea6178f8d1",
    measurementId: "G-X2ZE5SEYHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Export Firebase instances
export {
    database,
    storage,
    ref,
    set,
    onValue,
    remove,
    storageRef,
    uploadBytes,
    getDownloadURL
}; 