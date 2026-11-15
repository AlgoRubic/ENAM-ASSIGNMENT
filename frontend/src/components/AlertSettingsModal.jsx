import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function AlertSettingsModal({
  isOpen,
  onClose,
  volumeThreshold,
  setVolumeThreshold,
  priceThreshold,
  setPriceThreshold,
  onApply
}) {
  if (!isOpen) return null;

  return (
    <AlertSettingsContent
      onClose={onClose}
      volumeThreshold={volumeThreshold}
      setVolumeThreshold={setVolumeThreshold}
      priceThreshold={priceThreshold}
      setPriceThreshold={setPriceThreshold}
      onApply={onApply}
    />
  );
}

function AlertSettingsContent({
  onClose,
  volumeThreshold,
  setVolumeThreshold,
  priceThreshold,
  setPriceThreshold,
  onApply
}) {
  const [volVal, setVolVal] = useState(volumeThreshold);
  const [priceVal, setPriceVal] = useState(priceThreshold);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    setVolumeThreshold(volVal);
    setPriceThreshold(priceVal);
    onApply(volVal, priceVal);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-settings-title"
        className="w-full max-w-md bg-[#161618] border border-white/[0.1] rounded-t-3xl sm:rounded-3xl p-5 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="alert-settings-title" className="text-base font-semibold text-white">Alert Parameters</h2>
          <button 
            onClick={onClose}
            aria-label="Close alert parameters"
            className="w-8 h-8 rounded-full bg-white/[0.08] text-[#86868b] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#a1a1a6] leading-relaxed">
          Configure the volatility and accumulation thresholds for your portfolio. The agent continuously monitors EOD data against these limits and persists them in SQLite.
        </p>

        {/* 1. Volume Multiplier Slider */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Unusual Volume Multiplier</span>
            <span className="text-sm font-mono font-semibold text-white tabular-numbers bg-white/[0.08] px-2.5 py-1 rounded-md">
              {volVal.toFixed(1)}x 20D Avg
            </span>
          </div>
          <input
            type="range"
            min="1.2"
            max="4.0"
            step="0.1"
            value={volVal}
            onChange={(e) => setVolVal(parseFloat(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#86868b] font-mono">
            <span>1.2x (Sensitive)</span>
            <span>2.0x (Standard)</span>
            <span>4.0x (Extreme)</span>
          </div>
        </div>

        {/* 2. Daily Price Volatility Slider */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Price Volatility Band (±%)</span>
            <span className="text-sm font-mono font-semibold text-white tabular-numbers bg-white/[0.08] px-2.5 py-1 rounded-md">
              ±{priceVal.toFixed(1)}% / Day
            </span>
          </div>
          <input
            type="range"
            min="1.5"
            max="8.0"
            step="0.5"
            value={priceVal}
            onChange={(e) => setPriceVal(parseFloat(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#86868b] font-mono">
            <span>±1.5%</span>
            <span>±3.0% (Default)</span>
            <span>±8.0%</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-white hover:bg-white/90 text-black text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Apply & Persist Parameters</span>
        </button>
      </div>
    </div>
  );
}
