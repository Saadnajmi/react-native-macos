/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/** ViewManager for [ReactUnimplementedView] to represent a component that is not yet supported. */
@ReactModule(name = ReactUnimplementedViewManager.REACT_CLASS)
public class ReactUnimplementedViewManager : ViewGroupManager<ReactUnimplementedView>() {

  protected override fun createViewInstance(
      reactContext: ThemedReactContext
  ): ReactUnimplementedView = ReactUnimplementedView(reactContext)

  public override fun getName(): String = REACT_CLASS

  @ReactProp(name = "name")
  public fun setName(view: ReactUnimplementedView, name: String) {
    view.setName(name)
  }

  public companion object {
    public const val REACT_CLASS: String = "UnimplementedNativeView"
  }
}
