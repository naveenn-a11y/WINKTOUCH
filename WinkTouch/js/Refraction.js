/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, Text, Switch, ScrollView, LayoutAnimation, TouchableOpacity, Alert, AsyncStorage } from 'react-native';
import type {GlassesRx, Patient, Exam, GroupDefinition, FieldDefinition, GlassRx, Prism, Visit, Measurement} from './Types';
import { styles, fontScale } from './Styles';
import { strings} from './Strings';
import { NumberField, TilesField, Button, Label } from './Widgets';
import { Anesthetics } from './EyeTest';
import { formatDegree, formatDiopter, deepClone, isEmpty, formatDate, dateFormat, farDateFormat, isToyear, now, jsonDateTimeFormat, postfix } from './Util';
import { FormInput } from './Form';
import { getFieldDefinition, filterFieldDefinition, formatLabel } from './Items';
import { getCodeDefinition, formatCode, formatAllCodes, parseCode, getAllCodes } from './Codes';
import { getVisitHistory, fetchVisitHistory } from './Visit';
import { CopyRow, Garbage, Keyboard, Plus, Copy, ImportIcon, ExportIcon } from './Favorites';
import { importData, exportData } from './MappedField';
import { getCachedItem } from './DataCache';
import { getConfiguration } from './Configuration';
import { getPatient } from './Exam';

function getRecentRefraction(patientId: string) : ?GlassesRx[] {
  let visitHistory : ?Visit[] = getVisitHistory(patientId);
  if (!visitHistory) return undefined;
  let refractions : GlassesRx[] = [];
  visitHistory.forEach((visit: Visit) => {
    if (visit.prescription) {
      const refraction : GlassesRx = visit.prescription;
      if (!refraction.prescriptionDate) {
        refraction.prescriptionDate = visit.date;
      }
      refractions = [...refractions, refraction];
    }}
  );
  if (refractions.length>3) refractions = refractions.slice(0, 3);
  return refractions;
}

export function newRefraction() : GlassesRx {
  return {
    od: { },
    os: { },
    ou: { },
    lensType: undefined,
    notes: undefined
  }
}

export function clearRefraction(glassesRx: GlassesRx) {
  if (!glassesRx) return;
  glassesRx.os = {};
  glassesRx.od = {};
  glassesRx.ou = {};
  glassesRx.lensType = undefined;
  glassesRx.notes = undefined;
}

export function initRefraction(glassesRx: GlassesRx) {
  if (!glassesRx) return;
  if (glassesRx.od === undefined) glassesRx.od = {};
  if (glassesRx.os === undefined) glassesRx.os = {};
  if (glassesRx.ou === undefined) glassesRx.ou = {};
}

export function isRxEmpty(glassesRx: ?GlassesRx) : boolean {
  if (!glassesRx) return true;
  return (isEmpty(glassesRx.lensType) && isEmpty(glassesRx.notes) && isEmpty(glassesRx.od) && isEmpty(glassesRx.os));
}


function isAstigmatic(glassesRx: GlassesRx) : boolean {
  if (!glassesRx) return false;
  if (glassesRx.od && glassesRx.od.cylinder!=undefined && glassesRx.od.cylinder!=null && glassesRx.od.cylinder!=0.0)
    return true;
  if (glassesRx.os && glassesRx.os.cylinder!=undefined && glassesRx.os.cylinder!=null && glassesRx.os.cylinder!=0.0)
    return true;
  return false;
}

function isMultiFocal(glassesRx: GlassesRx) : boolean {
  if (!glassesRx) return false;
  if (glassesRx.od && glassesRx.od.add!=undefined && glassesRx.od.add!=null && glassesRx.od.add!=0.0)
    return true;
  if (glassesRx.os && glassesRx.os.add!=undefined && glassesRx.os.add!=null && glassesRx.os.add!=0.0)
    return true;
  return false;
}

function parsePrismDiopter(text?: string) : ?number {
  if (text===null || text===undefined || text.trim()==='') return undefined;
  let number : number = parseFloat(text);
  if (number===0.0 || isNaN(number)) {
    return undefined;
  }
  return number;
}

