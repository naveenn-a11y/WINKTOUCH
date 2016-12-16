/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { FormTextInput } from './Form';
import { WinkButton, SelectionList } from './Widgets';

export type Complaint = {
  date: Date,
  isChief: boolean,
  symptom: string[],
  location?: string[],
  quality?: string[],
  severity?: string[],
  timing?: string[],
  duration?: string[],
  context?: string[],
  modifyingFactor?: string[],
  associatedSign?: string[]
}

const symptoms: string[] = ['Dryness', 'Itchy', 'Stinging, burning sensation', 'Gritty or sandy sensation', 'Sensitiviy to light', 'Excessive tearing', 'Blurry vision', 'Dificulty seeing at night', 'Headaches', 'Redness', 'Black spots in vision', 'Double vision', 'Eye pain', 'Eye irritation', 'Flashes of light', 'Loss of vision', 'Dilated pupils', 'Watery eyes'];
const locations: string[] = ['Left eye', 'Right eye', 'Both eyes', 'Left temple', 'Right temple', 'Both temples', 'Across forehead', 'Back of head', 'Top of head'];
const qualities: string[] = ['Sharp', 'Dull', 'Throbbing', 'Radiating', 'Localized', 'Constant', 'Intermittent', 'Chronic', 'Stable', 'Improving', 'Worsening'];
const durations: string[] = ['1 hour', '2 hours', '3 hours', '5 hours', '1 day', '2 days', '3 days', '4 days', '1 week', '2 weeks', '1 month', '2 months', '1 year'];
const severities: string[] = ['Mild', 'Moderate', 'Severe'];
const timings: string[] = ['Recurrent', 'Continous', 'Comes and goes', 'Seldom', 'Frequently', 'Varies', 'Sudden', 'Slowly'];
const contexts: string[] = ['Driving', 'Working on computer', 'Watching tv', 'Reading', 'Wearing contacts', 'Wearing glasses', 'Looking to the left', 'Looking to the right', 'Looking up', 'Looking down'];
const modifyingFactors: string[] = ['Medication', 'Sleep', 'Cool compress', 'Warm compress', 'Low light'];
const associatedSigns: string[] = ['Anxiety', 'Balance problems', 'Black spots', 'Bleeding', 'Blind spot', 'Bump on lower lid margin', 'Bump on upper lid margin'];


export class ComplaintDetails extends Component {
  props: {
    complaint: Complaint,
    summarize: ?boolean
  }
  render() {
    if (this.props.summarize)
      return <Text>
        {(this.props.complaint.symptom && this.props.complaint.symptom.length > 0) ?
          ('Symptoms: ' + this.props.complaint.symptom +
            ((this.props.complaint.location && this.props.complaint.location.length > 0) ? (' on ' + this.props.complaint.location) : '')
            + '.')
          : ''}
        {(this.props.complaint.quality && this.props.complaint.quality.length > 0) ? ('Quality: ' + this.props.complaint.quality + '.') : ''}
      </Text>
    return <Text>
      {(this.props.complaint.symptom && this.props.complaint.symptom.length > 0) ?
        ('Symptoms: ' + this.props.complaint.symptom +
          ((this.props.complaint.location && this.props.complaint.location.length > 0) ? (' on ' + this.props.complaint.location) : '')
          + '.')
        : ''}
      {(this.props.complaint.quality && this.props.complaint.quality.length > 0) ? ('Quality: ' + this.props.complaint.quality + '.') : ''}
      {/**
      Severity is: {this.props.complaint.severity}.
      Timing is: {this.props.complaint.timing} for {this.props.complaint.duration}.
      Context is: {this.props.complaint.context}.
      Modifying factor is: {this.props.complaint.modifyingFactor}.
      Associated sign is: {this.props.complaint.associatedSign}.
      */}
    </Text>
  }
}

