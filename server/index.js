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
    

let html = "";

/* ================= STARTUP THEME ================= */

if (theme === "startup") {

html = `
<!DOCTYPE html>
<html>
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

/* NAVBAR */

.nav{
  padding:24px 8%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  position:sticky;
  top:0;
  z-index:50;

  backdrop-filter:blur(18px);

  background:rgba(2,6,23,0.7);

  border-bottom:
    1px solid rgba(255,255,255,0.06);
}

.logo{
  font-size:24px;
  font-weight:800;
}

.nav-btn{
  padding:12px 24px;
  border-radius:14px;
  background:#2563eb;
  color:white;
  text-decoration:none;
  font-weight:600;
}

/* HERO */

.hero{
  padding:120px 8%;
  text-align:center;
  position:relative;
}

.hero::before{
  content:"";
  position:absolute;
  width:600px;
  height:600px;

  background:#2563eb;
  filter:blur(180px);
  opacity:0.15;

  top:-200px;
  left:50%;
  transform:translateX(-50%);
}

.hero-content{
  position:relative;
  z-index:2;
}

.badge{
  display:inline-block;
  padding:10px 18px;
  border-radius:999px;

  background:
    rgba(255,255,255,0.08);

  border:
    1px solid rgba(255,255,255,0.08);

  margin-bottom:28px;

  font-size:14px;
}

.hero h1{
  font-size:82px;
  line-height:1.05;
  max-width:1100px;
  margin:auto;
  margin-bottom:28px;
  font-weight:800;
}

.gradient{
  background:
    linear-gradient(135deg,#60a5fa,#a78bfa);

  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}

.hero p{
  max-width:760px;
  margin:auto;

  line-height:1.9;
  font-size:20px;

  color:#cbd5e1;
}

.hero-buttons{
  margin-top:42px;

  display:flex;
  justify-content:center;
  gap:18px;
  flex-wrap:wrap;
}

.primary-btn{
  padding:18px 34px;
  border-radius:18px;

  background:
    linear-gradient(135deg,#2563eb,#3b82f6);

  color:white;
  text-decoration:none;
  font-weight:700;

  box-shadow:
    0 14px 40px rgba(37,99,235,0.4);
}

.secondary-btn{
  padding:18px 34px;
  border-radius:18px;

  background:
    rgba(255,255,255,0.06);

  border:
    1px solid rgba(255,255,255,0.08);

  color:white;
  text-decoration:none;
}

/* STATS */

.stats{
  padding:20px 8% 100px;

  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(240px,1fr));

  gap:24px;
}

.stat{
  padding:34px;
  border-radius:28px;

  background:
    rgba(255,255,255,0.05);

  border:
    1px solid rgba(255,255,255,0.08);

  backdrop-filter:blur(20px);
}

.stat h2{
  font-size:48px;
  margin-bottom:12px;
}

.stat p{
  color:#cbd5e1;
}

/* SERVICES */

.section{
  padding:120px 8%;
}

.section-title{
  text-align:center;
  margin-bottom:70px;
}

.section-title h2{
  font-size:58px;
  margin-bottom:18px;
}

.section-title p{
  color:#cbd5e1;
  font-size:18px;
}

.services{
  display:grid;

  grid-template-columns:
    repeat(auto-fit,minmax(300px,1fr));

  gap:28px;
}

.card{
  padding:38px;
  border-radius:32px;

  background:
    rgba(255,255,255,0.05);

  border:
    1px solid rgba(255,255,255,0.08);

  transition:0.35s;

  position:relative;
  overflow:hidden;
}

.card::before{
  content:"";
  position:absolute;
  inset:0;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.08),
      transparent
    );
}

.card:hover{
  transform:translateY(-10px);
}

.icon{
  width:72px;
  height:72px;

  border-radius:24px;

  display:flex;
  align-items:center;
  justify-content:center;

  background:
    linear-gradient(135deg,#2563eb,#7c3aed);

  font-size:28px;

  margin-bottom:26px;
}

.card h3{
  font-size:28px;
  margin-bottom:18px;
}

.card p{
  line-height:1.9;
  color:#cbd5e1;
}

/* DASHBOARD MOCKUP */

.mockup{
  margin-top:100px;

  border-radius:36px;
  overflow:hidden;

  background:
    rgba(255,255,255,0.04);

  border:
    1px solid rgba(255,255,255,0.08);

  padding:30px;
}

.mockup-header{
  display:flex;
  gap:10px;
  margin-bottom:24px;
}

.dot{
  width:14px;
  height:14px;
  border-radius:999px;
  background:#334155;
}

.mockup-grid{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:24px;
}

.panel{
  background:#0f172a;
  border-radius:24px;
  min-height:280px;
}

/* CTA */

.cta{
  margin-top:120px;

  padding:90px 40px;

  border-radius:40px;

  text-align:center;

  background:
    linear-gradient(135deg,#2563eb,#7c3aed);
}

.cta h2{
  font-size:64px;
  margin-bottom:24px;
}

.cta p{
  max-width:700px;
  margin:auto;
  line-height:1.9;
  font-size:18px;
  opacity:0.95;
}

.cta-btn{
  display:inline-block;
  margin-top:36px;

  padding:18px 38px;

  border-radius:18px;

  background:white;
  color:#111827;

  text-decoration:none;
  font-weight:700;
}

/* FOOTER */

.footer{
  padding:60px 20px;
  text-align:center;
  color:#94a3b8;
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
  font-size:52px;
}

.section-title h2{
  font-size:40px;
}

.cta h2{
  font-size:42px;
}

.mockup-grid{
  grid-template-columns:1fr;
}

}

</style>
</head>

<body>

<!-- NAV -->

<div class="nav">

  <div class="logo">
    AI Builder
  </div>

  <a href="#" class="nav-btn">
    Get Started
  </a>

</div>

<!-- HERO -->

<div class="hero">

  <div class="hero-content">

    <div class="badge">
      🚀 AI Powered Startup Platform
    </div>

    <h1>
      ${hero}
      <span class="gradient">
        Faster Than Ever
      </span>
    </h1>

    <p>
      ${about}
    </p>

    <div class="hero-buttons">

      <a href="#" class="primary-btn">
        ${cta}
      </a>

      <a href="#" class="secondary-btn">
        Watch Demo
      </a>

    </div>

  </div>

</div>

<!-- STATS -->

<div class="stats">

  <div class="stat">
    <h2>10K+</h2>
    <p>Users Worldwide</p>
  </div>

  <div class="stat">
    <h2>500+</h2>
    <p>Projects Completed</p>
  </div>

  <div class="stat">
    <h2>99%</h2>
    <p>Customer Satisfaction</p>
  </div>

</div>

<!-- SERVICES -->

<div class="section">

  <div class="section-title">

    <h2>
      Powerful Services
    </h2>

    <p>
      Designed for startups, creators and businesses.
    </p>

  </div>

  <div class="services">

    ${services.map((s) => `
      <div class="card">

        <div class="icon">
          ✨
        </div>

        <h3>${s}</h3>

        <p>
          Premium AI powered service designed for performance and growth.
        </p>

      </div>
    `).join("")}

  </div>

  <!-- MOCKUP -->

  <div class="mockup">

    <div class="mockup-header">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <div class="mockup-grid">

      <div class="panel"></div>

      <div class="panel"></div>

    </div>

  </div>

  <!-- CTA -->

  <div class="cta">

    <h2>
      Build Your Future Today
    </h2>

    <p>
      Launch modern websites and scale your business using AI.
    </p>

    <a href="#" class="cta-btn">
      Start Now
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

}

/* ================= LUXURY THEME ================= */

if (theme === "luxury") {

html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>${hero}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
background:#0a0a0a;
color:#f5f5f5;
overflow-x:hidden;
font-family:'Manrope',sans-serif;
}

/* HERO */

.hero{
min-height:100vh;

display:flex;
align-items:center;
justify-content:center;

padding:120px 8%;

position:relative;

background:
linear-gradient(
135deg,
#0a0a0a,
#111111
);
}

.hero::before{
content:"";
position:absolute;
width:700px;
height:700px;

background:
radial-gradient(
circle,
rgba(201,162,39,0.18),
transparent 70%
);

top:-200px;
right:-100px;
}

.hero-content{
position:relative;
z-index:2;
max-width:1000px;
text-align:center;
}

.luxury-badge{
display:inline-block;

padding:10px 22px;

border:
1px solid rgba(201,162,39,0.5);

border-radius:999px;

margin-bottom:32px;

color:#c9a227;
font-size:14px;
letter-spacing:2px;
text-transform:uppercase;
}

.hero h1{
font-family:
'Cormorant Garamond',serif;

font-size:96px;
line-height:1;
font-weight:700;

margin-bottom:28px;
}

.hero p{
max-width:760px;
margin:auto;

font-size:22px;
line-height:1.9;

color:#d4d4d4;
}

.button{
display:inline-block;

margin-top:46px;

padding:18px 42px;

border:
1px solid #c9a227;

border-radius:999px;

color:#c9a227;
text-decoration:none;

font-weight:600;
letter-spacing:1px;

transition:0.35s;
}

.button:hover{
background:#c9a227;
color:black;
}

/* SECTION */

.section{
padding:120px 8%;
}

.section-title{
text-align:center;
margin-bottom:80px;
}

.section-title h2{
font-family:
'Cormorant Garamond',serif;

font-size:72px;
margin-bottom:20px;
}

.section-title p{
font-size:20px;
color:#bdbdbd;
}

/* SERVICES */

.services{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(320px,1fr));

gap:30px;
}

.card{
padding:50px;

border:
1px solid rgba(255,255,255,0.08);

background:
linear-gradient(
135deg,
rgba(255,255,255,0.03),
rgba(255,255,255,0.01)
);

backdrop-filter:blur(14px);

border-radius:36px;

position:relative;
overflow:hidden;

transition:0.35s;
}

.card::before{
content:"";
position:absolute;
inset:0;

background:
linear-gradient(
135deg,
rgba(201,162,39,0.12),
transparent 40%
);
}

.card:hover{
transform:translateY(-8px);
border-color:
rgba(201,162,39,0.4);
}

.card-number{
font-size:18px;
color:#c9a227;
margin-bottom:28px;
}

.card h3{
font-family:
'Cormorant Garamond',serif;

font-size:42px;
margin-bottom:20px;
}

.card p{
line-height:1.9;
color:#d4d4d4;
}

/* SHOWCASE */

.showcase{
margin-top:100px;

display:grid;
grid-template-columns:
repeat(auto-fit,minmax(340px,1fr));

gap:30px;
}

.showcase-box{
height:420px;

border-radius:36px;

background:
linear-gradient(
135deg,
#151515,
#0d0d0d
);

border:
1px solid rgba(255,255,255,0.08);

position:relative;
overflow:hidden;
}

.showcase-box::before{
content:"";
position:absolute;
inset:0;

background:
radial-gradient(
circle at top,
rgba(201,162,39,0.12),
transparent 50%
);
}

/* STATS */

.stats{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(260px,1fr));

gap:24px;

margin-top:90px;
}

.stat{
padding:50px;

border-radius:30px;

background:
rgba(255,255,255,0.03);

border:
1px solid rgba(255,255,255,0.08);

text-align:center;
}

.stat h2{
font-family:
'Cormorant Garamond',serif;

font-size:64px;

color:#c9a227;

margin-bottom:10px;
}

.stat p{
color:#d4d4d4;
}

/* CTA */

.cta{
margin-top:120px;

padding:100px 40px;

border-radius:40px;

text-align:center;

background:
linear-gradient(
135deg,
#151515,
#0d0d0d
);

border:
1px solid rgba(255,255,255,0.08);
}

.cta h2{
font-family:
'Cormorant Garamond',serif;

font-size:82px;
margin-bottom:24px;
}

.cta p{
max-width:760px;
margin:auto;

font-size:20px;
line-height:1.9;

color:#d4d4d4;
}

/* FOOTER */

.footer{
padding:60px 20px;

text-align:center;

color:#888;
font-size:14px;
letter-spacing:2px;
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
font-size:62px;
}

.section-title h2{
font-size:50px;
}

.cta h2{
font-size:56px;
}

}

</style>
</head>

<body>

<!-- HERO -->

<div class="hero">

<div class="hero-content">

<div class="luxury-badge">
Luxury Experience
</div>

<h1>${hero}</h1>

<p>
${about}
</p>

<a href="#" class="button">
${cta}
</a>

</div>

</div>

<!-- SERVICES -->

<div class="section">

<div class="section-title">

<h2>
Exclusive Services
</h2>

<p>
Premium solutions crafted with elegance and precision.
</p>

</div>

<div class="services">

${services.map((s, i)=>`
<div class="card">

<div class="card-number">
0${i + 1}
</div>

<h3>${s}</h3>

<p>
Luxury-level experience designed for elite brands and premium clients.
</p>

</div>
`).join("")}

</div>

<!-- SHOWCASE -->

<div class="showcase">

<div class="showcase-box"></div>
<div class="showcase-box"></div>
<div class="showcase-box"></div>

</div>

<!-- STATS -->

<div class="stats">

<div class="stat">
<h2>15+</h2>
<p>Years Experience</p>
</div>

<div class="stat">
<h2>500+</h2>
<p>Luxury Clients</p>
</div>

<div class="stat">
<h2>98%</h2>
<p>Client Retention</p>
</div>

</div>

<!-- CTA -->

<div class="cta">

<h2>
Crafted For Excellence
</h2>

<p>
Elevate your digital presence with timeless luxury design and premium experiences.
</p>

<a href="#" class="button">
Get Started
</a>

</div>

</div>

<!-- FOOTER -->

<div class="footer">
LUXURY DIGITAL EXPERIENCE
</div>

</body>
</html>
`;

}

