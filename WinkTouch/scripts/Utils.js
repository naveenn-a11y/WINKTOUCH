const environments: string[] = ['alpha', 'dev', 'prod', 'qa', 'staging'];

export function getHostFromBundleKey(bundleKey: string): string {
  for (i = 0; environments.length; i++) {
    const name: string = environments[i];
    const envFileContent: any = require(`../envs/${name}.json`);
    const key: string = getKey(envFileContent, bundleKey);
    if (key !== undefined) {
      return key;
    }
  }
  return undefined;
}

function getKey(envFileContent: any, bundleKey: string): string {
  if (envFileContent !== undefined) {
    if (envFileContent.REACT_APP_BUNDLEKEY === bundleKey) {
      return envFileContent.REACT_APP_HOST;
    }
  }
  return undefined;
}