class HistoryPresentIllness extends Component {
  props: {
    complaints: Complaint[],
    selectedComplaint: ?Complaint,
    onNewComplaint: () => void,
    onSelectComplaint: (complaint: Complaint) => void,
    onClearComplaint: () => void
  }
  render() {
    return <View style={styles.board}>
      {this.props.complaints.map((complaint: Complaint, index: number) => {
        const isSelected: boolean = this.props.selectedComplaint === complaint;
        return <TouchableHighlight key={index} underlayColor='#bbbbffbb'
          onPress={() => this.props.onSelectComplaint(complaint)} >
          <View style={isSelected ? styles.listRowSelected : styles.listRow}>
            <ComplaintDetails complaint={complaint} />
          </View>
        </TouchableHighlight>
      })}
      <View style={styles.buttonsRowLayout}>
        <WinkButton title='Add' onPress={() => this.props.onNewComplaint()} />
        <WinkButton title='Clear' onPress={() => this.props.onClearComplaint()} />
      </View>
    </View >
  }
}

export class ComplaintScreen extends Component {
  state: {
    complaints: Complaint[],
    selectedComplaint: ?Complaint
  }
  constructor(props: any) {
    super(props);
    this.state = {
      complaints: [],
      selectedComplaint: undefined
    }
  }

  update(field: string, values: string[]) {
    if (!this.state.selectedComplaint) return;
    let complaint: Complaint = this.state.selectedComplaint;
    complaint[field] = values;
    this.setState({
      selectedComplaint: complaint
    });
  }

  newComplaint(isChief: boolean) {
    const newComplaint: Complaint = {
      date: new Date(),
      isChief: isChief,
      symptom: [],
      location: [],
      quality: []
    };
    this.state.complaints.push(newComplaint);
    this.setState({
      complaints: this.state.complaints,
      selectedComplaint: newComplaint
    });
  }

  selectComplaint(complaint: Complaint) {
    this.setState({
      selectedComplaint: complaint
    });
  }

  componentDidMount() {
    this.newComplaint(true);
  }

  clearComplaint() {
    if (!this.state.selectedComplaint) {
      this.setState({
        complaints: [],
        selectedComplaint: undefined
      });
      this.newComplaint(false);
      return;
    }
    const complaint: Complaint = this.state.selectedComplaint;
    complaint.symptom = [];
    complaint.location = [];
    complaint.quality = [];
    this.setState({
      selectedComplaint: complaint
    })
  }


  render() {
    return <View>
      <HistoryPresentIllness complaints={this.state.complaints}
        onNewComplaint={() => this.newComplaint(false)}
        selectedComplaint={this.state.selectedComplaint}
        onSelectComplaint={(complaint: Complaint) => this.selectComplaint(complaint)}
        onClearComplaint={() => this.clearComplaint()}
        />
      {(this.state.selectedComplaint) ? <ScrollView horizontal={true}>
        <SelectionList label='Symptom' items={symptoms} selection={this.state.selectedComplaint.symptom} onUpdateSelection={(symptom: string[]) => this.update('symptom', symptom)} />
        <SelectionList label='Location' items={locations} selection={this.state.selectedComplaint.location} onUpdateSelection={(location: string[]) => this.update('location', location)} />
        <SelectionList label='Quality' items={qualities} selection={this.state.selectedComplaint.quality} onUpdateSelection={(quality: string[]) => this.update('quality', quality)} />
        <SelectionList label='Severity' items={severities} selection={this.state.selectedComplaint.severity} onUpdateSelection={(severity: string[]) => this.update('severity', severity)} />
        <SelectionList label='Timing' items={timings} selection={this.state.selectedComplaint.timing} onUpdateSelection={(timing: string[]) => this.update('timing', timing)} />
        <SelectionList label='Duration' items={durations} selection={this.state.selectedComplaint.duration} onUpdateSelection={(duration: string[]) => this.update('duration', duration)} />
        <SelectionList label='Context' items={contexts} selection={this.state.selectedComplaint.context} onUpdateSelection={(context: string[]) => this.update('context', context)} />
        <SelectionList label='Modifying Factor' items={modifyingFactors} selection={this.state.selectedComplaint.modifyingFactor} onUpdateSelection={(modifyingFactor: string[]) => this.update('modifyingFactor', modifyingFactor)} />
        <SelectionList label='Associated Sign' items={associatedSigns} selection={this.state.selectedComplaint.associatedSign} onUpdateSelection={(associatedSign: string[]) => this.update('associatedSign', associatedSign)} />
      </ScrollView> : null}
    </View>
  }
}