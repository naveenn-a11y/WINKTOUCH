/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, TextInput, Button, TouchableWithoutFeedback, Switch } from 'react-native';
import { PhoneNumberUtil } from 'google-libphonenumber';
import type { FieldDefinition, FieldDefinitions, CodeDefinition, GroupDefinition } from './Types';
import { styles, scaleStyle } from './Styles';
import { strings } from './Strings';
import { DateField, DurationField, TimeField, TilesField, TextArrayField, ButtonArray, NumberField, ListField, ImageField, ImageUploadField, CheckButton } from './Widgets';
import { getFieldDefinitions } from './Items';
import { formatAllCodes, formatCode, formatCodeDefinition, parseCode, formatOptions } from './Codes';
import { capitalize, parseDate, formatDate, jsonDateFormat, jsonDateTimeFormat, deepClone, getValue } from './Util';
import { isNumericField, formatLabel } from './Items';
import { Microphone } from './Voice';

var phoneUtil = PhoneNumberUtil.getInstance();

export class FormLabel extends Component {
  props: {
    value: string,
    width?: number
  }
  render() {
    if (!this.props.value || this.props.value.length===0) return null;
    if (this.props.width)
      return <Text style={[styles.formLabel, { width: this.props.width }]}>{this.props.value}:</Text>
    return <Text style={styles.formLabel}>{this.props.value}:</Text>
  }
}

export class FormRow extends Component {
    render() {
        return <View style={styles.formRow}>
            {this.props.children}
        </View>
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
        type?: string,
        prefix?: string,
        suffix?: string,
        multiline?: boolean,
        readonly?: boolean,
        speakable?: boolean,
        style?: any,
        containerStyle?: any,
    }
    static defaultProps = {
      readonly: false,
      autoCapitalize: 'none',
      multiline: false,
      showLabel: true
    }

    state: {
        value: ?string,
        errorMessage: ?string
    }
    constructor(props: any) {
        super(props);
        this.state = {
            value: this.props.value,
            errorMessage: this.props.errorMessage
        }
    }

    componentWillReceiveProps(nextProps: any) {
        if (nextProps.value !== this.state.value || nextProps.errorMessage !== this.state.errorMessage)
            this.setState({ value: nextProps.value, errorMessage: nextProps.errorMessage });
    }

    validate(value: string) {
        if (!this.props.validation)
            return;
        let errorMessage :?string = undefined;
        const errorMessages = strings;
        eval(this.props.validation);
        if (errorMessage)
          errorMessage = errorMessage + ' \u274c';
        this.setState({ errorMessage });
    }

    format(input: string) : string {
      if (this.props.type==='phone-pad') {
        try {
          let phoneNumber = phoneUtil.parse(input, 'CA'); //TODO patient country or user country?
          input = phoneUtil.format(phoneNumber, 'CA');
        } catch (error) {
        }
      }
      return input;
    }

    commit(input: string) {
        input = this.format(input);
        this.validate(input);
        if (this.props.onChangeText)
            this.props.onChangeText(input);
    }

    dismissError = () => {
        this.setState({ errorMessage: undefined });
    }

    appendText(text: string) {
      if (text===undefined || text===null || text==='')
        return;
      let value : string = this.state.value;
      if ('undo'===text.toLowerCase() || 'remove'===text.toLowerCase() || 'delete'===text.toLowerCase()) {//TODO: french
        if (!value) return;
        let lines = value.split('\n');
        lines.splice(lines.length-1,1);
        value = lines.join('\n');
      } else if ('clear'===text.toLowerCase()) {//TODO: french
              if (value===undefined) return;
              value = '';
      } else {
        if (value===undefined || value===null || value==='') {
          value = text;
        } else {
          value = value + '\n';
          value = value + text;
        }
      }
      //this.setState({value});
      this.commit(value);
    }