/* ================= DARK AI THEME ================= */

if (theme === "dark") {

html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>${hero}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
font-family:'Space Grotesk',sans-serif;
background:#020617;
color:white;
overflow-x:hidden;
}

/* BACKGROUND GLOW */

.bg-glow{
position:fixed;
width:900px;
height:900px;

background:
radial-gradient(
circle,
rgba(37,99,235,0.22),
transparent 70%
);

top:-300px;
left:50%;
transform:translateX(-50%);

pointer-events:none;
z-index:0;
}

/* HERO */

.hero{
position:relative;
z-index:2;

padding:140px 8% 100px;
text-align:center;
}

.ai-badge{
display:inline-flex;
align-items:center;
gap:10px;

padding:10px 20px;

border-radius:999px;

background:
rgba(255,255,255,0.06);

border:
1px solid rgba(255,255,255,0.08);

margin-bottom:30px;

font-size:14px;
color:#93c5fd;
}

.hero h1{
font-size:88px;
line-height:1;

max-width:1100px;
margin:auto;

margin-bottom:28px;

font-weight:700;
}

.gradient{
background:
linear-gradient(
135deg,
#60a5fa,
#818cf8,
#a855f7
);

-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

.hero p{
max-width:760px;
margin:auto;

font-size:20px;
line-height:1.9;

color:#cbd5e1;
}

/* BUTTONS */

.buttons{
margin-top:42px;

display:flex;
justify-content:center;
gap:18px;
flex-wrap:wrap;
}

.primary-btn{
padding:18px 38px;

border-radius:18px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

text-decoration:none;
color:white;

font-weight:700;

box-shadow:
0 16px 40px rgba(37,99,235,0.35);
}

.secondary-btn{
padding:18px 38px;

border-radius:18px;

background:
rgba(255,255,255,0.05);

border:
1px solid rgba(255,255,255,0.08);

text-decoration:none;
color:white;
}

/* AI DASHBOARD */

.dashboard{
padding:0 8%;
margin-top:70px;
position:relative;
z-index:2;
}

.dashboard-box{
background:
rgba(255,255,255,0.05);

border:
1px solid rgba(255,255,255,0.08);

backdrop-filter:blur(20px);

border-radius:36px;

padding:30px;

box-shadow:
0 20px 60px rgba(0,0,0,0.35);
}

.topbar{
display:flex;
gap:10px;
margin-bottom:24px;
}

.dot{
width:14px;
height:14px;
border-radius:999px;
background:#334155;
}

.dashboard-grid{
display:grid;

grid-template-columns:2fr 1fr;
gap:24px;
}

.panel{
background:#0f172a;
border-radius:28px;
min-height:320px;
position:relative;
overflow:hidden;
}

.panel::before{
content:"";
position:absolute;
inset:0;

background:
linear-gradient(
135deg,
rgba(255,255,255,0.08),
transparent
);
}

/* SECTION */

.section{
padding:120px 8%;
position:relative;
z-index:2;
}

.section-title{
text-align:center;
margin-bottom:80px;
}

.section-title h2{
font-size:64px;
margin-bottom:20px;
}

.section-title p{
font-size:20px;
color:#cbd5e1;
}

/* SERVICES */

.services{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(300px,1fr));

gap:30px;
}

