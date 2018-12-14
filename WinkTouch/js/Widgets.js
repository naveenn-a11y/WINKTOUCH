/**
 * @flow
 */
'use strict';

import type { FieldDefinition, CodeDefinition } from './Types';
import React, { Component, PureComponent } from 'react';
import ReactNative, { View, Text, Image, LayoutAnimation, TouchableHighlight, ScrollView, Modal, Dimensions,
  TouchableOpacity, TouchableWithoutFeedback, InteractionManager, TextInput, Keyboard, FlatList} from 'react-native';
import { Button as NativeBaseButton, Icon as NativeBaseIcon, Fab as NativeBaseFab } from 'native-base';
import Svg, {Polyline, Circle} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles, fontScale, selectionColor, windowWidth, windowHeight, selectionFontColor } from './Styles';
import { strings} from './Strings';
import { formatCodeDefinition, formatAllCodes } from './Codes';
import { FormRow, FormTextInput } from './Form';
import { ItemsList } from './Items';
import { formatDuration, formatDate, dateFormat, dateTime24Format, now, yearDateFormat, yearDateTime24Format, capitalize,
  minuteDifference, dayDateTime24Format, dayDateFormat, dayYearDateTime24Format, dayYearDateFormat, isToyear, deAccent, formatDecimals, split, combine} from './Util';

const margin : number = 40;

export class UpdateTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void
  }
  render() {
    return <TouchableOpacity onPress={() => this.props.commitEdit()}>
      <View style={styles.popupNumberTile}>
        <Icon name='done' style={styles.modalTileIcon} />
      </View>
    </TouchableOpacity>
  }
}

export class ClearTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void
  }
  render() {
    return <TouchableOpacity onPress={() => this.props.commitEdit()}>
      <View style={styles.popupClearTile}>
        <Text style={styles.modalTileLabel}>{'\u2715'}</Text>
      </View>
    </TouchableOpacity>
  }
}

export class KeyboardTile extends Component {
  props: {
    commitEdit: (nextFocusField?: string) => void
  }
  render() {
    return <TouchableOpacity onPress={() => this.props.commitEdit()}>
      <View style={styles.popupNumberTile}>
        <Icon name='keyboard' style={styles.modalTileIcon} />
      </View>
    </TouchableOpacity>
  }
}

export class FocusTile extends Component {
  props: {
    type: string,
    transferFocus?: {previousField: string, nextField: string, onTransferFocus: (field: string) => void },
    commitEdit: (nextFocusField?: string) => void
  }
  static defaultProps = {
    type: 'next'
  }
  render() {
    if (!this.props.transferFocus) return null;
    if (!this.props.transferFocus[this.props.type+'Field']) return null;
    return <TouchableOpacity onPress={() => this.props.commitEdit(this.props.transferFocus[this.props.type+'Field'])}>
        <View style={styles[this.props.type+'Tile']}>
          <Text style={styles.modalTileLabel}>{strings[this.props.transferFocus[this.props.type+'Field']]}</Text>
        </View>
      </TouchableOpacity>
  }
}

export class TextField extends Component {
  props: {
    value: string,
    type?: string,
    prefix?: string,
    suffix?: string,
    readonly?: boolean,
    style?: any,
    onChangeValue?: (newvalue: string) => void,
    autoFocus?: boolean,
    onFocus?: () => void
  }
  state: {
    value: string
  }
  static defaultProps = {
    type: 'default'
  }

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({value: nextProps.value});
  }

  commitEdit(value: string) {
    this.setState({value});
    if (this.props.onChangeValue)
      this.props.onChangeValue(value);
  }

  render() {
    let style = this.props.style ? this.props.style: this.state.isActive ? styles.inputFieldActive : styles.inputField;
    if (this.props.width) {
      style = [{ width: this.props.width }, style];
    }
    return <View style={styles.fieldFlexContainer}>
      {this.props.prefix && <Text style={styles.formPrefix}>{this.props.prefix}</Text>}
      <TextInput
          value={this.state.value}
          autoCapitalize='sentences'
          autoCorrect={false}
          placeholder={''}
          keyboardType={this.props.type}
          style={style}
          onFocus={this.props.onFocus}
          onChangeText={(text: string) => this.setState({ value: text })}
          onEndEditing={(event) => this.commitEdit(event.nativeEvent.text)}
          autoFocus={this.props.autoFocus}
          editable={!this.props.readonly}
          />
      {this.props.suffix && <Text style={styles.formSuffix}>{this.props.suffix}</Text>}
      </View>
  }
}

export class TextArrayField extends Component {
  props: {
    value: ?string[],
    readonly?: boolean,
    style?: any,
    onChangeValue?: (newValue: ?string[]) => void,
  }
  state: {
    value: ?string[]
  }

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value?this.props.value:[]
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({value: nextProps.value?nextProps.value:[]});
  }

  commitEdit(value: ?string[]) {
    this.setState({value});
    if (this.props.onChangeValue)
      this.props.onChangeValue(value);
  }

  changeText(text: string, index: number) : void {
    if (this.props.readonly) return;
    let value : ?string[] = this.state.value;
    if (!value || index>=value.length || index<0) return;
    value[index] = text;
    this.commitEdit(value);
  }

  addItem = () => {
    let items = this.state.value;
    if (items===undefined || items===null) items = [];
    items.push('');
    this.commitEdit(items);
  }

  removeItem = () => {
    Keyboard.dismiss();
    let items = this.state.value;
    if (items===undefined || items===null) return;
    items.pop();
    this.commitEdit(items);
  }

  render() {
    return <View style={styles.flowLeft1}>
        {this.state.value && this.state.value.map((value: string, index: number) => <TextField value={value} key={index} style={this.props.style} editable={!this.props.readonly}
          onChangeValue={(text: string) => this.changeText(text, index)} />)}
        {!this.props.readonly && <Button title=' + ' onPress={this.addItem}/>}
        {!this.props.readonly && <Button title=' - ' onPress={this.removeItem}/>}
      </View>
  }
}

export class ButtonArray extends Component {
  props: {
    value: ?string[],
    readonly?: boolean,
    style?: any,
    onAdd?: (index?: number) => void,
    onRemove?: (index?: number) => void,
    onSelect?: (index: number) => void
  }
  state: {
    value: ?string[]
  }

  constructor(props: any) {
    super(props);
    this.state = {
      value: this.props.value
    }
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.state.value!= nextProps.value)
      this.setState({value: nextProps.value});
  }

  render() {
    return <View style={styles.flowLeft}>
        {this.state.value && this.state.value.map((item: string, index: number) => <Button title={item} key={index}
          onPress={() => this.props.onSelect && this.props.onSelect(index)}/>)}
        {this.props.onAdd && <Button title='  +  ' onPress={() => this.props.onAdd && this.props.onAdd()}/>}
        {this.props.onRemove && <Button title='  -  ' onPress={() => this.props.onRemove && this.props.onRemove()}/>}
    </View>
  }
}

export class NumberField extends Component {
    props: {
      value: number,
      options: CodeDefinition[]|string,
      label?: string,
      prefix?: string,
      suffix?: string|string[],
      range: number[],
      width?: number,
      stepSize?: number|number[],
      groupSize?: number,
      decimals?: number,
      readonly?: boolean,
      freestyle?: boolean,
      style?: any,
      onChangeValue?: (newvalue: ?number) => void,
      transferFocus?: {previousField: string, nextField: string, onTransferFocus: (field: string) => void }
    }
    state: {
      isActive: boolean,
      isDirty: boolean,
      isTyping: boolean,
      editedValue: (?string)[]|string,
      fractions: string[][]
    }
    static defaultProps = {
      stepSize: 1,
      groupSize: 10
    }

