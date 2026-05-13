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

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:
    ${theme === "luxury"
      ? "'Playfair Display', serif"
      : "'Inter', sans-serif"};

  background:
    ${theme === "dark"
      ? "#020617"
      : theme === "luxury"
      ? "#0f0f0f"
      : "#f8fafc"};

  color:
    ${theme === "dark" || theme === "luxury"
      ? "white"
      : "#111827"};

  overflow-x:hidden;
}

/* HERO */

.hero{
  padding:120px 20px;
  text-align:center;
  position:relative;

  background:
    ${theme === "startup"
      ? "linear-gradient(135deg,#eff6ff,#dbeafe)"
      : theme === "agency"
      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
      : theme === "dark"
      ? "linear-gradient(135deg,#020617,#111827)"
      : theme === "luxury"
      ? "linear-gradient(135deg,#111,#1e1e1e)"
      : "linear-gradient(135deg,#f8fafc,#e2e8f0)"};
}

.hero::after{
  content:"";
  position:absolute;
  inset:0;

  background:
    radial-gradient(circle at top right,
    rgba(255,255,255,0.08),
    transparent 40%);
}

.hero-content{
  position:relative;
  z-index:2;
  max-width:1000px;
  margin:auto;
}

.hero h1{
  font-size:72px;
  line-height:1.05;
  margin-bottom:25px;
  font-weight:800;
}

.hero p{
  max-width:760px;
  margin:auto;
  line-height:1.9;
  font-size:20px;
  opacity:0.92;
}

.button{
  display:inline-block;
  margin-top:40px;
  padding:18px 38px;
  border-radius:18px;

  background:
    ${theme === "luxury"
      ? "#c9a227"
      : "#2563eb"};

  color:white;
  text-decoration:none;
  font-weight:700;
  font-size:16px;

  box-shadow:
    0 12px 30px rgba(0,0,0,0.25);

  transition:0.3s;
}

.button:hover{
  transform:translateY(-4px);
}

/* STATS */

.stats{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:20px;

  max-width:1100px;
  margin:-60px auto 0;
  padding:0 20px;
  position:relative;
  z-index:5;
}

.stat{
  padding:30px;
  border-radius:24px;

  background:
    rgba(255,255,255,0.08);

  backdrop-filter:blur(20px);

  border:
    1px solid rgba(255,255,255,0.1);

  text-align:center;
}

.stat h2{
  font-size:42px;
  margin-bottom:10px;
}

/* SECTION */

.section{
  padding:110px 20px;
  max-width:1200px;
  margin:auto;
}

.section-title{
  text-align:center;
  margin-bottom:60px;
}

.section-title h2{
  font-size:52px;
  margin-bottom:16px;
}

.section-title p{
  opacity:0.75;
  font-size:18px;
}

/* SERVICES */

.services{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:30px;
}

.card{
  padding:35px;
  border-radius:28px;

  background:
    ${theme === "dark"
      ? "#111827"
      : theme === "luxury"
      ? "#1b1b1b"
      : "white"};

  border:
    1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 10px 40px rgba(0,0,0,0.08);

  transition:0.35s;
}

.card:hover{
  transform:translateY(-8px);
}

.card-icon{
  width:65px;
  height:65px;
  border-radius:20px;

  display:flex;
  align-items:center;
  justify-content:center;

  margin-bottom:22px;

  background:
    ${theme === "agency"
      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
      : "#2563eb"};

  color:white;
  font-size:28px;
}

.card h3{
  font-size:24px;
  margin-bottom:14px;
}

.card p{
  line-height:1.8;
  opacity:0.75;
}

/* SHOWCASE */

.showcase{
  margin-top:80px;

  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:30px;
}

.mockup{
  height:240px;
  border-radius:28px;

  background:
    ${theme === "dark"
      ? "#111827"
      : theme === "luxury"
      ? "#1b1b1b"
      : "white"};

  box-shadow:
    0 15px 50px rgba(0,0,0,0.12);

  position:relative;
  overflow:hidden;
}

.mockup::before{
  content:"";
  position:absolute;
  inset:0;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.12),
      transparent
    );
}

/* CTA */

.cta{
  margin-top:120px;
  padding:80px 40px;
  border-radius:36px;

  text-align:center;

  background:
    ${theme === "agency"
      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
      : theme === "dark"
      ? "#111827"
      : "linear-gradient(135deg,#eff6ff,#dbeafe)"};
}

.cta h2{
  font-size:56px;
  margin-bottom:20px;
}

.cta p{
  max-width:700px;
  margin:auto;
  line-height:1.8;
  opacity:0.9;
}

/* FOOTER */

.footer{
  padding:50px 20px;
  text-align:center;
  opacity:0.7;
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
  font-size:48px;
}

.section-title h2{
  font-size:38px;
}

.cta h2{
  font-size:40px;
}

.hero{
  padding:90px 20px;
}

}

</style>
</head>

<body>

<!-- HERO -->

<div class="hero">

  <div class="hero-content">

    <h1>${hero}</h1>

    <p>${about}</p>

    <a href="#" class="button">
      ${cta}
    </a>

  </div>

</div>

<!-- STATS -->

<div class="stats">

  <div class="stat">
    <h2>10K+</h2>
    <p>Users</p>
  </div>

  <div class="stat">
    <h2>500+</h2>
    <p>Projects</p>
  </div>

  <div class="stat">
    <h2>99%</h2>
    <p>Client Satisfaction</p>
  </div>

</div>

<!-- SERVICES -->

<div class="section">

  <div class="section-title">
    <h2>What We Offer</h2>

    <p>
      Modern solutions designed for growth and performance.
    </p>
  </div>

  <div class="services">

    ${services.map((s) => `
      <div class="card">

        <div class="card-icon">
          ✨
        </div>

        <h3>${s}</h3>

        <p>
          High quality professional service powered by modern AI systems and premium workflows.
        </p>

      </div>
    `).join("")}

  </div>

  <!-- SHOWCASE -->

  <div class="showcase">

    <div class="mockup"></div>
    <div class="mockup"></div>
    <div class="mockup"></div>

  </div>

  <!-- CTA -->

  <div class="cta">

    <h2>
      Ready to Build Something Amazing?
    </h2>

    <p>
      Launch your professional online presence today with powerful AI-driven design.
    </p>

    <a href="#" class="button">
      Get Started
    </a>

  </div>

</div>

<!-- FOOTER -->

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