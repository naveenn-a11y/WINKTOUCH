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
import { formatDegree, formatDiopter, deepClone, isEmpty, formatDate, dateFormat, farDateFormat, isToyear, now, jsonDateTimeFormat} from './Util';
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
    od: {
      sph: undefined,
    },
    os: {
      sph: undefined
    }
  }
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

export function isPrism(glassesRx: GlassesRx) : boolean {
  if (!glassesRx) return false;
  if (glassesRx.od && glassesRx.od.prism1!=undefined && glassesRx.od.prism1!=null && glassesRx.od.prism1!=0.0)
    return true;
  if (glassesRx.od && glassesRx.od.prism2!=undefined && glassesRx.od.prism2!=null && glassesRx.od.prism2!=0.0)
      return true;
  if (glassesRx.os && glassesRx.os.prism1!=undefined && glassesRx.os.prism1!=null && glassesRx.os.prism1!=0.0)
    return true;
  if (glassesRx.os && glassesRx.os.prism2!=undefined && glassesRx.os.prism2!=null && glassesRx.os.prism2!=0.0)
      return true;
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

 export function formatPrism(eyeRx: GlassRx) : string {
  if (eyeRx === undefined) return '';
  let prism : string = '';
  if (eyeRx.prism1!==undefined && eyeRx.prism1!==0) {
    prism += eyeRx.prism1 + ' ';
    prism += formatCode('prism1b', eyeRx.prism1b);
  }
  if (eyeRx.prism2!==undefined && eyeRx.prism2!==0) {
    prism += eyeRx.prism2 + ' ';
    prism += formatCode('prism2b', eyeRx.prism2b);
  }
  return prism;
}

export class PrismInput extends Component {
  props: {
    value: ?Prism,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    visible?: boolean,
    onChangeValue: (newValue: ?Prism) => void,
    containerStyle?: any
  }
  static defaultProps = {
    visible: true
  }
  static bigNumbers : string[] = ['1','2','3','4','5','6','7','8','9'];
  static smallNumbers : string[] = ['.00','.25','.50','.75'];
  inOut : string[] = formatAllCodes('prism1b');
  upDown: string[] = formatAllCodes('prism2b');
  options : string[][] = [PrismInput.bigNumbers, PrismInput.smallNumbers, this.inOut, PrismInput.bigNumbers, PrismInput.smallNumbers, this.upDown];
  splittedValue: string[];

  constructor(props: any) {
      super(props);
      this.splittedValue = this.splitValue(this.props.value);
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value===prevProps.value) return;
    this.splittedValue = this.splitValue(this.props.value);
  }

  splitValue(glassRx: ?GlassRx) : string[] {
    let splittedValue : ?string[] =  [undefined,undefined,undefined,undefined,undefined,undefined];
    if (glassRx===undefined || glassRx===null) return splittedValue;
    splittedValue[0] = isNaN(glassRx.prism1)||glassRx.prism1==0?undefined:parseInt(glassRx.prism1).toString();
    splittedValue[1] = isNaN(glassRx.prism1)||glassRx.prism1==0?undefined:Number(glassRx.prism1).toFixed(2);
    splittedValue[1] = isNaN(glassRx.prism1)||glassRx.prism1==0?undefined:splittedValue[1].substr(splittedValue[1].indexOf('.'));
    splittedValue[2] = isNaN(glassRx.prism1)||glassRx.prism1==0?undefined:formatCode('prism1b', glassRx.prism1b);
    splittedValue[3] = isNaN(glassRx.prism2)||glassRx.prism2==0?undefined:parseInt(glassRx.prism2).toString();
    splittedValue[4] = isNaN(glassRx.prism2)||glassRx.prism2==0?undefined:Number(glassRx.prism2).toFixed(2);
    splittedValue[4] = isNaN(glassRx.prism2)||glassRx.prism2==0?undefined:splittedValue[4].substr(splittedValue[4].indexOf('.'));
    splittedValue[5] = isNaN(glassRx.prism2)||glassRx.prism2==0?undefined:formatCode('prism2b', glassRx.prism2b);
    return splittedValue;
  }

  changeValue = (editedValue: string[]) => {
    console.log(editedValue);
    let prism1 : ?number = undefined;
    if (editedValue[0]!==undefined) {
      prism1 = Number(editedValue[0]);
    }
    if (editedValue[1]!==undefined && editedValue[1]!=='.00') {
      if (prism1===undefined) prism1 = 0;
      prism1 += Number(editedValue[1]);
    }
    let prism1b : ?number = prism1===undefined?undefined:parseCode('prism1b', editedValue[2]);
    let prism2 : ?number = undefined;
    if (editedValue[3]!==undefined) {
      prism2 = Number(editedValue[3]);
    }
    if (editedValue[4]!==undefined && editedValue[4]!=='.00') {
      if (prism2===undefined) prism2 = 0;
      prism2 += Number(editedValue[4]);
    }
    let prism2b : ?number = prism2===undefined?undefined:parseCode('prism2b', editedValue[5]);
    let prism = {
      prism1,
      prism1b,
      prism2,
      prism2b,
    }
    this.props.onChangeValue(prism);
  }

  render() {
    const style : ?any = this.props.style?this.props.style:(this.props.readonly)?styles.formFieldReadOnly:this.props.errorMessage?styles.formFieldError:styles.formField;
    if (!this.props.visible) return null;
    return <TilesField style={style} label={formatLabel(getFieldDefinition('visit.prescription.od.prism1'))} options={this.options}
      value={this.splittedValue} onChangeValue={this.changeValue} containerStyle={this.props.containerStyle} readonly={this.props.readonly}
      prefix={[undefined,undefined,' ',undefined,undefined,' ']} suffix={[undefined,undefined,' ',undefined,undefined,undefined]} />
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
    if (this.props.visible!==true)
      return null;
    if (isEmpty(this.props.glassesRx)) {
      return <View style={styles.columnLayout} key={this.props.title}>
          <Text style={this.props.titleStyle}>{this.props.title}</Text>
      </View>
    }
    return <View style={styles.columnLayout} key={this.props.title}>
      {this.props.title!==null && this.props.title!==undefined && <Text style={this.props.titleStyle}>{this.props.title}</Text>}
      {this.props.glassesRx.lensType!=undefined && this.props.glassesRx.lensType!=null && this.props.glassesRx.lensType!='' && <Text style={styles.text}>{this.props.glassesRx.lensType}:</Text>}
      <View style={styles.rowLayout}>
        <View style={styles.cardColumn}>
          {this.props.showHeaders===true && <Text style={styles.text}></Text>}
          <Text style={styles.text}>{'\t'+strings.od}:</Text>
          <Text style={styles.text}>{'\t'+strings.os}:</Text>
        </View>
        <View style={styles.cardColumn} key='sph'>
          {this.props.showHeaders===true && <Text style={styles.text}>Sphere</Text>}
          <Text style={styles.text} key='od.sph'> {this.props.glassesRx.od?formatDiopter(this.props.glassesRx.od.sph):''}</Text>
          <Text style={styles.text} key='os.sph'> {this.props.glassesRx.os?formatDiopter(this.props.glassesRx.os.sph):''}</Text>
        </View>
        <View style={styles.cardColumn} key='cyl'>
          {this.props.showHeaders===true && <Text style={styles.text}>Cyl</Text>}
          <Text style={styles.text}> {this.props.glassesRx.od?formatDiopter(this.props.glassesRx.od.cyl):''}</Text>
          <Text style={styles.text}> {this.props.glassesRx.os?formatDiopter(this.props.glassesRx.os.cyl):''}</Text>
        </View>
        <View style={styles.cardColumn} key='axis'>
          {this.props.showHeaders===true && <Text style={styles.text}>Axis</Text>}
          <Text style={styles.text}> {this.props.glassesRx.od?formatDegree(this.props.glassesRx.od.axis):''}</Text>
          <Text style={styles.text}> {this.props.glassesRx.os?formatDegree(this.props.glassesRx.os.axis):''}</Text>
        </View>
        <View style={styles.cardColumn} key='add'>
          {this.props.showHeaders===true && <Text style={styles.text}>Add</Text>}
          <Text style={styles.text}> {this.props.glassesRx.od?formatDiopter(this.props.glassesRx.od.add):''}</Text>
          <Text style={styles.text}> {this.props.glassesRx.os?formatDiopter(this.props.glassesRx.os.add):''}</Text>
        </View>
        <View style={styles.cardColumn} key='prism'>
          {this.props.showHeaders===true && <Text style={styles.text}>Prism</Text>}
          <Text style={styles.text}> {this.props.glassesRx.od?formatPrism(this.props.glassesRx.od):''}</Text>
          <Text style={styles.text}> {this.props.glassesRx.os?formatPrism(this.props.glassesRx.os):''}</Text>
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
      prism: isPrism(this.props.glassesRx),
      isTyping: false
    }
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.glassesRx===prevProps.glassesRx) return;
    this.setState({
      prism: isPrism(this.props.glassesRx)
    });
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

  updatePrism(oculus: string, prism: Prism) : void {
    if (!this.props.editable) return;
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus].prism1 = prism.prism1;
    glassesRx[oculus].prism1b = prism.prism1b;
    glassesRx[oculus].prism2 = prism.prism2;
    glassesRx[oculus].prism2b = prism.prism2b;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  toggle(propertyName: string) : void {
    let glassesUpdated: boolean = false;
    let glassesRx : GlassesRx = this.props.glassesRx;
    if (propertyName==='astigmatism' && this.state.astigmatism) {
        glassesRx.od.cyl = undefined;
        glassesRx.od.axis = undefined;
        glassesRx.os.cyl = undefined;
        glassesRx.os.axis = undefined;
        glassesUpdated = true;
    } else if (propertyName==='multiFocal' && this.state.multiFocal) {
        glassesRx.od.add = undefined;
        glassesRx.os.add = undefined;
        glassesUpdated = true;
    } else if (propertyName==='prism' && this.state.prism) {
        glassesRx.od.prism1 = undefined;
        glassesRx.od.prism1b = undefined;
        glassesRx.od.prism2 = undefined;
        glassesRx.od.prism2b = undefined;
        glassesRx.os.prism1 = undefined;
        glassesRx.os.prism1b = undefined;
        glassesRx.os.prism2 = undefined;
        glassesRx.os.prism2b = undefined;
        glassesUpdated = true;
    }
    this.setState({[propertyName]: !this.state[propertyName]});
    if (glassesUpdated && this.props.onChangeGlassesRx) {
        this.props.onChangeGlassesRx(glassesRx);
    }
  }

  copyOdOs = () : void => {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx.os = {...glassesRx.od};
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  clear = () : void => {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx.os = {};
    glassesRx.od = {};
    glassesRx.lensType = undefined;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
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
            if (this.props.onChangeGlassesRx)
              this.props.onChangeGlassesRx(glassesRx);
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
      if (this.props.onChangeGlassesRx)
        this.props.onChangeGlassesRx(glassesRx);
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
    if (this.props.glassesRx===undefined || this.props.glassesRx.od===undefined || this.props.glassesRx.os===undefined)
      return null;
    return <View style={this.props.style?this.props.style:(this.state.prism&&this.props.hasVA)?styles.boardXL:(this.state.prism||this.props.hasVA)?styles.boardL:styles.boardM}>
      {this.props.title && <Label suffix='' style={this.props.titleStyle} value={this.props.title} fieldId={this.props.fieldId}/>}
      <View style={styles.centeredColumnLayout}>
          {this.props.hasLensType && <View style={styles.formRow}>
            <FormInput value={this.props.glassesRx.lensType} definition={filterFieldDefinition(this.props.definition.fields, "lensType")} readonly={!this.props.editable}
              onChangeValue={(value: ?string) => this.updateGlassesRx(undefined, 'lensType', value)} errorMessage={this.props.glassesRx.lensTypeError}/>
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
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sph', value)} errorMessage={this.props.glassesRx.od.sphError} isTyping={this.state.isTyping} autoFocus={true}/>
            <FormInput value={this.props.glassesRx.od.cyl} definition={getFieldDefinition('visit.prescription.od.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cyl', value)} errorMessage={this.props.glassesRx.od.cylError} isTyping={this.state.isTyping}/>
            <FormInput value={this.props.glassesRx.od.axis} definition={getFieldDefinition('visit.prescription.od.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)} errorMessage={this.props.glassesRx.od.axisError} isTyping={this.state.isTyping}/>
            {this.state.prism && <View style={styles.formElement2}><PrismInput value={this.props.glassesRx.od} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('od', value)}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.od.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('od','va', value)} errorMessage={this.props.glassesRx.od.vaError}/>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.add} definition={getFieldDefinition('visit.prescription.od.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','add', value)} errorMessage={this.props.glassesRx.od.addError} isTyping={this.state.isTyping}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('od','addVa', value)} errorMessage={this.props.glassesRx.od.addVaError}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
            {this.props.editable && <CopyRow onPress={this.copyOdOs}/>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{strings.os}:</Text>
            <FormInput value={this.props.glassesRx.os.sph} definition={getFieldDefinition('visit.prescription.os.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','sph', value)} errorMessage={this.props.glassesRx.os.sphError} isTyping={this.state.isTyping}/>
            <FormInput value={this.props.glassesRx.os.cyl} definition={getFieldDefinition('visit.prescription.os.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','cyl', value)} errorMessage={this.props.glassesRx.os.cylError} isTyping={this.state.isTyping}/>
            <FormInput value={this.props.glassesRx.os.axis} definition={getFieldDefinition('visit.prescription.os.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','axis', value)} errorMessage={this.props.glassesRx.os.axisError} isTyping={this.state.isTyping}/>
            {this.state.prism && <View style={styles.formElement2}><PrismInput value={this.props.glassesRx.os} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('os', value)}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.os.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OS')} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('os','va', value)} errorMessage={this.props.glassesRx.os.vaError}/>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.add} definition={getFieldDefinition('visit.prescription.os.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','add', value)} errorMessage={this.props.glassesRx.os.addError} isTyping={this.state.isTyping}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OS')} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('os','addVa', value)} errorMessage={this.props.glassesRx.os.addVaError}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>
          {(this.props.hasNotes===true || (this.props.definition!==undefined && this.props.definition.hasNotes)) && <View style={styles.formRow}>
            <FormInput value={this.props.glassesRx.notes} definition={getFieldDefinition('visit.prescription.notes')} readonly={!this.props.editable}
              onChangeValue={(value: ?string) => this.updateGlassesRx(undefined, 'notes', value)} errorMessage={this.props.glassesRx.notesError}/>
          </View>}
        {this.props.editable===true && this.props.hasAdd===true && <View style={styles.buttonsRowLayout}>
          <Button title={formatLabel(getFieldDefinition('visit.prescription.od.prism1'))} onPress={() => this.toggle('prism')}/>
          {false && <Button title={formatLabel(getFieldDefinition('visit.prescription.os'))+'='+formatLabel(getFieldDefinition('visit.prescription.od'))} onPress={() => this.copyOsOd()}/>}
          {this.props.onCopy!==undefined && <Button title={strings.copyToFinal} onPress={() => this.props.onCopy(this.props.glassesRx)}/>}
        </View>}
      </View>
      <View style={styles.groupExtraIcons}>
        {this.props.editable && this.props.definition.import && <TouchableOpacity onPress={() => this.importData()}><ImportIcon style={styles.groupIcon}/></TouchableOpacity>}
        {this.props.editable && this.props.definition.export && getConfiguration().machine.phoropter!==undefined && <TouchableOpacity onPress={() => this.exportData()}><ExportIcon style={styles.groupIcon}/></TouchableOpacity>}
      </View>
      <View style={styles.groupIcons}>
          {this.props.editable && <TouchableOpacity onPress={this.props.onClear?this.props.onClear:this.clear}><Garbage style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && this.props.onAdd && <TouchableOpacity onPress={this.props.onAdd}><Plus style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && this.props.onPaste && <TouchableOpacity onPress={() => this.props.onPaste(this.props.glassesRx)}><Copy style={styles.groupIcon}/></TouchableOpacity>}
          {this.props.editable && <TouchableOpacity onPress={this.toggleTyping}><Keyboard style={styles.groupIcon} disabled={this.state.isTyping}/></TouchableOpacity>}
        </View>
    </View>
  }
}

