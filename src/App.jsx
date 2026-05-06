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

  // ================= FETCH USER PLAN =================

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

  // ================= GENERATE WEBSITE =================

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

  // ================= RAZORPAY =================

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

      const options = {
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
      };

      const razor = new window.Razorpay(options);

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

  // ================= UI =================

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ================= SIDEBAR ================= */}

      <div
        style={{
          width: 280,
          background: "rgba(255,255,255,0.05)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          padding: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 30,
            fontSize: 28,
          }}
        >
          🚀 AI Builder
        </h2>

        {/* USER */}

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            padding: 20,
            borderRadius: 20,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            LOGGED IN AS
          </p>

          <h3
            style={{
              fontSize: 16,
              wordBreak: "break-word",
            }}
          >
            {user}
          </h3>
        </div>

        {/* PLAN */}

        <div
          style={{
            background: plan.isPro
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "rgba(255,255,255,0.06)",

            padding: 20,
            borderRadius: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginBottom: 10 }}>
            {plan.isPro ? "PRO USER 🚀" : "FREE PLAN"}
          </h3>

          {!plan.isPro && (
            <p style={{ color: "#cbd5e1" }}>
              {plan.sites}/1 Websites Used
            </p>
          )}
        </div>

        {/* UPGRADE */}

        {!plan.isPro && plan.sites >= 1 && (
          <button
            onClick={handleUpgrade}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 16,
              border: "none",
              background:
                "linear-gradient(135deg,#22c55e,#16a34a)",

              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16,
              boxShadow: "0 10px 30px rgba(34,197,94,0.3)",
            }}
          >
            Upgrade to Pro ₹499
          </button>
        )}
      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div
        style={{
          flex: 1,
          padding: 40,
        }}
      >
        {/* ================= HEADER ================= */}

        <div
          style={{
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              fontSize: 42,
              marginBottom: 10,
            }}
          >
            Build AI Websites
          </h1>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Generate professional websites instantly using AI.
          </p>
        </div>

        {/* ================= FORM CARD ================= */}

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            borderRadius: 30,
            padding: 30,
          }}
        >
          {/* FORM */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
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

          {/* THEME */}

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

          {/* BUTTON */}

          <button
            onClick={handleGenerate}
            style={{
              width: "100%",
              marginTop: 20,
              padding: 18,
              borderRadius: 18,
              border: "none",
              background:
                "linear-gradient(135deg,#3b82f6,#2563eb)",

              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16,
              boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
            }}
          >
            {loading ? "Generating..." : "Generate Website"}
          </button>

          {/* ================= LOADING ================= */}

          {loading && (
            <div style={{ marginTop: 30 }}>
              <div style={skeleton}></div>
              <div style={skeleton}></div>
              <div style={skeleton}></div>
            </div>
          )}

          {/* ================= RESULT ================= */}

          {result && !loading && (
            <div
              style={{
                marginTop: 40,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 24,
                padding: 30,
              }}
            >
              <h2
                style={{
                  fontSize: 34,
                  marginBottom: 16,
                }}
              >
                {result.hero}
              </h2>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.8,
                  marginBottom: 30,
                }}
              >
                {result.about}
              </p>

              {/* SERVICES */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(200px,1fr))",

                  gap: 16,
                }}
              >
                {result.services?.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background:
                        "rgba(255,255,255,0.06)",

                      padding: 20,
                      borderRadius: 18,
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* PUBLISH */}

              <button
                onClick={handlePublish}
                style={{
                  width: "100%",
                  marginTop: 30,
                  padding: 18,
                  borderRadius: 18,
                  border: "none",
                  background:
                    "linear-gradient(135deg,#22c55e,#16a34a)",

                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 16,
                  boxShadow:
                    "0 10px 30px rgba(34,197,94,0.35)",
                }}
              >
                Publish Website 🌐
              </button>
            </div>
          )}
        </div>

        {/* ================= MY WEBSITES ================= */}

        <div
          style={{
            marginTop: 40,
          }}
        >
          <h2
            style={{
              marginBottom: 20,
            }}
          >
            Published Websites
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(280px,1fr))",

              gap: 20,
            }}
          >
            {sites.map((s) => (
              <div
                key={s._id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    marginBottom: 16,
                  }}
                >
                  🌐 Live Website
                </h3>

                <a
                  href={s.url}
                  target="_blank"
                  style={{
                    color: "#60a5fa",
                    wordBreak: "break-all",
                    textDecoration: "none",
                  }}
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

const skeleton = {
  height: 80,
  borderRadius: 20,
  background: "rgba(255,255,255,0.06)",
  marginBottom: 16,
};