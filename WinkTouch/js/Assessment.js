/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import {GlassesRx} from './Styles';
import {GlassesDetail} from './Refraction';

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
    editable?: boolean,
    onUpdatePrescription?: (prescription: GlassesRx) => void
  }

  render() {
    if (!this.props.patient)
      return null;
    return <GlassesDetail title='Final Rx' editable={this.props.editable} glassesRx={this.props.prescription} onChangeGlassesRx={this.props.onUpdatePrescription} />
  }
}
