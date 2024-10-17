export const convertTime = (inputString, to24Hour = false) => {
  if (!inputString) return '';

  const ampmRegex = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)\b/gi;
  const time24Regex = /\b([01][0-9]|2[0-3]):([0-5][0-9])\b/g;

  if (to24Hour) {
    return inputString.replace(ampmRegex, (match, hours, minutes, period) => {
      hours = parseInt(hours, 10);
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      else if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    });
  } else {
    return inputString.replace(time24Regex, (match, hours, minutes) => {
      hours = parseInt(hours, 10);
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
      else if (hours === 0) hours = 12;
      return `${hours}:${minutes} ${period}`;
    });
  }
};

export const convertToAMPMTime = (inputString) => {
  const timeRegex = /\b([01][0-9]|2[0-3]):([0-5][0-9])\b/g;

  if (!inputString) {
    return '';
  }

  return inputString.replace(timeRegex, (match, hours, minutes) => {
    hours = parseInt(hours, 10);
    let period = 'AM';

    if (hours >= 12) {
      period = 'PM';
      if (hours > 12) {
        hours -= 12;
      }
    }

    if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${minutes} ${period}`;
  });
}

export const convertTo24HourTime = (inputString) => {
  const timeRegex = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)\b/gi;

  if (!inputString) {
    return '';
  }

  return inputString.replace(timeRegex, (match, hours, minutes, period) => {
    hours = parseInt(hours, 10);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });
}

export const generateFractions = (props) => {
  return [
    ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
    ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    [':00', ':10', ':20', ':30', ':40', ':50'],
    [':05', ':15', ':25', ':35', ':45', ':55'],
    props.past
      ? props.future
        ? [
            '+15 min',
            '+10 min',
            '+5 min',
            '+1 min',
            '-1 min',
            '-5 min',
            '-10 min',
            '-15 min',
          ]
        : ['-1 min', '-5 min', '-10 min', '-15 min', '-30 min']
      : ['+1 min', '+5 min', '+10 min', '+15 min', '+30 min'],
  ];
};

export const splitValue = (value, fractions) => {
  if (!value || value.length < 5) return [];

  const hour = value.substring(0, 2) + ':00';
  const minute = ':' + value.substring(3, 5);

  return [
    fractions[0].includes(hour) ? hour : undefined,
    fractions[0].includes(hour) ? undefined : hour,
    fractions[2].includes(minute) ? minute : undefined,
    fractions[2].includes(minute) ? undefined : minute,
    undefined,
  ];
};

export const combinedValue = (editedValue) => {
  if (typeof editedValue === 'string') {
    return editedValue;
  }

  const hour = editedValue[0] || editedValue[1];
  if (!hour) return undefined;

  const minute = editedValue[2] || editedValue[3];
  return hour.substring(0, 2) + minute;
};

export const convertToHHMM = (timeString) => {
  // Check if the input is a valid string
  if (typeof timeString !== 'string' || timeString.trim() === '') {
    return '';
  }

  // Use a regular expression to match the hh:mm:ss format
  const match = timeString.match(/^(\d{1,2}):(\d{2}):\d{2}$/);

  // If the input doesn't match the expected format, return the original string
  if (!match) {
    return timeString;
  }

  // Extract hours and minutes
  const [, hours, minutes] = match;

  // Pad hours with a leading zero if necessary
  const paddedHours = hours.padStart(2, '0');

  // Return the formatted hh:mm string
  return `${paddedHours}:${minutes}`;
}

export const processTimeString = (inputString) => {
  // Regular expression to match HH:MM:SS format with optional text after
  const regex = /^(\d{1,2}:\d{2}:\d{2})(.*)$/;
  const match = inputString.match(regex);

  if (match) {
    // If there's a match, we have HH:MM:SS format
    const [, timepart, textpart] = match;
    const convertedTime = convertToHHMM(timepart);
    return convertedTime + textpart; // Append any text that was after the time
  } else {
    // If no match, return the original string
    return inputString;
  }
}
