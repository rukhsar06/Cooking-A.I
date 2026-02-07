import React, { useEffect, useRef, useState } from "react";
import "../styles/FoodList.css";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";

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

  // ✅ prevent double-click spam on external imports
  const [importingKey, setImportingKey] = useState(null);

  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t.current);
  }, [query]);

  const buildUrl = (pageToFetch) => {
    if (!debouncedQuery) {
      return `http://localhost:8080/api/feed?page=${pageToFetch}&size=${size}`;
    }
    return `http://localhost:8080/api/search?q=${encodeURIComponent(
      debouncedQuery
    )}&page=${pageToFetch}&size=${size}`;
  };

  const fetchPage = async (pageToFetch) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    try {
      const res = await fetch(buildUrl(pageToFetch), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();

      // feed returns array; hybrid returns {items: [...]}
      const list = Array.isArray(data) ? data : (data.items || []);

      const cleaned = (list || []).map((r) => ({
        ...r,
        imageUrl: r.imageUrl || FALLBACK_IMG,
      }));

      if (cleaned.length < size) setHasMore(false);

      setItems((prev) => (pageToFetch === 0 ? cleaned : [...prev, ...cleaned]));
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

  const likeRecipe = async (id) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (!token) {
      navigate("/log");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/likes/${id}`, {
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

  // ✅ IMPORT ON CLICK (external → save in DB → open /recipe/{id})
  const handleCardClick = async (item, idx) => {
    if (!item.isExternal) {
      navigate(`/recipe/${item.id}`);
      return;
    }

    const clickKey = `${item.source}-${item.externalId}-${idx}`;
    if (importingKey === clickKey) return; // already importing this
    setImportingKey(clickKey);

    try {
      const res = await fetch(
        `http://localhost:8080/api/import/spoonacular/${item.externalId}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Import failed");

      const data = await res.json(); // { id: number }
      if (!data?.id) throw new Error("No id returned from import");

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
                  {item.isExternal ? (
                    <span style={{ opacity: 0.6 }}>
                      • {isImporting ? "importing…" : "external"}
                    </span>
                  ) : null}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "28px 0",
          }}
        >
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