export class ContactsSummary extends Component {
  props: {
    hidden?: boolean
  }
  render() {
    if (this.props.hidden)
      return null;
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.text}>   PWR   BC  DIA  CYL   AXIS ADD</Text>
      <Text style={styles.text}>OD -2.75 8.7 14.0 -2.25 160  +1.75</Text>
      <Text style={styles.text}>OS -2.75 8.7 14.0 -2.25 160  +1.75</Text>
    </View>
  }
}

export class ContactsDetail extends PureComponent {
  props: {
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onCopy?: (glassesRx: GlassesRx) => void,
    hasVA?: boolean,
    titleStyle?: string,
    style?: string,
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void
  }
  state: {
    prism:boolean
  }
  static defaultProps = {
    editable: true,
    titleStyle: styles.sectionTitle
  }

  constructor(props: any) {
    super(props);
    this.state = {
      prism: isPrism(this.props.glassesRx)
    }
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.glassesRx === this.props.glassesRx) return;
    this.setState({
      prism: isPrism(this.props.glassesRx)
    });
  }


  updateGlassesRx(oculus: string, propertyName: string, value: ?number | string) : void {
    if (!this.props.editable) return;
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus][propertyName] = value;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  updatePrism(oculus: string, prism: Prism) : void {
    if (!this.props.editable) return;
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus].prism1 = prism.prism1;
    glassesRx[oculus].prism1b = prism.prism1b;
    glassesRx[oculus].prism2 = prism.prism2;
    glassesRx[oculus].prism2b = prism.prism2b;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  toggle(propertyName: string) : void {
    let glassesUpdated: boolean = false;
    let glassesRx : GlassesRx = this.props.glassesRx;
    if (propertyName==='astigmatism' && this.state.astigmatism) {
        glassesRx.od.cyl = undefined;
        glassesRx.od.axis = undefined;
        glassesRx.os.cyl = undefined;
        glassesRx.os.axis = undefined;
        glassesUpdated = true;
    } else if (propertyName==='multiFocal' && this.state.multiFocal) {
        glassesRx.od.add = undefined;
        glassesRx.os.add = undefined;
        glassesUpdated = true;
    } else if (propertyName==='prism' && this.state.prism) {
        glassesRx.od.prism1 = undefined;
        glassesRx.od.prism1b = undefined;
        glassesRx.od.prism2 = undefined;
        glassesRx.od.prism2b = undefined;
        glassesRx.os.prism1 = undefined;
        glassesRx.os.prism1b = undefined;
        glassesRx.os.prism2 = undefined;
        glassesRx.os.prism2b = undefined;
        glassesUpdated = true;
    }
    this.setState({[propertyName]: !this.state[propertyName]});
    if (glassesUpdated && this.props.onChangeGlassesRx) {
        this.props.onChangeGlassesRx(glassesRx);
    }
  }

