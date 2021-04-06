/**
 * @flow
 */
'use strict';

import React, {Component, PureComponent} from 'react';
import {
  View,
  Text,
  Button,
  TouchableHighlight,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {
  Exam,
  ExamDefinition,
  FieldDefinition,
  GroupDefinition,
  FieldDefinitions,
  ExamPredefinedValue,
  GlassesRx, Prescription,
} from "./Types";
import {strings} from './Strings';
import {styles, selectionColor, fontScale, scaleStyle, isWeb} from './Styles';
import {
  TilesField,
  TextField,
  NumberField,
  SelectionList,
  stripSelectionPrefix,
  selectionPrefix,
  FloatingButton, NoAccess,
} from "./Widgets";
import {FormTextInput, FormRow, FormInput} from './Form';
import {
  formatDate,
  dateFormat,
  dateTimeFormat,
  yearDateFormat,
  yearDateTimeFormat,
  isToyear,
  deepClone,
  deepAssign,
  isEmpty,
  formatTime,
} from './Util';
import {formatAllCodes, parseCode, formatCode} from './Codes';
import {getDefinitionCacheKey, fetchItemDefinition} from './Rest';
import {getCachedItem, cacheItem} from './DataCache';
import {
  Favorites,
  Star,
  Garbage,
  Plus,
  PaperClip,
  DrawingIcon,
  CopyRow,
  CopyColumn,
  Keyboard,
} from './Favorites';
import {
  GlassesDetail,
  GlassesSummary,
  newRefraction,
  formatPrism,
} from './Refraction';
import {getExamDefinition} from './ExamDefinition';
import {
  getFieldDefinition as getExamFieldDefinition,
  getFieldValue as getExamFieldValue,
} from './Exam';
import {CheckButton, Label} from './Widgets';
import {GroupedForm} from './GroupedForm';

export function getFieldDefinitions(itemId: string): ?FieldDefinitions {
  if (itemId === undefined || itemId === null) {
    return null;
  }
  const cacheKey: string = getDefinitionCacheKey(itemId);
  let definitions: FieldDefinitions = getCachedItem(cacheKey);
  return definitions;
}

export function filterFieldDefinition(
  fieldDefinitions: ?(FieldDefinition[]),
  fieldNames: string[] | string,
  startIndex: number = 0,
): ?FieldDefinition {
  if (!fieldDefinitions) {
    __DEV__ && console.error('Filtering empty fieldDefinitions');
    return undefined;
  }
  if (!Array.isArray(fieldNames)) {
    fieldNames = fieldNames.split('.');
  }
  let fieldDefinition: ?FieldDefinition | ?GroupDefinition;
  for (let i = startIndex; i < fieldNames.length; i++) {
    fieldDefinition = fieldDefinitions.find(
      (fieldDefinition: FieldDefinition | GroupDefinition) =>
        fieldDefinition.name === fieldNames[i],
    );
    if (fieldDefinition && fieldDefinition.fields !== undefined) {
      fieldDefinitions = fieldDefinition.fields;
    }
  }
  if (fieldDefinition === undefined) {
    __DEV__ && console.error("No fieldDefinition '" + fieldNames + "' exists.");
    return undefined;
  }
  return fieldDefinition;
}

export function getFieldDefinition(fullFieldName: string): ?FieldDefinition {
  let fieldNames: string[] = fullFieldName.split('.');
  if (fieldNames === undefined || fieldNames.length < 2) {
    return undefined;
  }
  if (fieldNames[0] === 'clFitting') {
    return undefined;
  }
  let fieldDefinitions: ?(FieldDefinition[]);
  if (fieldNames[0] === 'exam' && fieldNames.length > 1) {
    fieldDefinitions = getExamDefinition(fieldNames[1]).fields;
    fieldNames.splice(0, 1);
  } else {
    fieldDefinitions = getFieldDefinitions(fieldNames[0]);
  }
  if (fieldDefinitions === undefined) {
    //__DEV__ && console.warn('No fieldDefinitions exists for '+fieldNames[0]);
    return undefined;
  }
  return filterFieldDefinition(fieldDefinitions, fieldNames, 1);
}

export async function cacheDefinitions(language: string) {
  cacheItem('preExamDefinitions', undefined);
  cacheItem('assessmentDefinitions', undefined);
  cacheItem('examDefinitions', undefined);
  cacheItem('examPredefinedValues', undefined);
  cacheItem('visitTypes', undefined);
  await fetchItemDefinition('patient', language);
  await fetchItemDefinition('visit', language);
  await fetchItemDefinition('user', language);
}

export function formatValue(
  value: ?string | ?number | ?(string[]) | ?(number[]),
  fieldDefinition: FieldDefinition,
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    let formattedValue = value;
    if (
      fieldDefinition.prefix === '+' &&
      !formattedValue.startsWith('-') &&
      !formattedValue.startsWith('+')
    ) {
      formattedValue = '+' + formattedValue;
    }
    return formattedValue;
  } else if (typeof value === 'number') {
    let decimals: ?number = fieldDefinition.decimals;
    let formattedValue: string =
      decimals === undefined || decimals === null || decimals < 0
        ? value.toString()
        : value.toFixed(decimals);
    if (
      fieldDefinition.prefix === '+' &&
      !formattedValue.startsWith('-') &&
      !formattedValue.startsWith('+')
    ) {
      formattedValue = '+' + formattedValue;
    }
    return formattedValue;
  } else {
    return new String(value).valueOf();
  }
}

