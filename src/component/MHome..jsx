import React, { useRef, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import "../styles/mhome.css";
import snoopy from "../photos/Snoopy.png";
import slide2 from "../photos/slide2.png";
import slide3 from "../photos/slide3.png";
import FoodList from "../pages/FoodList.jsx";
import { API_BASE } from "../config";

export default function MHome() {
  const slides = [
    {
      title: "SNOOPY VIBE",
      desc: `"Make the food you crave at 2am… even if it's just matcha vibes with your tiny yellow homie."`,
      img: snoopy,
      bg: "#4B5660",
    },
    {
      title: "VANILLA PANCAKE",
      desc: `"Autumn mornings hit different with these heart shaped pancakes.
      Soft, Sweet, and dripping happiness, the kind of comfort food your soul actually deserves."`,
      img: slide2,
      bg: "#C29685",
    },
    {
      title: "SPAGHETTI CARBONARA",
      desc: `"Indulge in creamy, dreamy spaghetti carbonara, 
      a hug in a bowl that turns any meal into a celebration of comfort and flavor."`,
      img: slide3,
      bg: "#E1C0CA",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [query, setQuery] = useState("");

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const warmUpMic = async () => {
    // This is the real fix for instant "no-speech" on many systems
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // stop immediately (we only use it to force mic permission + device activation)
    stream.getTracks().forEach((t) => t.stop());
  };

  const getRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false; // important: less buggy than continuous for simple “ask once”
    r.maxAlternatives = 1;

    r.onstart = () => {
      setListening(true);
      // auto-stop if user stays silent too long
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try { r.stop(); } catch {}
      }, 8000);
    };

    r.onaudiostart = () => {
      // reset the silence timer once audio starts flowing
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try { r.stop(); } catch {}
      }, 8000);
    };

    r.onresult = async (event) => {
      clearTimeout(silenceTimerRef.current);

      const transcript = (event.results?.[0]?.[0]?.transcript || "").trim();
      setListening(false);

      if (!transcript) {
        speak("I didn’t hear you. Try again.");
        return;
      }

      setBusy(true);
      try {
        const res = await fetch(`${API_BASE}/api/ai/guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userText: transcript,
            recipeTitle: "",
            contextText:
              "You are a cooking assistant. Answer briefly. If user asks for recipe suggestions, suggest a few ideas.",
          }),
        });

        const raw = await res.text().catch(() => "");
        if (!res.ok) {
          console.error("AI error:", res.status, raw);
          speak("AI isn’t reachable right now.");
          return;
        }

        let data;
        try { data = JSON.parse(raw); } catch { data = { reply: raw }; }
        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error("AI request failed:", e);
        speak("AI isn’t reachable right now.");
      } finally {
        setBusy(false);
      }
    };

    r.onerror = (event) => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);

      // THIS is your exact error:
      if (event.error === "no-speech") {
        // do NOT treat as “mic broken”
        speak("I didn’t hear you. Try again.");
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        speak("Mic permission is blocked. Allow it in site settings.");
        return;
      }

      if (event.error === "audio-capture") {
        speak("No microphone detected. Check your input device.");
        return;
      }

      console.error("SpeechRecognition error:", event.error, event);
      speak("Mic error. Try again.");
    };

    r.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
    };

    return r;
  };

  const handleMicClick = async () => {
    if (busy) return;

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    // stop any old recognition instance cleanly
    try { recognitionRef.current?.stop?.(); } catch {}

    try {
      await warmUpMic(); // ✅ IMPORTANT
    } catch (e) {
      console.error("Mic warm-up failed:", e);
      speak("Mic permission problem. Check site settings.");
      return;
    }

    const r = getRecognition();
    if (!r) return;

    recognitionRef.current = r;

    try {
      r.start();
    } catch (e) {
      // InvalidStateError if spam-clicked
      console.warn("Recognition start failed:", e);
    }
  };

  console.log("API_BASE AT RUNTIME =", API_BASE);

  return (
    <>
      <div className="mhome-container">
        <div className="header-box">
          <div className="slider-wrapper">
            {slides.map((slide, index) => (
              <div
                className="slide"
                key={index}
                style={{
                  transform: `translateX(${(index - current) * 100}%)`,
                  backgroundColor: slide.bg,
                  zIndex: 50,
                }}
              >
                <div className="slide-text">
                  <h2 className="slide-title">{slide.title}</h2>
                  <p className="slide-desc">{slide.desc}</p>

                  <div className="indicator-row">
                    {slides.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`rect ${dotIndex === current ? "active" : ""}`}
                      ></div>
                    ))}
                  </div>
                </div>

                <img
                  src={slide.img}
                  alt="slide"
                  className={`slide-image ${
                    index === 0 ? "img-snoopy" : index === 1 ? "img-two" : "img-three"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <button className="arrow left-arrow" onClick={prevSlide}>
          ❮
        </button>
        <button className="arrow right-arrow" onClick={nextSlide}>
          ❯
        </button>

        <div className="search-container">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder={listening ? "Listening…" : "Search for recipes..."}
              className="search-bar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-icon">🔍︎</span>

            <FaMicrophone
              size={20}
              className="mic-icon"
              onClick={handleMicClick}
              title={busy ? "Working…" : listening ? "Listening…" : "Ask AI"}
              style={{ opacity: busy ? 0.6 : 1 }}
            />
          </div>
        </div>

        <div className="foodList-suggestions">
          <FoodList query={query} />
        </div>
      </div>
    </>
  );
}
