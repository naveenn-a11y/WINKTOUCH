/**
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import type {GlassesRx, Patient, Exam, GroupDefinition, Prism, Visit, Measurement, FieldDefinition} from './Types';
import {styles} from './Styles';
import {strings} from './Strings';
import {Button, Label, NativeBar, Alert} from './Widgets';
import {deepClone, isEmpty, formatDate, dateFormat, now, jsonDateTimeFormat} from './Util';
import {FormInput} from './Form';
import {getFieldDefinition, filterFieldDefinition, formatLabel} from './Items';
import {getCodeDefinition} from './Codes';
import {CopyRow, Garbage, Plus, Copy, ImportIcon, ExportIcon, Paste, Star} from './Favorites';
import {importData, exportData} from './Machine';
import {getCachedItem} from './DataCache';
import {getConfiguration} from './Configuration';
import {getPatient} from './Exam';
import {ModeContext} from '../src/components/Context/ModeContextProvider';
import {clearRefraction, hasBvd, hasPrism, GeneralPrismInput, getKeratometry, getLensometry} from './Refraction';

function clearPd(glassesRx: GlassesRx) {
  glassesRx.od.closePD = undefined;
  glassesRx.od.farPD = undefined;
  glassesRx.os.closePD = undefined;
  glassesRx.os.farPD = undefined;
  glassesRx.ou.closePD = undefined;
  glassesRx.ou.farPD = undefined;
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

  copyOdOs = (props): void => {
    let {closePD, farPD, ...glassesRx} = props.glassesRx.od;
    let newGlassesRx: GlassesRx = props.glassesRx;
    newGlassesRx.os = {
      closePD: newGlassesRx.os.closePD,
      farPD: newGlassesRx.os.farPD,
      ...glassesRx,
    };
    if (props.onChangeGlassesRx) {
      props.onChangeGlassesRx(newGlassesRx);
    }
  };

  copyPDOdOs = (props): void => {
    let {closePD, farPD, ...glassesRx} = props.glassesRx.od;
    let newGlassesRx: GlassesRx = props.glassesRx;
    newGlassesRx.os = {
      ...newGlassesRx.os,
      closePD,
      farPD,
    };
    if (props.onChangeGlassesRx) {
      props.onChangeGlassesRx(glassesRx);
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
        await fetch('http://' + machineDefinition.ip + ':80/m'); // NOSONAR
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

  renderIcon(condition, onPress, IconComponent, testID) {
    if (!condition) return null;
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <IconComponent style={styles.groupIcon} />
      </TouchableOpacity>
    );
  };

  renderLabel(props) {
    if (!props.title) return null;
    return (
      <Label
        suffix=""
        style={props.titleStyle}
        value={props.title}
        fieldId={props.fieldId}
      />
    );
  };

  renderFinalRxInput(props) {
    if (
      !props.editable ||
      !props.definition ||
      !props.definition.name ||
      props.definition.name.toLowerCase() !== 'final rx'
    ) return null;

    return (
      <View style={styles.formRow}>
        <FormInput
          value={props.glassesRx.expiry}
          definition={getFieldDefinition('visit.expDate')}
          readonly={!props.editable}
          onChangeValue={(value: ?string) => {
            this.updateGlassesRx(undefined, 'expiry', value);
          }}
          errorMessage={props.glassesRx.expiryError}
          testID={`${props.fieldId}.expDate`}
        />
      </View>
    );
  };

  determineStyle(props, state) {
    if (props.style) return props.style;
    if (props.hasCurrentWear) return styles.boardL;
    if (state.prism && this.hasVA()) return styles.boardXL;
    if (state.prism || this.hasVA()) return styles.boardL;
    return styles.boardM;
  };

  renderFormInput(props, field, label, isTyping = false, autoFocus = false) {
    return (
      <View style={styles.formRow} key={field}>
        <FormInput
          value={props.glassesRx[field]}
          definition={filterFieldDefinition(props.definition.fields, label)}
          readonly={!props.editable}
          onChangeValue={(value) => this.updateGlassesRx(undefined, field, value)}
          errorMessage={props.glassesRx[`${field}Error`]}
          isTyping={isTyping}
          autoFocus={autoFocus}
          testID={`${props.fieldId}.${field}`}
        />
      </View>
    )
  };

  renderFormInputAlt(props, field, label = null, options = {}) {
    const { isTyping = false, autoFocus = false, definition = null } = options;
    const fieldDefinition = definition || filterFieldDefinition(props.definition.fields, label);

    return (
      <View style={styles.formRow} key={field}>
        <FormInput
          value={props.glassesRx[field]}
          definition={fieldDefinition}
          readonly={!props.editable}
          onChangeValue={(value) => this.updateGlassesRx(undefined, field, value)}
          errorMessage={props.glassesRx[`${field}Error`]}
          isTyping={isTyping}
          autoFocus={autoFocus}
          testID={`${props.fieldId}.${field}`}
        />
      </View>
    );
  };

  renderButton(condition, title, onPress, testID) {
    if (!condition) return null;
    return (
      <Button
        title={title}
        onPress={onPress}
        testID={testID}
      />
    );
  };

  renderNotesInput(props) {
    if (!props.hasNotes && !(props.definition && props.definition.hasNotes)) {
      return null;
    }

    const rxNotesDefinition = this.getRxNotesDefinition();

    return (
      <View style={styles.formRow}>
        <FormInput
          value={props.glassesRx.notes}
          definition={rxNotesDefinition}
          readonly={!props.editable}
          onChangeValue={(value) => this.updateGlassesRx(undefined, 'notes', value)}
          multiline={rxNotesDefinition ? rxNotesDefinition.multiline : false}
          errorMessage={props.glassesRx.notesError}
          testID={`${props.fieldId}.notes`}
        />
      </View>
    );
  }

  createColumn(props, eye, field, definition, isPrism, isVisible, errMsg) {
    return {
      value: props.glassesRx?.[eye]?.[field] ?? '',
      definition: getFieldDefinition(definition),
      onChange: (value: ?number) => this.updateGlassesRx(eye, field, value),
      errorMessage: errMsg,
      testID: `${props.fieldId}.${eye}.${field}`,
      visible: isVisible,
      eye,
      isPrism,
    }
  };

  renderOdOsOuSection(props, state) {
    const isTyping =
    this.context.keyboardMode === 'desktop' || state.isTyping;

    const hasOU = this.hasVA() && props.glassesRx.ou !== undefined;

    const glassesColumns = [
      { label: formatLabel(getFieldDefinition('visit.prescription.od.sph')), visible: true, isPrism: false},
      { label: formatLabel(getFieldDefinition('visit.prescription.od.cyl')), visible: true, isPrism: false},
      { label: formatLabel(getFieldDefinition('visit.prescription.od.axis')), visible: true, isPrism: false},
      { label: formatLabel(getFieldDefinition('visit.prescription.od.prism1')), visible: state.prism, isPrism: true},
      { label: formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.DVA')), visible: this.hasVA(), isPrism: false},
      { label: formatLabel(getFieldDefinition('visit.prescription.od.add')), visible: props.hasAdd, isPrism: false},
      { label: formatLabel(getFieldDefinition('exam.VA cc.Aided acuities.NVA')), visible: this.hasNVA(), isPrism: false},
      { label: formatLabel(getFieldDefinition('visit.prescription.od.bvd')), visible: this.hasBvd(), isPrism: false},
    ];

    const glassesRows = [
      {
        label: 'OD',
        visible: true,
        allowCopy: true,
        columns: [
          this.createColumn(props, 'od', 'sph', 'visit.prescription.od.sph', false, true, props.glassesRx?.od?.sphError ?? ''),
          this.createColumn(props, 'od', 'cyl', 'visit.prescription.od.cyl', false, true, props.glassesRx?.od?.cylError ?? ''),
          this.createColumn(props, 'od', 'axis', 'visit.prescription.od.axis', false, true, props.glassesRx?.od?.axisError ?? ''),
          this.createColumn(props, 'od', 'prism', 'visit.prescription.od.prism', true, state.prism, props.glassesRx?.od?.prismError ?? ''),
          this.createColumn(props, 'od', 'va', 'exam.VA cc.Aided acuities.DVA.OD', false, this.hasVA(), props.glassesRx?.od?.vaError ?? ''),
          this.createColumn(props, 'od', 'add', 'visit.prescription.od.add', false, props.hasAdd, props.glassesRx?.od?.addError ?? ''),
          this.createColumn(props, 'od', 'addVa', 'exam.VA cc.Aided acuities.NVA.OD', false, this.hasNVA(), props.glassesRx?.od?.addVaError ?? ''),
          this.createColumn(props, 'od', 'bvd', 'visit.prescription.od.bvd', false, this.hasBvd(), props.glassesRx?.od?.bvdError ?? '')
        ],
      },
      {
        label: 'OS',
        visible: true,
        allowCopy: false,
        columns: [
          this.createColumn(props, 'os', 'sph', 'visit.prescription.os.sph', false, true, props.glassesRx?.os?.sphError ?? ''),
          this.createColumn(props, 'os', 'cyl', 'visit.prescription.os.cyl', false, true, props.glassesRx?.os?.cylError ?? ''),
          this.createColumn(props, 'os', 'axis', 'visit.prescription.os.axis', false, true, props.glassesRx?.os?.axisError ?? ''),
          this.createColumn(props, 'os', 'prism', 'visit.prescription.os.prism', true, state.prism, props.glassesRx?.os?.prismError ?? ''),
          this.createColumn(props, 'os', 'va', 'exam.VA cc.Aided acuities.DVA.OS', false, this.hasVA(), props.glassesRx?.os?.vaError ?? ''),
          this.createColumn(props, 'os', 'add', 'visit.prescription.os.add', false, props.hasAdd, props.glassesRx?.os?.addError ?? ''),
          this.createColumn(props, 'os', 'addVa', 'exam.VA cc.Aided acuities.NVA.OS', false, this.hasNVA(), props.glassesRx?.os?.addVaError ?? ''),
          this.createColumn(props, 'os', 'bvd', 'visit.prescription.os.bvd', false, this.hasBvd(), props.glassesRx?.os?.bvdError ?? '')
        ],
      },
      {
        label: 'OU',
        visible: hasOU,
        allowCopy: false,
        columns: [
          { visible: true, placeholder: true, isPrism: false },
          { visible: true, placeholder: true, isPrism: false },
          { visible: true, placeholder: true, isPrism: false },
          { visible: state.prism, placeholder: true, isPrism: true },
          this.createColumn(props, 'ou', 'va', 'exam.VA cc.Aided acuities.DVA.OU', false, this.hasVA(), props.glassesRx?.ou?.vaError ?? ''),
          { visible: props.hasAdd, placeholder: true, isPrism: false },
          this.createColumn(props, 'ou', 'addVa', 'exam.VA cc.Aided acuities.NVA.OU', false, this.hasNVA(), props.glassesRx?.ou?.addVaError ?? ''),
          { visible: this.hasBvd(), placeholder: true, isPrism: false }
        ],
      },
    ];

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.contentFitColumn}>
            <Label value=" " suffix="" />
          </View>
          {glassesColumns
            .filter((column) => column.visible)
            .map((column, index) => (
              <View style={column.isPrism ? styles.flexPrismColumn : styles.flexColumn} key={index}>
                <Label
                  value={column.label}
                  style={column.isPrism ? styles.formTablePrismColumnHeader : styles.formTableColumnHeader}
                  suffix={''}
                />
              </View>
            ))}
          {props.editable && <View style={styles.emptyButtonSpaceWide} />}
        </View>

        {glassesRows.map(
          (row, index) =>
            row.visible && (
              <View style={styles.row} key={index}>
                <View style={styles.contentFitColumn}>
                  <Label value={row.label} />
                </View>
                {row.columns
                  .filter((column) => column.visible)
                  .map((column, idx) => (
                    <View style={column.isPrism ? styles.flexPrismColumn : styles.flexColumn} key={column.testID}>
                      {!column.placeholder && !column.isPrism && (
                        <FormInput
                          value={column.value}
                          definition={column.definition}
                          showLabel={false}
                          readonly={!this.props.editable}
                          onChangeValue={column.onChange}
                          errorMessage={column.errorMessage}
                          isTyping={isTyping}
                          autoFocus={false}
                          testID={column.testID}
                        />
                      )}
                      {!column.placeholder && column.isPrism && (
                        <GeneralPrismInput
                          value={column.value}
                          visible
                          showLabel={false}
                          readonly={!this.props.editable}
                          onChangeValue={(value: ?String) => this.updatePrism(column.eye, value)}
                          testID={column.testID}
                        />
                      )}
                      {/* if column.placeholder, add an empty view that takes up full width */}
                      {column.placeholder && <View style={styles.placeholderElement} />}
                    </View>
                  ))}
                {props.editable && (
                  <View style={styles.contentFitColumn}>
                    <View style={styles.emptyButtonSpace}>
                      {row.allowCopy ? <CopyRow onPress={() => this.copyOdOs(props)} /> : null}
                    </View>
                  </View>
                )}
              </View>
            ),
        )}
      </View>
    );
  }

  renderPdSection(props, state) {
    if (props.hasPD === undefined) return null;
    if (props.hasPD === null) return null;
    if (props.hasPD === false) return null;

    const isTyping =
    this.context.keyboardMode === 'desktop' || state.isTyping;

    const pdColumns = [
      { label: strings.far, visible: true},
      { label: strings.near, visible: true},
    ];

    const pdRows = [
      {
        label: 'OD',
        visible: true,
        allowCopy: true,
        columns: [
          this.createColumn(props, 'od', 'farPD', 'visit.prescription.od.farPD', false, true, props.glassesRx?.od?.farPDError ?? ''),
          this.createColumn(props, 'od', 'closePD', 'visit.prescription.od.closePD', false, true, props.glassesRx?.od?.closePDError ?? '')
        ],
      },
      {
        label: 'OS',
        visible: true,
        allowCopy: false,
        columns: [
          this.createColumn(props, 'os', 'farPD', 'visit.prescription.os.farPD', false, true, props.glassesRx?.os?.farPDError ?? ''),
          this.createColumn(props, 'os', 'closePD', 'visit.prescription.os.closePD', false, true, props.glassesRx?.os?.closePDError ?? '')
        ],
      },
      {
        label: 'OU',
        visible: true,
        allowCopy: false,
        columns: [
          this.createColumn(props, 'ou', 'farPD', 'visit.prescription.ou.farPD', false, true, props.glassesRx?.ou?.farPDError ?? ''),
          this.createColumn(props, 'ou', 'closePD', 'visit.prescription.ou.closePD', false, true, props.glassesRx?.ou?.closePDError ?? '')
        ],
      },
    ];

    return (
      <View style={styles.container}>
        <Label suffix="" style={this.props.titleStyle} value={strings.pd} fieldId={this.props.fieldId} />
        <View style={styles.row}>
          <View style={styles.contentFitColumn}>
            <Label value=" " suffix="" />
          </View>
          {pdColumns
            .filter((column) => column.visible)
            .map((column, index) => (
              <View style={styles.flexColumn} key={index}>
                <Label value={column.label} style={styles.formTableColumnHeader} suffix={''} />
              </View>
            ))}
          <View style={styles.emptyButtonSpace} />
        </View>

        {pdRows.map(
          (row, index) =>
            row.visible && (
              <View style={styles.row} key={index}>
                <View style={styles.contentFitColumn}>
                  <Label value={row.label} />
                </View>
                {row.columns
                  .filter((column) => column.visible)
                  .map((column, idx) => (
                    <View style={styles.flexColumn} key={column.testID}>
                      {!column.placeholder && !column.isPrism && (
                        <FormInput
                          value={column.value}
                          definition={column.definition}
                          showLabel={false}
                          readonly={!this.props.editable}
                          onChangeValue={column.onChange}
                          errorMessage={column.errorMessage}
                          isTyping={isTyping}
                          autoFocus={false}
                          testID={column.testID}
                        />
                      )}
                      {!column.placeholder && column.isPrism && (
                        <GeneralPrismInput
                          value={column.value}
                          visible
                          showLabel={false}
                          readonly={!this.props.editable}
                          onChangeValue={(value: ?String) => this.updatePrism(column.eye, value)}
                          testID={column.testID}
                        />
                      )}
                      {/* if column.placeholder, add an empty view that takes up full width */}
                      {column.placeholder && <View style={styles.placeholderElement} />}
                    </View>
                  ))}
                {props.editable && (
                  <View style={styles.contentFitColumn}>
                    <View style={styles.emptyButtonSpace}>
                      {row.allowCopy ? <CopyRow onPress={() => this.copyPDOdOs(props)} /> : null}
                    </View>
                  </View>
                )}
              </View>
            ),
        )}
      </View>
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
      <View style={this.determineStyle(this.props, this.state)}>
        {this.renderLabel(this.props)}
        {this.renderFinalRxInput(this.props)}

        <View style={styles.centeredColumnLayout}>
          {this.props.hasCurrentWear && (
            this.renderFormInputAlt(this.props, 'currentWear', 'Current wear')
          )}
          {this.props.hasCurrentWear && this.renderFormInput(this.props, 'since', 'Since')}
          {this.props.hasLensType && this.renderFormInput(this.props, 'lensType', 'lensType')}
          {this.props.hasPD && (
            <View style={styles.centeredColumnLayout}>
              {this.renderFormInput(this.props, 'testingCondition', 'Testing Condition', isTyping, false)}
              {this.renderFormInput(this.props, 'pd', 'pd', isTyping, false)}
            </View>
          )}
          {this.props.hasCustomField && this.renderFormInput(this.props, 'customField', 'customField')}

          {this.renderOdOsOuSection(this.props, this.state)}

          {this.props.editable && (
            <View style={styles.buttonsRowLayout}>
              {this.renderButton(this.props.hasAdd, formatLabel(getFieldDefinition('visit.prescription.od.prism')), this.togglePrism, `${this.props.fieldId}.prismButton`)}
              {this.renderButton(this.props.onCopyToFinalRx, strings.copyToFinal, () => this.props.onCopyToFinalRx(this.props.glassesRx), `${this.props.fieldId}.copyFinalRxButton`)}
            </View>
          )}

          {this.renderNotesInput(this.props)}

          {this.renderPdSection(this.props, this.state)}
        </View>

        <View style={styles.groupExtraIcons}>
          {this.renderIcon(
            this.props.editable && this.props.definition.import,
            () => this.importData(),
            ImportIcon,
            `${this.props.fieldId}.importButton`
          )}
          {this.renderIcon(
            this.props.editable && this.props.definition.export && getConfiguration().machine.phoropter !== undefined,
            () => this.exportData(),
            ExportIcon,
            `${this.props.fieldId}.exportButton`
          )}
        </View>

        <View style={styles.groupIcons}>
          {this.renderIcon(this.props.editable, this.props.onClear ? this.props.onClear : this.clear, Garbage, `${this.props.fieldId}.garbageIcon`)}
          {this.props.editable && this.props.definition.starable && (
            <Star
              onAddFavorite={this.addGroupFavorite}
              style={styles.groupIcon}
              testID={`${this.props.fieldId}.starIcon`}
            />
          )}
          {this.renderIcon(this.props.editable && this.props.onAdd, this.props.onAdd, Plus, `${this.props.fieldId}.addIcon`)}
          {this.renderIcon(this.props.editable && this.props.onPaste, () => this.props.onPaste(this.props.definition), Paste, `${this.props.fieldId}.pasteIcon`)}
          {this.renderIcon(this.props.onCopy && !this.props.onPaste, () => this.props.onCopy(this.props.glassesRx), Copy)}
          {this.renderIcon(this.props.editable && this.props.onCopyFromFinal, () => this.props.onCopyFromFinal(this.props.glassesRx), Copy)}
        </View>

        {this.state.importedData && this.state.showDialog && this.renderAlert()}
        {this.state.showSnackBar && this.renderSnackBar()}
      </View>
    );
  }
}
