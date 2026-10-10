/*
 * Copyright (c) Microsoft Corporation.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// [macOS] Canonical path for <React/View.h>; the macOS-only header lives under
// platform/macos and is excluded from the other Apple slices.
#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

#if defined(__APPLE__) && TARGET_OS_OSX
#include "platform/macos/react/renderer/components/view/HostPlatformViewEvents.h"
#endif
