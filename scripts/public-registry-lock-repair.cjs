#!/usr/bin/env node
'use strict';

// Temporary diagnostic only. No dependency additions: use this source's installed
// eslint -> js-yaml dependency after the immutable install links its locked tree.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {createHash} = require('node:crypto');
const {spawn, execFileSync} = require('node:child_process');

const REGISTRY = 'https://registry.yarnpkg.com';
const YARN = '.yarn/releases/yarn-4.12.0.cjs';
const sha256 = data => createHash('sha256').update(data).digest('hex');
const keys = value => Object.keys(value).sort();
const json = value => JSON.stringify(value, null, 2) + '\n';

function installedYaml(source) {
  const rootRequire = createRequire(path.join(source, 'package.json'));
  const eslintRequire = createRequire(rootRequire.resolve('eslint/package.json'));
  const parserPath = path.relative(source, eslintRequire.resolve('js-yaml'));
  assert(!parserPath.startsWith('..') && !path.isAbsolute(parserPath), 'Parser must be installed in this source tree');
  return {
    yaml: eslintRequire('js-yaml'),
    version: eslintRequire('js-yaml/package.json').version,
    path: parserPath,
  };
}

function auditLocks(yaml, original, candidate) {
  // Match Yarn's string-valued lock scalars: ranges such as 2 and 2.0 must
  // remain distinct. Duplicate keys are still rejected by load.
  const before = yaml.load(original.toString(), {schema: yaml.FAILSAFE_SCHEMA});
  const after = yaml.load(candidate.toString(), {schema: yaml.FAILSAFE_SCHEMA});
  assert(before && after && typeof before === 'object' && typeof after === 'object');
  assert(before.__metadata && typeof before.__metadata === 'object', 'Missing lock metadata');
  assert.deepEqual(keys(after), keys(before), 'Lock descriptor mappings changed');
  assert.deepEqual(after.__metadata, before.__metadata, 'Lock metadata changed');
  const changes = [];
  for (const descriptor of keys(before)) {
    if (descriptor === '__metadata') continue;
    const a = before[descriptor];
    const b = after[descriptor];
    assert(a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b));
    assert.deepEqual(keys(b), keys(a), `Entry fields changed: ${descriptor}`);
    for (const key of keys(a)) {
      if (key !== 'bin') {
        assert.deepEqual(b[key], a[key], `${key} changed: ${descriptor}`);
        continue;
      }
      assert(a.bin && b.bin && typeof a.bin === 'object' && typeof b.bin === 'object');
      assert.deepEqual(keys(b.bin), keys(a.bin), `Bin names changed: ${descriptor}`);
      for (const name of keys(a.bin)) {
        const oldPath = a.bin[name];
        const newPath = b.bin[name];
        assert.equal(typeof oldPath, 'string');
        assert.equal(typeof newPath, 'string');
        assert.equal(newPath.replace(/^(?:\.\/)+/, ''), oldPath.replace(/^(?:\.\/)+/, ''),
          `Non-equivalent bin path: ${descriptor} / ${name}`);
        if (oldPath !== newPath) changes.push({descriptor, name, before: oldPath, after: newPath});
      }
    }
  }
  return {
    descriptorCount: keys(before).length - 1,
    metadata: {before: before.__metadata, after: after.__metadata},
    descriptorMappingsIdentical: true,
    versionsLocatorsChecksumsRangesMetadataIdentical: true,
    onlyEquivalentBinPrefixChanges: true,
    binChanges: changes,
  };
}

function assertManifestEquivalent(original, candidate, filename) {
  assert.deepEqual(JSON.parse(candidate), JSON.parse(original), `Manifest semantics changed: ${filename}`);
}

