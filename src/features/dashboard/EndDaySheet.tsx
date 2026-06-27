import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Settings, X, RefreshCw, History, ArrowRight, Save, Share2, Plus, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReportSettingsStore, type FieldKey, type ReportTemplateType } from '../reports/ReportSettingsStore'
import { generateDailyFieldReportData, type DailyReportData } from '@/lib/endDayEngine'
import { useAuthStore } from '@/features/auth/AuthStore'
import { toast } from 'sonner'
import dayjs from 'dayjs'

const REJECTION_CHIPS = [
  'English Issue', 'Parents Not Allowed', 'Husband Not Allowed', 
  'Already Working', 'Salary Expectation', 'Not Interested', 
  'Location Too Far', 'No Documents', 'Medical Issue', 'Training Not Possible', 'Other'
]

const COMMENT_TEMPLATES = [
  'Heavy rain today.', 'College visit today.', 'Office meeting.', 
  'Market closed.', 'Low footfall.', 'Area already covered.', 
  'Festival impact.', 'Traffic issue.', 'Dazzle office visit.'
]

const UC_PRESETS = {
  manager: 'Ashish Sahoo UC',
  tl: 'Taniya Nath',
  supervisor: 'Ayaz Naqvi'
}

interface EndDaySheetProps {
  open: boolean
  onClose: () => void
}