    constructor(props: any) {
      super(props);
      this.state = {
        editedValue: [undefined,undefined,undefined,undefined,undefined],
        isActive: false,
        isDirty: false,
        isTyping: false,
        fractions: undefined
      }
    }

    componentWillReceiveProps(nextProps: any) {
      this.setState({
        editedValue: [undefined,undefined,undefined,undefined,undefined],
        isActive: false,
        isDirty: false,
        isTyping: false
      });
    }

    startEditing = () => {
      if (this.props.readonly) return;
      const fractions = this.generateFractions(this.props);
      this.setState({
          editedValue: fractions?this.splitValue(this.props.value, fractions):undefined,
          isActive: true,
          isDirty: false,
          fractions
      });
    }

    startTyping = () => {
      if (this.props.readonly) return;
      this.setState({isActive: false, isTyping: true});
    }

    commitTyping = (newValue: string) : void => {
      this.setState({isActive: false, isDirty: true, isTyping: false}, this.props.onChangeValue(newValue));
    }

    commitEdit = (nextFocusField?: string) => {
      if (this.props.onChangeValue && (nextFocusField===undefined || this.state.isDirty)) {
        const combinedValue : ?number = this.combinedValue();
        this.props.onChangeValue(combinedValue);
      }
      this.setState({ isActive: false });
      if (nextFocusField && this.props.transferFocus) {
        this.props.transferFocus.onTransferFocus(nextFocusField);
      }
    }

    cancelEdit = () => {
      this.setState({ isActive: false });
    }

    combinedValue() : ?number {
      if (this.state.fractions===undefined) {//keypad
        const value = Number.parseFloat(this.state.editedValue);
        if (isFinite(value)) return value;
        return this.state.editedValue;
      }
      if (this.state.editedValue[0]===undefined && this.state.editedValue[1]===undefined && this.state.editedValue[2]===undefined && this.state.editedValue[3]===undefined  && this.state.editedValue[4]===undefined)
        return undefined
      let combinedValue : ?number = undefined;
      if (this.state.editedValue[0]!==undefined || this.state.editedValue[1]!==undefined || this.state.editedValue[2]!==undefined || this.state.editedValue[3]!==undefined) {
        combinedValue = 0;
        let suffix: ?string = undefined;
        if (this.state.editedValue[1]!==undefined)
          combinedValue+=Number(this.state.editedValue[1]);
        if (this.state.editedValue[2]!==undefined)
          combinedValue+=Number(this.state.editedValue[2]);
        if (this.state.editedValue[3]!==undefined)
          combinedValue+=Number(this.state.editedValue[3]);
        if (this.state.editedValue[0]==='-')
          combinedValue = -combinedValue;
        if (combinedValue<this.props.range[0]) combinedValue = this.props.range[0];
        else if (combinedValue>this.props.range[1]) combinedValue = this.props.range[1];
      }
      let suffix : ?string = undefined;
      if (this.state.editedValue[4]!==undefined) {
        if (this.props.options) {
          const option : string = this.state.editedValue[4];
          if (this.props.options instanceof Array) {
            if (this.props.options.includes(option))
              return option;
          } else {
            if (formatAllCodes(this.props.options).includes(option))
              return option;
          }
        }
        if (this.props.suffix instanceof Array || this.props.suffix.includes('Code')) {
            suffix = this.state.editedValue[4];
            if (suffix === '\u2714' || suffix === '\u2715' || suffix === '\u2328')
              suffix = undefined;
        }
      }
      if (suffix) {
        let formattedValue: string = combinedValue===undefined?'':(this.props.decimals && this.props.decimals>0) ? Number(combinedValue).toFixed(this.props.decimals) : String(combinedValue);
        return formattedValue + suffix;
      }
      return combinedValue;
    }

    hasDecimalSteps() : boolean {
      if (this.props.stepSize instanceof Array) {
        return this.props.stepSize.length>0 &&  this.props.stepSize[0] && this.props.stepSize[0]<1;
      }
      return this.props.stepSize && this.props.stepSize<1;
    }

    splitValue(value: number|string, fractions: string[]) : (?string)[] {
      if (value===undefined || value===null) return [undefined, undefined, undefined, undefined, undefined];
      //TODO check if value is an option
      //remove suffix
      let suffix : ?string = undefined;
      if (this.props.suffix!==undefined && value.toLowerCase && fractions[4]!==undefined) {
        for (let i : number = 0; i<fractions[4].length ; i++) {
          if (value.toLowerCase().endsWith(fractions[4][i].toLowerCase())) {
            suffix = fractions[4][i];
            value = value.substring(0,value.length-suffix.length);
            if (value==='') {
              return [undefined, undefined, undefined, undefined, suffix];
            }
            value = parseFloat(value);
            break;
          }
        }
      }
      if (value.toLowerCase) {
        value = parseFloat(value);
        if (isNaN(value)) return [undefined, undefined, undefined, undefined, undefined];
      }
      let sign : ?string = (value<0)?'-':(this.props.prefix && this.props.prefix.endsWith('+'))?'+':undefined;
      value = Math.abs(value);
      let groupPart : number = (this.props.groupSize && this.props.groupSize>0)?this.props.groupSize*Math.floor((value)/this.props.groupSize):0;
      let intPart: number = Math.floor(value-groupPart);
      let decimals: ?string = (this.hasDecimalSteps() && suffix===undefined)?formatDecimals(value-groupPart-intPart, this.props.decimals):undefined;
      const splittedValue :(?string)[] = [sign,(this.props.groupSize && this.props.groupSize>0 && groupPart>0)?groupPart.toString():undefined,intPart.toString(),decimals,suffix];
      return splittedValue;
    }

    clearValue = () => {
      const editedValue = this.state.fractions?[undefined,undefined,undefined,undefined,undefined]:undefined;
      this.setState({editedValue, isDirty:true}, () => {this.commitEdit()});
    }

    updateValue(column: number, newColumnValue: string) : void {
      if (this.state.fractions===undefined) {//keypad
        let editedValue = this.state.editedValue;
        if (editedValue===undefined || editedValue===null) {
          editedValue = newColumnValue.toString();
        } else {
          if (newColumnValue==='.') {
            if (!editedValue.includes('.')) {
              editedValue += '.';
            }
          } else if (newColumnValue==='-') {
            if (editedValue.startsWith('-')) {
              editedValue = editedValue.substring(1);
            } else {
              editedValue = newColumnValue + editedValue;
            }
          } else {
            editedValue += newColumnValue.toString();
          }
        }
        this.setState({editedValue, isDirty:true});
      } else {
        let editedValue: string[] = this.state.editedValue;
        let isSubmitColumn :boolean = false;
        //alert(this.props.decimals);
        if (this.props.suffix && this.props.suffix instanceof String && this.props.suffix.indexOf("code") == -1) {
          // submit is the last column with extra options
          isSubmitColumn = (column === 4);
        } else {
          isSubmitColumn = ((this.state.fractions[4].length>(this.props.freestyle===true?3:2)?3:2) + (this.props.decimals > 0 ? (this.state.fractions[4].length> 2? 0 : 1) : 0)) <= column;
        }

        //((this.state.fractions[4].length>(this.props.freestyle===true?3:2)?3:2) + (this.props.decimals > 0 ? (this.state.fractions[4].length> 2? 0 : 1) : 0)) <= column;

        if (column>=1 && newColumnValue===this.state.editedValue[column]) newColumnValue = undefined;
        editedValue[column] = newColumnValue;
        if (!isSubmitColumn) {//Clear following columns
          for (let i = column+1; i<5; i++) {
            editedValue[i] = undefined;
          }
        }
        this.setState({editedValue, isDirty:true}, () => {if (isSubmitColumn) this.commitEdit()});
      }
    }