.card{
padding:42px;

border-radius:32px;

background:
rgba(255,255,255,0.05);

border:
1px solid rgba(255,255,255,0.08);

backdrop-filter:blur(20px);

transition:0.35s;

position:relative;
overflow:hidden;
}

.card::before{
content:"";
position:absolute;
inset:0;

background:
linear-gradient(
135deg,
rgba(37,99,235,0.18),
transparent
);
}

.card:hover{
transform:translateY(-8px);
}

.icon{
width:74px;
height:74px;

border-radius:24px;

display:flex;
align-items:center;
justify-content:center;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

font-size:30px;

margin-bottom:26px;
}

.card h3{
font-size:32px;
margin-bottom:18px;
}

.card p{
line-height:1.9;
color:#cbd5e1;
}

/* STATS */

.stats{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(250px,1fr));

gap:24px;

margin-top:100px;
}

.stat{
padding:40px;

border-radius:28px;

background:
rgba(255,255,255,0.05);

border:
1px solid rgba(255,255,255,0.08);

text-align:center;
}

.stat h2{
font-size:60px;
margin-bottom:12px;

background:
linear-gradient(
135deg,
#60a5fa,
#a855f7
);

-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

.stat p{
color:#cbd5e1;
}

/* CTA */

.cta{
margin-top:120px;

padding:100px 40px;

border-radius:42px;

background:
linear-gradient(
135deg,
rgba(37,99,235,0.2),
rgba(124,58,237,0.2)
);

border:
1px solid rgba(255,255,255,0.08);

backdrop-filter:blur(20px);

text-align:center;
}

.cta h2{
font-size:76px;
margin-bottom:24px;
}

.cta p{
max-width:760px;
margin:auto;

line-height:1.9;
font-size:20px;

color:#cbd5e1;
}

/* FOOTER */

.footer{
padding:60px 20px;
text-align:center;
color:#64748b;
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
font-size:56px;
}

.section-title h2{
font-size:42px;
}

.cta h2{
font-size:48px;
}

.dashboard-grid{
grid-template-columns:1fr;
}

}

