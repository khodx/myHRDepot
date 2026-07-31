import { FileText, FileImage, FileSpreadsheet, FileArchive, File } from 'lucide-react';

interface Props {
  mimeType: string;
  className?: string;
}

export function MhdAttachmentFileIcon({ mimeType, className = 'h-5 w-5' }: Props) {
  if (mimeType.startsWith('image/')) return <FileImage className={className} />;
  if (mimeType === 'application/pdf') return <FileText className={className} />;
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv' || mimeType.includes('excel')) {
    return <FileSpreadsheet className={className} />;
  }
  if (mimeType.includes('zip') || mimeType.includes('compressed'))
    return <FileArchive className={className} />;
  return <File className={className} />;
}
