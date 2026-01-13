'use client'

import { useState } from 'react'
import Image from 'next/image'

interface BrandLogoProps {
  logoUrl?: string | null
  alt?: string
  className?: string
  fallback?: string
}

export function BrandLogo({ logoUrl, alt = 'Brand Logo', className = '', fallback = '/logo.svg' }: BrandLogoProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  if (!logoUrl || error) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}
      <Image
        src={logoUrl}
        alt={alt}
        fill
        className="object-contain"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        unoptimized // For external URLs (GCS)
      />
    </div>
  )
}

// Simple version for non-Next Image use cases
export function BrandLogoSimple({ logoUrl, alt = 'Brand Logo', className = '', fallback = '/logo.svg' }: BrandLogoProps) {
  const [error, setError] = useState(false)

  if (!logoUrl || error) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}
