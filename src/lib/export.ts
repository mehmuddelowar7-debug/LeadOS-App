export function jsonToCsv(json: any[]): string {
  if (!json || json.length === 0) return ''
  
  // Extract all unique keys from all objects to ensure comprehensive headers
  const keysSet = new Set<string>()
  json.forEach(row => Object.keys(row).forEach(key => keysSet.add(key)))
  const keys = Array.from(keysSet)
  
  const header = keys.join(',')
  const rows = json.map(row => 
    keys.map(key => {
      let val = row[key]
      if (val === null || val === undefined) return '""'
      
      // Handle nested objects and arrays
      if (typeof val === 'object') {
        val = JSON.stringify(val)
      }
      
      const str = String(val)
      // Escape quotes by doubling them
      return `"${str.replace(/"/g, '""')}"`
    }).join(',')
  )
  
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename: string, csvData: string) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
