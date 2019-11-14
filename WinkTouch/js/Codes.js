/**
 * @flow
 */
'use strict';

import type { CodeDefinition, FieldDefinition, FieldDefinitions, GroupDefinition } from './Types';
import { strings, getUserLanguage } from './Strings';
import { restUrl, handleHttpError, searchItems, getNextRequestNumber } from './Rest';
import { getFieldDefinitions } from './Items';
import { initialiseWinkCodes } from './codes/WinkDefinedCodes';
import { initialiseUserCodes } from './codes/UserDefinedCodes';
import { passesFilter } from './Util';

export function formatCodeDefinition(option: ?CodeDefinition, codeIdentifier?: string) : string {
  if (option===undefined || option===null) return '';
  if (option.description !== undefined)
    option = option.description;
  else if (option.key!==undefined)
    option = strings[option.key];
  else {
    if (codeIdentifier===undefined || codeIdentifier===null) {
      codeIdentifier = 'code';
    }
    if (option[codeIdentifier]!==undefined) {
      option = option[codeIdentifier];
    }
  }
  if (option===undefined || option===null) return '';
  option = option.toString();
  return option;
}

export function formatCode(codeType: string, code?: string|number) : string {
  if (code===undefined || code===null) return '';
  let codeDefinition :?CodeDefinition = getAllCodes(codeType).find(x => (x.code!==undefined && x.code === code) || (x.code===undefined && x === code));
  if (codeDefinition===undefined) {
    return code.toString();
  }
  return formatCodeDefinition(codeDefinition);
}

export function formatOption(dataType: string, field: string, code: ?string|?number) : string {
  if (code === undefined || code===null) return '';
  const fieldDefinitions : ?FieldDefinitions = getFieldDefinitions(dataType);
  if (fieldDefinitions===undefined || fieldDefinitions===null) return code.toString();
  const fieldDefinition : ?FieldDefinition|GroupDefinition = fieldDefinitions.find((fieldDefinition: FieldDefinition|GroupDefinition) => fieldDefinition.name === field);
  if (fieldDefinition === undefined || fieldDefinition === null) return code.toString();
  const options : ?CodeDefinition[]|string = fieldDefinition.options;
  if (options === undefined || options === null) return code.toString();
  if (options instanceof Array) {
    const formattedOption = formatCodeDefinition(options.find((codeDefinition: CodeDefinition) => (codeDefinition.code===undefined && codeDefinition===code)||(codeDefinition.code!==undefined && codeDefinition.code===code)));
    return formattedOption;
  } else {
    const formattedOption = formatCode(options, code);
    return formattedOption;
  }
}

export function formatOptions(options: CodeDefinition[][]|CodeDefinition[], descriptionIdentifier?: string) : (string[]|string)[] {
  if (!options || options.length===0) return [];
  let formattedOptions : (string[]|string)[] = [];
  if (options[0] instanceof Array) {
    formattedOptions = options.map(subOptions => formatOptions(subOptions, descriptionIdentifier));
  } else {
    const includedOptions = new Set();
    options.forEach(option => {
      const formattedOption :string = formatCodeDefinition(option, descriptionIdentifier);
      if (!includedOptions.has(formattedOption.trim().toLowerCase())) {
        includedOptions.add(formattedOption.trim().toLowerCase());
        formattedOptions.push(formattedOption);
      }
    });
  }
  return formattedOptions;
}

export function getAllCodes(codeType: string, filter?: {}) : CodeDefinition[] {
  if (codeType.includes('.')) {
    const identifiers : string = codeType.split('.');
    codeType = identifiers[0];
  }
  let allCodes : CodeDefinition[] = codeDefinitions[codeType];
  if (allCodes===undefined) {
    __DEV__ && console.warn('No codes defined for '+codeType);
    return [];
  } else {
    if (filter) {
       allCodes = allCodes.filter((codeDefinition: CodeDefinition) => passesFilter(codeDefinition, filter));
    }
  }
  return allCodes;
}

export function formatAllCodes(codeType: string, filter?: {}) : string[] {
  let codeIdentifier = 'code';
  if (codeType.includes('.')) {
    const identifiers : string = codeType.split('.');
    codeType = identifiers[0];
    codeIdentifier = identifiers[1];
  }
  const options = getAllCodes(codeType, filter);
  const formattedCodes : (string[]|string)[] = formatOptions(options, codeIdentifier);
  return formattedCodes;
}

