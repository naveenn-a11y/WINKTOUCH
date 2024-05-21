import { isTestFlight } from './Version';
import { isWeb } from './Styles';
import { isEmpty } from './Util';
import { WINK_APP_HOST, WINK_APP_TESTFLIGHT_HOST } from '@env';

let emrHost = isWeb ? process.env.WINK_APP_HOST : WINK_APP_HOST;

export function getEmrHost() {
  if (isTestFlight) {
    return isWeb ? process.env.WINK_APP_TESTFLIGHT_HOST : WINK_APP_TESTFLIGHT_HOST;
  }

  if (__DEV__) {
    return isWeb ? process.env.WINK_APP_HOST : WINK_APP_HOST;
  }

  if (isWeb) {
    return window.location.hostname;
  }

  return emrHost;
}

export function setEmrHost(newEmrHost: string) {
  if (isEmpty(newEmrHost)) return;
  emrHost = newEmrHost;
}
