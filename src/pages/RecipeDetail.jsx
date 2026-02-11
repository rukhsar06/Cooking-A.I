import React, { useEffect, useRef, useState, useMemo } from "react";
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
  const interruptRecRef = useRef(null); // listens while TTS speaking for "shut up"
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  const STOP_WORDS = [
    "shut up",
    "stop",
    "cancel",
    "quiet",
    "enough",
    "stop talking",
    "be quiet",
  ];

  // ---------------- STOP TTS ----------------
  const stopSpeaking = () => {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}

    isSpeakingRef.current = false;

    // stop interrupt listener too
    try {
      interruptRecRef.current?.stop?.();
    } catch {}
    interruptRecRef.current = null;
  };

  // ---------------- MAIN SPEECH RECOGNITION (ASK AI) ----------------
  const buildRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;

    r.onresult = async (event) => {
      const last = event.results[event.results.length - 1];
      if (!last?.isFinal) return;

      const transcript = (last[0]?.transcript || "").trim();
      if (!transcript) return;

      // Stop listening after a final question
      isListeningRef.current = false;
      setListening(false);
      try {
        r.stop();
      } catch {}

      // ✅ if user says stop words even here, stop speaking + re-listen
      const low = transcript.toLowerCase();
      if (STOP_WORDS.some((w) => low.includes(w))) {
        stopSpeaking();
        // go back to listening
        isListeningRef.current = true;
        setListening(true);
        setTimeout(() => startRecognitionSafe(), 250);
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

      if (event.error === "no-speech") {
        // don’t panic-stop; let onend restart if user wants listening
        return;
      }
      if (event.error === "aborted") return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        speak("Mic permission is blocked. Allow it in site settings.");
        isListeningRef.current = false;
        setListening(false);
        return;
      }

      if (event.error === "audio-capture") {
        speak("No microphone input detected.");
        isListeningRef.current = false;
        setListening(false);
        return;
      }

      isListeningRef.current = false;
      setListening(false);
      speak("Mic error. Try again.");
    };

    r.onend = () => {
      // Chrome ends randomly; restart only if user still wants mic and not speaking
      if (isListeningRef.current && !isSpeakingRef.current) {
        setTimeout(() => startRecognitionSafe(), 250);
      }
    };

    return r;
  };

  const startRecognitionSafe = () => {
    if (busy) return;
    if (isSpeakingRef.current) return;

    if (!recognitionRef.current) recognitionRef.current = buildRecognition();

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
      // InvalidStateError spam -> ignore
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

    // If speaking -> this click becomes "stop"
    if (isSpeakingRef.current) {
      stopSpeaking();
      // go back to listening after stopping
      isListeningRef.current = true;
      setListening(true);
      setTimeout(() => startRecognitionSafe(), 250);
      return;
    }

    // If listening -> stop listening
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

  // ---------------- INTERRUPT LISTENER (WHILE SPEAKING) ----------------
  const startInterruptListener = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (interruptRecRef.current) return;

    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;

    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = (last?.[0]?.transcript || "").toLowerCase().trim();

      if (STOP_WORDS.some((w) => text.includes(w))) {
        stopSpeaking();
        // after stopping, go back to main listening immediately
        isListeningRef.current = true;
        setListening(true);
        setTimeout(() => startRecognitionSafe(), 250);
      }
    };

    r.onerror = () => {
      try {
        r.stop();
      } catch {}
      interruptRecRef.current = null;
    };

    r.onend = () => {
      interruptRecRef.current = null;
    };

    interruptRecRef.current = r;

    try {
      r.start();
    } catch {}
  };

  // ---------------- TTS ----------------
  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    // stop any speech already playing
    stopSpeaking();

    // stop main mic while speaking (avoids feedback)
    try {
      recognitionRef.current?.stop?.();
    } catch {}

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;

    u.onstart = () => {
      isSpeakingRef.current = true;
      // ✅ listen for "shut up" while speaking
      startInterruptListener();
    };

    u.onend = () => {
      isSpeakingRef.current = false;

      // stop interrupt listener
      try {
        interruptRecRef.current?.stop?.();
      } catch {}
      interruptRecRef.current = null;

      // ✅ after speaking ends, continue listening if user wants
      if (isListeningRef.current) {
        setTimeout(() => startRecognitionSafe(), 250);
      }
    };

    u.onerror = () => {
      isSpeakingRef.current = false;
      try {
        interruptRecRef.current?.stop?.();
      } catch {}
      interruptRecRef.current = null;
    };

    window.speechSynthesis.speak(u);
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
      stopSpeaking();
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  // ✅ Build nice steps from your "step 1 ... step 2 ..." string
  const stepsList = useMemo(() => {
    const raw = (recipe?.steps || recipe?.instructions || "").trim();
    if (!raw) return [];

    // If it already has "step 1 / step 2" -> split by that
    if (/step\s*\d+/i.test(raw)) {
      return raw
        .split(/step\s*\d+\s*/gi)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Otherwise try splitting by new lines
    if (raw.includes("\n")) {
      return raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Fallback: split by sentences
    return raw
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [recipe]);

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
            Say “shut up” / “stop” to interrupt AI
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

          {stepsList.length ? (
            <ol className="instructions-steps">
              {stepsList.map((step, idx) => (
                <li key={idx}>
                  <strong>Step {idx + 1}:</strong> {step}
                </li>
              ))}
            </ol>
          ) : (
            <div className="instructions-box">{recipe.steps || recipe.instructions}</div>
          )}
        </section>
      </div>

      <button
        className="ai-mic-float"
        onClick={handleAiMic}
        title={
          busy
            ? "Working…"
            : isSpeakingRef.current
            ? "Speaking… click to stop"
            : listening
            ? "Listening… click to stop"
            : "Ask AI"
        }
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        <FaMicrophone size={22} />
      </button>
    </div>
  );
}
