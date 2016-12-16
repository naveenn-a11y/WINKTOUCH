/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';

export class Assessment extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Assessment</Text>
    </View>
  }
}

export class Prescription extends Component {
  props: {
    patient: Patient
  }
  render() {
    if (!this.props.patient)
      return null;
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Prescription</Text>
    </View>
  }
}