    render() {
        return <TouchableWithoutFeedback onPress={this.dismissError} disabled={this.state.errorMessage===undefined}>
          <View style={this.props.containerStyle?this.props.containerStyle:styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label}/>}
            {this.props.prefix && <Text style={styles.formPrefix}>{this.props.prefix}</Text>}
            <View style={styles.fieldFlexContainer}>
              {this.props.readonly===true?
                <Text style={this.props.style?this.props.style:this.props.multiline?styles.formFieldLines:this.props.readonly?styles.formFieldReadOnly:styles.formField}>{this.props.value}</Text>
                :
                <TextInput
                    value={this.state.value}
                    autoCapitalize={this.props.autoCapitalize}
                    autoCorrect={false}
                    keyboardType={this.props.type}
                    style={this.props.style?this.props.style:this.props.multiline?styles.formFieldLines:this.props.readonly?styles.formFieldReadOnly:styles.formField}
                    onFocus={this.dismissError}
                    onChangeText={(text: string) => this.setState({value: text })}
                    onEndEditing={(event) => this.commit(event.nativeEvent.text)}
                    editable={this.props.readonly!==true}
                    multiline={this.props.multiline}
                    />
              }
              {!this.props.readonly && (this.props.multiline || this.props.speakable) && <Microphone onSpoke={(text: string) => this.appendText(text)} style={this.props.multiline?styles.voiceIconMulti:styles.voiceIcon}/>}
              </View>
            {this.props.suffix && <Text style={styles.formSuffix}>{this.props.suffix}</Text>}
            {this.state.errorMessage && <Text style={styles.formValidationError}>{this.state.errorMessage}</Text>}
          </View>
        </TouchableWithoutFeedback>
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
        options: CodeDefinition[]|string,
    }
    static defaultProps = {
      readonly: false,
      showLabel: true,
    }

    state: {
        text: string,
        errorMessage?: string
    }

    constructor(props: any) {
        super(props);
        this.state = {
            text: this.format(this.props.value),
            errorMessage: this.props.errorMessage
        }
    }

    componentWillReceiveProps(nextProps: any) {
        this.setState({ text: this.format(nextProps.value), errorMessage: nextProps.errorMessage });
    }

    validate(value: string) {//TODO
        if (!this.props.validation)
            return;
        let validationError: ?string;
        eval(this.props.validation);
        if (validationError)
          validationError = validationError + ' \u274c';
        this.setState({ errorMessage: validationError });
    }

    commit(text: string) {
        this.setState({text});
        this.validate(text);
        if (this.props.onChangeValue) {
          const value : ?number = this.parse(text);
          if (Number.isNaN(value)) {
            this.setState({errorMessage: 'Not a number'});
          } else {
            this.props.onChangeValue(value);
          }
        }
    }

    dismissError = () => {
      if (this.state.errorMessage)
        this.setState({ errorMessage: undefined });
    }

    format(value: ?number) : string {
      if (value===undefined || value===null) return '';
      if (!value instanceof Number) return value.toString();
      return value.toString(); //TODO
    }

    parse(text: string) : ?number {
      if (typeof text === 'number') return text;
      if (text===undefined || text===null || text.trim()==='') return undefined;
      if (isFinite(text)) {
        let value : ?number = parseFloat(text); //TODO parseInt if stepsize === 1
        return value;
      }
      return text;
    }

    getRange() : ?[number, number] {
      if (this.props.minValue!==undefined && this.props.maxValue!=undefined)
        return [this.props.minValue, this.props.maxValue];
      return undefined;
    }

    render() {
        const style = this.props.style?this.props.style:this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField;
        return <TouchableWithoutFeedback onPress={this.dismissError} disabled={this.state.errorMessage===undefined || this.state.errorMessage===null || this.state.errorMessage.trim()===''}>
          <View style={styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
            <NumberField {...this.props} range={this.getRange()} style={style} onChangeValue={(newValue: any) => this.commit(newValue)} />
            {this.state.errorMessage && <Text style={styles.formValidationError}>{this.state.errorMessage}</Text>}
          </View>
        </TouchableWithoutFeedback>
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
        onChangeValue?: (newValue: ?string) => void
    }
    static defaultProps= {
      showLabel: true
    }
    constructor(props: any) {
        super(props);
    }

    updateValue = (value: ?Date) : void => {
      if (this.props.readonly) return;
      let newValue : string = formatDate(value, jsonDateFormat);
      this.props.onChangeValue && this.props.onChangeValue(newValue);
    }

    render() {
        return <View style={styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
            <DateField label={this.props.label} value={parseDate(this.props.value)}
              readonly={this.props.readonly}
              past={this.props.type?this.props.type.includes('past'):undefined}
              future={this.props.type?this.props.type.includes('future'):undefined}
              recent={this.props.type?this.props.type.includes('recent'):undefined}
              partial={this.props.type?this.props.type.includes('partial'):undefined}
              style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField}
              onChangeValue={this.updateValue}/>
        </View>
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
        onChangeValue?: (time: ?string) => void
    }
    static defaultProps= {
      showLabel: true
    }
    constructor(props: any) {
        super(props);
    }

    updateValue = (newTime: ?string) : void => {
      if (this.props.readonly) return;
      this.props.onChangeValue && this.props.onChangeValue(newTime);
    }

    render() {
        return <View style={styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
            <TimeField label={this.props.label} value={this.props.value}
              readonly={this.props.readonly}
              past={this.props.type?this.props.type.includes('past'):undefined}
              future={this.props.type?this.props.type.includes('future'):undefined}
              style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField}
              onChangeValue={this.updateValue}/>
        </View>
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
        onChangeValue?: (newValue: ?string) => void
    }
    static defaultProps = {
      showLabel: true
    }
    constructor(props: any) {
        super(props);
    }

    updateValue = (value: ?Date) : void => {
      if (this.props.readonly) return;
      let newValue : string = formatDate(value, jsonDateTimeFormat);
      this.props.onChangeValue && this.props.onChangeValue(newValue);
    }

    render() {
        return <View style={styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
            <DateField includeTime={true} includeDay={this.props.includeDay} label={this.props.label} value={parseDate(this.props.value)}
              style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField} readonly={this.props.readonly}
              onChangeValue={this.updateValue}/>
        </View>
    }
}

