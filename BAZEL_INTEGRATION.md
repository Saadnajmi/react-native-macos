# Bazel Integration for react-native-macos

This document outlines the current state of Bazel support and how to work with it during the transition period.

## Current Status (Draft PR)

This is a **draft/proof-of-concept pull request**. Not all features are implemented yet, and both the traditional Yarn/xcodebuild and Bazel build systems exist in parallel.

### What's Working
- ✅ Yarn v4 with pnpm linker mode
- ✅ Basic Bazel workspace configuration (WORKSPACE.bazel, .bazelrc, BUILD.bazel)
- ✅ Documentation of design decisions and migration path
- ✅ macOS/iOS Xcode environment (still using traditional xcodebuild)

### What's Coming
- 🚧 rules_js integration for JavaScript packages
- 🚧 Native Bazel rules for iOS/macOS modules
- 🚧 Remote cache support (GitHub Actions backend)
- 🚧 CI/CD Bazel build integration
- 🚧 Performance benchmarks and optimization

## For Contributors

### During This Transition Phase

**Use the existing yarn/xcodebuild workflows.** Bazel rules are not yet ready for production use.

```bash
# Install dependencies (uses pnpm linker, which is Bazel-compatible)
yarn install

# Build JS packages
yarn build

# Build iOS/macOS apps
cd packages/rn-tester
bundle install
bundle exec pod install
xcodebuild build

# Run tests
yarn test
```

### Preparing for Bazel Migration

When adding new code or packages, keep these Bazel-friendly practices in mind:

1. **Clear dependency declarations**: Ensure package.json explicitly lists all dependencies
2. **Avoid implicit file globs**: Don't rely on "automatic" includes; be explicit in what your code uses
3. **Modular structure**: Keep packages logically separated (good for Bazel module boundaries)
4. **Standard tooling**: Use industry-standard build tools (TypeScript, Jest, eslint) rather than custom scripts

### Reporting Issues

If you encounter problems with the pnpm linker or notice differences from the old node-modules setup:

1. Check [BAZEL.md](../BAZEL.md) troubleshooting section
2. File an issue describing the problem and environment
3. If it's blocking, you can temporarily switch back to node-modules linker in `.yarnrc.yml` (though this defeats the purpose)

## For Maintainers/Reviewers

### Review Checklist for This PR

- [x] pnpm linker changes don't break Microsoft CI workflows
- [ ] WORKSPACE.bazel and BUILD.bazel are valid (validate with `bazel info workspace`)
- [ ] Documentation (BAZEL.md) is clear and complete
- [ ] No production code changes; only build configuration
- [ ] Examples and guidelines are actionable

### Next Steps After Merge

1. **Phase 2**: Integrate rules_js for JS packages (separate PR)
2. **Phase 3**: Add native Bazel rules for iOS/macOS
3. **Phase 4**: Enable Bazel in CI pipeline with remote cache
4. **Phase 5**: Deprecate legacy build paths (after team validation)

## Q&A

**Q: Why pnpm linker mode instead of native pnpm?**
A: pnpm is a package manager; Yarn is our declared requirement. Yarn's pnpm linker gives us the best of both: familiar Yarn CLI with efficient pnpm symlink structure.

**Q: Will this break my local development?**
A: The pnpm linker has stricter peer dependency handling than node-modules, which may expose previously-ignored issues. See peer dependency warnings in yarn install output.

**Q: Why not use Yarn Plug'n'Play (PnP)?**
A: PnP doesn't work well with native tools and Xcode, which expect traditional node_modules structure. The pnpm linker offers similar benefits without compatibility issues.

**Q: When do I need to use Bazel directly?**
A: Not yet! Once rules_js is integrated (Phase 2), JS developers can use `bazel build //packages/...` and `bazel test //packages/...`. For now, use `yarn`.

**Q: Will this slow down my builds initially?**
A: Possibly. The pnpm linker changes symlink structure slightly, and initial Bazel integration may add overhead. Performance improvements come in Phase 4+ with caching and optimization.

## References

- [BAZEL.md](../BAZEL.md) - Architecture and design decisions
- [.yarnrc.yml](../.yarnrc.yml) - Yarn pnpm linker configuration
- [Bazel documentation](https://bazel.build)
- [aspect-build/rules_js](https://github.com/aspect-build/rules_js)

---

**Have questions?** Post in the issue thread or tag @Saadnajmi in PRs related to this work.
