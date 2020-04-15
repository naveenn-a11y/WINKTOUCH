/**
 * @flow
 */
'use strict';

import React, { Component, PureComponent } from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {FieldDefinition, GroupDefinition, FieldDefinitions, ExamPredefinedValue, GlassesRx } from './Types';
import { strings } from './Strings';
import { styles, scaleStyle, fontScale } from './Styles';
import { FloatingButton } from './Widgets';
import { FormTextInput, FormRow, FormInput } from './Form';
import { deepClone, deepAssign, isEmpty, cleanUpArray } from './Util';
import { formatAllCodes} from './Codes';
import { getCachedItem } from './DataCache';
import { Favorites, Star, Garbage, Plus, PaperClip, DrawingIcon, CopyRow, CopyColumn, Keyboard, ImportIcon, ExportIcon } from './Favorites';
import { getConfiguration } from './Configuration';
import { importData } from './MappedField';
import { GlassesDetail, GlassesSummary, newRefraction } from './Refraction';
import { getFieldDefinition as getExamFieldDefinition, getFieldValue as getExamFieldValue, setMappedFieldValue } from './Exam';
import { CheckButton, Label } from './Widgets';
import { formatLabel, formatFieldValue, getFieldDefinition } from './Items';

export function hasColumns(groupDefinition: GroupDefinition) : boolean {
  return groupDefinition.columns!==undefined && groupDefinition.columns.length>0 && groupDefinition.columns[0]!==undefined &&
    groupDefinition.columns[0].length>0 && groupDefinition.columns[0][0]!==undefined && groupDefinition.columns[0][0].trim()!=='';
}