export class FormDurationInput extends Component {
    props: {
        value?: string,
        errorMessage:? string,
        startDate: string,
        label: string,
        labelWidth?: number,
        showLabel?: boolean,
        readonly?: boolean,
        onChangeValue?: (newValue: ?string) => void
    }
    static defaultProps = {
      showLabel: true
    }
    constructor(props: any) {
        super(props);
    }

    updateValue = (end: ?Date) : void => {
      if (this.props.readonly) return;
      let newValue : string = formatDate(end, jsonDateTimeFormat);
      this.props.onChangeValue && this.props.onChangeValue(newValue);
    }

    render() {
        return <View style={styles.formElement}>
            {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
            <DurationField label={this.props.label} value={parseDate(this.props.value)} startDate={parseDate(this.props.startDate)} readonly={this.props.readonly} style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField}
              onChangeValue={this.updateValue}/>
        </View>
    }
}

export class FormSwitch extends Component {
  props: {
    value: boolean,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onChangeValue: (newvalue: boolean) => void
  }
  static defaultProps = {
    value: false,
    showLabel: true
  }

  render() {
    return <View style={styles.formElement}>
        {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
        <Switch value={this.props.value} onValueChange={this.props.onChangeValue}/>
      </View>
  }
}

export class FormOptions extends Component {
  props: {
    value: ?string|?number,
    errorMessage?: string,
    options: CodeDefinition[][]|CodeDefinition[],
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    freestyle?: boolean,
    prefix?: string,
    suffix?: string,
    onChangeValue: (newvalue: ?string|?number) => void
  }
  formattedOptions: string[];
  static defaultProps = {
    showLabel: true,
    freestyle: false,
  }
  constructor(props: any) {
    super(props);
    this.formattedOptions = formatOptions(this.props.options);
  }

  componentWillReceiveProps(nextProps: any) {
    this.formattedOptions = formatOptions(nextProps.options);
  }

  isMultiOption() : boolean {
    return this.props.options.length>1 && (this.props.options[0] instanceof Array);
  }

