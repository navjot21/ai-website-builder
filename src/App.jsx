import { useState } from "react";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    profession: "",
    services: "",
    tone: "professional",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ GENERATE
  const handleGenerate = async () => {
    if (!form.name || !form.profession || !form.services) {
      alert("Please fill all fields ⚠️");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://ai-website-builder-b6ze.onrender.com/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Server error");
        setLoading(false);
        return;
      }

      setResult(data.result);

    } catch (err) {
      console.error(err);
      alert("Error connecting to AI");
    }

    setLoading(false);
  };

  // ✅ PUBLISH (FIXED LOCATION)
  const handlePublish = async () => {
    try {
      const res = await fetch("https://ai-website-builder-b6ze.onrender.com/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      window.open(data.url, "_blank"); // ✅ OPEN NEW TAB

    } catch (err) {
      console.error(err);
      alert("Publish failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* FORM */}
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          AI Website Generator 🚀
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        />

        <input
          type="text"
          name="profession"
          placeholder="Your Profession"
          value={form.profession}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        />

        <textarea
          name="services"
          placeholder="Your Services"
          value={form.services}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        />

        <select
          name="tone"
          value={form.tone}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg"
        >
          <option value="professional">Professional</option>
          <option value="bold">Bold</option>
          <option value="luxury">Luxury</option>
        </select>

        <button
          onClick={handleGenerate}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          {loading ? "Generating..." : "Generate Website"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <div className="mt-10 bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto">

          {/* HERO */}
          <div className="bg-black text-white p-10 text-center">
            <img
              src="https://via.placeholder.com/100"
              className="mx-auto mb-4 rounded-full"
            />

            <h1 className="text-3xl font-bold mb-4">
              {result.hero}
            </h1>

            <button className="bg-white text-black px-6 py-2 rounded-lg font-semibold">
              {result.cta}
            </button>
          </div>

          {/* ABOUT */}
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-3">About</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              {result.about}
            </p>
          </div>

          {/* SERVICES */}
          <div className="bg-gray-100 p-8">
            <h2 className="text-xl font-bold text-center mb-6">Services</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.services?.map((s, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <p className="text-gray-700 text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BUTTONS (FIXED ALIGNMENT) */}
          <div className="flex justify-center gap-4 p-6">

            <button
              onClick={handleGenerate}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Regenerate 🔁
            </button>

            <button
              onClick={handlePublish}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Publish 🌐
            </button>

          </div>

        </div>
      )}

    </div>
  );
}