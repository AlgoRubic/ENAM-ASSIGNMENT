import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PushFeed from './components/PushFeed';
import PullTerminal from './components/PullTerminal';
import NarrativeAuditView from './components/NarrativeAuditView';
import CopilotChat from './components/CopilotChat';
import CompanySearchModal from './components/CompanySearchModal';
import AlertSettingsModal from './components/AlertSettingsModal';
import { 
  fetchPortfolio, 
  fetchDigest, 
  fetchAlerts, 
  fetchCompanyAnalysis 
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('push'); // 'push' | 'pull' | 'audit' | 'copilot'
  const [selectedSymbol, setSelectedSymbol] = useState('ZOMATO.NS');
  const [portfolio, setPortfolio] = useState([]);
  const [adHocTickers, setAdHocTickers] = useState([]);
  
  // Push Feed state
  const [digest, setDigest] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [windowHours, setWindowHours] = useState(24);
  const [highSignalOnly, setHighSignalOnly] = useState(false);
  const [volumeThreshold, setVolumeThreshold] = useState(2.0);
  const [priceThreshold, setPriceThreshold] = useState(3.0);

  // Pull Terminal state
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Initial Portfolio and Alerts
  useEffect(() => {
    async function loadInitial() {
      const pData = await fetchPortfolio();
      setPortfolio(pData.portfolio || []);
      setAdHocTickers(pData.ad_hoc_tickers || []);

      const aData = await fetchAlerts(volumeThreshold, priceThreshold);
      setAlerts(aData.alerts || []);
    }
    loadInitial();
  }, []);

  // Load Digest when windowHours or highSignalOnly changes
  useEffect(() => {
    async function loadDigest() {
      const dData = await fetchDigest(windowHours, highSignalOnly);
      setDigest(dData);
    }
    loadDigest();
  }, [windowHours, highSignalOnly]);

  // Load Analysis when selectedSymbol changes
  useEffect(() => {
    async function loadAnalysis() {
      setLoadingAnalysis(true);
      const aData = await fetchCompanyAnalysis(selectedSymbol);
      setAnalysis(aData);
      setLoadingAnalysis(false);
    }
    loadAnalysis();
  }, [selectedSymbol]);

  // Re-scan alerts when threshold settings are updated
  const handleApplyThresholds = async (newVol, newPrice) => {
    const aData = await fetchAlerts(newVol, newPrice);
    setAlerts(aData.alerts || []);
  };

  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    // When a symbol is clicked from Push, take user directly to Terminal
    if (activeTab === 'push') {
      setActiveTab('pull');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Mobile Top Header */}
      <Header
        alertCount={alerts.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTab={activeTab}
        selectedSymbol={selectedSymbol}
        portfolio={portfolio}
      />

      {/* Main Responsive View Container (Optimized for Mobile Phone Aspect Ratio) */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 pt-3">
        {activeTab === 'push' && (
          <PushFeed
            digest={digest}
            alerts={alerts}
            windowHours={windowHours}
            setWindowHours={setWindowHours}
            highSignalOnly={highSignalOnly}
            setHighSignalOnly={setHighSignalOnly}
            onSelectSymbol={handleSelectSymbol}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'pull' && (
          <PullTerminal
            analysis={analysis}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            portfolio={portfolio}
            onOpenAuditTab={() => setActiveTab('audit')}
          />
        )}

        {activeTab === 'audit' && (
          <NarrativeAuditView
            analysis={analysis}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            portfolio={portfolio}
          />
        )}

        {activeTab === 'copilot' && (
          <CopilotChat
            selectedSymbol={selectedSymbol}
            portfolio={portfolio}
          />
        )}
      </main>

      {/* Tactile Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals */}
      <CompanySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
        portfolio={portfolio}
        adHocTickers={adHocTickers}
      />

      <AlertSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volumeThreshold={volumeThreshold}
        setVolumeThreshold={setVolumeThreshold}
        priceThreshold={priceThreshold}
        setPriceThreshold={setPriceThreshold}
        onApply={handleApplyThresholds}
      />

    </div>
  );
}
