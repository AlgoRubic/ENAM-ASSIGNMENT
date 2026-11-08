import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, ChevronRight, ShieldCheck } from 'lucide-react';
import { askCopilot } from '../services/api';

export default function CopilotChat({ selectedSymbol, portfolio = [] }) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello! I am FINN, your institutional public-markets research copilot.\n\nI ground all analysis strictly in primary exchange filings, annual reports, and earnings concall transcripts—with zero broker noise.\n\nCurrently analyzing **${selectedSymbol || "ZOMATO.NS"}**. What would you like to investigate?`,
      takeaway: 'Grounded strictly in audited primary regulatory filings.',
      citations: [
        { doc_type: 'Annual Report FY24 & Q2 FY25 Filings', period: 'FY24-FY25', page_or_time: 'Regulatory Exchange Record', exact_quote: 'Direct extraction from primary company disclosures.' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Audit management guidance vs delivered results",
    "What is the cash conversion quality & FCF?",
    "Show EBITDA margin trajectory & headwinds",
    "What is the primary-grounded bull vs bear thesis?",
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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Analysis grounded in primary filings: Unable to retrieve latest data. Please check connection.`,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto pb-4">
      
      {/* Copilot Header */}
      <div className="glass-panel rounded-2xl p-3 border border-gray-800 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>FINN Research Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-[10px] text-gray-400">
              Active Context: <span className="font-mono text-emerald-300 font-semibold">{selectedSymbol}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 px-2 py-1 rounded bg-black/40 border border-gray-800">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Primary Grounded</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-500 text-black font-semibold rounded-tr-sm shadow-md'
                  : 'glass-panel border border-gray-800 text-gray-200 rounded-tl-sm space-y-2'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Bot Grounded Takeaway & Citations */}
              {msg.takeaway && (
                <div className="mt-2 pt-2 border-t border-gray-800/80 text-[11px] text-emerald-300 font-medium">
                  💡 <span className="text-gray-300">{msg.takeaway}</span>
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1 pt-1 space-y-1">
                  {msg.citations.map((c, i) => (
                    <div key={i} className="text-[10px] text-gray-400 font-mono bg-black/40 p-1.5 rounded border border-gray-800">
                      📄 <span className="text-gray-300">{c.doc_type}</span> ({c.page_or_time})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-gray-400 py-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Cross-referencing primary transcripts & balance sheets...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-[11px] font-medium border border-gray-700/60 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
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
          placeholder={`Ask about ${selectedSymbol || 'portfolio'} fundamentals...`}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-40 transition-all flex items-center justify-center shadow-md shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
