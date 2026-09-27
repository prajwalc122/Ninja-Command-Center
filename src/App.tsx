/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './features/auth/AuthModal';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [initialCommand, setInitialCommand] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedToolParams, setSelectedToolParams] = useState<Record<string, any>>({});
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();
  const { user, token, loginWithGoogle, logout } = useAuth();

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
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <OfflineIndicator />

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigateTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            initialCommand={initialCommand}
            onSelectTool={(toolId, params) => {
              setSelectedToolId(toolId);
              setSelectedToolParams(params || {});
              setCurrentTab('tools');
            }}
            onNavigateTab={handleNavigateTab}
            onRecordHistory={handleRecordHistory}
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

      {/* Floating Gemini Quick Assistant Widget on all pages */}
      <GeminiQuickWidget onOpenFullAssistant={() => handleNavigateTab('assistant')} />

      {/* Global Footer */}
      <Footer onSelectTab={handleNavigateTab} />

      {/* Authentication Modal - Only Official Google Account Sign In */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleLogin={loginWithGoogle}
      />
    </div>
  );
}
