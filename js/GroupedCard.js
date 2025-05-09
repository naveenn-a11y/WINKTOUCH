/**
 * @flow
 */

'use strict';

import { Component } from 'react';
import { Text, View } from 'react-native';
import { getFieldDefinition as getExamFieldDefinition, getFieldValue as getExamFieldValue } from './Exam';
import { DrawingIcon, PaperClip } from './Favorites';
import { getColumnFieldIndex, getIsVisible, getMultiValueGroup } from './GroupedForm';
import { formatFieldLabel, formatFieldValue, formatLabel, getFieldDefinition } from './Items';
import { GlassesSummary } from './Refraction';
import { fontScale, styles } from './Styles';
import type { FieldDefinition, GlassesRx, GroupDefinition } from './Types';
import { cleanUpArray, isEmpty, postfix } from './Util';
import { Label } from './Widgets';

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
    return this.renderFieldWithSummary(
      groupDefinition,
      undefined,
      fieldDefinition,
      showLabel,
      groupIndex,
      undefined,
      column,
    );
  }

  renderFieldWithSummary(
    groupDefinition: GroupDefinition,
    columnDefinition: GroupDefinition,
    fieldDefinition: FieldDefinition,
    showLabel: boolean,
    groupIndex: number,
    addDelimiterAsPrefix: boolean,
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
              testID={`label-${label}`}
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
    let columnLabel: ?string = '';

    if (groupDefinition.showColumnLabel === true) {
      columnLabel = postfix(formatLabel(columnDefinition), ': ');
    }

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
          style={styles.textLeftNoWidth}
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
            style={fieldDefinition.highlightedLabel ? styles.labelTitle : ''}>
            {label}:
          </Text>{' '}
          {fieldDefinition.delimiter &&
            addDelimiterAsPrefix === true &&
            `${fieldDefinition.delimiter} `}
          {columnLabel}
          {formattedValue}{' '}
          {fieldDefinition.delimiter &&
            addDelimiterAsPrefix === false &&
            `${fieldDefinition.delimiter} `}
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
        {fieldDefinition.delimiter &&
          addDelimiterAsPrefix === true &&
          `${fieldDefinition.delimiter} `}
        {columnLabel}
        {formattedValue}{' '}
        {fieldDefinition.delimiter &&
          addDelimiterAsPrefix === false &&
          `${fieldDefinition.delimiter} `}
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
        <Text style={fieldDefinition.highlightedLabel ? styles.labelTitle : ''}>
          {label}:
        </Text>{' '}
        {formattedValue}{' '}
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
    let addDelimiterAsPrefix: boolean = false; //suffix
    let previousColumn = null;

    const a = columns.map((column: string, columnIndex: number) => {
      if (column !== '>>') {
        const columnDefinition: GroupDefinition = groupDefinition.fields.find(
          (columnDefinition: FieldDefinition) =>
            columnDefinition.name === column,
        );

        if (columnIndex === columns.length - 1) {
          addDelimiterAsPrefix = undefined; //last column, no prexix, no suffix
        }
        if (columnIndex !== 0 && previousColumn === null) {
          addDelimiterAsPrefix = true; //prefix
        }

        const fieldDefinition: FieldDefinition =
          columnDefinition.fields[rowIndex];
        let field = this.renderFieldWithSummary(
          groupDefinition,
          columnDefinition,
          fieldDefinition,
          showLabel,
          groupIndex,
          addDelimiterAsPrefix,
          column,
        );
        if (field != null) {
          showLabel = false;
        }
        previousColumn = field;
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

  renderSubtitle(groupDefinition: GroupDefinition) {
    return (
      <Text
        testID="groupDefinitionSubtitle"
        style={styles.cardSubTitle}
        key={'subTitle'}>
        {formatLabel(groupDefinition)}
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
          visitId={this.props.exam.visitId}
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
        visitId={this.props.exam.visitId}
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

        let showSubtitles: boolean = this.props.exam.definition.showSubtitles;
        let valueRows = this.renderRows(groupDefinition, groupIndex);
        return this.formatRows(showSubtitles, valueRows, groupDefinition);
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
      return this.formatRows(showSubtitles, valueRows, groupDefinition);
    }
  }

  formatRows(
    showSubtitles: boolean,
    valueRows: any[],
    groupDefinition: GroupDefinition,
  ): any[] {
    let rows = [];
    if (showSubtitles && !isEmpty(valueRows) && valueRows.length !== 0) {
      rows.push(this.renderSubtitle(groupDefinition));
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
    let rowValues: string[][] = [];
    cardFields =
      cardFields === undefined ? this.expandMultiValueCardFields() : cardFields;
    cardFields.forEach((cardRowFields: string[]) => {
      let rowValue: ?(string[]) = cardRowFields.map((fullFieldName: string) => {
        if (fullFieldName.indexOf('.') === -1) {
          //Hard coded strings - do nothing
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
          const prefix: string = fieldDefinition
            ? fieldDefinition.highlightedValue
              ? '<b>'
              : ''
            : '';
          return `${prefix}${formattedValue}`;
        }
        if (formattedValue.length > 0) {
          const prefix: string = fieldDefinition
            ? fieldDefinition.highlightedValue
              ? '<b>'
              : ''
            : '';
          formattedValue = prefix + formattedValue + '  ';
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

    return rowValues.map((rowValue: string[], index: number) => {
      return (
        <Text style={styles.textLeftNoWidth}>
          {rowValue.map((eachvalue: string) => {
            if (eachvalue.startsWith('<b>')) {
              return (
                <Text style={styles.labelTitle}>
                  {eachvalue.substring(3, eachvalue.length - 1)}
                </Text>
              );
            } else {
              return eachvalue;
            }
          })}
        </Text>
      );
    });
  }

  render() {
    return (
      <View
        style={styles.columnLayout}
        key={this.props.exam.definition.name}
        testID="grouped-form-card"
      >
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