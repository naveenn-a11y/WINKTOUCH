/**
 * @flow
 */

'use strict';

import React, {Component, PureComponent} from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  LayoutAnimation,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  GlassesRx,
  Patient,
  Exam,
  GroupDefinition,
  GlassRx,
  Prism,
  Visit,
  Measurement,
  User,
  FieldDefinition,
} from './Types';
import {fontScale, styles} from './Styles';
import {strings} from './Strings';
import {
  NumberField,
  TilesField,
  Button,
  Label,
  NativeBar,
  Alert,
  NoAccess,
} from './Widgets';
import {
  formatDegree,
  formatDiopter,
  deepClone,
  isEmpty,
  formatDate,
  dateFormat,
  farDateFormat,
  isToyear,
  now,
  jsonDateTimeFormat,
  prefix,
  postfix,
  getValue,
  getDoctorFullName,
} from './Util';
import {FormInput} from './Form';
import {
  getFieldDefinition,
  filterFieldDefinition,
  formatLabel,
  formatFieldValue,
} from './Items';
import {
  getCodeDefinition,
  formatCode,
  formatAllCodes,
  parseCode,
} from './Codes';
import {getVisitHistory, fetchVisitHistory} from './Visit';
import {
  CopyRow,
  Garbage,
  Plus,
  Copy,
  ImportIcon,
  ExportIcon,
  Paste,
  Star,
} from './Favorites';
import {importData, exportData} from './Machine';
import {getCachedItem} from './DataCache';
import {getConfiguration} from './Configuration';
import {getPatient, getExam} from './Exam';
import {ModeContext} from '../src/components/Context/ModeContextProvider';

function getRecentRefraction(patientId: string): ?(GlassesRx[]) {
  let visitHistory: ?(Visit[]) = getVisitHistory(patientId);
  if (!visitHistory) {
    return undefined;
  }
  let refractions: GlassesRx[] = [];
  visitHistory.forEach((visit: Visit) => {
    if (visit.prescription) {
      const refraction: GlassesRx = visit.prescription;
      const doctor: User = getCachedItem(visit.userId);
      refraction.doctor = getDoctorFullName(doctor);
      if (!refraction.prescriptionDate) {
        refraction.prescriptionDate = visit.date;
      }
      refractions = [...refractions, refraction];
    }
  });
  if (refractions.length > 3) {
    refractions = refractions.slice(0, 3);
  }
  return refractions;
}

export function newRefraction(): GlassesRx {
  return {
    od: {},
    os: {},
    ou: {},
    lensType: undefined,
    notes: undefined,
    doctor: undefined,
  };
}

export function clearRefraction(glassesRx: GlassesRx) {
  if (!glassesRx) {
    return;
  }
  glassesRx.os = {};
  glassesRx.od = {};
  glassesRx.ou = {};
  glassesRx.lensType = undefined;
  glassesRx.notes = undefined;
  glassesRx.doctor = undefined;
  glassesRx.currentWear = undefined;
  glassesRx.since = undefined;
}

export function initRefraction(glassesRx: GlassesRx) {
  if (!glassesRx) {
    return;
  }
  if (glassesRx.od === undefined) {
    glassesRx.od = {};
  }
  if (glassesRx.os === undefined) {
    glassesRx.os = {};
  }
  if (glassesRx.ou === undefined) {
    glassesRx.ou = {};
  }
}
function isRxPDEmpty(glassesRx: ?GlassesRx): boolean {
  if (isRxEmpty(glassesRx)) {
    return true;
  }
  if (isEmpty(glassesRx.od) && isEmpty(glassesRx.os) && isEmpty(glassesRx.ou)) {
    return true;
  }
  const isOdEmpty: boolean = !isEmpty(glassesRx.od)
    ? isEmpty(glassesRx.od.farPD) && isEmpty(glassesRx.od.closePD)
    : true;
  const isOsEmpty: boolean = !isEmpty(glassesRx.os)
    ? isEmpty(glassesRx.os.farPD) && isEmpty(glassesRx.os.closePD)
    : true;
  const isOuEmpty: boolean = !isEmpty(glassesRx.ou)
    ? isEmpty(glassesRx.ou.farPD) && isEmpty(glassesRx.ou.closePD)
    : true;

  return isOdEmpty && isOsEmpty && isOuEmpty;
}

export function isRxEmpty(glassesRx: ?GlassesRx): boolean {
  if (!glassesRx) {
    return true;
  }
  return (
    isEmpty(glassesRx.lensType) &&
    isEmpty(glassesRx.notes) &&
    isEmpty(glassesRx.od) &&
    isEmpty(glassesRx.os) &&
    isEmpty(glassesRx.doctor)
  );
}

export function isPDEmpty(pd: ?any): boolean {
  if (!pd) {
    return true;
  }

  const farPD: any = pd.Far;
  const nearPD: any = pd.Near;

  if (!farPD && !nearPD) {
    return true;
  }
  return (
    (isEmpty(farPD.OS) || farPD.OS === 0) &&
    (isEmpty(farPD.OD) || farPD.OD === 0) &&
    (isEmpty(nearPD.OS) || nearPD.OS === 0) &&
    (isEmpty(nearPD.OD) || nearPD.OD === 0)
  );
}

function isAstigmatic(glassesRx: GlassesRx): boolean {
  if (!glassesRx) {
    return false;
  }
  if (
    glassesRx.od &&
    glassesRx.od.cylinder != undefined &&
    glassesRx.od.cylinder != null &&
    glassesRx.od.cylinder != 0.0
  ) {
    return true;
  }
  if (
    glassesRx.os &&
    glassesRx.os.cylinder != undefined &&
    glassesRx.os.cylinder != null &&
    glassesRx.os.cylinder != 0.0
  ) {
    return true;
  }
  return false;
}

function isMultiFocal(glassesRx: GlassesRx): boolean {
  if (!glassesRx) {
    return false;
  }
  if (
    glassesRx.od &&
    glassesRx.od.add != undefined &&
    glassesRx.od.add != null &&
    glassesRx.od.add != 0.0
  ) {
    return true;
  }
  if (
    glassesRx.os &&
    glassesRx.os.add != undefined &&
    glassesRx.os.add != null &&
    glassesRx.os.add != 0.0
  ) {
    return true;
  }
  return false;
}

function parsePrismDiopter(text?: string): ?number {
  if (text === null || text === undefined || text.trim() === '') {
    return undefined;
  }
  let number: number = parseFloat(text);
  if (number === 0.0 || isNaN(number)) {
    return undefined;
  }
  return number;
}

export function parsePrism(prismText?: string): ?Prism {
  if (prismText === undefined || prismText == null || prismText.trim() === '') {
    return undefined;
  }
  //TODO: parse oldest stye prism ?
  let prismTexts: string[] = prismText.trim().split(' ');
  if (prismTexts === undefined || prismTexts.length === 0) {
    __DEV__ && console.error("Can't parse a prism out of: '" + prismText + "'");
    return undefined;
  }
  let prismH: ?number;
  let prismHDirection: ?string;
  let prismV: ?number;
  let prismVDirection: ?string;
  if (prismTexts.length === 1) {
    prismH = parsePrismDiopter(prismTexts[0]);
  } else if (prismTexts.length === 2) {
    let diopter: ?number = parsePrismDiopter(prismTexts[0]);
    let direction: string = prismTexts[1];
    if (direction == 'I' || direction == 'O') {
      prismH = diopter;
      prismHDirection = direction;
    } else if (direction === 'U' || direction === 'D') {
      prismV = diopter;
      prismVDirection = direction;
    } else {
      if (direction === '0') {
        direction = 'I';
      } else if (direction === '1') {
        direction = 'O';
      }
      prismH = diopter;
      prismHDirection = direction;
    }
  } else {
    prismH = parsePrismDiopter(prismTexts[0]);
    prismHDirection = prismTexts[1];
    if (prismHDirection === '0') {
      prismHDirection = 'I';
    } else if (prismHDirection === '1') {
      prismHDirection = 'O';
    }
    prismV = parsePrismDiopter(prismTexts[2]);
    if (prismTexts.length > 3) {
      prismVDirection = prismTexts[3];
      if (prismVDirection === '0') {
        prismVDirection = 'U';
      } else if (prismVDirection === '1') {
        prismVDirection = 'D';
      }
    }
  }
  if (
    prismH === undefined &&
    prismHDirection === undefined &&
    prismV === undefined &&
    prismVDirection === undefined
  ) {
    return undefined;
  }
  let prism: Prism = {prismH, prismHDirection, prismV, prismVDirection};
  return prism;
}

