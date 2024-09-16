import React, { useState } from 'react';
import { Pressable, TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput as PaperTextInput, Portal } from 'react-native-paper';
import { strings } from './Strings';
import Dialog from './utilities/Dialog';

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

  const handleLongPress = () => {
    setDialogVisible(true);
    setTempValue(value);
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
      style={[styles.textInput, style]}
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
    <View style={styles.textInput}>
      <Pressable style={styles.textInput} onLongPress={handleLongPress} delayLongPress={500}>
        {renderTextInput()}
      </Pressable>

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
    height: '100%',
  },
});

