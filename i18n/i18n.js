import {I18n} from 'react-i18nify';
import en from '../cloud/locales/en';
import he from '../cloud/locales/he';
import moment from 'moment';

function setLanguageToLocalStorage(lang) {
  localStorage.setItem('medidate_lang', lang);
}

function getLanguageToLocalStorage() {
  return localStorage.getItem('medidate_lang');
}

function selectTempLanguage(lang) {
  I18n.setLocale(lang, true);
  moment.locale(lang);
}

I18n.setLanguage = ((lang) => {
  console.log('setLanguage', lang)
  if(lang != 'en' && lang != 'he')
  lang = 'en'

  I18n.setLocale(lang, true);
  moment.locale(lang);
  setLanguageToLocalStorage(lang);

  return lang;
});

I18n.setTempLanguage = ((lang) => {
  console.log('setTempLanguage', lang)
  if(lang != 'en' && lang != 'he')
  lang = 'en'

  I18n.setLocale(lang, false);
  moment.locale(lang);

  return lang;
});

I18n.toggleLanguage = () => {
  console.log('toggle')
  I18n.setLanguage(I18n._localeKey === 'he' ? 'en' : 'he');
}

I18n.setTranslations({en, he});
var initLocale = getLanguageToLocalStorage() || 'en';
I18n.setLanguage(initLocale)

window.I18n = I18n;
