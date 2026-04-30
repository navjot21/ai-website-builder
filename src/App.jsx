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
      setError("❌ Please enter a valid email address");
      return;
    }

    setUser(emailInput);
    setError("");
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= FETCH USER SITES =================
  const fetchSites = async (email) => {
    if (!email) return;

    const res = await fetch(
      `https://ai-website-builder-b6ze.onrender.com/mysites/${email}`
    );
    const data = await res.json();
    setSites(data.sites);
  };

  // ================= GENERATE =================
  const handleGenerate = async () => {
    if (!form.name || !form.profession || !form.services) {
      alert("Please fill all fields ⚠️");
      return;
    }

    setLoading(true);

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
    setLoading(false);
  };

  // ================= PUBLISH =================
  const handlePublish = async () => {
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
        }),
      }
    );

    const data = await res.json();

    window.open(data.url, "_blank");
    fetchSites(user);
  };

  useEffect(() => {
    fetchSites(user);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-black text-white p-4 text-center text-xl font-bold">
        AI Website Builder 🚀
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* LOGIN */}
        {!user && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">
              Login to Continue
            </h2>

            <input
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="border p-3 w-full rounded mb-3"
            />

            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

            <button
              onClick={handleLogin}
              className="bg-black text-white w-full p-3 rounded"
            >
              Continue
            </button>
          </div>
        )}

        {/* MAIN APP */}
        {user && (
          <>
            {/* FORM */}
            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="text-lg font-bold mb-4 text-center">
                Create Your Website
              </h2>

              <input
                name="name"
                placeholder="Your Name"
                onChange={handleChange}
                className="w-full mb-3 border p-3 rounded"
              />

              <input
                name="profession"
                placeholder="Your Profession"
                onChange={handleChange}
                className="w-full mb-3 border p-3 rounded"
              />

              <textarea
                name="services"
                placeholder="Your Services"
                onChange={handleChange}
                className="w-full mb-3 border p-3 rounded"
              />

              <button
                onClick={handleGenerate}
                className="bg-black text-white p-3 w-full rounded"
              >
                {loading ? "Generating..." : "Generate Website"}
              </button>
            </div>

            {/* RESULT */}
            {result && (
              <div className="bg-white p-6 rounded-xl shadow mb-6 text-center">
                <h2 className="text-xl font-bold mb-2">{result.hero}</h2>
                <p className="text-gray-600 mb-4">{result.about}</p>

                <button
                  onClick={handlePublish}
                  className="bg-green-600 text-white px-6 py-2 rounded"
                >
                  Publish Website 🌐
                </button>
              </div>
            )}

            {/* DASHBOARD */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4 text-center">
                Your Published Websites 🌐
              </h2>

              {sites.length === 0 ? (
                <p className="text-center text-gray-500">
                  No websites yet
                </p>
              ) : (
                sites.map((s) => (
                  <div
                    key={s._id}
                    className="p-3 border rounded mb-2"
                  >
                    <a
                      href={s.url}
                      target="_blank"
                      className="text-blue-600 underline break-all"
                    >
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