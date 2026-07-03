// Service worker utk FCM background notification.
// Harus di root path (/firebase-messaging-sw.js) supaya scope = /.
// Dipakai test-fcm.html — nanti frontend PWA punya SW-nya sendiri.
//
// Note: SW pakai importScripts (compat SDK) karena classic worker context
// tidak support ES modules di semua browser lama.

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// !!! Isi manual sesuai Firebase Web config kamu !!!
// SW tidak bisa baca dari localStorage / DOM — hardcode di sini.
// Kalau kosong, background push tidak jalan (foreground onMessage tetap OK).
const FIREBASE_CONFIG = {
    apiKey:            "PASTE_API_KEY",
    authDomain:        "golden-f64c8.firebaseapp.com",
    projectId:         "golden-f64c8",
    storageBucket:     "golden-f64c8.firebasestorage.app",
    messagingSenderId: "PASTE_SENDER_ID",
    appId:             "PASTE_APP_ID",
};

try {
    firebase.initializeApp(FIREBASE_CONFIG);
    const messaging = firebase.messaging();

    // Background handler — dipanggil kalau tab tidak fokus.
    // Kalau kamu tidak define ini, Firebase tetap show notif default
    // (dari payload.notification). Custom-nya untuk deep-link.
    messaging.onBackgroundMessage(payload => {
        const n = payload.notification || {};
        const data = payload.data || {};
        self.registration.showNotification(n.title || "Notifikasi", {
            body: n.body || "",
            icon: "/assets/img/icons/pdf.svg", // ganti sesuai icon kamu
            data: { route: data.route || "/" },
        });
    });

    // Klik notifikasi → buka route yg dikirim server (data.route).
    self.addEventListener("notificationclick", event => {
        event.notification.close();
        const route = event.notification.data?.route || "/";
        event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(list => {
                for (const c of list) {
                    if ("focus" in c) { c.navigate(route); return c.focus(); }
                }
                if (clients.openWindow) return clients.openWindow(route);
            }));
    });
} catch (e) {
    console.warn("[FCM SW] init gagal:", e && e.message);
}