function hasPrismEye(glassRx: GlassRx): boolean {
  if (glassRx) {
    let prism: ?Prism = parsePrism(glassRx.prism);
    if (prism) {
      if (
        prism.prismH != undefined &&
        prism.prismH != null &&
        prism.prismH != 0.0
      ) {
        return true;
      }
      if (
        prism.prismHDirection != undefined &&
        prism.prismHDirection != null &&
        prism.prismHDirection != ''
      ) {
        return true;
      }
      if (
        prism.prismV != undefined &&
        prism.prismV != null &&
        prism.prismV != 0.0
      ) {
        return true;
      }
      if (
        prism.prismVDirection != undefined &&
        prism.prismVDirection != null &&
        prism.prismVDirection != ''
      ) {
        return true;
      }
    }
  }
  return false;
}

export function hasPrism(glassesRx: GlassesRx): boolean {
  if (glassesRx) {
    if (hasPrismEye(glassesRx.od)) {
      return true;
    }
    if (hasPrismEye(glassesRx.os)) {
      return true;
    }
  }
  return false;
}

export function hasBvd(glassesRx: GlassesRx): boolean {
  return (
    (!isEmpty(glassesRx.od) && !isEmpty(glassesRx.od.bvd)) ||
    (!isEmpty(glassesRx.os) && !isEmpty(glassesRx.os.bvd))
  );
}

export function getLensometries(visitId: string): GlassesRx[] {
  if (!visitId) {
    return undefined;
  }
  let lensometry = getExam('Lensometry', getCachedItem(visitId));
  if (!lensometry) {
    return undefined;
  }
  lensometry = lensometry.Lensometry;
  if (!lensometry) {
    return undefined;
  }
  lensometry = lensometry.Lensometry;
  if (!lensometry || lensometry.length === undefined || lensometry.length < 0) {
    return undefined;
  }
  return lensometry;
}
export function getLensometry(visitId: string): GlassesRx {
  const lensometry: GlassesRx[] = getLensometries(visitId);
  if (!lensometry || lensometry.length === undefined || lensometry.length < 0) {
    return undefined;
  }
  return lensometry[0];
}

export function getKeratometry(visitId: string): GlassesRx {
  if (!visitId) {
    return undefined;
  }
  let keratometry = getExam('Keratometry', getCachedItem(visitId));
  if (!keratometry) {
    return undefined;
  }
  keratometry = keratometry.Keratometry;
  if (!keratometry) {
    return undefined;
  }
  keratometry = keratometry.Keratometry;
  return keratometry;
}

export function getAutoRefractor(visitId: string): GlassesRx[] {
  if (!visitId) {
    return undefined;
  }
  let autoRefractor = getExam('Auto refractor', getCachedItem(visitId));
  if (!autoRefractor) {
    return undefined;
  }
  autoRefractor = autoRefractor['Auto refractor'];
  if (!autoRefractor) {
    return undefined;
  }
  autoRefractor = autoRefractor['Auto refractor'];
  if (
    !autoRefractor ||
    autoRefractor.length === undefined ||
    autoRefractor.length < 0
  ) {
    return undefined;
  }
  return autoRefractor;
}

function clearPd(glassesRx: GlassesRx) {
  glassesRx.od.closePD = undefined;
  glassesRx.od.farPD = undefined;
  glassesRx.os.closePD = undefined;
  glassesRx.os.farPD = undefined;
  glassesRx.ou.closePD = undefined;
  glassesRx.ou.farPD = undefined;
}
export class VA extends Component {
  state: {
    value: number,
  };
  constructor() {
    super();
    this.state = {
      value: 20,
    };
  }
  render() {
    return (
      <RulerField
        prefix="20/"
        range={[10, 600]}
        stepSize={5}
        value={this.state.value}
        onChangeValue={(newValue: number) => this.setState({value: newValue})}
      />
    );
  }
}

export class DiopterField extends Component {
  props: {
    value: number,
    label: string,
    visible?: boolean,
    editable?: boolean,
    style?: any,
    onChangeValue: (newvalue: ?number) => void,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
  };
  static defaultProps = {
    visible: true,
    editable: true,
  };

  startEditing() {
    this.refs.field.startEditing();
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <NumberField
        range={[-20, 20]}
        stepSize={0.25}
        decimals={2}
        prefix={'+'}
        value={this.props.value}
        label={this.props.label}
        readonly={!this.props.editable}
        onChangeValue={this.props.onChangeValue}
        style={this.props.style}
        transferFocus={this.props.transferFocus}
        ref="field"
      />
    );
  }
}

export class DegreeField extends Component {
  props: {
    value: number,
    label: string,
    visible?: boolean,
    editable?: boolean,
    style?: any,
    onChangeValue: (newvalue: ?number) => void,
    transferFocus?: {
      previousField: string,
      nextField: string,
      onTransferFocus: (field: string) => void,
    },
  };
  static defaultProps = {
    visible: true,
  };

  startEditing() {
    this.refs.field.startEditing();
  }

  render() {
    if (!this.props.visible) {
      return null;
    }
    return (
      <NumberField
        range={[0, 180]}
        stepSize={1}
        groupSize={10}
        decimals={0}
        value={this.props.value}
        label={this.props.label}
        suffix="&#176;"
        editable={this.props.editable}
        style={this.props.style}
        onChangeValue={this.props.onChangeValue}
        transferFocus={this.props.transferFocus}
        ref="field"
      />
    );
  }
}

export function formatPrism(prism: string): string {
  if (prism === undefined) {
    return '';
  }
  let parsedPrism: ?Prism = parsePrism(prism);
  if (parsedPrism === undefined || parsedPrism === null) {
    return '';
  }
  let formattedPrism: string = '';
  if (
    parsedPrism.prismH !== undefined &&
    parsedPrism.prismH !== null &&
    parsedPrism.prismH !== 0
  ) {
    formattedPrism += parsedPrism.prismH;
    formattedPrism += '\u0394';
    formattedPrism += formatCode('prism1b', parsedPrism.prismHDirection);
  }
  if (
    parsedPrism.prismV !== undefined &&
    parsedPrism.prismV !== null &&
    parsedPrism.prismV !== 0
  ) {
    if (formattedPrism != '') {
      formattedPrism += ' ';
    }
    formattedPrism += parsedPrism.prismV;
    formattedPrism += '\u0394';
    formattedPrism += formatCode('prism2b', parsedPrism.prismVDirection);
  }
  return formattedPrism;
}

function formatBvd(): string {}

export class GeneralPrismInput extends Component {
  props: {
    value: ?string,
    label?: string,
    labelWidth?: number,
    showLabel?: boolean,
    readonly?: boolean,
    visible?: boolean,
    onChangeValue: (newValue: ?string) => void,
    containerStyle?: any,
    testID: string,
  };
  state: {
    splittedValue: string[],
  };
  static defaultProps = {
    visible: true,
  };
  static largeNumbers: string[] = ['10', '20'];
  static bigNumbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  static smallNumbers: string[] = ['.00', '.25', '.50', '.75'];
  inOut: string[] = formatAllCodes('prism1b');
  upDown: string[] = formatAllCodes('prism2b');
  options: string[][] = [
    GeneralPrismInput.largeNumbers,
    GeneralPrismInput.bigNumbers,
    GeneralPrismInput.smallNumbers,
    this.inOut,
    GeneralPrismInput.largeNumbers,
    GeneralPrismInput.bigNumbers,
    GeneralPrismInput.smallNumbers,
    this.upDown,
  ];

