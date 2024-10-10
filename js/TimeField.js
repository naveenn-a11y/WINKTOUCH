import React, {useState, useCallback, useEffect} from 'react';
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
  const [rawValue, setRawValue] = useState('');
  const [formattedText, setFormattedText] = useState('');

  useEffect(() => {
    const timeValue = Array.isArray(editedValue) ? combinedValue(editedValue) : String(editedValue);
    const timeAfterFormat = convertTime(timeValue);
    setFormattedText(timeAfterFormat);
    setRawValue(convertTime(timeAfterFormat, true));
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
  };

  const commitEdit = useCallback(
    (nextFocusField) => {
      setIsActive(false);
      setIsFreestyleTyping(false);
      handleChangeValue(rawValue);
    },
    [handleChangeValue, rawValue],
  );

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
    setEditedValue((prev) => {
      const updated = Array.isArray(prev) ? [...prev] : splitValue(prev, fractions);
      updated[column] = newColumnValue === updated[column] ? undefined : newColumnValue;
      if (column < 4) {
        updated[column % 2 === 0 ? column + 1 : column - 1] = undefined;
      }
      return updated;
    });
    setIsDirty(true);
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

  const handleBlur = () => {
    if (propIsTyping || isFreestyleTyping) {
      onChangeValue(rawValue);
      if (onBlur) {
        onBlur();
      }
    }
  };

  const handleChangeValue = useCallback(
    (newValue) => {
      setEditedValue(newValue);
      if (!propIsTyping && !isFreestyleTyping) {
        onChangeValue(rawValue);
      }
    },
    [isFreestyleTyping, onChangeValue, propIsTyping, rawValue],
  );

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