    format(value: ?number | string): string {
      if (value===undefined || value===null)
        return '';
      if (isNaN(value)) {
        if (this.props.options instanceof Array && this.props.options.includes(value)) {
          return value;
        } else if (this.props.prefix) {
          if (this.props.prefix.endsWith('+')) {
            return this.props.prefix.substring(0, this.props.prefix.length-1) + value;
          } else {
            return this.props.prefix + value;
          }
        }
        return value.toString();
      }
      let formattedValue: string = (this.props.decimals && this.props.decimals>0) ? Number(value).toFixed(this.props.decimals) : String(value);
      if (formattedValue=='') return '';
      if (this.props.prefix) {
        if (this.props.prefix.endsWith('+')) {
          if (formattedValue.length>0 && formattedValue[0]!='-') {
            formattedValue = this.props.prefix + formattedValue;
          } else {
            formattedValue = this.props.prefix.substring(0, this.props.prefix.length-1) + formattedValue;
          }
        } else {
          formattedValue = this.props.prefix + formattedValue;
        }
      }
      if (this.props.suffix && (this.props.suffix instanceof Array === false && this.props.suffix.includes('Code') === false))
        formattedValue = formattedValue + this.props.suffix;
      return formattedValue;
    }

    generateFractions(props: any) : string[][] {
      if (props.groupSize!==undefined && props.groupSize!==0 && (props.range[1]/props.groupSize) > 40) {
        return undefined;
      }
      let fractions : string[][] = [[],[],[],[],[]];
      if (!props.range) return fractions;
      //sign + -
      if (props.range[0]<0) {
        if (props.range[1]<=0)
          fractions[0].push('-')
        else
          fractions[0].push('+','-');
      }
      //integer group
      if (props.groupSize && props.groupSize>1) {
        const minGroup : number = Math.abs(Math.max(props.range[0], props.groupSize));
        const maxGroup : number = props.range[1];
        for (let i = minGroup; i<=maxGroup; i+= props.groupSize) {
          fractions[1].push(String(i));
        }
      }
      //integer
      let minInt : number = props.groupSize>1 && (props.stepSize instanceof Array === false) ?0:Math.abs(Math.max(props.range[0],0));
      let maxInt : number = props.groupSize>1?Math.min(props.range[1], props.groupSize-1):props.range[1];
      if (this.props.stepSize instanceof Array) {
        let c = 0;
        for (let i = minInt; i<=maxInt; c++) {
          fractions[2].push(String(i));
          let stepSize = this.props.stepSize[Math.min(this.props.stepSize.length-1, c)];
          i = i + Math.max(1, stepSize);
        }
      } else {
        for (let i = minInt; i<=maxInt;) {
          fractions[2].push(String(i));
          i = i + Math.max(1, this.props.stepSize);
        }
      }
      //decimals .25
      if (props.decimals && props.decimals>0 && this.hasDecimalSteps()) {
        for (let i = 0; i<1; i+=props.stepSize) {
          let formattedDecimals = (props.decimals && props.decimals>1) ? Number(i).toFixed(props.decimals) : String(i);
          formattedDecimals = Number(Math.round(formattedDecimals+'e'+ props.decimals) + 'e-'+props.decimals);
          if (formattedDecimals >=1) {
            continue;
          }
          formattedDecimals = formattedDecimals.toFixed(props.decimals).toString();

          fractions[3].push(formattedDecimals.length > 1 ? formattedDecimals.substring(1) : formattedDecimals);
        }
      }
      //Suffix
      if (props.suffix) {
        if (props.suffix instanceof Array) {
          fractions[4].push(...props.suffix);
        } else if (props.suffix.includes('Code')) {
          fractions[4].push(...formatAllCodes(props.suffix));
        }
      }
      //Update Button
      fractions[4].push('\u2714');
      //Clear Button
      fractions[4].push('\u2715');
      //Keyboard Button
      if (this.props.freestyle===true) {
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
      return fractions;
    }

    renderPopup() {
      const formattedValue = this.format(this.state.isDirty?this.combinedValue():this.props.value);
      const isKeypad : boolean = this.state.fractions===undefined;
      const fractions : any [][] = !isKeypad?this.state.fractions:[[7,4,1,'-'],[8,5,2,0],[9,6,3,'.'],this.props.freestyle===true?['\u2714','\u2715','\u2328']:['\u2714','\u2715']]; //TODO: localize
      const columnStyle = this.state.fractions?styles.modalColumn:styles.modalKeypadColumn;
      return <TouchableWithoutFeedback onPress={this.cancelEdit}>
          <View style={styles.popupBackground}>
            <Text style={styles.modalTitle}>{this.props.label}: {formattedValue}</Text>
            <View style={styles.flexColumn}>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return <View style={columnStyle} key={column}>
                    {options.map((option: string, row: number) => {
                      let isSelected : boolean = isKeypad===false && this.state.editedValue[column]===option;
                      if (option==='\u2328') return <KeyboardTile commitEdit={this.startTyping} key={row}/>
                      if (option==='\u2714') return <UpdateTile commitEdit={this.commitEdit} key={row}/>
                      if (option==='\u2715') return <ClearTile commitEdit={this.clearValue} key={row}/>
                      return <TouchableOpacity key={row} onPress={() => this.updateValue(column, option)}>
                        <View style={styles.popupNumberTile}>
                          <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                        </View>
                      </TouchableOpacity>
                    })}
                  </View>
              })}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    }

    render() {
      let style = this.props.style ? this.props.style: this.state.isActive ? styles.inputFieldActive : styles.inputField;
      if (this.props.width) {
        style = [{ width: this.props.width }, style];
      }
      const formattedValue : string = this.format(this.props.value);
      if (this.props.readonly) {
        return <View style={styles.fieldFlexContainer}>
          <Text style={style}>{formattedValue}</Text>
        </View>
      }
      if (this.state.isTyping) return <TextField value={this.props.value?this.props.value.toString():undefined} autoFocus={true} style={style} onChangeValue={newValue => this.commitTyping(newValue)}/>
      return <View style={styles.fieldFlexContainer}>
        <TouchableOpacity style={styles.fieldFlexContainer} onPress={this.startEditing} disabled={this.props.readonly}>
          <Text style={style}>{formattedValue}</Text>
        </TouchableOpacity>
        {this.state.isActive && <Modal visible={this.state.isActive} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
          {this.renderPopup()}
        </Modal>}
      </View>
    }
}

