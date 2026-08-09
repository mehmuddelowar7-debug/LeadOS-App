import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function parseFile(file: File): Promise<{ headers: string[]; data: any[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            data: results.data
          })
        },
        error: (error) => reject(error)
      })
    })
  } 
  
  if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null })
          
          if (json.length === 0) {
            return resolve({ headers: [], data: [] })
          }
          
          const headers = Object.keys(json[0] as object)
          resolve({ headers, data: json })
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }
  
  throw new Error('Unsupported file type. Please upload a CSV or Excel file.')
}
