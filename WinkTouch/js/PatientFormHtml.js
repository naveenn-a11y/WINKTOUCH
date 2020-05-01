/**
 * @flow
 */
'use strict';

import type {
  FieldDefinition,
  GroupDefinition,
  FieldDefinitions,
  ExamPredefinedValue,
  GlassesRx,
  GlassRx,
  ImageDrawing,
  Visit,
  ExamDefinition,
  PatientInfo
} from './Types'
import { strings } from './Strings'
import { styles, scaleStyle, fontScale, imageWidth, imageStyle } from './Styles'
import {
  formatMoment,
  formatDate,
  now,
  isEmpty,
  compareDates,
  dateFormat,
  yearDateFormat,
  officialDateFormat,
  prefix,
  postfix,
  cleanUpArray,
  formatDiopter,
  formatDegree,
  getValue,
  formatAge
} from './Util'

import { formatPrism, isPrism } from './Refraction'
import {
  getFieldDefinition as getExamFieldDefinition,
  getFieldValue as getExamFieldValue
} from './Exam'
import { formatLabel, formatFieldValue, getFieldDefinition, filterFieldDefinition } from './Items'
import RNFS from 'react-native-fs'
import { line, curveBasis } from 'd3-shape'
import { fetchUpload, getMimeType, getAspectRatio } from './Upload'
import { getColumnFieldIndex, hasColumns } from './GroupedForm'
import {
  cacheItemById,
  getCachedItem,
  cacheItem,
  getCachedItems
} from './DataCache'
import { getDoctor, getStore } from './DoctorApp';
import { formatCode } from './Codes';


let scannedFilesHtml : string = '';

export function getScannedFiles() {
 return scannedFilesHtml;
} 

export function setScannedFiles(html : string) {
  scannedFilesHtml = html;
}
export function printPatientHeader (visit: Visit) {
  let html: string = ''
  const patient: PatientInfo = getCachedItem(visit.patientId)
  const store: Store = getStore()
  const doctor: User = getCachedItem(visit.userId)

  html +=
    `    <header class="clearfix">` +
    `      <h1>${strings.patientFile}</h1>` +
    `      <div id="company" class="clearfix">` +
    `        <div>${store.companyName}</div>` +
    `        <div>${store.streetName + prefix(store.unit, ', ')}<br />${store.postalCode} ${store.city}</div>` +
    `        <div>${store.telephone}</div>` +
    `        <div>${store.email}</div>` +
    `      </div>` +
    `      <div id="client">` +
    `        <div><span>${strings.doctor}</span>${doctor.firstName} ${doctor.lastName}</div>` +
    `        <div><span>${strings.patient}</span>${patient.firstName} ${patient.lastName}</div>` +
    `        <div><span></span>${postfix(patient.streetNumber, ', ') +
      patient.streetName +
      prefix(patient.unit, ', ') +
      prefix(patient.postalCode, ', ') +
      prefix(patient.city, ', ') +
      prefix(patient.province, ', ') +
      prefix(patient.country, ', ')}</div>` +
    `        <div><span></span>${patient.email}</div>` +
    `        <div><span></span>${patient.cell?(patient.cell+' '):patient.phone}</div>` +
    `        <div><span></span>${patient.dateOfBirth}</div>` +
    `        <div><span>${strings.healthCard}</span>${patient.medicalCard}${prefix(patient.medicalCardVersion, '-')}${prefix(patient.medicalCardExp, '-')}</div>` +


    `        <div><span>${strings.examDate}</span>${formatDate(visit.date, officialDateFormat)}</div>` +
    `    </header>`

  return html
}
export function renderItemsHtml (exam: Exam): any {
  let html: String = ''
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
    const value: any = exam.definition.label
      ? exam.definition.label
      : exam.definition.name
    html += `<tr>`
    html += `<td class="service">${value}</td>`
    html += `<td class="desc">`
    exam[exam.definition.name].map((examItem: any, index: number) => {
      let item: any = renderItemHtml(examItem, index, exam);
      html += `<div>${item}</div>`
    })
    html += `</td>`
    html += `</tr>`
  }
  return html
}

