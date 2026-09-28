/**
 * CSV helpers for client-side exports
 */

// A formula built by the app itself (never from user input) - written as-is so the spreadsheet runs it
export interface CsvFormula {
  formula: string
}

export type CsvValue = string | number | boolean | null | undefined | CsvFormula

// Spreadsheet apps run cells starting with these characters as formulas
const FORMULA_PREFIX = /^[=+\-@\t\r]/

// Clickable link in Excel / Google Sheets (a plain URL in a CSV isn't clickable in Excel)
export function hyperlink(url: string, label: string): CsvFormula {
  const quote = (text: string) => `"${text.replace(/"/g, '""')}"`
  return { formula: `=HYPERLINK(${quote(url)},${quote(label)})` }
}

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''

  let text: string
  if (typeof value === 'object') {
    text = value.formula
  } else {
    text = String(value)
    if (typeof value === 'string' && FORMULA_PREFIX.test(text)) {
      text = `'${text}`
    }
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
