
/**
 * @flow
 */

'use strict';

import {Component} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {ModeContext} from '../src/components/Context/ModeContextProvider';
import {getCodeDefinition} from './Codes';
import {getCachedItem} from './DataCache';
import {getDoctor} from './DoctorApp';
import {
  getFieldDefinition as getExamFieldDefinition,
  getFieldValue,
  setMappedFieldValue,
} from './Exam';
import {
  Copy,
  CopyColumn,
  CopyRow,
  Garbage,
  ImportIcon,
  Plus,
  Star,
} from './Favorites';
import {isCheckboxInput, FormInput} from './Form';
import {formatFieldLabel, formatLabel} from './Items';
import {importData} from './Machine';
import {strings} from './Strings';
import {scaleStyle, styles} from './Styles';
import type {
  CodeDefinition,
  FieldDefinition,
  GroupDefinition,
  Measurement,
} from './Types';
import {formatDate, getValue, isEmpty, now, yearDateFormat} from './Util';
import {Alert, Label, NativeBar} from './Widgets';

export function hasColumns(groupDefinition: GroupDefinition): boolean {
  return (
    groupDefinition.columns !== undefined &&
    groupDefinition.columns.length > 0 &&
    groupDefinition.columns[0] !== undefined &&
    groupDefinition.columns[0].length > 0 &&
    groupDefinition.columns[0][0] !== undefined &&
    groupDefinition.columns[0][0].trim() !== ''
  );
}

export function getColumnFieldIndex(
  groupDefinition: GroupDefinition,
  fieldName: string,
): number {
  if (
    groupDefinition.columns === undefined ||
    groupDefinition.columns === null ||
    groupDefinition.columns.length === 0
  ) {
    return -1;
  }
  for (const columns: string[] of groupDefinition.columns) {
    if (columns instanceof Array) {
      for (let i: number = 0; i < columns.length; i++) {
        if (columns[i] === fieldName) {
          return i;
        }
      }
    }
  }
  return -1;
}

export function getIsVisible(item: ?any, groupDefinition: GroupDefinition): ?{} {
  const isVisible: any = groupDefinition.visible;
  if (isVisible === true || isVisible === false) {
    return isVisible;
  }

  if (isVisible?.startsWith('[') && isVisible.endsWith(']')) {
    let reverseFlag: boolean = false;
    let key: any = isVisible.substring(1, isVisible.length - 1);
    if (key.startsWith('!')) {
      key = key.substring(1, key.length);
      reverseFlag = true;
    }
    const keyIdentifier: string[] = key.split('.');
    if (keyIdentifier[0] === 'visit') {
      let visit: Visit;
      if (item.startsWith('visit-')) {
        visit = getCachedItem(item);
      } else {
        const exam: Exam = getCachedItem(item);
        visit = exam !== undefined ? getCachedItem(exam.visitId) : undefined;
      }
      const value: any =
        visit !== undefined ? visit[`${keyIdentifier[1]}`] : undefined;
      return reverseFlag ? isEmpty(value) : !isEmpty(value);
    } else {
      const exam: Exam = getCachedItem(item);
      let value: any = exam !== undefined ? getValue(exam, key) : undefined;
      const equalKey = '==';
      if (key.includes(equalKey)) {
        const subKeys: string[] = key.split(equalKey);
        const subValue: any = subKeys[1];
        const subKey: string = subKeys[0];
        value = exam !== undefined ? getValue(exam, subKey) : undefined;
        if (value === undefined) {
          const fieldName: string = subKey.substring(
            subKey.lastIndexOf('.') + 1,
          );
          if (fieldName.toLowerCase() === 'povonlineid') {
            value =
              exam !== undefined
                ? getValue(exam, 'Diagnosis.Insurer.supplierId')
                : undefined;
            let supplierCode: CodeDefinition = value
              ? getCodeDefinition('insuranceProviders', value)
              : undefined;
            if (supplierCode?.povOnlineId?.toString() === subValue) {
              value = subValue;
            } else {
              value = null;
            }
          }
        }
      }
      return reverseFlag ? isEmpty(value) : !isEmpty(value);
    }
  }

  return true;
}

