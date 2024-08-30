
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateEventEmitterCpp.js
 */

#include "EventEmitters.h"


namespace facebook::react {

void SampleNativeComponentEventEmitter::onIntArrayChanged(OnIntArrayChanged $event) const {
  dispatchEvent("intArrayChanged", [$event=std::move($event)](jsi::Runtime &runtime) {
    auto $payload = jsi::Object(runtime);
    
    auto values = jsi::Array(runtime, $event.values.size());
    size_t valuesIndex = 0;
    for (auto valuesValue : $event.values) {
      values.setValueAtIndex(runtime, valuesIndex++, valuesValue);
    }
    $payload.setProperty(runtime, "values", values);
  

    auto boolValues = jsi::Array(runtime, $event.boolValues.size());
    size_t boolValuesIndex = 0;
    for (auto boolValuesValue : $event.boolValues) {
      boolValues.setValueAtIndex(runtime, boolValuesIndex++, (bool)boolValuesValue);
    }
    $payload.setProperty(runtime, "boolValues", boolValues);
  

    auto floats = jsi::Array(runtime, $event.floats.size());
    size_t floatsIndex = 0;
    for (auto floatsValue : $event.floats) {
      floats.setValueAtIndex(runtime, floatsIndex++, floatsValue);
    }
    $payload.setProperty(runtime, "floats", floats);
  

    auto doubles = jsi::Array(runtime, $event.doubles.size());
    size_t doublesIndex = 0;
    for (auto doublesValue : $event.doubles) {
      doubles.setValueAtIndex(runtime, doublesIndex++, doublesValue);
    }
    $payload.setProperty(runtime, "doubles", doubles);
  

    auto yesNos = jsi::Array(runtime, $event.yesNos.size());
    size_t yesNosIndex = 0;
    for (auto yesNosValue : $event.yesNos) {
      yesNos.setValueAtIndex(runtime, yesNosIndex++, toString(yesNosValue));
    }
    $payload.setProperty(runtime, "yesNos", yesNos);
  

    auto strings = jsi::Array(runtime, $event.strings.size());
    size_t stringsIndex = 0;
    for (auto stringsValue : $event.strings) {
      strings.setValueAtIndex(runtime, stringsIndex++, stringsValue);
    }
    $payload.setProperty(runtime, "strings", strings);
  

    auto latLons = jsi::Array(runtime, $event.latLons.size());
    size_t latLonsIndex = 0;
    for (auto latLonsValue : $event.latLons) {
      auto latLonsObject = jsi::Object(runtime);
      latLonsObject.setProperty(runtime, "lat", latLonsValue.lat);
latLonsObject.setProperty(runtime, "lon", latLonsValue.lon);
      latLons.setValueAtIndex(runtime, latLonsIndex++, latLonsObject);
    }
    $payload.setProperty(runtime, "latLons", latLons);
  

    auto multiArrays = jsi::Array(runtime, $event.multiArrays.size());
    size_t multiArraysIndex = 0;
    for (auto multiArraysValue : $event.multiArrays) {
      auto multiArraysArray = jsi::Array(runtime, multiArraysValue.size());
      size_t multiArraysIndexInternal = 0;
      for (auto multiArraysValueInternal : multiArraysValue) {
        multiArraysArray.setValueAtIndex(runtime, multiArraysIndexInternal++, multiArraysValueInternal);
      }
      multiArrays.setValueAtIndex(runtime, multiArraysIndex++, multiArraysArray);
    }
    $payload.setProperty(runtime, "multiArrays", multiArrays);
  
    return $payload;
  });
}

} // namespace facebook::react
