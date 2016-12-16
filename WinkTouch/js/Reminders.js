/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {Image, View, TouchableHighlight, Text, Button} from 'react-native';
import {styles, fontScale} from './Styles';

export class Reminders extends Component {
    constructor(props : any) {
        super(props);
    }

    render() {
        return <View>
            <Text style={styles.h1}>Reminders</Text>
            <Button title='swipe back' onPress={() => this.props.onNavigationChange('back')}/>
        </View>
    }
}
