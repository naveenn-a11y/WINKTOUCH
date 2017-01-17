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
import {DoctorApp} from './OverviewScreen';
import EhrApp from './EhrApp';

export default class Index extends Component {
    render() {
        //return <EhrApp/>
        return <DoctorApp account={{
            companyName: 'Lavue'
        }} user={{
            lastName: 'De Bleeckere'
        }}/>
    }
}
