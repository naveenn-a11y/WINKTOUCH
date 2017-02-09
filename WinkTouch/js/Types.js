/**
 * @flow
 */
'use strict';

  export type Doctor = {
    _id: string,
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
      lastName: string
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
      _id: string,
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
      preExams: string[],
      exams: string[],
      assessment: Assessment
  }

  export type GlassesRx = {
      id: number,
      version: number,
      od: GlassRx,
      os: GlassRx
  }

  export type Exam = {
      patient: Patient,
      visitId: number,
      type: string,
      hasStarted: boolean,
      hasEnded: boolean,
      refractions? : Refractions,
      medications? : Medications,
      allergies?: Allergies,
      medicalProcedures?: MedicalHistory,
      relationDiseases?: FamilyHistory,
      socialHistory?: SocialHistory,
      complaints?: Complaints
  }

  export type Refractions = {
      previousRx: GlassesRx,
      wearingRx: GlassesRx,
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

  export type ExamItems = {
    examId: string
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

  export type MedicalProcedure = {
    procedure: string,
    date: Date,
    route: string
  }

  export type MedicalHistory = {
    examId: string,
    medicalProcedures: MedicalProcedure[]
  }

  export type RelationDisease = {
    disease: string,
    since: string,
    relation: string[]
  }

  export type FamilyHistory = {
    examId: string,
    relationDiseases: RelationDisease[]
  }

  export type SocialHistory = {
    examId: string,
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

  export type Complaints = {
    examId: string,
    complaints: Complaint[]
  }
