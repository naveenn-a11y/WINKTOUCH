import {isTestFlight} from './Version';
import {isWeb} from './Styles';
import {isEmpty} from './Util';

const productionHost = process.env.WINK_PRODUCTION_HOST || 'unknown';
const developmentHost = process.env.WINK_DEV_HOST || 'unknown';

let emrHost = productionHost;
export function getEmrHost() {
  if (isTestFlight || __DEV__) {
    return developmentHost;
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
