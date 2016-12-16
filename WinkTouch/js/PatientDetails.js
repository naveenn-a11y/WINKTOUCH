/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import {Text, View, TextInput, TouchableOpacity, TouchableWithoutFeedback, DatePickerAndroid} from 'react-native';
import {styles} from './Styles';
import dateFormat from 'dateformat';
import {PhoneNumberUtil, PhoneNumberFormat} from 'google-libphonenumber';

class DatePicker extends Component {
  constructor() {
    super();
    this.showPicker = async (stateKey, options) => {
      try {
        var newState = {};
        const {action, year, month, day} = await DatePickerAndroid.open(options);
        if (action === DatePickerAndroid.dismissedAction) {
          newState[stateKey + 'Text'] = 'dismissed';
        } else {
          var date = new Date(year, month, day);
          newState[stateKey + 'Text'] = date.toLocaleDateString();
          newState[stateKey + 'Date'] = date;
          this.props.onChange('date', date);
        }
        this.setState(newState);
      } catch ({code, message}) {
        console.warn(`Error in DatePicker '${stateKey}': `, message);
      }
    }
  }

  render() {
    return <TouchableWithoutFeedback onPress={() => this.showPicker('simple', { date: this.props.date }) }>
        <View style={{ width: 100 }}><Text>{dateFormat(this.props.date, 'mm/dd/yyyy') }</Text></View>
    </TouchableWithoutFeedback>
  }
}

class TelNr extends Component {
  render() {
    const phoneUtil = PhoneNumberUtil.getInstance();
    if (this.props.telNr)
      return <Text>{this.props.label}: {phoneUtil.format(phoneUtil.parse(this.props.telNr, 'US'), PhoneNumberFormat.INTERNATIONAL) }</Text>
    return null;
  }
}

class Adress extends Component {
  render() {
    return <View>
      <Text>7270 rue Lajeunesse apt 301</Text>
      <Text>QC H2M 2M4 Montreal</Text>
    </View>
  }
}

class ContactInformation extends Component {
  render() {
    return <View style={this.props.style}>
      <TelNr label='Mobile' telNr={this.props.cellPhoneNr}/>
      <TelNr label='Home' telNr={this.props.homePhoneNr}/>
      <Adress/>
    </View>
  }
}

class PersonIdentification extends Component {
  render() {
    if (this.props.isEditable) {
      return <View style={this.props.style}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ textAlignVertical: 'center', textAlign: 'right' }}>First Name: </Text>
          <View style={{ flex: 1 }}>
            <TextInput autoCapitalize='words' value={this.props.firstName}
              onChangeText={(text) => this.props.onUserInput('firstName', text) } />
          </View>
          <Text  style={{ textAlignVertical: 'center', textAlign: 'right' }}>Last Name: </Text>
          <View style={{ flex: 3 }}>
            <TextInput autoCapitalize='words' value={this.props.lastName}
              onChangeText={(text) => this.props.onUserInput('lastName', text) }/>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text  style={{ textAlignVertical: 'center', textAlign: 'right' }}>Birth date: </Text>
          <DatePicker date={this.props.birthDate} onChange={(field, value) => this.props.onUserInput('birthDate', value) }/>
        </View>
      </View>
    }
    return <View style={this.props.style}>
      <Text>{this.props.firstName} {this.props.lastName}</Text>
      <Text>Birth date: {dateFormat(this.props.birthDate, 'shortDate') }</Text>
    </View>
  }
}

export default class PatientDetails extends Component {
  constructor() {
    super();
    this.state = {
      lastName: 'De Bleeckere',
      firstName: 'Samuel',
      birthDate: new Date(1976, 1, 17),
      streetName: 'rue Lajuenesse',
      houseNr: '7270',
      aptNr: '301',
      postalCode: 'QC H2M 2M4',
      city: 'Montreal',
      cellPhoneNr: '5147978008',
      homePhoneNr: 0,
      email: 'samuel@downloadwink.com',
      editableSection: ''
    };
    this.sections = [{ id: 'PersonIdentification' }, { id: 'ContactInformation' }];
  }

  handleUserInput(field, value) {
    console.log('handle user input:' + field + ' ' + value);
    this.setState({ [field]: value });
  }

  render() {
    return <View style={{ width: 600, padding: 20 }}>
      <TouchableOpacity onPress = {() => this.setState({ editableSection: 'PersonIdentification' }) }>
        <PersonIdentification style={{ flex: 1, padding: 5 }} firstName = {this.state.firstName} lastName={this.state.lastName} birthDate={this.state.birthDate}
          isEditable={this.state.editableSection == 'PersonIdentification'} onUserInput={(field, value) => this.handleUserInput(field, value) }/>
      </TouchableOpacity>
      <TouchableOpacity onPress = {() => this.setState({ editableSection: 'ContactInformation' }) }>
        <ContactInformation style={{ flex: 1, padding: 5 }}  cellPhoneNr={this.state.cellPhoneNr} homePhoneNr={this.state.homePhoneNr}
          isEditable={this.state.editableSection == 'ContactInformation'} onUserInput={(field, value) => this.handleUserInput(field, value) }/>
      </TouchableOpacity>
    </View >
  }
}
