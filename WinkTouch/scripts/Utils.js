const environments: string[] = ['alpha', 'dev', 'prod', 'qa', 'staging'];

function getEnvFile(name: string) {
  if (name === 'alpha') {
    return require(`../envs/alpha.json`);
  }
  if (name === 'dev') {
    return require(`../envs/dev.json`);
  }
  if (name === 'prod') {
    return require(`../envs/prod.json`);
  }
  if (name === 'qa') {
    return require(`../envs/qa.json`);
  }
  if (name === 'staging') {
    return require(`../envs/staging.json`);
  }
}
export function getHostFromBundleKey(bundleKey: string): string {
  for (i = 0; environments.length; i++) {
    const name: string = environments[i];
    const envFileContent: any = getEnvFile(name);
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
