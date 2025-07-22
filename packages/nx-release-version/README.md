# os/nx-release-version

Modern Nx 21 Version Actions for React Native macOS releases.

## Overview

This package provides custom Version Actions for Nx 21's modern release system (`useLegacyVersioning: false`). It extends the built-in `JsVersionActions` to include React Native platform-specific artifact updates.

## What it does

When versioning the `react-native-macos` project, this package automatically:

1. **Updates standard package.json files** (via the base `JsVersionActions`)
2. **Updates React Native platform artifacts**:
   - `ReactAndroid/gradle.properties`
   - `ReactNativeVersion.java`
   - `RCTVersion.m`
   - `ReactNativeVersion.h`
   - `ReactNativeVersion.js`
3. **Creates a `.rnm-publish` marker file** to indicate successful versioning

## Migration from Legacy

This package has been migrated from the legacy generator-based approach to the modern Nx 21 Version Actions API:

### Before (Legacy)
```json
{
  "release": {
    "version": {
      "generator": "@react-native-mac/nx-release-version:release-version",
      "generatorOptions": { ... },
      "useLegacyVersioning": true
    }
  }
}
```

### After (Modern)
```json
{
  "release": {
    "version": {
      "versionActions": "@react-native-mac/nx-release-version",
      "versionActionsOptions": { ... },
      "useLegacyVersioning": false
    }
  }
}
```

## Architecture

- **`index.js`**: Main entry point containing the `ReactNativeMacOSVersionActions` class that extends `JsVersionActions`
- **Legacy files removed**: `generators.json`, `schema.json`, `src/` directory

## Benefits of Modern Approach

1. **Better Integration**: Seamless integration with Nx 21's release lifecycle
2. **Type Safety**: Better TypeScript support and IDE integration
3. **Ecosystem Support**: Works with other Nx 21 ecosystem plugins
4. **Future Proof**: No longer depends on legacy APIs that will be removed in Nx 22

## Usage

This package is automatically used when running `nx release` commands. No direct invocation needed.

```bash
# Version and release projects
npx nx release

# Create version plans
npx nx release plan patch

# Version with specific increment
npx nx release version patch
```
