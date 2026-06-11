import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

// console.log("Firebase Config check and :", firebaseConfig);

const app = initializeApp(firebaseConfig);
export const FirebaseMessaging = getMessaging(app);

const canUsePushMessaging = () => {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window
  );
};


// Separate function to request FCM token
export const requestToken = async () => {
    // console.log("requestToken")
  try {
    if (!canUsePushMessaging()) {
      // console.log("Push messaging is not supported in this browser/context.");
      return null;
    }

    // Register service worker **before requesting FCM token**
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    // console.log("✅ Service Worker registered:", registration);

    if (!registration) {
      throw new Error("Service worker registration failed");
    }

    // Ensure service worker is ready before requesting token
    await navigator.serviceWorker.ready;
    // console.log("✅ Service Worker is active");

    // Request Notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    // Get FCM Token with service worker registration
    const currentToken = await getToken(FirebaseMessaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration, // Ensure SW is used
    });

    if (currentToken) {
      // console.log("✅ FCM Token:", currentToken);

      /* // Send token to backend
         await axios.post("/api/update-fcm-token", { userId, token: currentToken });
         */

      return currentToken;
    } else {
      // console.log("⚠️ No FCM Token received.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};


// Listen for incoming messages
onMessage(FirebaseMessaging, (payload) => {
  // console.log("📩 Message received:", payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationBody = payload.notification?.body || 'You have a new message.';
  const notificationOptions = {
    body: notificationBody,
    icon: '/firebase-logo.png'
  };

  if (Notification.permission === 'granted') {
    new Notification(notificationTitle, notificationOptions);
  }
});




export const getFCMToken = async () => {
    try {
        const currentToken = await getToken(FirebaseMessaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (currentToken) {
            // console.log('FCM token:', currentToken);
            return currentToken;
        } else {
            // console.log('FCM token: No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (error) {
        // console.log('FCM token error', error);
        return null;
    }
};


// export const authenticateUserAndRequestToken = async () => {
//   console.log("called authenticateUserAndRequestToken")
//   try {
//     // First authenticate the user
//     const userCredential = await signInWithEmailAndPassword(auth, 'sureshkumar@gmail.com', '123456');
//     const user = userCredential.user;
//     console.log("✅ User signed in:", user.uid);

//     // Then request FCM token
//     await requestToken();
//   } catch (error) {
//     console.error("❌ Authentication or FCM token error:", error);
//     alert("Authentication failed. Please check your credentials and try again.");
//   }
// };

//authenticateUserAndRequestToken()