</style>
</head>

<body>

<div class="bg-glow"></div>

<!-- HERO -->

<div class="hero">

<div class="ai-badge">
🤖 AI Powered Platform
</div>

<h1>
<span class="gradient">
${hero}
</span>
</h1>

<p>
${about}
</p>

<div class="buttons">

<a href="#" class="primary-btn">
${cta}
</a>

<a href="#" class="secondary-btn">
View Demo
</a>

</div>

</div>

<!-- AI DASHBOARD -->

<div class="dashboard">

<div class="dashboard-box">

<div class="topbar">
<div class="dot"></div>
<div class="dot"></div>
<div class="dot"></div>
</div>

<div class="dashboard-grid">

<div class="panel"></div>
<div class="panel"></div>

</div>

</div>

</div>

<!-- SERVICES -->

<div class="section">

<div class="section-title">

<h2>
Future AI Solutions
</h2>

<p>
Built for next-generation businesses and creators.
</p>

</div>

<div class="services">

${services.map((s)=>`
<div class="card">

<div class="icon">
⚡
</div>

<h3>${s}</h3>

<p>
Advanced AI powered experience optimized for modern digital growth.
</p>

</div>
`).join("")}

</div>

<!-- STATS -->

<div class="stats">

<div class="stat">
<h2>50K+</h2>
<p>AI Requests</p>
</div>