  constructor(props: any) {
    super(props);
    this.state = {splittedValue: this.splitValue(this.props.value)};
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value === prevProps.value) {
      return;
    }
    this.setState({splittedValue: this.splitValue(this.props.value)});
  }

  splitValue(value: ?string): string[] {
    let splittedValue: ?(string[]) = [
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ];
    if (value === undefined || value === null) {
      return splittedValue;
    }
    let prism: Prism = parsePrism(value);
    if (prism === undefined || prism === null) {
      return splittedValue;
    }

    let prismHLastDigit =
      isNaN(prism.prismH) || prism.prismH == 0
        ? 0
        : parseInt(prism.prismH) % 10;
    let prismHTenthValue =
      isNaN(prism.prismH) || prism.prismH == 0
        ? 0
        : parseInt(prism.prismH) - prismHLastDigit;
    let prismVLastDigit =
      isNaN(prism.prismV) || prism.prismV == 0
        ? 0
        : parseInt(prism.prismV) % 10;
    let prismVTenthValue =
      isNaN(prism.prismV) || prism.prismV == 0
        ? 0
        : parseInt(prism.prismV) - prismVLastDigit;

    splittedValue[0] =
      prismHTenthValue == 0 ? undefined : prismHTenthValue.toString();
    splittedValue[1] =
      prismHLastDigit == 0 ? undefined : prismHLastDigit.toString();
    splittedValue[2] =
      isNaN(prism.prismH) || prism.prismH == 0
        ? undefined
        : Number(prism.prismH).toFixed(2);
    splittedValue[2] =
      isNaN(prism.prismH) || prism.prismH == 0
        ? undefined
        : splittedValue[2].substr(splittedValue[2].indexOf('.'));
    splittedValue[3] =
      prism.prismHDirection === undefined
        ? undefined
        : formatCode('prism1b', prism.prismHDirection);
    splittedValue[4] =
      prismVTenthValue == 0 ? undefined : prismVTenthValue.toString();
    splittedValue[5] =
      prismVLastDigit == 0 ? undefined : prismVLastDigit.toString();
    splittedValue[6] =
      isNaN(prism.prismV) || prism.prismV == 0
        ? undefined
        : Number(prism.prismV).toFixed(2);
    splittedValue[6] =
      isNaN(prism.prismV) || prism.prismV == 0
        ? undefined
        : splittedValue[6].substr(splittedValue[6].indexOf('.'));
    splittedValue[7] =
      prism.prismVDirection === undefined
        ? undefined
        : formatCode('prism2b', prism.prismVDirection);

    return splittedValue;
  }

  sumArray(arr: any[]): number {
    return arr.reduce((a, b) => {
      let rightIndex = a === undefined ? 0 : Number(a);
      let leftIndex = b === undefined ? 0 : Number(b);
      return rightIndex + leftIndex;
    });
  }

  changeValue = (editedValue: string[]) => {
    let prismH: number = this.sumArray([
      editedValue[0],
      editedValue[1],
      editedValue[2],
    ]);

    let prismHDirection: ?string =
      prismH === undefined || prismH === 0
        ? ''
        : editedValue[3] === undefined
          ? ''
          : parseCode('prism1b', editedValue[3]);

    let prismV: number = this.sumArray([
      editedValue[4],
      editedValue[5],
      editedValue[6],
    ]);

    let prismVDirection: ?string =
      prismV === undefined || prismV === 0
        ? ''
        : editedValue[7] === undefined
          ? ''
          : parseCode('prism2b', editedValue[7]);

    let prism: ?string =
      postfix(prismH === 0 ? '' : prismH, ' ') +
      postfix(prismHDirection, ' ') +
      postfix(prismV === 0 ? '' : prismV, ' ') +
      prismVDirection;
    prism = prism.trim();
    this.props.onChangeValue(prism);
  };

  render() {
    const style: ?any = this.props.style
      ? this.props.style
      : this.props.readonly
        ? styles.formFieldReadOnly
        : this.props.errorMessage
          ? styles.formFieldError
          : styles.formField;
    if (!this.props.visible) {
      return null;
    }
    return (
      <TilesField
        style={style}
        label={formatLabel(getFieldDefinition('visit.prescription.od.prism'))}
        options={this.options}
        value={this.state.splittedValue}
        onChangeValue={this.changeValue}
        containerStyle={this.props.containerStyle}
        readonly={this.props.readonly}
        isPrism={true}
        prefix={[
          undefined,
          undefined,
          undefined,
          ' ',
          undefined,
          undefined,
          undefined,
          ' ',
        ]}
        suffix={[
          undefined,
          undefined,
          undefined,
          ' ',
          undefined,
          undefined,
          undefined,
          undefined,
        ]}
        testID={this.props.testID}
      />
    );
  }
}

export class GlassesSummary extends Component {
  props: {
    glassesRx: GlassesRx,
    title?: string,
    visible?: boolean,
    showHeaders?: boolean,
    titleStyle?: any,
    showPD?: boolean,
  };
  static defaultProps = {
    visible: true,
    showHeaders: true,
    titleStyle: styles.cardTitle,
    showPD: true,
  };

