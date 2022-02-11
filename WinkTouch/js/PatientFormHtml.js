/**
 * @flow
 */

'use strict';
import {Platform} from 'react-native';
import type {
  FieldDefinition,
  GroupDefinition,
  GlassesRx,
  ImageDrawing,
  Visit,
  PatientInfo,
  HtmlDefinition,
  ImageBase64Definition,
} from './Types';
import {strings} from './Strings';
import {
  scaleStyle,
  fontScale,
  imageStyle,
  defaultFontSize,
  isWeb,
} from './Styles';
import {
  formatDate,
  isEmpty,
  officialDateFormat,
  prefix,
  postfix,
  formatDiopter,
  formatDegree,
  getValue,
  formatAge,
} from './Util';

import {formatPrism, hasPrism} from './Refraction';
import {
  getFieldDefinition as getExamFieldDefinition,
  getCurrentAction,
  UserAction,
} from './Exam';
import {
  formatLabel,
  formatFieldValue,
  getFieldDefinition,
  filterFieldDefinition,
} from './Items';
import RNFS from 'react-native-fs';
import {line, curveBasis} from 'd3-shape';
import {fetchUpload, getMimeType, getAspectRatio} from './Upload';
import {getColumnFieldIndex, hasColumns} from './GroupedForm';
import {getCachedItem} from './DataCache';
import {getStore} from './DoctorApp';
import {formatCode} from './Codes';
import {getBase64Image} from './ImageField';
import {getPatientFullName} from './Patient';
let smallMedia: Array<any> = [];
let largeMedia: Array<any> = [];
let PDFAttachment: Array<any> = [];
let SelectedPDFAttachment: Array<any> = [];
let index = 0;
let imageBase64Definition: ImageBase64Definition[] = [];
export function getImageBase64Definition() {
  return imageBase64Definition;
}

let scannedFilesHtml: string = '';

export function getScannedFiles() {
  return !isEmpty(scannedFilesHtml)
    ? `<div class = "scannedFiles">${scannedFilesHtml}</div>`
    : '';
}

export function setScannedFiles(html: string) {
  scannedFilesHtml = html;
}
export function printPatientHeader(visit: Visit) {
  let html: string = '';
  const patient: PatientInfo = getCachedItem(visit.patientId);
  const store: Store = getStore();
  const doctor: User = getCachedItem(visit.userId);
  html +=
    '    <header class="clearfix">' +
    `      <h1>${strings.patientFile}</h1>` +
    '      <div id="company" class="clearfix">' +
    `        <div>${store.companyName}</div>` +
    `        <div>${store.streetName + prefix(store.unit, ', ')}<br />${
      store.postalCode
    } ${store.city}</div>` +
    `        <div>${store.telephone}</div>` +
    `        <div>${store.email}</div>` +
    '      </div>' +
    '      <div id="client">' +
    `        <div><span>${strings.doctor}</span>${doctor.firstName} ${doctor.lastName}</div>` +
    `        <div><span>${strings.patient}</span>${getPatientFullName(
      patient,
    )}</div>` +
    `        <div><span></span>${
      postfix(patient.unit, '-') +
      postfix(patient.streetNumber, ', ') +
      patient.streetName +
      prefix(patient.city, ', ') +
      prefix(patient.province, ', ') +
      prefix(patient.postalCode, ', ') +
      prefix(patient.country, ', ')
    }</div>` +
    `        <div><span></span>${patient.email}</div>` +
    `        <div><span></span>${
      patient.cell ? patient.cell + ' ' : patient.phone
    }</div>` +
    `        <div><span></span>${patient.dateOfBirth}</div>` +
    `        <div><span>${strings.healthCard}</span>${
      patient.medicalCard
    } ${prefix(patient.medicalCardVersion, 'V:')} ${prefix(
      patient.medicalCardExp,
      'EXP:',
    )}</div>` +
    `        <div><span>${strings.examDate}</span>${formatDate(
      visit.date,
      officialDateFormat,
    )}</div>` +
    '    </header>';

  return html;
}
export function renderItemsHtml(
  exam: Exam,
  parentHtmlDefinition?: HtmlDefinition[],
): any {
  let html: String = '';
  let htmlDefinition: HtmlDefinition[] = [];

  if (
    !exam[exam.definition.name] ||
    !exam[exam.definition.name].length ||
    Object.keys(exam[exam.definition.name][0]).length === 0 ||
    !exam.definition.fields
  ) {
    const value: any = exam.definition.label
      ? exam.definition.label
      : exam.definition.name;

    html += `<div style="display:none;">${value}</div>`;
  } else {
    let examKeyFound: boolean = false;

    const value: any = exam.definition.label
      ? exam.definition.label
      : exam.definition.name;
    if (isEmpty(value)) {
      return html;
    }

    html += '<div class="container">';
    html += '<div class="BreakBeforeHeader"></div>';
    html += `<div class="groupHeader"><div style="margin: auto;">${value}</div></div>`;
    html += '<div class="desc">';
    let htmlSubItems: string = '';
    let parentDefinitionName = '';
    exam[exam.definition.name].map((examItem: any, index: number) => {
      let item: any = renderItemHtml(examItem, index, exam, htmlDefinition);
      htmlSubItems += `<div>${item}</div>`;
    });
    html += htmlSubItems;
    parentHtmlDefinition.push({
      name: exam.definition.name,
      html: htmlSubItems,
      child: htmlDefinition,
    });
    html += '</div>';
    html += '</div>';
  }
  return html;
}

function renderItemHtml(
  examItem: any,
  index: number,
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
) {
  let html: String = '';
  if (exam.definition.fields === undefined) {
    return html;
  }
  let isFirstField = true;
  const fieldDefinitions: FieldDefinition[] = exam.definition.fields;
  for (let i: number = 0; i < fieldDefinitions.length; i++) {
    let htmlSubItems: String = '';

    const fieldDefinition: FieldDefinition = fieldDefinitions[i];
    const propertyName: string = fieldDefinition.name;

    const value: ?string | ?number = examItem[propertyName];

    if (value !== undefined && value !== null) {
      let formattedValue: string = formatFieldValue(value, fieldDefinition);
      if (isEmpty(formattedValue)) {
        formattedValue = value;
      }
      if (formattedValue && !isEmpty(formattedValue)) {
        const label = exam.definition.editable
          ? fieldDefinition.label
            ? fieldDefinition.label
            : fieldDefinition.name
          : '';

        if (isEmpty(label)) {
          if (!isFirstField) {
            html += '<span>,</span>';
          }
          htmlSubItems += `<span>${formattedValue}</span>`;
          isFirstField = false;
        } else {
          htmlSubItems += `<div><span class="label">${formattedValue}:</span><span class="value">${formattedValue}</span></div>`;
        }
      }
      html += htmlSubItems;
      htmlDefinition.push({name: propertyName, html: htmlSubItems});
    }
  }
  return html;
}

