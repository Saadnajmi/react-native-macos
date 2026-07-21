import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

import {
  applyPolicies,
  MAIN_VERSION,
  runPolicies,
} from '../src/policy.mjs';
import {createHooks} from '../src/hook.mjs';

function workspace(relativePath, manifest) {
  return {relativePath, manifest};
}

function stableFixture() {
  return [
    workspace('package.json', {
      name: '@react-native-macos/monorepo',
      private: true,
      version: MAIN_VERSION,
      workspaces: ['packages/*'],
    }),
    workspace('packages/react-native/package.json', {
      name: 'react-native-macos',
      version: '0.82.1',
      peerDependencies: {'react-native': '0.82.1'},
      dependencies: {'@react-native/codegen': '^0.1.0'},
    }),
    workspace('packages/codegen/package.json', {
      name: '@react-native/codegen',
      version: '0.1.0',
      private: false,
    }),
    workspace('packages/fork/package.json', {
      name: '@react-native-macos/fork',
      version: '0.1.0',
      private: false,
      dependencies: {
        '@react-native/codegen': 'workspace:*',
        '@react-native-macos/private-tool': 'workspace:*',
      },
    }),
    workspace('packages/private-tool/package.json', {
      name: '@react-native-macos/private-tool',
      version: '0.1.0',
      private: true,
    }),
    workspace('packages/consumer/package.json', {
      name: 'consumer',
      version: '1.0.0',
      dependencies: {'@react-native/codegen': '^0.1.0'},
    }),
  ];
}

test('stable branches enforce all six policies', () => {
  const {workspaces, issues} = applyPolicies(stableFixture());
  assert.ok(issues.length >= 6);
  const byName = Object.fromEntries(
    workspaces.map(item => [item.manifest.name, item.manifest]),
  );
  assert.equal(byName['@react-native/codegen'].private, true);
  assert.equal(byName['@react-native/codegen'].version, '0.82.1');
  assert.equal(
    byName['react-native-macos'].dependencies['@react-native/codegen'],
    '0.82.1',
  );
  assert.equal(
    byName.consumer.dependencies['@react-native/codegen'],
    'workspace:*',
  );
  assert.equal(byName['@react-native-macos/fork'].version, '0.82.1');
  assert.equal(
    byName['@react-native-macos/fork'].dependencies[
      '@react-native-macos/private-tool'
    ],
    '0.82.1',
  );
  assert.equal(byName['@react-native-macos/private-tool'].version, MAIN_VERSION);
});

test('main uses workspace ranges and keeps release versions untouched', () => {
  const fixture = stableFixture();
  const reactNativeMacOS = fixture.find(
    item => item.manifest.name === 'react-native-macos',
  );
  reactNativeMacOS.manifest.version = MAIN_VERSION;
  delete reactNativeMacOS.manifest.peerDependencies;
  const {workspaces, issues} = applyPolicies(fixture);
  assert.ok(
    !issues.some(issue => issue.message.includes('peer dependency')),
  );
  const fork = workspaces.find(
    item => item.manifest.name === '@react-native-macos/fork',
  ).manifest;
  assert.equal(fork.version, '0.1.0');
  assert.equal(
    fork.dependencies['@react-native-macos/private-tool'],
    'workspace:*',
  );
});

test('ignore-list packages are not made private or version-aligned', () => {
  const fixture = stableFixture();
  fixture.push(
    workspace('packages/eslint/package.json', {
      name: '@react-native/eslint',
      version: '7.0.0',
      private: false,
    }),
    workspace('packages/public-api/package.json', {
      name: 'public-api',
      version: '5.0.0',
      private: false,
    }),
  );
  const {workspaces} = applyPolicies(fixture);
  for (const name of ['@react-native/eslint', 'public-api']) {
    const manifest = workspaces.find(item => item.manifest.name === name).manifest;
    assert.equal(manifest.private, false);
    assert.notEqual(manifest.version, '0.82.1');
  }
});

test('stable branches report a missing react-native peer dependency', () => {
  const fixture = stableFixture();
  delete fixture.find(item => item.manifest.name === 'react-native-macos')
    .manifest.peerDependencies;
  const {issues} = applyPolicies(fixture);
  assert.ok(issues.some(issue => issue.message.includes('peer dependency')));
});

test('unrelated packages are unchanged', () => {
  const fixture = stableFixture();
  const unrelated = workspace('packages/other/package.json', {
    name: 'other',
    version: '1.2.3',
    dependencies: {leftpad: '1.0.0'},
  });
  fixture.push(unrelated);
  const {workspaces} = applyPolicies(fixture);
  assert.deepEqual(
    workspaces.find(item => item.manifest.name === 'other').manifest,
    unrelated.manifest,
  );
});

test('fix is idempotent and check succeeds after fix', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rnm-policy-'));
  fs.mkdirSync(path.join(rootDir, 'packages/react-native'), {recursive: true});
  fs.mkdirSync(path.join(rootDir, 'packages/codegen'), {recursive: true});
  fs.writeFileSync(
    path.join(rootDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'fixture',
        private: true,
        version: MAIN_VERSION,
        workspaces: ['packages/*'],
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(rootDir, 'packages/react-native/package.json'),
    `${JSON.stringify(
      {
        name: 'react-native-macos',
        version: MAIN_VERSION,
        dependencies: {'@react-native/codegen': '^1.0.0'},
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(rootDir, 'packages/codegen/package.json'),
    `${JSON.stringify(
      {
        name: '@react-native/codegen',
        version: '1.0.0',
        private: false,
      },
      null,
      2,
    )}\n`,
  );

  const cli = path.resolve('private/pnpm-policy/bin/policies.mjs');
  assert.equal(
    spawnSync(process.execPath, [cli, 'check', '--root', rootDir]).status,
    1,
  );
  assert.equal(
    spawnSync(process.execPath, [cli, 'fix', '--root', rootDir]).status,
    0,
  );
  const afterFirstFix = fs.readFileSync(
    path.join(rootDir, 'packages/codegen/package.json'),
    'utf8',
  );
  assert.equal(runPolicies(rootDir).issues.length, 0);
  assert.equal(
    spawnSync(process.execPath, [cli, 'check', '--root', rootDir]).status,
    0,
  );
  assert.equal(runPolicies(rootDir, {fix: true}).changedFiles.length, 0);
  assert.equal(
    fs.readFileSync(
      path.join(rootDir, 'packages/codegen/package.json'),
      'utf8',
    ),
    afterFirstFix,
  );
});

test('hooks validate persisted manifests without mutating hook inputs', () => {
  const validRun = () => ({issues: []});
  const hooks = createHooks({run: validRun});
  const manifest = {name: 'example', version: '1.0.0'};
  assert.equal(hooks.updateConfig(manifest), manifest);
  assert.equal(hooks.readPackage(manifest), manifest);
  assert.equal(hooks.beforePacking(manifest), manifest);

  const invalidHooks = createHooks({
    run: () => ({
      issues: [{path: 'package.json', message: 'invalid fixture'}],
    }),
  });
  assert.throws(
    () => invalidHooks.readPackage(manifest),
    /Persisted package manifests.*invalid fixture/s,
  );
});
