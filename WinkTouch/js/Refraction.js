/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, Text, Switch, ScrollView, LayoutAnimation, TouchableOpacity } from 'react-native';
import type {GlassesRx, Patient, Exam, GroupDefinition, FieldDefinition, GlassRx, Prism, Visit} from './Types';
import { styles, fontScale } from './Styles';
import { strings} from './Strings';
import { NumberField, TilesField, Button } from './Widgets';
import { Anesthetics } from './EyeTest';
import { formatDegree, formatDiopter, deepClone, isEmpty, formatDate, dateFormat, farDateFormat, isToyear} from './Util';
import { FormInput } from './Form';
import { getFieldDefinition, formatLabel } from './Items';
import { formatCode, formatAllCodes, parseCode } from './Codes';
import { getVisitHistory, fetchVisitHistory } from './Visit';
import { CopyRow, Garbage } from './Favorites';

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

function isPrism(glassesRx: GlassesRx) : boolean {
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

function formatPrism(eyeRx: GlassRx) : string {
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

  componentWillReceiveProps(nextProps: any) {
     this.splittedValue = this.splitValue(nextProps.value);
  }

  splitValue(glassRx: ?GlassRx) : string[] {
    let splittedValue : ?string[] =  [undefined,undefined,undefined,undefined,undefined,undefined];
    if (glassRx===undefined || glassRx===null) return splittedValue;
    splittedValue[0] = isNaN(glassRx.prism1)?undefined:parseInt(glassRx.prism1).toString();
    splittedValue[1] = isNaN(glassRx.prism1)?undefined:Number(glassRx.prism1).toFixed(2);
    splittedValue[1] = isNaN(glassRx.prism1)?undefined:splittedValue[1].substr(splittedValue[1].indexOf('.'));
    splittedValue[2] = isNaN(glassRx.prism1)?undefined:formatCode('prism1b', glassRx.prism1b);
    splittedValue[3] = isNaN(glassRx.prism2)?undefined:parseInt(glassRx.prism2).toString();
    splittedValue[4] = isNaN(glassRx.prism2)?undefined:Number(glassRx.prism2).toFixed(2);
    splittedValue[4] = isNaN(glassRx.prism2)?undefined:splittedValue[4].substr(splittedValue[4].indexOf('.'));
    splittedValue[5] = isNaN(glassRx.prism2)?undefined:formatCode('prism2b', glassRx.prism2b);
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
    if (!this.props.visible) return null;
    return <TilesField style={styles.formField} label={formatLabel(getFieldDefinition('visit.prescription.od.prism1'))} options={this.options}
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
    if (!this.props.visible)
      return null;
    if (isEmpty(this.props.glassesRx))
      return <View style={styles.columnLayout} key={this.props.title}>
          <Text style={this.props.titleStyle}>{this.props.title}</Text>
        </View>
    return <View style={styles.columnLayout} key={this.props.title}>
      {this.props.title && <Text style={this.props.titleStyle}>{this.props.title}</Text>}
      <View style={styles.centeredRowLayout}>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}></Text>:null}
          <Text style={styles.text}>{strings.od}:</Text>
          <Text style={styles.text}>{strings.os}:</Text>
        </View>
        <View style={styles.cardColumn} key='sph'>
          {this.props.showHeaders?<Text style={styles.text}>Sphere</Text>:null}
          <Text style={styles.text} key='od.sph'> {formatDiopter(this.props.glassesRx.od.sph)}</Text>
          <Text style={styles.text} key='os.sph'> {formatDiopter(this.props.glassesRx.os.sph)}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Cyl</Text>:null}
          <Text style={styles.text}> {formatDiopter(this.props.glassesRx.od.cyl)}</Text>
          <Text style={styles.text}> {formatDiopter(this.props.glassesRx.os.cyl)}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Axis</Text>:null}
          <Text style={styles.text}> {formatDegree(this.props.glassesRx.od.axis)}</Text>
          <Text style={styles.text}> {formatDegree(this.props.glassesRx.os.axis)}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Add</Text>:null}
          <Text style={styles.text}> {formatDiopter(this.props.glassesRx.od.add)}</Text>
          <Text style={styles.text}> {formatDiopter(this.props.glassesRx.os.add)}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Prism</Text>:null}
          <Text style={styles.text}> {formatPrism(this.props.glassesRx.od)}</Text>
          <Text style={styles.text}> {formatPrism(this.props.glassesRx.os)}</Text>
        </View>
    </View>
    </View>
  }
}