async function mergeHtmlTemplate() {}

export async function renderParentGroupHtml(
  exam: Exam,
  parentHtmlDefinition?: HtmlDefinition[],
): any {
  let htmlDefinition: HtmlDefinition[] = [];

  let html: string = '';
  if (
    exam.definition &&
    exam.definition.isPatientFileHidden &&
    getCurrentAction() !== undefined &&
    getCurrentAction() == UserAction.PATIENTFILE
  ) {
    return html;
  }
  html += '<div class="container">';
  html += '<div class="BreakBeforeHeader"></div>';
  const xlGroupDefinition: GroupDefinition[] = exam.definition.fields.filter(
    (groupDefinition: GroupDefinition) => groupDefinition.size === 'XL',
  );
  if (xlGroupDefinition && xlGroupDefinition.length > 0) {
    html += '<div>';
    html += isEmpty(exam[exam.definition.name])
      ? ''
      : await renderAllGroupsHtml(exam, htmlDefinition);
    html += '</div>';
    html += '</div>';
    parentHtmlDefinition.push({
      name: exam.definition.name,
      html: html,
      child: htmlDefinition,
    });
  } else {
    if (exam.definition.name === 'Consultation summary') {
      if (!isEmpty(exam.resume)) {
        html += `<div class="groupHeader"><div style="margin: auto;">${formatLabel(
          exam.definition,
        )}</div></div>`;
        html += '<div class="desc">';
        html += `<div style="white-space: pre-line">${exam.resume}</div>`;
        html += '</div>';
        html += '</div>';
        parentHtmlDefinition.push({
          name: exam.definition.name,
          html: `<div style="white-space: pre-line">${exam.resume}</div>`,
        });
      }
    } else {
      let htmlSubItems: string = '';
      htmlSubItems += await renderAllGroupsHtml(exam, htmlDefinition);
      if (isEmpty(htmlSubItems)) {
        html += '</div>';
        return html;
      }
      html += `<div class="groupHeader"><div style="margin: auto;">${formatLabel(
        exam.definition,
      )}</div></div>`;
      html += '<div class="desc">';
      html += htmlSubItems;
      html += '</div>';
      html += '</div>';
      parentHtmlDefinition.push({
        name: exam.definition.name,
        html: htmlSubItems,
        child: htmlDefinition,
      });
    }
  }
  return html;
}

/**
 This Function accepts 2 parameters :
 * examKey: the key to get the equivalent html value for it
 * keyMap: contain map key -> html value of the current exam
 */
async function getSubValue(examKey: string, keyMap: HtmlDefinition[]) {
  if (examKey === undefined || keyMap === undefined) {
    return '';
  }

  let fieldNames: string[] = examKey.split('.');

  if (fieldNames.length <= 1) {
    let htmlDefinition: HtmlDefinition | HtmlDefinition[];
    if (keyMap instanceof Array) {
      htmlDefinition = keyMap.filter(
        (htmlDefinition: HtmlDefinition) =>
          htmlDefinition.name.trim().toLowerCase() ===
          examKey.trim().toLowerCase(),
      );
    } else {
      htmlDefinition = keyMap;
    }
    let html: string = '';
    if (htmlDefinition instanceof Array) {
      for (const subHtmlDefinition: HtmlDefinition of htmlDefinition) {
        if (subHtmlDefinition.html !== undefined) {
          html += subHtmlDefinition.html;
        }
      }
    } else {
      html += htmlDefinition.html;
    }
    return html;
  }
  let subHtmlDefinition: HtmlDefinition | HtmlDefinition[] = keyMap.filter(
    (htmlDefinition: HtmlDefinition) =>
      htmlDefinition.name.trim().toLowerCase() ===
      fieldNames[0].trim().toLowerCase(),
  );
  let subFieldName: string;
  if (subHtmlDefinition === undefined || subHtmlDefinition.length == 0) {
    subHtmlDefinition = keyMap.filter(
      (htmlDefinition: HtmlDefinition) =>
        htmlDefinition.name.trim().toLowerCase() ===
        fieldNames[1].trim().toLowerCase(),
    );
    subFieldName = examKey.substring(examKey.indexOf('.') + 1);
    subFieldName = subFieldName.substring(subFieldName.indexOf('.') + 1);
  } else {
    subFieldName = examKey.substring(examKey.indexOf('.') + 1);
  }
  if (subHtmlDefinition instanceof Array) {
    if (subHtmlDefinition.length == 0) {
      return '';
    }
    for (const htmlDefinition: HtmlDefinition of subHtmlDefinition) {
      if (
        subFieldName.trim().toLowerCase() ===
        htmlDefinition.name.trim().toLowerCase()
      ) {
        return await getSubValue(subFieldName, htmlDefinition);
      } else {
        return await getSubValue(subFieldName, htmlDefinition.child);
      }
    }
  } else {
    if (
      subFieldName.trim().toLowerCase() ===
      htmlDefinition.name.trim().toLowerCase()
    ) {
      return await getSubValue(subFieldName, htmlDefinition);
    } else {
      return await getSubValue(subFieldName, htmlDefinition.child);
    }
  }
}
/**
 This Function receives as parameter html string containing the template text.
 This Function will filter the text containing exam keys and return all keys..
 */
async function retreiveKeys(html: string) {
  let subValue = html.split('{');
  let examKeys: string[] = [];
  for (var i = 1; i < subValue.length; i++) {
    const key = subValue[i].split('}')[0];
    const name = key.split('.')[0];
    if (name.toLowerCase() === 'exam') {
      examKeys.push(key);
    }
  }
  return examKeys;
}
async function renderAllGroupsHtml(
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
) {
  let html: string = '';

  if (!exam[exam.definition.name]) {
    return '';
  }
  if (
    exam.definition.fields === null ||
    exam.definition.fields === undefined ||
    exam.definition.fields.length === 0
  ) {
    return '';
  }
  await Promise.all(
    exam.definition.fields.map(async (groupDefinition: GroupDefinition) => {
      const result = await renderGroupHtml(
        groupDefinition,
        exam,
        htmlDefinition,
      );
      htmlDefinition.push({name: groupDefinition.name, html: result});
      if (!isEmpty(result)) {
        html += result;
      }
    }),
  );

  return html;
}
async function renderGroupHtml(
  groupDefinition: GroupDefinition,
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
) {
  let html: string = '';
  if (exam[exam.definition.name] === undefined) {
    return '';
  }
  if (groupDefinition.mappedField) {
    groupDefinition = Object.assign(
      {},
      getFieldDefinition(groupDefinition.mappedField),
      groupDefinition,
    );
  }
  if (groupDefinition.type === 'SRx') {
    html += renderGlassesSummary(groupDefinition, exam, htmlDefinition);
  } else if (
    groupDefinition.multiValue === true &&
    groupDefinition.options === undefined
  ) {
    const value = exam[exam.definition.name][groupDefinition.name];
    if (
      value === undefined ||
      value === null ||
      value instanceof Array === false ||
      value.length === 0
    ) {
      return html;
    }
    await Promise.all(
      value.map(async (groupValue: any, groupIndex: number) => {
        if (
          groupValue === undefined ||
          groupValue === null ||
          Object.keys(groupValue).length === 0
        ) {
          return html;
        }

        const rowValue = await renderRowsHtml(
          groupDefinition,
          exam,
          htmlDefinition,
          groupIndex,
        );
        html += rowValue;
      }),
    );
  } else if (groupDefinition.fields === undefined && groupDefinition.options) {
    html += renderCheckListItemHtml(exam, groupDefinition);
  } else {
    const value: any = exam[exam.definition.name][groupDefinition.name];
    if (
      value === undefined ||
      value === null ||
      Object.keys(value).length === 0
    ) {
      return null;
    }
    const rowValue = await renderRowsHtml(
      groupDefinition,
      exam,
      htmlDefinition,
    );
    html += rowValue;
  }
  return html;
}

