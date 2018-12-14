/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { Image, View, TouchableHighlight, Text, Button } from 'react-native';
import Calendar from 'react-native-calendar';
import { styles } from './Styles';
import { strings } from './Strings';

class Agenda extends Component {
    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>Agenda of the day for all doctors</Text>
            <Text>WARNING: this screen is not working yet. Please use the Wink PMS calendar for now.</Text>
        </View>
    }
}

class NewApointment extends Component {
    render() {
        return <View style={styles.tabCard}>
            <Text style={styles.screenTitle}>{strings.bookNewAppointment}</Text>
            <Calendar />
        </View>
    }
}

export class TodayScreen extends Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <View>
            <Text style={styles.h1}>{strings.today}</Text>
            <Agenda />
            <NewApointment />
        </View>
    }
}
