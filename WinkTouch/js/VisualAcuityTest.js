/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import { styles, fontScale } from './Styles';
import { NumberScrollField } from './Widgets';
import { ContactsSummary, GlassesSummary } from './Refraction';
import { Anesthetics } from './EntranceTest';

export class VA extends Component {
  state: {
    value: number
  }
  constructor() {
    super();
    this.state = {
      value: 20
    }
  }
  render() {
    return <NumberScrollField prefix='20/' minValue={10} maxValue={600} stepSize={5}
      value={this.state.value}
      scrollMethod='quadratic'
      onChangeValue={(newValue: number) => this.setState({ value: newValue })} />
  }
}

class AcuityTest extends Component {
  props: {
    type: string
  }
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>{this.props.type} {}Acuities</Text>
      <GlassesSummary hidden={this.props.type !== 'Glasses'} />
      <ContactsSummary hidden={this.props.type !== 'Contacts'} />
      <Text style={styles.text}>Conducted after application of anesthetics</Text>
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}></Text>
        <Text style={styles.formTableColumnHeader}>DVA</Text>
        <Text style={styles.formTableColumnHeader}>NVA</Text>
        <Text style={styles.formTableColumnHeader}>Pin</Text>
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OD</Text>
        <VA />
        <VA />
        <VA />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OS</Text>
        <VA />
        <VA />
        <VA />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OU</Text>
        <VA />
        <VA />
        <Text style={styles.formTableColumnHeader}>   </Text>
      </View >
    </View>
  }
}

export class VisualAcuityTest extends Component {
  render() {
    return <View>
      <View style={styles.flow}>
        <AcuityTest type='Unaided' />
      </View>
      <View style={styles.flow}>
        <AcuityTest type='Glasses' />
        <AcuityTest type='Contacts' />
      </View>
    </View>
  }
}
