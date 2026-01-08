import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AnalystTool from './pages/AnalystTool';
import PublicMap from './pages/PublicMap';
import CommunityPage from './pages/CommunityPage';
import CommunityGroupPage from './pages/CommunityGroupPage';
import ProjectPage from './pages/ProjectPage';
import ActivityPage from './pages/ActivityPage';
import AboutPage from './pages/AboutPage';
import EventDetailPage from './pages/EventDetailPage';
import TravelDetailPage from './pages/TravelDetailPage';
import MigrationPage from './pages/MigrationPage';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import AccessibilityWidget from './components/AccessibilityWidget';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './hooks/useUser';
import { FavoritesProvider } from './contexts/FavoritesContext';
import LoginOverlay from './components/LoginOverlay';
import ProfileOverlay from './components/ProfileOverlay';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, showLoginOverlay, setLoginOverlay } = useUser();
  const [showProfile, setShowProfile] = React.useState(false);
  const isPublicPage = !location.pathname.startsWith('/analyst');

  return (
    <>
      <LoginOverlay isOpen={showLoginOverlay} onClose={() => setLoginOverlay(false)} />
      <ProfileOverlay isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <Routes>
        {/* Public Routes - Frontend Prototype */}
        <Route path="/" element={<PublicMap onOpenProfile={() => setShowProfile(true)} />} />
        <Route path="/map" element={<PublicMap onOpenProfile={() => setShowProfile(true)} />} />
        <Route path="/community/:id" element={<CommunityPage />} />
        <Route path="/group/:id" element={<CommunityGroupPage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/activities" element={<ActivityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/travel/:id" element={<TravelDetailPage />} />
        <Route path="/migration" element={<MigrationPage />} />

        {/* Analyst Tool - Backend / Admin */}
        <Route path="/analyst/*" element={<AnalystTool />} />

        {/* Catch all - Redirect to Home */}
        <Route path="*" element={<PublicMap onOpenProfile={() => setShowProfile(true)} />} />
      </Routes>

      {/* Floating Accessibility Widget */}
      {isPublicPage && <AccessibilityWidget />}
    </>
  );
};


const App: React.FC = () => {
  return (
    <UserProvider>
      <FavoritesProvider>
        <AccessibilityProvider>
          <Router>
            <AppContent />
          </Router>
        </AccessibilityProvider>
      </FavoritesProvider>
    </UserProvider>
  );
};

export default App;
