import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

/**
 * Normalizes an Indian phone number.
 * Removes +91, 0 prefix, spaces, hyphens, and any non-digit characters.
 */
export function normalizePhone(raw: string | number | undefined | null): string | null {
  if (raw === undefined || raw === null) return null
  
  let str = String(raw).trim()
  
  // Remove all non-digit characters (including spaces, hyphens, hidden unicode)
  str = str.replace(/\D/g, '')
  
  // Remove 91 prefix if length > 10 and starts with 91
  if (str.length > 10 && str.startsWith('91')) {
    str = str.slice(2)
  }
  
  // Remove 0 prefix
  if (str.length > 10 && str.startsWith('0')) {
    str = str.slice(1)
  }
  
  if (str.length === 0) return null
  return str
}

/**
 * Trims a string and converts blanks to null.
 */
export function normalizeString(raw: any): string | null {
  if (raw === undefined || raw === null) return null
  const str = String(raw).trim()
  if (str === '') return null
  return str
}

/**
 * Parses a date string safely into an ISO string.
 * Uses DD/MM/YYYY or DD-MM-YYYY or Excel serial dates.
 */
export function normalizeDate(raw: any): string | null {
  if (!raw) return null
  
  // Excel serial dates
  if (typeof raw === 'number') {
    // Excel date bug: starts from 1900-01-01, off by 1 day
    return dayjs(new Date(Math.round((raw - 25569) * 86400 * 1000))).toISOString()
  }
  
  const str = String(raw).trim()
  
  // Try common formats
  const parsed = dayjs(str, ['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true)
  if (parsed.isValid()) return parsed.toISOString()
  
  // Fallback to strict ISO
  const isoParsed = dayjs(str)
  if (isoParsed.isValid()) return isoParsed.toISOString()
  
  return null
}