export function parsePrism(prismText?: string) : ?Prism {
  if (prismText===undefined || prismText==null || prismText.trim()==='') return undefined;
  //TODO: parse oldest stye prism ?
  let prismTexts : string[] = prismText.trim().split(' ');
  if (prismTexts===undefined || prismTexts.length===0) {
    __DEV__ && console.error('Can\'t parse a prism out of: \''+prismText+'\'');
    return undefined;
  }
  let prismH: ?number = undefined;
  let prismHDirection : ?string = undefined;
  let prismV: ?number = undefined;
  let prismVDirection : ?string = undefined;
  if (prismTexts.length===1) {
    prismH = parsePrismDiopter(prismTexts[0]);
  } else if (prismTexts.length===2) {
    let diopter : ?number = parsePrismDiopter(prismTexts[0]);
    let direction : string = prismTexts[1];
    if (direction=='I' || direction=='O') {
      prismH = diopter;
      prismHDirection = direction;
    } else if (direction==='U' || direction==='D') {
      prismV = diopter;
      prismVDirection = direction;
    } else {
      if (direction==='0') {
        direction = 'I';
      } else if (direction==='1') {
        direction = 'O';
      }
      prismH = diopter;
      prismHDirection = direction;
    }
  } else {
    prismH = parsePrismDiopter(prismTexts[0]);
    prismHDirection = prismTexts[1];
    if (prismHDirection==='0') {
      prismHDirection = 'I';
    } else if (prismHDirection==='1') {
      prismHDirection = 'O';
    }
    prismV = parsePrismDiopter(prismTexts[2]);
    if (prismTexts.length>3) {
      prismVDirection = prismTexts[3];
      if (prismVDirection==='0') {
        prismVDirection = 'U';
      } else if (prismVDirection==='1') {
        prismVDirection = 'D';
      }
    }
  }
  if (prismH===undefined && prismHDirection===undefined && prismV===undefined && prismVDirection===undefined) return undefined;
  let prism : Prism = {prismH, prismHDirection, prismV, prismVDirection};
  return prism;
}

function hasPrismEye(glassRx: GlassRx) : boolean {
  if (glassRx) {
    let prism : ?Prism = parsePrism(glassRx.prism);
    if (prism) {
      if (prism.prismH!=undefined && prism.prismH!=null && prism.prismH!=0.0) return true;
      if (prism.prismHDirection!=undefined && prism.prismHDirection!=null && prism.prismHDirection!='') return true;
      if (prism.prismV!=undefined && prism.prismV!=null && prism.prismV!=0.0) return true;
      if (prism.prismVDirection!=undefined && prism.prismVDirection!=null && prism.prismVDirection!='') return true;
    }
  }
  return false;
}

export function hasPrism(glassesRx: GlassesRx) : boolean {
  if (glassesRx) {
    if (hasPrismEye(glassesRx.od)) return true;
    if (hasPrismEye(glassesRx.os)) return true;
  }
  return false;
}

export class VA extends Component {
  state: {
    value: number
  }
  constructor() {
    super();
    this.state = {
      value: 20
    }
  }
  render() {
    return <RulerField prefix='20/' range={[10,600]} stepSize={5}
      value={this.state.value}
      onChangeValue={(newValue: number) => this.setState({ value: newValue })} />
  }
}

export class DiopterField extends Component {
  props: {
    value: number,
    label: string,
    visible?: boolean,
    editable?: boolean,
    style?: any,
    onChangeValue: (newvalue: ?number) => void,
    transferFocus?: {previousField: string, nextField: string, onTransferFocus: (field: string) => void }
  }
  static defaultProps = {
    visible: true,
    editable: true
  }

  startEditing() {
    this.refs.field.startEditing();
  }

  render() {
    if (!this.props.visible) return null;
    return <NumberField range={[-20,20]} stepSize={.25} decimals={2} prefix={'+'}
      value={this.props.value}
      label={this.props.label}
      readonly = {!this.props.editable}
      onChangeValue={this.props.onChangeValue}
      style={this.props.style}
      transferFocus={this.props.transferFocus}
      ref='field'
    />
  }
}

