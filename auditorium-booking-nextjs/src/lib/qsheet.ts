/**
 * Q (cue) sheet upload rules - shared by the upload API and the dashboard upload button
 */

// Vercel rejects request bodies over 4.5 MB, so cap uploads just below that
export const MAX_QSHEET_BYTES = 4 * 1024 * 1024

// Allowed file extensions and the content type each is served with
export const QSHEET_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

// Value for the file input's `accept` attribute
export const QSHEET_ACCEPT = Object.keys(QSHEET_TYPES).map(ext => `.${ext}`).join(',')

// Statuses in which the organizer can upload or replace the Q sheet
export const QSHEET_UPLOAD_STATUSES = ['APPROVED', 'PARTIALLY_APPROVED']

export function getQSheetExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
}

// Returns an error message, or null if the file can be uploaded
export function validateQSheetFile(fileName: string, size: number): string | null {
  if (!QSHEET_TYPES[getQSheetExtension(fileName)]) {
    return 'Only PDF, Word, Excel or image (PNG/JPG) files are allowed'
  }
  if (size === 0) {
    return 'The selected file is empty'
  }
  if (size > MAX_QSHEET_BYTES) {
    return 'File is too large - the maximum size is 4 MB'
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
