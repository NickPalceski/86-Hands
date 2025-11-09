// Handles Gemini API

const PROXY_URL = 'https://geminiproxy-53jbuxguwq-uc.a.run.app'; 


// Sends the speech text to the secure GCF proxy for AI processing
export async function fetchCommand(speechText) {
    console.log("Sending speech to GCF proxy for AI parsing...");
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ speechText: speechText })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error: Proxy failed (Status ${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.command.trim(); 

    } catch (error) { // Error Handler
        console.error("API Proxy Fetch Error:", error);
        // Fallback command or structure
        return "error_command: failed_ai_parse";
    }
}