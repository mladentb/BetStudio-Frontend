import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    live: 'bg-green-500 text-white animate-pulse',
    finished: 'bg-gray-300 text-gray-700 dark:bg-gray-500 dark:text-gray-200',
    cancelled: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-200 text-gray-800';
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    scheduled: 'Zakazano',
    live: 'UŽIVO',
    finished: 'Završeno',
    cancelled: 'Otkazano',
  };
  return texts[status] || status;
}
