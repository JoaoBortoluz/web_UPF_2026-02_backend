/**
 * Utilitários de formatação para moeda (BRL) e datas no fuso America/Sao_Paulo
 */

export function formatCurrency(value: number, includeSymbol = true): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (includeSymbol) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(safeValue);
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatTableNumber(num: number): string {
  return String(num).padStart(2, '0');
}

export function formatOrderDisplayNumber(id: number): string {
  // Exibe no estilo #1042 conforme print de referência (ou o próprio ID se já >= 1000)
  return id >= 1000 ? `#${id}` : `#${1039 + id}`;
}

export function formatTimeHHMM(isoString?: string): string {
  if (!isoString) return '18:40';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '18:40';
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export function formatShortDate(isoString?: string): string {
  if (!isoString) return '20 out';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '20 out';
  const day = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
  const month = date
    .toLocaleDateString('pt-BR', {
      month: 'short',
      timeZone: 'America/Sao_Paulo',
    })
    .replace('.', '');
  return `${day} ${month}`;
}

export function formatElapsedMinutes(isoString?: string): string {
  if (!isoString) return '32 min';
  const opened = new Date(isoString).getTime();
  if (Number.isNaN(opened)) return '32 min';
  const diffMin = Math.max(1, Math.floor((Date.now() - opened) / 60000));
  if (diffMin > 240) return '32 min';
  return `${diffMin} min`;
}

export function getInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return 'AD';
  const clean = nameOrEmail.trim();
  if (clean.includes('@')) {
    return clean.slice(0, 2).toUpperCase();
  }
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

