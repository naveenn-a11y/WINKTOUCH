import { generateRandomGUID } from "../../Helper/GenerateRandomId";

describe('generateRandomGUID', () => {
  it('returns a string', () => {
    expect(typeof generateRandomGUID()).toBe('string');
  });

  it('returns a valid UUID v4', () => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(regex.test(generateRandomGUID())).toBe(true);
  });
});