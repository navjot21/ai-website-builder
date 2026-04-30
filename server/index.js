import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("server/.env"),
});

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

// ================== MONGODB CONNECT ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("Mongo Error:", err));

// ================== MODELS ==================
const siteSchema = new mongoose.Schema({
  email: String,
  url: String,
});

const Site = mongoose.model("Site", siteSchema);

// ================== APP SETUP ==================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TEMP HTML storage (still needed for rendering pages)
const sites = {};

// ================== HEALTH ==================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ================== GENERATE ==================
app.post("/generate", async (req, res) => {
  try {
    const { name, profession, services, tone } = req.body;

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

    const json = JSON.parse(response.choices[0].message.content);

    res.json({ result: json });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ================== PUBLISH (UPDATED WITH DB) ==================
app.post("/publish", async (req, res) => {
  try {
    const id = Date.now().toString();
    const { email, hero, about, services = [], cta } = req.body;

    const html = `
    <html>
    <body style="font-family:Arial;text-align:center;">
    <h1>${hero}</h1>
    <p>${about}</p>
    ${services.map(s => `<p>${s}</p>`).join("")}
    <button>${cta}</button>
    </body>
    </html>
    `;

    // still needed for serving page
    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    // ✅ SAVE TO MONGODB
    if (email) {
      await Site.create({ email, url });
    }

    res.json({ url });

  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

// ================== GET USER SITES (FROM DB) ==================
app.get("/mysites/:email", async (req, res) => {
  try {
    const sites = await Site.find({ email: req.params.email });
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

// ================== SERVE SITE ==================
app.get("/site/:id", (req, res) => {
  res.send(sites[req.params.id] || "Not found");
});

// ================== SERVER ==================
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});