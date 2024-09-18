export const isArrayOfStrings = (arr) => Array.isArray(arr) && arr.every((item) => typeof item === 'string');

export const removeDuplicates = (arr) => [...new Set(arr)];

export const findDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);

export const logDuplicates = (codeName, duplicates) => {
  if (duplicates.length > 0 && __DEV__) {
    console.log(`Duplicate codes found in ${codeName}: ${duplicates}`);
  }
};

export const processCodes = (codeName, codes) =>
  isArrayOfStrings(codes) ? (logDuplicates(codeName, findDuplicates(codes)), removeDuplicates(codes)) : codes;

export const processDuplicatesInTranslatedCodes = (translatedCodeDefinitions) =>
  Object.fromEntries(
    Object.entries(translatedCodeDefinitions).map(([codeName, codes]) => [codeName, processCodes(codeName, codes)]),
  );
