import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMicrophone } from "react-icons/fa";
import "../styles/RecipeDetail.css";
import { API_BASE } from "../config";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  const recognitionRef = useRef(null);

  // --------- TTS ----------
  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.abort?.();
    } catch {}
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setListening(false);
  };

  const handleAiMic = () => {
    if (busy) return;
    if (!recipe) {
      speak("Recipe is not loaded yet.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    // stop old session if any
    stopRecognition();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    setListening(true);

    try {
      recognition.start();
    } catch (e) {
      console.error("recognition.start failed:", e);
      setListening(false);
      speak("Mic start failed. Try again.");
      return;
    }

    recognition.onresult = async (event) => {
      const transcript = (event?.results?.[0]?.[0]?.transcript || "").trim();
      stopRecognition();

      if (!transcript) {
        speak("I didn’t hear anything. Try again.");
        return;
      }

      const contextText = `
Recipe: ${recipe?.title || ""}

Ingredients:
${recipe?.ingredients || ""}

Instructions:
${recipe?.steps || recipe?.instructions || ""}
      `.trim();

      setBusy(true);
      try {
        const res = await fetch(`${API_BASE}/api/ai/guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userText: transcript,
            recipeTitle: recipe?.title || "",
            contextText,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("AI error:", res.status, data);
          speak("AI isn’t reachable right now.");
          return;
        }

        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error("AI request failed:", e);
        speak("AI isn’t reachable right now.");
      } finally {
        setBusy(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Mic error:", event?.error);
      stopRecognition();

      if (event?.error === "no-speech") {
        speak("I didn't hear you. Try again.");
        return;
      }
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        speak("Mic permission is blocked. Allow it in site settings.");
        return;
      }
      if (event?.error === "audio-capture") {
        speak("No microphone input detected.");
        return;
      }

      speak("Mic error. Try again.");
    };

    recognition.onend = () => {
      // if it ends normally with no result, onerror/no-speech usually covers it
      setListening(false);
      stopRecognition();
    };
  };

  // --------- track history & views ----------
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = user?.token;

    if (token) {
      fetch(`${API_BASE}/api/history/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    fetch(`${API_BASE}/api/feed/${id}/view`, { method: "POST" }).catch(() => {});
  }, [id]);

  // --------- fetch recipe ----------
  useEffect(() => {
    setLoading(true);

    fetch(`${API_BASE}/api/recipes/public/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Recipe fetch failed: ${res.status} ${msg}`);
        }
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Recipe load error:", err);
        setRecipe(null);
        setLoading(false);
      });
  }, [id]);

  // cleanup
  useEffect(() => {
    return () => {
      stopRecognition();
      try {
        window.speechSynthesis?.cancel?.();
      } catch {}
    };
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading recipe…</p>;

  if (!recipe) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => navigate(-1)}>← Back</button>
        <p>Recipe not found 😔</p>
      </div>
    );
  }

  return (
    <div className="recipe-detail-page">
      <div className="recipe-detail-wrap">
        <div className="recipe-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <div style={{ opacity: 0.7, fontWeight: 600 }}>
            Ask AI “what’s next?” / “how long to cook?”
          </div>
        </div>

        <img
          className="recipe-hero"
          src={recipe.imageUrl || FALLBACK_IMG}
          alt={recipe.title}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
        />

        <h1 className="recipe-title">{recipe.title}</h1>

        <div className="recipe-meta">
          {recipe.tags && <span className="meta-chip">🏷 {recipe.tags}</span>}
          {recipe.source && <span className="meta-chip">• {recipe.source}</span>}
        </div>

        <section className="recipe-section">
          <h2>Ingredients</h2>
          <pre className="ingredients-box">{recipe.ingredients}</pre>
        </section>

        <section className="recipe-section">
          <h2>Instructions</h2>
          <div className="instructions-box">{recipe.steps || recipe.instructions}</div>
        </section>
      </div>

      <button
        className="ai-mic-float"
        onClick={handleAiMic}
        title={busy ? "Working…" : listening ? "Listening…" : "Ask AI"}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <FaMicrophone size={22} />
      </button>
    </div>
  );
}