export class TilesField extends Component {
  props: {
    value?: ?string[]|?string,
    label?: string,
    prefix?: ?string[]|?string,
    suffix?: ?string[]|?string,
    options: (string[]|string)[],
    combineOptions?: boolean,
    freestyle?: boolean,
    width?: number,
    readonly?: boolean,
    style?: any,
    multiValue?: boolean, //TODO
    containerStyle?: any,
    onChangeValue?: (newvalue: ?(string[]|string)) => void,
    transferFocus?: {previousField: string, nextField: string, onTransferFocus: (field: string) => void }
  }
  state: {
    isActive: boolean,
    isTyping: boolean,
    editedValue?: string[]|string
  }

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      isTyping: false,
      editedValue: undefined
    }
  }

  startTyping = () => {
    if (this.props.readonly) return;
    this.setState({isActive: false, isTyping: true});
  }

  commitTyping = (newValue: string) => {
    this.setState({editedValue: newValue}, this.commitEdit);
  }

  startEditing = () => {
    if (this.props.readonly) return;
    this.setState({isActive: true, editedValue: this.props.combineOptions?split(this.props.value, this.props.options):this.props.value});
  }

  isMultiColumn() : boolean {
    return this.props.options && (this.props.options[0] instanceof Array);
  }

  getEditedColumnValue(columnIndex: number) : ?string {
    if (this.isMultiColumn()) {
      if (this.state.editedValue===undefined || this.state.editedValue.length<=columnIndex) return undefined;
      return this.state.editedValue[columnIndex];
    }
    return this.state.editedValue;
  }

  updateValue(newValue?: string, columnIndex: number) : void {
    let editedColumnValue: ?string = this.getEditedColumnValue(columnIndex);
    if (newValue===editedColumnValue) newValue = undefined;
    if (this.isMultiColumn()) {
      let editedValue : (?string)[] = this.state.editedValue;
      if ((editedValue instanceof Array) === false) editedValue = this.props.options.map(option => undefined);
      while (editedValue.length <= columnIndex) editedValue.push(undefined);
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
    let combinedValue = (this.props.combineOptions&& (this.state.editedValue instanceof Array))?this.format(this.state.editedValue):this.state.editedValue;
    if (this.props.onChangeValue)
      this.props.onChangeValue(combinedValue);
    this.setState({ isActive: false, isTyping: false });
    if (nextFocusField && this.props.transferFocus) {
      this.props.transferFocus.onTransferFocus(nextFocusField);
    }
  }

  cancelEdit = () => {
    this.setState({ isActive: false, editedValue: undefined, isTyping: false });
  }

  clear = () => {
    let clearedValue = undefined;
    if (this.state.editedValue instanceof Array) {
      clearedValue = this.state.editedValue.map(columnValue => undefined);
    }
    this.setState({ editedValue: clearedValue }, () => this.commitEdit());
  }

  format(value: ?string|?string[]) : string {
    if (value===undefined || value===null || value==='') return '';
    let formattedValue : string = '';
    if (value instanceof Array) {
      value.forEach((columnValue: ?string, columnIndex: number) => {if (columnValue!==undefined) {
        if (this.props.prefix!==undefined && this.props.prefix!==null && this.props.prefix.length>columnIndex && this.props.prefix[columnIndex]!==undefined) {
          formattedValue += this.props.prefix[columnIndex];
        }
        if (columnValue!==undefined && columnValue!==null)
          formattedValue += columnValue;
        if (this.props.suffix!==undefined && this.props.suffix!==null && this.props.suffix.length>columnIndex && this.props.suffix[columnIndex]!==undefined) {
          formattedValue += this.props.suffix[columnIndex];
        }
      }});
    } else {
      if (this.props.prefix && !this.isMultiColumn() ) {
          formattedValue += this.props.prefix;
      }
      if (value!==undefined && value!==null)
        formattedValue += value.toString();
      if (this.props.suffix && !this.isMultiColumn()) {
        formattedValue += this.props.suffix;
      }
    }
    return formattedValue;
  }

  updateConfirm() : boolean {
    return this.props.transferFocus!==undefined || this.isMultiColumn();
  }

  renderPopup() {
    let allOptions : string[][] = this.isMultiColumn()?this.props.options:[this.props.options];
    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>{this.props.label}: {this.format(this.state.editedValue)}</Text>
          <FocusTile type='previous' commitEdit={this.commitEdit} transferFocus={this.props.transferFocus} />
          <FocusTile type='next' commitEdit={this.commitEdit} transferFocus={this.props.transferFocus} />
          <View>
            <View style={styles.centeredRowLayout}>
            {allOptions.map((options :string[], columnIndex: number) =>
              <View style={styles.modalColumn} key={columnIndex}>
                {options.map((option: string, rowIndex: number) => {
                  let isSelected : boolean = this.isMultiColumn()?this.state.editedValue[columnIndex]===option:this.state.editedValue===option;
                  return <TouchableOpacity key={rowIndex} onPress={() => this.updateValue(option, columnIndex)}>
                    <View style={styles.popupNumberTile}>
                      <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                    </View>
                  </TouchableOpacity>
                })}
                {allOptions.length===1 && <ClearTile commitEdit={this.clear} />}
                {allOptions.length===1 && this.props.freestyle && <KeyboardTile commitEdit={this.startTyping} />}
              </View>
            )}
            {allOptions.length>1 && <View style={styles.modalColumn}>
                  <UpdateTile commitEdit={this.commitEdit} />
                  <ClearTile commitEdit={this.clear} />
                  {this.props.freestyle && <KeyboardTile commitEdit={this.startTyping} />}
             </View>}
            </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    let style = this.props.style?this.props.style:this.state.isActive ? styles.inputFieldActive : styles.inputField;
    if (this.props.width) {
      style = [{ width: this.props.width }, style];
    }
    const formattedValue : string = this.format(this.props.value);
    if (this.state.isTyping) return <TextField value={this.props.value} autoFocus={true} style={style} onChangeValue={newValue => this.commitTyping(newValue)}/>
    return <View style={this.props.containerStyle?this.props.containerStyle:styles.fieldFlexContainer}>
      <TouchableOpacity style={this.props.containerStyle?this.props.containerStyle:styles.fieldFlexContainer} onPress={this.startEditing} disabled={this.props.readonly}>
        <Text style={style}>{formattedValue}</Text>
      </TouchableOpacity>
      {this.state.isActive && <Modal visible={this.state.isActive} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>}
    </View>
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
    onChangeValue?: (newvalue: ?string) => void,
  }
  state: {
    isActive: boolean,
    editedValue?: string
  }

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      editedValue: this.props.value
    }
  }

  startEditing = () => {
    if (this.props.readonly) return;
    this.setState({isActive: true, editedValue: this.props.value});
  }

  updateValue = (newValue?: string) : void => {
    let editedValue: ?string = this.state.editedValue;
    if (newValue==editedValue) newValue = undefined;
    this.setState({editedValue: newValue}, this.commitEdit);
  }

  commitEdit = () => {
    if (this.props.onChangeValue)
      this.props.onChangeValue(this.state.editedValue);
    this.setState({ isActive: false });
  }

  cancelEdit = () => {
    this.setState({ isActive: false, editedValue: undefined });
  }

  format(value?: string) : string {
    if (value===undefined) return '';
    return value;
  }

  renderPopup() {
    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>{this.props.label}: {this.state.editedValue}</Text>
          <View style={styles.flexColumn}>
            <View style={styles.modalColumn}>
              <SelectionList items={this.props.options} selection={this.state.editedValue} multiValue={false} required={false} freestyle={this.props.freestyle} onUpdateSelection={this.updateValue}/>
            </View>
          </View>
      </View>
    </TouchableWithoutFeedback>
  }

  render() {
    let style = this.props.style?this.props.style:this.state.isActive ? styles.inputFieldActive : styles.inputField;
    if (this.props.width) {
      style = [{ width: this.props.width }, style];
    }
    const formattedValue : string = this.format(this.props.value);
    return <View style={this.props.containerStyle?this.props.containerStyle:styles.fieldFlexContainer}>
      <TouchableOpacity style={this.props.containerStyle?this.props.containerStyle:styles.fieldFlexContainer} onPress={this.startEditing} disabled={this.props.readonly}>
        <Text style={style}>{formattedValue}</Text>
      </TouchableOpacity>
      {this.state.isActive && <Modal visible={this.state.isActive} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>}
    </View>
  }
}

export class Clock extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <Image source={require('./image/clock.png')} style={{
      width: 140 * fontScale,
      height: 140 * fontScale,
      alignSelf: 'center',
      resizeMode: 'contain'
    }} />
  }
}

export class DateField extends Component {
    props: {
      value: ?Date,
      label: string,
      includeTime?: boolean,
      includeDay?: boolean,
      prefix?: string,
      suffix?: string,
      width?: number,
      readonly?: boolean,
      style?: any,
      onChangeValue?: (newValue: ?Date) => void
    }
    state: {
      isActive: boolean,
      isDirty: boolean,
      fractions: string[][],
      editedValue: string[],
    }
    static defaultProps = {
      includeTime: false,
      includeDay: false,
    }