export function formatFieldValue(
  value: ?string | ?number | ?(string[]) | ?(number[]),
  fieldDefinition: FieldDefinition,
): string {
  if (value === undefined) {
    value = fieldDefinition.defaultValue;
  }
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === fieldDefinition.normalValue
  ) {
    return '';
  }
  const label: ?string = formatLabel(fieldDefinition);
  if (
    fieldDefinition.options &&
    fieldDefinition.options.length === 2 &&
    fieldDefinition.defaultValue === fieldDefinition.options[0]
  ) {
    //Checkbox with booleans
    if (value === true) {
      value = label;
    }
  }
  if (fieldDefinition.type && fieldDefinition.type.includes('Date')) {
    if (
      (fieldDefinition.prefix &&
        fieldDefinition.prefix instanceof Array === false) ||
      (fieldDefinition.suffix &&
        fieldDefinition.suffix instanceof Array === false)
    ) {
      return (
        formatPrefix(fieldDefinition, value) +
        formatDate(value, isToyear(value) ? dateFormat : yearDateFormat) +
        formatSuffix(fieldDefinition)
      );
    }
    return formatDate(value, isToyear(value) ? dateFormat : yearDateFormat);
  }
  if (
    fieldDefinition.type &&
    (fieldDefinition.type === 'time' || fieldDefinition.type.includes('Time'))
  ) {
    if (
      (fieldDefinition.prefix &&
        fieldDefinition.prefix instanceof Array === false) ||
      (fieldDefinition.suffix &&
        fieldDefinition.suffix instanceof Array === false)
    ) {
      return (
        formatPrefix(fieldDefinition, value) +
        formatTime(value) +
        formatSuffix(fieldDefinition)
      );
    }
    return formatTime(value);
  }
  if (fieldDefinition.type && fieldDefinition.type === 'prism') {
    return formatPrism(value);
  }
  //is this is a code field?
  if (
    fieldDefinition.options &&
    !fieldDefinition.combineOptions &&
    fieldDefinition.options instanceof Array === false
  ) {
    const codeType: string = fieldDefinition.options;
    if (fieldDefinition.multiValue) {
      if (value === undefined || value === null || value.length === 0) {
        return '';
      }
      const formattedValues: string[] = value.map((code: string) => {
        const prefix: string = selectionPrefix(code);
        const suffix: string = formatSuffix(fieldDefinition);
        return (
          prefix + formatCode(codeType, stripSelectionPrefix(code)) + suffix
        );
      });
      return new String(formattedValues).valueOf();
    }
    let prefix: string = selectionPrefix(value); //TODO: append fieldDefinition.prefix
    const suffix: string = formatSuffix(fieldDefinition);
    return prefix + formatCode(codeType, stripSelectionPrefix(value)) + suffix;
  }
  if (
    (fieldDefinition.prefix &&
      fieldDefinition.prefix instanceof Array === false) ||
    (fieldDefinition.suffix &&
      fieldDefinition.suffix instanceof Array === false)
  ) {
    return (
      formatPrefix(fieldDefinition, value) +
      formatValue(value, fieldDefinition) +
      formatSuffix(fieldDefinition)
    );
  }
  return formatValue(value, fieldDefinition);
}

export function isNumericField(fieldDefinition: FieldDefinition): boolean {
  return (
    fieldDefinition.minValue !== undefined ||
    fieldDefinition.maxValue !== undefined
  );
}

export function formatLabel(
  fieldDefinition:
    | FieldDefinition
    | GroupDefinition
    | {name: string, label: ?string},
): string {
  if (fieldDefinition === undefined) {
    return '';
  }
  if (fieldDefinition.label !== undefined && fieldDefinition.label !== null) {
    return fieldDefinition.label;
  }
  return fieldDefinition.name;
}

