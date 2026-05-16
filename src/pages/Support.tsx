import { useState, useRef, useEffect } from "react"
import { Search, Send, Settings, User, X } from "lucide-react"
import DarkModeToggle from "../components/DarkModeToggle"

export default function Support() {
  const [messages, setMessages] = useState<{role: 'user'|'bot'|'system', text: string}[]>([])
  const [inputVal, setInputVal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [chatLanguage, setChatLanguage] = useState("English")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const result = reader.result as string;
          if (!result) return;
          const base64data = result.split(',')[1];
          const mimeType = result.split(';')[0].split(':')[1];
          
          setIsLoading(true);
          try {
             setMessages(prev => [...prev, {role: 'system', text: "Transcribing audio..."}]);
             const res = await fetch('/api/transcribe', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ audioBase64: base64data, mimeType: mimeType })
             });
             const data = await res.json();
             setMessages(prev => prev.filter(m => m.text !== "Transcribing audio..."));
             if (data.text) {
                 setInputVal(prev => prev ? prev + ' ' + data.text : data.text);
             } else {
                 alert("Transcription failed.");
             }
          } catch(e) {
             console.error(e);
             alert("Error transcribing audio.");
             setMessages(prev => prev.filter(m => m.text !== "Transcribing audio..."));
          } finally {
             setIsLoading(false);
          }
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      }

      mediaRecorder.start()
      setIsListening(true)
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      if (error.name === 'NotFoundError' || error.message?.includes('device not found')) {
        alert("No microphone device was found on your system. Please connect a microphone to use voice features.")
      } else {
        alert("Microphone access is unavailable in this preview. To use voice features, click 'Open in New Tab' in the top right corner and allow microphone permissions.")
      }
      setIsListening(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const getInitialConversations = () => {
    const saved = localStorage.getItem('chat_conversations');
    if (saved) {
       try {
           const parsed = JSON.parse(saved);
           if (Array.isArray(parsed) && parsed.length > 0) return parsed;
       } catch (e) {
           console.error('Failed to parse conversations', e);
       }
    }
    return [
       { id: 1, title: 'Sensor E-104 Thermal Deviation', desc: 'Checking historical data for chiller units...', status: 'ACTIVE', time: '2m ago', messages: [{role: 'user', text: "Explain E-104"}, {role: 'bot', text: "Sensor E-104 on Chiller Unit #42 is showing a 15% deviation in thermal reads."}] },
       { id: 2, title: 'Weekly Maintenance Report', desc: 'Data from last week', status: 'ARCHIVED', time: 'Yesterday', messages: [{role: 'user', text: "Give me the weekly maintenance report."}, {role: 'bot', text: "Here is your weekly report. All systems nominal except HVAC B."}] },
       { id: 3, title: 'Industrial Oven Calibration', desc: 'Calibration steps', status: 'ARCHIVED', time: 'Mar 12', messages: [{role: 'user', text: "How do I calibrate the industrial oven?"}, {role: 'bot', text: "Please follow standard procedure OP-32. Ensure power is disconnected before starting."}] },
    ]
  }

  const [conversations, setConversations] = useState<{id: number, title: string, desc: string, status: string, time: string, messages: {role: string, text: string}[]}[]>(getInitialConversations)

  useEffect(() => {
    localStorage.setItem('chat_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const filteredConversations = conversations.filter(c => c.title.toLowerCase().includes(searchHistory.toLowerCase()) || c.desc.toLowerCase().includes(searchHistory.toLowerCase()))

  const handleConversationClick = (conv: typeof conversations[0]) => {
     setMessages(conv.messages as any)
     setActiveConversationId(conv.id)
     setConversations(prev => prev.map(c => c.id === conv.id ? {...c, status: 'ACTIVE'} : {...c, status: 'ARCHIVED'}))
  }

  const handleNewConversation = () => {
    setMessages([])
    setActiveConversationId(null)
    setConversations(prev => prev.map(c => ({...c, status: 'ARCHIVED'})))
  }

  useEffect(() => {
    if (activeConversationId) {
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, messages: messages, desc: `${messages.length} messages` } : c
      ));
    } else if (messages.length > 0) {
      const firstUserMsg = messages.find((m: any) => m.role === 'user')
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '') : 'New Session'
      const newId = Date.now();
      const newConv = {
        id: newId,
        title,
        desc: `${messages.length} messages`,
        status: 'ACTIVE',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        messages: messages as any
      }
      setActiveConversationId(newId);
      setConversations(prev => [newConv, ...prev.map(c => c.status === 'ACTIVE' ? {...c, status: 'ARCHIVED'} : c)]);
    }
  }, [messages, activeConversationId]);

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHumanModal, setShowHumanModal] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const handleExportTranscript = () => {
    const chatHistory = JSON.parse(localStorage.getItem('chat_conversations') || '[]');
    let exportData = "=== Chat Transcripts ===\n\n";
    exportData += JSON.stringify(chatHistory, null, 2);

    const link = document.createElement("a");
    link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(exportData);
    link.download = "chat_transcripts.txt";
    link.click();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (presetMsg?: string) => {
    const msg = typeof presetMsg === 'string' ? presetMsg : inputVal.trim()
    if(!msg || isLoading) return
    if (typeof presetMsg !== 'string') setInputVal("")
    
    setMessages(prev => [...prev, {role: 'user', text: msg}])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msg, language: chatLanguage })
      })
      const data = await res.json()
      if(data.text) {
        setMessages(prev => [...prev, {role: 'bot', text: data.text}])
      } else {
        setMessages(prev => [...prev, {role: 'bot', text: "Sorry, I encountered an error."}])
      }
    } catch {
      setMessages(prev => [...prev, {role: 'bot', text: "Offline or server error."}])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-100px)] md:h-full md:max-h-[calc(100vh-64px)] overflow-x-scroll overflow-y-hidden rounded-xl border bg-white shadow-sm md:mr-4 mt-[-10px] pb-2">
      {/* Left Sidebar for Conversations */}
      <div className="flex w-72 md:w-80 border-r bg-[#f8fafc] flex-col shrink-0">
         <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-bold mb-4">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" value={searchHistory} onChange={(e) => setSearchHistory(e.target.value)} placeholder="Search history..." className="pl-9 pr-4 py-2 w-full bg-[#f1f5f9] border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredConversations.map(conv => (
               <div key={conv.id} onClick={() => handleConversationClick(conv)} className={`p-4 rounded-xl cursor-pointer ${conv.status === 'ACTIVE' ? 'bg-white shadow-sm border ring-1 ring-black/5' : 'hover:bg-slate-100'}`}>
                  <div className="flex justify-between items-start mb-1.5">
                     <span className={`text-[10px] font-bold tracking-widest ${conv.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-400'}`}>{conv.status}</span>
                     <span className="text-xs text-slate-400">{conv.time}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{conv.title}</h4>
                  {conv.desc && <p className="text-xs text-slate-500 mt-1 truncate">{conv.desc}</p>}
               </div>
            ))}
         </div>
         <div className="p-4 bg-white border-t">
            <button onClick={handleNewConversation} className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex justify-center items-center gap-2">
               + New Conversation
            </button>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white min-w-[500px]">
         <div className="h-16 border-b flex justify-between items-center px-6 shrink-0 bg-white z-10 relative">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
               </div>
               <div>
                  <h3 className="font-bold text-slate-800">ThermaBot</h3>
                  <p className="text-[10px] font-bold text-emerald-600 tracking-wider flex items-center gap-1.5 uppercase">
                     <span>AI SYSTEM ONLINE</span>
                  </p>
               </div>
             </div>
            <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto pr-2 sm:pr-0">
               <button onClick={() => alert("Model context optimization enabled! Future queries will utilize deeper reasoning tracks.")} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors border border-blue-100 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="hidden lg:inline">Optimize Context</span>
               </button>
               <button onClick={handleExportTranscript} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full shrink-0" title="Export Transcript">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               </button>
               <button onClick={() => setShowSettingsModal(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full shrink-0" title="Settings">
                  <Settings className="w-5 h-5" />
               </button>
               <button onClick={() => setShowHumanModal(true)} className="bg-[#fdf3ec] text-[#d97706] hover:bg-orange-100 font-medium py-1.5 px-3 sm:px-4 rounded-lg text-sm flex items-center gap-2 transition-colors border border-orange-200 shadow-sm shrink-0">
                  <User size={16} /> <span className="hidden sm:inline">Connect to Human</span>
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-blue-100">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2">How can I help today?</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                     I'm monitored by ThermaPredict's real-time ML engine. Ask me about
                     system health, specific sensor codes, or operational optimization.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                     <button onClick={() => handleSend("Show active alerts")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Show active alerts
                     </button>
                     <button onClick={() => handleSend("Explain E-104")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Explain E-104
                     </button>
                     <button onClick={() => handleSend("Recent maintenance logs")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Recent maintenance logs
                     </button>
                     <button onClick={() => setShowHumanModal(true)} className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 shadow-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" /> Connect to Human Agent
                     </button>
                  </div>
               </div>
            ) : (
               <div className="space-y-6 max-w-3xl mx-auto py-6">
                 {messages.map((m, i) => (
                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                       {m.role === 'bot' && (
                         <div className="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-white mt-1">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         </div>
                       )}
                       <div className={`p-4 rounded-xl max-w-[80%] ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : m.role === 'system' ? 'w-full bg-orange-50 text-orange-800 italic text-sm text-center mx-auto rounded-xl shadow-sm' : 'bg-white border shadow-sm rounded-tl-none font-medium text-slate-700 leading-relaxed'}`}>
                          <span>{m.text}</span>
                          {m.role === 'bot' && (
                             <button onClick={() => {
                               const utterance = new SpeechSynthesisUtterance(m.text);
                               window.speechSynthesis.speak(utterance);
                             }} className="ml-2 text-slate-400 hover:text-blue-600 inline-flex align-middle" title="Read Aloud">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" /></svg>
                             </button>
                          )}
                          {/* Simulated widget for bot response based on Image 5 */}
                          {m.role === 'bot' && i === 1 && m.text.includes('15% deviation') && (
                            <div className="mt-4 p-4 border rounded-xl bg-slate-50 pt-3">
                               <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                     <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v7.29l1.62-.81a1 1 0 01.89 1.78l-2 1a1 1 0 01-.89 0l-2-1a1 1 0 11.89-1.78L10 10.29V3a1 1 0 011-1z" clipRule="evenodd"/></svg>
                                     <span className="font-bold text-sm text-slate-800">Chiller Unit #42 (E-104)</span>
                                  </div>
                                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">CRITICAL</span>
                               </div>
                               <div className="h-16 flex items-end gap-1 px-2 relative border-b border-slate-200 pb-1">
                                  <div className="w-1/4 h-1/4 bg-blue-200 rounded-t"></div>
                                  <div className="w-1/4 h-1/3 bg-blue-200 rounded-t"></div>
                                  
                                  <div className="absolute top-[30%] left-[30%] text-[10px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded shadow-sm z-10">
                                     Thermal Drift Detected
                                  </div>

                                  <div className="w-1/4 h-1/3 bg-blue-200 rounded-t relative">
                                    <div className="absolute -top-[1px] left-0 w-full h-[1px] bg-slate-300 border-t border-dashed"></div>
                                  </div>
                                  <div className="w-1/4 h-full bg-rose-200 rounded-t shadow-inner border border-rose-300"></div>
                               </div>
                            </div>
                          )}
                       </div>
                       {m.role === 'user' && (
                         <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 mt-1">
                           JD
                         </div>
                       )}
                    </div>
                 ))}
                 {isLoading && (
                    <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center text-white mt-1">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       </div>
                       <div className="p-4 rounded-xl bg-white border shadow-sm rounded-tl-none">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce" style={{animationDelay: "150ms"}}></div>
                            <div className="w-2 h-2 rounded-full bg-slate-200 animate-bounce" style={{animationDelay: "300ms"}}></div>
                          </div>
                       </div>
                    </div>
                 )}
                 <div ref={chatEndRef} />
               </div>
            )}
         </div>

         {/* Input Box */}
         <div className="p-4 bg-white border-t relative z-10 shrink-0">
            <div className="max-w-4xl mx-auto bg-white border rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-100">
               <div className="px-4 py-2 border-b bg-slate-50/50 flex items-center gap-3">
                  <input type="file" id="picture-upload" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) { handleSend(`[Image Attached: ${e.target.files[0].name}]`); e.target.value = ''; } }} />
                  <button onClick={() => document.getElementById('picture-upload')?.click()} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></button>
                  <input type="file" id="file-upload" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { handleSend(`[File Attached: ${e.target.files[0].name}]`); e.target.value = ''; } }} />
                  <button onClick={() => document.getElementById('file-upload')?.click()} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg></button>
                  <div className="h-4 w-px bg-slate-300 mx-1"></div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ML Engine: Ready</span>
               </div>
               <div className="flex items-center px-4 py-2 bg-white">
                  <input 
                     type="text" 
                     placeholder="Message ThermaBot..." 
                     className="flex-1 py-3 focus:outline-none placeholder:text-slate-400"
                     value={inputVal}
                     onChange={e => setInputVal(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <div className="flex items-center gap-2">
                     <button onClick={toggleListening} className={`p-2 transition-colors ${isListening ? 'text-rose-500 bg-rose-50 rounded-full animate-pulse' : 'text-slate-400 hover:text-slate-600'}`} title={isListening ? "Listening..." : "Voice Input"}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                     </button>
                     <button onClick={() => handleSend()} disabled={isLoading || !inputVal.trim()} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">
                        <Send className="w-5 h-5 ml-0.5" />
                     </button>
                  </div>
               </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-3">
               ThermaBot can make mistakes. Verify critical system adjustments with a supervisor.
            </p>
         </div>
      </div>
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
               <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Settings className="w-6 h-6" />
               </div>
               <h2 className="text-xl font-bold">Chat Settings</h2>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Message Sounds</span>
                  <input type="checkbox" defaultChecked className="toggle-checkbox" />
               </div>
               <DarkModeToggle />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Save Transcripts</span>
                  <input type="checkbox" defaultChecked className="toggle-checkbox" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Language</span>
                  <select 
                    className="border rounded p-1 text-sm bg-slate-50"
                    value={chatLanguage}
                    onChange={(e) => setChatLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
               </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
               Save Changes
            </button>
          </div>
        </div>
      )}

      {showHumanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative text-center">
            <button onClick={() => setShowHumanModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
               <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Connect to Human Agent</h2>
            <p className="text-sm text-slate-500 mb-6">You will be transferred to the next available support engineer. Current wait time is approx. 2 minutes.</p>
            <div className="space-y-3">
               <button onClick={() => { setShowHumanModal(false); setMessages(prev => [...prev, {role: 'system', text: 'Transferring to human agent... Please hold.'}]); }} className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
                  Confirm Transfer
               </button>
               <button onClick={() => setShowHumanModal(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
