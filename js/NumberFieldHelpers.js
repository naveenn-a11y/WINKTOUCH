
import { formatDecimals } from './Util';
import { formatAllCodes, formatCodeDefinition } from './Codes';

export const generateFractions = (props) => {
  if (
    props.groupSize !== undefined &&
    props.groupSize !== 0 &&
    props.range?.[1] &&
    props.range?.[1] / props.groupSize > 40
  ) {
    return undefined;
  }
  let fractions = [[], [], [], [], []];
  if (!props.range) {
    return fractions;
  }
  //sign + -
  if (props.range[0] < 0) {
    if (props.range[1] <= 0) {
      fractions[0].push('-');
    } else {
      fractions[0].push('+', '-');
    }
  }
  //integer group
  if (
    props.groupSize != undefined &&
    props.groupSize > 1 &&
    (props.range?.[0] < -props.groupSize || props.range?.[1] > props.groupSize)
  ) {
    let minGroup = Math.abs(props.range?.[0]);
    let maxGroup = Math.abs(props.range?.[1]);
    if (minGroup > maxGroup) {
      let c = maxGroup;
      maxGroup = minGroup;
      minGroup = c;
    }
    if (props.range?.[0] < 0 && props.range?.[1] > 0) {
      minGroup = 0;
    }
    minGroup = minGroup - (minGroup % props.groupSize);
    if (minGroup < props.groupSize) {
      minGroup = props.groupSize;
    }

    for (let i = minGroup; i <= maxGroup; i += props.groupSize) {
      fractions[1].push(String(i));
    }
  }
  //integer
  let minInt = 0;
  if (props.range?.[0] < 0 && props.range?.[1] > 0) {
    //Range includes 0
    minInt = 0;
  } else {
    //All positive or All negative range
    if (props.groupSize > 1) {
      //Grouped range
      if (props.range?.[0] >= 0) {
        //Only positive range
        if (props.groupSize > props.range?.[1]) {
          //Unused group size
          minInt = props.range?.[0];
        }
      } else {
        //Only negative range
        if (props.groupSize > -props.range?.[0]) {
          //Unused group size
          minInt = -props.range?.[1];
        }
      }
    } else {
      //All positive or negative with no group
      if (props.range?.[0] >= 0) {
        //Only positive range
        minInt = props.range?.[0];
      } else {
        //Only negative range
        minInt = -props.range?.[1];
      }
    }
  }
  let maxInt =
    props.groupSize > 1
      ? Math.min(
          Math.max(Math.abs(props.range?.[0]), Math.abs(props.range?.[1])),
          props.groupSize - 1,
        )
      : props.range?.[1];
  if (props.stepSize instanceof Array) {
    let c = 0;
    for (let i = minInt; i <= maxInt; c++) {
      fractions[2].push(String(i));
      let stepSize =
        props.stepSize[Math.min(props.stepSize.length - 1, c)];
      i = i + Math.max(1, stepSize);
    }
  } else {
    for (let i = minInt; i <= maxInt; ) {
      fractions[2].push(String(i));
      i = i + Math.max(1, props.stepSize);
    }
  }
  //decimals .25
  if (
    props.decimals != undefined &&
    props.decimals > 0 &&
    hasDecimalSteps(props)
  ) {
    for (let i = 0; i < 1; i += props.stepSize) {
      let formattedDecimals =
        props.decimals && props.decimals > 1
          ? Number(i).toFixed(props.decimals)
          : String(i);
      formattedDecimals = Number(
        Math.round(formattedDecimals + 'e' + props.decimals) +
          'e-' +
          props.decimals,
      );
      if (formattedDecimals >= 1) {
        continue;
      }
      formattedDecimals = formattedDecimals
        .toFixed(props.decimals)
        .toString();

      fractions[3].push(
        formattedDecimals.length > 1
          ? formattedDecimals.substring(1)
          : formattedDecimals,
      );
    }
  }
  
  //Clear Button
  fractions[4].push('\u2715');
  //Refresh Button
  fractions[4].push('\u27f3');
  //Keyboard Button
  if (props.freestyle === true) {
    fractions[4].push('\u2328');
  }
  //Options
  if (props.options) {
    if (props.options instanceof Array) {
      for (var i = 0; i < props.options.length; i++) {
        fractions[4].push(formatCodeDefinition(props.options[i]));
      }
    } else {
      fractions[4].push(...formatAllCodes(props.options));
    }
  }
  //Suffix
  if (props.suffix != undefined) {
    if (props.suffix instanceof Array) {
      fractions[4].push(...props.suffix);
    } else if (props.suffix.includes('Code')) {
      fractions[4].push(...formatAllCodes(props.suffix));
    }
  }

  return fractions;
};

