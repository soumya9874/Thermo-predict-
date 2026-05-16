import { Search, Filter, Bell, MapPin, Settings2, Upload, Activity, CheckCircle2, AlertTriangle, Database, Info, Thermometer, Zap, X } from "lucide-react"
import React, { useState, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import DarkModeToggle from "../components/DarkModeToggle"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../lib/firebase"

interface AnalysisResult {
    targetName: string;
    riskStatus: string;
    confidence: string;
    risk: string;
    warnings: string[];
    solutions: string[];
    healthAlerts: string[];
    temperature: string;
    efficiency: string;
    fluctuations: string;
}

const initialDevices = [
  { id: '1', name: 'Baking Oven 04', type: 'Oven', location: 'Zone B • Line 12', statLabel1: 'TEMPERATURE', statVal1: '182°c', statLabel2: 'NEXT MAINT.', statVal2: 'Oct 24, 2023', status: 'HEALTHY', color: 'emerald' },
  { id: '2', name: 'Main Chiller 01', type: 'Chiller', location: 'Main Deck • Central Plant', statLabel1: 'TEMP DELTA', statVal1: '+4.2°', statLabel2: 'NEXT MAINT.', statVal2: 'Sep 12, 2023', status: 'WARNING', color: 'amber' },
  { id: '3', name: 'Rotary Motor R2', type: 'Motor', location: 'Assembly • Line 04', statLabel1: 'VIBRATION', statVal1: '8.9g', statLabel2: 'NEXT MAINT.', statVal2: 'OVERDUE', status: 'CRITICAL', color: 'rose' },
  { id: '4', name: 'Curing Oven C1', type: 'Oven', location: 'Finishing • North Wing', statLabel1: 'TEMPERATURE', statVal1: '210°c', statLabel2: 'NEXT MAINT.', statVal2: 'Dec 05, 2023', status: 'HEALTHY', color: 'emerald' },
]

export default function Devices() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState(initialDevices)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Assets")
  const [statusFilter, setStatusFilter] = useState("Any Status")
  const [showNotifications, setShowNotifications] = useState(false)
  const [passwordSent, setPasswordSent] = useState(false)
  
  // Preferences State
  const [preferences, setPreferences] = useState([
    { title: 'Critical Alerts', desc: 'Push notifications for failures', active: true },
    { title: 'Dark Mode', desc: 'High contrast night viewing', active: false },
    { title: 'Auto-Refresh', desc: 'Update telemetry every 5s', active: true },
  ])

  const [activeTab, setActiveTab] = useState<'devices' | 'profile'>('devices')
  const [region, setRegion] = useState("North America")
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const [profileEmail, setProfileEmail] = useState("admin@company.com")
  const [roles, setRoles] = useState({
    systemAdmin: true,
    deviceManager: true,
    viewer: false
  })
  const [is2faEnabled, setIs2faEnabled] = useState(() => localStorage.getItem("2fa_enabled") === "true")

  const toggle2FA = () => {
    const newValue = !is2faEnabled
    setIs2faEnabled(newValue)
    localStorage.setItem("2fa_enabled", newValue.toString())
  }

  const togglePreference = (index: number) => {
    setPreferences(prev => {
      const newPrefs = prev.map((pref, i) => 
        i === index ? { ...pref, active: !pref.active } : pref
      )
      
      if (newPrefs[index].title === 'Dark Mode') {
        if (newPrefs[index].active) {
          document.documentElement.classList.add('dark-mode-simulated')
          // Add basic dark mode style injection for visual feedback
          if(!document.getElementById('dark-mode-styles')) {
            const style = document.createElement('style')
            style.id = 'dark-mode-styles'
            style.innerHTML = `
              .dark-mode-simulated body { filter: invert(0.9) hue-rotate(180deg); background: #f8fafc; }
              .dark-mode-simulated img, .dark-mode-simulated svg { filter: invert(1) hue-rotate(180deg); }
            `
            document.head.appendChild(style)
          }
        } else {
          document.documentElement.classList.remove('dark-mode-simulated')
        }
      }
      return newPrefs
    })
  }

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [predictedResult, setPredictedResult] = useState<AnalysisResult | null>(null)

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) || device.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "All Assets" || device.type === typeFilter
      const matchesStatus = statusFilter === "Any Status" || device.status === statusFilter.toUpperCase()
      return matchesSearch && matchesType && matchesStatus
    })
  }, [devices, searchQuery, typeFilter, statusFilter])

  const handlePasswordReset = async () => {
    if (!profileEmail || !profileEmail.includes('@')) {
       alert("Please enter a valid email address.")
       return
    }
    
    // Check if it's the hardcoded demo account
    if (profileEmail === "demo@company.com" || profileEmail === "admin@company.com") {
       alert("Simulated password reset for demo account. No actual email will be sent to this fictitious address.")
       setPasswordSent(true)
       setTimeout(() => setPasswordSent(false), 10000)
       return
    }

    try {
      await sendPasswordResetEmail(auth, profileEmail)
      alert("If an account exists with this email, a password reset link has been sent.")
      setPasswordSent(true)
      setTimeout(() => setPasswordSent(false), 10000)
    } catch (error: any) {
      console.error("Error sending password reset email:", error)
      alert(`Failed to send password reset email: ${error.message}`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    setIsUploading(true)
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name })
      })
      
      const data: AnalysisResult = await res.json()
      setIsUploading(false)
      setPredictedResult(data)
      setShowResultModal(true)
      
      const historyStr = localStorage.getItem('prediction_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push({ filename: file.name, timestamp: new Date().toISOString(), result: data });
      localStorage.setItem('prediction_history', JSON.stringify(history));
      
      const colorMap: Record<string, string> = {
        CRITICAL: "rose",
        WARNING: "amber",
        HEALTHY: "emerald"
      }
      
      const newDeviceStr = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.targetName,
        type: 'Imported',
        location: `Data File • ${file.name}`,
        statLabel1: 'PREDICTED RISK',
        statVal1: data.riskStatus === "HEALTHY" ? "LOW" : data.riskStatus === "WARNING" ? "MED" : "HIGH",
        statLabel2: 'CONFIDENCE',
        statVal2: data.confidence,
        status: data.riskStatus,
        color: colorMap[data.riskStatus] || "blue"
      }

      setDevices(prev => [newDeviceStr, ...prev])
      
    } catch(err) {
      console.error(err)
      setIsUploading(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Processing Modal Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center border border-slate-100">
             <div className="relative mb-6 text-blue-600">
               <Database className="w-12 h-12" />
               <Activity className="w-6 h-6 absolute -bottom-2 -right-2 bg-white rounded-full text-blue-500 animate-pulse" />
             </div>
             <h3 className="text-xl font-bold mb-2">Analyzing Database...</h3>
             <p className="text-sm text-slate-500 mb-6 text-center">Processing <span className="font-medium text-slate-700">{uploadFile?.name}</span> through ThermaPredict anomaly models.</p>
             <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div className="bg-blue-600 h-full w-2/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
             </div>
             <p className="text-xs text-slate-400 mt-4 font-medium tracking-wide uppercase pulse">Running Tensor Inferences</p>
          </div>
        </div>
      )}

      {/* Result Modal Overlay */}
      {showResultModal && predictedResult && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 transform transition-all max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-8 pb-4 border-b">
               <div className="flex items-center gap-4">
                 <div className={`flex items-center justify-center h-12 w-12 rounded-full ${predictedResult.riskStatus === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : predictedResult.riskStatus === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {predictedResult.riskStatus === 'CRITICAL' ? <AlertTriangle className="h-6 w-6" /> : predictedResult.riskStatus === 'WARNING' ? <Activity className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900">{predictedResult.targetName}</h3>
                    <p className="text-sm text-slate-500">Analysis completed for <span className="font-medium">{uploadFile?.name}</span></p>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Confidence Score</p>
                  <p className="text-2xl font-bold text-blue-600">{predictedResult.confidence}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-3 gap-6 mb-8">
               <div className="bg-slate-50 border rounded-xl p-4 flex flex-col justify-center items-center text-center">
                 <Thermometer className="w-5 h-5 text-rose-500 mb-2" />
                 <p className="text-xs font-semibold text-slate-500 uppercase">Avg Temperature</p>
                 <p className="font-bold text-lg mt-1">{predictedResult.temperature}</p>
               </div>
               <div className="bg-slate-50 border rounded-xl p-4 flex flex-col justify-center items-center text-center">
                 <Zap className="w-5 h-5 text-amber-500 mb-2" />
                 <p className="text-xs font-semibold text-slate-500 uppercase">System Efficiency</p>
                 <p className="font-bold text-lg mt-1">{predictedResult.efficiency}</p>
               </div>
               <div className={`border rounded-xl p-4 flex flex-col justify-center items-center text-center ${predictedResult.riskStatus === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : predictedResult.riskStatus === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                 <Activity className={`w-5 h-5 mb-2 ${predictedResult.riskStatus === 'CRITICAL' ? 'text-rose-500' : predictedResult.riskStatus === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`} />
                 <p className="text-xs font-semibold uppercase opacity-80">Overall Risk</p>
                 <p className={`font-bold text-lg mt-1 ${predictedResult.riskStatus === 'CRITICAL' ? 'text-rose-700' : predictedResult.riskStatus === 'WARNING' ? 'text-amber-700' : 'text-emerald-700'}`}>{predictedResult.riskStatus}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                   <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-amber-500" /> Executive Summary
                   </h4>
                   <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border">
                     {predictedResult.risk}
                   </p>
                   
                   <h4 className="font-semibold text-slate-800 mt-6 mb-3 flex items-center gap-2">
                     <Activity className="w-4 h-4 text-blue-500" /> Detected Fluctuations
                   </h4>
                   <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border">
                     {predictedResult.fluctuations}
                   </p>
                </div>
                
                <div className="space-y-6">
                   <div>
                     <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-rose-600">
                       <AlertTriangle className="w-4 h-4" /> Hard Warnings
                     </h4>
                     <ul className="space-y-2">
                        {predictedResult.warnings.map((w, i) => (
                           <li key={i} className="text-sm bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                             {w}
                           </li>
                        ))}
                     </ul>
                   </div>
                   
                   <div>
                     <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-emerald-600">
                       <CheckCircle2 className="w-4 h-4" /> Recommended Solutions
                     </h4>
                     <ul className="space-y-2">
                        {predictedResult.solutions.map((s, i) => (
                           <li key={i} className="text-sm bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                             {s}
                           </li>
                        ))}
                     </ul>
                   </div>
                   
                   {predictedResult.healthAlerts.length > 0 && (
                     <div>
                       <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-blue-600">
                         <Info className="w-4 h-4" /> System Health Alerts
                       </h4>
                       <ul className="space-y-2">
                          {predictedResult.healthAlerts.map((ha, i) => (
                             <li key={i} className="text-sm bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                               {ha}
                             </li>
                          ))}
                       </ul>
                     </div>
                   )}
                </div>
             </div>
             
             <div className="flex justify-end pt-4 border-t gap-3 mt-auto">
               <button 
                 onClick={() => {
                   if (predictedResult) {
                     const doc = new jsPDF();
                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(18);
                     doc.text("ThermaPredict - Asset Maintenance Report", 20, 20);
                     doc.setFont("helvetica", "normal");
                     doc.setFontSize(14);
                     doc.text(`Asset Name: ${predictedResult.targetName}`, 20, 30);
                     doc.text(`Risk Status: ${predictedResult.riskStatus} (Confidence: ${predictedResult.confidence})`, 20, 40);
                     doc.text(`Avg Temperature: ${predictedResult.temperature}`, 20, 50);
                     doc.text(`System Efficiency: ${predictedResult.efficiency}`, 20, 60);

                     doc.setFontSize(12);
                     doc.setFont("helvetica", "bold");
                     doc.text("Executive Summary:", 20, 75);
                     doc.setFont("helvetica", "normal");
                     doc.setFontSize(10);
                     const splitRisk = doc.splitTextToSize(predictedResult.risk, 170);
                     doc.text(splitRisk, 20, 82);

                     let y = 82 + (splitRisk.length * 5) + 10;
                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(12);
                     doc.text("Detected Fluctuations:", 20, y);
                     doc.setFont("helvetica", "normal");
                     doc.setFontSize(10);
                     y += 7;
                     const splitFluctuations = doc.splitTextToSize(predictedResult.fluctuations, 170);
                     doc.text(splitFluctuations, 20, y);
                     y += (splitFluctuations.length * 5) + 10;

                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(12);
                     doc.text("Hard Warnings:", 20, y);
                     doc.setFont("helvetica", "normal");
                     doc.setFontSize(10);
                     y += 7;
                     predictedResult.warnings.forEach(w => {
                        const splitW = doc.splitTextToSize(`• ${w}`, 170);
                        doc.text(splitW, 20, y);
                        y += (splitW.length * 5) + 2;
                     });
                     y += 8;

                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(12);
                     doc.text("Health Alerts:", 20, y);
                     doc.setFont("helvetica", "normal");
                     doc.setFontSize(10);
                     y += 7;
                     if(predictedResult.healthAlerts.length > 0) {
                        predictedResult.healthAlerts.forEach((ha: string) => {
                          const splitHA = doc.splitTextToSize(`• ${ha}`, 170);
                          doc.text(splitHA, 20, y);
                          y += (splitHA.length * 5) + 2;
                        });
                     } else {
                        doc.text("No alerts at this time.", 20, y);
                     }
                     
                     doc.save(`${predictedResult.targetName.replace(/\s+/g, '_')}_Report.pdf`);
                   }
                 }}
                 className="px-6 py-2.5 rounded-xl border border-blue-200 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2"
               >
                 <Upload className="w-4 h-4 rotate-180" /> Download PDF
               </button>
               <button 
                 onClick={() => setShowResultModal(false)}
                 className="px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
               >
                 Close Report
               </button>
               <button 
                 onClick={() => setShowResultModal(false)}
                 className="px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
               >
                 Acknowledge & Dashboard
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Settings Modal Overlay */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100">
             <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4 mx-auto text-blue-600">
                <Settings2 className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-center mb-2">Account Settings</h3>
             <p className="text-sm text-slate-500 text-center mb-6">Manage your account preferences and security.</p>
             <div className="space-y-3 mb-6">
                <DarkModeToggle />
                <button onClick={() => {setShowSettingsModal(false); setActiveTab('profile');}} className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                  Change Password
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => {setShowSettingsModal(false); setActiveTab('profile');}} className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                  Two-Factor Authentication
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
             </div>
             <button 
               onClick={() => setShowSettingsModal(false)}
               className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
             >
               Done
             </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b pb-4 relative z-10 gap-4 xl:gap-0">
        <div className="flex gap-6 border-b xl:border-b-0 w-full xl:w-auto">
          <button 
            onClick={() => setActiveTab('devices')}
            className={`${activeTab === 'devices' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900'} font-medium border-b-2 pb-4 xl:-mb-[18px] transition-colors`}
          >
            My Devices
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`${activeTab === 'profile' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900'} font-medium border-b-2 pb-4 xl:-mb-[18px] transition-colors`}
          >
            Profile
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full xl:w-auto">
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full flex items-center gap-2 shadow-sm transition-colors"
          >
             <Upload className="w-4 h-4" />
             Insert <span className="hidden sm:inline">Data / DB</span>
          </button>
          <input 
             type="file" 
             className="hidden" 
             ref={fileInputRef} 
             accept=".csv,.pkl,.json,.db,.sqlite" 
             onChange={handleFileUpload} 
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
               type="text" 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-2 border rounded-full w-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 border rounded-full hover:bg-slate-50 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-sm text-slate-800 font-medium">Configuration changes saved</p>
                        <p className="text-xs text-slate-500">2 minutes ago</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-sm text-slate-800 font-medium">Critical: Rotary Motor R2</p>
                        <p className="text-xs text-slate-500">Vibration anomaly detected</p>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'devices' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-3 rounded-xl border shadow-sm gap-4 lg:gap-0">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-2 lg:px-4 py-1 text-slate-500 font-medium">
                <Filter className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Filters</span>
              </div>
              <div className="hidden lg:block h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Type:</span>
                <select 
                   value={typeFilter}
                   onChange={(e) => setTypeFilter(e.target.value)}
                   className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer hover:text-blue-600 max-w-[100px] sm:max-w-none text-ellipsis"
                >
                  <option>All Assets</option>
                  <option>Oven</option>
                  <option>Chiller</option>
                  <option>Motor</option>
                  <option>Imported</option>
                </select>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-slate-500 font-medium">Status:</span>
                <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer hover:text-blue-600"
                >
                  <option>Any Status</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-400 px-2">
              Viewing {filteredDevices.length} of {devices.length} devices
            </div>
          </div>

          {/* Device Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDevices.map((device) => (
              <div key={device.id} className="bg-white p-5 rounded-2xl border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
                 {device.status === 'CRITICAL' && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>}
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-2 rounded-lg bg-${device.color}-50 text-${device.color}-600 group-hover:scale-110 transition-transform`}>
                    {device.type === 'Imported' ? <Database className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                  </div>
                  <div 
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-${device.color}-50 text-${device.color}-700 text-[10px] font-bold tracking-wider`}
                    title={
                      device.status === 'HEALTHY' ? 'Operating within expected parameters.' :
                      device.status === 'WARNING' ? 'Experiencing mild deviations or approaching maintenance.' :
                      device.status === 'CRITICAL' ? 'Requires immediate attention or corrective action.' :
                      'Status unknown'
                    }
                  >
                    <div className={`w-1.5 h-1.5 rounded-full bg-${device.color}-500 ${device.status === 'HEALTHY' ? 'm-0' : 'animate-pulse'}`}></div>
                    {device.status}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-1 truncate" title={device.name}>{device.name}</h3>
                <p className="text-xs text-slate-500 mb-6 truncate" title={device.location}>{device.location}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">{device.statLabel1}</p>
                    <p className={`text-xl font-bold truncate ${device.statVal1.startsWith('+') || device.status === 'CRITICAL' || device.statVal1 === 'HIGH' ? 'text-rose-600' : ''}`}>{device.statVal1}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">{device.statLabel2}</p>
                    <p className={`text-sm font-semibold mt-1.5 truncate ${device.statVal2 === 'OVERDUE' ? 'text-rose-600' : 'text-slate-700'}`}>{device.statVal2}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredDevices.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-white text-slate-500">
                 <Filter className="w-10 h-10 mx-auto mb-4 text-slate-300" />
                 <h3 className="text-lg font-bold text-slate-700">No Devices Found</h3>
                 <p className="text-sm">Adjust your filters or upload new database to see results.</p>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2 bg-[#f8fafc] border rounded-2xl p-6 relative overflow-hidden">
               {/* Background watermark icon */}
               <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                 <Settings2 size={200} />
               </div>

               <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">Device Insight Panel</h2>
                    <p className="text-slate-500 text-sm">Live telemetry for Baking Oven 04</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Internal Temp', val: '182.4', unit: '°C', color: 'bg-emerald-600', width: 'w-3/4' },
                    { label: 'Operating Voltage', val: '478.2', unit: 'V', color: 'bg-blue-600', width: 'w-full' },
                    { label: 'Duty Cycle', val: '84', unit: '%', color: 'bg-blue-600', width: 'w-5/6' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white p-5 rounded-xl border shadow-sm min-w-0">
                      <p className="text-xs font-semibold text-slate-500 mb-2 truncate">{stat.label}</p>
                      <div className="flex items-baseline gap-1 mb-4">
                         <span className={`text-3xl font-bold truncate ${stat.color.replace('bg-', 'text-')}`}>{stat.val}</span>
                         <span className="text-sm font-semibold text-slate-400 shrink-0">{stat.unit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${stat.color} ${stat.width} rounded-full`}></div>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="flex justify-end">
                  <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                     <Activity className="w-4 h-4" /> View Full Analytics
                  </button>
               </div>
            </div>

            <div className="bg-[#f8fafc] border rounded-2xl p-6 col-span-1">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg">Preferences</h3>
               </div>

               <div className="space-y-6">
                  {preferences.map((pref, index) => (
                    <div key={pref.title} className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm mb-0.5">{pref.title}</h4>
                        <p className="text-xs text-slate-500">{pref.desc}</p>
                      </div>
                      <button onClick={() => togglePreference(index)} className={`w-11 h-6 rounded-full transition-colors relative ${pref.active ? 'bg-emerald-500' : 'bg-slate-200'} shrink-0`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${pref.active ? 'translate-x-6' : 'translate-x-1'}`}></div>
                      </button>
                    </div>
                  ))}
               </div>

               <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                  <div className="bg-white border rounded-lg px-3 py-2 flex items-center gap-3">
                     <MapPin className="w-4 h-4 text-slate-400" />
                     <span className="text-sm font-medium text-slate-500 shrink-0">Region:</span>
                     <select 
                       className="w-full text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                       value={region}
                       onChange={(e) => setRegion(e.target.value)}
                     >
                       <option value="North America">North America</option>
                       <option value="Europe">Europe</option>
                       <option value="Asia Pacific">Asia Pacific</option>
                     </select>
                  </div>
                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 font-medium py-2.5 rounded-lg text-sm transition-colors text-slate-700"
                  >
                    Account Settings
                  </button>
               </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
           <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-blue-900 flex items-center justify-center text-white text-3xl font-medium">JD</div>
              <div>
                <h2 className="text-2xl font-bold">John Doe</h2>
                <p className="text-slate-500 font-medium">Facility Admin • {region}</p>
              </div>
           </div>
           
           <div className="max-w-xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Role Permissions</label>
                <div className="space-y-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={roles.systemAdmin} 
                       onChange={() => setRoles({...roles, systemAdmin: !roles.systemAdmin})}
                       className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                     />
                     <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${roles.systemAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>System Admin</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={roles.deviceManager} 
                       onChange={() => setRoles({...roles, deviceManager: !roles.deviceManager})}
                       className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                     />
                     <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${roles.deviceManager ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>Device Manager</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={roles.viewer} 
                       onChange={() => setRoles({...roles, viewer: !roles.viewer})}
                       className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                     />
                     <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${roles.viewer ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>Read-only Viewer</span>
                   </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Change Password</label>
                {!passwordSent ? (
                  <button onClick={handlePasswordReset} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    Change Password
                  </button>
                ) : (
                  <div className="text-sm font-medium text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 inline-flex">
                     <CheckCircle2 className="w-4 h-4" /> Password update link sent to your email!
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Two-Factor Authentication (2FA)</label>
                <div className="flex items-center gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
                   <div className="flex-1">
                     <div className="text-sm font-medium text-slate-900">Secure your account</div>
                     <div className="text-xs text-slate-500 mt-1">Require an extra security code during login.</div>
                   </div>
                   <button 
                     onClick={toggle2FA}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                       is2faEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                     }`}
                   >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                       is2faEnabled ? 'translate-x-6' : 'translate-x-1'
                     }`} />
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
