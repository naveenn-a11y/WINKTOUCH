/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { styles, fontScale } from './Styles';
import type {GlassesRx, RefractionExam, Refractions, Patient, Exam} from './Types';
import { RulerField, TilesField, WinkButton } from './Widgets';
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
      scrollMethod='quadratic'
      onChangeValue={(newValue: number) => this.setState({ value: newValue })} />
  }
}

export class DiopterScrollField extends Component {
  props: {
    value: number,
    visible?: boolean,
    editable?: boolean,
    onChangeValue: (newvalue: number) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  static defaultProps = {
    visible: true,
    editable: true,
  }
  render() {
    if (!this.props.visible) return null;
    return <RulerField range={[-20,-10,-7,-5,-4,-3,-2,-1,0,1,2,3,4,5,7,10,20]} stepSize={.25} decimals={2}
      value={this.props.value}
      editable = {this.props.editable}
      onChangeValue={this.props.onChangeValue}
      onEnableScroll = {this.props.onEnableScroll}
    />
  }
}

export class BaseScrollField extends Component {
  props: {
    value: string,
    visible?: boolean,
    onChangeValue: (newvalue: string) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <TilesField options={['Up','Down','In','Out']}
      value={this.props.value}
      onChangeValue={this.props.onChangeValue}
      onEnableScroll = {this.props.onEnableScroll}
    />
  }
}

export class DegreeScrollField extends Component {
  props: {
    value: number,
    visible?: boolean,
    onChangeValue: (newvalue: number) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <RulerField range={[0,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180]} stepSize={1} decimals={0}
      value={this.props.value}
      onChangeValue={this.props.onChangeValue}
      onEnableScroll = {this.props.onEnableScroll}
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
    visible?: boolean
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible)
      return null;
    return <View style={styles.centeredColumnLayout}>
      <Text style={styles.text}>   Sphere  Cyl  Axis   Add  Prism</Text>
      <Text style={styles.text}>OD    -2.5    DS  173  +.50  1/2 BU</Text>
      <Text style={styles.text}>OS    -2.5    DS  173  +.50             </Text>
    </View>
  }
}

export class GlassesDetail extends Component {
  props: {
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  state: {
    astigmatism: boolean,
    multiFocal: boolean,
    prism:boolean,
  }
  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    this.state = {
      astigmatism: isAstigmatic(this.props.glassesRx),
      multiFocal: isMultiFocal(this.props.glassesRx),
      prism: isPrism(this.props.glassesRx)
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      astigmatism: isAstigmatic(nextProps.glassesRx),
      multiFocal: isMultiFocal(nextProps.glassesRx),
      prism: isPrism(nextProps.glassesRx)
    });
  }

  updateGlassesRx(oculus: string, propertyName: string, value: number | string) : void {
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
            {this.state.astigmatism?<Text style={styles.formTableColumnHeader}>Cyl</Text>:null}
            {this.state.astigmatism?<Text style={styles.formTableColumnHeader}>Axis</Text>:null}
            {this.state.prism?<Text style={styles.formTableColumnHeader}>Base</Text>:null}
            {this.state.prism?<Text style={styles.formTableColumnHeader}>Prism</Text>:null}
            {this.state.multiFocal?<Text style={styles.formTableColumnHeader}>Add</Text>:null}
          </View >
          <View style={styles.formRow500}>
            <Text style={styles.formTableRowHeader}>OD</Text>
            <DiopterScrollField value={this.props.glassesRx.od.sphere} editable={this.props.editable}
              onChangeValue={(value: number) => this.updateGlassesRx('od','sphere', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.astigmatism} value={this.props.glassesRx.od.cylinder}
              onChangeValue={(value: number) => this.updateGlassesRx('od','cylinder', value)}onEnableScroll={this.props.onEnableScroll} />
            <DegreeScrollField visible={this.state.astigmatism} value={this.props.glassesRx.od.axis}
              onChangeValue={(value: number) => this.updateGlassesRx('od','axis', value)} onEnableScroll={this.props.onEnableScroll} />
            <BaseScrollField visible={this.state.prism} value={this.props.glassesRx.od.base}
              onChangeValue={(value: string) => this.updateGlassesRx('od','base', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.prism} value={this.props.glassesRx.od.prism}
              onChangeValue={(value: number) => this.updateGlassesRx('od','prism', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.multiFocal} value={this.props.glassesRx.od.add}
              onChangeValue={(value: number) => this.updateGlassesRx('od','add', value)} onEnableScroll={this.props.onEnableScroll} />
          </View >
          <View style={styles.formRow500}>
            <Text style={styles.formTableRowHeader}>OS</Text>
            <DiopterScrollField value={this.props.glassesRx.os.sphere}
              onChangeValue={(value: number) => this.updateGlassesRx('os','sphere', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.astigmatism} value={this.props.glassesRx.os.cylinder}
              onChangeValue={(value: number) => this.updateGlassesRx('os','cylinder', value)} onEnableScroll={this.props.onEnableScroll} />
            <DegreeScrollField visible={this.state.astigmatism} value={this.props.glassesRx.os.axis}
              onChangeValue={(value: number) => this.updateGlassesRx('os','axis', value)} onEnableScroll={this.props.onEnableScroll} />
            <BaseScrollField visible={this.state.prism} value={this.props.glassesRx.os.base}
              onChangeValue={(value: string) => this.updateGlassesRx('os','base', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.prism} value={this.props.glassesRx.os.prism}
              onChangeValue={(value: number) => this.updateGlassesRx('os','prism', value)} onEnableScroll={this.props.onEnableScroll} />
            <DiopterScrollField visible={this.state.multiFocal} value={this.props.glassesRx.os.add}
              onChangeValue={(value: number) => this.updateGlassesRx('os','add', value)} onEnableScroll={this.props.onEnableScroll} />
          </View >
        </View>
        {this.props.editable?<View style={styles.buttonsRowLayout}>
          <WinkButton title='Astigmatism' onPress={() => this.toggle('astigmatism')}/>
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
  state: {
    scrollEnabled: boolean
  }
  constructor(props: any) {
    super(props);
    this.state = {
      scrollEnabled: true
    }
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
  
  enableScroll = (scrollEnable: boolean) => {
      if (scrollEnable!==this.state.scrollEnabled)
        this.setState({scrollEnabled: scrollEnable});
  }

  render() {
    return <ScrollView scrollEnabled={this.state.scrollEnabled}>
      <View style={styles.flow}>
        <GlassesDetail title='Previous Rx' glassesRx={this.props.exam.refractions.previousRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('previousRx',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Wearing glasses Refraction' glassesRx={this.props.exam.refractions.wearingRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('wearingRx',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Phoropter' glassesRx={this.props.exam.refractions.phoropter} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('phoropter',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Auto-refractor'glassesRx={this.props.exam.refractions.autoRefractor} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('autoRefractor',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Retinoscope' glassesRx={this.props.exam.refractions.retinoscope} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('retinoscope',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Cyclopegic' glassesRx={this.props.exam.refractions.cyclopegic} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('cyclopegic',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Final Rx' glassesRx={this.props.exam.refractions.finalRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction('finalRx',glassesRx)} onEnableScroll={this.enableScroll}/>
      </View>
    </ScrollView>
  }
}
