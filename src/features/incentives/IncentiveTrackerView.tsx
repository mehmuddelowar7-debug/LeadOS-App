import { motion } from 'framer-motion'
import { Trophy, Users, Target, Zap } from 'lucide-react'

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
}

export function IncentiveTrackerView() {
  const stats = {
    walkins: { count: 12, rate: 50, earned: 600 },
    basicReferrals: { count: 3, rate: 1000, earned: 3000 },
    expReferrals: { count: 1, rate: 5000, earned: 5000 },
    trainingBonus: { count: 4, rate: 500, earned: 2000 },
    totalEarned: 10600,
    projected: 18500,
    target: 20000,
  }

  const progress = (stats.totalEarned / stats.target) * 100

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 px-4 pt-4 md:px-6 lg:px-8 pb-32"
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-foreground">Earnings</h1>
      </div>

      {/* Main Earnings Card */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Earnings</p>
              <div className="text-3xl font-bold text-foreground tracking-tight mt-1">
                ₹{stats.totalEarned.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Projected</p>
              <div className="text-lg font-bold text-emerald-500 mt-0.5">
                ₹{stats.projected.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Target Progress</span>
              <span className="text-foreground">{Math.round(progress)}% (₹{stats.target.toLocaleString()})</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Incentive Breakdown */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</h2>

        {/* Beautician - Fresher */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Beautician - Fresher</h3>
              <p className="text-[11px] text-muted-foreground">₹3,000 × 4 completions</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">₹12,000</div>
          </div>
        </div>

        {/* Beautician - Experienced */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Beautician - Experienced</h3>
              <p className="text-[11px] text-muted-foreground">₹5,000 × 3 completions</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">₹15,000</div>
          </div>
        </div>

        {/* Insta Help */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Insta Help</h3>
              <p className="text-[11px] text-muted-foreground">₹3,000 × 3 completions</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">₹9,000</div>
          </div>
        </div>

        {/* Walk-ins (Base Rate) */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Walk-in Bounty</h3>
              <p className="text-[11px] text-muted-foreground">₹50 × 12 leads</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">₹600</div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}
