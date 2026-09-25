/**
 * CSV helpers for client-side exports
 */

export type CsvValue = string | number | boolean | null | undefined

// Spreadsheet apps run cells starting with these characters as formulas
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''

  let text = String(value)
  if (typeof value === 'string' && FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }
  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows]
    .map(row => row.map(escapeCell).join(','))
    .join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel open the file as UTF-8 (keeps ₹ and Hindi text intact)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
