/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { styles, fontScale } from './Styles';
import { RulerField, TilesField, WinkButton } from './Widgets';
import type { RefractionExam } from './Exam';
import { Anesthetics } from './EntranceTest';

export type GlassRx = {
  sphere: number,
  cylinder?: number,
  axis?: number,
  base?: string,
  prism?: number,
  add?: number
}

export type GlassesRx = {
  id: number,
  od: GlassRx,
  os: GlassRx
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
    onChangeValue: (newvalue: number) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  static defaultProps = {
    visible: true
  }
  render() {
    if (!this.props.visible) return null;
    return <RulerField range={[-20,-10,-7,-5,-4,-3,-2,-1,0,1,2,3,4,5,7,10,20]} stepSize={.25} decimals={2}
      value={this.props.value}
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
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void,
    onEnableScroll?: (enableScroll: boolean) => void
  }
  state: {
    astigmatism: boolean,
    multiFocal: boolean,
    prism:boolean,
  }
  constructor(props: any) {
    super(props);
    this.state = {
      astigmatism: isAstigmatic(this.props.glassesRx),
      multiFocal: isMultiFocal(this.props.glassesRx),
      prism: isPrism(this.props.glassesRx)
    }
  }

  updateGlassesRx(oculus: string, propertyName: string, value: number | string) : void {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus][propertyName] = value;
    if (this.props.onChangeGlassesRx)
      this.props.onChangeGlassesRx(glassesRx);
  }

  toggle(propertyName: string) : void {
    this.setState({[propertyName]: !this.state[propertyName]});
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
            <DiopterScrollField value={this.props.glassesRx.od.sphere}
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
        {this.props.onChangeGlassesRx?<View style={styles.buttonsRowLayout}>
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
    onChangeExam: (exam: RefractionExam) => void
  }

  updateExam(propertyName: string, value: GlassesRx) {
    let exam: RefractionExam = this.props.exam;
    exam[propertyName] = value;
    this.props.onChangeExam(exam);
  }

  render() {
    return <View>
      <View style={styles.flow}>
        <GlassesDetail title='Previous Rx' glassesRx={this.props.exam.refractions.previousRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('previousRx',glassesRx)}/>
        <GlassesDetail title='Wearing glasses Refraction' glassesRx={this.props.exam.refractions.wearingRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('wearingRx',glassesRx)}/>
      </View>
    </View>
  }
}

export class RefractionScreen extends Component {
  props: {
    exam: RefractionExam,
    onChangeExam: (exam: RefractionExam) => void
  }
  state: {
    scrollEnabled: boolean
  }
  constructor(props: any) {
    super(props);
    this.state = {
      scrollEnabled: true
    }
  }

  updateExam(propertyName: string, value: GlassesRx) {
    let exam: RefractionExam = this.props.exam;
    exam[propertyName] = value;
    this.props.onChangeExam(exam);
  }

  enableScroll = (scrollEnable: boolean) => {
      if (scrollEnable!==this.state.scrollEnabled)
        this.setState({scrollEnabled: scrollEnable});
  }

  render() {
    return <ScrollView scrollEnabled={this.state.scrollEnabled}>
      <View style={styles.flow}>
        <GlassesDetail title='Previous Rx' glassesRx={this.props.exam.refractions.previousRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('previousRx',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Wearing glasses Refraction' glassesRx={this.props.exam.refractions.wearingRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('wearingRx',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Phoropter' glassesRx={this.props.exam.refractions.phoropter} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('phoropter',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Auto-refractor'glassesRx={this.props.exam.refractions.autoRefractor} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('autoRefractor',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Retinoscope' glassesRx={this.props.exam.refractions.retinoscope} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('retinoscope',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Cyclopegic' glassesRx={this.props.exam.refractions.cyclopegic} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('cyclopegic',glassesRx)} onEnableScroll={this.enableScroll}/>
        <GlassesDetail title='Final Rx' glassesRx={this.props.exam.refractions.finalRx} onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateExam('finalRx',glassesRx)} onEnableScroll={this.enableScroll}/>
      </View>
    </ScrollView>
  }
}
