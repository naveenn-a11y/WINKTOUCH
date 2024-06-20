/**
 * @flow
 */
'use strict';

import { Component } from 'react';
import {
  LayoutAnimation,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { formatAllCodes, formatCode, parseCode } from './Codes';
import {
  cacheItem,
  cacheItemsById,
  getCachedItem,
  getCachedItems
} from './DataCache';
import { ExamCard } from './Exam';
import {
  FormNumberInput,
  FormOptions,
  FormRow,
  FormSelectionArray,
  FormSwitch,
  FormTextArrayInput,
  FormTextInput,
} from './Form';
import { GroupedFormScreen } from './GroupedForm';
import { ItemsList, SelectionListsScreen, isNumericField } from './Items';
import { mappedFields } from './MappedField';
import { PaperFormScreen } from './PaperForm';
import {
  fetchItemById,
  performActionOnItem,
  searchItems,
  storeItem,
} from './Rest';
import { getUserLanguage, strings } from './Strings';
import { fontScale, styles } from './Styles';
import type {
  Exam,
  ExamDefinition,
  FieldDefinition,
  GroupDefinition,
  TranslationDefinition
} from './Types';
import { deepClone } from './Util';
import { Button } from './Widgets';
import { CustomModal as Modal } from './utilities/Modal';

let translateMode = false;

export function toggleTranslateMode() {
  translateMode = !translateMode;
}

export function isInTranslateMode(): boolean {
  return translateMode === true;
}

const examDefinitionDefinition: FieldDefinition[] = [
  {name: 'name', required: true},
];

export async function updateLabel(
  fieldId: string,
  label: string,
  normalValue?: string,
) {
  const translation: TranslationDefinition = {
    id: 'customExamDefinition',
    language: getUserLanguage(),
    fieldId: fieldId,
    label: label,
    normalValue: normalValue,
  };
  await performActionOnItem('translateLabel', translation);
}

const types: string[] = [
  'email-address',
  'numeric',
  'phone',
  'pastDate',
  'recentDate',
  'futureDate',
  'futureDateTime',
];

export async function fetchExamDefinition(
  examDefintionId: string,
): ExamDefinition {
  let examDefinition = await fetchItemById(examDefintionId);
  return examDefinition;
}

async function fetchExamDefinitions(
  isPreExam: boolean,
  isAssessment: boolean,
): ExamDefinition[] {
  const searchCriteria = {isPreExam: isPreExam ? true : false};
  let restResponse = await searchItems(
    'CustomExamDefinition/list',
    searchCriteria,
  );
  let examDefinitions: ExamDefinition[] = restResponse.customExamDefinitionList;
  examDefinitions = examDefinitions.filter(
    (definition: ExamDefinition) =>
      (!isAssessment && !definition.isAssessment) ||
      (isAssessment && definition.isAssessment),
  );
  cacheItemsById(examDefinitions);
  cacheItem(
    isPreExam
      ? 'preExamDefinitions'
      : isAssessment
      ? 'assessmentDefinitions'
      : 'examDefinitions',
    examDefinitions.map((examDefinition: ExamDefintion) => examDefinition.id),
  );
  return examDefinitions;
}

export async function allExamDefinitions(
  isPreExam: boolean,
  isAssessment: boolean = false,
): ExamDefinition[] {
  let examDefinitions: ExamDefinition[] = getCachedItems(
    getCachedItem(
      isPreExam
        ? 'preExamDefinitions'
        : isAssessment
        ? 'assessmentDefinitions'
        : 'examDefinitions',
    ),
  );
  if (!examDefinitions) {
    examDefinitions = await fetchExamDefinitions(isPreExam, isAssessment);
  }
  if (!examDefinitions) {
    examDefinitions = [];
  }
  return examDefinitions;
}

export function getExamDefinition(examName: string): ExamDefinition {
  let examDefinitions: ExamDefinition[] = getCachedItems(
    getCachedItem('examDefinitions'),
  );
  let examDefinition: ?ExamDefinition = examDefinitions?.find(
    (examDefinition: ExamDefinition) => examDefinition.name === examName,
  );
  if (examDefinition === undefined) {
    examDefinitions = getCachedItems(getCachedItem('preExamDefinitions'));
    examDefinition = examDefinitions?.find(
      (examDefinition: ExamDefinition) => examDefinition.name === examName,
    );
  }
  if (examDefinition === undefined) {
    examDefinitions = getCachedItems(getCachedItem('assessmentDefinitions'));
    examDefinition = examDefinitions?.find(
      (examDefinition: ExamDefinition) => examDefinition.name === examName,
    );
  }
  if (__DEV__) {
    if (examDefinition === undefined) {
      console.log('No exam definition found with name ' + examName + '.');
    }
  }
  return examDefinition;
}

//export function overwriteExamDefinition(exam: Exam) : void { //TODO remove after beta
//    //if (__DEV__) return;
//    if (!exam || !exam.customExamDefinitionId) return;
//    const definition : ?ExamDefinition = getCachedItem(exam.customExamDefinitionId);
//    if (!definition) return;
//    exam.definition = definition;
//}

function newGroupDefinition(label: string): GroupDefinition {
  return {name: label, fields: []};
}

function newFieldDefinition(label: string): FieldDefinition {
  return {name: label};
}

class FieldDefinitionEditor extends Component {
  props: {
    value: FieldDefinition,
    onUpdate: (value: FieldDefinition) => void,
    onRemoveField: () => void,
    onDuplicateField: () => void,
    onDismiss: () => void,
  };

  updateFieldDefinition(fieldName: string, value?: any) {
    let fieldDefinition: FieldDefinition = this.props.value;
    if (!fieldDefinition) {
      return;
    }
    fieldDefinition[fieldName] = value;
    this.props.onUpdate(fieldDefinition);
  }

  setNumeric(isNumeric: boolean): void {
    const fieldDefinition: ?FieldDefinition = this.props.value;
    if (!fieldDefinition) {
      return;
    }
    if (isNumeric) {
      fieldDefinition.minValue = 0;
      fieldDefinition.maxValue = 10;
      (fieldDefinition.stepSize = undefined),
        (fieldDefinition.groupSize = undefined),
        (fieldDefinition.decimals = undefined),
        (fieldDefinition.multiValue = undefined),
        (fieldDefinition.options = undefined);
    } else {
      (fieldDefinition.minValue = undefined),
        (fieldDefinition.maxValue = undefined),
        (fieldDefinition.stepSize = undefined),
        (fieldDefinition.groupSize = undefined),
        (fieldDefinition.decimals = undefined),
        (fieldDefinition.multiValue = undefined),
        (fieldDefinition.options = []);
    }
    this.props.onUpdate(fieldDefinition);
  }

  render() {
    const fieldDefinition: FieldDefinition = this.props.value;
    if (!fieldDefinition) {
      return null;
    }
    const isMapped: boolean =
      fieldDefinition.mappedField !== undefined &&
      fieldDefinition.mappedField !== null;
    const isNumeric: boolean = isNumericField(fieldDefinition);
    return (
      <TouchableWithoutFeedback onPress={this.props.onDismiss}>
        <View
          style={{
            flex: 100,
            backgroundColor: '#00000099',
            padding: 30 * fontScale,
          }}>
          <Text style={styles.modalTitle}>{fieldDefinition.name}</Text>
          <View style={styles.form}>
            <FormRow>
              <View style={styles.flow2}>
                <FormTextInput
                  label="Label"
                  value={fieldDefinition.name}
                  onChangeText={(newLabel: string) =>
                    this.updateFieldDefinition('name', newLabel)
                  }
                />
              </View>
              <View style={styles.flow2}>
                <FormOptions
                  label="Mapped field"
                  value={fieldDefinition.mappedField}
                  options={mappedFields}
                  onChangeValue={(newValue?: string) =>
                    this.updateFieldDefinition('mappedField', newValue)
                  }
                />
              </View>
              <FormSwitch
                label="Read-only"
                value={fieldDefinition.readonly}
                onChangeValue={(newValue: boolean) =>
                  this.updateFieldDefinition('readonly', newValue)
                }
              />
              <FormSwitch
                label="Required"
                value={fieldDefinition.required}
                onChangeValue={(newValue: boolean) =>
                  this.updateFieldDefinition('required', newValue)
                }
              />
            </FormRow>
            {!isMapped && (
              <FormRow>
                <FormOptions
                  label="Type"
                  value={fieldDefinition.type}
                  options={types}
                  onChangeValue={(newValue?: string) =>
                    this.updateFieldDefinition('type', newValue)
                  }
                />
                <FormTextInput
                  label="Normal value"
                  value={fieldDefinition.normalValue}
                  onChangeText={(newValue: string) =>
                    this.updateFieldDefinition('normalValue', newValue)
                  }
                />
                <FormTextInput
                  label="Prefix"
                  value={fieldDefinition.prefix}
                  onChangeText={(newValue: string) =>
                    this.updateFieldDefinition('prefix', newValue)
                  }
                />
                <FormTextInput
                  label="Suffix"
                  value={fieldDefinition.suffix}
                  onChangeText={(newValue: string) =>
                    this.updateFieldDefinition('suffix', newValue)
                  }
                />
              </FormRow>
            )}
            {!isMapped && (
              <FormRow>
                <FormSwitch
                  label="Numeric"
                  value={isNumeric}
                  onChangeValue={(newValue: boolean) =>
                    this.setNumeric(newValue)
                  }
                />
                <FormSwitch
                  label="Freestyle"
                  value={fieldDefinition.freestyle}
                  onChangeValue={(newValue: boolean) =>
                    this.updateFieldDefinition('freestyle', newValue)
                  }
                />
                <FormSwitch
                  label="New Line"
                  value={fieldDefinition.newLine}
                  onChangeValue={(newValue: boolean) =>
                    this.updateFieldDefinition('newLine', newValue)
                  }
                />
                <FormSwitch
                  label="Simple Select"
                  value={fieldDefinition.simpleSelect}
                  onChangeValue={(newValue: boolean) =>
                    this.updateFieldDefinition('simpleSelect', newValue)
                  }
                />
              </FormRow>
            )}
            {!isMapped && (
              <View style={styles.todoExamCardExpanded}>
                {isNumeric && (
                  <FormRow>
                    <FormNumberInput
                      label="Minimum"
                      required={true}
                      minValue={-10000}
                      maxValue={10000}
                      value={fieldDefinition.minValue}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('minValue', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Maximum"
                      required={true}
                      minValue={-10000}
                      maxValue={10000}
                      value={fieldDefinition.maxValue}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('maxValue', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Decimals"
                      freestyle={true}
                      value={fieldDefinition.decimals}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('decimals', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Step size"
                      freestyle={true}
                      value={fieldDefinition.stepSize}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('stepSize', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Group size"
                      freestyle={true}
                      value={fieldDefinition.groupSize}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('groupSize', newValue)
                      }
                    />
                  </FormRow>
                )}
                {!isNumeric && (
                  <FormRow>
                    <FormSwitch
                      label="Can contain more then one value"
                      value={fieldDefinition.multiValue}
                      onChangeValue={(newValue: boolean) =>
                        this.updateFieldDefinition('multiValue', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Minimum nr of characters"
                      minValue={0}
                      maxValue={10000}
                      value={fieldDefinition.minLength}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('minLength', newValue)
                      }
                    />
                    <FormNumberInput
                      label="Maximum nr of characters"
                      minValue={1}
                      maxValue={10000}
                      value={fieldDefinition.maxLength}
                      onChangeValue={(newValue: ?number) =>
                        this.updateFieldDefinition('maxLength', newValue)
                      }
                    />
                  </FormRow>
                )}
                {!isNumeric && (
                  <FormRow>
                    <FormTextArrayInput
                      label="Options"
                      value={explode(fieldDefinition.options)}
                      onChangeValue={(newValue: ?(string[])) =>
                        this.updateFieldDefinition('options', implode(newValue))
                      }
                    />
                  </FormRow>
                )}
              </View>
            )}
            <View style={styles.buttonsRowLayout}>
              <Button title={'Remove'} onPress={this.props.onRemoveField} />
              <Button
                title={'Duplicate'}
                onPress={this.props.onDuplicateField}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

function explode(value: ?string | ?(string[])): ?(string[]) {
  if (value === undefined || value === null) {
    return value;
  }
  if (value instanceof Array) {
    return value;
  }
  return [value];
}

function implode(value: ?(string[])): ?string | ?(string[]) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value.length === 1) {
    return value[0];
  }
  return value;
}

class FieldsDefinitionEditor extends Component {
  props: {
    value: FieldDefinition[],
    label?: string,
    onUpdate: (newValue: FieldDefinition[]) => void,
  };
  state: {
    fieldDefinition: ?FieldDefinition,
  };

  static defaultProps = {
    label: 'Fields',
  };

  constructor(props: any) {
    super(props);
    this.state = {
      fieldDefinition: undefined,
    };
  }

  selectField = (index: number): void => {
    let fieldDefinitions: FieldDefinition[] = this.props.value;
    if (index < 0 || index > fieldDefinitions.length) {
      return;
    }
    let fieldDefinition: ?FieldDefinition = fieldDefinitions[index];
    this.setState({fieldDefinition});
  };

  addField = (): void => {
    let fieldDefinitions: FieldDefinition[] =
      this.props.value !== undefined ? this.props.value : [];
    fieldDefinitions.push(newFieldDefinition('New field'));
    this.props.onUpdate(fieldDefinitions);
  };

  updateField = (): void => {
    let fieldDefinitions: FieldDefinition[] =
      this.props.value !== undefined ? this.props.value : [];
    this.props.onUpdate(fieldDefinitions);
  };

  dismissPopup = () => {
    this.setState({fieldDefinition: undefined});
  };

  componentWillUnmount() {
    this.dismissPopup();
  }

  duplicateField = () => {
    const duplicateField: ?FieldDefinition = deepClone(
      this.state.fieldDefinition,
    );
    if (!duplicateField) {
      return;
    }
    let fieldDefinitions: FieldDefinition[] =
      this.props.value !== undefined ? this.props.value : [];
    duplicateField.name = strings.duplicate;
    fieldDefinitions.push(duplicateField);
    this.props.onUpdate(fieldDefinitions);
    this.dismissPopup();
  };

  removeField = () => {
    let fieldDefinitions: FieldDefinition[] = this.props.value;
    if (!fieldDefinitions || fieldDefinitions.length === 0) {
      return;
    }
    const fieldDefinition: ?FieldDefinition = this.state.fieldDefinition;
    const index: number = fieldDefinitions.indexOf(fieldDefinition);
    fieldDefinitions.splice(index, 1);
    this.props.onUpdate(fieldDefinitions);
    this.dismissPopup();
  };

  removeLastField = () => {
    let fieldDefinitions: FieldDefinition[] = this.props.value;
    if (!fieldDefinitions || fieldDefinitions.length === 0) {
      return;
    }
    fieldDefinitions.pop();
    this.props.onUpdate(fieldDefinitions);
    this.dismissPopup();
  };

  render() {
    let fieldDefinitions: FieldDefinition[] =
      this.props.value !== undefined ? this.props.value : [];
    return (
      <View style={styles.flow}>
        <FormSelectionArray
          label="Fields"
          value={fieldDefinitions.map(
            (fieldDefinition: FieldDefinition) => fieldDefinition.name,
          )}
          onAdd={this.addField}
          onRemove={this.removeLastField}
          onSelect={this.selectField}
        />
        <Modal
          visible={
            this.state.fieldDefinition !== undefined &&
            this.state.fieldDefinition !== null
          }
          transparent={true}
          animationType={'fade'}
          onRequestClose={this.dismissPopup}>
          <FieldDefinitionEditor
            value={this.state.fieldDefinition}
            onUpdate={this.updateField}
            onRemoveField={this.removeField}
            onDuplicateField={this.duplicateField}
            onDismiss={this.dismissPopup}
          />
        </Modal>
      </View>
    );
  }
}

class GroupDefinitionEditor extends Component {
  props: {
    value: GroupDefinition,
    onUpdate: (value: GroupDefinition) => void,
  };
  state: {
    groupDefinition: GroupDefinition,
  };
  constructor(props: any) {
    super(props);
    this.state = {
      groupDefinition: this.props.value,
    };
  }

  componentDidUpdate(prevProps: any): void {
    if (prevProps.value === this.props.value) {
      return;
    }
    this.setState({groupDefinition: this.props.value});
  }

  updateColumns(columns: string[], groupDefinition: GroupDefinition): void {
    if (columns === undefined) {
      const fieldDefinitions: FieldDefinition[] =
        this.getFieldsDefinitions(groupDefinition);
      groupDefinition.fields = fieldDefinitions;
    } else {
      const fieldDefinitions: FieldDefinition[] =
        this.getFieldsDefinitions(groupDefinition);
      groupDefinition.fields = [];
      columns.forEach((column: string) =>
        groupDefinition.fields.push({name: column, fields: fieldDefinitions}),
      );
    }
  }

  updateGroupDefinition(fieldName: string, value: any): void {
    let groupDefinition: GroupDefinition = this.state.groupDefinition;
    if (fieldName === 'columns') {
      //TODO make a widget for array values and remove this shit, euh didn't I do that already?
      let columns: ?(string[]) = value.split(',');
      if (
        columns == null ||
        columns.length === 0 ||
        (columns.length === 1 && columns[0].trim() === '')
      ) {
        columns = undefined;
      }
      this.updateColumns(columns, groupDefinition);
      groupDefinition[fieldName] = columns;
    } else if (fieldName === 'fields') {
      if (this.hasColumns(groupDefinition)) {
        groupDefinition.fields &&
          groupDefinition.fields.forEach(
            (fieldDefinition: FieldDefinition) =>
              (fieldDefinition[fieldName] = value),
          );
      } else {
        groupDefinition[fieldName] = value;
      }
    } else {
      groupDefinition[fieldName] = value;
    }

    this.props.onUpdate(groupDefinition);
  }

  hasColumns(groupDefinition: GroupDefinition): boolean {
    return (
      groupDefinition.columns !== undefined &&
      groupDefinition.columns.length > 0 &&
      groupDefinition.columns[0] !== undefined &&
      groupDefinition.columns[0] != ''
    );
  }

  getFieldsDefinitions(groupDefinition: GroupDefinition): FieldDefinition[] {
    if (this.hasColumns(groupDefinition)) {
      if (groupDefinition.fields === undefined) {
        return undefined;
      }
      const firstColumn: string = groupDefinition.columns[0];
      const columnDefinition: FieldDefinition = groupDefinition.fields.find(
        (fieldDefinition: FieldDefinition) =>
          fieldDefinition.name === firstColumn,
      );
      if (columnDefinition === undefined) {
        return undefined;
      }
      return columnDefinition.fields;
    }
    return groupDefinition.fields;
  }

  render() {
    let groupDefinition: GroupDefinition = this.state.groupDefinition;
    let fields: FieldDefinition | GroupDefinition[] =
      this.getFieldsDefinitions(groupDefinition);
    return (
      <View style={styles.todoExamCardExpanded}>
        <FormRow>
          <FormTextInput
            label="Group"
            value={groupDefinition.name}
            onChangeText={(newLabel: string) =>
              this.updateGroupDefinition('name', newLabel)
            }
          />
          <FormOptions
            label="Size"
            options={formatAllCodes('size')}
            value={formatCode('size', groupDefinition.size)}
            onChangeValue={(newValue?: string) =>
              this.updateGroupDefinition('size', parseCode('size', newValue))
            }
          />
        </FormRow>
        <FormRow>
          <FormTextInput
            label="Columns"
            value={
              groupDefinition.columns ? '' + groupDefinition.columns : undefined
            }
            onChangeText={(newValue: string) =>
              this.updateGroupDefinition('columns', newValue)
            }
          />
        </FormRow>
        <FormRow>
          <FieldsDefinitionEditor
            value={fields}
            onUpdate={(newValue: FieldDefinition[]) =>
              this.updateGroupDefinition('fields', newValue)
            }
          />
        </FormRow>
      </View>
    );
  }
}

class ExamDefinitionHeader extends Component {
  props: {
    examDefinition: ExamDefinition,
    onUpdate: (fieldName: string, value: any) => void,
  };
  state: {
    selectedField: ?FieldDefinition,
    selectedGroup: ?GroupDefinition,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      selectedField: undefined,
      selectedGroup: undefined,
    };
  }

  addField = (index?: number) => {
    let fields: FieldDefinition[] = this.props.examDefinition.fields
      ? this.props.examDefinition.fields
      : [];
    let field: FieldDefinition = newFieldDefinition('New field');
    fields.push(field);
    this.setState({selectedField: field});
    this.props.onUpdate('fields', fields);
  };

  addGroup = (index?: number) => {
    let groups: GroupDefinition[] = this.props.examDefinition.fields
      ? this.props.examDefinition.fields
      : [];
    let group: GroupDefinition = newGroupDefinition('New group');
    groups.push(group);
    this.setState({selectedGroup: group});
    this.props.onUpdate('fields', groups);
  };

  selectField = (index: number) => {
    if (
      !this.props.examDefinition.fields ||
      this.props.examDefinition.fields.length <= index ||
      index < 0
    ) {
      return;
    }
    let selectedField: ?FieldDefinition =
      this.props.examDefinition.fields[index];
    if (this.state.selectedField === selectedField) {
      selectedField = undefined;
    }
    LayoutAnimation.easeInEaseOut();
    this.setState({selectedField});
  };

  removeGroup = () => {
    if (
      !this.props.examDefinition.fields ||
      this.props.examDefinition.fields.length === 0
    ) {
      return;
    }
    let groups: GroupDefinition[] = this.props.examDefinition.fields;
    if (this.state.selectedGroup) {
      groups.splice(groups.indexOf(this.state.selectedGroup), 1);
      this.setState({selectedGroup: undefined});
    } else {
      groups.pop();
    }
    this.props.onUpdate('fields', groups);
  };

  selectGroup = (index: number) => {
    if (
      !this.props.examDefinition.fields ||
      this.props.examDefinition.fields.length <= index ||
      index < 0
    ) {
      return;
    }
    let selectedGroup: ?GroupDefinition =
      this.props.examDefinition.fields[index];
    if (this.state.selectedGroup === selectedGroup) {
      selectedGroup = undefined;
    }
    LayoutAnimation.easeInEaseOut();
    this.setState({selectedGroup});
  };

  render() {
    return (
      <View style={styles.columnCard}>
        <FormRow>
          <FormTextInput
            label="Exam"
            readonly={true}
            value={this.props.examDefinition.name}
            onChangeText={(newName: string) =>
              this.props.onUpdate('name', newName)
            }
          />
          <FormTextInput
            label="Section"
            readonly={true}
            value={this.props.examDefinition.section}
            onChangeText={(newSection: string) =>
              this.props.onUpdate('section', newSection)
            }
          />
          <View style={styles.flow1}>
            <FormOptions
              label="Type"
              readonly={true}
              options={formatAllCodes('examDefinitionType')}
              value={formatCode(
                'examDefinitionType',
                this.props.examDefinition.type,
              )}
              onChangeValue={(newValue?: string) =>
                this.props.onUpdate(
                  'type',
                  parseCode('examDefinitionType', newValue),
                )
              }
            />
          </View>
        </FormRow>
        <FormRow>
          <FormSwitch
            label={strings.preExams}
            readonly={this.props.examDefinition.isAssessment}
            value={this.props.examDefinition.isPreExam}
            onChangeValue={(newValue?: boolean) =>
              this.props.onUpdate('isPreExam', newValue)
            }
          />
          <FormSwitch
            label="Active"
            readonly={true}
            value={!this.props.examDefinition.isInactive}
            onChangeValue={(newValue: boolean) =>
              this.props.onUpdate('isInactive', !newValue)
            }
          />
        </FormRow>

        {/*
                 <FormRow>
          {this.props.examDefinition.type === 'groupedForm' && (
            <FormTextInput
              label="Card group"
              value={this.props.examDefinition.cardGroup}
              onChangeText={(newValue: string) =>
                this.props.onUpdate('cardGroup', newValue)
              }
            />
          )}
          <FormTextArrayInput
            label="Card Fields"
            value={this.props.examDefinition.cardFields}
            onChangeValue={(newValue: string[]) =>
              this.props.onUpdate('cardFields', newValue)
            }
          />
          <FormSwitch
            label="Starable"
            value={this.props.examDefinition.starable}
            onChangeValue={(newValue: boolean) =>
              this.props.onUpdate('starable', newValue)
            }
          />
        </FormRow>
        {this.props.examDefinition.type === 'selectionLists' && (
          <FormRow>
            <FormSwitch
              label="Addable"
              value={this.props.examDefinition.addable}
              onChangeValue={(newValue: boolean) =>
                this.props.onUpdate('addable', newValue)
              }
            />
            <FormSwitch
              label="Editable"
              value={this.props.examDefinition.editable}
              onChangeValue={(newValue: boolean) =>
                this.props.onUpdate('editable', newValue)
              }
            />
            <View style={styles.flow2}>
              <FormSwitch
                label="Starable"
                value={this.props.examDefinition.starable}
                onChangeValue={(newValue: boolean) =>
                  this.props.onUpdate('starable', newValue)
                }
              />
            </View>
          </FormRow>
        )}
        {this.props.examDefinition.type === 'selectionLists' && (
          <FormRow>
            <FieldsDefinitionEditor
              value={this.props.examDefinition.fields}
              onUpdate={(newValue: FieldDefinition[]) =>
                this.props.onUpdate('fields', newValue)
              }
            />
          </FormRow>
        )}
        {this.props.examDefinition.type === 'groupedForm' && (
          <FormRow>
            <FormSelectionArray
              label="Groups"
              value={
                this.props.examDefinition.fields
                  ? this.props.examDefinition.fields.map(
                      (groupDefinition: GroupDefinition) =>
                        groupDefinition.name,
                    )
                  : []
              }
              onAdd={this.addGroup}
              onRemove={this.state.selectedGroup ? this.removeGroup : undefined}
              onSelect={this.selectGroup}
            />
          </FormRow>
        )}
        {this.props.examDefinition.type === 'groupedForm' &&
          this.state.selectedGroup && (
            <GroupDefinitionEditor
              value={this.state.selectedGroup}
              onUpdate={(value: GroupDefinition) =>
                this.props.onUpdate('fields', this.props.examDefinition.fields)
              }
            />
          )}
        {this.props.examDefinition.type === 'paperForm' && (
          <FormRow>
            <FormTextInput
              label="Image"
              value={this.props.examDefinition.image}
              onChangeText={(newValue: string) =>
                this.props.onUpdate('image', newValue)
              }
            />
          </FormRow>
        )}
          <View style={styles.buttonsRowLayout}>
          <Button
              title="Remove Template"
              onPress={() => alert('TODO confirm delete')}
          />
        </View>
        */}
      </View>
    );
  }
}

export class ExamDefinitionScreen extends Component {
  props: {
    navigation: any,
    examDefinition: ExamDefinition,
  };
  params: {
    examDefinition: ExamDefinition,
  };
  state: {
    exam: Exam,
    isDirty: boolean,
  };
  unmounted: boolean;

  constructor(props: any) {
    super(props);
    let examDefinition = this.props.route.params.examDefinition;
    const exam: Exam = this.initExam(examDefinition);
    this.state = {
      exam,
      isDirty: false,
    };
  }

  initExam(examDefinition: ExamDefinition): Exam {
    let exam: Exam = {
      definition: examDefinition,
      id: undefined,
      version: undefined,
      hasStarted: false,
    };
    if (!examDefinition) {
      return exam;
    }
    if (examDefinition.type === 'selectionLists') {
      exam[examDefinition.name] = [{}];
    } else {
      exam[examDefinition.name] = {};
    }
    return exam;
  }

  componentWillUnmount() {
    this.unmounted = true;
    if (this.state.isDirty) {
      this.storeExamDefinition(this.state.exam.definition);
    }
  }

  async refreshExamDefinition() {
    if (
      this.props.route.params.examDefinition.id.startsWith(
        'customExamDefinition-',
      )
    ) {
      const examDefinition: ExamDefinition = await fetchExamDefinition(
        this.props.route.params.examDefinition.id,
      );
      if (examDefinition !== this.state.exam.definition) {
        let exam: Exam = this.initExam(examDefinition);
        this.setState({exam});
      }
    } else {
      //TODO: refresh exam ?
    }
  }

  cleanExamDefinition(examDefinition: ExamDefinition): ExamDefinition {
    if (examDefinition.type === 'groupedForm') {
      examDefinition.image = undefined;
    } else if (examDefinition.type === 'selectionLists') {
      examDefinition.image = undefined;
    } else if (examDefinition.type === 'paperForm') {
    }
    return examDefinition;
  }

  async storeExamDefinition(examDefinition: ExamDefinition) {
    if (!examDefinition.id.startsWith('customExamDefinition-')) {
      alert('TODO: update exam template');
      return;
    }
    examDefinition = deepClone(examDefinition);
    examDefinition = this.cleanExamDefinition(examDefinition);
    try {
      examDefinition = await storeItem(examDefinition);
      if (!this.unmounted) {
        let exam: Exam = this.state.exam;
        exam.definition = examDefinition;
        if (!exam[examDefinition.name]) {
          exam[examDefinition.name] = {};
        }
        this.setState({exam, isDirty: false});
      }
    } catch (error) {
      if (this.unmounted) {
        this.props.navigation.navigate(
          'examTemplate',
          this.props.route.params.examDefinition,
        );
      } else {
        await this.refreshExamDefinition();
      }
    }
  }

  update = (fieldName: string, value: any) => {
    let exam = this.state.exam;
    if (fieldName === 'type') {
      if (value === 'selectionLists') {
        if (
          exam.definition.type === 'groupedForm' &&
          exam.definition.fields &&
          exam.definition.fields.length > 0
        ) {
          exam.definition.fields = exam.definition.fields[0].fields;
        }
      }
      if (
        exam.definition.type === 'paperForm' &&
        exam.definition.image === undefined
      ) {
        exam.definition.image = './image/eyeexamtemplate.png';
      }
      exam.definition.type = value;
      exam = this.initExam(exam.definition);
    } else {
      exam.definition[fieldName] = value;
    }
    //if (!exam[exam.definition.name]) exam[exam.definition.name] = {};
    this.setState({exam, isDirty: true});
  };

  componentWillMount() {
    this.refreshExamDefinition();
  }

  renderExamCard() {
    return (
      <ExamCard
        exam={this.state.exam}
        onSelect={() => this.setState({exam: this.state.exam})}
      />
    );
  }

  renderExam() {
    switch (this.state.exam.definition.type) {
      case 'selectionLists':
        return <SelectionListsScreen exam={this.state.exam} />;
      case 'groupedForm':
        return <GroupedFormScreen exam={this.state.exam} />;
      case 'paperForm':
        return <PaperFormScreen exam={this.state.exam} />;
    }
    return (
      <Text style={styles.screenTitle}>
        {this.state.exam.definition.name} Exam
      </Text>
    );
  }

  render() {
    if (!this.state.exam.definition) {
      return null;
    }
    return (
      <View style={styles.screeen}>
        <View style={styles.scrollviewContainer}>
          <Text style={styles.screenTitle}>
            {this.state.exam.definition.name}
          </Text>
          <View style={styles.centeredRowLayout}>
            <ExamDefinitionHeader
              examDefinition={this.state.exam.definition}
              onUpdate={this.update}
            />
          </View>
          {/*
             <View style={styles.examPreview}>
            {this.renderExamCard()}
            <View style={styles.centeredScreenLayout}>
              <View style={styles.centeredColumnLayout}>
                <View style={{transform: [{scale: 0.85}]}}>
                  {this.renderExam()}
                </View>
              </View>
            </View>
          </View>
          */}
        </View>
      </View>
    );
  }
}

export class TemplatesScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    preExamDefinitions: ExamDefinition[],
    examDefinitions: ExamDefinition[],
    assessmentDefintions: ExamDefinition[],
    selectedExamDefinition: ?ExamDefinition,
  };
  constructor(props: any) {
    super(props);
    let preExamDefinitions = getCachedItems(
      getCachedItem('preExamDefinitions'),
    );
    if (!preExamDefinitions) {
      preExamDefinitions = [];
    }
    let examDefinitions = getCachedItems(getCachedItem('examDefinitions'));
    if (!examDefinitions) {
      examDefinitions = [];
    }
    let assessmentDefintions = getCachedItems(
      getCachedItem('assessmentDefinitions'),
    );
    if (!assessmentDefintions) {
      assessmentDefintions = [];
    }
    this.state = {
      preExamDefinitions,
      examDefinitions,
      assessmentDefintions,
      selectedExamDefinition: undefined,
    };
  }

  componentWillMount() {
    this.refreshExamDefinitions();
  }

  async refreshExamDefinitions() {
    let preExamDefinitions: ExamDefinition[] = await allExamDefinitions(
      true,
      false,
    );
    let examDefinitions: ExamDefinition[] = await allExamDefinitions(
      false,
      false,
    );
    let assessmentDefintions: ExamDefinition[] = await allExamDefinitions(
      false,
      true,
    );
    this.setState({preExamDefinitions, examDefinitions, assessmentDefintions});
  }

  selectExamDefinition = (examDefinition: ExamDefinition) => {
    this.props.navigation.navigate('examTemplate', {examDefinition});
  };

  createExamDefinition(isPreExam: boolean, isAssessment: boolean): void {
    alert('TODO'); //TODO
  }

  isEditable = (examDefinition: ExamDefinition) => {
    return (
      examDefinition.type === 'selectionLists' ||
      examDefinition.type === 'groupedForm' ||
      examDefinition.type === 'paperForm'
    );
  };

  render() {
    let allExamDefinitions: ExamDefinition[] = [];
    let preExamDefinitions = getCachedItems(
      getCachedItem('preExamDefinitions'),
    );
    if (!preExamDefinitions) {
      preExamDefinitions = [];
    }
    allExamDefinitions = allExamDefinitions.concat(preExamDefinitions);
    let examDefinitions = getCachedItems(getCachedItem('examDefinitions'));
    if (!examDefinitions) {
      examDefinitions = [];
    }
    allExamDefinitions = allExamDefinitions.concat(examDefinitions);

    let assessmentDefintions = getCachedItems(
      getCachedItem('assessmentDefinitions'),
    );
    if (!assessmentDefintions) {
      assessmentDefintions = [];
    }
    allExamDefinitions = allExamDefinitions.concat(assessmentDefintions);
    preExamDefinitions = allExamDefinitions.filter(
      (exam: ExamDefinition) => exam.isPreExam,
    );
    assessmentDefintions = allExamDefinitions.filter(
      (exam: ExamDefinition) => exam.isAssessment,
    );
    examDefinitions = allExamDefinitions.filter(
      (exam: ExamDefinition) => !exam.isAssessment && !exam.isPreExam,
    );
    return (
      <View style={styles.centeredScreenLayout}>
        <View style={styles.flexColumnLayout}>
          <Text style={styles.screenTitle}>Templates</Text>
          <View style={styles.flexRow}>
            <ItemsList
              title="Pre Tests"
              items={preExamDefinitions.filter(this.isEditable)}
              fieldDefinitions={examDefinitionDefinition}
              onAddItem={() => this.createExamDefinition(true, false)}
              selectedItem={this.state.selectedExamDefinition}
              onSelectItem={this.selectExamDefinition}
            />
            <ItemsList
              title="Exams"
              items={examDefinitions.filter(this.isEditable)}
              fieldDefinitions={examDefinitionDefinition}
              onAddItem={() => this.createExamDefinition(false, false)}
              selectedItem={this.state.selectedExamDefinition}
              onSelectItem={this.selectExamDefinition}
            />
            <ItemsList
              title="Assessments"
              items={assessmentDefintions.filter(this.isEditable)}
              fieldDefinitions={examDefinitionDefinition}
              onAddItem={() => this.createExamDefinition(false, true)}
              selectedItem={this.state.selectedExamDefinition}
              onSelectItem={this.selectExamDefinition}
            />
          </View>
        </View>
      </View>
    );
  }
}
