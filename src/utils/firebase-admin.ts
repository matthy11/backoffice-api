import adminFirebase from "firebase-admin";

const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS || '');
const admin = adminFirebase.initializeApp({
  credential: adminFirebase.credential.cert(firebaseCredentials),
}, 'fire-admin');

export default admin;
