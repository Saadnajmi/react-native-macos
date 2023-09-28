/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol RCTFabricModalHostViewControllerDelegate <NSObject>
- (void)boundsDidChange:(CGRect)newBounds;
@end

@interface RCTFabricModalHostViewController : UIViewController

@property (nonatomic, weak) id<RCTFabricModalHostViewControllerDelegate> delegate;

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

@end
