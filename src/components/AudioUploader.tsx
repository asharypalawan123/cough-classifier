import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/webm', 'audio/mp4'];

export function AudioUploader({ onFileSelect, selectedFile, onClear }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (ACCEPTED_FORMATS.includes(file.type) || file.name.match(/\.(wav|mp3|m4a|webm)$/i))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  if (selectedFile) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <File className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input
        type="file"
        accept=".wav,.mp3,.m4a,.webm,audio/*"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-primary/20" : "bg-secondary"
        )}>
          <Upload className={cn(
            "h-7 w-7 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div>
          <p className="font-medium text-foreground">Drop your audio file here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse • WAV, MP3, M4A, WebM
          </p>
        </div>
      </div>
    </div>
  );
}
