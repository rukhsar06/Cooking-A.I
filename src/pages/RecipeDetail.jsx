import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMicrophone } from "react-icons/fa";
import "../styles/RecipeDetail.css";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  // history + view tracking
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (token) {
      fetch(`http://localhost:8080/api/history/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      fetch(`http://localhost:8080/api/feed/${id}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [id]);

  // fetch PUBLIC recipe details
  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:8080/api/recipes/public/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load recipe");
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

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const handleAiMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser!");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      const contextText = `
Recipe: ${recipe?.title || ""}

Ingredients:
${recipe?.ingredients || ""}

Instructions:
${recipe?.steps || recipe?.instructions || ""}
      `.trim();

      try {
        const res = await fetch("http://localhost:8080/api/ai/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userText: transcript,
            recipeTitle: recipe?.title || "",
            contextText,
          }),
        });

        if (!res.ok) throw new Error("AI not available");

        const data = await res.json();
        speak(data.reply || "I didn’t get a reply.");
      } catch (e) {
        console.error(e);
        speak("AI is not connected right now. We’ll enable it later.");
      }
    };

    recognition.onerror = (event) => {
      console.error("Error occurred: ", event.error);
      speak("Mic error. Try again.");
    };
  };

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

          {/* (optional) you can keep this text or remove */}
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
          <div className="instructions-box">
            {recipe.steps || recipe.instructions}
          </div>
        </section>
      </div>

      {/* ✅ FLOATING MIC (you WILL see it) */}
      <button className="ai-mic-float" onClick={handleAiMic} title="Ask AI">
        <FaMicrophone size={22} />
      </button>
    </div>
  );
}
