export type YearMonth = {
  year: number;
  month: number;
};

export type YearMonthRange = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
};

export type YearMonthParseResult =
  | { kind: 'single'; year: number; month: number; source: 'current' | 'args' }
  | { kind: 'range'; startYear: number; startMonth: number; endYear: number; endMonth: number };

export const MONTH_NAMES_JP = [
  '', '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export function getTokenId(year: number, month: number): number {
  return year * 100 + month;
}

export function tokenIdToHex(tokenId: number | bigint): string {
  const value = typeof tokenId === 'bigint' ? tokenId : BigInt(tokenId);
  return value.toString(16).padStart(64, '0');
}

export function getTokenIdHex(year: number, month: number): string {
  return tokenIdToHex(getTokenId(year, month));
}

export function parseYearMonthArgs(
  args: string[],
  options: { allowRange?: boolean } = {}
): YearMonthParseResult | null {
  if (args.length === 0) {
    const now = new Date();
    return {
      kind: 'single',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      source: 'current',
    };
  }

  if (args.length === 2) {
    const parsed = parseYearMonth(args[0], args[1]);
    if (!parsed) {
      return null;
    }
    return { kind: 'single', ...parsed, source: 'args' };
  }

  if (options.allowRange && args.length === 4) {
    const start = parseYearMonth(args[0], args[1]);
    const end = parseYearMonth(args[2], args[3]);
    if (!start || !end) {
      return null;
    }
    return {
      kind: 'range',
      startYear: start.year,
      startMonth: start.month,
      endYear: end.year,
      endMonth: end.month,
    };
  }

  return null;
}

export function* iterateMonthRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Generator<YearMonth> {
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    yield { year, month };
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

function parseYearMonth(yearRaw: string, monthRaw: string): YearMonth | null {
  const year = parseIntStrict(yearRaw);
  const month = parseIntStrict(monthRaw);
  if (year === null || month === null) {
    return null;
  }
  if (!isValidYearMonth(year, month)) {
    return null;
  }
  return { year, month };
}

function parseIntStrict(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function isValidYearMonth(year: number, month: number): boolean {
  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
}
