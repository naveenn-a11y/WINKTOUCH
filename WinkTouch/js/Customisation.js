/**
 * @flow
 */
'use strict';

import React, {PureComponent} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';

import type {FieldDefinition, ExamDefinition, VisitType} from './Types';
import {getCachedItem, getCachedItems} from './DataCache';
import {allExamDefinitions} from './ExamDefinition';
import {formatLabel} from './Items';
import {styles} from './Styles';
import {getVisitTypes} from './Visit';
import {SelectionList} from './Widgets';
import {strings} from './Strings';
import {CheckList} from './GroupedForm';
import {examSections, getSectionTitle, saveVisitTypes} from './Visit';

export type DefaultExamCustomisationScreenProps = {};
type DefaultExamCustomisationScreenState = {
  visitTypes: VisitType[],
  visitType: ?string,
  sectionDefinitions: FieldDefinition[],
  isDirty: boolean,
};
export class DefaultExamCustomisationScreen extends PureComponent<
  DefaultExamCustomisationScreenProps,
  DefaultExamCustomisationScreenState,
> {
  constructor(props: any) {
    super(props);
    this.state = {
      visitTypes: getVisitTypes(),
      visitType: undefined,
      sectionDefinitions: [],
      isDirty: false,
    };
  }

  componentDidMount() {
    this.refreshExamDefinitions();
  }

  componentWillUnmount() {
    if (this.state.isDirty) {
      this.saveVisitTypeMapping();
    }
  }

  async refreshExamDefinitions() {
    let preExamDefinitions: ExamDefinition[] = await allExamDefinitions(
      true,
      false,
    );
    let examDefinitions: ExamDefinition[] = await allExamDefinitions(
      false,
      false,
    );
    let assessmentDefintions: ExamDefinition[] = await allExamDefinitions(
      false,
      true,
    );
    this.generateSectionDefinitions();
  }

  async saveVisitTypeMapping() {
    const visitTypes: VisitType[] = this.state.visitTypes.filter(
      (visitType: VisitType) => visitType.isDirty,
    );
    await saveVisitTypes(visitTypes);
  }

  selectVisitType = (visitType: ?string): void => {
    this.setState({visitType});
  };

  getPretestDefinition(): FieldDefinition {
    let preExamDefinitions: ?(ExamDefinition[]) = getCachedItems(
      getCachedItem('preExamDefinitions'),
    );
    if (!preExamDefinitions) {
      return;
    }
    const pretestDefinition = {
      name: 'Pre tests',
      options: preExamDefinitions.map((examDefinition: ExamDefinition) =>
        formatLabel(examDefinition),
      ),
    };
    return pretestDefinition;
  }

  generateSectionDefinitions(): FieldDefinition[] {
    let examDefinitions: ?(ExamDefinition[]) = getCachedItems(
      getCachedItem('examDefinitions'),
    );
    let preExamDefinitions: ?(ExamDefinition[]) = getCachedItems(
      getCachedItem('preExamDefinitions'),
    );
    if (!examDefinitions) {
      return [];
    }
    if (preExamDefinitions) {
      examDefinitions = examDefinitions.concat(preExamDefinitions);
    }
    let sectionDefinitions = examSections.map((section: string) => {
      let sectionExamDefinitions: ExamDefinition[] = examDefinitions.filter(
        (examDefinition: ExamDefinition) =>
          examDefinition.section.startsWith(section),
      );
      let examLabels: string[] = sectionExamDefinitions.map(
        (examDefinition: ExamDefinition) => formatLabel(examDefinition),
      );
      let examDefinitionIds: string[] = sectionExamDefinitions.map(
        (examDefinition: ExamDefinition) => examDefinition.id,
      );

      const sectionDefinition = {
        name: getSectionTitle(section),
        options: examLabels,
        multiValue: true,
        examDefinitionIds: examDefinitionIds,
      };
      return sectionDefinition;
    });
    this.setState({sectionDefinitions});
  }

  getSelectedVisitType(): ?VisitType {
    if (!this.state.visitTypes) {
      return undefined;
    }
    const selectedVisitTypeIndex: number = this.state.visitTypes
      .map((visitType: VisitType) => visitType.name)
      .indexOf(this.state.visitType);
    const selectedVisitType: VisitType =
      this.state.visitTypes[selectedVisitTypeIndex];
    return selectedVisitType;
  }

  getSelectedExamLabels(sectionDefinition: FieldDefinition): string[] {
    const visitType: ?VisitType = this.getSelectedVisitType();
    if (!visitType || !visitType.examDefinitionIds) {
      return [];
    }
    const selectedExamIds: string[] =
      sectionDefinition.examDefinitionIds.filter(
        (examDefinitionId: string) =>
          visitType.examDefinitionIds.indexOf(examDefinitionId) >= 0,
      );
    const selectedExamNames: string[] = selectedExamIds.map(
      (examDefinitionId: string) =>
        formatLabel(getCachedItem(examDefinitionId)),
    );
    return selectedExamNames;
  }

  setSelectedExamLabels(
    sectionDefinition: any,
    selectedExamNames: string | string[],
  ) {
    const visitType: ?VisitType = this.getSelectedVisitType();
    if (!visitType || !visitType.examDefinitionIds) {
      return;
    }
    sectionDefinition.examDefinitionIds.forEach((examDefinitionId: string) => {
      const examName: string = formatLabel(getCachedItem(examDefinitionId));
      const isSelected: boolean = selectedExamNames.indexOf(examName) >= 0;
      if (isSelected) {
        //Add the exam to the visit type
        if (visitType.examDefinitionIds.indexOf(examDefinitionId) < 0) {
          visitType.examDefinitionIds.push(examDefinitionId);
          visitType.isDirty = true;
        }
      } else {
        //Remove the exam from the visit type
        const index: number =
          visitType.examDefinitionIds.indexOf(examDefinitionId);
        if (index >= 0) {
          visitType.examDefinitionIds.splice(index, 1);
          visitType.isDirty = true;
        }
      }
    });
    if (!this.state.isDirty) {
      this.setState({isDirty: true});
    }
    this.forceUpdate();
  }

  render() {
    return (
      <View style={styles.flexColumnLayout}>
        <Text style={styles.screenTitle}>{strings.customiseDefaultExams}</Text>
        <ScrollView horizontal={true}>
          <View style={styles.flexRow}>
            <SelectionList
              label="Visit type"
              selection={this.state.visitType}
              items={
                this.state.visitTypes &&
                this.state.visitTypes.map(
                  (visitType: VisitType) => visitType.name,
                )
              }
              simpleSelect={true}
              onUpdateSelection={this.selectVisitType}
            />
            {this.state.sectionDefinitions.map(
              (sectionDefinition: FieldDefinition) => (
                <CheckList
                  definition={sectionDefinition}
                  style={styles.board}
                  value={this.getSelectedExamLabels(sectionDefinition)}
                  onChangeField={(newValue: string | string[]) =>
                    this.setSelectedExamLabels(sectionDefinition, newValue)
                  }
                />
              ),
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export type CustomisationScreenProps = {navigation: any};
type CustomisationScreenState = {};
export class CustomisationScreen extends PureComponent<
  CustomisationScreenProps,
  CustomisationScreenState,
> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <View style={styles.screeen}>
        <View>
          <Text style={styles.screenTitle}>{strings.customisation}</Text>
          <View style={styles.rowLayout}>
            <TouchableOpacity
              onPress={() =>
                this.props.navigation.navigate('defaultTileCustomisation')
              }
              testID="customizeCard1">
              <View style={styles.tabCardS}>
                <Text style={styles.cardTitle}>
                  {strings.customiseDefaultExams}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('templates')}
              testID="customizeCard2">
              <View style={styles.tabCardS}>
                <Text style={styles.cardTitle}>
                  {strings.customiseExamDefinition}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}
