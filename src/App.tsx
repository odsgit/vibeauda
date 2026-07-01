import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PocBasicPitch from './pages/PocBasicPitch';
import TrackViewer from './pages/TrackViewer';
import {
  DEMO_BASS,
  DEMO_CHORDS,
  DEMO_DRUM,
  DEMO_GUITAR1,
  DEMO_GUITAR2,
  DEMO_LYRICS,
  DEMO_SYNTH,
  DEMO_VOCAL,
} from './data/demoTrack';
import './App.css';

const DEMO_PARTS = {
  vocal: DEMO_VOCAL,
  guitar1: DEMO_GUITAR1,
  guitar2: DEMO_GUITAR2,
  bass: DEMO_BASS,
  drum: DEMO_DRUM,
  synth: DEMO_SYNTH,
};

function Home() {
  return (
    <section id="center">
      <h1>vibeauda</h1>
      <nav>
        <Link to="/poc/basic-pitch">PoC: Basic Pitch</Link>
        <br />
        <Link to="/viewer">TrackViewer 데모</Link>
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
        <Route
          path="/viewer"
          element={
            <TrackViewer
              title="데모 트랙"
              artist="vibeauda 데모"
              parts={DEMO_PARTS}
              chords={DEMO_CHORDS}
              lyrics={DEMO_LYRICS}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
