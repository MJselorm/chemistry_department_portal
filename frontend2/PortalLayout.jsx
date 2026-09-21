import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function PortalLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f6f9fa] flex flex-col lg:flex-row font-sans text-[#102a2f]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main viewport */}
      <div className="flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">
        <Topbar
          title={title}
          subtitle={subtitle}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
