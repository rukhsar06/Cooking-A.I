import React from "react";
import "../styles/liked.css";
import { useNavigate } from "react-router-dom";

export default function Liked() {
  const navigate = useNavigate();

  const likedList = JSON.parse(localStorage.getItem("likedRecipes")) || [];

  return (
    <div className="liked-page">

      <h1>Liked Recipes</h1>

      {likedList.length === 0 && <p>No liked recipes yet</p>}

      {/* SAME STYLE AS FOOD LIST */}
      <div className="liked-container">
        {likedList.map((item) => (
          <div 
            key={item.id} 
            className="card" 
            onClick={() => navigate(`/recipe/${item.title}`)}
          >
            <img src={item.img} alt={item.title} />
            <p>{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
