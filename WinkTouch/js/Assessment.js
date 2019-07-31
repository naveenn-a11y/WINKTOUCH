/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, TouchableHighlight, Text, ScrollView, TouchableOpacity, ListView, LayoutAnimation } from 'react-native';
import type { GlassesRx, Visit, Exam } from './Types';
import { strings } from './Strings';
import { styles, fontScale } from './Styles';
import {GlassesDetail} from './Refraction';
import { FormRow, FormField, FormTextInput } from './Form';
import { getCachedItem } from './DataCache';
import { ItemsCard, GroupedCard, formatLabel } from './Items';
import { storeExam } from './Exam';
import { Microphone } from './Voice';
import { getDataType } from './Rest';

export class AssessmentCard extends PureComponent {
  props: {
    exam: Exam,
    navigation: any,
    appointmentStateKey: string,
    disabled: ?boolean
  }

  componentWillReceiveProps(){
    this.forceUpdate(); //This is to force redraw when returning to overview screen after exam got updated
  }

  render() {
    if (!this.props.exam) return null;
    return <TouchableOpacity disabled={this.props.disabled} onPress={() => this.props.navigation.navigate('exam', {exam: this.props.exam, appointmentStateKey: this.props.appointmentStateKey})}>
      <View style={styles.assessmentCard}>
        <View style={styles.centeredRowLayout}>
            <Text style={styles.sectionTitle}>{formatLabel(this.props.exam.definition)}</Text>
        </View>
        <View style={styles.formRow500}>
            {this.props.exam.definition.type==='groupedForm' && <GroupedCard isExpanded={true} exam={this.props.exam} showTitle={false} />}
            {this.props.exam.definition.type==='selectionLists' && <ItemsCard isExpanded={true} exam={this.props.exam} showTitle={false} />}
        </View>
      </View>
    </TouchableOpacity>
  }
}


export class PrescriptionCard extends Component {
  props: {
    exam: Exam,
    title?: string
  }

  render() {
    if (this.props.exam===undefined) return null;
    return <View style={styles.assessmentCard}>        
        <View style={styles.formRow500}>
          <GlassesDetail title={strings.RxToOrder} titleStyle={styles.sectionTitle} title={'Final Rx'} glassesRx={this.props.exam.RxToOrder['Final Rx']}
            style={styles.flexColumnLayout} editable={false} hasAdd={true}/>
        </View>
      </View>
  }
}

export class ReferralCard extends Component {
  render() {
    return <View><View style={styles.assessmentCard}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.sectionTitle}>{strings.referral}</Text>
        </View>
        <View style={styles.columnLayout}>
            <View style={styles.formRow500}>
              <FormTextInput label='Specialist' />
            </View>
            <View style={styles.formRow500}>
              <FormTextInput label='Summary' multiline={true} />
            </View>
        </View>
    </View></View>
  }
}

export class VisitSummaryCard extends Component {
  props: {
    exam: Exam,
    editable?: boolean,
  }
  static defaultProps = {
    editable: true
  }

  state: {
    exam: Exam
  }

  constructor(props: any) {
    super(props);
    this.state = {
      exam: this.props.exam
    }
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      exam: nextProps.exam
    });
  }

  async storeExam(exam: Exam) {
    this.setState({exam});
    exam = await storeExam(exam, undefined, undefined);
    if (exam.errors) {
      alert(strings.formatString(strings.storeItemError, getDataType(this.props.exam.id).toLowerCase()));
    } else {
      this.setState({exam});
    }
  }

  async updateSummary(resume: string) {
    let exam : Exam = this.state.exam;
    exam.resume = resume;
    this.storeExam(exam);
  }

  render() {
    if (!this.state.exam) return null;
    return <View><View style={styles.assessmentCard}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.sectionTitle}>{strings.summaryTitle}</Text>
        </View>
        <View style={styles.columnLayout}>
            <View style={styles.formRowL}>
              <FormTextInput label='' multiline={true} readonly={!this.props.editable}  value={this.state.exam.resume} onChangeText={(text: ?string) => this.updateSummary(text)} />
            </View>
        </View>
    </View></View>
  }
}
