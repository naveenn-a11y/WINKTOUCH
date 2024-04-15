import {isTestFlight} from './Version';
import {isWeb} from './Styles';
import {isEmpty} from './Util';

let emrHost = process.env.WINK_HOST || 'unknown';
export function getEmrHost() {
  if (isTestFlight) {
    return process.env.WINK_TESTFLIGHT_HOST;
  }
  if (isWeb && !__DEV__) {
    return window.location.hostname;
  }
  return emrHost;
}

export function setEmrHost(newEmrHost: string) {
  if (isEmpty(newEmrHost)) return;
  emrHost = newEmrHost;
}