export class DegreeField extends Component {
  props: {
    value: number,
    label: string,
    visible?: boolean,
    editable?: boolean,
    style?: any,
    onChangeValue: (newvalue: ?number) => void,
    transferFocus?: {previousField: string, nextField: string, onTransferFocus: (field: string) => void }
  }
  static defaultProps = {
    visible: true
  }

  startEditing() {
    this.refs.field.startEditing();
  }

  render() {
    if (!this.props.visible) return null;
    return <NumberField range={[0,180]} stepSize={1} groupSize={10} decimals={0}
      value={this.props.value} label={this.props.label}
      suffix='&#176;'
      editable = {this.props.editable}
      style = {this.props.style}
      onChangeValue={this.props.onChangeValue}
      transferFocus={this.props.transferFocus}
      ref='field'
    />
  }
}

 export function formatPrism(prism: string) : string {
  if (prism === undefined) return '';
  let parsedPrism : ?Prism = parsePrism(prism);
  if(parsedPrism === undefined || parsedPrism===null) return '';
  let formattedPrism : string = '';
  if (parsedPrism.prismH!==undefined && parsedPrism.prismH!==null && parsedPrism.prismH!==0) {
    formattedPrism += parsedPrism.prismH;
    formattedPrism += formatCode('prism1b', parsedPrism.prismHDirection);
  }
  if (parsedPrism.prismV!==undefined && parsedPrism.prismV!==null && parsedPrism.prismV!==0) {
    if (formattedPrism!='') formattedPrism += ' ';
    formattedPrism += parsedPrism.prismV;
    formattedPrism += formatCode('prism2b', parsedPrism.prismVDirection);
  }
  if (formattedPrism!='') formattedPrism = '\u25b3'+formattedPrism;
  return formattedPrism;
}

export class GeneralPrismInput extends Component {
  props: {
    value: ?string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    visible?: boolean,
    onChangeValue: (newValue: ?string) => void,
    containerStyle?: any,
    testID: string
  }
  state: {
    splittedValue: string[];
  }
  static defaultProps = {
    visible: true
  }
  static bigNumbers : string[] = ['1','2','3','4','5','6','7','8','9'];
  static smallNumbers : string[] = ['.00','.25','.50','.75'];
  inOut : string[] = formatAllCodes('prism1b');
  upDown: string[] = formatAllCodes('prism2b');
  options : string[][] = [GeneralPrismInput.bigNumbers, GeneralPrismInput.smallNumbers, this.inOut, GeneralPrismInput.bigNumbers, GeneralPrismInput.smallNumbers, this.upDown];

