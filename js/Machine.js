import {
  getNextRequestNumber,
  getToken,
  handleHttpError,
  searchItems,
  storeItem,
} from './Rest';
import {getDoctor} from './DoctorApp';
import type {Measurement} from './Types';
import {getCachedItem} from './DataCache';
import {getFieldValue, getPatient} from './Exam';
import {formatLabel, getFieldDefinition} from './Items';
import {getConfiguration} from './Configuration';
import {strings} from './Strings';
import {isEmpty} from './Util';

const MachineRequestType = {
  PUSH: 'PUSH',
  PULL: 'PULL',
};
const wsRestUrl: string = 'https://afd.dev.downloadwink.com/WinkWebSocket/';
const wssIoStream: string = 'wss://chat-us-east-1.stream-io-api.com/';

async function fetchMachineMeasurements(
  machineType,
  patientId,
  filter,
): Measurement[] {
  const searchCriteria = {machineType, patientId, filter};
  let restResponse = await searchItems('Measurement/list', searchCriteria);
  __DEV__ &&
    console.log('Fetched machine data= ' + JSON.stringify(restResponse));
  return restResponse.measurementList;
}

export async function importData(
  dataIdentifier: string | string[],
  examId: string,
): Measurement | Measurement[] {
  if (dataIdentifier instanceof Array === false) {
    dataIdentifier = [dataIdentifier];
  }
  const exam: Exam = getCachedItem(examId);
  let dataList: Measurement[] = [];
  for (let i = 0; i < dataIdentifier.length; i++) {
    const identifier = dataIdentifier[i];

    if (identifier.startsWith('machine.')) {
      const iArr = identifier.split('.');
      const machineType: string = iArr[1];
      const patientId: string = getPatient(exam).id;
      const filter = iArr.slice(2).join('.');
      let measurements = await fetchMachineMeasurements(
        machineType,
        patientId,
        filter,
      );
      if (measurements && measurements.length > 0) {
        dataList = [...dataList, ...measurements];
      }
    } else {
      let value = getFieldValue(identifier, exam);

      if (value !== undefined && value !== null) {
        const fieldDefinition = getFieldDefinition(identifier);
        let label: string = fieldDefinition
          ? formatLabel(fieldDefinition)
          : identifier;
        if (value instanceof Array) {
          let index: number = 0;
          value.forEach((subValue) => {
            if (subValue != undefined && subValue != null) {
              let subLabel: string = '';
              if (identifier.trim().toLowerCase().includes('lensometry')) {
                subLabel = label + ' ' + subValue.lensType;
              }
              if (isEmpty(subValue.lensType)) {
                subLabel = label + ' ' + ++index;
              }
              Object.assign(subValue, {customField: subLabel});

              let data = {
                label: subLabel,
                data: subValue,
              };
              dataList.push(data);
            }
          });
        }
      }
    }
  }
  if (dataList.length === 0) {
    return undefined;
  }
  if (dataList.length === 1) {
    return dataList[0];
  }
  return dataList;
}

async function pushMachineMeasurement(
  machineId: string,
  measurement: Measurement,
): Measurement {
  measurement.id = 'measurement';
  measurement.machineId = machineId;
  measurement = await storeItem(measurement);
  if (measurement.errors) {
    alert(measurement.errors.toString());
  }
  return measurement;
}

export async function exportData(
  destinationIdentifier: string,
  measurement: Measurement,
  examId: string,
): Measurement {
  if (measurement === undefined || measurement === null) {
    return;
  }
  if (destinationIdentifier.startsWith('machine.')) {
    const machineType: string = destinationIdentifier.substring(
      'machine.'.length,
    );
    let machineId: number = getConfiguration().machine[machineType];
    if (machineId === undefined || machineId == null || machineId === 0) {
      alert(strings.formatString(strings.configMissing, machineType));
      return undefined;
    }
    measurement = await pushMachineMeasurement(
      'machine-' + machineId,
      measurement,
    );
    return measurement;
  } else {
    //const exam : Exam = getCachedItem(examId);
    alert(
      'Can not export to ' + destinationIdentifier + ' yet. Better call Sam.',
    ); //TODO
    return undefined;
  }
}
export class Machine {
  constructor(destinationIdentifier: string) {
    this.url = undefined;
    this.ws = undefined;
    this.destinationIdentifier = destinationIdentifier;
    if (destinationIdentifier.startsWith('machine.')) {
      const machineType: string = destinationIdentifier.substring(
        'machine.'.length,
      );
      this.machineId = getConfiguration().machine[machineType];
    }
  }

