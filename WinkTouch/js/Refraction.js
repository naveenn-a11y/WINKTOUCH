/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { styles, fontScale } from './Styles';
import type {GlassesRx, RefractionExam, Refractions, Patient, Exam} from './Types';
import { NumberField, TilesField, WinkButton } from './Widgets';
import { Anesthetics } from './EntranceTest';

export async function fetchRefractions(patient: Patient, visitId: number) : Refractions {
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/EyeExam?accountsId='+patient.accountsId+'&patientId='+patient.patientId, {
        method: 'get',
    });
    let refractions : Refractions = {
      previousRx: {
        od: {sphere: 0.5},
        os: {sphere: 0.25, add: 0.75}
      },
      wearingRx: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      },
      phoropter: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      },
      autoRefractor: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      },
      retinoscope: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      },
      cyclopegic: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      },
      finalRx: {
        od: {sphere: 0.25},
        os: {sphere: 0.25, add: 0.75}
      }
    };
    let json = await response.json();
    const types = ['previousRx','wearingRx'];
    const eyeExams : [] = json.eyeExams;
    for (let i=0; i<eyeExams.length && i<types.length; i++) {
        const eyeExam = eyeExams[i];
        const glassesRx : GlassesRx = {
          eyeExam: {...eyeExam},
          id: eyeExam.eyeExamId,
          version: eyeExam.version,
          od: {
            sphere: eyeExam.OD.sph,
            cylinder: eyeExam.OD.cyl,
            axis: eyeExam.OD.axis,
            base: undefined,
            prism: eyeExam.OD.prism1,
            add: eyeExam.OD.add
          },
          os: {
            sphere: eyeExam.OS.sph,
            cylinder: eyeExam.OS.cyl,
            axis: eyeExam.OS.axis,
            base: undefined,
            prism: eyeExam.OS.prism1,
            add: eyeExam.OS.add
          },
        }
        refractions[types[i]]=glassesRx;
    }
    return refractions;
  } catch (error) {
    alert(error);
    console.log(error);
    alert('Something went wrong fetching the refractions from the server. You can try again.');
  }
}

export async function storeRefraction(patient: Patient, glassesRx: GlassesRx) : GlassesRx {
  if (!glassesRx) return undefined;
  let eyeExam = glassesRx.eyeExam;
  eyeExam.OD.sph = glassesRx.od.sphere;
  eyeExam.OS.sph = glassesRx.os.sphere;
  try {
    let response = await fetch('https://dev1.downloadwink.com/Wink/EyeExam/update', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eyeExam)
    });
    //const restResponse : RestResponse = await response.json();
    return glassesRx;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the patient information on the server. Please try again.');
    //TODO: signal error to the waiting thread so it can clean up ?
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
  if (glassesRx.od && glassesRx.od.prism!=undefined && glassesRx.od.prism!=null && glassesRx.od.prism!=0.0)
    return true;
  if (glassesRx.os && glassesRx.os.prism!=undefined && glassesRx.os.prism!=null && glassesRx.os.prism!=0.0)
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
    onChangeValue: (newvalue: ?number) => void,
  }
  static defaultProps = {
    visible: true,
    editable: true
  }
  render() {
    if (!this.props.visible) return null;
    return <NumberField range={[-20,20]} stepSize={.25} decimals={2}
      value={this.props.value}
      label={this.props.label}
      editable = {this.props.editable}
      onChangeValue={this.props.onChangeValue}
    />
  }
}

export class BaseField extends Component {
  props: {
    value: string,
    label: string,
    visible?: boolean,
    editable?: boolean,
    onChangeValue: (newvalue: string) => void
  }
  static defaultProps = {
    visible: true,
    editable: true
  }
  render() {
    if (!this.props.visible) return null;
    return <TilesField options={['Up','Down','In','Out']}
      value={this.props.value}
      editable={this.props.editable}
      label={this.props.label}
      onChangeValue={this.props.onChangeValue}
    />
  }
}