export function parseCode(codeType: string, input: string, codeIdentifier?: string): ?(string|number) {
  if (input===undefined || input===null) return undefined;
  let trimmedInput = input.trim().toLowerCase();
  if (codeIdentifier===undefined || codeIdentifier===null) {
    codeIdentifier = 'code';
  }
  let codeDefinition : CodeDefinition = getAllCodes(codeType).find((codeDefinition: CodeDefinition) =>
    formatCodeDefinition(codeDefinition, codeIdentifier).trim().toLowerCase() === trimmedInput);
  let code = input;
  if (codeDefinition!==undefined && codeDefinition!==null) {
    if (codeDefinition instanceof Object) {
      code = codeDefinition[codeIdentifier];
    } else {
      code  = codeDefinition;
    }
  }
  return code;
}

export async function fetchCodeDefinitions(language: string, accountId: number) : {[codeName: string]: CodeDefinition} {
  if (accountId===undefined) return undefined;
  const requestNr : number = getNextRequestNumber();
  const url = restUrl +'/Code/list?accountId='+accountId.toString();
  __DEV__ && console.log('REQ '+requestNr+' fetch codes in '+language+": "+url);
  try {
    let httpResponse = await fetch(url, {
        method: 'get',
        headers: {
          'Accept': 'application/json',
          'Accept-language': language
        },
    });
    if (!httpResponse.ok) handleHttpError(httpResponse);
    __DEV__ && console.log('RES '+requestNr+' fetch codes in '+language+": "+url);
    if (language!=getUserLanguage()) {
      __DEV__ && console.log('Language changed to '+getUserLanguage()+', discarding '+language+' codes.');
      return;
    }
    let translatedCodeDefinitions  = await httpResponse.json();
    //__DEV__ && console.log(JSON.stringify(translatedCodeDefinitions));
    codeDefinitions = Object.assign(codeDefinitions, translatedCodeDefinitions);
  } catch (error) {
    console.log(error);
    alert('Something went wrong trying to get code descriptions from the server. Please restart the app.');
    throw(error);
  }
}

export async function fetchUserDefinedCodes() : void {
  const searchCriteria = {};
  let restResponse = await searchItems('Code/UserDefined/list', searchCriteria);
  Object.keys(restResponse).forEach((codeName: string) => {
      if (codeName!='errors') {
        codeDefinitions[codeName]=restResponse[codeName];
      }
    });

  //let userDefinedCodes : string[] = restResponse.codes;

  //cacheItem('visitTypes', visitTypes);
}

