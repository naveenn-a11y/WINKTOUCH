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
      enterRegisteredEmail: 'Please enter the email adress you used to register Wink PMS',
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
      patients: 'Patient',
      back: 'Back',
      graph: 'Graph',
      history: 'History',
      template: 'Template',
      templates: 'Templates',
      settings: 'Settings',
      walkIn: 'Walk-in',
      openFile: 'Patient file',
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
      startNewVisit: 'Start new consultation',
      existingAppointmentWarning: 'Select the existing appointment for the patient to start the consultation, or create a new consultation.',
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
      today: 'Today',
      yesterday: 'Yesterday',
      beforeYesterday: 'Before yesterday',
      tomorrow: 'Tomorrow',
      in2Days: 'In 2 days',
      endVisit: 'End consultation',
      years: '',
      ageM: 'age',
      ageF: 'age',
      recall: 'Recall',
      noAccountsWarning: 'There are no accounts compatible with this version of WinkTouch.',
      sign: 'Sign',
      signed: 'Signed',
      diagnosis: 'Diagnosis',
      referral: 'Referral',
      finalRx: 'Final Rx',
      printRx: 'Print Rx',
      printClRx: 'Print Cl',
      printReferral: 'Print Referral',
      add: 'Add',
      remove: 'Remove',
      od: 'OD',
      os: 'OS',
      maxLengthError: 'Too much text',
      minLengthError: 'Not enough text',
      requiredError: 'Mandatory',
      resume: 'Summary',
      restart: 'Restart',
      addFavorite: 'Add favorite',
      clear: 'Clear',
      favorites: 'Common',
      notStarted: 'New exam',
      copyToFinal: 'Final Rx',
      update: 'Update',
      errorTitle: 'Error',
      errorsTitle: 'Errors',
      validationErrorMessage: 'Please verify all fields contain valid values.',
      refractionTitle: 'Rx',
      removeExamError: 'Please clear all the exam data before removing an exam.',
      unsupportedDocumentError: 'Document {0} can not be displayed.',
      documentTrailTitle: '{0}',
      medicationRxTitle: 'Medication Rx',
      summaryTitle: 'Summary',
      fetchItemError: 'Something went wrong trying to get {0} data from the server. Please try again.',
      storeItemError:  'Something went wrong trying to save {0} data on the server.',
      maximumAddableGroupError: 'You can not add more then {0} {1}.',
      doctorWithoutVisitTypeError: 'Doctor {0} is not set up for the EHR yet in the database.',
      searchCriteriumMissingError: 'Please enter a search criterium.',
      noPatientsFound: 'No patients found'
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
      patients: 'Patient',
      back: 'Back',
      graph: 'Graphique',
      history: 'Historique',
      template: 'Modèle',
      templates: 'Modèles',
      settings: 'Paramètres',
      walkIn: 'Sans rendez-vous',
      openFile: 'Dossier patient',
      logout: 'Déconnect',
      startNewVisit: 'Commence une nouvelle consultation',
      preExams:'Prétests',
      exams:'Examens',
      existingAppointmentWarning: 'Commencez le rendez-vous existant ou créez une nouvelle consultation.',
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
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      beforeYesterday: 'Avant hier',
      tomorrow: 'Demain',
      in2Days: 'Dans 2 jours',
      endVisit: 'Conclure la consultation',
      years: 'ans',
      ageM: 'âgé de',
      ageF: 'âgée de',
      recall: 'Rappel',
      noAccountsWarning: 'Il n\'y a pas des comptes accessible avec cette version de WinkTouch.',
      sign: 'Signer',
      signed: 'Signé',
      diagnosis: 'Diagnostique',
      referral: 'Référence',
      printRx: 'Imprimer Rx',
      printClRx: 'Imprimer LC',
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
      notStarted: 'Nouvel examen',
      copyToFinal: 'Rx finale',
      update: 'Confirmer',
      errorTitle: 'Erreur',
      errorsTitle: 'Erreurs',
      validationErrorMessage: 'Veuillez vèrifier que tout les champs ont des valeurs valide.',
      refractionTitle: 'Rx',
      removeExamError: 'Veuillez effacer tout les données avant de supprimer l\'exam',
      unsupportedDocumentError: 'Document {0} n\'est pas supporté.',
      documentTrailTitle: '{0}',
      medicationRxTitle: 'Medication Rx',
      summaryTitle: 'Résumé',
      fetchItemError: 'Something went wrong trying to get {0} data from the server. Please try again.',
      storeItemError:  'Something went wrong trying to save {0} data on the server.',
      maximumAddableGroupError: 'Vous ne pouvez pas ajouter plus que {0} {1}.',
      doctorWithoutVisitTypeError: 'Docteur {0} n\'est pas encore configuré pour utiliser l\'application mobile.',
      searchCriteriumMissingError: 'Veuillez entrez un critère pour la recherche.',
      noPatientsFound: 'Aucun patient trouvé'
    },
});

//console.log('Interface language is: '+strings.getInterfaceLanguage());

const supportedLanguages : string[] = ['en-US','🇺🇸','en-CA','🇨🇦','fr-CA','🇫🇷'];

let userLanguage : string;

export function getUserLanguage() : string {
  //return strings.getLanguage();
  return userLanguage;
}

export function getUserLanguageIcon() : string {
  let languageIndex : number = supportedLanguages.indexOf(getUserLanguage());
  return supportedLanguages[languageIndex+1];
}

async function setUserLanguage(locale: string) {
  console.log('Switching language to '+locale);
  userLanguage = locale;
  strings.setLanguage(userLanguage.substring(0, 2));
  Moment.locale(userLanguage.substring(0, 2));
  //TODO: set number formatting localised
  cacheDefinitions(userLanguage);
}

export function switchLanguage() {
  let language = getUserLanguage();
  console.log('current language = '+language);
  let languageIndex = supportedLanguages.indexOf(language);
  languageIndex = (languageIndex+2)%supportedLanguages.length;
  language = supportedLanguages[languageIndex];
  AsyncStorage.setItem('userLanguage', language);
  setUserLanguage(language);
}

AsyncStorage.getItem('userLanguage').then(
  userLanguage => {
    if (userLanguage===null || userLanguage===undefined) userLanguage = strings.getInterfaceLanguage();
    //setUserLanguage(userLanguage.substring(0, 2));
    setUserLanguage(userLanguage);
  }
);
