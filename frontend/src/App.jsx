import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import UploadProblem from './pages/UploadProblem';
import ProblemFeed from './pages/ProblemFeed';
import OfficialLogin from './pages/OfficialLogin';
import OfficialDashboard from './pages/OfficialDashboard';
import OfficialRegister from './pages/OfficialRegister';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<ProblemFeed />} />
          <Route path="/report" element={<UploadProblem />} />
          <Route path="/auth/login" element={<OfficialLogin />} />
          <Route path="/auth/register" element={<OfficialRegister />} />
          <Route path="/dashboard" element={<OfficialDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
