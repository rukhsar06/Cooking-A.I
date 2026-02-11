import React, { useState, useEffect, useRef } from "react";
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

  const [busy, setBusy] = useState(false);
  const recognitionRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

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
  };

  // build single-shot recognition each click (stable)
  const handleMicClick = () => {
    if (busy) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    // stop any old session
    stopRecognition();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    setBusy(true);

    try {
      recognition.start();
    } catch (e) {
      console.error("recognition.start failed:", e);
      setBusy(false);
      speak("Mic start failed. Try again.");
      return;
    }

    recognition.onresult = async (event) => {
      const transcript = (event?.results?.[0]?.[0]?.transcript || "").trim();
      stopRecognition();

      if (!transcript) {
        setBusy(false);
        speak("I didn’t hear anything. Try again.");
        return;
      }

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

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          console.error("AI error:", res.status, msg);
          throw new Error("AI not available");
        }

        const data = await res.json().catch(() => ({}));
        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error("AI fetch failed:", e);
        speak("AI is not connected right now. Try again.");
      } finally {
        setBusy(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Mic error:", event?.error);
      stopRecognition();
      setBusy(false);

      if (event?.error === "no-speech") {
        speak("I didn’t hear anything. Try again.");
        return;
      }
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        speak("Mic permission blocked. Allow it in site settings.");
        return;
      }
      if (event?.error === "audio-capture") {
        speak("No microphone input detected.");
        return;
      }
      speak("Mic error. Try again.");
    };

    recognition.onend = () => {
      // if user ends without result, let error handle it
      setBusy(false);
      stopRecognition();
    };
  };

  useEffect(() => {
    console.log("API_BASE AT RUNTIME =", API_BASE);
  }, []);

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
              title={busy ? "Listening..." : "Tap to speak"}
              style={{ opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto" }}
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