function renderItemHtml(examItem: any, index: number, exam: Exam) {
      let html: String = ''
      if (exam.definition.fields === undefined) return html;
      let isFirstField = true;
      const fieldDefinitions : FieldDefinition[] = exam.definition.fields;
      for (let i: number = 0; i < fieldDefinitions.length; i++) {
        const fieldDefinition : FieldDefinition = fieldDefinitions[i];
        const propertyName: string = fieldDefinition.name;
        const value :?string|?number = examItem[propertyName];
        if (value!==undefined && value!==null) {
          let formattedValue: string = formatFieldValue(value, fieldDefinition);
          if(isEmpty(formattedValue)) formattedValue = value;
          if (formattedValue && !isEmpty(formattedValue)) {
            const label = exam.definition.editable?fieldDefinition.label?fieldDefinition.label:fieldDefinition.name:'';
            if (isEmpty(label)) {
              if (!isFirstField) html += `<span>,</span>`
            html += `<span>${formattedValue}</span>`
            isFirstField = false;
             } else {
                html += `<div><span>${label}: </span><span>${formattedValue}</span></div>`
            }
          }
        }
      }
      return html;
}


export async function renderParentGroupHtml (exam: Exam): any {
  let html: string = '';
  const xlGroupDefinition: GroupDefinition[] = exam.definition.fields.filter(
    (groupDefinition: GroupDefinition) => groupDefinition.size === 'XL'
  )
  if (xlGroupDefinition && xlGroupDefinition.length > 0) {
    html += `<div>`
    html += isEmpty(exam[exam.definition.name]) ? '' : await renderAllGroupsHtml(exam)
    html += `</div>`
  }
   else {
    if(exam.definition.name === 'Consultation summary') {
          if(!isEmpty(exam.resume)) {
          html += `<tr>`
          html += `<td class="service">${formatLabel(exam.definition)}</td>`
          html += `<td class="desc">`
          html +=  `<div style="white-space: pre-line">${exam.resume}</div>`;
          html += `</td>`
          html += `</tr>`
          }
      }
     else {
      html += `<tr>`
      html += `<td class="service">${formatLabel(exam.definition)}</td>`
      html += `<td class="desc">`
      html +=  await renderAllGroupsHtml(exam)
      html += `</td>`
      html += `</tr>`
    }

   }
  

  return html
}

async function renderAllGroupsHtml (exam: Exam) {
  let html: string = '';

  if (!exam[exam.definition.name]) return '';
  if (exam.definition.fields === null || exam.definition.fields === undefined || exam.definition.fields.length === 0)
    return '';

  await Promise.all(exam.definition.fields.map(async (groupDefinition: GroupDefinition) => {
    const result = await renderGroupHtml(groupDefinition, exam);
    if (!isEmpty(result)) {
      html += result
    }
  }));
  return html
}
async function renderGroupHtml (groupDefinition: GroupDefinition, exam: Exam) {
  let html: string = '';
  if (exam[exam.definition.name] === undefined) return '';
  if (groupDefinition.mappedField) {
    groupDefinition = Object.assign(
      {},
      getFieldDefinition(groupDefinition.mappedField),
      groupDefinition
    )
  }
  if (groupDefinition.type === 'SRx') {
    html += renderGlassesSummary(groupDefinition, exam)
  } else if (
    groupDefinition.multiValue === true &&
    groupDefinition.options === undefined
  ) {
    const value = exam[exam.definition.name][groupDefinition.name]
    if (
      value === undefined ||
      value === null ||
      value instanceof Array === false ||
      value.length === 0
    )
      return html;
    await Promise.all(value.map(async (groupValue: any, groupIndex: number) => {
      if (
        groupValue === undefined ||
        groupValue === null ||
        Object.keys(groupValue).length === 0
      )
      return html;


      const rowValue = await renderRowsHtml(groupDefinition, exam, groupIndex);
      html += rowValue;
    }));
  } else if (groupDefinition.fields === undefined && groupDefinition.options) {
    html += renderCheckListItemHtml(exam, groupDefinition)
  }  
   else {
    const value: any = exam[exam.definition.name][groupDefinition.name];
    if (value === undefined || value === null || Object.keys(value).length === 0)
    return null;
    const rowValue = await renderRowsHtml(groupDefinition, exam);
    html += rowValue;
  }
  return html
}

