#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

if [[ -f "BUCK" && -z "$FANTOM_FORCE_OSS_BUILD" ]]; then
  JS_DIR='..' pnpm exec jest --config private/react-native-fantom/config/jest.config.js "$@"
else
  pnpm --filter @react-native/fantom run build
  FANTOM_FORCE_OSS_BUILD=1 pnpm exec jest --config private/react-native-fantom/config/jest.config.js "$@"
fi