<div class="stat">
<h2>99%</h2>
<p>Automation Rate</p>
</div>

<div class="stat">
<h2>24/7</h2>
<p>AI Processing</p>
</div>

</div>

<!-- CTA -->

<div class="cta">

<h2>
Build With AI
</h2>

<p>
Launch futuristic digital experiences powered by intelligent automation.
</p>

<div class="buttons">

<a href="#" class="primary-btn">
Start Building
</a>

</div>

</div>

</div>

<!-- FOOTER -->

<div class="footer">
AI WEBSITE BUILDER • FUTURE READY
</div>

</body>
</html>
`;

}

/* ================= AGENCY THEME ================= */

if (theme === "agency") {

html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8"/>
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
background:#ffffff;
color:#111827;
overflow-x:hidden;
}

/* HERO */

.hero{
padding:140px 8% 120px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

color:white;

position:relative;
overflow:hidden;
}

.hero::before{
content:"";
position:absolute;
width:800px;
height:800px;

background:
radial-gradient(
circle,
rgba(255,255,255,0.12),
transparent 70%
);

top:-300px;
right:-200px;
}

.hero-content{
position:relative;
z-index:2;

max-width:1100px;
}

.badge{
display:inline-block;

padding:10px 20px;

border-radius:999px;

background:
rgba(255,255,255,0.12);

border:
1px solid rgba(255,255,255,0.15);

margin-bottom:28px;

font-size:14px;
}

.hero h1{
font-size:92px;
line-height:0.95;
margin-bottom:28px;
font-weight:800;
}

.hero p{
max-width:760px;

font-size:22px;
line-height:1.9;

opacity:0.92;
}

.button{
display:inline-block;

margin-top:42px;

padding:18px 38px;

border-radius:18px;

background:white;
color:#111827;

text-decoration:none;
font-weight:700;

box-shadow:
0 14px 40px rgba(0,0,0,0.15);
}

/* CLIENTS */

.clients{
padding:40px 8%;

display:flex;
justify-content:space-between;
flex-wrap:wrap;
gap:20px;

background:#f8fafc;
}

.client{
font-size:28px;
font-weight:800;
opacity:0.35;
}

/* SECTION */

.section{
padding:120px 8%;
}

.section-title{
text-align:center;
margin-bottom:80px;
}

.section-title h2{
font-size:68px;
margin-bottom:18px;
}

.section-title p{
font-size:20px;
color:#64748b;
}

/* SERVICES */

.services{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(320px,1fr));

gap:30px;
}

.card{
padding:42px;

border-radius:32px;

background:white;

box-shadow:
0 20px 50px rgba(0,0,0,0.08);

transition:0.35s;

position:relative;
overflow:hidden;
}

.card::before{
content:"";
position:absolute;
top:0;
left:0;

width:100%;
height:6px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);
}

.card:hover{
transform:translateY(-10px);
}

.icon{
width:78px;
height:78px;

border-radius:24px;

display:flex;
align-items:center;
justify-content:center;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

color:white;
font-size:32px;

margin-bottom:28px;
}

.card h3{
font-size:32px;
margin-bottom:18px;
}

.card p{
line-height:1.9;
color:#64748b;
}

/* SHOWCASE */

.showcase{
margin-top:100px;

display:grid;
grid-template-columns:
repeat(auto-fit,minmax(340px,1fr));

gap:30px;
}

.work{
height:320px;

border-radius:36px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

position:relative;
overflow:hidden;
}

.work::before{
content:"";
position:absolute;
inset:0;

background:
linear-gradient(
135deg,
rgba(255,255,255,0.2),
transparent
);
}

/* STATS */

.stats{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(240px,1fr));

gap:24px;

margin-top:100px;
}

.stat{
padding:42px;

border-radius:28px;

background:#f8fafc;

text-align:center;
}

.stat h2{
font-size:64px;
margin-bottom:12px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
}

.stat p{
color:#64748b;
}

/* CTA */

.cta{
margin-top:120px;

padding:100px 40px;

border-radius:42px;

background:
linear-gradient(
135deg,
#2563eb,
#7c3aed
);

color:white;

text-align:center;
}

.cta h2{
font-size:76px;
margin-bottom:24px;
}

.cta p{
max-width:760px;
margin:auto;

line-height:1.9;
font-size:20px;

opacity:0.92;
}

.cta-btn{
display:inline-block;

margin-top:40px;

padding:18px 40px;

border-radius:18px;

background:white;
color:#111827;

font-weight:700;
text-decoration:none;
}

/* FOOTER */

.footer{
padding:60px 20px;
text-align:center;
color:#64748b;
}

/* MOBILE */

@media(max-width:768px){

.hero h1{
font-size:58px;
}

.section-title h2{
font-size:42px;
}

.cta h2{
font-size:48px;
}

}

</style>
</head>

<body>

<!-- HERO -->

<div class="hero">

<div class="hero-content">

<div class="badge">
🚀 Creative Digital Agency
</div>

<h1>
${hero}
</h1>

<p>
${about}
</p>

<a href="#" class="button">
${cta}
</a>

</div>

</div>

<!-- CLIENTS -->

<div class="clients">

<div class="client">Google</div>
<div class="client">Meta</div>
<div class="client">Netflix</div>
<div class="client">Spotify</div>
<div class="client">Adobe</div>

</div>

<!-- SERVICES -->

<div class="section">

<div class="section-title">

<h2>
Creative Solutions
</h2>

<p>
Modern digital experiences crafted for ambitious brands.
</p>

</div>

<div class="services">

${services.map((s)=>`
<div class="card">

