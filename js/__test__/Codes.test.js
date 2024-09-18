import { isArrayOfStrings, removeDuplicates, findDuplicates, logDuplicates, processCodes, processDuplicatesInTranslatedCodes } from '../CodesUtils';

describe('isArrayOfStrings', () => {
  it('should return true if the input is an array of strings', () => {
    expect(isArrayOfStrings(['a', 'b', 'c'])).toBe(true);
  });

  it('should return false if the input is not an array of strings', () => {
    expect(isArrayOfStrings(['a', 'b', 1])).toBe(false);
  });
});

describe('removeDuplicates', () => {
  it('should remove duplicates from the array', () => {
    expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('findDuplicates', () => {
  it('should return duplicates from the array', () => {
    expect(findDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a']);
  });
});

describe('logDuplicates', () => {
  it('should log duplicates', () => {
    const spy = jest.spyOn(console, 'log');
    global.__DEV__ = true; // Ensure __DEV__ is true for this test
    logDuplicates('codeName', ['a', 'b']);
    expect(spy).toHaveBeenCalledWith('Duplicate codes found in codeName: a,b');
    spy.mockRestore();
  });
});

describe('processCodes', () => {
  it('should process codes', () => {
    expect(processCodes('codeName', ['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('processDuplicatesInTranslatedCodes', () => {
  it('should process duplicates in translated codes', () => {
    const translatedCodeDefinitions = {
      codeName: ['a', 'b', 'a', 'c'],
    };
    expect(processDuplicatesInTranslatedCodes(translatedCodeDefinitions)).toEqual({ codeName: ['a', 'b', 'c'] });
  });
});
