import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useDocumentUpload(contactId: string) {
  const [isUploading, setIsUploading] = useState(false)

  const uploadDocument = async (file: File, documentType: string) => {
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${contactId}/${documentType}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('candidate_documents')
        .upload(fileName, file)
        
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('candidate_documents')
        .getPublicUrl(fileName)

      toast.success(`${documentType} uploaded successfully`)
      return publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadDocument, isUploading }
}
