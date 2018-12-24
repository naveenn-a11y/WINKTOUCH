/**
 * @flow
 */
'use strict';

import { AsyncStorage } from 'react-native';
import LocalizedStrings from 'react-native-localization';
import Moment from 'moment';
import { cacheDefinitions } from './Items';

export const strings = new LocalizedStrings({
    en: {
      enterRegisteredEmail: 'Please enter the email adres you used to register Wink PMS',
      emailAdres: 'Email adress',
      submitEmail: 'Send',
      answerSecurityQuestion: 'Please answer the security question before submitting',
      submitSecurityAnswer: 'Send',
      unRegisteredEmail: 'This email adress was not registered before',
      userName: 'User name',
      password: 'password',
      submitLogin: 'Login',
      touchNotConfigured: 'Your account is not set up to use the mobile app yet. Please contact customer support.',
      registrationScreenTitle: 'Wink Touch registration',
      loginscreenTitle: 'Wink Touch login',
      account: 'Account',
      store: 'Store',
      securityQuestionsError: 'Something went wrong trying to get the secuirty question from the server. Please try again.',
      registrationError: 'Something went wrong trying to get the app version from the server. Please try again.',
      fetchAccountsError: 'Something went wrong trying to get the accounts from the server. Please try again.',
      loginFailed: 'Login failed',
      agenda: 'Agenda',
      patients: 'Patients',
      back: 'Back',
      graph: 'Graph',
      history: 'History',
      template: 'Template',
      templates: 'Templates',
      settings: 'Settings',
      logout: 'Logout',
      bookNewAppointment: 'Book new appointment',
      newPatient: 'New patient',
      preExams:'Pre test',
      exams: 'Exams',
      odSphere: 'OD Sphere',
      odCylinder: 'OD Cylinder',
      odAxis: 'OD Axis',
      odBase: 'OD Base',
      odPrism: 'OD Prism',
      odAdd: 'OD Add',
      osSphere: 'OS Sphere',
      osCylinder: 'OS Cylinder',
      osAxis: 'OS Axis',
      osBase: 'OS Base',
      osPrism: 'OS Prism',
      osAdd: 'OS Add',
      allNormal: 'All normal',
      paperForm: 'Paper form',
      predefinedOptions: 'Predefined options',
      selectionLists:'Selection lists',
      groupedForm:'Grouped form',
      refractionTest:'Refraction test',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      extraLarge: 'Extra large',
      duplicate: 'Duplicate',
      startNewVisit: 'Start new visit',
      existingAppointmentWarning: 'Select the existing appointment for the patient to start the visit, or create a new visit.',
      serverError: 'Something went wrong on the server. Please try again.',
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      noShow: 'No show',
      waiting: 'Waiting',
      completed: 'Completed',
      start: 'Start',
      scheduledAt: 'Scheduled at',
      forDuration: 'for',
      end: 'End',
      duration: 'Duration',
      minutes: 'minutes',
      minute: 'minute',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      halfAnHour: 'half an hour',
      status: 'Status',
      doctor: 'Doctor',
      now: 'Now',
      endVisit: 'End visit',
      years: '',
      ageM: 'age',
      ageF: 'age',
      recall: 'Recall',
      noAccountsWarning: 'There are no accounts compatible with this version of WinkTouch.',
      sign: 'Sign',
      diagnosis: 'Diagnosis',
      referral: 'Referral',
      finalRx: 'Final Rx',
      printRx: 'Print Rx',
      printReferral: 'Print Referral',
      add: 'Add',
      remove: 'Remove',
      od: 'OD',
      os: 'OS',
      maxLengthError: 'Too much text',
      minLengthError: 'Not enough text',
      requiredError: 'Obligatory',
      resume: 'Summary',
      restart: 'Restart',
      addFavorite: 'Add favorite',
      clear: 'Clear',
      favorites: 'Common',
      notStarted: 'Not started',
      copyToFinal: 'Final Rx',
      update: 'Update'
    },
    fr: {
      enterRegisteredEmail: 'Veuillez mettre l\'adresse e-mail que vous avez utilisée pour enregistrer votre compte chez Wink',
      emailAdres: 'Adresse e-mail',
      submitEmail: 'Envoyer',
      answerSecurityQuestion: 'Veuillez répondre à la question de sécurité avant de soumettre la réponse',
      submitSecurityAnswer: 'Soumettre',
      unRegisteredEmail: 'Cette adresse e-mail n\'a pas été enregistrée par avant',
      userName: 'Nom d\'utilisateur',
      password: 'Mot de passe',
      submitLogin: 'Ouverture de la session',
      touchNotConfigured: 'Votre compte n\'est pas configuré pour utiliser l\'application mobile dans cet instant. Veuillez contacter le service à la clientèle',
      registrationScreenTitle: 'Registration Wink Touch',
      loginscreenTitle: 'S\'identifier à Wink Touch',
      account: 'Compte',
      store: 'Magasin',
      securityQuestionsError: 'Une erreur interne s\'est produite en cherchant les questions de sécurité. Veuillez réessayer.',
      registrationError: 'Une erreur interne s\'est produite en cherchant la version de l\'application mobile. Veuillez réessayer.',
      fetchAccountsError: 'Une erreur interne s\'est produite en cherchant vos comptes. Veuillez réessayer.',
      loginFailed: 'Erreur d\'authentification',
      agenda: 'Agenda',
      patients: 'Patients',
      back: 'Back',
      graph: 'Graphique',
      history: 'Historique',
      template: 'Modèle',
      templates: 'Modèles',
      settings: 'Paramètres',
      logout: 'Déconnect',
      startNewVisit: 'Commence une nouvelle visite',
      preExams:'Prétests',
      exams:'Examens',
      existingAppointmentWarning: 'Commencez le rendez-vous existant ou créez une nouvelle visite.',
      serverError: 'Une erreur s\'est produite sur le serveur. Veuillez réessayer.',
      pending: 'En attente',
      confirmed: 'confirmé',
      cancelled: 'Annulé',
      noShow: 'Pas présent',
      waiting: 'En attente',
      completed: 'Terminé',
      start: 'Début',
      scheduledAt: 'Planifié à',
      forDuration: 'pour',
      end: 'Fin',
      duration: 'Durée',
      minutes: 'minutes',
      minute: 'minute',
      hour: 'heure',
      hours: 'heures',
      day: 'jour',
      days: 'jours',
      halfAnHour: 'une demi-heure',
      status: 'Statut',
      doctor: 'Docteur',
      now: 'Maintenant',
      endVisit: 'Conclure la visite',
      years: 'ans',
      ageM: 'âgé de',
      ageF: 'âgée de',
      recall: 'Rappel',
      noAccountsWarning: 'Il n\'y a pas des comptes accessible avec cette version de WinkTouch.',
      sign: 'Signer',
      diagnosis: 'Diagnostique',
      referral: 'Référence',
      printRx: 'Imprimer Rx',
      printReferral: 'Imprimer Référence',
      add: 'Ajouter',
      remove: 'Suprimer',
      od: 'OD',
      os: 'OG',
      maxLengthError: 'Trop de texte',
      minLengthError: 'Pas assez de texte',
      requiredError: 'Obligatoire',
      resume: 'Résumé',
      finalRx: 'Rx Finale',
      restart: 'Redémarrer',
      addFavorite: 'Add favorite',
      clear: 'Supprimer',
      favorites: 'Populaire',
      notStarted: 'Pas commencé',
      copyToFinal: 'Rx finale',
      update: 'Confirmer'
    },
});

//console.log('Interface language is: '+strings.getInterfaceLanguage());

export function getUserLanguage() : string {
  return strings.getLanguage();
}

async function setUserLanguage(userLanguage: string) {
  strings.setLanguage(userLanguage);
  Moment.locale(userLanguage);
  //TODO: set number formatting localised
  cacheDefinitions(userLanguage);
}

export function switchLanguage() {
  let language = strings.getLanguage();
  if (language.startsWith('en'))
    language = 'fr';
  else
    language = 'en';
  AsyncStorage.setItem('userLanguage', language);
  setUserLanguage(language);
}

AsyncStorage.getItem('userLanguage').then(
  userLanguage => {
    if (userLanguage===null || userLanguage===undefined) userLanguage = strings.getInterfaceLanguage();
    setUserLanguage(userLanguage.substring(0, 2));
  }
);
