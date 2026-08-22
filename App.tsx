import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewPreparationPage } from './pages/InterviewPreparationPage';
import { InterviewSetupPage } from './pages/InterviewSetupPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { ProgrammingMockTestPage } from './pages/ProgrammingMockTestPage';
import { InterviewQAPage } from './pages/InterviewQAPage';
import { InterviewResultsPage } from './pages/InterviewResultsPage';
import { InterviewHistoryPage } from './pages/InterviewHistoryPage';
import { ProfilePage } from './pages/ProfilePage';

function AppContent() {
  const { currentPage, toastMessage } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <AuthPages type="login" />;
      case 'register':
        return <AuthPages type="register" />;
      case 'dashboard':
        return <DashboardPage />;
      case 'prepare':
        return <InterviewPreparationPage />;
      case 'setup':
        return <InterviewSetupPage />;
      case 'interview':
        return <MockInterviewPage />;
      case 'mocktest':
        return <ProgrammingMockTestPage />;
      case 'qa':
        return <InterviewQAPage />;
      case 'results':
        return <InterviewResultsPage />;
      case 'history':
        return <InterviewHistoryPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Toast message={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
