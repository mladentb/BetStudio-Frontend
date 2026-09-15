// Sport icons mapping
import { 
  Circle,
  type LucideIcon 
} from 'lucide-react';

// Custom SVG icons for sports
export const SportIcons: Record<string, React.FC<{ className?: string }>> = {
  rukomet: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  odbojka: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M2 12h20M12 2c-3 3-3 7 0 10s3 7 0 10M12 2c3 3 3 7 0 10s-3 7 0 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  kosarka: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4.5 4.5c4 3 11 3 15 0M4.5 19.5c4-3 11-3 15 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  fudbal: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 2l2.5 4.5h5L17 12l2.5 5.5h-5L12 22l-2.5-4.5h-5L7 12l-2.5-5.5h5L12 2z" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  ),
  tenis: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M5 5c7 0 14 7 14 14M5 19c7 0 14-7 14-14" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
};

export const getSportIcon = (slug: string): React.FC<{ className?: string }> => {
  return SportIcons[slug.toLowerCase()] || SportIcons.rukomet;
};

// Sport colors
export const SportColors: Record<string, { bg: string; text: string; border: string }> = {
  rukomet: { 
    bg: 'bg-orange-100 dark:bg-orange-900/30', 
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  odbojka: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  kosarka: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  },
  fudbal: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  tenis: { 
    bg: 'bg-lime-100 dark:bg-lime-900/30', 
    text: 'text-lime-600 dark:text-lime-400',
    border: 'border-lime-200 dark:border-lime-800'
  },
};

export const getSportColors = (slug: string) => {
  return SportColors[slug.toLowerCase()] || SportColors.rukomet;
};
