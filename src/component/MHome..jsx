import React, { useEffect, useRef, useState } from "react";
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
  const listenTimeoutRef = useRef(null);

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

  const buildRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false; // IMPORTANT for "single question" mode
    r.maxAlternatives = 1;

    r.onresult = async (event) => {
      clearTimeout(listenTimeoutRef.current);
      setListening(false);

      const transcript = (event.results?.[0]?.[0]?.transcript || "").trim();
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

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          console.error("AI error:", res.status, text);
          speak("AI is not connected right now. Try again.");
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
        console.error(e);
        speak("AI is not connected right now. Try again.");
      } finally {
        setBusy(false);
      }
    };

    r.onerror = (event) => {
      clearTimeout(listenTimeoutRef.current);
      console.error("SpeechRecognition error:", event.error);

      // ✅ THIS is your real issue: treat it as non-fatal
      if (event.error === "no-speech") {
        setListening(false);
        speak("I didn’t hear you. Try again.");
        return;
      }

      if (event.error === "aborted") {
        setListening(false);
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setListening(false);
        speak("Mic permission is blocked. Allow it in site settings.");
        return;
      }

      if (event.error === "audio-capture") {
        setListening(false);
        speak("No microphone input detected.");
        return;
      }

      setListening(false);
      speak("Mic error. Try again.");
    };

    r.onend = () => {
      clearTimeout(listenTimeoutRef.current);
      // if it ends without result, we just stop UI
      setListening(false);
    };

    return r;
  };

  const handleMicClick = () => {
    if (busy) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    // stop any speaking first (prevents recognition ending instantly)
    window.speechSynthesis?.cancel?.();

    if (!recognitionRef.current) {
      recognitionRef.current = buildRecognition();
    }

    const r = recognitionRef.current;
    if (!r) return;

    // if already listening -> stop
    if (listening) {
      try {
        r.stop();
      } catch {}
      setListening(false);
      return;
    }

    setListening(true);

    // auto-stop if user stays silent too long (avoids endless “listening”)
    clearTimeout(listenTimeoutRef.current);
    listenTimeoutRef.current = setTimeout(() => {
      try {
        r.stop();
      } catch {}
      setListening(false);
      speak("I didn’t hear you. Try again.");
    }, 7000);

    try {
      r.start();
    } catch {
      // InvalidStateError if start spam — ignore
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(listenTimeoutRef.current);
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      window.speechSynthesis?.cancel?.();
    };
  }, []);

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
              title={busy ? "Working…" : listening ? "Listening… click to stop" : "Ask AI"}
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
