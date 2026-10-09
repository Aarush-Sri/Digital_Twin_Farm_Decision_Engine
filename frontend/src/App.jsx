import React from 'react';
import { FarmProvider } from './context/FarmContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FarmCanvas } from './components/canvas/FarmCanvas';

function App() {
  return (
    <FarmProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-text-main font-sans">
        <Header />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <FarmCanvas />
        </div>
      </div>
    </FarmProvider>
  );
}

export default App;
