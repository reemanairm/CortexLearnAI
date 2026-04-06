import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Loader, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../services/aiservice';

const AIChatModal = ({ isOpen, onClose, title, explanation, documentId, isLoading }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [shownExplanation, setShownExplanation] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && explanation && !shownExplanation) {
      // Add the initial explanation as an assistant message
      setMessages([
        {
          id: Math.random(),
          role: 'assistant',
          content: explanation,
          timestamp: new Date()
        }
      ]);
      setShownExplanation(true);
    } else if (!isOpen) {
      // Reset state when modal closes
      setMessages([]);
      setShownExplanation(false);
      setInputValue('');
    }
  }, [isOpen, explanation, shownExplanation]);

  // Reset when explanation changes (for different questions)
  useEffect(() => {
    if (explanation && isOpen) {
      setMessages([
        {
          id: Math.random(),
          role: 'assistant',
          content: explanation,
          timestamp: new Date()
        }
      ]);
      setShownExplanation(true);
    }
  }, [explanation]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message to chat
    const newUserMessage = {
      id: Math.random(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setIsSending(true);
    try {
      const response = await aiService.chat(documentId, userMessage);
      const aiMessage = {
        id: Math.random(),
        role: 'assistant',
        content: response.data.answer || response.data,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      // Remove user message if request failed
      setMessages(prev => prev.filter(msg => msg.id !== newUserMessage.id));
      setInputValue(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  const resetChat = () => {
    setMessages(
      explanation ? [
        {
          id: Math.random(),
          role: 'assistant',
          content: explanation,
          timestamp: new Date()
        }
      ] : []
    );
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="bg-slate-900 border border-slate-700 mx-auto rounded-3xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Bot size={22} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AI Tutor</h3>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-950 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="animate-spin-slow w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
              <p className="font-medium animate-pulse text-indigo-400">Formulating explanation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <Bot size={48} className="opacity-30" />
              <p className="text-center text-sm">No messages yet. Ask a question to get started!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="max-w-xs sm:max-w-md px-4 py-3 rounded-2xl bg-slate-800 text-slate-100 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  <p className="text-sm">AI is thinking...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isSending}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={resetChat}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all flex items-center gap-2"
                title="Reset conversation"
              >
                <ChevronDown size={18} className="rotate-180" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
