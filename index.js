const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// API Rate Limiter (z. B. 100 Anfragen pro 15 Minuten pro IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100, // Maximal 100 Anfragen
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// OpenAI-Konfiguration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // API-Schlüssel aus der .env-Datei
});
const openai = new OpenAIApi(configuration);

// Chatbot-Endpunkt
app.post("/chat", async (req, res) => {
    const { message, persona } = req.body;

    if (!message || !persona) {
        return res.status(400).json({ error: "Message and persona are required." });
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
        console.error("Error with OpenAI API:", error.message);
        res.status(500).json({ error: "Failed to fetch a response from OpenAI." });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
