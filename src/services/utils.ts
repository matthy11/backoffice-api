import moment, { Moment } from 'moment-timezone';
import * as fs from 'fs';
const Csv = require('async-csv');

export const dateFormatter = (date: Date): string => {
  const dateNumber = date.getDate();
  const month = (date.getMonth() + 1).toString();
  const monthNumber = month.length === 1 ? `0${month}` : month;
  const yearNumber = date
    .getFullYear()
    .toString()
    .slice(-2);

  return `${dateNumber}${monthNumber}${yearNumber}`;
};

export const fullDateFormatter = (
  dateString: string,
  inverted: boolean = false
): string => {
  const date = moment(dateString).tz('America/Santiago');
  return inverted ? date.format('YYYYMMDD') : date.format('DDMMYYYY');
};

// returns a function to shift values with desired filler and order
export const universalShifter = (
  n: number,
  filler: string = '0',
  ltr: boolean = true // fill from left to right; false to fill from right to left
) => (value: string | number): string => {
  if (ltr) {
    return `${Array(n)
      .fill(filler)
      .join('')}${value}`.slice(-1 * n);
  }
  return `${value}${Array(n)
    .fill(filler)
    .join('')}`.slice(0, n);
};

// Returns a fixed string with n leading 0s, with the value at the end
// example zeroShift(5)('hola') => '0hola'
export const zeroShift = (n: number) => (value: string | number) => {
  return universalShifter(n)(value);
};

// Fills with n whitespaces
export const whiteSpaceFill = (n: number) => {
  return `${Array(n)
    .fill(' ')
    .join('')}`;
};


export function formatDate(dateString: string): string {
  const date = moment(dateString).tz('America/Santiago');
  return date.format('DD-MM-YYYY HH:mm');
}

export function getHolidaysAdjust(date: Moment): number {
  const holidays = (process.env.HOLIDAYS || '').split(',');
  let adjust = 1; // start with 1 because date param is already minus 1

  // check if date is holiday, sunday or saturday
  while (holidays.includes(date.format('DD-MM')) || date.get('day') === 0 || date.get('day') === 6) {
    adjust++;
    date.subtract(1, 'day');
  }
  return adjust;
}
interface readedDataObj {
  [key: string]: string;
}

export async function readLocalCSV(csvPath: string): Promise<readedDataObj[]> {
  const csvContent = await fs.readFileSync(csvPath, 'utf-8');
  const rows: string[][] = await Csv.parse(csvContent, { delimiter: ';' });
  const headers = rows.shift() || [];

  return rows.map((row) => {
    const rowObj: readedDataObj = {};

    headers.forEach((header, index) => {
      const _header = header.toLowerCase();
      rowObj[_header] = row[index];
    })

    return rowObj;
  });
};

export function clearRut(rut: string): string {
  return rut.replace(/[\.-]/g, '').toUpperCase();
}

export function paginate(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  return {
    offset,
    limit,
  };
};
