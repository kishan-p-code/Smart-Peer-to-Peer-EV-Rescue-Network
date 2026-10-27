import React, { useState } from 'react';
import { X, Send, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatDrawerProps {
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ onClose }) => {
  const { currentUser, chatMessages, sendChatMessage } = useApp();
  const [inputText, setInputText] = useState('');

  const activeBookingId = 'BKG-DEFAULT';

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;
    sendChatMessage(activeBookingId, text);
    setInputText('');
  };

  const quickMessages = [
    'Approaching the station security gate.',
    'Plugged in to the 22kW charging port.',
    'Session completed. Clearing the bay now.',
    'Confirmed gate access code 4829#.'
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-96 h-full bg-white border-l border-[#BAE6FD] shadow-2xl flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F0F9FF]">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#0F172A] uppercase">Host & Driver Direct Chat</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#64748B] mt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
            <span>Encrypted in-app transmission</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
        {chatMessages.length === 0 ? (
          <div className="text-center p-8 text-xs text-[#64748B]">
            No previous messages in this thread.
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[10px] text-[#64748B]">
                  <span>{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[#0284C7] text-white font-semibold rounded-br-none shadow-xs'
                      : 'bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Action Chips & Input Box */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3 font-mono">
        
        {/* Quick Message Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickMessages.map(qm => (
            <button
              key={qm}
              onClick={() => handleSend(qm)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0284C7] hover:border-[#0284C7] transition-all text-left shadow-xs"
            >
              + {qm}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
          />
          <button
            type="submit"
            className="p-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

      </div>
    </div>
  );
};
