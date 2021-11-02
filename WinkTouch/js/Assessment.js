/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {
  View,
  TouchableHighlight,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import type {GlassesRx, Visit, Exam} from './Types';
import {strings} from './Strings';
import {styles, fontScale} from './Styles';
import {GlassesDetail, isPDEmpty} from './Refraction';
import {FormRow, FormField, FormTextInput} from './Form';
import {getCachedItem} from './DataCache';
import {ItemsCard, formatLabel} from './Items';
import {GroupedCard, GroupedForm} from './GroupedForm';
import {storeExam} from './Exam';
import {Microphone} from './Voice';
import {getDataType} from './Rest';
import {Label} from './Widgets';
import {isEmpty} from './Util';
import {formatCode} from './Codes';

export class AssessmentCard extends Component {
  props: {
    exam: Exam,
    navigation: any,
    appointmentStateKey: string,
    disabled: ?boolean,
  };

  render() {
    if (!this.props.exam) return null;
    return (
      <TouchableOpacity
        disabled={this.props.disabled}
        onPress={() =>
          this.props.navigation.navigate('exam', {
            exam: this.props.exam,
            appointmentStateKey: this.props.appointmentStateKey,
          })
        }>
        <View style={styles.assessmentCard}>
          <View style={styles.centeredRowLayout}>
            <Label
              suffix=""
              style={styles.sectionTitle}
              value={formatLabel(this.props.exam.definition)}
              fieldId={this.props.exam.definition.id}
            />
          </View>
          <View style={styles.formRow500}>
            {this.props.exam.definition.type === 'groupedForm' && (
              <GroupedCard
                isExpanded={true}
                exam={this.props.exam}
                showTitle={false}
              />
            )}
            {this.props.exam.definition.type === 'selectionLists' && (
              <ItemsCard
                isExpanded={true}
                exam={this.props.exam}
                showTitle={false}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

export class PrescriptionCard extends Component {
  props: {
    exam: Exam,
    title?: string,
  };
  renderPurchaseRxRows() {
    let rows: any[] = [];
    const purchaseRx: any = this.props.exam.RxToOrder['Purchase Rx'];
    purchaseRx.map((recomm: any, index: number) => {
      rows.push(this.renderPurchaseRxSimpleRow(recomm, index));
    });
    return rows;
  }
  renderPurchaseRxSimpleRow(recomm: any, index: number) {
    return (
      <View style={styles.formRow}>
        {formatCode('purchaseReasonCode', recomm.lensType).trim() !== '' ? (
          <Text style={styles.textLeft}>
            {formatCode('purchaseReasonCode', recomm.lensType)}
          </Text>
        ) : (
          !isEmpty(recomm.notes) && (
            <Text style={styles.textLeft}>
              {strings.drRecommendation + (index + 1)}
            </Text>
          )
        )}
        {!isEmpty(recomm.notes) && (
          <Text style={styles.textLeft}>
            {', '} {recomm.notes}
          </Text>
        )}
      </View>
    );
  }
  render() {
    if (this.props.exam === undefined) return null;
    const groupDefinition: GroupDefinition =
      this.props.exam.definition.fields.find(
        (fieldDefinition: GroupDefinition | FieldDefinition) =>
          fieldDefinition.name === 'PD',
      );
    const glassesRx: GlassesRx = this.props.exam.RxToOrder['Final Rx'];
    const pd: any = this.props.exam.RxToOrder['PD'];

    return (
      <View style={styles.assessmentCard}>
        <View style={styles.formRow500}>
          <GlassesDetail
            titleStyle={styles.sectionTitle}
            title={strings.finalRx}
            glassesRx={glassesRx}
            examId={this.props.exam.id}
            style={styles.flexColumnLayout}
            editable={false}
            hasAdd={true}
            isPrescriptionCard={true}
          />
        </View>
        {glassesRx && !isEmpty(glassesRx.notes) && (
          <View style={styles.formRow}>
            <Text style={styles.textLeft}>{strings.notesOnRx}: </Text>
            <Text style={styles.textLeft}>{glassesRx.notes}</Text>
          </View>
        )}
        <View style={styles.formRow}>
          {groupDefinition && !isPDEmpty(pd) && (
            <GroupedForm
              definition={groupDefinition}
              editable={false}
              form={pd}
              examId={this.props.exam.id}
              style={styles.flexColumnLayout}
            />
          )}
        </View>
        <View style={styles.formRow}>
          <View style={styles.flexColumnLayout}>
            {this.renderPurchaseRxRows()}
          </View>
        </View>
      </View>
    );
  }
}

export class ReferralCard extends Component {
  render() {
    return (
      <View>
        <View style={styles.assessmentCard}>
          <View style={styles.centeredRowLayout}>
            <Text style={styles.sectionTitle}>{strings.referral}</Text>
          </View>
          <View style={styles.columnLayout}>
            <View style={styles.formRow500}>
              <FormTextInput label="Specialist" />
            </View>
            <View style={styles.formRow500}>
              <FormTextInput label="Summary" multiline={true} />
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export class VisitSummaryCard extends Component {
  props: {
    exam: Exam,
    editable?: boolean,
  };
  static defaultProps = {
    editable: true,
  };

  state: {
    exam: Exam,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      exam: this.props.exam,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.exam === prevProps.exam) return;
    this.setState({
      exam: this.props.exam,
    });
  }

  async storeExam(exam: Exam) {
    this.setState({exam});
    exam = await storeExam(exam, undefined, undefined);
    if (exam.errors) {
      alert(
        strings.formatString(
          strings.storeItemError,
          getDataType(this.props.exam.id).toLowerCase(),
        ),
      );
    } else {
      this.setState({exam});
    }
  }

  async updateSummary(resume: string) {
    let exam: Exam = this.state.exam;
    exam.resume = resume;
    this.storeExam(exam);
  }

  render() {
    if (!this.state.exam) return null;
    return (
      <View>
        <View style={styles.assessmentCard}>
          <View style={styles.centeredRowLayout}>
            <Text style={styles.sectionTitle}>{strings.summaryTitle}</Text>
          </View>
          <View style={styles.columnLayout}>
            <View style={styles.formRowL}>
              <FormTextInput
                label=""
                multiline={true}
                readonly={!this.props.editable}
                value={this.state.exam.resume}
                onChangeText={(text: ?string) => this.updateSummary(text)}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}
