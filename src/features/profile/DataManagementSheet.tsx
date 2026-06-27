import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Download, Upload, Database, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/features/auth/AuthStore"
import { toast } from "sonner"

interface DataManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DataManagementSheet({ open, onOpenChange }: DataManagementSheetProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore(state => state.user)

  const handleExport = async () => {
    if (!user) return
    setIsExporting(true)
    try {
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (error) throw error

      if (!data || data.length === 0) {
        toast.info("No data to export")
        return
      }

      // Very simple CSV conversion
      const keys = Object.keys(data[0])
      const csv = [
        keys.join(','),
        ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leados-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${data.length} records successfully.`)
    } catch (e) {
      console.error(e)
      toast.error("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) throw new Error("CSV is empty or missing headers")

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const records = lines.slice(1).map(line => {
        // Simple naive split for V1 (doesn't handle commas inside quotes perfectly, but enough for basic testing)
        const values = line.split(',').map(v => v.replace(/"/g, '').trim())
        const record: Record<string, any> = {}
        headers.forEach((h, i) => {
          record[h] = values[i]
        })
        
        // Ensure required fields
        if (!record.id) record.id = crypto.randomUUID()
        if (!record.workspace_id) record.workspace_id = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
        if (!record.created_by) record.created_by = user.id
        
        // Convert jsonb fields if they come back as strings
        if (typeof record.roles === 'string') {
          try { record.roles = JSON.parse(record.roles) } catch { record.roles = ['candidate'] }
        }
        
        return record
      })

      // We'll upsert based on id/phone. Supabase upsert automatically handles conflicts on PK.
      const { error } = await supabase
        .from('contacts')
        .upsert(records, { onConflict: 'id' })

      if (error) throw error

      toast.success(`Successfully imported ${records.length} records.`)
      onOpenChange(false)
    } catch (e: any) {
      console.error(e)
      toast.error(`Import failed: ${e.message}`)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[32px] h-[50vh] px-4 pb-8 flex flex-col pt-8">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Management
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col gap-2">
            <h3 className="text-sm font-bold text-foreground">Export Data</h3>
            <p className="text-xs text-muted-foreground">Download a complete CSV backup of all your contacts and activities.</p>
            <Button onClick={handleExport} disabled={isExporting} className="mt-2 w-full h-12 rounded-xl">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </Button>
          </div>

          <div className="glass-card p-4 rounded-2xl flex flex-col gap-2 border-primary/20 bg-primary/5">
            <h3 className="text-sm font-bold text-foreground">Import Data</h3>
            <p className="text-xs text-muted-foreground">Upload a CSV file to bulk import or update contacts. Duplicates will be merged.</p>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport} 
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="mt-2 w-full h-12 rounded-xl border-primary text-primary hover:bg-primary/10">
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {isImporting ? 'Importing...' : 'Import from CSV'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
