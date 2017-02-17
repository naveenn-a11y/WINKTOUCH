/**
 * @flow
 */
'use strict';

import type {Appointment, Doctor, Patient, Medication, Medications} from './Types';
import {storeDocument} from './CouchDb';
import {createDoctor, createPatient} from './User';
import {createAppointment} from './Appointment';
import {createVisit} from './Visit';
import {createPreExams} from './Exam';

export let doctorMurray : Doctor = {_id: 'DrConrad', firstName: 'Conrad', lastName: 'Murray'};
export let spinDoctor : Doctor = {_id: 'TheSpinDoctor', firstName: 'Spin', lastName: 'Doctor'};
export let patient1 : Patient = {_id: 'Patient1Account2', "lastName": "HARRAR","patientId": 1,"firstName": "Demo", "accountsId": "2"};
export let patient2 : Patient = {_id: 'Patient2Account2', "lastName": "Harrarar","patientId": 2,"firstName": "Ted", "accountsId": "2"};
export let patient3 : Patient = {_id: 'Patient6Account2', "lastName": "Harrar","patientId": 6,"firstName": "Ted", "accountsId": "2"};
export let patient4 : Patient = {_id: 'Patient7Account2', "lastName": "khedrihhh", "patientId": 7,  "firstName": "wais",  "accountsId": "2"};
export let patient5 : Patient = {_id: 'Patient9Account2', "lastName": "khedriii","patientId": 9,"firstName": "waisk","accountsId": "2"};

async function createUsers() {
    await createDoctor(doctorMurray);
    await createDoctor(spinDoctor);
    await createPatient(patient1);
    await createPatient(patient2);
    await createPatient(patient3);
    await createPatient(patient4);
    await createPatient(patient5);
}

async function createAppointments() {
  let appointment1: Appointment = {
      type: 'New patient',
      scheduledStart: new Date(2016, 11, 14, 10, 30),
      scheduledEnd: new Date(2016, 11, 14, 10, 50),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient1._id,
      patientPresence: 'In waiting room',
      doctorId: doctorMurray._id
  };
  let appointment2: Appointment = {
      type: 'Glasses pickup',
      scheduledStart: new Date(2016, 11, 14, 11, 0),
      scheduledEnd: new Date(2016, 11, 14, 11, 30),
      bookingStatus: 'confirmed',
      location: 'The oval office',
      patientId: patient2._id,
      patientPresence: 'Patient will be late',
      doctorId: doctorMurray._id
  };
  let appointment3: Appointment = {
      type: 'Control visit',
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

export async function createVisits(appointment: Appointment, hasStarted: boolean, historyCount: number): Visit[] {
    let visits: Visit[] = [{
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: appointment.type,
      start: hasStarted?new Date(2017,1,14,10,0):undefined,
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    },
    {
      appointmentId: undefined,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: 'Glasses pick up',
      start: new Date(2017,1,14,10,20),
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    }, {
      appointmentId: undefined,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: 'Control Visit',
      start: new Date(2017,0,30,10,20),
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    }, {
      appointmentId: undefined,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: 'Glasses pick up',
      start: new Date(2016,2,14,10,20),
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    }, {
      appointmentId: undefined,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: 'New client',
      start: new Date(2016,1,14,10,20),
      end: undefined,
      location: appointment.location,
      preExamIds: [],
      examIds: [],
      assessment: {}
    }];
    visits = visits.slice(visits.length-historyCount);
    for (let i=0;i<visits.length;i++) {
      visits[i] = await createVisit(visits[i]);
      if (historyCount>0)
        visits[i]= await createPreExams(visits[i]);
    }
    return visits;
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
  await createUsers();
  let appointments: Appointment[] = await createAppointments();
  for (let i=0;i<appointments.length;i++) {
    let visits : Visit[] = await createVisits(appointments[i], i==0, i);
  }
  alert('CouchDb demo database rereceated');
}
