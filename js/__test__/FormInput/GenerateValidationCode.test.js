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

  //   it('should generate validation error message for minLength', () => {
  //     const props = {
  //       value: 'test',
  //       definition: {name: 'test', type: 'text', minLength: 5, minLengthError: 'Min length not met'},
  //       onChangeValue: jest.fn(),
  //     };
  //     const {container} = render(<FormInput {...props} />);
  //     const instance = container.firstChild._instance;
  //     const result = instance.generateValidationCode(props.value, props.definition);
  //     expect(result).toEqual('Min length not met');
  //   });
});
