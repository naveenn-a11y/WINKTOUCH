/**
 * @flow
 */
'use strict';

export type RestResponse = {
  patient?: PatientInfo,
  exam?: Exam,
  errors?: string[],
  hasValidationError?: boolean,
  hasConcurrencyConflict?: boolean
}

export type Registration = {
  email: string,
  bundle: string,
  path: string
}

export type Store = {
  storeId: number, //TODO Chris
  name: string,
  companyName: string,
  streetNumber: string,
  unit: string,
  streetName: string,
  city: string,
  country: number,
  pr: string,
  postalCode: string,
  email: string,
  telephone: string,
  winkToWinkId?: number,
  winkToWinkEmail?: string,
  eFaxUsed?: boolean
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
  lastName: string,
  license?: string,
  signatureId?: string
}

export type Patient = {
    id: string,
    firstName: string,
    lastName: string,
    phone: ?string,
    cell: ?string,
    patientTags: string[]
}

export type PatientInfo = {
    id: string,
    version: number,
    errors?: string[],
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    gender: number,
    phone: ?string,
    cell: ?string,
    streetName: string,
    countryId: number,
    medicalCard: string,
    medicalCardExp: string,
    medicalCardVersion: string,
    postalCode: string,
    email: string,
    province: string,
    country: string,
    gender: number,
    streetNumber: string,
    unit: string,
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
  color: string,
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
  appointmentTypes?: string[],
  indicators?: string[]
}

export type Prism = {
  prismH?: number,
  prismHDirection?: string,
  prismV?: number,
  prismVDirection?: string
}

export type GlassRx = {
    sph?: string,
    cyl?: number,
    axis?: number,
    prism?: string,
    add?: number,
    va?: string,
    addVA?: string,
    isEye?: boolean,
}

export type GlassesRx = {
    od: GlassRx,
    os: GlassRx,
    ou: GlassRx,
    expiry?: string,
    prescriptionDate?: string,
    signedDate?: string,
    vaFar?: string,
    vaNear?: string,
    lensType?: string,
    notes?: string
}

export type Recall = {
  amount: number,
  unit: string,
  notes: string
}

export type ImageDrawing = {
  lines: string[],
  image?: string //"upload-123" | "./image/amsler.png" | "http://anywhere.com/image.png",
}

export type Measurement = {
  label: string,
  date?: string,
  patientId?: string,
  machineId?: string,
  data: any
}

export type Configuration = {
  machine: {phoropter: string}
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
    locked: boolean,
    typeName: string,
    isDigital: boolean,
    location?: string,
    prescription: GlassesRx,
    recall: Recall,
    purchase: {add: number, comment: string, purchaseReasonId: string}[],
    inactive: boolean
}

export type CodeDefinition = {
  code: string|number,
  description?: string,
  key?: string //this is a reference to the Strings.js constants
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
  autoSelect?: boolean, //Overwrite user selection when filtered options change
  popularOptions?: CodeDefinition[],
  filter?: {},
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
  prefix?: string|string[],
  suffix?: string,
  validation?: string,
  mappedField?: string,
  layout?: FieldLayout,
  size?: string,
  resolution?: string,
  type?: 'email-address'|'numeric'|'phone'|'pastDate'|'recentDate'|'partialPastDate'|'futureDate'|'futureDateTime'|'time'|'pastTime'|'futureTime',
  capitalize?: 'words'|'characters'|'sentences'|'none',
  image?: string,
  simpleSelect?: boolean,
  newLine?: boolean,
  popup?: boolean,
  sync?: boolean
}

export type FieldDefinitions = (FieldDefinition|GroupDefinition)[]

export type GroupDefinition = {
    name: string,
    label?: string,
    size?: string, //XS S M L XL
    optional?: boolean,
    columns?: string[][],
    rows?: string[][],
    multiValue?: boolean,
    readonly?: boolean,
    options?: CodeDefinition[][]|CodeDefinition[]|string,
    maxLength?: number,
    mappedField?: string,
    canBeCopied?: boolean,
    canBePaste?: boolean,
    keyboardEnabled?: boolean,
    clone?: string[],
    hasVA?: boolean,
    hasAdd?: boolean,
    hasLensType?: boolean,
    hasNotes?: boolean,
    import?: string|string[],
    export?: string|string[],
    fields: (FieldDefinition|GroupDefinition)[],
}

export type HtmlDefinition = {
  name : string,
  html : string,
  child?: HtmlDefinition|HtmlDefinition[],
}

export type ImageBase64Definition = {
  key: string,
  value: string
}

export type ReferralDocument = {
  content : string,
  subject?: string,
  body?: string
}

export type ReferralDefinition = {
  id: string,
  visitId  :string,
  fromDoctorId :string,
  upload?: Upload
}

export type FollowUp = {
  id: string,
  ref: string,
  linkedReferralId: string,
  visitId ?:string,
  patientId: string,
  storeId: string,
  referralTemplate: ReferralTemplate,
  date: string,
  from: Account,
  to: Account,
  faxedOn?: string,
  emailOn?: string,
  printedOn?: string,
  signedOn?: string,
  status?: string,
  comment?: string,
  isOutgoing?: boolean
}

export type ReferralStatusCode = {
  id: string,
  name: string,
  status: string
}
export type ReferralTemplate = {
  id: string,
  template: string
}

export type EmailDefinition = {
  to?: string,
  cc?: string,
  subject?: string,
  body?: string
}

export type ExamDefinition = {
    id: string,
    version: number,
    name: string,
    label?: string,
    fields?: (FieldDefinition|GroupDefinition)[],
    type: string, //GroupedForm || SelectionLists
    card?: boolean,
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
    section: string, //History.3
    order?: string, //order used for pre tests
    starable?: boolean,
    relatedExams?: string[],
    scrollable?: boolean,
    layout?: any,
    signable? :boolean,
    showSubtitles? :boolean
}

export type ExamPredefinedValue = {
  id: string,
  version: number,
  customExamDefinitionId: string, //TODO: wais
  name: string,
  predefinedValue: any,
  userId?: string,
  order?: number
}

export type Exam = {
    id: string,
    visitId: string,
    version: number,
    errors?: string[],
    definition: ExamDefinition,
    hasStarted: boolean,
    isDirty?: boolean,
    isHidden?: boolean
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

export type Upload = {
  id: string,
  data: string, //base64 encoded for binary data
  name: string,
  date?: string,
  mimeType: string,
  argument1?: string,
  argument2?: string,
}

export type PatientDocument = {
  id: string,
  patientId: string,
  postedOn: string,
  name: string,
  category: string,
  uploadId: string,
}

export type TranslationDefinition = {
  id: string,
  fieldId: string,
  language: string,
  label: ?string,
  normalValue: ?string
}
