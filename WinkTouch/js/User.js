/**
 * @flow
 */
'use strict';

import type {Doctor, Patient} from './Types';
import {storeDocument} from './CouchDb';

export async function createDoctor(doctor: Doctor) : Doctor {
  try {
      doctor.dataType = 'User';
      doctor.userType = 'Doctor';
      doctor = await storeDocument(doctor);
      return doctor;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the doctor data on the server. You can try again anytime.');
  }
}

export async function createPatient(patient: Patient) : Patient {
  try {
      patient.dataType = 'User';
      patient.userType = 'Patient';
      patient = await storeDocument(patient);
      return patient;
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to store the patient data on the server. You can try again anytime.');
  }
}
