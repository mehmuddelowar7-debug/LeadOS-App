import { Database, CheckCircle2, Clock, XCircle } from 'lucide-react'
import dayjs from 'dayjs'

const dummyImports = [
  { id: '1', provider: 'csv_import', started_at: '2026-08-07T14:30:00Z', completed_at: '2026-08-07T14:31:00Z', status: 'completed', records_inserted: 450, records_updated: 12 },
  { id: '2', provider: 'meta_api', started_at: '2026-08-08T09:00:00Z', completed_at: '2026-08-08T09:02:00Z', status: 'completed', records_inserted: 24, records_updated: 89 },
  { id: '3', provider: 'google_ads', started_at: '2026-08-08T18:40:00Z', completed_at: null, status: 'pending', records_inserted: 0, records_updated: 0 },
  { id: '4', provider: 'meta_api', started_at: '2026-08-05T09:00:00Z', completed_at: '2026-08-05T09:01:00Z', status: 'failed', records_inserted: 0, records_updated: 0 },
]

export function MarketingImportsView() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Marketing Imports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Audit log of all manual and API-driven data ingestions.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Started</th>
                <th className="px-6 py-4">Inserted</th>
                <th className="px-6 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {dummyImports.map((imp) => (
                <tr key={imp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground capitalize">
                    {imp.provider.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      imp.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      imp.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {imp.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {imp.status === 'failed' && <XCircle className="h-3.5 w-3.5" />}
                      {imp.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                      {imp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {dayjs(imp.started_at).format('MMM D, h:mm A')}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {imp.records_inserted}
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground">
                    {imp.records_updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  )
}