function selfTest(source) {
  const {yaml, version} = installedYaml(source);
  const original = `__metadata:
  version: 8
  cacheKey: 10c0
"example@npm:^1.0.0, example@npm:~1.2.0":
  version: 1.2.3
  resolution: "example@npm:1.2.3"
  dependencies:
    child: "npm:^2.0.0"
  checksum: 10c0/abcdef
  languageName: node
  linkType: hard
  bin:
    example: ./bin/example.js
`;
  const allowed = original.replace('./bin/example.js', 'bin/example.js');
  assert.equal(auditLocks(yaml, original, allowed).binChanges.length, 1);
  assert.equal(auditLocks(yaml, allowed, original).binChanges.length, 1);
  assert.equal(auditLocks(yaml, original, original).binChanges.length, 0);
  const numericRange = original.replace('child: "npm:^2.0.0"', 'tslib: 2');
  assert.throws(() => auditLocks(yaml, numericRange, numericRange.replace('tslib: 2', 'tslib: 2.0')),
    undefined, 'Distinct numeric-looking dependency ranges must not be coerced');
  assert.equal(auditLocks(yaml, numericRange, numericRange.replace('tslib: 2', 'tslib: "2"')).binChanges.length, 0);
  const forbidden = {
    version: allowed.replace('version: 1.2.3', 'version: 1.2.4'),
    checksum: allowed.replace('10c0/abcdef', '10c0/abcdee'),
    locator: allowed.replace('resolution: "example@npm:1.2.3"', 'resolution: "example@npm:1.2.4"'),
    range: allowed.replace('npm:^2.0.0', 'npm:^3.0.0'),
    metadata: allowed.replace('version: 8', 'version: 9'),
    descriptor: allowed.replace('example@npm:~1.2.0', 'example@npm:~1.3.0'),
    binTarget: allowed.replace('bin/example.js', 'other/example.js'),
    binName: allowed.replace('    example:', '    renamed:'),
    addedField: allowed + '  optional: true\n',
    removedField: allowed.replace('  linkType: hard\n', ''),
    duplicateKey: allowed + '  version: 1.2.3\n',
  };
  for (const [name, candidate] of Object.entries(forbidden)) {
    assert.throws(() => auditLocks(yaml, original, candidate), undefined, name);
  }
  assertManifestEquivalent('{"b":2,"a":{"x":1,"y":2}}', '{"a":{"y":2,"x":1},"b":2}', 'fixture');
  assert.throws(() => assertManifestEquivalent('{"a":1}', '{"a":2}', 'fixture'));
  assert.throws(() => assertManifestEquivalent('{"a":[1,2]}', '{"a":[2,1]}', 'fixture'));
  console.log(json({status: 'PASS', jsYamlVersion: version, allowedLockCases: 4,
    rejectedLockCases: [...keys(forbidden), 'numericRange'], manifestCases: 3}));
}

