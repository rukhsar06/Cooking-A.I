import {React,useState,useRef} from 'react' ;
import  '../styles/Home.css';
import sandw from  '../photos/sandw.png';
import cake from "../photos/cake.png";
import Dessert from "../photos/Dessert.png";
import pizza from "../photos/pizza.png";
import strawberry from "../photos/strawberry.png";
import m from "../photos/m.png";
import logo from "../photos/logo.png";
import music from "../music/music.mp3";
import play from "../photos/play.png";
import pause from "../photos/pause.png";
import cat from "../photos/cat.png";
import ice from "../photos/ice.png";
import shrimp from "../photos/shrimp.png";
import pasta from "../photos/pasta.png";
import wine from "../photos/wine.png";
import macha from "../photos/macha.png";
function Home () {
  
  const [isPlaying , setIsPlaying ] = useState(false);
  const audioRef = useRef(new Audio(music));


  const handleClick=() => {
    if (isPlaying) {
        audioRef.current.pause();
       setIsPlaying(false)
} else {
   audioRef.current.play();
  setIsPlaying(true)
}
  }

    return (
        <div className ="home">
          <header className ="home-header">
           <h5>Welcome to Our Cooking A.I</h5>
           <img src = {strawberry} className = "strawberry" alt = " straw=img"></img>
           <img src = {m} className = "m" alt = "m"></img>
            <img src = {logo} className = "logo" alt = "logo"></img>
            <p className = "tagline">May I Ask</p>
           <img
  src={isPlaying ? pause : play}  // either a small icon image or use emoji fallback
  onClick={handleClick}
  alt="play/pause"
  className="music-toggle"
/> 
          </header>
          {/* img Section */}

          <img src = {cat} className = "cat" alt = "cat"></img>
          <img src = {ice} className = "ice" alt = "ice"></img>
          <img src = {shrimp} className = "shrimp" alt = "shrimp"></img>
          <img src = {pasta} className = "pasta" alt = "wine"></img>
          <img src = {wine} className = "wine" alt = "wine"></img>
          <img src = {macha} className = "macha" alt = "macha"></img>
          {/* About Section */}

        <div className = "abt" >
          <h3 className="title">ABOUT SECTION : </h3>
          <p className = "prg">Welcome to Cooking A.I. — where artificial intelligence meets actual appetite.
          Tired of staring at your fridge like it's supposed to talk back? Yeah, same. That's why we built Cooking A.I. — your smart, sassy sous-chef who knows exactly what you’re craving (even when you don’t).
          Whether you've got one egg, two tomatoes, and zero braincells left after work — we got you. Cooking A.I.
          turns scraps into magic, plans your meals, and even recommends recipes based on your mood, taste, and pantry.
          All without the “what should I make?” crisis.</p>
          <img src = {sandw} className = "snd"  alt = "sandw" ></img>
        </div>
        {/* why  i started section */}

        <div className="why-sec" id = "why">
               <h3 className = "why" >🍳 Why I Started</h3>
               <p className="p2">It all began on a hungry day, with one too many recipe fails, 
                and a dev who was this close to ordering noodles again. That's when Cooking A.I. was born.
                We were tired of soulless food blogs and robots that read instructions like your printer reads paper. So we built an AI that thinks like a chef — intuitive, adaptive, and actually helpful.
                You bring the recipe or just the vibes, and the AI handles the rest — guiding you through the chaos, 
                fixing your flops, and making sure your food actually slaps.
                Not just smart. Savvy. Saucy. Kitchen genius.
                paste your blog recipe and let the A.I guide you 
                or enter the ingredients you have in your fridge 
                Let's cook. 🔥</p>
        </div>
        <img src = {cake} className = "cake" alt = "cake "></img>

        {/* reason sec*/}

        <div className = "highlights" id="highlights">
          <h3 ClassName ="h-title"> 🍴✨ Feature Highlight: Never Lose That Perfect Recipe Again</h3>
          <p className ="p3">How many times have you found the perfect recipe on YouTube or Pinterest, 
            cooked it once, and then… forgot where it came from? Yeah. We've been there too.
            With Cooking A.I., your recipe history is automatically saved — no copy-pasting,
            no bookmarks, no panic. Whether it came from a blog,news, or your grandma's secret curry thread on Reddit,
            we've got your back.You'll always have the option to: </p>
            <ul className ="p4">
           <li>  ✅ Keep it saved </li>
           <li> 🗑️ Delete it anytime you want </li>
            <li>📝 Leave notes or feedback on each recipe — so you remember exactly what made it a hit (or miss) </li>
            </ul>
           <p className = "p5"> It's your kitchen. Your taste. We're just here to help you remember the good stuff.</p>
           <img src = {Dessert} className = "dessert" alt = "dessert"></img>
        </div>
        {/* mission section */}

        <div className = "mission">
          <h3 className = "m-title">🎯 Mission </h3>
          <p className = "m-prg"> To make everyday cooking feel like a treat, not a task. 
           No more guesswork, 
           no more food waste — just good food, good vibes,
           and tech that actually gets you.</p>
         </div>

         {/* dev */}
          <div className = "dev" id="dev">
            <h3 className = "d-title">Meet the Dev</h3>
            <img src = {pizza} className = "pizza" alt = "pizza"></img>
            <p className = "d-prg">Ideated, designed, and developed the entire project independently. 
              Built the backend with Spring Boot and implemented the frontend for a seamless,
              responsive user experience. Handled everything from architecture design to deployment.
              </p>
            </div>

            {/* footer */}
            <footer className="footer">
             <h3 className='cnt'> Connect With Me</h3>
             <ul>
            <li>  <a 
                  href="https://github.com/rukhsar06" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  >
                  My GitHub
             </a> </li> 
             <li className = "indeed">  <a 
              href = "https://profile.indeed.com/p/rukhsars-hdb4zf0"
              target = "_blank"
              rel = "noopener noreferrer"
              >
               Indeed
              </a> </li> 
              </ul>
              <h3 className = "tag">© 2025 Rukhsar . All rights reserved.</h3>
            </footer>
           

        </div>

    )
        
    }

    export default Home;
