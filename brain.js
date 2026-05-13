// brain.js
// Feature 1: The SafePath Safety Score Engine

function calculateSafetyScore(crimeSafety, lightLevel, footfall, policeProximity, cctvCoverage, hospitalProximity, communityReports) {
    
    // Applying the exact weights from your SafePath Formula
    const score = (crimeSafety * 0.30) + 
                  (lightLevel * 0.25) + 
                  (footfall * 0.20) + 
                  (policeProximity * 0.10) + 
                  (cctvCoverage * 0.10) + 
                  (hospitalProximity * 0.03) + 
                  (communityReports * 0.02);

    // Round the final score to one decimal place for a clean UI
    return Math.round(score * 10) / 10;
}

// --- TESTING THE ENGINE ---
// Let's test it by simulating a route with mock data (scores out of 100)
// E.g., High crime safety (low crime), good lighting, high footfall
const mockRouteScore = calculateSafetyScore(88, 88, 80, 90, 70, 80, 80);

console.log("⚙️ Booting up SafePath Engine...");
console.log("✅ Calculated Safety Score: " + mockRouteScore + " / 100");

// This line "exports" the function so our future API can use it
module.exports = { calculateSafetyScore };