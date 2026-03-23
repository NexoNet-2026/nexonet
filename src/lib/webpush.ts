import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const email = process.env.VAPID_EMAIL || "mailto:soporte@nexonet.ar";

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
}

export { webpush, publicKey };
