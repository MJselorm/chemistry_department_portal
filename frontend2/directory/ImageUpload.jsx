import React, { useRef, useState } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { directoryApi } from './directoryApi'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export default function ImageUpload({ value, onChange, label = 'Image', helpText = 'JPEG, PNG, or WebP up to 5MB' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.')
      return
    }

    if (file.size > MAX_BYTES) {
      setError('File size must not exceed 5MB.')
      return
    }

    setUploading(true)
    try {
      const res = await directoryApi.uploadImage(file)
      if (res?.url) {
        onChange(res.url)
      } else {
        throw new Error('No URL returned from upload server')
      }
    } catch (err) {
      setError(err?.message || 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-foreground">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1"
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>

      {value ? (
        /* Preview container */
        <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-[#f9fbfb]">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface border border-border flex-shrink-0 shadow-xs">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'grid'
              }}
            />
            <div className="hidden w-full h-full place-items-center bg-gray-100 text-gray-400">
              <ImageIcon size={20} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Current file linked</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-xs">{value}</p>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={12} className="animate-spin text-primary" />
                Uploading…
              </>
            ) : (
              <>
                <RefreshCw size={12} className="text-primary" />
                Replace
              </>
            )}
          </button>
        </div>
      ) : (
        /* Empty / Upload Dropzone */
        <button
          type="button"
          disabled={uploading}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-primary bg-[var(--primary-soft)]'
              : 'border-[#dce6e8] bg-[#f9fbfb] hover:bg-[#f2f7f8] hover:border-[#b8d7db]'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-2">
              <Loader2 size={24} className="animate-spin text-primary mb-2" />
              <strong className="text-xs text-foreground">Uploading to Supabase…</strong>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-primary shadow-xs">
                <UploadCloud size={20} />
              </div>
              <div>
                <strong className="text-xs font-bold text-foreground block">
                  Click to upload <span className="font-normal text-muted-foreground">or drag and drop</span>
                </strong>
                <small className="text-[10px] text-muted-foreground mt-0.5 block">{helpText}</small>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-[var(--destructive-soft)] p-2 rounded-lg border border-[var(--destructive-border)]">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        aria-label={label}
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
