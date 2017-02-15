/**
 * @flow
 */
'use strict';

import type {Appointment, Doctor, Patient, Medication, Medications} from './Types';
import {storeDocument} from './CouchDb';
import {createDoctor, createPatient} from './User';
import {createAppointment} from './Appointment';
import {createVisit} from './Visit';

export let doctorMurray : Doctor = {_id: 'DrConrad', firstName: 'Conrad', lastName: 'Murray'};
export let spinDoctor : Doctor = {_id: 'TheSpinDoctor', firstName: 'Spin', lastName: 'Doctor'};
export let patient1 : Patient = {_id: 'Patient1Account2', "lastName": "HARRAR","patientId": 1,"firstName": "Demo", "accountsId": "2"};
export let patient2 : Patient = {_id: 'Patient2Account2', "lastName": "Harrarar","patientId": 2,"firstName": "Ted", "accountsId": "2"};
export let patient3 : Patient = {_id: 'Patient6Account2', "lastName": "Harrar","patientId": 6,"firstName": "Ted", "accountsId": "2"};
export let patient4 : Patient = {_id: 'Patient7Account2', "lastName": "khedrihhh", "patientId": 7,  "firstName": "wais",  "accountsId": "2"};
export let patient5 : Patient = {_id: 'Patient9Account2', "lastName": "khedriii","patientId": 9,"firstName": "waisk","accountsId": "2"};

function createUsers() {
    createDoctor(doctorMurray);
    createDoctor(spinDoctor);
    createPatient(patient1);
    createPatient(patient2);
    createPatient(patient3);
    createPatient(patient4);
    createPatient(patient5);
}

async function createAppointments() {
  let appointment1: Appointment = {
      type: 'Patient complaint',
      scheduledStart: new Date(2016, 11, 14, 10, 30),
      scheduledEnd: new Date(2016, 11, 14, 10, 50),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient1._id,
      patientPresence: 'In waiting room',
      doctorId: doctorMurray._id
  };
  let appointment2: Appointment = {
      type: 'Take in new patient',
      scheduledStart: new Date(2016, 11, 14, 11, 0),
      scheduledEnd: new Date(2016, 11, 14, 11, 30),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient2._id,
      patientPresence: 'Patient will be late',
      doctorId: doctorMurray._id
  };
  let appointment3: Appointment = {
      type: 'Patient complaint',
      scheduledStart: new Date(2016, 11, 14, 11, 30),
      scheduledEnd: new Date(2016, 11, 14, 10, 45),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient3._id,
      patientPresence: 'Checked in',
      doctorId: doctorMurray._id
  };
  let appointment4: Appointment = {
      type: 'Take in new patient',
      scheduledStart: new Date(2016, 11, 14, 11, 0),
      scheduledEnd: new Date(2016, 11, 14, 11, 30),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient4._id,
      patientPresence: 'Patient will be late',
      doctorId: spinDoctor._id
  };
  let appointments: Appointment[] = [];
  appointments.push(await createAppointment(appointment1));
  appointments.push(await createAppointment(appointment2));
  appointments.push(await createAppointment(appointment3));
  appointments.push(await createAppointment(appointment4));
  return appointments;
}

export function createVisits(appointment: Appointment, hasStarted: boolean, historyCount: number): Visit[] {
    let visit1: Visit = {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: appointment.type,
      start: hasStarted?new Date():undefined,
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    };
    let visit2: Visit = {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: appointment.type,
      start: new Date(2017,2,14),
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    };
    let visits: Visit[] = [];
    visits.push(await createVisit(visit1));
    visits.push(await createVisit(visit2));
    return visits;
}

function createPreExams() {

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

export async function createDemoData() {
  createUsers();
  let appointments: Appointment[] = await createAppointments();
  for (let i=0;i<appointments.length;i++) {
    let visits : Visit[] = createVisits(appointments[i], i==0, i);
  }
}
