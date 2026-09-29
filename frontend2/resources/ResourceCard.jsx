import React, { useState } from 'react'
import {
  FileText,
  Eye,
  Download,
  Folder,
  Calendar,
  Layers,
  Edit2,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { formatFileSize, getFileFormatInfo, formatResourceDate, formatFolderPath } from './resourceUtils'

export default function ResourceCard({
  resource,
  onView,
  onDownload,
  onEdit,
  onToggleActive,
  isAdmin = false,
}) {
  const [viewing, setViewing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toggling, setToggling] = useState(false)

  const formatInfo = getFileFormatInfo(resource.mime_type, resource.name)
  const folderDisplay = formatFolderPath(resource.folder_path)
  const formattedDate = formatResourceDate(resource.updated_at || resource.last_modified_drive)
  const formattedSize = formatFileSize(resource.file_size)

  const handleView = async (e) => {
    e.stopPropagation()
    if (viewing) return
    setViewing(true)
    try {
      await onView(resource)
    } finally {
      setViewing(false)
    }
  }

  const handleDownload = async (e) => {
    e.stopPropagation()
    if (downloading) return
    setDownloading(true)
    try {
      await onDownload(resource)
    } finally {
      setDownloading(false)
    }
  }

  const handleToggleActive = async (e) => {
    e.stopPropagation()
    if (toggling || !onToggleActive) return
    setToggling(true)
    try {
      await onToggleActive(resource)
    } finally {
      setToggling(false)
    }
  }

  return (
    <article
      className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-card hover:border-[#bce4e8] relative group ${
        !resource.is_active ? 'opacity-70 bg-gray-50/80 border-dashed border-gray-300' : 'border-[#e4ecee]'
      }`}
    >
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* File Format Badge */}
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${formatInfo.color}`}
            >
              {formatInfo.ext}
            </span>

            {/* Resource Type */}
            {resource.resource_type && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#e8f6f7] text-[#087f8c] border border-[#bce4e8]">
                {resource.resource_type}
              </span>
            )}

            {/* Level Badge */}
            {resource.level && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                Level {resource.level}
              </span>
            )}
          </div>

          {/* Admin Status / Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={toggling}
                title={resource.is_active ? 'Active resource (Click to deactivate)' : 'Inactive resource (Click to activate)'}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors ${
                  resource.is_active
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {toggling ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : resource.is_active ? (
                  <CheckCircle size={10} />
                ) : (
                  <XCircle size={10} />
                )}
                <span>{resource.is_active ? 'Active' : 'Inactive'}</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(resource)
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-[#087f8c] hover:bg-[#e8f6f7] transition-colors"
                  title="Edit resource metadata"
                >
                  <Edit2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-bold text-[#102a2f] group-hover:text-[#087f8c] transition-colors line-clamp-2 leading-snug mb-1.5"
          title={resource.name}
        >
          {resource.name}
        </h3>

        {/* Course Info */}
        {(resource.course_code || resource.course_name) && (
          <div className="flex items-center gap-1.5 text-xs text-[#64777d] font-semibold mb-2">
            {resource.course_code && (
              <span className="font-bold text-[#087f8c]">{resource.course_code}</span>
            )}
            {resource.course_code && resource.course_name && <span>•</span>}
            {resource.course_name && (
              <span className="truncate max-w-[200px]" title={resource.course_name}>
                {resource.course_name}
              </span>
            )}
          </div>
        )}

        {/* Description if present */}
        {resource.description && (
          <p className="text-[11px] text-[#788a8f] line-clamp-2 leading-relaxed mb-3">
            {resource.description}
          </p>
        )}

        {/* Folder Breadcrumb */}
        {folderDisplay && (
          <div
            className="flex items-center gap-1.5 text-[10px] text-[#86999e] font-medium bg-[#f6f9fa] px-2.5 py-1 rounded-lg mb-3 truncate"
            title={resource.folder_path}
          >
            <Folder size={11} className="flex-shrink-0 text-[#087f8c]" />
            <span className="truncate">{folderDisplay}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div className="mt-3 pt-3 border-t border-[#f0f4f5]">
        <div className="flex items-center justify-between text-[11px] text-[#8e9fa3] mb-3">
          <span>{formattedSize}</span>
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {formattedDate}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* View Button */}
          <button
            type="button"
            onClick={handleView}
            disabled={viewing}
            className="w-full py-2 px-3 rounded-xl bg-[#e8f6f7] text-[#087f8c] text-xs font-bold hover:bg-[#d6eff1] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
          >
            {viewing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Eye size={13} />
            )}
            <span>{viewing ? 'Opening…' : 'View'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !resource.download_available}
            title={!resource.download_available ? 'Download disabled for this item' : 'Download file'}
            className="w-full py-2 px-3 rounded-xl bg-[#102a2f] text-white text-xs font-bold hover:bg-[#1a3d44] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {downloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span>{downloading ? 'Downloading…' : 'Download'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
