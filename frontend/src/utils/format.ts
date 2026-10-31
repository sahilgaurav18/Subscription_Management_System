export function formatMoney(amountMinorUnits: number, currency: string = 'USD'): string {
  const amount = (amountMinorUnits / 100).toFixed(2);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Number(amount));
  } catch {
    return `$${amount}`;
  }
}

export function parseDollarsToMinorUnits(dollars: string | number): number {
  const parsed = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

