import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { TextField, ClearTile, KeyboardTile, UpdateTile, RefreshTile, ListField } from './Widgets';
import { styles } from './Styles';
import { CustomModal as Modal } from './utilities/Modal';
import { generateFractions, splitValue, calculateCombinedValue } from './NumberFieldHelpers';

interface NumberFieldProps  {
  value: number,
  options: CodeDefinition[] | string,
  label?: string,
  prefix?: string,
  suffix?: string | string[],
  range: number[],
  width?: number,
  stepSize?: number | number[],
  groupSize?: number,
  decimals?: number,
  readonly?: boolean,
  freestyle?: boolean,
  isTyping?: boolean,
  autoFocus?: boolean,
  style?: any,
  onChangeValue?: (newvalue: ?number) => void,
  transferFocus?: {
    previousField: string,
    nextField: string,
    onTransferFocus: (field: string) => void,
  },
  listField?: number,
  testID: string,
  unit?: string,
  onBlur?: () => void,
}

export const NumberField = (props: NumberFieldProps) => {
  const [state, setState] = useState({
    isActive: false,
    isDirty: false,
    isFreestyleTyping: false,
    editedValue: props.value,
    fractions: generateFractions(props),
    formattedText: '',
    rawValue: props.value,
    prevPropsValue: '',
    prevRawValue: '',
    prevEditedValue: '',
    displayedText: '',
  });

  const formatValue = useCallback(() => {
    let formattedText = '';
    if (Array.isArray(state.editedValue)) {

      if (state.fractions) {
        state.fractions.forEach((fraction, index) => {
          if (fraction.length === 0) {
            state.editedValue[index] = [];
          }
        });
      }
      if (!state.fractions) {
        console.log('Fractions not defined');
      }
    }
    let rawValue = state.editedValue;
    if (Array.isArray(state.editedValue)) {
      rawValue = calculateCombinedValue(state, props);
    }

    if (rawValue === undefined || rawValue === null || rawValue.toString().trim() === '') {
      setState(prevState => ({ ...prevState, formattedText: '', rawValue: '' }));
      return;
    }

    if (Array.isArray(rawValue)) {
      formattedText = rawValue.filter(v => v !== undefined).join(' / ');
    } else if (Array.isArray(props.options) && props.options.includes(rawValue)) {
      formattedText = rawValue;
    } else if (isNaN(rawValue)) {
      formattedText = rawValue;
      if (props.prefix && props.prefix !== '+' && !formattedText.startsWith(props.prefix)) {
        formattedText = props.prefix + formattedText;
      }
    } else {
      let numericValue = Number(rawValue);
      formattedText = props.decimals !== undefined && props.decimals > 0
        ? numericValue.toFixed(props.decimals)
        : String(numericValue);

      if (props.prefix) {
        if (props.prefix.endsWith('+') && numericValue >= 0) {
          if (!formattedText.includes(props.prefix)) {
        formattedText = props.prefix + formattedText;
          }
        } else if (!props.prefix.endsWith('+')) {
          if (!formattedText.includes(props.prefix)) {
        formattedText = props.prefix + formattedText;
          }
        }
      }

      if (props.suffix && typeof props.suffix === 'string' && !props.suffix.includes('Code')) {
        if (!formattedText.includes(props.suffix)) {
          formattedText += props.suffix;
        }
      }
    }

    let updatedRawValue = rawValue;

    if (typeof rawValue === 'string') {
      // Check if the string is a number
      if (!isNaN(rawValue)) {
        updatedRawValue = Number(rawValue);
      } else {
        // Check if the string starts with "20/"
        if (rawValue.startsWith('20/')) {
          const numericPart = rawValue.substring(3);
          if (!isNaN(numericPart)) {
          updatedRawValue = Number(numericPart);
          }
        }

        // Check if the string ends with a suffix
        if (props.suffix && typeof props.suffix === 'string' && rawValue.endsWith(props.suffix)) {
          const numericPart = rawValue.slice(0, -props.suffix.length);
          if (!isNaN(numericPart)) {
          updatedRawValue = Number(numericPart);
          }
        }
      }
    }

    setState(prevState => ({
      ...prevState,
      formattedText,
      rawValue: updatedRawValue,
      prevEditedValue: state.editedValue,
    }));

    if (props.onChangeValue) {
      props.onChangeValue(updatedRawValue);
    }
  }, [props, state]);

  useEffect(() => {
    if (props.value !== state.prevPropsValue && !state.isActive) {
      setState(prevState => ({ ...prevState, editedValue: props.value, prevPropsValue: props.value }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  useEffect(() => {
    if (state.rawValue !== state.prevRawValue) {
      formatValue();
      setState(prevState => ({
        ...prevState,
        prevRawValue: state.rawValue,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawValue]);

  useEffect(() => {
    if (state.editedValue !== state.prevEditedValue) {
      formatValue();
      setState(prevState => ({ ...prevState, prevEditedValue: state.editedValue }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.editedValue]);

  useEffect(() => {
    if (!state.isActive) {
      setState(prevState => ({ ...prevState, displayedText: state.formattedText }));
    }
  }, [state.formattedText, state.isActive]);

  const startEditing = () => {
    if (props.readonly) return;
    const newEditedValiue =
      state.fractions ?
        splitValue(props, state.prevRawValue, state.fractions) :
        state.prevRawValue;
    setState(prevState => ({
      ...prevState,
      isActive: true,
      isDirty: false,
      editedValue: newEditedValiue,
    }));
  };

  const startTyping = () => {
    if (props.readonly) return;
    setState(prevState => ({
      ...prevState,
      isActive: false,
      isFreestyleTyping: true,
    }));
  };

  const commitEdit = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isActive: false,
      isFreestyleTyping: false,
      displayedText: state.formattedText
    }));
    props.onChangeValue(state.rawValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, state.rawValue]);

  const cancelEdit = () => {
    setState(prevState => ({
      ...prevState,
      isActive: false,
      isFreestyleTyping: false,
      editedValue: props.value,
    }));
  };

  const clearValue = () => {
    setState(prevState => ({
      ...prevState,
      editedValue: '',
      isDirty: true,
    }));
    props.onChangeValue('');
  };

  const handleInput = (column, newColumnValue) => {
    if (state.fractions === undefined) {
      handleSimpleInput(newColumnValue.toString());
    } else {
      handleFractionInput(newColumnValue, column);
    }
  }

  const handleSimpleInput = (newValue) =>{
    let editedValue = state.editedValue;

    if (editedValue === undefined || editedValue === null) {
      editedValue = newValue;
    } else {
      editedValue = updateEditedValue(editedValue, newValue);
    }

    setState(prevState => ({
      ...prevState,
      editedValue,
      isDirty: true,
    }));
  }

  const updateEditedValue = (currentValue, newValue) => {
    switch (newValue) {
      case '.':
        return currentValue.includes('.') ? currentValue : currentValue + '.';
      case '-':
        return currentValue.startsWith('-') ? currentValue.substring(1) : '-' + currentValue;
      default:
        return currentValue + newValue;
    }
  }

  const handleFractionInput = (newValue, column) => {
    let editedValue = [...state.editedValue];
    const submitColumn = isSubmitColumn(column);

    if (column >= 1 && newValue === editedValue[column]) {
      newValue = undefined;
    }

    editedValue[column] = newValue;

    if (!submitColumn) {
      clearFollowingColumns(editedValue, column);
    }

    setState(prevState => ({
      ...prevState,
      editedValue,
      isDirty: true,
    }));

    if (submitColumn) {
      commitEdit();
    }
  }

  const isSubmitColumn = (column) => {
    const { suffix, freestyle, decimals } = props;
    const fractions = state.fractions;

    if (suffix && typeof suffix === 'string' && !suffix.includes('code')) {
      return column === 4;
    }

    let submitColumn;
    if (fractions[4].length > (freestyle ? 4 : 3)) {
      submitColumn = 4;
    } else if (decimals && decimals > 0) {
      submitColumn = 3;
    } else {
      submitColumn = 2;
    }

    return column >= submitColumn;
  }

  const clearFollowingColumns = (editedValue, column) => {
    for (let i = column + 1; i < 5; i++) {
      editedValue[i] = undefined;
    }
  }

  const handleBlur = (input) => {
    if (props.isTyping || state.isFreestyleTyping) {
      const newValue = input?.target?.value ?? state.rawValue;
      setState(prevState => ({ ...prevState, editedValue: newValue }));
      if (props.onBlur) {
        props.onBlur();
      }
    }
  };

  const handleChangeValue = (value) => {
    if (!props.isTyping && !state.isFreestyleTyping) {
      setState(prevState => ({ ...prevState, editedValue: value }));
    }
  };

  const renderPopup = () => {
    const isKeypad = state.fractions === undefined;
    const fractions = !isKeypad
      ? state.fractions
      : [
          [7, 4, 1, '-'],
          [8, 5, 2, 0],
          [9, 6, 3, '.'],
          props.freestyle === true
            ? ['\u2715', '\u27f3', '\u2328']
            : ['\u2715', '\u27f3'],
        ];
    const columnStyle = state.fractions
      ? styles.modalColumn
      : styles.modalKeypadColumn;

    return (
      <TouchableWithoutFeedback
        onPress={commitEdit}
        accessible={false}
        testID={'popupBackground'}>
        <View style={styles.popupBackground}>
          <ScrollView scrollEnabled={true}>
            <Text style={styles.modalTitle}>
              {props.label}: {state.formattedText}
            </Text>
            <View style={styles.flexColumnLayout}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options, column) => (
                  <View style={columnStyle} key={column}>
                    {options.map((option, row) => {
                      let isSelected = !isKeypad && state.editedValue[column] === option;
                      if (option === '\u2328') {
                        return (
                          <KeyboardTile
                            commitEdit={startTyping}
                            key={row}
                          />
                        );
                      }
                      if (option === '\u2714') {
                        return (
                          <UpdateTile
                            commitEdit={commitEdit}
                            key={row}
                          />
                        );
                      }
                      if (option === '\u2715') {
                        return (
                          <ClearTile commitEdit={clearValue} key={row} />
                        );
                      }
                      if (option === '\u27f3') {
                        return (
                          <RefreshTile
                            commitEdit={cancelEdit}
                            key={row}
                          />
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={row}
                          onPress={() => handleInput(column, option)}
                          testID={`option${column + 1}-${row + 1}`}>
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
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  let style;
  if (props.style) {
    style = props.style;
  } else if (state.isActive) {
    style = styles.inputFieldActive;
  } else {
    style = styles.inputField;
  }

  const finalStyle = props.width ? [{ width: props.width }, style] : style;

  if (props.readonly) {
    return (
      <View style={styles.fieldFlexContainer} testID={`${props.testID}.ReadOnly`}>
        <Text style={finalStyle}>{state.formattedText}</Text>
      </View>
    );
  }

  if (props.isTyping || state.isFreestyleTyping) {
    return (
      <TextField
        value={state.formattedText}
        testID={props.testID}
        autoFocus={props.autoFocus || props.isTyping !== true}
        style={finalStyle}
        selectTextOnFocus
        onChangeValue={handleChangeValue}
        onOpenModal={startEditing}
        title={props.label}
        onBlur={handleBlur}
      />
    );
  }

  if (props.listField) {
    return (
      <ListField
        label={props.label}
        style={props.style}
        readonly={props.readonly}
        freestyle={props.freestyle}
        options={props.options}
        value={state.formattedText}
        onChangeValue={handleChangeValue}
        prefix={props.prefix}
        suffix={props.suffix}
        simpleSelect
        popupStyle={styles.alignPopup}
        testID={props.testID}
      />
    );
  }

  return (
    <View style={styles.fieldFlexContainer}>
      <TouchableOpacity
        style={styles.fieldFlexContainer}
        onPress={startEditing}
        disabled={props.readonly}
        testID={props.testID}>
        <Text style={finalStyle}>{state.displayedText}</Text>
      </TouchableOpacity>
      {state.isActive && (
        <Modal
          visible={state.isActive}
          transparent={true}
          animationType={'slide'}
          onRequestClose={cancelEdit}>
          {renderPopup()}
        </Modal>
      )}
    </View>
  );
};

NumberField.defaultProps = {
  stepSize: 1,
  groupSize: 10,
  autoFocus: false,
};