//  copyOsOd() : void
//    let glassesRx: GlassesRx = this.props.glassesRx;
//    glassesRx.os = {...glassesRx.od};
//    if (this.props.onChangeGlassesRx)
//      this.props.onChangeGlassesRx(glassesRx);
//  }

  transferFocus = (fieldRef: string) => {
    this.refs[fieldRef].startEditing();
  }

  render() {
    if (!this.props.glassesRx)
      return null;
    return <View style={this.props.style?this.props.style:(this.state.prism&&this.props.hasVA)?styles.boardXL:(this.state.prism||this.props.hasVA)?styles.boardL:styles.boardM}>
      <Text style={this.props.titleStyle}>{this.props.title}</Text>
      <View style={styles.centeredColumnLayout}>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}></Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.sph'))}</Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.cyl'))}</Text>
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.axis'))}</Text>
            {this.state.prism && <Text style={styles.formTableColumnHeaderWide}>{formatLabel(getFieldDefinition('visit.prescription.od.prism1'))}</Text>}
            {this.props.hasVA && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))}</Text>}
            <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.add'))}</Text>
            {this.props.hasVA && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))}</Text>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{formatLabel(getFieldDefinition('visit.prescription.od'))}:</Text>
            <FormInput value={this.props.glassesRx.od.sph} definition={getFieldDefinition('visit.prescription.od.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sph', value)}  ref='od.sph'/>
            <FormInput value={this.props.glassesRx.od.cyl} definition={getFieldDefinition('visit.prescription.od.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cyl', value)} ref='od.cyl'/>
            <FormInput value={this.props.glassesRx.od.axis} definition={getFieldDefinition('visit.prescription.od.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)} ref='od.axis'/>
            {this.state.prism && <View style={styles.formElement2}><PrismInput value={this.props.glassesRx.od} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('od', value)}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.od.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('od','va', value)}/>}
            <FormInput value={this.props.glassesRx.od.add} definition={getFieldDefinition('visit.prescription.od.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','add', value)}/>
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.od.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('od','addVa', value)}/>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{formatLabel(getFieldDefinition('visit.prescription.os'))}:</Text>
            <FormInput value={this.props.glassesRx.os.sph} definition={getFieldDefinition('visit.prescription.os.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','sph', value)}  />
            <FormInput value={this.props.glassesRx.os.cyl} definition={getFieldDefinition('visit.prescription.os.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','cyl', value)}/>
            <FormInput value={this.props.glassesRx.os.axis} definition={getFieldDefinition('visit.prescription.os.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','axis', value)}/>
            {this.state.prism && <View style={styles.formElement2}><PrismInput value={this.props.glassesRx.os} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('os', value)}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.os.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OS')} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('os','va', value)}/>}
            <FormInput value={this.props.glassesRx.os.add} definition={getFieldDefinition('visit.prescription.os.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','add', value)}/>
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.os.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OS')} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('os','addVa', value)}/>}
          </View>
        {this.props.editable && <View style={styles.buttonsRowLayout}>
          <Button title={formatLabel(getFieldDefinition('visit.prescription.od.prism1'))} onPress={() => this.toggle('prism')}/>
          {false && <Button title={formatLabel(getFieldDefinition('visit.prescription.os'))+'='+formatLabel(getFieldDefinition('visit.prescription.od'))} onPress={() => this.copyOsOd()}/>}
          {this.props.onCopy && <Button title={strings.copyToFinal} onPress={() => this.props.onCopy(this.props.glassesRx)}/>}
        </View>}
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
    if (!this.state.refractions) return null;
    return <View style={styles.tabCard}>
     <Text style={styles.cardTitle}>{strings.finalRx}</Text>
      {(!this.state.refractions || this.state.refractions.length===0) &&  <Text style={styles.cardTitle}>{strings.finalRx}</Text>}
      {this.state.refractions.map((refraction: GlassesRx, index: number) =>
         !(refraction.os.sph === "" && refraction.od.sph === "") && <GlassesSummary showHeaders={false} title={formatDate(refraction.prescriptionDate, isToyear(refraction.prescriptionDate)?dateFormat:farDateFormat)} glassesRx={refraction} key={index}/>)}
    </View>
  }
}
