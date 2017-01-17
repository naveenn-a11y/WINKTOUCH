/**
 * @flow
 */
'use strict';

export type RestResponse = {
    response: any
}

export type Patient = {
    id: number,
    firstName: string,
    lastName: string
}

export type PatientInfo = {
    id: number,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    phone: string,
    cell: string,
    streetName: string,
    city: string,
    country: string,
    medicalCard: string,
    medicalcardExp: string,
    postalCode: string,
    email: string,
    province: string,
    gender: number,
    streetNumber: string
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
  }
}