export function getColumnFieldIndex(groupDefinition: GroupDefinition, fieldName: string) : number {
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
    examId: string,
    fieldId: string
  }
  state: {
    formattedOptions: string[]
  }
  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    let formattedOptions : string[] = this.formatOptions(props.definition.options);
    this.addValueAsOption(formattedOptions, props.value);
    this.state = {
      formattedOptions
    };
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.value===prevProps.value && this.props.definition.options===prevProps.definition.options) return;
    let formattedOptions = this.formatOptions(this.props.definition.options);
    this.addValueAsOption(formattedOptions, this.props.value);
    this.setState({
      formattedOptions
    });
  }

  formatOptions(options :CodeDefinition[][]|CodeDefinition[]|string) : string[] {
    let formattedOptions : string[] = [];
    if (!(options instanceof Array)) {
      formattedOptions = formatAllCodes(options, undefined);
    } else {
      formattedOptions = [...options];
    }
    if (formattedOptions===undefined || formattedOptions===null) formattedOptions = [];
    return formattedOptions;
  }

  addValueAsOption(formattedOptions: string[], value: string|string[]) : void {
    if (value===undefined) return;
    if (value instanceof Array) {
      value.forEach((subValue: string) => {
        if (!formattedOptions.includes(subValue)) {
          formattedOptions.push(subValue);
        };
      });
    } else {
      if (!formattedOptions.includes(value)) {
        formattedOptions.push(value);
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
    if (option===undefined || option===null || option==='') return;
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
            <Label style={styles.sectionTitle} suffix='' value={formatLabel(this.props.definition)} fieldId={this.props.fieldId}/>
          <View style={styles.wrapBoard}>
        {this.state.formattedOptions.map((option: string) => {
            const isSelected : boolean|string = this.isSelected(option);
            const prefix : string = isSelected===true||isSelected===false?'':('('+isSelected+') ');
            return <View style={styles.formRow} key={option}>
              <CheckButton isChecked={isSelected!==false} suffix={prefix+option} onSelect={() => this.select(prefix+option)} onDeselect={() => this.select(prefix+option)}/>
            </View>
          }
        )}
    </View>
    {this.props.definition.freestyle && this.props.editable && <View style={styles.formRow} key='freestyle'>
        <FormTextInput speakable={true} onChangeText={this.addValue}/>
      </View>
    }
    {this.props.editable && this.props.onClear && <View style={styles.groupIcons}><TouchableOpacity onPress={this.props.onClear}><Garbage style={styles.groupIcon}/></TouchableOpacity></View>}

    </View>
  }
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

  componentDidUpdate(prevProps: any) {
    if (this.props.exam===prevProps.exam) return;
    this.groupDefinition = this.props.exam.definition.fields.find((fieldDefinition: GroupDefinition|FieldDefinition) => fieldDefinition.name === this.props.exam.definition.cardGroup);
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
      if (showLabel===true && label!==undefined && label!==null && label.trim()!=='') {
        return <View style={styles.rowLayout} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}><Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{label}: </Text>{icon}</View>
      }
      return <View style={styles.rowLayout} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{icon}</View>
    }
    const formattedValue : string = formatFieldValue(value, fieldDefinition);
    if (formattedValue==='') return null;
    const label : ?string = formatLabel(fieldDefinition);

    if (formattedValue==label) showLabel = false;
    if (showLabel===true && label!==undefined && label!==null && label.trim()!=='' && fieldName!==value) { //Last condition is for checkboxes
      //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);
      return <Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{label}: {formattedValue}   </Text>
    }
    //__DEV__ && console.log('key='+groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column);

    return <Text style={styles.textLeft} key={groupDefinition.name+'-'+fieldName+'-'+groupIndex+'-'+column}>{formattedValue}   </Text>
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
    let showLabel : boolean = true;
    const a = columns.map((column: string, columnIndex: number) => {
      if (column!=='>>') {
        const columnDefinition : GroupDefinition = groupDefinition.fields.find((columnDefinition: FieldDefinition) => columnDefinition.name === column);
        const fieldDefinition : FieldDefinition = columnDefinition.fields[rowIndex];
        let field = this.renderField(groupDefinition, fieldDefinition, showLabel, groupIndex, column);
        if (field!=null) showLabel = false;
        return field;
      }
    })

    //__DEV__ && console.log('key='+groupIndex+'-'+groupDefinition.name+'-'+rowIndex);
    return isEmpty(a) ? null :<View style={styles.rowLayout} key={groupIndex+' '+groupDefinition.name+'-'+rowIndex+'-'}>{a}</View>
  }

  renderColumnedRows(groupDefinition: GroupDefinition, columnDefinition: GroupDefinition, groupIndex : number) {
    let rows : any[] = [];
    const rowCount : number = columnDefinition.fields.length;
    const columns : string[] = groupDefinition.columns.find((columns: string[]) => columns.length>0 && columns[0]===columnDefinition.name);
    for (let rowIndex : number = 0; rowIndex< rowCount; rowIndex++) {
        const cr = cleanUpArray(this.renderColumnedRow(groupDefinition, columns, rowIndex, groupIndex))
        if(!isEmpty(cr)) rows.push(cr);
    }
    return rows;
  }


  renderSimpleRow(groupDefinition: GroupDefinition, fieldDefinition: FieldDefinition, groupIndex?: number = 0) {
    const showLabel : boolean = true;
    return this.renderField(groupDefinition, fieldDefinition, showLabel, groupIndex);
  }

  renderSubtitle(name) {
    return <Text style={styles.cardSubTitle} key={'subTitle'}>{name}</Text>
  }

  renderRows(groupDefinition: GroupDefinition, groupIndex?: number = 0) {
    let rows : any[] = [];

    for (let fieldIndex: number = 0; fieldIndex < groupDefinition.fields.length; fieldIndex++) {
      const fieldDefinition : FieldDefinition|GroupDefinition = groupDefinition.fields[fieldIndex];
      const columnFieldIndex : number = getColumnFieldIndex(groupDefinition, fieldDefinition.name)
      if (columnFieldIndex===0) {
        const cr = this.renderColumnedRows(groupDefinition, fieldDefinition, groupIndex)
        if(!isEmpty(cr)) rows.push(cr);
      } else if (columnFieldIndex<0){
        const sr = this.renderSimpleRow(groupDefinition, fieldDefinition, groupIndex);
        if(sr !== null) rows.push(sr);
      }
    }
    return rows;
  }

  renderGlassesSummary(groupDefinition: GroupDefinition) {
    if (groupDefinition===undefined || groupDefinition===null) return null;
    if (this.props.exam[this.props.exam.definition.name]===undefined || this.props.exam[this.props.exam.definition.name][groupDefinition.name]===undefined) return null;
    if (groupDefinition.multiValue) {
        return this.props.exam[this.props.exam.definition.name][groupDefinition.name].map((rx : GlassesRx, index: number) =>
            <GlassesSummary showHeaders={false} glassesRx={rx} key={groupDefinition.name+"."+index}/>
        );
    }
    return <GlassesSummary showHeaders={false} glassesRx={this.props.exam[this.props.exam.definition.name][groupDefinition.name]} key={groupDefinition.name}/>
  }


  renderGroup(groupDefinition: GroupDefinition) {
    if (this.props.exam[this.props.exam.definition.name]===undefined) return null;
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.type==='SRx') {
      return this.renderGlassesSummary(groupDefinition);
    } else if (groupDefinition.multiValue===true && groupDefinition.options===undefined) {
      const value = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (value===undefined || value===null || (value instanceof Array) === false || value.length===0) return null;
      return value.map((groupValue: any, groupIndex: number)=> {
        if (groupValue===undefined || groupValue===null || Object.keys(groupValue).length===0) return null;
        return this.renderRows(groupDefinition, groupIndex);
      });
    } else if (groupDefinition.fields===undefined && groupDefinition.options) {//A CheckList
      return this.renderCheckListItem(groupDefinition);
    } else {
      let showSubtitles : boolean = this.props.exam.definition.showSubtitles; //TODO: can we remove this flag
      if (this.props.exam.definition.fields.length===1 && this.props.exam.definition.fields[0].multiValue!==true) showSubtitles = false;
      const value : any = this.props.exam[this.props.exam.definition.name][groupDefinition.name];
      if (value===undefined || value===null || Object.keys(value).length===0) return null;
      let valueRows = this.renderRows(groupDefinition);
      let rows = [];
      if(showSubtitles && !isEmpty(valueRows) && valueRows.length !== 0) {
        rows.push(this.renderSubtitle(formatLabel(groupDefinition)));
        rows.push(<View key="w" style={{marginLeft: 30 * fontScale}}>{valueRows}</View>);
      } else {
        rows.push(valueRows);
      };
      
      return rows;
    }
  }

  renderAllGroups() {
    if (!this.props.exam[this.props.exam.definition.name]) return null;
    if (this.props.exam.definition.fields===null || this.props.exam.definition.fields===undefined || this.props.exam.definition.fields.length===0) return null;
    return this.props.exam.definition.fields.map((groupDefinition :GroupDefinition) => this.renderGroup(groupDefinition));
  }

  renderTitle() {
    if (this.props.showTitle===false) return null;
    return <Label style={styles.cardTitle} key='cardTitle' value={formatLabel(this.props.exam.definition)} suffix='' fieldId={this.props.exam.definition.id}/>;
  }

  getGroupDefinition(fullFieldName: string) : GroupDefinition {
    if (fullFieldName.startsWith('exam.')) fullFieldName = fullFieldName.substring(5);
    const groupName = fullFieldName.substring(0, fullFieldName.indexOf('.'));
    return getExamFieldDefinition(groupName, this.props.exam);
  }

  expandMultiValueCardFields() : string[][] { //This is kind of advanced logic which I should document. Don't tamper with it if you are a rookie.
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
    return (
      <View style={styles.columnLayout} key={this.props.exam.definition.name}>
        {this.renderTitle()}
        {isEmpty(this.props.exam[this.props.exam.definition.name])?null:this.props.exam.definition.cardFields?this.renderCardRows():this.groupDefinition?this.renderGroup(this.groupDefinition):this.renderAllGroups()}
      </View>)
  }

}

