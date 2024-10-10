import React, { useState, useCallback, useEffect } from 'react';
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
}: TilesFieldProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isFreestyleTyping, setIsFreestyleTyping] = useState(false);
  const [editedValue, setEditedValue] = useState(undefined);

  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const startTyping = useCallback(() => {
    if (readonly) return;
    setIsActive(false);
    setIsFreestyleTyping(true);
  }, [readonly]);

  const commitTyping = useCallback((newValue) => {
    setEditedValue(newValue);
    if (onChangeValue) {
      onChangeValue(newValue);
    }
  }, [onChangeValue]);

  const isUndefinedArray = (arr) => {
    // return true if array is an array and each element is undefined
    return arr instanceof Array && arr.every((element) => element === undefined);
  };

  const startEditing = useCallback(() => {
    if (readonly) return;
    setIsActive(true);
    const updatedValue = isUndefinedArray(editedValue) ? '' : editedValue;
    setEditedValue(combineOptions ? split(updatedValue ?? '', options) : updatedValue);
  }, [readonly, combineOptions, editedValue, options]);

  const isMultiColumn = useCallback(() => {
    return options != undefined && options[0] instanceof Array;
  }, [options]);

  const getEditedColumnValue = useCallback((columnIndex) => {
    if (isMultiColumn()) {
      if (editedValue === undefined || editedValue.length <= columnIndex) {
        return undefined;
      }
      return editedValue[columnIndex];
    }
    return editedValue;
  }, [editedValue, isMultiColumn]);

  const updateValue = useCallback((newValue, columnIndex) => {
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
  }, [getEditedColumnValue, isMultiColumn, editedValue, options, updateConfirm, commitEdit]);

  const commitEdit = useCallback((nextFocusField) => {
    let combinedValue = combineOptions && editedValue instanceof Array
      ? format(editedValue)
      : editedValue;
    if (onChangeValue) {
      onChangeValue(combinedValue);
    }
    setIsActive(false);
    if (nextFocusField != undefined && transferFocus) {
      transferFocus.onTransferFocus(nextFocusField);
    }
  }, [combineOptions, editedValue, format, onChangeValue, transferFocus]);

  const cancelEdit = useCallback(() => {
    setIsActive(false);
    setEditedValue('');
    setIsFreestyleTyping(false);
  }, []);

  const clear = useCallback(() => {
    let clearedValue = '';
    if (editedValue instanceof Array) {
      clearedValue = editedValue.map(() => undefined);
    }
    setEditedValue(clearedValue);
    commitEdit();
  }, [editedValue, commitEdit]);

  const sumArray = useCallback((arr) => {
    return arr.reduce((a, b) => {
      let rightIndex = (a === undefined) ? 0 : Number(a);
      let leftIndex = (b === undefined) ? 0 : Number(b);
      return rightIndex + leftIndex;
    });
  }, []);

  const format = useCallback((inputValue) => {
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
  }, [isPrism, sumArray, isMultiColumn, prefix, suffix]);

  const updateConfirm = useCallback(() => {
    return transferFocus !== undefined || isMultiColumn();
  }, [transferFocus, isMultiColumn]);

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
                          <ClearTile commitEdit={clear} />
                        )}
                        {allOptions.length === 1 && freestyle === true && (
                          <KeyboardTile commitEdit={startTyping} />
                        )}
                      </View>
                    ))}
                    {allOptions.length > 1 && !hideClear && (
                      <View style={styles.modalColumn}>
                        <UpdateTile commitEdit={commitEdit} />
                        <ClearTile commitEdit={clear} />
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

  const fieldStyle = style
    ? style
    : isActive
    ? styles.inputFieldActive
    : styles.inputField;

  const finalStyle = width ? [{width}, fieldStyle] : fieldStyle;

  let formattedValue = format(value);
  if (editedValue?.length > 0) {
    formattedValue = format(editedValue);
  }

  if (propIsTyping || isFreestyleTyping) {
    return (
      <TextField
        value={formattedValue}
        autoFocus
        style={finalStyle}
        multiline={multiline}
        onChangeValue={commitTyping}
        testID={testID ? testID + 'ActiveField' : undefined}
        title={label}
      />
    );
  }

  return (
    <View style={styles.fieldFlexContainer}>
      <TouchableOpacity
        style={styles.fieldFlexContainer}
        onPress={startEditing}
        disabled={readonly}
        testID={testID}>
        <Text style={finalStyle}>{formattedValue}</Text>
      </TouchableOpacity>
      {isActive && (
        <Modal
          visible={isActive}
          transparent={true}
          animationType={'slide'}
          onRequestClose={cancelEdit}>
          {renderPopup()}
        </Modal>
      )}
    </View>
  );
};

TilesField.defaultProps = {
  combineOptions: false,
  freestyle: false,
  multiline: false,
  readonly: false,
  isPrism: false,
  hideClear: false,
};