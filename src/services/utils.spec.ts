import moment from "moment";
import { getHolidaysAdjust } from "./utils";

describe('utils service', () => {
  // cron is run every tuesday to saturday
  it('should give correct adjust value', () => {
    // cron run on saturday, process is run for friday
    // will ask for adjust number on thursday
    const friday = moment('2020-08-14');
    const fridayAdjust = getHolidaysAdjust(friday);
    expect(fridayAdjust).toBe(1);
    // cron run on thursday, process is run for wednesday
    // will ask for adjust number on tuesday
    const tuesday = moment('2020-08-18');
    const tuesdayAdjust = getHolidaysAdjust(tuesday);
    expect(tuesdayAdjust).toBe(1);
    // cron run on tuesday, process ir run for monday
    // will ask for adjust number on sunday
    const sunday = moment('2020-08-16');
    const sundayAdjust = getHolidaysAdjust(sunday);
    expect(sundayAdjust).toBe(3);
  })

  it('should test if day is holiday', () => {
    process.env.HOLIDAYS = '18-08';
    const pseudoHoliday = moment('2020-08-18');
    const isHoliday = getHolidaysAdjust(pseudoHoliday);
    expect(isHoliday).toBeGreaterThan(1);
    const notAHoliday = moment('2020-08-17') // monday
    const adjust = getHolidaysAdjust(notAHoliday);
    expect(adjust).toBe(1);
  })
})