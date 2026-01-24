import React, { useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import "../styles/mhome.css";
import snoopy from "../photos/Snoopy.png";
import slide2 from "../photos/slide2.png";
import slide3 from "../photos/slide3.png";
import FoodList from "../pages/FoodList.jsx";

export default function MHome() {
  const slides = [
    {
      title: "SNOOPY VIBE",
      desc: `"Make the food you crave at 2am… even if it's just matcha vibes with your tiny yellow homie."`,
      img: snoopy,
      bg: "#4B5660"
    },
    {
      title: "VANILLA PANCAKE",
      desc: `"Autumn mornings hit different with these heart shaped pancakes.
      Soft, Sweet, and dripping happiness, the kind of comfort food your soul actually deserves."`,
      img: slide2,
      bg: "#C29685"
    },
    {
      title: "SPAGHETTI CARBONARA",
      desc: `"Indulge in creamy, dreamy spaghetti carbonara, 
      a hug in a bowl that turns any meal into a celebration of comfort and flavor."`,
      img: slide3,
      bg: "#E1C0CA"
    }
  ];

  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleMicClick = () => {
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
    console.log("Listening...");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("You said: ", transcript);
      alert(`You said: ${transcript}`);
    };

    recognition.onerror = (event) => {
      console.error("Error occurred: ", event.error);
    };
  };


  

  return (
    <>
    <div className="mhome-container">

      <div className="header-box">
        <div className="slider-wrapper">
          {slides.map((slide, index) => (
            <div
              className="slide"
              key={index}
              style={{
                transform: `translateX(${(index - current) * 100}%)`,
                backgroundColor: slide.bg,
                zIndex: 50
              }}
            >
              <div className="slide-text">
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-desc">{slide.desc}</p>

                <div className="indicator-row">
                  {slides.map((_, dotIndex) => (
                    <div
                      key={dotIndex}
                      className={`rect ${dotIndex === current ? "active" : ""}`}
                    ></div>
                  ))}
                </div>
              </div>

              <img
                src={slide.img}
                alt="slide"
                className={`slide-image ${
                  index === 0 ? "img-snoopy" : index === 1 ? "img-two" : "img-three"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ARROWS outside header-box */}
      <button className="arrow left-arrow" onClick={prevSlide}>❮</button>
      <button className="arrow right-arrow" onClick={nextSlide}>❯</button>

      {/* SEARCH BAR BELOW THE BOX */}
    <div className="search-container">
  <div className="search-wrapper">
    <input 
      type="text" 
      placeholder="Search for recipes..." 
      className="search-bar" 
    />
    <span className="search-icon">🔍︎</span>
    <FaMicrophone 
      size={20} 
      className="mic-icon" 
      onClick={handleMicClick} 
    />
  </div>
</div>   

 {/* foodList suggestions section */}


    <div className ="foodList-suggestions">
       <FoodList/>
    </div>  



    </div>
     </>
  ); 

}
