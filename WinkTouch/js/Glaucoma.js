/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import { styles, fontScale } from './Styles';
import { PerimetryTest } from './EntranceTest';

class Anesthetics extends Component {
  render() {
    return <View style={styles.tabCard}>
      <Text style={styles.screenTitle}>Anesthetics</Text>
    </View>
  }
}

class Tonometry extends Component {
  render() {
    return <View style={styles.tabCard}>
      <Text style={styles.screenTitle}>Tonometry</Text>
      <Text style={styles.text}>IOP</Text>
    </View>
  }
}

class Ophthalmoscopy extends Component {
  render() {
    return <View style={styles.tabCard}>
      <Text style={styles.screenTitle}>Ophthalmoscopy</Text>
    </View>
  }
}

class Gonioscopy extends Component {
  render() {
    return <View style={styles.tabCard}>
      <Text style={styles.screenTitle}>Gonioscopy</Text>
    </View>
  }
}

class Pachymetry extends Component {
  render() {
    return <View style={styles.tabCard}>
      <Text style={styles.screenTitle}>Pachymetry</Text>
    </View>
  }
}

export class GlaucomaScreen extends Component {
  render() {
    return <View>
      <View style={styles.flow}>
        <Anesthetics />
        <Tonometry />
        <Ophthalmoscopy />
        <Gonioscopy />
        <Pachymetry />
        <PerimetryTest />
      </View>
    </View>
  }
}837
