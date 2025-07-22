// @ts-check

const {REPO_ROOT} = require('../../scripts/consts');
const JsVersionActions = require('@nx/js/src/release/version-actions').default;
const fs = require('node:fs');
const path = require('node:path');

async function runSetVersion() {
  const rnmPkgJsonPath = path.join(REPO_ROOT, 'packages', 'react-native', 'package.json');
  const {updateReactNativeArtifacts} = require('../../scripts/releases/set-rn-artifacts-version');

  const manifest = fs.readFileSync(rnmPkgJsonPath, {encoding: 'utf-8'});
  const {version} = JSON.parse(manifest);

  await updateReactNativeArtifacts(version);

  return [
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactAndroid',
      'gradle.properties',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactAndroid',
      'src',
      'main',
      'java',
      'com',
      'facebook',
      'react',
      'modules',
      'systeminfo',
      'ReactNativeVersion.java',
    ),
    path.join(REPO_ROOT,
      'packages',
      'react-native',
      'React',
      'Base',
      'RCTVersion.m',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'ReactCommon',
      'cxxreact',
      'ReactNativeVersion.h',
    ),
    path.join(
      REPO_ROOT,
      'packages',
      'react-native',
      'Libraries',
      'Core',
      'ReactNativeVersion.js',
    ),
  ];
}

/**
 * Custom Version Actions for React Native macOS
 * Extends the built-in JsVersionActions to add React Native artifact updates
 */
class ReactNativeMacOSVersionActions extends JsVersionActions {
  /**
   * @override
   * Override updateProjectVersion to include React Native artifact updates
   * @param {import('@nx/devkit').Tree} tree
   * @param {string} newVersion
   * @returns {Promise<string[]>}
   */
  async updateProjectVersion(tree, newVersion) {
    // First, run the standard JS version update (package.json, etc.)
    const standardLogMessages = await super.updateProjectVersion(tree, newVersion);

    // Only update React Native artifacts for the react-native-macos project
    if (this.projectGraphNode.name === 'react-native-macos') {
      try {
        // Create the .rnm-publish file to indicate versioning has occurred
        fs.writeFileSync(path.join(REPO_ROOT, '.rnm-publish'), '');

        // Update React Native artifacts
        const versionedFiles = await runSetVersion();

        // Add the versioned files to the tree so they are tracked by Nx
        for (const filePath of versionedFiles) {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(REPO_ROOT, filePath);
            tree.write(relativePath, content);
          }
        }

        return [
          ...standardLogMessages,
          `✅ Updated React Native platform artifacts for version ${newVersion}`,
          `📁 Updated ${versionedFiles.length} platform-specific files`,
          '🏷️  Created .rnm-publish marker file',
        ];
      } catch (error) {
        console.error('Failed to update React Native artifacts:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return [
          ...standardLogMessages,
          `❌ Failed to update React Native artifacts: ${errorMessage}`,
        ];
      }
    }

    return standardLogMessages;
  }
}

module.exports = ReactNativeMacOSVersionActions;
module.exports.default = ReactNativeMacOSVersionActions;
