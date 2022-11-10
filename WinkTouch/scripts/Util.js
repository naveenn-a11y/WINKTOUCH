import {REACT_APP_HOST, REACT_APP_PATH} from '../env.json';
import {defaultHost} from '../js/Rest';

const environments: string[] = [
  'alpha',
  'dev',
  'prod',
  'qa',
  'staging',
  'v411',
  'v412',
];

function getEnvFile(name: string) {
  if (name === 'alpha') {
    return require('../envs/alpha.json');
  }
  if (name === 'dev') {
    return require('../envs/dev.json');
  }
  if (name === 'prod') {
    return require('../envs/prod.json');
  }
  if (name === 'qa') {
    return require('../envs/qa.json');
  }
  if (name === 'staging') {
    return require('../envs/staging.json');
  }
  if (name === 'v411') {
    return require('../envs/v411.json');
  }
  return undefined;
}
export function getHostFromBundleKey(bundleKey: string): any {
  let url: any = {};
  for (let i = 0; i < environments.length; i++) {
    const name: string = environments[i];
    const envFileContent: any = getEnvFile(name);
    if (envFileContent) {
      const key: string = getHostUrl(envFileContent, bundleKey);
      if (key !== undefined) {
        return key;
      }
    }
  }
  url.host = defaultHost;
  url.path = '/';
  return url;
}

function getHostUrl(envFileContent: any, bundleKey: string): any {
  let url: any = {};
  if (envFileContent !== undefined) {
    if (envFileContent.REACT_APP_BUNDLEKEY === bundleKey) {
      const subPath: string = envFileContent.REACT_APP_PATH
        ? envFileContent.REACT_APP_PATH
        : '';
      url.host = envFileContent.REACT_APP_HOST;
      url.path = subPath;
      return url;
    }
  }
  return undefined;
}

export function getCurrentHost(): string {
  const subPath: string = REACT_APP_PATH ? REACT_APP_PATH : '/';
  return 'https://' + REACT_APP_HOST + subPath;
}
