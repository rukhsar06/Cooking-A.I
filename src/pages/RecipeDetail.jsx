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

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    // stop mic while speaking
    try {
      recognitionRef.current?.stop?.();
    } catch {}

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;

    u.onstart = () => {
      isSpeakingRef.current = true;
    };
    u.onend = () => {
      isSpeakingRef.current = false;
    };
    u.onerror = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(u);
  };

  const buildRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false; // ✅ single question is more stable than continuous here
    r.maxAlternatives = 1;

    r.onresult = async (event) => {
      const transcript = (event.results?.[0]?.[0]?.transcript || "").trim();
      isListeningRef.current = false;
      setListening(false);

      if (!transcript) {
        speak("I didn’t hear you. Try again.");
        return;
      }

      if (!recipe) {
        speak("Recipe is not loaded yet.");
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

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          console.error("AI error:", res.status, text);
          speak("AI isn’t reachable right now.");
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { reply: text };
        }

        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error("AI request failed:", e);
        speak("AI isn’t reachable right now.");
      } finally {
        setBusy(false);
      }
    };

    r.onerror = (event) => {
      console.error("Mic error:", event.error);

      // ✅ treat no-speech as normal user silence
      if (event.error === "no-speech") {
        isListeningRef.current = false;
        setListening(false);
        speak("I didn’t hear you. Try again.");
        return;
      }

      if (event.error === "aborted") return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isListeningRef.current = false;
        setListening(false);
        speak("Mic permission is blocked. Allow it in site settings.");
        return;
      }

      if (event.error === "audio-capture") {
        isListeningRef.current = false;
        setListening(false);
        speak("No microphone input detected.");
        return;
      }

      isListeningRef.current = false;
      setListening(false);
      speak("Mic error. Try again.");
    };

    r.onend = () => {
      // just sync UI
      if (!isListeningRef.current) setListening(false);
    };

    return r;
  };

  const startRecognitionSafe = () => {
    if (busy) return;
    if (isSpeakingRef.current) return;

    if (!recognitionRef.current) {
      recognitionRef.current = buildRecognition();
    }
    const r = recognitionRef.current;

    if (!r) {
      alert("Speech recognition not supported in this browser!");
      isListeningRef.current = false;
      setListening(false);
      return;
    }

    try {
      r.start();
    } catch {
      // ignore InvalidStateError
    }
  };

  const stopRecognitionSafe = () => {
    isListeningRef.current = false;
    setListening(false);
    try {
      recognitionRef.current?.stop?.();
    } catch {}
  };

  const handleAiMic = () => {
    if (busy) return;

    // stop any speaking before listening
    window.speechSynthesis?.cancel?.();

    if (listening) {
      stopRecognitionSafe();
      return;
    }

    if (!recipe) {
      speak("Recipe is not loaded yet.");
      return;
    }

    isListeningRef.current = true;
    setListening(true);
    startRecognitionSafe();
  };

  // track history & views
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

  // fetch recipe
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
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      window.speechSynthesis?.cancel?.();
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
        title={busy ? "Working…" : listening ? "Listening… click to stop" : "Ask AI"}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <FaMicrophone size={22} />
      </button>
    </div>
  );
}