  render() {
    if (this.props.visible !== true || isRxEmpty(this.props.glassesRx)) {
      return null;
    }

    return (
      <View
        style={[styles.columnLayout, {marginBottom: 12 * fontScale}]}
        key={this.props.title}>
        {this.props.title !== null && this.props.title !== undefined && (
          <Text style={this.props.titleStyle}>{this.props.title}</Text>
        )}
        {this.props.glassesRx.currentWear != undefined &&
          this.props.glassesRx.currentWear != null &&
          this.props.glassesRx.currentWear != '' && (
            <View style={styles.rowLayout}>
              <Text style={styles.textLeft}>
                <Text style={styles.labelTitle}>
                  {formatLabel(
                    getFieldDefinition(
                      'exam.Lensometry.Lensometry.Current wear',
                    ),
                  )}
                  :{' '}
                </Text>
                <Text style={styles.text}>
                  {this.props.glassesRx.currentWear}
                </Text>
              </Text>
            </View>
          )}
        {this.props.glassesRx.since != undefined &&
          this.props.glassesRx.since != null &&
          this.props.glassesRx.since != '' && (
            <View style={styles.rowLayout}>
              <Text style={styles.textLeft}>
                <Text style={styles.labelTitle}>
                  {formatLabel(
                    getFieldDefinition('exam.Lensometry.Lensometry.Since'),
                  )}
                  :{' '}
                </Text>
                <Text style={styles.text}>{this.props.glassesRx.since}</Text>
              </Text>
            </View>
          )}
        {this.props.glassesRx.lensType != undefined &&
          this.props.glassesRx.lensType != null &&
          this.props.glassesRx.lensType != '' && (
            <Text style={styles.labelTitle}>
              {this.props.glassesRx.lensType}:
            </Text>
          )}

        {this.props.glassesRx.noaccess ? (
          <NoAccess />
        ) : (
          <View style={styles.rowLayout}>
            <View style={styles.cardColumn}>
              {this.props.showHeaders === true && <Text style={styles.text} />}
              {<Text style={styles.text}>{'\t' + strings.od}:</Text>}
              {<Text style={styles.text}>{'\t' + strings.os}:</Text>}
              {!isEmpty(getValue(this.props.glassesRx, 'ou.va')) &&
                !isEmpty(getValue(this.props.glassesRx, 'ou.addVa')) && (
                  <Text style={styles.text}>{'\t' + strings.ou}:</Text>
                )}
            </View>
            <View style={styles.cardColumn} key="sph">
              {this.props.showHeaders === true && (
                <Text style={styles.text}>Sphere </Text>
              )}
              {this.props.glassesRx.od && (
                <Text style={styles.text} key="od.sph">
                  {' '}
                  {!isEmpty(this.props.glassesRx.od.sph)
                    ? formatDiopter(this.props.glassesRx.od.sph)
                    : ''}
                </Text>
              )}
              {this.props.glassesRx.os && (
                <Text style={styles.text} key="os.sph">
                  {' '}
                  {!isEmpty(this.props.glassesRx.os.sph)
                    ? formatDiopter(this.props.glassesRx.os.sph)
                    : ''}
                </Text>
              )}
            </View>
            <View style={styles.cardColumn} key="cyl">
              {this.props.showHeaders === true && (
                <Text style={styles.text}>Cyl </Text>
              )}
              {this.props.glassesRx.od && (
                <Text style={styles.text} key="od.cyl">
                  {' '}
                  {!isEmpty(this.props.glassesRx.od.cyl)
                    ? formatDiopter(this.props.glassesRx.od.cyl)
                    : ''}
                </Text>
              )}
              {this.props.glassesRx.os && (
                <Text style={styles.text} key="os.cyl">
                  {' '}
                  {!isEmpty(this.props.glassesRx.os.cyl)
                    ? formatDiopter(this.props.glassesRx.os.cyl)
                    : ''}
                </Text>
              )}
            </View>
            <View style={styles.cardColumn} key="axis">
              {this.props.showHeaders === true && (
                <Text style={styles.text}>Axis </Text>
              )}
              {this.props.glassesRx.od && (
                <Text style={styles.text} key="od.axis">
                  {' '}
                  {!isEmpty(this.props.glassesRx.od.axis)
                    ? formatDegree(this.props.glassesRx.od.axis)
                    : ''}
                </Text>
              )}
              {this.props.glassesRx.os && (
                <Text style={styles.text} key="os.axis">
                  {' '}
                  {!isEmpty(this.props.glassesRx.os.axis)
                    ? formatDegree(this.props.glassesRx.os.axis)
                    : ''}
                </Text>
              )}
            </View>
            {(!isEmpty(this.props.glassesRx.od.va) ||
              !isEmpty(this.props.glassesRx.os.va)) && (
              <View style={styles.cardColumn} key="va">
                {this.props.showHeaders === true && (
                  <Text style={styles.text}>VA </Text>
                )}
                {this.props.glassesRx.od && (
                  <Text style={styles.text} key="od.va">
                    {!isEmpty(this.props.glassesRx.od.va)
                      ? ' ' +
                        strings.dva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.od.va,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.DVA.OD',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
                {this.props.glassesRx.os && (
                  <Text style={styles.text} key="os.va">
                    {!isEmpty(this.props.glassesRx.os.va)
                      ? ' ' +
                        strings.dva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.os.va,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.DVA.OS',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
                {this.props.glassesRx.ou && (
                  <Text style={styles.text} key="ou.va">
                    {!isEmpty(this.props.glassesRx.ou.va)
                      ? ' ' +
                        strings.dva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.ou.va,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.DVA.OU',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.cardColumn} key="add">
              {this.props.showHeaders === true && (
                <Text style={styles.text}>Add </Text>
              )}
              {this.props.glassesRx.od && (
                <Text style={styles.text} key="od.add">
                  {!isEmpty(this.props.glassesRx.od.add)
                    ? ' ' +
                      strings.add +
                      ': ' +
                      formatDiopter(this.props.glassesRx.od.add)
                    : ' '}
                </Text>
              )}
              {this.props.glassesRx.os && (
                <Text style={styles.text} key="os.add">
                  {!isEmpty(this.props.glassesRx.os.add)
                    ? ' ' +
                      strings.add +
                      ': ' +
                      formatDiopter(this.props.glassesRx.os.add)
                    : ' '}
                </Text>
              )}
            </View>
            {(!isEmpty(this.props.glassesRx.od.addVa) ||
              !isEmpty(this.props.glassesRx.os.addVa)) && (
              <View style={styles.cardColumn} key="nva">
                {this.props.showHeaders === true && (
                  <Text style={styles.text}>NVA </Text>
                )}
                {this.props.glassesRx.od && (
                  <Text style={styles.text} key="od.addVa">
                    {!isEmpty(this.props.glassesRx.od.addVa)
                      ? ' ' +
                        strings.nva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.od.addVa,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.NVA.OD',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
                {this.props.glassesRx.os && (
                  <Text style={styles.text} key="os.addVa">
                    {!isEmpty(this.props.glassesRx.os.addVa)
                      ? ' ' +
                        strings.nva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.os.addVa,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.NVA.OS',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
                {this.props.glassesRx.ou && (
                  <Text style={styles.text} key="ou.addVa">
                    {!isEmpty(this.props.glassesRx.ou.addVa)
                      ? ' ' +
                        strings.nva +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.ou.addVa,
                          getFieldDefinition(
                            'exam.VA cc.Aided acuities.NVA.OU',
                          ),
                        )
                      : ' '}
                  </Text>
                )}
              </View>
            )}
            <View style={styles.cardColumn} key="prism">
              {this.props.showHeaders === true && (
                <Text style={styles.text}>Prism </Text>
              )}
              {this.props.glassesRx.od && (
                <Text style={styles.text} key="od.prism">
                  {' '}
                  {formatPrism(this.props.glassesRx.od.prism)}
                </Text>
              )}
              {this.props.glassesRx.os && (
                <Text style={styles.text} key="os.prism">
                  {' '}
                  {formatPrism(this.props.glassesRx.os.prism)}
                </Text>
              )}
            </View>
            {(!isEmpty(this.props.glassesRx.od.bvd) ||
              !isEmpty(this.props.glassesRx.os.bvd)) && (
              <View style={styles.cardColumn} key="bvd">
                {this.props.showHeaders === true && (
                  <Text style={styles.text}>{strings.bvd} </Text>
                )}
                {this.props.glassesRx.od && (
                  <Text style={styles.text} key="od.bvd">
                    {!isEmpty(this.props.glassesRx.od.bvd)
                      ? ' ' +
                        strings.bvd +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.od.bvd,
                          getFieldDefinition('exam.RxToOrder.Final Rx.od.bvd'),
                        )
                      : ' '}
                  </Text>
                )}
                {this.props.glassesRx.os && (
                  <Text style={styles.text} key="os.bvd">
                    {!isEmpty(this.props.glassesRx.os.bvd)
                      ? ' ' +
                        strings.bvd +
                        ': ' +
                        formatFieldValue(
                          this.props.glassesRx.os.bvd,
                          getFieldDefinition('exam.RxToOrder.Final Rx.os.bvd'),
                        )
                      : ' '}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        {!isEmpty(this.props.glassesRx.testingCondition) && (
          <Text style={styles.text}>
            {strings.testingCondition}: {this.props.glassesRx.testingCondition}
          </Text>
        )}
        {!isEmpty(this.props.glassesRx.pd) && (
          <Text style={styles.text}>
            {strings.binocularPd}: {this.props.glassesRx.pd}
          </Text>
        )}
        {!isEmpty(this.props.glassesRx.notes) && (
          <Text
            style={[
              styles.text,
              {marginBottom: 6 * fontScale, maxWidth: 600 * fontScale},
            ]}>
            {strings.notes}: {this.props.glassesRx.notes}
          </Text>
        )}

        {this.props.showPD && !isRxPDEmpty(this.props.glassesRx) && (
          <View>
            <Text style={styles.text}>
              {strings.pd} {strings.far}:{' '}
              {prefix(this.props.glassesRx.od.farPD, strings.od + ' ')}
              {!isEmpty(this.props.glassesRx.od.farPD) && ' '}
              {prefix(this.props.glassesRx.os.farPD, strings.os + ' ')}
              {!isEmpty(this.props.glassesRx.os.farPD) && ' '}
              {prefix(this.props.glassesRx.ou.farPD, strings.ou + ' ')}
              {!isEmpty(this.props.glassesRx.ou.farPD) && ' '}
            </Text>
            <Text style={styles.text}>
              {strings.pd} {strings.near}:{' '}
              {prefix(this.props.glassesRx.od.closePD, strings.od + ' ')}
              {!isEmpty(this.props.glassesRx.od.closePD) && ' '}
              {prefix(this.props.glassesRx.os.closePD, strings.os + ' ')}
              {!isEmpty(this.props.glassesRx.os.closePD) && ' '}
              {prefix(this.props.glassesRx.ou.closePD, strings.ou + ' ')}
            </Text>
          </View>
        )}
      </View>
    );
  }
}

export class GlassesDetail extends Component {
  props: {
    definition: GroupDefinition,
    glassesRx: GlassesRx,
    title: string,
    editable?: boolean,
    onCopy?: (glassesRx: GlassesRx) => void,
    onCopyToFinalRx?: (glassesRx: GlassesRx) => void,
    onCopyFromFinal?: (glassesRx: GlassesRx) => void,
    onPaste?: (fieldDefinition: FieldDefinition) => void,
    hasVA?: boolean,
    hasAdd?: boolean,
    hasLensType?: boolean,
    hasPD?: boolean,
    hasMPD?: boolean,
    hasCustomField?: boolean,
    hasNotes?: boolean,
    titleStyle?: string,
    style?: string,
    onChangeGlassesRx?: (glassesRx: GlassesRx) => void,
    onAdd?: () => void,
    onClear?: () => void,
    examId: string,
    fieldId?: string,
    isPrescriptionCard?: boolean,
    hasBVD?: boolean,
    hasCurrentWear?: boolean,
    onAddFavorite?: (favorite: any, name: string) => void,
  };
  state: {
    prism: boolean,
    isTyping: boolean,
    importedData: any,
    showDialog: boolean,
    showSnackBar: boolean,
    snackBarMessage?: string,
  };
  static defaultProps = {
    editable: true,
    titleStyle: styles.sectionTitle,
    isPrescriptionCard: false,
  };
  static contextType = ModeContext;

  constructor(props: any) {
    super(props);
    this.state = {
      prism: hasPrism(this.props.glassesRx),
      isTyping: false,
      showDialog: false,
      showSnackBar: false,
      snackBarMessage: '',
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.glassesRx !== prevProps.glassesRx) {
      this.setState({
        prism: hasPrism(this.props.glassesRx),
      });
    }
  }

  updateGlassesRx(
    oculus: string,
    propertyName: string,
    value: ?number | string,
  ): void {
    if (!this.props.editable) {
      return;
    }
    let glassesRx: GlassesRx = this.props.glassesRx;
    if (oculus) {
      glassesRx[oculus][propertyName] = value;
    } else {
      glassesRx[propertyName] = value;
    }
    if (this.props.onChangeGlassesRx) {
      this.props.onChangeGlassesRx(glassesRx);
    }
  }

  updateGroupedForm(
    groupName: string,
    fieldName: string,
    newValue: any,
    column: ?string,
  ): void {
    let glassesRx: GlassesRx = this.props.glassesRx;
    if (column !== undefined) {
      if (fieldName !== undefined) {
        if (glassesRx[groupName][column] === undefined) {
          glassesRx[groupName][column] = {};
        }
        glassesRx[groupName][column][fieldName] = newValue;
      } else {
        glassesRx[groupName][column] = newValue;
      }
    }
    if (this.props.onChangeGlassesRx) {
      this.props.onChangeGlassesRx(glassesRx);
    }
  }

  updatePrism(oculus: string, prism: String): void {
    if (!this.props.editable) {
      return;
    }
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx[oculus].prism = prism;
    if (this.props.onChangeGlassesRx) {
      this.props.onChangeGlassesRx(glassesRx);
    }
  }

  togglePrism = () => {
    let glassesRx: GlassesRx = this.props.glassesRx;
    let hasPrism: boolean = this.state.prism;
    if (hasPrism) {
      if (glassesRx.od) {
        glassesRx.od.prism = undefined;
        glassesRx.od.prism1 = undefined;
        glassesRx.od.prism1b = undefined;
        glassesRx.od.prism2 = undefined;
        glassesRx.od.prism2b = undefined;
      }
      if (glassesRx.os) {
        glassesRx.os.prism = undefined;
        glassesRx.os.prism1 = undefined;
        glassesRx.os.prism1b = undefined;
        glassesRx.os.prism2 = undefined;
        glassesRx.os.prism2b = undefined;
      }
      this.setState({prism: false}, () =>
        this.props.onChangeGlassesRx(glassesRx),
      );
    } else {
      this.setState({prism: true});
    }
  };

  copyOdOs = (): void => {
    let {closePD, farPD, ...glassesRx} = this.props.glassesRx.od;
    let newGlassesRx: GlassesRx = this.props.glassesRx;
    newGlassesRx.os = {
      closePD: newGlassesRx.os.closePD,
      farPD: newGlassesRx.os.farPD,
      ...glassesRx,
    };
    if (this.props.onChangeGlassesRx) {
      this.props.onChangeGlassesRx(newGlassesRx);
    }
  };

  copyPDOdOs = (): void => {
    let {closePD, farPD, ...glassesRx} = this.props.glassesRx.od;
    let newGlassesRx: GlassesRx = this.props.glassesRx;
    console.log('newGlasses 1: ' + JSON.stringify(newGlassesRx));

    newGlassesRx.os = {
      ...newGlassesRx.os,
      closePD,
      farPD,
    };
    console.log('newGlasses 2: ' + JSON.stringify(newGlassesRx));
    if (this.props.onChangeGlassesRx) {
      this.props.onChangeGlassesRx(glassesRx);
    }
  };

  clear = (): void => {
    if (this.props.onClear) {
      this.props.onClear();
    } else {
      let glassesRx: GlassesRx = this.props.glassesRx;
      clearRefraction(glassesRx);
      if (this.props.onChangeGlassesRx) {
        this.props.onChangeGlassesRx(glassesRx);
      }
    }
  };

  transferFocus = (fieldRef: string) => {
    this.refs[fieldRef].startEditing();
  };

  hideDialog() {
    this.setState({showDialog: false});
  }
  showDialog(data: any) {
    this.setState({importedData: data, showDialog: true});
  }
  showSnackBar(message: ?string) {
    this.setState({snackBarMessage: message});
    this.setState({showSnackBar: true});
  }
  hideSnackBar() {
    this.setState({showSnackBar: false});
  }
  importSelectedData(importData: Measurement) {
    let glassesRx: GlassesRx = this.props.glassesRx;
    glassesRx.lensType = importData.data.lensType;
    glassesRx.customField = importData.data.customField;
    glassesRx.od = {...importData.data.od};
    glassesRx.os = {...importData.data.os};
    glassesRx.ou = {...importData.data.ou};
    if (this.props.onChangeGlassesRx) {
      this.setState({prism: hasPrism(glassesRx)});
      this.props.onChangeGlassesRx(glassesRx);
    }
    this.hideDialog();
  }
  async importData() {
    const data = await importData(
      this.props.definition.import,
      this.props.examId,
    );
    if (data === undefined || data === null) {
      this.showSnackBar(strings.importDataNotFound);
    }
    if (data instanceof Array) {
      this.showDialog(data);
    } else {
      let glassesRx: GlassesRx = this.props.glassesRx;
      glassesRx.lensType = this.props.definition.hasLensType
        ? data.data.lensType
        : undefined;
      glassesRx.customField = data.data.customField;
      glassesRx.od = {...data.data.od};
      glassesRx.os = {...data.data.os};
      glassesRx.ou = {...data.data.ou};
      !this.props.definition.hasMPD && clearPd(glassesRx);
      if (this.props.onChangeGlassesRx) {
        this.setState({prism: hasPrism(glassesRx)});
        this.props.onChangeGlassesRx(glassesRx);
      }
    }
  }

  hasBvd(): boolean {
    return this.props.hasBVD || hasBvd(this.props.glassesRx);
  }
  hasVA(): boolean {
    return (
      this.props.hasVA ||
      (this.props.isPrescriptionCard &&
        !isEmpty(this.props.glassesRx.od) &&
        !isEmpty(this.props.glassesRx.od.va)) ||
      (this.props.isPrescriptionCard &&
        !isEmpty(this.props.glassesRx.os) &&
        !isEmpty(this.props.glassesRx.os.va)) ||
      (this.props.isPrescriptionCard &&
        !isEmpty(this.props.glassesRx.ou) &&
        !isEmpty(this.props.glassesRx.ou.va))
    );
  }

  hasNVA(): boolean {
    return this.hasVA() && this.props.hasAdd;
  }

  async exportData() {
    if (this.props.definition.export === undefined) {
      return;
    }
    const exam: Exam = getCachedItem(this.props.examId);
    const patient: Patient = getPatient(exam);
    let data: any = deepClone(this.props.glassesRx);
    data.lensometry = deepClone(getLensometry(exam.visitId));
    data.keratometry = deepClone(getKeratometry(exam.visitId));
    let measurement: Measurement = {
      label: this.props.title
        ? this.props.title
        : formatLabel(this.props.definition),
      date: formatDate(now(), jsonDateTimeFormat),
      patientId: patient.id,
      data,
    };
    let machineIdentifier = this.props.definition.export;
    if (machineIdentifier instanceof Array && machineIdentifier.length > 0) {
      machineIdentifier = machineIdentifier[0]; //TODO: send to all destinations
    }
    data = await exportData(machineIdentifier, measurement, this.props.examId);
    const config = getConfiguration();
    if (config.machine && config.machine.phoropter) {
      const machineDefinition = getCodeDefinition(
        'machines',
        config.machine.phoropter,
      );
      if (machineDefinition.ip) {
        __DEV__ &&
          console.log(
            'Kicking controlling wink pc ' +
              machineDefinition.ip +
              ' in the http 80 butt',
          );
        await fetch('https://' + machineDefinition.ip + ':80/m');
      }
    }
  }
  addGroupFavorite = (favoriteName: string) => {
    let group: {} = {
      [this.props.definition.name]: {notes: this.props.glassesRx.notes},
    };
    this.props.onAddFavorite(group, favoriteName);
  };

  getRxNotesDefinition(): FieldDefinition {
    let definition: FieldDefinition = deepClone(
      getFieldDefinition('visit.prescription.notes'),
    );
    if (this.props.definition.maxLength) {
      definition.maxLength = this.props.definition.maxLength;
    }
    if (this.props.definition.maxRows) {
      definition.maxRows = this.props.definition.maxRows;
    }
    if (this.props.definition.showTextInfoTip === false) {
      definition.showTextInfoTip = false;
    }

    return definition;
  }

  renderAlert() {
    const importedData: any = this.state.importedData;
    if (!importedData) {
      return null;
    }
    return (
      <Alert
        title={strings.importDataQuestion}
        data={importedData}
        dismissable={true}
        onConfirmAction={(selectedData: Measurement) =>
          this.importSelectedData(selectedData)
        }
        onCancelAction={() => this.hideDialog()}
        style={styles.alert}
      />
    );
  }

  renderSnackBar() {
    return (
      <NativeBar
        message={this.state.snackBarMessage}
        onDismissAction={() => this.hideSnackBar()}
      />
    );
  }

  render() {
    if (!this.props.glassesRx) {
      return null;
    }
    if (!this.props.glassesRx.od || !this.props.glassesRx.os) {
      return null;
    }
    const isTyping =
      this.context.keyboardMode === 'desktop' || this.state.isTyping;

    const hasOU = this.hasVA() && this.props.glassesRx.ou !== undefined;

    return (
      <View
        style={
          this.props.style
            ? this.props.style
            : this.props.hasCurrentWear
              ? styles.boardL
              : this.state.prism && this.hasVA()
                ? styles.boardXL
                : this.state.prism || this.hasVA()
                  ? styles.boardL
                  : styles.boardM
        }>
        {this.props.title && (
          <Label
            suffix=""
            style={this.props.titleStyle}
            value={this.props.title}
            fieldId={this.props.fieldId}
          />
        )}
        {this.props.editable &&
          this.props.definition &&
          this.props.definition.name &&
          this.props.definition.name.toLowerCase() === 'final rx' && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.expiry}
                definition={getFieldDefinition('visit.expDate')}
                readonly={!this.props.editable}
                onChangeValue={(value: ?string) => {
                  this.updateGlassesRx(undefined, 'expiry', value);
                }}
                errorMessage={this.props.glassesRx.expiryError}
                testID={this.props.fieldId + '.expDate'}
              />
            </View>
          )}
        <View style={styles.centeredColumnLayout}>
          {this.props.hasCurrentWear && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.currentWear}
                definition={filterFieldDefinition(
                  this.props.definition.fields,
                  'Current wear',
                )}
                readonly={!this.props.editable}
                onChangeValue={(value: ?string) =>
                  this.updateGlassesRx(undefined, 'currentWear', value)
                }
                errorMessage={this.props.glassesRx.currentWearError}
                testID={this.props.fieldId + '.currentWear'}
              />
            </View>
          )}
          {this.props.hasCurrentWear && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.since}
                definition={filterFieldDefinition(
                  this.props.definition.fields,
                  'Since',
                )}
                readonly={!this.props.editable}
                onChangeValue={(value: ?string) =>
                  this.updateGlassesRx(undefined, 'since', value)
                }
                errorMessage={this.props.glassesRx.sinceError}
                testID={this.props.fieldId + '.since'}
              />
            </View>
          )}
          {this.props.hasLensType && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.lensType}
                definition={filterFieldDefinition(
                  this.props.definition.fields,
                  'lensType',
                )}
                readonly={!this.props.editable}
                onChangeValue={(value: ?string) =>
                  this.updateGlassesRx(undefined, 'lensType', value)
                }
                errorMessage={this.props.glassesRx.lensTypeError}
                testID={this.props.fieldId + '.lensType'}
              />
            </View>
          )}
          {this.props.hasPD && (
            <View style={styles.centeredColumnLayout}>
              <View style={styles.formRow}>
                <FormInput
                  value={this.props.glassesRx.testingCondition}
                  definition={filterFieldDefinition(
                    this.props.definition.fields,
                    'Testing Condition',
                  )}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?string) =>
                    this.updateGlassesRx(undefined, 'testingCondition', value)
                  }
                  isTyping={isTyping}
                  autoFocus={true}
                  errorMessage={this.props.glassesRx.testingConditionError}
                  testID={this.props.fieldId + '.testingCondition'}
                />
              </View>
              <View style={styles.formRow}>
                <FormInput
                  value={this.props.glassesRx.pd}
                  definition={filterFieldDefinition(
                    this.props.definition.fields,
                    'pd',
                  )}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?string) =>
                    this.updateGlassesRx(undefined, 'pd', value)
                  }
                  isTyping={isTyping}
                  autoFocus={true}
                  errorMessage={this.props.glassesRx.pdError}
                  testID={this.props.fieldId + '.pd'}
                />
              </View>
            </View>
          )}
          {this.props.hasCustomField && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.customField}
                definition={filterFieldDefinition(
                  this.props.definition.fields,
                  'customField',
                )}
                readonly={!this.props.editable}
                testID={this.props.fieldId + '.customField'}
              />
            </View>
          )}
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <View style={styles.formColumnItem}>
                <Label value=" " suffix="" />
              </View>
              <View style={styles.formColumnItem}>
                <Label value={strings.od} />
              </View>
              <View style={styles.formColumnItem}>
                <Label value={strings.os} />
              </View>
              {hasOU && (
                <View style={styles.formColumnItem}>
                  <Label value={strings.ou} />
                </View>
              )}
            </View>
            <View style={styles.formColumnFlex}>
              <View style={styles.formColumnItem}>
                <Label
                  value={formatLabel(
                    getFieldDefinition('visit.prescription.od.sph'),
                  )}
                  style={styles.formTableColumnHeaderFull}
                  suffix={''}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.od.sph}
                  definition={getFieldDefinition('visit.prescription.od.sph')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('od', 'sph', value)
                  }
                  errorMessage={this.props.glassesRx.od.sphError}
                  isTyping={isTyping}
                  autoFocus={true}
                  testID={this.props.fieldId + '.od.sph'}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.os.sph}
                  definition={getFieldDefinition('visit.prescription.os.sph')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('os', 'sph', value)
                  }
                  errorMessage={this.props.glassesRx.os.sphError}
                  isTyping={isTyping}
                  testID={this.props.fieldId + '.os.sph'}
                />
              </View>
              <View style={styles.formColumnItem} />
            </View>
            <View style={styles.formColumnFlex}>
              <View style={styles.formColumnItem}>
                <Label
                  value={formatLabel(
                    getFieldDefinition('visit.prescription.od.cyl'),
                  )}
                  style={styles.formTableColumnHeaderFull}
                  suffix={''}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.od.cyl}
                  definition={getFieldDefinition('visit.prescription.od.cyl')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('od', 'cyl', value)
                  }
                  errorMessage={this.props.glassesRx.od.cylError}
                  isTyping={isTyping}
                  testID={this.props.fieldId + '.od.cyl'}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.os.cyl}
                  definition={getFieldDefinition('visit.prescription.os.cyl')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('os', 'cyl', value)
                  }
                  errorMessage={this.props.glassesRx.os.cylError}
                  isTyping={isTyping}
                  testID={this.props.fieldId + '.os.cyl'}
                />
              </View>
              <View style={styles.formColumnItem} />
            </View>
            <View style={styles.formColumnFlex}>
              <View style={styles.formColumnItem}>
                <Label
                  value={formatLabel(
                    getFieldDefinition('visit.prescription.od.axis'),
                  )}
                  style={styles.formTableColumnHeaderFull}
                  suffix={''}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.od.axis}
                  definition={getFieldDefinition('visit.prescription.od.axis')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('od', 'axis', value)
                  }
                  errorMessage={this.props.glassesRx.od.axisError}
                  isTyping={isTyping}
                  testID={this.props.fieldId + '.od.axis'}
                />
              </View>
              <View style={styles.formColumnItem}>
                <FormInput
                  value={this.props.glassesRx.os.axis}
                  definition={getFieldDefinition('visit.prescription.os.axis')}
                  showLabel={false}
                  readonly={!this.props.editable}
                  onChangeValue={(value: ?number) =>
                    this.updateGlassesRx('os', 'axis', value)
                  }
                  errorMessage={this.props.glassesRx.os.axisError}
                  isTyping={isTyping}
                  testID={this.props.fieldId + '.os.axis'}
                />
              </View>
              <View style={styles.formColumnItem} />
            </View>
            {this.state.prism && (
              <View style={styles.formColumnFlex}>
                <View style={styles.formColumnItem}>
                  <Label
                    value={formatLabel(
                      getFieldDefinition('visit.prescription.od.prism1'),
                    )}
                    style={styles.formTableColumnHeaderFull}
                    suffix={''}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <GeneralPrismInput
                    value={this.props.glassesRx.od.prism}
                    visible={this.state.prism}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?String) =>
                      this.updatePrism('od', value)
                    }
                    testID={this.props.fieldId + '.od.prism'}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <GeneralPrismInput
                    value={this.props.glassesRx.os.prism}
                    visible={this.state.prism}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?Prism) =>
                      this.updatePrism('os', value)
                    }
                    testID={this.props.fieldId + '.os.prism'}
                  />
                </View>
                <View style={styles.formColumnItem} />
              </View>
            )}
            {this.hasVA() && (
              <View style={styles.formColumnFlex}>
                <View style={styles.formColumnItem}>
                  <Label
                    value={formatLabel(
                      getFieldDefinition('exam.VA cc.Aided acuities.DVA'),
                    )}
                    style={styles.formTableColumnHeaderFull}
                    suffix={''}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.od.va}
                    definition={getFieldDefinition(
                      'exam.VA cc.Aided acuities.DVA.OD',
                    )}
                    label={formatLabel(
                      getFieldDefinition('exam.VA cc.Aided acuities.DVA'),
                    )}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('od', 'va', value)
                    }
                    errorMessage={this.props.glassesRx.od.vaError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.od.dva'}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.os.va}
                    definition={getFieldDefinition(
                      'exam.VA cc.Aided acuities.DVA.OS',
                    )}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('os', 'va', value)
                    }
                    errorMessage={this.props.glassesRx.os.vaError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.os.dva'}
                  />
                </View>
                {hasOU && (
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.ou.va}
                      definition={getFieldDefinition(
                        'exam.VA cc.Aided acuities.DVA.OU',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('ou', 'va', value)
                      }
                      errorMessage={this.props.glassesRx.ou.vaError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.ou.dva'}
                    />
                  </View>
                )}
              </View>
            )}
            {this.props.hasAdd && (
              <View style={styles.formColumnFlex}>
                <View style={styles.formColumnItem}>
                  <Label
                    value={formatLabel(
                      getFieldDefinition('visit.prescription.od.add'),
                    )}
                    style={styles.formTableColumnHeaderFull}
                    suffix={''}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.od.add}
                    definition={getFieldDefinition('visit.prescription.od.add')}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('od', 'add', value)
                    }
                    errorMessage={this.props.glassesRx.od.addError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.od.add'}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.os.add}
                    definition={getFieldDefinition('visit.prescription.os.add')}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('os', 'add', value)
                    }
                    errorMessage={this.props.glassesRx.os.addError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.os.add'}
                  />
                </View>
                <View style={styles.formColumnItem} />
              </View>
            )}
            {this.hasNVA() && (
              <View style={styles.formColumnFlex}>
                <View style={styles.formColumnItem}>
                  <Label
                    value={formatLabel(
                      getFieldDefinition('exam.VA cc.Aided acuities.NVA'),
                    )}
                    style={styles.formTableColumnHeaderFull}
                    suffix={''}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.od.addVa}
                    definition={getFieldDefinition(
                      'exam.VA cc.Aided acuities.NVA.OD',
                    )}
                    label={formatLabel(
                      getFieldDefinition('exam.VA cc.Aided acuities.NVA'),
                    )}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('od', 'addVa', value)
                    }
                    errorMessage={this.props.glassesRx.od.addVaError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.od.nva'}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.os.addVa}
                    definition={getFieldDefinition(
                      'exam.VA cc.Aided acuities.NVA.OS',
                    )}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('os', 'addVa', value)
                    }
                    errorMessage={this.props.glassesRx.os.addVaError}
                    isTyping={isTyping}
                    testID={this.props.fieldId + '.os.nva'}
                  />
                </View>
                {hasOU && (
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.ou.addVa}
                      definition={getFieldDefinition(
                        'exam.VA cc.Aided acuities.NVA.OU',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('ou', 'addVa', value)
                      }
                      errorMessage={this.props.glassesRx.ou.addVaError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.ou.nva'}
                    />
                  </View>
                )}
              </View>
            )}
            {this.hasBvd() && (
              <View style={styles.formColumnFlex}>
                <View style={styles.formColumnItem}>
                  <Label
                    value={formatLabel(
                      getFieldDefinition('visit.prescription.od.bvd'),
                    )}
                    style={styles.formTableColumnHeaderFull}
                    suffix={''}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.od.bvd}
                    definition={getFieldDefinition('visit.prescription.od.bvd')}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('od', 'bvd', value)
                    }
                    errorMessage={this.props.glassesRx.od.bvdError}
                    isTyping={isTyping}
                    autoFocus={true}
                    testID={this.props.fieldId + '.od.bvd'}
                  />
                </View>
                <View style={styles.formColumnItem}>
                  <FormInput
                    value={this.props.glassesRx.os.bvd}
                    definition={getFieldDefinition('visit.prescription.os.bvd')}
                    showLabel={false}
                    readonly={!this.props.editable}
                    onChangeValue={(value: ?number) =>
                      this.updateGlassesRx('os', 'bvd', value)
                    }
                    errorMessage={this.props.glassesRx.os.bvdError}
                    isTyping={isTyping}
                    autoFocus={true}
                    testID={this.props.fieldId + '.os.bvd'}
                  />
                </View>
                <View style={styles.formColumnItem} />
              </View>
            )}
            {this.props.editable && (
              <View style={styles.formColumn}>
                <View style={styles.formColumnItem}>
                  <Label value=" " suffix="" />
                </View>
                <View style={styles.formColumnItemHalfHeight}>
                  <Label value=" " suffix="" />
                </View>
                <View style={styles.formColumnItem}>
                  <CopyRow onPress={this.copyOdOs} />
                </View>
              </View>
            )}
          </View>

          {this.props.editable === true && (
            <View style={styles.buttonsRowLayout}>
              {this.props.hasAdd === true && (
                <Button
                  title={formatLabel(
                    getFieldDefinition('visit.prescription.od.prism'),
                  )}
                  onPress={this.togglePrism}
                  testID={this.props.fieldId + '.prismButton'}
                />
              )}

              {this.props.onCopyToFinalRx !== undefined && (
                <Button
                  title={strings.copyToFinal}
                  onPress={() =>
                    this.props.onCopyToFinalRx(this.props.glassesRx)
                  }
                  testID={this.props.fieldId + '.copyFinalRxButton'}
                />
              )}
            </View>
          )}
          {(this.props.hasNotes === true ||
            (this.props.definition !== undefined &&
              this.props.definition.hasNotes)) && (
            <View style={styles.formRow}>
              <FormInput
                value={this.props.glassesRx.notes}
                definition={this.getRxNotesDefinition()}
                readonly={!this.props.editable}
                onChangeValue={(value: ?string) =>
                  this.updateGlassesRx(undefined, 'notes', value)
                }
                multiline={
                  this.getRxNotesDefinition()
                    ? this.getRxNotesDefinition().multiline
                    : false
                }
                errorMessage={this.props.glassesRx.notesError}
                testID={this.props.fieldId + '.notes'}
              />
            </View>
          )}
          {this.props.hasMPD && (
            <View style={styles.centeredColumnLayout}>
              <Label
                suffix=""
                style={this.props.titleStyle}
                value={strings.pd}
                fieldId={this.props.fieldId}
              />
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <View style={styles.formColumnItem}>
                    <Label value=" " suffix="" />
                  </View>
                  <View style={styles.formColumnItem}>
                    <Label value={strings.od} />
                  </View>
                  <View style={styles.formColumnItem}>
                    <Label value={strings.os} />
                  </View>
                  <View style={styles.formColumnItem}>
                    <Label value={strings.ou} />
                  </View>
                </View>

                <View style={styles.formColumnFlex}>
                  <View style={styles.formColumnItem}>
                    <Label
                      value={strings.far}
                      style={styles.formTableColumnHeaderFull}
                      suffix={''}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.od.farPD}
                      definition={getFieldDefinition(
                        'visit.prescription.od.farPD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('od', 'farPD', value)
                      }
                      errorMessage={this.props.glassesRx.od.farPDError}
                      isTyping={isTyping}
                      autoFocus={true}
                      testID={this.props.fieldId + '.od.farPD'}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.os.farPD}
                      definition={getFieldDefinition(
                        'visit.prescription.os.farPD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('os', 'farPD', value)
                      }
                      errorMessage={this.props.glassesRx.os.farPDError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.os.farPD'}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.ou.farPD}
                      definition={getFieldDefinition(
                        'visit.prescription.ou.farPD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('ou', 'farPD', value)
                      }
                      errorMessage={this.props.glassesRx.ou.farPDError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.ou.farPD'}
                    />
                  </View>
                </View>
                <View style={styles.formColumnFlex}>
                  <View style={styles.formColumnItem}>
                    <Label
                      value={strings.near}
                      style={styles.formTableColumnHeaderFull}
                      suffix={''}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.od.closePD}
                      definition={getFieldDefinition(
                        'visit.prescription.od.closePD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('od', 'closePD', value)
                      }
                      errorMessage={this.props.glassesRx.od.closePDError}
                      isTyping={isTyping}
                      autoFocus={true}
                      testID={this.props.fieldId + '.od.closePD'}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.os.closePD}
                      definition={getFieldDefinition(
                        'visit.prescription.os.closePD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('os', 'closePD', value)
                      }
                      errorMessage={this.props.glassesRx.os.closePDError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.os.closePD'}
                    />
                  </View>
                  <View style={styles.formColumnItem}>
                    <FormInput
                      value={this.props.glassesRx.ou.closePD}
                      definition={getFieldDefinition(
                        'visit.prescription.ou.closePD',
                      )}
                      showLabel={false}
                      readonly={!this.props.editable}
                      onChangeValue={(value: ?number) =>
                        this.updateGlassesRx('ou', 'closePD', value)
                      }
                      errorMessage={this.props.glassesRx.ou.closePDError}
                      isTyping={isTyping}
                      testID={this.props.fieldId + '.ou.closePD'}
                    />
                  </View>
                </View>

                {this.props.editable && (
                  <View style={styles.formColumn}>
                    <View style={styles.formColumnItem}>
                      <Label value=" " suffix="" />
                    </View>
                    <View style={styles.formColumnItemHalfHeight}>
                      <Label value=" " suffix="" />
                    </View>
                    <View style={styles.formColumnItem}>
                      <CopyRow onPress={this.copyPDOdOs} />
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        <View style={styles.groupExtraIcons}>
          {this.props.editable && this.props.definition.import && (
            <TouchableOpacity
              onPress={() => this.importData()}
              testID={this.props.fieldId + '.importButton'}>
              <ImportIcon style={styles.groupIcon} />
            </TouchableOpacity>
          )}
          {this.props.editable &&
            this.props.definition.export &&
            getConfiguration().machine.phoropter !== undefined && (
              <TouchableOpacity
                onPress={() => this.exportData()}
                testID={this.props.fieldId + '.exportButton'}>
                <ExportIcon style={styles.groupIcon} />
              </TouchableOpacity>
            )}
        </View>
        <View style={styles.groupIcons}>
          {this.props.editable && (
            <TouchableOpacity
              onPress={this.props.onClear ? this.props.onClear : this.clear}
              testID={this.props.fieldId + '.garbageIcon'}>
              <Garbage style={styles.groupIcon} />
            </TouchableOpacity>
          )}
          {this.props.editable && this.props.definition.starable && (
            <Star
              onAddFavorite={this.addGroupFavorite}
              style={styles.groupIcon}
              testID={this.props.fieldId + '.starIcon'}
            />
          )}
          {this.props.editable && this.props.onAdd && (
            <TouchableOpacity
              onPress={this.props.onAdd}
              testID={this.props.fieldId + '.addIcon'}>
              <Plus style={styles.groupIcon} />
            </TouchableOpacity>
          )}
          {this.props.editable && this.props.onPaste && (
            <TouchableOpacity
              onPress={() => this.props.onPaste(this.props.definition)}
              testID={this.props.fieldId + '.pateIcon'}>
              <Paste style={styles.groupIcon} />
            </TouchableOpacity>
          )}
          {this.props.onCopy && !this.props.onPaste && (
            <TouchableOpacity
              onPress={() => this.props.onCopy(this.props.glassesRx)}>
              <Copy style={styles.groupIcon} />
            </TouchableOpacity>
          )}
          {this.props.editable && this.props.onCopyFromFinal && (
            <TouchableOpacity
              onPress={() => this.props.onCopyFromFinal(this.props.glassesRx)}>
              <Copy style={styles.groupIcon} />
            </TouchableOpacity>
          )}
        </View>
        {this.state.importedData && this.state.showDialog && this.renderAlert()}
        {this.state.showSnackBar && this.renderSnackBar()}
      </View>
    );
  }
}

export class PatientRefractionCard extends Component {
  props: {
    patientInfo: PatientInfo,
  };
  state: {
    refractions: ?(GlassesRx[]),
  };

  constructor(props: any) {
    super(props);
    this.state = {
      refractions: getRecentRefraction(props.patientInfo.id),
    };
    this.refreshPatientInfo();
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.patientInfo === prevProps.patientInfo) {
      return;
    }
    this.setState(
      {refractions: getRecentRefraction(this.props.patientInfo.id)},
      this.refreshPatientInfo,
    );
  }

  async refreshPatientInfo(patientId: string) {
    if (this.state.refractions) {
      return;
    }
    let refractions: ?(GlassesRx[]) = getRecentRefraction(
      this.props.patientInfo.id,
    );
    if (refractions === undefined) {
      await fetchVisitHistory(this.props.patientInfo.id);
      refractions = getRecentRefraction(this.props.patientInfo.id);
    }
    this.setState({refractions});
  }

  checkUserHasAccess() {
    let hasNoAccessAtAll = true;
    this.state.refractions &&
      this.state.refractions.map(
        (refraction: GlassesRx) =>
          (hasNoAccessAtAll = hasNoAccessAtAll && refraction.noaccess),
      );
    return hasNoAccessAtAll;
  }

  render() {
    let hasNoAccess = this.checkUserHasAccess();
    return (
      <View style={styles.tabCard}>
        {(!this.state.refractions ||
          this.state.refractions.length === 0 ||
          hasNoAccess) && (
          <Text style={styles.cardTitle}>{strings.finalRx}</Text>
        )}
        {this.state.refractions &&
          this.state.refractions.length !== 0 &&
          (hasNoAccess ? (
            <NoAccess />
          ) : (
            this.state.refractions &&
            this.state.refractions.map(
              (refraction: GlassesRx, index: number) => (
                <GlassesSummary
                  showHeaders={false}
                  title={
                    strings.finalRx +
                    prefix(
                      formatDate(
                        refraction.prescriptionDate,
                        isToyear(refraction.prescriptionDate)
                          ? dateFormat
                          : farDateFormat,
                      ),
                      ' ',
                    ) +
                    prefix(refraction.doctor, ' ')
                  }
                  glassesRx={refraction}
                  showPD={false}
                  key={index}
                />
              ),
            )
          ))}
      </View>
    );
  }
}
