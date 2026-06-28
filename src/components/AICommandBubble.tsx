import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bot, Send, User, X, Volume2, VolumeX, Mic, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { speakText, stopSpeaking } from "../lib/voice";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AICommandBubble() {
  const { tasks, userState, reminders, addTask, updateTask, deleteTask, confirmTaskProgress, addFocusSession } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice feature states
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(() => {
    return localStorage.getItem("focusforge-voice-enabled") === "true";
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const isSpeakerEnabledRef = useRef(isSpeakerEnabled);
  useEffect(() => {
    isSpeakerEnabledRef.current = isSpeakerEnabled;
  }, [isSpeakerEnabled]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
           // It might still be loading, but if it's already fired voiceschanged or if we waited:
        }
      };
      
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) {
            setMessages(prev => [...prev, {
               id: Date.now().toString(),
               role: "assistant",
               content: "Speech synthesis is not available in this browser."
            }]);
          }
        };
      } else if (voices.length === 0) {
        setMessages(prev => [...prev, {
           id: Date.now().toString(),
           role: "assistant",
           content: "Speech synthesis is not available in this browser."
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
         id: Date.now().toString(),
         role: "assistant",
         content: "Speech synthesis is not available in this browser."
      }]);
    }
  }, []);

  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Command Center online. State your query regarding active missions, risks, or reality sync data.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const open = !!customEvent.detail?.open;
      setIsDrawerOpen(open);
      if (open) {
        setIsOpen(false);
      }
    };
    window.addEventListener("task-drawer-toggle", handleToggle);
    return () => {
      window.removeEventListener("task-drawer-toggle", handleToggle);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen || !isSpeakerEnabled) {
      stopSpeaking();
    }
  }, [isOpen, isSpeakerEnabled]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        processAIRequest(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
           setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "assistant",
              content: "Microphone access is required to use voice commands."
           }]);
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
           setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "assistant",
              content: "I couldn't hear you clearly. Please try again."
           }]);
        }
      };
      
      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []); // Bind only once, we will use refs or pass state if needed, but processAIRequest uses current state mostly, wait actually processAIRequest needs latest messages. We'll use a ref or just let it use functional updates.
  // Actually, to avoid stale closures, we can define handleVoiceSend inside or just use functional setMessages. Let's redefine `rec.onresult` when `messages` change, or use a ref for messages.
  
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (recognition) {
       recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          processAIRequest(transcript, messagesRef.current);
       };
    }
  }, [recognition]);

  const toggleSpeaker = () => {
    const newState = !isSpeakerEnabled;
    setIsSpeakerEnabled(newState);
    localStorage.setItem("focusforge-voice-enabled", String(newState));
    if (newState && typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  };

  const unlockSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis && isSpeakerEnabledRef.current) {
      const u = new SpeechSynthesisUtterance("");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      unlockSpeech();
      setInput("");
      try {
        recognition.start();
        setIsListening(true);
        stopSpeaking();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processAIRequest = async (userText: string, currentMessages: Message[] = messages) => {
    if (!userText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText.trim(),
    };
    
    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsProcessing(true);
    stopSpeaking();

    try {
      const response = await fetch("/api/gemini/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           messages: newMessages,
           tasks,
           userState,
           reminders
        })
      });
      
      const data = await response.json();
      
      if (data.actions && Array.isArray(data.actions)) {
         data.actions.forEach((action: any) => {
            if (action.type === "CREATE_TASK") {
               addTask({
                 title: action.payload.title,
                 deadline: action.payload.deadline,
                 importance: { final: action.payload.priority, aiSuggested: action.payload.priority, userOverride: null },
                 estimatedEffortHours: action.payload.estimatedEffortHours || 2,
                 createdFrom: "AI Strategy"
               });
            } else if (action.type === "EDIT_TASK") {
               const updates: any = {};
               if (action.payload.title) updates.title = action.payload.title;
               if (action.payload.deadline) updates.deadline = action.payload.deadline;
               if (action.payload.priority) updates.importance = { final: action.payload.priority, aiSuggested: action.payload.priority, userOverride: null };
               if (action.payload.isPinned !== undefined) updates.isPinned = action.payload.isPinned;
               updateTask(action.payload.id, updates);
            } else if (action.type === "DELETE_TASK") {
               deleteTask(action.payload.id);
            } else if (action.type === "COMPLETE_TASK") {
               confirmTaskProgress(action.payload.id, 100);
            } else if (action.type === "PIN_TASK") {
               updateTask(action.payload.id, { isPinned: true });
            } else if (action.type === "START_FOCUS") {
               addFocusSession(action.payload.id, action.payload.durationMinutes || 25);
            }
         });
      }
      
      if (data.text) {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: data.text
         }]);
         if (isSpeakerEnabledRef.current) speakText(data.text);
      } else {
         const fallback = "Action completed.";
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: fallback
         }]);
         if (isSpeakerEnabledRef.current) speakText(fallback);
      }
    } catch(err) {
       const errText = "System offline. Failed to reach command center.";
       setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: errText
       }]);
       if (isSpeakerEnabledRef.current) speakText(errText);
    } finally {
       setIsProcessing(false);
    }
  };

  if (isDrawerOpen && isMobile) {
    return null;
  }

  if (isMobile && location.pathname.includes("/app/recovery")) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockSpeech();
    processAIRequest(input, messages);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] z-[100] flex flex-col shadow-2xl"
          >
            <Card className="flex-1 flex flex-col bg-[var(--bg-primary)] border-[var(--border-subtle)] overflow-hidden shadow-2xl relative">
              {isConfirmClearOpen && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-2xl w-full max-w-[280px]"
                  >
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">Clear this conversation?</h4>
                    <p className="text-xs text-[var(--text-muted)] mb-6">This will remove all chat history.</p>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setIsConfirmClearOpen(false)}
                        className="h-8 px-3 text-xs border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-primary)]"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          setMessages([{ id: Date.now().toString(), role: "assistant", content: "Command Center online. State your query regarding active missions, risks, or reality sync data." }]);
                          setIsConfirmClearOpen(false);
                        }}
                        className="h-8 px-3 text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50"
                      >
                        Clear Chat
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent-primary)] to-emerald-500 z-10" />

              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-[var(--accent-primary)]" />
                  <div>
                    <h3 className="text-sm font-display font-bold text-[var(--text-primary)]">
                      AI Command Center
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeaker}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300",
                      isSpeakerEnabled 
                        ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_10px_var(--accent-primary)]" 
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    )}
                    aria-label="Toggle Speaker"
                  >
                    {isSpeakerEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <button
                    onClick={() => setIsConfirmClearOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label="Clear Chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3 max-w-[90%]",
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          msg.role === "user"
                            ? "bg-[var(--text-primary)] text-black"
                            : "bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--accent-primary)]",
                        )}
                      >
                        {msg.role === "user" ? (
                          <User size={12} />
                        ) : (
                          <Bot size={12} />
                        )}
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-xs leading-relaxed break-words",
                          msg.role === "user"
                            ? "bg-[var(--chat-user-bg)] border border-[var(--chat-user-border)] text-[var(--chat-user-text)]"
                            : "bg-[var(--chat-ai-bg)] border border-[var(--chat-ai-border)] font-mono text-[var(--chat-ai-text)]",
                        )}
                      >
                        {msg.role === "user" ? (
                           <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <ReactMarkdown
                             components={{
                               h1: ({node, ...props}) => <h1 className="text-[var(--chat-ai-text)] font-bold mb-1" {...props} />,
                               h2: ({node, ...props}) => <h2 className="text-[var(--chat-ai-text)] font-bold mb-1" {...props} />,
                               h3: ({node, ...props}) => <h3 className="text-[var(--chat-ai-text)] font-bold mb-1" {...props} />,
                               p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-[var(--chat-ai-text-secondary)]" {...props} />,
                               ul: ({node, ...props}) => <ul className="text-[var(--chat-ai-text)] list-disc pl-4 mb-2 last:mb-0" {...props} />,
                               ol: ({node, ...props}) => <ol className="text-[var(--chat-ai-text)] list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                               li: ({node, ...props}) => <li className="text-[var(--chat-ai-text)] marker:text-[var(--chat-ai-text)]" {...props} />,
                               a: ({node, ...props}) => <a className="text-[var(--chat-ai-link)] underline" {...props} />,
                               strong: ({node, ...props}) => <strong className="text-[var(--chat-ai-text)] font-bold" {...props} />,
                               code: ({node, inline, className, children, ...props}: any) => {
                                 const match = /language-(\w+)/.exec(className || '');
                                 return !inline && match ? (
                                   <pre className="bg-[var(--chat-ai-code-bg)] p-2 rounded my-2 overflow-x-auto text-[var(--chat-ai-text)]">
                                     <code className={className} {...props}>
                                       {children}
                                     </code>
                                   </pre>
                                 ) : (
                                   <code className="bg-[var(--chat-ai-code-inline-bg)] text-[var(--chat-ai-text)] px-1 py-0.5 rounded" {...props}>
                                     {children}
                                   </code>
                                 );
                               }
                             }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2 relative items-center">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={isListening ? "Listening..." : input}
                      onChange={(e) => {
                        if (!isListening) setInput(e.target.value);
                      }}
                      disabled={isListening}
                      placeholder="Query mission status..."
                      className={cn(
                        "w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg pl-3 pr-[40px] py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-shadow shadow-inner",
                        isListening ? "text-[var(--accent-primary)] animate-pulse placeholder:text-[var(--text-muted)]" : "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      )}
                    />
                    {isListening && (
                       <div className="absolute left-0 bottom-0 w-full h-[2px] overflow-hidden rounded-b-lg">
                          <motion.div 
                            className="h-full bg-[var(--accent-primary)]"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          />
                       </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={cn(
                      "w-9 h-9 shrink-0 flex items-center justify-center rounded-lg transition-all duration-300 relative",
                      isListening 
                        ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_var(--accent-primary)] scale-105" 
                        : "text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    )}
                    aria-label="Toggle Microphone"
                  >
                    {isListening && (
                      <motion.div 
                        className="absolute inset-0 rounded-lg border border-[var(--accent-primary)] opacity-50"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                    <Mic size={16} className={isListening ? "animate-pulse" : ""} />
                  </button>

                  <button
                    type="submit"
                    disabled={(!input.trim() && !isListening) || isProcessing}
                    className="w-9 h-9 p-0 flex items-center justify-center shrink-0 rounded-lg active:scale-95 ai-send-btn"
                    aria-label="Send Message"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-[90px] right-5 md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-[100] transition-colors",
          isOpen
            ? "bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            : "bg-[var(--accent-primary)] text-black",
        )}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </motion.button>
    </>
  );
}
