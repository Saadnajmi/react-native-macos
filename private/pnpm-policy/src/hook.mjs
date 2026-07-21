import {fileURLToPath} from 'node:url';

import {runPolicies} from './policy.mjs';

export function createHooks({rootDir = process.cwd(), run = runPolicies} = {}) {
  let checked = false;

  function assertPersistedPolicies() {
    if (checked) {
      return;
    }
    const {issues} = run(rootDir);
    if (issues.length > 0) {
      throw new Error(
        `Persisted package manifests violate repository policies:\n${issues
          .map(issue => `${issue.path}: ${issue.message}`)
          .join('\n')}`,
      );
    }
    checked = true;
  }

  return {
    updateConfig(config) {
      return config;
    },
    readPackage(pkg) {
      assertPersistedPolicies();
      return pkg;
    },
    beforePacking(pkg) {
      assertPersistedPolicies();
      return pkg;
    },
  };
}

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

export const hooks = createHooks({rootDir: repositoryRoot});