async function renderRowsHtml(
  groupDefinition: GroupDefinition,
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
  groupIndex?: number = 0,
) {
  let rows: any[] = [];
  let html: string = '';
  let rowHtmlDefinition: HtmlDefinition[] = [];
  const form = exam[exam.definition.name][groupDefinition.name];
  if (!groupDefinition.fields) {
    return null;
  }

  const groupLabel = formatLabel(groupDefinition);
  const examLabel = formatLabel(exam.definition);
  let labelDisplayed: boolean = false;
  for (const fieldDefinition: FieldDefinition of groupDefinition.fields) {
    let htmlSubItems: string = '';
    const columnFieldIndex: number = getColumnFieldIndex(
      groupDefinition,
      fieldDefinition.name,
    );

    if (columnFieldIndex === 0) {
      const value = await renderColumnedRows(
        fieldDefinition,
        groupDefinition,
        exam,
        form,
        rowHtmlDefinition,
        groupIndex,
      );
      html += value;
    } else if (columnFieldIndex < 0) {
      const value = await renderField(
        fieldDefinition,
        groupDefinition,
        exam,
        form,
        undefined,
        groupIndex,
      );
      if (!isEmpty(value)) {
        if (
          groupLabel !== examLabel &&
          groupDefinition.size !== 'XL' &&
          !fieldDefinition.image
        ) {
          htmlSubItems += !labelDisplayed
            ? '<div class="groupLabel">' +
              formatLabel(groupDefinition) +
              '</div>'
            : '';
          labelDisplayed = true;
        }
        const label: string = formatLabel(fieldDefinition);
        if (label !== undefined && label !== null && label.trim() !== '') {
          htmlSubItems += '<div>';
          if (!fieldDefinition.image) {
            htmlSubItems += `<div><span class="label">${label}:</span>`;
          }
          htmlSubItems += `<span class="value">${value}</span></div>`;
          htmlSubItems += '</div>';
        } else {
          if (fieldDefinition.image) {
            htmlSubItems += '<div>' + value + '</div>';
          } else {
            htmlSubItems += '<div><span>' + value + '</span></div>';
          }
        }
        rowHtmlDefinition.push({
          name: fieldDefinition.name,
          html: htmlSubItems,
        });
        html += htmlSubItems;
      }
    }
  }
  htmlDefinition.push({name: groupDefinition.name, child: rowHtmlDefinition});

  return html;
}

