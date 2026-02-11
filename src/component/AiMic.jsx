import React, { useEffect, useRef, useState } from "react";

/**
 * Usage:
 * <AiMic
 *   onText={(text) => setQuery(text)}   // put recognized text wherever you want
 *   autoStopMs={8000}                  // optional
 * />
 */
export default function AiMic({
  onText,
  autoStopMs = 9000,
  className = "",
  disabled = false,
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  const recRef = useRef(null);
  const stopTimerRef = useRef(null);

  const getRecognizer = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.lang = "en-US";          // change if needed
    r.continuous = false;      // we just want one phrase
    r.interimResults = false;  // final only
    r.maxAlternatives = 1;
    return r;
  };

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const safeStop = () => {
    clearStopTimer();
    try {
      recRef.current?.stop();
    } catch {}
  };

  useEffect(() => {
    const r = getRecognizer();
    recRef.current = r;

    if (!r) {
      setError("Speech recognition not supported (use Chrome).");
      return;
    }

    r.onstart = () => {
      setError("");
      setListening(true);
      clearStopTimer();
      stopTimerRef.current = setTimeout(() => {
        // auto stop so it doesn't get stuck listening forever
        safeStop();
      }, autoStopMs);
    };

    r.onend = () => {
      clearStopTimer();
      setListening(false);
    };

    r.onerror = (e) => {
      // THIS is the real reason.
      console.error("SpeechRecognition error:", e?.error, e);

      clearStopTimer();
      setListening(false);

      const code = e?.error || "unknown";

      // useful messages
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Mic blocked. Allow microphone permission for this site.");
      } else if (code === "no-speech") {
        setError("I didn’t hear you. Try speaking a bit louder/closer.");
      } else if (code === "audio-capture") {
        setError("No microphone found / mic in use by another app.");
      } else if (code === "network") {
        setError("Speech service/network issue. Try again.");
      } else {
        setError(`Mic error: ${code}`);
      }
    };

    r.onresult = (e) => {
      clearStopTimer();

      const text = e?.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!text) {
        setError("I didn’t catch that. Try again.");
        return;
      }

      setError("");
      if (typeof onText === "function") onText(text);
    };

    return () => {
      clearStopTimer();
      try {
        r.abort();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStopMs]);

  const start = async () => {
    if (disabled) return;

    const r = recRef.current;
    if (!r) {
      setError("Speech recognition not supported (use Chrome).");
      return;
    }

    // kill any previous run cleanly
    try {
      r.abort();
    } catch {}

    // IMPORTANT: must be triggered by user click
    try {
      setError("");
      r.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("Mic failed to start. Try again.");
      setListening(false);
    }
  };

  const toggle = () => {
    if (listening) safeStop();
    else start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={className}
      title={error ? error : listening ? "Stop mic" : "Start mic"}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      {listening ? "🎙️" : "🎤"}
      {error ? (
        <span style={{ marginLeft: 8, fontSize: 12 }}>
          {error}
        </span>
      ) : null}
    </button>
  );
}
