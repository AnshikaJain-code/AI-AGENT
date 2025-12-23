import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { SummaryPage } from './pages/SummaryPage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { PomodoroPage } from './pages/PomodoroPage';
import { PredictorPage } from './pages/PredictorPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { WeaknessPage } from './pages/WeaknessPage';
import { StudyPathPage } from './pages/StudyPathPage';
import { ConceptMapPage } from './pages/ConceptMapPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { StudyTipsPage } from './pages/StudyTipsPage';
import { useAuthStore } from './store/auth-store';

function AppContent() {
  const { initialize, initialized, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/weakness" element={<WeaknessPage />} />
              <Route path="/study-path" element={<StudyPathPage />} />
              <Route path="/concepts" element={<ConceptMapPage />} />
              <Route path="/community" element={<LeaderboardPage />} />
              <Route path="/tips" element={<StudyTipsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/predictor" element={<PredictorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}