async function repair(source, artifacts) {
  fs.mkdirSync(artifacts, {recursive: true});
  const report = {
    status: 'FAILED', sourceSHA: process.env.SOURCE_SHA,
    repository: process.env.SOURCE_REPOSITORY, label: process.env.SOURCE_LABEL,
    diagnosticSHA: process.env.GITHUB_SHA, nodeVersion: process.version,
    commands: [], restorations: [],
  };
  const git = (...args) => execFileSync('git', args, {cwd: source, maxBuffer: 64 * 1024 * 1024});
  const write = (name, data) => fs.writeFileSync(path.join(artifacts, name), data);
  const readLock = () => fs.readFileSync(path.join(source, 'yarn.lock'));
  const verifyHead = () => assert.equal(git('rev-parse', 'HEAD').toString().trim(), report.sourceSHA,
    'Checked-out source HEAD must equal the exact matrix SHA');
  let original;
  let generated;

  async function yarn(name, args, immutable = '1') {
    const command = [process.execPath, YARN, ...args];
    const record = {name, command, immutable, hardened: '1', registry: REGISTRY, exitCode: null};
    report.commands.push(record);
    write('report.json', json(report));
    const fd = fs.openSync(path.join(artifacts, `${name}.log`), 'w');
    fs.writeSync(fd, `$ node ${YARN} ${args.join(' ')}\n`);
    let output = '';
    try {
      const code = await new Promise((resolve, reject) => {
        const child = spawn(command[0], command.slice(1), {
          cwd: source,
          env: {...process.env, YARN_NPM_REGISTRY_SERVER: REGISTRY,
            YARN_ENABLE_HARDENED_MODE: '1', YARN_ENABLE_IMMUTABLE_INSTALLS: immutable,
            YARN_ENABLE_SCRIPTS: '0'},
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const log = chunk => {
          fs.writeSync(fd, chunk);
          process.stdout.write(chunk);
          output += chunk.toString();
        };
        child.stdout.on('data', log);
        child.stderr.on('data', log);
        child.once('error', reject);
        child.once('close', (exitCode, signal) => resolve(exitCode ?? `signal:${signal}`));
      });
      record.exitCode = code;
      fs.writeSync(fd, `\nEXIT=${code}\n`);
      assert.equal(code, 0, `${name} failed`);
      return output.trim();
    } finally {
      fs.closeSync(fd);
      write('report.json', json(report));
    }
  }

  function restoreManifestOrdering(phase) {
    verifyHead();
    assert.equal(git('diff', '--cached', '--name-only').length, 0, 'Unexpected index changes');
    assert.equal(git('ls-files', '--others', '--exclude-standard', '-z').length, 0, 'Unexpected untracked source files');
    assert.equal(git('diff', '--summary', 'HEAD').length, 0, 'Unexpected source modes/additions/deletions');
    const changed = git('diff', '--name-only', '-z', 'HEAD').toString().split('\0').filter(Boolean);
    const restored = [];
    for (const filename of changed) {
      if (filename === 'yarn.lock') continue;
      assert(filename === 'package.json' || filename.endsWith('/package.json'), `Unexpected source change: ${filename}`);
      const absolute = path.join(source, filename);
      assert(fs.lstatSync(absolute).isFile(), `Not a regular manifest: ${filename}`);
      const before = git('show', `HEAD:${filename}`);
      const after = fs.readFileSync(absolute);
      assertManifestEquivalent(before.toString(), after.toString(), filename);
      fs.writeFileSync(absolute, before);
      restored.push({path: filename, originalSHA256: sha256(before), reorderedSHA256: sha256(after)});
    }
    report.restorations.push({phase, files: restored});
    assert.deepEqual(git('diff', '--name-only', '-z', 'HEAD').toString().split('\0').filter(Boolean),
      original.equals(readLock()) ? [] : ['yarn.lock'], 'Only yarn.lock may remain modified');
    return restored.length;
  }

  try {
    assert.match(report.sourceSHA || '', /^[a-f0-9]{40}$/);
    assert.match(process.version, /^v22\./, 'Use the CI Node 22 toolchain');
    verifyHead();
    assert.equal(git('status', '--porcelain', '--untracked-files=all').length, 0, 'Source checkout must start clean');
    report.verifiedHEAD = report.sourceSHA;
    report.sourceTree = git('rev-parse', 'HEAD^{tree}').toString().trim();
    original = readLock();
    write('yarn.lock.original', original);
    assert(original.equals(git('show', 'HEAD:yarn.lock')), 'Original lock must match Git');
    report.originalLockSHA256 = sha256(original);
    report.sourceConfigSHA256 = sha256(fs.readFileSync(path.join(source, '.yarnrc.yml')));
    report.vendoredYarnSHA256 = sha256(fs.readFileSync(path.join(source, YARN)));
    report.yarnVersion = await yarn('yarn-version', ['--version']);
    assert.equal(report.yarnVersion, '4.12.0');
    // Print only individual nonsecret effective settings, never a whole config.
    report.registry = JSON.parse(await yarn('registry', ['config', 'get', 'npmRegistryServer', '--json']));
    report.hardened = JSON.parse(await yarn('hardened', ['config', 'get', 'enableHardenedMode', '--json']));
    report.scripts = JSON.parse(await yarn('scripts', ['config', 'get', 'enableScripts', '--json']));
    assert.equal(report.registry, REGISTRY);
    assert.equal(report.hardened, true);
    assert.equal(report.scripts, false);

    // The sole mutable install: this runner's local generation step only.
    await yarn('generate', ['install', '--mode=update-lockfile'], '0');
    generated = readLock();
    write('yarn.lock.after', generated);
    await yarn('immutable', ['install', '--immutable', '--mode=skip-build']);
    assert(readLock().equals(generated), 'Strict install changed the generated lock bytes');
    const parser = installedYaml(source);
    report.parser = {version: parser.version, path: parser.path, resolution: 'source eslint createRequire'};
    const sourceConfig = parser.yaml.load(fs.readFileSync(path.join(source, '.yarnrc.yml'), 'utf8'),
      {schema: parser.yaml.JSON_SCHEMA});
    assert.equal(sourceConfig.yarnPath, YARN);
    assert.equal(sourceConfig.npmRegistryServer ?? REGISTRY, REGISTRY);
    assert.equal(sourceConfig.httpProxy ?? null, null, 'Unexpected source HTTP proxy');
    assert.equal(sourceConfig.httpsProxy ?? null, null, 'Unexpected source HTTPS proxy');
    for (const scope of Object.values(sourceConfig.npmScopes || {})) {
      assert.equal(scope.npmRegistryServer ?? REGISTRY, REGISTRY, 'Unexpected scoped registry');
    }
    report.sourceConfig = {yarnPath: sourceConfig.yarnPath, nodeLinker: sourceConfig.nodeLinker,
      registry: sourceConfig.npmRegistryServer ?? 'default',
      scopedRegistryCount: Object.keys(sourceConfig.npmScopes || {}).length};
    report.audit = auditLocks(parser.yaml, original, generated);
    await yarn('constraints', ['constraints']);
    assert(readLock().equals(generated), 'Constraints changed the generated lock bytes');

    if (restoreManifestOrdering('after-strict-and-constraints')) {
      // A single fixed recheck, not a normalization/retry loop. If Yarn serializes
      // JSON keys again, restore only deep-equal manifests to Git's exact bytes.
      await yarn('immutable-after-restore', ['install', '--immutable', '--mode=skip-build']);
      assert(readLock().equals(generated), 'Post-restoration strict check changed lock bytes');
      restoreManifestOrdering('after-restoration-recheck');
    }
    report.audit = auditLocks(parser.yaml, original, readLock());
    verifyHead();
    assert(readLock().equals(generated), 'Final lock differs from audited candidate');
    report.afterLockSHA256 = sha256(generated);
    report.status = 'PASS';
  } catch (error) {
    report.error = error.message;
    process.exitCode = 1;
  } finally {
    // Failure artifacts are diagnostic candidates, never an implicit success.
    try {
      if (fs.existsSync(path.join(source, 'yarn.lock'))) write('yarn.lock.final', readLock());
      if (!generated && fs.existsSync(path.join(source, 'yarn.lock'))) write('yarn.lock.after', readLock());
      write('repair.patch', git('diff', '--binary', '--no-ext-diff', 'HEAD', '--', 'yarn.lock'));
      write('source-status.log', git('status', '--porcelain', '--untracked-files=all'));
    } catch (error) {
      report.status = 'FAILED';
      report.artifactError = error.message;
      process.exitCode = 1;
    }
    write('report.json', json(report));
    // Includes all command logs, locks, patch and report; excludes itself.
    const manifest = fs.readdirSync(artifacts).filter(name => name !== 'SHA256SUMS.log').sort()
      .map(name => `${sha256(fs.readFileSync(path.join(artifacts, name)))}  ${name}\n`).join('');
    write('SHA256SUMS.log', manifest);
    console.log(`${report.status}: ${report.sourceSHA}: ${report.error || 'strict install, constraints and semantic audit passed'}`);
  }
}

module.exports = {auditLocks, assertManifestEquivalent};

if (require.main === module) {
  if (process.argv[2] === '--self-test') {
    selfTest(path.resolve(process.argv[3] || '.'));
  } else {
    assert.equal(process.argv.length, 4, 'Usage: script source-directory artifact-directory');
    repair(path.resolve(process.argv[2]), path.resolve(process.argv[3])).catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
