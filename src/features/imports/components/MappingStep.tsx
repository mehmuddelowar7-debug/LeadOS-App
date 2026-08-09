import { useEffect, useState } from 'react'
import { ArrowRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportStore, ColumnMapping } from '../store/importStore'

const TARGET_FIELDS = [
  { value: 'created_at', label: 'Lead Created Date' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'whatsapp', label: 'WhatsApp Number' },
  { value: 'age', label: 'Age' },
  { value: 'gender', label: 'Gender' },
  { value: 'origin', label: 'Source / Origin' },
  { value: 'current_area', label: 'Current Area' },
  { value: 'custom_fields.home_town', label: 'Hometown' },
  { value: 'opportunity.highest_qualification', label: 'Highest Qualification' },
  { value: 'opportunity.total_experience', label: 'Total Experience (Years)' },
  { value: 'opportunity.status', label: 'Pipeline Stage (Selection)' },
  { value: 'follow_up_date', label: 'Scheduling Date (Follow up)' },
  { value: 'walkin_date', label: 'Walk-in Date' },
  { value: 'custom_fields.pr_done', label: 'PR Done' },
  { value: 'custom_fields.agent_name', label: 'Agent Name' },
  { value: 'custom_fields.commission', label: 'Commission' },
]

export function MappingStep() {
  const { headers, rawData, setMappings, setStep } = useImportStore()
  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>([])

  // Auto-map on mount
  useEffect(() => {
    const autoMapped: ColumnMapping[] = headers.map(header => {
      const lower = header.toLowerCase()
      let dbField: string | null = null
      
      if (lower.includes('created') || lower.includes('date')) {
        if (lower.includes('lead') || lower === 'date') dbField = 'created_at'
        if (lower.includes('schedul')) dbField = 'follow_up_date'
        if (lower.includes('walk') && lower.includes('date')) dbField = 'walkin_date'
      }
      
      if (lower === 'name' || lower.includes('candidate name')) dbField = 'name'
      if (lower.includes('mobile') || lower.includes('phone')) dbField = 'phone'
      if (lower.includes('whatsapp') || lower.includes('wa')) dbField = 'whatsapp'
      if (lower === 'age') dbField = 'age'
      if (lower.includes('gender')) dbField = 'gender'
      if (lower.includes('source') || lower.includes('through') || lower.includes('marketing')) dbField = 'origin'
      if (lower.includes('hometown')) dbField = 'custom_fields.home_town'
      if (lower.includes('area') || lower.includes('location')) dbField = 'current_area'
      if (lower.includes('qualification')) dbField = 'opportunity.highest_qualification'
      if (lower.includes('experience')) dbField = 'opportunity.total_experience'
      if (lower.includes('selection') || lower.includes('stage') || lower.includes('state')) dbField = 'opportunity.status'
      if (lower.includes('pr done')) dbField = 'custom_fields.pr_done'
      if (lower.includes('agent name')) dbField = 'custom_fields.agent_name'
      if (lower.includes('commission')) dbField = 'custom_fields.commission'
      
      return { sheetColumn: header, dbField }
    })
    setLocalMappings(autoMapped)
  }, [headers])

  const handleMap = (sheetCol: string, dbField: string | null) => {
    setLocalMappings(prev => prev.map(m => m.sheetColumn === sheetCol ? { ...m, dbField } : m))
  }

  const handleNext = () => {
    setMappings(localMappings)
    setStep('duplicate_settings')
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Map Columns</h2>
        <p className="text-muted-foreground">Match your spreadsheet columns to the RecruitOS database schema.</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 p-4 bg-muted/30 font-semibold text-sm border-b">
          <div>Spreadsheet Column</div>
          <div className="w-8"></div>
          <div>RecruitOS Field</div>
        </div>
        
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {localMappings.map((mapping, idx) => {
            const sampleData = rawData[0]?.[mapping.sheetColumn]
            return (
              <div key={idx} className="grid grid-cols-[1fr_auto_1fr] gap-4 p-4 items-center hover:bg-muted/10">
                <div>
                  <div className="font-semibold">{mapping.sheetColumn}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1 bg-muted inline-block px-1.5 py-0.5 rounded">
                    Sample: {String(sampleData || 'N/A')}
                  </div>
                </div>
                
                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
                
                <div>
                  <select 
                    className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={mapping.dbField || ''}
                    onChange={(e) => handleMap(mapping.sheetColumn, e.target.value || null)}
                  >
                    <option value="">-- Ignore Column --</option>
                    {TARGET_FIELDS.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-10 md:static md:bg-transparent md:border-t-0 md:mt-8 md:p-0">
        <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
        <Button onClick={handleNext}>
          Next: Duplicate Settings <Settings className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
