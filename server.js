const express = require('express');
const cors = require('cors'); // <-- ADDED CORS
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
const { calculateSafetyScore } = require('./brain');

const app = express();
app.use(cors()); // <-- ADDED CORS MIDDLEWARE
app.use(express.json());
app.use(express.static('public'));


// --- FIREBASE CONNECTION ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
console.log("🔗 Firebase Cloud Connection: ACTIVE");

// --- ROUTES ---

// 1. Updated Mega-Test Route (Fetches ALL Categories)
app.get('/test-db', async (req, res) => {
    try {
        console.log("Fetching full database state...");
        
        // Fetch all three collections in parallel
        const [anchorsSnap, streetsSnap, crimesSnap] = await Promise.all([
            db.collection('safety_anchors').get(),
            db.collection('street_stats').get(),
            db.collection('crime_hotspots').get()
        ]);

        res.json({
            message: "SafePath Cloud: Full Sync Success",
            counts: {
                anchors: anchorsSnap.size,
                streets: streetsSnap.size,
                crimes: crimesSnap.size
            },
            data: {
                safety_anchors: anchorsSnap.docs.map(doc => doc.data()),
                street_stats: streetsSnap.docs.map(doc => doc.data()),
                crime_hotspots: crimesSnap.docs.map(doc => doc.data())
            }
        });
    } catch (error) {
        console.error("Database Fetch Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. The Original Score Route
app.post('/get-score', (req, res) => {
    const { crime, light, footfall, police, cctv, hosp, reports } = req.body;
    const finalScore = calculateSafetyScore(crime, light, footfall, police, cctv, hosp, reports);
    res.json({
        status: "Success",
        safetyScore: finalScore
    });
});

const PORT = 3000;

const { getSafetyVerdict } = require('./aiController');

// This route lets Gemini "handle" the database fluctuation
app.post('/fluctuate-light', async (req, res) => {
    const { streetName, situation } = req.body;

    try {
        // 1. Find the street in your Firebase
        const streetRef = db.collection('street_stats').where('Street Name', '==', streetName);
        const snapshot = await streetRef.get();

        if (snapshot.empty) return res.status(404).send("Street not found");
        
        const streetDoc = snapshot.docs[0];
        const currentData = streetDoc.data();

        // 2. Ask Gemini for the new score
        const verdict = await getSafetyVerdict(streetName, currentData.lighting_level, situation);

        // 3. AUTOMATIC UPDATE: Change the database based on Gemini's answer
        await streetDoc.ref.update({ lighting_level: verdict.new_lighting });

        res.json({
            message: `Gemini has updated ${streetName}`,
            old_lighting: currentData.lighting_level,
            new_lighting: verdict.new_lighting,
            reason: verdict.explanation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SafePath Server is alive on http://localhost:${PORT}`);
});