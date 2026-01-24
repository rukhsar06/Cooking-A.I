import "../styles/Profile.css";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Wonwoo from "../photos/Wonwoo.jpeg";

import pancake from "../photos/pancake.jpeg";
import gyoza from "../photos/gyoza.jpeg";
import burger from "../photos/burger.jpeg";
import sushiR from "../photos/sushiR.jpeg";
import tanghulu from "../photos/tanghulu.jpeg";
import chickenK from "../photos/chickenK.jpeg";

export default function Profile() {
  const navigate = useNavigate();

  const fileRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const [user, setUser] = useState(storedUser);

  const historyImages = [pancake, gyoza, burger, sushiR, tanghulu, chickenK];

  const likedList = JSON.parse(localStorage.getItem("likedRecipes")) || [];
  const likedImages = likedList.slice(0, 4);

  // 🔥 when user selects a new image
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // optional: only allow images
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file 😭");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const updatedUser = { ...user, avatar: reader.result };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="profile">
      <div className="profile-container">
        
        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        {/* click avatar to open files */}
        <img
          src={user?.avatar || Wonwoo}
          className="p-avatar"
          alt="profile"
          onClick={() => fileRef.current.click()}
          onError={(e) => {
            e.target.src = Wonwoo;
          }}
          style={{ cursor: "pointer" }}
          title="Click to change profile picture"
        />

        <p className="p-name">{user?.name}</p>
      </div>

      <h2 className="his-p">Your History</h2>
      <div className="history-collage" onClick={() => navigate("/history")}>
        {historyImages.map((img, index) => (
          <img key={index} src={img} alt="history" className="collage-img" />
        ))}
      </div>

      <h2 className="like-p">Your Liked</h2>
      <div className="liked-collage" onClick={() => navigate("/liked")}>
        {likedImages.length === 0 && (
          <p className="no-liked">No liked recipes yet</p>
        )}

        {likedImages.map((item, index) => (
          <img key={index} src={item.img} alt="liked" className="collage-img" />
        ))}
      </div>
    </div>
  );
}