  formatValue(value: string|number) {
    if (value===undefined || value===null) return '';
    if (this.props.options===undefined || this.props.options===null || this.props.options.length ===undefined || this.props.options.length===0) {
      return capitalize(value);
    }
    let option : CodeDefinition = this.props.options.find((option :CodeDefinition) => option.code!==undefined?option.code===value:option===value);
    if (option)
      return capitalize(formatCodeDefinition(option));
    return value.toString();
  }

  parseValue(text: ?string|?string[]) : ?string|?number {
    if (text===undefined || text===null) return undefined;
    if (this.isMultiOption()) {
      return text;
    }
    const lowerText = text.trim().toLowerCase();
    let index : number = this.formattedOptions.findIndex((option: string) => option.trim().toLowerCase()===lowerText);
    if (index<0 || index>=this.props.options.length) {
      if (this.props.freestyle)
        return text;
      return undefined;
    }
    let option : CodeDefinition = this.props.options[index];
    if (option.code!==undefined)
      return option.code;
    return option;
  }

  changeValue = (text: ?string) => {
    let newValue : ?string|?number = this.parseValue(text);
    this.props.onChangeValue(newValue);
  }

  render() {
    const manyOptions : boolean = this.props.options.length > 30;
    return <View style={styles.formElement}>
        {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
        {manyOptions?
            <ListField label={this.props.label} style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField} readonly={this.props.readonly} freestyle={this.props.freestyle} options={this.formattedOptions} value={this.formatValue(this.props.value)} onChangeValue={this.changeValue} prefix={this.props.prefx} suffix={this.props.suffix} />
          :
            <TilesField label={this.props.label} style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField} readonly={this.props.readonly} options={this.formattedOptions} combineOptions={this.isMultiOption()}
              value={this.formatValue(this.props.value)} onChangeValue={this.changeValue} freestyle={this.props.freestyle} prefix={this.props.prefix} suffix={this.props.suffix}/>
        }

      </View>
  }
}

export class FormCheckBox extends Component {
  props: {
    value: ?number|string,
    options: CodeDefinition[],
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    onChangeValue?: (newvalue?: number|string) => void,
    style?: any
  }

  isChecked() : boolean {
    return this.props.value && this.props.value!==null && this.props.value!==undefined && this.props.value!=='' && this.props.value!==0;
  }

  select = () => {
    if (this.props.readonly || this.props.options===undefined || this.props.options===null || this.props.options.length<2) return;
    let selectedValue = this.props.options[1];
    if (selectedValue instanceof Object) {
      selectedValue = selectedValue.code;
    }
    this.props.onChangeValue(selectedValue);
  }

  deSelect = () => {
    if (this.props.readonly) return;
    this.props.onChangeValue(undefined);
  }

  render() {
    return <View style={styles.formElement}>
        {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
        {this.props.prefix!==undefined && <Text style={styles.formPrefix}>{this.props.prefix}</Text>}
        <CheckButton isChecked={this.isChecked()}
          onSelect={this.select}
          onDeselect={this.deSelect}
          style={this.props.style?this.props.style:styles.checkButtonLabel} />
        {this.props.suffix!==undefined && <Text style={styles.formSuffix}>{this.props.suffix}</Text>}
    </View>
  }
}

export class FormCode extends Component {
  props: {
    value: ?string|?number,
    errorMessage?: string,
    code: string,
    filter: {},
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    freestyle?: boolean,
    autoSelect?: boolean,
    style?: any,
    onChangeValue?: (newvalue: ?string|?number) => void
  }
  static defaultProps = {
    showLabel: true
  }

  componentWillReceiveProps(nextProps: any) {
    //TODO or not TODO
  }

  getCodeIdentifier() {
    if (this.props.code.includes('.')) {
      return this.props.code.split('.')[1];
    }
    return undefined;
  }

  updateValue = (newValue: ?string) => {
    let newCode : ?string|?number = parseCode(this.props.code, newValue, this.getCodeIdentifier());
    this.props.onChangeValue && this.props.onChangeValue(newCode);
  }

