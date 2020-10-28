/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {View, Text} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {Configuration, GroupDefinition} from './Types';
import {styles} from './Styles';
import {strings} from './Strings';
import {GroupedForm} from './GroupedForm';
import {getAllCodes} from './Codes';

let configuration: Configuration = {
  machine: {phoropter: undefined},
};

async function loadConfiguration() {
  let localConfiguration: ?string = await AsyncStorage.getItem('configuration');
  __DEV__ && console.log('loading local configuration: ' + localConfiguration);
  if (
    localConfiguration === undefined ||
    localConfiguration === null ||
    localConfiguration === ''
  )
    return;
  configuration = JSON.parse(localConfiguration);
}

loadConfiguration();

const configurationScreenDefinition = {
  name: 'Configuration',
  fields: [
    {
      name: 'machine',
      label: 'Machine',
      size: 'M',
      fields: [
        {
          name: 'phoropter',
          label: 'Phoropter',
          options: 'machines',
          filter: {
            machineType: 'PHOROPTER',
          },
        },
      ],
    },
  ],
};

export function getConfiguration(): Configuration {
  return configuration;
}

export class ConfigurationScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    configuration: Configuration,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      configuration: getConfiguration(),
    };
  }

  changeConfiguration(
    groupName: string,
    fieldName: string,
    newValue: any,
    column: ?string,
  ): void {
    let configuration: Configuration = this.state.configuration;
    configuration[groupName][fieldName] = newValue;
    this.setState({configuration});
    __DEV__ &&
      console.log('saving configuration: ' + JSON.stringify(configuration));
    AsyncStorage.setItem('configuration', JSON.stringify(configuration));
  }

  render() {
    return (
      <KeyboardAwareScrollView
        contentContainerStyle={styles.centeredScreenLayout}
        scrollEnabled={false}>
        <View style={styles.centeredColumnLayout}>
          {configurationScreenDefinition.fields.map((groupDefinition, i) => (
            <GroupedForm
              key={i}
              definition={groupDefinition}
              form={this.state.configuration[groupDefinition.name]}
              onChangeField={(
                fieldName: string,
                newValue: any,
                column: ?string,
              ) =>
                this.changeConfiguration(
                  groupDefinition.name,
                  fieldName,
                  newValue,
                  column,
                )
              }
            />
          ))}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}