  constructor(props: any) {
      super(props);
      this.state = {splittedValue: this.splitValue(this.props.value)};
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value===prevProps.value) return;
    this.setState({splittedValue: this.splitValue(this.props.value)});
  }

  splitValue(value: ?string) : string[] {
    let splittedValue : ?string[] =  [undefined,undefined,undefined,undefined,undefined,undefined];
    if (value===undefined || value===null) return splittedValue;
    let prism: Prism = parsePrism(value);
    if (prism===undefined || prism===null) return splittedValue;
    splittedValue[0] = isNaN(prism.prismH)||prism.prismH==0?undefined:parseInt(prism.prismH).toString();
    splittedValue[1] = isNaN(prism.prismH)||prism.prismH==0?undefined:Number(prism.prismH).toFixed(2);
    splittedValue[1] = isNaN(prism.prismH)||prism.prismH==0?undefined:splittedValue[1].substr(splittedValue[1].indexOf('.'));
    splittedValue[2] = prism.prismHDirection===undefined?undefined:formatCode('prism1b', prism.prismHDirection);
    splittedValue[3] = isNaN(prism.prismV)||prism.prismV==0?undefined:parseInt(prism.prismV).toString();
    splittedValue[4] = isNaN(prism.prismV)||prism.prismV==0?undefined:Number(prism.prismV).toFixed(2);
    splittedValue[4] = isNaN(prism.prismV)||prism.prismV==0?undefined:splittedValue[4].substr(splittedValue[4].indexOf('.'));
    splittedValue[5] = prism.prismVDirection===undefined?undefined:formatCode('prism2b', prism.prismVDirection);
    return splittedValue;
  }

  changeValue = (editedValue: string[]) => {
    let prismH : string = '';
    if (editedValue[0]!==undefined) {
      prismH = editedValue[0];
    }
    if (editedValue[1]!==undefined && editedValue[1]!=='.00') {
      if (prismH==='') prismH = '0';
      prismH += editedValue[1];
    }
    let prismHDirection : ?string = prismH===undefined?'':editedValue[2] === undefined ? '' : parseCode('prism1b',editedValue[2]);

    let prismV : ?number = '';
    if (editedValue[3]!==undefined) {
      prismV = editedValue[3];
    }
    if (editedValue[4]!==undefined && editedValue[4]!=='.00') {
      if (prismV==='') prismV = '0';
      prismV += editedValue[4];
    }
    let prismVDirection : ?string = prismV===undefined?'':editedValue[5] === undefined ? '' : parseCode('prism2b',  editedValue[5]);

    let prism: ?string = postfix(prismH,' ')+postfix(prismHDirection,' ')+postfix(prismV,' ')+prismVDirection;
    prism=prism.trim();
    this.props.onChangeValue(prism);
  }

  render() {
    const style : ?any = this.props.style?this.props.style:(this.props.readonly)?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField;
    if (!this.props.visible) return null;
    return <TilesField style={style} label={formatLabel(getFieldDefinition('visit.prescription.od.prism'))} options={this.options}
      value={this.state.splittedValue} onChangeValue={this.changeValue} containerStyle={this.props.containerStyle} readonly={this.props.readonly}
      prefix={[undefined,undefined,' ',undefined,undefined,' ']} suffix={[undefined,undefined,' ',undefined,undefined,undefined]} testID={this.props.testID}/>
  }
}


export class GlassesSummary extends Component {
  props: {
    glassesRx: GlassesRx,
    title?: string,
    visible?: boolean,
    showHeaders?: boolean,
    titleStyle?: any
  }
  static defaultProps = {
    visible: true,
    showHeaders: true,
    titleStyle: styles.cardTitle
  }



