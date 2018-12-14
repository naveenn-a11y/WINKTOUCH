/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Image, ScrollView, TextInput, StyleSheet} from 'react-native';
import type {Exam, GlassesRx, FieldDefinition, ExamDefinition, GroupDefinition } from './Types';
import { styles, fontScale} from './Styles';
import { DiopterField, DegreeField } from './Refraction';
import { CheckButton, DateField, ImageField, NumberField, TilesField } from './Widgets';
import { FormInput } from './Form';
import { formatLabel } from './Items';
import { getCachedItem } from './DataCache';
import { storeExam, getFieldDefinition, getFieldValue, getVisit, getExam } from './Exam';

const textStyle = StyleSheet.create({textStyle: {backgroundColor: 'white', alignSelf: 'center', flex:100, textAlign:'right', fontSize: 21 * fontScale, padding: 5*fontScale, margin: 1*fontScale}}).textStyle;
const multiLineTextStyle = StyleSheet.create({multiLineTextStyle: {alignSelf:'flex-start', flex:100, textAlign:'left', fontSize: 21 * fontScale, marginHorizontal: 5*fontScale}}).multiLineTextStyle;
const smallTextStyle = StyleSheet.create({smallTextStyle: {backgroundColor: 'white', alignSelf: 'center', flex:100, textAlign:'left', fontSize: 18 * fontScale, padding: 0*fontScale, margin: 1*fontScale}}).smallTextStyle;
const checkBoxStyle = StyleSheet.create({checkBoxStyle: {fontSize: 17.8 * fontScale, fontStyle: 'italic', backgroundColor: 'white'}}).checkBoxStyle;

const doyleTextStyle = StyleSheet.create({doyleTextStyle: {backgroundColor: 'white', alignSelf: 'center', flex:100, textAlign:'center', fontWeight:'bold', fontSize: 33 * fontScale, padding: 5*fontScale, margin: 1*fontScale}}).doyleTextStyle;
const doyleCheckBoxStyle = StyleSheet.create({doyleCheckBoxStyle: {fontSize: 35 * fontScale, fontStyle: 'normal', fontWeight:'bold', backgroundColor: 'white'}}).doyleCheckBoxStyle;
const doyleTextStyleBig = StyleSheet.create({doyleTextStyleBig: {fontSize: 40 * fontScale, fontStyle: 'normal', fontWeight:'bold', backgroundColor: 'white'}}).doyleTextStyleBig;
const doyleMultiLineTextStyle = StyleSheet.create({multiLineTextStyle: {flex:100, textAlign:'left', fontSize: 35 * fontScale,  marginHorizontal: 5*fontScale}}).multiLineTextStyle;

export class PaperFormScreen extends Component {
    props: {
      exam: Exam,
      onUpdateExam?: (exam: Exam) => void,
      appointmentStateKey?: string,
      editable?: boolean,
      navigation?: any
    }
    state: {
      isDirty: boolean,
      glassesRx: GlassesRx,
      isRoutineExam: boolean,
      complaints: string,
      goodHealth: boolean,
      visitDate?: Date,
      lines?: string[],
      lines2?: string[],
      color: string
    }

    constructor(props: any) {
      super(props);
      this.state = {
        isDirty: false,
        glassesRx: {
          od: {sphere: 0.25},
          os: {sphere: 0.30}
        },
        isRoutineExam: true,
        goodHealth: false,
        complaints: 'Free text.\nYou can type or speak.',
        va: {
          od: {
            far: 25,
            farRx: undefined,
            near: 45,
            nearRx: undefined
          },
          os: {
            far: 25,
            farRx: undefined,
            near: 45,
            nearRx: undefined
          }
        },
        visitDate: undefined,
        lines: [],
        lines2: [],
        color: 'Bleu'
      }
    }

    async storeExam(exam: Exam) {
      if (!this.props.appointmentStateKey || !this.props.navigation) return;
      try {
        await storeExam(exam, this.props.appointmentStateKey, this.props.navigation);
      } catch (error) {
        alert(error); //TODO
      }
      this.forceUpdate();
    }

    updateFieldValue(fieldIdentifier: string, newValue: any) {
      const fieldSrc : string = fieldIdentifier.substring(0,fieldIdentifier.indexOf('.'));
      if (fieldSrc==='exam') {
        let examIdentifier = fieldIdentifier.substring(5);
        const examName : string = examIdentifier.substring(0,examIdentifier.indexOf('.'));
        const exam : any = getExam(examName, getVisit(this.props.exam));
        const identifiers : string[] = examIdentifier.split('.');
        let value : any = exam;
        for (let i : number = 0; i<identifiers.length; i++) {
          if (i===identifiers.length-1) {
            value[identifiers[i]] = newValue;
          } else {
            let subValue = value[identifiers[i]];
            if (subValue===undefined || subValue===null) {
              subValue = {};
              value[identifiers[i]] = subValue;
            }
            value = subValue;
          }
        }
        this.forceUpdate();
        this.storeExam(exam);
      } else {
        console.error('unsupported paperform field src: '+fieldSrc);
      }
    }

