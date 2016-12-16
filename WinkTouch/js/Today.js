/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button } from 'react-native';
import Calendar from 'react-native-calendar';
import { styles } from './Styles';

class Agenda extends Component {
    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Agenda of the day for all doctors</Text>
            <Text>show also events that are planned where no doctor is needed</Text>
        </View>
    }
}

class NewApointment extends Component {
    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Book new appointment</Text>
            <Calendar />
        </View>
    }
}

export class Today extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <View>
            <Text style={styles.h1}>Today</Text>
            <Agenda />
            <NewApointment />
        </View>
    }
}
