#!/usr/bin/env node

import {runPolicies} from '../src/policy.mjs';

const args = process.argv.slice(2);
const mode = args[0];
const rootIndex = args.indexOf('--root');
const rootDir = rootIndex === -1 ? process.cwd() : args[rootIndex + 1];

if ((mode !== 'check' && mode !== 'fix') || !rootDir) {
  console.error('Usage: policies.mjs <check|fix> [--root <path>]');
  process.exit(2);
}

const result = runPolicies(rootDir, {fix: mode === 'fix'});
for (const issue of result.issues) {
  console.error(`${issue.path}: ${issue.message}`);
}

if (mode === 'fix') {
  console.log(`Updated ${result.changedFiles.length} package manifest(s).`);
} else if (result.issues.length === 0) {
  console.log('Package manifest policies are satisfied.');
}

process.exitCode = mode === 'check' && result.issues.length > 0 ? 1 : 0;
