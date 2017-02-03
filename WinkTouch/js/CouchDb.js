/**
 * @flow
 */
'use strict';

import base64 from 'base-64';
import type {Appointment} from './Types';
import {createAppointment} from './Appointment';

export const restUrl : string = 'http://192.168.2.44:5984/ehr/';

function createFewAppointments() {
  let appointment1: Appointment = {
      id: 1,
      type: 'Patient complaint',
      scheduledStart: new Date(2016, 11, 14, 10, 30),
      scheduledEnd: new Date(2016, 11, 14, 10, 50),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patient: {
          patientId: 2,
          accountsId: 2,
          firstName: 'Demo',
          lastName: 'HARRAR',
          birthDate: new Date(1979, 12, 29)
      },
      patientPresence: 'In waiting room',
      doctor: 'Conrad Murray'
  };
  let appointment2: Appointment = {
      id: 2,
      type: 'Take in new patient',
      scheduledStart: new Date(2016, 11, 14, 11, 0),
      scheduledEnd: new Date(2016, 11, 14, 11, 30),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patient: {
          patientId: 6,
          accountsId: 2,
          firstName: 'Wais',
          lastName: 'Nice',
          birthDate: new Date(1976, 2, 17)
      },
      patientPresence: 'Patient will be late',
      doctor: 'Conrad Murray'
  };
  let appointment3: Appointment = {
      id: 3,
      type: 'Patient complaint',
      scheduledStart: new Date(2016, 11, 14, 11, 30),
      scheduledEnd: new Date(2016, 11, 14, 10, 45),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patient: {
          patientId: 9,
          accountsId: 2,
          firstName: 'Wais',
          lastName: 'Khedri',
          birthDate: new Date(1974, 2, 21)
      },
      patientPresence: 'Checked in',
      doctor: 'The spin doctor'
  };
  createAppointment(appointment1);
  createAppointment(appointment2);
  createAppointment(appointment3);
}

async function deleteEhrDatabase() {
    try {
        let response = await fetch(restUrl, {
            method: 'delete',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            }
        });
        let json = await response.json();
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong deleting the ehr database: '+error);
    }
}


async function createEhrDatabase() {
    try {
        let response = await fetch(restUrl, {
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            }
        });
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong creating the ehr database: '+error);
    }
}

async function createViews() {
    const viewDesign = {
      "views": {
        "appointments": { "map": "function (doc) {emit(doc._id, 2);}" }
      },
      "language": "javascript"
    };
    try {
        let response = await fetch(restUrl+'_design/views', {
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + base64.encode('ehr:ehr')
            },
            body: JSON.stringify(viewDesign)
        });
        alert(JSON.stringify(response));
        //todo check if suckseeded
    } catch (error) {
      console.log(error);
      alert('Something went wrong creating the ehr database: '+error);
    }
}

export async function recreateDatabase() : void {
  await deleteEhrDatabase();
  await createEhrDatabase();
  await createViews();
  createFewAppointments();
}
