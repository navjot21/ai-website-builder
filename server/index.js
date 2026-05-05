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

// ================== DB ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("Mongo Error:", err));

// ================== MODELS ==================
const siteSchema = new mongoose.Schema({
  email: String,
  url: String,
});

const userSchema = new mongoose.Schema({
  email: String,
  isPro: {
    type: Boolean,
    default: false,
  },
});

const Site = mongoose.model("Site", siteSchema);
const User = mongoose.model("User", userSchema);

const sites = {};

// ================== CREATE ORDER ==================
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 49900,
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    res.status(500).json({ error: "Payment failed" });
  }
});

// ================== UPGRADE ==================
app.post("/upgrade", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, isPro: true });
  } else {
    user.isPro = true;
    await user.save();
  }

  res.json({ success: true });
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

  } catch {
    res.json({ result: {} });
  }
});

// ================== PUBLISH ==================
app.post("/publish", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    const count = await Site.countDocuments({ email });

    // 🔒 FREE LIMIT
    if (!user?.isPro && count >= 1) {
      return res.json({
        error: "Free plan limit reached. Upgrade to Pro 🚀",
      });
    }

    const id = Date.now().toString();

    const { hero, about, services = [], cta } = req.body;

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

    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    await Site.create({ email, url });

    res.json({ url });

  } catch {
    res.json({ error: "Publish failed" });
  }
});

// ================== MY SITES ==================
app.get("/mysites/:email", async (req, res) => {
  const data = await Site.find({ email: req.params.email });
  res.json({ sites: data || [] });
});

// ================== SERVE ==================
app.get("/site/:id", (req, res) => {
  res.send(sites[req.params.id] || "Not found");
});

app.listen(process.env.PORT || 5000);