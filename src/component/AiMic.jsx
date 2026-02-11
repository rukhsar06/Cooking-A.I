import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "../config";

export default function AiMic({ recipeTitle = "", contextText = "" }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
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

  const askAI = async (userText) => {
    const res = await fetch(`${API_BASE}/api/ai/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, recipeTitle, contextText }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`AI failed: ${res.status} ${msg}`);
    }

    return await res.json();
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
    const hasSTT =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

    if (!hasSTT) {
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

    // ✅ make Chrome less annoying
    recognition.continuous = false;
    recognition.onspeechstart = () => {
      // helpful for debugging
      // console.log("Speech detected");
    };

    setListening(true);

    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start failed:", e);
      setListening(false);
      speak("Mic couldn’t start. Try again.");
      return;
    }

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setListening(false);

      if (!transcript.trim()) {
        // Chrome sometimes gives empty transcript
        speak("I didn’t hear you. Try again.");
        return;
      }

      setBusy(true);
      try {
        const data = await askAI(transcript);
        speak(data?.reply || "I didn't get that.");
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

      // ✅ Chrome false-positive: happens even when mic works
      if (event.error === "no-speech") {
        console.warn("No speech detected (Chrome quirk)");
        return;
      }

      if (event.error === "aborted") return;

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        speak("Mic permission is blocked. Allow it in site settings.");
        return;
      }

      speak("Mic error. Try again.");
    };

    recognition.onend = () => {
      setListening(false);
    };
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
