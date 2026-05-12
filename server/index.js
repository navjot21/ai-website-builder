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

// ✅ Webhook MUST be raw
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
  .catch(err => console.error("Mongo Error:", err));

// ================= MODELS =================
const Site = mongoose.model("Site", new mongoose.Schema({
  email: String,
  url: String,
}));

const User = mongoose.model("User", new mongoose.Schema({
  email: String,
  isPro: { type: Boolean, default: false },
}));

// Temporary HTML storage
const sites = {};

// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {
  try {
    const { email } = req.body;

    const order = await razorpay.orders.create({
      amount: 49900,
      currency: "INR",
      receipt: "order_" + Date.now(),
      notes: { email },
    });

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
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
      .update(req.body)
      .digest("hex");

    if (expected !== signature) {
      console.log("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
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

      if (!user) {
        await User.create({ email, isPro: true });
      } else {
        user.isPro = true;
        await user.save();
      }

      console.log("✅ PRO Activated:", email);
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
    const { name, profession, services, tone } = req.body || {};

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

    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content);
    } catch {
      parsed = {};
    }

    res.json({ result: parsed });

  } catch (err) {
    console.error("GENERATE ERROR:", err);
    res.json({ result: {} });
  }
});

// ================= PUBLISH =================
app.post("/publish", async (req, res) => {
  try {
    const body = req.body || {};
    const { email } = body;

    const user = await User.findOne({ email });
    const count = await Site.countDocuments({ email });

    // 🔒 FREE LIMIT
    if (!user?.isPro && count >= 1) {
      return res.json({
        error: "Free plan limit reached 🚀",
      });
    }

    const id = Date.now().toString();

    const hero = body.hero || "My Website";
    const about = body.about || "";
    const services = Array.isArray(body.services) ? body.services : [];
    const cta = body.cta || "Get Started";
    const theme = body.theme || "startup";

    // ✅ PROFESSIONAL WEBSITE DESIGN
    
const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>${hero}</title>

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:Inter,sans-serif;
  background:
    ${theme === "luxury"
      ? "#0f0f0f"
      : theme === "dark"
      ? "#020617"
      : "#f8fafc"};

  color:
    ${theme === "luxury" || theme === "dark"
      ? "white"
      : "#111827"};
}

.hero{
  padding:120px 20px;
  text-align:center;

  background:
    ${theme === "agency"
      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
      : theme === "luxury"
      ? "linear-gradient(135deg,#111,#222)"
      : theme === "dark"
      ? "linear-gradient(135deg,#020617,#111827)"
      : "linear-gradient(135deg,#eff6ff,#ffffff)"};
}

.hero h1{
  font-size:60px;
  margin-bottom:20px;
}

.hero p{
  max-width:700px;
  margin:auto;
  line-height:1.8;
  opacity:0.9;
  font-size:18px;
}

.button{
  display:inline-block;
  margin-top:35px;
  padding:16px 36px;
  border-radius:14px;
  background:#2563eb;
  color:white;
  text-decoration:none;
  font-weight:bold;
}

.section{
  padding:80px 20px;
  max-width:1200px;
  margin:auto;
}

.services{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:24px;
  margin-top:40px;
}

.card{
  padding:30px;
  border-radius:24px;

  background:
    ${theme === "luxury"
      ? "#1a1a1a"
      : theme === "dark"
      ? "#111827"
      : "white"};

  border:
    ${theme === "dark" || theme === "luxury"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid #e5e7eb"};

  box-shadow:
    ${theme === "startup"
      ? "0 10px 30px rgba(0,0,0,0.05)"
      : "none"};
}

.card h3{
  margin-bottom:14px;
}

.footer{
  padding:40px;
  text-align:center;
  opacity:0.7;
}

</style>
</head>

<body>

<div class="hero">
  <h1>${hero}</h1>

  <p>${about}</p>

  <a class="button" href="#">
    ${cta}
  </a>
</div>

<div class="section">

  <h2 style="text-align:center;font-size:40px;">
    Services
  </h2>

  <div class="services">

    ${services.map((s) => `
      <div class="card">
        <h3>${s}</h3>

        <p>
          Professional high quality service powered by AI.
        </p>
      </div>
    `).join("")}

  </div>

</div>

<div class="footer">
  Powered by AI Website Builder 🚀
</div>

</body>
</html>
`;

    sites[id] = html;

    const url = `https://ai-website-builder-b6ze.onrender.com/site/${id}`;

    await Site.create({ email, url });

    res.json({ url });

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.json({ error: "Publish failed" });
  }
});

// ================= USER =================
app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    const count = await Site.countDocuments({ email: req.params.email });

    res.json({
      isPro: user?.isPro || false,
      sites: count,
    });

  } catch {
    res.json({ isPro: false, sites: 0 });
  }
});

// ================= SITES =================
app.get("/mysites/:email", async (req, res) => {
  try {
    const data = await Site.find({ email: req.params.email });
    res.json({ sites: data || [] });
  } catch {
    res.json({ sites: [] });
  }
});

// ================= SERVE =================
app.get("/site/:id", (req, res) => {
  res.send(sites[req.params.id] || "Not found");
});

// ================= SERVER =================
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});