import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  FolderTree,
  PlusCircle,
  RefreshCw,
  MinusCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react'
import { formatResourceDate } from './resourceUtils'

export default function AdminSyncModal({
  isOpen,
  onClose,
  isSyncing,
  syncResult,
  syncError,
  onTriggerSync,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#e4ecee] relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#f0f4f5] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl grid place-items-center ${
                isSyncing
                  ? 'bg-blue-50 text-blue-600'
                  : syncResult?.success
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-purple-50 text-purple-600'
              }`}
            >
              {isSyncing ? (
                <Loader2 size={20} className="animate-spin text-[#087f8c]" />
              ) : (
                <RefreshCw size={20} className="text-[#087f8c]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102a2f]">Google Drive Synchronization</h3>
              <p className="text-xs text-[#71868c] mt-0.5">
                Scan configured Google Drive folders and index metadata into database
              </p>
            </div>
          </div>

          {!isSyncing && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-4">
          {/* Syncing in progress */}
          {isSyncing && (
            <div className="py-8 text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-[#087f8c] mx-auto" />
              <strong className="block text-sm font-bold text-[#102a2f]">
                Synchronizing resources...
              </strong>
              <p className="text-xs text-[#71868c] max-w-xs mx-auto leading-relaxed">
                Traversing Google Drive folders, mapping course levels, and updating resource catalog.
              </p>
            </div>
          )}

          {/* Sync Error */}
          {!isSyncing && syncError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} />
                <span>Synchronization Failed</span>
              </div>
              <p className="text-red-600/90 leading-relaxed">{syncError}</p>
            </div>
          )}

          {/* Sync Results Breakdown */}
          {!isSyncing && syncResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong className="block text-xs font-bold">Sync complete</strong>
                  <span className="text-[11px] text-emerald-700">
                    Google Drive repository was indexed successfully.
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-[#102a2f] block">
                    {syncResult.files_scanned ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    Files Scanned
                  </span>
                </div>

                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-emerald-600 block">
                    {syncResult.new_resources ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    New Resources
                  </span>
                </div>

                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-blue-600 block">
                    {syncResult.updated_resources ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    Updated
                  </span>
                </div>

                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-slate-700 block">
                    {syncResult.unchanged_resources ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    Unchanged
                  </span>
                </div>

                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-amber-600 block">
                    {syncResult.missing_resources ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    Missing
                  </span>
                </div>

                <div className="p-3 bg-[#f6f9fa] rounded-2xl border border-[#e4ecee] text-center">
                  <span className="text-xl font-black text-[#102a2f] block">
                    {syncResult.folders_scanned ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#71868c] uppercase tracking-wider">
                    Folders
                  </span>
                </div>
              </div>

              {syncResult.sync_completed_at && (
                <div className="text-[11px] text-[#71868c] text-center pt-1">
                  Completed at {new Date(syncResult.sync_completed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Initial Prompt State */}
          {!isSyncing && !syncResult && !syncError && (
            <div className="text-xs text-[#5f747a] space-y-2 leading-relaxed bg-[#f6f9fa] p-4 rounded-2xl border border-[#e4ecee]">
              <p>
                Clicking <strong>Start Synchronization</strong> will trigger a background scan of
                the designated Google Drive root folder.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#74898f]">
                <li>Discovers new lecture notes, past questions, and textbooks.</li>
                <li>Updates timestamps and identifies missing or removed files.</li>
                <li>Existing metadata (custom tags, course names) is preserved.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f4f5]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#5e7379] hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {syncResult ? 'Close' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#066570] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSyncing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>{syncResult ? 'Sync Again' : 'Start Synchronization'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
