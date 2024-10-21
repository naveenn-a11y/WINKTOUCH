/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  View,
  Text,
} from 'react-native';
import type {
  GlassesRx,
  GlassRx,
  Prism,
} from './Types';
import {fontScale, styles} from './Styles';
import {strings} from './Strings';
import {
  NoAccess,
} from './Widgets';
import {RulerField} from './RulerField';
import { NumberField } from './NumberField';
import { TilesField } from './TilesField';
import {
  formatDegree,
  formatDiopter,
  isEmpty,
  prefix,
  postfix,
  getValue,
} from './Util';
import {
  getFieldDefinition,
  formatLabel,
  formatFieldValue,
} from './Items';
import {
  formatCode,
  formatAllCodes,
  parseCode,
} from './Codes';
import {getCachedItem} from './DataCache';
import { getExam } from './Exam';

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


