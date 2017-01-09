/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableHighlight } from 'react-native';
import { styles, fontScale } from './Styles';
import { FormTextInput } from './Form';
import { WinkButton, ItemsEditor } from './Widgets';

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

const complaintDefinition: ItemDefinition = {
  symptom: {
    label: 'Symptom',
    options: symptoms,
    multiValue: true,
    required: true
  },
  location: {
    label: 'Location',
    options: locations,
    multiValue: true
  },
  quality: {
    label: 'Quality',
    options: qualities,
    multiValue: true
  },
  severity: {
    label: 'Severity',
    options: severities,
    multiValue: true
  },
  timing: {
    label: 'Timing',
    options: timings,
    multiValue: true
  },
  duration: {
    label: 'Duration',
    options: durations,
    multiValue: true
  },
  context: {
    label: 'Context',
    options: contexts,
    multiValue: true
  },
  modifyingFactor: {
    label: 'Modifying factor',
    options: modifyingFactors,
    multiValue: true
  },
  associatedSign: {
    label: 'Associated Sign',
    options: associatedSigns,
    multiValue: true
  },
};

export class ComplaintDetails extends Component {
  props: {
    complaint: Complaint,
    isSelected: boolean
  }
  render() {
    return <View style={this.props.isSelected?styles.listRowSelected:styles.listRow}>
      <Text>
        {(this.props.complaint.symptom && this.props.complaint.symptom.length > 0) ?
          ('Symptoms: ' + this.props.complaint.symptom +
            ((this.props.complaint.location && this.props.complaint.location.length > 0) ? (' on ' + this.props.complaint.location) : '')
            + '. ')
            : ' '}
            {(this.props.complaint.quality && this.props.complaint.quality.length > 0) ? ('Quality: ' + this.props.complaint.quality + '.') : ''}
      </Text>
    </View>
  }
}

export class ComplaintScreen extends Component {
  state: {
    complaints: Complaint[]
  }
  constructor(props: any) {
    super(props);
    this.state = {
      complaints: []
    }
  }


  newComplaint(isChief: boolean): Complaint {
    const newComplaint: Complaint = {
      date: new Date(),
      isChief: isChief,
      symptom: [],
      location: [],
      quality: [],
      severity: [],
      timing: [],
      duration: [],
      context: [],
      modifyingFactor: [],
      associatedSign: []
    };
    return newComplaint;
  }

  render() {
    return <ItemsEditor
      items={this.state.complaints}
      newItem={() => this.newComplaint(false)}
      itemDefinition={complaintDefinition}
      itemView='ComplaintDetails'
      />
  }
}