export function formatSuffix(
  fieldDefinition: FieldDefinition | GroupDefinition,
): string {
  if (
    fieldDefinition === undefined ||
    fieldDefinition.suffix === undefined ||
    fieldDefinition.suffix instanceof Array ||
    fieldDefinition.suffix.includes('Code')
  ) {
    return '';
  }
  return fieldDefinition.suffix;
}

export function formatPrefix(
  fieldDefinition: FieldDefinition | GroupDefinition,
  value: any,
): string {
  if (fieldDefinition === undefined || fieldDefinition.prefix === undefined) {
    return '';
  }
  if (
    fieldDefinition.options instanceof Array &&
    fieldDefinition.options.includes(value)
  ) {
    return '';
  }
  if (fieldDefinition.prefix === '+') {
    return '';
  }
  if (value && value.startsWith && value.startsWith(fieldDefinition.prefix)) {
    return '';
  }
  if (
    fieldDefinition.minValue != undefined &&
    fieldDefinition.maxValue != undefined
  ) {
    //TODO: This is copy paste form NumberField in Widgets.js !
    if (isNaN(value)) {
      if (fieldDefinition.prefix != '+') {
        let formattedValue: string = value.toString();
        let freeType: boolean = false;
        for (let i = 0; i < formattedValue.length; i++) {
          const character: char = formattedValue.charAt(i);
          if ('0123456789.-+'.includes(character) === false) {
            freeType = true;
            break;
          }
        }
        if (freeType) {
          return '';
        }
      }
    }
  }
  return fieldDefinition.prefix;
}

function constructItemView(
  itemView: string,
  item: any,
  fieldDefinitions: FieldDefinition[],
  isSelected: boolean,
  editable: boolean,
  onUpdateItem?: (propertyName: string, value: any) => void,
  orientation: string,
  titleFields?: string[],
  showLabels: boolean = false,
) {

  switch (itemView) {
    case 'EditableItem':
      return (
        <View style={{flex: 10}}>
          <EditableItem
            item={item}
            fieldDefinitions={fieldDefinitions}
            titleFields={titleFields}
            isSelected={isSelected}
            onUpdateItem={onUpdateItem}
            orientation={orientation}
            editable={editable}
          />
        </View>
      );
  }
  return (
    <View style={isSelected ? styles.listRowSelected : styles.listRow}>
      <ItemSummary
        item={item}
        orientation={orientation}
        fieldDefinitions={fieldDefinitions}
        editable={editable}
        showLabels={showLabels}
        titleFields={titleFields}
      />
    </View>
  );
}

type ItemSummaryProps = {
  item: any,
  fieldDefinitions: ?(FieldDefinition[]),
  editable?: boolean,
  orientation?: string,
  showLabels?: boolean,
  titleFields?: string[],
};
class ItemSummary extends Component<ItemSummaryProps> {
  render() {
    if (!this.props.item || !this.props.fieldDefinitions) {
      return null;
    }
    if (this.props.item?.noaccess) {
      const itemKeys = Object.keys(this.props.item);
      let dateValue: string = '';
      let dateLiteral: string = '';
      this.props.titleFields &&
        this.props.titleFields.forEach((titleField: string) => {
          if (itemKeys.indexOf(titleField) !== -1) {
            dateValue += this.props.item[titleField];
            dateLiteral += titleField;
          }
        });
      let formattedValue: string = '';
      if (dateValue !== null && dateValue !== '') {
        let rxDateObject = this.props.fieldDefinitions.find(fieldDefinition => fieldDefinition.name === dateLiteral);
        if (rxDateObject !== undefined)
          formattedValue += formatFieldValue(dateValue, rxDateObject);
      }
      return <NoAccess prefix={formattedValue} />;
    }
    if (this.props.orientation !== 'horizontal') {
      let description = '';
      let isFirstField = true;
      for (let i: number = 0; i < this.props.fieldDefinitions.length; i++) {
        const fieldDefinition: FieldDefinition = this.props.fieldDefinitions[i];
        const propertyName: string = fieldDefinition.name;
        const value: ?string | ?number = this.props.item[propertyName];
        if (value !== undefined && value !== null) {
          let formattedValue: string = formatFieldValue(value, fieldDefinition);
          if (formattedValue && formattedValue !== '') {
            if (!isFirstField && !description.trim().endsWith(':')) {
              description += ', ';
            }
            if (this.props.showLabels && this.props.fieldDefinitions[i].label) {
              description += this.props.fieldDefinitions[i].label + ': ';
            }
            description += formattedValue;
            isFirstField = false;
          }
        }
      }
      return <Text style={styles.textLeft}>{description}</Text>;
    }
    return (
      <View>
        {' '}
        //TODO
        <Text style={styles.text}>
          {this.props.item[this.props.fieldDefinitions[0].label]}
        </Text>
        <Text style={styles.text}>
          {this.props.item[this.props.fieldDefinitions[0].label]}
        </Text>
      </View>
    );
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
    onUpdateItem: (propertyName: string, value: any) => void,
  };

