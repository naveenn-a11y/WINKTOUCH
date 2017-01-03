/**
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, Button } from 'react-native';
import { styles, fontScale } from './Styles';
import { OptionWheel, NumberScrollField } from './Widgets';
import { ContactsRx, GlassesRx } from './Exam';
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
    return <OptionWheel value={this.state.strabismus} options={[null, ...strabismusTypes]}
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
    return <OptionWheel value={this.state.oculus} options={[null, ...oculusTypes]} {...this.props}
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
    return <OptionWheel value={this.state.handedness} options={[null, ...handednessTypes]} {...this.props}
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
    return <OptionWheel value={this.state.visualField} options={[null, ...visualFieldTypes]} {...this.props}
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
    return <OptionWheel value={this.state.pupilDiagnose} options={[null, ...pupilDiagnoseTypes]} {...this.props}
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
    return <OptionWheel value={this.state.irisColor} options={[null, ...irisColorTypes]} {...this.props}
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
    return <OptionWheel value={this.state.eom} options={[null, ...eomTypes]} {...this.props}
      onChangeValue={(eom: string) => this.setState({ eom: eom })} />
  }
}


class HirschbergTest extends Component {
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>Hirschberg Test</Text>
      <View style={styles.formRow}>
        <TouchableWithoutFeedback onPress={() => alert('You will be able to move the white dot around')}>
          <Image source={require('./hirschberg.png')} style={{
            width: 350 * fontScale,
            resizeMode: 'contain',
          }} />
        </TouchableWithoutFeedback>
      </View >
      <View style={styles.centeredRowLayout}>
        <StrabismusWheel />
        <StrabismusWheel strabismus={'Exotropia'} />
      </View>
    </View>
  }
}

class CoverTest extends Component {
  props: {
    title: string
  }
  render() {
    return <View style={styles.board}>
      <Text style={styles.screenTitle}>{this.props.title}</Text>
      <View style={styles.formRow500}>
        <Text style={styles.formLabel}>Lateral:</Text>
        <OptionWheel value='Ortho' options={[null, 'Ortho']} />
        <OptionWheel value='EsoPhoria' options={[null, 'EsoPhoria']} />
      </View>
      <View style={styles.formRow500}>
        <Text style={styles.formLabel}>Vertical:</Text>
        <OptionWheel value='2' options={[null, 'Ortho']} />
        <OptionWheel value='Hyperphoria OD' options={[null, 'Hyperphoria OD']} />
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
        <Image source={require('./perimetry.png')} style={{
          width: 670 * fontScale,
          height: 350 * fontScale,
          resizeMode: 'contain',
        }} />
      </View>
    </View>
  }
}

export class Anesthetics extends Component {
  props: {
    drug: ?string,
    administered: ?date,
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
          <NumberScrollField value={25} minValue={10} maxValue={200} stepSize={5} />
          <OptionWheel value='Keystone' options={[null, 'Keystone', 'Stereo fly']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>Near:</Text>
          <NumberScrollField value={25} minValue={10} maxValue={200} stepSize={5} />
          <OptionWheel value='Keystone' options={[null, 'Keystone', 'Stereo fly']} />
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
          <OptionWheel value='Famsworth D-15' options={[null, 'Famsworth D-15']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OD:</Text>
          <OptionWheel value='Normal' options={[null, 'Normal']} />
        </View>
        <View style={styles.centeredRowLayout}>
          <Text style={styles.formLabel}>OS:</Text>
          <OptionWheel value='Normal' options={[null, 'Normal']} />
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
        <Text style={styles.formTableRowHeader}>OD</Text>
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OS</Text>
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
      </View >
      <View style={styles.formRow}>
        <Text style={styles.formTableRowHeader}>OU</Text>
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
        <NumberScrollField value={32} minValue={0} maxValue={100} stepSize={.5} decimals={2} />
      </View >
    </View>
  }
}

export class CoverTestScreen extends Component {
  render() {
    return <View style={styles.flow}>
      <HirschbergTest />
      <CoverTest title='Cover Test Far' />
      <CoverTest title='Cover Test Near' />
      <Stereopsis />
      <PupilDistance />
    </View>
  }
}

export class VisualFieldTestScreen extends Component {
  render() {
    return <View>
      <View style={styles.flow}>
        <DominanceTest />
        <ConfrontationTest />
        <PupilsTest />
        <IrisColorTest />
        <ExtraOcularMotilities />
        <ColorVision />
        <PerimetryTest />
      </View>
    </View>
  }
}
