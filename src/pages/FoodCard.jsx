import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/FoodCard.css";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80";

export default function FoodCard({
  id,
  title,
  imageUrl,
  likes = 0,
  likedByMe = false,
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // backend-driven state
  const [liked, setLiked] = useState(!!likedByMe);
  const [likesCount, setLikesCount] = useState(likes);

  // keep state in sync with parent updates
  useEffect(() => setLiked(!!likedByMe), [likedByMe]);
  useEffect(() => setLikesCount(likes ?? 0), [likes]);

  const handleLikeClick = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (!token) {
      navigate("/log");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/likes/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        navigate("/log");
        return;
      }

      if (!res.ok) {
        console.error("Like failed:", res.status);
        return;
      }

      const data = await res.json();
      setLiked(!!data.liked);
      setLikesCount(data.likes ?? likesCount);
      setShowMenu(false);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleHistoryClick = (e) => {
    e.preventDefault();
    navigate("/history");
    setShowMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="card-wrapper" ref={menuRef}>
      {/* ✅ ID-based routing */}
      <Link to={`/recipe/${id}`} className="foodLink">
        <div className="card">
          <img
            src={imageUrl || FALLBACK_IMG}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />

          <div className="card-title-wrapper">
            <p>{title}</p>

            <span
              className="three-dots"
              onClick={(e) => {
                e.preventDefault();
                setShowMenu((prev) => !prev);
              }}
            >
              ⋮
            </span>
          </div>
        </div>
      </Link>

      {showMenu && (
        <div className="menu">
          <p onClick={handleLikeClick}>
            {liked ? "❤️" : "♡"} Like{" "}
            <span style={{ marginLeft: 6 }}>{likesCount}</span>
          </p>
          <p onClick={handleHistoryClick}>📜 History</p>
        </div>
      )}
    </div>
  );
}
