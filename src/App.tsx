/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './features/auth/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { HomePage } from './pages/HomePage';
import { ToolsPage } from './pages/ToolsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { GeminiAssistantPage } from './pages/GeminiAssistantPage';
import { GeminiQuickWidget } from './components/GeminiQuickWidget';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { recordHistoryToFirestore } from './lib/firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [initialCommand, setInitialCommand] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedToolParams, setSelectedToolParams] = useState<Record<string, any>>({});
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const { theme, effectiveTheme, toggleTheme, setTheme } = useTheme();
  const {
    user,
    token,
    loginWithGoogle,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
  } = useAuth();

  const handleRecordHistory = async (record: any) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(record),
      });

      // Also persist to Firebase Firestore if logged in
      if (user?.id) {
        await recordHistoryToFirestore(user.id, record);
      }
    } catch (e) {
      console.warn('Failed to record history entry:', e);
    }
  };

  const handleRerunCommand = (cmd: string) => {
    setInitialCommand(cmd);
    setCurrentTab('home');
  };

  const handleNavigateTab = (tab: string) => {
    if (tab !== 'home') {
      setInitialCommand(null);
    }
    if (tab !== 'tools') {
      setSelectedToolId(null);
      setSelectedToolParams({});
    }
    setCurrentTab(tab);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        effectiveTheme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <OfflineIndicator />

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigateTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={logout}
        theme={theme}
        effectiveTheme={effectiveTheme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            initialCommand={initialCommand}
            onNavigateTab={handleNavigateTab}
            onRecordHistory={handleRecordHistory}
            theme={theme}
            effectiveTheme={effectiveTheme}
            onThemeChange={setTheme}
          />
        )}

        {currentTab === 'assistant' && (
          <GeminiAssistantPage
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
            onSelectTool={(toolId) => {
              setSelectedToolId(toolId);
              setSelectedToolParams({});
              setCurrentTab('tools');
            }}
          />
        )}

        {currentTab === 'tools' && (
          <ToolsPage
            initialToolId={selectedToolId}
            initialParameters={selectedToolParams}
            onRecordHistory={handleRecordHistory}
          />
        )}

        {currentTab === 'workflows' && (
          <WorkflowsPage
            onExecuteTool={(toolId, params) => {
              setSelectedToolId(toolId);
              setSelectedToolParams(params || {});
              setCurrentTab('tools');
            }}
            onRecordHistory={handleRecordHistory}
          />
        )}

        {currentTab === 'workspace' && <WorkspacePage />}

        {currentTab === 'history' && (
          <HistoryPage onRerunCommand={handleRerunCommand} />
        )}

        {currentTab === 'about' && <AboutPage />}

        {currentTab === 'admin' && <AdminPage token={token} />}
      </main>

      {/* Floating Gemini Quick Assistant Widget on non-home pages */}
      {currentTab !== 'home' && (
        <GeminiQuickWidget onOpenFullAssistant={() => handleNavigateTab('assistant')} />
      )}

      {/* Global Footer */}
      <Footer onSelectTab={handleNavigateTab} effectiveTheme={effectiveTheme} />

      {/* Authentication Modal - Official Google & Secure Bcrypt Sign In */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleLogin={loginWithGoogle}
        onEmailLogin={login}
        onEmailRegister={register}
        onForgotPassword={forgotPassword}
        onResetPassword={resetPassword}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onTryCommand={(cmd) => {
          setInitialCommand(cmd);
          setCurrentTab('home');
        }}
      />
    </div>
  );
}
