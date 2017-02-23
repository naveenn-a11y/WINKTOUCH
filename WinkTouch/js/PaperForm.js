/**
 * @flow
 */
'use strict';


import type {Exam, GlassesRx } from './Types';
import React, { Component } from 'react';
import { View, Text, Image, ScrollView, TextInput} from 'react-native';
import { styles, fontScale} from './Styles';
import { DiopterField } from './Refraction';

export class PaperFormScreen extends Component {
    props: {
    }
    state: {
      glassesRx: GlassesRx,
      complaints: string
    }
    constructor(props: any) {
      super(props);
      this.state = {
        glassesRx: {
          od: {sphere: 0.25},
          os: {sphere: 0.5}
        },
        complaints: 'Pijn aan mijn goesting'
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
        <View style={{position: 'absolute', top:129 * fontScale, left: 402 * fontScale, width: 79*fontScale, height: 56*fontScale, justifyContent:'center'}}>
          <DiopterField label={'OD Sphere'} value={this.state.glassesRx.od.sphere} onChangeValue={(value: ?number) => this.updateGlassesRx('od','sphere', value)} />
        </View>
        <View style={{position: 'absolute', top:129 * fontScale, left: 474.5 * fontScale, width: 79*fontScale, height: 56*fontScale}}>
          <DiopterField label={'OD Cylinder'} value={this.state.glassesRx.od.cylinder} onChangeValue={(value: ?number) => this.updateGlassesRx('od','cylinder', value)} />
        </View>
        <View style={{position: 'absolute', top:178.5 * fontScale, left: 402 * fontScale, width: 79*fontScale, height: 56*fontScale}}>
          <DiopterField label={'OS Sphere'} value={this.state.glassesRx.os.sphere} onChangeValue={(value: ?number) => this.updateGlassesRx('os','sphere', value)} />
        </View>
        <View style={{position: 'absolute', top:178.5 * fontScale, left: 474.5 * fontScale, width: 79*fontScale, height: 56*fontScale}}>
          <DiopterField label={'OS Cylinder'} value={this.state.glassesRx.os.cylinder} onChangeValue={(value: ?number) => this.updateGlassesRx('os','cylinder', value)} />
        </View>
        <View style={{position: 'absolute', top:312.5 * fontScale, left: 336 * fontScale, width: 638*fontScale, height: 106*fontScale, backgroundColor: 'transparent'}}>
          <TextInput multiline={true} value={this.state.complaints} onChangeText={(text: string) => this.setState({complaints: text})} style={{borderWidth: 0*fontScale, borderColor: 'red', flex:100, textAlign:'left', fontSize: 22 * fontScale, marginHorizontal: 5*fontScale}} />
        </View>
      </ScrollView>
    }
}
