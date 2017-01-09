/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Button, Image, LayoutAnimation, InteractionManager } from 'react-native';
import { strings } from './Strings';
import { styles, fontScale } from './Styles';
import { Clock } from './Widgets';
import type {Appointment } from './Appointment';

export class Notifications extends Component {
    render() {
        return <View>
            <Clock />
            <View style={styles.centeredRowLayout} >
                <Image source={require('./image/service.png')} style={{
                    width: 60 * fontScale,
                    height: 60 * fontScale,
                    resizeMode: 'contain',
                }} />
                <Image source={require('./image/nophone.png')} style={{
                    width: 60 * fontScale,
                    height: 60 * fontScale,
                    resizeMode: 'contain',
                }} />
            </View>
        </View>
    }
}

export class MenuBar extends Component {
    props: {
        hidden: boolean,
        backable: boolean,
        appointment?: Appointment,
        onNavigationChange: (action: string, data: any) => void
    }
    /**
    state: {
        visible: boolean;
    }
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false
        }
    }

    componentWillReceiveProps(nextProps: any) {
        if (nextProps.hidden) {
            InteractionManager.runAfterInteractions(() => {
                LayoutAnimation.easeInEaseOut();
                this.setState({ visible: false });
            });
        } else {
            this.setState({ visible: true });
        }
    }
    */
    render() {
        /**
        if (!this.state.visible) {
            return null;
        }
        */
        return <View style={styles.sideMenu}>
            <View style={styles.tab}>
                <Button title={strings.today} style={styles.button} onPress={() => this.props.onNavigationChange('showToday')} />
            </View>
            <View style={styles.tab}>
                <Button title={strings.patients} style={styles.button} onPress={() => this.props.onNavigationChange('findPatient')} />
            </View>
            <View style={styles.tab}>
                <Button title='Crash me' style={styles.button} onPress={() => console.error('proficiat')} />
            </View>
            {(this.props.backable)?<View style={styles.roundTab}>
                <Button title={strings.back} style={styles.button} onPress={() => this.props.onNavigationChange('back')} />
            </View>:null}
            <View style={{ flex: 5 }}></View>
            <Clock hidden={this.props.appointment === undefined} />
            <Clock hidden={this.props.appointment === undefined} />
            <Notifications />
        </View>
    }
}
