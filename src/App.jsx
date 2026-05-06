import { useState, useEffect } from "react";
import Landing from "./Landing.jsx";

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  const [user, setUser] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [plan, setPlan] = useState({ isPro: false, sites: 0 });
  const [result, setResult] = useState(null);
  const [sites, setSites] = useState([]);

  const handleLogin = () => {
    setUser(emailInput);
  };

  const fetchPlan = async () => {
    const res = await fetch(
      `https://ai-website-builder-b6ze.onrender.com/user/${user}`
    );
    const data = await res.json();
    setPlan(data);
  };

  const fetchSites = async () => {
    const res = await fetch(
      `https://ai-website-builder-b6ze.onrender.com/mysites/${user}`
    );
    const data = await res.json();
    setSites(data.sites);
  };

  const handleGenerate = async () => {
    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nav",
          profession: "QA",
          services: "Testing",
          tone: "professional",
        }),
      }
    );

    const data = await res.json();
    setResult(data.result);
  };

  const handlePublish = async () => {
    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/publish",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, email: user }),
      }
    );

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    window.open(data.url);
    fetchSites();
    fetchPlan();
  };

  const handleUpgrade = async () => {
    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/create-order",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user }),
      }
    );

    const data = await res.json();

    new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: "INR",
      order_id: data.orderId,
      handler: function () {
        alert("Payment done ✅");
        setTimeout(fetchPlan, 4000);
      },
    }).open();
  };

  useEffect(() => {
    if (user) {
      fetchPlan();
      fetchSites();
    }
  }, [user]);

  // 🚀 LANDING PAGE FLOW
  if (showLanding) {
    return <Landing onStart={() => setShowLanding(false)} />;
  }

  return (
    
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      {!user ? (
        <>
          <input
            placeholder="Email"
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <h3>{user}</h3>

          <div
            style={{
              padding: 10,
              background: plan.isPro ? "#d1fae5" : "#fee2e2",
            }}
          >
            {plan.isPro ? "PRO USER 🚀" : `FREE (${plan.sites}/1)`}
          </div>

          {!plan.isPro && (
            <button onClick={handleUpgrade}>
              Upgrade ₹499 💰
            </button>
          )}

          <br /><br />

          <button onClick={handleGenerate}>Generate</button>

          {result && (
            <button onClick={handlePublish}>Publish</button>
          )}

          <h4>My Sites</h4>
          {sites.map((s) => (
            <div key={s._id}>
              <a href={s.url} target="_blank">
                {s.url}
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}