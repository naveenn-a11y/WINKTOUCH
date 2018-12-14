/**
 * @flow
 */
'use strict';

export type Registration = {
  email: string,
  bundle: string,
  path: string
}

export type Store = {
  storeId: number, //TODO Chris
  name: string,
  city: string,
}

export type Account = {
  id: number,
  name: string,
  email: string,
  stores: Store[],
  isDemo: boolean
}

export type User = {
  id: string,
  firstName: string,
  lastName: string
}

export type Patient = {
    id: string,
    firstName: string,
    lastName: string,
    patientTags: string[]
}

export type PatientInfo = {
    id: string,
    version: number,
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    gender: number,
    phone: string,
    cell: string,
    streetName: string,
    countryId: number,
    medicalCard: string,
    medicalcardExp: string,
    postalCode: string,
    email: string,
    province: string,
    country: string,
    gender: number,
    streetNumber: string,
    patientTags: string[],
    patientDrugs: string[] //TODO wais rename patientDrugIds
}

export type PatientDrug = {
  id: string,
  patientId: string,
  userId: string, //TODO Wais rename prescriberId
  visitId: string,
  datePrescribed: string,
  dose: number,
  doseUnit: number,
  repeat: number,
  duration: string,
  note: string,
}

export type PatientTag = {
  id: string,
  letter: string,
  color: string, //TODO wais
  name: string,
  version: number
}

export type AppointmentType = {
  id: string,
  color: string,
  name: string,
  version: number
}

export type Appointment = {
  id: string,
  version: number,
  patientId: string,
  userId: string,
  title: string,
  start: string,
  end: string,
  status: number,
  appointmentTypes?: string[]
}

export type VisitProcedure = {
  id: string,
  visitId: string,
  procedureCode: string,
  quantity: number,
  unitPrice: number,
  icds: {code: string, comment: ?string}[]
}

export type Diagnose = {
  id: string,
  procedureCode: string,
  unitPrice: number,
  quantity: number,
  comment: ?string
}

export type Prism = {
  prism1?: number,
  prism1b?: number,
  prism2?: number,
  prism2b?: number
}

export type GlassRx = {
    sph?: string,
    cyl?: number,
    axis?: number,
    prism1?: number,
    prism1b?: number,
    prism2?: number,
    prism2b?: number,
    add?: number,
    va?: string,
    addVA?: string
}

export type GlassesRx = {
    od: GlassRx,
    os: GlassRx,
    expiry?: string,
    vaFar?: string,
    vaNear?: string
}

export type Recall = {
  amount: number,
  unit: string,
  notes: string
}

export type Visit = {
    id: string,
    version: number,
    appointmentId?: string,
    patientId: string,
    userId?: string,
    preCustomExamIds: string[],
    customExamIds: string[],
    date: string,
    duration: number,
    typeName: string,
    location?: string,
    prescription: GlassesRx,
    recall: Recall,
    purchase: {add: number, comment: string, purchaseReasonId: string}[]
}

export type CodeDefinition = {
  code: string|number,
  description?: string,
  key?: string
}|string

export type FieldLayout = {
  top: number,
  left: number,
  width: number,
  height: number,
}

export type GraphDefinition = {
    fields: string[]
}

export type FieldDefinition = {
  name: string,
  label?: string,
  multiValue?: boolean, //Can contain more then 1 value
  options?: CodeDefinition[][]|CodeDefinition[]|string,
  popularOptions?: CodeDefinition[],
  defaultValue?: boolean|string|number,
  normalValue?: string,
  freestyle?: boolean, //Allow keyboard input when there are fe options, stepsize, date type
  required?: boolean,
  requiredError?: string,
  readonly?: boolean,
  minValue?: number,
  maxValue?: number,
  stepSize?: number,
  groupSize?: number,
  decimals?: number,
  minLength?: number,
  minLengthError?: string,
  maxLength?: number,
  maxLengthError?: string,
  prefix?: string,
  suffix?: string,
  validation?: string,
  mappedField?: string,
  layout?: FieldLayout,
  type?: 'email-address'|'numeric'|'phone'|'pastDate'|'futureDate'|'futureDateTime',
  capitalize?: 'words'|'characters'|'sentences'|'none',
  image?: string,
  simpleSelect?: boolean,
  newLine?: boolean
}

export type FieldDefinitions = (FieldDefinition|GroupDefinition)[]

export type GroupDefinition = {
    name: string,
    label?: string,
    size?: string, //XS S M L XL
    columns?: string[][],
    rows?: string[][],
    multiValue?: boolean,
    maxLength?: number,
    mappedField?: string,
    canBeCopied?: boolean,
    hasVA?: boolean,
    fields: (FieldDefinition|GroupDefinition)[],
}

export type ExamDefinition = {
    id: string,
    version: number,
    name: string,
    fields?: (FieldDefinition|GroupDefinition)[],
    type: string, //GroupedForm || SelectionLists
    cardFields?: string[]|string[][],
    cardGroup?: string,
    essentialFields: string[],
    titleFields: string[],
    editable: boolean,
    addable: boolean,
    isPreExam: boolean,
    isAssessment: boolean,
    image?: string,
    graph?: GraphDefinition,
    section: string, //Pre tests.3
    order?: string, //order used for pre tests
    starable?: boolean,
    relatedExams?: string[],
    scrollable?: boolean
}

export type ExamPredefinedValue = {
  id: string,
  version: number,
  customExamDefinitionId: string, //TODO: wais
  name: string,
  predefinedValue: any,
  order?: number
}

export type Exam = {
    id: string,
    visitId: string,
    version: number,
    definition: ExamDefinition,
    hasStarted: boolean,
    hasEnded: boolean,
    isDirty?: boolean
}

export type Scene = {
  key: string,
  scene: string,
  menuHidden?: boolean,
  nextNavigation?: any,
  appointment?: Appointment,
  patient?: Patient,
  patientInfo?: PatientInfo,
  exam?: Exam,
  examDefinition?: ExamDefinition
}
