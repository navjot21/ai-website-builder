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

    // ✅ PROFESSIONAL WEBSITE DESIGN
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>${hero}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:'Inter',sans-serif;
  background:#020617;
  color:white;
  overflow-x:hidden;
}

/* HERO */

.hero{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:40px;
  background:
  radial-gradient(circle at top left,#2563eb33,transparent 40%),
  radial-gradient(circle at bottom right,#22c55e22,transparent 40%),
  #020617;
}

.hero-content{
  max-width:1000px;
}

.badge{
  display:inline-block;
  padding:10px 20px;
  border-radius:999px;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.1);
  margin-bottom:25px;
  font-size:14px;
  color:#cbd5e1;
  backdrop-filter:blur(10px);
}

.hero h1{
  font-size:72px;
  line-height:1.1;
  margin-bottom:25px;
  font-weight:800;
}

.hero p{
  color:#cbd5e1;
  font-size:20px;
  line-height:1.8;
  margin-bottom:40px;
}

/* BUTTON */

.cta-btn{
  display:inline-block;
  padding:18px 40px;
  border-radius:18px;
  background:linear-gradient(135deg,#2563eb,#3b82f6);
  color:white;
  text-decoration:none;
  font-weight:700;
  font-size:18px;
  box-shadow:0 15px 40px rgba(37,99,235,0.35);
  transition:0.3s;
}

.cta-btn:hover{
  transform:translateY(-4px);
}

/* SERVICES */

.section{
  padding:100px 20px;
}

.section-title{
  text-align:center;
  font-size:48px;
  margin-bottom:20px;
  font-weight:800;
}

.section-sub{
  text-align:center;
  color:#94a3b8;
  max-width:700px;
  margin:auto;
  margin-bottom:60px;
  line-height:1.8;
}

.services{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:25px;
  max-width:1200px;
  margin:auto;
}

.card{
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.08);
  padding:35px;
  border-radius:24px;
  backdrop-filter:blur(20px);
  transition:0.3s;
}

.card:hover{
  transform:translateY(-6px);
  border-color:#2563eb;
}

.card h3{
  font-size:24px;
  margin-bottom:14px;
}

.card p{
  color:#94a3b8;
  line-height:1.7;
}

/* STATS */

.stats{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:20px;
  max-width:1000px;
  margin:auto;
}

.stat{
  text-align:center;
  padding:40px;
  border-radius:24px;
  background:rgba(255,255,255,0.04);
}

.stat h2{
  font-size:52px;
  color:#3b82f6;
  margin-bottom:10px;
}

.stat p{
  color:#cbd5e1;
}

/* FOOTER */

.footer{
  padding:40px;
  text-align:center;
  color:#64748b;
  border-top:1px solid rgba(255,255,255,0.08);
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
  font-size:42px;
}

.hero p{
  font-size:16px;
}

.section-title{
  font-size:34px;
}

}

</style>
</head>

<body>

<!-- HERO -->

<section class="hero">

<div class="hero-content">

<div class="badge">
🚀 AI Powered Professional Website
</div>

<h1>${hero}</h1>

<p>
${about}
</p>

<a href="#" class="cta-btn">
${cta}
</a>

</div>

</section>

<!-- SERVICES -->

<section class="section">

<h2 class="section-title">
Services
</h2>

<p class="section-sub">
Professional solutions designed to help your business grow faster with modern digital expertise.
</p>

<div class="services">

${services.map((s) => `
<div class="card">
<h3>${s}</h3>
<p>
High-quality professional service tailored for modern businesses and personal brands.
</p>
</div>
`).join("")}

</div>

</section>

<!-- STATS -->

<section class="section">

<h2 class="section-title">
Why Choose Us
</h2>

<div class="stats">

<div class="stat">
<h2>100%</h2>
<p>Client Satisfaction</p>
</div>

<div class="stat">
<h2>24/7</h2>
<p>Support & Communication</p>
</div>

<div class="stat">
<h2>AI</h2>
<p>Powered Modern Websites</p>
</div>

</div>

</section>

<!-- FOOTER -->

<div class="footer">
Built with AI Website Builder 🚀
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