  selectedDescription(allDescriptions: string[]) : string {
    if (this.props.autoSelect) {
      if (allDescriptions===undefined || allDescriptions.length!=1) return '';
      let description : string = formatCode(this.props.code, this.props.value);
      if (!allDescriptions.includes(description)) {
        return allDescriptions[0];
      }
      return description;
    }
    return formatCode(this.props.code, this.props.value);
  }

  render() {
    const allDescriptions: string[] = formatAllCodes(this.props.code, this.props.filter);
    let selectedDescription: string = this.selectedDescription(allDescriptions);
    return <FormOptions labelWidth={this.props.labelWidth} label={this.props.label} showLabel={this.props.showLabel} readonly={this.props.readonly} freestyle={this.props.freestyle} errorMessage={this.props.errorMessage}
      options={allDescriptions} value={selectedDescription} onChangeValue={this.updateValue} prefix={this.props.prefix} suffix={this.props.suffix} style={this.props.style}/>
  }
}

export class FormTextArrayInput extends Component {
  props: {
    value: ?string[],
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onChangeValue: (newvalue: ?string[]) => void
  }
  static defaultProps = {
    value: [],
    showLabel: true
  }

  render() {
    return <View style={styles.formElement}>
        {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
        <TextArrayField value={this.props.value} style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField} onChangeValue={this.props.onChangeValue} />
      </View>
  }
}

export class FormSelectionArray extends Component {
  props: {
    value: ?string[],
    errorMessage?: string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    onAdd: (index?: number) => void,
    onRemove?: (index?: number) => void,
    onSelect?: (index: number) => void
  }
  static defaultProps = {
    value: [],
    showLabel: true
  }

  render() {
    return <View style={styles.formElement}>
        {this.props.showLabel && <FormLabel width={this.props.labelWidth} value={this.props.label} />}
        <ButtonArray value={this.props.value} style={this.props.readonly?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField} onAdd={this.props.onAdd} onRemove={this.props.onRemove} onSelect={this.props.onSelect} />
      </View>
  }
}

export class FormInput extends Component {
  props: {
    value: ?string|?number,
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
    onChangeValue: (value: ?string|?number) => void,
    patientId: string,
    examId: string,
    filterValue: {}
  }
  state: {
    validation?: string
  }
  static defaultProps = {
    showLabel: true,
    visible: true,
  }

  constructor(props: any) {
    super(props);
    this.state = {
      validation: this.generateValidationCode(this.props.value, this.props.definition)
    }
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.state.validation===undefined) {
      let validation = this.generateValidationCode(nextProps.value, nextProps.definition);
      this.setState({ validation });
    }
  }

  getFilterValue() : ?{} {
    if (this.props.definition.filter instanceof Object && this.props.filterValue instanceof Object) {
      let filledFilter = undefined;
      const filterEntries : [][] = Object.entries(this.props.definition.filter);
      for (let i : number=0; i<filterEntries.length; i++) {
        const filterKey : string = filterEntries[i][0];
        const filterValue: string = filterEntries[i][1];
        if (filterValue!==undefined && filterValue!==null && filterValue.startsWith('[') && filterValue.endsWith(']')) {
          if (filledFilter===undefined) {
            filledFilter = deepClone(this.props.definition.filter);
          }
          const filledValue = getValue(this.props.filterValue, filterValue.substring(1, filterValue.length-1));
          filledFilter[filterKey] = filledValue;
        }
      }
      return filledFilter!=undefined?filledFilter:this.props.definition.filter;
    }
    return this.props.definition.filter;
  }

  generateValidationCode(value: string, definition: FieldDefinition) : ?string {
    if (definition===undefined) return undefined;
    let validation : string = '';
    if (definition.validation!==undefined && definition.validation!==null)
      validation = validation + definition.validation+';\n';
    if (definition.maxLength  && definition.maxLength>0)
      validation = validation + 'if (value.length>'+definition.maxLength+') errorMessage = \''+(definition.maxLengthError?definition.maxLengthError:strings.maxLengthError)+'\';\n';
    if (definition.minLength && definition.minLength>0)
        validation = validation + 'if (value.length<'+definition.minLength+') errorMessage = \''+(definition.minLengthError?definition.minLengthError:strings.minLengthError)+'\';\n';
    if (definition.required===true)
      validation = 'if (value===undefined || value===null || value.trim().length===0) errorMessage = \''+(definition.requiredError?definition.requiredError:strings.requiredError)+'\';\n';
    return validation;
  }

