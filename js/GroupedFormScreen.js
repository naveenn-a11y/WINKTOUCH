/**
 * @flow
 */

'use strict';

import {Component} from 'react';
import {Text, View} from 'react-native';
import {getCachedItem} from './DataCache';
import {Copy, Favorites, Star} from './Favorites';
import {formatLabel, getFieldDefinition} from './Items';
import {clearRefraction, GlassesDetail, initRefraction, newRefraction} from './Refraction';
import {strings} from './Strings';
import {styles} from './Styles';
import type {ExamPredefinedValue, FieldDefinition, GlassesRx, GroupDefinition} from './Types';
import {deepAssign, deepClone, isEmpty} from './Util';
import {FloatingButton, Label} from './Widgets';
import {CheckList} from './CheckList';
import {GroupedCard} from './GroupedCard';
import {getIsVisible, GroupedForm} from './GroupedForm';

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
    return getCachedItem(this.props.exam?.visitId)?.patientId;
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
      existingGlassesRx.od.add = this.props.copiedData.od.add;
      existingGlassesRx.od.prism = this.props.copiedData.od.prism;
      existingGlassesRx.os.sph = this.props.copiedData.os.sph;
      existingGlassesRx.os.cyl = this.props.copiedData.os.cyl;
      existingGlassesRx.os.axis = this.props.copiedData.os.axis;
      existingGlassesRx.os.add = this.props.copiedData.os.add;
      existingGlassesRx.os.prism = this.props.copiedData.os.prism;
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

    deepAssign(
      value,
      predefinedValue,
      this.props.exam.definition.appendStarValues,
    );
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

  isGroupStarable(groupDefinition: GroupDefinition): boolean {
    const exam: Exam = this.props.exam;
    if (exam === undefined) {
      return false;
    }
    if (exam.definition.starable) {
      return true;
    }
    if (groupDefinition.starable) {
      return true;
    }
    return false;
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
            glassesRx={childValue}
            hasVA={groupDefinition.hasVA}
            hasBVD={groupDefinition.hasBVD}
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
            hasCurrentWear={groupDefinition.hasCurrentWear}
            key={groupDefinition.name}
            onAdd={() => this.addGroupItem(groupDefinition)}
            onClear={() => this.clear(groupDefinition.name, subIndex)}
            definition={groupDefinition}
            examId={this.props.exam.id}
            fieldId={fieldId + '[' + (value.length - subIndex) + ']'}
            editable={
              this.props.editable !== false && groupDefinition.readonly !== true
            }
          />
        ) : (
          <GroupedForm
            definition={groupDefinition}
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
              this.props.onAddFavorite && this.isGroupStarable(groupDefinition)
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
          hasBVD={groupDefinition.hasBVD}
          hasCurrentWear={groupDefinition.hasCurrentWear}
          key={groupDefinition.name}
          definition={groupDefinition}
          fieldId={fieldId}
          onAddFavorite={(favorite: any, name: string) =>
            this.props.onAddFavorite(favorite, name)
          }
        />
      );
    } else if (groupDefinition.type === 'CRx') {
      return (
        <GlassesDetail
          title={formatLabel(groupDefinition)}
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
          hasBVD={groupDefinition.hasBVD}
          hasCustomField={groupDefinition.hasCustomField}
          hasCurrentWear={groupDefinition.hasCurrentWear}
          key={groupDefinition.name}
          definition={groupDefinition}
          fieldId={fieldId}
        />
      );
    } else if (groupDefinition.options != undefined) {
      return (
        <CheckList
          definition={groupDefinition}
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
            this.props.onAddFavorite && this.isGroupStarable(groupDefinition)
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
            this.props.onAddFavorite && this.isGroupStarable(groupDefinition)
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
      <View style={styles.flow} testID="grouped-form-screen">
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
