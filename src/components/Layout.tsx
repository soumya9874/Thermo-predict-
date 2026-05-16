import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { useState } from "react"
import { ChevronRight } from "lucide-react"

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false)
  }

  return (
    <div className="flex bg-slate-50 min-h-screen relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b z-20 flex items-center justify-between p-4 h-16">
        <div>
           <h1 className="text-xl font-bold tracking-tight">ThermaPredict</h1>
        </div>
      </div>

      {/* Floating small arrow to open sidebar on mobile when closed */}
      {!mobileSidebarOpen && (
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-l-0 p-2 rounded-r-lg shadow-md text-slate-500 hover:text-slate-800 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar - desktop and mobile */}
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform transform ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <Sidebar onClose={handleCloseSidebar} />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden transition-opacity" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full md:w-[calc(100%-16rem)] md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto overflow-x-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
