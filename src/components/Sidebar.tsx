import { LayoutDashboard, TabletSmartphone, AlertTriangle, LifeBuoy, ChevronLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../lib/utils"

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Devices', icon: TabletSmartphone, href: '/devices' },
  { name: 'Errors', icon: AlertTriangle, href: '/errors' },
  { name: 'Support', icon: LifeBuoy, href: '/support' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation()

  return (
    <div className="w-64 border-r bg-white h-full flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <div>
           <h1 className="text-xl font-bold tracking-tight">ThermaPredict</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise ML Monitor</p>
        </div>
        <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
           <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 rounded-r-none" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
          <div className="w-full h-full bg-blue-900 flex items-center justify-center text-white text-xs font-medium">JD</div>
        </div>
        <div>
          <p className="text-sm font-semibold">John Doe</p>
          <p className="text-xs text-slate-400">Facility Admin</p>
        </div>
      </div>
    </div>
  )
}