  static defaultProps = {
    editable: true,
  };

  format(value: string[] | string): string {
    if (!value) {
      return '';
    }
    if (value instanceof Array) {
      const values: string[] = value;
      if (values.length === 0) {
        return '';
      }
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
    this.props.titleFields &&
      this.props.titleFields.forEach((titleField: string) => {
        title = title + this.props.item[titleField] + ' ';
      });
    title = title.trim();
    if (title.length > 0) {
      return <Text style={styles.screenTitle}>{title}</Text>;
    }
  }

  render() {
    let isAllNormal: boolean = true;
    let style =
      this.props.orientation === 'horizontal' ? styles.flow : styles.form;
    if (this.props.isSelected) {
      style = [style, {backgroundColor: selectionColor}];
    }
    if (this.props.item?.noaccess) {
      return (
        <View style={style}>
          {this.renderTitle()}
          <NoAccess />
        </View>
      );
    }
    return (
      <View style={style}>
        {this.renderTitle()}
        {this.props.fieldDefinitions.map(
          (fieldDefinition: FieldDefinition, index: number) => {
            if (
              this.props.titleFields &&
              this.props.titleFields.includes(fieldDefinition.name)
            ) {
              return;
            }
            let description: string = this.format(
              this.props.item[fieldDefinition.name],
            );
            if (!description && fieldDefinition.normalValue) {
              isAllNormal = false;
            }
            if (!description) {
              return null;
            }
            isAllNormal = false;
            const propertyField = (
              <FormTextInput
                key={index}
                label={
                  fieldDefinition.label
                    ? fieldDefinition.label
                    : fieldDefinition.name
                }
                value={description}
                readonly={!this.props.editable}
                onChangeText={(text: string) =>
                  this.props.onUpdateItem(
                    fieldDefinition.name,
                    text.split(', '),
                  )
                }
              />
            );
            if (this.props.orientation === 'horizontal') {
              return propertyField;
            }
            return <FormRow key={index}>{propertyField}</FormRow>;
          },
        )}
        {isAllNormal && (
          <Text style={styles.textfield}>{strings.allNormal}</Text>
        )}
      </View>
    );
  }
}

export class ItemsCard extends Component {
  props: {
    exam: Exam,
    showTitle?: boolean,
  };
  static defaultProps = {
    showTitle: true,
  };

  renderItem(examItem: any, index: number) {
    if (this.props.exam.definition.fields === undefined) {
      return;
    }
    let fields = this.props.exam.definition.cardFields;
    if (fields === undefined || fields.length === 0) {
      fields = this.props.exam.definition.fields.map(
        (fieldDefinition: FieldDefinition) => fieldDefinition.name,
      );
    }

    let abnormalFields: string[] = fields.filter((field: string) => {
      let value: string | string[] = examItem[field];
      if (
        value === undefined ||
        value === null ||
        (value instanceof Array && value.length === 0)
      ) {
        return false;
      }
      const fieldDefinition:
        | ?GroupDefinition
        | FieldDefinition = this.props.exam.definition.fields.find(
        (fieldDefinition: GroupDefinition | FieldDefinition) =>
          fieldDefinition.name === field,
      );
      if (fieldDefinition === undefined || fieldDefinition === null) {
        return true;
      }
      if (fieldDefinition.normalValue == String(value)) {
        return false;
      }
      if (String(value).startsWith('(-)')) {
        return false;
      } //TODO is this a general rule
      return true;
    });
    return (
      <View
        style={
          this.props.exam.definition.editable
            ? styles.columnLayout
            : styles.topFlow
        }
        key={index}>
        {this.props.exam.definition.titleFields &&
          this.props.exam.definition.titleFields.map((titleField: string) => {
            return (
              <Text style={styles.boldText} key={titleField}>
                {examItem[titleField]}{' '}
              </Text>
            );
          })}
        {abnormalFields.map((field: string, subIndex: number) => {
          let value: string | string[] = examItem[field];
          if (this.props.exam.definition.fields === undefined) {
            return null;
          }
          const fieldDefinition:
            | ?GroupDefinition
            | FieldDefinition = this.props.exam.definition.fields.find(
            (fieldDefinition: GroupDefinition | FieldDefinition) =>
              fieldDefinition.name === field,
          );
          if (fieldDefinition === null || fieldDefinition === undefined) {
            return null;
          }
          return (
            <Text style={styles.textLeft} key={subIndex}>
              {this.props.exam.definition.editable
                ? fieldDefinition.label
                  ? fieldDefinition.label
                  : fieldDefinition.name + ': '
                : ''}
              {formatFieldValue(value, fieldDefinition)}{' '}
            </Text>
          );
        })}
      </View>
    );
  }

