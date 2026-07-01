import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PocBasicPitch from './pages/PocBasicPitch';
import './App.css';

function Home() {
  return (
    <section id="center">
      <h1>vibeauda</h1>
      <nav>
        <Link to="/poc/basic-pitch">PoC: Basic Pitch</Link>
      </nav>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poc/basic-pitch" element={<PocBasicPitch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
