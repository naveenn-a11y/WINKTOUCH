/**
 * @flow
 */
'use strict';


import type {Exam, GlassesRx } from './Types';
import React, { Component } from 'react';
import { View, Text, Image, ScrollView, TextInput, StyleSheet} from 'react-native';
import { styles, fontScale} from './Styles';
import { DiopterField, DegreeField } from './Refraction';
import { VA } from './VisualAcuityTest';
import { CheckButton } from './Widgets';

const textStyle = StyleSheet.create({fieldStyle: {backgroundColor: 'white', alignSelf: 'center', flex:100, textAlign:'right', fontSize: 21 * fontScale, padding: 5*fontScale, margin: 1*fontScale}}).fieldStyle;
const multiLineTextStyle = StyleSheet.create({fieldStyle: {flex:100, textAlign:'left', fontSize: 21 * fontScale,  marginHorizontal: 5*fontScale}}).fieldStyle;
const smallTextStyle = StyleSheet.create({fieldStyle: {backgroundColor: 'white', alignSelf: 'center', flex:100, textAlign:'left', fontSize: 18 * fontScale, padding: 0*fontScale, margin: 1*fontScale}}).fieldStyle;

export class PaperFormScreen extends Component {
    props: {
    }
    state: {
      glassesRx: GlassesRx,
      isRoutineExam: boolean,
      complaints: string,
      goodHealth: boolean,
      va: any
    }
    constructor(props: any) {
      super(props);
      this.state = {
        glassesRx: {
          od: {sphere: 0.25},
          os: {sphere: 0.5}
        },
        isRoutineExam: true,
        goodHealth: false,
        complaints: 'Left eye twitching.\nIt hurts everywhere.',
        va: {
          od: {
            far: 25,
            farRx: undefined,
            near: 45,
            nearRx: undefined
          }
        }
      }
    }

    updateGlassesRx(oculus: string, propertyName: string, value: ?number | string) : void {
      let glassesRx: GlassesRx = this.state.glassesRx;
      glassesRx[oculus][propertyName] = value;
      this.setState({glassesRx});
    }

    render() {
      return <ScrollView maximumZoomScale={2}>
        <Image source={require('./image/eyeexamtemplate.png')} style={{
          width: 1000 * fontScale,
          resizeMode: 'contain'
        }} />
        <View style={{position: 'absolute', top:131 * fontScale, left: 83 * fontScale, width: 54*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <VA style={smallTextStyle} label={'OD Far (no Rx)'} value={this.state.va.od.far}/>
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 138 * fontScale, width: 56*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <VA style={smallTextStyle} label={'OD Far (w/ Rx)'} value={this.state.va.od.farRx}/>
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 195 * fontScale, width: 59*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <VA style={smallTextStyle} label={'OD Near (no Rx)'} value={this.state.va.od.near}/>
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 255 * fontScale, width: 59*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <VA style={smallTextStyle} label={'OD Near (w/ Rx)'} value={this.state.va.od.nearRx}/>
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 405 * fontScale, width: 71*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DiopterField style={textStyle} label={'OD Sphere'} value={this.state.glassesRx.od.sphere} onChangeValue={(value: ?number) => this.updateGlassesRx('od','sphere', value)} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 478 * fontScale, width: 71*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DiopterField style={textStyle} label={'OD Cylinder'} value={this.state.glassesRx.od.cylinder} onChangeValue={(value: ?number) => this.updateGlassesRx('od','cylinder', value)} />
        </View>
        <View style={{position: 'absolute', top:131 * fontScale, left: 550 * fontScale, width: 64*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DegreeField style={textStyle} label={'OD Axis'} value={this.state.glassesRx.od.axis} onChangeValue={(value: ?number) => this.updateGlassesRx('od','axis', value)} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 405 * fontScale, width: 71*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DiopterField style={textStyle} label={'OS Sphere'} value={this.state.glassesRx.os.sphere} onChangeValue={(value: ?number) => this.updateGlassesRx('os','sphere', value)} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 478 * fontScale, width: 71*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DiopterField style={textStyle} label={'OS Cylinder'} value={this.state.glassesRx.os.cylinder} onChangeValue={(value: ?number) => this.updateGlassesRx('os','cylinder', value)} />
        </View>
        <View style={{position: 'absolute', top:182 * fontScale, left: 550 * fontScale, width: 64*fontScale, height: 50*fontScale, justifyContent:'center'}}>
          <DegreeField style={textStyle} label={'OS Axis'} value={this.state.glassesRx.os.axis} onChangeValue={(value: ?number) => this.updateGlassesRx('os','axis', value)} />
        </View>
        <View style={{position: 'absolute', top:295.5 * fontScale, left: 486 * fontScale}}>
          <CheckButton prefix='( ' postfix=' Routine exam)' isChecked={this.state.isRoutineExam}
            onSelect={() => this.setState({isRoutineExam: true})}
            onDeselect={() => this.setState({isRoutineExam: false})}
            style={{fontSize: 17.8 * fontScale, fontStyle: 'italic', backgroundColor: 'white'}} />
        </View>
        <View style={{position: 'absolute', top:310 * fontScale, left: 336 * fontScale, width: 638*fontScale, height: 106*fontScale, backgroundColor: 'transparent'}}>
          <TextInput multiline={true} style={multiLineTextStyle} value={this.state.complaints} onChangeText={(text: string) => this.setState({complaints: text})} />
        </View>
        <View style={{position: 'absolute', top:420 * fontScale, left: 510 * fontScale}}>
          <CheckButton prefix='( ' postfix=' Good)' isChecked={this.state.goodHealth}
            onSelect={() => this.setState({goodHealth: true})}
            onDeselect={() => this.setState({goodHealth: false})}
            style={{fontSize: 17.8 * fontScale, fontStyle: 'italic', backgroundColor: 'white'}} />
        </View>

      </ScrollView>
    }
}
