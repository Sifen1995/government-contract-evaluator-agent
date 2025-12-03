import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'BID':
      return 'green';
    case 'REVIEW':
      return 'yellow';
    case 'NO_BID':
      return 'red';
    default:
      return 'gray';
  }
}