  renderFormInput() {
    const label : string = this.props.label?this.props.label:formatLabel(this.props.definition);
    const type : ?string = this.props.type?this.props.type:this.props.definition.type;
    const style : ?any = this.props.style?this.props.style:(this.props.multiline===true || this.props.definition.maxLength>100)?styles.formFieldLines:styles.formField;
    const readonly : boolean = this.props.readonly===true||this.props.definition.readonly===true;
    if (!this.props.definition || !this.props.visible) return null;
    if (isNumericField(this.props.definition)) {
      return <FormNumberInput value={this.props.value} {...this.props.definition} errorMessage={this.props.errorMessage} readonly={readonly} onChangeValue={this.props.onChangeValue} label={label} showLabel={this.props.showLabel} prefix={this.props.definition.prefix} suffix={this.props.definition.suffix} style={style}/>
    } else if (this.props.definition.options && this.props.definition.options.length>0) {
      const options = this.props.definition.options;
      if (!(options instanceof Array)) {
        return <FormCode code={options} filter={this.getFilterValue()} freestyle={this.props.definition.freestyle} value={this.props.value} label={label} showLabel={this.props.showLabel} readonly={readonly} errorMessage={this.props.errorMessage}
          prefix={this.props.definition.prefix} suffix={this.props.definition.suffix} autoSelect={this.props.definition.autoSelect} onChangeValue={this.props.onChangeValue} style={style}/>
      }
      if (options.length===2 && (options[0]===undefined || options[0]===null || options[0]===false || options[0].toString().trim()==='' || this.props.definition.defaultValue===options[0]))
        return <FormCheckBox options={options} value={this.props.value} label={label} showLabel={this.props.showLabel} readonly={readonly} onChangeValue={this.props.onChangeValue} style={style} errorMessage={this.props.errorMessage}/>
      return <FormOptions options={this.props.definition.options} freestyle={this.props.definition.freestyle} value={this.props.value} label={label} showLabel={this.props.showLabel} errorMessage={this.props.errorMessage}
        readonly={readonly} onChangeValue={this.props.onChangeValue} style={style} prefix={this.props.definition.prefix} suffix={this.props.definition.suffix} />
    } else if (type && type.includes('Date')) {
      return <FormDateInput value={this.props.value} label={label} showLabel={this.props.showLabel} readonly={readonly} onChangeValue={this.props.onChangeValue} type={type} style={style} errorMessage={this.props.errorMessage}/>
    } else if (type==='time' || type==='pastTime' || type==='futureTime') {
      return <FormTimeInput value={this.props.value} label={label} showLabel={this.props.showLabel} readonly={readonly} onChangeValue={this.props.onChangeValue} type={type} style={style} errorMessage={this.props.errorMessage}/>
    } else if (this.props.definition.image==='upload') {
      return <ImageUploadField value={this.props.value} fileName={this.props.definition.name} readonly={readonly} onChangeValue={this.props.onChangeValue} size={this.props.definition.size} style={style} patientId={this.props.patientId} examId={this.props.examId} type={type} errorMessage={this.props.errorMessage}/>
    } else if (this.props.definition.image!==undefined) {
      return <ImageField value={this.props.value} image={this.props.definition.image} resolution={this.props.definition.resolution} size={this.props.definition.size} readonly={readonly} onChangeValue={this.props.onChangeValue} style={style} errorMessage={this.props.errorMessage}/>
    }
    return <FormTextInput value={this.props.value} errorMessage={this.props.errorMessage} onChangeText={this.props.onChangeValue} label={label} showLabel={this.props.showLabel} readonly={readonly} validation={this.state.validation}
      type={this.props.type} prefix={this.props.definition.prefix} suffix={this.props.definition.suffix} autoCapitalize={this.props.autoCapitalize} multiline={this.props.multiline===true || this.props.definition.maxLength>100} style={style}/>//TODO keyboardType from definition type
  }

