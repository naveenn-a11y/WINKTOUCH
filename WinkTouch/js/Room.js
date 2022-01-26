import type {ExamRoom} from './Types';
import {storeItem, stripDataType} from './Rest';
import {getCachedItem} from './DataCache';

export async function updateExamRoom(examRoom: ExamRoom): ExamRoom {
  examRoom = await storeItem(examRoom);
  return examRoom;
}

export function getExamRoom(patientId: string): ExamRoom {
  const examRoomPatientId: string =
    'examRoomPatient-' + stripDataType(patientId);
  const examRoomPatient: any = getCachedItem(examRoomPatientId);
  return examRoomPatient;
}
