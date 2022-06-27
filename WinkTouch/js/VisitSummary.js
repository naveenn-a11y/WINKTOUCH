/**
 * @flow
 */

 'use strict';

 import React, {Component} from 'react';
 import {
   View,
   Text,
   FlatList,
 } from 'react-native';
 import {getCodeDefinition} from './Codes';
 import type {
   Exam,
   Visit,
   PatientInfo,
   User,
   Prescription,
   VisitSummary,
 } from './Types';
 import {styles, isWeb} from './Styles';
 import {strings, fontScale} from './Strings';
 import {
   NoAccess,
 } from './Widgets';
 import {
   formatDate,
   isEmpty,
   compareDates,
   isToyear,
   dateFormat,
   farDateFormat,
   yearDateFormat,
 } from './Util';
 import {
   getCachedItem,
 } from './DataCache';
 import {GlassesSummary} from './Refraction';
 import {ItemSummary} from './Items';
 import {getVisitHistory} from './Visit';
import { TouchableOpacity } from 'react-native-gesture-handler';


const pageSize: number = 2;

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
    if (med1 === med2) {
      return 0;
    }
    if (!med1) {
      return -10000;
    }
    if (!med2) {
      return 10000;
    }
    let comparison: number = compareDates(med2['Rx Date'], med1['Rx Date']);
    return comparison;
  }
  
  function getAVisitRefraction(visit: Visit): ?(GlassesRx) {
    let refraction: GlassesRx = null;
  
    if (visit.prescription) {
      refraction = visit.prescription;
      const doctor: User = getCachedItem(visit.userId);
      refraction.doctor = isEmpty(doctor)
        ? ''
        : doctor.firstName + ' ' + doctor.lastName;
      if (!refraction.prescriptionDate) {
        refraction.prescriptionDate = visit.date;
      }
    }
    return refraction;
  }
  
  function getAVisitMedications(
    visit: Visit
  ): ?{medications: Prescription[], fieldDefinitions: FieldDefinition[]} {
  
    let medications: Prescription[] = [];
    let fieldDefinitions: ?(FieldDefinition[]);
  
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
  
    medications.sort(compareMedication);
    return {medications: medications, fieldDefinitions: fieldDefinitions};
  }
  
  function getAVisitBilling(visit: Visit): ?(Exam[]) {
    let visitSummaries: Exam[] = [];
  
    if (
      visit.medicalDataPrivilege !== 'READONLY' &&
      visit.medicalDataPrivilege !== 'FULLACCESS'
    ) {
      let noAccessExam: Exam[] = [{noaccess: true, visitId: visit.id}];
      visitSummaries = [...visitSummaries, ...noAccessExam];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.Diagnosis) {
            exam?.Diagnosis.Procedure.map(({procedureCode, ...icdCodes}) => {
              const icdKeys = [
                'icd1Code',
                'icd2Code',
                'icd3Code',
                'icd4Code',
                'icd5Code',
              ];
              let icdDescription = '';
              for (const key of icdKeys) {
                if (icdCodes[key]) {
                  const icdCode = getCodeDefinition('icdCodes', icdCodes[key]);
                  icdDescription += ', ' + icdCode?.description;
                }
              }
              const procedure = getCodeDefinition(
                'procedureCodes',
                procedureCode,
              );
              visitSummaries = [
                ...visitSummaries,
                {...procedure, visitId: exam.visitId, icdDescription, ...exam},
              ];
            });
          }
        });
      }
    }
    
    return visitSummaries;
  }
  
  function getAVisitSummary(visit: Visit): ?(Exam[]) {
    
    let visitSummaries: Exam[] = [];
    if (
      visit.medicalDataPrivilege !== 'READONLY' &&
      visit.medicalDataPrivilege !== 'FULLACCESS'
    ) {
      let noAccessExam: Exam[] = [{noaccess: true, visitId: visit.id}];
      visitSummaries = [...visitSummaries, ...noAccessExam];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.resume) {
            visitSummaries = [...visitSummaries, exam];
          }
        });
        if (visitSummaries.length > 5) {
          return visitSummaries;
        }
      }
    }
    
    return visitSummaries;
  }
  
  function getPatientVisitSummary(patientId: string): ?(VisitSummary[]) {
    let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  
    if (!visitHistory) {
      return undefined;
    }
  
    let patientSummary: VisitSummary[] = [];
    
    visitHistory.forEach((visit: Visit) => {
      if (
        visit.medicalDataPrivilege !== 'READONLY' &&
        visit.medicalDataPrivilege !== 'FULLACCESS'
      ) {
        const noAccessVisitSummary: VisitSummary = {
          noaccess: true, 
          visitId: visit.id,
          visit: visit
        };
        patientSummary = [...patientSummary, noAccessExam];
  
      } else {
        const billing = getAVisitBilling(visit);
        const visitMedications = getAVisitMedications(visit);
        const summary = getAVisitSummary(visit);
        const refraction = getAVisitRefraction(visit);
  
        const visitSummary: VisitSummary = {
          visitId: visit.id,
          refraction: refraction,
          summary: summary,
          billing: billing,
          medications: visitMedications.medications,
          fieldDefinitions: visitMedications.fieldDefinitions,
          visit: visit,
        }
  
        patientSummary = [...patientSummary, visitSummary];
      }
  
    });
    return patientSummary;
  }
  
  export class VisitSummaryTable extends Component {
    props: {
      patientInfo: PatientInfo,
    };
  
    state: {
      visitSummaries: ?VisitSummary[],
      offset: number,
    };
  
    constructor(props: any) {
      super(props);
      this.state = {
        visitSummaries: getPatientVisitSummary(props.patientInfo.id),
        offset: pageSize,
      };
      this.refreshPatientSummary();
    }
  
    async refreshPatientSummary(): Promise<void>  {
      if (this.state.visitSummaries) {
        return;
      }
  
      await fetchVisitHistory(this.props.patientInfo.id);
      let visitSummaries: VisitSummary[] = getPatientVisitSummary(this.props.patientInfo.id);
      this.setState({visitSummaries});
    }
  
    renderSummary = (visitSummary: VisitSummary) => {
      if (visitSummary.noaccess) {
        return (
            <View
            style={[styles.startVisitCard, styles.paddingLeft40]}>
                <NoAccess />
            </View>
        );
      }

      return(
        <View
          style={[styles.startVisitCard, styles.paddingLeft40]}>
          <Text style={styles.cardTitle}>{formatDate(visitSummary.visit.date, yearDateFormat)} - {visitSummary.visit.typeName}</Text>
          
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.providerTitle}:</Text>
            <Text>{visitSummary.refraction.doctor}</Text>
          </View>
  
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.finalRx}</Text>
            <View>
              {visitSummary.refraction && 
              <GlassesSummary
                    showHeaders={false}
                    title=''
                    glassesRx={visitSummary.refraction}
                    showPD={false}
                    key={visitSummary.visitId}
                  />}
            </View>
          </View>
  
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.medicationRxTitle}:</Text>
            <View>
              {visitSummary.medications && 
              visitSummary.fieldDefinitions &&
              visitSummary.medications.map((medicationItem: ?Prescription, index) => (
                <ItemSummary
                  item={medicationItem}
                  orientation='vertical'
                  fieldDefinitions={visitSummary.fieldDefinitions}
                  editable={false}
                  showLabels={true}
                  titleFields={['Rx Date']}
                  key={index.toString()}
                />
              ))
              }
            </View>
          </View>
  
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.billing}:</Text>
            <View>
              {visitSummary.billing &&
              visitSummary.billing.map((eachBill: Exam, _index: number) => (<Text style={styles.text}>
                {formatDate(
                  getCachedItem(eachBill.visitId).date,
                  isToyear(getCachedItem(eachBill.visitId).date)
                    ? dateFormat
                    : farDateFormat,
                )}
                : {eachBill.description} {eachBill.icdDescription}
              </Text>))
              }
            </View>
          </View>
  
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.summaryTitle}:</Text>
            <View>
              {visitSummary.summary &&
              visitSummary.summary.map((eachSummary: Exam, _index: number) => (<View
                style={
                  isWeb ? [styles.cardColumn, {flex: 1}] : styles.cardColumn
                }>
                <Text style={styles.text}>
                  {formatDate(
                    getCachedItem(eachSummary.visitId).date,
                    isToyear(getCachedItem(eachSummary.visitId).date)
                      ? dateFormat
                      : farDateFormat,
                  )}
                  : {eachSummary.resume}
                  {'\n'}
                </Text>
              </View>))
              }
            </View>
          </View>
  
          
  
        </View>
      );
    }

    renderFooter = () => {
        if (this.state.offset >= this.state.visitSummaries.length) {
            return (<View></View>);
        }

        return (
            <View style={styles.flow}>
                <TouchableOpacity 
                    onPress={this.loadMoreSummaries}
                >
                    <Text style={styles.tabText}>{strings.loadMoreSummariesTitle}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    loadMoreSummaries = (): void => {
        const offset = this.state.offset + pageSize;
        if (offset <= this.state.visitSummaries.length) {
            this.setState({offset});
        } else {
            this.setState({offset: this.state.visitSummaries.length});
        }
    }
  
    render() {
        const displayedSummaries = (this.state.offset <= this.state.visitSummaries.length) ? 
        this.state.visitSummaries.slice(0, this.state.offset) : this.state.visitSummaries;

      return (
        <View>
            {this.state.visitSummaries && 
                <FlatList 
                    data={displayedSummaries}
                    renderItem={(summary) => this.renderSummary(summary.item)}
                    ListFooterComponent={this.renderFooter}
                    keyExtractor={(_item, index) => index.toString()} 
                />
            } 
        </View> 
      );
    }
  }