/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h>

#import <React/RCTInvalidating.h>
#import <React/RCTModalHostViewManager.h>
#import <React/RCTView.h>

@class RCTBridge;
@class RCTModalHostViewController;

@protocol RCTModalHostViewInteractor;

#if !TARGET_OS_OSX // [macOS]
@interface RCTModalHostView : RCTUIView <RCTInvalidating, UIAdaptivePresentationControllerDelegate>
#else // [macOS
@interface RCTModalHostView : RCTUIView <RCTInvalidating>
#endif // macOS]

@property (nonatomic, copy) NSString *animationType;
#if !TARGET_OS_OSX // [macOS
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
#endif // macOS]b
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) RCTDirectEventBlock onShow;
@property (nonatomic, assign) BOOL visible;

// Android only
@property (nonatomic, assign) BOOL statusBarTranslucent;
@property (nonatomic, assign) BOOL hardwareAccelerated;
@property (nonatomic, assign) BOOL animated;

@property (nonatomic, copy) NSNumber *identifier2; // [macOS]

@property (nonatomic, weak) id<RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) RCTDirectEventBlock onOrientationChange;

// Fabric only
@property (nonatomic, copy) RCTDirectEventBlock onDismiss;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;
- (void)dismissModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;

@end
