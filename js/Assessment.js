/**
 * @flow
 */
'use strict';

import { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { formatCode } from './Codes';
import { storeExam } from './Exam';
import { FormTextInput } from './Form';
import { GroupedCard } from './GroupedCard';
import { GroupedForm } from './GroupedForm';
import { ItemsCard, formatLabel } from './Items';
import { hasBvd, hasPrism, isPDEmpty } from './Refraction';
import { GlassesDetail } from './GlassesDetail';
import { getDataType } from './Rest';
import { strings } from './Strings';
import { fontScale, styles } from './Styles';
import type { Exam, GlassesRx } from './Types';
import { getValue, isEmpty, setValue } from './Util';
import { Label } from './Widgets';

export class AssessmentCard extends Component {
  props: {
    exam: Exam,
    navigation: any,
    appointmentStateKey: string,
    disabled: ?boolean,
  };

  render() {
    if (!this.props.exam) {
      return null;
    }
    return (
      <TouchableOpacity
        disabled={this.props.disabled}
        testID={'AssesmentCard-' + this.props?.exam?.definition?.label}
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
    if (purchaseRx === undefined) {
      return null;
    }
    rows.push(this.renderPurchaseRxTitle());
    purchaseRx.map((recomm: any, index: number) => {
      rows.push(this.renderPurchaseRxSimpleRow(recomm, index));
    });
    return rows;
  }
  renderPurchaseRxTitle() {
    let purchaseRx: any = this.props.exam.RxToOrder['Purchase Rx'];
    purchaseRx = purchaseRx.filter(
      (recomm: any) => !isEmpty(recomm.notes) || !isEmpty(recomm.lensType),
    );
    if (purchaseRx && purchaseRx.length > 0) {
      return (
        <Label
          suffix=""
          style={styles.sectionTitle}
          value={strings.drRecommendation}
        />
      );
    }
    return null;
  }
  renderPurchaseRxSimpleRow(recomm: any, index: number) {
    return (
      <View style={styles.formRow}>
        <Text style={styles.textLeft}>
          {formatCode('purchaseReasonCode', recomm.lensType).trim() !== ''
            ? formatCode('purchaseReasonCode', recomm.lensType)
            : !isEmpty(recomm.notes) && strings.drRecommendation + (index + 1)}
          {!isEmpty(recomm.notes) && ', ' + recomm.notes}
        </Text>
      </View>
    );
  }

  render() {
    if (this.props.exam === undefined) {
      return null;
    }
    const groupDefinition: GroupDefinition =
      this.props.exam.definition.fields.find(
        (fieldDefinition: GroupDefinition | FieldDefinition) =>
          fieldDefinition.name === 'PD',
      );
    const glassesRx: GlassesRx = this.props.exam.RxToOrder['Final Rx'];
    const pd: any = this.props.exam.RxToOrder.PD;

    return (
      <View style={styles.assessmentCard}>
        <View
          style={
            hasPrism(glassesRx) && hasBvd(glassesRx)
              ? styles.formRow1600
              : styles.formRow800
          }>
          <GlassesDetail
            titleStyle={styles.sectionTitle}
            title={strings.finalRx}
            glassesRx={glassesRx}
            examId={this.props.exam.id}
            style={styles.flexColumnLayout}
            editable={false}
            hasAdd={true}
            hasBVD={hasBvd(glassesRx)}
            isPrescriptionCard={true}
          />
        </View>
        {glassesRx && !isEmpty(glassesRx.notes) && (
          <View>
            <View style={styles.formRow}>
              <Text style={styles.textLeft}>{strings.notesOnRx}: </Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.textLeft}>{glassesRx.notes}</Text>
            </View>
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
    if (this.props.exam === prevProps.exam) {
      return;
    }
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
    if (!this.state.exam) {
      return null;
    }
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

export class VisitSummaryPlanCard extends Component {
  props: {
    exam: Exam,
    navigation: any,
    editable?: boolean,
    appointmentStateKey: string,
    disabled?: boolean,
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
    if (this.props.exam === prevProps.exam) {
      return;
    }
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
    setValue(exam, exam.definition.name + '.Summary.Resume', resume);
    this.storeExam(exam);
  }

  navigateToExam = () => {
    this.props.navigation.navigate('exam', {
      exam: this.state.exam,
      appointmentStateKey: this.props.appointmentStateKey,
    });
  };

  render() {
    if (!this.state.exam) {
      return null;
    }
    const groupDefinition: GroupDefinition =
      this.props.exam.definition.fields.find(
        (fieldDefinition: GroupDefinition | FieldDefinition) =>
          fieldDefinition.name === 'Treatment plan',
      );
    const plans: any = getValue(
      this.state.exam,
      'Consultation summary.Treatment plan',
    );
    const summary = getValue(
      this.state.exam,
      'Consultation summary.Summary.Resume',
    );

    return (
      <View style={styles.assessmentCard}>
        <TouchableOpacity
          style={styles.centeredRowLayout}
          onPress={this.navigateToExam}>
          <Text style={styles.sectionTitle}>{strings.summaryTitle}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.columnLayout}
          onPress={!this.props.editable ? this.navigateToExam : undefined}>
          <View style={styles.formRowL}>
            {this.props.editable && (
              <FormTextInput
                label=""
                multiline={true}
                readonly={!this.props.editable}
                value={!isEmpty(summary) ? summary : ''}
                onChangeText={(text: ?string) => this.updateSummary(text)}
              />
            )}

            {!this.props.editable && (
              <View style={styles.fieldFlexContainer}>
                <Text
                  style={[
                    styles.formFieldLines,
                    {minHeight: 36 * 4.7 * fontScale, height: 'auto'},
                  ]}>
                  {!isEmpty(summary) ? summary : ''}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={this.props.disabled}
          onPress={this.navigateToExam}>
          <View>
            <View style={styles.centeredRowLayout}>
              <Text style={styles.sectionTitle}>
                {formatLabel(groupDefinition)}
              </Text>
            </View>

            <View style={styles.columnLayout}>
              {!isEmpty(plans) &&
                plans.map((plan, index) => {
                  return (
                    <View
                      style={[styles.textWrap, {marginBottom: 10 * fontScale}]}>
                      <Text style={styles.textLeft} key={index}>
                        {plan.Treatment && `${plan.Treatment}`}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}
