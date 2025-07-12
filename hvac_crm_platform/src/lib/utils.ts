import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// HVAC-specific utility functions
export function formatCurrency(amount: number, currency = "PLN"): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | number | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date | number | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Job statuses
    pending: "bg-yellow-100 text-yellow-800",
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",

    // Quote statuses
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    viewed: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",

    // Priority levels
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  }

  return statusColors[status] || "bg-gray-100 text-gray-800"
}

export function getPriorityIcon(priority: string): string {
  const priorityIcons: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    urgent: "🔴",
  }

  return priorityIcons[priority] || "⚪"
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Warsaw district utilities
export function getDistrictColor(district: string): string {
  const districtColors: Record<string, string> = {
    "Śródmieście": "#1f2937", // Dark gray
    "Mokotów": "#3b82f6", // Blue
    "Ochota": "#10b981", // Green
    "Wola": "#f59e0b", // Orange
    "Żoliborz": "#8b5cf6", // Purple
    "Praga-Północ": "#ef4444", // Red
    "Praga-Południe": "#06b6d4", // Cyan
    "Targówek": "#84cc16", // Lime
    "Rembertów": "#f97316", // Orange
    "Wawer": "#ec4899", // Pink
    "Wilanów": "#6366f1", // Indigo
    "Ursynów": "#14b8a6", // Teal
    "Włochy": "#a855f7", // Violet
    "Ursus": "#22c55e", // Green
    "Bemowo": "#eab308", // Yellow
    "Białołęka": "#64748b", // Slate
    "Bielany": "#dc2626", // Red
    "Wesola": "#0891b2", // Sky
  }

  return districtColors[district] || "#6b7280"
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Performance utilities
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
