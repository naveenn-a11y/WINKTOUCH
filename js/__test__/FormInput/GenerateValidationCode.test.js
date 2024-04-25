const {generateValidationCode} = require('../../Helper/FormHelper');
jest.mock('./../../Strings', () => jest.fn());

describe('FormInput', () => {
  it('should generate validation error message for maxLength', () => {
    const props = {
      value: 'test value',
      definition: {name: 'test', type: 'text', maxLength: 5, maxLengthError: 'Max length exceeded'},
      onChangeValue: jest.fn(),
    };
    const sampleString = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde';
    expect(generateValidationCode(sampleString, props.definition)).toEqual(props.definition.maxLengthError);
  });
});
