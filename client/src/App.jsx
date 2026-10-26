import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastProvider } from './hooks/useToast';
import HomePage from './pages/HomePage';
import ClipboardPage from './pages/ClipboardPage';
import ShareFilesPage from './pages/ShareFilesPage';
import RetrievePage from './pages/RetrievePage';
import ShareViewPage from './pages/ShareViewPage';
import MySharesPage from './pages/MySharesPage';
import HowItWorksPage from './pages/HowItWorksPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/clipboard" element={<ClipboardPage />} />
              <Route path="/share-files" element={<ShareFilesPage />} />
              <Route path="/retrieve" element={<RetrievePage />} />
              <Route path="/share/:shareId" element={<ShareViewPage />} />
              <Route path="/my-shares" element={<MySharesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
