# Downstream Compatibility Analysis

## Overview

This document analyzes potential impacts of Bazel integration on downstream consumers of the react-native-macos NPM package and platform artifacts.

## Key Concerns

### 1. NPM Package Structure

Current build produces: `npm install react-native-macos`
- Contains pre-built JavaScript (if any)
- Contains native binary headers
- Contains build scripts and configuration

**Current approach**: Yarn builds JS output, yarn pack creates tarball

**With Bazel**: Need to ensure:
- Tarball structure remains identical
- File permissions preserved
- Binary artifacts present and correct
- No Bazel build artifacts leaking into package

**Mitigation**:
- Define explicit Bazel target for NPM package creation
- Create validation test comparing old vs new tarballs
- Test installation in fresh project

### 2. Native Binary Compatibility

Current: Consumers use CocoaPods (react-native-macos podspec) or Swift Package Manager

**With Bazel**: 
- iOS Framework (.framework) structure must match pod format
- macOS Framework structure must match current layout
- Swift headers must be discoverable via normal import paths

**Validation needed**:
```bash
# Extract and compare frameworks
cd /tmp/test-bazel && npm install react-native-macos
cd /tmp/test-yarn && npm install react-native-macos  # from old build

# Compare binary structure
diff -r test-bazel test-yarn
```

### 3. Breaking Changes

**Potential breaking changes**:
- Package.json version changes (if build process generates this)
- TypeScript definitions structure (if changed)
- Script entrypoints (if Bazel renames them)

**What won't change** (keeping compatibility):
- Public API (Objective-C exports)
- Module resolution paths
- Native headers layout

### 4. CI/Build Tool Validation

**Test matrix**:
- [ ] Old-build tarball installs in new project
- [ ] New-build tarball installs in new project
- [ ] iOS build with old binary vs new binary (xcodebuild comparison)
- [ ] macOS build with old binary vs new binary
- [ ] Existing projects upgrading see no errors
- [ ] New projects from template work with new binary

### 5. Documentation & Migration

If any breaking changes identified:

**For each breaking change**:
1. Document it clearly in CHANGELOG
2. Provide migration guide
3. Deprecation warnings in old path (if applicable)
4. Version bump (major.minor.patch decision)

**User communication**:
- GitHub discussion announcing Bazel integration
- Blog post on aspect-build or RN macOS blog
- Issue template for Bazel-related problems

## Implementation Checklist

### Phase 6 (Draft PR)

- [ ] Ensure NPM tarball creation works with Bazel outputs
- [ ] Manual smoke test: npm install in fresh project
- [ ] Binary structure validation (iOS Framework, macOS Framework)
- [ ] TypeScript definitions check
- [ ] Package.json contents verification

### Phase 7+ (Future)

- [ ] Automated CI test for tarball compatibility
- [ ] Comparison tests (old build vs new build)
- [ ] Xcode project integration test
- [ ] CocoaPods podspec validation
- [ ] Swift Package Manager manifest validation
- [ ] Performance benchmark (build time, size)

## Known Risks

1. **Framework binary locations**: Bazel may output frameworks differently than Yarn
   - Risk level: Medium
   - Mitigation: Custom Bazel rule to normalize output paths

2. **Header search paths**: Xcode header resolution may differ
   - Risk level: Medium
   - Mitigation: Test with real Xcode projects, validate include paths

3. **Build script compatibility**: Consumers' package.json scripts may depend on specific paths
   - Risk level: Low (usually consumed via pod/SPM, not direct scripts)
   - Mitigation: Preserve script interfaces

4. **Version detection**: If Bazel build process generates version strings differently
   - Risk level: Low
   - Mitigation: Test version detection after Bazel build

## Success Criteria

✅ Downstream migration is successful if:
1. Existing projects upgrade without errors
2. New projects can bootstrap without changes
3. No new issues reported by consumers
4. Build performance improves (or is neutral)
5. CI/CD pipeline is faster or comparable

## References

- See BAZEL.md for architecture decisions
- See BAZEL_INTEGRATION.md for contributor guidelines
- NPM package structure: https://docs.npmjs.com/cli/v8/configuring-npm/package-json
- iOS Framework layout: https://developer.apple.com/documentation/bundleresources
- CocoaPods podspec format: https://guides.cocoapods.org/making/specs-and-specs-repo.html
