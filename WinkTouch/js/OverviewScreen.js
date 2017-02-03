/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, Text, TextInput, View, Dimensions, Button,  NavigationExperimental, ScrollView} from 'react-native';
import {styles} from './Styles';
import type {Appointment} from './Types';
import {AppointmentsSummary, fetchAppointments} from './Appointment';

class WorkFlow extends Component {
    render() {
        return <ScrollView>
            <View style={styles.store}>
                <View style={styles.room}>
                    <Text style={styles.h3}>Entrance</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Waiting Room</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Cabinet 1</Text>
                    <Text style={styles.h3}>Cabinet 2</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Frame station 1</Text>
                    <Text style={styles.h3}>Frame station 2</Text>
                    <Text style={styles.h3}>Frame station 3</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Contact station 1</Text>
                    <Text style={styles.h3}>Contact station 2</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>In store</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Cash desk</Text>
                </View>
                <View style={styles.room}>
                    <Text style={styles.h3}>Exit</Text>
                </View>
            </View>
        </ScrollView>
    }
}

export class OverviewScreen extends Component {
    props: {
        appointments: Appointment[],
        onNavigationChange: (action: string, data: any) => void,
        onUpdate: (itemType: string, item: any) => void
    }
    constructor(props: any) {
        super(props);
        this.refreshAppointments();
    }

    render() {
        return <View style={styles.page}>
            <AppointmentsSummary appointments={this.props.appointments} onNavigationChange={this.props.onNavigationChange} />
            <WorkFlow />
            <View style={styles.buttonsRowLayout}>
                <View style={[styles.flow]}>
                    <View style={styles.tabCard}><Text style={styles.h3}>Agenda</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Reminders</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Configuration</Text></View>
                    <View style={styles.tabCard}><Text style={styles.h3}>Customisation</Text></View>
                </View>
            </View>
        </View >
    }

    async refreshAppointments() {
        const appointments = await fetchAppointments();
        this.props.onUpdate('Appointments', appointments);
    }
}
