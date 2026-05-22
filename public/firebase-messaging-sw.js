importScripts(
    "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
  );
  importScripts(
    "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
  );
  
//   firebase.initializeApp({
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   });
  firebase.initializeApp({
    apiKey: "AIzaSyA4AXmJH63vPQHJp0Hb3lSlABjB-BlT0UI",
    authDomain: "c4dadmin-3a69e.firebaseapp.com",
    projectId: "c4dadmin-3a69e",
    storageBucket: "c4dadmin-3a69e.firebasestorage.app",
    messagingSenderId: "494826851721",
    appId: "1:494826851721:web:466a0b430ec6b0ba20a558"
  });
  const messaging = firebase.messaging();
  const buildNotificationMessage = (payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    const title = notification.title || data.title || "New Notification";
    let body = notification.body || data.body || "";
    if (!body) body = "You have a new message";

    return {
      title,
      body,
      icon: notification.image || notification.icon || data.icon || "/logo192.png",
      data,
    };
  };
  
  messaging.onBackgroundMessage((payload) => {
    console.log("Received background message:", payload);
    const message = buildNotificationMessage(payload);
    const notificationOptions = {
      body: message.body,
      icon: message.icon,
      data: message.data,
    };
  
    self.registration.showNotification(message.title, notificationOptions);
  });
  