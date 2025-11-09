import { GoogleGenAI } from '@google/genai';

// Use a variable to store the initialized client globally (lazy initialization)
let aiClient;

// 1. Corrected Export and Handler Function
export const geminiProxy = async (req, res) => {
    // Check if the client is already initialized. If not, initialize it.
    if (!aiClient) {
        try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
            if (!GEMINI_API_KEY) {
                console.error("GEMINI_API_KEY is not defined.");
                return res.status(500).send('Configuration Error: API Key missing.');
            }
            aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        } catch (error) {
            console.error("Client Initialization Error:", error);
            // This is a startup failure, but now it's caught in the request flow.
            return res.status(500).send('Internal Server Error during client setup.');
        }
    }

    // --- CORS Headers (Crucial for Chrome Extensions) ---
    res.set('Access-Control-Allow-Origin', '*'); 

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }
    
    // Ensure the request is a POST and has a body
    if (req.method !== 'POST' || !req.body.speechText) {
        return res.status(400).send('Please send a POST request with "speechText" in the body.');
    }

    try {
        const { speechText } = req.body;
        
        const prompt = `Translate this user speech "${speechText}" into a concise, single-line computer command or action based on the context of a browser extension.`;

        // 2. Call the Gemini API using the initialized client
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // 3. Return the clean, processed command back to the extension
        res.status(200).json({ command: response.text.trim() });
    } catch (error) {
        console.error("Gemini API Runtime Error:", error);
        res.status(500).send('Internal server error during API call.');
    }
};