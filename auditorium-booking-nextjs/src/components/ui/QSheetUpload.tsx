'use client'

import { useRef, useState } from 'react'
import { Box, Button, Typography, Link } from '@mui/material'
import { UploadFile as UploadIcon, Description as FileIcon } from '@mui/icons-material'
import { QSHEET_ACCEPT, validateQSheetFile, formatFileSize } from '@/lib/qsheet'

interface QSheetUploadProps {
  bookingId: string
  qSheet?: {
    fileName: string
    size: number
    uploadedAt: string
  } | null
  canUpload: boolean
  onUploaded: () => void
}

export default function QSheetUpload({ bookingId, qSheet, canUpload, onUploaded }: QSheetUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be picked again after an error
    if (!file) return

    const validationError = validateQSheetFile(file.name, file.size)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`/api/bookings/${bookingId}/qsheet`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        onUploaded()
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Upload failed. Please try again.')
      }
    } catch (uploadError) {
      console.error('Error uploading Q sheet:', uploadError)
      setError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
      {qSheet && (
        <Link
          href={`/api/bookings/${bookingId}/qsheet`}
          underline="hover"
          title={`Download ${qSheet.fileName} (${formatFileSize(qSheet.size)})`}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', maxWidth: 200 }}
        >
          <FileIcon fontSize="small" />
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {qSheet.fileName}
          </Box>
        </Link>
      )}

      {canUpload && (
        <>
          <input ref={inputRef} type="file" accept={QSHEET_ACCEPT} hidden onChange={handleFileSelected} />
          <Button
            size="small"
            variant={qSheet ? 'text' : 'outlined'}
            startIcon={<UploadIcon />}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading...' : qSheet ? 'Replace Q Sheet' : 'Upload Q Sheet'}
          </Button>
          {!qSheet && !error && (
            <Typography variant="caption" color="textSecondary" textAlign="center">
              PDF, Word, Excel or image · max 4 MB
            </Typography>
          )}
        </>
      )}

      {error && (
        <Typography variant="caption" color="error" textAlign="center" sx={{ maxWidth: 220 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
