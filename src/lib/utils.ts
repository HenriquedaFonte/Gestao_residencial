const TZ = 'America/Toronto' // Montreal usa o mesmo timezone

export const DAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Retorna a data de hoje no timezone de Montreal (YYYY-MM-DD)
export function getTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

// Retorna o dia da semana (0=Dom, 6=Sáb) de uma data string no timezone correto
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  // Usar meio-dia local para evitar problemas de DST
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return date.getUTCDay()
}

export function getWeekDates(): string[] {
  const todayStr = getTodayDateString()
  const [year, month, day] = todayStr.split('-').map(Number)

  // Trabalhar com datas puramente locais (sem conversão UTC)
  const dayOfWeek = getDayOfWeek(todayStr)
  const mondayOffset = (dayOfWeek + 6) % 7 // dias desde segunda

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, day - mondayOffset + i, 12, 0, 0))
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  })
}

export function getCurrentWeekDayNumbers(): { date: string; day: number }[] {
  return getWeekDates().map((date) => ({
    date,
    day: getDayOfWeek(date),
  }))
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  })
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: TZ,
  })
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString()
}

export function isPast(dateStr: string): boolean {
  return dateStr < getTodayDateString()
}
