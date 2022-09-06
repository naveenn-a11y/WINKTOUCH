/**
 * @flow
 */

 'use strict';

 import React, {Component} from 'react';
 import {
   Image,
   Text,
   View,
   Linking,
   Alert,
 } from 'react-native';
 import {styles, fontScale, isWeb} from './Styles';
 import {strings} from './Strings';
 import {Button} from './Widgets';
 import DeviceInfo from 'react-native-device-info';
 
 export class AppUpdateScreen extends Component {
   
   constructor(props: any) {
     super(props);
   }
 
   async openAppstore() {
       const url = "itms-apps://apps.apple.com/ca/app/winkemr/id1259308891";
       const supported = await Linking.canOpenURL(url);
       if(supported) {
           await Linking.openURL(url);
       } else {
           Alert.alert(strings.openAppstore);
       }
   }
  
   render() {
    return (
        <View style={styles.centeredScreenLayout}>
          <View
            style={{
              width: '80%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View
                style={{
                  backgroundColor: '#eee',
                  flexDirection: 'row',
                  padding: '8%',
                  borderRadius: 20,
                }}>
                <View style={{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                  <Image
                    source={require('./image/winklogo-big.png')}
                    style={{
                      width: 200 * fontScale,
                      height: 200 * fontScale,
                    }}
                  />
                </View>
                <View style={{width: '5%'}} />
                <View style={{width: '50%'}}>
                  <View style={{marginBottom: 10}}>
                    <Text
                      style={{
                        fontSize: 30 * fontScale,
                        marginBottom: 5,
                        fontWeight: '500',
                      }}>
                      {strings.appUpdateTitle}
                    </Text>
                  </View>
                  <View style={{marginBottom: 10}}>
                      <Text style={{fontSize: 15 * fontScale}}>{strings.appUpdateSubtitle}</Text>
                  </View>
                  <View>
                    <Button
                      onPress={() => this.openAppstore()}
                      title={strings.update}
                      buttonStyle={{width: '100%', justifyContent: 'center', alignItems: 'center', margin: 0}}
                    />
                  </View>
                </View>
              </View>
          </View>
          <View style={{ position: 'absolute', bottom: 30 * fontScale}}>
              <Text>{strings.appVersion}: {DeviceInfo.getVersion()}.{DeviceInfo.getBuildNumber()}</Text>
          </View>
        </View>
    );
  }
 }
 