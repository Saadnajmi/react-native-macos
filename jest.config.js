/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = {
  transform: {
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      '<rootDir>/packages/react-native/jest/assetFileTransformer.js',
    '.*': './jest/preprocessor.js',
  },
  setupFiles: ['./packages/react-native/jest/local-setup.js'],
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: true,
  },
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  testRegex: '/__tests__/.*-test\\.js$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/react-native/template',
    '<rootDir>/packages/react-native/Libraries/Renderer',
    '<rootDir>/packages/rn-tester/e2e',
  ],
  transformIgnorePatterns: ['node_modules/(?!@react-native/)'],
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'android', 'macos'],
  },
  unmockedModulePathPatterns: [
    'node_modules/react/',
    'packages/react-native/Libraries/Renderer',
    'promise',
    'source-map',
    'fastpath',
    'denodeify',
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    'react-native-codegen/(.*)': '<rootDir>/packages/react-native-codegen/$1',
    'eslint/lib/rules/(.*)': '<rootDir>/node_modules/eslint/lib/rules/$1',
    '^react-native(.*)': '<rootDir>/packages/react-native$1',
  },
  modulePathIgnorePatterns: [
    // [macOS] ignore packages that differ from facebook/react-native, since we publish these to verdaccio
    '<rootDir>/packages/virtualized-lists/',
  ],
  collectCoverageFrom: ['packages/react-native/Libraries/**/*.js'],
  coveragePathIgnorePatterns: [
    '/__tests__/',
    '/vendor/',
    '<rootDir>/packages/react-native/Libraries/react-native/',
  ],
};
