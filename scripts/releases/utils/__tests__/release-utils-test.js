/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const echoMock = jest.fn();
const execMock = jest.fn();
const exitMock = jest.fn();
const testMock = jest.fn();

jest.mock('shelljs', () => ({
  echo: echoMock,
  exec: execMock,
  exit: exitMock,
  test: testMock,
}));

const {publishAndroidArtifactsToMaven} = require('../release-utils');

describe('publishAndroidArtifactsToMaven', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // [macOS React Native macOS does not publish Android artifacts; upstream's
  // Sonatype staging tests do not apply because the function exits early.
  test('skips publishing a release on React Native macOS', () => {
    exitMock.mockImplementationOnce(() => {
      throw new Error('exit');
    });

    expect(() => publishAndroidArtifactsToMaven('0.86.2', 'release')).toThrow(
      'exit',
    );

    expect(exitMock).toHaveBeenCalledWith(0);
    expect(execMock).not.toHaveBeenCalled();
  });

  test('skips publishing a nightly on React Native macOS', () => {
    exitMock.mockImplementationOnce(() => {
      throw new Error('exit');
    });

    expect(() =>
      publishAndroidArtifactsToMaven('0.87.0-nightly-20260728', 'nightly'),
    ).toThrow('exit');

    expect(exitMock).toHaveBeenCalledWith(0);
    expect(execMock).not.toHaveBeenCalled();
  });
  // macOS]
});
