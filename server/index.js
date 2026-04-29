import dotenv from "dotenv";
import path from "path";

// ✅ Load env safely
dotenv.config({
  path: path.resolve("server/.env"),
});

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ OpenAI init
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ================== GENERATE ==================
app.post("/generate", async (req, res) => {
  try {
    const { name, profession, services, tone } = req.body || {};

    const prompt = `
Return ONLY valid JSON. No text outside JSON.

{
  "hero": "...",
  "about": "...",
  "services": ["...", "...", "..."],
  "cta": "..."
}

Name: ${name}
Profession: ${profession}
Services: ${services}
Tone: ${tone}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You ONLY return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.choices[0].message.content;

    // ✅ SAFE PARSE (IMPORTANT FIX)
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", text);
      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    res.json({ result: json });

  } catch (error) {
    console.error("❌ GENERATE ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
});

// ================== PUBLISH ==================
app.post("/publish", (req, res) => {
  try {
    // ✅ SAFE BODY HANDLING
    const body = req.body || {};

    const hero = body.hero || "My Website";
    const about = body.about || "";
    const cta = body.cta || "Get Started";

    const services = Array.isArray(body.services) ? body.services : [];

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>My Website</title>

        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            text-align: center;
          }

          .hero {
            background: black;
            color: white;
            padding: 60px 20px;
          }

          .hero h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }

          .hero button {
            padding: 10px 20px;
            background: white;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }

          .section {
            padding: 40px 20px;
          }

          .services {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
          }

          .card {
            background: white;
            padding: 15px;
            border-radius: 10px;
            width: 250px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        </style>
      </head>

      <body>

        <div class="hero">
          <h1>${hero}</h1>
          <button>${cta}</button>
        </div>

        <div class="section">
          <h2>About</h2>
          <p>${about}</p>
        </div>

        <div class="section">
          <h2>Services</h2>
          <div class="services">
            ${services.map(s => `<div class="card">${s}</div>`).join("")}
          </div>
        </div>

      </body>
    </html>
    `;

    res.json({
      url: "data:text/html;charset=utf-8," + encodeURIComponent(html),
    });

  } catch (err) {
    console.error("❌ PUBLISH ERROR:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

// ================== GLOBAL ERROR HANDLERS ==================
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT ERROR:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED PROMISE:", err);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});