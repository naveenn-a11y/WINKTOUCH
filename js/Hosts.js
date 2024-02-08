import {isTestFlight} from './Version';
import {isWeb} from './Styles';
import {isEmpty} from './Util';

const productionHost = 'emr.downloadwink.com';
const qaHost = 'afd.dev.downloadwink.com';

let emrHost = productionHost;
export function getEmrHost() {
  if (isTestFlight || __DEV__) {
    return qaHost;
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
