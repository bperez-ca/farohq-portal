'use client'

import * as React from 'react'
import GLightbox from 'glightbox'
import 'glightbox/dist/css/glightbox.min.css'
import { placePhotoUrl } from '@/lib/place-photo'

export interface LocationPhotoLightboxProps {
  photos: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIndex: number
}

export function LocationPhotoLightbox({
  photos,
  open,
  onOpenChange,
  initialIndex,
}: LocationPhotoLightboxProps) {
  const instanceRef = React.useRef<ReturnType<typeof GLightbox> | null>(null)

  React.useEffect(() => {
    if (!open || photos.length === 0) return

    const startIndex = Math.min(Math.max(0, initialIndex), photos.length - 1)
    const elements = photos.map((photoName) => ({
      href: placePhotoUrl(photoName, 1200),
      type: 'image' as const,
    }))

    const instance = GLightbox({
      elements,
      startAt: startIndex,
      loop: true,
      touchNavigation: true,
      keyboardNavigation: true,
      closeOnOutsideClick: true,
      zoomable: true,
      draggable: true,
    } as Parameters<typeof GLightbox>[0])

    instanceRef.current = instance
    instance.openAt(startIndex)

    const onClose = () => {
      onOpenChange(false)
      instanceRef.current = null
    }
    instance.on('close', onClose)

    return () => {
      instance.destroy()
      instanceRef.current = null
    }
  }, [open, photos, initialIndex, onOpenChange])

  return null
}
