/**
 * @flow
 */
'use strict';

export type RestResponse = {
    response: any
}

export type ItemDefinition = {
  [propertyName: string]: {
    label: string,
    options?: string[],
    normalValue?: string,
    required?: boolean,
    minValue?: number,
    maxValue?: number,
    stepSize?: number,
    validation?: string
  }
}

export type Patient = {
    patientId: number,
    accountsId: number,
    firstName: string,
    lastName: string
}

export type PatientInfo = {
    patientId: number,
    accountsId: number,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    phone: string,
    cell: string,
    streetName: string,
    city: string,
    countryId: number,
    medicalCard: string,
    medicalcardExp: string,
    postalCode: string,
    email: string,
    province: string,
    gender: number,
    streetNumber: string
}

export type Appointment = {
    id: number,
    type: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    bookingStatus: string,
    location: string,
    patient: Patient,
    patientPresence: string,
    doctor: string
};

export type GlassRx = {
    sphere: number,
    cylinder?: number,
    axis?: number,
    base?: string,
    prism?: number,
    add?: number
}

export type GlassesRx = {
    id: number,
    od: GlassRx,
    os: GlassRx
}

export type Exam = {
  id?: number,
  type: string,
  hasStarted: boolean,
  hasEnded: boolean,
};

export type RefractionExam = {
  id?: number,
  type: string,
  hasStarted: boolean,
  hasEnded: boolean,
  refractions: {
    previousRx: GlassesRx,
    wearingRx: GlassesRx,
    phoropter: GlassesRx,
    autoRefractor: GlassesRx,
    retinoscope: GlassesRx,
    cyclopegic: GlassesRx,
    finalRx: GlassesRx
  }
}
