import React, {useState, useEffect} from 'react';
import {ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile} from './Widgets';
import {strings} from './Strings';
import {styles} from './Styles';
import {formatDate, formatHour, formatTime, now, time24Format} from './Util';
import {CustomModal as Modal} from './utilities/Modal';
import {
  generateFractions,
  combinedValue,
  splitValue,
  convertTime,
  convertTo24HourTime,
  convertToAMPMTime,
  processTimeString,
} from './TimeFieldHelpers';

interface TimeFieldProps {
  value?: string;
  onChangeValue: (value: string) => void;
  label?: string;
  readonly?: boolean;
  past?: boolean;
  future?: boolean;
  isTyping?: boolean;
  style?: React.CSSProperties | React.CSSProperties[];
  prefix?: string;
  suffix?: string;
  onBlur?: () => void;
  testID?: string;
}

export const TimeField = ({
  value,
  onChangeValue,
  label,
  readonly = false,
  past = false,
  future = false,
  isTyping: propIsTyping,
  style,
  prefix,
  suffix,
  onBlur,
  testID,
}: TimeFieldProps) => {
  const fractions = generateFractions({past, future});
  const [isActive, setIsActive] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFreestyleTyping, setIsFreestyleTyping] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const [rawValue, setRawValue] = useState(value);
  const [prevPropsValue, setPrevPropsValue] = useState('');
  const [prevRawValue, setPrevRawValue] = useState('');
  const [prevEditedValue, setPrevEditedValue] = useState('');
  const [formattedText, setFormattedText] = useState('');

  const formatValue = ()=> {
    let updatedFormattedText = '';

    if (!editedValue) {
      updatedFormattedText = '';
    }

    const time24Regex = /\b([01][0-9]|2[0-3]):([0-5][0-9])\b/;
    const time12Regex = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM)\b/i;

    // check if the editedValue contains a 24 hour time. if it does, replace
    // it with a 12 hour time; however, be sure to leave any non time text as is:
    // 10:10 -> 10:10 AM, 13:10 -> 1:10 PM, 00:10 -> 12:10 AM, 23:10 -> 11:10 PM
    // 10:10 abc -> 10:10 AM abc, 13:10 abc -> 1:10 PM abc, 00:10 abc -> 12:10 AM abc, 23:10 abc -> 11:10 PM abc
    let combinedEditedValue = Array.isArray(editedValue) ? combinedValue(editedValue) : editedValue;
    combinedEditedValue = combinedEditedValue ?? '';
    combinedEditedValue = processTimeString(combinedEditedValue)


    const twentyFourHourTimeA = combinedEditedValue.match(time24Regex);
    const remaining24HourTextA = combinedEditedValue.replace(time24Regex, '');
    if (twentyFourHourTimeA) {
      updatedFormattedText = convertTime(twentyFourHourTimeA[0]) + remaining24HourTextA;
    } else {
      updatedFormattedText = combinedEditedValue;
    }

    let updatedRawValue = '';

    if (!editedValue) {
      updatedRawValue = '';
    }

    if (updatedFormattedText === '') {
      updatedRawValue = '';
    }

    // check the editedValue for a 24 hour time
    // if it contains a 24 hour time, leave it as
    // if editedValue contains a 12 hour time, convert it to 24 hour time
    // if there is text after the 12 hour time, ensure it remains

    const twentyFourHourTimeB = combinedEditedValue.match(time24Regex);
    if (twentyFourHourTimeB) {
      updatedRawValue = combinedEditedValue
    }
    const twelveHourTimeB = combinedEditedValue.match(time12Regex);
    const remaining12HourTextB = combinedEditedValue.replace(time12Regex, '');
    if (twelveHourTimeB) {
      updatedRawValue = convertTo24HourTime(twelveHourTimeB[0]) + remaining12HourTextB;
    }
    console.log('formatValue', updatedFormattedText, updatedRawValue, combinedEditedValue);
    setFormattedText(updatedFormattedText);
    setRawValue(updatedRawValue);
    setPrevEditedValue(combinedEditedValue);
  }

  useEffect(() => {
    if (value !== prevPropsValue && !isActive) {
      setEditedValue(value);
      setPrevPropsValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (rawValue !== prevRawValue) {
      formatValue();
      setPrevRawValue(rawValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue]);

  useEffect(() => {
    if (editedValue !== prevEditedValue) {
      formatValue();
      setPrevEditedValue(editedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedValue]);

  const startEditing = () => {
    if (readonly) return;
    setIsActive(true);
    setIsDirty(false);
    setEditedValue(splitValue(value, fractions));
  };

  const startTyping = () => {
    if (readonly) return;
    setIsActive(false);
    setIsFreestyleTyping(true);
    setEditedValue(editedValue);
    setIsDirty(true);
  };

  const commitEdit = (nextFocusField) => {
    setIsActive(false);
    setIsFreestyleTyping(false);
    onChangeValue(rawValue);
  };

  const cancelEdit = () => {
    setIsActive(false);
    setIsFreestyleTyping(false);
    setEditedValue(editedValue);
  };

  const clearValue = () => {
    setEditedValue('');
    setRawValue('');
    setIsActive(false);
    onChangeValue('');
  };

  const commitNow = (offset) => {
    let time = now();
    if (offset) {
      const minutes = parseInt(offset, 10);
      time.setMinutes(time.getMinutes() + minutes);
    }
    const newValue = formatDate(time, time24Format);
    setEditedValue(newValue);
    // Use the current editedValue to calculate the new rawValue
    const newRawValue = convertTo24HourTime(convertToAMPMTime(newValue));
    setIsActive(false);
    onChangeValue(newRawValue);
  };

  const updateValue = (column, newColumnValue) => {
    if (column < 4) {
      setEditedValue((prev) => {
        const updated = Array.isArray(prev) ? [...prev] : splitValue(prev, fractions);
        updated[column] = newColumnValue === updated[column] ? undefined : newColumnValue;
        if (column < 4) {
          updated[column % 2 === 0 ? column + 1 : column - 1] = undefined;
        }
        return updated;
      });
      setIsDirty(true);
    }

    if (column === 4) commitNow(newColumnValue);
  };

  const renderPopup = () => {
    return (
      <TouchableWithoutFeedback>
        <View style={styles.popupBackground}>
          <ScrollView horizontal={false}>
            <Text style={styles.modalTitle}>
              {label}: {formatTime(isDirty ? combinedValue(editedValue) : value)}
            </Text>
            <ScrollView horizontal={true} scrollEnabled={true}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options, column) => (
                  <View style={styles.modalColumn} key={column}>
                    {options.map((option, row) => {
                      const formattedOption = column < 2 ? formatHour(option) : option;
                      const isSelected = editedValue[column] === option;
                      return (
                        <TouchableOpacity key={row} onPress={() => updateValue(column, option)}>
                          <View style={isSelected ? styles.popupTileSelected : styles.popupTile}>
                            <Text style={isSelected ? styles.modalTileLabelSelected : styles.modalTileLabel}>
                              {formattedOption}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
                <View style={styles.modalColumn}>
                  {!future && (
                    <TouchableOpacity onPress={() => commitNow(0)}>
                      <View style={styles.popupTile}>
                        <Text style={styles.modalTileLabel}>{strings.now}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <UpdateTile commitEdit={commitEdit} />
                  <ClearTile commitEdit={clearValue} />
                  <RefreshTile commitEdit={cancelEdit} />
                  <KeyboardTile commitEdit={startTyping} />
                </View>
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const handleKeyPress = (input) => {
    setIsDirty(true);
  };

  const handleBlur = (input) => {
    if (isDirty && (propIsTyping || isFreestyleTyping)) {
      const newValue = input?.target?.value ?? rawValue;
      onChangeValue(newValue);
      if (onBlur) {
        onBlur();
      }
    }
  };

  const handleChangeValue = (newValue) => {
    if (!propIsTyping && !isFreestyleTyping) {
      setEditedValue(newValue);
      onChangeValue(rawValue);
    }
  };

  const fieldStyle = style ? style : styles.formField;

  if (readonly) {
    return (
      <View style={styles.fieldFlexContainer}>
        <Text style={style}>
          {prefix}
          {formattedText}
          {suffix}
        </Text>
      </View>
    );
  }

  if (propIsTyping || isFreestyleTyping) {
    return (
      <TextField
        testID={testID}
        prefix={prefix}
        value={formattedText}
        suffix={suffix}
        autoFocus
        style={fieldStyle}
        onChangeValue={handleChangeValue}
        title={label}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
      />
    );
  }

  return (
    <View style={styles.fieldFlexContainer}>
      <TouchableOpacity style={styles.fieldFlexContainer} onPress={startEditing} disabled={readonly}>
        <Text style={style}>{formattedText}</Text>
      </TouchableOpacity>
      {isActive && (
        <Modal visible={isActive} transparent={true} animationType={'slide'} onRequestClose={cancelEdit}>
          {renderPopup()}
        </Modal>
      )}
    </View>
  );
};

TimeField.defaultProps = {
  readonly: false,
  past: false,
  future: false,
};