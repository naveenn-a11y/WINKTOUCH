/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text } from 'react-native';
import type { PatientInfo, FieldDefinition, PatientDrug } from './Types';
import { styles } from './Styles';
import { ItemsList } from './Items';
import { deepClone } from './Util';
import { getCachedItems } from './DataCache';


const patientDrugDefinition : FieldDefinition[] = [{
    "name": "note",
    "label": "Notes",
    "maxLength": 400
  }, {
    "name": "dose",
    "label": "Dose",
    "minValue": 0
  }, {
    "name": "datePrescribed",
    "type": "pastDate",
    "label": "Date prescribed"
  }
];

export class PatientMedication extends Component {
    props: {
      patientInfo: PatientInfo,
      editable?: boolean,
      onUpdatePatient?: (patientInfo: PatientInfo) => void,
      addPatientDrug?: () => void
    }
    state: {
      patientDrugs: PatientDrug[],
    }
    static defaultProps = {
      editable: true
    }

    constructor(props: any) {
        super(props);
        let patientDrugs : PatientDrug[] = this.getPatientDrugs(props);
        this.state = {patientDrugs};
    }

    componentWillReceiveProps(nextProps: any) {
      let patientDrugs : PatientDrug[] = this.getPatientDrugs(nextProps);
      this.setState({patientDrugs});
    }

    getPatientDrugs(props: any) : PatientDrug[] {
      let patientDrugs: PatientDrug[] = getCachedItems(props.patientInfo.patientDrugs);
      if (patientDrugs===undefined) patientDrugs = [];
      return patientDrugs;
    }

    render() {
        return <ItemsList title='Medication' items={this.state.patientDrugs} showLabels={true} style={styles.boardStretch}
                  fieldDefinitions={patientDrugDefinition} onAddItem={this.props.addPatientDrug} editable={this.props.editable}/>
    }
}
