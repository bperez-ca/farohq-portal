/** Build place-photo URL for location images (proxy returns 302 to Google image). */
export function placePhotoUrl(photoName: string, maxPx = 400): string {
  const params = new URLSearchParams({ name: photoName, max_px: String(maxPx) })
  return `/api/v1/smb/place-photo?${params.toString()}`
}
