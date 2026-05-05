import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("server/.env"),
});

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Razorpay from "razorpay";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ================== OPENAI ==================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================== RAZORPAY ==================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
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

// TEMP storage
const sites = {};

// ================== HEALTH ==================
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// ================== CREATE ORDER ==================
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 49900, // ₹499
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("RAZORPAY ERROR:", err);
    res.status(500).json({ error: "Payment failed" });
  }
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

    let json;
    try {
      json = JSON.parse(response.choices[0].message.content);
    } catch {
      return res.json({ result: {} });
    }

    res.json({ result: json });

  } catch (err) {
    console.error(err);
    res.json({ result: {} });
  }
});

// ================== PUBLISH ==================
app.post("/publish", async (req, res) => {
  try {
    const id = Date.now().toString();

    const { email, hero, about, services = [], cta } = req.body || {};

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${hero}</title>

<style>
body {
  margin: 0;
  font-family: Arial;
  background: #f9fafb;
  text-align: center;
}

.hero {
  background: black;
  color: white;
  padding: 60px;
}

.section {
  padding: 40px;
}

.services {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.card {
  background: white;
  padding: 15px;
  border-radius: 10px;
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
    ${services.map(s => `<div class="card">${s}</div>`).join("")}
  </div>
</div>

</body>
</html>
`;

    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    if (email) {
      try {
        await Site.create({ email, url });
      } catch {}
    }

    res.json({ url });

  } catch (err) {
    res.json({ url: "/" });
  }
});

// ================== GET USER SITES ==================
app.get("/mysites/:email", async (req, res) => {
  try {
    const data = await Site.find({ email: req.params.email });
    res.json({ sites: data || [] });
  } catch {
    res.json({ sites: [] });
  }
});

// ================== SERVE ==================
app.get("/site/:id", (req, res) => {
  res.send(sites[req.params.id] || "Not found");
});

// ================== SERVER ==================
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});