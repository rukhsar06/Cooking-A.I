import "../styles/Profile.css";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Wonwoo from "../photos/Wonwoo.jpeg";
import { API_BASE } from "../config";

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [user, setUser] = useState(storedUser);

  const [likedList, setLikedList] = useState([]);
  const [historyList, setHistoryList] = useState([]);

  const likedImages = likedList.slice(0, 4);
  const historyImages = historyList.slice(0, 6);

  useEffect(() => {
    if (!user?.token) {
      setLikedList([]);
      setHistoryList([]);
      return;
    }

    fetch(`${API_BASE}/api/likes`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLikedList(data || []))
      .catch(() => setLikedList([]));

    fetch(`${API_BASE}/api/history`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistoryList(data || []))
      .catch(() => setHistoryList([]));
  }, [user?.token]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  if (!user) {
    return (
      <div className="profile">
        <div className="profile-container">
          <img src={Wonwoo} className="p-avatar" alt="profile" />
          <p className="p-name">Guest</p>
          <p style={{ marginTop: "10px" }}>Login to see your profile stuff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-container">
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

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

        <p className="p-name">{user?.username}</p>
      </div>

      <h2 className="his-p">Your History</h2>
      <div className="history-collage" onClick={() => navigate("/history")}>
        {historyImages.length === 0 ? (
          <p className="no-liked">No history yet</p>
        ) : (
          historyImages.map((item) => (
            <img
              key={item.id}
              src={item.imageUrl || Wonwoo}
              alt={item.title || "history"}
              className="collage-img"
            />
          ))
        )}
      </div>

      <h2 className="like-p">Your Liked</h2>
      <div className="liked-collage" onClick={() => navigate("/liked")}>
        {likedImages.length === 0 ? (
          <p className="no-liked">No liked recipes yet</p>
        ) : (
          likedImages.map((item) => (
            <img
              key={item.id}
              src={item.imageUrl || Wonwoo}
              alt={item.title || "liked"}
              className="collage-img"
            />
          ))
        )}
      </div>
    </div>
  );
}
