import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Edit, Archive, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAppNavigate, ROUTES } from '@/lib/routes'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  isDeleted?: boolean
  onEdit: () => void
}

export function ContactActionsSheet({ open, onOpenChange, contactId, isDeleted, onEdit }: Props) {
  const queryClient = useQueryClient()
  const navigate = useAppNavigate()

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_deleted: true })
        .eq('id', contactId)

      if (error) throw error
      toast.success('Contact archived')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] })
      onOpenChange(false)
      navigate(ROUTES.CONTACTS)
    } catch (err: any) {
      toast.error('Failed to archive contact: ' + err.message)
    }
  }

  const handleRestore = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_deleted: false })
        .eq('id', contactId)

      if (error) throw error
      toast.success('Contact restored')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contactId] })
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Failed to restore contact: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this contact? This cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
      toast.success('Contact deleted permanently')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      onOpenChange(false)
      navigate(ROUTES.CONTACTS)
    } catch (err: any) {
      toast.error('Failed to delete contact: ' + err.message)
    }
  }

  const handleEditClick = () => {
    onOpenChange(false)
    onEdit()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <SheetHeader className="p-6 pb-2 text-left shrink-0">
          <SheetTitle className="text-xl font-bold">Manage Candidate</SheetTitle>
        </SheetHeader>
        
        <div className="p-6 pt-2 space-y-3 flex-1 overflow-y-auto">
          <Button variant="outline" className="w-full justify-start h-14 text-base font-semibold" onClick={handleEditClick}>
            <Edit className="w-5 h-5 mr-3 text-muted-foreground" />
            Edit Profile
          </Button>

          {isDeleted ? (
            <Button variant="outline" className="w-full justify-start h-14 text-base font-semibold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={handleRestore}>
              <RotateCcw className="w-5 h-5 mr-3" />
              Restore Candidate
            </Button>
          ) : (
            <Button variant="outline" className="w-full justify-start h-14 text-base font-semibold text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" onClick={handleArchive}>
              <Archive className="w-5 h-5 mr-3" />
              Archive Candidate
            </Button>
          )}

          <Button variant="outline" className="w-full justify-start h-14 text-base font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleDelete}>
            <Trash2 className="w-5 h-5 mr-3" />
            Delete Permanently
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