export class GroupedForm extends Component {
  props: {
    form: {},
    definition: GroupDefinition,
    editable?: boolean,
    style?: any,
    onChangeField?: (fieldName: string, newValue: any, column: ?string) => void,
    onUpdateForm? : (form: any) => void,
    onClear?: () => void,
    onAddFavorite?: (favoriteName: string) => void,
    onAdd?: () => void,
    patientId: string,
    examId: string,
    enableScroll?: () => void,
    disableScroll?: () => void,
    fieldId: string
  }
  state: {
    isTyping: boolean
  }

  static defaultProps = {
    editable: true
  }

  constructor(props: any) {
    super(props);
    this.state = {
      isTyping: false
    }
  }

  toggleTyping = () : void => {
    this.setState({isTyping: this.state.isTyping?false:true});
  }

  formatColumnLabel(column: string) : string {
    const columnDefinition : ?GroupDefinition|FieldDefinition = this.props.definition.fields.find((columnDefinition : GroupDefinition|FieldDefinition) => columnDefinition.name === column);
    return formatLabel(columnDefinition);
  }

  changeField(fieldDefinition: FieldDefinition, newValue: any, column: ?string) {
    if (fieldDefinition.mappedField) {
      const exam : Exam = getCachedItem(this.props.examId);
      setMappedFieldValue(fieldDefinition.mappedField, newValue, exam);
    }
    if (this.props.onChangeField) {
      this.props.onChangeField(fieldDefinition.name, newValue, column);
    }
  }