async function renderColumnedRows(
  columnDefinition: GroupDefinition,
  definition: GroupDefinition,
  exam: Exam,
  form: {},
  htmlDefinition?: HtmlDefinition[],
  groupIndex?: number = 0,
) {
  let rows: string[][] = [];
  let html: string = '';
  let childHtmlDefinition: HtmlDefinition[] = [];

  const columnedFields: FieldDefinition[] = columnDefinition.fields;
  const columns: string[] = definition.columns.find(
    (columns: string[]) =>
      columns.length > 0 && columns[0] === columnDefinition.name,
  );

  await Promise.all(
    columnedFields.map(async (column: string, i: number) => {
      const value = await renderColumnedRow(
        formatLabel(columnedFields[i]),
        columns,
        i,
        definition,
        exam,
        form,
        htmlDefinition,
        groupIndex,
      );
      rows.push(value);
    }),
  );

  let allRowsEmpty: boolean = false;
  for (let i = 0; i < rows.length; i++) {
    let rowValues = rows[i].slice(1);
    for (let j = 0; j < rowValues.length; j++) {
      if (!isEmpty(rowValues[j])) {
        allRowsEmpty = false;
        break;
      } else {
        allRowsEmpty = true;
      }
    }
    if (allRowsEmpty == false) {
      break;
    }
  }

  if (allRowsEmpty == false) {
    html += '<table class="childTable" style="margin:10px;">';
    html += renderColumnsHeader(columnDefinition, definition);
    rows.forEach((column: string[]) => {
      html += '<tr>';
      column.forEach((value: string) => {
        html += `<td class="desc">${value}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';

    if (
      getCurrentAction() !== undefined &&
      getCurrentAction() == UserAction.REFERRAL
    ) {
      let customColumns: string[] = columns.filter(
        (header: string) => header !== '>>',
      );
      customColumns.map((header: string, i: number) => {
        let subHtml: string = '';
        subHtml += '<table class="childTable" style="margin:10px;">';
        rows.forEach((column: string[]) => {
          subHtml += '<tr>';
          column.map((value: string, j: number) => {
            if (j == 0 || j == i + 1) {
              subHtml += `<td class="desc">${value}</td>`;
            }
          });
          subHtml += '</tr>';
        });
        subHtml += '</table>';
        htmlDefinition.push({name: header, html: subHtml});
      });
    }
  }

  return html;
}

async function renderColumnedRow(
  fieldLabel: string,
  columns: string[],
  rowIndex: number,
  definition: GroupDefinition,
  exam: Exam,
  form: {},
  htmlDefinition?: HtmlDefinition[],
  groupIndex?: number = 0,
) {
  let columnValues: string[] = [];
  let childHtmlDefinition: HtmlDefinition[] = [];
  let rowHtmlDefinition: HtmlDefinition[] = [];

  columnValues.push(fieldLabel);
  await Promise.all(
    columns.map(async (column: string, columnIndex: number) => {
      const columnDefinition: GroupDefinition = definition.fields.find(
        (columnDefinition: FieldDefinition) => columnDefinition.name === column,
      );
      if (columnDefinition) {
        const fieldDefinition: FieldDefinition =
          columnDefinition.fields[rowIndex];
        const value = await renderField(
          fieldDefinition,
          definition,
          exam,
          form,
          column,
          groupIndex,
        );

        if (fieldDefinition) {
          childHtmlDefinition.push({
            name: fieldDefinition.name,
            html: `<span>${value}</span>`,
          });
        }
        if (columnDefinition) {
          htmlDefinition.push({
            name: columnDefinition.name,
            child: childHtmlDefinition,
          });
        }
        childHtmlDefinition = [];
        columnValues.push(value);
      }
    }),
  );

  return columnValues;
}
function renderColumnsHeader(
  columnDefinition: GroupDefinition,
  definition: GroupDefinition,
) {
  let html: string = '';
  if (hasColumns(definition) === false) {
    return null;
  }
  const columns = definition.columns.find(
    (columns: string[]) => columns[0] === columnDefinition.name,
  );
  if (columns === undefined || columns.length === 0) {
    return null;
  }
  html += '<thead><tr>';
  html += `<th class="desc">${formatLabel(definition)}</th>`;
  columns.map((column: string, index: number) => {
    const columnDefinition: FieldDefinition = definition.fields.find(
      (fieldDefinition: FieldDefinition) => fieldDefinition.name === column,
    );
    if (columnDefinition) {
      const columnLabel: string = formatLabel(columnDefinition);
      html += `<th class="desc">${columnLabel}</th>`;
    }
  });
  html += '</thead></tr>';
  return html;
}
function renderHtmlTitle(exam: Exam) {
  return `<td class="service">${formatLabel(exam.definition)}</td>`;
}
function renderCheckListItemHtml(exam: Exam, fieldDefinition: FieldDefinition) {
  let html: string = '';
  const value = exam[exam.definition.name][fieldDefinition.name];
  if (fieldDefinition.normalValue === value) {
    return '';
  }
  const formattedValue: string = formatFieldValue(value, fieldDefinition);
  if (formattedValue === '') {
    return formattedValue;
  }
  const label: ?string = formatLabel(fieldDefinition);
  html += `<div><span>${label}: </span><span>${formattedValue}</span></div>`;
  return html;
}

async function renderField(
  fieldDefinition: FieldDefinition,
  groupDefinition: GroupDefinition,
  exam: Exam,
  form: {},
  column?: string,
  groupIndex?: number = 0,
) {
  let html: string = '';

  if (groupDefinition === undefined || fieldDefinition === undefined) {
    return '';
  }

  if (fieldDefinition.mappedField) {
    fieldDefinition = Object.assign(
      {},
      getExamFieldDefinition(fieldDefinition.mappedField, exam),
      fieldDefinition,
    );
  }
  const value =
    groupDefinition.multiValue === true
      ? form
        ? column
          ? form[groupIndex][column]
            ? form[groupIndex][column][fieldDefinition.name]
            : undefined
          : form[groupIndex][fieldDefinition.name]
        : undefined
      : form
      ? column
        ? form[column]
          ? form[column][fieldDefinition.name]
          : undefined
        : form[fieldDefinition.name]
      : undefined;

  if (value) {
    if (fieldDefinition && fieldDefinition.image !== undefined) {
      const imageValue = await renderMedia(
        value,
        fieldDefinition,
        groupDefinition,
        exam,
      );
      if (isEmpty(imageValue)) {
        return '';
      }

      if (fieldDefinition.image.startsWith('upload')) {
        html += imageValue;
      } else {
        let ImageIndex = '';
        html += isWeb ? '<div class="images-warp">' : '';
        if (
          (groupDefinition.size === 'L' || groupDefinition.size === 'XL') &&
          fieldDefinition.size !== 'M'
        ) {
          html += '<div class="breakBefore"></div>';
          html += '<span class="img-wrap" style="width:100%">';
          ImageIndex = `L-${index + 1}`;
        } else {
          html += '<span class="img-wrap s-img" >';
          ImageIndex = `S-${index + 1}`;
        }
        index += 1;
        html += imageValue;
        html += `<span class="imageTitle">${exam.definition.name} (${ImageIndex})</span>`;
        html += '</span>';
        html += isWeb ? '</div>' : '';
        if (
          (groupDefinition.size === 'L' || groupDefinition.size === 'XL') &&
          fieldDefinition.size !== 'M'
        ) {
          largeMedia.push({
            name: exam?.definition?.name,
            html,
            index: ImageIndex,
          });
          html = `<code index="${ImageIndex}" cuthere="">*Please see annexed image ${exam.definition.name} (${ImageIndex}) at the end of the document.</code>`;
        } else {
          smallMedia.push({
            name: exam?.definition?.name,
            html,
            index: ImageIndex,
          });
          html = `<code index="${ImageIndex}" cuthere="">*Please see annexed image ${exam.definition.name} (${ImageIndex}) at the end of the document.</code>`;
        }
      }
      return html;
    }
    if (fieldDefinition.type === 'age') {
      html += formatAge(value);
    } else {
      if (value instanceof Array) {
        let formattedValue: string = '';
        value.forEach((subValue: number | string) => {
          formattedValue += subValue + ' / ';
        });
        if (!isEmpty(formattedValue)) {
          formattedValue = formattedValue.replace(/\/\s*$/, '');
        }
        html += formattedValue;
      } else {
        const formattedValue: string = formatFieldValue(value, fieldDefinition);
        if (isEmpty(formattedValue)) {
          html += value;
        } else {
          html += formattedValue;
        }
      }
    }
  }
  return html;
}

function extractImageName(image: string) {
  const value: string = image.substring(
    image.lastIndexOf('/') + 1,
    image.lastIndexOf('.'),
  );
  return value;
}

async function renderMedia(
  value: ImageDrawing,
  fieldDefinition: FieldDefinition,
  groupDefinition: GroupDefinition,
  exam?: Exam,
) {
  let html: string = '';
  let filePath = null;
  const image: string =
    value && value.image ? value.image : fieldDefinition.image;
  let fieldAspectRatio = aspectRatio(value, fieldDefinition);
  let style: {width: number, height: number} = imageStyle(
    fieldDefinition.size,
    fieldAspectRatio,
  );

  let upload: Upload;
  const pageWidth: number = isWeb ? 572 : 612;
  const pageAspectRatio: number = 8.5 / 11;
  const pageHeight: number = pageWidth / pageAspectRatio;
  let isPdf: boolean = false;
  if (image.startsWith('upload-')) {
    upload = await loadImage(value);

    if (upload) {
      const mimeType: string = getMimeType(upload);
      isPdf = mimeType ? mimeType.includes('application/pdf') : false;
      filePath = `data:${mimeType},${upload.data}`;
      fieldAspectRatio = getAspectRatio(upload);
      style = imageStyle(fieldDefinition.size, fieldAspectRatio);
      html += `<div>${formatLabel(exam.definition)}</div>`;
    }
  } else if (Platform.OS === 'ios' && image.startsWith('./image')) {
    let arr = image.split('./');
    const dir = RNFS.MainBundlePath + '/assets/js';
    filePath = `${dir}/${arr[arr.length - 1]}`;
  } else {
    filePath = image;
  }
  if (style.height > pageHeight) {
    style.height = Math.floor(pageHeight);
    style.width = Math.floor(pageHeight * fieldAspectRatio);
  }
  if (style.width > pageWidth) {
    style.width = Math.floor(pageWidth);
    style.height = Math.floor(style.width / fieldAspectRatio);
  }
  if (!(groupDefinition.size === 'L' || groupDefinition.size === 'XL')) {
    style.width = style.width * 0.65;
    style.height = style.height * 0.65;
  }

  if (filePath) {
    let imageValue: string = `<img src="${filePath}" border="1" style="width: ${style.width}pt; height:${style.height}pt; object-fit: contain; border: 1pt"/>`;
    if (!isWeb && image.startsWith('./image')) {
      const base64Image = await getBase64Image(image);
      if (base64Image) {
        imageBase64Definition.push({
          key: imageValue,
          value: `<img src="${base64Image.data}" border="1" style="width: ${style.width}pt; height: ${style.height}pt; object-fit: contain; border: 1pt"/>`,
        });
      }
    } else if (isWeb && image.startsWith('./image')) {
      const base64Image = await getBase64Image(image);
      imageValue = `<img src="${base64Image.data}" border="1" style="width: ${style.width}pt; height:${style.height}pt; object-fit: contain; border: 1pt"/>`;
    } else if (isPdf) {
      let PdfIdentifier: string = `${fieldDefinition.name}(pdf-${
        PDFAttachment.length + 1
      })`;
      PDFAttachment.push({
        name: exam?.definition?.name,
        base64: filePath,
        index: PdfIdentifier,
      });
      imageValue = `<code index="${PdfIdentifier}" cuthere="">*Please see annexed document (pdf-${
        PDFAttachment.length + 1
      }) at the end of the document.</code>`;
    }
    html += imageValue;
    if (!isPdf) {
      let scale: number = style.width / resolutions(value, fieldDefinition)[0];
      html += renderGraph(value, fieldDefinition, style, scale);
      fieldDefinition.fields &&
        (await Promise.all(
          fieldDefinition.fields.map(
            async (childGroupDefinition: GroupDefinition, index: number) => {
              let parentScaledStyle: Object;
              if (childGroupDefinition.layout) {
                parentScaledStyle = scaleStyle(childGroupDefinition.layout);
              }

              for (const childFieldDefinition: FieldDefinition of childGroupDefinition.fields) {
                let fieldScaledStyle;
                const pfValue = await renderField(
                  childFieldDefinition,
                  childGroupDefinition,
                  exam,
                  getValue(value, childGroupDefinition.name),
                );
                if (!isEmpty(pfValue)) {
                  if (childFieldDefinition.layout) {
                    fieldScaledStyle = scaleStyle(childFieldDefinition.layout);
                  }

                  let x = round(
                    (fieldScaledStyle ? fieldScaledStyle.left : 0) +
                      (parentScaledStyle ? parentScaledStyle.left : 0) +
                      defaultFontSize,
                  );
                  let y = round(
                    (fieldScaledStyle ? fieldScaledStyle.top : 0) +
                      (parentScaledStyle ? parentScaledStyle.top : 0) +
                      defaultFontSize,
                  );

                  html += `<svg xmlns="http://www.w3.org/2000/svg" name="something" style="width:${style.width}pt; height:${style.height}pt">`;
                  html += isWeb
                    ? '<g transform="scale(0.9 0.92)" >'
                    : ' <g transform="scale(0.96 0.98)" >';
                  html += `<text x="${x}" y="${y}">${pfValue}</text>`;
                  html += ' </g>';
                  html += '</svg>';
                }
              }
            },
          ),
        ));
    }
  }
  if (upload) {
    scannedFilesHtml += `<div class="uploadForm">${html}</div>`;
    if (
      getCurrentAction() !== undefined &&
      getCurrentAction() == UserAction.REFERRAL
    ) {
      return html;
    } else {
      return '';
    }
  }
  return html;
}

async function loadImage(value: ImageDrawing) {
  if (!value || !value.image || !value.image.startsWith('upload-')) {
    return;
  }
  let upload: Upload = await fetchUpload(value.image);
  return upload;
}
function renderGraph(
  value: ImageDrawing,
  definition: FieldDefinition,
  style: {width: number, height: number},
  scale: number,
) {
  let html: string = '';
  if (!value.lines || value.lines.length === 0) {
    return '';
  }
  const strokeWidth: number = round(fontScale / scale);
  const resolution: number[] = resolutions(value, definition);
  html += `<svg xmlns="http://www.w3.org/2000/svg" name="something" viewBox="0 0 ${resolution[0]} ${resolution[1]}" width="${resolution[0]}pt" height="${resolution[1]}pt" style="width:${style.width}pt; height:${style.height}pt">`;
  value.lines.map((lijn: string, index: number) => {
    if (lijn.indexOf('x') > 0) {
      return '';
    }
    if (lijn.indexOf(' ') > 0) {
      const points = lijn.split(' ');
      const d = line()
        .x((point: string) => point.substring(0, point.indexOf(',')))
        .y((point: string) => point.substring(point.indexOf(',') + 1))
        .curve(curveBasis)(points);
      const roundedCoordinates: any = round(d);
      html += `<path d="${roundedCoordinates}"  fill="none" stroke="black" stroke-width=${strokeWidth} />`;
    } else {
      let commaIndex: number = lijn.indexOf(',');
      let x: string = round(lijn.substring(0, commaIndex));
      let y: string = round(lijn.substring(commaIndex + 1));

      html += `<circle cx="${x}" cy="${y}" r="${strokeWidth}" fill="black" />`;
    }
  });
  html += '&nbsp;</svg>';
  return html;
}

function aspectRatio(value: ImageDrawing, definition: FieldDefinition): number {
  const resolution: number[] = resolutions(value, definition);
  const aspectRatio: number = resolution[0] / resolution[1];
  return aspectRatio;
}

function round(coordinates: any): any {
  try {
    if (isNaN(coordinates)) {
      return coordinates.replace(/[\d\.-][\d\.e-]*/g, function (n) {
        return Math.round(n * 10) / 10;
      });
    } else {
      return Math.round(coordinates * 10) / 10;
    }
  } catch (e) {
    return coordinates;
  }
}

function resolutions(
  value: ImageDrawing,
  definition: FieldDefinition,
): number[] {
  let resolutionText: ?string =
    value != undefined && value.lines != undefined && value.lines.length > 0
      ? value.lines[0]
      : undefined;

  if (resolutionText == undefined) {
    resolutionText =
      definition.resolution !== undefined ? definition.resolution : '640x480';
  }
  const resolution: string[] = resolutionText.split('x');
  if (resolution.length != 2) {
    console.warn('Image resolution is corrupt: ' + resolutionText);
    return [640, 480];
  }
  const width: number = Number.parseInt(resolution[0]);
  const height: number = Number.parseInt(resolution[1]);
  return [width, height];
}

function renderGlassesSummary(
  groupDefinition: GroupDefinition,
  exam: Exam,
  htmlDefinition?: HtmlDefinition[],
) {
  let html: string = '';
  if (groupDefinition === undefined || groupDefinition === null) {
    return html;
  }
  if (
    exam[exam.definition.name] === undefined ||
    exam[exam.definition.name][groupDefinition.name] === undefined
  ) {
    return html;
  }
  if (groupDefinition.multiValue) {
    exam[exam.definition.name][groupDefinition.name].map(
      (glassesRx: GlassesRx, index: number) => {
        html += renderRxTable(glassesRx, groupDefinition, htmlDefinition);
      },
    );
    return html;
  } else {
    const glassesRx: GlassesRx =
      exam[exam.definition.name][groupDefinition.name];
    return renderRxTable(glassesRx, groupDefinition, htmlDefinition);
  }
}

function renderRxTable(
  glassesRx: GlassesRx,
  groupDefinition: GroupDefinition,
  htmlDefinition?: HtmlDefinition[],
) {
  let html: string = '';
  let htmlSubItems: string = '';
  let htmlChildSubItems: string = '';
  let childHtmlDefinition: HtmlDefinition[] = [];
  let groupHtmlDefinition: HtmlDefinition[] = [];

  if (isEmpty(glassesRx.od.sph) && isEmpty(glassesRx.os.sph)) {
    return html;
  }
  html += '<table class="childTable">';
  html += '<thead><tr>';
  html += `<th class="service" style="font-size:10px; width: 80px; max-width: 80px; min-width:20px;">${formatLabel(
    groupDefinition,
  )}</th>`;
  html += '<th class="service">Sph</th>';
  html += '<th class="service">Cyl</th>';
  html += '<th class="service">Axis</th>';
  if (hasPrism(glassesRx)) {
    html += '<th class="service">Prism</th>';
  }
  if (groupDefinition.hasVA) {
    html += '<th class="service">DVA</th>';
  }
  if (groupDefinition.hasAdd) {
    html += '<th class="service">Add</th>';
  }
  if (groupDefinition.hasAdd && groupDefinition.hasVA) {
    html += '<th class="service">NVA</th>';
  }
  html += '</thead></tr><tbody><tr>';

  html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.od}</td>`;
  htmlSubItems += `<span>${strings.od}: </span>`;

  htmlChildSubItems = `${glassesRx.od ? formatDiopter(glassesRx.od.sph) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'sph',
    html: `<span>${htmlChildSubItems}</span>`,
  });

  htmlChildSubItems = `${glassesRx.od ? formatDiopter(glassesRx.od.cyl) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'cyl',
    html: `<span>${htmlChildSubItems} </span>`,
  });

  htmlChildSubItems = `${glassesRx.od ? formatDegree(glassesRx.od.axis) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'axis',
    html: `<span>${htmlChildSubItems} </span>`,
  });

  if (hasPrism(glassesRx)) {
    htmlChildSubItems = `${
      glassesRx.od ? formatPrism(glassesRx.od.prism) : ''
    }`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'prism',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }

  if (groupDefinition.hasVA) {
    const fieldDefinition: FieldDefinition = getFieldDefinition(
      'exam.VA cc.Aided acuities.DVA.OD',
    );
    const formattedValue: string = glassesRx.od
      ? formatFieldValue(glassesRx.od.va, fieldDefinition)
      : '';

    htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'va',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }
  if (groupDefinition.hasAdd) {
    htmlChildSubItems = `${
      glassesRx.od ? formatDiopter(glassesRx.od.add) : ''
    }`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'add',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }

  if (groupDefinition.hasAdd && groupDefinition.hasVA) {
    const fieldDefinition: FieldDefinition = getFieldDefinition(
      'exam.VA cc.Aided acuities.NVA.OD',
    );
    const formattedValue: string = glassesRx.od
      ? formatFieldValue(glassesRx.od.addVa, fieldDefinition)
      : '';
    htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'addVa',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }
  groupHtmlDefinition.push({
    name: 'od',
    html: htmlSubItems,
    child: childHtmlDefinition,
  });
  html += '</tr>';
  htmlSubItems = '';
  childHtmlDefinition = [];
  html += '<tr>';
  html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.os}</td>`;
  htmlChildSubItems = `${glassesRx.os ? formatDiopter(glassesRx.os.sph) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'sph',
    html: `<span>${htmlChildSubItems}</span>`,
  });

  htmlChildSubItems = `${glassesRx.os ? formatDiopter(glassesRx.os.cyl) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'cyl',
    html: `<span>${htmlChildSubItems} </span>`,
  });

  htmlChildSubItems = `${glassesRx.os ? formatDegree(glassesRx.os.axis) : ''}`;
  html += `<td class="desc">${htmlChildSubItems}</td>`;
  htmlSubItems += `<span>${htmlChildSubItems}</span>`;
  childHtmlDefinition.push({
    name: 'axis',
    html: `<span>${htmlChildSubItems} </span>`,
  });

  if (hasPrism(glassesRx)) {
    htmlChildSubItems = `${
      glassesRx.os ? formatPrism(glassesRx.os.prism) : ''
    }`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'prism',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }

  if (groupDefinition.hasVA) {
    const fieldDefinition: FieldDefinition = getFieldDefinition(
      'exam.VA cc.Aided acuities.DVA.OS',
    );
    const formattedValue: string = glassesRx.os
      ? formatFieldValue(glassesRx.os.va, fieldDefinition)
      : '';

    htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'va',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }
  if (groupDefinition.hasAdd) {
    htmlChildSubItems = `${
      glassesRx.os ? formatDiopter(glassesRx.os.add) : ''
    }`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'add',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }

  if (groupDefinition.hasAdd && groupDefinition.hasVA) {
    const fieldDefinition: FieldDefinition = getFieldDefinition(
      'exam.VA cc.Aided acuities.NVA.OS',
    );
    const formattedValue: string = glassesRx.os
      ? formatFieldValue(glassesRx.os.addVa, fieldDefinition)
      : '';
    htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
    html += `<td class="desc">${htmlChildSubItems}</td>`;
    htmlSubItems += `<span>${htmlChildSubItems}</span>`;
    childHtmlDefinition.push({
      name: 'addVa',
      html: `<span>${htmlChildSubItems} </span>`,
    });
  }

  groupHtmlDefinition.push({
    name: 'os',
    html: htmlSubItems,
    child: childHtmlDefinition,
  });
  html += '</tr>';
  htmlSubItems = '';
  childHtmlDefinition = [];

  if (groupDefinition.hasVA === true && !isEmpty(glassesRx.ou)) {
    html += '<tr>';
    html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.ou}</td>`;

    if (groupDefinition.hasVA) {
      const fieldDefinition: FieldDefinition = getFieldDefinition(
        'exam.VA cc.Aided acuities.DVA.OU',
      );
      const formattedValue: string = glassesRx.ou
        ? formatFieldValue(glassesRx.ou.va, fieldDefinition)
        : '';
      htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
      html += `<td class="desc">${htmlChildSubItems}</td>`;
      htmlSubItems += `<span>${htmlChildSubItems}</span>`;
      childHtmlDefinition.push({
        name: 'va',
        html: `<span>${htmlChildSubItems} </span>`,
      });
    }
    html += '<td class="desc"></td>';
    if (groupDefinition.hasAdd && groupDefinition.hasVA) {
      const fieldDefinition: FieldDefinition = getFieldDefinition(
        'exam.VA cc.Aided acuities.NVA.OU',
      );
      const formattedValue: string = glassesRx.ou
        ? formatFieldValue(glassesRx.ou.addVa, fieldDefinition)
        : '';
      htmlChildSubItems = `${isEmpty(formattedValue) ? '' : formattedValue}`;
      html += `<td class="desc">${htmlChildSubItems}</td>`;
      htmlSubItems += `<span>${htmlChildSubItems}</span>`;
      childHtmlDefinition.push({
        name: 'addVa',
        html: `<span>${htmlChildSubItems} </span>`,
      });
    }
    html += '</tr>';
    groupHtmlDefinition.push({
      name: 'ou',
      html: htmlSubItems,
      child: childHtmlDefinition,
    });
  }
  html += '</tbody></table>';
  htmlSubItems = '';
  childHtmlDefinition = [];
  if (groupDefinition.hasNotes && !isEmpty(glassesRx.notes)) {
    htmlSubItems = `<div>Notes: ${glassesRx.notes}</div>`;
    html += htmlSubItems;
    groupHtmlDefinition.push({name: 'notes', html: htmlSubItems});
  }
  if (groupDefinition.hasLensType) {
    const fieldDefinition: FieldDefinition = filterFieldDefinition(
      groupDefinition.fields,
      'lensType',
    );
    if (fieldDefinition.options && fieldDefinition.options.length > 0) {
      let options = fieldDefinition.options;
      const value: string = formatCode(options, glassesRx.lensType);
      html += `<div>${formatLabel(fieldDefinition)}: ${value}</div>`;
      groupHtmlDefinition.push({name: fieldDefinition.name, html: value});
    }
  }

  htmlDefinition.push({name: groupDefinition.name, child: groupHtmlDefinition});

  return html;
}

export function patientHeader() {
  let htmlHeader: string =
    '<head><title>Patient File</title><style>' +
    'body {' +
    '  padding:10px;' +
    '}' +
    '@media all {' +
    'table { page-break-after:auto;}' +
    '.childTable { page-break-after:auto; page-break-inside:avoid;}' +
    'tr    { page-break-inside:avoid; page-break-after:auto }' +
    'td    { page-break-inside:avoid; page-break-after:auto }' +
    'thead { display:table-header-group }' +
    'tfoot { display:table-footer-group }' +
    '.xlForm {display: block; page-break-before: always;}' +
    '.scannedFiles {display: block;}' +
    '}' +
    '@media screen {' +
    'table tr:nth-child(2n-1) td {' +
    '  background: #F5F5F5;' +
    '}' +
    '}' +
    '.uploadForm {' +
    '  font-weight: bold;' +
    '  text-decoration: underline;' +
    '  float:left;' +
    '  display:block;' +
    '  width :50%;' +
    '}' +
    '.scannedFiles {padding:10px;}' +
    '.groupLabel {' +
    '  font-weight: bold;' +
    '  text-decoration: underline;' +
    '}' +
    '.clearfix:after {' +
    '  content: "";' +
    '  display: table;' +
    '  clear: both;' +
    '}' +
    'a { color: #5D6975; text-decoration: underline;}' +
    'body {' +
    '  position: relative;' +
    '  margin: 0 10px 0 10px;' +
    '  color: #001028;' +
    '  background: #FFFFFF;' +
    '  font-family: Arial, sans-serif;' +
    '  font-size: 12px;' +
    '  font-family: Arial;' +
    '}' +
    'header {' +
    '  padding: 10px 0;' +
    '  margin: 0 10px 20px 10px;' +
    '}' +
    '#logo {' +
    '  text-align: center;' +
    '  margin-bottom: 10px;' +
    '}' +
    '#logo img {width: 90px;}' +
    'h1 {' +
    '  border-top: 1px solid  #5D6975;' +
    '  border-bottom: 1px solid  #5D6975;' +
    '  color: #5D6975;' +
    '  font-size: 2.4em;' +
    '  line-height: 1.4em;' +
    '  font-weight: normal;' +
    '  text-align: center;' +
    '  margin: 0 0 20px 0;' +
    '}' +
    '#client {' +
    '  float: left;' +
    '}' +
    '#client span {' +
    '  color: #5D6975;' +
    '  text-align: right;' +
    '  width: 52px;' +
    '  margin-right: 18px;' +
    '  display: inline-block;' +
    '  font-size: 0.8em;' +
    '}' +
    '#company {' +
    '  float: right;' +
    '  text-align: right;' +
    '}' +
    '#client div,' +
    '#company div {' +
    '  white-space: nowrap;' +
    '}' +
    'table {' +
    '  width: 100%;' +
    '  border-collapse: collapse;' +
    '  border-spacing: 0;' +
    '  margin-bottom: 20px;' +
    '}' +
    'table th,table td {' +
    '  padding: 5px 20px;' +
    '  text-align: center;' +
    '  font-size:11px;' +
    '}' +
    'table th {' +
    '  padding: 5px 20px;' +
    '  color: #5D6975;' +
    '  border-bottom: 1px solid #C1CED9;' +
    '  white-space: nowrap;' +
    '  font-weight: normal;' +
    '}' +
    'table .service,table .desc {text-align: left;}' +
    'table .service {width: 65px; max-width: 70; min-width:40px; padding: 5px 10px;}' +
    'table td {' +
    '  text-align: right;' +
    '  border: solid;' +
    '  border-width: 0 1px;' +
    '}' +
    'table tr {' +
    '  border: solid;' +
    '  border-width: 1px 0;' +
    '}' +
    'table thead {display:table-header-group;}' +
    'table td.service,table td.desc {vertical-align: top;}' +
    'table td.service {font-weight: bold;}' +
    'table td.unit,table td.qty,table td.total {font-size: 1.2em;}' +
    'table th.service,table th.desc {font-weight: bold;}' +
    'table td.grand {border-top: 1px solid #5D6975;}' +
    '#forms {' +
    '  color: #5D6975;' +
    '  font-size: 1.2em;' +
    '  font-weight: bold;' +
    '  margin-bottom:10px;' +
    '}' +
    'footer {' +
    '  color: #5D6975;' +
    '  width: 100%;' +
    '  height: 30px;' +
    '  position: absolute;' +
    '  bottom: 0;' +
    '  border-top: 1px solid #C1CED9;' +
    '  padding: 8px 0;' +
    '  text-align: center;' +
    '}' +
    '.s-img {margin: 5px; page-break-inside:avoid;}' +
    '.img-wrap {' +
    '  margin: 0px;' +
    '  padding: 0px;' +
    '  float: left;' +
    '  position: relative;' +
    '  text-align: center;' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  flex-wrap: wrap;' +
    '  justify-content: flex-start;' +
    '  align-content: center;' +
    '  page-break-inside:avoid;' +
    '  align-items: center;' +
    '}' +
    '.img-wrap svg {' +
    '  position:absolute;' +
    '  top:0;' +
    '  left:0;' +
    '}' +
    '.img-wrap img {display:block;}' +
    'span.img-wrap p {' +
    '  border-bottom: 1.5px solid;' +
    '  padding: 5px;' +
    '  font-size: 13px;' +
    ' }' +
    '.groupHeader {' +
    ' padding-bottom: 16px;' +
    ' padding-top: 16px;' +
    ' border-top: 1px solid #5D6975;' +
    ' border-bottom: 1px solid #5D6975;' +
    ' color: #5D6975;' +
    ' font-size: 1.4em;' +
    ' line-height: 0.4em;' +
    ' font-weight: normal;' +
    ' text-align: center;' +
    ' margin-top: 16px;' +
    ' margin-bottom: 16px;' +
    ' background: #F5F5F5;' +
    ' box-sizings:border-box;' +
    ' page-break-inside:avoid;' +
    ' display:flex;' +
    '}' +
    '.container {page-break-inside:avoid; page-break-after:inherit;}' +
    '.desc {' +
    '  margin:10px;' +
    '  font-size: 15px;' +
    '}' +
    '.desc .value{' +
    'color:#000;' +
    'font-size: 15px;' +
    'font-weight: 400;' +
    '}' +
    '.desc .label {' +
    'color:#000;' +
    'font-size: 16px;' +
    'font-weight: bold;' +
    '}' +
    ' .wrap-imgs {' +
    '   display: flex;' +
    '   flex-wrap: wrap;' +
    '   width: 100%;' +
    '   justify-content: space-around;' +
    ' }' +
    '.breakBeforeImage { page-break-before: always; }';
  htmlHeader += isWeb
    ? '.images-warp{page-break-inside:avoid;} '
    : '.wrap-imgs{} ';

  htmlHeader += '</style></head>';
  htmlHeader += '<body><main>';
  return htmlHeader;
}
export function renderAttachment(html: string) {
  let selectedAttachments: any[] = [];
  let withAttachmentHtml: string = html;
  let addImages: string = '';
  let hasImage: boolean = false;
  SelectedPDFAttachment = [];

  for (let str of html.split('<code index="')) {
    if (str.indexOf('cuthere') !== -1) {
      const identifier: string = str.split('" cuthere="">')[0].trim();
      if (selectedAttachments.indexOf(identifier) === -1) {
        selectedAttachments.push(identifier);
      }
    }
  }
  for (let str of html.split('<code')) {
    if (str.indexOf('(') !== -1) {
      const identifier: string = str.split('(')[1].split(')')[0].trim();
      if (selectedAttachments.indexOf(identifier) === -1) {
        selectedAttachments.push(identifier);
      }
    }
  }

  for (let image of smallMedia) {
    for (let AttachmentIndex of selectedAttachments) {
      if (AttachmentIndex === image.index) {
        addImages += image.html;
        hasImage = true;
      }
    }
  }

  for (let image of largeMedia) {
    for (let AttachmentIndex of selectedAttachments) {
      if (AttachmentIndex === image.index) {
        addImages += image.html;
      }
    }
  }

  for (let pdf of PDFAttachment) {
    for (let AttachmentIndex of selectedAttachments) {
      if (AttachmentIndex === pdf.index) {
        SelectedPDFAttachment.push({
          base64: pdf.base64,
          index: pdf.index,
        });
      }
    }
  }

  if (hasImage) {
    withAttachmentHtml += '<div class="breakBeforeImage"></div>';
  }

  withAttachmentHtml += '<section class="wrap-imgs">';
  withAttachmentHtml += addImages;
  withAttachmentHtml += '</section>';

  return withAttachmentHtml;
}
export function patientFooter() {
  return `</body></main>`;
}
export function getVisitHtml(html: string): string {
  let htmlHeader: string = patientHeader();
  let htmlEnd: string = patientFooter();
  let finalHtml: string = htmlHeader + html + htmlEnd;
  let Attachments = PDFAttachment;
  // initValues();
  return {html: finalHtml, PDFAttachment: Attachments};
}
export function getSelectedPDFAttachment(): Array<any> {
  return SelectedPDFAttachment;
}
export function addEmbeddedAttachment(
  html: string,
  attachments: Array<any> = [],
) {
  let EmbeddedAttachmentHtml: string = html;
  EmbeddedAttachmentHtml += '<script type="text/javascript">';
  EmbeddedAttachmentHtml += `let attachments=${JSON.stringify(attachments)}`;
  EmbeddedAttachmentHtml += '</script>';
  return EmbeddedAttachmentHtml;
}
export function getPDFAttachmentFromHtml(html: string) {
  let PDFAttachment: any[] = [];
  for (let str of html.split('<script type="text/javascript">')) {
    if (str.indexOf('let attachments=') !== -1) {
      let attachments = str.split('let attachments=');
      attachments = attachments[1].split('</script>');
      PDFAttachment = JSON.parse(attachments[0]);
    }
  }
  return PDFAttachment;
}
export function initValues() {
  imageBase64Definition = [];
  smallMedia = [];
  largeMedia = [];
  PDFAttachment = [];
  SelectedPDFAttachment = [];
  index = 0;
}