    constructor(props: any) {
      super(props);
      this.state = {
        editedValue: [],
        isActive: false,
        fractions: this.generateFractions(),
        isDirty: false
      }
    }

    startEditing = () => {
      if (this.props.readonly) return;
      this.setState({
          editedValue: this.splitValue(),
          isActive: true,
          isDirty: false
      });
    }

    commitEdit = () => {
      const editedValue : ?Date = this.combinedValue();
      if (this.props.onChangeValue)
        this.props.onChangeValue(editedValue);
      this.setState({ isActive: false });
    }

    cancelEdit = () => {
      this.setState({ isActive: false });
    }

    clear = () => {
      if (this.props.onChangeValue)
        this.props.onChangeValue(undefined);
      this.setState({ isActive: false });
    }

    commitToday = () => {
      const editedValue : ?Date = new Date();
      if (this.props.onChangeValue)
        this.props.onChangeValue(editedValue);
      this.setState({ isActive: false });
    }

    formatMonth(monthIndex: number) : string {
      return formatDate(new Date(1970, monthIndex, 1), 'MMM');
    }

    generateFractions() : string[][] {
      if (this.props.includeTime) {
        const dateTimeOptions: string[][] = [['2017','2018','2019','2020','2021','2022'],
          ['Jan','Feb','Mar','Apr','May','Jun'],['Jul','Aug','Sep','Oct','Nov','Dec'], //TODO french
          ['Week 1','Week 2','Week 3','Week 4','Week 5', 'Week 6'],
          ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
          ['9 am','10 am','11 am','12 pm','1 pm','2 pm','3 pm','4 pm','5 pm','6 pm'], //TODO french
          ['00','10','15','20','30','40','45','50']];
          return dateTimeOptions
      }
      const dateOptions: string[][] = [['1920','1930','1940','1950','1960','1970','1980','1990','2000','2010'],
        ['1','2','3','4','5','6','7','8','9'],
        [this.formatMonth(0), this.formatMonth(1), this.formatMonth(2), this.formatMonth(3), this.formatMonth(4), this.formatMonth(5)],
        [this.formatMonth(6), this.formatMonth(7), this.formatMonth(8), this.formatMonth(9), this.formatMonth(10), this.formatMonth(11)],
        ['10','20','30'],
        ['1','2','3','4','5','6','7','8','9']];
      return dateOptions;
    }

    splitValue(): string[] {
      if (!this.props.value) return [];
      const date : Date = this.props.value;
      if (this.props.includeTime) {
        let year : string = formatDate(date, 'YYYY');
        let month1 : ?string = date.getMonth()>5?undefined:formatDate(date, 'MMM');
        let month2 : ?string = date.getMonth()<=5?undefined:formatDate(date, 'MMM');
        let week : string = 'Week '+(1 + Math.ceil((date.getDate() - date.getDay()) / 7));
        let day : string = formatDate(date, 'DDD');
        let hour : string = formatDate(date, 'H A');
        let minute : string = formatDate(date, 'mm');
        return [year, month1, month2, week, day, hour, minute];
      } else {
        let yearTen : string = formatDate(date, 'YYYY').substring(0, 3)+'0';
        let yearOne : string = formatDate(date, 'YYYY').substring(3, 4);
        let month : string = formatDate(date, 'MMM');
        let firstHalf : boolean = date.getMonth()<6;
        let dayTen: string = formatDate(date, 'DD').substring(0, 1)+'0';
        let day: string = formatDate(date, 'DD').substring(1);
        return [yearTen, yearOne, firstHalf?month:undefined, firstHalf?undefined:month, dayTen, day];
      }
      return [];
    }

    combinedValue() : ?Date {
      if (this.props.includeTime) {
        if (this.state.editedValue[0]===undefined || (this.state.editedValue[1]===undefined && this.state.editedValue[2]===undefined) ||
          this.state.editedValue[3]===undefined || this.state.editedValue[4]===undefined ||
          this.state.editedValue[5]===undefined)
          return undefined;
          let combinedValue : Date = new Date();
          let year: number = parseInt(this.state.editedValue[0]);
          combinedValue.setFullYear(year);
          let month : number = this.state.editedValue[1]!==undefined?
            this.state.fractions[1].indexOf(this.state.editedValue[1]):
            6+this.state.fractions[2].indexOf(this.state.editedValue[2]);
          combinedValue.setMonth(month, 1);
          let firstDay : number = combinedValue.getDay();
          let week: number = this.state.fractions[3].indexOf(this.state.editedValue[3]);
          let day: number = this.state.fractions[4].indexOf(this.state.editedValue[4]);
          day = (week * 7) - firstDay + day + 1;
          let hour : number = parseInt(this.state.editedValue[5]) + ((this.state.editedValue[5]!='12 pm' && this.state.editedValue[5].endsWith('pm'))?12:0);
          let minute : number = this.state.editedValue[6]?parseInt(this.state.editedValue[6]):0;
          combinedValue = new Date(year, month, day, hour, minute, 0, 0);
          return combinedValue;
      }
      if (this.state.editedValue[0]===undefined || (this.state.editedValue[2]===undefined && this.state.editedValue[3]===undefined) ||
        (this.state.editedValue[4]===undefined && this.state.editedValue[5]===undefined))
        return undefined;
      let combinedValue : Date = new Date();
      if (this.state.editedValue[0]!==undefined) {
        let year: number = parseInt(this.state.editedValue[0]);
        if (this.state.editedValue[1]!==undefined)
          year += parseInt(this.state.editedValue[1]);
        combinedValue.setFullYear(year);
      }
      if (this.state.editedValue[2]!==undefined || this.state.editedValue[3]!==undefined ) {
        let month : number = this.state.editedValue[2]!==undefined?
          this.state.fractions[2].indexOf(this.state.editedValue[2]):
          6+this.state.fractions[3].indexOf(this.state.editedValue[3]);
        let day: number = 0;
        if (this.state.editedValue[4]!==undefined) {
          day += parseInt(this.state.editedValue[4]);
        }
        if (this.state.editedValue[5]!==undefined) {
          day += parseInt(this.state.editedValue[5]);
        }
        combinedValue.setMonth(month, day);
      }
      return combinedValue;
    }

    updateValue(column: number, newColumnValue: string) : void {
      let editedValue: string[] = this.state.editedValue;
      if (newColumnValue===this.state.editedValue[column]) newColumnValue = undefined;
      editedValue[column] = newColumnValue;
      if (this.props.includeTime) {
        if (column===1) editedValue[2] = undefined;
        else if (column===2) editedValue[1] = undefined;
      } else {
        if (column===2) editedValue[3] = undefined;
        else if (column===3) editedValue[2] = undefined;
      }
      this.setState({editedValue, isDirty: true});
    }

    getFormat(value: ?Date) : string {
      if (!value) return yearDateFormat;
      let sameYear : boolean = isToyear(value);
      if (sameYear) {
        if (this.props.includeDay) {
          return this.props.includeTime?dayDateTime24Format:dayDateFormat;
        } else {
          return this.props.includeTime?dateTime24Format:dateFormat;
        }
      } else {
        if (this.props.includeDay) {
          return this.props.includeTime?dayYearDateTime24Format:dayYearDateFormat;
        } else {
          return this.props.includeTime?yearDateTime24Format:yearDateFormat;
        }
      }
    }

    format(value: ?Date): string {
      if (value instanceof Date) {
        return formatDate(value, this.getFormat(value));
      }
      if (value===undefined) return '';
      let stringValue : string = new String(value).toString();
      if (stringValue===undefined) return '';
      return stringValue;
    }