  renderField(fieldDefinition: FieldDefinition, column?: string) {
    if (fieldDefinition===undefined)
      return <View style={styles.fieldFlexContainer} key={column}><Text style={styles.text}></Text></View>
    if (fieldDefinition.mappedField) {
      let exam : Exam = getCachedItem(this.props.examId);
      fieldDefinition = Object.assign({}, getExamFieldDefinition(fieldDefinition.mappedField, exam), fieldDefinition);
    }
    const value = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name]:undefined:this.props.form[fieldDefinition.name]:undefined;
    //if (fieldDefinition.mappedField) {
    //  value = getExamFieldValue(fieldDefinition.mappedField, getCachedItem(this.props.examId));
    //  __DEV__ && console.log('Got mapped field value '+fieldDefinition.mappedField+' from exam :'+value);
    //}
    //if (value===undefined) {
    //  value = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name]:undefined:this.props.form[fieldDefinition.name]:undefined;
    //}

    const error = this.props.form?column?this.props.form[column]?this.props.form[column][fieldDefinition.name+'Error']:undefined:this.props.form[fieldDefinition.name+'Error']:undefined;
    const label : string = formatLabel(this.props.definition)+(column!==undefined?' '+this.formatColumnLabel(column)+' ':' ')+formatLabel(fieldDefinition);
    return <FormInput value={value} filterValue={this.props.form} label={label} showLabel={false} readonly={!this.props.editable} definition={fieldDefinition}
      onChangeValue={(newValue: string) => this.changeField(fieldDefinition, newValue, column)} errorMessage={error} isTyping={this.state.isTyping}
      patientId={this.props.patientId} examId={this.props.examId} enableScroll={this.props.enableScroll} disableScroll={this.props.disableScroll} key={fieldDefinition.name+(column===undefined?'':column)}/>
  }

  renderSimpleRow(fieldDefinition: FieldDefinition) {
    const label : string = formatLabel(fieldDefinition);
    if (fieldDefinition.layout)
      return this.renderField(fieldDefinition);
    return <View style={styles.formRow} key={fieldDefinition.name}>
        <View style={styles.formRowHeader}><Label value={label} fieldId={this.props.fieldId+'.'+fieldDefinition.name}/></View>
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
      fields.push(<Label value={label} key={fieldDefinition.name+'Label'} fieldId={this.props.fieldId+'.'+fieldDefinition.name}/>);
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
    return <View style={styles.formRow} key={'columnHeader-'+columnDefinition.name}>
          <Text style={styles.formTableRowHeader}> </Text>
          {columns.map((column: string, index: number) => {
              const columnDefinition : FieldDefinition = this.props.definition.fields.find((fieldDefinition: FieldDefinition) => fieldDefinition.name === column);
              if (columnDefinition) {
                const columnLabel : string = formatLabel(columnDefinition);
                return <Label value={columnLabel} style={styles.formTableColumnHeader} key={index} suffix={''} fieldId={this.props.fieldId+'.'+columnDefinition.name}/>
              } else {
                if (column==='>>') {
                  if (index===columns.length-1) {
                    return <View style={styles.formTableColumnHeaderSmall} key={'header-'+index}></View>
                  } else {
                    return <View style={styles.formTableColumnHeaderFlat} key={'header-'+index}><CopyColumn onPress={() => this.copyColumn(columns[index-1], columns[index+1])}/></View>
                  }
                }
                return null;
              }
            })
          }
      </View>
  }

  renderColumnedRow(labelId: string, fieldLabel: string, columns: string[], rowIndex: number, copyRow: () => void) {
    return <View style={styles.formRow} key={'columnedRow-'+rowIndex}>
        <Label value={fieldLabel} style={styles.formTableRowHeader} fieldId={labelId}/>
        {columns.map((column: string, columnIndex: number) => {
            const columnDefinition : GroupDefinition = this.props.definition.fields.find((columnDefinition: FieldDefinition) => columnDefinition.name === column);
            if (columnDefinition) {
              const fieldDefinition : FieldDefinition = columnDefinition.fields[rowIndex];
              return this.renderField(fieldDefinition, column);
            } else {
              if (columnIndex===columns.length-1) {
                if (rowIndex==0) {
                    return [<View style={styles.formTableColumnHeaderSmall} key={'copyRowSpace-'+rowIndex}></View>,<CopyRow onPress={copyRow} key={'copyRow-'+rowIndex}/>];
                } else {
                  return <View style={styles.formTableColumnHeaderSmall} key={'cpoyRowSpace-'+rowIndex}></View>
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
      rows.push(this.renderColumnedRow(this.props.fieldId+'.'+columnDefinition.name+'.'+columnedFields[i].name, formatLabel(columnedFields[i]), columns, i, () => this.copyRow(columnedFields, i, i+1, columns)));
    }
    return rows;
  }

  renderRows() {
    let rows : any[] = [];
    const groupDefinition : GroupDefinition = this.props.definition;
    if (!groupDefinition.fields) return null;
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

  parseUnaidedAcuities = (data) => {
    const dva = {};
    const nva = {};
    const ph = {};

    if (data instanceof Array) {
      for(let i = 0; i < data.length; i++) {
        const m = data[i];
        const d = m.data;
        if(d.label && (d.label === 'DW' || d.label === 'NW')) { // near
          nva.OS = d.os.va;
          nva.OD = d.od.va;
          nva.OU = d.ou.va;
        } else if(d.label && (d.label === 'Dw' || d.label === 'Nw')) { // far
          dva.OS = d.os.va;
          dva.OD = d.od.va;
          dva.OU = d.ou.va;
        }

        if(d.os.vaph) {
          ph.OS = d.os.vaph;
        }
        if(d.od.vaph) {
          ph.OD = d.od.vaph;
        }
      }
    }

    const o = {
      DVA: dva,
      NVA: nva,
      PH: ph
    };

    this.props.onUpdateForm(this.props.definition.name, o)
  }

  parseAidedAcuities = (data) => {
    const dva = {};
    const nva = {};
    const ph = {};

    if (data instanceof Array) {
      for(let i = 0; i < data.length; i++) {
        const m = data[i];
        const d = m.data;
        if(d.label && (d.label === 'DLMNEAR' || d.label === 'NLMNEAR')) { // near
          nva.OS = d.os.corrVa;
          nva.OD = d.od.corrVa;
          nva.OU = d.ou.corrVa;
        } else if(d.label && (d.label === 'DLMFAR' || d.label === 'NLMFAR')) { // far
          dva.OS = d.os.corrVa;
          dva.OD = d.od.corrVa;
          dva.OU = d.ou.corrVa;
        }

        if(d.os.corrVaPh) {
          ph.OS = d.os.corrVaPh;
        }
        if(d.od.corrVaPh) {
          ph.OD = d.od.corrVaPh;
        }
      }
    }

    const o = {
      DVA: dva,
      NVA: nva,
      PH: ph
    };

    this.props.onUpdateForm(this.props.definition.name, o)
  }

  parseIop = (data) => {
    const os = {};
    const od = {};

    if (data instanceof Array) {
      for(let i = 0; i < data.length; i++) {
        const m = data[i];
        const d = m.data;
        os.Tension = d.os.iop;
        os.Pachymetry = d.os.thickness;
        od.Tension = d.od.iop;
        od.Pachymetry = d.od.thickness;
      }
    } else {
      const d = data.data;
      os.Tension = d.os.iop;
      os.Pachymetry = d.os.thickness;
      od.Tension = d.od.iop;
      od.Pachymetry = d.od.thickness;
    }

    const o = [{
      OS: os,
      OD: od
    }];

    this.props.onUpdateForm(this.props.definition.name, o)
  }

  async importData() {
    if(!this.props.onUpdateForm) return

    const data = await importData(this.props.definition.import, this.props.examId);

    if (data===undefined || data===null) return;

    if(this.props.definition.name === 'Unaided acuities') {
      this.parseUnaidedAcuities(data);
    } else if(this.props.definition.name === 'Aided acuities') {
      this.parseAidedAcuities(data);
    } else if(this.props.definition.name === 'IOP') {
      this.parseIop(data);
    }
  }

  async exportData() {
    // TODO export data
  }

  renderIcons() {
    if (!this.props.editable || (!this.props.onAddFavorite && !this.props.onClear && !this.props.definition.keyboardEnabled)) return null;
    return [<View style={styles.groupIcons} key='icons'>
      {this.props.onClear && <TouchableOpacity onPress={this.props.onClear}><Garbage style={styles.groupIcon}/></TouchableOpacity>}
      {this.props.onAdd && <TouchableOpacity onPress={this.props.onAdd}><Plus style={styles.groupIcon}/></TouchableOpacity>}
      {this.props.definition.keyboardEnabled && <TouchableOpacity onPress={this.toggleTyping}><Keyboard style={styles.groupIcon} disabled={this.state.isTyping}/></TouchableOpacity>}
      {this.props.onAddFavorite && <Star onAddFavorite={this.props.onAddFavorite} style={styles.groupIcon}/>}
    </View>,
    <View style={styles.groupExtraIcons}>
      {this.props.editable && this.props.definition.import && <TouchableOpacity onPress={() => this.importData()}><ImportIcon style={styles.groupIcon}/></TouchableOpacity>}
    </View>]
  }

  render() {
    const style = this.props.style?this.props.style:this.props.definition.layout?scaleStyle(this.props.definition.layout):this.props.definition.size?styles['board'+this.props.definition.size]:styles.board;

    return  <View style={style} key={this.props.definition.name}>
        <Label style={styles.sectionTitle} key='title' suffix='' value={formatLabel(this.props.definition)} fieldId={this.props.fieldId} />
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
    onAddFavorite?: (favorite: any, name: string) => void,
    editable?: boolean,
    onRemoveFavorite?: (favorite: ExamPredefinedValue) => void,
    enableScroll?: () => void,
    disableScroll?: () => void
  }
  addableGroups: string[]
  patientId: string

  constructor(props: any) {
    super(props);
    this.initialiseExam(this.props.exam, this.props.editable);
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.exam===this.props.exam && prevProps.exam[prevProps.exam.definition.name]===this.props.exam[this.props.exam.definition.name] && prevProps.editable===this.props.editable) {
      return;
    }
    this.initialiseExam(this.props.exam, this.props.editable);
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
            if (groupDefinition.multiValue) {
              exam[exam.definition.name][groupDefinition.name] = [newRefraction()];
            } else {
              exam[exam.definition.name][groupDefinition.name] = newRefraction();
            }
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
      let newValue = groupDefinition.type==='SRx'?newRefraction():{};
      groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
        if (fieldDefinition.fields instanceof Array && fieldDefinition.fields.length!==0) {
            newValue[fieldDefinition.name] = {}
        }
      });
      if (groupDefinition.clone instanceof Array && values.length>0) {
        const lastValue = deepClone(values[0]);
        groupDefinition.clone.forEach((fieldName : string) => {
          newValue[fieldName] = lastValue[fieldName];
        });
      }
      values.unshift(newValue);
    }
    this.props.onUpdateExam(this.props.exam);
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
    this.props.onUpdateExam(this.props.exam);
  }

  updateRefraction(groupName: string, refraction: GlassesRx) {
    if (!this.props.editable) return;
    //this.props.exam[this.props.exam.definition.name][refractionType] = refraction;
    this.props.onUpdateExam(this.props.exam);
  }

  updateGroup = (groupName: string, form: any, index?: number) => {
    if (index!==undefined && index!==null) {
      this.props.exam[this.props.exam.definition.name][groupName][index]=form;
    } else {
      this.props.exam[this.props.exam.definition.name][groupName]=form;
    }
    this.props.onUpdateExam(this.props.exam);
  }

  copyToFinal = (glassesRx : GlassesRx) : void => {
    glassesRx = deepClone(glassesRx);
    this.props.exam[this.props.exam.definition.name]['Final Rx']=glassesRx;
    this.props.onUpdateExam(this.props.exam);
  }

  copyFromFinal = (glassesRx : GlassesRx) : void => {
    if (!this.props.editable) return;
    const finalRx : GlassesRx = deepClone(this.props.exam[this.props.exam.definition.name]['Final Rx']);
    glassesRx.od = finalRx.od;
    glassesRx.os = finalRx.os;
    this.props.onUpdateExam(this.props.exam);
  }


  clearSubGroupDefinition(groupDefinition: GroupDefinition|FieldDefinition, groupName: string) : void {

      if(groupDefinition.fields === undefined) {
        if(groupDefinition.name && !groupDefinition.readonly) {
           this.clearSubValue(groupDefinition.name);
        }
      }


      if(groupDefinition.fields) {
      groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
      this.clearSubGroupDefinition(fieldDefinition, groupName);
      });
      }

    }

  clearSubValue(name: string) : void {

    this.props.exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
      if (this.props.exam[this.props.exam.definition.name][groupDefinition.name]!==undefined) {
          groupDefinition.fields instanceof Array && groupDefinition.fields.forEach((fieldDefinition: FieldDefinition|GroupDefinition) => {
            if (fieldDefinition.fields instanceof Array && fieldDefinition.fields.length!==0) {
                //Remove Readonly elements From Form
                this.props.exam[this.props.exam.definition.name][groupDefinition.name][fieldDefinition.name]["Form"][name] = undefined; 
                this.props.exam[this.props.exam.definition.name][groupDefinition.name][fieldDefinition.name]["lines"] = undefined; 
            }
          });
      }
    });
  }

  clear(groupName: string, index?: number) : void {

    if (index!==undefined) {
      this.props.exam[this.props.exam.definition.name][groupName].splice(index, 1);
      if (this.props.exam[this.props.exam.definition.name][groupName].length===0)
          this.props.exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
           this.clearSubGroupDefinition(groupDefinition, groupName);
            });
    } else {
        this.props.exam.definition.fields.forEach((groupDefinition: GroupDefinition|FieldDefinition) => {
        this.clearSubGroupDefinition(groupDefinition, groupName);
        });    
      }
    this.initialiseExam(this.props.exam, this.props.editable);
    this.props.onUpdateExam(this.props.exam);
  }

  selectFavorite = (predefinedValue: ExamPredefinedValue) => {
    if (!predefinedValue || !predefinedValue.predefinedValue) return;
    predefinedValue = deepClone(predefinedValue.predefinedValue);
    let value = this.props.exam[this.props.exam.definition.name];
    deepAssign(value, predefinedValue);
    this.props.onUpdateExam(this.props.exam);
  }

  addGroupFavorite = (groupName: string, favoriteName: string) => {
    let group : {} = {[groupName]:this.props.exam[this.props.exam.definition.name][groupName]};
    this.props.onAddFavorite(group, favoriteName);
  }

  addGroup(groupType: string) {
    this.addableGroups.splice(this.addableGroups.indexOf(groupType), 1); //Remove the type from the addable list
    const exam : Exam = this.props.exam;
    let groupDefinition = exam.definition.fields.find((groupDefinition: GroupDefinition) => groupDefinition.label!==undefined?groupDefinition.label===groupType:groupDefinition.name===groupType);
    if (!groupDefinition) return;
    if (exam[exam.definition.name][groupDefinition.name]===undefined) {
      if (groupDefinition.type==='SRx') {
        if (groupDefinition.multiValue===true) {
          exam[exam.definition.name][groupDefinition.name] = [newRefraction()];
        } else {
          exam[exam.definition.name][groupDefinition.name] = newRefraction();
        }
      } else if (groupDefinition.multiValue===true) {
        exam[exam.definition.name][groupDefinition.name] = [];
      } else {
        exam[exam.definition.name][groupDefinition.name] = {};
      }
    }
    this.initialiseExam(exam);
    this.props.onUpdateExam(this.props.exam);
  }

  renderGroup(groupDefinition: GroupDefinition, index: number) {
    const fieldId : string = this.props.exam.definition.id+"."+groupDefinition.name;
    //__DEV__ && console.log('render group '+groupDefinition.name+' for exam: '+JSON.stringify(this.props.exam));
    let value : any = this.props.exam[this.props.exam.definition.name];
    if (value===undefined) {
      this.initialiseExam(this.props.exam);
      value = this.props.exam[this.props.exam.definition.name];
    }
    value = value[groupDefinition.name];
    if (value===undefined && groupDefinition.options===undefined) return null;
    if (groupDefinition.mappedField) {
      groupDefinition = Object.assign({}, getFieldDefinition(groupDefinition.mappedField), groupDefinition);
    }
    if (groupDefinition.multiValue===true && groupDefinition.options===undefined) {
      groupDefinition = deepClone(groupDefinition);
      groupDefinition.multiValue = false;
      if (value instanceof Array === false) return null;
      return value.map((childValue: any, subIndex: number)=> groupDefinition.type==='SRx'?
        <GlassesDetail title={formatLabel(groupDefinition)} editable={this.props.editable} glassesRx={childValue} hasVA={groupDefinition.hasVA} onCopy={groupDefinition.canBeCopied===true?this.copyToFinal:undefined} onPaste={groupDefinition.canBePaste===true?this.copyFromFinal:undefined}
          onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction(groupDefinition.name, glassesRx)} hasAdd={groupDefinition.hasAdd} hasLensType={groupDefinition.hasLensType} key={groupDefinition.name}
          onAdd={() => this.addGroupItem(groupDefinition)}
          onClear={() => this.clear(groupDefinition.name, subIndex)}
          definition={groupDefinition}
          key={'Rx'+index+'.'+subIndex}
          examId={this.props.exam.id}
          fieldId={this.props.exam.definition.id+'.'+groupDefinition.name}
          editable={this.props.editable!==false && groupDefinition.readonly!==true}
        />
        :<GroupedForm definition={groupDefinition} editable={this.props.editable} key={groupDefinition.name+"-"+index+'.'+subIndex}
            form={childValue}
            onChangeField={(fieldName: string, newValue: string, column: ?string) => this.changeField(groupDefinition.name, fieldName, newValue, column, subIndex)}
            onClear={() => this.clear(groupDefinition.name, subIndex)}
            onAdd={() => this.addGroupItem(groupDefinition)}
            onAddFavorite={this.props.onAddFavorite?(favoriteName: string) => this.addGroupFavorite(groupDefinition.name, favoriteName):undefined}
            enableScroll={this.props.enableScroll} disableScroll={this.props.disableScroll}
            onUpdateForm={(groupName: string, newValue: any) => this.updateGroup(groupName, newValue, subIndex)}
            patientId={this.patientId}
            examId={this.props.exam.id}
            fieldId={fieldId}
            editable={this.props.editable!==false && groupDefinition.readonly!==true}
          />
      );
    } else if (groupDefinition.type==='SRx') {
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={this.props.editable} glassesRx={value} hasVA={groupDefinition.hasVA} onCopy={groupDefinition.canBeCopied===true?this.copyToFinal:undefined} examId={this.props.exam.id}   editable={this.props.editable!==false && groupDefinition.readonly!==true}
        onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction(groupDefinition.name, glassesRx)} hasAdd={groupDefinition.hasAdd} hasLensType={groupDefinition.hasLensType} key={groupDefinition.name} definition={groupDefinition} fieldId={this.props.exam.definition.id+'.'+groupDefinition.name}/>
    } else if (groupDefinition.type==='CRx') {
      return <GlassesDetail title={formatLabel(groupDefinition)} editable={this.props.editable} glassesRx={value} hasVA={groupDefinition.hasVA} onCopy={groupDefinition.canBeCopied===true?this.copyToFinal:undefined} examId={this.props.exam.id}   editable={this.props.editable!==false && groupDefinition.readonly!==true}
        onChangeGlassesRx={(glassesRx: GlassesRx) => this.updateRefraction(groupDefinition.name, glassesRx)} hasAdd={groupDefinition.hasAdd} hasLensType={groupDefinition.hasLensType} key={groupDefinition.name} definition={groupDefinition} fieldId={this.props.exam.definition.id+'.'+groupDefinition.name}/>
    } else if (groupDefinition.options!=undefined) {
      return <CheckList definition={groupDefinition} editable={this.props.editable} value={value} key={groupDefinition.name+"-"+index}
        onChangeField={(newValue: string) => this.changeField(groupDefinition.name, undefined, newValue, undefined)}
        onClear={() => this.clear(groupDefinition.name)} patientId={this.patientId} examId={this.props.exam.id}
        onAddFavorite={this.props.onAddFavorite?(favoriteName: string) => this.addGroupFavorite(groupDefinition.name, favoriteName):undefined}
        editable={this.props.editable!==false && groupDefinition.readonly!==true}
        fieldId={this.props.exam.definition.id+'.'+groupDefinition.name} />
    } else {
      return  <GroupedForm definition={groupDefinition} editable={this.props.editable} form={value} key={groupDefinition.name+"-"+index}
        onChangeField={(fieldName: string, newValue: string, column: ?string) => this.changeField(groupDefinition.name, fieldName, newValue, column)}
        onClear={() => this.clear(groupDefinition.name)}
        onAddFavorite={this.props.onAddFavorite?(favoriteName: string) => this.addGroupFavorite(groupDefinition.name, favoriteName):undefined}
        enableScroll={this.props.enableScroll} disableScroll={this.props.disableScroll}
        onUpdateForm={(groupName: string, newValue: any) => this.updateGroup(groupName, newValue)}
        patientId={this.patientId}
        examId={this.props.exam.id}
        editable={this.props.editable!==false && groupDefinition.readonly!==true}
        fieldId={fieldId}/>
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