  render() {
    if (!this.props.definition) return null;
    if (this.props.definition.layout) return  <View style={scaleStyle(this.props.definition.layout)}>
      {this.renderFormInput()}
    </View>
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
    examId: string
  }
  fieldNames: string[];
  fieldDefinition: ?FieldDefinition;

  static defaultProps = {
    showLabel: true
  }
  constructor(props: any) {
    super(props);
    this.fieldNames = this.props.fieldName.split('.');
    this.fieldDefinition = this.findFieldDefinition(props);
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.props.fieldName!==nextProps.fieldName) {
      this.fieldNames = nextProps.fieldName.split('.');
      this.fieldDefinition = this.findFieldDefinition(nextProps);
    }
  }

  findFieldDefinition(props: any) : ?FieldDefinition {
    if (!props.value || !props.value.id) return null;
    let fieldDefinitions : ?FieldDefinitions = getFieldDefinitions(props.value.id);
    if (fieldDefinitions===undefined)    {
      //__DEV__ && console.warn('No fieldDefinitions exists for '+this.props.value.id);
      return undefined;
    }
    let fieldDefinition : ?FieldDefinition|?GroupDefinition;
    for (let i=0; i<this.fieldNames.length;i++) {
      fieldDefinition = fieldDefinitions.find((fieldDefinition: FieldDefinition|GroupDefinition) => fieldDefinition.name === this.fieldNames[i]);
      if (fieldDefinition.fields) fieldDefinitions = fieldDefinition.fields;
    }
    if (fieldDefinition===undefined) {
      //__DEV__ && console.warn('No fieldDefinition \''+this.props.fieldName+'\' exists for '+this.props.value.id);
    }
    return fieldDefinition;
  }

  getFieldValue() : ?number|?string {
    let value = this.props.value;
    for (let i : number = 0; i<this.fieldNames.length; i++) {
      const propertyName : string = this.fieldNames[i];
      value = value[propertyName];
    }
    return value;
  }

  getErrorMessage() : ?string {
    let value = this.props.value;
    let errorMessage = undefined;
    for (let i : number = 0; i<this.fieldNames.length; i++) {
      const propertyName : string = this.fieldNames[i];
      if (i+1==this.fieldNames.length) {
        errorMessage = value[propertyName+'Error'];
      } else {
        value = value[propertyName];
      }
    }
    return errorMessage;
  }

  setFieldValue = (value: ?string|?number) => {
    if (this.props.readonly) return;
    let valueContainer : {} = this.props.value;
    for (let i : number = 0; i<this.fieldNames.length; i++) {
      const propertyName : string = this.fieldNames[i];
      if (i===this.fieldNames.length-1)
        valueContainer[propertyName] = value;
      else
        valueContainer = valueContainer[propertyName];
    }
    this.props.onChangeValue(this.props.value);
  }

  render() {
    if (this.fieldDefinition===undefined) return null;
    return <FormInput value={this.getFieldValue()} filterValue={this.props.value} errorMessage={this.getErrorMessage()} definition={this.fieldDefinition} showLabel={this.props.showLabel} readonly={this.props.readonly} label={this.props.label}
      type={this.props.type} autoCapitalize={this.props.autoCapitalize} multiline={this.props.multiline}
      onChangeValue={this.setFieldValue} patientId={this.props.patientId} examId={this.props.examId} />
  }
}

export class ErrorCard extends Component {
  props: {
    errors? : string[]
  }

  render() {
    if (!this.props.errors || this.props.errors.length==0)
      return null;
    return <View style={styles.errorCard}>
        <Text style={styles.cardTitle}>{(this.props.errors.length>1)?strings.errorsTitle:strings.errorTitle}</Text>
        {this.props.errors.map((error: string, index: number) => <Text style={styles.text} key={index}>{error}</Text>)}
    </View>
  }
}
