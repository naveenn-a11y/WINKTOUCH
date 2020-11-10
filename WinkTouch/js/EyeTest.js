/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, Button } from 'react-native';
import { styles, fontScale } from './Styles';
import { TilesField, NumberField } from './Widgets';
import { ImageField } from './ImageField';
import { ImagePicker } from './ImagePicker';

const strabismusTypes: string[] = ['Exotropia', 'Esotropia', 'Hypertropia', 'Hypotropia'];
const oculusTypes: string[] = ['OD', 'OS', 'OU'];
const handednessTypes: string[] = ['Right', 'Left', 'Ambidexter'];
const visualFieldTypes: string[] = ['Full', 'Diminished', 'Half Blind', 'Total Blind'];
const anesthetics: string[] = ['Marijuana', 'Cocaine', 'Amphetamines'];
const pupilDiagnoseTypes: string[] = ['Horners Syndrome', 'Cup-Deep'];
const irisColorTypes: string[] = ['Blue', 'Black', 'Brown', 'Grey', 'Green'];
const eomTypes: string[] = ['smooth and full'];

export class StrabismusWheel extends Component {
  props: {
    strabismus: string
  }
  state: {
    strabismus: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      strabismus: this.props.strabismus
    }
  }

  render() {
    return <TilesField value={this.state.strabismus} options={strabismusTypes} {...this.props}
      onChangeValue={(strabismus: string) => this.setState({ strabismus: strabismus })} />
  }
}

export class OculusWheel extends Component {
  props: {
    oculus: string,
    prefix?: string
  }
  state: {
    oculus: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      oculus: this.props.oculus
    }
  }

  render() {
    return <TilesField value={this.state.oculus} options={oculusTypes} {...this.props}
      onChangeValue={(oculus: string) => this.setState({ oculus: oculus })} />
  }
}

export class HandednessWheel extends Component {
  props: {
    handedness: string,
    prefix?: string
  }
  state: {
    handedness: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      handedness: this.props.handedness
    }
  }

  render() {
    return <TilesField value={this.state.handedness} options={handednessTypes} {...this.props}
      onChangeValue={(handedness: string) => this.setState({ handedness: handedness })} />
  }
}

export class VisualFieldWheel extends Component {
  props: {
    visualField: string,
    prefix?: string
  }
  state: {
    visualField: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      visualField: this.props.visualField
    }
  }

  render() {
    return <TilesField value={this.state.visualField} options={visualFieldTypes} {...this.props}
      onChangeValue={(visualField: string) => this.setState({ visualField: visualField })} />
  }
}

export class PupilDiagnoseWheel extends Component {
  props: {
    pupilDiagnose: string
  }
  state: {
    pupilDiagnose: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      pupilDiagnose: this.props.pupilDiagnose
    }
  }

  render() {
    return <TilesField value={this.state.pupilDiagnose} options={pupilDiagnoseTypes} {...this.props}
      onChangeValue={(pupilDiagnose: string) => this.setState({ pupilDiagnose: pupilDiagnose })} />
  }
}

export class IrisColorWheel extends Component {
  props: {
    irisColor: string
  }
  state: {
    irisColor: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      irisColor: this.props.irisColor
    }
  }

  render() {
    return <TilesField value={this.state.irisColor} options={irisColorTypes} {...this.props}
      onChangeValue={(irisColor: string) => this.setState({ irisColor: irisColor })} />
  }
}

export class EOMWheel extends Component {
  props: {
    eom: string
  }
  state: {
    eom: string
  }
  constructor(props: any) {
    super(props);
    this.state = {
      eom: this.props.eom
    }
  }

  render() {
    return <TilesField value={this.state.eom} options={eomTypes} {...this.props}
      onChangeValue={(eom: string) => this.setState({ eom: eom })} />
  }
}

