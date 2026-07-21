import fs from 'node:fs';
import path from 'node:path';

export const MAIN_VERSION = '1000.0.0';
export const PACKAGES_TO_IGNORE = new Set(['@react-native/eslint', 'public-api']);
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setValue(workspace, field, value, issues) {
  if (workspace.manifest[field] === value) {
    return;
  }
  issues.push({
    path: workspace.relativePath || 'package.json',
    message: `${field} must be ${JSON.stringify(value)} (found ${JSON.stringify(workspace.manifest[field])})`,
  });
  workspace.manifest[field] = value;
}

function setDependency(workspace, field, dependency, value, issues) {
  if (workspace.manifest[field]?.[dependency] === value) {
    return;
  }
  issues.push({
    path: workspace.relativePath || 'package.json',
    message: `${field}.${dependency} must be ${JSON.stringify(value)} (found ${JSON.stringify(workspace.manifest[field]?.[dependency])})`,
  });
  workspace.manifest[field][dependency] = value;
}

export function applyPolicies(inputWorkspaces) {
  const workspaces = inputWorkspaces.map(workspace => ({
    ...workspace,
    manifest: clone(workspace.manifest),
  }));
  const issues = [];
  const reactNativeMacOS = workspaces.find(
    workspace => workspace.manifest.name === 'react-native-macos',
  );

  if (!reactNativeMacOS) {
    return {
      workspaces,
      issues: [
        {
          path: 'package.json',
          message: 'react-native-macos workspace must exist in the monorepo',
        },
      ],
    };
  }

  const isMain = reactNativeMacOS.manifest.version === MAIN_VERSION;
  const reactNativeVersion =
    reactNativeMacOS.manifest.peerDependencies?.['react-native'];

  if (!isMain && !reactNativeVersion) {
    issues.push({
      path: reactNativeMacOS.relativePath,
      message:
        'react-native-macos must declare a peer dependency on react-native on release branches',
    });
  }

  for (const workspace of workspaces) {
    const name = workspace.manifest.name;
    const isReactNativeScoped =
      name?.startsWith('@react-native/') && !PACKAGES_TO_IGNORE.has(name);
    if (isReactNativeScoped) {
      setValue(workspace, 'private', true, issues);
      if (!isMain && reactNativeVersion) {
        setValue(workspace, 'version', reactNativeVersion, issues);
      }
    }
  }

  for (const workspace of workspaces) {
    for (const field of DEPENDENCY_FIELDS) {
      for (const dependency of Object.keys(workspace.manifest[field] ?? {})) {
        if (dependency.startsWith('@react-native/')) {
          const publishesWithReactNative =
            workspace.manifest.name === 'react-native-macos' ||
            workspace.manifest.name?.startsWith('@react-native-macos/');
          const expected =
            !isMain && publishesWithReactNative && reactNativeVersion
              ? reactNativeVersion
              : 'workspace:*';
          setDependency(workspace, field, dependency, expected, issues);
        }
      }
    }
  }

  for (const workspace of workspaces) {
    const name = workspace.manifest.name;
    const isReactNativeMacOSScoped = name?.startsWith('@react-native-macos/');
    if (!isMain && isReactNativeMacOSScoped && !workspace.manifest.private) {
      setValue(
        workspace,
        'version',
        reactNativeMacOS.manifest.version,
        issues,
      );
    }

    for (const field of DEPENDENCY_FIELDS) {
      for (const dependency of Object.keys(workspace.manifest[field] ?? {})) {
        if (dependency.startsWith('@react-native-macos/')) {
          setDependency(
            workspace,
            field,
            dependency,
            isMain ? 'workspace:*' : reactNativeMacOS.manifest.version,
            issues,
          );
        }
      }
    }

    if (isReactNativeMacOSScoped && workspace.manifest.private) {
      setValue(workspace, 'version', MAIN_VERSION, issues);
    }
  }

  return {workspaces, issues};
}

function listPackageDirectories(rootDir, pattern) {
  const parent = pattern.slice(0, -2);
  const absoluteParent = path.join(rootDir, parent);
  if (!fs.existsSync(absoluteParent)) {
    return [];
  }
  return fs
    .readdirSync(absoluteParent, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => `${parent}/${entry.name}`);
}

export function loadWorkspaces(rootDir) {
  const rootManifestPath = path.join(rootDir, 'package.json');
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
  const patterns = rootManifest.workspaces;
  if (!Array.isArray(patterns)) {
    throw new Error('package.json workspaces must be an array');
  }

  const included = new Set(['']);
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      included.delete(pattern.slice(1));
      continue;
    }
    for (const directory of listPackageDirectories(rootDir, pattern)) {
      included.add(directory);
    }
  }

  return [...included]
    .sort()
    .map(relativeDirectory => {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/package.json`
        : 'package.json';
      const manifestPath = path.join(rootDir, relativePath);
      if (!fs.existsSync(manifestPath)) {
        return null;
      }
      return {
        directory: relativeDirectory,
        relativePath,
        manifestPath,
        source: fs.readFileSync(manifestPath, 'utf8'),
        manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
      };
    })
    .filter(Boolean);
}

export function runPolicies(rootDir, {fix = false} = {}) {
  const original = loadWorkspaces(rootDir);
  const result = applyPolicies(original);
  const changedFiles = [];

  if (fix) {
    for (let index = 0; index < original.length; index += 1) {
      const before = original[index];
      const after = result.workspaces[index];
      if (JSON.stringify(before.manifest) === JSON.stringify(after.manifest)) {
        continue;
      }
      fs.writeFileSync(
        before.manifestPath,
        `${JSON.stringify(after.manifest, null, 2)}\n`,
      );
      changedFiles.push(before.relativePath);
    }
  }

  return {...result, changedFiles};
}
