import React, { useState, useRef } from 'react';
import { TextInput as RNTextInput, View, GestureResponderEvent, Platform, TouchableWithoutFeedback } from 'react-native';
import { Dialog, Portal, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: string;
  autoFocus?: boolean;
  readonly?: boolean;
  multiline?: boolean;
  testID?: string;
  style?: object;
  isWeb: boolean;
};

const DOUBLE_TAP_DELAY = 300; // ms

export const TextInputWrapper: React.FC<Props> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  keyboardType,
  autoFocus,
  readonly,
  multiline,
  testID,
  style,
  isWeb,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const lastTap = useRef(0);

  const handleDoubleClick = (event: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setDialogVisible(true);
      setTempValue(value);
    }
    lastTap.current = now;
  };

  const handleCancel = () => {
    setTempValue(value);
    setDialogVisible(false);
  };

  const handleSave = () => {
    onChangeText(tempValue);
    setDialogVisible(false);
  };

  const renderTextInput = () => (
    <RNTextInput
      value={value}
      autoCapitalize="sentences"
      autoCorrect={false}
      placeholder={''}
      keyboardType={keyboardType}
      style={style}
      onFocus={onFocus}
      onChangeText={onChangeText}
      onBlur={onBlur}
      autoFocus={autoFocus}
      editable={!readonly}
      multiline={multiline}
      testID={testID}
      onKeyPress={(event) => {
        if (isWeb && event.nativeEvent.key === 'Enter' && !multiline) {
          onBlur?.();
        }
      }}
      onEndEditing={() => !isWeb && onBlur && onBlur()}
    />
  );

  return (
    <View style={{ width: '100%'}}>
      <TouchableWithoutFeedback onPress={handleDoubleClick}>
        {renderTextInput()}
      </TouchableWithoutFeedback>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCancel}>
          <Dialog.Title>Edit Text</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Text"
              value={tempValue}
              onChangeText={setTempValue}
              multiline={true}
              autoFocus={true}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>Cancel</Button>
            <Button onPress={handleSave}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    width: '100%',
  },
});

