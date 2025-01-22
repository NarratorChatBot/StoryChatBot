const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Überprüfen, ob der API-Schlüssel vorhanden ist
if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OpenAI API Key in environment variables.");
    process.exit(1);
}

// OpenAI-Konfiguration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// API Rate Limiter (z. B. 200 Anfragen pro 10 Minuten pro IP)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 Minuten
    max: 200, // Maximal 200 Anfragen
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Protokollierung aller eingehenden Anfragen
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Chatbot-Endpunkt
app.post("/chat", async (req, res) => {
    const { message, persona } = req.body;

    // Eingabevalidierung
    if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Message must be a non-empty string." });
    }

    if (typeof persona !== "string" || persona.trim().length === 0) {
        return res.status(400).json({ error: "Persona must be a non-empty string." });
    }

    const systemMessage = `You are ${persona}. Respond accordingly.`;

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: message },
            ],
        });

        const botReply = response.data.choices[0].message.content;
        res.json({ reply: botReply });
    } catch (error) {
        if (error.response) {
            console.error("OpenAI API Error:", error.response.data);
            res.status(500).json({ error: error.response.data.error.message });
        } else {
            console.error("Unexpected Error:", error.message);
            res.status(500).json({ error: "Unexpected server error." });
        }
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