  buildUrl(authInfo: any): string {
    let url: string;
    if (authInfo && authInfo.token && authInfo.apiKey) {
      const jsonURLParam: any = encodeURI(
        '{"user_details":{"id":"' + getDoctor().id + '"}}',
      );
      url =
        wssIoStream +
        'connect?api_key=' +
        authInfo.apiKey +
        '&stream-auth-type=jwt&authorization=' +
        authInfo.token +
        '&json=' +
        jsonURLParam;
    }

    return url;
  }
  async connect(callback) {
    const authInfo: any = await this.login();
    this.url = this.buildUrl(authInfo);
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.bind('connected', strings.clientConnected);
    };
    this.ws.onerror = (e) => {
      console.log('on error ' + e.message);
      this.bind('error', e.message);
    };

    this.ws.onclose = (e) => {
      console.log('on close ' + e.code, e.reason);
      this.bind('closed', strings.clientDisconnected);
    };
    this.ws.onmessage = (e) => {
      if (e.data) {
        const data: any = JSON.parse(e.data);
        if (data.message && data.message.text) {
          const text: any = JSON.parse(data.message.text);
          if (text.action === MachineRequestType.PULL) {
            switch (text.status) {
              case 200:
                this.bind('message', strings.machinePullSuccess);
                break;
              case 500:
                const message: string = !isEmpty(text.message)
                  ? text.message
                  : strings.formatString(strings.serverError, text.status);
                this.bind('message', message);
                break;
            }
          }
        }
      }
    };
  }

  async login(): any {
    let authInfo: string;
    const path: string = 'Stream/Connect';
    const wsLoginUrl: string = wsRestUrl + path + '/';
    const requestNr = getNextRequestNumber();
    try {
      let httpResponse = await fetch(wsLoginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          token: getToken(),
        },
        body: JSON.stringify({}),
      });
      console.log(
        'RES ' +
          requestNr +
          ' POST ' +
          wsLoginUrl +
          ' login OK: ' +
          httpResponse.ok,
      );
      if (!httpResponse.ok) {
        const contentType: ?string = httpResponse.headers.get('Content-Type');
        if (
          contentType !== undefined &&
          contentType !== null &&
          contentType.startsWith('text/html')
        ) {
          handleHttpError(httpResponse, await httpResponse.text());
        } else {
          handleHttpError(httpResponse, await httpResponse.json());
        }
      }

      const responseJson = await httpResponse.json();
      if (responseJson) {
        authInfo = responseJson;
      }
    } catch (error) {}
    return authInfo;
  }

  async push() {
    const path: string = 'Machine/Message';
    const wsPushUrl: string = wsRestUrl + path + '/';
    const requestNr = getNextRequestNumber();
    try {
      let httpResponse = await fetch(wsPushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          token: getToken(),
        },
        body: JSON.stringify({
          action: MachineRequestType.PUSH,
          machineId: this.machineId,
        }),
      });
      console.log(
        'RES ' + requestNr + ' POST ' + wsPushUrl + '  OK: ' + httpResponse.ok,
      );
      if (!httpResponse.ok) {
        const contentType: ?string = httpResponse.headers.get('Content-Type');
        if (
          contentType !== undefined &&
          contentType !== null &&
          contentType.startsWith('text/html')
        ) {
          handleHttpError(httpResponse, await httpResponse.text());
        } else {
          handleHttpError(httpResponse, await httpResponse.json());
        }
      }

      const responseJson = await httpResponse.json();
      console.log('Response JSON: ' + JSON.stringify(responseJson));
    } catch (error) {}
  }
}