export function getDefaultValue(groupDefinition: GroupDefinition, exam: ?Exam): any {
  const defaultValue: any = groupDefinition.defaultValue;
  const isDynamicValue: string =
    defaultValue && typeof defaultValue === 'string'
      ? defaultValue.startsWith('[') && defaultValue.endsWith(']')
      : false;
  if (isDynamicValue) {
    let key: any = defaultValue.substring(1, defaultValue.length - 1);
    const keyIdentifier: string[] = key.split('.');
    if (keyIdentifier[0] === 'user') {
      if (keyIdentifier[1] === 'name') {
        const doctorName: string =
          getDoctor().firstName + ' ' + getDoctor().lastName;
        return doctorName;
      } else if (keyIdentifier[1] === 'id') {
        const doctorId: string = getDoctor().id;
        return doctorId;
      }
    } else if (key === 'currentDate') {
      const dateFormat: string = groupDefinition.dateFormat
        ? groupDefinition.dateFormat
        : yearDateFormat;
      const currentDate: string = formatDate(now(), dateFormat);
      return currentDate;
    } else {
      return getFieldValue(key, exam);
    }
  } else {
    return defaultValue;
  }
}

function isRowField(
  groupDefinition: GroupDefinition,
  fieldName: string,
): boolean | number {
  if (
    groupDefinition.rows === undefined ||
    groupDefinition.rows === null ||
    groupDefinition.rows.length === 0
  ) {
    return false;
  }
  for (let row of groupDefinition.rows) {
    let index: number = row.indexOf(fieldName);
    if (index >= 0) {
      return index;
    }
  }
  return false;
}

export function getMultiValueGroup(
  cardRow: string[],
  multiValueGroups: GroupDefinitionp[],
): ?GroupDefinition {
  for (let field: string of cardRow) {
    const groupName: string = field.substring(0, field.indexOf('.'));
    if (groupName !== undefined) {
      const groupDefinition: ?GroupDefinition = multiValueGroups.find(
        (groupDefinition: GroupDefinition) =>
          groupDefinition.name === groupName,
      );
      if (groupDefinition !== undefined) {
        return groupDefinition;
      }
    }
  }
  return undefined;
}

export class GroupedForm extends Component {
  props: {
    form: {},
    definition: GroupDefinition,
    editable?: boolean,
    cloneable?: boolean,
    style?: any,
    onChangeField?: (fieldName: string, newValue: any, column: ?string) => void,
    onUpdateForm?: (groupName: string, newValue: any) => void,
    onClear?: () => void,
    onAddFavorite?: (favoriteName: string) => void,
    onAdd?: (groupValue?: {}) => void,
    onCopy?: (groupValue?: {}) => void,
    patientId: string,
    examId: string,
    enableScroll?: () => void,
    disableScroll?: () => void,
    fieldId: string,
  };

  state: {
    isTyping: boolean,
    showDialog: boolean,
    importedData: any,
    showSnackBar: boolean,
  };

  static defaultProps = {
    editable: true,
    cloneable: false,
  };
  static contextType = ModeContext;

  constructor(props: any) {
    super(props);
    this.state = {
      isTyping: false,
      showDialog: false,
      showSnackBar: false,
    };
  }

  hideDialog() {
    this.setState({showDialog: false});
  }

  showDialog(data: any) {
    this.setState({importedData: data, showDialog: true});
  }

  showSnackBar() {
    this.setState({showSnackBar: true});
  }

  hideSnackBar() {
    this.setState({showSnackBar: false});
  }

  formatColumnLabel(column: string): string {
    const columnDefinition: ?GroupDefinition | FieldDefinition = this.props.definition.fields.find(
      (columnDefinition: GroupDefinition | FieldDefinition) => columnDefinition.name === column,
    );
    return formatLabel(columnDefinition);
  }

  changeField(fieldDefinition: FieldDefinition, newValue: any, column: ?string) {
    if (fieldDefinition.mappedField) {
      const exam: Exam = getCachedItem(this.props.examId);
      setMappedFieldValue(fieldDefinition.mappedField, newValue, exam);
    }
    if (this.props.onChangeField) {
      this.props.onChangeField(fieldDefinition.name, newValue, column);
    }
  }

  getIsVisible(fieldDefinition: FieldDefinition): ?{} {
    return getIsVisible(this.props.examId, fieldDefinition);
  }

