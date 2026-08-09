import { useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useImportStore } from '../store/importStore'
import { parseFile } from '@/lib/importer/parser'

export function UploadStep() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setFile, setRawData, setStep } = useImportStore()

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Invalid file type. Please upload a CSV or Excel file.')
      return
    }

    try {
      const toastId = toast.loading('Parsing file...')
      const { headers, data } = await parseFile(file)
      toast.dismiss(toastId)
      
      if (data.length === 0) {
        toast.error('The file is empty.')
        return
      }

      setFile(file)
      setRawData(data, headers)
      setStep('mapping')
    } catch (err: any) {
      toast.error('Failed to parse file: ' + err.message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto w-full">
      <div 
        className="w-full border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Upload className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">Upload Historical Data</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Drag and drop your historical recruiter CSV or Excel spreadsheet here. We will parse and prepare it for mapping.
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />
        <Button size="lg" className="rounded-xl px-8" onClick={(e) => {
          e.stopPropagation()
          fileInputRef.current?.click()
        }}>
          Browse Files
        </Button>
      </div>

      <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground bg-blue-500/10 text-blue-600 p-4 rounded-xl w-full">
        <FileText className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Supported Formats</p>
          <p>.csv, .xlsx, .xls</p>
          <p className="mt-1 opacity-80">Make sure the first row contains your column headers.</p>
        </div>
      </div>
    </div>
  )
}