  render() {
    if (
      !this.props.exam[this.props.exam.definition.name] ||
      !this.props.exam[this.props.exam.definition.name].length ||
      Object.keys(this.props.exam[this.props.exam.definition.name][0])
        .length === 0 ||
      !this.props.exam.definition.fields
    ) {
      return (
        <View style={styles.columnLayout}>
          {this.props.showTitle && (
            <Label
              style={styles.cardTitle}
              value={
                this.props.exam.definition.label
                  ? this.props.exam.definition.label
                  : this.props.exam.definition.name
              }
              suffix=""
              fieldId={this.props.exam.definition.id}
            />
          )}
        </View>
      );
    }
    return (
      <View style={styles.columnLayout}>
        {this.props.showTitle && (
          <Label
            style={styles.cardTitle}
            value={
              this.props.exam.definition.label
                ? this.props.exam.definition.label
                : this.props.exam.definition.name
            }
            suffix=""
            fieldId={this.props.exam.definition.id}
          />
        )}
        {this.props.exam[this.props.exam.definition.name].map(
          (examItem: any, index: number) => {
            return this.renderItem(examItem, index);
          },
        )}
      </View>
    );
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
    showLabels?: boolean,
    testID: string,
  };
  static defaultProps = {
    editable: true,
  };

  allNormal(): void {
    this.props.fieldDefinitions.map(
      (fieldDefinition: FieldDefinition, index: number) => {
        if (fieldDefinition.normalValue) {
          if (fieldDefinition.multiValue) {
            this.props.onUpdateItem(fieldDefinition.name, [
              fieldDefinition.normalValue,
            ]);
          } else {
            this.props.onUpdateItem(
              fieldDefinition.name,
              fieldDefinition.normalValue,
            );
          }
        }
      },
    );
  }

  othersNormal(): void {
    this.props.fieldDefinitions.map(
      (fieldDefinition: FieldDefinition, index: number) => {
        const propertyName: string = fieldDefinition.name;
        if (
          (this.props.selectedItem[propertyName] === undefined ||
            this.props.selectedItem[propertyName].length === 0) &&
          fieldDefinition.normalValue
        ) {
          if (fieldDefinition.multiValue) {
            this.props.onUpdateItem(propertyName, [
              fieldDefinition.normalValue,
            ]);
          } else {
            this.props.onUpdateItem(propertyName, fieldDefinition.normalValue);
          }
        }
      },
    );
  }

  renderButtons() {
    const fontColor: string = '#1db3b3';
    if (!this.props.editable || this.props.onAddItem) {
      return null;
    }
    return (
      <View style={styles.buttonsRowLayout}>
        <View style={styles.buttonsRowStartLayout}>
          <Button
            title={strings.allNormal}
            color={fontColor}
            onPress={() => {
              this.allNormal();
            }}
            testID={this.props.testID + '.normal'}
          />
          <Button
            title={strings.othersNormal}
            color={fontColor}
            onPress={() => {
              this.othersNormal();
            }}
            testID={this.props.testID + '.allNormal'}
          />
        </View>
      </View>
    );
  }

  renderIcons() {
    if (!this.props.editable || this.props.onRemoveAllItems === undefined) {
      return null;
    }
    return (
      <View style={styles.groupIcons}>
        <TouchableOpacity
          onPress={this.props.onRemoveAllItems}
          testID={this.props.testID + '.garbageIcon'}>
          <Garbage style={styles.groupIcon} />
        </TouchableOpacity>
      </View>
    );
  }

  renderRow(itemView: Component, index: number): Component {
    return (
      <View key={index} style={{flexDirection: 'row'}}>
        {itemView}
      </View>
    );
  }

  renderList(): Component {
    const itemOrientation: string =
      this.props.orientation === 'vertical' ? 'horizontal' : 'vertical';
    return this.props.items.map((item: ?Prescription | any, index: number) => {
      const isSelected: boolean =
        this.props.selectedItem === item && this.props.items.length > 1;
      const itemView = constructItemView(
        this.props.itemView,
        item,
        this.props.fieldDefinitions,
        isSelected,
        (this.props.editable === this.props.onUpdateItem) !== undefined,
        this.props.onUpdateItem,
        itemOrientation,
        this.props.titleFields,
        this.props.showLabels,
      );
      if (!this.props.onSelectItem || this.props.editable !== true) {
        return this.renderRow(itemView, index);
      }
      return (
        <TouchableHighlight
          key={index}
          onPress={() => this.props.onSelectItem(item)}
          onLongPress={() =>
            item && this.props.onRemoveItem && this.props.onRemoveItem(item)
          }>
          {this.renderRow(itemView, index)}
        </TouchableHighlight>
      );
    });
  }