export class DegreeField extends Component {
  props: {
    value: number,
    label: string,
    visible?: boolean,
    editable?: boolean,
    onChangeValue: (newvalue: ?number) => void,
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <NumberField range={[0,180]} stepSize={1} groupSize={10} decimals={0}
      value={this.props.value} label={this.props.label}
      editable = {this.props.editable}
      onChangeValue={this.props.onChangeValue}
    />
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

export class GlassesSummary extends Component {
  props: {
    glassesRx: GlassesRx,
    title?: string,
    visible?: boolean,
    showHeaders?: boolean
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible)
      return null;
    if (!this.props.glassesRx)
      return <View style={styles.centeredColumnLayout}>
          <Text style={styles.cardTitle}>{this.props.title}</Text>
        </View>
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.cardTitle}>{this.props.title}</Text>
      <View style={styles.centeredRowLayout}>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}></Text>:null}
          <Text>OD:</Text>
          <Text>OS:</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Sphere</Text>:null}
          <Text> {this.props.glassesRx.od.sphere}</Text>
          <Text> {this.props.glassesRx.os.sphere}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Cyl</Text>:null}
          <Text> {this.props.glassesRx.od.cylinder}</Text>
          <Text> {this.props.glassesRx.os.cylinder}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Axis</Text>:null}
          <Text> {this.props.glassesRx.od.axis}</Text>
          <Text> {this.props.glassesRx.os.axis}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Add</Text>:null}
          <Text> {this.props.glassesRx.od.add}</Text>
          <Text> {this.props.glassesRx.os.add}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Base</Text>:null}
          <Text> {this.props.glassesRx.od.base}</Text>
          <Text> {this.props.glassesRx.os.base}</Text>
        </View>
        <View style={styles.cardColumn}>
          {this.props.showHeaders?<Text style={styles.text}>Prism</Text>:null}
          <Text> {this.props.glassesRx.od.prism}</Text>
          <Text> {this.props.glassesRx.os.prism}</Text>
        </View>
    </View>
    </View>
  }
}

