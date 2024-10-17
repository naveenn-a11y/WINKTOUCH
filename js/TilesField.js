import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile, FocusTile } from './Widgets';
import { styles } from './Styles';
import { postfix, split } from './Util';
import { CustomModal as Modal } from './utilities/Modal';

interface TilesFieldProps {
  value?: string[] | string;
  label?: string;
  prefix?: string[] | string;
  suffix?: string[] | string;
  options: (string[] | string)[];
  combineOptions?: boolean;
  freestyle?: boolean;
  multiline?: boolean;
  width?: number;
  readonly?: boolean;
  style?: React.CSSProperties;
  multiValue?: boolean;
  containerStyle?: React.CSSProperties;
  onChangeValue?: (value: string[] | string) => void;
  transferFocus?: {
    previousField?: string;
    nextField?: string;
    onTransferFocus?: () => void;
  };
  testID?: string;
  isTyping?: boolean;
  isPrism?: boolean;
  hideClear?: boolean;
  onBlur?: () => void;
}

export const TilesField = ({
  value,
  label,
  prefix,
  suffix,
  options,
  combineOptions,
  freestyle,
  multiline,
  width,
  readonly,
  style,
  containerStyle,
  onChangeValue,
  transferFocus,
  testID,
  isTyping: propIsTyping,
  isPrism,
  hideClear,
  onBlur,
}: TilesFieldProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isFreestyleTyping, setIsFreestyleTyping] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const [rawValue, setRawValue] = useState(value);
  const [prevPropsValue, setPrevPropsValue] = useState('');
  const [prevRawValue, setPrevRawValue] = useState('');
  const [prevEditedValue, setPrevEditedValue] = useState('');
  const [formattedText, setFormattedText] = useState('');

  const formatValue = () => {
    const updatedRawValue = editedValue;
    const updatedFormattedText = format(updatedRawValue);
    setFormattedText(updatedFormattedText);
    setRawValue(updatedRawValue);
    setPrevEditedValue(editedValue);
    if (onChangeValue) {
      onChangeValue(updatedRawValue);
    }
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


  const isUndefinedArray = (arr) => {
    // return true if array is an array and each element is undefined
    return arr instanceof Array && arr.every((element) => element === undefined);
  };

  const startEditing = () => {
    if (readonly) return;
    setIsActive(true);
    setIsDirty(false);
    const updatedValue = isUndefinedArray(value) ? '' : value;
    setEditedValue(combineOptions ? split(updatedValue ?? '', options) : updatedValue);
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
    if (nextFocusField != undefined && transferFocus) {
      transferFocus.onTransferFocus(nextFocusField);
    }
  };

  const cancelEdit = () => {
    setIsActive(false);
    setIsFreestyleTyping(false);
    setEditedValue(value);
  };

  const clearValue = () => {
    setEditedValue('');
    setRawValue('');
    setIsActive(false);
    onChangeValue('');
  };

  const getEditedColumnValue = (columnIndex) => {
    if (isMultiColumn()) {
      if (editedValue === undefined || editedValue.length <= columnIndex) {
        return undefined;
      }
      return editedValue[columnIndex];
    }
    return editedValue;
  };

  const updateValue = (newValue: string, columnIndex: number) => {
    let editedColumnValue = getEditedColumnValue(columnIndex);
    if (newValue === editedColumnValue) {
      newValue = undefined;
    }
    if (isMultiColumn()) {
      let updatedEditedValue = editedValue instanceof Array ? [...editedValue] : options.map(() => undefined);
      while (updatedEditedValue.length <= columnIndex) {
        updatedEditedValue.push(undefined);
      }
      updatedEditedValue[columnIndex] = newValue;
      if (updateConfirm()) {
        setEditedValue(updatedEditedValue);
      } else {
        setEditedValue(updatedEditedValue);
        commitEdit();
      }
    } else {
      if (updateConfirm()) {
        setEditedValue(newValue);
      } else {
        setEditedValue(newValue);
        commitEdit();
      }
    }
    setIsDirty(true);
  };

  const sumArray = (arr) => {
    return arr.reduce((a, b) => {
      let rightIndex = (a === undefined) ? 0 : Number(a);
      let leftIndex = (b === undefined) ? 0 : Number(b);
      return rightIndex + leftIndex;
    });
  };

  const format = (inputValue) => {
    if (inputValue === undefined || inputValue === null || inputValue === '') {
      return '';
    }
    let formattedValue = '';
    if (isPrism && inputValue instanceof Array && inputValue.length === 8) {
      let prismSumA = sumArray([inputValue[0], inputValue[1], inputValue[2]]);
      let suffixA = inputValue[3] !== undefined ? `${inputValue[3]} ` : '';
      let prismSumB = sumArray([inputValue[4], inputValue[5], inputValue[6]]);
      let suffixB = inputValue[7] !== undefined ? inputValue[7] : '';

      formattedValue = `${(prismSumA === 0) ? '' : prismSumA} ${suffixA}${(prismSumB === 0) ? '' : prismSumB} ${suffixB}`;
    } else if (inputValue instanceof Array) {
      inputValue.forEach((columnValue, columnIndex) => {
        if (columnValue !== undefined) {
          if (prefix !== undefined && prefix !== null && prefix.length > columnIndex && prefix[columnIndex] !== undefined) {
            formattedValue += prefix[columnIndex];
          }
          if (columnValue !== undefined && columnValue !== null) {
            formattedValue += columnValue;
          }
          if (suffix !== undefined && suffix !== null && suffix.length > columnIndex && suffix[columnIndex] !== undefined) {
            formattedValue += suffix[columnIndex];
          }
        }
      });
    } else {
      if (prefix != undefined && !isMultiColumn()) {
        formattedValue += prefix;
      }
      if (inputValue !== undefined && inputValue !== null) {
        formattedValue += inputValue.toString();
      }
      if (suffix != undefined && !isMultiColumn()) {
        formattedValue += suffix;
      }
    }
    return formattedValue;
  };

  const isMultiColumn = () => {
    return options != undefined && options[0] instanceof Array;
  };

  const updateConfirm =() => {
    return transferFocus !== undefined || isMultiColumn();
  }

  const renderPopup = () => {
    let allOptions = isMultiColumn() ? options : [options];
    return (
      <TouchableWithoutFeedback
        onPress={commitEdit}
        accessible={false}
        testID="popupBackground">
        <View style={styles.popupBackground}>
          <ScrollView horizontal={false}>
            <Text style={styles.modalTitle}>
              {postfix(label, ': ')}
              {format(editedValue)}
            </Text>
            <FocusTile
              type="previous"
              commitEdit={commitEdit}
              transferFocus={transferFocus}
            />
            <FocusTile
              type="next"
              commitEdit={commitEdit}
              transferFocus={transferFocus}
            />
            <ScrollView horizontal={allOptions.length > 3}>
              <Pressable onPress={commitEdit}>
                <View style={styles.flexColumnLayout}>
                  <View style={styles.centeredRowLayout}>
                    {allOptions.map((newOptions, columnIndex) => (
                      <View style={styles.modalColumn} key={columnIndex}>
                        {newOptions.map((option, rowIndex) => {
                          let isSelected = isMultiColumn()
                            ? editedValue[columnIndex] === option
                            : editedValue === option;
                          return (
                            <TouchableOpacity
                              key={rowIndex}
                              onPress={() => updateValue(option, columnIndex)}
                              testID={
                                'option' +
                                (isMultiColumn()
                                  ? columnIndex + 1 + ',' + (rowIndex + 1)
                                  : rowIndex + 1)
                              }>
                              <View
                                style={
                                  isSelected
                                    ? styles.popupTileSelected
                                    : styles.popupTile
                                }>
                                <Text
                                  style={
                                    isSelected
                                      ? styles.modalTileLabelSelected
                                      : styles.modalTileLabel
                                  }>
                                  {option}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        {allOptions.length === 1 && !hideClear && (
                          <ClearTile commitEdit={clearValue} />
                        )}
                        {allOptions.length === 1 && freestyle === true && (
                          <KeyboardTile commitEdit={startTyping} />
                        )}
                      </View>
                    ))}
                    {allOptions.length > 1 && !hideClear && (
                      <View style={styles.modalColumn}>
                        <UpdateTile commitEdit={commitEdit} />
                        <ClearTile commitEdit={clearValue} />
                        <RefreshTile commitEdit={cancelEdit} />
                        {freestyle === true && (
                          <KeyboardTile commitEdit={startTyping} />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
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

  const handleChangeValue = (newValue: string) => {
    if (!propIsTyping && !isFreestyleTyping) {
      setEditedValue(newValue);
      onChangeValue(rawValue);
    }
  }

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
      <TouchableOpacity testID={testID + 'Field'} style={styles.fieldFlexContainer} onPress={startEditing} disabled={readonly}>
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

TilesField.defaultProps = {
  readonly: false,
};
