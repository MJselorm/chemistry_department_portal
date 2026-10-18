import React, { useEffect, useState } from 'react'

export default function SafeImage({ src, fallback, onError, ...props }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) return fallback

  return (
    <img
      src={src}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}
