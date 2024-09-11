import React, { useState, useRef } from 'react';
import { Dimensions, Text, TextInput as RNTextInput, View, GestureResponderEvent, Platform, TouchableWithoutFeedback } from 'react-native';
import { Portal, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import Dialog from './utilities/Dialog';
import { fontScale } from './Styles';
import { strings } from './Strings';

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
  title?: string | null;
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
  title = null
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

  const getTitle = () => {
    return title ? `${strings.textEditor} - ${title}` : `${strings.textEditor}`;
  }

  return (
    <View style={{ width: '100%'}}>
      <TouchableWithoutFeedback onPress={handleDoubleClick}>
        {renderTextInput()}
      </TouchableWithoutFeedback>

      <Portal theme={{colors: {backdrop: 'transparent'}}}>
        <Dialog
          style={{
            width: '800px',
            height: '430px',
            alignSelf: 'center',
            backgroundColor: '#fff',
          }}
          visible={dialogVisible}
          onDismiss={handleCancel}
          dismissable={true}>
          <Dialog.Title>
            <Text style={{color: '#1db3b3'}}>{getTitle()}</Text>
          </Dialog.Title>
          <Dialog.ScrollArea>
            <PaperTextInput
              value={tempValue}
              onChangeText={setTempValue}
              multiline={true}
              autoFocus={true}
              style={{
                backgroundColor: '#FAFAFA',
                marginTop: 8,
              }}
             rows={10}
            />
          </Dialog.ScrollArea>
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

