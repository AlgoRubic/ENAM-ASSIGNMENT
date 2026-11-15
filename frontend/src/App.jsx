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
  fetchCompanyAnalysis,
  fetchThresholds,
  saveThresholds
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
  const [loadingDigest, setLoadingDigest] = useState(false);

  // Pull Terminal state
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Initial Portfolio and Persisted Thresholds from SQLite
  useEffect(() => {
    async function loadInitial() {
      const [pData, tData] = await Promise.all([
        fetchPortfolio(),
        fetchThresholds()
      ]);
      setPortfolio(pData.portfolio || []);
      setAdHocTickers(pData.ad_hoc_tickers || []);
      if (tData && !tData.error) {
        if (tData.volume_multiplier) setVolumeThreshold(tData.volume_multiplier);
        if (tData.price_change_pct) setPriceThreshold(tData.price_change_pct);
      }
    }
    loadInitial();
  }, []);

  // Re-fetch Digest and Alerts whenever windowHours, highSignalOnly, or thresholds change
  useEffect(() => {
    async function syncFeedAndAlerts() {
      setLoadingDigest(true);
      const [dData, aData] = await Promise.all([
        fetchDigest(windowHours, highSignalOnly),
        fetchAlerts(volumeThreshold, priceThreshold, windowHours)
      ]);
      setDigest(dData);
      setAlerts(aData.alerts || []);
      // Smooth Apple-style loading fade
      setTimeout(() => setLoadingDigest(false), 240);
    }
    syncFeedAndAlerts();
  }, [windowHours, highSignalOnly, volumeThreshold, priceThreshold]);

  // Load Analysis when selectedSymbol changes
  useEffect(() => {
    async function loadAnalysis() {
      setLoadingAnalysis(true);
      const aData = await fetchCompanyAnalysis(selectedSymbol);
      setAnalysis(aData);
      // Smooth Apple-style loading fade
      setTimeout(() => setLoadingAnalysis(false), 280);
    }
    loadAnalysis();
  }, [selectedSymbol]);

  // Re-scan alerts and persist threshold settings to SQLite backend
  const handleApplyThresholds = async (newVol, newPrice) => {
    setLoadingDigest(true);
    await saveThresholds(newVol, newPrice);
    const aData = await fetchAlerts(newVol, newPrice, windowHours);
    setAlerts(aData.alerts || []);
    setTimeout(() => setLoadingDigest(false), 200);
  };

  const handleSelectSymbol = (symbol) => {
    if (symbol !== selectedSymbol) {
      setLoadingAnalysis(true);
      setSelectedSymbol(symbol);
    }
    // When a symbol is clicked from Push, take user directly to Terminal
    if (activeTab === 'push') {
      setActiveTab('pull');
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col font-sans selection:bg-white selection:text-black">
      
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
            isLoading={loadingDigest}
          />
        )}

        {activeTab === 'pull' && (
          <PullTerminal
            analysis={analysis}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectSymbol}
            portfolio={portfolio}
            onOpenAuditTab={() => setActiveTab('audit')}
            isLoading={loadingAnalysis}
          />
        )}

        {activeTab === 'audit' && (
          <NarrativeAuditView
            analysis={analysis}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={handleSelectSymbol}
            portfolio={portfolio}
            isLoading={loadingAnalysis}
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
