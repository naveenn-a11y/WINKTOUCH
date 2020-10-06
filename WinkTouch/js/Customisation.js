/**
 * @flow
 */
'use strict';

import React, { PureComponent } from 'react';
import { View, Text, ScrollView } from 'react-native';

import type {FieldDefinition, ExamDefinition } from './Types';
import { getCachedItem, getCachedItems } from './DataCache';
import { allExamDefinitions } from './ExamDefinition';
import { formatLabel } from './Items';
import { styles } from './Styles';
import { getVisitTypes } from './Visit';
import { SelectionList } from './Widgets';
import { strings} from './Strings';
import { CheckList} from './GroupedForm';
import { examSections, getSectionTitle } from './Visit';

export type CustomisationScreenProps = {
};

type CustomisationScreenState = {
  visitType: ?string
};

export class CustomisationScreen extends PureComponent<CustomisationScreenProps, CustomisationScreenState> {

  constructor(props: any) {
    super(props);
    this.state = {
      visitType: undefined
    }
  }

  componentDidMount() {
    this.refreshExamDefinitions();
  }

  async refreshExamDefinitions() {
      let preExamDefinitions : ExamDefinition[] = await allExamDefinitions(true, false);
      let examDefinitions : ExamDefinition[] = await allExamDefinitions(false, false);
      let assessmentDefintions : ExamDefinition[] = await allExamDefinitions(false, true);
      this.forceUpdate();
  }

  selectVisitType = (visitType: ?string) : void => {
      this.setState({visitType});
  }

  getPretestDefinition() : FieldDefinition {
    let preExamDefinitions : ?ExamDefinition[] = getCachedItems(getCachedItem('preExamDefinitions'));

    if(!preExamDefinitions) return;
    const pretestDefinition = {
      name: 'Pre tests',
      options: preExamDefinitions.map((examDefinition: ExamDefinition) => formatLabel(examDefinition))
    }
    return pretestDefinition;
  }

  getExamSectionDefinitions() : FieldDefinition[] {
    let preExamDefinitions : ?ExamDefinition[] = getCachedItems(getCachedItem('preExamDefinitions'));
    let examDefinitions : ExamDefinition[] = getCachedItems(getCachedItem('preExamDefinitions')).concat(getCachedItems(getCachedItem('examDefinitions')));
    let sectionDefinitions = examSections.map((section: string) => {
      let examLabels = examDefinitions.filter((examDefinition: ExamDefinition) => examDefinition.section.startsWith(section)).map((examDefinition: ExamDefinition) => formatLabel(examDefinition))
      const sectionDefinition = {
        name: getSectionTitle(section),
        options: examLabels
      }
      return sectionDefinition;
    });
    return sectionDefinitions;
  }

  render() {
    __DEV__ && console.log(this.getExamSectionDefinitions());
    return <View style={styles.flexColumnLayout}>
          <Text style={styles.screenTitle}>{strings.customisation}</Text>
          <ScrollView horizontal={true}>
            <View style={styles.flexRow}>
              <SelectionList label='Visit type' selection={this.state.visitType} items={getVisitTypes()} simpleSelect={true} onUpdateSelection={this.selectVisitType} />
              {this.getExamSectionDefinitions().map((sectionDefinition: FieldDefinition) => <CheckList definition={sectionDefinition} style={styles.board}/>)}
            </View>
          </ScrollView>
        </View>

  }
}
