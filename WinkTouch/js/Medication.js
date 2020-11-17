/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {View, Text, LayoutAnimation} from 'react-native';
import type {
  PatientInfo,
  FieldDefinition,
  PatientDrug,
  Visit,
  Exam,
} from './Types';
import {styles} from './Styles';
import {ItemsList} from './Items';
import {compareDates} from './Util';
import {getCachedItems, getCachedItem} from './DataCache';
import {getVisitHistory, fetchVisitHistory} from './Visit';
import {strings} from './Strings';

const medicationExamNames: string[] = [
  'Medication',
  'Ocular medication',
  'Prescription',
];

function fillPrescriptionDates(medications: ?(PatientDrug[]), visitId: string) {
  if (!medications) return;
  const visit: Visit = getCachedItem(visitId);
  medications.forEach((medication: PatientDrug) => {
    if (!medication['Rx Date']) {
      medication['Rx Date'] = visit.date;
    }
  });
}

function compareMedication(med1: ?PatientDrug, med2: ?PatientDrug): number {
  if (med1 === med2) return 0;
  if (!med1) return -10000;
  if (!med2) return 10000;
  let comparison: number = compareDates(med2['Rx Date'], med1['Rx Date']);
  return comparison;
}

function getRecentMedication(patientId: string): ?(PatientDrug[]) {
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory) return undefined;
  let medications: PatientDrug[] = [];
  visitHistory.forEach((visit: Visit) => {
    if (visit.customExamIds) {
      visit.customExamIds.forEach((examId: string) => {
        const exam: Exam = getCachedItem(examId);
        if (exam.Prescription) {
          fillPrescriptionDates(exam.Prescription, exam.visitId);
          medications = [...medications, ...exam.Prescription];
        }
        /**
        else if (exam.Medication) {
          fillPrescriptionDates(exam.Medication, exam.visitId);
          medications = [...medications, ...exam.Medication];
        } else if (exam['Ocular medication']) {
          fillPrescriptionDates(exam['Ocular medication'], exam.visitId);
          medications = [...medications, ...exam['Ocular medication']];
        }
        */
      });
    }
  });
  medications.sort(compareMedication);
  if (medications.length > 15) medications = medications.slice(0, 15);
  return medications;
}

const patientDrugDefinition: FieldDefinition[] = [
  {
    name: 'Rx Date',
    required: true,
    type: 'pastDate',
  },
  {
    name: 'Label',
    required: true,
    options: 'santeMedicament2Code',
  },
  {
    name: 'Strength',
    required: true,
    simpleSelect: true,
    freestyle: true,
    options: ['10 mg', '20 mg', '30 mg', '50 mg', '100 mg', '200 mg'],
  },
  {
    name: 'Dosage',
    freestyle: true,
    options: [
      '1 drop',
      '2 drops',
      '3 drops',
      '1 capsule',
      '2 capsules',
      '1 tablet',
      '2 tablets',
      '1 tablespoon',
    ],
  },
  {
    name: 'Frequency',
    simpleSelect: true,
    freestyle: true,
    options: 'frequencyCodes',
  },
  {
    name: 'Duration',
    simpleSelect: true,
    freestyle: true,
    options: [
      '1 day',
      '2 days',
      '3 days',
      '4 days',
      '1 week',
      '2 weeks',
      '1 month',
      '2 months',
      '1 year',
    ],
  },
  {
    name: 'Instructions',
    simpleSelect: true,
    freestyle: true,
    options: ['Take before food', 'Take after food', 'Shake well before use'],
  },
  {
    name: 'Comment',
    maxLength: 500,
    freestyle: true,
  },
  {
    maxLength: 999,
    name: 'Notes',
  },
];

export class PatientMedicationCard extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    medication: ?(PatientDrug[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      medication: getRecentMedication(props.patientInfo.id),
    };
    this.refreshPatientInfo();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.patientInfo !== this.props.patientInfo) {
      this.setState(
        {medication: getRecentMedication(this.props.patientInfo.id)},
        this.refreshPatientInfo,
      );
    }
  }

  async refreshPatientInfo() {
    if (this.state.medication) return;
    let medication: ?(PatientDrug[]) = getRecentMedication(
      this.props.patientInfo.id,
    );
    if (medication === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      medication = getRecentMedication(this.props.patientInfo.id);
    }
    this.setState({medication});
  }

  render() {
    if (!this.state.medication) return null;
    return (
      <ItemsList
        title={strings.medicationRxTitle}
        items={this.state.medication}
        showLabels={false}
        style={styles.tabCard}
        fieldDefinitions={patientDrugDefinition}
        editable={false}
      />
    );
  }
}
