import adminFirebase from 'firebase-admin';
const serviceAccount = process.env.FIREBASE_CREDENTIALS_COMMERCE ? JSON.parse(process.env.FIREBASE_CREDENTIALS_COMMERCE) : null;

const admin = adminFirebase.initializeApp({
  credential: adminFirebase.credential.cert(serviceAccount),
});

export default admin;
