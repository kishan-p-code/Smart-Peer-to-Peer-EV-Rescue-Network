import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { askOpenRouterAssistant } from '../../services/aiService';
import { useApp } from '../../context/AppContext';

interface AIAssistantDrawerProps {
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ onClose }) => {
  const { chargers, activeBooking, formatCurrency } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Predictive Telemetry & AI Grid Assistant online. Powered by OpenRouter Gemini 2.0 Flash for electrical power analysis, trip consumption modeling, and safe earthing guidelines. Enter an engineering prompt below.',
      time: '12:00 PM'
    }
  ]);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: prompt, time };
    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    const context = `Active grid charging stations: ${chargers.length}. Current live session: ${activeBooking ? activeBooking.chargerTitle + ' at ' + activeBooking.activeSession?.flowRateKw + ' kW' : 'None'}.`;

    const reply = await askOpenRouterAssistant(prompt, context);
    const aiMsg = { sender: 'ai' as const, text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const samplePrompts = [
    'Calculate charging stops and battery consumption for a 150-mile road trip (75 kWh battery)',
    'Review Level 2 commercial circuit breaker & grounding safety requirements',
    'Evaluate optimal per-kWh rate with 15% host margin and equipment depreciation'
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-[460px] h-full bg-white border-l border-[#BAE6FD] shadow-2xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="p-4 border-b border-[#BAE6FD] flex items-center justify-between bg-[#F0F9FF]">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0284C7]" />
            <span className="text-xs font-mono font-bold text-[#0F172A] uppercase tracking-wider">
              AI Telemetry & Trip Advisor
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#16A34A] font-bold block mt-0.5">
            [ONLINE] OpenRouter Gemini 2.0 Flash / Energy AI
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-mono text-[#64748B] mb-1 font-bold">
              {m.sender === 'user' ? 'OPERATOR' : 'EVIO AI'} • {m.time}
            </div>
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[92%] whitespace-pre-wrap shadow-xs ${
                m.sender === 'user'
                  ? 'bg-[#0284C7] text-white font-medium'
                  : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-xs text-[#0284C7] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping"></span>
            <span>Querying OpenRouter neural model...</span>
          </div>
        )}
      </div>

      {/* Suggested prompts & Input */}
      <div className="p-4 border-t border-[#BAE6FD] bg-[#F8FAFC] space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Pre-Engineered Prompts:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="w-full text-left p-2 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-[11px] text-[#475569] hover:text-[#0284C7] transition-colors truncate block shadow-xs"
            >
              &gt; {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI technical question..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] shadow-xs"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="p-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold disabled:opacity-40 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      </div>
    </div>
  );
};
