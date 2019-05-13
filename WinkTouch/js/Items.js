/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, Text, Button, TouchableHighlight, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {Exam, ExamDefinition, FieldDefinition, GroupDefinition, FieldDefinitions, ExamPredefinedValue, GlassesRx } from './Types';
import { strings } from './Strings';
import { styles, selectionColor, fontScale } from './Styles';
import { TilesField, TextField, NumberField, SelectionList, stripSelectionPrefix, selectionPrefix, FloatingButton } from './Widgets';
import { FormTextInput, FormRow, FormInput, FormLabel } from './Form';
import { formatDate, dateFormat, dateTimeFormat, yearDateFormat, yearDateTimeFormat, isToyear, deepClone, deepAssign, isEmpty, formatTime} from './Util';
import { formatAllCodes, parseCode, formatCode} from './Codes';
import { getDefinitionCacheKey, fetchItemDefinition } from './Rest';
import { getCachedItem, cacheItem } from './DataCache';
import { Favorites, Star, Garbage, Plus, PaperClip, DrawingIcon, CopyRow, CopyColumn } from './Favorites';
import { GlassesDetail, GlassesSummary, newRefraction, ContactsDetail } from './Refraction';
import { getExamDefinition } from './ExamDefinition';
import { getFieldDefinition as getExamFieldDefinition, getFieldValue as getExamFieldValue } from './Exam';
import { CheckButton } from './Widgets';

export function getFieldDefinitions(itemId: string) : ?FieldDefinitions {
    if (itemId===undefined || itemId===null) return null;
    const cacheKey : string = getDefinitionCacheKey(itemId);
    let definitions : FieldDefinitions = getCachedItem(cacheKey);
    return definitions;
}

export function getFieldDefinition(fullFieldName: string) : ?FieldDefinition {
  let fieldNames : string[] = fullFieldName.split('.');
  if (fieldNames===undefined || fieldNames.length<2) return undefined;
  if (fieldNames[0]==='clFitting') return undefined;
  let fieldDefinitions : ?FieldDefinition[];
  if (fieldNames[0]==='exam' && fieldNames.length>1) {
    fieldDefinitions = getExamDefinition(fieldNames[1]).fields;
  } else {
    fieldDefinitions = getFieldDefinitions(fieldNames[0]);
  }
  if (fieldDefinitions===undefined)    {
    //__DEV__ && console.warn('No fieldDefinitions exists for '+fieldNames[0]);
    return undefined;
  }
  let fieldDefinition : ?FieldDefinition|?GroupDefinition;
  for (let i=1; i<fieldNames.length;i++) {
    fieldDefinition = fieldDefinitions.find((fieldDefinition: FieldDefinition|GroupDefinition) => fieldDefinition.name === fieldNames[i]);
    if (fieldDefinition && fieldDefinition.fields!==undefined) fieldDefinitions = fieldDefinition.fields;
  }
  if (fieldDefinition===undefined) {
    __DEV__ && console.error('No fieldDefinition \''+fullFieldName+'\' exists.');
    return undefined;
  }
  return fieldDefinition;
}

export async function cacheDefinitions(language: string) {
    cacheItem('preExamDefinitions', undefined);
    cacheItem('assessmentDefinitions', undefined);
    cacheItem('examDefinitions', undefined);
    cacheItem('examPredefinedValues', undefined);
    cacheItem('visitTypes', undefined);
    await fetchItemDefinition('patient', language);
    await fetchItemDefinition('visit', language);
}


export function formatValue(value: ?string|?number|?string[]|?number[], fieldDefinition: FieldDefinition) : string {
  if (value===undefined || value===null || value==='') return '';
  if (typeof value === 'string') {
    let formattedValue = value;
    if (fieldDefinition.prefix==='+' && !formattedValue.startsWith('-') && !formattedValue.startsWith('+')) {
      formattedValue = '+'+formattedValue;
    }
    return formattedValue;
  } else if (typeof value==='number') {
    let decimals : number = fieldDefinition.decimals;
    if (decimals===undefined || decimals===0 || decimals<0) decimals = 0;
    let formattedValue : string = value.toFixed(decimals);
    if (fieldDefinition.prefix==='+' && !formattedValue.startsWith('-') && !formattedValue.startsWith('+')) {
      formattedValue = '+'+formattedValue;
    }
    return formattedValue;
  } else {
    return new String(value).valueOf();
  }
}

export function formatFieldValue(value: ?string|?number|?string[]|?number[], fieldDefinition: FieldDefinition) : string {
  if (value===undefined) value=fieldDefinition.defaultValue;
  if (value===undefined || value===null || value==='' || value===fieldDefinition.normalValue) return '';
  const label : ?string = formatLabel(fieldDefinition);
  if (fieldDefinition.options && fieldDefinition.options.length===2 && fieldDefinition.defaultValue===fieldDefinition.options[0]) {//Checkbox with booleans
    if (value===true) {
      value = label;
    }
  }
  if (fieldDefinition.type && fieldDefinition.type.includes('Date')) {
    return formatDate(value, isToyear(value)?dateFormat:yearDateFormat);
  }
  if (fieldDefinition.type && (fieldDefinition.type==='time' || fieldDefinition.type.includes('Time'))) {
    return formatTime(value);
  }
  //is this is a code field?
  if (fieldDefinition.options && !fieldDefinition.combineOptions && fieldDefinition.options instanceof Array === false) {
    const codeType : string = fieldDefinition.options;
    if (fieldDefinition.multiValue) {
      if (value===undefined || value===null || value.length===0) return '';
      const formattedValues : string[] = value.map((code: string) => {
        const prefix : string = selectionPrefix(code);
        const suffix : string = formatSuffix(fieldDefinition);
        return prefix + formatCode(codeType, stripSelectionPrefix(code)) + suffix;
      });
      return new String(formattedValues).valueOf();
    }
    let prefix : string = selectionPrefix(value); //TODO: append fieldDefinition.prefix
    const suffix : string = formatSuffix(fieldDefinition);
    return prefix + formatCode(codeType, stripSelectionPrefix(value)) + suffix;
  }
  if ((fieldDefinition.prefix && fieldDefinition.prefix instanceof Array === false) || (fieldDefinition.suffix && fieldDefinition.suffix instanceof Array === false)) {
    return formatPrefix(fieldDefinition, value) + formatValue(value, fieldDefinition) + formatSuffix(fieldDefinition);
  }
  return formatValue(value, fieldDefinition);
}

function constructItemView(itemView: string, item: any, fieldDefinitions: FieldDefinition[], isSelected: boolean, editable: boolean, onUpdateItem?: (propertyName: string, value: any) => void, orientation: string, titleFields?: string[], showLabels?: boolean = false) {
  switch (itemView) {
    case 'EditableItem':
      return <View style={{flex: 10}}>
        <EditableItem item={item} fieldDefinitions={fieldDefinitions} titleFields={titleFields} isSelected={isSelected} onUpdateItem={onUpdateItem} orientation={orientation} editable={editable}/>
      </View>
  }
  return <View style={isSelected?styles.listRowSelected:styles.listRow}>
    <ItemSummary item={item} orientation={orientation} fieldDefinitions={fieldDefinitions} editable={editable} showLabels={showLabels}/>
  </View>
}

class ItemSummary extends Component {
  props: {
    item: any,
    fieldDefinitions: ?FieldDefinition[],
    editable?: boolean,
    orientation?: string,
    showLabels?: boolean
  }

  render() {
    if (!this.props.item || !this.props.fieldDefinitions) return null;
    if (this.props.orientation !== 'horizontal') {
      let description = '';
      let isFirstField = true;
      for (let i: number = 0; i < this.props.fieldDefinitions.length; i++) {
        const fieldDefinition : FieldDefinition = this.props.fieldDefinitions[i];
        const propertyName: string = fieldDefinition.name;
        const value :?string|?number = this.props.item[propertyName];
        if (value!==undefined && value!==null) {
          let formattedValue: string = formatFieldValue(value, fieldDefinition);
          if (formattedValue && formattedValue !== '') {
            if (!isFirstField)
              description += ', ';
            if (this.props.showLabels && this.props.fieldDefinitions[i].label) {
              description += this.props.fieldDefinitions[i].label + ': ';
            }
            description += formattedValue;
            isFirstField = false;
          }
        }
      }
      return <Text style={styles.textLeft}>{description}</Text>
    }
    return <View> //TODO
      <Text style={styles.text}>{this.props.item[this.props.fieldDefinitions[0].label]}</Text>
      <Text style={styles.text}>{this.props.item[this.props.fieldDefinitions[0].label]}</Text>
    </View>
  }
}

