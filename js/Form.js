/**
 * @flow
 */

'use strict';

import { PhoneNumberUtil } from 'google-libphonenumber';
import { Component } from 'react';
import {
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  formatAllCodes,
  formatCode,
  formatCodeDefinition,
  formatOptions,
  getAllCodes,
  getCodeDefinition,
  parseCode,
} from './Codes';
import { GroupedForm } from './GroupedForm';
import { ImageField } from './ImageField';
import { formatLabel, getFieldDefinitions, isNumericField } from './Items';
import { GeneralPrismInput } from './Refraction';
import { strings } from './Strings';
import { fontScale, scaleStyle, styles } from './Styles';
import type {
  CodeDefinition,
  FieldDefinition,
  FieldDefinitions,
  GroupDefinition,
} from './Types';
import {
  capitalize,
  deepClone,
  deepEqual,
  formatDate,
  formatRanges,
  getRanges,
  getValue,
  isEmpty,
  jsonDateFormat,
  jsonDateTimeFormat,
  parseDate,
  parseImageURL,
  passesRangeFilter,
  setValue,
  sort,
} from './Util';
import { Microphone } from './Voice';
import {
  ButtonArray,
  CheckButton,
  DateField,
  DurationField,
  Label,
  ListField,
  TextArrayField,
} from './Widgets';
import { NumberField } from './NumberField';
import { TilesField } from './TilesField';
import { TimeField } from './TimeField';

var phoneUtil = PhoneNumberUtil.getInstance();

export class FormRow extends Component {
  render() {
    return <View style={styles.formRow}>{this.props.children}</View>;
  }
}

export class FormTextInput extends Component {
  props: {
    value: ?string,
    errorMessage?: string,
    validation?: string,
    label?: string,
    showLabel?: boolean,
    labelWidth?: number,
    onChangeText?: (text: ?string) => void,
    autoCapitalize?: string,
    autoFocus?: boolean,
    freestyle?: boolean,
    type?: string,
    prefix?: string,
    suffix?: string,
    multiline?: boolean,
    required?: boolean,
    readonly?: boolean,
    speakable?: boolean,
    style?: any,
    containerStyle?: any,
    maxLength?: number,
    maxRows?: number,
    showTextInfoTip?: boolean,
    testID?: string,
    prefixStyle?: any,
    isTyping?: boolean,
  };
  static defaultProps = {
    readonly: false,
    multiline: false,
    showLabel: true,
  };

  state: {
    text: ?string,
    errorMessage: ?string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      text: this.format(this.props.value),
      errorMessage: this.props.errorMessage,
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    //__DEV__  && this.props.label===' OD.Sph' && console.log('TEXTINPUT: props.value:'+prevProps.value+'->'+this.props.value+' state.text:'+prevState.text+'->'+this.state.text+' props.error:'+prevProps.errorMessage+'->'+this.props.errorMessage+' state.error:'+prevState.errorMessage+'->'+this.state.errorMessage);
    if (this.props.value === prevProps.value) {
      return;
    }
    let text: ?string = this.format(this.props.value);
    if (text === this.state.text) {
      if (this.props.errorMessage !== prevProps.errorMessage) {
        this.setState({errorMessage: this.props.errorMessage});
      }
    } else {
      this.setState({text, errorMessage: this.props.errorMessage});
    }
  }

  validate(value: string) {
    if (this.props.validation === undefined) {
      if (
        value === undefined ||
        value === null ||
        (value.trim && value.trim().length === 0)
      ) {
        if (this.props.required) {
          this.setState({errorMessage: strings.requiredError});
        } else {
          if (this.state.errorMessage) {
            this.setState({errorMessage: undefined});
          }
        }
      }
      this.setState({errorMessage: undefined});
      return;
    }
    const errorMessages = strings;
    let validationError: ?string;
    eval(this.props.validation); // NOSONAR
    this.setState({errorMessage: validationError});
  }

  format(input: string): string {
    if (this.props.type === 'phone-pad') {
      try {
        let phoneNumber = phoneUtil.parse(input, 'CA'); //TODO patient country or user country?
        input = phoneUtil.format(phoneNumber, 'CA');
      } catch (error) {}
    }
    return input === undefined ? '' : input;
  }

  commit(input: string) {
    const text: string = this.format(input);
    this.setState({text});
    this.validate(text);
    if (this.props.onChangeText != undefined && text !== this.props.value) {
      this.props.onChangeText(text);
    }
  }

  dismissError = () => {
    this.setState({errorMessage: undefined});
  };

  appendText(text: string) {
    if (text === undefined || text === null || text === '') {
      return;
    }
    let value: string = this.state.text;
    if (
      text.toLowerCase() === 'undo' ||
      text.toLowerCase() === 'remove' ||
      text.toLowerCase() === 'delete'
    ) {
      //TODO: french
      if (!value) {
        return;
      }
      let lines = value.split('\n');
      lines.splice(lines.length - 1, 1);
      value = lines.join('\n');
    } else if (text.toLowerCase() === 'clear') {
      //TODO: french
      if (value === undefined) {
        return;
      }
      value = '';
    } else {
      if (value === undefined || value === null || value === '') {
        value = text;
      } else {
        value = value + '\n';
        value = value + text;
      }
    }
    this.commit(value);
  }

  updateText = (text: string) => {
    const prevText: string = this.state.text;
    const prevLines: string[] = prevText ? prevText.length : [];
    const lines: string[] = text.split('\n');
    if (
      (this.props.maxRows && lines.length <= this.props.maxRows) ||
      (this.props.maxRows && lines.length <= prevLines.length) ||
      !this.props.maxRows
    ) {
      this.setState({text});
    }
  };

  getNumberOfLines(text: string): number {
    const lines: string[] = text.split('\n');
    if (lines === undefined || lines === null) {
      return 0;
    }
    return lines.length;
  }

