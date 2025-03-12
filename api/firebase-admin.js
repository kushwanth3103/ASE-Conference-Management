const admin = require("firebase-admin");
const serviceAccount = require("./conference-management-2c85f-firebase-adminsdk-fbsvc-2bcd3cd034.json"); // Path to downloaded key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = { db };