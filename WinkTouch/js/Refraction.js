/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Switch } from 'react-native';
import { styles, fontScale } from './Styles';
import { NumberScrollField } from './Widgets';
import { ContactsRx, GlassesRx } from './Exam';
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

export class Sphere extends Component {
  state: {
    value: number
  }
  constructor() {
    super();
    this.state = {
      value: 0
    }
  }
  render() {
    return <NumberScrollField minValue={-20} maxValue={20} stepSize={.25} decimals={2}
      value={this.state.value}
      scrollMethod='quadratic'
      onChangeValue={(newValue: number) => this.setState({ value: newValue })} />
  }
}

export class Cylinder extends Component {
  state: {
    value: number
  }
  constructor() {
    super();
    this.state = {
      value: 0
    }
  }
  render() {
    return <NumberScrollField minValue={-20} maxValue={20} stepSize={.25} decimals={2}
      value={this.state.value}
      scrollMethod='quadratic'
      onChangeValue={(newValue: number) => this.setState({ value: newValue })} />
  }
}


class Rx extends Component {
  props: {
    title: string
  }
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>{this.props.title}</Text>
      <View style={styles.formRow500}>
        <Text style={styles.formTableRowHeader}></Text>
        <Text style={styles.formTableColumnHeader}>Sph</Text>
        <Text style={styles.formTableColumnHeader}>Cyl</Text>
        <Text style={styles.formTableColumnHeader}>Axis</Text>
        <Text style={styles.formTableColumnHeader}>Base</Text>
        <Text style={styles.formTableColumnHeader}>Prism</Text>
        <Text style={styles.formTableColumnHeader}>Add</Text>
      </View >
      <View style={styles.formRow500}>
        <Text style={styles.formTableRowHeader}>OD</Text>
        <Sphere />
        <Cylinder />
        <Sphere />
        <Sphere />
        <Sphere />
        <Sphere />
      </View >
      <View style={styles.formRow500}>
        <Text style={styles.formTableRowHeader}>OS</Text>
        <Sphere />
        <Cylinder />
        <Sphere />
        <Sphere />
        <Sphere />
        <Sphere />
      </View >
    </View>
  }
}

export class WearingRxScreen extends Component {
  render() {
    return <View>
      <View style={styles.flow}>
        <Rx title='Previous Rx' />
        <Rx title='Wearing glasses Refraction' />
      </View>
    </View>
  }
}

export class RefractionScreen extends Component {
  render() {
    return <View>
      <View style={styles.flow}>
        <Rx title='Previous Rx' />
        <Rx title='Wearing glasses Refraction' />
        <Rx title='Auto-refractor' />
        <Rx title='Retinoscope' />
        <Rx title='Phoropter' />
        <Rx title='Cyclopegic' />
        <Rx title='Final Rx' />
      </View>
    </View>
  }
}