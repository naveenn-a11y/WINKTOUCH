/**
 * @flow
 */
'use strict';

import {clearDataCache} from './DataCache';

import {devDelete} from './Rest';
import {fetchAppointments} from './Appointment';
import {getDoctor, getStore} from './DoctorApp';

export async function resetDatabase() {
  let restResponse = await devDelete('ResetDatabase');
  clearDataCache();
  await fetchAppointments(getStore().storeId.toString(), getDoctor().id, 100);
  if (!restResponse.response === 'success') {
    alert('Database reset: ' + JSON.stringify(restResponse));
  }
}
