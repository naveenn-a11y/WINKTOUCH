/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import codePush from 'react-native-code-push';
import {DoctorApp} from './DoctorApp';
import { EhrApp } from './EhrApp';

let codePushOptions = { updateDialog: true, installMode: codePush.InstallMode.IMMEDIATE };

if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
  console.log = function () {};
  console.info = function () {};
  console.warn = function () {};
  console.error = function () {}
  console.debug = function () {}
}

export default class Index extends Component {
    render() {
      return <EhrApp/>
      //return <DoctorApp account={{companyName: 'Lavue'}} doctorId='user-1'/>
    }
}