    renderPopup() {
      const fractions : string[][] = this.state.fractions;
      let formattedValue = this.format(this.state.isDirty?this.combinedValue():this.props.value);
      return <TouchableWithoutFeedback onPress={this.cancelEdit}>
            <View style={styles.popupBackground}>
              <Text style={styles.modalTitle}>{this.props.label}: {this.props.prefix}{formattedValue}{this.props.suffix}</Text>
              <ScrollView horizontal={true} scrollEnabled={true}>
                <View style={styles.centeredRowLayout}>
                  {fractions.map((options: string[], column: number) => {
                    return <View style={styles.modalColumn} key={column}>
                      {options.map((option: string, row: number) => {
                        let isSelected : boolean = this.state.editedValue[column]===option;
                        return <TouchableOpacity key={row} onPress={() => this.updateValue(column, option)}>
                          <View style={styles.popupNumberTile}>
                            <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                          </View>
                        </TouchableOpacity>
                      })}
                    </View>
                })}
                <View style={styles.modalColumn}>
                <TouchableOpacity onPress={this.commitToday}>
                  <View style={styles.popupNumberTile}>
                    <Text style={styles.modalTileLabel}>Today</Text>
                  </View>
                </TouchableOpacity>
                <UpdateTile commitEdit={this.commitEdit} />
                <ClearTile commitEdit={this.clear} />
                </View>
              </View>
            </ScrollView>
          </View>
      </TouchableWithoutFeedback>
    }

    render() {
      const style = this.props.style ? this.props.style: styles.formField;
      const formattedValue : string = this.format(this.props.value);
      if (this.props.readonly) {
        return <View style={styles.fieldFlexContainer}>
            <Text style={style}>{this.props.prefix}{formattedValue}{this.props.suffix}</Text>
        </View>
      }
      return <View style={styles.fieldFlexContainer}>
        <TouchableOpacity style={styles.fieldFlexContainer} onPress={this.startEditing} disabled={this.props.readonly}>
          <Text style={style}>{this.props.readonly}{this.props.prefix}{formattedValue}{this.props.suffix}</Text>
        </TouchableOpacity>
        {this.state.isActive && <Modal visible={this.state.isActive} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
          {this.renderPopup()}
        </Modal>}
      </View>
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
      onChangeValue?: (newValue: ?Date) => void
    }
    state: {
      isActive: boolean,
      isDirty: boolean,
      fractions: string[][],
      editedValue: string[],
    }
    static popularDurationMinutes : number[] = [5,10,15,30,45,60,90,120,180,240];

    constructor(props: any) {
      super(props);
      this.state = {
        editedValue: [],
        isActive: false,
        fractions: this.generateFractions(),
        isDirty: false
      }
    }

    startEditing = () => {
      if (this.props.readonly) return;
      this.setState({
          editedValue: this.splitValue(),
          isActive: true,
          isDirty: false
      });
    }

    commitEdit = () => {
      const editedValue : ?Date = this.combinedValue();
      if (this.props.onChangeValue)
        this.props.onChangeValue(editedValue);
      this.setState({ isActive: false });
    }

    clear = () => {
      if (this.props.onChangeValue)
        this.props.onChangeValue(undefined);
      this.setState({ isActive: false });
    }

    cancelEdit = () => {
      this.setState({ isActive: false });
    }

    generateFractions() : string[][] {
      const durationOptions: string[][] = [DurationField.popularDurationMinutes.map((minute: number) => capitalize(formatDuration(minute*60000)))];
      return durationOptions;
    }

    splitValue(): string[] {
      if (!this.props.value || !this.props.startDate) return [];
      const date : Date = this.props.value;
      const popularValue : string = capitalize(this.format(date));
      return [[popularValue]];
    }

    combinedValue() : ?Date {
      const totalFormattedValue : string = this.state.editedValue[0];
      if (totalFormattedValue===undefined) return undefined;
      const selectedIndex : number = this.state.fractions[0].indexOf(totalFormattedValue);
      if (selectedIndex<0) return undefined;
      const minuteDuration = DurationField.popularDurationMinutes[selectedIndex];
      let end = new Date(this.props.startDate.getTime() + minuteDuration*60000);
      return end;
    }

    updateValue(column: number, newColumnValue: string) : void {
      let editedValue: string[] = this.state.editedValue;
      if (newColumnValue===this.state.editedValue[column]) newColumnValue = undefined;
      editedValue[column] = newColumnValue;
      this.setState({editedValue, isDirty: true});
    }

    format(value: ?Date): string {
      if (value instanceof Date) {
        return formatDuration(this.props.startDate, value);
      }
      if (value===undefined) return '';
      let stringValue : string = new String(value).toString();
      if (stringValue===undefined) return '';
      return stringValue;
    }

    renderPopup() {
      const fractions : string[][] = this.state.fractions;
      let formattedValue = capitalize(this.format(this.state.isDirty?this.combinedValue():this.props.value));
      return <TouchableWithoutFeedback onPress={this.cancelEdit}>
          <View style={styles.popupBackground}>
            <Text style={styles.modalTitle}>{this.props.label}: {this.props.prefix}{formattedValue}{this.props.suffix}</Text>
            <View>
              <View style={styles.centeredRowLayout}>
                {fractions.map((options: string[], column: number) => {
                  return <View style={styles.modalColumn} key={column}>
                    {options.map((option: string, row: number) => {
                      let isSelected : boolean = this.state.editedValue[column]==option;
                      return <TouchableOpacity key={row} onPress={() => this.updateValue(column, option)}>
                        <View style={styles.popupNumberTile}>
                          <Text style={isSelected?styles.modalTileLabelSelected:styles.modalTileLabel}>{option}</Text>
                        </View>
                      </TouchableOpacity>
                    })}
                  </View>
              })}
              <View style={styles.modalColumn}>
              <UpdateTile commitEdit={this.commitEdit} />
              <ClearTile commitEdit={this.clear} />
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    }

    render() {
      let style = this.props.style ? this.props.style: this.state.isActive ? styles.inputFieldActive : styles.inputField;
      const formattedValue : string = this.format(this.props.value);
      if (this.props.readonly) {
        return <View style={styles.fieldFlexContainer}>
            <Text style={style}>{this.props.prefix}{formattedValue}{this.props.suffix}</Text>
        </View>
      }
      return <View style={styles.fieldFlexContainer}>
        <TouchableOpacity style={styles.fieldFlexContainer} onPress={this.startEditing} disabled={this.props.readonly}>
          <Text style={style}>{this.props.prefix}{formattedValue}{this.props.suffix}</Text>
        </TouchableOpacity>
        {this.state.isActive && <Modal visible={this.state.isActive} transparent={true} animationType={'slide'} onRequestClose={this.cancelEdit}>
          {this.renderPopup()}
        </Modal>}
      </View>
    }
}

export class Button extends Component {
  props: {
    title: string,
    visible?: boolean,
    disabled?: boolean,
    onPress?: () => void
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <TouchableOpacity onPress={this.props.onPress} enable={!this.props.diabled} ><View style={styles.button}><Text style={styles.buttonText}>{this.props.title}</Text></View></TouchableOpacity>
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
    style?: any
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <TouchableOpacity activeOpacity={1} disabled={this.props.readonly} onPress={this.props.isChecked==true?this.props.onDeselect:this.props.onSelect}>
      <Text style={this.props.style}>{this.props.prefix}<NativeBaseIcon name={this.props.isChecked?'md-checkbox':'md-checkbox-outline'} style={this.props.style}/>{this.props.suffix}</Text>
    </TouchableOpacity>
  }
}