<div class="icon">
🎨
</div>

<h3>${s}</h3>

<p>
Creative agency strategy focused on branding, performance and growth.
</p>

</div>
`).join("")}

</div>

<!-- SHOWCASE -->

<div class="showcase">

<div class="work"></div>
<div class="work"></div>
<div class="work"></div>

</div>

<!-- STATS -->

<div class="stats">

<div class="stat">
<h2>250+</h2>
<p>Projects Delivered</p>
</div>

<div class="stat">
<h2>120%</h2>
<p>Average Growth</p>
</div>

<div class="stat">
<h2>50+</h2>
<p>Global Brands</p>
</div>

</div>

<!-- CTA -->

<div class="cta">

<h2>
Let's Build Something Amazing
</h2>

<p>
We create powerful digital experiences that help brands stand out and grow faster.
</p>

<a href="#" class="cta-btn">
Start Your Project
</a>

</div>

</div>

<!-- FOOTER -->

<div class="footer">
CREATIVE AGENCY EXPERIENCE
</div>

</body>
</html>
`;

}

/* ================= PORTFOLIO THEME ================= */

if (theme === "portfolio") {

html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>${hero}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
font-family:'Inter',sans-serif;
background:#f8fafc;
color:#111827;
overflow-x:hidden;
}

/* HERO */

