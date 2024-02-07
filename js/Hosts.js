import {isTestFlight} from './Version';

const productionHost = 'emr.downloadwink.com';
const qaHost = 'afd.dev.downloadwink.com';

let emrHost = productionHost;
export function getEmrHost() {
  if (isTestFlight || __DEV__) {
    return qaHost;
  }
  return emrHost;
}

export async function setEmrHost(newEmrHost: string) {
  emrHost = newEmrHost;
}