async function renderRowsHtml (
  groupDefinition: GroupDefinition,
  exam: Exam,
  groupIndex?: number = 0
) {
  let rows: any[] = []
  let html: string = ''
  const form = exam[exam.definition.name][groupDefinition.name];
  if (!groupDefinition.fields) return null;

  const groupLabel = formatLabel(groupDefinition);
  const examLabel = formatLabel(exam.definition);
  let labelDisplayed : boolean = false;
  for (const fieldDefinition: FieldDefinition of groupDefinition.fields) {

    const columnFieldIndex: number = getColumnFieldIndex(
      groupDefinition,
      fieldDefinition.name
    )

    if (columnFieldIndex === 0) {
      const value =  await renderColumnedRows(fieldDefinition, groupDefinition, exam, form, groupIndex);
      html += value;
    } else if (columnFieldIndex < 0) {

      const value = await renderField(
        fieldDefinition,
        groupDefinition,
        exam,
        form,
        groupIndex
      );
      if (!isEmpty(value)) {
        if(groupLabel !== examLabel && groupDefinition.size !== 'XL' && !fieldDefinition.image) {
             html += !labelDisplayed ? `<div class="groupLabel">` + formatLabel(groupDefinition) + `</div>` : '';
             labelDisplayed = true;
        }
        const label: string = formatLabel(fieldDefinition);
        if (label !== undefined && label !== null && label.trim() !== '') {
          html += `<div><span>${label}:</span> <span>${value}</span></div>`
        } else {
          if (groupDefinition.size === 'XL')
            html += `<div class="xlForm">` + value + `</div>`
          else html += `<span>` + value + `</span>`
        }
      }
    }
  }
  return html
}
async function renderColumnedRows (
  columnDefinition: GroupDefinition,
  definition: GroupDefinition,
  exam: Exam,
  form: {},
  groupIndex?: number = 0
) {
  let rows: string[][] = [];
  let html: string = ''


  const columnedFields: FieldDefinition[] = columnDefinition.fields
  const columns: string[] = definition.columns.find(
    (columns: string[]) =>
      columns.length > 0 && columns[0] === columnDefinition.name
  );

  await Promise.all(columnedFields.map(async(column: string, i: number) => {
    const value =
      await renderColumnedRow(
        formatLabel(columnedFields[i]),
        columns,
        i,
        definition,
        exam,
        form,
        groupIndex
      );
      rows.push(value);
  }));

  let allRowsEmpty : boolean = false;
  for(let i=0; i<rows.length; i++) {
      let rowValues = rows[i].slice(1); 
      for(let j=0; j<rowValues.length;j++) {
          if(!isEmpty(rowValues[j])) {
            allRowsEmpty = false;
            break;
          }
      else
      allRowsEmpty = true;
      }
    if(allRowsEmpty == false)
      break;
  }


  if(allRowsEmpty == false) {
      html += `<table style="margin-top:10px; width:50%">`
      html += renderColumnsHeader(columnDefinition, definition);
      rows.forEach((column: string[]) => {
        html +=`<tr>`;
        column.forEach((value: string) => {
        html +=`<td class="desc">${value}</td>`;
        });
        html +=`</tr>`
      });
      html += `</table>`
  }

  return html;
}

 async function renderColumnedRow (
  fieldLabel: string,
  columns: string[],
  rowIndex: number,
  definition: GroupDefinition,
  exam: Exam,
  form: {},
  groupIndex?: number = 0
) {

  let columnValues : string[] = [];
  columnValues.push(fieldLabel);
  await Promise.all(columns.map(async(column: string, columnIndex: number) => {
    const columnDefinition: GroupDefinition = definition.fields.find(
      (columnDefinition: FieldDefinition) => columnDefinition.name === column
    )
    if (columnDefinition) {
      const fieldDefinition: FieldDefinition = columnDefinition.fields[rowIndex];
      const value = await renderField(fieldDefinition, definition, exam, form, column, groupIndex);
      columnValues.push(value);
    }
  }));
  return columnValues;
}
function renderColumnsHeader (
  columnDefinition: GroupDefinition,
  definition: GroupDefinition
) {
  let html: string = ''
  if (hasColumns(definition) === false) return null
  const columns = definition.columns.find(
    (columns: string[]) => columns[0] === columnDefinition.name
  )
  if (columns === undefined || columns.length === 0) return null
  html += `<thead><tr>`
  html += `<th class="desc">${formatLabel(definition)}</th>`
  columns.map((column: string, index: number) => {
    const columnDefinition: FieldDefinition = definition.fields.find(
      (fieldDefinition: FieldDefinition) => fieldDefinition.name === column
    )
    if (columnDefinition) {
      const columnLabel: string = formatLabel(columnDefinition)
      html += `<th class="desc">${columnLabel}</th>`
    }
  })
  html += `</thead></tr>`
  return html
}
function renderHtmlTitle (exam: Exam) {
  return `<td class="service">${formatLabel(exam.definition)}</td>`
}
function renderCheckListItemHtml (
  exam: Exam,
  fieldDefinition: FieldDefinition
) {
  let html: string = ''
  const value = exam[exam.definition.name][fieldDefinition.name]
  if (fieldDefinition.normalValue === value) return ''
  const formattedValue: string = formatFieldValue(value, fieldDefinition)
  if (formattedValue === '') return formattedValue
  const label: ?string = formatLabel(fieldDefinition)
  html += `<div><span>${label}: </span><span>${formattedValue}</span></div>`
  return html
}