.hero{
min-height:100vh;

display:grid;
grid-template-columns:1fr 1fr;

align-items:center;

padding:0 8%;

background:
linear-gradient(
135deg,
#ffffff,
#f1f5f9
);
}

.hero-left{
padding-right:60px;
}

.badge{
display:inline-block;

padding:10px 20px;

border-radius:999px;

background:#e0e7ff;

color:#4338ca;

font-size:14px;
font-weight:600;

margin-bottom:30px;
}

.hero h1{
font-family:'Syne',sans-serif;

font-size:88px;
line-height:0.95;

margin-bottom:28px;
}

.hero p{
font-size:20px;
line-height:1.9;

color:#475569;

max-width:680px;
}

.buttons{
margin-top:40px;

display:flex;
gap:18px;
flex-wrap:wrap;
}

.primary-btn{
padding:18px 36px;

border-radius:18px;

background:#111827;
color:white;

text-decoration:none;
font-weight:700;

box-shadow:
0 14px 40px rgba(0,0,0,0.12);
}

.secondary-btn{
padding:18px 36px;

border-radius:18px;

border:1px solid #cbd5e1;

background:white;

text-decoration:none;
color:#111827;
font-weight:600;
}

/* HERO IMAGE */

.hero-right{
display:flex;
justify-content:center;
}

.profile-box{
width:420px;
height:520px;

border-radius:40px;

background:
linear-gradient(
135deg,
#111827,
#1e293b
);

position:relative;
overflow:hidden;

box-shadow:
0 30px 60px rgba(0,0,0,0.18);
}

.profile-box::before{
content:"";
position:absolute;
inset:0;

background:
radial-gradient(
circle at top,
rgba(255,255,255,0.12),
transparent 50%
);
}

.avatar{
position:absolute;
bottom:0;
left:50%;
transform:translateX(-50%);

width:320px;
}

/* SECTION */

.section{
padding:120px 8%;
}

.section-title{
margin-bottom:80px;
text-align:center;
}

.section-title h2{
font-family:'Syne',sans-serif;
font-size:72px;
margin-bottom:18px;
}

.section-title p{
font-size:20px;
color:#64748b;
}

/* SERVICES */

.services{
display:grid;

grid-template-columns:
repeat(auto-fit,minmax(320px,1fr));

gap:30px;
}

.card{
background:white;

padding:42px;

border-radius:34px;

box-shadow:
0 20px 50px rgba(0,0,0,0.08);

transition:0.35s;

position:relative;
overflow:hidden;
}

.card::before{
content:"";
position:absolute;
top:0;
left:0;

width:100%;
height:6px;

background:
linear-gradient(
135deg,
#111827,
#475569
);
}

.card:hover{
transform:translateY(-10px);
}

.card-number{
font-size:14px;
font-weight:700;
color:#64748b;
margin-bottom:20px;
}

.card h3{
font-size:34px;
margin-bottom:18px;
font-family:'Syne',sans-serif;
}

.card p{
line-height:1.9;
color:#64748b;
}

/* PROJECTS */

.projects{
margin-top:100px;

display:grid;

grid-template-columns:
repeat(auto-fit,minmax(340px,1fr));

gap:30px;
}

