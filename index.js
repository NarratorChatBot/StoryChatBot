const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Konfiguration der OpenAI API
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Endpunkt für Chatbot-Anfragen
app.post("/chat", async (req, res) => {
    const { message, persona } = req.body;
    const systemMessage = `You are ${persona}. Respond accordingly.`;

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: message },
            ],
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