export class BackButton extends Component {
  props: {
    visible? :boolean
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <NativeBaseButton block large style={styles.backButton} onPress={() => this.props.navigation.navigate('back')}><NativeBaseIcon name='md-arrow-back'/></NativeBaseButton>
  }
}

export class AddButton extends Component {
  props: {
    onPress: () => void,
    visible?: boolean
  }
  static defaultProps = {
    visible: true
  }

  render() {
    if (!this.props.visible) return null;
    return <NativeBaseButton block style={styles.addButton} onPress={this.props.onPress}><NativeBaseIcon name='md-add'/></NativeBaseButton>
  }
}

export class FloatingButton extends Component {
  props: {
    options: string[],
    onPress: (option: string) => void
  }
  state: {
    active: boolean,
  }
  constructor(props: any) {
    super(props);
    this.state = {
      active: false
    }
  }

  toggleActive = () => {
    const wasActive : boolean = this.state.active;
    this.setState({active: !wasActive}, () => {if (wasActive) this.props.onPress(undefined);});
    //if (!wasActive) setTimeout(() => {this.setState({active: false})}, 3000);
  }

  render() {
    if (!this.props.options) return null;
    return <NativeBaseFab active={this.state.active} onPress={this.toggleActive} direction='up' position='bottomRight' style={{backgroundColor: 'orange'}}
      containerStyle={{width:200*fontScale}}>
      <NativeBaseIcon name='md-add'/>
      {this.props.options.slice(0).reverse().map((option: string, index: number) => {
         return <Button style={{flex:1,width:null,minHeight: 45* fontScale,backgroundColor: '#f0ad4e'}}
            onPress={() => {
                this.props.onPress(option);
              }
            }
            key={index}>
                <Text style={styles.fabButtonText}>{option}</Text>
        </Button>
      })}
    </NativeBaseFab>
  }
}

export class Lock extends PureComponent {
  props: {
    locked: boolean,
    style: any
  }
  render() {
    if (this.props.locked)
      return <Icon name="lock" style={this.props.style} color={selectionFontColor}/>
    return <Icon name="lock-open" style={this.props.style} color={selectionFontColor}/>
  }
}

export class SelectionListRow extends React.PureComponent {
  props: {
    label: string,
    selected: boolean|string,
    onSelect: (select: boolean|string) => void,
    maxLength?: number,
    simpleSelect?: boolean
  }
  static defaultProps = {
    maxLength: 60,
    simpleSelect: false
  }

  toggleSelect() {
    if (this.props.simpleSelect) {
      if (this.props.selected===true) this.props.onSelect(false);
      else this.props.onSelect(true);
    } else {
      if (this.props.selected===true) this.props.onSelect('-');
      else if (this.props.selected==='-') this.props.onSelect('+');
      else if (this.props.selected==='+') this.props.onSelect('?');
      else if (this.props.selected==='?') this.props.onSelect(false);
      else this.props.onSelect(true);
    }
  }

  formatLabel() : string {
      if (this.props.label===undefined || this.props.label===null || this.props.label.length<=this.props.maxLength) return this.props.label;
      return this.props.label.substr(0,20)+'...' + this.props.label.substr(this.props.label.length - this.props.maxLength + 20);
  }

  render() {
    const textStyle = this.props.selected ? styles.listTextSelected : styles.listText;
    const prefix : string = this.props.selected ? (this.props.selected===true?undefined:'(' + this.props.selected+') '):undefined;
    return <TouchableOpacity underlayColor={selectionColor} onPress={() => this.toggleSelect()}>
      <View style={styles.listRow}>
        <Text style={textStyle}>{prefix}{this.formatLabel()}</Text>
      </View>
    </TouchableOpacity>
  }
}

export function selectionPrefix(selection: ?string) : string {
  if (selection===null || selection===undefined || selection.startsWith===undefined) return '';
  if (selection.startsWith('(+) ')) return '(+) ';
  else if (selection.startsWith('(-) ')) return '(-) ';
  else if (selection.startsWith('(?) ')) return '(?) ';
  return '';
}

export function stripSelectionPrefix(selection: ?string) : string {
  if (selection===null || selection ===undefined || selection.startsWith===undefined) return selection;
  if (selection.startsWith('(+) ') || selection.startsWith('(-) ') || selection.startsWith('(?) '))
    return selection.substr(4);
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
    onUpdateSelection: (selection: ?(string[] | string)) => void
  }
  state: {
    searchable: boolean,
    filter: string
  }
  static defaultProps = {
    selection: undefined,
    required: false,
    multiValue: false,
    freestyle: false,
    simpleSelect: false,
  }
  constructor(props: any) {
    super(props);
    this.state = {
      searchable: this.isSearchable(this.props.items),
      filter: ''
    }
  }

  isSearchable(items: string[]) : boolean {
    return (this.props.freestyle || (items && items.length>20));
  }

  select(item: string, select: boolean|string) {
    if (this.props.multiValue) {
      let selection: string[] = this.props.selection ? this.props.selection : [];
      const index = selection.indexOf(item);
      if (index === -1) {
        if (select === true) {
          selection.push(item);
        }
      } else {
        if (select!==true) {
          selection.splice(index, 1);
        }
      }
      this.props.onUpdateSelection(selection);
    } else {
      let selection: ?string = undefined;
      if (select===true)
        selection = item;
      else if (select==='+')
        selection = '(+) '+item;
      else if (select==='-')
        selection = '(-) '+item;
      else if (select==='?')
        selection = '(?) '+item;
      this.props.onUpdateSelection(selection);
    }
    if (this.state.filter!=='')
      this.setState({filter: ''});
  }

  isSelected(item: string): boolean|string {
    const selection : string | string[] | void = this.props.selection;
    if (!selection)
      return false;
    if (selection instanceof Array) {
      let index = selection.indexOf(item); //TODO: +-?
      return (index > -1);
    }
    if (selection === item) return true;
    if (selection === '(+) '+item) return '+';
    if (selection === '(-) '+item) return '-';
    if (selection === '(?) '+item) return '?';
    return false;
  }

  hasSelection(): boolean {
    return this.selectedCount()>0;
  }

  selectedCount() : number {
    if (this.props.multiValue) {
      if (this.props.selection instanceof Array)
        return this.props.selection.length;
      return 0;
    }
    if (this.props.selection!==undefined) {
      return 1;
    }
    return 0;
  }

  renderFilterField() {
    if (!this.state.searchable) return null;
    return <TextInput returnKeyType='search' autoCorrect={false} autoCapitalize='none' style={styles.searchField}
      value={this.state.filter} onChangeText={(filter: string) => this.setState({filter})}
     />
  }

  renderMostUsed() {
    //TODO or not
  }

  itemsToShow() : any[] {
    let data : any[] = undefined;
    if (this.props.selection instanceof Array) {
      for (let selection : string of this.props.selection) {
        if (!this.props.items.includes(selection)) {
          if (data===undefined) data = [].concat(this.props.items);
          data.unshift(selection);
        }
      }
    } else if (this.props.selection) {
      let selection : string = stripSelectionPrefix(this.props.selection);

      if (!this.props.items.includes(selection)) {
        data = [].concat(this.props.items);
        data.unshift(selection);
      }
    }
    const filter : ?string = this.state.filter!==undefined&&this.state.filter!==""?deAccent(this.state.filter.trim().toLowerCase()):undefined;
    if (filter) {
      if (!data) data = this.props.items;
      data = data.filter((item: string) => item!=null && item!==undefined && item.trim().length>0 && (deAccent(item.toLowerCase()).indexOf(filter))>=0);
    }
    if (this.props.freestyle && data!==undefined && data.length===0 && this.state.filter && this.state.filter.length>0)
      data.push(this.state.filter);
    if (data===undefined)
      data = this.props.items;
    return data;
  }

  render() {
    let style: string = this.props.required && !this.hasSelection() ? styles.boardTodo : styles.board;
    let data : any[] = this.itemsToShow();
    return <View style={style}>
      {this.props.label && <Text style={styles.screenTitle}>{this.props.label}</Text>}
      {this.renderFilterField()}
      <FlatList
        initialNumToRender={20}
        data={data}
        extraData={{filter: this.state.filter, selection: this.props.selection}}
        keyExtractor = {(item, index) => index}
        renderItem={({item}) => <SelectionListRow label={item} simpleSelect={this.props.simpleSelect} selected={this.isSelected(item)} onSelect={(isSelected : boolean|string) => this.select(item, isSelected)}/>}
      />
    </View >
  }
}

