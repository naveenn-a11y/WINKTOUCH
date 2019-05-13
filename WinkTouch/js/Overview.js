/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { Image, Text, TextInput, View, Dimensions, ScrollView, InteractionManager} from 'react-native';
import {styles} from './Styles';
import type {Appointment, User} from './Types';
import {AppointmentsSummary, fetchAppointments} from './Appointment';
import {Button} from './Widgets';
import { StartVisitButtons } from './Visit';
import { getStore } from './DoctorApp';
import { now } from './Util';
import { strings } from './Strings';

class MainActivities extends Component {
  props: {
      navigation: any,
      onLogout: () => void
  }

  startWalkinVisit = () => {
    this.props.navigation.navigate('walkin', {nextNavigation: {action: 'appointment', showAppointments: true}});
  }

  openPatientFile = (visitType: string, isPrevisit: boolean) => {
    this.props.navigation.navigate('cabinet');
  }

  render() {

    return <View style={styles.startVisitCard}>
        <View style={styles.flow}>
            <Button title={strings.openFile} onPress={this.openPatientFile} />
            <Button title={strings.walkIn} onPress={this.startWalkinVisit} />
            <Button title={strings.logout} onPress={this.props.onLogout} />
        </View>
    </View>
  }
}

function compareByStart(startableA: {start: string}, startableB: {start: string}) : number {
    if (startableB.start > startableA.start) return -1;
    if (startableB.start < startableA.start) return 1;
    return 0;
}

export class OverviewScreen extends PureComponent {
    props: {
        navigation: any,
        screenProps: {
          doctorId: string,
          storeId: string,
          onLogout: () => void
        }
    }
    state: {
        appointments: Appointment[]
    }
    lastRefresh: number;

    constructor(props: any) {
        super(props);
        this.state = {
          appointments: []
        }
        this.lastRefresh = 0;
    }

    componentDidMount() {
      this.refreshAppointments();
    }

    componentWillReceiveProps(nextProps: any) {
      if ( nextProps.navigation.state.params && nextProps.navigation.state.params.refreshAppointments===true) {
        this.refreshAppointments();
      }
    }

    async refreshAppointments() {
        if (now().getTime()-this.lastRefresh<5*1000) {//Just to be safe and nice
          this.setState(this.state.appointments);
          return;
        }
        this.lastRefresh=now().getTime();
        InteractionManager.runAfterInteractions(() => this.props.navigation.setParams({refreshAppointments: false}));
        const appointments = await fetchAppointments(this.props.screenProps.storeId, this.props.screenProps.doctorId, 1);
        //appointments && appointments.sort(compareByStart);
        this.setState({appointments});
    }

    render() {
        return <View style={styles.page}>
            <AppointmentsSummary appointments={this.state.appointments} navigation={this.props.navigation} onRefreshAppointments={() => this.refreshAppointments()}/>
            <View><MainActivities navigation={this.props.navigation} onLogout={this.props.screenProps.onLogout}/></View>
        </View >
    }
}
