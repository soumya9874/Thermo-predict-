import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Activity, AlertCircle, ShieldCheck, TrendingUp, Bell, FileText, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('Live')
  const [showReportModal, setShowReportModal] = useState(false)
  
  const [temp, setTemp] = useState(78)
  const [voltage, setVoltage] = useState(220)
  const [healthScore, setHealthScore] = useState(98.2)
  const [confidenceScore, setConfidenceScore] = useState(94.8)
  const [chartData, setChartData] = useState(() => {
    const now = new Date();
    return Array.from({length: 15}).map((_, i) => {
        const t = new Date(now.getTime() - (14 - i) * 2000);
        return {
            time: `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`,
            zoneA: 40 + Math.random() * 15,
            zoneB: 30 + Math.random() * 10
        }
    })
  })

  useEffect(() => {
    if (timeRange !== 'Live') return;
      
    const interval = setInterval(() => {
      setTemp(prev => {
        const val = prev + (Math.random() * 4 - 2);
        return Math.min(Math.max(val, 65), 90);
      });
      setVoltage(prev => {
        const val = prev + (Math.random() * 8 - 4);
        return Math.min(Math.max(val, 210), 230);
      });
      setHealthScore(prev => {
        const val = prev + (Math.random() * 0.4 - 0.2);
        return Math.min(Math.max(val, 92), 99.9);
      });
      setConfidenceScore(prev => {
        const val = prev + (Math.random() * 0.6 - 0.3);
        return Math.min(Math.max(val, 90), 98);
      });

      setChartData(prev => {
         const now = new Date();
         const isSpike = Math.random() > 0.85;
         const newPoint = {
             time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
             zoneA: 40 + Math.random() * 15 + (isSpike ? 20 : 0), 
             zoneB: 30 + Math.random() * 10 + (isSpike ? 10 : 0)
         };
         return [...prev.slice(1), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input type="text" placeholder="Search devices..." className="pl-10 pr-4 py-2 border rounded-full w-full md:w-80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-1 bg-white p-1 rounded-lg border shadow-sm">
            <button 
              onClick={() => setTimeRange('Live')}
              className={`px-3 md:px-4 py-1 text-sm font-medium rounded-md ${timeRange === 'Live' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Live
            </button>
            <button 
              onClick={() => setTimeRange('24h')}
              className={`px-3 md:px-4 py-1 text-sm font-medium rounded-md ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              24h
            </button>
            <button 
              onClick={() => setTimeRange('7d')}
              className={`px-3 md:px-4 py-1 text-sm font-medium rounded-md ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              7d
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReportModal(true)} className="p-2 border rounded-full bg-white text-slate-500 hover:text-slate-700 shadow-sm relative">
               <FileText className="w-5 h-5" />
            </button>
            <button onClick={() => console.log("Notifications: 2 Critical Alerts")} className="p-2 border rounded-full bg-white text-slate-500 hover:text-slate-700 shadow-sm relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL DEVICES', val: '1,284', change: timeRange === 'Live' ? '+2 connected' : timeRange === '24h' ? '+12 today' : '+45 this week', trend: 'up', icon: Activity, color: 'text-blue-600', iconBg: 'bg-blue-50' },
          { label: 'ACTIVE ALERTS', val: timeRange === 'Live' ? '02' : timeRange === '24h' ? '03' : '12', change: timeRange === 'Live' ? '1 Critical' : timeRange === '24h' ? '2 Critical' : '5 Critical', trend: 'down', icon: AlertCircle, color: 'text-rose-600', iconBg: 'bg-rose-50' },
          { label: 'HEALTH SCORE', val: timeRange === 'Live' ? `${healthScore.toFixed(1)}%` : timeRange === '24h' ? '98.2%' : '97.5%', change: 'Optimal', trend: 'up', icon: ShieldCheck, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
          { label: 'FAILURE PREDICTIONS', val: timeRange === 'Live' ? '3' : timeRange === '24h' ? '14' : '28', change: 'Flagged', trend: 'neutral', icon: TrendingUp, color: 'text-amber-600', iconBg: 'bg-amber-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{card.label}</p>
              <div className={`p-1.5 rounded-md ${card.iconBg}`}>
                 <card.icon className={card.color} size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold">{card.val}</h2>
              <div className="flex items-center gap-2 mt-2">
                {card.trend === 'up' && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                <p className={`text-xs font-medium ${card.label === 'ACTIVE ALERTS' ? 'text-rose-600' : 'text-slate-500'}`}>
                  {card.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg">Temperature Fluctuations</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time monitoring across multi-zone units</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Zone A</span>
              <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Zone B</span>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeRange === 'Live' ? chartData : [
                  { time: '00:00', zoneA: 40, zoneB: 30 },
                  { time: '04:00', zoneA: 45, zoneB: 32 },
                  { time: '08:00', zoneA: 55, zoneB: 35 },
                  { time: '12:00', zoneA: 85, zoneB: 45 },
                  { time: '16:00', zoneA: 50, zoneB: 38 },
                  { time: '20:00', zoneA: 42, zoneB: 33 },
                  { time: '23:59', zoneA: 40, zoneB: 30 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                   labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
                   isAnimationActive={false}
                />
                {/* @ts-expect-error Recharts typings issue with SVG props */}
                {timeRange !== 'Live' && <ReferenceArea x1="08:00" x2="16:00" fill="#fee2e2" fillOpacity={0.4} />}
                {timeRange !== 'Live' && <text x="50%" y="100%" dy="-20" textAnchor="middle" className="recharts-reference-area-label z-10 relative">ANOMALY ZONE</text>}
                <Line isAnimationActive={false} type="monotone" dataKey="zoneA" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="zoneB" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
             <h3 className="font-semibold mb-6 flex justify-between items-center">
               Live Sensor Gauges
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
             </h3>
             <div className="flex justify-around">
                <div className="text-center">
                  <div className="relative w-24 h-24  mb-3">
                     <svg className="w-full h-full transform -rotate-90 transition-all duration-500 ease-out" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                        <circle cx="50" cy="50" r="40" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * temp / 100)} strokeLinecap="round" />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{temp.toFixed(0)}°</span>
                     </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">TEMP (C)</p>
                </div>
                <div className="text-center">
                  <div className="relative w-24 h-24 mb-3">
                    <svg className="w-full h-full transform -rotate-90 transition-all duration-500 ease-out" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                        <circle cx="50" cy="50" r="40" stroke="#64748b" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (voltage - 200) / 40)} strokeLinecap="round" />
                     </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{voltage.toFixed(0)}V</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">VOLTAGE</p>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-md flex-1 flex flex-col justify-center relative overflow-hidden transition-all duration-500">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={100} />
             </div>
             <div className="relative z-10">
               <p className="text-[10px] font-bold opacity-80 tracking-widest uppercase mb-1">ML Prediction Confidence</p>
               <h2 className="text-5xl font-bold tracking-tight mb-6">{confidenceScore.toFixed(1)}%</h2>
               
               <div>
                 <div className="flex justify-between text-[10px] mb-2 font-bold opacity-90 uppercase tracking-widest">
                    <span>Reliability</span>
                    <span>{confidenceScore > 95 ? 'Optimal' : 'Stable'}</span>
                 </div>
                 <div className="w-full bg-blue-900/40 h-2 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full relative transition-all duration-500 ease-out" style={{ width: `${confidenceScore}%`}}>
                        <div className="absolute inset-0 bg-white/50 blur-[2px]"></div>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Detailed Report ({timeRange})</h2>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wider uppercase">Active Alerts</h3>
                    <p className="text-2xl font-bold text-slate-800">{timeRange === '24h' ? '03' : timeRange === '7d' ? '12' : '42'} Total</p>
                    <p className="text-sm text-rose-600 font-medium mt-2">{timeRange === '24h' ? '2' : timeRange === '7d' ? '5' : '18'} require immediate action</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wider uppercase">Health Score</h3>
                    <p className="text-2xl font-bold text-slate-800">{timeRange === '24h' ? '98.2%' : timeRange === '7d' ? '97.5%' : '96.8%'}</p>
                    <p className="text-sm text-emerald-600 font-medium mt-2">Within expected parameters</p>
                 </div>
               </div>
               <div>
                  <h3 className="font-bold text-lg mb-3">Failure Predictions</h3>
                  <ul className="space-y-3">
                    <li className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                       <div>
                          <p className="font-bold text-slate-800">Chiller Unit #42</p>
                          <p className="text-xs text-slate-500">Thermal Drift Detected</p>
                       </div>
                       <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded">High Risk</span>
                    </li>
                    <li className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                       <div>
                          <p className="font-bold text-slate-800">Rotary Motor #12</p>
                          <p className="text-xs text-slate-500">Vibration Anomaly</p>
                       </div>
                       <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Medium Risk</span>
                    </li>
                    <li className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                       <div>
                          <p className="font-bold text-slate-800">HVAC System B</p>
                          <p className="text-xs text-slate-500">Filter Replacement Due</p>
                       </div>
                       <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Low Risk</span>
                    </li>
                  </ul>
               </div>
               <div>
                 <h3 className="font-bold text-lg mb-3">Summary</h3>
                 <p className="text-sm text-slate-600 leading-relaxed">
                   Over the selected time range ({timeRange}), the overall device health has remained stable.
                   However, anomaly detections in temperature zones suggest that preventive maintenance should be prioritized for highly utilized units.
                 </p>
               </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
              <button className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-slate-100 font-medium text-slate-700 transition">Export CSV</button>
              <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
