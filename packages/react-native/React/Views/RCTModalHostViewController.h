/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h>

@interface RCTModalHostViewController : RCTPlatformViewController // [macOS]

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

#if !TARGET_OS_OSX // [macOS
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;
#endif // macOS]

@end