  render() {
    return (
      <TouchableWithoutFeedback
        onPress={this.dismissError}
        disabled={this.state.errorMessage === undefined}
        testID={
          this.state.errorMessage === undefined
            ? undefined
            : this.props.testID + 'FieldDismissError'
        }
        accessible={false}>
        <View style={[styles.flexColumnLayout, {minHeight: this.props.multiline ? 194.2 * fontScale : 45 * fontScale}]}>
          <View
            style={
              this.props.containerStyle
                ? this.props.containerStyle
                : styles.formElement
            }>
            {this.props.showLabel && (
              <Label width={this.props.labelWidth} value={this.props.label} />
            )}
            {this.props.prefix && (
              <Text style={this.props.prefixStyle ? this.props.prefixStyle : styles.formPrefix} >
                {this.props.prefix}
              </Text>
            )}
            <View style={styles.fieldFlexContainer}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <TextInput
                  value={this.state.text}
                  autoCapitalize={
                    this.props.autoCapitalize != undefined
                      ? this.props.autoCapitalize
                      : this.props.multiline === true
                      ? 'sentences'
                      : 'none'
                  }
                  autoCorrect={false}
                  autoFocus={this.props.autoFocus === true ? true : false}
                  keyboardType={this.props.type}
                  style={
                    this.props.style
                      ? this.props.style
                      : this.props.multiline
                      ? styles.formFieldLines
                      : this.props.readonly
                      ? styles.formFieldReadOnly
                      : styles.formField
                  }
                  onFocus={this.dismissError}
                  onChangeText={this.updateText}
                  onBlur={(event) => this.commit(event.nativeEvent.text)}
                  editable={this.props.readonly !== true}
                  multiline={this.props.multiline === true}
                  maxLength={this.props.maxLength}
                  numberOfLines={this.props.maxRows}
                  onTextLayout={this.handleTextLayout}
                  testID={this.props.testID + 'Field'}
                />
                </TouchableWithoutFeedback>
              {!this.props.readonly &&
                this.props.freestyle != false &&
                (this.props.multiline || this.props.speakable) && (
                  <Microphone
                    onSpoke={(text: string) => this.appendText(text)}
                    style={
                      this.props.multiline
                        ? styles.voiceIconMulti
                        : styles.voiceIcon
                    }
                  />
                )}
            </View>
            {this.props.suffix && (
              <Text style={styles.formSuffix}>{this.props.suffix}</Text>
            )}
            {this.state.errorMessage && (
              <Text style={styles.formValidationError}>
                {this.state.errorMessage}
              </Text>
            )}
          </View>

          {this.props.maxLength && this.props.showTextInfoTip && (
            <Text style={styles.textRight}>
              {strings.characters}:{' '}
              {this.state.text ? this.state.text.length : 0}/
              {this.props.maxLength}
            </Text>
          )}
          {this.props.maxRows && this.props.showTextInfoTip && (
            <Text style={styles.textRight}>
              {strings.lines}:{' '}
              {this.state.text ? this.getNumberOfLines(this.state.text) : 0}/
              {this.props.maxRows}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export class FormNumberInput extends Component {
  props: {
    value?: number,
    errorMessage?: string,
    label: string,
    showLabel?: boolean,
    labelWidth?: number,
    prefix?: string,
    suffix?: string,
    onChangeValue?: (value: ?number) => void,
    readonly?: boolean,
    freestyle?: boolean,
    minValue?: number,
    maxValue?: number,
    stepSize?: number,
    groupSize?: number,
    decimals?: number,
    style?: any,
    options: CodeDefinition[] | string,
    isTyping?: boolean,
    autoFocus?: boolean,
    testID: string,
    unit?: string,
    onBlur?: () => void,
  };
  static defaultProps = {
    readonly: false,
    showLabel: true,
  };

  state: {
    errorMessage?: string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      errorMessage: this.props.errorMessage,
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    //__DEV__  && this.props.name==='OD' && console.log('NUMBERINPUT: props.value:'+prevProps.value+'->'+this.props.value+' state.text:'+prevState.text+'->'+this.state.text+' props.error:'+prevProps.errorMessage+'->'+this.props.errorMessage+' state.error:'+prevState.errorMessage+'->'+this.state.errorMessage);
    if (this.props.value === prevProps.value) {
      return;
    }
    if (this.props.errorMessage !== prevProps.errorMessage) {
      this.setState({errorMessage: this.props.errorMessage});
    }
  }

  validate(value: string) {
    //TODO
    if (
      this.props.freestyle ||
      (this.props.options && this.props.options.includes(value)) ||
      value === undefined ||
      value === null ||
      (value.trim && value.trim().length === 0)
    ) {
      if (this.state.errorMessage) {
        this.setState({errorMessage: undefined});
      }
      return;
    }
    if (
      this.props.suffix &&
      this.props.suffix instanceof String &&
      this.props.suffix.endsWith('Codes')
    ) {
      //TODO: strip suffix and continue with number validation
      if (this.state.errorMessage) {
        this.setState({errorMessage: undefined});
      }
      return;
    }
    if (isNaN(value)) {
      this.setState({errorMessage: 'Not a number'}); //TODO
      return;
    }
    const numberValue: ?number | string = this.parse(value);
    if (
      this.props.minValue !== undefined &&
      this.props.minValue > numberValue
    ) {
      this.setState({errorMessage: 'Too litle'}); //TODO
      return;
    }
    if (
      this.props.maxValue !== undefined &&
      this.props.maxValue < numberValue
    ) {
      this.setState({errorMessage: 'Too big'}); //TODO
      return;
    }
    if (
      this.props.stepSize !== undefined &&
      Number.isInteger(this.props.stepSize * 1000) &&
      (numberValue * 1000) % (this.props.stepSize * 1000) !== 0
    ) {
      this.setState({errorMessage: 'Not right rounded'}); //TODO
      return;
    }

    if (!this.props.validation) {
      this.setState({errorMessage: undefined});
      return;
    }
    const errorMessages = strings;
    let validationError: ?string;
    eval(this.props.validation); // NOSONAR
    this.setState({errorMessage: validationError});
  }

  commit(text: string) {
    this.setState({text});
    this.validate(text);
    if (this.props.onChangeValue) {
      const value: ?number | string = this.parse(text);
      this.props.onChangeValue(value);
    }
  }

  parse(text: string | number): ?number {
    if (typeof text === 'number') {
      return text;
    }
    if (text === undefined || text === null || text?.trim() === '') {
      return undefined;
    }
    if (isFinite(text)) {
      let value: ?number = parseFloat(text); //TODO parseInt if stepsize === 1
      return value;
    }
    return text;
  }

  getRange(): ?[number, number] {
    if (this.props.minValue !== undefined && this.props.maxValue != undefined) {
      return [this.props.minValue, this.props.maxValue];
    }
    return undefined;
  }

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.readonly
      ? styles.formFieldReadOnly
      : this.state.errorMessage
      ? styles.formFieldError
      : styles.formField;
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <NumberField
          {...this.props}
          range={this.getRange()}
          style={style}
          onChangeValue={(newValue: any) => this.commit(newValue)}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormDateInput extends Component {
  props: {
    value: ?string,
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    type?: string,
    dateFormat?: string,
    style?: any,
    onChangeValue?: (newValue: ?string) => void,
    testID?: string,
  };
  static defaultProps = {
    showLabel: true,
  };
  constructor(props: any) {
    super(props);
  }

  updateValue = (value: ?Date): void => {
    if (this.props.readonly) {
      return;
    }
    let newValue: string = formatDate(value, jsonDateFormat);
    this.props.onChangeValue && this.props.onChangeValue(newValue);
  };

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.readonly
      ? styles.formFieldReadOnly
      : this.state.errorMessage
      ? styles.formFieldError
      : styles.formField;
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <DateField
          label={this.props.label}
          value={parseDate(this.props.value)}
          readonly={this.props.readonly}
          past={this.props.type ? this.props.type.includes('past') : undefined}
          future={
            this.props.type ? this.props.type.includes('future') : undefined
          }
          recent={
            this.props.type ? this.props.type.includes('recent') : undefined
          }
          partial={
            this.props.type ? this.props.type.includes('partial') : undefined
          }
          age={this.props.type === 'age'}
          dateFormat={this.props.dateFormat}
          style={style}
          onChangeValue={this.updateValue}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormTimeInput extends Component {
  props: {
    value: ?string,
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    type?: string,
    onChangeValue?: (time: ?string) => void,
    testID: string,
    isTyping?: boolean,
    onBlur?: () => void,
  };
  static defaultProps = {
    showLabel: true,
  };
  constructor(props: any) {
    super(props);
  }

  updateValue = (newTime: ?string): void => {
    if (this.props.readonly) {
      return;
    }
    this.props.onChangeValue && this.props.onChangeValue(newTime);
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <TimeField
          label={this.props.label}
          value={this.props.value}
          readonly={this.props.readonly}
          past={this.props.type ? this.props.type.includes('past') : undefined}
          future={
            this.props.type ? this.props.type.includes('future') : undefined
          }
          style={
            this.props.readonly
              ? styles.formFieldReadOnly
              : this.props.errorMessage
              ? styles.formFieldError
              : styles.formField
          }
          onChangeValue={this.updateValue}
          isTyping={this.props.isTyping}
          testID={this.props.testID + 'Field'}
          onBlur={this.props.onBlur}
        />
      </View>
    );
  }
}

export class FormDateTimeInput extends Component {
  props: {
    value: ?string,
    errorMessage?: string,
    includeDay?: boolean,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    onChangeValue?: (newValue: ?string) => void,
    testID: string,
  };
  static defaultProps = {
    showLabel: true,
  };
  constructor(props: any) {
    super(props);
  }

  updateValue = (value: ?Date): void => {
    if (this.props.readonly) {
      return;
    }
    let newValue: string = formatDate(value, jsonDateTimeFormat);
    this.props.onChangeValue && this.props.onChangeValue(newValue);
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <DateField
          includeTime={true}
          includeDay={this.props.includeDay}
          label={this.props.label}
          value={parseDate(this.props.value)}
          style={
            this.props.readonly
              ? styles.formFieldReadOnly
              : this.props.errorMessage
              ? styles.formFieldError
              : styles.formField
          }
          readonly={this.props.readonly}
          onChangeValue={this.updateValue}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormDurationInput extends Component {
  props: {
    value?: string,
    errorMessage: ?string,
    startDate: string,
    label: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    onChangeValue?: (newValue: ?string) => void,
    testID: string,
  };
  static defaultProps = {
    showLabel: true,
  };
  constructor(props: any) {
    super(props);
  }

  updateValue = (end: ?Date): void => {
    if (this.props.readonly) {
      return;
    }
    let newValue: string = formatDate(end, jsonDateTimeFormat);
    this.props.onChangeValue && this.props.onChangeValue(newValue);
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <DurationField
          label={this.props.label}
          value={parseDate(this.props.value)}
          startDate={parseDate(this.props.startDate)}
          readonly={this.props.readonly}
          style={
            this.props.readonly
              ? styles.formFieldReadOnly
              : this.props.errorMessage
              ? styles.formFieldError
              : styles.formField
          }
          onChangeValue={this.updateValue}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormSwitch extends Component {
  props: {
    value: boolean,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onChangeValue: (newvalue: boolean) => void,
    testID: string,
    readonly?: boolean,
  };
  static defaultProps = {
    value: false,
    showLabel: true,
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <Switch
          disabled={this.props.readonly}
          value={this.props.value}
          onValueChange={this.props.onChangeValue}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormOptions extends Component {
  props: {
    value: ?string | ?number,
    errorMessage?: string,
    options: CodeDefinition[][] | CodeDefinition[],
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    freestyle?: boolean,
    multiline?: boolean,
    prefix?: string,
    suffix?: string,
    onChangeValue: (newvalue: ?string | ?number) => void,
    isTyping?: boolean,
    testID: string,
    hideClear?: boolean,
    listField?: boolean,
    simpleSelect?: boolean,
    isValueRequired?: boolean,
  };
  state: {
    dismissedError: boolean,
    formattedOptions: string[],
  };

  static defaultProps = {
    showLabel: true,
    freestyle: false,
    multiline: false,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      dismissedError: false,
      formattedOptions: formatOptions(this.props.options),
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.options === prevProps.options &&
      this.props.options != undefined &&
      this.props.options !== null &&
      this.props.options.length === prevProps.options.length
    ) {
      return;
    }
    this.setState({
      dismissedError:
        this.state.dismissedError || this.props.value != prevProps.value,
      formattedOptions: formatOptions(this.props.options),
    });
  }

  isMultiOption(): boolean {
    return (
      this.props.options.length > 1 && this.props.options[0] instanceof Array
    );
  }

  formatValue(value: string | number) {
    if (value === undefined || value === null) {
      return '';
    }
    if (
      this.props.options === undefined ||
      this.props.options === null ||
      this.props.options.length === undefined ||
      this.props.options.length === 0
    ) {
      return capitalize(value);
    }
    let option: CodeDefinition = this.props.options.find(
      (option: CodeDefinition) =>
        option.code !== undefined ? option.code === value : option === value,
    );
    if (option) {
      return capitalize(formatCodeDefinition(option));
    }
    return value.toString();
  }

  parseValue(text: ?string | ?(string[])): ?string | ?number {
    if (text === undefined || text === null) {
      return undefined;
    }
    if (this.isMultiOption()) {
      return text;
    }
    const lowerText = text.trim().toLowerCase();
    let index: number = this.state.formattedOptions.findIndex(
      (option: string) => option.trim().toLowerCase() === lowerText,
    );
    if (index < 0 || index >= this.props.options.length) {
      if (this.props.freestyle) {
        return text;
      }
      return undefined;
    }
    let option: CodeDefinition = this.props.options[index];
    if (option.code !== undefined) {
      return option.code;
    }
    return option;
  }

  changeValue = (text: ?string) => {
    let newValue: ?string | ?number = this.parseValue(text);
    if (this.props.onChangeValue) {
      this.props.onChangeValue(newValue);
    }
  };

  dismissError = () => {
    this.setState({dismissedError: true});
  };

  render() {
    const manyOptions: boolean =
      this.props.options.length > 30 || this.props.listField;
    const style = this.props.style
      ? this.props.style
      : this.props.readonly
      ? styles.formFieldReadOnly
      : this.props.errorMessage
      ? styles.formFieldError
      : this.props.multiline
      ? styles.formFieldLines
      : styles.formField;
    return (
      <TouchableWithoutFeedback
        onPress={this.dismissError}
        disabled={this.state.dismissedError == true || !this.props.errorMessage}
        accessible={false}
        testID={this.props.testID + 'DismissError'}>
        <View style={styles.formElement}>
          {this.props.showLabel && this.props.label && (
            <Label width={this.props.labelWidth} value={this.props.label} />
          )}
          {manyOptions ? (
            <ListField
              label={this.props.label}
              style={style}
              readonly={this.props.readonly}
              freestyle={this.props.freestyle}
              options={this.state.formattedOptions}
              value={this.formatValue(this.props.value)}
              onChangeValue={this.changeValue}
              prefix={this.props.prefix}
              suffix={this.props.suffix}
              multiline={this.props.multiline}
              simpleSelect={this.props.simpleSelect}
              isValueRequired={this.props.isValueRequired}
              popupStyle={styles.alignPopup}
              testID={this.props.testID}
            />
          ) : (
            <TilesField
              hideClear={this.props.hideClear}
              label={this.props.label}
              style={style}
              readonly={this.props.readonly}
              options={this.state.formattedOptions}
              combineOptions={this.isMultiOption()}
              errorMessage={this.props.errorMessage}
              value={this.formatValue(this.props.value)}
              onChangeValue={this.changeValue}
              freestyle={this.props.freestyle}
              prefix={this.props.prefix}
              suffix={this.props.suffix}
              multiline={this.props.multiline}
              isTyping={this.props.isTyping && this.props.freestyle}
              testID={this.props.testID}
            />
          )}
          {this.props.errorMessage && !this.state.dismissedError && (
            <Text style={styles.formValidationError}>
              {' '}
              {this.props.errorMessage} {'\u274c'}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export class FormCheckBox extends Component {
  props: {
    value: ?number | string,
    options: CodeDefinition[],
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    onChangeValue?: (newvalue?: number | string) => void,
    style?: any,
    testID?: string,
  };

  isChecked(): boolean {
    return this.props.value === this.enabledValue();
  }

  select = () => {
    if (this.props.readonly) {
      return;
    }
    let enabledValue = this.enabledValue();
    this.props.onChangeValue(enabledValue);
  };

  enabledValue() {
    if (
      this.props.options === undefined ||
      this.props.options === null ||
      this.props.options.length < 2
    ) {
      return true;
    }
    let enabledValue = this.props.options[1];
    if (enabledValue instanceof Object) {
      enabledValue = enabledValue.code;
    }
    return enabledValue;
  }

  deSelect = () => {
    if (this.props.readonly) {
      return;
    }
    this.props.onChangeValue(undefined);
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        {this.props.prefix !== undefined && (
          <Text style={styles.formPrefix}>{this.props.prefix}</Text>
        )}
        <CheckButton
          isChecked={this.isChecked()}
          onSelect={this.select}
          onDeselect={this.deSelect}
          style={this.props.style ? this.props.style : styles.checkButtonLabel}
          testID={this.props.testID}
        />
        {this.props.suffix !== undefined && (
          <Text style={styles.formSuffix}>{this.props.suffix}</Text>
        )}
      </View>
    );
  }
}
export class FormMultiCheckBox extends Component {
  props: {
    value: ?string | string[],
    options: string[],
    singleSelect: boolean,
    optional: boolean,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    onChangeValue?: (newvalue?: number | string) => void,
    style?: any,
    testID?: string,
  };

  isChecked(value): boolean {
    return this.props.singleSelect
      ? this.props.value == value
      : this.props.value.includes(value);
  }
  select = (value) => {
    if (this.props.readonly) {
      return;
    } else {
      this.props.singleSelect
        ? this.props.onChangeValue(value)
        : this.props.onChangeValue([...this.props.value, value]);
    }
  };
  selectAll = () => {
    this.props.onChangeValue(this.props.options.map(({value}) => value));
  };
  deSelect = (value) => {
    if (this.props.readonly) {
      return;
    }
    if (this.props.singleSelect) {
      if (this.props.optional) {
        this.props.onChangeValue(null);
      } else {
        return;
      }
    } else {
      let newValue = this.props.value.filter((opt) => opt !== value);
      this.props.onChangeValue(newValue);
    }
  };
  deSelectAll = () => {
    this.props.onChangeValue(this.props.singleSelect ? '' : []);
  };

  render() {
    return (
      <View style={this.props.style}>
        {!this.props.singleSelect && (
          <View style={styles.checkButtonRow}>
            <CheckButton
              isChecked={this.props.options.length == this.props.value.length}
              onSelect={this.selectAll}
              onDeselect={this.deSelectAll}
              style={
                this.props.style
                  ? this.props.style
                  : styles.multiCheckButtonLabel
              }
              testID={this.props.testID}
            />
            <Text>{strings.all}</Text>
          </View>
        )}
        {this.props.options.map((option) => (
          <View style={styles.checkButtonRow}>
            <CheckButton
              isChecked={this.isChecked(option.value || option)}
              onSelect={() => this.select(option.value || option)}
              onDeselect={() => this.deSelect(option.value || option)}
              style={
                this.props.style
                  ? this.props.style
                  : styles.multiCheckButtonLabel
              }
              testID={this.props.testID + '.' + option?.label ?? option ?? ''}
            />
            <Text>{option?.label || option}</Text>
          </View>
        ))}
      </View>
    );
  }
}

export class FormCode extends Component {
  props: {
    value: ?string | ?number,
    errorMessage?: string,
    code: string,
    filter: {},
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    multiline?: boolean,
    freestyle?: boolean,
    autoSelect?: boolean,
    style?: any,
    onChangeValue?: (newvalue: ?string | ?number) => void,
    testID: string,
    isTyping?: boolean,
    hideClear?: boolean,
    listField?: boolean,
    simpleSelect?: boolean,
    rangeFilter?: {},
    selectedIndex?: number,
  };

  getCodeIdentifier() {
    if (this.props.code.includes('.')) {
      return this.props.code.split('.')[1];
    }
    return undefined;
  }

  updateValue = (newValue: ?string) => {
    let newCode: ?string | ?number = parseCode(
      this.props.code,
      newValue,
      this.getCodeIdentifier(),
    );
    this.props.onChangeValue && this.props.onChangeValue(newCode);
  };

  selectedDescription(allDescriptions: string[]): string {
    if (this.props.autoSelect) {
      let selectedIndex: number = 0;
      if (
        allDescriptions === undefined ||
        (this.props.selectedIndex === undefined && allDescriptions.length != 1)
      ) {
        return '';
      } else if (
        this.props.selectedIndex !== undefined &&
        allDescriptions.length > 0
      ) {
        selectedIndex =
          this.props.selectedIndex >= 0 &&
          this.props.selectedIndex < allDescriptions.length
            ? this.props.selectedIndex
            : 0;
      }
      let description: string = formatCode(this.props.code, this.props.value);
      if (!allDescriptions.includes(description)) {
        this.updateValue(allDescriptions[selectedIndex]);
        return allDescriptions[selectedIndex];
      }
      return description;
    }
    return formatCode(this.props.code, this.props.value);
  }

  render() {
    const allDescriptions: string[] = formatAllCodes(
      this.props.code,
      this.props.filter,
    );
    const uniqueOptions: string[] = Array.from(new Set(allDescriptions));
    let selectedDescription: string = this.selectedDescription(uniqueOptions);
    return (
      <FormOptions
        labelWidth={this.props.labelWidth}
        label={this.props.label}
        hideClear={this.props.hideClear}
        showLabel={this.props.showLabel}
        readonly={this.props.readonly}
        freestyle={this.props.freestyle}
        errorMessage={this.props.errorMessage}
        options={uniqueOptions}
        value={selectedDescription}
        onChangeValue={this.updateValue}
        prefix={this.props.prefix}
        suffix={this.props.suffix}
        style={this.props.style}
        multiline={this.props.multiline}
        isTyping={this.props.isTyping}
        listField={this.props.listField}
        simpleSelect={this.props.simpleSelect}
        testID={this.props.testID}
      />
    );
  }
}

export class FormTextArrayInput extends Component {
  props: {
    value: ?(string[]),
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onChangeValue: (newvalue: ?(string[])) => void,
    testID: string,
  };
  static defaultProps = {
    value: [],
    showLabel: true,
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <TextArrayField
          value={this.props.value}
          style={
            this.props.readonly
              ? styles.formFieldReadOnly
              : this.props.errorMessage
              ? styles.formFieldError
              : styles.formField
          }
          onChangeValue={this.props.onChangeValue}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormSelectionArray extends Component {
  props: {
    value: ?(string[]),
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onAdd: (index?: number) => void,
    onRemove?: (index?: number) => void,
    onSelect?: (index: number) => void,
  };
  static defaultProps = {
    value: [],
    showLabel: true,
  };

  render() {
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <ButtonArray
          value={this.props.value}
          style={
            this.props.readonly
              ? styles.formFieldReadOnly
              : this.props.errorMessage
              ? styles.formFieldError
              : styles.formField
          }
          onAdd={this.props.onAdd}
          onRemove={this.props.onRemove}
          onSelect={this.props.onSelect}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class FormInput extends Component {
  props: {
    value: ?string | ?number | ?{},
    singleSelect?: boolean,
    errorMessage?: string,
    definition: FieldDefinition,
    type?: string,
    autoCapitalize?: string,
    multiline?: boolean,
    readonly?: boolean,
    label?: string,
    showLabel?: boolean,
    visible?: boolean,
    style?: any,
    onChangeValue: (value: ?string | ?number) => void,
    patientId: string,
    examId: string,
    filterValue: {},
    isTyping?: boolean,
    hideClear?: Boolean,
    autoFocus?: boolean,
    enableScroll?: () => void,
    disableScroll?: () => void,
    fieldId: string,
    testID?: string,
    customOptions?: CodeDefinition[],
  };
  state: {
    validation?: string,
    newValue: ?string | ?number,
  };
  static defaultProps = {
    showLabel: true,
    visible: true,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      validation: this.generateValidationCode(
        this.props.value,
        this.props.definition,
      ),
      newValue: this.props.value,
    };
  }

  componentDidUpdate(prevProps: any) {
    // update newValue if value has changed
    if (this.props.value !== prevProps.value) {
      this.setState({newValue: this.props.value});
    }
    if (this.state.validation === undefined) {
      let validation = this.generateValidationCode(
        this.props.value,
        this.props.definition,
      );
      if (validation != undefined) {
        this.setState({validation});
      }
    }
  }

  getIsReadOnly(): ?{} {
    if (
      this.props.readonly === true ||
      this.props.definition.readonly === true
    ) {
      return true;
    }
    return false;
  }

  isExisingValue(values: any, element: string) {
    if (values === undefined || values === null) {
      return false;
    }
    if (!(values instanceof Array)) {
      return false;
    }
    for (let i: number = 0; i < values.length; i++) {
      if (element === values[i]) {
        return true;
      }
    }
    return false;
  }

  getLimitedValues(): any {
    if (this.props.definition.limitedValues) {
      const filterEntries: Object = this.props.definition.limitedValues;
      if (filterEntries && filterEntries instanceof Object) {
        const filledValue = getValue(
          this.props.filterValue,
          filterEntries.code,
        );

        let filteredCode: CodeDefinition = getCodeDefinition(
          filterEntries.codes,
          filledValue,
        );
        if (filteredCode && filteredCode.hasLimitedValues) {
          let filteredCodes: CodeDefinition[] = [];
          if (
            filteredCode.limitedValues &&
            filteredCode.limitedValues instanceof Array
          ) {
            const codes: CodeDefinition[] = getAllCodes(filterEntries.options);
            filteredCodes = codes.filter((element: CodeDefinition) =>
              this.isExisingValue(filteredCode.limitedValues, element.code),
            );
          }
          return filteredCodes;
        }
      }
    }
    return this.props.definition.options;
  }

  getFilterValue(): ?{} {
    if (
      this.props.definition.filter instanceof Object &&
      this.props.filterValue instanceof Object
    ) {
      let filledFilter;
      const filterEntries: [][] = Object.entries(this.props.definition.filter);

      for (let i: number = 0; i < filterEntries.length; i++) {
        const filterKey: string = filterEntries[i][0];
        const filterValue: string = filterEntries[i][1];
        if (
          filterValue !== undefined &&
          filterValue !== null &&
          filterValue.startsWith('[') &&
          filterValue.endsWith(']')
        ) {
          if (filledFilter === undefined) {
            filledFilter = deepClone(this.props.definition.filter);
          }
          const filledValue = getValue(
            this.props.filterValue,
            filterValue.substring(1, filterValue.length - 1),
          );
          filledFilter[filterKey] = filledValue;
        }
      }
      return filledFilter != undefined
        ? filledFilter
        : this.props.definition.filter;
    }
    return this.props.definition.filter;
  }

  generateValidationCode(value: string, definition: FieldDefinition): ?string {
    if (definition === undefined) {
      return undefined;
    }
    let validation: string = '';
    if (definition.validation !== undefined && definition.validation !== null) {
      validation = validation + definition.validation + ';\n';
    }
    if (definition.maxLength && definition.maxLength > 0) {
      validation =
        validation +
        'if (value.length>' +
        definition.maxLength +
        ") validationError = '" +
        (definition.maxLengthError
          ? definition.maxLengthError
          : strings.maxLengthError) +
        "';\n";
    }
    if (definition.minLength && definition.minLength > 0) {
      validation =
        validation +
        'if (value.length<' +
        definition.minLength +
        ") validationError = '" +
        (definition.minLengthError
          ? definition.minLengthError
          : strings.minLengthError) +
        "';\n";
    }
    if (definition.required === true) {
      validation =
        "if (value===undefined || value===null || value.trim().length===0) validationError = '" +
        (definition.requiredError
          ? definition.requiredError
          : strings.requiredError) +
        "';\n";
    }
    return validation;
  }

  updateSubValue(
    subGroupDefinition: GroupDefinition,
    field: string,
    value: any,
  ) {
    let image: ?{} = this.props.value;
    if (!image) {
      image = {};
    } //TODO: remove this as it should never happen as it should have gotten initialised by the ExamScreen
    const fieldIdentifier: string = subGroupDefinition.name + '.' + field;
    setValue(image, fieldIdentifier, value);
    this.props.onChangeValue(image);
  }

  getRangeFilterValue(): ?{} {
    if (
      this.props.definition.rangeFilter instanceof Object &&
      this.props.filterValue instanceof Object
    ) {
      let filledFilter;
      const filterEntries: [][] = Object.entries(
        this.props.definition.rangeFilter,
      );

      for (let i: number = 0; i < filterEntries.length; i++) {
        const filterKey: string = filterEntries[i][0];
        const filterValue: string = filterEntries[i][1];
        if (
          filterValue !== undefined &&
          filterValue !== null &&
          filterValue.startsWith('[') &&
          filterValue.endsWith(']')
        ) {
          if (filledFilter === undefined) {
            filledFilter = deepClone(this.props.definition.rangeFilter);
          }
          const filledValue = getValue(
            this.props.filterValue,
            filterValue.substring(1, filterValue.length - 1),
          );
          filledFilter[filterKey] = filledValue;
        }
      }
      return filledFilter != undefined
        ? filledFilter
        : this.props.definition.rangeFilter;
    }
    return this.props.definition.rangeFilter;
  }

  getPrefixStyle() {

    if (this.props.definition.prefixStyle !== undefined) {
      let prefixStyle = {};
      if (this.props.definition.prefixStyle.color !== undefined) {
        prefixStyle = [
          prefixStyle,
          {color: this.props.definition.prefixStyle.color},
        ];
      }
  
      if (this.props.definition.prefixStyle.fontSize !== undefined) {
        prefixStyle = [
          prefixStyle,
          {fontSize: this.props.definition.prefixStyle.fontSize * fontScale},
        ];
      }

      if (this.props.definition.prefixStyle.height !== undefined) {
        prefixStyle = [
          prefixStyle,
          {height: this.props.definition.prefixStyle.height * fontScale},
        ];
      }

      if (this.props.definition.prefixStyle.paddingTop !== undefined) {
        prefixStyle = [
          prefixStyle,
          {paddingTop: this.props.definition.prefixStyle.paddingTop * fontScale},
        ];
      }
      if (this.props.definition.prefixStyle.paddingBottom !== undefined) {
        prefixStyle = [
          prefixStyle,
          {paddingBottom: this.props.definition.prefixStyle.paddingBottom * fontScale},
        ];
      }
      if (this.props.definition.prefixStyle.paddingLeft !== undefined) {
        prefixStyle = [
          prefixStyle,
          {paddingLeft: this.props.definition.prefixStyle.paddingLeft * fontScale},
        ];
      }
      if (this.props.definition.prefixStyle.paddingRight !== undefined) {
        prefixStyle = [
          prefixStyle,
          {paddingRight: this.props.definition.prefixStyle.paddingRight * fontScale},
        ];
      }
      if (this.props.definition.prefixStyle.margin !== undefined) {
        prefixStyle = [
          prefixStyle,
          {margin: this.props.definition.prefixStyle.margin * fontScale},
        ];
      }
      return prefixStyle;
    }

    return null;
  }

  renderFormInput() {
    const label: string = this.props.label
      ? this.props.label
      : formatLabel(this.props.definition);
    const type: ?string = this.props.type
      ? this.props.type
      : this.props.definition.type;
    let style: ?any = this.props.style
      ? this.props.style
      : this.props.readonly || this.props.definition.readonly
      ? this.props.multiline === true || this.props.definition.maxLength > 150
        ? styles.formFieldReadOnlyLines
        : styles.formFieldReadOnly
      : this.props.errorMessage
      ? styles.formFieldError
      : this.props.multiline === true || this.props.definition.maxLength > 150
      ? styles.formFieldLines
      : styles.formField;
    if (this.props.definition.layout !== undefined) {
      if (this.props.definition.layout.borderWidth !== undefined) {
        style = [
          style,
          {borderWidth: this.props.definition.layout.borderWidth * fontScale},
        ];
      }
      if (this.props.definition.layout.fontSize !== undefined) {
        style = [
          style,
          {fontSize: this.props.definition.layout.fontSize * fontScale},
        ];
      }
    }
    const prefixStyle = this.getPrefixStyle();
    const readonly: boolean = this.getIsReadOnly();

    if (!this.props.definition || !this.props.visible) {
      return null;
    }
    if (isNumericField(this.props.definition)) {
      return (
        <FormNumberInput
          value={this.props.value}
          {...this.props.definition}
          errorMessage={this.props.errorMessage}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          label={label}
          showLabel={this.props.showLabel}
          prefix={this.props.definition.prefix}
          suffix={this.props.definition.suffix}
          isTyping={this.props.isTyping}
          autoFocus={this.props.autoFocus}
          style={style}
          testID={this.props.testID}
          unit={this.props.definition.unit}
          onBlur={this.props.onBlur}
        />
      );
    } else if (this.props.definition.hasRange) {
      if (this.props.isTyping) {
        return (
          <FormNumberInput
            value={this.props.value}
            {...this.props.definition}
            errorMessage={this.props.errorMessage}
            readonly={readonly}
            onChangeValue={this.props.onChangeValue}
            label={label}
            showLabel={this.props.showLabel}
            prefix={this.props.definition.prefix}
            suffix={this.props.definition.suffix}
            isTyping={this.props.isTyping}
            autoFocus={this.props.autoFocus}
            style={style}
            testID={this.props.testID}
            unit={this.props.definition.unit}
            onBlur={this.props.onBlur}
          />
        );
      }
      return (
        <FormCodeNumberInput
          value={this.props.value}
          {...this.props.definition}
          rangeFilter={this.getRangeFilterValue()}
          filter={this.getFilterValue()}
          code={this.props.definition.options}
          errorMessage={this.props.errorMessage}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          label={label}
          showLabel={this.props.showLabel}
          prefix={this.props.definition.prefix}
          suffix={this.props.definition.suffix}
          isTyping={this.props.isTyping}
          autoFocus={this.props.autoFocus}
          style={style}
          testID={this.props.testID}
        />
      );
    } else if (this.props.multiOptions) {
      let options = this.props.definition.options;
      return (
        <FormMultiCheckBox
          options={options}
          value={this.props.value}
          optional={this.props.optional}
          singleSelect={this.props.singleSelect}
          label={label}
          showLabel={this.props.showLabel}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          errorMessage={this.props.errorMessage}
          testID={this.props.testID}
          style={this.props.style}
        />
      );
    } else if (
      (this.props.definition.options &&
        this.props.definition.options.length > 0) ||
      (this.props.customOptions && this.props.customOptions.length > 0)
    ) {
      let options = this.props.customOptions
        ? this.props.customOptions
        : this.props.definition.options; //custom option overrides field definition if it exists.
      if (this.props.definition.limitedValues) {
        options = this.getLimitedValues();
      }
      let isNestedCode =
        !(options instanceof Array) &&
        options.endsWith('Codes') &&
        getAllCodes(options)[0] instanceof Array;
      if (isNestedCode) {
        options = getAllCodes(options);
      } else if (!(options instanceof Array)) {
        return (
          <FormCode
            code={options}
            filter={this.getFilterValue()}
            freestyle={this.props.definition.freestyle}
            value={this.props.value}
            hideClear={this.props.hideClear}
            label={label}
            showLabel={this.props.showLabel}
            readonly={readonly}
            errorMessage={this.props.errorMessage}
            prefix={this.props.definition.prefix}
            suffix={this.props.definition.suffix}
            listField={this.props.definition.listField}
            simpleSelect={this.props.definition.simpleSelect}
            autoSelect={this.props.definition.autoSelect}
            selectedIndex={this.props.definition.selectedIndex}
            onChangeValue={this.props.onChangeValue}
            style={style}
            multiline={
              this.props.multiline === true ||
              this.props.definition.maxLength > 150
            }
            isTyping={this.props.isTyping}
            rangeFilter={this.getRangeFilterValue()}
            testID={this.props.testID}
          />
        );
      } else if (
        options.length === 2 &&
        (options[0] === undefined ||
          options[0] === null ||
          options[0] === false ||
          options[0].toString().trim() === '' ||
          this.props.definition.defaultValue === options[0])
      ) {
        return (
          <FormCheckBox
            options={options}
            value={this.props.value}
            label={label}
            showLabel={this.props.showLabel}
            readonly={readonly}
            onChangeValue={this.props.onChangeValue}
            style={style}
            errorMessage={this.props.errorMessage}
            testID={this.props.testID}
          />
        );
      }

      //auto select implementation
      let value = this.props.value
      if (this.props.definition.autoSelect && options.length > 0 && isEmpty(value)) {
        value = options[0]
        this.props.onChangeValue(value)
      }

      return (
        <FormOptions
          options={options}
          freestyle={this.props.definition.freestyle}
          value={value}
          label={label}
          showLabel={this.props.showLabel}
          errorMessage={this.props.errorMessage}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          style={style}
          prefix={this.props.definition.prefix}
          suffix={this.props.definition.suffix}
          multiline={
            this.props.multiline === true ||
            this.props.definition.maxLength > 150
          }
          isTyping={this.props.isTyping}
          listField={this.props.definition.listField}
          simpleSelect={this.props.definition.simpleSelect}
          testID={this.props.testID}
        />
      );
    } else if ((type && type.includes('Date')) || type === 'age') {
      return (
        <FormDateInput
          value={this.props.value}
          label={label}
          showLabel={this.props.showLabel}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          type={type}
          dateFormat={this.props.definition.dateFormat}
          style={style}
          errorMessage={this.props.errorMessage}
          testID={this.props.testID}
        />
      );
    } else if (
      type === 'time' ||
      type === 'pastTime' ||
      type === 'futureTime'
    ) {
      return (
        <FormTimeInput
          value={this.props.value}
          label={label}
          showLabel={this.props.showLabel}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          type={type}
          style={style}
          errorMessage={this.props.errorMessage}
          isTyping={this.props.isTyping}
          testID={this.props.testID}
          onBlur={this.props.onBlur}
        />
      );
    } else if (this.props.definition.image !== undefined) {
      let replaceImage: boolean = true;
      const arrayStart: number = this.props.fieldId
        ? this.props.fieldId.indexOf('[') + 1
        : -1;
      const arrayEnd: number =
        this.props.fieldId && arrayStart >= 0
          ? this.props.fieldId.indexOf('].', arrayStart)
          : -1;
      if (this.props.fieldId && arrayStart >= 0 && arrayEnd > arrayStart) {
        //An image in a multivalue group
        replaceImage = false;
      }
      let image = this.props.definition.image;
      let value = this.props.value;
      if (
        image !== undefined &&
        image !== null &&
        image.startsWith('[') &&
        image.endsWith(']')
      ) {
        value = {image: this.props.value};
      }

      image = parseImageURL(image);

      return (
        <ImageField
          ref="imageField"
          value={value}
          image={image}
          fileName={this.props.definition.name}
          resolution={this.props.definition.resolution}
          size={this.props.definition.size}
          popup={this.props.definition.popup}
          drawable={this.props.definition.drawable}
          multiValue={this.props.definition.multiValue}
          sync={this.props.definition.sync}
          readonly={readonly}
          onChangeValue={this.props.onChangeValue}
          style={style}
          patientId={this.props.patientId}
          examId={this.props.examId}
          type={type}
          errorMessage={this.props.errorMessage}
          enableScroll={this.props.enableScroll}
          disableScroll={this.props.disableScroll}
          replaceImage={replaceImage}
          forceSync={this.props.definition.forceSync}
          testID={this.props.testID}>
          {this.props.definition.fields &&
            this.props.definition?.fields.map(
              (groupDefinition: GroupDefinition, index: number) => (
                <GroupedForm
                  key={groupDefinition.name}
                  onChangeField={(field: string, value: any) => {
                    this.updateSubValue(groupDefinition, field, value);
                    if (this.props.definition.sync && this.refs.imageField) {
                      this.refs.imageField.scheduleScreenShot();
                    }
                  }}
                  definition={groupDefinition}
                  editable={!this.props.readonly}
                  form={getValue(this.props.value, groupDefinition.name)}
                  examId={this.props.examId}
                />
              ),
            )}
        </ImageField>
      );
    } else if (type && type === 'prism') {
      return (
        <GeneralPrismInput
          value={this.props.value}
          showLabel={this.props.showLabel}
          readonly={readonly}
          style={style}
          onChangeValue={this.props.onChangeValue}
          testID={this.props.testID}
        />
      );
    }
    return (
      <FormTextInput
        value={this.props.value}
        errorMessage={this.props.errorMessage}
        onChangeText={this.props.onChangeValue}
        label={label}
        showLabel={this.props.showLabel}
        readonly={readonly}
        validation={this.state.validation}
        type={this.props.type}
        prefix={this.props.definition.prefix}
        suffix={this.props.definition.suffix}
        autoCapitalize={this.props.autoCapitalize}
        multiline={
          this.props.multiline === true || this.props.definition.maxLength > 150
        }
        freestyle={this.props.definition.freestyle}
        style={style}
        maxLength={this.props.definition.maxLength}
        maxRows={this.props.definition.maxRows}
        showTextInfoTip={this.props.definition.showTextInfoTip}
        testID={this.props.testID}
        prefixStyle={prefixStyle}
      />
    ); //TODO keyboardType from definition type
  }

  render() {
    if (!this.props.definition) {
      return null;
    }
    if (this.props.definition.layout) {
      return (
        <View style={scaleStyle(this.props.definition.layout)}>
          {this.renderFormInput()}
        </View>
      );
    }
    return this.renderFormInput();
  }
}

export class FormField extends Component {
  props: {
    value: {id: string},
    fieldName: string,
    autoCapitalize?: string,
    type?: string,
    showLabel?: boolean,
    readonly?: boolean,
    multiline?: boolean,
    onChangeValue: (value: {id: string}) => void,
    patientId: string,
    examId: string,
    enableScroll?: () => void,
    disableScroll?: () => void,
    customOptions?: CodeDefinition[], //overrides options in field definition.
  };
  state: {
    fieldDefinition: ?FieldDefinition,
  };

  static defaultProps = {
    showLabel: true,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      fieldDefinition: this.findFieldDefinition(props),
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.fieldName === prevProps.fieldName) {
      return;
    }
    this.setState({
      fieldDefinition: this.findFieldDefinition(this.props),
    });
  }

  getFieldNames(): string[] {
    return this.props.fieldName.split('.');
  }

  findFieldDefinition(props: any): ?FieldDefinition {
    if (!props.value || !props.value.id) {
      return null;
    }
    let fieldDefinitions: ?FieldDefinitions = getFieldDefinitions(
      props.value.id,
    );
    if (fieldDefinitions === undefined) {
      //__DEV__ && console.warn('No fieldDefinitions exists for '+this.props.value.id);
      return undefined;
    }
    const fieldNames: string[] = this.getFieldNames();
    let fieldDefinition: ?FieldDefinition | ?GroupDefinition;
    for (let i = 0; i < fieldNames.length; i++) {
      fieldDefinition = fieldDefinitions.find(
        (fieldDefinition: FieldDefinition | GroupDefinition) =>
          fieldDefinition.name === fieldNames[i],
      );
      if (fieldDefinition?.fields) {
        fieldDefinitions = fieldDefinition.fields;
      }
    }
    if (fieldDefinition === undefined) {
      //__DEV__ && console.warn('No fieldDefinition \''+this.props.fieldName+'\' exists for '+this.props.value.id);
    }
    return fieldDefinition;
  }

  getFieldValue(): ?number | ?string {
    let value = this.props.value;
    const fieldNames: string[] = this.getFieldNames();
    for (let i: number = 0; i < fieldNames.length; i++) {
      const propertyName: string = fieldNames[i];
      value = value[propertyName];
    }
    return value;
  }

  getErrorMessage(): ?string {
    let value = this.props.value;
    let errorMessage;
    const fieldNames: string[] = this.getFieldNames();
    for (let i: number = 0; i < fieldNames.length; i++) {
      const propertyName: string = fieldNames[i];
      if (i + 1 === fieldNames.length) {
        errorMessage = value[propertyName + 'Error'];
      } else {
        value = value[propertyName];
      }
    }
    return errorMessage;
  }

  setFieldValue = (value: ?string | ?number) => {
    if (this.props.readonly) {
      return;
    }
    let valueContainer: {} = this.props.value;
    const fieldNames: string[] = this.getFieldNames();
    for (let i: number = 0; i < fieldNames.length; i++) {
      const propertyName: string = fieldNames[i];
      if (i === fieldNames.length - 1) {
        valueContainer[propertyName] = value;
        valueContainer[propertyName + 'Error'] = undefined;
      } else {
        valueContainer = valueContainer[propertyName];
      }
    }
    this.props.onChangeValue(this.props.value);
  };

  render() {
    if (this.state.fieldDefinition === undefined) {
      return null;
    }
    return (
      <FormInput
        value={this.getFieldValue()}
        filterValue={this.props.value}
        errorMessage={this.getErrorMessage()}
        definition={this.state.fieldDefinition}
        showLabel={this.props.showLabel}
        readonly={this.props.readonly}
        label={this.props.label}
        type={this.props.type}
        autoCapitalize={this.props.autoCapitalize}
        multiline={this.props.multiline}
        onChangeValue={this.setFieldValue}
        patientId={this.props.patientId}
        examId={this.props.examId}
        enableScroll={this.props.enableScroll}
        disableScroll={this.props.disableScroll}
        testID={this.state.fieldDefinition.name}
        customOptions={this.props.customOptions}
      />
    );
  }
}

export class FormCodeNumberInput extends Component {
  props: {
    value?: number,
    errorMessage?: string,
    label: string,
    showLabel?: boolean,
    labelWidth?: number,
    prefix?: string,
    suffix?: string,
    onChangeValue?: (value: ?number) => void,
    readonly?: boolean,
    freestyle?: boolean,
    minValue?: number,
    maxValue?: number,
    stepSize?: number,
    groupSize?: number,
    decimals?: number,
    style?: any,
    options: CodeDefinition[] | string,
    isTyping?: boolean,
    autoFocus?: boolean,
    testID: string,
    rangeFilter?: {},
    code: string,
    filter?: {},
  };
  static defaultProps = {
    readonly: false,
    showLabel: true,
  };

  state: {
    errorMessage?: string,
    value?: number,
    ranges?: number[] | string[],
    readonly?: boolean,
    minValue?: number,
    maxValue?: number,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      errorMessage: this.props.errorMessage,
      value: this.props.value,
      ranges: this.filterRanges(),
      readonly: this.props.readonly,
      minValue: this.props.minValue,
      maxValue: this.props.maxValue,
    };
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    //__DEV__  && this.props.name==='OD' && console.log('NUMBERINPUT: props.value:'+prevProps.value+'->'+this.props.value+' state.text:'+prevState.text+'->'+this.state.text+' props.error:'+prevProps.errorMessage+'->'+this.props.errorMessage+' state.error:'+prevState.errorMessage+'->'+this.state.errorMessage);

    if (
      !deepEqual(this.props.rangeFilter, prevProps.rangeFilter) ||
      !deepEqual(this.props.filter, prevProps.filter)
    ) {
      const ranges: number[] = this.filterRanges();
      this.setAutoFieldValue(ranges, prevProps.value);
    }

    if (this.props.readonly !== prevProps.readonly) {
      this.setState({readonly: this.props.readonly});
    }
    if (this.props.value === prevProps.value) {
      return;
    } else {
      this.setState({value: this.props.value});
    }
    if (this.props.errorMessage !== prevProps.errorMessage) {
      this.setState({errorMessage: this.props.errorMessage});
    }
  }
  setAutoFieldValue(ranges: number[], prevValue?: any) {
    if (ranges && ranges.length === 1) {
      const value: number = parseFloat(ranges[0]);
      if (!(this.props.value === prevValue && this.props.value === value)) {
        this.commit(value);
      } else {
        this.setState({value});
      }
    }
    this.setState({ranges});
  }

  getMinValue(): number {
    const ranges: number[] = this.state.ranges;
    if (ranges && ranges.length > 0) {
      const minValue: number = Math.min(...ranges);
      return minValue;
    }
    return this.props.minValue;
  }

  getMaxValue(): number {
    const ranges: number[] = this.state.ranges;
    if (ranges && ranges.length > 0) {
      const maxValue: number = Math.max(...ranges);
      return maxValue;
    }
    return this.props.maxValue;
  }

  validate(value: string) {
    //TODO
    if (
      this.props.freestyle ||
      (this.props.options && this.props.options.includes(value)) ||
      value === undefined ||
      value === null ||
      (value.trim && value.trim().length === 0)
    ) {
      if (this.state.errorMessage) {
        this.setState({errorMessage: undefined});
      }
      return;
    }
    if (
      this.props.suffix &&
      this.props.suffix instanceof String &&
      this.props.suffix.endsWith('Codes')
    ) {
      //TODO: strip suffix and continue with number validation
      if (this.state.errorMessage) {
        this.setState({errorMessage: undefined});
      }
      return;
    }
    if (isNaN(value)) {
      this.setState({errorMessage: 'Not a number'}); //TODO
      return;
    }
    const numberValue: ?number | string = this.parse(value);
    const minValue: number = this.getMinValue();
    const maxValue: number = this.getMaxValue();
    if (minValue !== undefined && minValue > numberValue) {
      this.setState({errorMessage: 'Too litle'}); //TODO
      return;
    }
    if (maxValue !== undefined && maxValue < numberValue) {
      this.setState({errorMessage: 'Too big'}); //TODO
      return;
    }
    if (
      this.props.stepSize !== undefined &&
      Number.isInteger(this.props.stepSize * 1000) &&
      (numberValue * 1000) % (this.props.stepSize * 1000) !== 0
    ) {
      this.setState({errorMessage: 'Not right rounded'}); //TODO
      return;
    }

    if (!this.props.validation) {
      this.setState({errorMessage: undefined});
      return;
    }
    const errorMessages = strings;
    let validationError: ?string;
    eval(this.props.validation); // NOSONAR
    this.setState({errorMessage: validationError});
  }

  commit(text: string | number) {
    this.setState({text});
    this.validate(text);
    if (this.props.onChangeValue) {
      const value: ?number | string = this.parse(text);
      this.setState({value});
      this.props.onChangeValue(value);
    }
  }

  parse(text: string | number): ?number {
    if (typeof text === 'number') {
      return text;
    }
    if (text === undefined || text === null || text?.trim() === '') {
      return undefined;
    }
    if (this.props.suffix && !(this.props.suffix instanceof Array)) {
      text = text.substring(0, text.length - this.props.suffix.length);
    }
    if (isFinite(text)) {
      let value: ?number = parseFloat(text); //TODO parseInt if stepsize === 1
      return value;
    }

    return text;
  }

  filterRanges(): number[] {
    const options = getAllCodes(this.props.code, this.props.filter);
    const key: string = this.props.code.split('.').pop();
    let uniqueRangesArr: number[] = [];
    const filteredRanges: [] = [];
    let arrRanges: [] = [];

    if (this.props?.rangeFilter) {
      options?.forEach((codeDefinition: CodeDefinition) => {
        codeDefinition?.ranges?.forEach((element: any) => {
          if (passesRangeFilter(element, this.props.rangeFilter)) {
            filteredRanges.push(element);
          }
        });
      });
      filteredRanges?.forEach((element: any) => {
        arrRanges.push(element[key]);
      });
    } else {
      options?.forEach((code: CodeDefinition) => {
        code.ranges &&
          code.ranges?.forEach((element: any) => {
            if (element[key]) {
              arrRanges.push(element[key]);
            }
          });
      });
    }

    let numRanges: number[] = [];
    const uniqueRanges = new Set();
    arrRanges?.forEach((element: any) => {
      if (element && !element.isValueZero) {
        numRanges = numRanges.concat(
          getRanges(element.minValue, element.maxValue, element.stepSize),
        );
      }
    });
    if (numRanges?.length > 0) {
      numRanges?.forEach((n: number) => {
        if (!uniqueRanges.has(n)) {
          uniqueRanges.add(n);
        }
      });
      uniqueRangesArr = sort(Array.from(uniqueRanges));
    }

    return uniqueRangesArr;
  }

  formatRanges(ranges: number[] | string[]): string[] {
    return formatRanges(
      ranges,
      this.props.decimals,
      this.props.prefix,
      this.props.suffix,
    );
  }

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.readonly
      ? styles.formFieldReadOnly
      : this.state.errorMessage
      ? styles.formFieldError
      : styles.formField;
    return (
      <View style={styles.formElement}>
        {this.props.showLabel && (
          <Label width={this.props.labelWidth} value={this.props.label} />
        )}
        <NumberField
          {...this.props}
          value={this.state.value}
          readonly={this.state.readonly}
          options={this.formatRanges(this.state.ranges)}
          listField={!this.props.isTyping}
          style={style}
          onChangeValue={(newValue: any) => this.commit(newValue)}
          errorMessage={this.state.errorMessage}
          testID={this.props.testID + 'Field'}
        />
      </View>
    );
  }
}

export class ErrorCard extends Component {
  props: {
    errors?: string[],
  };

  render() {
    if (!this.props.errors || this.props.errors.length == 0) {
      return null;
    }
    return (
      <View style={styles.errorCard}>
        <Text style={styles.cardTitle}>
          {this.props.errors.length > 1
            ? strings.errorsTitle
            : strings.errorTitle}
        </Text>
        {this.props.errors?.map((error: string, index: number) => (
          <Text style={styles.text} key={index}>
            {error}
          </Text>
        ))}
      </View>
    );
  }
}