  render() {
    //const listStyle = this.props.orientation === 'horizontal' ? styles.listRow : styles.centeredColumnLayout;
    return (
      <View style={this.props.style ? this.props.style : styles.board}>
        {this.props.title && (
          <Text style={styles.cardTitle}>{this.props.title}</Text>
        )}
        <ScrollView>{this.renderList()}</ScrollView>
        {this.renderButtons()}
        {this.renderIcons()}
      </View>
    );
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
    editable?: boolean,
    fieldId: string,
  };
  state: {
    selectedItem: any,
    isDirty: boolean,
  };
  static defaultProps = {
    editable: true,
  };

  constructor(props: any) {
    super(props);
    let items: T[] = this.props.items;
    if (this.props.editable) {
      if (items.length === 0 && this.props.newItem !== undefined) {
        items.push(this.props.newItem());
      }
      this.state = {
        selectedItem: items[0],
        isDirty: this.props.isDirty ? this.props.isDirty : false,
      };
    } else {
      this.state = {
        selectedItem: undefined,
        isDirty: this.props.isDirty ? this.props.isDirty : false,
      };
    }
  }

  componentDidUpdate(prevProps: any) {
    if (
      prevProps.isDirty === this.props.isDirty &&
      prevProps.items === this.props.items &&
      prevProps.editable === this.props.editable
    ) {
      return;
    }
    let items: T[] = this.props.items;
    if (this.props.editable) {
      if (items.length === 0 && this.props.newItem !== undefined) {
        items.push(this.props.newItem());
      }
      this.setState({
        selectedItem: items[0],
        isDirty: this.props.isDirty ? this.props.isDirty : false,
      });
    } else {
      this.setState({
        selectedItem: undefined,
        isDirty: this.props.isDirty === true ? true : false,
      });
    }
  }

  updateItem = (propertyName: string, value: any): void => {
    if (this.props.editable !== true) {
      return;
    }
    let item = this.state.selectedItem;
    const fieldIndex = this.props.fieldDefinitions.findIndex(
      (fieldDefinition: FieldDefinition) =>
        fieldDefinition.name === propertyName,
    );
    const fieldDefinition: ?FieldDefinition = this.props.fieldDefinitions[
      fieldIndex
    ];
    if (fieldDefinition === undefined || fieldDefinition === null) {
      return;
    }
    //If field is a code replace value with code, taking selection prefix into account
    if (
      fieldDefinition.options &&
      fieldDefinition.options instanceof Array === false &&
      value !== undefined &&
      value !== null
    ) {
      const codeType: string = fieldDefinition.options;
      if (fieldDefinition.multiValue) {
        value = value.map(
          (description: string) =>
            selectionPrefix(description) +
            parseCode(codeType, stripSelectionPrefix(description)),
        );
      } else {
        value =
          selectionPrefix(value) +
          parseCode(codeType, stripSelectionPrefix(value));
      }
    }
    //Normal value handling
    if (
      fieldDefinition.normalValue !== undefined &&
      fieldDefinition.normalValue !== null
    ) {
      if (
        value &&
        value.length == 2 &&
        value[0].toLowerCase() === fieldDefinition.normalValue.toLowerCase()
      ) {
        value = value.splice(1);
      }
      if (
        value &&
        value.length > 1 &&
        value[value.length - 1].toLowerCase() ===
          fieldDefinition.normalValue.toLowerCase()
      ) {
        value = [fieldDefinition.normalValue];
      }
    }
    //Auto add or remove line
    if (this.props.newItem) {
      if (fieldIndex === 0) {
        if (value === undefined) {
          this.removeItem(item);
          return;
        } else if (
          item[fieldDefinition.name] !== undefined &&
          stripSelectionPrefix(value) !==
            stripSelectionPrefix(item[fieldDefinition.name])
        ) {
          item = this.addItem();
        }
      } else if (fieldIndex === 1 && fieldDefinition.newLine === true) {
        //I have no idea what this was for
        if (value === undefined) {
          this.removeItem(item);
          return;
        } else if (
          item[fieldDefinition.name] !== undefined &&
          stripSelectionPrefix(value) !==
            stripSelectionPrefix(item[fieldDefinition.name])
        ) {
          let newItem: any = this.props.newItem();
          newItem[this.props.fieldDefinitions[0].name] =
            item[this.props.fieldDefinitions[0].name];
          item = this.addItem(newItem);
        }
      }
    }
    //
    item[fieldDefinition.name] = value;
    this.setState({
      selectedItem: item,
    });
    this.props.onUpdate();
  };