  render() {
    if (this.props.visible!==true || isRxEmpty(this.props.glassesRx))
      return null;

    return <View style={styles.columnLayout} key={this.props.title}>
      {this.props.title!==null && this.props.title!==undefined && <Text style={this.props.titleStyle}>{this.props.title}</Text>}
      {this.props.glassesRx.lensType!=undefined && this.props.glassesRx.lensType!=null && this.props.glassesRx.lensType!='' && <Text style={styles.text}>{this.props.glassesRx.lensType}:</Text>}
      <View style={styles.rowLayout}>
        <View style={styles.cardColumn}>
          {this.props.showHeaders===true && <Text style={styles.text}></Text>}
          {<Text style={styles.text}>{'\t'+strings.od}:</Text>}
          {<Text style={styles.text}>{'\t'+strings.os}:</Text>}
        </View>
        <View style={styles.cardColumn} key='sph'>
          {this.props.showHeaders===true && <Text style={styles.text}>Sphere </Text>}
          {this.props.glassesRx.od && <Text style={styles.text} key='od.sph'> {!isEmpty(this.props.glassesRx.od.sph)?formatDiopter(this.props.glassesRx.od.sph):''}</Text>}
          {this.props.glassesRx.os && <Text style={styles.text} key='os.sph'> {!isEmpty(this.props.glassesRx.os.sph)?formatDiopter(this.props.glassesRx.os.sph):''}</Text>}
        </View>
        <View style={styles.cardColumn} key='cyl'>
          {this.props.showHeaders===true && <Text style={styles.text}>Cyl </Text>}
          {this.props.glassesRx.od && <Text style={styles.text} key='od.cyl'> {!isEmpty(this.props.glassesRx.od.cyl)?formatDiopter(this.props.glassesRx.od.cyl):''}</Text>}
          {this.props.glassesRx.os && <Text style={styles.text} key='os.cyl'> {!isEmpty(this.props.glassesRx.os.cyl)?formatDiopter(this.props.glassesRx.os.cyl):''}</Text>}
        </View>
        <View style={styles.cardColumn} key='axis'>
          {this.props.showHeaders===true && <Text style={styles.text}>Axis </Text>}
          {this.props.glassesRx.od && <Text style={styles.text} key='od.axis'> {!isEmpty(this.props.glassesRx.od.axis)?formatDegree(this.props.glassesRx.od.axis):''}</Text>}
          {this.props.glassesRx.os && <Text style={styles.text} key='os.axis'> {!isEmpty(this.props.glassesRx.os.axis)?formatDegree(this.props.glassesRx.os.axis):''}</Text>}
        </View>
        <View style={styles.cardColumn} key='add'>
          {this.props.showHeaders===true && <Text style={styles.text}>Add </Text>}
          {this.props.glassesRx.od && <Text style={styles.text} key='od.add'>{!isEmpty(this.props.glassesRx.od.add) ? ' '+ strings.add + ': ' + formatDiopter(this.props.glassesRx.od.add):''}</Text>}
          {this.props.glassesRx.os && <Text style={styles.text} key='os.add'>{!isEmpty(this.props.glassesRx.os.add) ? ' '+ strings.add + ': ' + formatDiopter(this.props.glassesRx.os.add):''}</Text>}
        </View>
        <View style={styles.cardColumn} key='prism'>
          {this.props.showHeaders===true && <Text style={styles.text}>Prism </Text>}
          {this.props.glassesRx.od && <Text style={styles.text} key='od.prism'> {formatPrism(this.props.glassesRx.od.prism)}</Text>}
          {this.props.glassesRx.os && <Text style={styles.text} key='os.prism'> {formatPrism(this.props.glassesRx.os.prism)}</Text>}
        </View>
    </View>
    </View>
  }
}

export class GlassesDetail extends Component {
  props: {
    definition: GroupDefinition,
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onCopy?: (glassesRx: GlassesRx) => void,
    onPaste?: (glassesRx: GlassesRX) => void,
    hasVA?: boolean,
    hasAdd?: boolean,
    hasLensType?: boolean,
    hasNotes?: boolean,
    titleStyle?: string,
    style?: string,
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void,
    onAdd?: () => void,
    onClear? : () => void,
    examId: string,
    fieldId?: string
  }
  state: {
    prism:boolean,
    isTyping: boolean
  }
  static defaultProps = {
    editable: true,
    titleStyle: styles.sectionTitle
  }

