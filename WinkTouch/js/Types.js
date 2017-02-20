/**
 * @flow
 */
'use strict';

  export type Doctor = {
    firstName: string,
    lastName: string
  }

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
      accountsId: string,
      firstName: string,
      lastName: string,
  }

  export type PatientInfo = {
      patientId: number,
      accountsId: string,
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
      patientId?: string,
      doctorId?: string,
      type: string,
      scheduledStart: Date,
      scheduledEnd: Date,
      bookingStatus: string,
      location: string,
      patientPresence: string
  }

  export type GlassRx = {
      sphere: number,
      cylinder?: number,
      axis?: number,
      base?: string,
      prism?: number,
      add?: number
  }

  export type Assessment = {
    prescription: GlassesRx
  }

  export type Visit = {
      appointmentId?: string,
      patientId: string,
      doctorId?: string,
      type: string,
      start: Date,
      end?: Date,
      location?: string,
      preExamIds: string[],
      examIds: string[],
      assessment: Assessment
  }

  export type GlassesRx = {
      od: GlassRx,
      os: GlassRx
  }

  export type Exam = {
      type: string,
      hasStarted: boolean,
      hasEnded: boolean,
      wearingRx?: WearingRx,
      medications?: Medication[],
      allergies?: Allergy[],
      medicalProcedures?: MedicalProcedure[],
      relationDiseases?: RelationDisease[],
      socialHistory?: SocialHistory,
      complaints?: Complaint[],
      refractionTest?: RefractionTest
  }

  export type WearingRx = {
      previousRx: GlassesRx,
      wearingRx: GlassesRx
  }

  export type RefractionTest = {
      phoropter: GlassesRx,
      autoRefractor: GlassesRx,
      retinoscope: GlassesRx,
      cyclopegic: GlassesRx,
      finalRx: GlassesRx
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

  export type Allergy = {
      allergy: string,
      reaction: string[],
      status: string
  }

  export type MedicalProcedure = {
    procedure: string,
    date: Date,
    route: string
  }

  export type FamilyDisease = {
    disease: string,
    since: string,
    relation: string[]
  }

  export type SocialHistory = {
    smokerType: string,
    smokedLastMonth: string,
    smokelessUsedLastMonth: string,
    drugUse: string[],
    alcoholUse: string[],
    other: string[],
    tobaccoCounseling: string,
    physicalActivityCounseling: string,
    nutritionCounseling: string
  }

  export type Complaint = {
    date: Date,
    isChief: boolean,
    symptom: string[],
    location?: string[],
    quality?: string[],
    severity?: string[],
    timing?: string[],
    duration?: string[],
    context?: string[],
    modifyingFactor?: string[],
    associatedSign?: string[]
  }
