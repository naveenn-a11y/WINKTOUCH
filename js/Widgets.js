/**
 * @flow
 */

'use strict';

import type {FieldDefinition, CodeDefinition} from './Types';
import React, {Component, PureComponent} from 'react';
import ReactNative, {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import {
  Button as NativeBaseButton,
  Button as NativeBaseIcon,
  FAB,
  Portal,
  Snackbar,
  Paragraph,
  Divider,
} from 'react-native-paper';
import RNBeep from '@dashdoc/react-native-system-sounds';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PDFLib, {PDFDocument, PDFPage} from 'react-native-pdf-lib';
import {
  styles,
  fontScale,
  selectionColor,
  selectionFontColor,
  isWeb,
} from './Styles';
import {strings} from './Strings';
import {formatCodeDefinition, formatAllCodes} from './Codes';
import {
  formatDuration,
  formatDate,
  dateFormat,
  dateTime24Format,
  now,
  yearDateFormat,
  yearDateTime24Format,
  officialDateFormat,
  capitalize,
  dayDateTime24Format,
  dayDateFormat,
  dayYearDateTime24Format,
  dayYearDateFormat,
  isToyear,
  deAccent,
  formatDecimals,
  split,
  formatTime,
  formatHour,
  time24Format,
  today,
  dayDifference,
  addDays,
  formatAge,
  isEmpty,
  postfix,
  parseTime24Format,
} from './Util';
import {Camera} from './Favorites';
import {isInTranslateMode, updateLabel} from './ExamDefinition';
import {CustomModal as Modal} from './utilities/Modal';
import Dialog from './utilities/Dialog';

const margin: number = 40;

export class Label extends PureComponent {
  props: {
    value: string,
    width?: number,
    definition: FieldDefinition,
    style: style,
    suffix?: string,
    fieldId?: string,
  };
  state: {
    newLabel: string,
  };
  static defaultProps = {
    suffix: ':',
  };

  constructor(props: any) {
    super(props);
    this.state = {
      newLabel: this.props.value,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value === this.state.newLabel || isInTranslateMode()) {
      return;
    }
    this.setState({newLabel: this.props.value});
  }

  saveLabel = () => {
    if (this.props.value === this.state.newLabel) {
      return;
    }
    updateLabel(this.props.fieldId, this.state.newLabel);
  };

  render() {
    if (isInTranslateMode()) {
      return (
        <TextInput
          style={[this.props.style, styles.translateField]}
          value={this.state.newLabel}
          editable={true}
          onChangeText={(text: string) => this.setState({newLabel: text})}
          onBlur={this.saveLabel}
        />
      );
    }
    if (!this.props.value || this.props.value.length === 0) {
      return null;
    }
    const style = this.props.style
      ? this.props.style
      : this.props.width
      ? [styles.formLabel, {width: this.props.width}]
      : styles.formLabel;
    return (
      <Text style={style}>
        {this.props.value}
        {this.props.suffix}
      </Text>
    );
  }
}

export class UpdateTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="updateIcon">
        <View style={styles.popupTile}>
          <Icon name="check" style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class ClearTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="deleteIcon">
        <View style={styles.popupTile}>
          <Icon name="delete" style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class CloseTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="closeIcon">
        <View style={styles.popupTile}>
          <Text style={styles.modalTileLabel}>{'\u2715'}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

export class RefreshTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="refreshIcon">
        <View style={styles.popupTile}>
          <Icon name="refresh" style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class KeyboardTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="keyboardIcon">
        <View style={styles.popupTile}>
          <Icon name="keyboard" style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class CameraTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void,
  };
  render() {
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit()}
        testID="cameraIcon">
        <View style={styles.popupTile}>
          <Icon name="camera" style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export type BinocularsProps = {
  onClick: () => void,
  style: any,
};
export type BinocularsState = {};
export class Binoculars extends PureComponent<
  BinocularsProps,
  BinocularsState,
> {
  render() {
    return (
      <TouchableWithoutFeedback onPress={this.props.onClick}>
        <Icon
          name="binoculars"
          style={this.props.style}
          color={selectionFontColor}
        />
      </TouchableWithoutFeedback>
    );
  }
}

export class FocusTile extends Component {
  props: {
    type: string,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
    commitEdit: (nextFocusField?: string) => void,
  };
  static defaultProps = {
    type: 'next',
  };
  render() {
    if (!this.props.transferFocus) {
      return null;
    }
    if (!this.props.transferFocus[this.props.type + 'Field']) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={() =>
          this.props.commitEdit(
            this.props.transferFocus[this.props.type + 'Field'],
          )
        }>
        <View style={styles[this.props.type + 'Tile']}>
          <Text style={styles.modalTileLabel}>
            {strings[this.props.transferFocus[this.props.type + 'Field']]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

export class TextField extends Component {
  props: {
    value: string,
    type?: string,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    multiline?: boolean,
    style?: any,
    onChangeValue?: (newvalue: string) => void,
    autoFocus?: boolean,
    onFocus?: () => void,
    testID: string,
    onOpenModal?: () => void,
  };
  state: {
    value: string,
  };
  static defaultProps = {
    type: 'default',
  };

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.value === this.props.value) {
      return;
    }
    this.setState({value: this.props.value});
  }

  commitEdit(value: string) {
    if (this.props.onChangeValue && value !== this.props.value) {
      this.props.onChangeValue(value);
    }
  }

  handleKeyEvent(keyCode: Number) {
    //ArrowDown
    if (keyCode === 40) {
      this.props.onOpenModal();
    }
  }

  updateText = (text: string) => {
    this.setState({value: text});
  };

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    if (isWeb) {
      style = [{width: 36 * fontScale}, style];
    }
    if (this.props.width) {
      style = [{width: this.props.width}, style];
    }
    return (
      <View style={styles.fieldFlexContainer}>
        {this.props.prefix != undefined && (
          <Text style={styles.formPrefix}>{this.props.prefix}</Text>
        )}
        {isWeb ? (
          <TextInput
            value={this.state.value}
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder={''}
            keyboardType={this.props.type}
            style={style}
            onFocus={this.props.onFocus}
            onChangeText={this.updateText}
            onBlur={() => this.commitEdit(this.state.value)}
            autoFocus={this.props.autoFocus}
            editable={!this.props.readonly}
            multiline={this.props.multiline}
            testID={this.props.testID}
            onKeyPress={(event) => this.handleKeyEvent(event.keyCode)}
          />
        ) : (
          <TextInput
            value={this.state.value}
            autoCapitalize="sentences"
            autoCorrect={false}
            placeholder={''}
            keyboardType={this.props.type}
            style={style}
            onFocus={this.props.onFocus}
            onChangeText={this.updateText}
            onEndEditing={() => this.commitEdit(this.state.value)}
            autoFocus={this.props.autoFocus}
            editable={!this.props.readonly}
            multiline={this.props.multiline}
            testID={this.props.testID}
          />
        )}

        {this.props.suffix != undefined && (
          <Text style={styles.formSuffix}>{this.props.suffix}</Text>
        )}
      </View>
    );
  }
}

export class TextArrayField extends Component {
  props: {
    value: ?(string[]),
    readonly?: boolean,
    style?: any,
    onChangeValue?: (newValue: ?(string[])) => void,
    testID: string,
  };
  state: {
    value: ?(string[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value ? this.props.value : [],
    };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.value === this.props.value) {
      return;
    }
    this.setState({value: this.props.value ? this.props.value : []});
  }

  commitEdit(value: ?(string[])) {
    this.setState({value});
    if (this.props.onChangeValue) {
      this.props.onChangeValue(value);
    }
  }

  changeText(text: string, index: number): void {
    if (this.props.readonly) {
      return;
    }
    let value: ?(string[]) = this.state.value;
    if (!value || index >= value.length || index < 0) {
      return;
    }
    value[index] = text;
    this.commitEdit(value);
  }

  addItem = () => {
    let items = this.state.value;
    if (items === undefined || items === null) {
      items = [];
    }
    items.push('');
    this.commitEdit(items);
  };

  removeItem = () => {
    Keyboard.dismiss();
    let items = this.state.value;
    if (items === undefined || items === null) {
      return;
    }
    items.pop();
    this.commitEdit(items);
  };

  render() {
    return (
      <View style={styles.flowLeft1}>
        {this.state.value != undefined &&
          this.value != null &&
          this.state.value.map((value: string, index: number) => (
            <TextField
              value={value}
              key={index}
              style={this.props.style}
              editable={!this.props.readonly}
              onChangeValue={(text: string) => this.changeText(text, index)}
              testID={this.props.testID + '-' + (index + 1)}
            />
          ))}
        {!this.props.readonly && <Button title=" + " onPress={this.addItem} />}
        {!this.props.readonly && (
          <Button title=" - " onPress={this.removeItem} />
        )}
      </View>
    );
  }
}

export class ButtonArray extends Component {
  props: {
    value: ?(string[]),
    readonly?: boolean,
    style?: any,
    onAdd?: (index?: number) => void,
    onRemove?: (index?: number) => void,
    onSelect?: (index: number) => void,
    testID: string,
  };
  state: {
    value: ?(string[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value === prevProps.value) {
      return;
    }
    this.setState({value: this.props.value});
  }

  render() {
    return (
      <View style={styles.flowLeft}>
        {this.state.value != undefined &&
          this.state.value.map((item: string, index: number) => (
            <Button
              title={item}
              key={index}
              onPress={() => this.props.onSelect && this.props.onSelect(index)}
              testID={this.props.testID + '-' + (index + 1)}
            />
          ))}
        {this.props.onAdd != undefined && (
          <Button
            title="  +  "
            onPress={() => this.props.onAdd && this.props.onAdd()}
          />
        )}
        {this.props.onRemove != undefined && (
          <Button
            title="  -  "
            onPress={() => this.props.onRemove && this.props.onRemove()}
          />
        )}
      </View>
    );
  }
}

export class NumberField extends Component {
  props: {
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
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    isTyping: boolean,
    editedValue: (?string)[] | ?string,
    fractions: ?(string[][]),
  };
  static defaultProps = {
    stepSize: 1,
    groupSize: 10,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: props.isTyping
        ? props.value
        : [undefined, undefined, undefined, undefined, undefined],
      isActive: false,
      isDirty: false,
      isTyping: props.isTyping,
      fractions: undefined,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.value === prevProps.value &&
      this.props.isTyping === prevProps.isTyping
    ) {
      return;
    }
    this.setState({
      editedValue: this.props.isTyping
        ? this.props.value
        : [undefined, undefined, undefined, undefined, undefined],
      isActive: false,
      isDirty: false,
      isTyping: this.props.isTyping,
      fractions: undefined,
    });
  }