async function renderField (
  fieldDefinition: FieldDefinition,
  groupDefinition: GroupDefinition,
  exam: Exam,
  form: {},
  column?: string,
  groupIndex?: number = 0
) {
  let html: string = ''

  if (groupDefinition === undefined || fieldDefinition === undefined) return '';

  if (fieldDefinition.mappedField) {
    fieldDefinition = Object.assign(
      {},
      getExamFieldDefinition(fieldDefinition.mappedField, exam),
      fieldDefinition
    )
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
      : undefined

  if (value) {
    if (fieldDefinition && fieldDefinition.image !== undefined) {
      html += `<span class="img-wrap">`
      html += await renderImage(value, fieldDefinition, groupDefinition, exam)
      html += `</span>`
      return html
    }

    if (fieldDefinition.type === 'age') {
      html += formatAge(value)
    }
     else {
       if(value instanceof Array) {
         const formattedValue : string = value.toString().replace(',',' / ');
          html += formattedValue;
       } else {
            const formattedValue : string = formatFieldValue(value, fieldDefinition);
            if(isEmpty(formattedValue))
              html += value;
            else
              html += formattedValue;
       }

     }
  }

  return html
}

async function renderImage (
  value: ImageDrawing,
  fieldDefinition: FieldDefinition,
  groupDefinition: GroupDefinition,
  exam?: Exam
) {
  let html: string = ''
  let filePath = null;
  const image: string = value && value.image ? value.image : fieldDefinition.image;
  let fieldAspectRatio =   aspectRatio(value, fieldDefinition);
  let style: { width: number, height: number } = imageStyle(fieldDefinition.size, fieldAspectRatio);
  let upload : Upload = undefined;
  const pageWidth : number = 612; 
  const pageAspectRatio : number = 8.5/11;
  const pageHeight : number = pageWidth/pageAspectRatio;


  if (image.startsWith('upload-')) {
      upload = await loadImage(value);
      if(upload) {
        filePath = `data:${getMimeType(upload)},${upload.data}`;
        fieldAspectRatio = getAspectRatio(upload);
        style = imageStyle(fieldDefinition.size, fieldAspectRatio);
        html += `<div>${formatLabel(exam.definition)}</div>`;
      }
  } else if (Platform.OS === 'ios' && image.startsWith('./image')) {
    let arr = image.split('./')
    const dir = RNFS.MainBundlePath + '/assets/js'
    filePath = `${dir}/${arr[arr.length - 1]}`
  } else {
    filePath = image
  }

  if (style.height>pageHeight) {
      style.height = Math.floor(pageHeight);
      style.width = Math.floor(pageHeight * fieldAspectRatio);
    }
  if (style.width>pageWidth) {
      style.width = Math.floor(pageWidth);
      style.height = Math.floor(style.width / fieldAspectRatio);
    }
  let scale: number = style.width / resolutions(value, fieldDefinition)[0];
  if(!(groupDefinition.size === 'L' || groupDefinition.size === 'XL')) {
      style.width = style.width * 0.85;
      style.height = style.height * 0.85;
  }

  if (filePath) {
    html += `<img src="${filePath}" border ="1" style="width: ${style.width}pt; height: ${style.height}pt">`;
    html += renderGraph(value, fieldDefinition, style, scale)

    fieldDefinition.fields &&
      await Promise.all(fieldDefinition.fields.map(async (childGroupDefinition: GroupDefinition, index: number) => {
          let parentScaledStyle: Object = undefined
          if (childGroupDefinition.layout)
            parentScaledStyle = scaleStyle(childGroupDefinition.layout);
          for (const childFieldDefinition: FieldDefinition of childGroupDefinition.fields) {
            let fieldScaledStyle = undefined
            const pfValue = await renderField(
              childFieldDefinition,
              childGroupDefinition,
              exam,
              getValue(value, childGroupDefinition.name)
            )

            if (!isEmpty(pfValue)) {
              if (childFieldDefinition.layout)
                fieldScaledStyle = scaleStyle(childFieldDefinition.layout);
              
              let x =
                (fieldScaledStyle ? fieldScaledStyle.left : 0) +
                (parentScaledStyle ? parentScaledStyle.left : 0) +
                styles.textfield.fontSize;
              let y =
                (fieldScaledStyle ? fieldScaledStyle.top : 0) +
                (parentScaledStyle ? parentScaledStyle.top : 0) +
                styles.textfield.fontSize;

                //x&y not scaling properly, need to be fixed ! Ratio is hardcoded now !
                x-=x*0.01;
                y-=y*0.01;

              html += `<svg style="width:${style.width}pt; height:${style.height}pt">`
              html += `<text x="${x}" y="${y}">${pfValue}</text>`
              html += `</svg>`
            }
          }
        }
      ))
  }
  if(upload) {
    scannedFilesHtml += `<div class="uploadForms">${html}</div>`;
    return '';
  } else {
    return html;
  }
}
async function loadImage (value: ImageDrawing) {
  if (!value || !value.image || !value.image.startsWith('upload-')) {
    return
  }
  let upload: Upload = await fetchUpload(value.image);
  return upload;
}
function renderGraph (
  value: ImageDrawing,
  definition: FieldDefinition,
  style: { width: number, height: number },
  scale: number
) {
  let html: string = ''
  if (!value.lines || value.lines.length === 0) return ''
  const strokeWidth: number = (3 * fontScale) / scale
  const resolution: number[] = resolutions(value, definition)
  html += `<svg viewBox="0 0 ${resolution[0]} ${resolution[1]}" style="width:${style.width}pt; height:${style.height}pt">`
  value.lines.map((lijn: string, index: number) => {
    if (lijn.indexOf('x') > 0) return ''
    if (lijn.indexOf(' ') > 0) {
      const points = lijn.split(' ')
      const d = line()
        .x((point: string) => point.substring(0, point.indexOf(',')))
        .y((point: string) => point.substring(point.indexOf(',') + 1))
        .curve(curveBasis)(points)
      html += `<path d="${d}"  fill="none" stroke="black" stroke-width=${strokeWidth} />`
    } else {
      let commaIndex: number = lijn.indexOf(',')
      let x: string = lijn.substring(0, commaIndex)
      let y: string = lijn.substring(commaIndex + 1)
      html += `<circle cx="${x}" cy="${y}" r="${strokeWidth}" fill="black" />`
    }
  })
  html += `</svg>`
  return html
}

function aspectRatio (
  value: ImageDrawing,
  definition: FieldDefinition
): number {
  const resolution: number[] = resolutions(value, definition)
  const aspectRatio: number = resolution[0] / resolution[1]
  return aspectRatio
}

function resolutions (
  value: ImageDrawing,
  definition: FieldDefinition
): number[] {

  let resolutionText: ?string =
    value != undefined && value.lines != undefined && value.lines.length > 0
      ? value.lines[0]
      : undefined

  if (resolutionText == undefined)
    resolutionText =
      definition.resolution !== undefined ? definition.resolution : '640x480'
  const resolution: string[] = resolutionText.split('x')
  if (resolution.length != 2) {
    console.warn('Image resolution is corrupt: ' + resolutionText)
    return [640, 480]
  };
  const width: number = Number.parseInt(resolution[0])
  const height: number = Number.parseInt(resolution[1])
  return [width, height]
}

function renderGlassesSummary (groupDefinition: GroupDefinition, exam: Exam) {
  let html: string = ''
  if (groupDefinition === undefined || groupDefinition === null) return html
  if (
    exam[exam.definition.name] === undefined ||
    exam[exam.definition.name][groupDefinition.name] === undefined
  )
    return html
  if (groupDefinition.multiValue) {
    exam[exam.definition.name][groupDefinition.name].map(
      (glassesRx: GlassesRx, index: number) => {
        html += renderRxTable(glassesRx, groupDefinition)
      }
    )
    return html
  } else {
    const glassesRx: GlassesRx =
      exam[exam.definition.name][groupDefinition.name]
    return renderRxTable(glassesRx, groupDefinition)
  }
}


function renderRxTable (
  glassesRx: GlassesRx,
  groupDefinition: GroupDefinition
) {
  let html: string = '';
  if (isEmpty(glassesRx.od.sph) && isEmpty(glassesRx.os.sph)) {
    return html;
  }
  html += `<table>`
  html += `<thead><tr>`
  html += `<th class="service" style="font-size:10px; width: 80px; max-width: 80px; min-width:20px;">${formatLabel(groupDefinition)}</th>`
  html += `<th class="service">Sph</th>`
  html += `<th class="service">Cyl</th>`
  html += `<th class="service">Axis</th>`
  if (isPrism(glassesRx)) html += `<th class="service">Prism</th>`
  if (groupDefinition.hasVA) html += `<th class="service">DVA</th>`
  if (groupDefinition.hasAdd) html += `<th class="service">Add</th>`
  if (groupDefinition.hasAdd && groupDefinition.hasVA)
    html += `<th class="service">NVA</th>`
  html += `</thead></tr><tbody><tr>`
  html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.od}</td>`
  html += `<td class="desc">${
    glassesRx.od ? formatDiopter(glassesRx.od.sph) : ''
  }</td>`
  html += `<td class="desc">${
    glassesRx.od ? formatDiopter(glassesRx.od.cyl) : ''
  }</td>`
  html += `<td class="desc">${
    glassesRx.od ? formatDegree(glassesRx.od.axis) : ''
  }</td>`
  if (isPrism(glassesRx))
    html += `<td class="desc">${
      glassesRx.od ? formatPrism(glassesRx.od) : ''
    }</td>`
  if (groupDefinition.hasVA) {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.DVA.OD');
    const formattedValue : string = glassesRx.od ? formatFieldValue(glassesRx.od.va, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
  }
  if (groupDefinition.hasAdd)
    html += `<td class="desc">${
      glassesRx.od ? formatDiopter(glassesRx.od.add) : ''
    }</td>`
  if (groupDefinition.hasAdd && groupDefinition.hasVA)
  {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.NVA.OD');
    const formattedValue : string = glassesRx.od ? formatFieldValue(glassesRx.od.addVa, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
  }
  html += `</tr>`
  html += `<tr>`
  html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.os}</td>`
  html += `<td class="desc">${
    glassesRx.os ? formatDiopter(glassesRx.os.sph) : ''
  }</td>`
  html += `<td class="desc">${
    glassesRx.os ? formatDiopter(glassesRx.os.cyl) : ''
  }</td>`
  html += `<td class="desc">${
    glassesRx.os ? formatDegree(glassesRx.os.axis) : ''
  }</td>`
  if (isPrism(glassesRx))
    html += `<td class="desc">${
      glassesRx.os ? formatPrism(glassesRx.os) : ''
    }</td>`
  if (groupDefinition.hasVA)
  {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.DVA.OS');
    const formattedValue : string = glassesRx.os ? formatFieldValue(glassesRx.os.va, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
  }
  if (groupDefinition.hasAdd)
    html += `<td class="desc">${
      glassesRx.os ? formatDiopter(glassesRx.os.add) : ''
    }</td>`
  if (groupDefinition.hasAdd && groupDefinition.hasVA)
    {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.NVA.OS');
    const formattedValue : string = glassesRx.os ? formatFieldValue(glassesRx.os.addVa, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
    }
  html += `</tr>`;
 if(groupDefinition.hasVA===true && !isEmpty(glassesRx.ou)) {

  html += `<tr>`
  html += `<td class="desc" style="width: 80px; max-width: 80px; min-width:20px;">${strings.ou}</td>`
  html += `<td class="desc"></td>`;
  html += `<td class="desc"></td>`;
  html += `<td class="desc"></td>`;
  if (isPrism(glassesRx))
    html += `<td class="desc"></td>`;

  if (groupDefinition.hasVA)
  {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.DVA.OU');
    const formattedValue : string = glassesRx.ou ? formatFieldValue(glassesRx.ou.va, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
  }
    html += `<td class="desc"></td>`;
  if (groupDefinition.hasAdd && groupDefinition.hasVA)
    {
    const fieldDefinition : FieldDefinition = getFieldDefinition('exam.VA cc.Aided acuities.NVA.OU');
    const formattedValue : string = glassesRx.ou ? formatFieldValue(glassesRx.ou.addVa, fieldDefinition) : '';
    html += `<td class="desc">${formattedValue}</td>`;
    }
  html += `</tr>`;
 }
  html += `</tbody></table>`;
  if (groupDefinition.hasNotes && !isEmpty(glassesRx.notes)) {
    html += `<div>Notes: ${glassesRx.notes}</div>`;
  }
  if(groupDefinition.hasLensType) {
      const fieldDefinition : FieldDefinition = filterFieldDefinition(groupDefinition.fields, "lensType");
      if (fieldDefinition.options && fieldDefinition.options.length>0) {
         let options = fieldDefinition.options;
         const value : string = formatCode(options, glassesRx.lensType);
         html += `<div>${formatLabel(fieldDefinition)}: ${value}</div>`;
      }
    }

  return html
}

export function patientHeader () {
  let htmlHeader: string =
    `<head><style>` +
    `@media print {` +
    `table { page-break-after:auto }` +
    `tr    { page-break-inside:avoid; page-break-after:auto }` +
    `thead { display:table-header-group }` +
    `tfoot { display:table-footer-group }` +
    `.xlForm {display: block; page-break-before: always;}` +
    `.uploadForm {display: block; page-break-before: always;}` +
    `}` +

    `.uploadForm {` +
    `  font-weight: bold;` +
    `  text-decoration: underline;` +
    `  display:block;`+
    `  float: left;`+
    `  margin-left:10%`+
    `}` +
    `.groupLabel {` +
    `  font-weight: bold;` +
    `  text-decoration: underline;` +
    `}` +
    `.clearfix:after {` +
    `  content: "";` +

    `  display: table;` +
    `  clear: both;` +
    `}` +
    `a {` +
    `  color: #5D6975;` +
    `  text-decoration: underline;` +
    `}` +
    `body {` +
    `  position: relative;` +
    `  margin: 0 auto;` +
    `  color: #001028;` +
    `  background: #FFFFFF;` +
    `  font-family: Arial, sans-serif;` +
    `  font-size: 12px;` +
    `  font-family: Arial;` +
    `}` +
    `header {` +
    `  padding: 10px 0;` +
    `  margin-bottom: 30px;` +
    `}` +
    `#logo {` +
    `  text-align: center;` +
    `  margin-bottom: 10px;` +
    `}` +
    `#logo img {` +
    `  width: 90px;` +
    `}` +
    `h1 {` +
    `  border-top: 1px solid  #5D6975;` +
    `  border-bottom: 1px solid  #5D6975;` +
    `  color: #5D6975;` +
    `  font-size: 2.4em;` +
    `  line-height: 1.4em;` +
    `  font-weight: normal;` +
    `  text-align: center;` +
    `  margin: 0 0 20px 0;` +
    `  background: #F5F5F5;` +
    `}` +
    `#client {` +
    `  float: left;` +
    `}` +
    `#client span {` +
    `  color: #5D6975;` +
    `  text-align: right;` +
    `  width: 52px;` +
    `  margin-right: 18px;` +
    `  display: inline-block;` +
    `  font-size: 0.8em;` +
    `}` +
    `#company {` +
    `  float: right;` +
    `  text-align: right;` +
    `}` +
    `#client div,` +
    `#company div {` +
    `  white-space: nowrap;` +
    `}` +
    `table {` +
    `  width: 100%;` +
    `  border-collapse: collapse;` +
    `  border-spacing: 0;` +
    `  margin-bottom: 20px;` +
    `}` +
    `table tr:nth-child(2n-1) td {` +
    `  background: #F5F5F5;` +
    `}` +
    `table th,` +
    `table td {` +
    `padding: 5px 20px;` +
    `text-align: center;` +
    `font-size:11px;`+
    `}` +
    `table th {` +
    `  padding: 5px 20px;` +
    `  color: #5D6975;` +
    `  border-bottom: 1px solid #C1CED9;` +
    `  white-space: nowrap;` +
    `  font-weight: normal;` +
    `}` +
    `table .service,` +
    `table .desc {` +
    `  text-align: left;` +
    `}` +
    `table td {` +
    `  text-align: right;` +
    `  border: solid;` +
    `  border-width: 0 1px;` +
    `}` +
    `table tr {` +
    `  border: solid;` +
    `  border-width: 1px 0;` +
    `}` +
    `table thead {` +
    `  display:table-header-group;` +
    `}` +
    `table td.service,` +
    `table td.desc {` +
    `  vertical-align: top;` +
    `}` +
    `table td.service {` +
    `font-weight: bold;` +
    `}` +
    `table td.unit,` +
    `table td.qty,` +
    `table td.total {` +
    `  font-size: 1.2em;` +
    `}` +
    `table th.service,` +
    `table th.desc {` +
    `font-weight: bold;` +
    `}` +
    `table td.grand {` +
    `  border-top: 1px solid #5D6975;` +
    `}` +
    `div {` +
    `page-break-inside: avoid;` +
    `}` +
    `#forms {` +
    `  color: #5D6975;` +
    `  font-size: 1.2em;` +
    `  font-weight: bold;` +
    `  margin-bottom:10px;` +
    `}` +
    `footer {` +
    `  color: #5D6975;` +
    `  width: 100%;` +
    `  height: 30px;` +
    `  position: absolute;` +
    `  bottom: 0;` +
    `  border-top: 1px solid #C1CED9;` +
    `  padding: 8px 0;` +
    `  text-align: center;` +
    `}` +
    `.img-wrap {` +
    `  position: relative;` +
    `  display: inline-block;` +
    `  width:49%;` +
    `}` +
    `.img-wrap svg {` +
    `  position:absolute;` +
    `  top:0;` +
    `  left:0;` +
    `}` +
    `.img-wrap img {` +
    `  display:block;` +
    `}` +
    `</style></head><body><main>`
  return htmlHeader
}

export function getVisitHtml (html: string): string {
  let htmlHeader = patientHeader()
  let htmlEnd: string = `</main></body>`;
  let finalHtml: string = htmlHeader + html + htmlEnd;
  return finalHtml
}
