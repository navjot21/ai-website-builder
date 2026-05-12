import { useState, useEffect } from "react";
import Landing from "./Landing";

export default function App() {
  const [user, setUser] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [plan, setPlan] = useState({ isPro: false, sites: 0 });
  const [result, setResult] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("startup");

  const [form, setForm] = useState({
    name: "",
    profession: "",
    services: "",
  });

  // ================= LOGIN =================

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = () => {
    if (!validateEmail(emailInput)) {
      alert("Enter valid email");
      return;
    }

    setUser(emailInput);
  };

  // ================= FETCH PLAN =================

  const fetchPlan = async () => {
    try {
      const res = await fetch(
        `https://ai-website-builder-b6ze.onrender.com/user/${user}`
      );

      const data = await res.json();

      setPlan(data || { isPro: false, sites: 0 });
    } catch (err) {
      console.log(err);
    }
  };

  // ================= FETCH SITES =================

  const fetchSites = async () => {
    try {
      const res = await fetch(
        `https://ai-website-builder-b6ze.onrender.com/mysites/${user}`
      );

      const data = await res.json();

      setSites(data.sites || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= GENERATE =================

  const handleGenerate = async () => {
    if (!form.name || !form.profession || !form.services) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://ai-website-builder-b6ze.onrender.com/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      setResult(data.result);
    } catch (err) {
      console.log(err);
      alert("Generation failed");
    }

    setLoading(false);
  };

  // ================= PUBLISH =================

  const handlePublish = async () => {
    try {
      const res = await fetch(
        "https://ai-website-builder-b6ze.onrender.com/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...result,
            email: user,
            theme,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      window.open(data.url, "_blank");

      fetchSites();
      fetchPlan();
    } catch (err) {
      console.log(err);
      alert("Publish failed");
    }
  };

  // ================= PAYMENT =================

  const handleUpgrade = async () => {
    try {
      const res = await fetch(
        "https://ai-website-builder-b6ze.onrender.com/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user,
          }),
        }
      );

      const data = await res.json();

      const razor = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: "INR",
        order_id: data.orderId,

        name: "AI Website Builder",
        description: "Upgrade to Pro",

        handler: function () {
          alert("Payment Successful 🎉");

          setTimeout(() => {
            fetchPlan();
          }, 4000);
        },

        theme: {
          color: "#2563eb",
        },
      });

      razor.open();
    } catch (err) {
      console.log(err);
      alert("Payment failed");
    }
  };

  // ================= INITIAL LOAD =================

  useEffect(() => {
    if (user) {
      fetchPlan();
      fetchSites();
    }
  }, [user]);

  // ================= LANDING =================

  if (!user) {
    return (
      <Landing
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div style={container}>

      {/* SIDEBAR */}

      <div style={sidebar}>
        <h2 style={logo}>🚀 AI Builder</h2>

        <div style={glassCard}>
          <p style={smallText}>LOGGED IN AS</p>
          <h3 style={{ wordBreak: "break-word" }}>{user}</h3>
        </div>

        <div
          style={{
            ...glassCard,
            background: plan.isPro
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "rgba(255,255,255,0.05)",
          }}
        >
          <h3>
            {plan.isPro ? "PRO USER 🚀" : "FREE PLAN"}
          </h3>

          {!plan.isPro && (
            <p style={{ marginTop: 10 }}>
              {plan.sites}/1 Websites Used
            </p>
          )}
        </div>

        {!plan.isPro && plan.sites >= 1 && (
          <button style={greenBtn} onClick={handleUpgrade}>
            Upgrade to Pro ₹499
          </button>
        )}
      </div>

      {/* MAIN */}

      <div style={main}>

        <div style={{ marginBottom: 30 }}>
          <h1 style={heading}>
            Build AI Websites
          </h1>

          <p style={subHeading}>
            Generate professional websites instantly using AI.
          </p>
        </div>

        {/* FORM */}

        <div style={mainCard}>

          <div style={grid}>
            <input
              placeholder="Your Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              style={input}
            />

            <input
              placeholder="Profession"
              value={form.profession}
              onChange={(e) =>
                setForm({
                  ...form,
                  profession: e.target.value,
                })
              }
              style={input}
            />
          </div>

          <textarea
            placeholder="Describe your services"
            value={form.services}
            onChange={(e) =>
              setForm({
                ...form,
                services: e.target.value,
              })
            }
            style={{
              ...input,
              marginTop: 20,
              height: 120,
            }}
          />

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              ...input,
              marginTop: 20,
            }}
          >
            <option value="startup">Startup Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="luxury">Luxury Theme</option>
            <option value="portfolio">Portfolio Theme</option>
            <option value="agency">Agency Theme</option>
          </select>

          <button
            onClick={handleGenerate}
            style={blueBtn}
          >
            {loading ? "Generating..." : "Generate Website"}
          </button>

          {/* LOADING */}

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div style={skeleton}></div>
              <div style={skeleton}></div>
              <div style={skeleton}></div>
            </div>
          )}

          {/* LIVE PREVIEW */}

          {result && (
            <div style={previewCard}>

              <div style={previewHeader}>
                <div>Live Preview</div>

                <div style={themeBadge}>
                  {theme}
                </div>
              </div>

              <div
                style={{
                  ...previewBody,
                  background:
                    theme === "luxury"
                      ? "#111111"
                      : theme === "dark"
                      ? "#020617"
                      : "#ffffff",

                  color:
                    theme === "luxury" || theme === "dark"
                      ? "white"
                      : "#111827",
                }}
              >
                <h1 style={previewTitle}>
                  {result.hero}
                </h1>

                <p style={previewText}>
                  {result.about}
                </p>

                <div style={serviceGrid}>
                  {result.services?.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        ...serviceCard,
                        background:
                          theme === "startup"
                            ? "#eff6ff"
                            : theme === "luxury"
                            ? "#1e1e1e"
                            : theme === "dark"
                            ? "#111827"
                            : "#f8fafc",

                        color:
                          theme === "luxury" || theme === "dark"
                            ? "white"
                            : "#111827",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>

                <button style={previewBtn}>
                  {result.cta}
                </button>
              </div>

              <div style={publishArea}>
                <button
                  style={greenBtn}
                  onClick={handlePublish}
                >
                  Publish Website 🌐
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MY SITES */}

        <div style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 20 }}>
            Published Websites
          </h2>

          <div style={siteGrid}>
            {sites.map((s) => (
              <div key={s._id} style={siteCard}>
                <h3 style={{ marginBottom: 14 }}>
                  🌐 Live Website
                </h3>

                <a
                  href={s.url}
                  target="_blank"
                  style={siteLink}
                >
                  {s.url}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ================= STYLES =================

const container = {
  display: "flex",
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  fontFamily: "Inter, sans-serif",
};

const sidebar = {
  width: 280,
  padding: 30,
  background: "rgba(255,255,255,0.04)",
  borderRight: "1px solid rgba(255,255,255,0.08)",
};

const logo = {
  fontSize: 28,
  marginBottom: 30,
};

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  padding: 20,
  borderRadius: 20,
  marginBottom: 20,
};

const smallText = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 8,
};

const main = {
  flex: 1,
  padding: 40,
};

const heading = {
  fontSize: 42,
};

const subHeading = {
  color: "#94a3b8",
  marginTop: 10,
};

const mainCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 30,
  padding: 30,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const input = {
  width: "100%",
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  outline: "none",
  fontSize: 15,
  boxSizing: "border-box",
};

const blueBtn = {
  width: "100%",
  marginTop: 20,
  padding: 18,
  borderRadius: 18,
  border: "none",
  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const greenBtn = {
  width: "100%",
  padding: 16,
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg,#22c55e,#16a34a)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const skeleton = {
  height: 80,
  borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  marginBottom: 16,
};

const previewCard = {
  marginTop: 30,
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
};

const previewHeader = {
  padding: 14,
  background: "#020617",
  display: "flex",
  justifyContent: "space-between",
};

const themeBadge = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#2563eb",
  fontSize: 12,
};

const previewBody = {
  padding: 40,
  textAlign: "center",
};

const previewTitle = {
  fontSize: 42,
  marginBottom: 20,
};

const previewText = {
  maxWidth: 700,
  margin: "auto",
  lineHeight: 1.8,
  opacity: 0.9,
};

const serviceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 20,
  marginTop: 30,
};

const serviceCard = {
  padding: 24,
  borderRadius: 18,
};

const previewBtn = {
  marginTop: 35,
  padding: "16px 36px",
  border: "none",
  borderRadius: 14,
  background: "#2563eb",
  color: "white",
  fontWeight: 600,
};

const publishArea = {
  padding: 20,
  background: "#020617",
};

const siteGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 20,
};

const siteCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 24,
};

const siteLink = {
  color: "#60a5fa",
  wordBreak: "break-all",
  textDecoration: "none",
};