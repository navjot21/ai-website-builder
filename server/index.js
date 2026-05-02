import dotenv from "dotenv";
import path from "path";

// ================== ENV LOAD ==================
dotenv.config({
  path: path.resolve("server/.env"),
});

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

// ================== APP ==================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ================== OPENAI ==================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================== MONGODB ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("Mongo Error:", err));

// ================== MODEL ==================
const siteSchema = new mongoose.Schema({
  email: String,
  url: String,
});

const Site = mongoose.model("Site", siteSchema);

// ================== TEMP STORAGE ==================
const sites = {};

// ================== HEALTH ==================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ================== GENERATE ==================
app.post("/generate", async (req, res) => {
  try {
    console.log("🔥 GENERATE HIT");

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

    let json;
    try {
      json = JSON.parse(response.choices[0].message.content);
    } catch {
      console.log("❌ JSON PARSE FAILED");
      return res.json({ result: {} }); // never break frontend
    }

    res.json({ result: json });

  } catch (err) {
    console.error("❌ GENERATE ERROR:", err);
    res.json({ result: {} }); // safe fallback
  }
});

// ================== PUBLISH (100% SAFE) ==================
app.post("/publish", async (req, res) => {
  console.log("🔥 PUBLISH HIT");

  try {
    const id = Date.now().toString();

    const body = req.body || {};
    console.log("BODY:", body);

    const hero = body.hero || "My Website";
    const about = body.about || "";
    const cta = body.cta || "";
    const services = Array.isArray(body.services) ? body.services : [];
    const email = body.email || "";

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

    // store html for rendering
    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    // ================= SAFE DB SAVE =================
    if (email) {
      try {
        await Site.create({ email, url });
        console.log("✅ Saved to MongoDB");
      } catch (dbErr) {
        console.log("⚠️ DB SAVE FAILED:", dbErr.message);
      }
    }

    // ALWAYS SUCCESS
    return res.json({ url });

  } catch (err) {
    console.error("❌ HARD ERROR:", err);

    // NEVER RETURN 500
    return res.json({
      url: "https://ai-website-builder-b6ze.onrender.com",
    });
  }
});

// ================== GET USER SITES ==================
app.get("/mysites/:email", async (req, res) => {
  try {
    const data = await Site.find({ email: req.params.email });
    res.json({ sites: data || [] });
  } catch (err) {
    console.error("❌ FETCH ERROR:", err);
    res.json({ sites: [] }); // never break frontend
  }
});

// ================== SERVE SITE ==================
app.get("/site/:id", (req, res) => {
  const html = sites[req.params.id];

  if (!html) {
    return res.send("Site not found ❌");
  }

  res.send(html);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});