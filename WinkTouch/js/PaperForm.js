/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import type {
  Exam,
  GlassesRx,
  FieldDefinition,
  ExamDefinition,
  GroupDefinition,
  PatientInfo,
} from './Types';
import {styles, fontScale, imageStyle} from './Styles';
import {DiopterField, DegreeField} from './Refraction';
import {CheckButton, DateField, NumberField, TilesField} from './Widgets';
import {ImageField} from './ImageField';
import {FormInput} from './Form';
import {formatLabel} from './Items';
import {getCachedItem} from './DataCache';
import {deepClone, setValue} from './Util';
import {
  storeExam,
  getFieldDefinition,
  getFieldValue,
  getVisit,
  getExam,
  getPatient,
} from './Exam';
import {storePatientInfo} from './Patient';
import {stripDataType} from './Rest';

const textStyle = StyleSheet.create({
  textStyle: {
    backgroundColor: 'white',
    alignSelf: 'center',
    flex: 100,
    textAlign: 'right',
    fontSize: 21 * fontScale,
    padding: 5 * fontScale,
    margin: 0.5 * fontScale,
  },
}).textStyle;
const textLeftStyle = StyleSheet.create({
  textStyle: {
    backgroundColor: 'white',
    alignSelf: 'center',
    flex: 100,
    textAlign: 'left',
    fontSize: 21 * fontScale,
    padding: 5 * fontScale,
    margin: 0.5 * fontScale,
  },
}).textStyle;
const multiLineTextStyle = StyleSheet.create({
  multiLineTextStyle: {
    alignSelf: 'flex-start',
    flex: 100,
    textAlign: 'left',
    fontSize: 21 * fontScale,
    marginHorizontal: 5 * fontScale,
  },
}).multiLineTextStyle;
const smallTextStyle = StyleSheet.create({
  smallTextStyle: {
    backgroundColor: 'white',
    alignSelf: 'center',
    flex: 100,
    textAlign: 'left',
    fontSize: 18 * fontScale,
    padding: 0 * fontScale,
    margin: 1 * fontScale,
  },
}).smallTextStyle;
const checkBoxStyle = StyleSheet.create({
  checkBoxStyle: {
    fontSize: 18 * fontScale,
    fontStyle: 'italic',
    backgroundColor: 'white',
  },
}).checkBoxStyle;

const doyleTextStyle = StyleSheet.create({
  doyleTextStyle: {
    backgroundColor: 'white',
    alignSelf: 'center',
    flex: 100,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 33 * fontScale,
    padding: 5 * fontScale,
    margin: 1 * fontScale,
  },
}).doyleTextStyle;
const doyleCheckBoxStyle = StyleSheet.create({
  doyleCheckBoxStyle: {
    fontSize: 35 * fontScale,
    fontStyle: 'normal',
    fontWeight: 'bold',
    backgroundColor: 'white',
  },
}).doyleCheckBoxStyle;
const doyleTextStyleBig = StyleSheet.create({
  doyleTextStyleBig: {
    fontSize: 40 * fontScale,
    fontStyle: 'normal',
    fontWeight: 'bold',
    backgroundColor: 'white',
  },
}).doyleTextStyleBig;
const doyleMultiLineTextStyle = StyleSheet.create({
  multiLineTextStyle: {
    flex: 100,
    textAlign: 'left',
    fontSize: 35 * fontScale,
    marginHorizontal: 5 * fontScale,
  },
}).multiLineTextStyle;

