const express = require("express");
const http = require("http");
const { db } = require("./firebase-admin"); // Import Firestore connection

const app = express();
const port = 5000; // Ensure backend runs on a different port from Next.js

// 🔹 Route to Test Firestore Connection
app.get("/api/test-firestore", async (req, res) => {
  try {
    const testCollection = db.collection("test"); // Firestore Collection
    const snapshot = await testCollection.get();

    if (snapshot.empty) {
      return res.json({ success: false, message: "No documents found in Firestore" });
    }

    let data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Firestore connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the Express Server
const httpServer = http.createServer(app);
httpServer.listen(port, () => {
  console.log(`> Backend running at http://localhost:${port}`);
});