  getDefinitionDefaultValue(fieldDefinition: FieldDefinition): any {
    if (fieldDefinition.defaultValue === undefined || fieldDefinition.defaultValue === null) {
      return;
    }
    const exam: Exam = getCachedItem(this.props.examId);
    const value: string = getDefaultValue(fieldDefinition, exam);
    const isDynamicValue: string =
      fieldDefinition.defaultValue && typeof fieldDefinition.defaultValue === 'string'
        ? fieldDefinition.defaultValue.startsWith('[') && fieldDefinition.defaultValue.endsWith(']')
        : false;
    if (value && isDynamicValue && this.props.onChangeField) {
      this.props.onChangeField(fieldDefinition.name, value);
    }
    return value;
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
        onConfirmAction={(selectedData: Measurement) => this.importSelectedData(selectedData)}
        onCancelAction={() => this.hideDialog()}
        style={styles.alert}
      />
    );
  }
  renderSnackBar() {
    return <NativeBar message={strings.importDataNotFound} onDismissAction={() => this.hideSnackBar()} />;
  }

  getIsTyping() {
    const def = this.props.definition;

    if (def?.noKeyboard === true) {
      return false;
    }

    return this.context.keyboardMode === 'desktop' || (this.state.isTyping && this.props.editable);
  }

  renderField(fieldDefinition: FieldDefinition, neverMultiline?, column?: string) {
    if (fieldDefinition === undefined) {
      return (
        <View style={styles.fieldFlexContainer}>
          <Text style={styles.text} />
        </View>
      );
    }
    if (fieldDefinition.mappedField) {
      let exam: Exam = getCachedItem(this.props.examId);
      fieldDefinition = {
        ...getExamFieldDefinition(fieldDefinition.mappedField, exam),
        ...fieldDefinition,
      };
    }

    const {form} = this.props;
    let value;

    if (form) {
      if (column) {
        value = form[column]?.[fieldDefinition.name];
      } else {
        value = form[fieldDefinition.name];
      }
    } else {
      value = undefined;
    }
    value = value === undefined ? this.getDefinitionDefaultValue(fieldDefinition) : value;

    let error;

    if (form) {
      if (column) {
        error = form[column]?.[`${fieldDefinition.name}Error`];
      } else {
        error = form[`${fieldDefinition.name}Error`];
      }
    } else {
      error = undefined;
    }

    const label: string =
      formatLabel(this.props.definition) +
      (column !== undefined ? ' ' + this.formatColumnLabel(column) + ' ' : ' ') +
      formatLabel(fieldDefinition);
    const isTyping = this.getIsTyping();
    return (
      <FormInput
        value={value}
        filterValue={this.props.form}
        label={label}
        showLabel={false}
        readonly={!this.props.editable}
        definition={fieldDefinition}
        onChangeValue={(newValue: string) => this.changeField(fieldDefinition, newValue, column)}
        errorMessage={error}
        isTyping={isTyping}
        patientId={this.props.patientId}
        examId={this.props.examId}
        enableScroll={this.props.enableScroll}
        disableScroll={this.props.disableScroll}
        fieldId={this.props?.fieldId + '.' + fieldDefinition.name + (column === undefined ? '' : column)}
        testID={(!isEmpty(this.props?.fieldId) ? (this.props?.fieldId + '.') : '') + fieldDefinition.name + (column === undefined ? '' : column)}
        neverMultiline={neverMultiline}
      />
    );
  }

  renderSimpleRow(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    const label: string = formatLabel(fieldDefinition);
    if (fieldDefinition.layout) {
      return this.renderField(fieldDefinition, undefined, undefined);
    }

    const rowStyle = isCheckboxInput(fieldDefinition) ? styles.formHeadingRowForCheckbox : styles.formHeadingRow2;
    return (
      <View style={[styles.formRow, {justifyContent: 'center'}]} key={fieldDefinition.name}>
        <View>
          <View style={rowStyle}>
            <Label
              testID={`label-${fieldDefinition?.name}`}
              value={label}
              fieldId={this.props.fieldId + '.' + fieldDefinition.name}
            />
          </View>
        </View>
        {this.renderField(fieldDefinition, undefined, undefined)}
      </View>
    );
  }

  renderFieldsRow(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    let fields: any[] = [];
    const row: string[] = this.props.definition.rows.find(
      (row: string[]) => row && row.length > 0 && row[0] === fieldDefinition.name,
    );
    if (row === undefined) {
      return null;
    }
    const fieldDefinitions: FieldDefinition[] = row.map((fieldName: string) =>
      this.props.definition.fields.find((field: FieldDefinition) => field.name === fieldName),
    );
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      let label: string = formatLabel(fieldDefinition);
      const rowStyle = isCheckboxInput(fieldDefinition) ? styles.formHeadingRowForCheckbox : styles.formHeadingRow2;
      fields.push(
        <View>
          <View style={rowStyle}>
            <Label
              testID={`label-${fieldDefinition?.name}`}
              value={label}
              fieldId={this.props.fieldId + '.' + fieldDefinition?.name}
            />
          </View>
        </View>,
      );
      const neverMultiline = true;
      fields.push(this.renderField(fieldDefinition, neverMultiline, undefined));
    });
    return <View style={styles.formRow}>{fields}</View>;
  }

  hasColumns(): boolean {
    return hasColumns(this.props.definition);
  }

  copyRow(rowFields: FieldDefinition[], rowIndexFrom: number, rowIndexTo: number, columns: string[]) {
    if (this.props.form === undefined) {
      return;
    }
    const fromRowName: string = rowFields[rowIndexFrom].name;
    const toRowName: string = rowFields[rowIndexTo].name;
    columns.forEach((column) => {
      if (column === '>>') {
        return;
      }
      const value = this.props.form[column][fromRowName];
      this.props.onChangeField(toRowName, value, column);
    });
  }

  copyColumn(fromColumn: string, toColumn: string): void {
    const fieldDefinitions: FieldDefinition[] = this.props.definition.fields.find(
      (field: FieldDefinition) => field.name === fromColumn,
    ).fields;
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      const value = this.props.form[fromColumn][fieldDefinition.name];
      this.props.onChangeField(fieldDefinition.name, value, toColumn);
    });
  }

  anyColumnHeadingsVisible(fieldDefinition, definition): boolean {
    // check if all the columns have empty column labels
    // map through each column to get the columnLabel
    // const columnDef = fieldDefinition.fields.find((fieldDef) => fieldDef.name === column);
    // const columnLabel = formatLabel(columnDef);
    // append the columnLabel to columnLabels array
    // if all columnLabels have empty strings, return false
    if (definition?.columns?.length > 0) {
      const columns: string[] = definition.columns.find(
        (cols: string[]) => cols.length > 0 && cols[0] === fieldDefinition.name,
      );
      const columnLabels = [];
      columns?.forEach((column) => {
        const columnDef = definition.fields.find((fieldDef) => fieldDef.name === column);
        if (columnDef) {
          columnLabels.push(formatLabel(columnDef));
        }
      });
      return columnLabels.some((columnLabel) => columnLabel.trim().length > 0);
    }

    return true;
  }

  renderRowHeadings(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    const columnedFields: FieldDefinition[] = fieldDefinition.fields;
    let rows: any[] = [];

    if (this.anyColumnHeadingsVisible(fieldDefinition, this.props.definition)) {
      // Render the empty header for the first row
      rows.push(
        <View style={styles.formHeadingRow} key={`header-row-empty`}>
          <Label value={' '} style={styles.formTableColumnHeaderFitContent} suffix="" />
        </View>,
      );
    }

    // Render row labels
    columnedFields.forEach((field, rowIndex) => {
      const rowLabel = formatLabel(field);
      const labelId = `${this.props.fieldId}.${fieldDefinition.name}.${field.name}`;
      const suffix = rowLabel?.trim().length > 0 ? ':' : '';
      rows.push(
        <View style={styles.formHeadingRow} key={`row-heading-${rowIndex}`}>
          <Label value={rowLabel} style={styles.formTableColumnHeaderFitContent} suffix={suffix} fieldId={labelId} />
        </View>,
      );
    });

    return rows;
  }

  renderColumnData(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    const columnedFields: FieldDefinition[] = fieldDefinition.fields;
    const columns: string[] = this.props.definition.columns.find(
      (cols: string[]) => cols.length > 0 && cols[0] === fieldDefinition.name,
    );

    let rows: any[] = [];

    // Render header row
    if (this.anyColumnHeadingsVisible(fieldDefinition, this.props.definition)) {
      rows.push(
        <View style={styles.formRow} key={`header-row`}>
          {columns.map((column, index) => {
            if (column === '>>') {
                return this.props.editable ? this.renderColumnCopyAlt(fieldDefinition, index, columns, false) : null;
            }
            const columnDef =  this.props.definition.fields.find((fieldDef) => fieldDef.name === column);
            if (columnDef) {
              const columnLabel = formatLabel(columnDef);
              return (
                <Label
                  value={columnLabel}
                  style={styles.formTableColumnHeader}
                  suffix=""
                  fieldId={`${this.props.fieldId}.${columnDef.name}`}
                  key={`header-${index}`}
                />
              );
            } else {
              return this.props.editable ? (
                <View style={styles.formTableColumnHeaderSmall} key={`header-${index}`} />
              ) : null;
            }
          })}
        </View>,
      );
    }

    // Render data rows
    columnedFields.forEach((field, rowIndex) => {
      const neverMultiline = true;
      rows.push(
        <View style={styles.formRow} key={`row-${rowIndex}`}>
          {columns.map((column, columnIndex) => {
            const columnDef = this.props.definition.fields.find((fieldDef) => fieldDef.name === column);
            if (columnDef) {
              const rowField = columnedFields[rowIndex] ?? null;
              // get the field definion from columnDef.fields where the name matches the rowField.name
              const fieldDef = columnDef.fields.find((fieldDef) => fieldDef.name === rowField?.name);
              const validField = fieldDef !== undefined;
              return validField ? (
                this.renderField(fieldDef, neverMultiline, column)
              ) : (
                <View style={styles.formElement} key={`emptyRowData-${rowField?.name}-${rowIndex}`}>
                  <View style={styles.formTableColumnHeaderFitContent}>
                    <Text> </Text>
                  </View>
                </View>
              );
            }

            if (this.props.editable) {
              if (columnIndex === columns.length - 1 && rowIndex < columnedFields.length - 1) {
                return (
                  <View style={styles.contentFitColumn} key={`copyRowContainer-${rowIndex}`}>
                    <View style={styles.emptyButtonSpaceAlt}>
                      <CopyRow
                        onPress={() => this.copyRow(columnedFields, rowIndex, rowIndex + 1, columns)}
                        key={`copyRow-${rowIndex}`}
                      />
                    </View>
                  </View>
                );
              } else {
                return (
                  <View style={styles.contentFitColumn} key={`copyRowContainer-${rowIndex}`}>
                    {this.props.editable && <View style={styles.emptyButtonSpaceAlt} />}
                  </View>
                );
              }
            }
          })}
        </View>,
      );
    });

    return rows;
  }

  renderColumnedRowsWithHeader(fieldDefinition: FieldDefinition) {
    const headings = this.renderRowHeadings(fieldDefinition);
    const data = this.renderColumnData(fieldDefinition);

    return (
      <View style={styles.formRowContainer} key={`container-${fieldDefinition.name}`}>
        <View style={styles.formRowHeadingsContainer}>{headings}</View>
        <View style={styles.formDataContainer}>{data}</View>
      </View>
    );
  }

  renderColumnLabelsAlt(refColumnDefinition: GroupDefinition) {
    return (
      <View style={styles.formColumn}>
        {refColumnDefinition?.fields && (
          <>
            <View style={styles.formColumnItem}>
              <Label value=" " suffix="" />
            </View>
            {refColumnDefinition.fields.map((fd: FieldDefinition) => (
              <View style={styles.formColumnItem}>
                <Label value={formatLabel(fd)} fieldId={this.props.fieldId + '.' + fd.name} />
              </View>
            ))}
          </>
        )}
      </View>
    );
  }

  renderColumnCopyAlt(refColumnDefinition: GroupDefinition, colInd: number, columns: string[], renderFields: boolean = true) {
    return (
      <View style={styles.FormColumnTop}>
        <View style={styles.formColumnItem}>
          <View style={styles.copyColumnContainer}>
            <CopyColumn onPress={() => this.copyColumn(columns[colInd - 1], columns[colInd + 1])} />
          </View>
        </View>

        {renderFields && refColumnDefinition?.fields?.map((fd, ind) => (
          <View style={styles.formColumnItem} key={fd?.label}/>
        ))}
      </View>
    );
  }

  renderRowCopyAlt(refColumnDefinition: GroupDefinition, columns: string[]) {
    return (
      <View style={styles.FormColumnTop}>
        {refColumnDefinition?.fields && (
          <>
            <View style={styles.formColumnItem}>
              <Label value=" " suffix="" />
            </View>
            <View style={styles.formColumnItemHalfHeight}>
              <Label value=" " suffix="" />
            </View>
            {refColumnDefinition.fields.map((fd: FieldDefinition, ind) =>
              ind < refColumnDefinition.fields.length - 1 ? (
                <View style={styles.formColumnItem}>
                  {this.props.editable && (
                    <CopyRow onPress={() => this.copyRow(refColumnDefinition.fields, ind, ind + 1, columns)} />
                  )}
                </View>
              ) : (
                <View style={styles.formColumnItem} />
              ),
            )}
          </>
        )}
      </View>
    );
  }

  renderColumnAlt(columnDefinition: GroupDefinition, refColumnDefinition: GroupDefinition) {
    const neverMultiline = true;
    return (
      <View style={styles.formColumnFlex}>
        {columnDefinition && (
          <View style={styles.formColumnItem}>
            <Label
              value={formatLabel(columnDefinition)}
              style={styles.formTableColumnHeader}
              suffix={''}
              fieldId={this.props.fieldId + '.' + columnDefinition.name}
            />
          </View>
        )}
        {refColumnDefinition?.fields?.map((reffd: FieldDefinition, ind) => {
          const fd = columnDefinition?.fields.find((f) => f.name === reffd.name);
          return (
            <View style={styles.formColumnItem}>
              {fd ? this.renderField(fd, neverMultiline, columnDefinition.name) : null}
            </View>
          );
        })}
      </View>
    );
  }

  renderColumnedRowsAlt(refColumnDefinition: GroupDefinition) {
    if (!this.getIsVisible(refColumnDefinition)) {
      return null;
    }

    const columns = this.props.definition.columns.find(
      (columns) => columns.length > 0 && columns[0] === refColumnDefinition.name,
    );

    return (
      <View style={styles.formRow}>
        {this.renderColumnLabelsAlt(refColumnDefinition)}
        {columns.map((column, index) => {
          const columnDefinition = this.props.definition.fields.find(
            (fieldDefinition) => fieldDefinition.name === column,
          );

          if (columnDefinition) {
            return this.renderColumnAlt(columnDefinition, refColumnDefinition);
          }

          if (column === '>>') {
            if (index < columns.length - 1 && index > 0) {
              return this.props.editable ? this.renderColumnCopyAlt(refColumnDefinition, index, columns) : null;
            }
            if (index === columns.length - 1) {
              return this.renderRowCopyAlt(refColumnDefinition, columns);
            }
          }

          return null; // Added to ensure all code paths return a value
        })}
      </View>
    );
  }

  renderAsRows(groupDefinition: GroupDefinition, fieldDefinition: FieldDefinition): boolean {
    if (groupDefinition.name === 'Pupils' && fieldDefinition.name === 'OD') {
      return true;
    }

    if (fieldDefinition.name === 'OD' || fieldDefinition.name === 'OS') {
      return false;
    }

    return true;
  }

  renderRows() {
    let rows: any[] = [];
    const groupDefinition: GroupDefinition = this.props.definition;

    if (groupDefinition.fields) {
      for (const fieldDefinition of groupDefinition.fields) {
        const columnFieldIndex = getColumnFieldIndex(groupDefinition, fieldDefinition.name);
        if (columnFieldIndex === 0) {
          if (this.renderAsRows(groupDefinition, fieldDefinition)) {
            rows.push(this.renderColumnedRowsWithHeader(fieldDefinition));
          } else {
            rows.push(this.renderColumnedRowsAlt(fieldDefinition));
          }
        } else if (columnFieldIndex < 0) {
          const rowField = isRowField(groupDefinition, fieldDefinition.name);
          rows.push(rowField !== false ? this.renderFieldsRow(fieldDefinition) : this.renderSimpleRow(fieldDefinition));
        }
      }
    }
    return rows;
  }

  importSelectedData(measurement: Measurement) {
    if (measurement.data) {
      if (this.props.onAdd && measurement.data instanceof Array) {
        if (measurement.data.length > 0) {
          let endIndex = this.props.definition && this.props.definition.importFirstIndexOnly ? 0 : -1;
          this.props.onUpdateForm(this.props.definition.name, measurement.data.slice(endIndex)[0]);
          let groupValues: {}[] = measurement.data.slice(0, endIndex).reverse();
          groupValues.forEach((groupValue: {}) => this.props.onAdd(groupValue));
        }
      } else {
        this.props.onUpdateForm(this.props.definition.name, measurement.data);
      }
    }
    this.hideDialog();
  }

  async importData() {
    if (!this.props.onUpdateForm) {
      return;
    }
    let measurement: Measurement | Measurement[] = await importData(this.props.definition.import, this.props.examId);
    if (measurement === undefined || measurement === null) {
      this.showSnackBar();
    }
    if (Array.isArray(measurement)) {
      this.showDialog(measurement);
    } else if (measurement?.data) {
      const {onAdd, onUpdateForm, definition} = this.props;
      if (onAdd && Array.isArray(measurement.data)) {
        if (measurement.data.length > 0) {
          onUpdateForm(definition.name, measurement.data.slice(-1)[0]);
          const groupValues = measurement.data.slice(0, -1).reverse();
          groupValues.forEach((groupValue) => onAdd(groupValue));
        }
      } else {
        onUpdateForm(definition.name, measurement.data);
      }
    }
  }

  renderCopyIcon() {
    return (
      this.props.onCopy &&
      this.props.definition.clone && (
        <TouchableOpacity onPress={() => this.props.onCopy({...this.props?.form})} testID={this.props.fieldId + '.copyIcon'}>
          <Copy style={styles.groupIcon} />
        </TouchableOpacity>
      )
    );
  }

  renderIcons() {
    if (this.props.cloneable && this.props.definition.clone) {
      return <View style={styles.groupIcons}>{this.renderCopyIcon()}</View>;
    }
    if (
      !this.props.editable ||
      (!this.props.onAddFavorite && !this.props.onClear && !this.props.definition.keyboardEnabled)
    ) {
      return null;
    }
    return [
      <View style={styles.groupIcons}>
        {this.props.onClear && (
          <TouchableOpacity onPress={this.props.onClear} testID={this.props.fieldId + '.garbageIcon'}>
            <Garbage style={styles.groupIcon} />
          </TouchableOpacity>
        )}
        {this.props.onAdd && (
          <TouchableOpacity onPress={() => this.props.onAdd()} testID={this.props.fieldId + '.plusIcon'}>
            <Plus style={styles.groupIcon} />
          </TouchableOpacity>
        )}
        {this.renderCopyIcon()}
        {this.props.onAddFavorite && (
          <Star
            onAddFavorite={this.props.onAddFavorite}
            style={styles.groupIcon}
            testID={this.props.fieldId + '.starIcon'}
          />
        )}
      </View>,
      <View style={styles.groupExtraIcons}>
        {this.props.editable && this.props.definition.import && (
          <TouchableOpacity onPress={() => this.importData()} testID={this.props.fieldId + '.importIcon'}>
            <ImportIcon style={styles.groupIcon} />
          </TouchableOpacity>
        )}
      </View>,
    ];
  }

  render() {
    const {style, definition} = this.props;
    let boardStyle = styles.board;

    if (style) {
      boardStyle = style;
    } else if (definition.layout) {
      boardStyle = scaleStyle(definition.layout);
    } else if (definition.size) {
      boardStyle = styles['board' + definition.size];
    }

    return (
      <View style={boardStyle} testID="grouped-form">
        <Label
          style={styles.sectionTitle}
          suffix=""
          value={formatFieldLabel(this.props.definition, this.props.form)}
          fieldId={this.props.fieldId}
        />
        {this.renderRows()}
        {this.renderIcons()}
        {this.state.importedData && this.state.showDialog && this.renderAlert()}
        {this.state.showSnackBar && this.renderSnackBar()}
      </View>
    );
  }
}