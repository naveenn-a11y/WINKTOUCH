/**
 * @flow
 */

'use strict';

import React, {Component, PureComponent} from 'react';
import {View, Text, Button, TouchableOpacity, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {
  FieldDefinition,
  GroupDefinition,
  FieldDefinitions,
  ExamPredefinedValue,
  GlassesRx,
  Measurement,
  CodeDefinition,
} from './Types';
import {strings} from './Strings';
import {styles, scaleStyle, fontScale, isWeb} from './Styles';
import {FloatingButton, Alert} from './Widgets';
import {FormTextInput, FormRow, FormInput} from './Form';
import {
  deepClone,
  deepAssign,
  isEmpty,
  cleanUpArray,
  getValue,
  formatDate,
  now,
  jsonDateTimeFormat,
  yearDateFormat,
} from './Util';
import {formatAllCodes, getCodeDefinition} from './Codes';
import {getCachedItem} from './DataCache';
import {
  Favorites,
  Star,
  Garbage,
  Plus,
  PaperClip,
  DrawingIcon,
  CopyRow,
  CopyColumn,
  ImportIcon,
  Copy,
} from './Favorites';
import {getConfiguration} from './Configuration';
import {importData} from './Machine';
import {
  GlassesDetail,
  GlassesSummary,
  newRefraction,
  clearRefraction,
  initRefraction,
} from './Refraction';
import {
  getFieldDefinition as getExamFieldDefinition,
  getFieldValue as getExamFieldValue,
  setMappedFieldValue,
} from './Exam';
import {CheckButton, Label, NativeBar} from './Widgets';
import {
  formatLabel,
  formatFieldValue,
  getFieldDefinition,
  formatFieldLabel,
} from './Items';

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
import {ModeContext} from '../src/components/Context/ModeContextProvider';
import {getDoctor} from './DoctorApp';

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

function getIsVisible(item: ?any, groupDefinition: GroupDefinition): ?{} {
  const isVisible: any = groupDefinition.visible;
  if (isVisible === true || isVisible === false) {
    return isVisible;
  }

  if (
    isVisible != undefined &&
    isVisible.startsWith('[') &&
    isVisible.endsWith(']')
  ) {
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
            if (
              supplierCode != null &&
              supplierCode.povOnlineId != null &&
              supplierCode.povOnlineId.toString() === subValue
            ) {
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

function getDefaultValue(groupDefinition: GroupDefinition): any {
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

function getMultiValueGroup(
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

export function addGroupItem(
  exam: Exam,
  groupDefinition: GroupDefinition,
  groupValue: ?{},
  isNew: ?boolean = false,
  childValue: ?{},
) {
  let values = exam[exam.definition.name][groupDefinition.name];
  if (values instanceof Array === false) {
    values = [values];
  } //auto convert old style exams to be nice
  if (
    groupDefinition.maxLength !== undefined &&
    values.length >= groupDefinition.maxLength
  ) {
    alert(
      strings.formatString(
        strings.maximumAddableGroupError,
        groupDefinition.maxLength - 1,
        groupDefinition.name.toLowerCase(),
      ),
    );
  } else {
    let newValue = groupValue
      ? groupValue
      : groupDefinition.type === 'SRx'
      ? newRefraction()
      : {};
    groupDefinition.fields instanceof Array &&
      groupDefinition.fields.forEach(
        (fieldDefinition: FieldDefinition | GroupDefinition) => {
          if (
            fieldDefinition.fields instanceof Array &&
            fieldDefinition.fields.length !== 0
          ) {
            if (
              newValue[fieldDefinition.name] === undefined ||
              newValue[fieldDefinition.name] === null
            ) {
              newValue[fieldDefinition.name] = {}; //Add empty column
            }
          }
        },
      );
    if (groupDefinition.clone instanceof Array && values.length > 0 && !isNew) {
      const lastValue = deepClone(isEmpty(childValue) ? values[0] : childValue);
      groupDefinition.clone.forEach((fieldName: string) => {
        newValue[fieldName] = lastValue[fieldName];
      });
    }
    values.unshift(newValue);
  }
}

export class CheckList extends PureComponent {
  props: {
    value: string | string[],
    definition: FieldDefinition,
    editable?: boolean,
    style?: any,
    onChangeField?: (newValue: string | string[]) => void,
    onClear?: () => void,
    onAddFavorite?: () => void,
    onAdd?: () => void,
    patientId: string,
    examId: string,
    fieldId: string,
  };
  state: {
    formattedOptions: string[],
  };
  static defaultProps = {
    editable: true,
  };

  constructor(props: any) {
    super(props);
    let formattedOptions: string[] = this.formatOptions(
      props.definition.options,
    );
    this.addValueAsOption(formattedOptions, props.value);
    this.state = {
      formattedOptions,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (
      this.props.value === prevProps.value &&
      this.props.definition.options === prevProps.definition.options
    ) {
      return;
    }
    let formattedOptions = this.formatOptions(this.props.definition.options);
    this.addValueAsOption(formattedOptions, this.props.value);
    this.setState({
      formattedOptions,
    });
  }

  formatOptions(
    options: CodeDefinition[][] | CodeDefinition[] | string,
  ): string[] {
    let formattedOptions: string[] = [];
    if (!(options instanceof Array)) {
      formattedOptions = formatAllCodes(options, undefined);
    } else {
      formattedOptions = [...options];
    }
    if (formattedOptions === undefined || formattedOptions === null) {
      formattedOptions = [];
    }
    return formattedOptions;
  }

  addValueAsOption(formattedOptions: string[], value: string | string[]): void {
    if (value === undefined) {
      return;
    }
    if (value instanceof Array) {
      value.forEach((subValue: string) => {
        if (!formattedOptions.includes(subValue)) {
          formattedOptions.push(subValue);
        }
      });
    } else {
      if (!formattedOptions.includes(value)) {
        formattedOptions.push(value);
      }
    }
  }

  isSelected(option: string): boolean | string {
    let value: string | string[] = this.props.value;
    if (value === undefined) {
      return false;
    }
    if (value instanceof Array) {
      for (let i: number = 0; i < value.length; i++) {
        if (this.props.definition.prefix instanceof Array) {
          let selection: string = value[i];
          let prefix: string | boolean = true;
          if (selection.startsWith('(')) {
            prefix = selection.substring(1, 2);
            selection = selection.substring(4);
          }
          if (selection === option) {
            return prefix;
          }
        } else {
          let selection: string = value[i];
          if (selection === option) {
            return true;
          }
        }
      }
      return false;
    }
    if (typeof value === 'string' && value.startsWith('(')) {
      value = value.substring(4);
    }
    return value === option;
  }

  select = (option: string) => {
    let value: string | string[] = this.props.value;
    if (value instanceof Array) {
      if (this.props.definition.prefix instanceof Array) {
        let prefix;
        if (option.startsWith('(')) {
          prefix = option.substring(1, 2);
          option = option.substring(4);
        }
        let index = -1;
        for (let i: number = 0; i < value.length; i++) {
          let selection: string = value[i];
          if (selection.startsWith('(')) {
            selection = selection.substring(4);
          }
          if (selection === option) {
            index = i;
            break;
          }
        }
        if (index < 0) {
          if (this.props.definition.multiValue) {
            value.push(option);
          } else {
            value = [option];
          }
        } else {
          if (prefix === undefined) {
            prefix = '-';
          } else if (prefix === '-') {
            prefix = '?';
          } else if (prefix === '?') {
            prefix = '+';
          } else if (prefix === '+') {
            prefix = undefined;
          }
          if (prefix === undefined) {
            value.splice(index, 1);
          } else {
            value[index] = '(' + prefix + ') ' + option;
          }
        }
      } else {
        //No -?+ prefix
        const index: number = value.indexOf(option);
        if (this.props.definition.multiValue) {
          if (index < 0) {
            value.push(option);
          } else {
            value.splice(index, 1);
          }
        } else {
          if (index < 0) {
            value = [option];
          } else {
            value.splice(index, 1);
          }
        }
      }
    } else {
      let isSelected: boolean = value === option;
      if (value === option) {
        //Deselect
        if (this.props.definition.multiValue) {
          value = [];
        } else {
          value = undefined;
        }
      } else {
        //Select
        if (this.props.definition.multiValue) {
          value = [option];
        } else {
          value = option;
        }
      }
    }
    this.props.onChangeField && this.props.onChangeField(value);
  };

  addValue = (option: string) => {
    if (option === undefined || option === null || option === '') {
      return;
    }
    let value: string | string[] = this.props.value;
    if (value instanceof Array) {
      if (this.props.definition.multiValue) {
        if (!value.includes(option)) {
          value = [...value];
          value.push(option);
        }
      } else {
        value = option;
      }
    } else {
      if (this.props.definition.multiValue) {
        value = [option];
      } else {
        value = option;
      }
    }
    this.props.onChangeField && this.props.onChangeField(value);
  };

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.definition.size
      ? styles['board' + this.props.definition.size]
      : styles.board;
    return (
      <View style={style}>
        <Label
          style={styles.sectionTitle}
          suffix=""
          value={formatLabel(this.props.definition)}
          fieldId={this.props.fieldId}
        />
        <View
          style={
            this.props.style
              ? undefined
              : isWeb
              ? {maxHeight: 500 * fontScale}
              : styles.wrapBoard
          }>
          <ScrollView scrollEnabled={true}>
            {this.state.formattedOptions.map(
              (option: string, index: number) => {
                const isSelected: boolean | string = this.isSelected(option);
                const prefix: string =
                  isSelected === true || isSelected === false
                    ? ''
                    : '(' + isSelected + ') ';
                return (
                  <View style={[styles.formRow]} key={option}>
                    <CheckButton
                      isChecked={isSelected !== false}
                      suffix={prefix + option}
                      onSelect={() => this.select(prefix + option)}
                      onDeselect={() => this.select(prefix + option)}
                      readonly={this.props.editable != true}
                      testID={this.props.fieldId + '.option' + (index + 1)}
                    />
                  </View>
                );
              },
            )}
          </ScrollView>
        </View>
        {this.props.definition.freestyle && this.props.editable && (
          <View style={styles.formRow} key="freestyle">
            <FormTextInput
              speakable={true}
              onChangeText={this.addValue}
              testID={this.props.fieldId + '.speachField'}
            />
          </View>
        )}
        {this.props.editable && this.props.onClear && (
          <View style={styles.groupIcons}>
            <TouchableOpacity
              onPress={this.props.onClear}
              testID={this.props.fieldId + '.garbageIcon'}>
              <Garbage style={styles.groupIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

export class GroupedCard extends Component {
  props: {
    showTitle?: boolean,
    exam: Exam,
  };
  static defaultProps = {
    showTitle: true,
  };

  constructor(props: any) {
    super(props);
  }

  getCardGroup(): ?GroupDefinition {
    if (
      this.props.exam.definition.cardGroup === undefined ||
      this.props.exam.definition.cardGroup === null
    ) {
      return undefined;
    }
    const groupDefinition: GroupDefinition =
      this.props.exam.definition.fields.find(
        (fieldDefinition: GroupDefinition | FieldDefinition) =>
          fieldDefinition.name === this.props.exam.definition.cardGroup,
      );
    return groupDefinition;
  }

  renderField(
    groupDefinition: GroupDefinition,
    fieldDefinition: FieldDefinition,
    showLabel: boolean,
    groupIndex: number,
    column: ?string = undefined,
  ) {
    if (column === '>>') {
      return null;
    }
    if (groupDefinition === undefined || groupDefinition === null) {
      return null;
    }
    if (fieldDefinition === undefined) {
      return null;
    }
    if (fieldDefinition.isLabel) {
      return null;
    }

    if (
      this.props.exam[this.props.exam.definition.name] === undefined ||
      this.props.exam[this.props.exam.definition.name][groupDefinition.name] ===
        undefined
    ) {
      return null;
    }
    const groupValue =
      groupDefinition.multiValue === true
        ? this.props.exam[this.props.exam.definition.name][
            groupDefinition.name
          ][groupIndex]
        : this.props.exam[this.props.exam.definition.name][
            groupDefinition.name
          ];
    if (isEmpty(groupValue)) {
      return null;
    }
    const fieldName: string = fieldDefinition.name;
    let value =
      column === undefined
        ? groupValue[fieldName]
        : groupValue[column]
        ? groupValue[column][fieldName]
        : undefined;
    if (fieldDefinition.image) {
      if (isEmpty(value)) {
        return null;
      }

      const label: ?string = formatFieldLabel(groupDefinition, groupValue);

      const icon =
        value && typeof value === 'string' && value.startsWith('upload-') ? (
          <PaperClip style={styles.textIcon} color="black" key="paperclip" />
        ) : (
          <DrawingIcon style={styles.textIcon} color="black" key="drawing" />
        );
      if (
        showLabel === true &&
        label !== undefined &&
        label !== null &&
        label.trim() !== ''
      ) {
        return (
          <View
            style={styles.rowLayout}
            key={
              groupDefinition.name +
              '-' +
              fieldName +
              '-' +
              groupIndex +
              '-' +
              column
            }>
            <Text
              style={styles.textLeft}
              key={
                groupDefinition.name +
                '-' +
                fieldName +
                '-' +
                groupIndex +
                '-' +
                column
              }>
              {label}:{' '}
            </Text>
            {icon}
          </View>
        );
      }
      return (
        <View style={styles.columnLayout}>
          <View
            style={styles.rowLayout}
            key={
              groupDefinition.name +
              '-' +
              fieldName +
              '-' +
              groupIndex +
              '-' +
              column
            }>
            {icon}
          </View>
          <View style={styles.columnLayout}>
            {fieldDefinition.cardFields &&
              this.renderCardRows(fieldDefinition.cardFields)}
          </View>
        </View>
      );
    }
    const formattedValue: string = formatFieldValue(value, fieldDefinition);
    if (formattedValue === '') {
      return null;
    }
    const label: ?string = formatLabel(fieldDefinition);

    if (formattedValue == label) {
      showLabel = false;
    }
    if (
      showLabel === true &&
      label !== undefined &&
      label !== null &&
      label.trim() !== '' &&
      fieldName !== value
    ) {
      //Last condition is for checkboxes
      //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);
      return (
        <Text
          style={styles.textLeft}
          key={
            groupDefinition.name +
            '-' +
            fieldName +
            '-' +
            groupIndex +
            '-' +
            column
          }>
          {label}: {formattedValue}{' '}
        </Text>
      );
    }
    //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);

    return (
      <Text
        style={styles.textLeft}
        key={
          groupDefinition.name +
          '-' +
          fieldName +
          '-' +
          groupIndex +
          '-' +
          column
        }>
        {formattedValue}{' '}
      </Text>
    );
  }

  renderCheckListItem(fieldDefinition: FieldDefinition) {
    const value =
      this.props.exam[this.props.exam.definition.name][fieldDefinition.name];

    const formattedValue: string = formatFieldValue(value, fieldDefinition);
    if (formattedValue === '') {
      return null;
    }
    const label: ?string = formatLabel(fieldDefinition);
    return (
      <Text style={styles.textLeft} key={fieldDefinition.name}>
        {label}: {formattedValue}{' '}
      </Text>
    );
  }

  renderColumnedRow(
    groupDefinition: GroupDefinition,
    columns: string[],
    rowIndex: number,
    groupIndex: number,
  ) {
    let showLabel: boolean = true;
    const a = columns.map((column: string, columnIndex: number) => {
      if (column !== '>>') {
        const columnDefinition: GroupDefinition = groupDefinition.fields.find(
          (columnDefinition: FieldDefinition) =>
            columnDefinition.name === column,
        );
        const fieldDefinition: FieldDefinition =
          columnDefinition.fields[rowIndex];
        let field = this.renderField(
          groupDefinition,
          fieldDefinition,
          showLabel,
          groupIndex,
          column,
        );
        if (field != null) {
          showLabel = false;
        }
        return field;
      }
    });

    //__DEV__ && console.log('key='+groupIndex+'-'+groupDefinition.name+'-'+rowIndex);
    return isEmpty(a) ? null : (
      <View
        style={styles.rowLayout}
        key={groupIndex + ' ' + groupDefinition.name + '-' + rowIndex + '-'}>
        {a}
      </View>
    );
  }

  renderColumnedRows(
    groupDefinition: GroupDefinition,
    columnDefinition: GroupDefinition,
    groupIndex: number,
  ) {
    let rows: any[] = [];
    const rowCount: number = columnDefinition.fields.length;
    const columns: string[] = groupDefinition.columns.find(
      (columns: string[]) =>
        columns.length > 0 && columns[0] === columnDefinition.name,
    );
    for (let rowIndex: number = 0; rowIndex < rowCount; rowIndex++) {
      const cr = cleanUpArray(
        this.renderColumnedRow(groupDefinition, columns, rowIndex, groupIndex),
      );
      if (!isEmpty(cr)) {
        rows.push(cr);
      }
    }
    return rows;
  }

  renderSimpleRow(
    groupDefinition: GroupDefinition,
    fieldDefinition: FieldDefinition,
    groupIndex: ?number = 0,
  ) {
    const showLabel: boolean = true;
    return this.renderField(
      groupDefinition,
      fieldDefinition,
      showLabel,
      groupIndex,
    );
  }

  renderSubtitle(name) {
    return (
      <Text style={styles.cardSubTitle} key={'subTitle'}>
        {name}
      </Text>
    );
  }

  renderRows(groupDefinition: GroupDefinition, groupIndex: ?number = 0) {
    let rows: any[] = [];

    for (
      let fieldIndex: number = 0;
      fieldIndex < groupDefinition.fields.length;
      fieldIndex++
    ) {
      const fieldDefinition: FieldDefinition | GroupDefinition =
        groupDefinition.fields[fieldIndex];
      const columnFieldIndex: number = getColumnFieldIndex(
        groupDefinition,
        fieldDefinition.name,
      );
      if (columnFieldIndex === 0) {
        const cr = this.renderColumnedRows(
          groupDefinition,
          fieldDefinition,
          groupIndex,
        );
        if (!isEmpty(cr)) {
          rows.push(cr);
        }
      } else if (columnFieldIndex < 0) {
        const sr = this.renderSimpleRow(
          groupDefinition,
          fieldDefinition,
          groupIndex,
        );
        if (sr !== null) {
          rows.push(sr);
        }
      }
    }
    return rows;
  }

  renderGlassesSummary(groupDefinition: GroupDefinition) {
    if (groupDefinition === undefined || groupDefinition === null) {
      return null;
    }
    if (
      isEmpty(this.props.exam[this.props.exam.definition.name]) ||
      isEmpty(
        this.props.exam[this.props.exam.definition.name][groupDefinition.name],
      )
    ) {
      return null;
    }
    if (
      groupDefinition.multiValue &&
      this.props.exam[this.props.exam.definition.name][
        groupDefinition.name
      ] instanceof Array
    ) {
      return this.props.exam[this.props.exam.definition.name][
        groupDefinition.name
      ].map((rx: GlassesRx, index: number) => (
        <GlassesSummary
          showHeaders={false}
          glassesRx={rx}
          key={groupDefinition.name + '.' + index}
          title={
            this.props.exam.definition.showSubtitles
              ? formatLabel(groupDefinition)
              : null
          }
        />
      ));
    }
    return (
      <GlassesSummary
        showHeaders={false}
        glassesRx={
          this.props.exam[this.props.exam.definition.name][groupDefinition.name]
        }
        key={groupDefinition.name}
        title={
          this.props.exam.definition.showSubtitles
            ? formatLabel(groupDefinition)
            : null
        }
      />
    );
  }

  renderGroup(groupDefinition: GroupDefinition) {
    if (this.props.exam[this.props.exam.definition.name] === undefined) {
      return null;
    }
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign(
        {},
        getFieldDefinition(groupDefinition.mappedField),
        groupDefinition,
      );
    }
    if (groupDefinition.type === 'SRx') {
      return this.renderGlassesSummary(groupDefinition);
    } else if (
      groupDefinition.multiValue === true &&
      groupDefinition.options === undefined
    ) {
      const value =
        this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (
        value === undefined ||
        value === null ||
        value instanceof Array === false ||
        value.length === 0
      ) {
        return null;
      }
      return value.map((groupValue: any, groupIndex: number) => {
        if (
          groupValue === undefined ||
          groupValue === null ||
          Object.keys(groupValue).length === 0
        ) {
          return null;
        }
        return this.renderRows(groupDefinition, groupIndex);
      });
    } else if (
      groupDefinition.fields === undefined &&
      groupDefinition.options
    ) {
      //A CheckList
      return this.renderCheckListItem(groupDefinition);
    } else {
      let showSubtitles: boolean = this.props.exam.definition.showSubtitles; //TODO: can we remove this flag
      if (
        this.props.exam.definition.fields.length === 1 &&
        this.props.exam.definition.fields[0].multiValue !== true
      ) {
        showSubtitles = false;
      }
      const value: any =
        this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (
        value === undefined ||
        value === null ||
        Object.keys(value).length === 0
      ) {
        return null;
      }
      let valueRows = this.renderRows(groupDefinition);
      let rows = [];
      if (showSubtitles && !isEmpty(valueRows) && valueRows.length !== 0) {
        rows.push(this.renderSubtitle(formatLabel(groupDefinition)));
        rows.push(
          <View key="w" style={{marginLeft: 30 * fontScale}}>
            {valueRows}
          </View>,
        );
      } else {
        rows.push(valueRows);
      }

      return rows;
    }
  }

  renderGroups() {
    if (!this.props.exam[this.props.exam.definition.name]) {
      return null;
    }
    if (
      this.props.exam.definition.fields === null ||
      this.props.exam.definition.fields === undefined ||
      this.props.exam.definition.fields.length === 0
    ) {
      return null;
    }
    let cardGroup: ?GroupDefinition = this.getCardGroup();
    if (cardGroup) {
      return this.renderGroup(cardGroup);
    }
    return this.props.exam.definition.fields.map(
      (groupDefinition: GroupDefinition) => this.renderGroup(groupDefinition),
    );
  }

  renderTitle() {
    let title: string = formatLabel(this.props.exam.definition);
    this.props.exam.definition.fields.map(
      (groupDefinition: GroupDefinition) => {
        const groupValue = getExamFieldValue(
          groupDefinition.name,
          this.props.exam,
        );
        if (groupValue && groupDefinition && groupDefinition.fields) {
          title = formatFieldLabel(groupDefinition, groupValue, title);
        }
      },
    );

    if (this.props.showTitle === false) {
      return null;
    }
    return (
      <Label
        style={styles.cardTitle}
        key="cardTitle"
        value={title}
        suffix=""
        fieldId={this.props.exam.definition.id}
      />
    );
  }

  getGroupDefinition(fullFieldName: string): GroupDefinition {
    if (fullFieldName.startsWith('exam.')) {
      fullFieldName = fullFieldName.substring(5);
    }
    const groupName = fullFieldName.substring(0, fullFieldName.indexOf('.'));
    return getExamFieldDefinition(groupName, this.props.exam);
  }

  expandMultiValueCardFields(): string[][] {
    //This is kind of advanced logic which I should document. Don't tamper with it if you are a rookie.
    let multiValueGroups: GroupDefinition[] =
      this.props.exam.definition.fields.filter(
        (groupDefinition: GroupDefinition) =>
          groupDefinition.multiValue === true &&
          groupDefinition.options === undefined,
      );
    if (multiValueGroups.length === 0) {
      return this.props.exam.definition.cardFields;
    }
    let cardFields: string[][] = [];
    let renderedGroups: string[] = [];
    this.props.exam.definition.cardFields.forEach((cardRow: string[]) => {
      const group: ?GroupDefinition = getMultiValueGroup(
        cardRow,
        multiValueGroups,
      );
      if (group) {
        if (!renderedGroups.includes(group.name)) {
          renderedGroups.push(group.name);
          const groupValue = getExamFieldValue(group.name, this.props.exam);
          if (groupValue instanceof Array && groupValue.length > 0) {
            for (let i: number = 0; i < groupValue.length; i++) {
              for (let indexedRow: string[] of this.props.exam.definition
                .cardFields) {
                const indexedGroup: ?GroupDefinition = getMultiValueGroup(
                  indexedRow,
                  multiValueGroups,
                );
                if (indexedGroup && indexedGroup.name === group.name) {
                  indexedRow = indexedRow.map((fieldName: string) =>
                    fieldName.replace(
                      group.name + '.',
                      group.name + '[' + i + '].',
                    ),
                  );
                  cardFields.push(indexedRow);
                }
              }
            }
          }
        }
      } else {
        cardFields.push(cardRow);
      }
    });
    return cardFields;
  }

  renderCardRows(cardFields?: any) {
    let i: number = 0;
    let rowValues: string[][] = [];
    cardFields =
      cardFields === undefined ? this.expandMultiValueCardFields() : cardFields;
    cardFields.forEach((cardRowFields: string[]) => {
      let rowValue: ?(string[]) = cardRowFields.map((fullFieldName: string) => {
        if (fullFieldName.indexOf('.') === -1) {
          //Hard coded strings
          return fullFieldName + ' ';
        }
        const fieldDefinition: fieldDefinition = getExamFieldDefinition(
          fullFieldName,
          this.props.exam,
        );
        const fieldValue: any = getExamFieldValue(
          fullFieldName,
          this.props.exam,
        );
        let formattedValue = formatFieldValue(fieldValue, fieldDefinition);
        if (!getIsVisible(this.props.exam.id, fieldDefinition)) {
          return '';
        }
        if (formattedValue === '') {
          return '';
        }
        if (cardRowFields.length === 1) {
          //Add the label for single field rows
          const label: string = formatLabel(fieldDefinition);
          if (formattedValue != label && formattedValue != '') {
            return label + ': ' + formattedValue;
          }
          return formattedValue;
        }
        if (formattedValue.length > 0) {
          formattedValue = formattedValue + ' ';
        }
        return formattedValue;
      });
      if (
        !isEmpty(
          rowValue.filter(
            (item: string) =>
              item !== undefined &&
              item !== null &&
              item.trim().endsWith(':') === false,
          ),
        )
      ) {
        //Filter label only fields before checking if line is empty
        rowValues.push(rowValue);
      }
    });
    return rowValues.map((rowValue: string[], index: number) => (
      <Text style={styles.textLeft} key={index}>
        {rowValue}
      </Text>
    ));
  }

  render() {
    return (
      <View style={styles.columnLayout} key={this.props.exam.definition.name}>
        {this.renderTitle()}
        {isEmpty(this.props.exam[this.props.exam.definition.name])
          ? null
          : this.props.exam.definition.cardFields
          ? this.renderCardRows()
          : this.renderGroups()}
      </View>
    );
  }
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
    const columnDefinition: ?GroupDefinition | FieldDefinition =
      this.props.definition.fields.find(
        (columnDefinition: GroupDefinition | FieldDefinition) =>
          columnDefinition.name === column,
      );
    return formatLabel(columnDefinition);
  }

  changeField(
    fieldDefinition: FieldDefinition,
    newValue: any,
    column: ?string,
  ) {
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
    if (
      fieldDefinition.defaultValue === undefined ||
      fieldDefinition.defaultValue === null
    ) {
      return;
    }
    const value: string = getDefaultValue(fieldDefinition);
    const isDynamicValue: string =
      fieldDefinition.defaultValue &&
      typeof fieldDefinition.defaultValue === 'string'
        ? fieldDefinition.defaultValue.startsWith('[') &&
          fieldDefinition.defaultValue.endsWith(']')
        : false;
    if (value && isDynamicValue) {
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
        message={strings.importDataNotFound}
        onDismissAction={() => this.hideSnackBar()}
      />
    );
  }

  renderField(fieldDefinition: FieldDefinition, column?: string) {
    if (fieldDefinition === undefined) {
      return (
        <View style={styles.fieldFlexContainer} key={column}>
          <Text style={styles.text} />
        </View>
      );
    }
    if (fieldDefinition.mappedField) {
      let exam: Exam = getCachedItem(this.props.examId);
      fieldDefinition = Object.assign(
        {},
        getExamFieldDefinition(fieldDefinition.mappedField, exam),
        fieldDefinition,
      );
    }

    let value = this.props.form
      ? column
        ? this.props.form[column]
          ? this.props.form[column][fieldDefinition.name]
          : undefined
        : this.props.form[fieldDefinition.name]
      : undefined;
    value =
      value === undefined
        ? this.getDefinitionDefaultValue(fieldDefinition)
        : value;

    //if (fieldDefinition.mappedField) {
    //  value = getExamFieldValue(fieldDefinition.mappedField, getCachedItem(this.props.examId));
    //  __DEV__ && console.log('Got mapped field value '+fieldDefinition.mappedField+' from exam :'+value);
    //}
    //if (value===undefined) {
    //  value = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name]:undefined:this.props.form[fieldDefinition.name]:undefined;
    //}

    const error = this.props.form
      ? column
        ? this.props.form[column]
          ? this.props.form[column][fieldDefinition.name + 'Error']
          : undefined
        : this.props.form[fieldDefinition.name + 'Error']
      : undefined;
    const label: string =
      formatLabel(this.props.definition) +
      (column !== undefined
        ? ' ' + this.formatColumnLabel(column) + ' '
        : ' ') +
      formatLabel(fieldDefinition);
    const isTyping =
      this.context.keyboardMode === ('desktop' || this.state.isTyping) &&
      this.props.editable;
    return (
      <FormInput
        value={value}
        filterValue={this.props.form}
        label={label}
        showLabel={false}
        readonly={!this.props.editable}
        definition={fieldDefinition}
        onChangeValue={(newValue: string) =>
          this.changeField(fieldDefinition, newValue, column)
        }
        errorMessage={error}
        isTyping={isTyping}
        patientId={this.props.patientId}
        examId={this.props.examId}
        enableScroll={this.props.enableScroll}
        disableScroll={this.props.disableScroll}
        key={fieldDefinition.name + (column === undefined ? '' : column)}
        fieldId={
          this.props.fieldId +
          '.' +
          fieldDefinition.name +
          (column === undefined ? '' : column)
        }
        testID={
          this.props.fieldId +
          '.' +
          fieldDefinition.name +
          (column === undefined ? '' : column)
        }
      />
    );
  }

  renderSimpleRow(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    const label: string = formatLabel(fieldDefinition);
    if (fieldDefinition.layout) {
      return this.renderField(fieldDefinition);
    }
    return (
      <View style={styles.formRow} key={fieldDefinition.name}>
        <View style={styles.formRowHeader}>
          <Label
            value={label}
            fieldId={this.props.fieldId + '.' + fieldDefinition.name}
          />
        </View>
        {this.renderField(fieldDefinition)}
      </View>
    );
  }

  renderFieldsRow(fieldDefinition: FieldDefinition) {
    if (this.getIsVisible(fieldDefinition) === false) {
      return null;
    }

    let fields: any[] = [];
    const row: string[] = this.props.definition.rows.find(
      (row: string[]) =>
        row && row.length > 0 && row[0] === fieldDefinition.name,
    );
    if (row === undefined) {
      return null;
    }
    const fieldDefinitions: FieldDefinition[] = row.map((fieldName: string) =>
      this.props.definition.fields.find(
        (field: FieldDefinition) => field.name === fieldName,
      ),
    );
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      let label: string = formatLabel(fieldDefinition);
      fields.push(
        <Label
          value={label}
          key={fieldDefinition.name + 'Label'}
          fieldId={this.props.fieldId + '.' + fieldDefinition.name}
        />,
      );
      fields.push(this.renderField(fieldDefinition));
    });
    return (
      <View style={styles.formRow} key={fieldDefinition.name}>
        {fields}
      </View>
    );
  }

  renderSimpleRowValue(value: String) {
    return (
      <View style={styles.formRow}>
        <Text>{value}</Text>
      </View>
    );
  }

  hasColumns(): boolean {
    return hasColumns(this.props.definition);
  }

  renderColumnsHeader(columnDefinition: GroupDefinition) {
    if (this.hasColumns() === false) {
      return null;
    }
    const columns = this.props.definition.columns.find(
      (columns: string[]) => columns[0] === columnDefinition.name,
    );
    if (columns === undefined || columns.length === 0) {
      return null;
    }
    return (
      <View
        style={styles.formRow}
        key={'columnHeader-' + columnDefinition.name}>
        <Text style={styles.formTableRowHeader}> </Text>
        {columns.map((column: string, index: number) => {
          const columnDefinition: FieldDefinition =
            this.props.definition.fields.find(
              (fieldDefinition: FieldDefinition) =>
                fieldDefinition.name === column,
            );
          if (columnDefinition) {
            const columnLabel: string = formatLabel(columnDefinition);
            return (
              <Label
                value={columnLabel}
                style={styles.formTableColumnHeader}
                key={index}
                suffix={''}
                fieldId={this.props.fieldId + '.' + columnDefinition.name}
              />
            );
          } else {
            if (column === '>>') {
              if (index === columns.length - 1) {
                return (
                  <View
                    style={styles.formTableColumnHeaderSmall}
                    key={'header-' + index}
                  />
                );
              } else {
                return (
                  <View
                    style={styles.formTableColumnHeaderFlat}
                    key={'header-' + index}>
                    <CopyColumn
                      onPress={() =>
                        this.copyColumn(columns[index - 1], columns[index + 1])
                      }
                    />
                  </View>
                );
              }
            }
            return null;
          }
        })}
      </View>
    );
  }

  renderColumnedRow(
    labelId: string,
    fieldLabel: string,
    columns: string[],
    rowIndex: number,
    copyRow: () => void,
  ) {
    return (
      <View style={styles.formRow} key={'columnedRow-' + rowIndex}>
        <Label
          value={fieldLabel}
          style={styles.formTableRowHeader}
          fieldId={labelId}
        />
        {columns.map((column: string, columnIndex: number) => {
          const columnDefinition: GroupDefinition =
            this.props.definition.fields.find(
              (columnDefinition: FieldDefinition) =>
                columnDefinition.name === column,
            );
          if (columnDefinition) {
            const fieldDefinition: FieldDefinition =
              columnDefinition.fields[rowIndex];
            return this.renderField(fieldDefinition, column);
          } else {
            if (columnIndex === columns.length - 1) {
              if (rowIndex == 0) {
                return [
                  <View
                    style={styles.formTableColumnHeaderSmall}
                    key={'copyRowSpace-' + rowIndex}
                  />,
                  <CopyRow onPress={copyRow} key={'copyRow-' + rowIndex} />,
                ];
              } else {
                return (
                  <View
                    style={styles.formTableColumnHeaderSmall}
                    key={'cpoyRowSpace-' + rowIndex}
                  />
                );
              }
            }
          }
        })}
      </View>
    );
  }

  copyRow(
    rowFields: FieldDefinition[],
    rowIndexFrom: number,
    rowIndexTo: number,
    columns: string[],
  ) {
    if (this.props.form === undefined) {
      return;
    }
    const fromRowName: string = rowFields[rowIndexFrom].name;
    const toRowName: string = rowFields[rowIndexTo].name;
    for (let i: number = 0; i < columns.length; i++) {
      if (columns[i] === '>>') {
        continue;
      }
      const value = this.props.form[columns[i]][fromRowName];
      this.props.onChangeField(toRowName, value, columns[i]);
    }
  }

  copyColumn(fromColumn: string, toColumn: string): void {
    const fieldDefinitions: FieldDefinition[] =
      this.props.definition.fields.find(
        (field: FieldDefinition) => field.name === fromColumn,
      ).fields;
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      const value = this.props.form[fromColumn][fieldDefinition.name];
      this.props.onChangeField(fieldDefinition.name, value, toColumn);
    });
  }

  renderColumnedRows(columnDefinition: GroupDefinition) {
    if (this.getIsVisible(columnDefinition) === false) {
      return null;
    }
    let rows: any[] = [];
    rows.push(this.renderColumnsHeader(columnDefinition));
    const columnedFields: FieldDefinition[] = columnDefinition.fields;
    const columns: string[] = this.props.definition.columns.find(
      (columns: string[]) =>
        columns.length > 0 && columns[0] === columnDefinition.name,
    );
    for (let i: number = 0; i < columnedFields.length; i++) {
      rows.push(
        this.renderColumnedRow(
          this.props.fieldId +
            '.' +
            columnDefinition.name +
            '.' +
            columnedFields[i].name,
          formatLabel(columnedFields[i]),
          columns,
          i,
          () => this.copyRow(columnedFields, i, i + 1, columns),
        ),
      );
    }
    return rows;
  }

  renderRows() {
    let rows: any[] = [];
    const groupDefinition: GroupDefinition = this.props.definition;

    if (groupDefinition.fields) {
      for (const fieldDefinition: FieldDefinition of groupDefinition.fields) {
        const columnFieldIndex: number = getColumnFieldIndex(
          groupDefinition,
          fieldDefinition.name,
        );
        if (columnFieldIndex === 0) {
          rows.push(this.renderColumnedRows(fieldDefinition));
        } else if (columnFieldIndex < 0) {
          if (isRowField(groupDefinition, fieldDefinition.name) !== false) {
            rows.push(this.renderFieldsRow(fieldDefinition));
          } else {
            rows.push(this.renderSimpleRow(fieldDefinition));
          }
        }
      }
    }
    return rows;
  }

  importSelectedData(measurement: Measurement) {
    if (measurement.data) {
      if (this.props.onAdd && measurement.data instanceof Array) {
        if (measurement.data.length > 0) {
          this.props.onUpdateForm(
            this.props.definition.name,
            measurement.data.slice(-1)[0],
          );
          let groupValues: {}[] = measurement.data.slice(0, -1).reverse();
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
    let measurement: Measurement | Measurement[] = await importData(
      this.props.definition.import,
      this.props.examId,
    );
    if (measurement === undefined || measurement === null) {
      this.showSnackBar();
    }
    if (measurement instanceof Array) {
      this.showDialog(measurement);
    } else {
      if (measurement && measurement.data) {
        if (this.props.onAdd && measurement.data instanceof Array) {
          if (measurement.data.length > 0) {
            this.props.onUpdateForm(
              this.props.definition.name,
              measurement.data.slice(-1)[0],
            );
            let groupValues: {}[] = measurement.data.slice(0, -1).reverse();
            groupValues.forEach((groupValue: {}) =>
              this.props.onAdd(groupValue),
            );
          }
        } else {
          this.props.onUpdateForm(this.props.definition.name, measurement.data);
        }
      }
    }
  }

  async exportData() {
    // TODO export data
  }

  renderCopyIcon() {
    return (
      this.props.onCopy &&
      this.props.definition.clone && (
        <TouchableOpacity
          onPress={() => this.props.onCopy()}
          testID={this.props.fieldId + '.copyIcon'}>
          <Copy style={styles.groupIcon} />
        </TouchableOpacity>
      )
    );
  }

  renderIcons() {
    if (this.props.cloneable && this.props.definition.clone) {
      return (
        <View style={styles.groupIcons} key="icons">
          {this.renderCopyIcon()}
        </View>
      );
    }
    if (
      !this.props.editable ||
      (!this.props.onAddFavorite &&
        !this.props.onClear &&
        !this.props.definition.keyboardEnabled)
    ) {
      return null;
    }
    return [
      <View style={styles.groupIcons} key="icons">
        {this.props.onClear && (
          <TouchableOpacity
            onPress={this.props.onClear}
            testID={this.props.fieldId + '.garbageIcon'}>
            <Garbage style={styles.groupIcon} />
          </TouchableOpacity>
        )}
        {this.props.onAdd && (
          <TouchableOpacity
            onPress={() => this.props.onAdd()}
            testID={this.props.fieldId + '.plusIcon'}>
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
          <TouchableOpacity
            onPress={() => this.importData()}
            testID={this.props.fieldId + '.importIcon'}>
            <ImportIcon style={styles.groupIcon} />
          </TouchableOpacity>
        )}
      </View>,
    ];
  }

  render() {
    const style = this.props.style
      ? this.props.style
      : this.props.definition.layout
      ? scaleStyle(this.props.definition.layout)
      : this.props.definition.size
      ? styles['board' + this.props.definition.size]
      : styles.board;
    return (
      <View style={style} key={this.props.definition.name}>
        <Label
          style={styles.sectionTitle}
          key="title"
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

export type GroupedFormScreenProps = {
  exam: Exam,
  onUpdateExam?: (exam: Exam) => void,
  favorites?: ExamPredefinedValue[],
  onAddFavorite?: (favorite: any, name: string) => void,
  editable?: boolean,
  onRemoveFavorite?: (favorite: ExamPredefinedValue) => void,
  enableScroll?: () => void,
  disableScroll?: () => void,
  copiedData?: GlassesRx,
  copyData?: (glassesRx: GlassesRx) => void,
  deleteCopiedData?: () => void,
};
type GroupedFormScreenState = {
  addableGroups: string[],
};
export class GroupedFormScreen extends Component<
  GroupedFormScreenProps,
  GroupedFormScreenState,
> {
  constructor(props: GroupedFormScreenProps) {
    super(props);
    this.state = {
      addableGroups: this.initialiseExam(this.props.exam),
    };
  }

  componentDidUpdate(prevProps: GroupedFormScreenProps) {
    if (
      prevProps.exam === this.props.exam &&
      prevProps.exam[prevProps.exam.definition.name] ===
        this.props.exam[this.props.exam.definition.name] &&
      prevProps.editable === this.props.editable
    ) {
      return;
    }
    this.setState({addableGroups: this.initialiseExam(this.props.exam)});
  }

  /*
   * Create the empty objects to hold all group and column data.
   * Returns the list of optional addable groups.
   **/
  initialiseExam(exam: Exam): string[] {
    let addableGroups: string[] = [];
    if (!exam[exam.definition.name]) {
      exam[exam.definition.name] = {};
    }
    if (
      exam.definition.fields === undefined ||
      exam.definition.fields.length === 0
    ) {
      return;
    }
    exam.definition.fields.forEach(
      (groupDefinition: GroupDefinition | FieldDefinition) => {
        //Create a value for each group
        if (groupDefinition.mappedField) {
          groupDefinition = Object.assign(
            {},
            getFieldDefinition(groupDefinition.mappedField),
            groupDefinition,
          );
        }
        if (groupDefinition.options === undefined) {
          //Don't initialise a checkboxes group
          if (
            exam[exam.definition.name][groupDefinition.name] === undefined ||
            exam[exam.definition.name][groupDefinition.name] === null
          ) {
            //The group has no value, time to initialise it
            if (groupDefinition.optional === true) {
              //Don't initialise an optional group, in stead show add it to the + button
              addableGroups.push(
                groupDefinition.label
                  ? groupDefinition.label
                  : groupDefinition.name,
              );
            } else {
              //Initialise the group value
              if (groupDefinition.multiValue === true) {
                //Initialise a multivalue with an array
                exam[exam.definition.name][groupDefinition.name] = [];
              } else {
                //Initialise a group with an empty Object
                exam[exam.definition.name][groupDefinition.name] = {};
              }
            }
          }
          let groupValue: {} | [] =
            exam[exam.definition.name][groupDefinition.name];
          if (groupValue) {
            //Initialise empty arrays with a first element
            if (groupDefinition.multiValue) {
              if (groupValue instanceof Array === false) {
                //auto fix old style exams that stored that stored a one size array as the first element
                groupValue = [groupValue];
                exam[exam.definition.name][groupDefinition.name] = groupValue;
              }
              if (groupValue.length === 0) {
                let firstValue = {};
                groupValue.push(firstValue);
              }
            }
            //Initialise SRx
            if (groupDefinition.type === 'SRx') {
              if (groupDefinition.multiValue) {
                groupValue.forEach((value) => {
                  initRefraction(value);
                });
              } else {
                initRefraction(groupValue);
              }
            }
            //Initialise the fields that have columns (subfields)
            groupDefinition.fields instanceof Array &&
              groupDefinition.fields.forEach(
                (fieldDefinition: FieldDefinition | GroupDefinition) => {
                  if (
                    fieldDefinition.fields instanceof Array &&
                    fieldDefinition.fields.length !== 0
                  ) {
                    //Initialise a subfield that has columns
                    if (groupDefinition.multiValue) {
                      //Initialise every value in the array
                      groupValue.forEach((value) => {
                        let fieldValue = value[fieldDefinition.name];
                        if (fieldValue === undefined) {
                          value[fieldDefinition.name] = {}; //Add empty column
                        }
                      });
                    } else {
                      let fieldValue = groupValue[fieldDefinition.name];
                      if (fieldValue === undefined) {
                        groupValue[fieldDefinition.name] = {}; //Add empty column
                      }
                    }
                  }
                },
              );
          }
        }
      },
    );
    return addableGroups;
  }

  getPatientId(): string {
    return getCachedItem(this.props.exam.visitId).patientId;
  }

  addGroupItem = (
    groupDefinition: GroupDefinition,
    groupValue: ?{},
    isNew: ?boolean = false,
  ) => {
    addGroupItem(this.props.exam, groupDefinition, groupValue, isNew);
    this.props.onUpdateExam(this.props.exam);
  };

  changeField(
    groupName: string,
    fieldName: ?string,
    newValue: string,
    column: ?string,
    index?: number,
  ) {
    if (column !== undefined) {
      if (index !== undefined) {
        if (fieldName !== undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][index][
            column
          ][fieldName] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][index][
            column
          ] = newValue;
        }
      } else {
        if (fieldName !== undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][column][
            fieldName
          ] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][column] =
            newValue;
        }
      }
    } else {
      if (index !== undefined) {
        if (fieldName !== undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][index][
            fieldName
          ] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][index] =
            newValue;
        }
      } else {
        if (fieldName !== undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][
            fieldName
          ] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName] =
            newValue;
        }
      }
    }
    this.props.onUpdateExam(this.props.exam);
  }

  updateRefraction(groupName: string, refraction: GlassesRx) {
    if (!this.props.editable) {
      return;
    }
    //this.props.exam[this.props.exam.definition.name][refractionType] = refraction;
    this.props.onUpdateExam(this.props.exam);
    this.props.deleteCopiedData();
  }

  updateGroup = (groupName: string, form: any, index?: number) => {
    if (index !== undefined && index !== null) {
      this.props.exam[this.props.exam.definition.name][groupName][index] = form;
    } else {
      this.props.exam[this.props.exam.definition.name][groupName] = form;
    }
    this.props.onUpdateExam(this.props.exam);
  };

  pasteData = async (
    fieldDefinition: FieldDefinition,
    index?: number,
  ): void => {
    const existingGlassesRx: GlassesRx =
      index !== undefined && index !== null
        ? deepClone(
            this.props.exam[this.props.exam.definition.name][
              fieldDefinition.name
            ][index],
          )
        : deepClone(
            this.props.exam[this.props.exam.definition.name][
              fieldDefinition.name
            ],
          );
    if (existingGlassesRx) {
      existingGlassesRx.od.sph = this.props.copiedData.od.sph;
      existingGlassesRx.od.cyl = this.props.copiedData.od.cyl;
      existingGlassesRx.od.axis = this.props.copiedData.od.axis;
      existingGlassesRx.os.sph = this.props.copiedData.os.sph;
      existingGlassesRx.os.cyl = this.props.copiedData.os.cyl;
      existingGlassesRx.os.axis = this.props.copiedData.os.axis;
    }

    if (index !== undefined && index !== null) {
      this.props.exam[this.props.exam.definition.name][fieldDefinition.name][
        index
      ] = existingGlassesRx;
    } else {
      this.props.exam[this.props.exam.definition.name][fieldDefinition.name] =
        existingGlassesRx;
    }
    this.props.onUpdateExam(this.props.exam);
    this.props.deleteCopiedData();
  };

  copyToFinal = (glassesRx: GlassesRx): void => {
    glassesRx = deepClone(glassesRx);
    const finalRx: GlassesRx = deepClone(
      this.props.exam[this.props.exam.definition.name]['Final Rx'],
    );
    if (finalRx) {
      finalRx.od = glassesRx.od;
      finalRx.os = glassesRx.os;
      finalRx.ou = glassesRx.ou;
    }
    this.props.exam[this.props.exam.definition.name]['Final Rx'] = finalRx;
    this.props.onUpdateExam(this.props.exam);
  };

  copyFromFinal = (glassesRx: GlassesRx): void => {
    if (!this.props.editable) {
      return;
    }
    const finalRx: GlassesRx = deepClone(
      this.props.exam[this.props.exam.definition.name]['Final Rx'],
    );
    glassesRx.od = finalRx.od;
    glassesRx.os = finalRx.os;
    this.props.onUpdateExam(deepClone(this.props.exam));
  };

  clearNonReadOnlyFields(
    value: {},
    definition: GroupDefinition | FieldDefinition,
  ): ?{} {
    if (definition.mappedField) {
      definition = Object.assign(
        {},
        getFieldDefinition(definition.mappedField),
        definition,
      );
    }
    if (value === null || value === undefined || definition.readonly) {
      return value;
    }
    if (definition.fields === undefined && definition.type !== 'SRx') {
      return undefined;
    }
    if (definition.type === 'SRx') {
      clearRefraction(value);
    }
    if (definition.image) {
      value.lines = undefined;
      value.image = undefined;
    }
    if (definition.fields !== undefined) {
      for (const fieldDefinition: FieldDefinition of definition.fields) {
        let fieldValue = value[fieldDefinition.name];
        fieldValue = this.clearNonReadOnlyFields(fieldValue, fieldDefinition);
        value[fieldDefinition.name] = fieldValue;
      }
    }

    return value;
  }

  clear(groupName: string, index?: number): void {
    let formDefinition: GroupDefinition =
      this.props.exam.definition.fields.find(
        (groupDefinition: GroupDefinition) =>
          groupDefinition.name.toLowerCase() === groupName.toLowerCase(),
      );
    if (!formDefinition) {
      __DEV__ && console.error('No group definition ' + groupName + ' found.');
      return;
    }
    //Clearing a grouped form part of a multivalue array
    if (index !== undefined && index >= 0) {
      const forms: {}[] =
        this.props.exam[this.props.exam.definition.name][groupName];
      if (forms === null || forms === undefined || forms.length === 0) {
        return;
      }
      if (forms.length === 1) {
        //Last element in the array
        if (formDefinition.optional) {
          this.props.exam[this.props.exam.definition.name][groupName] =
            undefined;
          this.setState({addableGroups: this.initialiseExam(this.props.exam)});
        } else {
          const form = forms[0];
          forms[0] = this.clearNonReadOnlyFields(form, formDefinition);
        }
      } else {
        //Remove the element from the array
        forms.splice(index, 1);
      }
    } else {
      //Clearing a single grouped form or checklist
      if (formDefinition.optional) {
        this.props.exam[this.props.exam.definition.name][groupName] = undefined;
        this.setState({addableGroups: this.initialiseExam(this.props.exam)});
      } else {
        let form = this.props.exam[this.props.exam.definition.name][groupName];
        form = this.clearNonReadOnlyFields(form, formDefinition);
        this.props.exam[this.props.exam.definition.name][groupName] = form;
      }
    }
    this.props.onUpdateExam(this.props.exam);
  }

  selectFavorite = (predefinedValue: ExamPredefinedValue) => {
    if (!predefinedValue || !predefinedValue.predefinedValue) {
      return;
    }
    predefinedValue = deepClone(predefinedValue.predefinedValue);
    let value = this.props.exam[this.props.exam.definition.name];
    deepAssign(value, predefinedValue);
    this.props.onUpdateExam(this.props.exam);
  };

  addGroupFavorite = (groupName: string, favoriteName: string) => {
    let group: {} = {
      [groupName]: this.props.exam[this.props.exam.definition.name][groupName],
    };
    this.props.onAddFavorite(group, favoriteName);
  };

  addGroup(groupType: string) {
    const exam: Exam = this.props.exam;
    let groupDefinition = exam.definition.fields.find(
      (groupDefinition: GroupDefinition) =>
        groupDefinition.label !== undefined
          ? groupDefinition.label === groupType
          : groupDefinition.name === groupType,
    );
    if (!groupDefinition) {
      return;
    }
    if (isEmpty(exam[exam.definition.name][groupDefinition.name])) {
      if (groupDefinition.type === 'SRx') {
        if (groupDefinition.multiValue === true) {
          exam[exam.definition.name][groupDefinition.name] = [newRefraction()];
        } else {
          exam[exam.definition.name][groupDefinition.name] = newRefraction();
        }
      } else if (groupDefinition.multiValue === true) {
        exam[exam.definition.name][groupDefinition.name] = [];
      } else {
        exam[exam.definition.name][groupDefinition.name] = {};
      }
    }
    this.setState({addableGroups: this.initialiseExam(exam)}, () =>
      this.props.onUpdateExam(this.props.exam),
    );
  }

  getIsVisible(groupDefinition: GroupDefinition): ?{} {
    return getIsVisible(this.props.exam.visitId, groupDefinition);
  }

  renderGroup(groupDefinition: GroupDefinition, index: number) {
    if (this.getIsVisible(groupDefinition) === false) {
      return null;
    }

    const fieldId: string =
      this.props.exam.definition.name + '.' + groupDefinition.name;
    //__DEV__ && console.log('render group '+groupDefinition.name+' for exam: '+JSON.stringify(this.props.exam));
    let value: any = this.props.exam[this.props.exam.definition.name];
    if (!value) {
      return null;
    }
    value = value[groupDefinition.name];
    if (value === undefined && groupDefinition.options === undefined) {
      return null;
    }
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign(
        {},
        getFieldDefinition(groupDefinition.mappedField),
        groupDefinition,
      );
    }
    if (
      groupDefinition.multiValue === true &&
      groupDefinition.options === undefined
    ) {
      groupDefinition = deepClone(groupDefinition);
      groupDefinition.multiValue = false;
      if (value instanceof Array === false) {
        return null;
      }
      return value.map((childValue: any, subIndex: number) =>
        groupDefinition.type === 'SRx' ? (
          <GlassesDetail
            title={formatLabel(groupDefinition)}
            editable={this.props.editable}
            glassesRx={childValue}
            hasVA={groupDefinition.hasVA}
            onCopyToFinalRx={
              groupDefinition.copyToFinalRx === true
                ? this.copyToFinal
                : undefined
            }
            onCopyFromFinal={
              groupDefinition.copyFromFinalRx === true
                ? this.copyFromFinal
                : undefined
            }
            onCopy={
              groupDefinition.canBeCopied === true
                ? this.props.copyData
                : undefined
            }
            onPaste={
              groupDefinition.canBePaste === true && this.props.copiedData
                ? (fieldDefinition: FieldDefinition) =>
                    this.pasteData(fieldDefinition, subIndex)
                : undefined
            }
            onChangeGlassesRx={(glassesRx: GlassesRx) =>
              this.updateRefraction(groupDefinition.name, glassesRx)
            }
            hasAdd={groupDefinition.hasAdd}
            hasLensType={groupDefinition.hasLensType}
            hasPD={groupDefinition.hasPD}
            hasMPD={groupDefinition.hasMPD}
            hasCustomField={groupDefinition.hasCustomField}
            key={groupDefinition.name}
            onAdd={() => this.addGroupItem(groupDefinition)}
            onClear={() => this.clear(groupDefinition.name, subIndex)}
            definition={groupDefinition}
            key={'Rx' + index + '.' + subIndex}
            examId={this.props.exam.id}
            fieldId={fieldId + '[' + (value.length - subIndex) + ']'}
            editable={
              this.props.editable !== false && groupDefinition.readonly !== true
            }
          />
        ) : (
          <GroupedForm
            definition={groupDefinition}
            editable={this.props.editable}
            key={groupDefinition.name + '-' + index + '.' + subIndex}
            form={childValue}
            onChangeField={(
              fieldName: string,
              newValue: string,
              column: ?string,
            ) =>
              this.changeField(
                groupDefinition.name,
                fieldName,
                newValue,
                column,
                subIndex,
              )
            }
            onClear={() => this.clear(groupDefinition.name, subIndex)}
            onAdd={(groupValue: ?{}) =>
              this.addGroupItem(groupDefinition, groupValue, true)
            }
            onCopy={(groupValue: ?{}) =>
              this.addGroupItem(groupDefinition, groupValue)
            }
            onAddFavorite={
              this.props.onAddFavorite
                ? (favoriteName: string) =>
                    this.addGroupFavorite(groupDefinition.name, favoriteName)
                : undefined
            }
            enableScroll={this.props.enableScroll}
            disableScroll={this.props.disableScroll}
            onUpdateForm={(groupName: string, newValue: any) =>
              this.updateGroup(groupName, newValue, subIndex)
            }
            patientId={this.getPatientId()}
            examId={this.props.exam.id}
            fieldId={fieldId + '[' + (value.length - subIndex) + ']'}
            editable={
              this.props.editable !== false && groupDefinition.readonly !== true
            }
          />
        ),
      );
    } else if (groupDefinition.type === 'SRx') {
      return (
        <GlassesDetail
          title={formatLabel(groupDefinition)}
          editable={this.props.editable}
          glassesRx={value}
          hasVA={groupDefinition.hasVA}
          onCopyToFinalRx={
            groupDefinition.copyToFinalRx === true
              ? this.copyToFinal
              : undefined
          }
          onCopyFromFinal={
            groupDefinition.copyFromFinalRx === true
              ? this.copyFromFinal
              : undefined
          }
          onCopy={
            groupDefinition.canBeCopied === true
              ? this.props.copyData
              : undefined
          }
          onPaste={
            groupDefinition.canBePaste === true && this.props.copiedData
              ? this.pasteData
              : undefined
          }
          examId={this.props.exam.id}
          editable={
            this.props.editable !== false && groupDefinition.readonly !== true
          }
          onChangeGlassesRx={(glassesRx: GlassesRx) =>
            this.updateRefraction(groupDefinition.name, glassesRx)
          }
          onClear={() => this.clear(groupDefinition.name)}
          hasAdd={groupDefinition.hasAdd}
          hasLensType={groupDefinition.hasLensType}
          hasPD={groupDefinition.hasPD}
          hasMPD={groupDefinition.hasMPD}
          hasCustomField={groupDefinition.hasCustomField}
          key={groupDefinition.name}
          definition={groupDefinition}
          fieldId={fieldId}
        />
      );
    } else if (groupDefinition.type === 'CRx') {
      return (
        <GlassesDetail
          title={formatLabel(groupDefinition)}
          editable={this.props.editable}
          glassesRx={value}
          hasVA={groupDefinition.hasVA}
          onCopyToFinalRx={
            groupDefinition.copyToFinalRx === true
              ? this.copyToFinal
              : undefined
          }
          onCopyFromFinal={
            groupDefinition.copyFromFinalRx === true
              ? this.copyFromFinal
              : undefined
          }
          onCopy={
            groupDefinition.canBeCopied === true
              ? this.props.copyData
              : undefined
          }
          onPaste={
            groupDefinition.canBePaste === true && this.props.copiedData
              ? this.pasteData
              : undefined
          }
          examId={this.props.exam.id}
          editable={
            this.props.editable !== false && groupDefinition.readonly !== true
          }
          onChangeGlassesRx={(glassesRx: GlassesRx) =>
            this.updateRefraction(groupDefinition.name, glassesRx)
          }
          onClear={() => this.clear(groupDefinition.name)}
          hasAdd={groupDefinition.hasAdd}
          hasLensType={groupDefinition.hasLensType}
          hasPD={groupDefinition.hasPD}
          hasMPD={groupDefinition.hasMPD}
          hasCustomField={groupDefinition.hasCustomField}
          key={groupDefinition.name}
          definition={groupDefinition}
          fieldId={fieldId}
        />
      );
    } else if (groupDefinition.options != undefined) {
      return (
        <CheckList
          definition={groupDefinition}
          editable={this.props.editable}
          value={value}
          key={groupDefinition.name + '-' + index}
          onChangeField={(newValue: string) =>
            this.changeField(
              groupDefinition.name,
              undefined,
              newValue,
              undefined,
            )
          }
          onClear={() => this.clear(groupDefinition.name)}
          patientId={this.getPatientId()}
          examId={this.props.exam.id}
          onAddFavorite={
            this.props.onAddFavorite
              ? (favoriteName: string) =>
                  this.addGroupFavorite(groupDefinition.name, favoriteName)
              : undefined
          }
          editable={
            this.props.editable !== false && groupDefinition.readonly !== true
          }
          fieldId={fieldId}
        />
      );
    } else {
      return (
        <GroupedForm
          definition={groupDefinition}
          editable={this.props.editable}
          form={value}
          key={groupDefinition.name + '-' + index}
          onChangeField={(
            fieldName: string,
            newValue: string,
            column: ?string,
          ) =>
            this.changeField(groupDefinition.name, fieldName, newValue, column)
          }
          onClear={() => this.clear(groupDefinition.name)}
          onAddFavorite={
            this.props.onAddFavorite
              ? (favoriteName: string) =>
                  this.addGroupFavorite(groupDefinition.name, favoriteName)
              : undefined
          }
          enableScroll={this.props.enableScroll}
          disableScroll={this.props.disableScroll}
          onUpdateForm={(groupName: string, newValue: any) =>
            this.updateGroup(groupName, newValue)
          }
          patientId={this.getPatientId()}
          examId={this.props.exam.id}
          editable={
            this.props.editable !== false && groupDefinition.readonly !== true
          }
          fieldId={fieldId}
        />
      );
    }
  }

  renderAddableGroupsButton() {
    if (this.state.addableGroups.length === 0) {
      return null;
    }
    if (this.props.editable === false) {
      return null;
    }
    return (
      <FloatingButton
        options={this.state.addableGroups}
        onPress={(groupType: string) => this.addGroup(groupType)}
      />
    );
  }

  render() {
    return (
      <View style={styles.flow}>
        {this.props.exam.definition.fields &&
          this.props.exam.definition.fields.map(
            (groupDefinition: GroupDefinition, index: number) =>
              this.renderGroup(groupDefinition, index),
          )}
        {this.props.editable &&
          this.props.favorites &&
          this.props.favorites.length > 0 && (
            <Favorites
              favorites={this.props.favorites}
              onSelectFavorite={this.selectFavorite}
              style={styles.wideFavorites}
              onRemoveFavorite={this.props.onRemoveFavorite}
            />
          )}
        {this.renderAddableGroupsButton()}
      </View>
    );
  }
}
