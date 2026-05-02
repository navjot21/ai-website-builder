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

  // ================= EMAIL VALIDATION =================
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = () => {
    if (!validateEmail(emailInput)) {
      setError("❌ Please enter a valid email");
      return;
    }

    setUser(emailInput);
    setError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= FETCH SITES =================
  const fetchSites = async (email) => {
    try {
      if (!email) return;

      const res = await fetch(
        `https://ai-website-builder-b6ze.onrender.com/mysites/${email}`
      );

      const data = await res.json();

      setSites(data?.sites || []);
    } catch (err) {
      console.error(err);
      setSites([]);
    }
  };

  // ================= GENERATE =================
  const handleGenerate = async () => {
    if (!form.name || !form.profession || !form.services) {
      alert("Fill all fields ⚠️");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://ai-website-builder-b6ze.onrender.com/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      setResult(data?.result || null);
    } catch (err) {
      console.error(err);
      alert("Generate failed");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...result,
            email: user,
          }),
        }
      );

      const data = await res.json();

      if (!data?.url) {
        alert("Publish failed");
        return;
      }

      window.open(data.url, "_blank");
      fetchSites(user);

    } catch (err) {
      console.error(err);
      alert("Publish failed");
    }
  };

  useEffect(() => {
    fetchSites(user);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-black text-white p-4 text-center text-xl font-bold">
        AI Website Builder 🚀
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* LOGIN */}
        {!user && (
          <div className="bg-white p-6 rounded shadow mb-6">
            <input
              placeholder="Enter email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="border p-3 w-full mb-2"
            />

            {error && <p className="text-red-500">{error}</p>}

            <button
              onClick={handleLogin}
              className="bg-black text-white w-full p-3"
            >
              Continue
            </button>
          </div>
        )}

        {/* APP */}
        {user && (
          <>
            <div className="bg-white p-6 rounded shadow mb-6">
              <input name="name" placeholder="Name" onChange={handleChange} className="w-full mb-2 border p-2"/>
              <input name="profession" placeholder="Profession" onChange={handleChange} className="w-full mb-2 border p-2"/>
              <textarea name="services" placeholder="Services" onChange={handleChange} className="w-full mb-2 border p-2"/>

              <button onClick={handleGenerate} className="bg-black text-white w-full p-2">
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            {result && (
              <div className="text-center mb-6">
                <h2>{result?.hero}</h2>
                <button onClick={handlePublish} className="bg-green-600 text-white px-4 py-2 mt-2">
                  Publish
                </button>
              </div>
            )}

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-2">My Websites</h3>

              {!sites || sites.length === 0 ? (
                <p>No websites yet</p>
              ) : (
                (sites || []).map((s) => (
                  <div key={s._id} className="mb-2">
                    <a href={s.url} target="_blank" className="text-blue-600 underline">
                      {s.url}
                    </a>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}