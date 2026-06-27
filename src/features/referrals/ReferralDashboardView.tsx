import { useState, useMemo } from 'react'
import { PerformanceProfiler } from '@/components/dev/PerformanceProfiler'
import { useRenderProfiler } from '@/hooks/useRenderProfiler'
import { Users, Award, Search, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useReferrals } from '@/hooks/useReferrals'

const getContactName = (contactData: unknown): string => {
  if (Array.isArray(contactData)) return contactData[0]?.name || 'Unknown'
  if (contactData && typeof contactData === 'object' && 'name' in contactData) {
    return (contactData as { name: string }).name || 'Unknown'
  }
  return 'Unknown'
}

export function ReferralDashboardView() {
  const [search, setSearch] = useState('')
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics()
  const { data: referrals, isLoading: loadingReferrals } = useReferrals()

  useRenderProfiler('ReferralDashboardView', {}, { search, metrics, referrals })

  const pendingAmount = metrics?.referrals.pending ? metrics.referrals.pending * 5000 : 0
  const paidAmount = metrics?.referrals.paid ? metrics.referrals.paid * 5000 : 0

  const filteredReferrals = useMemo(() => {
    return (referrals || []).filter(r =>
      getContactName((r as any).opportunity?.contact)?.toLowerCase().includes(search.toLowerCase()) ||
      getContactName(r.referrer)?.toLowerCase().includes(search.toLowerCase())
    )
  }, [referrals, search])

  if (loadingReferrals && !referrals) {
    // Skeleton shell: stats cards + list placeholders
    return (
      <div className="flex flex-col h-full px-4 pt-4 md:px-6 lg:px-8 space-y-6 pb-32">
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 h-28 bg-muted animate-pulse rounded-[24px]" />
          <div className="h-20 bg-muted animate-pulse rounded-2xl" />
          <div className="h-20 bg-muted animate-pulse rounded-2xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1,2,3,4].map(i => <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <PerformanceProfiler id="ReferralDashboardView">
      <div className="flex flex-col h-full px-4 pt-4 md:px-6 lg:px-8 space-y-6 overflow-y-auto scrollbar-hide pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Referrals</h1>
        <Button className="min-h-[44px] bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold touch-target">
          <Users className="h-4 w-4 mr-2" /> Partners
        </Button>
      </div>

      {/* Massive Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 glass-card rounded-[24px] p-6 bg-primary/10 border-primary/20 flex flex-col justify-between shadow-sm touch-target">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Lifetime Earnings</span>
            <Award className="h-6 w-6 text-primary" />
          </div>
          <p className="text-5xl font-black text-foreground tracking-tighter">
            {loadingMetrics ? <span className="inline-block w-32 h-10 bg-primary/10 animate-pulse rounded" /> : `₹${paidAmount.toLocaleString()}`}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm touch-target">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">₹{pendingAmount.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{metrics?.referrals.pending || 0} candidates</p>
        </div>
        
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between shadow-sm touch-target">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Successful</span>
             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
           </div>
           <p className="text-2xl font-black text-foreground tracking-tight">{metrics?.referrals.paid || 0}</p>
           <p className="text-[10px] text-muted-foreground mt-1 font-semibold">candidates placed</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative pt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search referrals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl text-lg bg-muted/50 border-transparent focus:bg-background shadow-sm"
        />
      </div>

      {/* Referral List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Referrals</h2>
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-bold">No referrals yet.</p>
          </div>
        ) : filteredReferrals.map((ref) => (
          <div key={ref.id} className="relative">
            <div
              className={cn("glass-card rounded-2xl p-4 flex items-center justify-between z-10 relative shadow-sm", ref.reward_status === 'paid' && ref.payment_reference ? "rounded-b-none border-b-0" : "")}
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-foreground truncate">{getContactName((ref as any).opportunity?.contact) || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  By <span className="font-bold text-foreground truncate">{getContactName(ref.referrer) || 'Unknown'}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-black text-foreground tracking-tight">₹{ref.reward_amount || 5000}</p>
                {ref.reward_status === 'paid' ? (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-500 mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </span>
                )}
              </div>
            </div>
            {ref.reward_status === 'paid' && ref.payment_reference && (
              <div className="bg-muted/30 border-x border-b border-border/50 rounded-b-2xl p-3 text-xs text-muted-foreground relative z-0 font-medium flex items-center justify-between">
                <span>Ref: <span className="font-mono text-foreground">{ref.payment_reference}</span></span>
                {ref.notes && <span className="truncate max-w-[50%] text-right">{ref.notes}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </PerformanceProfiler>
  )
}
