const { GoogleGenerativeAI } = require("@google/generative-ai");

// Make sure your API key is in your .env file!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function getSafetyVerdict(streetName, currentScore, situation) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are the SafePath AI Analytics Engine. 
    A user has filed a community report for ${streetName}.
    
    Current Safety/Lighting Score: ${currentScore}/10.
    User Report: "${situation}"

    Task:
    1. Analyze the sentiment of the report. 
    2. Is this making the street SAFER (e.g., lights fixed, police arrived, safe crowd) or MORE DANGEROUS (e.g., broken lights, crime, accident)?
    3. Calculate the new score (Max 10, Min 1):
       - If POSITIVE/SAFE: Add between +0.5 and +2.0 to the score.
       - If NEGATIVE/UNSAFE: Subtract between -0.5 and -3.0 from the score.
    4. Output ONLY a raw, valid JSON object. Do NOT wrap it in \`\`\`json markdown blocks.

    JSON Format required:
    {
      "new_lighting": <number>,
      "explanation": "<short 1-sentence explanation of why the score increased or decreased>"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        // Clean the response in case Gemini adds markdown formatting
        const cleanJson = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        // Fallback safely if the AI fails
        return { new_lighting: currentScore, explanation: "AI Engine offline. Score unaffected." };
    }
}

module.exports = { getSafetyVerdict };