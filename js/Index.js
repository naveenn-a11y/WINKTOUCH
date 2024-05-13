/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import codePush from 'react-native-code-push';
import {EhrApp} from './EhrApp';
import {isWeb} from './Styles';

const isProduction = process.env.NODE_ENV;

if (isProduction) {
  console.log = function () {};
  console.info = function () {};
  console.warn = function () {};
  console.error = function () {};
  console.debug = function () {};
}

export default class Index extends Component {
  render() {
    return <EhrApp />;
    //return <DoctorApp account={{companyName: 'Lavue'}} doctorId='user-1'/>
  }
}
if (!isWeb) {
  Index = codePush({checkFrequency: codePush.CheckFrequency.MANUAL})(Index);
}
