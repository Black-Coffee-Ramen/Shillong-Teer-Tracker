import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return `₹${Math.abs(value).toLocaleString('en-IN')}`;
}

export function formatTwoDigits(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function getFormattedDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function getFormattedTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

export function calculateTimeRemaining(targetHour: number, targetMinute: number): string {
  const now = new Date();
  const target = new Date(now);
  
  target.setHours(targetHour, targetMinute, 0, 0);
  
  // If the target time has already passed today, set target to tomorrow
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  
  const diff = target.getTime() - now.getTime();
  
  // Format the time remaining
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function isRoundClosed(targetHour: number, targetMinute: number): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return (currentHour > targetHour) || (currentHour === targetHour && currentMinute >= targetMinute);
}
