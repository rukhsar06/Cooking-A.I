import React, { useEffect, useState } from "react";
import "../styles/history.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = user?.token;

    if (!token) {
      navigate("/log");
      return;
    }

    fetch(`${API_BASE}/api/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          navigate("/log");
          throw new Error("Unauthorized");
        }
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then((data) => {
        setItems(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const removeHistory = async (recipeId) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = user?.token;

    if (!token) {
      navigate("/log");
      return;
    }

    const res = await fetch(`${API_BASE}/api/history/${recipeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      navigate("/log");
      return;
    }

    if (!res.ok) {
      console.error("Remove history failed:", res.status);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== recipeId));
    setOpenMenuId(null);
  };

  if (loading) return <p>Loading history…</p>;

  return (
    <div className="history-page">
      <div className="history-header">
        <h3 className="p-h">Your History</h3>
        {items.length === 0 && <p className="no-history">No history yet</p>}
      </div>

      <div className="history-content">
        <div className="food-container">
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              onClick={() => navigate(`/recipe/${item.id}`)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                ⋮
              </button>

              {openMenuId === item.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: 36,
                    right: 8,
                    background: "white",
                    borderRadius: 10,
                    padding: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 5,
                  }}
                >
                  <button
                    onClick={() => removeHistory(item.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <img
                src={item.imageUrl || FALLBACK_IMG}
                alt={item.title}
                loading="lazy"
                onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
              />
              <p>{item.title}</p>

              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <span>👁️ {item.views}</span>
                <span style={{ marginLeft: 12 }}>❤️ {item.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
