import { generateRandomGUID, generateRandomNumber } from "../../Helper/GenerateRandomId";

describe('generateRandomGUID', () => {
  it('returns a string', () => {
    expect(typeof generateRandomGUID()).toBe('string');
  });

  it('returns a valid UUID v4', () => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(regex.test(generateRandomGUID())).toBe(true);
  });
});

describe('generateRandomNumber', () => {
  it('returns a number', () => {
    expect(typeof generateRandomNumber()).toBe('number');
  });

  it('returns a number with the specified length', () => {
    const length = 6;
    const number = generateRandomNumber(length);
    expect(number.toString().length).toBe(length);
  });

  it('returns a number with a default length of 4', () => {
    const number = generateRandomNumber();
    expect(number.toString().length).toBe(4);
  });
});