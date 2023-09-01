jest.mock('@google-cloud/storage');
import { transformToRange } from "./movements.controller";

describe('transform to range test', () => {
  it('should return date with hours', () => {
    const { startDate, endDate } = transformToRange({ startDate: '2020-10-08', endDate: '2020-10-08' });
    expect(startDate).toBe('2020-10-08 03:00:00');
    expect(endDate).toBe('2020-10-09 02:59:59');
  })
})