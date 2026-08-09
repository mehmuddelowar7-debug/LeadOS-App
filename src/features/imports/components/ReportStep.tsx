import { Download, CheckCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore } from '../store/importStore'
import Papa from 'papaparse'

export function ReportStep() {
  const { importedCount, skippedCount, failedCount, failedRows, reset } = useImportStore()

  const handleDownloadFailures = () => {
    if (failedRows.length === 0) return

    const csv = Papa.unparse(failedRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `import_failures_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto w-full">
      <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10" />
      </div>
      
      <h2 className="text-3xl font-bold mb-2">Import Complete</h2>
      <p className="text-muted-foreground mb-12 text-center max-w-md">
        Your historical data has been processed. All successful records have been securely stored in the database.
      </p>

      <div className="grid grid-cols-3 gap-6 w-full mb-12">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
          <span className="text-4xl font-black text-emerald-500">{importedCount}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Imported</span>
          <p className="text-[10px] text-center text-muted-foreground mt-2 leading-tight">
            Successfully created with full history.
          </p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
          <span className="text-4xl font-black text-blue-500">{skippedCount}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Skipped</span>
          <p className="text-[10px] text-center text-muted-foreground mt-2 leading-tight">
            Duplicates detected by exact phone match.
          </p>
        </div>
        
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
          {failedCount > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}
          <span className="text-4xl font-black text-red-500">{failedCount}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Failed</span>
          <p className="text-[10px] text-center text-muted-foreground mt-2 leading-tight">
            Errors during transaction insert.
          </p>
        </div>
      </div>

      {failedCount > 0 && (
        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-red-600 dark:text-red-400">Export Failures</h4>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 max-w-[300px]">
              Download a CSV of the {failedCount} rows that failed to import, including the exact error message.
            </p>
          </div>
          <Button variant="destructive" className="rounded-xl px-6" onClick={handleDownloadFailures}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" className="rounded-xl px-8" onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Import Another File
        </Button>
      </div>
    </div>
  )
}
