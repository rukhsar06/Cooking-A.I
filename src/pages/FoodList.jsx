import FoodCard from "./FoodCard";
import  "../styles/FoodList.css";
import pancake from "../photos/pancake.jpeg";
import dosa from "../photos/dosa.jpeg";
import gyoza from "../photos/gyoza.jpeg";
import burger from "../photos/burger.jpeg";
import cake from "../photos/cake.png";
import p from "../photos/p.jpeg";
import sushiR from "../photos/sushiR.jpeg";
import chickenK from "../photos/chickenK.jpeg";
import onigiri from "../photos/onigiri.jpeg";
import fries from "../photos/fries.jpeg";
import tanghulu from "../photos/tanghulu.jpeg";
import mint from "../photos/mint.png";

export default function FoodList() {

  const foods = [
    { id: 1, title: "pancake", img: pancake },
    { id: 2, title: "dosa", img: dosa },
    { id: 3, title: "gyoza", img: gyoza },
    { id: 4, title: "burger", img: burger },
    { id: 5, title: "strawberry cake", img: cake },
    { id: 6, title: "pizza", img: p },
    { id: 7, title: "sushi roll", img: sushiR },
    { id: 8, title: "chicken katsu", img: chickenK },
    { id: 9, title: "onigiri", img: onigiri },
    { id: 10, title: "fries", img: fries },
    { id: 11, title: "tanghulu", img: tanghulu },
     { id: 12, title: "mint ice cream", img: mint }
  ];

  return (
    <div className="food-container">

       {foods.map((food) => (
  <FoodCard
    key={food.id}
    id={food.id}
    title={food.title}
    img={food.img}
  />
))}
      </div>

  );
}