  addItem(newItem: any): any {
    if (!this.props.newItem || !this.props.editable) {
      return;
    }
    if (newItem === undefined || newItem === null) {
      newItem = this.props.newItem();
    }
    this.props.items.push(newItem);
    this.setState({
      selectedItem: newItem,
      isDirty: true,
    });
    return newItem;
  }

  selectItem(item: any): void {
    if (!this.props.editable) {
      return;
    }
    this.setState({
      selectedItem: item,
    });
  }

  removeItem(item: any): void {
    if (!this.props.editable) {
      return;
    }
    let index: number = this.props.items.indexOf(item);
    if (index < 0) {
      return;
    }
    let items: any[] = this.props.items;
    items.splice(index, 1);
    if (items.length === 0) {
      items.push(this.props.newItem());
    }
    if (index >= items.length) {
      index = items.length - 1;
    }
    this.setState({
      selectedItem: items[index],
    });
    this.props.onUpdate();
  }

  removeAllItems = () => {
    if (!this.props.editable) {
      return;
    }
    this.props.items.splice(0, this.props.items.length);
    if (this.props.newItem !== undefined) {
      this.props.items.push(this.props.newItem());
      this.setState({selectedItem: this.props.items[0]});
    } else {
      this.props.items.push({});
      this.setState({selectedItem: this.props.items[0]});
    }
    this.props.onUpdate();
  };