    updateGlassesRx(oculus: string, propertyName: string, value: ?number | string) : void {
      let glassesRx: GlassesRx = this.state.glassesRx;
      glassesRx[oculus][propertyName] = value;
      this.setState({glassesRx});
    }

    renderEyeExamTemplate() {
      return <ScrollView maximumZoomScale={2} minimumZoomScale={.8}>
        <Image source={require('./image/eyeexamtemplate.png')} style={{
          width: 1000 * fontScale,
          resizeMode: 'contain'
        }} />
        <View style={{position: 'absolute', top:131 * fontScale, left: 83 * fontScale, width: 54*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.VA sc.Unaided acuities.DVA.OD', this.props.exam)} definition={getFieldDefinition('exam.VA sc.Unaided acuities.DVA.OD', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.VA sc.Unaided acuities.DVA.OD', value)}  style={smallTextStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 138 * fontScale, width: 54*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.VA cc.Aided acuities.DVA.OD', this.props.exam)} definition={getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.VA cc.Aided acuities.DVA.OD', value)}  style={smallTextStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 195 * fontScale, width: 54*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.VA sc.Unaided acuities.NVA.OD', this.props.exam)} definition={getFieldDefinition('exam.VA sc.Unaided acuities.NVA.OD', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.VA sc.Unaided acuities.NVA.OD', value)}  style={smallTextStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 255 * fontScale, width: 58*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.VA cc.Aided acuities.NVA.OD', this.props.exam)} definition={getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.VA cc.Aided acuities.NVA.OD', value)}  style={smallTextStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 405 * fontScale, width: 70*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.od.sph', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.od.sph', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.od.sph', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 478 * fontScale, width: 70*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.od.cyl', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.od.cyl', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.od.cyl', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 550 * fontScale, width: 64*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.od.axis', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.od.axis', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.od.axis', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 405 * fontScale, width: 70*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.os.sph', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.os.sph', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.os.sph', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 478 * fontScale, width: 70*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.os.cyl', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.os.cyl', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.os.cyl', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 550 * fontScale, width: 64*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <FormInput value={getFieldValue('exam.RxToOrder.Final Rx.os.axis', this.props.exam)} definition={getFieldDefinition('exam.RxToOrder.Final Rx.os.axis', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.RxToOrder.Final Rx.os.axis', value)}  style={textStyle} />
        </View>
        <View style={{position: 'absolute', top:295.5 * fontScale, left: 486 * fontScale}}>

        </View>
        <View style={{position: 'absolute', alignItems:'flex-start', justifyContent:'flex-start', top:310 * fontScale, left: 336 * fontScale, width: 638*fontScale, height: 106*fontScale, backgroundColor: 'transparent'}}>
          <FormInput value={getFieldValue('exam.Reason for visit.Reason for visit.Main Reason', this.props.exam)} definition={getFieldDefinition('exam.Reason for visit.Reason for visit.Main Reason', this.props.exam)} showLabel={false} readonly={this.props.editable!==true}
            onChangeValue={(value: ?number) => this.updateFieldValue('exam.Reason for visit.Reason for visit.Main Reason', value)}  style={multiLineTextStyle} multiline={true} />
        </View>
        <View style={{position: 'absolute', top:420 * fontScale, left: 510 * fontScale}}>
          <CheckButton prefix='( ' suffix=' Good)' isChecked={this.state.goodHealth}
            onSelect={() => this.setState({goodHealth: true})}
            onDeselect={() => this.setState({goodHealth: false})}
            style={checkBoxStyle} />
        </View>
        <View style={{position: 'absolute', top:14 * fontScale, left: 848 * fontScale, width: 130*fontScale, height: 27*fontScale, justifyContent:'center'}}>
          <DateField label='Visit date' value={this.state.visitDate} style={smallTextStyle} onChangeValue={(date: ?Date) => this.setState({visitDate: date})} />
        </View>
        <View style={{position: 'absolute', top:770 * fontScale, left: 336 * fontScale, width: 300*fontScale, height: 200*fontScale}}>
          <ImageField value={this.state.lines} image={'./image/perimetry.png'} style={{backgroundColor: 'black'}} onChangeValue={(lines: string[]) => this.setState({lines})}/>
        </View>
      </ScrollView>
    }

    render() {
      if (this.props.exam.definition.image === './image/eyeexamtemplate.png')
         return this.renderEyeExamTemplate();
      return null;
    }
}
