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
      addressLine1: 'Adress line 1',
      addressLine2: 'Adress line 2',
      addressLine3: 'Adress line 3',
      phoneNr: 'Phone',
      cellPhoneNr: 'Cellphone'
    },
    fr: {
      today: 'Aujourd\'hui',
      patients: 'Patients',
      back: 'Retour',
      bookNewAppointment: 'Nouveau rendez-vous',
      lastName: 'Nom',
      firstName: 'Prénom'
    },
});

console.log('Interface language is: '+strings.getInterfaceLanguage());
strings.setLanguage('fr');
