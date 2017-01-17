/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, Button, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import {GlassesDetail} from './Refraction';
import type {GlassesRx} from './Refraction';

export type Assessment = {
  prescription: GlassesRx
}

export class AssessmentCard extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Assessment</Text>
    </View>
  }
}

export class PrescriptionCard extends Component {
  props: {
    prescription: GlassesRx,
    onUpdatePrescription: (prescription: GlassesRx) => void
  }

  render() {
    if (!this.props.patient)
      return null;
    return <GlassesDetail title='Final Rx' glassesRx={this.props.prescription} onChangeGlassesRx={(glassesRx: GlassesRx) => this.props.onUpdatePrescription(glassesRx)} />
  }
}
