import {strings} from '../Strings';

export function generateValidationCode(value, definition) {
  if (definition === undefined) {
    return undefined;
  }
  let validation: string = '';
  let validationError: string = '';

  const otherValidation = definition.validation

  if(!!otherValidation) {
    eval(otherValidation + ';\n'); //NOSONAR
  }

  if (definition.validation !== undefined && definition.validation !== null) {
    validation = validation + definition.validation + ';\n';
  }
  if (definition.maxLength && definition.maxLength > 0) {
    if (value.length > definition.maxLength) {
      validationError = definition.maxLengthError ? definition.maxLengthError : strings.maxLengthError;
    }
  }
  if (definition.minLength && definition.minLength > 0) {
    if (value.length < definition.minLength) {
      validationError = definition.minLengthError ? definition.minLengthError : strings.minLengthError;
    }
  }
  if (definition.required === true) {
    if (value === undefined || value == null || value.trim().length === 0) {
      validationError = definition.requiredError ? definition.requiredError : strings.requiredError;
    }
  }
  return validationError;
}
