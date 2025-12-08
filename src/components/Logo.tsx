import { Activity } from 'lucide-react';
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}
export function Logo({
  size = 'md'
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 gap-2',
    md: 'h-10 gap-2.5',
    lg: 'h-14 gap-3'
  };
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  return <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="flex items-center justify-center rounded-xl gradient-primary p-2 shadow-soft">
        <Activity className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <span className={`font-bold tracking-tight text-foreground ${textSizes[size]}`}>Cough<span className="text-primary">Sense</span>
      </span>
    </div>;
}
