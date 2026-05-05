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
import crypto from "crypto";

const app = express();
// ✅ IMPORTANT (webhook raw)
app.use("/webhook", express.raw({ type: "application/json" }));

app.use(cors({ origin: "*" }));
app.use(express.json());



// ================= OPENAI =================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error(err));

// ================= MODELS =================
const Site = mongoose.model("Site", new mongoose.Schema({
  email: String,
  url: String,
}));

const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  isPro: { type: Boolean, default: false },
}));

const sites = {};

// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {
  try {
    const { email } = req.body;

    const order = await razorpay.orders.create({
      amount: 49900,
      currency: "INR",
      receipt: "order_" + Date.now(),
      notes: {
        email: email, // ✅ FIX
      },
    });

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

// ================= WEBHOOK =================
app.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)  // now this is RAW BUFFER ✅
      .digest("hex");

    if (expected !== signature) {
      console.log("❌ Invalid signature");
      return res.status(400).send("Invalid");
    }

    const payload = JSON.parse(req.body.toString());

    const payment = payload.payload.payment.entity;

    const email =
      payment.notes?.email ||
      payment.email ||
      payment.contact;

    console.log("Webhook email:", email);

    if (payload.event === "payment.captured" && email) {
      let user = await User.findOne({ email });

      if (!user){
        await User.create({ email, isPro: true });
      } else{
        user.isPro = true;
        await user.save();
      } 
      console.log("✅ PRO updated:", email);
    }

    res.json({ status: "ok" });
  

  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error");
  }
});

// ================= GENERATE =================
app.post("/generate", async (req, res) => {
  try {
    const { name, profession, services, tone } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return only JSON." },
        {
          role: "user",
          content: `
Return JSON:
{
 "hero":"",
 "about":"",
 "services":["","",""],
 "cta":""
}

Name:${name}
Profession:${profession}
Services:${services}
Tone:${tone}
`
        },
      ],
    });

    res.json({
      result: JSON.parse(response.choices[0].message.content),
    });

  } catch {
    res.json({ result: {} });
  }
});

// ================= PUBLISH =================
app.post("/publish", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    const count = await Site.countDocuments({ email });

    if (!user?.isPro && count >= 1) {
      return res.json({
        error: "Free plan limit reached 🚀",
      });
    }

    const id = Date.now().toString();

    const { hero, about, services = [], cta } = req.body;

    const html = `
    <html>
    <body style="text-align:center;font-family:Arial">
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

// ================= USER =================
app.get("/user/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  const count = await Site.countDocuments({ email: req.params.email });

  res.json({
    isPro: user?.isPro || false,
    sites: count,
  });
});

// ================= SITES =================
app.get("/mysites/:email", async (req, res) => {
  const data = await Site.find({ email: req.params.email });
  res.json({ sites: data });
});

// ================= SERVE =================
app.get("/site/:id", (req, res) => {
  res.send(sites[req.params.id] || "Not found");
});

app.listen(process.env.PORT || 5000);