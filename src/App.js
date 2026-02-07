import './App.css';
import Navbar from './component/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/history';
import RegisterForm from './component/RegisterForm';
import LoginForm from './component/LoginForm';
import MHome from './component/MHome..jsx';
import Profile from './pages/Profile';
import Liked from './pages/liked.jsx';
import RecipeDetail from './pages/RecipeDetail';

function App() {
  return (
    <Router>
      <Navbar /> {/* stays on top always */}
     
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/history" element={<History/>} />
          <Route path="/reg" element={<RegisterForm/>} />
          <Route path="/log" element ={<LoginForm/>} />
          <Route path ="/Mhome" element ={<MHome/>} />
          <Route path ="/profile" element ={<Profile/>} />
          <Route path ="/liked" element ={<Liked/>} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
