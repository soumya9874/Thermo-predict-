import { useState } from "react"
import { Download, Wind, Wrench, AlertTriangle, Info, MapPin, X } from "lucide-react"

export default function Errors() {
  const [modalContent, setModalContent] = useState<{title: string, desc: string} | null>(null)
  const [severityFilter, setSeverityFilter] = useState('All')
  const [timeFilter, setTimeFilter] = useState('24h')
  
  const handleDownload = () => {
    const errorLogs = "ERR_THERMAL_EXC_09\nERR_VIBE_WARN_42\nERR_CAL_DRIFT_02";
    const predictionHistory = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    
    let exportData = "=== Error Logs ===\n" + errorLogs + "\n\n";
    if (predictionHistory.length > 0) {
      exportData += "=== System Generated Results ===\n";
      exportData += JSON.stringify(predictionHistory, null, 2);
    }

    const link = document.createElement("a");
    link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(exportData);
    link.download = "system_export.txt";
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {modalContent && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 relative">
             <button 
               onClick={() => setModalContent(null)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
             >
               <X size={20} />
             </button>
             <h3 className="text-xl font-bold mb-2">{modalContent.title}</h3>
             <p className="text-slate-600">{modalContent.desc}</p>
             <div className="mt-8 flex justify-end">
               <button 
                 onClick={() => setModalContent(null)}
                 className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
               >
                 Close
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center pb-2">
        <h2 className="text-2xl font-bold tracking-tight">System Health & Error Impact</h2>
        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
      </div>

      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-4 bg-white p-1 rounded-lg border shadow-sm">
            <span className="px-3 text-sm text-slate-500 font-medium">Filter Severity:</span>
            <button onClick={() => setSeverityFilter('All')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${severityFilter === 'All' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
            <button onClick={() => setSeverityFilter('Critical')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${severityFilter === 'Critical' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}>Critical</button>
            <button onClick={() => setSeverityFilter('Warning')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${severityFilter === 'Warning' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>Warning</button>
            <button onClick={() => setSeverityFilter('Info')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${severityFilter === 'Info' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Info</button>
         </div>
         <div className="flex items-center gap-3">
             <div className="relative">
               <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               <select 
                 className="pl-9 pr-8 py-2 border rounded-lg bg-white shadow-sm text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={timeFilter}
                 onChange={(e) => setTimeFilter(e.target.value)}
               >
                 <option value="24h">Last 24 Hours</option>
                 <option value="48h">Last 48 Hours</option>
                 <option value="7d">Last 7 Days</option>
               </select>
               <svg className="w-4 h-4 absolute right-3 top-2.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </div>
            <button onClick={handleDownload} className="p-2 border rounded-lg bg-white shadow-sm">
               <Download className="w-5 h-5 text-slate-600" />
            </button>
         </div>
      </div>

      {/* Critical Error Card */}
      {(severityFilter === 'All' || severityFilter === 'Critical') && (
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                 <AlertTriangle size={20} />
              </div>
              <div>
                 <h3 className="text-lg font-bold">ERR_THERMAL_EXC_09</h3>
                 <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <MapPin size={14} /> Industrial Chiller Unit-B4
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-8">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">TIMESTAMP</p>
                 <p className="text-sm font-medium">Oct 24, 2023 | 14:42:09</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">PREDICTED IMPACT</p>
                 <div className="flex flex-col gap-1">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="w-full h-full bg-rose-600 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-rose-600">CRITICAL</span>
                 </div>
              </div>
              <button 
                onClick={() => setModalContent({
                  title: 'ERR_THERMAL_EXC_09 Resolution', 
                  desc: 'Immediate actions: Initiate Emergency Coolant. Ongoing: Dispatch on-site tech for compressor inspection. Estimated impact resolution in 45m.'
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                 View Resolution <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
           </div>
        </div>

        <div className="p-6 bg-slate-50/50 grid grid-cols-3 gap-8">
           {/* Sensor Trigger */}
           <div>
              <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 
                Sensor Trigger
              </h4>
              <div className="bg-white p-4 rounded-xl border border-blue-100/50 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <AlertTriangle size={60} />
                 </div>
                 <div className="relative z-10">
                   <p className="text-sm font-medium text-slate-600 mb-1">Core Temp Spike: <span className="text-rose-600 font-bold">114.5°C</span></p>
                   <p className="text-sm text-slate-500 pb-4 border-b border-slate-100">Threshold: 85.0°C</p>
                   <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-medium text-slate-500">ML Confidence Score</span>
                      <span className="text-sm font-bold text-emerald-500">99.4%</span>
                   </div>
                 </div>
              </div>
           </div>

           {/* Impact Timeline */}
           <div>
              <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                Impact Timeline
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                 <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-amber-600 ring-4 ring-amber-50"></div>
                    <p className="text-sm"><span className="font-semibold">+15m:</span> Efficiency drop 20%</p>
                 </div>
                 <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-50"></div>
                    <p className="text-sm"><span className="font-semibold">+2h:</span> Compressive bearing failure</p>
                 </div>
                 <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-rose-600 ring-4 ring-rose-50"></div>
                    <p className="text-sm font-semibold text-rose-600"><span className="font-bold">+6h:</span> Complete system shutdown</p>
                 </div>
              </div>
           </div>

           {/* Suggested Actions */}
           <div>
              <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 
                Suggested Actions
              </h4>
              <div className="space-y-3">
                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                       <Wind size={16} />
                    </div>
                    <div>
                       <h5 className="text-sm font-bold text-slate-800">Initiate Emergency Coolant</h5>
                       <p className="text-[10px] text-slate-500">Immediate impact reduction</p>
                    </div>
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                       <Wrench size={16} />
                    </div>
                    <div>
                       <h5 className="text-sm font-bold text-slate-800">Dispatch On-site Tech</h5>
                       <p className="text-[10px] text-slate-500">Estimated arrival: 45m</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      )}

      {/* Warning Error Card */}
      {(severityFilter === 'All' || severityFilter === 'Warning') && (
      <div className="bg-white border-2 border-amber-500/20 rounded-xl p-5 flex justify-between items-center mb-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
               <AlertTriangle size={20} />
            </div>
            <div>
               <h3 className="text-base font-bold">ERR_VIBE_WARN_42</h3>
               <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <MapPin size={12} /> Rotary Motor #12
               </div>
            </div>
         </div>
         <div className="flex items-center gap-12">
            <div>
               <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Timestamp</p>
               <p className="text-sm font-medium">Oct 24, 2023 | 13:15:33</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Predicted Impact</p>
               <div className="flex items-center gap-3">
                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="w-2/3 h-full bg-amber-500 rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">MEDIUM</span>
               </div>
            </div>
            <button 
              onClick={() => setModalContent({
                title: 'ERR_VIBE_WARN_42 Details',
                desc: 'Rotary Motor #12 is experiencing unusual vibrations. Recommend bearing inspection within next 24-48 hours.'
              })}
              className="bg-white border hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-4 rounded-lg text-sm transition-colors"
            >
               View Details
            </button>
         </div>
      </div>
      )}

      {/* Info Error Card */}
      {(severityFilter === 'All' || severityFilter === 'Info') && (
      <div className="bg-white border-2 border-emerald-500/20 rounded-xl p-5 flex justify-between items-center mb-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
               <Info size={20} />
            </div>
            <div>
               <h3 className="text-base font-bold">ERR_CAL_DRIFT_02</h3>
               <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <MapPin size={12} /> Precision Sensor A-09
               </div>
            </div>
         </div>
         <div className="flex items-center gap-12">
            <div>
               <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Timestamp</p>
               <p className="text-sm font-medium">Oct 24, 2023 | 11:20:00</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Predicted Impact</p>
               <div className="flex items-center gap-3">
                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="w-1/4 h-full bg-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">LOW</span>
               </div>
            </div>
            <button 
              onClick={() => setModalContent({
                title: 'ERR_CAL_DRIFT_02 Details',
                desc: 'Precision Sensor A-09 calibration drift detected. No immediate action required. Next scheduled maintenance covers this.'
              })}
              className="bg-white border hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-4 rounded-lg text-sm transition-colors"
            >
               View Details
            </button>
         </div>
      </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
         {/* Maintenance Foresight */}
         <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="font-bold text-lg">Maintenance Foresight</h3>
                  <p className="text-sm text-slate-500">Cumulative impact probability over next 7 days</p>
               </div>
               <button className="p-1 text-slate-400 hover:bg-slate-50 rounded">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                     <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
               </button>
            </div>
            
            <div className="h-48 flex items-end justify-between px-2 pb-2">
               {/* Custom Bar Chart to match UI design closely */}
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[40%] rounded-t-sm"></div>
                 <div className="w-full bg-emerald-600 relative z-10 h-[25%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[60%] rounded-t-sm"></div>
                 <div className="w-full bg-[#0ea5e9] relative z-10 h-[35%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[80%] rounded-t-sm"></div>
                 <div className="w-full bg-amber-500 relative z-10 h-[50%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[95%] rounded-t-sm"></div>
                 <div className="w-full bg-rose-500 relative z-10 h-[70%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[50%] rounded-t-sm"></div>
                 <div className="w-full bg-[#fde047] relative z-10 h-[20%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
               <div className="w-1/6 flex flex-col justify-end items-center h-full relative">
                 <div className="w-full bg-[#1e40af]/10 absolute bottom-0 h-[30%] rounded-t-sm"></div>
                 <div className="w-full bg-emerald-700 relative z-10 h-[15%] rounded-t-sm shadow-sm ring-1 ring-black/5"></div>
               </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-4 uppercase">
               <span>Mon</span>
               <span>Tue</span>
               <span>Wed</span>
               <span>Thu</span>
               <span>Fri</span>
               <span>Sat</span>
            </div>
         </div>

         {/* System Uptime Forecast & Asset Risk */}
         <div className="flex flex-col gap-6">
            <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md flex-1">
               <h3 className="text-xl font-bold mb-1">System Uptime Forecast</h3>
               <p className="text-sm font-medium text-blue-100/90 mb-6 w-5/6 leading-snug">
                 Estimated reliability based on active error resolution.
               </p>
               
               <div className="flex items-end justify-between">
                  <h2 className="text-5xl font-bold tracking-tight">94.2%</h2>
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                     <svg className="w-3 h-3 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                     +1.2% this week
                  </span>
               </div>
            </div>

            <div className="bg-white border p-6 rounded-2xl shadow-sm">
               <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">ASSET RISK DISTRIBUTION</p>
               
               <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-semibold">Industrial Ovens</span>
                       <span className="text-xs font-bold text-emerald-600">Healthy</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-600 w-[85%] rounded-full"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-semibold">Chiller Systems</span>
                       <span className="text-xs font-bold text-rose-600">At Risk</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-600 w-[35%] rounded-full"></div>
                    </div>
                 </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
