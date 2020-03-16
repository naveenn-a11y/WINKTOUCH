/**
 * @flow
 */
'use strict';

import type { Measurement } from './Types';
import { getFieldValue, getPatient } from './Exam';
import { getCachedItem } from './DataCache';
import { getFieldDefinition, formatLabel } from './Items';
import { searchItems, storeItem } from './Rest';
import { getConfiguration } from './Configuration';

export const mappedFields : string[] = [
  'patient.lastName',
  'patient.firstName',
  'patient.name',
  'patient.streetName',
  'patient.email',
  'patient.phone',
  'patient.cell',
  'patient.medicalCard',
  'patient.medicalCardExp',
  'patient.medialcardversion',
  'patient.dateOfBirth',
  'patient.streetNumber',
  'patient.province',
  'patient.city',
  'patient.postalCode',
  'patient.address1',
  'patient.address2',
  'visit.prescription.od.sph',
  'visit.prescription.os.sph',
  'visit.prescription.od.cyl',
  'visit.prescription.os.cyl',
  'visit.prescription.od.axis',
  'visit.prescription.os.axis',
  'visit.prescrition.od.add',
  'visit.prescription.os.add',
  'visit.prescription.od.refraction',
  'visit.prescription.os.refraction',
  'visit.purchase.add',
  'visit.examDate',
  'visit.prescription.ou.add',
  'visit.prescription.ou.addVA',
];


async function fetchMachineMeasurements(machineType, patientId, filter) : Measurement[] {
  const searchCriteria = {machineType, patientId, filter};
  let restResponse = await searchItems('Measurement/list', searchCriteria);

  return restResponse.data;
}

export async function importData(dataIdentifier: string|string[], examId: string, definitionName) : Measurement|Measurement[] {
    if ((dataIdentifier instanceof Array)===false) {
      dataIdentifier = [dataIdentifier];
    }
    const exam : Exam = getCachedItem(examId);
    let dataList : Measurement[] = [];
    for (let i=0;i<dataIdentifier.length;i++) {
      const identifier = dataIdentifier[i];

      if (identifier.startsWith('machine.')) {
        const iArr = identifier.split('.');
        const machineType : string = iArr[1];
        const patientId : string = getPatient(exam).id;

        const filter = iArr.slice(2).join('.');

        let measurements = await fetchMachineMeasurements(machineType, patientId, filter);
        if (measurements && measurements.length>0) {
          dataList = [...dataList, ...measurements];
        }
      } else {
        let value = getFieldValue(identifier, exam);

        if ((value instanceof Array) && value.length===1) {
          value = value[0];
        }
        if (value!==undefined && value!==null) {
          const fieldDefinition = getFieldDefinition(identifier);
          let label : string = fieldDefinition?formatLabel(fieldDefinition):identifier;
          if (value instanceof Array) {
            let index: number = 0;
            value.forEach((subValue) => {
              if (subValue!=undefined && subValue!=null) {
                let data = {label: label+' '+(++index), data: subValue};
                dataList.push(data);
              }
            });
          } else {
            let data = {label: label, data: value};
            dataList.push(data);
          }
        }
      }
    }
    if (dataList.length===0) return undefined;
    if (dataList.length===1) return dataList[0];
    return dataList;
}

async function pushMachineMeasurement(machineId: string, measurement: Measurement) : void {
  //alert('pushing to '+machineId+': '+JSON.stringify(measurement));
  measurement.id = 'measurement';
  measurement.machineId = machineId;
  storeItem(measurement);
}

export async function exportData(destinationIdentifier: string, measurement: Measurement, examId: string) : Measurement {
  if (measurement===undefined || measurement===null) return;
  if (destinationIdentifier.startsWith('machine.')) {
    const machineType : string = destinationIdentifier.substring('machine.'.length);
    let machineId : number = getConfiguration().machine.phoropter;
    measurement = await pushMachineMeasurement('machine-'+machineId, measurement);
    return measurement;
  } else {
    //const exam : Exam = getCachedItem(examId);
    alert('Can not export to '+destinationIdentifier+' yet. Better call Sam.'); //TODO
    return undefined;
  }
}