class EditableItem extends Component {
  props: {
    item: any,
    fieldDefinitions: FieldDefinition[],
    titleFields: string[],
    isSelected: boolean,
    orientation?: string,
    editable?: boolean,
    onUpdateItem: (propertyName: string, value: any) => void
  }

  static defaultProps = {
    editable: true
  }

  format(value: string[] | string): string {
    if (!value)
      return '';
    if (value instanceof Array) {
      const values: string[] = value;
      if (values.length === 0)
        return '';
      let formattedText: string = values[0];
      for (var i = 1; i < values.length; i++) {
        formattedText = formattedText + ', ' + values[i];
      }
      return formattedText;
    }
    return value;
  }

  renderTitle() {
    let title: string = '';
    this.props.titleFields && this.props.titleFields.forEach((titleField: string) => {
      title = title + this.props.item[titleField]+ ' ';
    });
    title = title.trim();
    if (title.length>0)
      return <Text style={styles.screenTitle}>{title}</Text>
  }

  render() {
    let isAllNormal: boolean = true;
    let style = 'horizontal'===this.props.orientation ? styles.flow : styles.form;
    if (this.props.isSelected)
      style = [style, {backgroundColor: selectionColor}];
    return <View style={style}>
      {this.renderTitle()}
      {this.props.fieldDefinitions.map((fieldDefinition: FieldDefinition, index: number) => {
        if (this.props.titleFields && this.props.titleFields.includes(fieldDefinition.name)) return;
        let description: string = this.format(this.props.item[fieldDefinition.name]);
        if (!description && fieldDefinition.normalValue) {
          isAllNormal = false;
        }
        if (!description || (fieldDefinition.normalValue && fieldDefinition.normalValue == description))
          return null;
        isAllNormal = false;
        const propertyField = <FormTextInput key={index} label={fieldDefinition.label?fieldDefinition.label:fieldDefinition.name} value={description} readonly={!this.props.editable}
          onChangeText={(text: string) => this.props.onUpdateItem(fieldDefinition.name, text.split(', '))} />
        if ('horizontal'===this.props.orientation )
          return propertyField;
        return <FormRow key={index}>
          {propertyField}
        </FormRow>
      })
      }
      {isAllNormal && <Text style={styles.textfield}>{strings.allNormal}</Text>}
    </View>
  }
}

export class ItemsCard extends Component {
  props: {
    exam: Exam,
    showTitle?: boolean
  }
  static defaultProps = {
    showTitle: true
  }

  renderItem(examItem: any, index: number) {
    if (this.props.exam.definition.fields===undefined) return;
    let fields = this.props.exam.definition.cardFields;
    if (fields===undefined || fields.length===0) {
      fields = this.props.exam.definition.fields.map((fieldDefinition :FieldDefinition) => fieldDefinition.name);
    }
    let abnormalFields : string[] = fields.filter((field: string) => {
      let value : string|string[] = examItem[field];
      if (value===undefined || value===null || (value instanceof Array && value.length===0)) return false;
      const fieldDefinition : ?GroupDefinition|FieldDefinition = this.props.exam.definition.fields.find((fieldDefinition: GroupDefinition|FieldDefinition) => fieldDefinition.name === field);
      if (fieldDefinition===undefined || fieldDefinition===null) return true;
      if (fieldDefinition.normalValue == String(value)) return false;
      if (String(value).startsWith('(-)')) return false; //TODO is this a general rule
      return true;
    });
    return <View style={this.props.exam.definition.editable?styles.columnLayout:styles.rowLayout} key={index}>
      {this.props.exam.definition.titleFields && this.props.exam.definition.titleFields.map((titleField: string) => {
        return <Text style={styles.boldText} key={titleField}>{examItem[titleField]} </Text>
      })}
      {abnormalFields.map((field: string, subIndex: number) => {
        let value : string|string[] = examItem[field];
        if (this.props.exam.definition.fields===undefined) return null;
        const fieldDefinition : ?GroupDefinition|FieldDefinition = this.props.exam.definition.fields.find((fieldDefinition: GroupDefinition|FieldDefinition) => fieldDefinition.name === field);
        if (fieldDefinition===null || fieldDefinition===undefined) return null;
        return <Text style={styles.textLeft} key={subIndex}>{this.props.exam.definition.editable?fieldDefinition.label?fieldDefinition.label:fieldDefinition.name+': ':''}{formatFieldValue(value, fieldDefinition)} </Text>
      })}
    </View>
  }

  render() {
    if (!this.props.exam[this.props.exam.definition.name] || !this.props.exam[this.props.exam.definition.name].length ||
      Object.keys(this.props.exam[this.props.exam.definition.name][0]).length===0 || !this.props.exam.definition.fields)
      return <View style={styles.columnLayout}>
          {this.props.showTitle && <Text style={styles.cardTitle}>{this.props.exam.definition.label?this.props.exam.definition.label:this.props.exam.definition.name}</Text>}
        </View>
    return <View style={styles.columnLayout}>
      {this.props.showTitle && <Text style={styles.cardTitle}>{this.props.exam.definition.label?this.props.exam.definition.label:this.props.exam.definition.name}</Text>}
      {this.props.exam[this.props.exam.definition.name].map((examItem: any, index: number) => {
          return this.renderItem(examItem, index);
      })}
    </View>
  }
}

function getColumnFieldIndex(groupDefinition: GroupDefinition, fieldName: string) : number {
  if (groupDefinition.columns===undefined || groupDefinition.columns===null || groupDefinition.columns.length===0) return -1;
  for (const columns : string[] of groupDefinition.columns) {
    if (columns instanceof Array) {
      for (let i : number = 0; i<columns.length;i++) {
        if (columns[i]===fieldName)
          return i;
      }
    }
  }
  return -1;
}

function isRowField(groupDefinition: GroupDefinition, fieldName: string) : boolean|number {
  if (groupDefinition.rows===undefined || groupDefinition.rows===null || groupDefinition.rows.length===0 ) return false;
  for (let row of groupDefinition.rows) {
    let index : number = row.indexOf(fieldName);
    if (index>=0) return index;
  }
  return false;
}

function getMultiValueGroup(cardRow: string[], multiValueGroups: GroupDefinitionp[]) : ?GroupDefinition {
  for (let field: string of cardRow) {
    const groupName : string = field.substring(0, field.indexOf('.'));
    if (groupName!==undefined) {
      const groupDefinition : ?GroupDefinition = multiValueGroups.find((groupDefinition: GroupDefinition) => groupDefinition.name === groupName);
      if (groupDefinition!==undefined)
        return groupDefinition;
    }
  };
  return undefined;
}

export class GroupedCard extends Component {
  props: {
    showTitle?: boolean,
    exam: Exam
  }
  groupDefinition : ?GroupDefinition
  static defaultProps = {
    showTitle: true
  }

  constructor(props: any) {
    super(props);
    this.groupDefinition = this.props.exam.definition.fields.find((fieldDefinition: GroupDefinition|FieldDefinition) => fieldDefinition.name === this.props.exam.definition.cardGroup);
  }

  componentWillReceiveProps(nextProps: any) {//Don't delete this dude, it will fuck you up in a weird way.
    this.groupDefinition = nextProps.exam.definition.fields.find((fieldDefinition: GroupDefinition|FieldDefinition) => fieldDefinition.name === nextProps.exam.definition.cardGroup);
  }

