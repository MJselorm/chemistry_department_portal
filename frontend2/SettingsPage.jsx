import React, { useState } from 'react'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [eventReminders, setEventReminders] = useState(true)
  const [publicDirectory, setPublicDirectory] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  const handleChange = (setter, val) => {
    setter(val)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Head */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">PREFERENCES</span>
        <h1 className="text-2xl font-bold text-[#102a2f] mt-1">Settings</h1>
        <p className="text-xs text-[#64777d] mt-1">Configure your portal experience and notifications.</p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-[#e7f5ed] border border-[#a6dec1] text-[#27805a] text-xs font-semibold">
          Preferences updated (Placeholder API: PATCH /users/settings)
        </div>
      )}

      {/* Settings Panel */}
      <section className="bg-white border border-[#e4ecee] rounded-2xl divide-y divide-[#e4ecee] shadow-sm overflow-hidden">
        {/* Email notifications */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-[#fbfcfc] cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-[#102a2f]">Email notifications</strong>
            <small className="block text-[11px] text-[#64777d] mt-0.5">
              Receive event announcements and departmental updates directly in your inbox.
            </small>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => handleChange(setEmailNotifications, e.target.checked)}
            className="w-4 h-4 rounded text-[#087f8c] focus:ring-[#087f8c] border-gray-300"
          />
        </label>

        {/* Event reminders */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-[#fbfcfc] cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-[#102a2f]">Event reminders</strong>
            <small className="block text-[11px] text-[#64777d] mt-0.5">
              Get reminders 24 hours before registered seminars and workshops.
            </small>
          </div>
          <input
            type="checkbox"
            checked={eventReminders}
            onChange={(e) => handleChange(setEventReminders, e.target.checked)}
            className="w-4 h-4 rounded text-[#087f8c] focus:ring-[#087f8c] border-gray-300"
          />
        </label>

        {/* Public directory profile */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-[#fbfcfc] cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-[#102a2f]">Public directory profile</strong>
            <small className="block text-[11px] text-[#64777d] mt-0.5">
              Allow your basic student name and class level to appear in the department student directory.
            </small>
          </div>
          <input
            type="checkbox"
            checked={publicDirectory}
            onChange={(e) => handleChange(setPublicDirectory, e.target.checked)}
            className="w-4 h-4 rounded text-[#087f8c] focus:ring-[#087f8c] border-gray-300"
          />
        </label>
      </section>
    </div>
  )
}