  constructor(props: any) {
    super(props);
    this.state = {
      prism: hasPrism(this.props.glassesRx),
      isTyping: false
    }
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.glassesRx!==prevProps.glassesRx) {
      this.setState({
        prism: hasPrism(this.props.glassesRx)
      });
    }
  }

  updateGlassesRx(oculus: string, propertyName: string, value: ?number | string) : void {
    if (!this.props.editable) return;
    let glassesRx: GlassesRx = this.props.glassesRx;
    if (oculus)
      glassesRx[oculus][propertyName] = value;
    else
      glassesRx[propertyName] = value;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  updatePrism(oculus: string, prism: String) : void {
    if (!this.props.editable) return;
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus].prism = prism;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  togglePrism = () => {
    let glassesRx : GlassesRx = this.props.glassesRx;
    let hasPrism :boolean = this.state.prism;
    if (hasPrism) {
      if (glassesRx.od) {
        glassesRx.od.prism = undefined;
        glassesRx.od.prism1 = undefined;
        glassesRx.od.prism1b = undefined;
        glassesRx.od.prism2 = undefined;
        glassesRx.od.prism2b = undefined;
      }
      if (glassesRx.os) {
        glassesRx.os.prism = undefined;
        glassesRx.os.prism1 = undefined;
        glassesRx.os.prism1b = undefined;
        glassesRx.os.prism2 = undefined;
        glassesRx.os.prism2b = undefined;
      }
      this.setState({prism: false}, () => this.props.onChangeGlassesRx(glassesRx));
    } else {
      this.setState({prism: true});
    }
  }

  copyOdOs = () : void => {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx.os = {...glassesRx.od};
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  clear = () : void => {
    if (this.props.onClear) {
      this.props.onClear();
    } else {
      let glassesRx: GlassesRx = this.props.glassesRx;
      clearRefraction(glassesRx);
      if (this.props.onChangeGlassesRx)
        this.props.onChangeGlassesRx(glassesRx);
    }
  }

  toggleTyping = () : void => {
    this.setState({isTyping: this.state.isTyping?false:true});
  }

  transferFocus = (fieldRef: string) => {
    this.refs[fieldRef].startEditing();
  }

  async importData() {
    const data = await importData(this.props.definition.import, this.props.examId);
    if (data===undefined || data===null) return;
    if (data instanceof Array) {
      const options = data.map((importData: Measurement) => {
        return {
          text: importData.label,
          onPress: () => {
            let glassesRx: GlassesRx = this.props.glassesRx;
            glassesRx.lensType = importData.data.lensType;
            glassesRx.od = {...importData.data.od};
            glassesRx.os = {...importData.data.os};
            if (this.props.onChangeGlassesRx) {
              this.setState({prism: hasPrism(glassesRx)});
              this.props.onChangeGlassesRx(glassesRx);
            }
          }
        }
      });
      options.push({text: strings.cancel});
      Alert.alert(
          strings.importDataQuestion,
          undefined,
          options
      );
    } else {
      let glassesRx: GlassesRx = this.props.glassesRx;
      glassesRx.lensType = data.data.lensType;
      glassesRx.od = {...data.data.od};
      glassesRx.os = {...data.data.os};
      if (this.props.onChangeGlassesRx) {
        this.setState({prism: hasPrism(glassesRx)});
        this.props.onChangeGlassesRx(glassesRx);
      }
    }
  }

  async exportData() {
    if (this.props.definition.export===undefined) return;
    const exam : Exam = getCachedItem(this.props.examId);
    const patient: Patient = getPatient(exam);
    let measurement : Measurement = {
      label: this.props.title?this.props.title:formatLabel(this.props.definition),
      date: formatDate(now(), jsonDateTimeFormat),
      patientId: patient.id,
      data: this.props.glassesRx
    };
    const data = await exportData(this.props.definition.export[0], measurement, this.props.examId);
    const config = getConfiguration();
    if(config.machine && config.machine.phoropter) {
      const machineDefinition = getCodeDefinition('machines', config.machine.phoropter);
      if (machineDefinition.ip) {
        await fetch('http://' + machineDefinition.ip + ':80/m')
      }
    }

  }

  render() {
    if (!this.props.glassesRx)
      return null;
    if(!this.props.glassesRx.od || !this.props.glassesRx.os)
      return null;
    return <View style={this.props.style?this.props.style:(this.state.prism&&this.props.hasVA)?styles.boardXL:(this.state.prism||this.props.hasVA)?styles.boardL:styles.boardM}>
      {this.props.title && <Label suffix='' style={this.props.titleStyle} value={this.props.title} fieldId={this.props.fieldId}/>}
      <View style={styles.centeredColumnLayout}>
          {this.props.hasLensType && <View style={styles.formRow}>
            <FormInput value={this.props.glassesRx.lensType} definition={filterFieldDefinition(this.props.definition.fields, "lensType")} readonly={!this.props.editable}
              onChangeValue={(value: ?string) => this.updateGlassesRx(undefined, 'lensType', value)} errorMessage={this.props.glassesRx.lensTypeError} testID={this.props.fieldId+'.lensType'}/>
          </View>}
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}></Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.sph'))}</Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.cyl'))}</Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.axis'))}</Text>
            {this.state.prism && <Text style={styles.formTableColumnHeaderWide}>{formatLabel(getFieldDefinition('visit.prescription.od.prism1'))}</Text>}
            {this.props.hasVA && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))}</Text>}
            {this.props.hasAdd && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.add'))}</Text>}
            {this.props.hasVA && this.props.hasAdd && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))}</Text>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{strings.od}:</Text>
            <FormInput value={this.props.glassesRx.od.sph} definition={getFieldDefinition('visit.prescription.od.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sph', value)} errorMessage={this.props.glassesRx.od.sphError} isTyping={this.state.isTyping} autoFocus={true} testID={this.props.fieldId+'.od.sph'}/>
            <FormInput value={this.props.glassesRx.od.cyl} definition={getFieldDefinition('visit.prescription.od.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cyl', value)} errorMessage={this.props.glassesRx.od.cylError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.od.cyl'}/>
            <FormInput value={this.props.glassesRx.od.axis} definition={getFieldDefinition('visit.prescription.od.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)} errorMessage={this.props.glassesRx.od.axisError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.od.axis'}/>
            {this.state.prism && <View style={styles.formElement2}><GeneralPrismInput value={this.props.glassesRx.od.prism} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?String) => this.updatePrism('od', value)} testID={this.props.fieldId+'.od.prism'}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.od.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('od','va', value)} errorMessage={this.props.glassesRx.od.vaError} testID={this.props.fieldId+'.od.dva'}/>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.add} definition={getFieldDefinition('visit.prescription.od.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','add', value)} errorMessage={this.props.glassesRx.od.addError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.od.add'}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('od','addVa', value)} errorMessage={this.props.glassesRx.od.addVaError} testID={this.props.fieldId+'.od.nva'}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
            {this.props.editable && <CopyRow onPress={this.copyOdOs}/>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{strings.os}:</Text>
            <FormInput value={this.props.glassesRx.os.sph} definition={getFieldDefinition('visit.prescription.os.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','sph', value)} errorMessage={this.props.glassesRx.os.sphError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.os.sph'}/>
            <FormInput value={this.props.glassesRx.os.cyl} definition={getFieldDefinition('visit.prescription.os.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','cyl', value)} errorMessage={this.props.glassesRx.os.cylError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.os.cyl'}/>
            <FormInput value={this.props.glassesRx.os.axis} definition={getFieldDefinition('visit.prescription.os.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','axis', value)} errorMessage={this.props.glassesRx.os.axisError} isTyping={this.state.isTyping}  testID={this.props.fieldId+'.os.axis'}/>
            {this.state.prism && <View style={styles.formElement2}><GeneralPrismInput value={this.props.glassesRx.os.prism} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('os', value)} testID={this.props.fieldId+'.os.prism'}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.os.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OS')} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('os','va', value)} errorMessage={this.props.glassesRx.os.vaError} testID={this.props.fieldId+'.os.dva'}/>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.add} definition={getFieldDefinition('visit.prescription.os.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','add', value)} errorMessage={this.props.glassesRx.os.addError} isTyping={this.state.isTyping} testID={this.props.fieldId+'.os.add'}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OS')} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('os','addVa', value)} errorMessage={this.props.glassesRx.os.addVaError} testID={this.props.fieldId+'.os.nva'}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>
          {this.props.hasVA===true && this.props.glassesRx.ou!==undefined && <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{strings.ou}:</Text>
            <View style={styles.fieldFlexContainer}><Text style={styles.text}></Text></View>
            <View style={styles.fieldFlexContainer}><Text style={styles.text}></Text></View>
            <View style={styles.fieldFlexContainer}><Text style={styles.text}></Text></View>
            {this.state.prism && <View style={styles.formElement2}><Text style={styles.text}></Text></View>}
            <FormInput value={this.props.glassesRx.ou.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OU')} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('ou','va', value)} errorMessage={this.props.glassesRx.ou.vaError}  testID={this.props.fieldId+'.ou.dva'}/>
            {this.props.hasAdd===true && <View style={styles.fieldFlexContainer}><Text style={styles.text}></Text></View>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.ou.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OU')} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('ou','addVa', value)} errorMessage={this.props.glassesRx.ou.addVaError}  testID={this.props.fieldId+'.ou.nva'}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>}
          {(this.props.hasNotes===true || (this.props.definition!==undefined && this.props.definition.hasNotes)) && <View style={styles.formRow}>
            <FormInput value={this.props.glassesRx.notes} definition={getFieldDefinition('visit.prescription.notes')} readonly={!this.props.editable}
              onChangeValue={(value: ?string) => this.updateGlassesRx(undefined, 'notes', value)} errorMessage={this.props.glassesRx.notesError}  testID={this.props.fieldId+'.notes'}/>
          </View>}
        {this.props.editable===true && this.props.hasAdd===true && <View style={styles.buttonsRowLayout}>
          <Button title={formatLabel(getFieldDefinition('visit.prescription.od.prism'))} onPress={this.togglePrism} testID={this.props.fieldId+'.prismButton'}/>
          {this.props.onCopy!==undefined && <Button title={strings.copyToFinal} onPress={() => this.props.onCopy(this.props.glassesRx)} testID={this.props.fieldId+'.copyOsOdButton'} testID={this.props.fieldId+'.copyFinalRxButton'}/>}
        </View>}
      </View>
      <View style={styles.groupExtraIcons}>
        {this.props.editable && this.props.definition.import && <TouchableOpacity onPress={() => this.importData()} testID={this.props.fieldId+'.importButton'}><ImportIcon style={styles.groupIcon}/></TouchableOpacity>}
        {this.props.editable && this.props.definition.export && getConfiguration().machine.phoropter!==undefined && <TouchableOpacity onPress={() => this.exportData()} testID={this.props.fieldId+'.exportButton'}><ExportIcon style={styles.groupIcon}/></TouchableOpacity>}
      </View>
      <View style={styles.groupIcons}>
          {this.props.editable && <TouchableOpacity onPress={this.props.onClear?this.props.onClear:this.clear} testID={this.props.fieldId+'.garbageIcon'}><Garbage style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && this.props.onAdd && <TouchableOpacity onPress={this.props.onAdd} testID={this.props.fieldId+'.addIcon'}><Plus style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && this.props.onPaste && <TouchableOpacity onPress={() => this.props.onPaste(this.props.glassesRx)} testID={this.props.fieldId+'.pateIcon'}><Copy style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && <TouchableOpacity onPress={this.toggleTyping} testID={this.props.fieldId+'.keyboardIcon'}><Keyboard style={styles.groupIcon} disabled={this.state.isTyping}/></TouchableOpacity>}
        </View>
    </View>
  }
}

export class PatientRefractionCard extends Component {
  props: {
    patientInfo: PatientInfo,
  }
  state: {
    refractions : ?GlassesRx[];
  }


  constructor(props: any) {
      super(props);
      this.state = {
        refractions: getRecentRefraction(props.patientInfo.id)
      }
      this.refreshPatientInfo();
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.patientInfo===prevProps.patientInfo) return;
    this.setState({refractions: getRecentRefraction(this.props.patientInfo.id)}, this.refreshPatientInfo);
  }

  async refreshPatientInfo(patientId: string) {
    if ( this.state.refractions) return;
    let refractions : ?GlassesRx[] = getRecentRefraction(this.props.patientInfo.id);
    if (refractions===undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      refractions = getRecentRefraction(this.props.patientInfo.id);
    }
    this.setState({refractions});
  }


  render() {
    return <View style={styles.tabCard}>
      {(!this.state.refractions || this.state.refractions.length===0) &&  <Text style={styles.cardTitle}>{strings.finalRx}</Text>}
      {this.state.refractions && this.state.refractions.map((refraction: GlassesRx, index: number) =>
         <GlassesSummary showHeaders={false} title={strings.finalRx+' '+formatDate(refraction.prescriptionDate, isToyear(refraction.prescriptionDate)?dateFormat:farDateFormat)} glassesRx={refraction} key={index}/>)}
    </View>
  }
}