  renderField(groupDefinition: GroupDefinition, fieldDefinition: FieldDefinition, showLabel: boolean, groupIndex: number, column?: string = undefined) {
    if (column==='>>') return null;
    if (groupDefinition===undefined || groupDefinition===null) return null;
    if (fieldDefinition===undefined) return null;
    if (this.props.exam[this.props.exam.definition.name]===undefined || this.props.exam[this.props.exam.definition.name][groupDefinition.name]===undefined) return null;
    const groupValue = groupDefinition.multiValue===true?this.props.exam[this.props.exam.definition.name][groupDefinition.name][groupIndex]:this.props.exam[this.props.exam.definition.name][groupDefinition.name];
    if (isEmpty(groupValue)) return null;
    const fieldName : string = fieldDefinition.name;
    let value = column===undefined?groupValue[fieldName]:groupValue[column]?groupValue[column][fieldName]:undefined;
    if (fieldDefinition.image) {
      if (value===undefined || value===null) return null;
      const label : ?string = formatLabel(groupDefinition);
      const icon =  (value && value.startsWith && value.startsWith('upload-'))?
        <PaperClip style={styles.textIcon} color='black' key='paperclip' />
        :
        <DrawingIcon style={styles.textIcon} color='black' key='drawing' />;
      return <View style={styles.rowLayout} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}><Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{label}: </Text>{icon}</View>
    }
    const formattedValue : string = formatFieldValue(value, fieldDefinition);
    if (formattedValue==='') return null;
    const label : ?string = formatLabel(fieldDefinition);
    if (formattedValue==label) showLabel = false;
    if (showLabel===true && label!==undefined && label!==null && label.trim()!=='' && fieldName!==value) { //Last condition is for checkboxes
      //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);
      return <Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{label}: {formattedValue} </Text>
    }
    //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);
    return <Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{formattedValue} </Text>
  }

  renderCheckListItem(fieldDefinition: FieldDefinition) {
    const value = this.props.exam[this.props.exam.definition.name][fieldDefinition.name];
    if (fieldDefinition.normalValue===value) return null;
    const formattedValue : string = formatFieldValue(value, fieldDefinition);
    if (formattedValue==='') return null;
    const label : ?string = formatLabel(fieldDefinition);
    return <Text style={styles.textLeft} key={fieldDefinition.name}>{label}: {formattedValue} </Text>
  }

  renderColumnedRow(groupDefinition: GroupDefinition, columns: string[], rowIndex: number, groupIndex: number) {
    //__DEV__ && console.log('key='+groupIndex+'-'+groupDefinition.name+'-'+rowIndex);
    return <View style={styles.rowLayout} key={groupIndex+' '+groupDefinition.name+'-'+rowIndex+'-'}>
      {columns.map((column: string, columnIndex: number) => {
          if (column!=='>>') {
            const showLabel : boolean = columnIndex === 0;
            const columnDefinition : GroupDefinition = groupDefinition.fields.find((columnDefinition: FieldDefinition) => columnDefinition.name === column);
            const fieldDefinition : FieldDefinition = columnDefinition.fields[rowIndex];
            return this.renderField(groupDefinition, fieldDefinition, showLabel, groupIndex, column);
          }
        })
      }
    </View>
  }

  renderColumnedRows(groupDefinition: GroupDefinition, columnDefinition: GroupDefinition, groupIndex : number) {
    let rows : any[] = [];
    const rowCount : number = columnDefinition.fields.length;
    const columns : string[] = groupDefinition.columns.find((columns: string[]) => columns.length>0 && columns[0]===columnDefinition.name);
    for (let rowIndex : number = 0; rowIndex< rowCount; rowIndex++) {
      rows.push(this.renderColumnedRow(groupDefinition, columns, rowIndex, groupIndex));
    }
    return rows;
  }

  renderSimpleRow(groupDefinition: GroupDefinition, fieldDefinition: FieldDefinition, groupIndex?: number = 0) {
    const showLabel : boolean = true;
    return this.renderField(groupDefinition, fieldDefinition, showLabel, groupIndex);
  }

  renderRows(groupDefinition: GroupDefinition, groupIndex?: number = 0) {
    let rows : any[] = [];
    for (let fieldIndex: number =0; fieldIndex<groupDefinition.fields.length; fieldIndex++) {
      const fieldDefinition : FieldDefinition|GroupDefinition = groupDefinition.fields[fieldIndex];
      const columnFieldIndex : number = getColumnFieldIndex(groupDefinition, fieldDefinition.name)
      if (columnFieldIndex===0) {
        rows.push(this.renderColumnedRows(groupDefinition, fieldDefinition, groupIndex));
      } else if (columnFieldIndex<0){
        rows.push(this.renderSimpleRow(groupDefinition, fieldDefinition, groupIndex));
      }
    }
    return rows;
  }

  renderGlassesSummary(groupDefinition: GroupDefinition) {
    if (groupDefinition===undefined || groupDefinition===null) return null;
    if (this.props.exam[this.props.exam.definition.name]===undefined || this.props.exam[this.props.exam.definition.name][groupDefinition.name]===undefined) return null;
    return <GlassesSummary showHeaders={false} glassesRx={this.props.exam[this.props.exam.definition.name][groupDefinition.name]} key={groupDefinition.name}/>
  }

  renderGroup(groupDefinition: GroupDefinition) {
    if (this.props.exam[this.props.exam.definition.name]===undefined) return null;
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.multiValue===true && groupDefinition.options===undefined) {
      const value = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (value===undefined || value===null || (value instanceof Array) === false || value.length===0) return null;
      return value.map((groupValue: any, groupIndex: number)=> {
        if (groupValue===undefined || groupValue===null || Object.keys(groupValue).length===0) return null;
        return this.renderRows(groupDefinition, groupIndex);
      });
    } else if (groupDefinition.type==='SRx') {
      return this.renderGlassesSummary(groupDefinition);
    } else if (groupDefinition.fields===undefined && groupDefinition.options) {//A CheckList
      return this.renderCheckListItem(groupDefinition);
    } else {
      const value : any = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (value===undefined || value===null || Object.keys(value).length===0) return null;
      return this.renderRows(groupDefinition);
    }
  }

  renderAllGroups() {
    if (!this.props.exam[this.props.exam.definition.name]) return null;
    if (this.props.exam.definition.fields===null || this.props.exam.definition.fields===undefined || this.props.exam.definition.fields.length===0) return null;
    return this.props.exam.definition.fields.map((groupDefinition :GroupDefinition) => this.renderGroup(groupDefinition));
  }

  renderTitle() {
    if (this.props.showTitle===false) return null;
    return <Text style={styles.cardTitle} key='cardTitle'>{formatLabel(this.props.exam.definition)}</Text>
  }

  getGroupDefinition(fullFieldName: string) : GroupDefinition {
    if (fullFieldName.startsWith('exam.')) fullFieldName = fullFieldName.substring(5);
    const groupName = fullFieldName.substring(0, fullFieldName.indexOf('.'));
    return getExamFieldDefinition(groupName, this.props.exam);
  }

  expandMultiValueCardFields() : string[][] {//This is kind of advanced logic which I should document. Don't tamper with it if you are a rookie.
    let multiValueGroups : GroupDefinition[] = this.props.exam.definition.fields.filter((groupDefinition: GroupDefinition) => groupDefinition.multiValue===true && groupDefinition.options===undefined);
    if (multiValueGroups.length===0) return this.props.exam.definition.cardFields;
    let cardFields: string[][] = [];
    let renderedGroups : string[] = [];
    this.props.exam.definition.cardFields.forEach((cardRow: string[]) => {
      const group : ?GroupDefinition = getMultiValueGroup(cardRow, multiValueGroups);
      if (group) {
        if (!renderedGroups.includes(group.name)) {
          renderedGroups.push(group.name);
          const groupValue = getExamFieldValue(group.name, this.props.exam);
          if (groupValue instanceof Array && groupValue.length>0) {
            for (let i : number = 0; i<groupValue.length; i++) {
              for (let indexedRow : string[] of this.props.exam.definition.cardFields) {
                const indexedGroup : ?GroupDefinition = getMultiValueGroup(indexedRow, multiValueGroups);
                if (indexedGroup.name===group.name) {
                  indexedRow = indexedRow.map((fieldName: string) => fieldName.replace(group.name+'.', group.name+'['+i+'].'));
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

  renderCardRows() {
    let i : number = 0;
    let rowValues : string[][] = [];
    const cardFields = this.expandMultiValueCardFields();
    cardFields.forEach((cardRowFields: string[]) => {
            let rowValue : ?string[] = cardRowFields.map((fullFieldName: string) => {
            if (fullFieldName.indexOf('.')===-1) { //Hard coded strings
              return fullFieldName+' ';
            }
            const fieldDefinition: fieldDefinition = getExamFieldDefinition(fullFieldName, this.props.exam);
            const fieldValue: any = getExamFieldValue(fullFieldName, this.props.exam);
            let formattedValue = formatFieldValue(fieldValue, fieldDefinition);
            if (formattedValue==='') return '';
            if (cardRowFields.length===1) {//Add the label for single field rows
              const label : string = formatLabel(fieldDefinition);
              if (formattedValue!=label && formattedValue!='')
                return label+': '+formattedValue;
              return formattedValue;
            }
            if (formattedValue.length>0) formattedValue=formattedValue+' ';
            return formattedValue;
          });
          if (!isEmpty(rowValue.filter((item: string)=> item!==undefined && item!==null && item.trim().endsWith(':')===false))) //Filter label only fields before checking if line is empty
            rowValues.push(rowValue);
        }

    );
    return rowValues.map((rowValue: string[], index: number) => <Text style={styles.textLeft} key={index}>{rowValue}</Text>);
  }

  render() {
     return <View style={styles.columnLayout} key={this.props.exam.definition.name}>
        {this.renderTitle()}
        {isEmpty(this.props.exam[this.props.exam.definition.name])?null:this.props.exam.definition.cardFields?this.renderCardRows():this.groupDefinition?this.renderGroup(this.groupDefinition):this.renderAllGroups()}
     </View>
  }
}

export class ItemsList extends Component {
  props: {
    title?: string,
    items: any[],
    fieldDefinitions: FieldDefinition[],
    titleFields?: string[],
    selectedItem?: any,
    onAddItem?: () => void,
    onUpdateItem?: (propertyName: string, value: any) => void,
    onSelectItem?: (item: any) => void,
    onRemoveItem?: (item: any) => void,
    onAddFavorite?: (item: any) => void,
    onRemoveAllItems?: () => void,
    orientation?: string,
    itemView?: string,
    editable?: boolean,
    style?: any,
    showLabels?: boolean
  }
  static defaultProps = {
    editable: true
  }

  allNormal(): void {
    this.props.fieldDefinitions.map((fieldDefinition: FieldDefinition, index: number) => {
      if (fieldDefinition.normalValue) {
        if (fieldDefinition.multiValue)
          this.props.onUpdateItem(fieldDefinition.name, [fieldDefinition.normalValue]);
        else {
            this.props.onUpdateItem(fieldDefinition.name, fieldDefinition.normalValue);
        }
      }
    });
  }

  othersNormal(): void {
    this.props.fieldDefinitions.map((fieldDefinition: FieldDefinition, index: number) => {
      const propertyName : string = fieldDefinition.name;
      if ((this.props.selectedItem[propertyName]===undefined || this.props.selectedItem[propertyName].length===0)
        && fieldDefinition.normalValue) {
        if (fieldDefinition.multiValue)
          this.props.onUpdateItem(propertyName, [fieldDefinition.normalValue]);
        else {
          this.props.onUpdateItem(propertyName, fieldDefinition.normalValue);
        }
      }
    });
  }

  renderButtons() {
    const fontColor : string = '#1db3b3';
    if (!this.props.editable || this.props.onAddItem) return null;
    return <View style={styles.buttonsRowLayout}>
      <View style={styles.buttonsRowStartLayout}>
        <Button title='All normal' color={fontColor} onPress={() => { this.allNormal() } } />
        <Button title='Others normal' color={fontColor} onPress={() => { this.othersNormal() } } />
      </View>
    </View>
  }

  renderIcons() {
    if (!this.props.editable || this.props.onRemoveAllItems===undefined) return null;
    return <View style={styles.groupIcons}>
      <TouchableOpacity onPress={this.props.onRemoveAllItems}><Garbage style={styles.groupIcon}/></TouchableOpacity>
    </View>
  }

  renderRow(itemView: Component, index: number) : Component {
    return <View key={index} style={{flexDirection: 'row'}}>
      {itemView}
    </View>
  }

  renderList() : Component {
    const itemOrientation : string = this.props.orientation === 'vertical' ? 'horizontal' : 'vertical';
    return this.props.items.map((item: any, index: number) => {
      const isSelected: boolean = this.props.selectedItem === item && this.props.items.length>1;
      const itemView = constructItemView(this.props.itemView, item, this.props.fieldDefinitions, isSelected, this.props.editable===this.props.onUpdateItem!==undefined, this.props.onUpdateItem, itemOrientation, this.props.titleFields, this.props.showLabels)
      if (!this.props.onSelectItem || this.props.editable!==true) {
        return this.renderRow(itemView, index);
      }
      return <TouchableHighlight key={index} onPress={() => this.props.onSelectItem(item)} onLongPress={() => item && this.props.onRemoveItem && this.props.onRemoveItem(item)}>
          {this.renderRow(itemView, index)}
      </TouchableHighlight>
    })
  }

  render() {
    //const listStyle = this.props.orientation === 'horizontal' ? styles.listRow : styles.centeredColumnLayout;
    return <View style={this.props.style?this.props.style:styles.board}>
      {this.props.title && <Text style={styles.cardTitle}>{this.props.title}</Text>}
      {(this.props.items.length>4 && this.props.editable)?
        <ScrollView>
          {this.renderList()}
        </ScrollView>:
        this.renderList()
      }
      {this.renderButtons()}
      {this.renderIcons()}
    </View >
  }
}

export class ItemsEditor extends Component {
  props: {
    items: any[],
    newItem?: () => any,
    isEmpty?: (item: any) => boolean,
    isDirty?: boolean,
    fieldDefinitions: FieldDefinition[],
    titleFields?: string[],
    itemView?: string,
    orientation?: string,
    onUpdate?: () => void,
    favorites?: ExamPredefinedValue[],
    onAddFavorite?: (item: any) => void,
    onRemoveFavorite: (favorite: ExamPredefinedValue) => void,
    editable?: boolean
  }
  state: {
    selectedItem: any,
    isDirty: boolean
  }
  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    let items: T[] = this.props.items;
    if (this.props.editable) {
      if (items.length === 0 && this.props.newItem!==undefined)
        items.push(this.props.newItem());
      this.state = {
        selectedItem: items[0],
        isDirty : this.props.isDirty?this.props.isDirty:false
      };
    } else {
      this.state = {
        selectedItem: undefined,
        isDirty : this.props.isDirty?this.props.isDirty:false
      };
    }
  }

  componentWillReceiveProps(nextProps: any) {
    let items: T[] = nextProps.items;
    if (nextProps.editable) {
      if (items.length === 0 && this.props.newItem!==undefined)
        items.push(this.props.newItem());
      this.setState({
        selectedItem: items[0]
        //Don't set dirty false here. Don't you dare. DON'T !
      });
    } else {
      this.setState({
        selectedItem: undefined,
        isDirty : false
      });
    }
  }

  updateItem = (propertyName: string, value: any) : void => {
    if (this.props.editable!==true) return;
    let item = this.state.selectedItem;
    const fieldIndex = this.props.fieldDefinitions.findIndex((fieldDefinition : FieldDefinition) => fieldDefinition.name === propertyName);
    const fieldDefinition : ?FieldDefinition = this.props.fieldDefinitions[fieldIndex];
    if (fieldDefinition===undefined || fieldDefinition===null ) return;
    //If field is a code replace value with code, taking selection prefix into account
    if (fieldDefinition.options && (fieldDefinition.options instanceof Array === false) && value!==undefined && value!==null) {
      const codeType : string = fieldDefinition.options;
      if (fieldDefinition.multiValue) {
        value = value.map((description: string) => selectionPrefix(description) + parseCode(codeType, stripSelectionPrefix(description)));
      } else {
        value = selectionPrefix(value) + parseCode(codeType, stripSelectionPrefix(value));
      }
    }
    //Normal value handling
    if (fieldDefinition.normalValue!==undefined && fieldDefinition.normalValue!==null) {
      if (value && value.length == 2 && value[0].toLowerCase() === fieldDefinition.normalValue.toLowerCase()) {
        value = value.splice(1);
      }
      if (value && value.length > 1 && value[value.length - 1].toLowerCase() === fieldDefinition.normalValue.toLowerCase()) {
        value = [fieldDefinition.normalValue];
      }
    }
    //Auto add or remove line
    if (this.props.newItem) {
      if (fieldIndex===0) {
        if (value===undefined) {
          this.removeItem(item);
          return;
        } else if (item[fieldDefinition.name]!==undefined && stripSelectionPrefix(value)!==stripSelectionPrefix(item[fieldDefinition.name])) {
          item = this.addItem();
        }
      }
      else if (fieldIndex===1 && fieldDefinition.newLine===true) {//I have no idea what this was for
        if (value===undefined) {
          this.removeItem(item);
          return;
        } else if (item[fieldDefinition.name]!==undefined && stripSelectionPrefix(value)!==stripSelectionPrefix(item[fieldDefinition.name])) {
          let newItem : any = this.props.newItem();
          newItem[this.props.fieldDefinitions[0].name]=item[this.props.fieldDefinitions[0].name];
          item = this.addItem(newItem);
        }
      }
    }
    //
    item[fieldDefinition.name] = value;
    this.setState({
      selectedItem: item,
      isDirty: true
    });
  }

  addItem(newItem: any) : any {
    if (!this.props.newItem || !this.props.editable) return;
    if (newItem===undefined || newItem===null)
      newItem = this.props.newItem();
    this.props.items.push(newItem);
    this.setState({
      selectedItem: newItem,
      isDirty: true
    });
    return newItem;
  }

  selectItem(item: any) : void {
    if (!this.props.editable) return;
    this.setState({
      selectedItem: item
    });
  }

  removeItem(item: any) : void {
    if (!this.props.editable) return;
    let index: number = this.props.items.indexOf(item);
    if (index < 0) {
      return;
    }
    let items: any[] = this.props.items;
    items.splice(index, 1);
    if (items.length === 0)
      items.push(this.props.newItem());
    if (index >= items.length) index = items.length - 1;
    this.setState({
      selectedItem: items[index],
      isDirty: true
    })
  }

  removeAllItems = () => {
    if (!this.props.editable) return;
    this.props.items.splice(0, this.props.items.length);
    if (this.props.newItem!==undefined) {
      this.props.items.push(this.props.newItem());
      this.setState({
        selectedItem: this.props.items[0],
        isDirty : true
        });
    } else {
      this.props.items.push({});
      this.setState({selectedItem: this.props.items[0], isDirty: true});
    }
  }

  removeEmptyItems() {
    if (!this.props.isEmpty || !this.props.editable) return;
    let items: any[] = this.props.items;
    let i: number = 0;
    while (i<items.length) {
      if (this.props.isEmpty(items[i])) {
        items.splice(i,1);
      }
      else
        i++
    }
  }

  selectFavorite = (predefinedValue: ExamPredefinedValue) => {
    if (!predefinedValue || !predefinedValue.predefinedValue) return;
    const items : any[] = this.props.items;
    //Remove the first line if empty
    if (items.length===1 && items[0] && Object.keys(items[0]).length===0) {
      items.splice(0,1);
    }
    let value = predefinedValue.predefinedValue;
    value = deepClone(value);
    if (value instanceof Array) {
      items.push(...value);
    } else {
      items.push(value);
    }
    if (items.length === 0 && this.props.newItem!==undefined)
      items.push(this.props.newItem());
    this.setState({isDirty: true, selectedItem: items[items.length-1]});
  }

  componentWillUnmount() {
    if (this.state.isDirty && this.props.onUpdate && this.props.editable) {
      this.removeEmptyItems();
      this.props.onUpdate();
    }
  }

  renderSelectionLists() {
    if (!this.props.fieldDefinitions) return null;
    return this.props.fieldDefinitions.map((fieldDefinition: FieldDefinition, index: number) => {
      if (fieldDefinition.options && fieldDefinition.options.length>0) {
        const propertyName :string = fieldDefinition.name;
        let selection = this.state.selectedItem?this.state.selectedItem[propertyName]:undefined;
        let options : CodeDefinition[]|string = fieldDefinition.options
        if (options instanceof Array === false) {//We got ourselves some codes
          const codeType : string = fieldDefinition.options;
          options = formatAllCodes(fieldDefinition.options);
          if (fieldDefinition.multiValue) {
            if (selection!==undefined && selection!==null) {
              selection = selection.map((code: string) => selectionPrefix(code) + formatCode(codeType, stripSelectionPrefix(code)));
            }
          } else {
            if (selection!==undefined && selection!==null) {
              selection = selectionPrefix(selection) + formatCode(codeType, stripSelectionPrefix(selection));
            }
          }
        }
        return <SelectionList key={index}
          label={fieldDefinition.label===undefined?fieldDefinition.name:fieldDefinition.label}
          items={options}
          multiValue={fieldDefinition.multiValue}
          required={fieldDefinition.required}
          freestyle={fieldDefinition.freestyle}
          simpleSelect={fieldDefinition.simpleSelect}
          selection={selection}
          onUpdateSelection={(value) => this.updateItem(propertyName, value)} />
      }
    });
  }

  renderNonOptionFields() {
    if (!this.props.fieldDefinitions || !this.state.selectedItem) return null;
    let fields : FieldDefinition[] = this.props.fieldDefinitions.filter((fieldDefinition: FieldDefinition) => fieldDefinition.options===undefined || fieldDefinition.options.length===0);
    if (fields.length===0) return null;
    let form = this.state.selectedItem;
    let groupDefinition : GroupDefinition = {'name':'nonSelectables','label':'','fields':fields};
    return <View><GroupedForm form={form} definition={groupDefinition} onChangeField={this.updateItem} /></View>
  }

  addFavorite = () => {
    this.props.onAddFavorite && this.props.onAddFavorite(this.props.items);
  }

  render() {
    return <View style={styles.page}>
      <View style={styles.flowLeft}>
        <ItemsList
          items={this.props.items}
          fieldDefinitions={this.props.fieldDefinitions}
          titleFields = {this.props.titleFields}
          onAddItem={this.props.newItem?() => this.addItem():undefined}
          onUpdateItem={this.updateItem}
          selectedItem={this.state.selectedItem}
          onSelectItem={(item: any) => this.selectItem(item)}
          onAddFavorite={this.props.onAddFavorite}
          onRemoveItem={(item: any) => this.removeItem(item)}
          onRemoveAllItems={this.removeAllItems}
          itemView={this.props.itemView}
          orientation = {this.props.orientation}
          editable={this.props.editable}
          style={(this.props.onAddFavorite && this.props.editable)?styles.boardStretch:styles.boardStretchL}
        />
        {this.props.onAddFavorite && this.props.editable && <Favorites favorites={this.props.favorites} onSelectFavorite={this.selectFavorite} onAddFavorite={this.addFavorite} onRemoveFavorite={this.props.onRemoveFavorite}/>}
      </View>
      {this.props.editable && <ScrollView horizontal={true}>
        {this.renderSelectionLists()}
        {this.renderNonOptionFields()}
      </ScrollView>
    }
    </View>
  }
}

export class SelectionListsScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam?: (exam: Exam) => void,
    editable?: boolean,
    favorites?: ExamPredefinedValue[],
    onAddFavorite?: (favorite: any) => void,
    onRemoveFavorite?: (favorite: ExamPredefinedValue) => void
  }

  constructor(props: any) {
    super(props);
    if (this.props.exam[this.props.exam.definition.name]===undefined || JSON.stringify(this.props.exam[this.props.exam.definition.name])=='{}') {
      this.props.exam[this.props.exam.definition.name] = [];
      if (!this.props.exam.definition.addable) {
        this.props.exam[this.props.exam.definition.name].push({});
      }
    }
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.exam[nextProps.exam.definition.name]===undefined || JSON.stringify(nextProps.exam[nextProps.exam.definition.name])=='{}') {
      nextProps.exam[nextProps.exam.definition.name] = [];
      if (!nextProps.exam.definition.addable) {
        nextProps.exam[nextProps.exam.definition.name].push({});
      }
    }
  }

  newItem = ()  => {
    let newItem = {};
    return newItem;
  }

  isItemEmpty = (item: any)  => {
    if (item === undefined || item===null || Object.keys(item).length===0) return true;
    const examDefinition : ExamDefinition = this.props.exam.definition;
    if (examDefinition.essentialFields) {
      for(let i : number = 0; i<examDefinition.essentialFields.length; i++) {
        const field : string = examDefinition.essentialFields[i];
        const fieldValue = item[field];
        if (fieldValue === undefined || fieldValue.length===0 || new String(fieldValue).trim()==='') return true;
      }
    } else {//TODO

    }
    return false;
  }

  render() {
    return <ItemsEditor
        items={this.props.exam[this.props.exam.definition.name]}
        newItem={this.props.exam.definition.addable?this.newItem:undefined}
        isEmpty={this.isItemEmpty}
        fieldDefinitions={this.props.exam.definition.fields}
        titleFields = {this.props.exam.definition.titleFields}
        itemView={this.props.exam.definition.editable?'EditableItem':'ItemSummary'}
        onUpdate = {() => this.props.onUpdateExam && this.props.onUpdateExam(this.props.exam)}
        editable = {this.props.editable}
        isDirty = {this.props.exam.errors!==undefined}
        favorites = {this.props.exam.definition.starable?this.props.favorites:undefined}
        onAddFavorite = {this.props.exam.definition.starable?this.props.onAddFavorite:undefined}
        onRemoveFavorite = {this.props.exam.definition.starable?this.props.onRemoveFavorite:undefined}
      />
  }
}

export function isNumericField(fieldDefinition: FieldDefinition) : boolean {
  return fieldDefinition.minValue!==undefined || fieldDefinition.maxValue!==undefined;
}

export function formatLabel(fieldDefinition: FieldDefinition|GroupDefinition) : string {
  if (fieldDefinition===undefined) return '';
  if (fieldDefinition.label!==undefined && fieldDefinition.label!==null) return fieldDefinition.label;
  return fieldDefinition.name;
}

export function formatSuffix(fieldDefinition: FieldDefinition|GroupDefinition) : string {
  if (fieldDefinition===undefined || fieldDefinition.suffix===undefined || fieldDefinition.suffix instanceof Array || fieldDefinition.suffix.includes('Code')) return '';
  return fieldDefinition.suffix;
}

export function formatPrefix(fieldDefinition: FieldDefinition|GroupDefinition, value: any) : string {
    if (fieldDefinition===undefined || fieldDefinition.prefix===undefined) return '';
    if ((fieldDefinition.options instanceof Array) && fieldDefinition.options.includes(value)) {
      return '';
    }
    if (fieldDefinition.prefix==='+') return '';
    return fieldDefinition.prefix;
}

function hasColumns(groupDefinition: GroupDefinition) : boolean {
  return groupDefinition.columns!==undefined && groupDefinition.columns.length>0 && groupDefinition.columns[0]!==undefined &&
    groupDefinition.columns[0].length>0 && groupDefinition.columns[0][0]!==undefined && groupDefinition.columns[0][0].trim()!=='';
}

export class CheckList extends PureComponent {
  props: {
    value: string|string[],
    definition: FieldDefinition,
    editable?: boolean,
    style?: any,
    onChangeField?: (newValue: string|string[]) => void,
    onClear?: () => void,
    onAddFavorite?: () => void,
    onAdd?: () => void,
    patientId: string,
    examId: string
  }

  formattedOptions: string[];

  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    this.formatOptions(props.definition.options);
    this.addValueAsOption(props.value);
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.definition!=this.props.definition) {
      this.formatOptions(nextProps.definition.options);
    }
    if (nextProps.value!=this.props.value || nextProps.value===undefined || this.props.value===undefined || nextProps.value.length !=this.props.value.length) {
      this.addValueAsOption(nextProps.value);
    }
  }

  formatOptions(options :CodeDefinition[][]|CodeDefinition[]|string) {
    if (!(options instanceof Array)) {
      this.formattedOptions = formatAllCodes(options, undefined);
    } else {
      this.formattedOptions = [...options];
    }
    if (this.formattedOptions===undefined || this.formattedOptions===null) this.formattedOptions = [];
  }

  addValueAsOption(value: string|string[]) {
    if (value===undefined) return;
    if (value instanceof Array) {
      value.forEach((subValue: string) => {
        if (!this.formattedOptions.includes(subValue)) {
          this.formattedOptions.push(subValue);
        };
      });
    } else {
      if (!this.formattedOptions.includes(value)) {
        this.formattedOptions.push(value);
      }
    }
  }

  isSelected(option: string): boolean|string {
    let value : string | string[] = this.props.value;
    if (value===undefined)
      return false;
    if (value instanceof Array) {
      for (let i : number =0;i<value.length;i++) {
        if (this.props.definition.prefix instanceof Array) {
          let selection : string = value[i];
          let prefix : string|boolean = true;
          if (selection.startsWith('(')) {
            prefix = selection.substring(1,2);
            selection = selection.substring(4);
          }
          if (selection===option) {
            return prefix;
          }
        } else {
          let selection : string = value[i];
          if (selection===option) return true;
        }
      }
      return false;
    }
    if (value.startsWith('(')) {
      value = value.substring(4);
    }
    return value === option;
  }

  select = (option: string) => {
    let value : string | string[] = this.props.value;
    if (value instanceof Array) {
      if (this.props.definition.prefix instanceof Array) {
        let prefix = undefined;
        if (option.startsWith('(')) {
          prefix = option.substring(1,2);
          option = option.substring(4);
        }
        let index = -1;
        for (let i : number =0;i<value.length;i++) {
          let selection : string = value[i];
          if (selection.startsWith('(')) {
            selection = selection.substring(4);
          }
          if (selection===option) {
            index = i;
            break;
          }
        }
        if (index<0) {
          if (this.props.definition.multiValue) {
            value.push(option);
          } else {
            value = [option];
          }
        } else {
          if (prefix===undefined) {
            prefix = '-';
          } else if (prefix==='-') {
            prefix = '?';
          } else if (prefix==='?') {
            prefix = '+';
          } else if (prefix==='+') {
            prefix = undefined;
          }
          if (prefix===undefined) {
            value.splice(index,1);
          } else {
            value[index] = '('+prefix+') '+option;
          }
        }
      } else {//No -?+ prefix
        const index: number = value.indexOf(option);
        if (this.props.definition.multiValue) {
          if (index<0) {
            value.push(option);
          } else {
            value.splice(index,1);
          }
        } else {
          if (index<0) {
            value = [option];
          } else {
            value.splice(index,1);
          }
        }
      }
    } else {
      let isSelected: boolean = value===option;
      if (value===option) {//Deselect
        if (this.props.definition.multiValue) {
          value = [];
        } else {
          value = undefined;
        }
      } else {//Select
        if (this.props.definition.multiValue) {
          value = [option];
        } else {
          value = option;
        }
      }
    }
    this.props.onChangeField && this.props.onChangeField(value);
  }

  addValue = (option: string) => {
    let value : string | string[] = this.props.value;
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
  }

  //const allDescriptions: string[] = formatAllCodes(this.props.code, this.props.filter);
  render() {
    const style = this.props.style?this.props.style:this.props.definition.size?styles['board'+this.props.definition.size]:styles.board;
    return  <View style={style}>
        <Text style={styles.sectionTitle}>{formatLabel(this.props.definition)}</Text>
        {this.formattedOptions.map((option: string) => {
            const isSelected : boolean|string = this.isSelected(option);
            const prefix : string = isSelected===true||isSelected===false?'':('('+isSelected+') ');
            return <View style={styles.formRow} key={option}>
              <CheckButton isChecked={isSelected!==false} suffix={prefix+option} onSelect={() => this.select(prefix+option)} onDeselect={() => this.select(prefix+option)}/>
            </View>
          }
        )}
        {this.props.definition.freestyle && this.props.editable && <View style={styles.formRow} key='freestyle'>
            <FormTextInput speakable={true} onChangeText={this.addValue}/>
          </View>
        }
        {this.props.editable && this.props.onClear && <View style={styles.groupIcons}><TouchableOpacity onPress={this.props.onClear}><Garbage style={styles.groupIcon}/></TouchableOpacity></View>}
    </View>
  }
}

export class GroupedForm extends Component {
  props: {
    form: {},
    definition: GroupDefinition,
    editable?: boolean,
    style?: any,
    onChangeField?: (fieldName: string, newValue: any, column: ?string) => void,
    onClear?: () => void,
    onAddFavorite?: () => void,
    onAdd?: () => void,
    patientId: string,
    examId: string
  }

  static defaultProps = {
    editable: true
  }

  formatColumnLabel(column: string) : string {
    const columnDefinition : ?GroupDefinition|FieldDefinition = this.props.definition.fields.find((columnDefinition : GroupDefinition|FieldDefinition) => columnDefinition.name === column);
    return formatLabel(columnDefinition);
  }

  renderField(fieldDefinition: FieldDefinition, column?: string) {
    if (fieldDefinition===undefined)
      return <View style={styles.fieldFlexContainer} key={column}><Text style={styles.text}></Text></View>
    if (fieldDefinition.mappedField) {
      fieldDefinition = Object.assign({}, getFieldDefinition(fieldDefinition.mappedField), fieldDefinition);
    }
    const value = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name]:undefined:this.props.form[fieldDefinition.name]:undefined;
    const error = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name+'Error']:undefined:this.props.form[fieldDefinition.name+'Error']:undefined;
    const label : string = formatLabel(this.props.definition)+(column!==undefined?' '+this.formatColumnLabel(column)+' ':' ')+formatLabel(fieldDefinition);
    return <FormInput value={value} filterValue={this.props.form} label={label} showLabel={false} readonly={!this.props.editable} definition={fieldDefinition}
      onChangeValue={(newValue: string) => this.props.onChangeField(fieldDefinition.name, newValue, column)} errorMessage={error}
      patientId={this.props.patientId} examId={this.props.examId} key={fieldDefinition.name+(column===undefined?'':column)}/>
  }

  renderSimpleRow(fieldDefinition: FieldDefinition) {
    let label : string = formatLabel(fieldDefinition);
    if (label.length>0) label = label + ':';
    if (fieldDefinition.layout)
      return this.renderField(fieldDefinition);
    return <View style={styles.formRow} key={fieldDefinition.name}>
        <View style={styles.formRowHeader}><Text style={styles.formLabel}>{label}</Text></View>
        {this.renderField(fieldDefinition)}
    </View>
  }

  renderFieldsRow(fieldDefinition: FieldDefinition) {
    let fields : any[] = [];
    const row : string[] = this.props.definition.rows.find((row : string[]) => row && row.length>0 && row[0]===fieldDefinition.name);
    if (row===undefined) return null;
    const fieldDefinitions : FieldDefinition[] = row.map((fieldName: string) => this.props.definition.fields.find((field: FieldDefinition) => field.name === fieldName));
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      let label : string = formatLabel(fieldDefinition);
      fields.push(<FormLabel value={label} key={fieldDefinition.name+'Label'}/>);
      fields.push(this.renderField(fieldDefinition));
    });
    return <View style={styles.formRow} key={fieldDefinition.name}>
      {fields}
    </View>
  }

  hasColumns() : boolean {
    return hasColumns(this.props.definition);
  }

  renderColumnsHeader(columnDefinition: GroupDefinition) {
    if (this.hasColumns()===false) return null;
    const columns = this.props.definition.columns.find((columns: string[]) => columns[0]===columnDefinition.name);
    if (columns===undefined || columns.length===0) return null;
    return <View style={styles.formRow}>
          <Text style={styles.formTableRowHeader}> </Text>
          {columns.map((column: string, index: number) => {
              const columnDefinition : FieldDefinition = this.props.definition.fields.find((fieldDefinition: FieldDefinition) => fieldDefinition.name === column);
              if (columnDefinition) {
                const columnLabel : string = formatLabel(columnDefinition);
                return <Text style={styles.formTableColumnHeader} key={index}>{columnLabel}</Text>
              } else {
                if (column==='>>') {
                  if (index===columns.length-1) {
                    return <View style={styles.formTableColumnHeaderSmall}></View>
                  } else {
                    return <View style={styles.formTableColumnHeaderFlat}><CopyColumn onPress={() => this.copyColumn(columns[index-1], columns[index+1])}/></View>
                  }
                }
                return null;
              }
            })
          }
      </View>
  }

  renderColumnedRow(fieldLabel: string, columns: string[], rowIndex: number, copyRow: () => void) {
    return <View style={styles.formRow} key={rowIndex}>
        <Text style={styles.formTableRowHeader}>{fieldLabel!==''?fieldLabel+':':''}</Text>
        {columns.map((column: string, columnIndex: number) => {
            const columnDefinition : GroupDefinition = this.props.definition.fields.find((columnDefinition: FieldDefinition) => columnDefinition.name === column);
            if (columnDefinition) {
              const fieldDefinition : FieldDefinition = columnDefinition.fields[rowIndex];
              return this.renderField(fieldDefinition, column);
            } else {
              if (columnIndex===columns.length-1) {
                if (rowIndex==0) {
                    return [<View style={styles.formTableColumnHeaderSmall}></View>,<CopyRow onPress={copyRow}/>];
                } else {
                  return <View style={styles.formTableColumnHeaderSmall}></View>
                }
              }
            }
          })
        }
      </View>
  }

  copyRow(rowFields : FieldDefinition[], rowIndexFrom: number, rowIndexTo: number, columns : string[] ) {
    if (this.props.form===undefined) return;
    const fromRowName : string = rowFields[rowIndexFrom].name;
    const toRowName : string = rowFields[rowIndexTo].name;
    for(let i:number =0; i<columns.length;i++) {
      if (columns[i]==='>>') continue;
      const value = this.props.form[columns[i]][fromRowName];
      this.props.onChangeField(toRowName, value, columns[i]);
    }
  }

  copyColumn(fromColumn: string, toColumn: string) : void {
    const fieldDefinitions : FieldDefinition[] = this.props.definition.fields.find((field: FieldDefinition) => field.name === fromColumn).fields;
    fieldDefinitions.forEach((fieldDefinition: FieldDefinition) => {
      const value = this.props.form[fromColumn][fieldDefinition.name];
      this.props.onChangeField(fieldDefinition.name, value, toColumn);
    });
  }


  renderColumnedRows(columnDefinition: GroupDefinition) {
    let rows : any[] = [];
    rows.push(this.renderColumnsHeader(columnDefinition));
    const columnedFields : FieldDefinition[] = columnDefinition.fields;
    const columns : string[] = this.props.definition.columns.find((columns: string[]) => columns.length>0 && columns[0]===columnDefinition.name);
    for (let i : number = 0; i< columnedFields.length; i++) {
      rows.push(this.renderColumnedRow(formatLabel(columnedFields[i]), columns, i, () => this.copyRow(columnedFields, i, i+1, columns)));
    }
    return rows;
  }

  renderRows() {
    let rows : any[] = [];
    const groupDefinition : GroupDefinition = this.props.definition;
    for (const fieldDefinition : FieldDefinition of groupDefinition.fields) {
      const columnFieldIndex : number = getColumnFieldIndex(groupDefinition, fieldDefinition.name);
      if (columnFieldIndex===0) {
        rows.push(this.renderColumnedRows(fieldDefinition));
      } else if(columnFieldIndex<0) {
        if (isRowField(groupDefinition, fieldDefinition.name)!==false) {
          rows.push(this.renderFieldsRow(fieldDefinition));
        } else {
          rows.push(this.renderSimpleRow(fieldDefinition));
        }
      }
    }
    return rows;
  }

  renderIcons() {
    if (!this.props.editable || (!this.props.onAddFavorite && !this.props.onClear)) return null;
    return <View style={styles.groupIcons} key='icons'>
      {this.props.onAdd && <TouchableOpacity onPress={this.props.onAdd}><Plus style={styles.groupIcon}/></TouchableOpacity>}
      {this.props.onAddFavorite && <TouchableOpacity onPress={this.props.onAddFavorite}><Star style={styles.groupIcon}/></TouchableOpacity>}
      {this.props.onClear && <TouchableOpacity onPress={this.props.onClear}><Garbage style={styles.groupIcon}/></TouchableOpacity>}
    </View>
  }

  render() {
    const style = this.props.style?this.props.style:this.props.definition.size?styles['board'+this.props.definition.size]:styles.board;
    return  <View style={style} key={this.props.definition.name}>
        <Text style={styles.sectionTitle} key='title'>{formatLabel(this.props.definition)}</Text>
        {this.renderRows()}
        {this.renderIcons()}
    </View>
  }
}