export class PD extends Component {
  props: {
    value: number,
    onChangeValue: (newvalue: number) => void
  }
  render() {
    return <NumberField range={[30,100]} stepSize={1} decimals={0}
      value={this.props.value}
      onChangeValue={this.props.onChangeValue} />
  }
}


export class HirschbergTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Hirschberg Test</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <StrabismusWheel />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <StrabismusWheel strabismus={'Exotropia'} />
        </View>
      </View>
    </View>
  }
}

export class DominanceTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Dominance</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Dominant Eye:</Text>
          <OculusWheel style={styles.formField} oculus={'OD'} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Dominant Hand:</Text>
          <HandednessWheel style={styles.formElement} handedness={'Right'} />
        </View>
      </View>
    </View>
  }
}

export class ConfrontationTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Confrontation Visual Field</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <VisualFieldWheel style={styles.formField} visualField={undefined} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <VisualFieldWheel style={styles.formField} visualField={'Full'} />
        </View>
      </View>
    </View>
  }
}

export class PerimetryTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Perimetry</Text>
      <View style={styles.centeredColumnLayout}>
        <ImageField value={[]}/>
      </View>
    </View>
  }
}

export class Anesthetics extends Component {
  props: {
    drug: ?string,
    administered: ?Date,
    onAdminister: (drug: string) => void
  }
  state: {
    drug: ?string,
    administeredAge: ?number
  }
  constructor(props: any) {
    super(props);
    let administeredAge: ?number = this.props.administered ? 2 : undefined;
    this.state = {
      drug: this.props.drug,
      administeredAge: administeredAge
    }
  }

  render() {
    if (this.props.administered) {
      return <View style={styles.board}>
        <Text style={styles.screenTitle}>Anesthetics</Text>
        <Text style={styles.text}>5 drops of {this.props.drug}</Text>
        <Text style={styles.text}>{this.state.administeredAge}minutes ago</Text>
      </View>
    }
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Anesthetics</Text>
      <Button title='Administer now' onPress={() => this.state.drug && this.props.onAdminister(this.state.drug)} />
    </View>
  }
}


export class PupilsTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Pupils</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <PupilDiagnoseWheel style={styles.formField} pupilDiagnose={'Horners Syndrome'} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <PupilDiagnoseWheel style={styles.formField} pupilDiagnose={undefined} />
        </View>
      </View>
    </View>
  }
}

export class IrisColorTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Iris Color</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <IrisColorWheel style={styles.formField} irisColor={'Blue'} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <IrisColorWheel style={styles.formField} irisColor={'Green'} />
        </View>
      </View>
    </View>
  }
}

export class ExtraOcularMotilities extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>EOM</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <EOMWheel style={styles.formField} eom={'smooth and Full'} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <EOMWheel style={styles.formField} eom={'smooth and Full'} />
        </View>
      </View>
    </View>
  }
}

export class Stereopsis extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Stereopsis</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Dist:</Text>
          <NumberField value={25} range={[10,200]} stepSize={5} />
          <TilesField value='Keystone' options={['Keystone', 'Stereo fly']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Near:</Text>
          <NumberField value={25} range={[10,200]} stepSize={5} />
          <TilesField value='Keystone' options={['Keystone', 'Stereo fly']} />
        </View>
      </View>
    </View>
  }
}

export class ColorVision extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Color Vision</Text>
      <View style={styles.centeredColumnLayout}>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Test:</Text>
          <TilesField value='Famsworth D-15' options={['Famsworth D-15']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <TilesField value='Normal' options={['Normal']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <TilesField value='Normal' options={['Normal']} />
        </View>
      </View>
    </View>
  }
}


export class PupilDistance extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Pupil Distance</Text>
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}></Text>
        <Text style={styles.formTableColumnHeader}>Far</Text>
        <Text style={styles.formTableColumnHeader}>Near</Text>
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OD:</Text>
        <PD />
        <PD />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OS:</Text>
        <PD />
        <PD />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OU:</Text>
        <PD />
        <PD />
      </View >
    </View>
  }
}
