/**
 * @flow
 */
'use strict';
import React, {Component} from 'react';
import {
    View,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Text,
} from 'react-native';
import { Avatar, Menu } from 'react-native-paper';
import {fontScale, styles} from './Styles';
import {getStore, getDoctor} from './DoctorApp';
import { strings } from './Strings';
import { getDoctorFullName } from './Util';


String.prototype.capitalizedFirstLetter = function(){
    return this.length > 0 ? this.charAt(0).toUpperCase() : '';
};

export class ProfileHeader extends Component {
    render() {
        const store = getStore();
        const doctor = getDoctor();
        
        return (
            <View style={{ padding: 20 * fontScale}}>
                <Text testID={'doctor-name'} style={{color: '#1db3b3', fontWeight: 'bold', marginBottom: 5 * fontScale}}>
                    {`${strings.welcome}, ${getDoctorFullName(doctor)}`}
                </Text>
                <Text testID={'store-details'} style={{color: 'gray'}}>{`${store.name} ${store.city}`}</Text>
            </View>
        );
    };
 }

export const ProfileAvatar = () => {
    const doctor = getDoctor();
    const doctorInitials = `${doctor.firstName.capitalizedFirstLetter()}${doctor.lastName.capitalizedFirstLetter()}`;

    return (
        <View testID={'profile-avatar'}>
            <Avatar.Text 
                style={{backgroundColor: '#fff'}}
                size={100 * fontScale} 
                label={doctorInitials} 
                color='#1db3b3'
                labelStyle={{fontWeight: 'bold'}}
            />
        </View>
    );
 }

 export class ProfileMenu extends Component {

     state: {
        isMenuVisible: boolean,
        store: Store,
        doctor: User,
      };

    constructor(props: any) {
        super(props);
        this.state = {
            isMenuVisible: false,
            store: getStore(),
            doctor: getDoctor(),
        };
    }

    setVisibility = (isVisible: boolean) => {
        this.setState({
            isMenuVisible: isVisible
        });
    }

     renderMenuIcon() {
        return (
          <TouchableOpacity onPress={() => this.setVisibility(!this.props.visible)}>
              <ProfileAvatar />
          </TouchableOpacity>
        );
      }

     render() {
        return (
        <View>
        <Menu
            visible={this.state.isMenuVisible}
            onDismiss={() => this.setVisibility(false)}
            anchor={this.renderMenuIcon()}
            style={{paddingTop: 100 * fontScale, paddingRight: 50 * fontScale}}
        >
            <TouchableWithoutFeedback onPress={() => this.setVisibility(false)}>
            <View style={{ width: 300 * fontScale, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{backgroundColor: '#eee', padding: 20 * fontScale, width: '100%', alignItems: 'center'}}>
                    <ProfileAvatar />
                </View>

                <View style={{justifyContent: 'center', alignItems: 'center', padding: 20 * fontScale}}>
                    <Text testID={'profile-menu-doctorName'} style={{color: '#1db3b3', fontWeight: 'bold', marginBottom: 10 * fontScale}}>
                        {getDoctorFullName(this.state.doctor)}
                    </Text>
                    <Text testID={'profile-menu-storeDetails'} style={{color: 'gray'}}>{`${this.state.store.name} ${this.state.store.city}`}</Text>
                </View>
            </View>
            </TouchableWithoutFeedback>
        </Menu>
        </View>
        );
     }
 }