export function EndDaySheet({ open, onClose }: EndDaySheetProps) {
  const user = useAuthStore(state => state.user)
  // useReportSettingsStore was subscribing to everything; let's see how it's used. Wait, I will just select state if it's used directly, or leave it if it uses the whole object. Actually, let's just replace useAuthStore.
  const settings = useReportSettingsStore(state => state)
  
  // const [data, setData] = useState<DailyReportData | null>(null)
  const [formData, setFormData] = useState<DailyReportData | null>(null)
  const [selectedRejections, setSelectedRejections] = useState<string[]>([])
  const [selectedWalkinNames, setSelectedWalkinNames] = useState<string[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'form' | 'settings' | 'history' | 'preview'>('form')
  
  useEffect(() => {
    if (open) {
      setView('form')
      loadData()
    }
  }, [open])

  useEffect(() => {
    if (settings.mentionTemplate === 'urban_company') {
      settings.setManagerName(UC_PRESETS.manager)
      settings.setTlName(UC_PRESETS.tl)
      settings.setSupervisorName(UC_PRESETS.supervisor)
    }
  }, [settings.mentionTemplate])
  
  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await generateDailyFieldReportData(user?.id || 'u1', 'w1')
      // setData(result)
      setFormData(JSON.parse(JSON.stringify(result)))
      
      const preselectedRejections = Object.keys(result.rejectionReasons)
      setSelectedRejections(preselectedRejections)
      setSelectedWalkinNames(result.expectedWalkInNames)
    } catch (e) {
      toast.error('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdjust = (field: keyof DailyReportData, amount: number) => {
    if (!formData) return
    setFormData(prev => {
      if (!prev) return prev
      const current = prev[field] as number
      const next = Math.max(0, current + amount)
      return { ...prev, [field]: next }
    })
  }

  const toggleRejection = (reason: string) => {
    setSelectedRejections(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    )
  }

  const toggleWalkinName = (name: string) => {
    setSelectedWalkinNames(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      if (formData) {
        setFormData({ ...formData, expectedWalkIn: next.length })
      }
      return next
    })
  }

  const appendComment = (template: string) => {
    const current = settings.commentsDraft.trim()
    settings.setCommentsDraft(current ? `\${current}\
\${template}` : template)
  }

  const generateReportText = () => {
    if (!formData) return ''

    const blocks: Record<FieldKey, string> = {
      date: `Date - ${formData.date}`,
      leads: `Leads Collected - ${formData.leadsCollected}`,
      walkin: `Walk-in - ${formData.walkIn}`,
      expected_walkin: `Expected Walk-in - ${formData.expectedWalkIn}${selectedWalkinNames.length > 0 ? ` (${selectedWalkinNames.join(', ')})` : ''}`,
      screening: `Screening Done - ${formData.screeningDone}`,
      recharge: `Recharge Done - ${formData.rechargeDone}`,
      training: `Training Started - ${formData.trainingStarted}`,
      activation: `Activation - ${formData.activation}`,
      rejected: '',
      comments: `Comments:\n${settings.commentsDraft || 'No comments'}`,
      mentions: ''
    }

    // Process Rejections
    if (selectedRejections.length > 0) {
      if (settings.templateType === 'A') {
        blocks.rejected = `Rejected - ${formData.rejected} (${selectedRejections.join(', ')})`
      } else {
        blocks.rejected = `Rejected - ${formData.rejected}\n${selectedRejections.map(r => `- ${r}`).join('\n')}`
      }
    } else {
      blocks.rejected = `Rejected - ${formData.rejected}`
    }

    // Process Mentions
    const mentions = []
    if (settings.managerName) mentions.push(`@${settings.managerName}`)
    if (settings.tlName) mentions.push(`@${settings.tlName}`)
    if (settings.supervisorName) mentions.push(`@${settings.supervisorName}`)
    blocks.mentions = mentions.join('\n')

    let output = ''

    if (settings.templateType === 'C') {
      settings.customOrder.forEach(key => {
        const val = blocks[key]
        if (!val) return
        if (settings.hideZeroValues && ['leads','walkin','screening','recharge','training','activation','rejected','expected_walkin'].includes(key)) {
           const numField = key === 'expected_walkin' ? 'expectedWalkIn' : 
                            key === 'walkin' ? 'walkIn' : 
                            key === 'screening' ? 'screeningDone' : 
                            key === 'recharge' ? 'rechargeDone' : 
                            key === 'training' ? 'trainingStarted' : 
                            key === 'leads' ? 'leadsCollected' : key as keyof DailyReportData
           if ((formData as any)[numField] === 0) return
        }
        output += val + '\n\n'
      })
    } else {
      // Standard A or B formatting
      output += blocks.date + '\n\n'
      
      if (!settings.hideZeroValues || formData.leadsCollected > 0) output += blocks.leads + '\n'
      if (!settings.hideZeroValues || formData.walkIn > 0) output += blocks.walkin + '\n'
      if (!settings.hideZeroValues || formData.expectedWalkIn > 0) output += blocks.expected_walkin + '\n'
      
      if (settings.templateType === 'B') {
        if (!settings.hideZeroValues || formData.screeningDone > 0) output += blocks.screening + '\n'
        if (!settings.hideZeroValues || formData.rechargeDone > 0) output += blocks.recharge + '\n'
        if (!settings.hideZeroValues || formData.trainingStarted > 0) output += blocks.training + '\n'
        if (!settings.hideZeroValues || formData.activation > 0) output += blocks.activation + '\n'
      }

      if (!settings.hideZeroValues || formData.rejected > 0) output += blocks.rejected + '\n'
      
      output += '\n' + blocks.comments + '\n\n'
      if (blocks.mentions) output += blocks.mentions + '\n'
    }

    return output.trim()
  }

  const handleCopy = () => {
    const text = generateReportText()
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to Clipboard!', { description: 'Ready to paste in WhatsApp' })
    })
  }
  
  const handleShare = () => {
    const text = generateReportText()
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`)
  }

  const handleSave = () => {
    const text = generateReportText()
    settings.addHistory({
      id: crypto.randomUUID(),
      date: dayjs().format('YYYY-MM-DD'),
      text,
      timestamp: Date.now()
    })
    toast.success('Report saved to history')
    onClose()
  }

  // --- Move custom order logic ---
  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const arr = [...settings.customOrder]
    if (direction === 'up' && index > 0) {
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]]
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
    }
    settings.setCustomOrder(arr)
  }

  // --- Smart Suggestions ---
  let suggestion = ''
  if (formData) {
    if (formData.leadsCollected >= 5 && formData.walkIn === 0) {
      suggestion = `High leads but 0 walk-ins. Suggest expected walk-ins?`
    }
    if (formData.rejected >= 3) {
      suggestion = `High rejection rate today. Make sure to log exact reasons.`
    }
    if (formData.leadsCollected === 0 && formData.walkIn === 0 && !settings.commentsDraft) {
      suggestion = `Add a reason in comments if target was not achieved.`
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 glass border-t border-border rounded-t-[32px] p-4 md:p-6 pb-safe flex flex-col max-h-[90dvh]"
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4 shrink-0" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {view === 'form' ? 'Daily Report' : view === 'preview' ? 'Preview' : view === 'settings' ? 'Settings' : 'History'}
                </h2>
              </div>
              <div className="flex gap-2">
                {view === 'form' && (
                  <>
                    <button onClick={() => setView('history')} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors touch-target">
                      <History className="h-5 w-5" />
                    </button>
                    <button onClick={() => setView('settings')} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors touch-target">
                      <Settings className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button onClick={view === 'form' ? onClose : () => setView('form')} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors touch-target">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide space-y-5 px-1">
              
              {isLoading && view === 'form' && (
                <div className="py-12 flex flex-col items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50 mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">Aggregating field data...</p>
                </div>
              )}

              {/* === FORM VIEW === */}
              {view === 'form' && formData && !isLoading && (
                <div className="space-y-6 pb-4 animate-in fade-in">
                  
                  {suggestion && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium pt-0.5">{suggestion}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Adjust Metrics</h3>
                    {[
                      { key: 'leadsCollected', label: 'Leads Collected' },
                      { key: 'walkIn', label: 'Walk-in' },
                      { key: 'expectedWalkIn', label: 'Expected Walk-in' },
                      { key: 'rejected', label: 'Rejected' },
                      { key: 'screeningDone', label: 'Screening' },
                      { key: 'activation', label: 'Activation' },
                    ].map(metric => (
                      <div key={metric.key} className="glass-card rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{metric.label}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleAdjust(metric.key as any, -1)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center touch-target active:scale-95"><Minus className="h-4 w-4" /></button>
                          <span className="text-base font-bold w-6 text-center">{(formData as any)[metric.key]}</span>
                          <button onClick={() => handleAdjust(metric.key as any, 1)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center touch-target active:scale-95"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.expectedWalkIn > 0 && formData.expectedWalkInNames && formData.expectedWalkInNames.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Confirm Tomorrow's Walk-ins</h3>
                      <div className="glass-card p-3 rounded-xl space-y-2">
                        {formData.expectedWalkInNames.map(name => (
                          <label key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedWalkinNames.includes(name)}
                              onChange={() => toggleWalkinName(name)}
                              className="h-5 w-5 accent-primary rounded-sm"
                            />
                            <span className="text-sm font-semibold">{name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.rejected > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Rejection Reasons</h3>
                      <div className="flex flex-wrap gap-2">
                        {REJECTION_CHIPS.map(reason => (
                          <button
                            key={reason}
                            onClick={() => toggleRejection(reason)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border \${selectedRejections.includes(reason) ? 'bg-red-500 text-white border-red-500' : 'bg-muted/50 text-muted-foreground border-transparent'}`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Quick Comments</h3>
                    <div className="flex flex-wrap gap-2">
                      {COMMENT_TEMPLATES.map(t => (
                        <button
                          key={t}
                          onClick={() => appendComment(t)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 touch-target"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Write custom comments here..."
                      value={settings.commentsDraft}
                      onChange={(e) => settings.setCommentsDraft(e.target.value)}
                      className="min-h-[100px] w-full resize-none bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-3 text-sm text-foreground outline-none transition-all mt-2"
                    />
                  </div>

                </div>
              )}

              {/* === PREVIEW VIEW === */}
              {view === 'preview' && (
                <div className="space-y-4 animate-in fade-in pb-4">
                  <div className="bg-[#EFEAE2] dark:bg-[#0B141A] rounded-2xl p-4 min-h-[300px] relative shadow-inner overflow-hidden border border-border">
                    {/* WhatsApp style background pattern placeholder */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    
                    <div className="bg-white dark:bg-[#202C33] rounded-xl rounded-tl-none p-3 shadow-sm inline-block max-w-[90%] relative z-10">
                      <p className="text-[13px] md:text-sm whitespace-pre-wrap text-[#111B21] dark:text-[#E9EDEF] font-sans leading-relaxed">
                        {generateReportText()}
                      </p>
                      <div className="text-[10px] text-[#667781] dark:text-[#8696A0] text-right mt-1 pt-1">
                        {dayjs().format('h:mm A')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="h-14 rounded-xl font-bold" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button className="h-14 rounded-xl font-bold bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button variant="outline" className="h-14 rounded-xl font-bold col-span-2 text-primary" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" /> Save to History & Close
                    </Button>
                  </div>
                </div>
              )}

              {/* === SETTINGS VIEW === */}
              {view === 'settings' && (
                <div className="space-y-6 animate-in fade-in pb-4">
                  <div className="glass-card p-4 rounded-2xl space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Report Template</h3>
                    <div className="flex gap-2 bg-muted p-1 rounded-xl">
                      {(['A', 'B', 'C'] as ReportTemplateType[]).map(t => (
                        <button
                          key={t}
                          onClick={() => settings.setTemplateType(t)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all \${settings.templateType === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="hide-zero" className="text-sm font-semibold">Hide Empty Fields</Label>
                      <input 
                        type="checkbox" id="hide-zero" 
                        checked={settings.hideZeroValues} 
                        onChange={(e) => settings.setHideZeroValues(e.target.checked)} 
                        className="h-5 w-5 accent-primary"
                      />
                    </div>
                  </div>

                  {settings.templateType === 'C' && (
                    <div className="glass-card p-4 rounded-2xl space-y-3">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Custom Order (Template C)</h3>
                      {settings.customOrder.map((key, i) => (
                        <div key={key} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                          <span className="text-sm font-semibold capitalize">{key.replace('_', ' ')}</span>
                          <div className="flex gap-1">
                            <button disabled={i===0} onClick={() => moveOrder(i, 'up')} className="p-1.5 bg-background rounded hover:bg-accent disabled:opacity-30"><ArrowUp className="h-4 w-4"/></button>
                            <button disabled={i===settings.customOrder.length-1} onClick={() => moveOrder(i, 'down')} className="p-1.5 bg-background rounded hover:bg-accent disabled:opacity-30"><ArrowDown className="h-4 w-4"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="glass-card p-4 rounded-2xl space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Mentions Template</h3>
                    
                    <div className="flex gap-2 bg-muted p-1 rounded-xl mb-4">
                      <button
                        onClick={() => settings.setMentionTemplate('urban_company')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all \${settings.mentionTemplate === 'urban_company' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                      >
                        Urban Company
                      </button>
                      <button
                        onClick={() => settings.setMentionTemplate('custom')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all \${settings.mentionTemplate === 'custom' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                      >
                        Custom
                      </button>
                    </div>

                    <div className="space-y-3 opacity-90 transition-opacity" style={{ opacity: settings.mentionTemplate === 'urban_company' ? 0.6 : 1 }}>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Manager Name</Label>
                        <Input value={settings.managerName} onChange={(e) => settings.setManagerName(e.target.value)} disabled={settings.mentionTemplate === 'urban_company'} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Team Leader Name</Label>
                        <Input value={settings.tlName} onChange={(e) => settings.setTlName(e.target.value)} disabled={settings.mentionTemplate === 'urban_company'} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Supervisor / RM</Label>
                        <Input value={settings.supervisorName} onChange={(e) => settings.setSupervisorName(e.target.value)} disabled={settings.mentionTemplate === 'urban_company'} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === HISTORY VIEW === */}
              {view === 'history' && (
                <div className="space-y-3 animate-in fade-in pb-4">
                  {settings.history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No saved reports yet.</div>
                  ) : (
                    settings.history.map(report => (
                      <div key={report.id} className="glass-card p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-bold">{dayjs(report.timestamp).format('DD MMM YYYY')}</span>
                          <span>{dayjs(report.timestamp).format('h:mm A')}</span>
                        </div>
                        <p className="text-sm font-mono whitespace-pre-wrap line-clamp-3 text-foreground">{report.text}</p>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full font-bold"
                          onClick={() => {
                            navigator.clipboard.writeText(report.text)
                            toast.success('Report copied')
                          }}
                        >
                          <Copy className="h-3 w-3 mr-2" /> Copy Again
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Action Bar (Only in Form view) */}
            {view === 'form' && !isLoading && (
              <div className="pt-4 shrink-0">
                <Button 
                  className="w-full h-14 rounded-xl text-lg font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                  onClick={() => setView('preview')}
                >
                  Review & Send <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
