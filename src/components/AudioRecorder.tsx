import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onClear: () => void;
  hasRecording: boolean;
}

export function AudioRecorder({ onRecordingComplete, onClear, hasRecording }: AudioRecorderProps) {
  const { 
    isRecording, 
    audioBlob, 
    audioUrl, 
    startRecording, 
    stopRecording, 
    clearRecording,
    error 
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete]);

  const handleClear = () => {
    clearRecording();
    onClear();
  };

  if (error) {
    return (
      <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={handleClear}>
          Try Again
        </Button>
      </div>
    );
  }

  if (audioUrl && hasRecording) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-accent/30 bg-accent/5 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Recording captured</p>
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <Trash2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <audio controls src={audioUrl} className="w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/20" style={{ transform: 'scale(1.5)' }} />
            <div className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/10" style={{ transform: 'scale(2)', animationDelay: '0.5s' }} />
          </>
        )}
        <Button
          variant={isRecording ? "record" : "outline"}
          size="icon"
          className={cn(
            "relative h-20 w-20 rounded-full transition-all duration-300",
            isRecording && "animate-pulse"
          )}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
      <p className={cn(
        "text-sm font-medium transition-colors",
        isRecording ? "text-destructive" : "text-muted-foreground"
      )}>
        {isRecording ? "Recording... Tap to stop" : "Tap to start recording"}
      </p>
    </div>
  );
}