const hasDecimalSteps = (props) => {
  if (Array.isArray(props.stepSize)) {
    return props.stepSize.length > 0 && props.stepSize[0] && props.stepSize[0] < 1;
  }
  return props.stepSize && props.stepSize < 1;
};

export const splitValue = (props, value, fractions) => {
  const originalValue = value;
  if (value === undefined || value === null) {
    return [undefined, undefined, undefined, undefined, undefined, undefined];
  }
  if (props.prefix && props.prefix !== '+' && value instanceof String) {
    if (value?.startsWith(props.prefix)) {
      value = value.substring(props.prefix.length);
    }
  }
  let suffix;
  if (
    props.suffix !== undefined &&
    value.toLowerCase &&
    fractions && 
    Array.isArray(fractions) && 
    fractions[5] !== undefined
  ) {
    const lowercaseValue = value.toLowerCase();
    const updatedSuffix = fractions[5].find((fraction) => lowercaseValue.endsWith(fraction.toLowerCase()));
    if (!updatedSuffix) return [undefined, originalValue];

    const numericPart = value.slice(0, -updatedSuffix.length);
    if (numericPart === '') return [undefined, undefined, undefined, undefined, undefined, updatedSuffix];

    const parsedValue = parseFloat(numericPart);
    if (isNaN(parsedValue)) return [undefined, undefined, undefined, undefined, undefined, originalValue];

    return [parsedValue, updatedSuffix];
  }
  if (typeof value === 'string') {
    value = parseFloat(value);
    if (isNaN(value)) {
      return [undefined, undefined, undefined, undefined, undefined, undefined];
    }
  }
  let sign =
    value < 0
      ? '-'
      : props.prefix != undefined && props.prefix.endsWith('+')
      ? '+'
      : undefined;
  value = Math.abs(value);
  let groupPart =
    props.groupSize != undefined && props.groupSize > 0
      ? props.groupSize * Math.floor(value / props.groupSize)
      : 0;
  let intPart = Math.floor(value - groupPart);
  let decimals =
    hasDecimalSteps(props) && suffix === undefined
      ? formatDecimals(value - groupPart - intPart, props.decimals)
      : undefined;
  const splittedValue = [
    sign,
    props.groupSize != undefined &&
    props.groupSize > 0 &&
    groupPart > 0
      ? groupPart.toString()
      : undefined,
    intPart.toString(),
    decimals,
    suffix,
    undefined,
  ];
  return splittedValue;
};

export const calculateCombinedValue = (state, props) => {
  // if state.editedValue is a string return it as is
  if (typeof state.editedValue === 'string') {
    return state.editedValue;
  }
  if (state.fractions === undefined) {
    const value = Number.parseFloat(state.editedValue);
    if (isFinite(value)) {
      return value;
    }
    return state.editedValue;
  }
  if (state.editedValue.every(val => val === undefined)) {
    return undefined;
  }
  let updatedCombinedValue;
  if (state.editedValue.slice(0, 4).some(val => val !== undefined)) {
    updatedCombinedValue = 0;
    for (let i = 1; i < 4; i++) {
      if (state.editedValue[i] !== undefined) {
        updatedCombinedValue += Number(state.editedValue[i]);
      }
    }
    if (
      state.editedValue[0] === '-' ||
      (updatedCombinedValue !== 0 && props.range?.[1] <= 0)
    ) {
      updatedCombinedValue = -updatedCombinedValue;
    }
    updatedCombinedValue = Math.max(props.range?.[0], Math.min(updatedCombinedValue, props.range?.[1]));
  }
  let suffix;
  if (state.editedValue[4] !== undefined) {
    if (props.options) {
      const option = state.editedValue[4];
      if (Array.isArray(props.options)) {
        if (props.options.includes(option)) {
          return option;
        }
      } else {
        if (formatAllCodes(props.options).includes(option)) {
          return option;
        }
      }
    }
    if (
      Array.isArray(props.suffix) ||
      props.suffix.includes('Code')
    ) {
      suffix = state.editedValue[4];
      if (['\u2714', '\u2715', '\u2328', '\u27f3'].includes(suffix)) {
        suffix = undefined;
      }
    }
  }
  const unit = props.unit !== undefined ? props.unit : '';
  if (suffix) {
    let formattedValue =
      updatedCombinedValue === undefined
        ? ''
        : props.decimals && props.decimals > 0
        ? Number(updatedCombinedValue).toFixed(props.decimals)
        : String(updatedCombinedValue);
    return formattedValue + unit + suffix;
  }
  return (updatedCombinedValue !== undefined ? updatedCombinedValue : '') + unit;
};
