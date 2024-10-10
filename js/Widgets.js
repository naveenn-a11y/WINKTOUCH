/**
 * @flow
 */

'use strict';

import React, { Component, PureComponent } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { FieldDefinition } from './Types';

import {
  Divider,
  FAB,
  Button as NativeBaseButton,
  Button as NativeBaseIcon,
  Paragraph,
  Portal,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCodeDefinition } from './Codes';
import { isInTranslateMode, updateLabel } from './ExamDefinition';
import { strings } from './Strings';
import {
  fontScale,
  isWeb,
  selectionColor,
  selectionFontColor,
  styles
} from './Styles';
import {
  addDays,
  capitalize,
  dateFormat,
  dateTime24Format,
  dayDateFormat,
  dayDateTime24Format,
  dayDifference,
  dayYearDateFormat,
  dayYearDateTime24Format,
  deAccent,
  formatAge,
  formatDate,
  formatDuration,
  isEmpty,
  isToyear,
  officialDateFormat,
  today,
  yearDateFormat,
  yearDateTime24Format,
} from './Util';
import Dialog from './utilities/Dialog';
import { CustomModal as Modal } from './utilities/Modal';
import { TextInputWrapper } from './TextInputWrapper';

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
      <Text style={style} testID={`label-${this.props?.value}`}>
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
  disabled?: boolean,
};
export type BinocularsState = {};
export class Binoculars extends PureComponent<
  BinocularsProps,
  BinocularsState,
> {
  render() {
    return (
      <TouchableWithoutFeedback disabled={this.props.disabled ?? false} onPress={this.props.onClick}>
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
    title?: string | null,
    onBlur?: () => void,
  };
  state: {
    value: string,
  };
  static defaultProps = {
    type: 'default',
    autoFocus: false,
    title: null,
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
    this.commitEdit(text);
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
        {this.props.prefix != undefined && <Text style={styles.formPrefix}>{this.props.prefix}</Text>}

        <TextInputWrapper
          value={this.state.value}
          onChangeText={this.updateText}
          onFocus={this.props.onFocus}
          keyboardType={this.props.type}
          autoFocus={this.props.autoFocus}
          readonly={this.props.readonly}
          multiline={this.props.multiline}
          testID={this.props.testID}
          style={style}
          isWeb={isWeb}
          title={this.props.title}
          onBlur={this.props.onBlur}
        />

        {this.props.suffix != undefined && <Text style={styles.formSuffix}>{this.props.suffix}</Text>}
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
              title={this.props.label}
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
          <ScrollView horizontal={false}>
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
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    let style = this.props.style || (this.state.isActive ? styles.inputFieldActive : styles.inputField);
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
          testID={this.props.testID}
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
          <ScrollView horizontal={false}>
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
          <Text testID={this.props?.testID || ''} style={style}>
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
          <ScrollView horizontal={false}>
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
    buttonStyle?: Object,
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
        <View role={this.props.isChecked ? 'checked' : 'unchecked'} style={styles.centeredRowLayout}>
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
            testID={this.props.isChecked ? 'checkedIcon' : 'uncheckedIcon'}
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
        size="small"
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
                : {Height: 'auto', maxHeight: 200}
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
            style={[{flexGrow: 0},
              this.props.isActionVertical && {flexDirection: 'column-reverse'}
            ]}>
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
          <ScrollView horizontal={false}>
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
    let style;

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

export class Prompt extends Component {

  props: {
    style?: any,
    visible: boolean,
    dismissable: boolean,
    title: String,
    content: string,
    dismissText: string,
    confirmText: string,
    cancelDialog: () => void,
    confirmDialog: () => void,
    onDismiss: () => void,
  };

  render() {
    return (
      <Portal theme={{colors: {backdrop: 'transparent'}}} >
        <Dialog
          visible={this.props.visible}
          onDismiss={this.props.onDismiss}
          dismissable={this.props.dismissable}
          style={this.props.style}>
          <Dialog.Title>{this.props.title}</Dialog.Title>
          <Dialog.Content>
            <View>
              <Text>{this.props.content}</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <NativeBaseButton onPress={this.props.cancelDialog}>
              <Text>{this.props.dismissText}</Text>
            </NativeBaseButton>
            <NativeBaseButton onPress={this.props.confirmDialog}>
              <Text>{this.props.confirmText}</Text>
            </NativeBaseButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }
}