export class PaperFormScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam?: (exam: Exam) => void,
    appointmentStateKey?: string,
    editable?: boolean,
    navigation?: any,
    enableScroll: () => void,
    disableScroll: () => void,
  };
  state: {
    scrollEnabled: boolean,
    glassesRx: GlassesRx,
    isRoutineExam: boolean,
    complaints: string,
    goodHealth: boolean,
    visitDate?: Date,
    lines?: string[],
    lines2?: string[],
    color: string,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      scrollEnabled: true,
      glassesRx: {
        od: {sphere: 0.25},
        os: {sphere: 0.3},
      },
      isRoutineExam: true,
      goodHealth: false,
      complaints: 'Free text.\nYou can type or speak.',
      va: {
        od: {
          far: 25,
          farRx: undefined,
          near: 45,
          nearRx: undefined,
        },
        os: {
          far: 25,
          farRx: undefined,
          near: 45,
          nearRx: undefined,
        },
      },
      visitDate: undefined,
      lines: ['640x480'],
      lines2: ['640x480'],
      color: 'Bleu',
    };
  }

  async storeOtherExam(exam: Exam) {
    //if (!this.props.appointmentStateKey || !this.props.navigation) return;
    try {
      await storeExam(
        exam,
        this.props.appointmentStateKey,
        this.props.navigation,
      );
    } catch (error) {
      alert(error); //TODO
    }
    this.forceUpdate();
  }

  async storePatient(patient: PatientInfo) {
    try {
      await storePatientInfo(patient);
    } catch (error) {
      alert(error); //TODO
    }
    this.forceUpdate();
  }

  updateFieldValue(fieldIdentifier: string, newValue: any) {
    const fieldSrc: string = fieldIdentifier.substring(
      0,
      fieldIdentifier.indexOf('.'),
    );
    if (fieldSrc === 'exam') {
      let examIdentifier = fieldIdentifier.substring(5);
      const examName: string = examIdentifier.substring(
        0,
        examIdentifier.indexOf('.'),
      );
      const exam: any = getExam(examName, getVisit(this.props.exam));
      const identifiers: string[] = examIdentifier.split('.');
      let value: any = exam;
      for (let i: number = 0; i < identifiers.length; i++) {
        if (i === identifiers.length - 1) {
          value[identifiers[i]] = newValue;
        } else {
          let subValue = value[identifiers[i]];
          if (subValue === undefined || subValue === null) {
            subValue = {};
            value[identifiers[i]] = subValue;
          }
          value = subValue;
        }
      }
      this.forceUpdate();
      this.storeOtherExam(exam);
    } else if (fieldSrc === 'patient') {
      let fieldName = fieldIdentifier.substring('patient.'.length);
      let patient: PatientInfo = getPatient(this.props.exam);
      patient[fieldName] = newValue;
      this.forceUpdate();
      this.storePatient(patient);
    } else {
      const exam: Exam = this.props.exam;
      setValue(
        exam,
        this.props.exam.definition.name + '.' + fieldIdentifier,
        newValue,
      );
      this.props.onUpdateExam(exam);
    }
  }

  updateGlassesRx(
    oculus: string,
    propertyName: string,
    value: ?number | string,
  ): void {
    let glassesRx: GlassesRx = this.state.glassesRx;
    glassesRx[oculus][propertyName] = value;
    this.setState({glassesRx});
  }

  disableScroll = (): void => {
    this.setState({scrollEnabled: false});
    this.props.disableScroll();
  };

  enableScroll = (): void => {
    this.setState({scrollEnabled: true});
    this.props.enableScroll();
  };

  renderToulchExam() {
    if (!this.props.exam) return null;
    const examName: string = this.props.exam.definition.name;
    return (
      <ScrollView
        minimumZoomScale={1.0}
        maximumZoomScale={2.0}
        bounces={false}
        bouncesZoom={false}
        scrollEnabled={this.state.scrollEnabled}
        pinchGestureEnabled={this.state.scrollEnabled}>
        <View>
          <ImageField
            image="./image/ToulchExamFront.jpg"
            resolution="810x1068"
            size="XL"
            popup={false}
            drawable={true}
            value={this.props.exam[examName]['Exam Front Page']}
            sync={true}
            disableScroll={this.disableScroll}
            enableScroll={this.enableScroll}
            examId={this.props.exam.id}
            patientId={getPatient(this.props.exam).id}
            fileName="Exam front.jpg"
            type="examen de la vue"
            onChangeValue={(value: ?string) =>
              this.updateFieldValue('Exam Front Page', value)
            }>
            <View
              style={{
                position: 'absolute',
                top: 10 * fontScale,
                left: 415 * fontScale,
                width: 300 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={
                  getFieldValue('patient.firstName', this.props.exam) +
                  ' ' +
                  getFieldValue('patient.lastName', this.props.exam)
                }
                definition={getFieldDefinition(
                  'patient.lastName',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={true}
                style={textLeftStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 10 * fontScale,
                left: 990 * fontScale,
                width: 100 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={
                  'Z' +
                  stripDataType(getFieldValue('patient.id', this.props.exam))
                }
                definition={getFieldDefinition(
                  'patient.lastName',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={true}
                style={textLeftStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 52 * fontScale,
                left: 415 * fontScale,
                width: 680 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={
                  getFieldValue('patient.streetNumber', this.props.exam) +
                  ' ' +
                  getFieldValue('patient.streetName', this.props.exam) +
                  ', ' +
                  getFieldValue('patient.postalCode', this.props.exam) +
                  ' ' +
                  getFieldValue('patient.city', this.props.exam)
                }
                definition={getFieldDefinition(
                  'patient.lastName',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={true}
                style={textLeftStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 135 * fontScale,
                left: 485 * fontScale,
                width: 170 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue('patient.dateOfBirth', this.props.exam)}
                definition={getFieldDefinition(
                  'patient.dateOfBirth',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                style={textLeftStyle}
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('patient.dateOfBirth', value)
                }
              />
            </View>

            <View
              style={{
                position: 'absolute',
                top: 956 * fontScale,
                left: 111 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.od.sph',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.od.sph',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.od.sph', value)
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 956 * fontScale,
                left: 189 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.od.cyl',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.od.cyl',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.od.cyl', value)
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 956 * fontScale,
                left: 267 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.od.axis',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.od.axis',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue(
                    'exam.RxToOrder.Final Rx.od.axis',
                    value,
                  )
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 957 * fontScale,
                left: 345 * fontScale,
                width: 75 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.od.add',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.od.add',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.od.add', value)
                }
                style={textStyle}
              />
            </View>

            <View
              style={{
                position: 'absolute',
                top: 997 * fontScale,
                left: 111 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.os.sph',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.os.sph',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.os.sph', value)
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 997 * fontScale,
                left: 189 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.os.cyl',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.os.cyl',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.os.cyl', value)
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 997 * fontScale,
                left: 267 * fontScale,
                width: 76 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.os.axis',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.os.axis',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue(
                    'exam.RxToOrder.Final Rx.os.axis',
                    value,
                  )
                }
                style={textStyle}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                top: 997 * fontScale,
                left: 345 * fontScale,
                width: 75 * fontScale,
                height: 40 * fontScale,
                justifyContent: 'center',
              }}>
              <FormInput
                value={getFieldValue(
                  'exam.RxToOrder.Final Rx.os.add',
                  this.props.exam,
                )}
                definition={getFieldDefinition(
                  'exam.RxToOrder.Final Rx.os.add',
                  this.props.exam,
                )}
                showLabel={false}
                readonly={
                  this.props.editable !== true ||
                  this.state.scrollEnabled === false
                }
                onChangeValue={(value: ?number) =>
                  this.updateFieldValue('exam.RxToOrder.Final Rx.os.add', value)
                }
                style={textStyle}
              />
            </View>
          </ImageField>

          <ImageField
            image="./image/ToulchExamBack.jpg"
            resolution="811x1071"
            size="XL"
            popup={false}
            drawable={true}
            value={this.props.exam[examName]['Exam Back Page']}
            disableScroll={this.disableScroll}
            enableScroll={this.enableScroll}
            examId={this.props.exam.id}
            patientId={getPatient(this.props.exam).id}
            fileName="Exam back.jpg"
            type="examen de la vue"
            onChangeValue={(value: ?string) =>
              this.updateFieldValue('Exam Back Page', value)
            }
          />

          <ImageField
            image="./image/ToulchMeds.jpg"
            resolution="600x826"
            size="L"
            popup={false}
            drawable={true}
            value={this.props.exam[examName]['Medication Rx']}
            disableScroll={this.disableScroll}
            enableScroll={this.enableScroll}
            examId={this.props.exam.id}
            patientId={getPatient(this.props.exam).id}
            fileName="Rx.jpg"
            type="prescription"
            onChangeValue={(value: ?string) =>
              this.updateFieldValue('Medication Rx', value)
            }
          />
        </View>
      </ScrollView>
    );
  }

  isFieldReadonly(): boolean {
    return this.props.editable !== true || this.state.scrollEnabled === false;
  }

  renderEyeExamTemplate() {
    if (!this.props.exam) return null;
    const examName: string = this.props.exam.definition.name;
    return (
      <ScrollView
        minimumZoomScale={1.0}
        maximumZoomScale={2.0}
        bounces={false}
        bouncesZoom={false}
        scrollEnabled={this.state.scrollEnabled}
        pinchGestureEnabled={this.state.scrollEnabled}>
        <ImageField
          image="./image/eyeexamtemplate.png"
          resolution="763x965"
          size="XL"
          popup={false}
          drawable={true}
          value={this.props.exam[examName]['Chart']}
          disableScroll={this.disableScroll}
          enableScroll={this.enableScroll}
          examId={this.props.exam.id}
          patientId={getPatient(this.props.exam).id}
          fileName="Chart.jpg"
          type="chart"
          onChangeValue={(value: ?string) =>
            this.updateFieldValue('Chart', value)
          }>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 72 * fontScale,
              width: 60 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.DVA.OD',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.DVA.OD',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.isFieldReadonly()}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.DVA.OD', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 136 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.DVA.OD',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.DVA.OD',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.DVA.OD', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 205 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.NVA.OD',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.NVA.OD',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.NVA.OD', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 272 * fontScale,
              width: 66 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.NVA.OD',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.NVA.OD',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.NVA.OD', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 448 * fontScale,
              width: 79 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.od.sph', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.od.sph',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.od.sph', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 531 * fontScale,
              width: 79 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.od.cyl', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.od.cyl',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.od.cyl', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 615 * fontScale,
              width: 71 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.od.axis', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.od.axis',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.od.axis', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 65 * fontScale,
              left: 690 * fontScale,
              width: 84 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.od.add', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.od.add',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.od.add', value)
              }
              style={textStyle}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 72 * fontScale,
              width: 60 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.DVA.OS',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.DVA.OS',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.isFieldReadonly()}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.DVA.OS', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 136 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.DVA.OS',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.DVA.OS',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.DVA.OS', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 205 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.NVA.OS',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.NVA.OS',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.NVA.OS', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 272 * fontScale,
              width: 66 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.NVA.OS',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.NVA.OS',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.NVA.OS', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 448 * fontScale,
              width: 79 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.os.sph', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.os.sph',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.os.sph', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 531 * fontScale,
              width: 79 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.os.cyl', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.os.cyl',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.os.cyl', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 615 * fontScale,
              width: 71 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.os.axis', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.os.axis',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.os.axis', value)
              }
              style={textStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 124 * fontScale,
              left: 690 * fontScale,
              width: 84 * fontScale,
              height: 54 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue('Old Rx.os.add', this.props.exam)}
              definition={getFieldDefinition(
                'exam.RxToOrder.Final Rx.os.add',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('Old Rx.os.add', value)
              }
              style={textStyle}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              top: 181 * fontScale,
              left: 72 * fontScale,
              width: 60 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.DVA.OU',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.DVA.OU',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.isFieldReadonly()}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.DVA.OU', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 181 * fontScale,
              left: 136 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.DVA.OU',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.DVA.OU',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.DVA.OU', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 181 * fontScale,
              left: 203 * fontScale,
              width: 63 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA sc.Unaided acuities.NVA.OU',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA sc.Unaided acuities.NVA.OU',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA sc.Unaided acuities.NVA.OU', value)
              }
              style={smallTextStyle}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: 181 * fontScale,
              left: 272 * fontScale,
              width: 66 * fontScale,
              height: 55 * fontScale,
              justifyContent: 'center',
            }}>
            <FormInput
              value={getFieldValue(
                'VA cc.Aided acuities.NVA.OU',
                this.props.exam,
              )}
              definition={getFieldDefinition(
                'exam.VA cc.Aided acuities.NVA.OU',
                this.props.exam,
              )}
              showLabel={false}
              readonly={this.props.editable !== true}
              onChangeValue={(value: ?number) =>
                this.updateFieldValue('VA cc.Aided acuities.NVA.OU', value)
              }
              style={smallTextStyle}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              top: 253 * fontScale,
              left: 530 * fontScale,
              backgroundColor: '#ffffffff',
            }}>
            <CheckButton
              prefix="( "
              suffix="routine exam)"
              isChecked={getFieldValue('Routine exam', this.props.exam)}
              onSelect={() => this.updateFieldValue('Routine exam', true)}
              onDeselect={() => this.updateFieldValue('Routine exam', false)}
              style={checkBoxStyle}
            />
          </View>
        </ImageField>
      </ScrollView>
    );
  }

  render() {
    if (this.props.exam.definition.image === './image/eyeexamtemplate.png')
      return this.renderEyeExamTemplate();
    if (this.props.exam.definition.image === './image/ToulchExam.pdf')
      return this.renderToulchExam();
    return null;
  }
}
