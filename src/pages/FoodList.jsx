import React, { useEffect, useRef, useState } from "react";
import "../styles/FoodList.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";
console.log("API_BASE AT RUNTIME =", API_BASE);

export default function FoodList({ query = "" }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // debounce
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const t = useRef(null);

  // prevent double import spam
  const [importingKey, setImportingKey] = useState(null);

  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t.current);
  }, [query]);

  const buildUrl = (pageToFetch) => {
    if (!debouncedQuery) {
      return `${API_BASE}/api/feed?page=${pageToFetch}&size=${size}`;
    }
    return `${API_BASE}/api/search?q=${encodeURIComponent(
      debouncedQuery
    )}&page=${pageToFetch}&size=${size}`;
  };

  // ✅ PUBLIC: feed/search should NOT require token
  const fetchPage = async (pageToFetch) => {
    try {
      const res = await fetch(buildUrl(pageToFetch));

      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);

      const data = await res.json();

      const list = Array.isArray(data) ? data : data.items || [];

      const cleaned = list.map((r) => ({
        ...r,
        imageUrl: r.imageUrl || FALLBACK_IMG,
      }));

      if (cleaned.length < size) setHasMore(false);

      setItems((prev) =>
        pageToFetch === 0 ? cleaned : [...prev, ...cleaned]
      );
    } catch (err) {
      console.error("Load error:", err);
      if (pageToFetch === 0) setItems([]);
      setHasMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    setPage(0);
    fetchPage(0).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchPage(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  // 🔐 likes STILL need token
  const likeRecipe = async (id) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = user?.token;

    if (!token) {
      navigate("/log");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/likes/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        navigate("/log");
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      setItems((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, likes: data.likes, likedByMe: data.liked } : r
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleCardClick = async (item, idx) => {
    if (!item.isExternal) {
      navigate(`/recipe/${item.id}`);
      return;
    }

    const clickKey = `${item.source}-${item.externalId}-${idx}`;
    if (importingKey === clickKey) return;
    setImportingKey(clickKey);

    try {
      const res = await fetch(
        `${API_BASE}/api/import/spoonacular/${item.externalId}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      if (!data?.id) throw new Error("No id returned");

      navigate(`/recipe/${data.id}`);
    } catch (e) {
      console.error(e);
      alert("Could not import recipe. Try again.");
      setImportingKey(null);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <div className="food-container">
        {items.length === 0 ? (
          <p style={{ padding: 20 }}>
            {debouncedQuery
              ? `No results for “${debouncedQuery}” 👀`
              : "No recipes found 👀"}
          </p>
        ) : (
          items.map((item, idx) => {
            const key = item.isExternal
              ? `${item.source}-${item.externalId}-${idx}`
              : item.id;

            const isImporting = importingKey === key;

            return (
              <div
                key={key}
                className="card"
                onClick={() => handleCardClick(item, idx)}
                style={{
                  cursor: "pointer",
                  opacity: isImporting ? 0.6 : 1,
                  pointerEvents: isImporting ? "none" : "auto",
                }}
              >
                <img
                  src={item.imageUrl || FALLBACK_IMG}
                  alt={item.title}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />

                <p>
                  {item.title}{" "}
                  {item.isExternal && (
                    <span style={{ opacity: 0.6 }}>
                      • {isImporting ? "importing…" : "external"}
                    </span>
                  )}
                </p>

                {!item.isExternal && (
                  <div
                    className="card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => likeRecipe(item.id)}>
                      {item.likedByMe ? "❤️" : "♡"}
                      {item.likes}
                    </button>
                    <span>👁️ {item.views}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", padding: 28 }}>
          <button
            className="loadmore-btn"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
