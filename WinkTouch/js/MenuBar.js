/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Image, LayoutAnimation, InteractionManager } from 'react-native';
import { strings } from './Strings';
import { styles, fontScale } from './Styles';
import type {Appointment } from './Types';
import { Button, BackButton, Clock } from './Widgets';
import { recreateDatabase} from './CouchDb';
import { UpcomingAppointments} from './Appointment';

export class Notifications extends Component {
    render() {
        return <View style={{flex: 100, justifyContent: 'flex-end', alignItems: 'flex-start'}}>
          <UpcomingAppointments />
          <Clock />
        </View>
    }
}

export class MenuBar extends Component {
    props: {
        hidden: boolean,
        backable: boolean,
        appointment?: Appointment,
        onNavigationChange: (action: string, data: any) => void,
    }

    render() {
        return <View style={styles.sideMenu}>
          <Button title={strings.today} onPress={() => this.props.onNavigationChange('showToday')} />
          <Button title={strings.patients} onPress={() => this.props.onNavigationChange('findPatient')} />
          <Button title='New Db' onPress={recreateDatabase} />
          <Button title='Crash me' onPress={() => console.error('proficiat')} />
          <BackButton onNavigationChange={this.props.onNavigationChange} />
          <Notifications />
        </View>
    }
}
