export default function Landing({ onStart }) {
  return (
    <div style={{ fontFamily: "Arial", textAlign: "center" }}>

      {/* HERO */}
      <div style={{ padding: "80px 20px", background: "#000", color: "#fff" }}>
        <h1 style={{ fontSize: "36px" }}>
          Build Your Website in 30 Seconds 🚀
        </h1>
        <p style={{ marginTop: 10 }}>
          No coding. No design. Just AI.
        </p>

        <button
          onClick={onStart}
          style={{
            marginTop: 20,
            padding: "12px 25px",
            fontSize: 16,
            background: "#fff",
            color: "#000",
            border: "none",
            cursor: "pointer",
          }}
        >
          Start Free
        </button>
      </div>

      {/* PROBLEM */}
      <div style={{ padding: 40 }}>
        <h2>Why use this?</h2>
        <p>
          Creating a website takes hours. Designers are expensive.
          We solve it instantly using AI.
        </p>
      </div>

      {/* FEATURES */}
      <div style={{ padding: 40, background: "#f5f5f5" }}>
        <h2>What You Get</h2>
        <p>✔ AI generated content</p>
        <p>✔ Ready-to-use website</p>
        <p>✔ One-click publish</p>
      </div>

      {/* PRICING */}
      <div style={{ padding: 40 }}>
        <h2>Pricing</h2>

        <div style={{ marginBottom: 20 }}>
          <h3>Free</h3>
          <p>1 Website</p>
        </div>

        <div style={{ border: "1px solid black", padding: 20 }}>
          <h3>Pro ₹499</h3>
          <p>Unlimited Websites</p>
          <p>Priority AI</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: 40 }}>
        <button
          onClick={onStart}
          style={{
            padding: "15px 30px",
            fontSize: 18,
            background: "black",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Start Building Now 🚀
        </button>
      </div>

    </div>
  );
}