export class ImageField extends Component {
  props: {
    value: string[],
    label?: string,
    readonly?: boolean,
    style?: any,
    image?: string,
    scale?: number,
    onChangeValue?: (lines: string[]) => void
  }
  state: {
    isActive: boolean,
    penDown: boolean,
    lines: string[],
    selectedLineIndex: number;
  }
  width: number = 300 * fontScale;
  height: number = 200 * fontScale;

  static defaultProps = {
    image:'./image/perimetry.png',
    scale: 1
  }

  constructor(props: any) {
    super(props);
    this.state = {
      isActive: false,
      penDown: false,
      lines: [],
      selectedLineIndex: -1
    }
  }

  startEditing = () => {
    if (this.props.readonly) return;
    let lines : string[] = this.props.value?this.props.value.slice(0):[];
    this.setState({ isActive: true, lines, selectedLineIndex: -1 });
  }

  commitEdit = () : void => {
    this.setState({ isActive: false });
    if (this.props.onChangeValue)
      this.props.onChangeValue(this.state.lines);
  }

  liftPen() {
    this.setState({penDown: false});
  }

  cancelEdit = () : void => {
    this.setState({ isActive: false, lines: []});
  }

  selectLine(selectedLineIndex: number) : void {
    this.setState({selectedLineIndex});
  }

  updatePosition(event: any) : void {
    const x: number = event.nativeEvent.locationX;
    const y: number = event.nativeEvent.locationY;
    let lines : string[] = this.state.lines;
    let firstPoint : boolean = false;
    if (!this.state.penDown) {
      lines.push('');
      firstPoint = true;
    }
    const lineIndex : number = lines.length-1;
    let line :string = lines[lineIndex];
    if (!firstPoint) line = line + ' ';
    line = line + Math.floor(x)+','+Math.floor(y)
    lines[lineIndex] = line;
    if (firstPoint)
      this.setState({lines, penDown: true, selectedLineIndex: lineIndex});
    else
      this.setState({lines});
  }

  clear = () => {
    const selectedLineIndex : number = this.state.selectedLineIndex;
    if (selectedLineIndex>=0) {
      let lines: string[] = this.state.lines;
      lines.splice(selectedLineIndex, 1);
      this.setState({lines, selectedLineIndex: -1});
    } else {
      this.setState({lines: [], selectedLineIndex: -1});
    }
  }

  requireImage() {
    if (this.props.image==='./image/perimetry.png') return require('./image/perimetry.png');
    if (this.props.image==='./image/champvisuel.png') return require('./image/champvisuel.png');
    if (this.props.image==='./image/H.png') return require('./image/H.png');
    if (this.props.image==='./image/anteriorOD.png') return require('./image/anteriorOD.png');
    if (this.props.image==='./image/anteriorOS.png') return require('./image/anteriorOS.png');
    if (this.props.image==='./image/posteriorOD.png') return require('./image/posteriorOD.png');
    if (this.props.image==='./image/posteriorOS.png') return require('./image/posteriorOS.png');
    if (this.props.image==='./image/gonioscopyOD.png') return require('./image/gonioscopyOD.png');
    if (this.props.image==='./image/gonioscopyOS.png') return require('./image/gonioscopyOS.png');
    if (this.props.image==='./image/notations.png') return require('./image/notations.png');
    if (this.props.image==='./image/contactlensOD.png') return require('./image/contactlensOD.png');
    if (this.props.image==='./image/contactlensOS.png') return require('./image/contactlensOS.png');
  }

  renderPopup() {
    return <TouchableWithoutFeedback onPress={this.cancelEdit}>
        <View style={styles.popupBackground}>
          <Text style={styles.modalTitle}>{this.props.label}</Text>
          <View>
            <View style={styles.centeredColumnLayout}>
              <View style={styles.solidWhite} onStartShouldSetResponder={(event) => true}
                onResponderGrant={(event) => this.updatePosition(event)}
                onResponderReject={(event) => this.setState({ isActive: false })}
                onMoveShouldSetResponder={(event) => false}
                onResponderTerminationRequest={(event) => false}
                onResponderMove={(event) => this.updatePosition(event)}
                onResponderRelease={(event) => this.liftPen()}
                onResponderTerminate={(event) => this.cancelEdit()}>
                <Image source={this.requireImage()} style={{
                  width: this.width*3,
                  height: this.height*3,
                  resizeMode: 'contain'
              }} />
                <Svg style={{position: 'absolute'}} width={this.width*3} height={this.height*3}>
                  {this.state.lines.map((line: string, index: number) => {
                    if (line.indexOf(' ')>0)
                      return <Polyline points={this.state.lines[index]} key={index} delayPressIn={0} onPressIn={() => this.selectLine(this.state.selectedLineIndex===index?-1:index)}
                        fill='none' stroke={index===this.state.selectedLineIndex?'blue':'red'} strokeWidth='3' strokeLinejoin='round' />
                    let commaIndex = line.indexOf(',');
                    let x : string = line.substring(0,commaIndex);
                    let y : string = line.substring(commaIndex+1);
                    return <Circle cx={x} cy={y} r='10' fill={index===this.state.selectedLineIndex?'blue':'red'} key={index}
                      onPress = {() => this.selectLine(this.state.selectedLineIndex===index?-1:index)} />
                  })}
                </Svg>
              </View>
              <View style={styles.centeredRowLayout}>
                <ClearTile commitEdit={this.clear} />
                <UpdateTile commitEdit={this.commitEdit} />
              </View>
            </View>
          </View>
        </View>
    </TouchableWithoutFeedback>
  }

  render() {
    return <View style={styles.fieldContainer}>
      <TouchableOpacity style={styles.fieldContainer} onPress={this.startEditing} disabled={this.props.readonly}>
        <Image source={this.requireImage()} style={{
          width: this.width*this.props.scale,
          height: this.height*this.props.scale,
          resizeMode: 'contain'
        }} />
        {this.props.value && <Svg style={{position: 'absolute'}} width={this.width*this.props.scale} height={this.height*this.props.scale}>
          {this.props.value.map((line: string, index: number) => {
            if (line.indexOf(' ')>0)
              return <Polyline points={line} fill="none" stroke='black' strokeWidth='6' strokeLinejoin='round' scale={1/3*this.props.scale} key={index}/>
            let commaIndex = line.indexOf(',');
            let x : string = line.substring(0,commaIndex);
            let y : string = line.substring(commaIndex+1);
            return <Circle cx={x} cy={y} r='10' fill='black' scale={1/3*this.props.scale} key={index}
              onPress = {() => this.selectLine(this.state.selectedLineIndex===index?-1:index)} />
          })}
        </Svg>}
      </TouchableOpacity>
      {this.state.isActive?<Modal visible={this.state.isActive} transparent={true} animationType={'fade'} onRequestClose={this.cancelEdit}>
        {this.renderPopup()}
      </Modal>:null}
    </View>
  }
}
