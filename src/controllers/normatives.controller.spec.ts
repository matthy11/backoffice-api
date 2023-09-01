jest.mock('@google-cloud/storage');
import moment from "moment-timezone";
import { getNormativeMonthRange, cleanName, formatName } from './normatives.controller';

describe('utils functions', () => {
  const format = 'YYYY-MM-DD HH:mm:ss.SSSZ';
  const timezone = 'America/Santiago';
  // banking month example:
  // the Banking Month of August considers all transactions made within
  // July 31 past 14:00 to August 31 until 14:00.
  it('should give a banking month', () => {
    const month = moment('2020-08-01').tz(timezone);
    const { startDate, endDate } = getNormativeMonthRange(month);
    expect(startDate.format(format)).toBe('2020-07-31 14:00:00.000-04:00');
    expect(endDate.format(format)).toBe('2020-08-31 14:00:00.000-04:00');
  });


  it('should include more days if holidays/weekends at the end of the period', () => {
    const month = moment('2020-08-01').tz(timezone);
    // assume july's last friday and thursday are holiday
    process.env.HOLIDAYS = '31-07,30-07';
    const { startDate, endDate } = getNormativeMonthRange(month);
    expect(startDate.format(format)).toBe('2020-07-29 14:00:00.000-04:00');
    expect(endDate.format(format)).toBe('2020-08-31 14:00:00.000-04:00');
  });

  it('should not include end of month if it is holiday', () => {
    const month = moment('2020-08-01').tz(timezone);
    // assume july's last friday and thursday are holiday
    process.env.HOLIDAYS = '31-08';
    const { startDate, endDate } = getNormativeMonthRange(month);
    expect(startDate.format(format)).toBe('2020-07-31 14:00:00.000-04:00');
    // 31-08 is a monday, and if it is holiday, it will not inlcude from
    // friday 28-08 14:00
    expect(endDate.format(format)).toBe('2020-08-28 14:00:00.000-04:00');
  })
})

describe('cleanName', () => {
  it('should return clean string', () => {
    const withEmojisAndAccents = "❤️ Ñandú ❤️"
    expect(cleanName(withEmojisAndAccents)).toBe("NANDU")
    const withSpecialCharactersAndOthers = "❤️ Ñandú ❤️ @gmail.com"
    expect(cleanName(withSpecialCharactersAndOthers)).toBe("NANDU GMAIL COM")
  })
})

describe('formatName', () => {
  it('should return formated string', () => {
    const name = "RIVAS|XNOSLNX|CAMILO IGNACIO" // XNOSLNX means no second last name
    expect(formatName(name)).toBe("RIVAS//CAMILO IGNACIO");
    const otherName = "RIVAS|FOLCH|CAMILO IGNACIO";
    expect(formatName(otherName)).toBe("RIVAS/FOLCH/CAMILO IGNACIO");
    const shortName = "ROA|XNOSLNX|ANDRES";
    expect(formatName(shortName)).toBe("ROA//ANDRES");
    const compositeName = "DEL CARMEN|PEREZ|CAMILO IGNACIO";
    expect(formatName(compositeName)).toBe("DEL CARMEN/PEREZ/CAMILO IGNACIO");
  })
});

describe('formatName and cleanName composition', () => {
  const formatAndClean = (name: string) => formatName(name.split('|').map(cleanName).join('|'));
  it('should correctly return a cleaned and formatted name', () => {
    const name = "❤️ Ñandú ❤️|XNOSLNX|Camilo Ignacio";
    expect(formatAndClean(name)).toBe("NANDU//CAMILO IGNACIO");
  });
})