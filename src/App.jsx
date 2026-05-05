import { useState, useEffect } from "react";

export default function App() {
  const [user, setUser] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [sites, setSites] = useState([]);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = () => {
    if (!validateEmail(emailInput)) {
      setError("Invalid email");
      return;
    }
    setUser(emailInput);
    setError("");
  };

  const fetchSites = async () => {
    const res = await fetch(
      `https://ai-website-builder-b6ze.onrender.com/mysites/${user}`
    );
    const data = await res.json();
    setSites(data.sites || []);
  };

  const handleGenerate = async () => {
    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/generate",
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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
        headers: {"Content-Type": "application/json"},
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
  };

  // 💰 PAYMENT
  const handleUpgrade = async () => {
    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/create-order",
      { method: "POST" }
    );

    const data = await res.json();

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      order_id: data.orderId,
      handler: async () => {
        await fetch(
          "https://ai-website-builder-b6ze.onrender.com/upgrade",
          {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email: user }),
          }
        );

        alert("You are now PRO 🎉");
      },
    };

    new window.Razorpay(options).open();
  };

  useEffect(() => {
    if (user) fetchSites();
  }, [user]);

  return (
    <div style={{padding: 20, maxWidth: 600, margin: "auto"}}>

      {!user && (
        <>
          <input
            placeholder="Enter email"
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <p>{error}</p>
        </>
      )}

      {user && (
        <>
          <h2>Welcome {user}</h2>

          <button onClick={handleUpgrade}>
            Upgrade to Pro 💰
          </button>

          <br /><br />

          <button onClick={handleGenerate}>
            Generate Website
          </button>

          {result && (
            <>
              <h3>{result.hero}</h3>
              <button onClick={handlePublish}>Publish</button>
            </>
          )}

          <h3>My Websites</h3>
          {sites.map((s) => (
            <div key={s._id}>
              <a href={s.url} target="_blank">{s.url}</a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}