import {isTestFlight} from './Version';
import {isWeb} from './Styles';
import {isEmpty} from './Util';
import Config  from 'react-native-config';

let emrHost = isWeb ? process.env.WINK_HOST : Config.WINK_HOST || 'unknown';

export function getEmrHost() {
  if (isTestFlight) {
    return isWeb ? process.env.WINK_TESTFLIGHT_HOST : Config.WINK_TESTFLIGHT_HOST;
  }

  if (__DEV__) {
    return isWeb ? process.env.WINK_HOST : Config.WINK_HOST;
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
