import type {CodeDefinition, ExamRoom, PatientInfo} from './Types';
import {fetchItemById, storeItem, stripDataType} from './Rest';
import {getCachedItem} from './DataCache';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {styles} from './Styles';
import {GroupedForm} from './GroupedForm';
import React, {Component} from 'react';
import {View} from 'react-native';
import {getCodeDefinition} from './Codes';

const roomScreenDefinition = {
  name: 'Exam Room',
  fields: [
    {
      name: 'examroom',
      label: 'Exam room',
      size: 'M',
      fields: [
        {
          name: 'room',
          label: 'Patient Room',
          options: 'examRooms',
        },
      ],
    },
  ],
};

export async function fetchExamRoom(patientId: string): ExamRoom {
  let examRoom: ExamRoom = await fetchItemById(patientId);
  return examRoom;
}

export async function updateExamRoom(examRoom: ExamRoom): ExamRoom {
  const currentExamRoom: ExamRoom = getExamRoom(examRoom.patientId);
  if (
    currentExamRoom === undefined ||
    (currentExamRoom !== undefined &&
      (currentExamRoom.examRoomId !== examRoom.examRoomId ||
        currentExamRoom.patientId !== examRoom.patientId ||
        currentExamRoom.inactive !== examRoom.inactive))
  ) {
    examRoom = await storeItem(examRoom);
  }
  return examRoom;
}

export function getExamRoom(patientId: string): ExamRoom {
  const examRoomPatientId: string =
    'examRoomPatient-' + stripDataType(patientId);
  const examRoomPatient: any = getCachedItem(examRoomPatientId);
  return examRoomPatient;
}

export function getExamRoomCode(patientId: string): CodeDefinition {
  const examRoom: ExamRoom = getExamRoom(patientId);
  if (examRoom === undefined) {
    return;
  }
  const examRoomCode: CodeDefinition = getCodeDefinition(
    'examRooms',
    stripDataType(examRoom.examRoomId),
  );
  return examRoomCode;
}

export class RoomScreen extends Component {
  props: {
    navigation: any,
  };
  state: {
    room: CodeDefinition,
  };
  params: {
    patient: PatientInfo | Patient,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      room: getExamRoomCode(this.props.navigation.state.params.patient.id),
    };
  }

  componentWillUnmount() {
    const examRoom: CodeDefinition = this.state.room;
    if (examRoom === undefined || examRoom === null) {
      return;
    }

    if (examRoom.code) {
      const examRoomPatient: ExamRoom = {
        id: 'room-' + examRoom.code,
        patientId: this.props.navigation.state.params.patient.id,
        examRoomId: 'room-' + examRoom.code,
      };
      updateExamRoom(examRoomPatient);
    }
  }
  componentDidMount() {
    this.getExamRoom();
  }

  async getExamRoom() {
    const patient: PatientInfo = this.props.navigation.state.params.patient;
    const roomPatientId: string = 'room-' + stripDataType(patient.id);
    await fetchExamRoom(roomPatientId);
    const examRoom: CodeDefinition = getExamRoomCode(patient.id);
    this.setState({room: examRoom});
  }

  changeRoom(newValue: any): void {
    const examRoomCode: CodeDefinition = getCodeDefinition(
      'examRooms',
      newValue,
    );
    this.setState({room: examRoomCode});
  }

  render() {
    const value = this.state.room ? {room: this.state.room.code} : {};
    return (
      <KeyboardAwareScrollView
        contentContainerStyle={styles.centeredScreenLayout}
        scrollEnabled={false}>
        <View style={styles.centeredColumnLayout}>
          {roomScreenDefinition.fields.map((groupDefinition, i) => (
            <GroupedForm
              key={i}
              definition={groupDefinition}
              form={value}
              onChangeField={(
                fieldName: string,
                newValue: any,
                column: ?string,
              ) => this.changeRoom(newValue)}
            />
          ))}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}
