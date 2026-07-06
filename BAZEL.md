# Bazel Support for react-native-macos

This document describes the Bazel integration strategy and current implementation status.

## Overview

react-native-macos is migrating to Bazel to improve:
- Local development build times
- CI/CD pipeline performance
- Cross-platform (JS + native) build consistency
- Remote cache and distributed build support

This is currently a **draft/proof-of-concept** implementation. See [Status](#status) below.

## Architecture

### Design Decisions

1. **JS Rules**: Using [aspect-build/rules_js](https://github.com/aspect-build/rules_js)
   - Industry-standard, production-ready
   - pnpm-native for efficient dependency resolution
   - Works well with monorepos
   - Replaces complex Yarn/Jest plumbing with Bazel rules

2. **Package Manager**: Switched to Yarn v4 with **pnpm linker mode** (not npm or pnpm directly)
   - Maintains Yarn's workflow compatibility (yarn install, yarn run scripts, etc.)
   - Uses pnpm's efficient symlink structure (.store directory)
   - Bazel sees isolated package trees, avoiding module resolution chaos
   - See `.yarnrc.yml` for linker configuration

3. **Apple/macOS Rules**: Using native Bazel [apple_library](https://bazel.build/reference/be/objective-c-cpp#apple_library) and [apple_bundle](https://bazel.build/reference/be/objective-c-cpp#apple_bundle)
   - Mature Bazel support for iOS/macOS/visionOS
   - Handles Xcode integration, code signing, dsyms automatically
   - Build cache compatible with Swift and Objective-C++

4. **Remote Cache**: GitHub Actions cache backend (future work)
   - Free tier: GitHub provides built-in cache API
   - Avoids paid Aspect/Bazel Cloud for initial phases
   - Can upgrade to RBE later if needed

## Project Structure

```
react-native-macos/
├── WORKSPACE.bazel              # Bazel workspace definition
├── BUILD.bazel                  # Root BUILD file
├── .bazelrc                      # Bazel configuration and defaults
├── BAZEL.md                      # This file
├── packages/
│   ├── react-native/            # Main library (will have BUILD.bazel)
│   ├── rn-tester/               # Test app (will have BUILD.bazel)
│   ├── dev-middleware/          # JS packages with Bazel rules
│   └── ...
└── tools/                        # Bazel toolchain and utility rules (future)
```

## Current Status

### ✅ Completed
- [x] Switched Yarn to pnpm linker mode
- [x] Created WORKSPACE.bazel, BUILD.bazel, .bazelrc
- [x] Documented design decisions

### 🚧 In Progress
- [ ] Integrate rules_js for JS packages
- [ ] Create BUILD.bazel files for monorepo packages

### 📋 TODO
- [ ] Create apple_library rules for native modules
- [ ] Set up Bazel + Xcode workspace generation
- [ ] Configure Bazel CI integration (GitHub Actions)
- [ ] Implement remote cache backend
- [ ] Create migration guide and troubleshooting docs
- [ ] Validate downstream package compatibility (NPM tarball)
- [ ] Performance benchmarks (local vs CI)

## Getting Started (Local Development)

### Prerequisites
- Bazel 6.0+: `brew install bazel` or `bazelisk`
- Xcode 14+ (for native builds)
- Node.js 18+ (included in Bazel rules, but for local dev)

### Installation
```bash
# Install dependencies with pnpm linker
yarn install

# Verify Bazel workspace
bazel info workspace
```

### Building
```bash
# Build a specific JS package (when rules_js is integrated)
bazel build //packages/react-native:dist

# Build native iOS app with Bazel
bazel build //packages/rn-tester:app_ios

# Run tests
bazel test //packages/...
```

### Local Development Loop
```bash
# Watch mode for JS changes
bazel run //packages/react-native:watch

# Interactive Xcode development (fallback to native xcodebuild)
xcodebuild -workspace packages/rn-tester/RNTesterPods.xcworkspace build
```

## Known Limitations

1. **Dual Build System**: For now, Bazel and Yarn/xcodebuild coexist.
   - Not all targets have Bazel equivalents yet
   - Use `yarn` for development until migration is complete
   - Bazel rules_js will gradually replace Yarn scripts

2. **iOS Pods**: CocoaPods integration is incomplete.
   - Currently still using `pod install` alongside Bazel
   - Future: Explore [rules_apple + Podfile automation](https://github.com/bazelbuild/rules_apple) or Swift Package Manager

3. **Performance**: Not yet optimized.
   - Caching, remote build, and Xcode integration still being developed
   - Local builds may be slower initially until rules are tuned

4. **Downstream Compatibility**: NPM package tarball structure TBD.
   - Ensure Bazel-built artifacts match Yarn build exactly
   - Validation tests to be added

## Migration Path

### Phase 1: Foundation (Current)
- ✅ Yarn pnpm linker
- [ ] Basic Bazel workspace
- [ ] rules_js integration (proof-of-concept)

### Phase 2: JS Packages
- [ ] Migrate JavaScript packages to Bazel rules_js
- [ ] Validate tests and linters work
- [ ] Update CI to use Bazel for JS builds

### Phase 3: Native Integration
- [ ] Create apple_library rules for native modules
- [ ] Handle Xcode workspace generation
- [ ] Migrate CocoaPods targets or use SPM

### Phase 4: Polish & Optimization
- [ ] Remote cache backend
- [ ] CI/CD integration
- [ ] Performance benchmarks
- [ ] Downstream package compatibility validation
- [ ] Public migration guide

### Phase 5: Full Rollout (Future)
- [ ] Switch CI to Bazel builds
- [ ] Deprecate legacy Yarn/xcodebuild paths
- [ ] Update contributor documentation

## Troubleshooting

### `bazel build` fails with "module not found"
- Ensure `yarn install` was run with pnpm linker
- Check `.yarnrc.yml` has `nodeLinker: pnpm`
- Clear Bazel cache: `bazel clean`

### Xcode can't find headers
- This is expected during transition phase
- Fall back to native xcodebuild for now
- Native Bazel integration will handle this in Phase 3

### CI tests fail with new pnpm linker
- Peer dependency warnings are expected (Yarn limitation)
- If builds fail, check peer dependency graph: `yarn explain peer-requirements`
- May need to add missing dependencies to workspace packages

## References

- [Bazel documentation](https://bazel.build)
- [aspect-build/rules_js](https://github.com/aspect-build/rules_js)
- [Meta's Buck2 Apple prelude](https://github.com/facebook/buck2/tree/main/prelude/apple)
- [Bazel Apple rules](https://bazel.build/reference/be/objective-c-cpp)
- [Yarn pnpm linker documentation](https://yarnpkg.com/configuration/yarnrc#nodeLinker)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines. When working with Bazel:

1. Add `BUILD.bazel` files in package directories
2. Follow existing rule patterns
3. Test with `bazel build` and `bazel test`
4. Document any custom rules or toolchain changes

## Support

For questions or issues:
- File an issue on [react-native-macos](https://github.com/Saadnajmi/react-native-macos/issues)
- Check existing Bazel issues in this repo
- Community support: [Bazel Slack #javascript channel](https://slack.bazel.build)
