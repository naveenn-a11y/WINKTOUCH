/**
 * @flow
 */
'use strict';

import LocalizedStrings from 'react-native-localization';

export const strings = new LocalizedStrings({
    en: {
      today: 'Today',
      patients: 'Patients',
      back: 'Back',
      bookNewAppointment: 'Book new appointment',
      lastName: 'Last name',
      firstName: 'First name',
      streetNumber: 'House number',
      streetName: 'Street',
      city: 'City',
      postalCode: 'Postal code',
      country: 'Country',
      phoneNr: 'Phone',
      cellPhoneNr: 'Cellphone',
      email:'Email',
      minLengthError: 'The minimum length is {0} characters.',
      maxLengthError: 'The maximum length is {0} characters.',
      newPatient: 'New patient',
      complaint: 'Complaint',
      visualAcuityTest: 'Visual acuity',
      coverTest: 'Cover',
      reviewOfSystems: 'ROS',
      retinoscopyTest: 'Retinoscopy',
      refractionTest: 'Refraction',
      visualFieldTest: 'Visual field',
      glaucomaExam: 'Glaucoma',
      slitLampExam: 'Slit lamp',
      wearingRx: 'Wearing Rx',
      medicalHistory: 'Medical history',
      familyHistory: 'Family history',
      socialHistory: 'Social history',
      wearingRefraction: 'Wearing glasses',
      previousRefraction: 'Previous Rx',
      phoropterRefraction: 'Phoropter',
      autoRefraction: 'Auto Refractor',
      retinoscopeRefraction: 'Retinoscope',
      cyclopegicRefraction: 'Cyclopegic',
      finalRefraction: 'Final refraction',
      medications: 'Medications',
      allergies: 'Allergies',
      medicalProcedures: 'Medical History',
      relationDiseases: 'Family History',
      complaints: 'Complaints',
      preExams:'Pre Exams',
      exams: 'Exams'
    },
    fr: {
      today: 'Aujourd\'hui',
      patients: 'Patients',
      back: 'Retour',
      bookNewAppointment: 'Nouveau rendez-vous',
      lastName: 'Nom',
      firstName: 'Prénom',
      streetName: 'Rue',
      minLengthError: 'La longueur minimale est de {0} caractères.',
      wearingRx: 'Lunettes portants',
      previousRefraction: 'Dernière prescription',
      wearingRefraction: 'Lunettes portants',
      medications: 'Médicaments',
      allergies: 'Allergies'
    },
});

console.log('Interface language is: '+strings.getInterfaceLanguage());
//strings.setLanguage('fr');
