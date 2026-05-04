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
      return res.json({ result: {} });
    }

    res.json({ result: json });

  } catch (err) {
    console.error("❌ GENERATE ERROR:", err);
    res.json({ result: {} });
  }
});

// ================== PUBLISH (UPGRADED UI) ==================
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

    // ✅ NEW PREMIUM TEMPLATE
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${hero}</title>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f9fafb;
  color: #111;
}

.hero {
  background: linear-gradient(135deg, #000, #333);
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.hero h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.hero p {
  font-size: 18px;
  opacity: 0.9;
}

.hero button {
  margin-top: 20px;
  padding: 12px 24px;
  background: white;
  color: black;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.section {
  padding: 60px 20px;
  text-align: center;
}

.services {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  max-width: 900px;
  margin: auto;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: gray;
}
</style>
</head>

<body>

<div class="hero">
  <h1>${hero}</h1>
  <p>${about}</p>
  <button>${cta}</button>
</div>

<div class="section">
  <h2>Services</h2>
  <div class="services">
    ${(services || []).map(s => `<div class="card">${s}</div>`).join("")}
  </div>
</div>

<div class="footer">
  Built with AI Website Builder 🚀
</div>

</body>
</html>
`;

    // store html
    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    // SAFE DB SAVE
    if (email) {
      try {
        await Site.create({ email, url });
        console.log("✅ Saved to MongoDB");
      } catch (dbErr) {
        console.log("⚠️ DB SAVE FAILED:", dbErr.message);
      }
    }

    return res.json({ url });

  } catch (err) {
    console.error("❌ HARD ERROR:", err);

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
    res.json({ sites: [] });
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