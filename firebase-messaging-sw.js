
// Scripts for firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyCNGHbyUG8eRbXwye7TnLLCPlZ5ry9UpwU",
  authDomain: "vannienlich-e4236.firebaseapp.com",
  projectId: "vannienlich-e4236",
  storageBucket: "vannienlich-e4236.firebasestorage.app",
  messagingSenderId: "157418375712",
  appId: "1:157418375712:web:fc4eac16c48df208e28a45"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/calendar.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
