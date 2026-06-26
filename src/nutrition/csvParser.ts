/**
 * Lightweight CSV parser for the nutrition datasets.
 * No external dependencies — pure TypeScript string parsing.
 */

export interface ParsedRow {
  [key: string]: string;
}

/**
 * Parse a CSV string into an array of row objects.
 * Handles quoted fields with commas inside.
 */
export function parseCSV(csvText: string): ParsedRow[] {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    const row: ParsedRow = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').replace(/^"|"$/g, '').trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Safely parse a number from a string, returning 0 if invalid.
 */
export function parseNum(val: string | undefined): number {
  if (!val || val.trim() === '' || val === 'N/A' || val === 'nan') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : Math.round(n * 10) / 10;
}
