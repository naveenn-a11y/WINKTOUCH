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
      maxLengthError: 'The maximum length is {0} characters.'
    },
    fr: {
      today: 'Aujourd\'hui',
      patients: 'Patients',
      back: 'Retour',
      bookNewAppointment: 'Nouveau rendez-vous',
      lastName: 'Nom',
      firstName: 'Prénom',
      streetName: 'Rue',
      minLengthError: 'La longeur minimal est de {0} caracters.'
    },
});

console.log('Interface language is: '+strings.getInterfaceLanguage());
strings.setLanguage('fr');
