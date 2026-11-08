import React, { useState } from 'react';
import { Sliders, X, Check, Activity, BellRing } from 'lucide-react';

export default function AlertSettingsModal({
  isOpen,
  onClose,
  volumeThreshold,
  setVolumeThreshold,
  priceThreshold,
  setPriceThreshold,
  onApply
}) {
  const [volVal, setVolVal] = useState(volumeThreshold);
  const [priceVal, setPriceVal] = useState(priceThreshold);

  if (!isOpen) return null;

  const handleSave = () => {
    setVolumeThreshold(volVal);
    setPriceThreshold(priceVal);
    onApply(volVal, priceVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0d131f] border border-gray-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Alert Threshold Parameters</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          The app monitors portfolio EOD data and exchange filings. Configure what constitutes an "unusual move" for your workflow.
        </p>

        {/* 1. Volume Multiplier Slider */}
        <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Unusual Volume Multiplier</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
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
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>1.2x (Sensitive)</span>
            <span>2.0x (Standard)</span>
            <span>4.0x (Extreme Only)</span>
          </div>
        </div>

        {/* 2. Daily Price Volatility Slider */}
        <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Price Move Threshold (±%)</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
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
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>±1.5%</span>
            <span>±3.0% (Default)</span>
            <span>±8.0% (Breakouts)</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-4 h-4" />
          <span>Apply & Rescan Portfolio</span>
        </button>

      </div>
    </div>
  );
}
