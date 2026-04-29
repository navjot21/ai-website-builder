import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("server/.env"),
});

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================== HEALTH ==================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ================== GENERATE ==================
app.post("/generate", async (req, res) => {
  try {
    const { name, profession, services, tone } = req.body || {};

    const prompt = `
Return ONLY valid JSON.

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
        { role: "system", content: "Return only JSON." },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0].message.content;

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    res.json({ result: json });

  } catch (error) {
    console.error("GENERATE ERROR:", error);
    res.status(500).json({ error: "AI failed" });
  }
});

// ================== PUBLISH ==================
app.post("/publish", (req, res) => {
  try {
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
body { margin:0; font-family:Arial; background:#f5f5f5; text-align:center; }
.hero { background:black; color:white; padding:60px 20px; }
.section { padding:40px 20px; }
.services { display:flex; flex-wrap:wrap; justify-content:center; gap:15px; }
.card { background:white; padding:15px; border-radius:10px; width:250px; }
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
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});