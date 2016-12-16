/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';

export class Prescription extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Prescription</Text>
    </View>
  }
}

