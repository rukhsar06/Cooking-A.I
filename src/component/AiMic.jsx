import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "../config";

export default function AiMic({ recipeTitle = "", contextText = "" }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // warm up voices on some browsers
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices() || [];
    const preferred =
      voices.find(
        (v) => /en/i.test(v.lang) && /female|Google|Siri/i.test(v.name)
      ) ||
      voices.find((v) => /en/i.test(v.lang)) ||
      voices[0];

    if (preferred) u.voice = preferred;
    u.rate = 1;
    u.pitch = 1;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(u);
  };

  // 🔥 FIXED: uses API_BASE instead of localhost
  const askAI = async (userText) => {
    const res = await fetch(`${API_BASE}/api/ai/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userText,
        recipeTitle,
        contextText,
      }),
    });

    if (!res.ok) throw new Error("AI request failed");
    return await res.json(); // { reply: "..." }
  };

  const stopAll = () => {
    try {
      recognitionRef.current?.abort?.();
    } catch {}
    setListening(false);

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setListening(false);

      if (!transcript.trim()) return;

      setBusy(true);
      try {
        const data = await askAI(transcript);
        const reply = data?.reply || "I didn't get that.";
        speak(reply);
      } catch (e) {
        console.error(e);
        speak("Sorry, I couldn’t reach the AI right now.");
      } finally {
        setBusy(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("STT error:", event.error);
      setListening(false);
    };

    recognition.onend = () => setListening(false);
  };

  const handleClick = () => {
    if (busy) return;

    if (listening || speaking) {
      stopAll();
      return;
    }

    startListening();
  };

  return (
    <button
      onClick={handleClick}
      title={
        busy
          ? "Working…"
          : speaking
          ? "Stop speaking"
          : listening
          ? "Listening…"
          : "Ask AI"
      }
      style={{
        border: "none",
        background: "transparent",
        cursor: busy ? "not-allowed" : "pointer",
        fontSize: 18,
        opacity: busy ? 0.5 : 1,
      }}
    >
      {busy ? "⏳" : speaking ? "🛑" : listening ? "🎙️…" : "🤖🎙️"}
    </button>
  );
}
