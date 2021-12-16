/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {View, Text} from 'react-native';
import {getCodeDefinition} from '../../../Codes';
import type {Exam, Visit, PatientInfo} from '../../../Types';
import {styles, isWeb} from '../../../Styles';
import {strings} from '../../../Strings';
import {fetchVisitHistory, getVisitHistory} from '../../../Visit';
import {formatDate, isToyear, dateFormat, farDateFormat} from '../../../Util';
import {getCachedItem} from '../../../DataCache';
import {NoAccess} from '../../../Widgets';

function getRecentBilling(patientId: string): ?(Exam[]) {
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory) {
    return undefined;
  }
  let visitSummaries: Exam[] = [];
  visitHistory.forEach((visit: Visit) => {
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
        if (visitSummaries.length > 5) {
          return visitSummaries;
        }
      }
    }
  });
  return visitSummaries;
}

export default class BillingCard extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    billing: ?(Exam[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      billing: getRecentBilling(props.patientInfo.id),
    };
    this.refreshPatientInfo();
  }

  async refreshPatientInfo() {
    if (this.state.billing) {
      return;
    }
    let billing: ?(Exam[]) = getRecentBilling(this.props.patientInfo.id);
    if (billing === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      billing = getRecentBilling(this.props.patientInfo.id);
    }
    this.setState({billing});
  }

  checkUserHasAccess() {
    let hasNoAccesAtAll = true;
    this.state.billing.map(
      (visitSummary: Exam) =>
        (hasNoAccesAtAll =
          hasNoAccesAtAll && 'noaccess' in visitSummary
            ? visitSummary.noaccess
            : false),
    );
    return hasNoAccesAtAll;
  }

  render() {
    let hasNoAccess = this.checkUserHasAccess();
    if (!this.state.billing) {
      return null;
    }

    return (
      <View style={[styles.tabCard, isWeb ? styles.viewWeb : styles.view]}>
        <Text style={styles.cardTitle}>{strings.billing}</Text>
        {this.state.billing &&
          this.state.billing.length !== 0 &&
          (hasNoAccess ? (
            <NoAccess />
          ) : (
            <View
              style={[isWeb ? styles.viewWeb : styles.view, {width: '100%'}]}>
              {this.state.billing.map((visitSummary: Exam, index: number) =>
                visitSummary.noaccess ? (
                  <NoAccess
                    prefix={
                      formatDate(
                        getCachedItem(visitSummary.visitId).date,
                        isToyear(getCachedItem(visitSummary.visitId).date)
                          ? dateFormat
                          : farDateFormat,
                      ) + ': '
                    }
                  />
                ) : (
                  <View style={isWeb ? styles.bgRowWeb : styles.bgRow}>
                    <Text style={styles.text}>
                      {formatDate(
                        getCachedItem(visitSummary.visitId).date,
                        isToyear(getCachedItem(visitSummary.visitId).date)
                          ? dateFormat
                          : farDateFormat,
                      )}
                      : {visitSummary.description} {visitSummary.icdDescription}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ))}
      </View>
    );
  }
}
