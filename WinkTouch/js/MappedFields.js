/**
 * @flow
 */
'use strict';

import type {FieldDefinition} from './Types';

export const MappedFields : string[] = [
    'prescription.OD.sph',
    'prescription.OD.axis',
    'prescription.OD.cyl',
    'prescription.OD.add',
    'prescription.OS.sph',
    'prescription.OS.axis',
    'prescription.OS.cyl',
    'prescription.OS.add',
    'patient.firstName',
    'patient.lastName',
    'visit.start',
    'drugs[x].dose',
    'drugs[x].datePrescribed'
  ];
