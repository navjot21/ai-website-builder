import { useState, useEffect } from "react";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    profession: "",
    services: "",
    tone: "professional",
  });

  const [user, setUser] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchSites = async (email) => {
    const res = await fetch(
      `https://ai-website-builder-b6ze.onrender.com/mysites/${email}`
    );
    const data = await res.json();
    setSites(data?.sites || []);
  };

  const handleGenerate = async () => {
    setLoading(true);

    const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/generate",
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(form),
      }
    );

    const data = await res.json();
    setResult(data.result);
    setLoading(false);
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
    window.open(data.url);
    fetchSites(user);
  };

  // ================= PAYMENT =================
  const handleUpgrade = async () => {
    try{
      const res = await fetch(
      "https://ai-website-builder-b6ze.onrender.com/create-order",
      { method: "POST" }
     );

     const data = await res.json();
     if (!window.Razorpay) {
       alert("Razorpay not loaded ❌");
       return;
     }


    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      order_id: data.orderId,
      name: "AI Website Builder",
      description: "Pro Plan",
      handler: function () {
        alert("Payment Successful 🎉");
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
   
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }

  };

  useEffect(() => {
    fetchSites(user);
  }, [user]);

  return (
    <div className="p-6">

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
          <button onClick={handleUpgrade}>
            Upgrade to Pro 💰
          </button>

          <input name="name" placeholder="Name" onChange={handleChange}/>
          <input name="profession" placeholder="Profession" onChange={handleChange}/>
          <textarea name="services" placeholder="Services" onChange={handleChange}/>

          <button onClick={handleGenerate}>
            {loading ? "Loading..." : "Generate"}
          </button>

          {result && (
            <>
              <h2>{result.hero}</h2>
              <button onClick={handlePublish}>Publish</button>
            </>
          )}

          <h3>My Sites</h3>
          {sites.map(s => (
            <div key={s._id}>
              <a href={s.url} target="_blank">{s.url}</a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}