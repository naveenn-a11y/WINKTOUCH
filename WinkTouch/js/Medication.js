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
  GlassesRx,
  Prescription,
} from './Types';
import {styles} from './Styles';
import {ItemsList} from './Items';
import {compareDates} from './Util';
import {getCachedItems, getCachedItem} from './DataCache';
import {getVisitHistory, fetchVisitHistory} from './Visit';
import {strings} from './Strings';
import {NoAccess} from './Widgets';

const medicationExamNames: string[] = [
  'Medication',
  'Ocular medication',
  'Prescription',
];

function fillPrescriptionDates(
  medications: ?(Prescription[]),
  visitId: string,
) {
  if (!medications) {
    return;
  }
  const visit: Visit = getCachedItem(visitId);
  medications.forEach((medication: Prescription) => {
    if (!medication['Rx Date']) {
      medication['Rx Date'] = visit.date;
    }
  });
}

function compareMedication(med1: ?Prescription, med2: ?Prescription): number {
  if (med1 === med2) return 0;
  if (!med1) return -10000;
  if (!med2) return 10000;
  let comparison: number = compareDates(med2['Rx Date'], med1['Rx Date']);
  return comparison;
}

function getRecentMedication(
  patientId: string,
): ?{medications: Prescription[], fieldDefinitions: FieldDefinition[]} {
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory) return undefined;
  let medications: Prescription[] = [];
  let fieldDefinitions: ?(FieldDefinition[]) = undefined;
  visitHistory.forEach((visit: Visit) => {
    if (
      visit.medicalDataPrivilege !== 'READONLY' &&
      visit.medicalDataPrivilege !== 'FULLACCESS'
    ) {
      let noAccessPrescription: Prescription[] = [{noaccess: true}];
      fillPrescriptionDates(noAccessPrescription, visit.id);
      medications = [...medications, ...noAccessPrescription];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.Prescription) {
            if (fieldDefinitions === undefined) {
              fieldDefinitions = exam.definition.fields;
              let fieldDefinition = fieldDefinitions.find(
                (fd) => fd.name === 'Rx Date',
              );
              if (fieldDefinition === undefined) {
                let date: ?(FieldDefinition[]) = [
                  {
                    name: 'Rx Date',
                    type: 'pastDate',
                    required: true,
                    suffix: ': ',
                  },
                ];
                fieldDefinitions = [...date, ...fieldDefinitions];
              }
            }
            fillPrescriptionDates(exam.Prescription, exam.visitId);
            medications = [...medications, ...exam.Prescription];
          }
        });
      }
    }
  });
  medications.sort(compareMedication);
  if (medications.length > 15) {
    medications = medications.slice(0, 15);
  }
  return {medications: medications, fieldDefinitions: fieldDefinitions};
}

export class PatientMedicationCard extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    medications: ?(Prescription[]),
    fieldDefinitions: ?(FieldDefinition[]),
  };

  constructor(props: any) {
    super(props);
    let recentMedication: ?{
      medications: Prescription[],
      fieldDefinitions: FieldDefinition[],
    } = getRecentMedication(props.patientInfo.id);
    this.state = {
      medications: recentMedication.medications,
      fieldDefinitions: recentMedication.fieldDefinitions,
    };
    this.refreshPatientInfo();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.patientInfo !== this.props.patientInfo) {
      let recentMedication: ?{
        medications: Prescription[],
        fieldDefinitions: FieldDefinition[],
      } = getRecentMedication(this.props.patientInfo.id);
      this.setState(
        {
          medications: recentMedication.medications,
          fieldDefinitions: recentMedication.fieldDefinitions,
        },
        this.refreshPatientInfo,
      );
    }
  }

  async refreshPatientInfo() {
    if (this.state.medications) {
      return;
    }
    let recentMedication: ?{
      medications: Prescription[],
      fieldDefinitions: FieldDefinition[],
    } = getRecentMedication(this.props.patientInfo.id);
    if (recentMedication.medications === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      recentMedication = getRecentMedication(this.props.patientInfo.id);
    }
    this.setState(
      {
        medications: recentMedication.medications,
        fieldDefinitions: recentMedication.fieldDefinitions,
      },
      this.refreshPatientInfo,
    );
  }

  checkUserHasAccess() {
    let hasNoAccesAtAll = true;
    this.state.medications.map(
      (item: Prescription) =>
        (hasNoAccesAtAll =
          hasNoAccesAtAll && 'noaccess' in item ? item.noaccess : false),
    );
    return hasNoAccesAtAll;
  }

  render() {
    if (!this.state.medications) {
      return null;
    }
    let hasNoAccess = this.checkUserHasAccess();
    return (
      <View style={hasNoAccess ? styles.tabCard : ''}>
        {hasNoAccess && (
          <Text style={styles.cardTitle}>{strings.medicationRxTitle}</Text>
        )}
        {this.state.medications &&
          this.state.medications.length !== 0 &&
          (hasNoAccess ? (
            <NoAccess />
          ) : (
            <ItemsList
              title={strings.medicationRxTitle}
              items={this.state.medications}
              showLabels={false}
              style={[styles.tabCard, {flexGrow: 0}]}
              fieldDefinitions={this.state.fieldDefinitions}
              editable={false}
              titleFields={['Rx Date']}
            />
          ))}
      </View>
    );
  }
}
