import dotenv from "dotenv";
import path from "path";

// 🔥 Force correct path
dotenv.config({
  path: path.resolve("server/.env"),
});

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({
  origin: "*",
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { name, profession, services, tone } = req.body;

  try {
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
          content: "You ONLY return valid JSON. No extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.choices[0].message.content;

    // ✅ PARSE HERE (IMPORTANT)
    const json = JSON.parse(text);

    res.json({ result: json }); // send real JSON

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.post("/publish", (req, res) => {
  const { hero, about, services, cta } = req.body;

  const html = `
  <html>
    <head>
      <title>My Website</title>
      <style>
        body { font-family: Arial; padding: 40px; text-align: center; }
        h1 { font-size: 32px; }
        .services { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${hero}</h1>
      <p>${about}</p>

      <div class="services">
        ${services.map(s => `<p>${s}</p>`).join("")}
      </div>

      <button>${cta}</button>
    </body>
  </html>
  `;

  res.json({
    url: "data:text/html;charset=utf-8," + encodeURIComponent(html)
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});