export class GlassesDetail extends PureComponent {
  props: {
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onCopy?: (glassesRx: GlassesRx) => void,
    hasVA?: boolean,
    hasAdd?: boolean,
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

  componentWillReceiveProps(props: any) {
    this.setState({
      prism: isPrism(props.glassesRx)
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
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

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
            {this.props.hasAdd && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('visit.prescription.od.add'))}</Text>}
            {this.props.hasVA && this.props.hasAdd && <Text style={styles.formTableColumnHeader}>{formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))}</Text>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formTableRowHeader}>{formatLabel(getFieldDefinition('visit.prescription.od'))}:</Text>
            <FormInput value={this.props.glassesRx.od.sph} definition={getFieldDefinition('visit.prescription.od.sph')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sph', value)}  />
            <FormInput value={this.props.glassesRx.od.cyl} definition={getFieldDefinition('visit.prescription.od.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cyl', value)}/>
            <FormInput value={this.props.glassesRx.od.axis} definition={getFieldDefinition('visit.prescription.od.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)}/>
            {this.state.prism && <View style={styles.formElement2}><PrismInput value={this.props.glassesRx.od} visible={this.state.prism} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?Prism) => this.updatePrism('od', value)}/></View>}
            {this.props.hasVA===true && <FormInput value={this.props.glassesRx.od.va} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA'))} showLabel={false} readonly={!this.props.editable}
                  onChangeValue={(value: ?number) => this.updateGlassesRx('od','va', value)}/>}
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.add} definition={getFieldDefinition('visit.prescription.od.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','add', value)}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.od.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD')} label={formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA'))} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('od','addVa', value)}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
            {this.props.editable && <CopyRow onPress={this.copyOdOs}/>}
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
            {this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.add} definition={getFieldDefinition('visit.prescription.os.add')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','add', value)}/>}
            {this.props.hasVA===true && this.props.hasAdd===true && <FormInput value={this.props.glassesRx.os.addVa} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OS')} showLabel={false} readonly={!this.props.editable}
                onChangeValue={(value: ?number) => this.updateGlassesRx('os','addVa', value)}/>}
            {this.props.editable && <View style={styles.formTableColumnHeaderSmall}></View>}
          </View>
        {this.props.editable && this.props.hasAdd && <View style={styles.buttonsRowLayout}>
          <Button title={formatLabel(getFieldDefinition('visit.prescription.od.prism1'))} onPress={() => this.toggle('prism')}/>
          {false && <Button title={formatLabel(getFieldDefinition('visit.prescription.os'))+'='+formatLabel(getFieldDefinition('visit.prescription.od'))} onPress={() => this.copyOsOd()}/>}
          {this.props.onCopy && <Button title={strings.copyToFinal} onPress={() => this.props.onCopy(this.props.glassesRx)}/>}
        </View>}
      </View>
      <View style={styles.groupIcons}>
          {this.props.editable && <TouchableOpacity onPress={this.clear}><Garbage style={styles.groupIcon}/></TouchableOpacity>}
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

  componentWillReceiveProps(props: any) {
    this.setState({
      prism: isPrism(props.glassesRx)
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
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sph', value)}  />
            <FormInput value={this.props.glassesRx.od.cyl} definition={getFieldDefinition('visit.prescription.od.cyl')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cyl', value)}/>
            <FormInput value={this.props.glassesRx.od.axis} definition={getFieldDefinition('visit.prescription.od.axis')} showLabel={false} readonly={!this.props.editable}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)}/>
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

  componentWillReceiveProps(nextProps: any) {
    this.setState({refractions: getRecentRefraction(nextProps.patientInfo.id)}, this.refreshPatientInfo);
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
      {(!this.state.refractions || this.state.refractions.length===0) &&  <Text style={styles.cardTitle}>{strings.finalRx}</Text>}
      {this.state.refractions.map((refraction: GlassesRx, index: number) =>
        <GlassesSummary showHeaders={false} title={strings.refractionTitle + ' '+formatDate(refraction.prescriptionDate, isToyear(refraction.prescriptionDate)?dateFormat:farDateFormat)} glassesRx={refraction} key={index}/>)}
    </View>
  }
}
