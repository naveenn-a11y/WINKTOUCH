/**
 * @flow
 */
'use strict';

import React, {Component} from 'react';
import JsNavigation from './JsNavigation';
import DeviceInfoTest from './DeviceInfoTest';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import PatientDetails from './PatientDetails';
import {DoctorApp} from './DoctorApp';
import EhrApp from './EhrApp';
import {doctorMurray} from './DemoData';

export default class Index extends Component {
    render() {
        //return <EhrApp/>
        return <DoctorApp account={{companyName: 'Lavue'}} doctor={doctorMurray}
        />
    }
}
