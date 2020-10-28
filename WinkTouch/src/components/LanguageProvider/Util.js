import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import memoize from 'lodash.memoize';
import Moment from 'moment';

const translationGetters = {
  en: () => require('../../translations/en.json'),
  fr: () => require('../../translations/fr.json'),
};

export const translate = memoize(
  (key, config) => i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key),
);

export const setI18nConfig = () => {
  const fallback = {languageTag: 'en'};
  const {languageTag} =
    RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) ||
    fallback;

  translate.cache.clear();

  i18n.translations = {[languageTag]: translationGetters[languageTag]()};
  i18n.locale = languageTag;
};

const supportedLanguages: string[] = [
  'en-US',
  '🇺🇸',
  'en-CA',
  '🇨🇦',
  'en-UK',
  '🇬🇧',
  'fr-CA',
  '🇫🇷',
];

let userLanguage: string;
export function getUserLanguage(): string {
  return userLanguage;
}

export function getUserLanguageIcon(): string {
  let languageIndex: number = supportedLanguages.indexOf(getUserLanguage());
  if (languageIndex < 0) languageIndex = 0;
  return supportedLanguages[languageIndex + 1];
}

export function getUserLanguageShort(): string {
  if (userLanguage === undefined) return undefined;
  return userLanguage.substring(0, 2);
}

async function setUserLanguage(locale: string) {
  console.log('Switching language to ' + locale);
  userLanguage = locale;
  i18n.locale = userLanguage.substring(0, 2);
  Moment.locale(userLanguage.substring(0, 2));
  //TODO: set number formatting localised
  // cacheDefinitions(userLanguage);
}
