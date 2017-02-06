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
      visit?: Visit,
      patient: Patient,
      type: string,
      scheduledStart: Date,
      scheduledEnd: Date,
      bookingStatus: string,
      location: string,
      patientPresence: string,
      doctor: string
  };

  export type Assessment = {
    prescription: GlassesRx
  }

  export type Visit = {
      id?: number,
      patient: Patient,
      appointmentId?: number,
      type: string,
      start: Date,
      end?: Date,
      location: string,
      doctor: string,
      preExams?: Exam[],
      exams?: Exam[],
      assessment: Assessment
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
      version: number,
      od: GlassRx,
      os: GlassRx
  }

  export type Exam = {
      _id?: string,
      patient: Patient,
      visitId: number,
      type: string,
      hasStarted: boolean,
      hasEnded: boolean,
  };

  export type Refractions = {
      previousRx: GlassesRx,
      wearingRx: GlassesRx,
      phoropter: GlassesRx,
      autoRefractor: GlassesRx,
      retinoscope: GlassesRx,
      cyclopegic: GlassesRx,
      finalRx: GlassesRx
  }

  export type RefractionExam = {
      _id?: string,
      patient: Patient,
      visitId: number,
      type: string,
      hasStarted: boolean,
      hasEnded: boolean,
      refractions: Refractions
  }

  export type SlitLampFindings = {
    label: string,
    conjunctiva: string,
    cornea: string,
    eyelids: string,
    iris: string,
    lens: string,
    sclera: string
  }

  export type Medication = {
    label: string,
    rxDate: Date,
    strength: string,
    dosage: string,
    route: string,
    frequency: string,
    duration: string,
    instructions: string[]
  }

  export type ExamItems = {
    examId: string
  }

  export type Medications = {
    examId: string,
    medications: Medication[]
  }

  export type Allergy = {
      allergy: string,
      reaction: string[],
      status: string
  }

  export type Allergies = {
      examId: string,
      allergies: Allergy[]
  }
