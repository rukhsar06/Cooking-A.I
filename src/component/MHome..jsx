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
  const [micBusy, setMicBusy] = useState(false);

  const recognitionRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const buildRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onresult = async (event) => {
      const transcript = (event?.results?.[0]?.[0]?.transcript || "").trim();
      if (!transcript) {
        speak("I didn’t hear you. Try again.");
        return;
      }

      try {
        setMicBusy(true);

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
          throw new Error("AI not available");
        }

        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = { reply: raw };
        }

        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error(e);
        speak("AI is not connected right now. Try again.");
      } finally {
        setMicBusy(false);
      }
    };

    r.onerror = (event) => {
      console.error("SpeechRecognition error:", event?.error, event);

      const code = event?.error || "unknown";

      if (code === "not-allowed" || code === "service-not-allowed") {
        speak("Mic permission is blocked. Allow it in site settings.");
      } else if (code === "audio-capture") {
        speak("No microphone input detected.");
      } else if (code === "no-speech") {
        speak("I didn’t hear you. Try again.");
      } else if (code === "network") {
        speak("Speech service/network issue. Try again.");
      } else if (code === "aborted") {
        // ignore
      } else {
        speak("Mic error. Try again.");
      }
    };

    r.onend = () => {
      // clean end
      try {
        recognitionRef.current = null;
      } catch {}
    };

    return r;
  };

  const handleMicClick = () => {
    if (micBusy) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    // stop old run if somehow still alive
    try {
      recognitionRef.current?.stop?.();
    } catch {}

    const r = buildRecognition();
    recognitionRef.current = r;

    try {
      r.start(); // must be from click (this is)
    } catch (e) {
      console.error("Failed to start recognition:", e);
      speak("Mic failed to start. Try again.");
      recognitionRef.current = null;
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
              placeholder="Search for recipes..."
              className="search-bar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-icon">🔍︎</span>

            <FaMicrophone
              size={20}
              className="mic-icon"
              onClick={handleMicClick}
              style={{ opacity: micBusy ? 0.6 : 1, pointerEvents: micBusy ? "none" : "auto" }}
              title={micBusy ? "Working…" : "Tap to speak"}
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
