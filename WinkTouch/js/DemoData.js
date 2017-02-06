/**
 * @flow
 */
'use strict';

import type {Appointment, Medication, Medications} from './Types';
import {storeDocument} from './CouchDb';
import {createAppointment} from './Appointment';
import {createMedications} from './Medication';

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

function createExamMedications() {
  let medication1: Medication = {
    label: 'Xalatan',
    rxDate: new Date(),
    strength: '20 mg',
    dosage: '1 drop',
    route: 'OS',
    frequency: '5 x daily',
    duration: '2 weeks',
    instructions: ['Shake well before using', 'Take with food', 'Avoid taking with diary']
  };
  let medications: Medications = {
    dataType: 'ExamItem',
    itemType: 'Medications',
    examId: 'Exam1',
    medications: [medication1]
  }
  storeDocument(medications);
}

export function createDemoData() {
  createFewAppointments();
  //createExamMedications();
}