export class GroupedFormScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam?: (exam: Exam) => void,
    favorites?: ExamPredefinedValue[],
    onAddFavorite?: (favorite: any) => void,
    editable?: boolean,
    onRemoveFavorite?: (favorite: ExamPredefinedValue) => void
  }
  state: {
    isDirty: boolean
  }
  addableGroups: string[]
  patientId: string

  constructor(props: any) {
    super(props);
    this.initialiseExam(this.props.exam, this.props.editable);
    this.state = {
      isDirty: this.props.exam.errors!==undefined
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.initialiseExam(nextProps.exam, nextProps.editable);
  }

  initialiseExam(exam: Exam, editable?: boolean) {
    this.addableGroups = [];
    this.patientId = getCachedItem(exam.visitId).patientId;
    if (!exam[exam.definition.name]) {
      exam[exam.definition.name] = {};
    }
    if (exam.definition.fields===undefined || exam.definition.fields.length===0) return;
    exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
      if (groupDefinition.mappedField) {
        groupDefinition = Object.assign({}, getFieldDefinition(groupDefinition.mappedField), groupDefinition);
      }
      if (exam[exam.definition.name][groupDefinition.name]===undefined) {
        if (groupDefinition.type==='SRx') {
          if (groupDefinition.optional===true) {
            this.addableGroups.push(groupDefinition.label?groupDefinition.label:groupDefinition.name);
          } else {
            exam[exam.definition.name][groupDefinition.name] = newRefraction();
          }
        } else if (groupDefinition.multiValue===true) {
          exam[exam.definition.name][groupDefinition.name] = [];
        } else {
          if (groupDefinition.optional===true) {
            this.addableGroups.push(groupDefinition.label?groupDefinition.label:groupDefinition.name);
          } else {
            if (groupDefinition.options===undefined) {
              exam[exam.definition.name][groupDefinition.name] = {};
            }
          }
        }
      }
      if (exam[exam.definition.name][groupDefinition.name]!==undefined) {
        if (groupDefinition.multiValue) {
          let values = exam[exam.definition.name][groupDefinition.name];
          if (values instanceof Array === false) values = [values]; //auto convert old style exams
          if (values.length===0 && groupDefinition.fields) {
            let newObject = {};
            groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
              if (fieldDefinition.fields instanceof Array && fieldDefinition.fields.length!==0) {
                  newObject[fieldDefinition.name] = {} //Add empty column
                }
              }
            );
            values.push(newObject);
          }
        } else {
          groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
            if (fieldDefinition.fields instanceof Array && fieldDefinition.fields.length!==0) {
              if (exam[exam.definition.name][groupDefinition.name][fieldDefinition.name]===undefined) {
                exam[exam.definition.name][groupDefinition.name][fieldDefinition.name] = {} //Add empty column
              }
            }
          });
        }
      }
    });
  }

  addGroupItem = (groupDefinition: GroupDefinition ) => {
    let values = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
    if (values instanceof Array === false) values = [values]; //auto convert old style exams to be nice
    if (groupDefinition.maxLength!==undefined && values.length>=groupDefinition.maxLength) {
      alert(strings.formatString(strings.maximumAddableGroupError, groupDefinition.maxLength-1, groupDefinition.name.toLowerCase()));
    } else {
      let newValue = {};
      groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
        if (fieldDefinition.fields instanceof Array && fieldDefinition.fields.length!==0) {
            newValue[fieldDefinition.name] = {}
        }
      });
      if (groupDefinition.clone instanceof Array && values.length>0) {
        const lastValue = values[0];
        groupDefinition.clone.forEach((fieldName : string) => {
          newValue[fieldName] = lastValue[fieldName];
        });
      }
      values.unshift(newValue);
    }
    this.setState({isDirty: true});
  }

  cleanExam() {
    let exam = this.props.exam;
    exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
      if (groupDefinition.multiValue) {
        let values : any[] = exam[exam.definition.name][groupDefinition.name];
        let cleanedValues = values.filter(value => value!==undefined && Object.keys(value).length!==0);
        if (values.length!==cleanedValues.length) {
           exam[exam.definition.name][groupDefinition.name] = cleanedValues;
        }
      }
    });
  }

  changeField(groupName: string, fieldName: ?string, newValue: string, column: ?string, index?: number) {
    if (column!==undefined) {
      if (index!==undefined) {
        if (fieldName!==undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][index][column][fieldName] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][index][column] = newValue;
        }
      } else {
        if (fieldName!==undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][column][fieldName] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][column] = newValue;
        }
      }
    } else {
      if (index!==undefined) {
        if (fieldName!==undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][index][fieldName] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName][index] = newValue;
        }
      } else {
        if (fieldName!==undefined) {
          this.props.exam[this.props.exam.definition.name][groupName][fieldName] = newValue;
        } else {
          this.props.exam[this.props.exam.definition.name][groupName] = newValue;
        }
      }
    }
    this.setState({isDirty: true});
  }

  updateRefraction(refractionType: string, refraction: GlassesRx) {
    if (!this.props.editable) return;
    this.props.exam[this.props.exam.definition.name][refractionType] = refraction;
    if (!this.state.isDirty)
      this.setState({isDirty: true});
    this.forceUpdate();
  }

  copyToFinal = (glassesRx : GlassesRx) : void => {
    glassesRx = deepClone(glassesRx);
    this.updateRefraction('Final Rx', glassesRx);
  }

  clear(groupName: string, index?: number) : void {
    if (index!==undefined)
      this.props.exam[this.props.exam.definition.name][groupName].splice(index, 1);
    else
      this.props.exam[this.props.exam.definition.name][groupName] = undefined;
    this.initialiseExam(this.props.exam, this.props.editable);
    this.setState({isDirty: true});
  }

  componentWillUnmount() {
    if (this.state.isDirty && this.props.onUpdateExam) {
      this.cleanExam();
      this.props.onUpdateExam(this.props.exam);
    }
  }

  selectFavorite = (predefinedValue: ExamPredefinedValue) => {
    if (!predefinedValue || !predefinedValue.predefinedValue) return;
    predefinedValue = deepClone(predefinedValue.predefinedValue);
    let value = this.props.exam[this.props.exam.definition.name];
    deepAssign(value, predefinedValue);
    this.setState({isDirty: true});
  }

  addGroupFavorite = (groupName: string) => {
    let group : {} = {[groupName]:this.props.exam[this.props.exam.definition.name][groupName]};
    this.props.onAddFavorite(group);
  }

  addGroup(groupType: string) {
    this.addableGroups.splice(this.addableGroups.indexOf(groupType), 1); //Remove the type from the addable list
    const exam : Exam = this.props.exam;
    let groupDefinition = exam.definition.fields.find((groupDefinition: GroupDefinition) => groupDefinition.label!==undefined?groupDefinition.label===groupType:groupDefinition.name===groupType);
    if (!groupDefinition) return;
    if (exam[exam.definition.name][groupDefinition.name]===undefined) {
      if (groupDefinition.type==='SRx') {
        exam[exam.definition.name][groupDefinition.name] = newRefraction();
      } else if (groupDefinition.multiValue===true) {
        exam[exam.definition.name][groupDefinition.name] = [];
      } else {
        exam[exam.definition.name][groupDefinition.name] = {};
      }
    }
    this.initialiseExam(exam);
    this.setState({isDirty: true});
  }

  renderGroup(groupDefinition: GroupDefinition, index: number) {
    let value : any = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
    if (value===undefined && groupDefinition.options===undefined) return null;
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.multiValue===true && groupDefinition.options===undefined) {
      groupDefinition = deepClone(groupDefinition);
      groupDefinition.multiValue = false;
      if (value instanceof Array === false) return null;
      return value.map((childValue: any, subIndex: number)=> <GroupedForm definition={groupDefinition} editable={this.props.editable} key={index+'.'+subIndex}
            form={childValue}
            onChangeField={(fieldName: string, newValue: string, column: ?string) => this.changeField(groupDefinition.name, fieldName, newValue, column, subIndex)}
            onClear={() => this.clear(groupDefinition.name, subIndex)}
            onAdd={() => this.addGroupItem(groupDefinition)}
            onAddFavorite={this.props.onAddFavorite?() => this.addGroupFavorite(groupDefinition.name):undefined}
          />
      );
    } else if (groupDefinition.type==='SRx') {
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={this.props.editable} glassesRx={value} hasVA={groupDefinition.hasVA} onCopy={groupDefinition.canBeCopied===true?this.copyToFinal:undefined}
        onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction(groupDefinition.name, glassesRx)} hasAdd={groupDefinition.hasAdd} key={groupDefinition.name}/>
    } else if (groupDefinition.type==='CRx') {
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={this.props.editable} glassesRx={value} hasVA={groupDefinition.hasVA} onCopy={groupDefinition.canBeCopied===true?this.copyToFinal:undefined}
        onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction(groupDefinition.name, glassesRx)} hasAdd={groupDefinition.hasAdd} key={groupDefinition.name}/>
    } else if (groupDefinition.options!=undefined) {
      return <CheckList definition={groupDefinition} editable={this.props.editable} value={value} key={groupDefinition.name+"-"+index}
        onChangeField={(newValue: string) => this.changeField(groupDefinition.name, undefined, newValue, undefined)}
        onClear={() => this.clear(groupDefinition.name)} patientId={this.patientId} examId={this.props.exam.id}
        onAddFavorite={this.props.onAddFavorite?() => this.addGroupFavorite(groupDefinition.name):undefined} />
    } else {
      return  <GroupedForm definition={groupDefinition} editable={this.props.editable} form={value} key={groupDefinition.name+"-"+index}
        onChangeField={(fieldName: string, newValue: string, column: ?string) => this.changeField(groupDefinition.name, fieldName, newValue, column)}
        onClear={() => this.clear(groupDefinition.name)} patientId={this.patientId} examId={this.props.exam.id}
        onAddFavorite={this.props.onAddFavorite?() => this.addGroupFavorite(groupDefinition.name):undefined} />
    }
  }

  renderAddableGroupsButton() {
    if (this.addableGroups===undefined || this.addableGroups.length===0) return null;
    return <FloatingButton options={this.addableGroups} onPress={(groupType: string) => this.addGroup(groupType)}/>
  }

  render() {
    return <View style={styles.flow}>
        {this.props.exam.definition.fields && this.props.exam.definition.fields.map((groupDefinition: GroupDefinition, index: number) =>
          this.renderGroup(groupDefinition, index)
        )}
        {(this.props.editable && this.props.favorites && this.props.favorites.length>0) && <Favorites favorites={this.props.favorites}
          onSelectFavorite={this.selectFavorite} style={styles.wideFavorites} onRemoveFavorite={this.props.onRemoveFavorite}/>}
        {this.renderAddableGroupsButton()}
      </View>
  }
}