.project{
height:420px;

border-radius:36px;

overflow:hidden;

position:relative;

background:
linear-gradient(
135deg,
#111827,
#334155
);

box-shadow:
0 20px 60px rgba(0,0,0,0.15);
}

.project::before{
content:"";
position:absolute;
inset:0;

background:
linear-gradient(
135deg,
rgba(255,255,255,0.15),
transparent
);
}

.project-info{
position:absolute;
bottom:30px;
left:30px;

color:white;
}

.project-info h3{
font-size:34px;
margin-bottom:12px;
font-family:'Syne',sans-serif;
}

/* EXPERIENCE */

.experience{
margin-top:120px;

display:grid;
grid-template-columns:
repeat(auto-fit,minmax(260px,1fr));

gap:24px;
}

.exp-card{
background:white;

padding:40px;

border-radius:30px;

box-shadow:
0 12px 40px rgba(0,0,0,0.08);

text-align:center;
}

.exp-card h2{
font-size:64px;
margin-bottom:12px;

font-family:'Syne',sans-serif;
}

.exp-card p{
color:#64748b;
}

/* CTA */

.cta{
margin-top:120px;

padding:100px 40px;

border-radius:42px;

background:#111827;

color:white;

text-align:center;
}

.cta h2{
font-family:'Syne',sans-serif;
font-size:76px;
margin-bottom:24px;
}

.cta p{
max-width:760px;
margin:auto;

line-height:1.9;
font-size:20px;

color:#cbd5e1;
}

.cta-btn{
display:inline-block;

margin-top:40px;

padding:18px 40px;

border-radius:18px;

background:white;
color:#111827;

font-weight:700;
text-decoration:none;
}

/* FOOTER */

.footer{
padding:60px 20px;

text-align:center;

color:#64748b;
}

/* MOBILE */

@media(max-width:900px){

.hero{
grid-template-columns:1fr;
padding-top:120px;
padding-bottom:100px;
}

.hero-left{
padding-right:0;
text-align:center;
margin-bottom:60px;
}

.hero h1{
font-size:58px;
}

.profile-box{
width:100%;
max-width:360px;
height:460px;
}

.section-title h2{
font-size:48px;
}

.cta h2{
font-size:52px;
}

}

</style>
</head>

<body>

<!-- HERO -->

<div class="hero">

<div class="hero-left">

<div class="badge">
✨ Creative Portfolio
</div>

<h1>
${hero}
</h1>

<p>
${about}
</p>

<div class="buttons">

<a href="#" class="primary-btn">
${cta}
</a>

<a href="#" class="secondary-btn">
View Portfolio
</a>

</div>

</div>

<!-- HERO IMAGE -->

<div class="hero-right">

<div class="profile-box">

<img
class="avatar"
src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
/>

</div>

</div>

</div>

<!-- SERVICES -->

<div class="section">

<div class="section-title">

<h2>
Creative Expertise
</h2>

<p>
Crafting modern digital experiences with creativity and precision.
</p>

</div>

<div class="services">

${services.map((s, i)=>`
<div class="card">

<div class="card-number">
0${i + 1}
</div>

<h3>${s}</h3>

<p>
Premium creative service designed for brands, creators and modern businesses.
</p>

</div>
`).join("")}

</div>

<!-- PROJECTS -->

<div class="projects">

<div class="project">

<div class="project-info">
<h3>Modern Branding</h3>
<p>Creative Identity Design</p>
</div>

</div>

<div class="project">

<div class="project-info">
<h3>Digital Experience</h3>
<p>Premium UI/UX Design</p>
</div>

</div>

<div class="project">

<div class="project-info">
<h3>Creative Campaign</h3>
<p>Marketing & Strategy</p>
</div>

</div>

</div>

<!-- EXPERIENCE -->

<div class="experience">

<div class="exp-card">
<h2>8+</h2>
<p>Years Experience</p>
</div>

<div class="exp-card">
<h2>120+</h2>
<p>Projects Completed</p>
</div>

<div class="exp-card">
<h2>50+</h2>
<p>Happy Clients</p>
</div>

</div>

<!-- CTA -->

<div class="cta">

<h2>
Let's Build Your Vision
</h2>

<p>
Creating elegant digital experiences that inspire, engage and grow brands.
</p>

<a href="#" class="cta-btn">
Start Project
</a>

</div>

</div>

<!-- FOOTER -->

<div class="footer">
CREATIVE PORTFOLIO EXPERIENCE
</div>

</body>
</html>
`;

}







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