  removeEmptyItems() {
    if (!this.props.isEmpty || !this.props.editable) {
      return;
    }
    let items: any[] = this.props.items;
    let i: number = 0;
    while (i < items.length) {
      if (this.props.isEmpty(items[i])) {
        items.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  selectFavorite = (predefinedValue: ExamPredefinedValue) => {
    if (!predefinedValue || !predefinedValue.predefinedValue) {
      return;
    }
    const items: any[] = this.props.items;
    //Remove the first line if empty
    if (items.length === 1 && items[0] && Object.keys(items[0]).length === 0) {
      items.splice(0, 1);
    }
    let value = predefinedValue.predefinedValue;
    value = deepClone(value);
    if (value instanceof Array) {
      items.push(...value);
    } else {
      items.push(value);
    }
    if (items.length === 0 && this.props.newItem !== undefined) {
      items.push(this.props.newItem());
    }
    this.setState({selectedItem: items[items.length - 1]});
    this.props.onUpdate();
  };

  renderSelectionLists() {
    if (!this.props.fieldDefinitions) {
      return null;
    }
    return this.props.fieldDefinitions.map(
      (fieldDefinition: FieldDefinition, index: number) => {
        if (fieldDefinition.options && fieldDefinition.options.length > 2) {
          const propertyName: string = fieldDefinition.name;
          let selection = this.state.selectedItem
            ? this.state.selectedItem[propertyName]
            : undefined;
          let options: CodeDefinition[] | string = fieldDefinition.options;
          if (options instanceof Array === false) {
            //We got ourselves some codes
            const codeType: string = fieldDefinition.options;
            options = formatAllCodes(fieldDefinition.options);
            if (fieldDefinition.multiValue) {
              if (selection !== undefined && selection !== null) {
                selection = selection.map(
                  (code: string) =>
                    selectionPrefix(code) +
                    formatCode(codeType, stripSelectionPrefix(code)),
                );
              }
            } else {
              if (selection !== undefined && selection !== null) {
                selection =
                  selectionPrefix(selection) +
                  formatCode(codeType, stripSelectionPrefix(selection));
              }
            }
          }
          return (
            <SelectionList
              key={index}
              label={
                fieldDefinition.label === undefined
                  ? fieldDefinition.name
                  : fieldDefinition.label
              }
              items={options}
              multiValue={fieldDefinition.multiValue}
              required={fieldDefinition.required}
              freestyle={fieldDefinition.freestyle}
              simpleSelect={fieldDefinition.simpleSelect}
              selection={selection}
              onUpdateSelection={(value) =>
                this.updateItem(propertyName, value)
              }
              fieldId={this.props.fieldId + '.' + fieldDefinition.name}
            />
          );
        }
      },
    );
  }

  renderNonOptionFields() {
    if (!this.props.fieldDefinitions || !this.state.selectedItem) {
      return null;
    }
    let fields: FieldDefinition[] = this.props.fieldDefinitions.filter(
      (fieldDefinition: FieldDefinition) =>
        fieldDefinition.options === undefined ||
        fieldDefinition.options.length <= 2,
    );
    if (fields.length === 0) {
      return null;
    }
    let form = this.state.selectedItem;
    let groupDefinition: GroupDefinition = {
      name: 'nonSelectables',
      label: '',
      fields: fields,
      size: 'M',
    };
    return (
      <View>
        <GroupedForm
          form={form}
          definition={groupDefinition}
          onChangeField={this.updateItem}
          fieldId={this.props.fieldId}
        />
      </View>
    );
  }

  addFavorite = () => {
    this.props.onAddFavorite && this.props.onAddFavorite(this.props.items);
  };

  render() {
    return (
      <View style={styles.page}>
        <View style={styles.flowLeft}>
          <ItemsList
            items={this.props.items}
            fieldDefinitions={this.props.fieldDefinitions}
            titleFields={this.props.titleFields}
            onAddItem={this.props.newItem ? () => this.addItem() : undefined}
            onUpdateItem={this.updateItem}
            selectedItem={this.state.selectedItem}
            onSelectItem={(item: any) => this.selectItem(item)}
            onAddFavorite={this.props.onAddFavorite}
            onRemoveItem={(item: any) => this.removeItem(item)}
            onRemoveAllItems={this.removeAllItems}
            itemView={this.props.itemView}
            orientation={this.props.orientation}
            editable={this.props.editable}
            style={
              this.props.onAddFavorite && this.props.editable
                ? styles.boardStretch
                : styles.boardStretchL
            }
            testID={this.props.fieldId}
          />
          {this.props.onAddFavorite && this.props.editable && (
            <Favorites
              favorites={this.props.favorites}
              onSelectFavorite={this.selectFavorite}
              onAddFavorite={this.addFavorite}
              onRemoveFavorite={this.props.onRemoveFavorite}
            />
          )}
        </View>
        {this.props.editable && (isWeb ?
          <View style={{flex: 100, flexDirection: 'row', flexWrap: 'wrap'}}>
            {this.renderSelectionLists()}
            {this.renderNonOptionFields()}
          </View>
         :
          <ScrollView horizontal={true}>
            {this.renderSelectionLists()}
            {this.renderNonOptionFields()}
          </ScrollView>
        )}
      </View>
    );
  }
}

export class SelectionListsScreen extends Component {
  props: {
    exam: Exam,
    onUpdateExam?: (exam: Exam) => void,
    editable?: boolean,
    favorites?: ExamPredefinedValue[],
    onAddFavorite?: (favorite: any) => void,
    onRemoveFavorite?: (favorite: ExamPredefinedValue) => void,
  };

  constructor(props: any) {
    super(props);
    //this.initialiseExam();
  }

  initialiseExam() {
    if (
      this.props.exam[this.props.exam.definition.name] === undefined ||
      JSON.stringify(this.props.exam[this.props.exam.definition.name]) == '{}'
    ) {
      this.props.exam[this.props.exam.definition.name] = [];
      if (!this.props.exam.definition.addable) {
        this.props.exam[this.props.exam.definition.name].push({});
      }
    }
  }

  newItem = () => {
    let newItem = {};
    return newItem;
  };

  isItemEmpty = (item: any) => {
    if (item === undefined || item === null || Object.keys(item).length === 0) {
      return true;
    }
    const examDefinition: ExamDefinition = this.props.exam.definition;
    if (examDefinition.essentialFields) {
      for (let i: number = 0; i < examDefinition.essentialFields.length; i++) {
        const field: string = examDefinition.essentialFields[i];
        const fieldValue = item[field];
        if (
          fieldValue === undefined ||
          fieldValue.length === 0 ||
          new String(fieldValue).trim() === ''
        ) {
          return true;
        }
      }
    } else {
      //TODO
    }
    return false;
  };

  render() {
    this.initialiseExam();
    return (
      <ItemsEditor
        items={this.props.exam[this.props.exam.definition.name]}
        newItem={this.props.exam.definition.addable ? this.newItem : undefined}
        isEmpty={this.isItemEmpty}
        fieldDefinitions={this.props.exam.definition.fields}
        titleFields={this.props.exam.definition.titleFields}
        itemView={
          this.props.exam.definition.editable ? 'EditableItem' : 'ItemSummary'
        }
        onUpdate={() =>
          this.props.onUpdateExam && this.props.onUpdateExam(this.props.exam)
        }
        editable={this.props.editable}
        isDirty={this.props.exam.errors !== undefined}
        favorites={
          this.props.exam.definition.starable ? this.props.favorites : undefined
        }
        onAddFavorite={
          this.props.exam.definition.starable
            ? this.props.onAddFavorite
            : undefined
        }
        onRemoveFavorite={
          this.props.exam.definition.starable
            ? this.props.onRemoveFavorite
            : undefined
        }
        fieldId={this.props.exam.definition.name}
      />
    );
  }
}
