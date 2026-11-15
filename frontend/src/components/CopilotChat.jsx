import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ShieldCheck } from 'lucide-react';
import { askCopilot } from '../services/api';

export default function CopilotChat({ selectedSymbol }) {
  const isIndexed = ['ZOMATO.NS', 'TATAMOTORS.NS', 'RELIANCE.NS'].includes(selectedSymbol);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: isIndexed
        ? `Primary Research Terminal active for ${selectedSymbol || "ZOMATO.NS"}.\n\nAll queries are verified against audited Annual Reports, quarterly exchange filings, and earnings call transcripts. Broker commentary and news sentiment are excluded.\n\nSelect a prompt below or enter an investigation query.`
        : `Primary Research Terminal active for ${selectedSymbol}.\n\nNotice: This company has not yet been indexed in the primary regulatory document store. The system strictly provides real-time market data and refuses to fabricate guidance or financial metrics.\n\nIndexed companies with full primary document provenance: ZOMATO.NS, TATAMOTORS.NS, RELIANCE.NS.`,
      takeaway: isIndexed ? 'Grounded strictly in primary exchange records.' : 'Market data only; no synthetic guidance.',
      citations: isIndexed ? [
        { doc_type: 'Annual Report FY24 & Q2 FY25 Filings', period: 'FY24-FY25', page_or_time: 'Regulatory Disclosure', exact_quote: 'Direct extraction from verified exchange filings.' }
      ] : []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Audit guidance vs delivery over 4 quarters",
    "Analyze cash conversion ratio & FCF",
    "Operating EBITDA margin trajectory",
    "Primary bull vs bear thesis",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || isLoading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await askCopilot(selectedSymbol, q);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: resp.answer,
        takeaway: resp.key_takeaway,
        citations: resp.grounded_citations || []
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Unable to retrieve verified filing data. Please verify network connectivity.`,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto pb-4">
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-1 py-2 text-xs text-[#86868b]">
        <div className="flex items-center gap-1.5 font-medium text-white/90">
          <span className={`w-1.5 h-1.5 rounded-full ${isIndexed ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`}></span>
          <span>{selectedSymbol}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <ShieldCheck className={`w-3 h-3 ${isIndexed ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`} />
          <span className={isIndexed ? 'text-[#86868b]' : 'text-[#ff9f0a]'}>
            {isIndexed ? 'Primary Grounded' : 'Market Data Only'}
          </span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] text-[13px] leading-relaxed p-4 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-[#2c2c2e] text-white font-normal rounded-br-sm'
                  : 'apple-card text-[#f5f5f7] rounded-bl-sm space-y-2'
              }`}
            >
              <div className="whitespace-pre-line font-normal">{msg.text}</div>

              {msg.takeaway && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-[#86868b]">
                  <span className="text-white font-medium">Core Finding: </span>{msg.takeaway}
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {msg.citations.map((c, i) => (
                    <div key={i} className="text-[10px] text-[#86868b] bg-black/40 p-2 rounded-lg border border-white/[0.04]">
                      <span className="font-semibold text-white/90">{c.doc_type}</span> • {c.page_or_time}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-[#86868b] py-2 px-1">
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            <span>Cross-referencing filing extracts and transcripts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-[#86868b] hover:text-white text-xs font-medium transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Apple-Style Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Research query for ${selectedSymbol || 'ticker'}...`}
          className="flex-1 bg-[#1c1c1e] border border-white/[0.08] focus:border-white/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-[#515156] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 rounded-full bg-white hover:bg-white/90 text-black font-bold disabled:opacity-30 transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

    </div>
  );
}
