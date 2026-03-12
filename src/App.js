import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import EventApp from './EventApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/evento/:slug/*" element={<EventApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
