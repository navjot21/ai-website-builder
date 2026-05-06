export default function Landing({
  emailInput,
  setEmailInput,
  handleLogin,
}) {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "linear-gradient(180deg,#020617,#0f172a)",
        minHeight: "100vh",
        color: "white",
        overflowX: "hidden",
      }}
    >
      {/* HERO */}
      <div
        style={{
          padding: "100px 20px 80px",
          textAlign: "center",
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px 20px",
            borderRadius: "999px",
            backdropFilter: "blur(12px)",
            marginBottom: "30px",
          }}
        >
          🚀 AI Powered SaaS Website Builder
        </div>

        <h1
          style={{
            fontSize: "64px",
            lineHeight: 1.1,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          Build Stunning Websites <br />
          in Seconds
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "#cbd5e1",
            maxWidth: 700,
            margin: "auto",
            lineHeight: 1.7,
          }}
        >
          Create beautiful AI-generated websites instantly with modern design,
          one-click publishing, and premium templates.
        </p>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "center",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Enter your email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{
              width: 320,
              padding: 18,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              outline: "none",
              backdropFilter: "blur(12px)",
              fontSize: 16,
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              padding: "18px 32px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16,
              boxShadow: "0 10px 30px rgba(34,197,94,0.4)",
            }}
          >
            Start Free →
          </button>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          maxWidth: 1100,
          margin: "auto",
          padding: "20px",
        }}
      >
        {[
          ["10K+", "Websites Generated"],
          ["99%", "Customer Satisfaction"],
          ["30 sec", "Average Build Time"],
          ["24/7", "AI Availability"],
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 30,
              borderRadius: 24,
              backdropFilter: "blur(12px)",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 38 }}>{item[0]}</h2>
            <p style={{ color: "#cbd5e1" }}>{item[1]}</p>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div
        style={{
          padding: "100px 20px",
          maxWidth: 1200,
          margin: "auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 46,
            marginBottom: 60,
          }}
        >
          Everything You Need
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
          }}
        >
          {[
            ["⚡ AI Generation", "Generate entire websites instantly."],
            ["🌐 One Click Publish", "Publish websites live in seconds."],
            ["🎨 Premium Themes", "Dark, Luxury, Startup & Portfolio themes."],
            ["💰 SaaS Ready", "Free & Pro plans with Razorpay integration."],
            ["📱 Mobile Responsive", "Perfect on mobile, tablet and desktop."],
            ["🚀 Fast Hosting", "Deploy instantly with Vercel & Render."],
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 30,
                borderRadius: 24,
                backdropFilter: "blur(12px)",
              }}
            >
              <h3 style={{ marginBottom: 14, fontSize: 24 }}>{item[0]}</h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{item[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ padding: "60px 20px", maxWidth: 1100, margin: "auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 42, marginBottom: 50 }}>
          Loved by Creators
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
          }}
        >
          {[
            "This saved me hours building client sites.",
            "The fastest AI website builder I've used.",
            "Amazing UI and instant publishing.",
          ].map((t, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: 28,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              ⭐⭐⭐⭐⭐
              <p style={{ marginTop: 18, color: "#e2e8f0", lineHeight: 1.7 }}>
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "80px 20px", maxWidth: 900, margin: "auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 42, marginBottom: 40 }}>
          Frequently Asked Questions
        </h2>

        {[
          ["Do I need coding skills?", "No. AI handles everything."],
          ["Can I publish instantly?", "Yes, one-click publish included."],
          ["Is there a free plan?", "Yes, 1 website free forever."],
        ].map((f, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: 24,
              borderRadius: 18,
              marginBottom: 20,
            }}
          >
            <h3>{f[0]}</h3>
            <p style={{ color: "#cbd5e1" }}>{f[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