  componentWillUnmount() {
    if (this.state.isActive) {
      this.cancelEdit();
    }
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    const fractions = this.generateFractions(this.props);
    //KeyEvent.onKeyUpListener((keyEvent) => {
    //  console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
    //  console.log(`Action: ${keyEvent.action}`);
    //  console.log(`Key: ${keyEvent.pressedKey}`);
    //});
    this.setState({
      editedValue: fractions
        ? this.splitValue(this.props.value, fractions)
        : undefined,
      isActive: true,
      isDirty: false,
      fractions,
    });
  };

  openModal = () => {
    if (!this.state.isTyping) {
      return;
    }

    this.setState({isTyping: false});
    this.startEditing();
  };
  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false, isTyping: true});
  };

  commitTyping = (newValue: string): void => {
    if (this.state.isActive) {
      this.setState({isActive: false}, this.props.onChangeValue(newValue));
    } else {
      this.props.onChangeValue(newValue);
    }
  };

  commitEdit = (nextFocusField?: string) => {
    if (
      this.props.onChangeValue != undefined &&
      (nextFocusField === undefined || this.state.isDirty)
    ) {
      const combinedValue: ?number = this.combinedValue();
      this.props.onChangeValue(combinedValue);
    }
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false, isTyping: false});
    if (nextFocusField != undefined && this.props.transferFocus) {
      this.props.transferFocus.onTransferFocus(nextFocusField);
    }
  };

  cancelEdit = () => {
    //KeyEvent.removeKeyUpListener();
    this.setState({isActive: false});
  };

  combinedValue(): ?number {
    if (this.state.fractions === undefined) {
      //keypad
      const value = Number.parseFloat(this.state.editedValue);
      if (isFinite(value)) {
        return value;
      }
      return this.state.editedValue;
    }
    if (
      this.state.editedValue[0] === undefined &&
      this.state.editedValue[1] === undefined &&
      this.state.editedValue[2] === undefined &&
      this.state.editedValue[3] === undefined &&
      this.state.editedValue[4] === undefined
    ) {
      return undefined;
    }
    let combinedValue: ?number;
    if (
      this.state.editedValue[0] !== undefined ||
      this.state.editedValue[1] !== undefined ||
      this.state.editedValue[2] !== undefined ||
      this.state.editedValue[3] !== undefined
    ) {
      combinedValue = 0;
      let suffix: ?string;
      if (this.state.editedValue[1] !== undefined) {
        combinedValue += Number(this.state.editedValue[1]);
      }
      if (this.state.editedValue[2] !== undefined) {
        combinedValue += Number(this.state.editedValue[2]);
      }
      if (this.state.editedValue[3] !== undefined) {
        combinedValue += Number(this.state.editedValue[3]);
      }
      if (
        this.state.editedValue[0] === '-' ||
        (combinedValue !== 0 && this.props.range[1] <= 0)
      ) {
        combinedValue = -combinedValue;
      }
      if (combinedValue < this.props.range[0]) {
        combinedValue = this.props.range[0];
      } else if (combinedValue > this.props.range[1]) {
        combinedValue = this.props.range[1];
      }
    }
    let suffix: ?string;
    if (this.state.editedValue[4] !== undefined) {
      if (this.props.options) {
        const option: string = this.state.editedValue[4];
        if (this.props.options instanceof Array) {
          if (this.props.options.includes(option)) {
            return option;
          }
        } else {
          if (formatAllCodes(this.props.options).includes(option)) {
            return option;
          }
        }
      }
      if (
        this.props.suffix instanceof Array ||
        this.props.suffix.includes('Code')
      ) {
        suffix = this.state.editedValue[4];
        if (
          suffix === '\u2714' ||
          suffix === '\u2715' ||
          suffix === '\u2328' ||
          suffix === '\u27f3'
        ) {
          suffix = undefined;
        }
      }
    }
    const unit = (this.props.unit !== undefined) ? this.props.unit : '';
    if (suffix) {
      let formattedValue: string =
        combinedValue === undefined
          ? ''
          : this.props.decimals && this.props.decimals > 0
          ? Number(combinedValue).toFixed(this.props.decimals)
          : String(combinedValue);
      return formattedValue + unit + suffix;
    }
    return combinedValue + unit;
  }

  hasDecimalSteps(): boolean {
    if (this.props.stepSize instanceof Array) {
      return (
        this.props.stepSize.length > 0 &&
        this.props.stepSize[0] &&
        this.props.stepSize[0] < 1
      );
    }
    return this.props.stepSize && this.props.stepSize < 1;
  }

  splitValue(value: number | string, fractions: string[]): (?string)[] {
    const originalValue: number | string = value;
    if (value === undefined || value === null) {
      return [undefined, undefined, undefined, undefined, undefined];
    }
    //TODO check if value is an option
    //remove prefix
    if (this.props.prefix && this.props.prefix != '+') {
      if (value.startsWith && value.startsWith(this.props.prefix)) {
        value = value.substring(this.props.prefix.length);
      }
    }
    //parse suffix
    let suffix: ?string;
    if (
      this.props.suffix !== undefined &&
      value.toLowerCase &&
      fractions[4] !== undefined
    ) {
      for (let i: number = 0; i < fractions[4].length; i++) {
        if (value.toLowerCase().endsWith(fractions[4][i].toLowerCase())) {
          suffix = fractions[4][i];
          value = value.substring(0, value.length - suffix.length);
          if (value === '') {
            return [undefined, undefined, undefined, undefined, suffix];
          }
          value = parseFloat(value);
          if (isNaN(value)) {
            return [undefined, undefined, undefined, undefined, originalValue];
          }
          break;
        }
      }
    }
    if (value.toLowerCase) {
      value = parseFloat(value);
      if (isNaN(value)) {
        return [undefined, undefined, undefined, undefined, undefined];
      }
    }
    let sign: ?string =
      value < 0
        ? '-'
        : this.props.prefix != undefined && this.props.prefix.endsWith('+')
        ? '+'
        : undefined;
    value = Math.abs(value);
    let groupPart: number =
      this.props.groupSize != undefined && this.props.groupSize > 0
        ? this.props.groupSize * Math.floor(value / this.props.groupSize)
        : 0;
    let intPart: number = Math.floor(value - groupPart);
    let decimals: ?string =
      this.hasDecimalSteps() && suffix === undefined
        ? formatDecimals(value - groupPart - intPart, this.props.decimals)
        : undefined;
    const splittedValue: (?string)[] = [
      sign,
      this.props.groupSize != undefined &&
      this.props.groupSize > 0 &&
      groupPart > 0
        ? groupPart.toString()
        : undefined,
      intPart.toString(),
      decimals,
      suffix,
    ];
    return splittedValue;
  }

  clearValue = () => {
    const editedValue = this.state.fractions
      ? [undefined, undefined, undefined, undefined, undefined]
      : undefined;
    this.setState({editedValue, isDirty: true}, () => {
      this.commitEdit();
    });
  };

  updateValue(column: number, newColumnValue: string): void {
    if (this.state.fractions === undefined) {
      //keypad
      let editedValue = this.state.editedValue;
      if (editedValue === undefined || editedValue === null) {
        editedValue = newColumnValue.toString();
      } else {
        if (newColumnValue === '.') {
          if (!editedValue.includes('.')) {
            editedValue += '.';
          }
        } else if (newColumnValue === '-') {
          if (editedValue.startsWith('-')) {
            editedValue = editedValue.substring(1);
          } else {
            editedValue = newColumnValue + editedValue;
          }
        } else {
          editedValue += newColumnValue.toString();
        }
      }
      this.setState({editedValue, isDirty: true});
    } else {
      let editedValue: string[] = this.state.editedValue;
      let isSubmitColumn: boolean = false;
      //alert(this.props.decimals);
      if (
        this.props.suffix != undefined &&
        this.props.suffix instanceof String &&
        this.props.suffix.indexOf('code') == -1
      ) {
        // submit is the last column with extra options
        isSubmitColumn = column === 4;
      } else {
        let submitColumn: number;
        if (
          this.state.fractions[4].length >
          (this.props.freestyle === true ? 4 : 3)
        ) {
          submitColumn = 4;
        } else {
          if (this.props.decimals !== undefined && this.props.decimals > 0) {
            submitColumn = 3;
          } else {
            submitColumn = 2;
          }
        }
        isSubmitColumn = column >= submitColumn;
      }

      //((this.state.fractions[4].length>(this.props.freestyle===true?3:2)?3:2) + (this.props.decimals > 0 ? (this.state.fractions[4].length> 2? 0 : 1) : 0)) <= column;

      if (column >= 1 && newColumnValue === this.state.editedValue[column]) {
        newColumnValue = undefined;
      }
      editedValue[column] = newColumnValue;
      if (!isSubmitColumn) {
        //Clear following columns
        for (let i = column + 1; i < 5; i++) {
          editedValue[i] = undefined;
        }
      }
      this.setState({editedValue, isDirty: true}, () => {
        if (isSubmitColumn) {
          this.commitEdit();
        }
      });
    }
  }

  format(value: ?number | string): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (value.toString().trim() === '') {
      return '';
    }

    if (value instanceof Array) {
      let formattedValue: string = '';
      value.forEach((subValue: number | string) => {
        formattedValue += subValue + ' / ';
      });
      if (!isEmpty(formattedValue)) {
        value = formattedValue.replace(/\/\s*$/, '');
      }
    }
    if (
      this.props.options instanceof Array &&
      this.props.options.includes(value)
    ) {
      return value;
    }
    if (isNaN(value)) {
      let formattedValue: string = value.toString();
      if (this.props.prefix && this.props.prefix != '+') {
        let freeType: boolean = false;
        for (let i = 0; i < formattedValue.length; i++) {
          const character: char = formattedValue.charAt(i);
          if ('0123456789.-+'.includes(character) === false) {
            freeType = true;
            break;
          }
        }
        if (!freeType) {
          formattedValue = this.props.prefix + formattedValue;
        }
      }
      return formattedValue;
    }

    let formattedValue: string =
      this.props.decimals != undefined && this.props.decimals > 0
        ? Number(value).toFixed(this.props.decimals)
        : String(value);
    if (formattedValue == '') {
      return '';
    }
    if (this.props.prefix) {
      if (this.props.prefix.endsWith('+')) {
        if (formattedValue.length > 0 && formattedValue[0] != '-') {
          formattedValue = this.props.prefix + formattedValue;
        } else {
          formattedValue =
            this.props.prefix.substring(0, this.props.prefix.length - 1) +
            formattedValue;
        }
      } else {
        formattedValue = this.props.prefix + formattedValue;
      }
    }
    if (
      this.props.suffix != undefined &&
      this.props.suffix instanceof Array === false &&
      this.props.suffix.includes('Code') === false
    ) {
      formattedValue = formattedValue + this.props.suffix;
    }
    return formattedValue;
  }

  generateFractions(props: any): string[][] {
    if (
      props.groupSize !== undefined &&
      props.groupSize !== 0 &&
      props.range[1] / props.groupSize > 40
    ) {
      return undefined;
    }
    let fractions: string[][] = [[], [], [], [], []];
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
      (props.range[0] < -props.groupSize || props.range[1] > props.groupSize)
    ) {
      let minGroup: number = Math.abs(props.range[0]);
      let maxGroup: number = Math.abs(props.range[1]);
      if (minGroup > maxGroup) {
        let c = maxGroup;
        maxGroup = minGroup;
        minGroup = c;
      }
      if (props.range[0] < 0 && props.range[1] > 0) {
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
    let minInt: number = 0;
    if (props.range[0] < 0 && props.range[1] > 0) {
      //Range includes 0
      minInt = 0;
    } else {
      //All positive or All negative range
      if (props.groupSize > 1) {
        //Grouped range
        if (props.range[0] >= 0) {
          //Only positive range
          if (props.groupSize > props.range[1]) {
            //Unused group size
            minInt = props.range[0];
          }
        } else {
          //Only negative range
          if (props.groupSize > -props.range[0]) {
            //Unused group size
            minInt = -props.range[1];
          }
        }
      } else {
        //All positive or negative with no group
        if (props.range[0] >= 0) {
          //Only positive range
          minInt = props.range[0];
        } else {
          //Only negative range
          minInt = -props.range[1];
        }
      }
    }
    let maxInt: number =
      props.groupSize > 1
        ? Math.min(
            Math.max(Math.abs(props.range[0]), Math.abs(props.range[1])),
            props.groupSize - 1,
          )
        : props.range[1];
    if (this.props.stepSize instanceof Array) {
      let c = 0;
      for (let i = minInt; i <= maxInt; c++) {
        fractions[2].push(String(i));
        let stepSize =
          this.props.stepSize[Math.min(this.props.stepSize.length - 1, c)];
        i = i + Math.max(1, stepSize);
      }
    } else {
      for (let i = minInt; i <= maxInt; ) {
        fractions[2].push(String(i));
        i = i + Math.max(1, this.props.stepSize);
      }
    }
    //decimals .25
    if (
      props.decimals != undefined &&
      props.decimals > 0 &&
      this.hasDecimalSteps()
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
    
    //Update Button
    //fractions[4].push('\u2714');
    //Clear Button
    fractions[4].push('\u2715');
    //Refresh Button
    fractions[4].push('\u27f3');
    //Keyboard Button
    if (this.props.freestyle === true) {
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
  }

  renderPopup() {
    const formattedValue = this.format(
      this.state.isDirty ? this.combinedValue() : this.props.value,
    );
    const isKeypad: boolean = this.state.fractions === undefined;
    const fractions: any[][] = !isKeypad
      ? this.state.fractions
      : [
          [7, 4, 1, '-'],
          [8, 5, 2, 0],
          [9, 6, 3, '.'],
          this.props.freestyle === true
            ? ['\u2715', '\u27f3', '\u2328']
            : ['\u2715', '\u27f3'],
        ]; //TODO: localize
    const columnStyle = this.state.fractions
      ? styles.modalColumn
      : styles.modalKeypadColumn;
    return (
      <TouchableWithoutFeedback
        onPress={this.commitEdit}
        accessible={false}
        testID={'popupBackground'}>
        <View style={styles.popupBackground}>
          <ScrollView scrollEnabled={true}>
            <Text style={styles.modalTitle}>
              {this.props.label}: {formattedValue}
            </Text>
            <View style={styles.flexColumnLayout}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return (
                    <View style={columnStyle} key={column}>
                      {options.map((option: string, row: number) => {
                        let isSelected: boolean =
                          isKeypad === false &&
                          this.state.editedValue[column] === option;
                        if (option === '\u2328') {
                          return (
                            <KeyboardTile
                              commitEdit={this.startTyping}
                              key={row}
                            />
                          );
                        }
                        if (option === '\u2714') {
                          return (
                            <UpdateTile
                              commitEdit={this.commitEdit}
                              key={row}
                            />
                          );
                        }
                        if (option === '\u2715') {
                          return (
                            <ClearTile commitEdit={this.clearValue} key={row} />
                          );
                        }
                        if (option === '\u27f3') {
                          return (
                            <RefreshTile
                              commitEdit={this.cancelEdit}
                              key={row}
                            />
                          );
                        }
                        return (
                          <TouchableOpacity
                            key={row}
                            onPress={() => this.updateValue(column, option)}
                            testID={'option' + (column + 1) + '-' + (row + 1)}>
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
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    if (this.props.width) {
      style = [{width: this.props.width}, style];
    }
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={style}>{formattedValue}</Text>
        </View>
      );
    }
    if (this.state.isTyping) {
      // const formattedValue: string = this.props.value? this.props.value.toString() : '';
      return (
        <TextField
          value={formattedValue}
          ref="field"
          autoFocus={this.props.autoFocus || this.props.isTyping !== true}
          style={style}
          selectTextOnFocus={true} //TODO why is this not working?
          onChangeValue={(newValue) => this.commitTyping(newValue)}
          onOpenModal={this.openModal}
        />
      );
    } else if (this.props.listField) {
      return (
        <ListField
          label={this.props.label}
          style={this.props.style}
          readonly={this.props.readonly}
          freestyle={this.props.freestyle}
          options={this.props.options}
          value={formattedValue}
          onChangeValue={this.commitTyping}
          prefix={this.props.prefix}
          suffix={this.props.suffix}
          simpleSelect={true}
          popupStyle={styles.alignPopup}
          testID={this.props.testID}
        />
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}
          testID={this.props.testID}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class TilesField extends Component {
  props: {
    value?: ?(string[]) | ?string,
    label?: string,
    prefix?: ?(string[]) | ?string,
    suffix?: ?(string[]) | ?string,
    options: (string[] | string)[],
    combineOptions?: boolean,
    freestyle?: boolean,
    multiline?: boolean,
    width?: number,
    readonly?: boolean,
    style?: any,
    multiValue?: boolean, //TODO
    containerStyle?: any,
    onChangeValue?: (newvalue: ?(string[] | string)) => void,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
    testID?: string,
    isTyping?: boolean,
    isPrism?: Boolean,
  };
  state: {
    isActive: boolean,
    isTyping: boolean,
    editedValue?: string[] | string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: props.isTyping,
      editedValue: undefined,
    };
  }
  componentDidUpdate(prevProps: any) {
    if (this.props.isTyping === prevProps.isTyping) {
      return;
    }
    this.setState({
      isTyping: this.props.isTyping,
    });
  }
  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({isActive: false, isTyping: true});
  };

  commitTyping = (newValue: string) => {
    this.setState({editedValue: newValue}, this.commitEdit);
  };

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      isActive: true,
      editedValue: this.props.combineOptions
        ? split(this.props.value, this.props.options)
        : this.props.value,
    });
  };

  isMultiColumn(): boolean {
    return (
      this.props.options != undefined && this.props.options[0] instanceof Array
    );
  }

  getEditedColumnValue(columnIndex: number): ?string {
    if (this.isMultiColumn()) {
      if (
        this.state.editedValue === undefined ||
        this.state.editedValue.length <= columnIndex
      ) {
        return undefined;
      }
      return this.state.editedValue[columnIndex];
    }
    return this.state.editedValue;
  }

  updateValue(newValue?: string, columnIndex: number): void {
    let editedColumnValue: ?string = this.getEditedColumnValue(columnIndex);
    if (newValue === editedColumnValue) {
      newValue = undefined;
    }
    if (this.isMultiColumn()) {
      let editedValue: (?string)[] = this.state.editedValue;
      if (editedValue instanceof Array === false) {
        editedValue = this.props.options.map((option) => undefined);
      }
      while (editedValue.length <= columnIndex) {
        editedValue.push(undefined);
      }
      editedValue[columnIndex] = newValue;
      if (this.updateConfirm()) {
        this.setState({editedValue});
      } else {
        this.setState({editedValue}, this.commitEdit);
      }
    } else {
      if (this.updateConfirm()) {
        this.setState({editedValue: newValue});
      } else {
        this.setState({editedValue: newValue}, this.commitEdit);
      }
    }
  }

  commitEdit = (nextFocusField?: string) => {
    let combinedValue =
      this.props.combineOptions != undefined &&
      this.state.editedValue instanceof Array
        ? this.format(this.state.editedValue)
        : this.state.editedValue;
    if (this.props.onChangeValue) {
      this.props.onChangeValue(combinedValue);
    }
    this.setState({isActive: false, isTyping: false});
    if (nextFocusField != undefined && this.props.transferFocus) {
      this.props.transferFocus.onTransferFocus(nextFocusField);
    }
  };

  cancelEdit = () => {
    this.setState({isActive: false, editedValue: undefined, isTyping: false});
  };

  clear = () => {
    let clearedValue;
    if (this.state.editedValue instanceof Array) {
      clearedValue = this.state.editedValue.map((columnValue) => undefined);
    }
    this.setState({editedValue: clearedValue}, () => this.commitEdit());
  };

  sumArray(arr: any[]) : number {
    return arr.reduce((a, b) => {
      let rightIndex = (a === undefined) ? 0 : Number(a);
      let leftIndex = (b === undefined) ? 0 : Number(b);
      return rightIndex + leftIndex;
    });
  }

  format(value: ?string | ?(string[])): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    let formattedValue: string = '';
    if (this.props.isPrism && value instanceof Array && value.length === 8) {
      let prismSumA : number= this.sumArray([value[0], value[1], value[2]]);
      let suffixA : string= value[3] !== undefined ? `${value[3]} ` : '';
      let prismSumB : number = this.sumArray([value[4], value[5], value[6]]);
      let suffixB : string= value[7] !== undefined ? value[7] : '';

      formattedValue = `${(prismSumA === 0) ? '' : prismSumA} ${suffixA}${(prismSumB === 0) ? '' : prismSumB} ${suffixB}`;
    } else if (value instanceof Array) {
      value.forEach((columnValue: ?string, columnIndex: number) => {
        if (columnValue !== undefined) {
          if (
            this.props.prefix !== undefined &&
            this.props.prefix !== null &&
            this.props.prefix.length > columnIndex &&
            this.props.prefix[columnIndex] !== undefined
          ) {
            formattedValue += this.props.prefix[columnIndex];
          }
          if (columnValue !== undefined && columnValue !== null) {
            formattedValue += columnValue;
          }
          if (
            this.props.suffix !== undefined &&
            this.props.suffix !== null &&
            this.props.suffix.length > columnIndex &&
            this.props.suffix[columnIndex] !== undefined
          ) {
            formattedValue += this.props.suffix[columnIndex];
          }
        }
      });
    } else {
      if (this.props.prefix != undefined && !this.isMultiColumn()) {
        formattedValue += this.props.prefix;
      }
      if (value !== undefined && value !== null) {
        formattedValue += value.toString();
      }
      if (this.props.suffix != undefined && !this.isMultiColumn()) {
        formattedValue += this.props.suffix;
      }
    }
    return formattedValue;
  }

  updateConfirm(): boolean {
    return this.props.transferFocus !== undefined || this.isMultiColumn();
  }

  renderPopup() {
    let allOptions: string[][] = this.isMultiColumn()
      ? this.props.options
      : [this.props.options];
    return (
      <TouchableWithoutFeedback
        onPress={this.commitEdit}
        accessible={false}
        testID="popupBackground">
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {postfix(this.props.label, ': ')}
            {this.format(this.state.editedValue)}
          </Text>
          <FocusTile
            type="previous"
            commitEdit={this.commitEdit}
            transferFocus={this.props.transferFocus}
          />
          <FocusTile
            type="next"
            commitEdit={this.commitEdit}
            transferFocus={this.props.transferFocus}
          />
          <ScrollView horizontal={allOptions.length > 3}>
            <View style={styles.flexColumnLayout}>
              <View style={styles.centeredRowLayout}>
                {allOptions.map((options: string[], columnIndex: number) => (
                  <View style={styles.modalColumn} key={columnIndex}>
                    {options.map((option: string, rowIndex: number) => {
                      let isSelected: boolean = this.isMultiColumn()
                        ? this.state.editedValue[columnIndex] === option
                        : this.state.editedValue === option;
                      return (
                        <TouchableOpacity
                          key={rowIndex}
                          onPress={() => this.updateValue(option, columnIndex)}
                          testID={
                            'option' +
                            (this.isMultiColumn()
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
                    {allOptions.length === 1 && !this.props.hideClear && (
                      <ClearTile commitEdit={this.clear} />
                    )}
                    {allOptions.length === 1 &&
                      this.props.freestyle === true && (
                        <KeyboardTile commitEdit={this.startTyping} />
                      )}
                  </View>
                ))}
                {allOptions.length > 1 && !this.props.hideClear && (
                  <View style={styles.modalColumn}>
                    <UpdateTile commitEdit={this.commitEdit} />
                    <ClearTile commitEdit={this.clear} />
                    <RefreshTile commitEdit={this.cancelEdit} />
                    {this.props.freestyle === true && (
                      <KeyboardTile commitEdit={this.startTyping} />
                    )}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    if (this.props.width) {
      style = [{width: this.props.width}, style];
    }
    const formattedValue: string = this.format(this.props.value);
    if (this.state.isTyping) {
      return (
        <TextField
          value={this.props.value}
          autoFocus={true}
          style={style}
          multiline={this.props.multiline}
          onChangeValue={(newValue) => this.commitTyping(newValue)}
          testID={
            this.props.testID ? this.props.testID + 'ActiveField' : undefined
          }
        />
      );
    }
    return (
      <View
        style={
          this.props.containerStyle
            ? this.props.containerStyle
            : styles.fieldFlexContainer
        }>
        <TouchableOpacity
          style={
            this.props.containerStyle
              ? this.props.containerStyle
              : styles.fieldFlexContainer
          }
          onPress={this.startEditing}
          disabled={this.props.readonly}
          testID={this.props.testID ? this.props.testID + 'Field' : undefined}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class ListField extends Component {
  props: {
    value?: string,
    label?: string,
    options: string[],
    width?: number,
    readonly?: boolean,
    freestyle?: boolean,
    style?: any,
    containerStyle?: any,
    popupStyle?: any,
    simpleSelect?: boolean,
    renderOptionsOnly?: boolean,
    multiValue?: boolean,
    isValueRequired?: boolean,
    onChangeValue?: (newvalue: ?string) => void,
  };
  state: {
    isActive: boolean,
    editedValue?: string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      editedValue: this.props.value,
    };
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({isActive: true, editedValue: this.props.value});
  };

  updateValue = (newValue?: string): void => {
    let editedValue: ?string = this.state.editedValue;
    if (!this.props.isValueRequired && newValue === editedValue) {
      newValue = undefined;
    }
    if (this.props.isValueRequired && !newValue) {
      newValue = editedValue;
    }
    this.setState({editedValue: newValue}, this.commitEdit);
  };

  commitEdit = () => {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(this.state.editedValue);
    }
    this.setState({isActive: false});
  };

  cancelEdit = () => {
    this.setState({isActive: false, editedValue: undefined});
  };

  format(value?: string): string {
    if (value === undefined) {
      return '';
    }
    return value;
  }

  renderPopup() {
    return (
      <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {this.props.label}: {this.state.editedValue}
          </Text>
          <View style={[styles.flexColumnLayout, this.props.popupStyle]}>
            <View style={styles.modalColumn}>
              <SelectionList
                items={this.props.options}
                selection={this.state.editedValue}
                simpleSelect={this.props.simpleSelect}
                multiValue={this.props.multiValue}
                renderOptionsOnly={this.props.renderOptionsOnly}
                required={false}
                freestyle={this.props.freestyle}
                onUpdateSelection={this.updateValue}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    if (this.props.width) {
      style = [{width: this.props.width}, style];
    }
    const formattedValue: string = this.format(this.props.value);
    return (
      <View
        style={
          this.props.containerStyle
            ? this.props.containerStyle
            : styles.fieldFlexContainer
        }>
        <TouchableOpacity
          style={
            this.props.containerStyle
              ? this.props.containerStyle
              : styles.fieldFlexContainer
          }
          onPress={this.startEditing}
          disabled={this.props.readonly}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class Clock extends Component {
  props: {
    hidden?: boolean,
  };
  render() {
    if (this.props.hidden) {
      return null;
    }
    return (
      <Image
        source={require('./image/clock.png')}
        style={{
          width: 140 * fontScale,
          height: 140 * fontScale,
          alignSelf: 'center',
          resizeMode: 'contain',
        }}
      />
    );
  }
}

export class TimeField extends Component {
  props: {
    value: string, //Time should always be in 24h format 23:05
    label: string,
    readonly?: boolean,
    past?: boolean,
    future?: boolean,
    isTyping?: boolean,
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    fractions: string[][],
    editedValue: (?string)[],
    isTyping: boolean,
  };
  static defaultProps = {
    readonly: false,
    past: false,
    future: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: [],
      isActive: false,
      fractions: this.generateFractions(),
      isDirty: false,
      isTyping: props.isTyping,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.isTyping === prevProps.isTyping) {
      return;
    }
    this.setState({
      isTyping: this.props.isTyping,
    });
  }

  commitTyping = (newValue: string) => {
    const formattedTime = parseTime24Format(newValue);
    this.setState({
      editedValue: (formattedTime === 'Invalid date') ? [] : this.splitValue(formattedTime) 
    }, 
      this.commitEdit
    );
  };

  startTyping = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({isActive: false, isTyping: true});
  };

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      editedValue: this.splitValue(this.props.value),
      isActive: true,
      isDirty: false,
    });
  };

  commitEdit = () => {
    const editedValue: ?Date = this.combinedValue();
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false, isTyping: this.props.isTyping});
  };

  commitNow = (offset?: ?string) => {
    let time: Date = now();
    if (
      offset !== undefined &&
      offset != null &&
      offset != 0 &&
      offset != '0'
    ) {
      let minutes: number = parseInt(offset.substring(0, offset.indexOf(' ')));
      time.setMinutes(time.getMinutes() + minutes);
    }
    const editedValue: string = formatDate(time, time24Format);
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false});
  };

  cancelEdit = () => {
    this.setState({isActive: false, isTyping: this.props.isTyping});
  };

  clear = () => {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(undefined);
    }
    this.setState({isActive: false});
  };

  format(time24: ?string): string {
    return formatTime(time24);
  }

  generateFractions(): string[][] {
    return [
      ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
      ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      [':00', ':10', ':20', ':30', ':40', ':50'],
      [':05', ':15', ':25', ':35', ':45', ':55'],
      this.props.past
        ? this.props.future
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
  }

  splitValue(value: string): (?string)[] {
    if (!value || value.length < 5) {
      return [];
    }
    const time24: string = value;
    const hour: string = time24.substring(0, 2) + ':00';
    let hour1, hour2, minute1, minute2: ?string;
    if (this.state.fractions[0].indexOf(hour) >= 0) {
      hour1 = hour;
      hour2 = undefined;
    } else {
      hour1 = undefined;
      hour2 = hour;
    }
    const minute: string = ':' + time24.substring(3, 5);
    if (this.state.fractions[2].indexOf(minute) >= 0) {
      minute1 = minute;
      minute2 = undefined;
    } else {
      minute1 = undefined;
      minute2 = minute;
    }
    return [hour1, hour2, minute1, minute2, undefined];
  }

  combinedValue(): string {
    const editedValue = this.state.editedValue;
    //validate for freetyping
    if (typeof editedValue === 'string') {
      const formattedTime = parseTime24Format(editedValue);
      return formattedTime === 'Invalid date' ? undefined : `${formattedTime.substring(0,2)}${formattedTime.substring(3,5)}`;
    }

    let hour: ?string =
      this.state.editedValue[0] === undefined
        ? this.state.editedValue[1]
        : this.state.editedValue[0];
    if (hour === undefined) {
      return undefined;
    }
    hour = hour.substring(0, 2);
    const minute: ?string =
      this.state.editedValue[2] === undefined
        ? this.state.editedValue[3]
        : this.state.editedValue[2];
    return hour + minute;
  }

  updateValue(column: number, newColumnValue: ?string): void {
    let editedValue: (?string)[] = this.state.editedValue;
    if (newColumnValue === this.state.editedValue[column]) {
      newColumnValue = undefined;
    }
    editedValue[column] = newColumnValue;
    if (column === 0) {
      editedValue[1] = undefined;
    }
    if (column === 1) {
      editedValue[0] = undefined;
    }
    if (column === 2) {
      editedValue[3] = undefined;
    }
    if (column === 3) {
      editedValue[2] = undefined;
    }
    if (column === 4) {
      this.commitNow(newColumnValue);
    } else {
      this.setState({editedValue, isDirty: true});
    }
  }

  renderPopup(): Component {
    const fractions: string[][] = this.state.fractions;
    let formattedValue = this.format(
      this.state.isDirty ? this.combinedValue() : this.props.value,
    );
    return (
      <TouchableWithoutFeedback onPress={this.commitEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {this.props.label}: {formattedValue}
          </Text>
          <ScrollView horizontal={true} scrollEnabled={true}>
            <View style={styles.centeredRowLayout}>
              {fractions.map((options: string[], column: number) => {
                return (
                  <View style={styles.modalColumn} key={column}>
                    {options.map((option: string, row: number) => {
                      const formattedOption: string =
                        column < 2 ? formatHour(option) : option;
                      let isSelected: boolean =
                        this.state.editedValue[column] === option;
                      return (
                        <TouchableOpacity
                          key={row}
                          onPress={() => this.updateValue(column, option)}>
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
                              {formattedOption}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
              <View style={styles.modalColumn}>
                {this.props.future !== true && (
                  <TouchableOpacity onPress={() => this.commitNow(0)}>
                    <View style={styles.popupTile}>
                      <Text style={styles.modalTileLabel}>{strings.now}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                <UpdateTile commitEdit={this.commitEdit} />
                <ClearTile commitEdit={this.clear} />
                <RefreshTile commitEdit={this.cancelEdit} />
                <KeyboardTile commitEdit={this.startTyping} />
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    const style = this.props.style ? this.props.style : styles.formField;
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </View>
      );
    }
    if (this.state.isTyping) {
      return (
        <TextField
          prefix={this.props.prefix}
          value={formattedValue}
          suffix={this.props.suffix}
          autoFocus={true}
          style={style}
          onChangeValue={(newValue) => this.commitTyping(newValue)}
        />
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class DateField extends Component {
  props: {
    value: ?Date | string,
    label: string,
    includeTime?: boolean,
    includeDay?: boolean,
    past: ?boolean,
    future: ?boolean,
    partial: ?boolean,
    age: boolean,
    recent: ?boolean,
    prefix?: string,
    suffix?: string,
    width?: number,
    readonly?: boolean,
    dateFormat?: string,
    style?: any,
    onChangeValue?: (newValue: ?Date) => void,
    testID?: string,
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    fractions: string[][],
    editedValue: string[],
  };
  static defaultProps = {
    includeTime: false,
    includeDay: false,
    partial: true,
    past: true,
    age: false,
    future: false,
    recent: true,
    readOnly: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: [],
      isActive: false,
      fractions: this.generateFractions(),
      isDirty: false,
    };
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      editedValue: this.splitValue(),
      isActive: true,
      isDirty: false,
    });
  };

  commitEdit = () => {
    const editedValue: ?Date = this.combinedValue();
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false});
  };

  cancelEdit = () => {
    this.setState({isActive: false});
  };

  clear = () => {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(undefined);
    }
    this.setState({isActive: false});
  };

  commitToday = () => {
    const editedValue: ?Date = new Date();
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false});
  };

  formatMonth(monthIndex: number): string {
    return formatDate(new Date(1970, monthIndex, 1), 'MMM');
  }

  generateFractions(): string[][] {
    //TODO: localise
    if (this.props.includeTime) {
      const dateTimeOptions: string[][] = [
        ['2017', '2018', '2019', '2020', '2021'], //TODO
        [
          this.formatMonth(0),
          this.formatMonth(1),
          this.formatMonth(2),
          this.formatMonth(3),
          this.formatMonth(4),
          this.formatMonth(5),
        ],
        [
          this.formatMonth(6),
          this.formatMonth(7),
          this.formatMonth(8),
          this.formatMonth(9),
          this.formatMonth(10),
          this.formatMonth(11),
        ],
        ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        [
          '9 am',
          '10 am',
          '11 am',
          '12 pm',
          '1 pm',
          '2 pm',
          '3 pm',
          '4 pm',
          '5 pm',
          '6 pm',
        ], //TODO french
        ['00', '10', '15', '20', '30', '40', '45', '50'],
      ];
      return dateTimeOptions;
    }
    if (this.props.recent) {
      const dateOptions: string[][] = [
        [
          strings.beforeYesterday,
          strings.yesterday,
          strings.today,
          strings.tomorrow,
          strings.in2Days,
        ],
      ];
      return dateOptions;
    }
    const decennia: string[] = this.props.past
      ? this.props.future
        ? [
            '1920',
            '1930',
            '1940',
            '1950',
            '1960',
            '1970',
            '1980',
            '1990',
            '2000',
            '2010',
            '2020',
          ]
        : [
            '1920',
            '1930',
            '1940',
            '1950',
            '1960',
            '1970',
            '1980',
            '1990',
            '2000',
            '2010',
            '2020',
          ]
      : ['2010', '2020'];
    const dateOptions: string[][] = [
      decennia,
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      [
        this.formatMonth(0),
        this.formatMonth(1),
        this.formatMonth(2),
        this.formatMonth(3),
        this.formatMonth(4),
        this.formatMonth(5),
      ],
      [
        this.formatMonth(6),
        this.formatMonth(7),
        this.formatMonth(8),
        this.formatMonth(9),
        this.formatMonth(10),
        this.formatMonth(11),
      ],
      ['10', '20', '30'],
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    ];
    return dateOptions;
  }

  splitValue(): string[] {
    if (!this.props.value) {
      return [];
    }
    const date: Date = this.props.value;
    if (this.props.includeTime) {
      let year: string = formatDate(date, 'YYYY');
      let month1: ?string =
        date.getMonth() > 5 ? undefined : formatDate(date, 'MMM');
      let month2: ?string =
        date.getMonth() <= 5 ? undefined : formatDate(date, 'MMM');
      let week: string =
        'Week ' + (1 + Math.ceil((date.getDate() - date.getDay()) / 7));
      let day: string = formatDate(date, 'DDD');
      let hour: string = formatDate(date, 'H A');
      let minute: string = formatDate(date, 'mm');
      return [year, month1, month2, week, day, hour, minute];
    } else if (this.props.recent) {
      const dayDiff = dayDifference(date, today());
      if (dayDiff > -3 && dayDiff < 3) {
        const dayStrings: string[] = [
          strings.beforeYesterday,
          strings.yesterday,
          strings.today,
          strings.tomorrow,
          strings.in2Days,
        ];
        return [dayStrings[dayDiff + 2]];
      }
    } else {
      let yearTen: string = formatDate(date, 'YYYY').substring(0, 3) + '0';
      let yearOne: string = formatDate(date, 'YYYY').substring(3, 4);
      let month: string = formatDate(date, 'MMM');
      let firstHalf: boolean = date.getMonth() < 6;
      let dayTen: string = formatDate(date, 'DD').substring(0, 1) + '0';
      let day: string = formatDate(date, 'DD').substring(1);
      return [
        yearTen,
        yearOne,
        firstHalf ? month : undefined,
        firstHalf ? undefined : month,
        dayTen,
        day,
      ];
    }
    return [];
  }

  combinedValue(): ?Date {
    if (this.props.includeTime) {
      if (
        this.state.editedValue[0] === undefined ||
        (this.state.editedValue[1] === undefined &&
          this.state.editedValue[2] === undefined) ||
        this.state.editedValue[3] === undefined ||
        this.state.editedValue[4] === undefined ||
        this.state.editedValue[5] === undefined
      ) {
        return undefined;
      }
      let combinedValue: Date = new Date();
      let year: number = parseInt(this.state.editedValue[0]);
      combinedValue.setFullYear(year);
      let month: number =
        this.state.editedValue[1] !== undefined
          ? this.state.fractions[1].indexOf(this.state.editedValue[1])
          : 6 + this.state.fractions[2].indexOf(this.state.editedValue[2]);
      combinedValue.setMonth(month, 1);
      let firstDay: number = combinedValue.getDay();
      let week: number = this.state.fractions[3].indexOf(
        this.state.editedValue[3],
      );
      let day: number = this.state.fractions[4].indexOf(
        this.state.editedValue[4],
      );
      day = week * 7 - firstDay + day + 1;
      let hour: number =
        parseInt(this.state.editedValue[5]) +
        (this.state.editedValue[5] != '12 pm' &&
        this.state.editedValue[5].endsWith('pm')
          ? 12
          : 0);
      let minute: number = this.state.editedValue[6]
        ? parseInt(this.state.editedValue[6])
        : 0;
      combinedValue = new Date(year, month, day, hour, minute, 0, 0);
      return combinedValue;
    }
    if (this.props.recent) {
      const dayStrings: string[] = [
        strings.beforeYesterday,
        strings.yesterday,
        strings.today,
        strings.tomorrow,
        strings.in2Days,
      ];
      const index: number = dayStrings.indexOf(this.state.editedValue[0]);
      if (index >= 0) {
        let value = today();
        if (index == 2) {
          return value;
        }
        return addDays(value, index - 2);
      }
      return undefined;
    }
    if (
      this.state.editedValue[0] === undefined ||
      (this.state.editedValue[2] === undefined &&
        this.state.editedValue[3] === undefined) ||
      (this.state.editedValue[4] === undefined &&
        this.state.editedValue[5] === undefined)
    ) {
      return undefined;
    }
    let combinedValue: Date = new Date();
    if (this.state.editedValue[0] !== undefined) {
      let year: number = parseInt(this.state.editedValue[0]);
      if (this.state.editedValue[1] !== undefined) {
        year += parseInt(this.state.editedValue[1]);
      }
      combinedValue.setFullYear(year);
    }
    if (
      this.state.editedValue[2] !== undefined ||
      this.state.editedValue[3] !== undefined
    ) {
      let month: number =
        this.state.editedValue[2] !== undefined
          ? this.state.fractions[2].indexOf(this.state.editedValue[2])
          : 6 + this.state.fractions[3].indexOf(this.state.editedValue[3]);
      let day: number = 0;
      if (this.state.editedValue[4] !== undefined) {
        day += parseInt(this.state.editedValue[4]);
      }
      if (this.state.editedValue[5] !== undefined) {
        day += parseInt(this.state.editedValue[5]);
      }
      combinedValue.setMonth(month, day);
    }
    return combinedValue;
  }

  updateValue(column: number, newColumnValue: string): void {
    let editedValue: string[] = this.state.editedValue;
    if (newColumnValue === this.state.editedValue[column]) {
      newColumnValue = undefined;
    }
    editedValue[column] = newColumnValue;
    if (this.props.includeTime) {
      if (column === 1) {
        editedValue[2] = undefined;
      } else if (column === 2) {
        editedValue[1] = undefined;
      }
    } else if (this.props.recent) {
    } else {
      if (column === 2) {
        editedValue[3] = undefined;
      } else if (column === 3) {
        editedValue[2] = undefined;
      }
    }
    this.setState({editedValue, isDirty: true});
  }
  getFormat(value: ?Date): string {
    if (this.props.dateFormat) {
      if (this.props.dateFormat === 'yyyy-MM-dd') {
        return officialDateFormat;
      }
      return this.props.dateFormat;
    }
    if (!value) {
      return yearDateFormat;
    }

    let sameYear: boolean = isToyear(value);
    if (sameYear) {
      if (this.props.includeDay) {
        return this.props.includeTime ? dayDateTime24Format : dayDateFormat;
      } else {
        return this.props.includeTime ? dateTime24Format : dateFormat;
      }
    } else {
      if (this.props.includeDay) {
        return this.props.includeTime
          ? dayYearDateTime24Format
          : dayYearDateFormat;
      } else {
        return this.props.includeTime ? yearDateTime24Format : yearDateFormat;
      }
    }
  }

  format(value: ?Date): string {
    if (value instanceof Date) {
      if (this.props.age) {
        return formatAge(value);
      }
      return formatDate(value, this.getFormat(value));
    }
    if (value === undefined) {
      return '';
    }
    let stringValue: string = new String(value).toString();
    if (stringValue === undefined) {
      return '';
    }
    return stringValue;
  }

  renderPopup() {
    const fractions: string[][] = this.state.fractions;
    let formattedValue = this.format(
      this.state.isDirty ? this.combinedValue() : this.props.value,
    );
    return (
      <TouchableWithoutFeedback
        onPress={this.commitEdit}
        accessible={false}
        testID="popupBackground">
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {this.props.label}: {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
          <ScrollView
            horizontal={this.props.recent == false}
            scrollEnabled={this.props.recent == false}>
            <View style={styles.centeredRowLayout}>
              {fractions.map((options: string[], column: number) => {
                return (
                  <View style={styles.modalColumn} key={column}>
                    {options.map((option: string, row: number) => {
                      let isSelected: boolean =
                        this.state.editedValue[column] === option;
                      return (
                        <TouchableOpacity
                          key={row}
                          onPress={() => this.updateValue(column, option)}
                          testID={'option' + (column + 1) + ',' + (row + 1)}>
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
                );
              })}
              <View style={styles.modalColumn}>
                {this.props.past !== true &&
                  this.props.partial !== true &&
                  this.props.recent !== true && (
                    <TouchableOpacity onPress={this.commitToday}>
                      <View style={styles.popupTile}>
                        <Text style={styles.modalTileLabel}>
                          {strings.today}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                <UpdateTile commitEdit={this.commitEdit} />
                <ClearTile commitEdit={this.clear} />
                <RefreshTile commitEdit={this.cancelEdit} />
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    const style = this.props.style ? this.props.style : styles.formField;
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}
          testID={this.props.testID ? this.props.testID + 'Field' : undefined}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class DurationField extends Component {
  props: {
    value: ?Date,
    startDate: ?Date,
    label: string,
    prefix?: string,
    suffix?: string,
    width?: number,
    readonly?: boolean,
    style?: any,
    onChangeValue?: (newValue: ?Date) => void,
  };
  state: {
    isActive: boolean,
    isDirty: boolean,
    fractions: string[][],
    editedValue: string[],
  };
  static popularDurationMinutes: number[] = [
    5, 10, 15, 30, 45, 60, 90, 120, 180, 240,
  ];

  constructor(props: any) {
    super(props);
    this.state = {
      editedValue: [],
      isActive: false,
      fractions: this.generateFractions(),
      isDirty: false,
    };
  }

  startEditing = () => {
    if (this.props.readonly) {
      return;
    }
    this.setState({
      editedValue: this.splitValue(),
      isActive: true,
      isDirty: false,
    });
  };

  commitEdit = () => {
    const editedValue: ?Date = this.combinedValue();
    if (this.props.onChangeValue) {
      this.props.onChangeValue(editedValue);
    }
    this.setState({isActive: false});
  };

  clear = () => {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(undefined);
    }
    this.setState({isActive: false});
  };

  cancelEdit = () => {
    this.setState({isActive: false});
  };

  generateFractions(): string[][] {
    const durationOptions: string[][] = [
      DurationField.popularDurationMinutes.map((minute: number) =>
        capitalize(formatDuration(minute * 60000)),
      ),
    ];
    return durationOptions;
  }

  splitValue(): string[] {
    if (!this.props.value || !this.props.startDate) {
      return [];
    }
    const date: Date = this.props.value;
    const popularValue: string = capitalize(this.format(date));
    return [[popularValue]];
  }

  combinedValue(): ?Date {
    const totalFormattedValue: string = this.state.editedValue[0];
    if (totalFormattedValue === undefined) {
      return undefined;
    }
    const selectedIndex: number =
      this.state.fractions[0].indexOf(totalFormattedValue);
    if (selectedIndex < 0) {
      return undefined;
    }
    const minuteDuration = DurationField.popularDurationMinutes[selectedIndex];
    let end = new Date(this.props.startDate.getTime() + minuteDuration * 60000);
    return end;
  }

  updateValue(column: number, newColumnValue: string): void {
    let editedValue: string[] = this.state.editedValue;
    if (newColumnValue === this.state.editedValue[column]) {
      newColumnValue = undefined;
    }
    editedValue[column] = newColumnValue;
    this.setState({editedValue, isDirty: true});
  }

  format(value: ?Date): string {
    if (value instanceof Date) {
      return formatDuration(this.props.startDate, value);
    }
    if (value === undefined) {
      return '';
    }
    let stringValue: string = new String(value).toString();
    if (stringValue === undefined) {
      return '';
    }
    return stringValue;
  }

  renderPopup() {
    const fractions: string[][] = this.state.fractions;
    let formattedValue = capitalize(
      this.format(this.state.isDirty ? this.combinedValue() : this.props.value),
    );
    return (
      <TouchableWithoutFeedback onPress={this.commitEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>
            {this.props.label}: {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
          <View>
            <View style={styles.centeredRowLayout}>
              {fractions.map((options: string[], column: number) => {
                return (
                  <View style={styles.modalColumn} key={column}>
                    {options.map((option: string, row: number) => {
                      let isSelected: boolean =
                        this.state.editedValue[column] == option;
                      return (
                        <TouchableOpacity
                          key={row}
                          onPress={() => this.updateValue(column, option)}>
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
                );
              })}
              <View style={styles.modalColumn}>
                <UpdateTile commitEdit={this.commitEdit} />
                <ClearTile commitEdit={this.clear} />
                <RefreshTile commitEdit={this.cancelEdit} />
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style
      ? this.props.style
      : this.state.isActive
      ? styles.inputFieldActive
      : styles.inputField;
    const formattedValue: string = this.format(this.props.value);
    if (this.props.readonly) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.fieldFlexContainer}>
        <TouchableOpacity
          style={styles.fieldFlexContainer}
          onPress={this.startEditing}
          disabled={this.props.readonly}>
          <Text style={style}>
            {this.props.prefix}
            {formattedValue}
            {this.props.suffix}
          </Text>
        </TouchableOpacity>
        {this.state.isActive === true && (
          <Modal
            visible={this.state.isActive === true}
            transparent={true}
            animationType={'slide'}
            onRequestClose={this.cancelEdit}>
            {this.renderPopup()}
          </Modal>
        )}
      </View>
    );
  }
}

export class Button extends Component {
  props: {
    title: string,
    visible?: boolean,
    disabled?: boolean,
    loading?: boolean,
    onPress?: () => void,
    testID?: string,
  };
  static defaultProps = {
    visible: true,
    loading: false,
  };
  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        disabled={this.props.disabled || this.props.loading}
        testID={
          this.props.testID ? this.props.testID : this.props.title + 'Button'
        }>
        <View
          style={[
            this.props.disabled ? styles.buttonDisabled : styles.button,
            this.props.buttonStyle,
          ]}>
          {this.props.loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={
                this.props.disabled
                  ? styles.buttonDisabledText
                  : styles.buttonText
              }>
              {this.props.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
}

export class CheckButton extends Component {
  props: {
    isChecked: boolean,
    prefix?: string,
    suffix?: string,
    visible?: boolean,
    readonly?: boolean,
    onSelect: () => void,
    onDeselect: () => void,
    style?: any,
    testID?: string,
  };
  static defaultProps = {
    visible: true,
  };
  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <TouchableOpacity
        activeOpacity={1}
        disabled={this.props.readonly}
        onPress={
          this.props.isChecked == true
            ? this.props.onDeselect
            : this.props.onSelect
        }
        testID={
          this.props.testID ? this.props.testID + 'CheckButton' : 'checkButton'
        }>
        <View style={styles.centeredRowLayout}>
          {this.props.prefix != undefined && (
            <Text
              style={
                this.props.style ? this.props.style : styles.checkButtonLabel
              }>
              {this.props.prefix}
            </Text>
          )}
          <Icon
            name={
              this.props.isChecked
                ? 'checkbox-marked'
                : 'checkbox-blank-outline'
            }
            style={styles.checkButtonIcon}
          />
          {this.props.suffix != undefined && (
            <Text
              style={
                this.props.style ? this.props.style : styles.checkButtonLabel
              }>
              {this.props.suffix}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
}

export class BackButton extends Component {
  props: {
    navigation: any,
    visible?: boolean,
  };
  static defaultProps = {
    visible: true,
  };

  navigateBack = () => {
    this.props.navigation.navigate('back');
  };

  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={this.navigateBack}
        enable={this.props.disabled != true}
        testID="backButton">
        <View style={styles.menuButton}>
          <Icon name="arrow-left" style={styles.menuIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class AddButton extends Component {
  props: {
    onPress: () => void,
    visible?: boolean,
  };
  static defaultProps = {
    visible: true,
  };

  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <NativeBaseButton
        block
        style={styles.addButton}
        onPress={this.props.onPress}>
        <NativeBaseIcon icon="plus" />
      </NativeBaseButton>
    );
  }
}

export class FloatingButton extends Component {
  props: {
    options: string[],
    onPress: (option: ?string) => void,
  };
  state: {
    active: boolean,
    options: string[],
  };

  constructor(props: any) {
    super(props);
    this.state = {
      active: false,
      options: this.props.options.slice(0).reverse(),
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.options != prevProps.options) {
      this.setState({options: this.props.options.slice(0).reverse()});
    }
  }

  toggleActive = () => {
    const wasActive: boolean = this.state.active;
    if (wasActive) {
      this.setState({active: false});
      this.props.onPress(undefined);
    } else {
      this.setState({active: true});
    }
    //this.setState({active: !wasActive}, () => {if (wasActive) this.props.onPress(undefined);});
    //if (!wasActive) setTimeout(() => {this.setState({active: false, options: []})}, 5000);
  };

  renderAlert() {
    const options: any = this.state.options;
    if (!options) {
      return null;
    }
    return (
      <SelectionDialog
        visible={this.state.active}
        label={strings.addExamMessage}
        options={options}
        onSelect={(selectedData: any) => {
          this.toggleActive();
          this.props.onPress(selectedData);
        }}
        onCancel={() => this.toggleActive()}
      />
    );
  }

  render() {
    if (!this.state.options) {
      return null;
    }
    if (this.state.active) {
      return this.renderAlert();
    }
    return (
      <FAB
        open={this.state.active}
        onStateChange={this.toggleActive}
        position="bottomRight"
        style={styles.floatingButton}
        icon={this.state.active ? 'minus' : 'plus'}
        onPress={() => {
          this.toggleActive();
        }}
      />
    );
  }
}

export class Lock extends PureComponent {
  props: {
    locked: boolean,
    style: any,
  };
  render() {
    if (this.props.locked === true) {
      return (
        <Icon name="lock" style={this.props.style} color={selectionFontColor} />
      );
    }
    return (
      <Icon
        name="lock-open-outline"
        style={this.props.style}
        color={selectionFontColor}
      />
    );
  }
}

export class Pencil extends PureComponent {
  props: {
    style: any,
  };
  render() {
    return (
      <Icon
        name="pencil-off-outline"
        style={this.props.style}
        color={selectionFontColor}
      />
    );
  }
}

export class SelectionListRow extends PureComponent {
  props: {
    label: string,
    selected: boolean | string,
    onSelect: (select: boolean | string) => void,
    maxLength?: number,
    simpleSelect?: boolean,
    testID: string,
    textStyle?: any,
  };
  static defaultProps = {
    maxLength: 60,
    simpleSelect: false,
  };

  toggleSelect() {
    if (this.props.simpleSelect === true) {
      if (this.props.selected === true) {
        this.props.onSelect(false);
      } else {
        this.props.onSelect(true);
      }
    } else {
      if (this.props.selected === true) {
        this.props.onSelect('-');
      } else if (this.props.selected === '-') {
        this.props.onSelect('?');
      } else if (this.props.selected === '?') {
        this.props.onSelect('+');
      } else if (this.props.selected === '+') {
        this.props.onSelect(false);
      } else {
        this.props.onSelect(true);
      }
    }
  }

  formatLabel(): string {
    if (
      this.props.label === undefined ||
      this.props.label === null ||
      this.props.label.length <= this.props.maxLength
    ) {
      return this.props.label;
    }
    return (
      this.props.label.substr(0, 20) +
      '...' +
      this.props.label.substr(
        this.props.label.length - this.props.maxLength + 20,
      )
    );
  }

  render() {
    let textStyle1 = this.props.textStyle
      ? this.props.textStyle
      : styles.listText;
    const textStyle = this.props.selected
      ? styles.listTextSelected
      : textStyle1;
    const prefix: string = this.props.selected
      ? this.props.selected === true
        ? undefined
        : '(' + this.props.selected + ') '
      : undefined;
    return (
      <TouchableOpacity
        underlayColor={selectionColor}
        onPress={() => this.toggleSelect()}
        testID={this.props.testID}>
        <View style={styles.listRow}>
          <Text style={textStyle}>
            {prefix}
            {this.formatLabel()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

export function selectionPrefix(selection: ?string): string {
  if (
    selection === null ||
    selection === undefined ||
    selection.startsWith === undefined
  ) {
    return '';
  }
  if (selection.startsWith('(+) ')) {
    return '(+) ';
  } else if (selection.startsWith('(-) ')) {
    return '(-) ';
  } else if (selection.startsWith('(?) ')) {
    return '(?) ';
  }
  return '';
}

export function stripSelectionPrefix(selection: ?string): string {
  if (
    selection === null ||
    selection === undefined ||
    selection.startsWith === undefined
  ) {
    return selection;
  }
  if (
    selection.startsWith('(+) ') ||
    selection.startsWith('(-) ') ||
    selection.startsWith('(?) ')
  ) {
    return selection.substr(4);
  }
  return selection;
}

export class SelectionList extends React.PureComponent {
  props: {
    label: string,
    items: string[],
    selection?: string | string[],
    required?: boolean,
    multiValue?: boolean,
    freestyle?: boolean,
    simpleSelect?: boolean,
    renderOptionsOnly?: boolean,
    onUpdateSelection: (selection: ?(string[] | string)) => void,
    fieldId: string,
  };
  state: {
    searchable: boolean,
    filter: string,
  };
  static defaultProps = {
    selection: undefined,
    required: false,
    multiValue: false,
    freestyle: false,
    simpleSelect: false,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      searchable: this.isSearchable(this.props.items),
      filter: '',
    };
  }

  isSearchable(items: string[]): boolean {
    return (
      this.props.freestyle === true || (items != undefined && items.length > 20)
    );
  }

  select(item: string, select: boolean | string) {
    if (this.props.multiValue) {
      let selection: string[] = this.props.selection
        ? this.props.selection
        : [];
      const index = selection.indexOf(item);
      if (index === -1) {
        if (select === true) {
          selection.push(item);
        }
      } else {
        if (select !== true) {
          selection.splice(index, 1);
        }
      }
      this.props.onUpdateSelection(selection);
    } else {
      let selection: ?string;
      if (select === true) {
        selection = item;
      } else if (select === '+') {
        selection = '(+) ' + item;
      } else if (select === '-') {
        selection = '(-) ' + item;
      } else if (select === '?') {
        selection = '(?) ' + item;
      }
      this.props.onUpdateSelection(selection);
    }
    if (this.state.filter !== '') {
      this.setState({filter: ''});
    }
  }

  isSelected(item: string): boolean | string {
    const selection: string | string[] | void = this.props.selection;
    if (!selection) {
      return false;
    }
    if (selection instanceof Array) {
      let index = selection.indexOf(item); //TODO: +-?
      return index > -1;
    }
    if (selection === item) {
      return true;
    }
    if (selection === '(+) ' + item) {
      return '+';
    }
    if (selection === '(-) ' + item) {
      return '-';
    }
    if (selection === '(?) ' + item) {
      return '?';
    }
    return false;
  }

  hasSelection(): boolean {
    return this.selectedCount() > 0;
  }

  selectedCount(): number {
    if (this.props.multiValue) {
      if (this.props.selection instanceof Array) {
        return this.props.selection.length;
      }
      return 0;
    }
    if (this.props.selection !== undefined) {
      return 1;
    }
    return 0;
  }

  renderFilterField() {
    if (!this.state.searchable) {
      return null;
    }
    return (
      <TouchableWithoutFeedback>
        <TextInput
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchField}
          value={this.state.filter}
          onChangeText={(filter: string) => this.setState({filter})}
          testID={this.props.fieldId + '.filter'}
        />
      </TouchableWithoutFeedback>
    );
  }

  renderMostUsed() {
    //TODO or not
  }

  itemsToShow(): any[] {
    let data: any[];
    if (this.props.selection instanceof Array) {
      for (let selection: string of this.props.selection) {
        if (!this.props.items.includes(selection)) {
          if (data === undefined) {
            data = [].concat(this.props.items);
          }
          data.unshift(selection);
        }
      }
    } else if (this.props.selection) {
      let selection: string = stripSelectionPrefix(this.props.selection);
      if (!this.props.items.includes(selection)) {
        data = [].concat(this.props.items);
        data.unshift(selection);
      }
    }
    const filter: ?string =
      this.state.filter !== undefined && this.state.filter !== ''
        ? deAccent(this.state.filter.trim().toLowerCase())
        : undefined;
    if (filter) {
      if (!data) {
        data = this.props.items;
      }
      data = data.filter(
        (item: string) =>
          item != null &&
          item !== undefined &&
          item.trim().length > 0 &&
          deAccent(item.toLowerCase()).indexOf(filter) >= 0,
      );
    }
    if (
      this.props.freestyle &&
      data !== undefined &&
      data.length === 0 &&
      this.state.filter &&
      this.state.filter.length > 0 &&
      !this.props.renderOptionsOnly
    ) {
      data.push(this.state.filter);
    }
    if (data === undefined) {
      data = [].concat(this.props.items);
    }
    return data;
  }

  renderItem = ({item}) => {
    return (
      <SelectionListRow
        label={item}
        simpleSelect={this.props.simpleSelect}
        selected={this.isSelected(item)}
        onSelect={(isSelected: boolean | string) =>
          this.select(item, isSelected)
        }
        testID={this.props.label + '.option.' + item}
      />
    );
  };

  render() {
    let style: string =
      this.props.required && !this.hasSelection()
        ? styles.boardTodo
        : styles.board;
    let data: any[] = this.itemsToShow();
    return (
      <View style={style}>
        {this.props.label && (
          <Label
            style={styles.screenTitle}
            value={this.props.label}
            suffix=""
            fieldId={this.props.fieldId}
          />
        )}
        {this.renderFilterField()}
        <FlatList
          initialNumToRender={20}
          data={data}
          keyExtractor={(item) => item}
          renderItem={this.renderItem}
          style={styles.flatListScroll}
        />
      </View>
    );
  }
}

export class NativeBar extends Component {
  props: {
    message: string,
    onDismissAction: () => void,
  };
  state: {
    visible: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      visible: true,
    };
  }
  onDismiss = () => {
    this.setState({visible: false});
    this.props.onDismissAction();
  };
  render() {
    return (
      <View style={styles.snackbarFixed}>
        <Snackbar
          visible={this.state.visible}
          onDismiss={this.onDismiss}
          action={{
            label: strings.close,
            onPress: () => {
              this.onDismiss;
            },
          }}>
          {this.props.message}
        </Snackbar>
      </View>
    );
  }
}

type AlertProps = {
  style: any,
  title?: string,
  message?: string,
  data?: any,
  dismissable?: boolean,
  confirmActionLabel: string,
  cancelActionLabel: string,
  emailActionLabel?: string,
  onConfirmAction: (selectedData: ?any) => void,
  onCancelAction: () => void,
  onEmailAction?: (selectedData: ?any) => void,
  isActionVertical?: boolean,
  multiValue?: boolean,
};
type AlertState = {
  visible: boolean,
  data?: any,
};

export class Alert extends Component<AlertProps, AlertState> {
  constructor(props: AlertProps) {
    super(props);
    this.state = {
      visible: true,
      data: this.props.data,
    };
  }
  static defaultProps = {
    title: '',
    message: '',
    dismissable: false,
  };

  isDisabled(): boolean {
    if (!this.props.multiValue) {
      return false;
    }
    let data: any = this.state.data;
    data = data.filter((element: any) => element.isChecked);
    return !(data && data.length > 0);
  }
  cancelDialog = () => {
    this.setState({visible: false});
    this.props.onCancelAction();
  };
  confirmDialog = (selectedData: ?any) => {
    this.setState({visible: false});
    this.props.onConfirmAction(
      selectedData === undefined ? this.state.data : selectedData,
    );
  };
  emailDialog = (selectedData: ?any) => {
    this.setState({visible: false});
    this.props.onEmailAction(
      selectedData === undefined ? this.state.data : selectedData,
    );
  };

  toggleCheckbox(index: number) {
    let data: any = this.state.data;
    const item: any = data[index];

    if (item.singleSelection) {
      data.map((element: any, i: number) => {
        if (element.entityId === item.entityId && index !== i) {
          data[i].isChecked = false;
        }
      });
    }

    data[index].isChecked = !data[index].isChecked;
    this.setState({data});
  }

  renderContent() {
    if (!isEmpty(this.props.message)) {
      return (
        <View style={{height: 'auto', maxHeight: 300 * fontScale}}>
          <ScrollView>
            <Paragraph>{this.props.message}</Paragraph>
          </ScrollView>
        </View>
      );
    } else if (!isEmpty(this.props.data)) {
      if (this.props.data instanceof Array) {
        return (
          <View
            style={
              isWeb
                ? {Height: 'auto', maxHeight: 200}
                : {Height: 'auto', maxHeight: 150}
            }>
            <Dialog.ScrollArea>
              <ScrollView>
                {this.state.data.map((element: any, index: number) => {
                  const item: any = element.label
                    ? element.label
                    : element.description
                    ? element.description
                    : element;
                  return this.props.multiValue ? (
                    <View>
                      <CheckButton
                        isChecked={element.isChecked}
                        onSelect={() => this.toggleCheckbox(index)}
                        onDeselect={() => this.toggleCheckbox(index)}
                        style={styles.alertCheckBox}
                        testID={this.props.testID + '.' + item}
                        suffix={item}
                      />
                      {element.divider && <Divider />}
                    </View>
                  ) : (
                    <NativeBaseButton
                      onPress={() => this.confirmDialog(element)}>
                      {item}
                    </NativeBaseButton>
                  );
                })}
              </ScrollView>
            </Dialog.ScrollArea>
          </View>
        );
      } else {
        return (
          <NativeBaseButton onPress={() => this.confirmDialog(undefined)}>
            {this.props.data.label}
          </NativeBaseButton>
        );
      }
    } else {
      return null;
    }
  }
  render() {
    const disabled: boolean = this.isDisabled();

    return (
      <Portal>
        <Dialog
          visible={this.state.visible}
          onDismiss={this.cancelDialog}
          dismissable={this.props.dismissable}
          style={this.props.style}>
          <Dialog.Title>{this.props.title}</Dialog.Title>
          {!this.props.isActionVertical && (
            <Dialog.Content>{this.renderContent()}</Dialog.Content>
          )}
          <Dialog.Actions
            style={
              this.props.isActionVertical && {flexDirection: 'column-reverse'}
            }>
            <NativeBaseButton onPress={this.cancelDialog}>
              {this.props.cancelActionLabel}
            </NativeBaseButton>
            {this.props.onEmailAction && (
              <NativeBaseButton onPress={() => this.emailDialog(undefined)}>
                {this.props.emailActionLabel}
              </NativeBaseButton>
            )}
            <NativeBaseButton onPress={() => this.confirmDialog(undefined)} disabled={disabled}>
              {this.props.confirmActionLabel}
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
}

export class KeyboardMode extends Component {
  props: {
    mode: any,
    onPress: () => void,
  };
  state: {
    isKeyBoard: boolean,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      isKeyBoard: isWeb,
    };
  }
  onUpdate() {
    this.props.onPress();
  }
  render() {
    const icon: string = this.props.mode === 'desktop' ? 'tablet' : 'keyboard';
    return (
      <TouchableOpacity
        onPress={() => this.onUpdate()}
        testID="keyboardModeIcon">
        <View style={styles.menuButton}>
          <Icon name={icon} style={styles.menuIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

type NoAccessProps = {
  prefix?: string,
};
export class NoAccess extends Component<NoAccessProps> {
  render() {
    return (
      <View>
        <Text style={styles.noAccessText}>
          {(this.props.prefix ? this.props.prefix : '') + strings.noAccess}
        </Text>
      </View>
    );
  }
}
export type SelectionDialogProps = {
  label?: string,
  options: any[],
  onSelect?: (option: ?any) => void,
  onCancel?: () => void,
  visible: boolean,
  testID?: string,
  value?: any,
};
export class SelectionDialog extends Component<
  SelectionDialogProps,
  SelectionDialogState,
> {
  constructor(props: SelectionDialogProps) {
    super(props);
  }

  selectOption(option: any): void {
    if (option.readonly) {
      return;
    }
    this.props.onSelect(option);
  }

  renderPopup() {
    return (
      <TouchableWithoutFeedback
        onPress={this.props.onCancel}
        accessible={false}
        testID="popupBackground">
        <View style={styles.popupBackground}>
          {this.props.label && (
            <Text style={styles.modalTitle}>{this.props.label}</Text>
          )}
          <ScrollView>
            <View style={styles.flexColumnLayout}>
              <View style={styles.centeredRowLayout}>
                <View style={styles.modalColumn}>
                  {this.props.options.map((option: any, rowIndex: number) => {
                    const isSelected: boolean = this.props.value
                      ? option.code === this.props.value.code
                      : false;
                    const popupTileStyle: any = isSelected
                      ? styles.popupTileSelected
                      : styles.popupTile;
                    return (
                      <TouchableOpacity
                        key={rowIndex}
                        onPress={() => this.selectOption(option)}
                        testID={'option' + (rowIndex + 1)}>
                        <View
                          style={
                            option.readonly ? styles.readOnly : popupTileStyle
                          }>
                          <Text style={styles.modalTileLabel}>
                            {formatCodeDefinition(option)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    return (
      <Modal
        visible={this.props.visible}
        transparent={true}
        animationType={'slide'}
        onRequestClose={this.props.onCancel}>
        {this.renderPopup()}
      </Modal>
    );
  }
}
export class SizeTile extends Component {
  props: {
    commitEdit: (field?: string) => void,
    name: string,
    isSelected: boolean,
    minWidth: number,
  };
  render() {
    const style = this.props.isSelected
      ? this.props.minWidth
        ? [styles.popupTileSelected, {minWidth: this.props.minWidth}]
        : styles.popupTileSelected
      : this.props.minWidth
      ? [styles.popupTile, {minWidth: this.props.minWidth}]
      : styles.popupTile;
    return (
      <TouchableOpacity
        onPress={() => this.props.commitEdit(this.props.name)}
        testID="SizeIcon">
        <View style={style}>
          <Icon name={this.props.name} style={styles.modalTileIcon} />
        </View>
      </TouchableOpacity>
    );
  }
}

export class CollapsibleMessage extends PureComponent {
  props: {
    shortMessage: string,
    longMessage: string,
    containerStyle: style,
  };

  state: {
    showFullBillingInfo: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      showFullBillingInfo: false,
    };
  }

  toggleShowFullBillingInfo = () => {
    this.setState({
      showFullBillingInfo: !this.state.showFullBillingInfo,
    });
  };

  render() {
    return (
      <View
        style={
          this.props.containerStyle
            ? this.props.containerStyle
            : [styles.errorCard, {paddingRight: 50 * fontScale}]
        }>
        {!this.state.showFullBillingInfo && (
          <View>
            <TouchableOpacity onPress={this.toggleShowFullBillingInfo}>
              <SpecialText
                style={{textAlign: 'center'}}
                childrenStyles={[
                  {"style1" : styles.boldText},
                  {"style2": styles.readMoreLabel}
                ]}
              >
                {this.props.shortMessage}
              </SpecialText>
            </TouchableOpacity>
          </View>
        )}
        {this.state.showFullBillingInfo && (
          <View>
            <TouchableOpacity onPress={this.toggleShowFullBillingInfo}>
              <SpecialText
                style={{textAlign: 'center'}}
                childrenStyles={[
                  {"style1" : styles.boldText},
                  {"style2": styles.readMoreLabel}
                ]}
              >
                {this.props.longMessage}
              </SpecialText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

export class SpecialText extends PureComponent {
  props: {
    style?: any,
    childrenStyles?: any[]
  };

  constructor(props: any) {
    super(props);
  }

  parseText() {
    if (typeof this.props.children !== 'string') {
      return this.props.children;
    }

    let words = this.props.children.split(" ");
    let groupedWord: string = "";
    let isGroupedWord = false;
    let closeGroup = false;
    let style = undefined;

    return words.map((eachWord: string) => {
      let word = eachWord;

      Array.isArray(this.props.childrenStyles) && this.props.childrenStyles.forEach(eachStyle => {
        const styleName = Object.keys(eachStyle)[0];
        
        if (word.endsWith(`</${styleName}>`)) {
          style = eachStyle[styleName];
          word = word.replace(`</${styleName}>`, '');
          word = word.replace(`<${styleName}>`, '');
          isGroupedWord = true;
          closeGroup = true;
        } else if (word.startsWith(`<${styleName}>`)) {
          word = word.replace(`<${styleName}>`, '');
          groupedWord = '';
          isGroupedWord = true;
          closeGroup = false;
        }
      });

      if (isGroupedWord && closeGroup) {
        isGroupedWord = false;
        closeGroup = false
        groupedWord += `${word} `;
        return <Text style={style && style}>{`${groupedWord} `}</Text>;
      } else if (isGroupedWord && !closeGroup) {
        groupedWord += `${word} `;
        return;
      } else {
        return `${word} `;
      }
    });
  }

  render() {
    return(
      <Text style={this.props.style && this.props.style}>
        {this.parseText()}
      </Text>
    );
  }

}

export class NetworkInfo extends Component {

  render() {
    return (
        <View style={[styles.snackbarFixed, {backgroundColor: '#000'}]}>
          <Snackbar
            visible={true}
            onDismiss={() => {}}
            action={() => {}}>
            <Text>{strings.connectionMessage}</Text>
          </Snackbar>
        </View>
    );
  }
}