let codeDefinitions = {
  "size": [{code: 'S', key: 'small'}, {code: 'M', key: 'medium'}, {code: 'L', key:'large'}, {code: 'XL', key:'extraLarge'}],
  "examDefinitionType" : [{code: 'selectionLists', description:'Selection lists'}, {code: 'groupedForm', description:'Grouped form'}, {code: 'paperForm', description:'Paper form'}, {code:'refractionTest', description:'Refraction tests'}],
  "procedureCode": [{code: 1, description:'Cover test'}, {code: 2, decsription:'Slit lamp exam'}],
  "recallCode": [
    {
      "description": "Year(s)",
      "code": 0
    },
    {
      "description": "Month(s)",
      "code": 1
    },
    {
      "description": "Week(s)",
      "code": 2
    },
    {
      "description": "Day(s)",
      "code": 3
    }
  ],
  "prism1b": [
    {
      "description": "In",
      "code": 0
    },
    {
      "description": "Out",
      "code": 1
    }
  ],
  "countryCode": [
    {
      "description": "CANADA",
      "code": 1
    },
    {
      "description": "USA",
      "code": 2
    },
    {
      "description": "MEXICO",
      "code": 3
    },
    {
      "description": "FRANCE",
      "code": 4
    },
    {
      "description": "INDIA",
      "code": 5
    },
    {
      "description": "IRELAND",
      "code": 6
    },
    {
      "description": "AFGHANISTAN",
      "code": 7
    },
    {
      "description": "ALAND ISLANDS",
      "code": 8
    },
    {
      "description": "ALBANIA",
      "code": 9
    },
    {
      "description": "ALGERIA",
      "code": 10
    },
    {
      "description": "AMERICAN SAMOA",
      "code": 11
    },
    {
      "description": "ANDORRA",
      "code": 12
    },
    {
      "description": "ANGOLA",
      "code": 13
    },
    {
      "description": "ANGUILLA",
      "code": 14
    },
    {
      "description": "ANTARCTICA",
      "code": 15
    },
    {
      "description": "ANTIGUA AND BARBUDA",
      "code": 16
    },
    {
      "description": "ARGENTINA",
      "code": 17
    },
    {
      "description": "ARMENIA",
      "code": 18
    },
    {
      "description": "ARUBA",
      "code": 19
    },
    {
      "description": "AUSTRALIA",
      "code": 20
    },
    {
      "description": "AUSTRIA",
      "code": 21
    },
    {
      "description": "AZERBAIJAN",
      "code": 22
    },
    {
      "description": "BAHAMAS",
      "code": 23
    },
    {
      "description": "BAHRAIN",
      "code": 24
    },
    {
      "description": "BANGLADESH",
      "code": 25
    },
    {
      "description": "BARBADOS",
      "code": 26
    },
    {
      "description": "BELARUS",
      "code": 27
    },
    {
      "description": "BELGIUM",
      "code": 28
    },
    {
      "description": "BELIZE",
      "code": 29
    },
    {
      "description": "BENIN",
      "code": 30
    },
    {
      "description": "BERMUDA",
      "code": 31
    },
    {
      "description": "BHUTAN",
      "code": 32
    },
    {
      "description": "BOLIVIA  PLURINATIONAL STATE OF",
      "code": 33
    },
    {
      "description": "BONAIRE  SINT EUSTATIUS AND SABA",
      "code": 34
    },
    {
      "description": "BOSNIA AND HERZEGOVINA",
      "code": 35
    },
    {
      "description": "BOTSWANA",
      "code": 36
    },
    {
      "description": "BOUVET ISLAND",
      "code": 37
    },
    {
      "description": "BRAZIL",
      "code": 38
    },
    {
      "description": "BRITISH INDIAN OCEAN TERRITORY",
      "code": 39
    },
    {
      "description": "BRUNEI DARUSSALAM",
      "code": 40
    },
    {
      "description": "BULGARIA",
      "code": 41
    },
    {
      "description": "BURKINA FASO",
      "code": 42
    },
    {
      "description": "BURUNDI",
      "code": 43
    },
    {
      "description": "CAMBODIA",
      "code": 44
    },
    {
      "description": "CAMEROON",
      "code": 45
    },
    {
      "description": "CAPE VERDE",
      "code": 46
    },
    {
      "description": "CAYMAN ISLANDS",
      "code": 47
    },
    {
      "description": "CENTRAL AFRICAN REPUBLIC",
      "code": 48
    },
    {
      "description": "CHAD",
      "code": 49
    },
    {
      "description": "CHILE",
      "code": 50
    },
    {
      "description": "CHINA",
      "code": 51
    },
    {
      "description": "CHRISTMAS ISLAND",
      "code": 52
    },
    {
      "description": "COCOS (KEELING) ISLANDS",
      "code": 53
    },
    {
      "description": "COLOMBIA",
      "code": 54
    },
    {
      "description": "COMOROS",
      "code": 55
    },
    {
      "description": "CONGO",
      "code": 56
    },
    {
      "description": "CONGO  THE DEMOCRATIC REPUBLIC OF THE",
      "code": 57
    },
    {
      "description": "COOK ISLANDS",
      "code": 58
    },
    {
      "description": "COSTA RICA",
      "code": 59
    },
    {
      "description": "COTE D'IVOIRE",
      "code": 60
    },
    {
      "description": "CROATIA",
      "code": 61
    },
    {
      "description": "CUBA",
      "code": 62
    },
    {
      "description": "CURA?AO",
      "code": 63
    },
    {
      "description": "CYPRUS",
      "code": 64
    },
    {
      "description": "CZECH REPUBLIC",
      "code": 65
    },
    {
      "description": "DENMARK",
      "code": 66
    },
    {
      "description": "DJIBOUTI",
      "code": 67
    },
    {
      "description": "DOMINICA",
      "code": 68
    },
    {
      "description": "DOMINICAN REPUBLIC",
      "code": 69
    },
    {
      "description": "ECUADOR",
      "code": 70
    },
    {
      "description": "EGYPT",
      "code": 71
    },
    {
      "description": "EL SALVADOR",
      "code": 72
    },
    {
      "description": "EQUATORIAL GUINEA",
      "code": 73
    },
    {
      "description": "ERITREA",
      "code": 74
    },
    {
      "description": "ESTONIA",
      "code": 75
    },
    {
      "description": "ETHIOPIA",
      "code": 76
    },
    {
      "description": "FALKLAND ISLANDS (MALVINAS)",
      "code": 77
    },
    {
      "description": "FAROE ISLANDS",
      "code": 78
    },
    {
      "description": "FIJI",
      "code": 79
    },
    {
      "description": "FINLAND",
      "code": 80
    },
    {
      "description": "FRENCH GUIANA",
      "code": 81
    },
    {
      "description": "FRENCH POLYNESIA",
      "code": 82
    },
    {
      "description": "FRENCH SOUTHERN TERRITORIES",
      "code": 83
    },
    {
      "description": "GABON",
      "code": 84
    },
    {
      "description": "GAMBIA",
      "code": 85
    },
    {
      "description": "GEORGIA",
      "code": 86
    },
    {
      "description": "GERMANY",
      "code": 87
    },
    {
      "description": "GHANA",
      "code": 88
    },
    {
      "description": "GIBRALTAR",
      "code": 89
    },
    {
      "description": "GREECE",
      "code": 90
    },
    {
      "description": "GREENLAND",
      "code": 91
    },
    {
      "description": "GRENADA",
      "code": 92
    },
    {
      "description": "GUADELOUPE",
      "code": 93
    },
    {
      "description": "GUAM",
      "code": 94
    },
    {
      "description": "GUATEMALA",
      "code": 95
    },
    {
      "description": "GUERNSEY",
      "code": 96
    },
    {
      "description": "GUINEA",
      "code": 97
    },
    {
      "description": "GUINEA-BISSAU",
      "code": 98
    },
    {
      "description": "GUYANA",
      "code": 99
    },
    {
      "description": "HAITI",
      "code": 100
    },
    {
      "description": "HEARD ISLAND AND MCDONALD ISLANDS",
      "code": 101
    },
    {
      "description": "HOLY SEE (VATICAN CITY STATE)",
      "code": 102
    },
    {
      "description": "HONDURAS",
      "code": 103
    },
    {
      "description": "HONG KONG",
      "code": 104
    },
    {
      "description": "HUNGARY",
      "code": 105
    },
    {
      "description": "ICELAND",
      "code": 106
    },
    {
      "description": "INDONESIA",
      "code": 107
    },
    {
      "description": "IRAN  ISLAMIC REPUBLIC OF",
      "code": 108
    },
    {
      "description": "IRAQ",
      "code": 109
    },
    {
      "description": "ISLE OF MAN",
      "code": 110
    },
    {
      "description": "ISRAEL",
      "code": 111
    },
    {
      "description": "ITALY",
      "code": 112
    },
    {
      "description": "JAMAICA",
      "code": 113
    },
    {
      "description": "JAPAN",
      "code": 114
    },
    {
      "description": "JERSEY",
      "code": 115
    },
    {
      "description": "JORDAN",
      "code": 116
    },
    {
      "description": "KAZAKHSTAN",
      "code": 117
    },
    {
      "description": "KENYA",
      "code": 118
    },
    {
      "description": "KIRIBATI",
      "code": 119
    },
    {
      "description": "KOREA  DEMOCRATIC PEOPLE'S REPUBLIC OF",
      "code": 120
    },
    {
      "description": "KOREA  REPUBLIC OF",
      "code": 121
    },
    {
      "description": "KUWAIT",
      "code": 122
    },
    {
      "description": "KYRGYZSTAN",
      "code": 123
    },
    {
      "description": "LAO PEOPLE'S DEMOCRATIC REPUBLIC",
      "code": 124
    },
    {
      "description": "LATVIA",
      "code": 125
    },
    {
      "description": "LEBANON",
      "code": 126
    },
    {
      "description": "LESOTHO",
      "code": 127
    },
    {
      "description": "LIBERIA",
      "code": 128
    },
    {
      "description": "LIBYA",
      "code": 129
    },
    {
      "description": "LIECHTENSTEIN",
      "code": 130
    },
    {
      "description": "LITHUANIA",
      "code": 131
    },
    {
      "description": "LUXEMBOURG",
      "code": 132
    },
    {
      "description": "MACAO",
      "code": 133
    },
    {
      "description": "MACEDONIA  THE FORMER YUGOSLAV REPUBLIC OF",
      "code": 134
    },
    {
      "description": "MADAGASCAR",
      "code": 135
    },
    {
      "description": "MALAWI",
      "code": 136
    },
    {
      "description": "MALAYSIA",
      "code": 137
    },
    {
      "description": "MALDIVES",
      "code": 138
    },
    {
      "description": "MALI",
      "code": 139
    },
    {
      "description": "MALTA",
      "code": 140
    },
    {
      "description": "MARSHALL ISLANDS",
      "code": 141
    },
    {
      "description": "MARTINIQUE",
      "code": 142
    },
    {
      "description": "MAURITANIA",
      "code": 143
    },
    {
      "description": "MAURITIUS",
      "code": 144
    },
    {
      "description": "MAYOTTE",
      "code": 145
    },
    {
      "description": "MICRONESIA  FEDERATED STATES OF",
      "code": 146
    },
    {
      "description": "MOLDOVA  REPUBLIC OF",
      "code": 147
    },
    {
      "description": "MONACO",
      "code": 148
    },
    {
      "description": "MONGOLIA",
      "code": 149
    },
    {
      "description": "MONTENEGRO",
      "code": 150
    },
    {
      "description": "MONTSERRAT",
      "code": 151
    },
    {
      "description": "MOROCCO",
      "code": 152
    },
    {
      "description": "MOZAMBIQUE",
      "code": 153
    },
    {
      "description": "MYANMAR",
      "code": 154
    },
    {
      "description": "NAMIBIA",
      "code": 155
    },
    {
      "description": "NAURU",
      "code": 156
    },
    {
      "description": "NEPAL",
      "code": 157
    },
    {
      "description": "NETHERLANDS",
      "code": 158
    },
    {
      "description": "NEW CALEDONIA",
      "code": 159
    },
    {
      "description": "NEW ZEALAND",
      "code": 160
    },
    {
      "description": "NICARAGUA",
      "code": 161
    },
    {
      "description": "NIGER",
      "code": 162
    },
    {
      "description": "NIGERIA",
      "code": 163
    },
    {
      "description": "NIUE",
      "code": 164
    },
    {
      "description": "NORFOLK ISLAND",
      "code": 165
    },
    {
      "description": "NORTHERN MARIANA ISLANDS",
      "code": 166
    },
    {
      "description": "NORWAY",
      "code": 167
    },
    {
      "description": "OMAN",
      "code": 168
    },
    {
      "description": "PAKISTAN",
      "code": 169
    },
    {
      "description": "PALAU",
      "code": 170
    },
    {
      "description": "PALESTINE  STATE OF",
      "code": 171
    },
    {
      "description": "PANAMA",
      "code": 172
    },
    {
      "description": "PAPUA NEW GUINEA",
      "code": 173
    },
    {
      "description": "PARAGUAY",
      "code": 174
    },
    {
      "description": "PERU",
      "code": 175
    },
    {
      "description": "PHILIPPINES",
      "code": 176
    },
    {
      "description": "PITCAIRN",
      "code": 177
    },
    {
      "description": "POLAND",
      "code": 178
    },
    {
      "description": "PORTUGAL",
      "code": 179
    },
    {
      "description": "PUERTO RICO",
      "code": 180
    },
    {
      "description": "QATAR",
      "code": 181
    },
    {
      "description": "REUNION",
      "code": 182
    },
    {
      "description": "ROMANIA",
      "code": 183
    },
    {
      "description": "RUSSIAN FEDERATION",
      "code": 184
    },
    {
      "description": "RWANDA",
      "code": 185
    },
    {
      "description": "SAINT BARTHELEMY",
      "code": 186
    },
    {
      "description": "SAINT HELENA  ASCENSION AND TRISTAN DA CUNHA",
      "code": 187
    },
    {
      "description": "SAINT KITTS AND NEVIS",
      "code": 188
    },
    {
      "description": "SAINT LUCIA",
      "code": 189
    },
    {
      "description": "SAINT MARTIN (FRENCH PART)",
      "code": 190
    },
    {
      "description": "SAINT PIERRE AND MIQUELON",
      "code": 191
    },
    {
      "description": "SAINT VINCENT AND THE GRENADINES",
      "code": 192
    },
    {
      "description": "SAMOA",
      "code": 193
    },
    {
      "description": "SAN MARINO",
      "code": 194
    },
    {
      "description": "SAO TOME AND PRINCIPE",
      "code": 195
    },
    {
      "description": "SAUDI ARABIA",
      "code": 196
    },
    {
      "description": "SENEGAL",
      "code": 197
    },
    {
      "description": "SERBIA",
      "code": 198
    },
    {
      "description": "SEYCHELLES",
      "code": 199
    },
    {
      "description": "SIERRA LEONE",
      "code": 200
    },
    {
      "description": "SINGAPORE",
      "code": 201
    },
    {
      "description": "SINT MAARTEN (DUTCH PART)",
      "code": 202
    },
    {
      "description": "SLOVAKIA",
      "code": 203
    },
    {
      "description": "SLOVENIA",
      "code": 204
    },
    {
      "description": "SOLOMON ISLANDS",
      "code": 205
    },
    {
      "description": "SOMALIA",
      "code": 206
    },
    {
      "description": "SOUTH AFRICA",
      "code": 207
    },
    {
      "description": "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS",
      "code": 208
    },
    {
      "description": "SOUTH SUDAN",
      "code": 209
    },
    {
      "description": "SPAIN",
      "code": 210
    },
    {
      "description": "SRI LANKA",
      "code": 211
    },
    {
      "description": "SUDAN",
      "code": 212
    },
    {
      "description": "SURINAME",
      "code": 213
    },
    {
      "description": "SVALBARD AND JAN MAYEN",
      "code": 214
    },
    {
      "description": "SWAZILAND",
      "code": 215
    },
    {
      "description": "SWEDEN",
      "code": 216
    },
    {
      "description": "SWITZERLAND",
      "code": 217
    },
    {
      "description": "SYRIAN ARAB REPUBLIC",
      "code": 218
    },
    {
      "description": "TAIWAN  PROVINCE OF CHINA",
      "code": 219
    },
    {
      "description": "TAJIKISTAN",
      "code": 220
    },
    {
      "description": "TANZANIA  UNITED REPUBLIC OF",
      "code": 221
    },
    {
      "description": "THAILAND",
      "code": 222
    },
    {
      "description": "TIMOR-LESTE",
      "code": 223
    },
    {
      "description": "TOGO",
      "code": 224
    },
    {
      "description": "TOKELAU",
      "code": 225
    },
    {
      "description": "TONGA",
      "code": 226
    },
    {
      "description": "TRINIDAD AND TOBAGO",
      "code": 227
    },
    {
      "description": "TUNISIA",
      "code": 228
    },
    {
      "description": "TURKEY",
      "code": 229
    },
    {
      "description": "TURKMENISTAN",
      "code": 230
    },
    {
      "description": "TURKS AND CAICOS ISLANDS",
      "code": 231
    },
    {
      "description": "TUVALU",
      "code": 232
    },
    {
      "description": "UGANDA",
      "code": 233
    },
    {
      "description": "UKRAINE",
      "code": 234
    },
    {
      "description": "UNITED ARAB EMIRATES",
      "code": 235
    },
    {
      "description": "UNITED KINGDOM",
      "code": 236
    },
    {
      "description": "UNITED STATES MINOR OUTLYING ISLANDS",
      "code": 237
    },
    {
      "description": "URUGUAY",
      "code": 238
    },
    {
      "description": "UZBEKISTAN",
      "code": 239
    },
    {
      "description": "VANUATU",
      "code": 240
    },
    {
      "description": "VENEZUELA  BOLIVARIAN REPUBLIC OF",
      "code": 241
    },
    {
      "description": "VIET NAM",
      "code": 242
    },
    {
      "description": "VIRGIN ISLANDS  BRITISH",
      "code": 243
    },
    {
      "description": "VIRGIN ISLANDS  U.S.",
      "code": 244
    },
    {
      "description": "WALLIS AND FUTUNA",
      "code": 245
    },
    {
      "description": "WESTERN SAHARA",
      "code": 246
    },
    {
      "description": "YEMEN",
      "code": 247
    },
    {
      "description": "ZAMBIA",
      "code": 248
    },
    {
      "description": "ZIMBABWE",
      "code": 249
    }
  ],
  "prism2b": [
    {
      "description": "Up",
      "code": 0
    },
    {
      "description": "Down",
      "code": 1
    }
  ],
  "appointmentStatusCode": [
    {
      "description": "Pending",
      "code": 0
    },
    {
      "description": "Confirmed",
      "code": 1
    },
    {
      "description": "Cancelled",
      "code": 2
    },
    {
      "description": "No show",
      "code": 3
    },
    {
      "description": "Waiting",
      "code": 4
    },
    {
      "description": "Completed",
      "code": 5
    }
  ],
  "genderCode": [
    {
      "description": "Male",
      "code": 0
    },
    {
      "description": "Female",
      "code": 1
    }
  ]
}

initialiseWinkCodes(codeDefinitions);
initialiseUserCodes(codeDefinitions);
