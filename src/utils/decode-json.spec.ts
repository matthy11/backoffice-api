import { decodeJsonFields } from "./decode-json";

describe('DecodeJsonFields', () => {
  it('should decode a object with just one level', () => {
    const object = { a: 'hol%20a', b: 'cha%20%C3%B3', c: 1 }
    const result = decodeJsonFields(object);
    expect(result).toStrictEqual({ a: 'hol a', b: 'cha ó', c: 1 });
  });

  it('should decode a object with more than 1 nested element', () => {
    const object = {
      a: 'hol%20a',
      b: 'cha%20%C3%B3',
      c: 1,
      d: {
        e: 'hola',
        f: {
          g: 'cha%20%C3%B3'
        }
      }
    };
    const result = decodeJsonFields(object);
    expect(result).toStrictEqual({ a: 'hol a', b: 'cha ó', c: 1, d: { e: 'hola', f: { g: 'cha ó' } } });
  });

  it('should have no problems with arrays', () => {
    const object = { a: [1, '2'], b: 'cha%20%C3%B3', c: 1 };
    const result = decodeJsonFields(object);
    expect(result).toStrictEqual({ a: [1, '2'], b: 'cha ó', c: 1 });
  })

  it('should ignore nulls and undefined', () => {
    const object = { a: 'hol%20a', b: 1, c: null, d: undefined };
    const result = decodeJsonFields(object);
    expect(result).toStrictEqual({ a: 'hol a', b: 1, c: null, d: undefined });
  })

  it('should return same object if null, undefined or Array', () => {
    const nullEl = null;
    const undefinedEl = undefined;
    const arrayEl = [1, '2'];
    expect(decodeJsonFields(nullEl)).toBe(null);
    expect(decodeJsonFields(undefinedEl)).toBe(undefined);
    expect(decodeJsonFields(arrayEl)).toStrictEqual([1, '2']);
  })
})