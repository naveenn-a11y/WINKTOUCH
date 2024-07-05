/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {View, Text, FlatList} from 'react-native';
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
import {NoAccess} from './Widgets';
import {
  formatDate,
  isEmpty,
  compareDates,
  isToyear,
  dateFormat,
  farDateFormat,
  yearDateFormat,
  getValue,
  getDoctorFullName,
} from './Util';
import {getCachedItem} from './DataCache';
import {GlassesSummary} from './Refraction';
import {ItemSummary} from './Items';
import {fetchVisit, getVisitHistory} from './Visit';
import {TouchableOpacity} from 'react-native-gesture-handler';

export class VisitSummaryTable extends Component {
  props: {
    patientInfo: PatientInfo,
  };

  pageSize: number = 2;

  visitHistory: Visit[] = [];

  state: {
    visitSummaries: ?(VisitSummary[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      visitSummaries: [],
    };
  }

  componentDidMount(){
    this.visitHistory = getVisitHistory(this.props.patientInfo.id);
    this.loadMoreSummaries();
  }

  fillPrescriptionDates = (medications: ?(Prescription[]), visitId: string) => {
    if (!medications) {
      return;
    }
    const visit: Visit = getCachedItem(visitId);
    medications.forEach((medication: Prescription) => {
      if (!medication['Rx Date']) {
        medication['Rx Date'] = visit.date;
      }
    });
  };

  compareMedication = (med1: ?Prescription, med2: ?Prescription): number => {
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
  };

  getAVisitRefraction = (visit: Visit): ?GlassesRx => {
    let refraction: GlassesRx = null;

    if (visit.prescription) {
      refraction = visit.prescription;
      const doctor: User = getCachedItem(visit.userId);
      refraction.doctor = getDoctorFullName(doctor);
      if (!refraction.prescriptionDate) {
        refraction.prescriptionDate = visit.date;
      }
    }
    return refraction;
  };

  getAVisitMedications = (visit: Visit): ?{medications: Prescription[], fieldDefinitions: FieldDefinition[]} => {
    let medications: Prescription[] = [];
    let fieldDefinitions: ?(FieldDefinition[]);

    if (visit.medicalDataPrivilege !== 'READONLY' && visit.medicalDataPrivilege !== 'FULLACCESS') {
      let noAccessPrescription: Prescription[] = [{noaccess: true}];
      this.fillPrescriptionDates(noAccessPrescription, visit.id);
      medications = [...medications, ...noAccessPrescription];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.Prescription) {
            if (fieldDefinitions === undefined) {
              fieldDefinitions = exam.definition.fields;
              let fieldDefinition = fieldDefinitions.find((fd) => fd.name === 'Rx Date');
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
            this.fillPrescriptionDates(exam.Prescription, exam.visitId);
            medications = [...medications, ...exam.Prescription];
          }
        });
      }
    }

    medications.sort(this.compareMedication);
    return {medications: medications, fieldDefinitions: fieldDefinitions};
  };

  getAVisitBilling = (visit: Visit): ?(Exam[]) => {
    let visitSummaries: Exam[] = [];

    if (visit.medicalDataPrivilege !== 'READONLY' && visit.medicalDataPrivilege !== 'FULLACCESS') {
      let noAccessExam: Exam[] = [{noaccess: true, visitId: visit.id}];
      visitSummaries = [...visitSummaries, ...noAccessExam];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.Diagnosis) {
            exam?.Diagnosis.Procedure.map(({procedureCode, ...icdCodes}) => {
              const icdKeys = ['icd1Code', 'icd2Code', 'icd3Code', 'icd4Code', 'icd5Code'];
              let icdDescription = '';
              for (const key of icdKeys) {
                if (icdCodes[key]) {
                  const icdCode = getCodeDefinition('icdCodes', icdCodes[key]);
                  icdDescription += ', ' + icdCode?.description;
                }
              }
              const procedure = getCodeDefinition('procedureCodes', procedureCode);
              visitSummaries = [...visitSummaries, {...procedure, visitId: exam.visitId, icdDescription, ...exam}];
            });
          }
        });
      }
    }

    return visitSummaries;
  };

  getAVisitSummary = (visit: Visit): ?(Exam[]) => {
    let visitSummaries: Exam[] = [];
    if (visit.medicalDataPrivilege !== 'READONLY' && visit.medicalDataPrivilege !== 'FULLACCESS') {
      let noAccessExam: Exam[] = [{noaccess: true, visitId: visit.id}];
      visitSummaries = [...visitSummaries, ...noAccessExam];
    } else {
      if (visit.customExamIds) {
        visit.customExamIds.forEach((examId: string) => {
          const exam: Exam = getCachedItem(examId);
          if (exam.resume) {
            visitSummaries = [...visitSummaries, exam];
          } else if ('Consultation summary' in exam) {
            visitSummaries = [...visitSummaries, exam];
          }
        });
        if (visitSummaries.length > 5) {
          return visitSummaries;
        }
      }
    }

    return visitSummaries;
  };

  createPatientVisitSummary = (visit: Visit): VisitSummary => {
    if (
      visit.medicalDataPrivilege !== 'READONLY' &&
      visit.medicalDataPrivilege !== 'FULLACCESS' &&
      visit.finalRxPrivilege !== 'READONLY' &&
      visit.finalRxPrivilege !== 'FULLACCESS'
    ) {
      const noAccessVisitSummary: VisitSummary = {
        noaccess: true,
        visitId: visit.id,
        visit: visit,
      };
      return noAccessVisitSummary;
    } else {
      const billing = this.getAVisitBilling(visit);
      const visitMedications = this.getAVisitMedications(visit);
      const summary = this.getAVisitSummary(visit);
      const refraction = this.getAVisitRefraction(visit);

      const visitSummary: VisitSummary = {
        visitId: visit.id,
        refraction: refraction,
        summary: summary,
        billing: billing,
        medications: visitMedications.medications,
        fieldDefinitions: visitMedications.fieldDefinitions,
        visit: visit,
      };
      return visitSummary;
    }
  };

  renderSummary = (visitSummary: VisitSummary) => {
    if (visitSummary.noaccess) {
      return (
        <View style={[styles.startVisitCard, styles.paddingLeft40]}>
          <NoAccess />
        </View>
      );
    }

    let summary: string = '';
    let plan: string = '';

    if (visitSummary?.summary) {
      visitSummary?.summary?.forEach((eachSummary: any, _index: number) => {
        if (eachSummary.noaccess) {
          summary = strings.noAccess;
        } else {
          const formattedDate = formatDate(
            getCachedItem(eachSummary.visitId).date,
            isToyear(getCachedItem(eachSummary.visitId).date) ? dateFormat : farDateFormat,
          );
          if ('Consultation summary' in eachSummary) {
            const consultationSummary = getValue(eachSummary, 'Consultation summary.Summary.Resume');
            summary = !isEmpty(consultationSummary) ? summary.concat(`${consultationSummary} \n`) : '';

            const plans: any = getValue(eachSummary, 'Consultation summary.Treatment plan');
            !isEmpty(plans) &&
              plans.map((eachPlan) => {
                plan = eachPlan.Treatment ? plan.concat(`${eachPlan.Treatment} \n\n`) : '';
              });
          } else if ('resume' in eachSummary) {
            summary = eachSummary.resume ? summary.concat(`${formattedDate} : ${eachSummary.resume} \n`) : '';
          }
        }
      });
    }

    return (
      <View style={[styles.startVisitCard, styles.paddingLeft40]}>
        <Text style={styles.cardTitle}>
          {formatDate(visitSummary.visit.date, yearDateFormat)} - {visitSummary.visit.typeName}
        </Text>

        <View style={styles.summaryGroupContainer}>
          <Text style={styles.summarySubTitle}>{strings.providerTitle}:</Text>
          <Text>{visitSummary.refraction.doctor}</Text>
        </View>

        <View style={styles.summaryGroupContainer}>
          <Text style={styles.summarySubTitle}>{strings.finalRx}</Text>
          <View>
            {visitSummary.refraction && (
              <GlassesSummary
                showHeaders={false}
                title=""
                glassesRx={visitSummary.refraction}
                showPD={false}
                key={visitSummary.visitId}
              />
            )}
          </View>
        </View>

        <View style={styles.summaryGroupContainer}>
          <Text style={styles.summarySubTitle}>{strings.medicationRxTitle}:</Text>
          <View style={styles.textWrap}>
            {visitSummary.medications &&
              visitSummary.medications.map((medicationItem: ?any, index) => (
                <View>
                  {medicationItem.noaccess ? (
                    <NoAccess />
                  ) : (
                    visitSummary.fieldDefinitions && (
                      <ItemSummary
                        item={medicationItem}
                        orientation="vertical"
                        fieldDefinitions={visitSummary.fieldDefinitions}
                        editable={false}
                        showLabels={true}
                        titleFields={['Rx Date']}
                        key={index.toString()}
                      />
                    )
                  )}
                </View>
              ))}
          </View>
        </View>

        <View style={styles.summaryGroupContainer}>
          <Text style={styles.summarySubTitle}>{strings.billing}:</Text>
          <View style={styles.textWrap}>
            {visitSummary.billing &&
              visitSummary.billing.map((eachBill: any, _index: number) => (
                <View>
                  {eachBill.noaccess ? (
                    <NoAccess />
                  ) : (
                    <Text style={styles.text}>
                      {formatDate(
                        getCachedItem(eachBill.visitId).date,
                        isToyear(getCachedItem(eachBill.visitId).date) ? dateFormat : farDateFormat,
                      )}
                      : {eachBill.description} {eachBill.icdDescription}
                    </Text>
                  )}
                </View>
              ))}
          </View>
        </View>

        <View style={styles.summaryGroupContainer}>
          <Text style={styles.summarySubTitle}>{strings.summaryTitle}:</Text>

          <View style={styles.textWrap}>
            <View style={isWeb ? [styles.cardColumn, {flex: 1}] : styles.cardColumn}>
              {summary === strings.noAccess ? (
                <NoAccess />
              ) : (
                <Text style={styles.text}>{visitSummary.summary && summary}</Text>
              )}
            </View>
          </View>
        </View>

        {visitSummary.summary && !isEmpty(plan) && (
          <View style={styles.summaryGroupContainer}>
            <Text style={styles.summarySubTitle}>{strings.plan}:</Text>
            <View style={styles.textWrap}>
              <View style={isWeb ? [styles.cardColumn, {flex: 1}] : styles.cardColumn}>
                {summary === strings.noAccess ? (
                  <NoAccess />
                ) : (
                  <Text style={styles.text}>{visitSummary.summary && plan}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  renderFooter = () => {
    if (this.state.visitSummaries.length >= this.visitHistory.length) {
      return <View />;
    }

    return (
      <View style={styles.flow}>
        <TouchableOpacity onPress={this.loadMoreSummaries}>
          <Text style={styles.tabText}>{strings.loadMoreSummariesTitle}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  loadMoreSummaries = async (): void => {
    const newSummaryLength = Math.min(this.state.visitSummaries.length + this.pageSize , this.visitHistory.length);
    const visits = this.visitHistory.slice(this.state.visitSummaries.length, newSummaryLength);
    const newSummaries = await Promise.all(visits.map(async (visit) => {
      const fetchedVisit = await fetchVisit(visit.id);
      return this.createPatientVisitSummary(fetchedVisit)}));
    const visitSummaries = [...this.state.visitSummaries, ...newSummaries];
    this.setState({visitSummaries});
  };

  render() {
    return (
      <View>
        {this.state.visitSummaries && (
          <FlatList
            data={this.state.visitSummaries}
            renderItem={(summary) => this.renderSummary(summary.item)}
            ListFooterComponent={this.renderFooter}
            keyExtractor={(_item, index) => index.toString()}
          />
        )}
      </View>
    );
  }
}
