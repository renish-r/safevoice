/*
GOAL: Make SafeVoice frontend fully responsive and adaptive for all device sizes.

REQUIREMENTS:

1. Mobile-first design approach.
2. Use Tailwind CSS responsive utilities.
3. Breakpoints:
   - sm: 640px
   - md: 768px
   - lg: 1024px
   - xl: 1280px
4. Layout must adapt for:
   - Mobile phones
   - Tablets
   - Laptops
   - Large desktop screens

UI STRUCTURE RULES:

NAVBAR:
- Mobile: Hamburger menu with slide-in drawer
- Desktop: Horizontal navigation bar
- Sticky top
- Responsive spacing and padding

HOME PAGE:
- Stack elements vertically on mobile
- Grid layout on tablet and desktop
- Center content on large screens
- Max width container for readability

PROBLEM CARDS:
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 or 4 columns
- Use responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

UPLOAD PAGE:
- Form width:
  - Mobile: full width
  - Desktop: max-w-2xl centered
- Buttons full width on mobile
- Side-by-side fields on desktop using flex

IMAGES:
- Use object-cover
- Responsive height using:
  h-48 md:h-64 lg:h-72
- Prevent overflow

DASHBOARD:
- Mobile: Vertical stacked cards
- Desktop: Sidebar + main content layout
- Use flex-col lg:flex-row

GENERAL RULES:
- Use container mx-auto px-4
- Avoid fixed widths
- Use max-w classes
- Add responsive margins:
  mt-4 md:mt-6 lg:mt-8
- Use responsive text sizes:
  text-sm md:text-base lg:text-lg

ACCESSIBILITY:
- Proper button sizes for mobile
- Minimum touch target 44px
- Use aria-label where necessary

Animations:
- Use smooth transitions
- Use transition-all duration-300

Implement responsive layout using Tailwind CSS only.
Do not use inline styles.
Keep components clean and modular.
*/

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import UploadProblem from './pages/UploadProblem';
import ProblemFeed from './pages/ProblemFeed';
import OfficialLogin from './pages/OfficialLogin';
import OfficialDashboard from './pages/OfficialDashboard';
import OfficialRegister from './pages/OfficialRegister';
import Profile from './pages/Profile';
import ResolvedSpace from './pages/ResolvedSpace';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<ProblemFeed />} />
          <Route path="/report" element={<UploadProblem />} />
          <Route path="/auth/login" element={<OfficialLogin />} />
          <Route path="/auth/register" element={<OfficialRegister />} />
          <Route path="/dashboard" element={<OfficialDashboard />} />
          <Route path="/resolved" element={<ResolvedSpace />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
