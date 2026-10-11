import React, { useState } from 'react';
import { FarmProvider } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FarmCanvas } from './components/canvas/FarmCanvas';
import { AgentChatDrawer } from './components/agent/AgentChatDrawer';
import { FarmProfileDrawer } from './components/profile/FarmProfileDrawer';

function MainLayout() {
  const [isAgentChatOpen, setIsAgentChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-text-main font-sans">
      <Header 
        onOpenAgentChat={() => setIsAgentChatOpen(true)} 
        onOpenProfile={() => setIsProfileOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <FarmCanvas />
      </div>

      {/* Side Navigation Farm Plot Profile Drawer */}
      <FarmProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Slide-over AI Agronomist Chat Drawer */}
      <AgentChatDrawer
        isOpen={isAgentChatOpen}
        onClose={() => setIsAgentChatOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <FarmProvider>
      <MainLayout />
    </FarmProvider>
  );
}

export default App;
