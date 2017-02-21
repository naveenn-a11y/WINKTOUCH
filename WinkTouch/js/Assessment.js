/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import { styles, fontScale } from './Styles';
import {GlassesRx} from './Styles';
import {GlassesSummary} from './Refraction';

export class DiagnoseCard extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Diagnose</Text>
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
    return <View style={styles.tabCard}>
      <GlassesSummary title='Final Rx' glassesRx={this.props.prescription}/>
    </View>
  }
}

export class RecallCard extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Recall</Text>
    </View>
  }
}

export class ReferralCard extends Component {
  render() {
    return <View style={styles.tabCard}>
        <Text style={styles.screenTitle}>Referral</Text>
    </View>
  }
}
