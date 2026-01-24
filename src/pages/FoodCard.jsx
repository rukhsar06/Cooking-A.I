import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/FoodCard.css";

export default function FoodCard({ id, title, img }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // LOAD LIKE FROM LOCAL STORAGE
  const [liked, setLiked] = useState(() => {
    const saved = localStorage.getItem(`liked-${id}`);
    return saved ? JSON.parse(saved) : false;
  });

  // SAVE LIKE TO LOCAL STORAGE
 const handleLikeClick = (e) => {
  e.preventDefault();

  const newVal = !liked;
  setLiked(newVal);

  // save boolean
  localStorage.setItem(`liked-${id}`, JSON.stringify(newVal));

  // full liked list
  let likedList = JSON.parse(localStorage.getItem("likedRecipes")) || [];

  if (newVal) {
    // If liked, add recipe
    if (!likedList.some((r) => r.id === id)) {
      likedList.push({ id, title, img });
    }
  } else {
    // If unliked, remove recipe
    likedList = likedList.filter((r) => r.id !== id);
  }

  localStorage.setItem("likedRecipes", JSON.stringify(likedList));

  setShowMenu(false);
};


  // GO TO HISTORY
  const handleHistoryClick = (e) => {
    e.preventDefault();
    navigate("/history");
    setShowMenu(false); // close menu after click
  };

  // CLICK OUTSIDE TO CLOSE MENU
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="card-wrapper" ref={menuRef}>
      {/* MAIN LINK TO RECIPE PAGE */}
      <Link to={`/recipe/${title}`} className="foodLink">
        <div className="card">
          <img src={img} alt={title} />

          <div className="card-title-wrapper">
            <p>{title}</p>

            {/* THREE DOTS */}
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

      {/* DROPDOWN MENU */}
      {showMenu && (
        <div className="menu">
          <p onClick={handleLikeClick}>
            {liked ? "❤️" : "♡"} Like
          </p>

          <p onClick={handleHistoryClick}>
            📜 History
          </p>
        </div>
      )}
    </div>
  );
}