export class GlassesDetail extends Component {
  props: {
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void
  }
  state: {
    multiFocal: boolean,
    prism:boolean,
  }
  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    this.state = {
      multiFocal: isMultiFocal(this.props.glassesRx),
      prism: isPrism(this.props.glassesRx)
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      multiFocal: isMultiFocal(nextProps.glassesRx),
      prism: isPrism(nextProps.glassesRx)
    });
  }

  updateGlassesRx(oculus: string, propertyName: string, value: ?number | string) : void {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus][propertyName] = value;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  toggle(propertyName: string) : void {
    let glassesUpdated: boolean = false;
    let glassesRx : GlassesRx = this.props.glassesRx;
    if (propertyName==='astigmatism' && this.state.astigmatism) {
        glassesRx.od.cylinder = undefined;
        glassesRx.od.axis = undefined;
        glassesRx.os.cylinder = undefined;
        glassesRx.os.axis = undefined;
        glassesUpdated = true;
    } else if (propertyName==='multiFocal' && this.state.multiFocal) {
        glassesRx.od.add = undefined;
        glassesRx.os.add = undefined;
        glassesUpdated = true;
    } else if (propertyName==='prism' && this.state.prism) {
        glassesRx.od.prism = undefined;
        glassesRx.od.base = undefined;
        glassesRx.os.prism = undefined;
        glassesRx.os.base = undefined;
        glassesUpdated = true;
    }
    this.setState({[propertyName]: !this.state[propertyName]});
    if (glassesUpdated && this.props.onChangeGlassesRx) {
        this.props.onChangeGlassesRx(glassesRx);
    }
  }

  copyOsOd() : void {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx.os = {...glassesRx.od};
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  render() {
    if (!this.props.glassesRx)
      return null;
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>{this.props.title}</Text>
      <View style={styles.centeredColumnLayout}>
        <View>
          <View style={styles.formRow500}>
            <Text style={styles.formTableRowHeader}></Text>
            <Text style={styles.formTableColumnHeader}>Sph</Text>
            <Text style={styles.formTableColumnHeader}>Cyl</Text>
            <Text style={styles.formTableColumnHeader}>Axis</Text>
            {this.state.prism?<Text style={styles.formTableColumnHeader}>Base</Text>:null}
            {this.state.prism?<Text style={styles.formTableColumnHeader}>Prism</Text>:null}
            {this.state.multiFocal?<Text style={styles.formTableColumnHeader}>Add</Text>:null}
          </View >
          <View style={styles.formRow500}>
            <Text style={styles.formTableRowHeader}>OD</Text>
            <DiopterField value={this.props.glassesRx.od.sphere} label={'OD Sphere'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','sphere', value)} />
            <DiopterField value={this.props.glassesRx.od.cylinder} label={'OD Cylinder'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','cylinder', value)} />
            <DegreeField value={this.props.glassesRx.od.axis} label={'OD Axis'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)} />
            <BaseField visible={this.state.prism} value={this.props.glassesRx.od.base} label={'OD Base'}
              onChangeValue={(value: ?string) => this.updateGlassesRx('od','base', value)} />
            <DiopterField visible={this.state.prism} value={this.props.glassesRx.od.prism} label={'OD Prism'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','prism', value)} />
            <DiopterField visible={this.state.multiFocal} value={this.props.glassesRx.od.add} label={'OD Add'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('od','add', value)} />
          </View >
          <View style={styles.formRow500}>
            <Text style={styles.formTableRowHeader}>OS</Text>
            <DiopterField value={this.props.glassesRx.os.sphere} label={'OS Sphere'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','sphere', value)} />
            <DiopterField value={this.props.glassesRx.os.cylinder} label={'OS Cylinder'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','cylinder', value)} />
            <DegreeField value={this.props.glassesRx.os.axis} label={'OS Axis'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','axis', value)} />
            <BaseField visible={this.state.prism} value={this.props.glassesRx.os.base} label={'OS Base'}
              onChangeValue={(value: ?string) => this.updateGlassesRx('os','base', value)} />
            <DiopterField visible={this.state.prism} value={this.props.glassesRx.os.prism} label={'OS Prism'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','prism', value)} />
            <DiopterField visible={this.state.multiFocal} value={this.props.glassesRx.os.add} label={'OS Add'}
              onChangeValue={(value: ?number) => this.updateGlassesRx('os','add', value)} />
          </View >
        </View>
        {this.props.editable?<View style={styles.buttonsRowLayout}>
          <WinkButton title='Multifocal' onPress={() => this.toggle('multiFocal')}/>
          <WinkButton title='Prism' onPress={() => this.toggle('prism')}/>
          <WinkButton title='OS=OD' onPress={() => this.copyOsOd()}/>
        </View>:null}
      </View>
    </View>
  }
}

export class WearingRxScreen extends Component {
  props: {
    exam: RefractionExam,
    onUpdateExam: (Exam: Exam) => void
  }

  constructor(props: any) {
    super(props);
    this.refreshRefractions();
  }

  async refreshRefractions() {
    const exam : RefractionExam = this.props.exam;
    const refractions : Refractions = await fetchRefractions(exam.patient, exam.visitId);
    exam.refractions = refractions;
    this.props.onUpdateExam(exam);
  }

  updateRefraction(refractionType: string, refraction: GlassesRx) {
    let refractions: Refractions = this.props.exam.refractions;
    refractions[refractionType] = refraction;
    storeRefraction(this.props.exam.patient, refraction);
    this.props.onUpdateExam(this.props.exam);
  }

  render() {
    return <View>
      <View style={styles.flow}>
        <GlassesDetail title='Previous Rx' glassesRx={this.props.exam.refractions.previousRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('previousRx',glassesRx)}/>
        <GlassesDetail title='Wearing glasses Refraction' glassesRx={this.props.exam.refractions.wearingRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('wearingRx',glassesRx)}/>
      </View>
    </View>
  }
}

export class RefractionScreen extends Component {
  props: {
    exam: RefractionExam,
    onUpdateExam: (exam: RefractionExam) => void
  }
  constructor(props: any) {
    super(props);
    this.refreshRefractions();
  }

  async refreshRefractions() {
    const exam : RefractionExam = this.props.exam;
    const refractions : Refractions = await fetchRefractions(exam.patient, exam.visitId);
    exam.refractions = refractions;
    this.props.onUpdateExam(exam);
  }

  updateRefraction(refractionType: string, refraction: GlassesRx) {
    let refractions: Refractions = this.props.exam.refractions;
    refractions[refractionType] = refraction;
    storeRefraction(this.props.exam.patient, refraction);
    this.props.onUpdateExam(this.props.exam);
  }

  render() {
    return <ScrollView>
      <View style={styles.flow}>
        <GlassesDetail title='Previous Rx' glassesRx={this.props.exam.refractions.previousRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('previousRx',glassesRx)} />
        <GlassesDetail title='Wearing glasses Refraction' glassesRx={this.props.exam.refractions.wearingRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('wearingRx',glassesRx)} />
        <GlassesDetail title='Phoropter' glassesRx={this.props.exam.refractions.phoropter} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('phoropter',glassesRx)} />
        <GlassesDetail title='Auto-refractor'glassesRx={this.props.exam.refractions.autoRefractor} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('autoRefractor',glassesRx)} />
        <GlassesDetail title='Retinoscope' glassesRx={this.props.exam.refractions.retinoscope} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('retinoscope',glassesRx)} />
        <GlassesDetail title='Cyclopegic' glassesRx={this.props.exam.refractions.cyclopegic} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('cyclopegic',glassesRx)} />
        <GlassesDetail title='Final Rx' glassesRx={this.props.exam.refractions.finalRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('finalRx',glassesRx)} />
      </View>
    </ScrollView>
  }
}
