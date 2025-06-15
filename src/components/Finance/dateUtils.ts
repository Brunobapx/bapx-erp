
/**
 * Utilitários para datas em recebíveis (corrige fuso horário/browsers)
 */

// YYYY-MM-DD (string) -> Date local (sem UTC bug!)
export function parseLocalDateFromYYYYMMDD(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

// Date (local) -> YYYY-MM-DD
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Frequencia = "mensal" | "quinzenal" | "anual";

// Gera datas para recorrência
export function addPeriodo(date: Date, freq: Frequencia, times: number): Date[] {
  const result: Date[] = [];
  let baseDate = new Date(date);
  for (let i = 0; i < times; i++) {
    result.push(new Date(baseDate));
    if (freq === "mensal") {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else if (freq === "quinzenal") {
      baseDate.setDate(baseDate.getDate() + 15);
    } else if (freq === "anual") {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    }
  }
  return result;
}
