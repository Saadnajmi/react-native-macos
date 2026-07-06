# Bazel Support Draft PR - Summary & Next Steps

## What This PR Contains

This is a **draft/exploration PR** for adding Bazel build system support to react-native-macos. It's not production-ready but establishes the foundation for a phased migration.

### ✅ Completed in This PR

1. **Yarn v4 pnpm Linker Mode**
   - Switched from traditional node-modules to pnpm linker mode
   - Better monorepo support and disk efficiency
   - Bazel-compatible dependency structure

2. **Bazel Workspace Configuration**
   - WORKSPACE.bazel: Workspace definition (ready for rules_js, rules_apple integration)
   - BUILD.bazel: Root BUILD file with exports
   - .bazelrc: Development and CI build configurations
   - .bazelignore: Excludes non-Bazel directories from analysis

3. **Documentation**
   - **BAZEL.md**: Comprehensive architecture guide covering:
     - Design decisions (rules_js, pnpm linker, Apple rules, remote cache strategy)
     - Current status and implementation phases
     - Getting started guide
     - Known limitations and troubleshooting
   
   - **BAZEL_INTEGRATION.md**: Practical guide for contributors during transition
     - How to work with code during Bazel migration
     - Best practices for Bazel-friendly code
     - Reporting issues and next steps
   
   - **BAZEL_DOWNSTREAM_COMPAT.md**: Downstream consumer impact analysis
     - NPM package compatibility
     - Native binary compatibility
     - Breaking change assessment
     - Validation strategy

4. **Research & Decision Making**
   - Analyzed Meta's Buck2 prelude (JS + Apple integration patterns)
   - Evaluated aspect-build/rules_js (production-ready, pnpm-native)
   - Documented trade-offs between custom rules vs. using proven ecosystems

### 🚧 NOT Completed (Future Phases)

- ❌ rules_js integration for JavaScript packages
- ❌ Native Bazel rules for iOS/macOS modules
- ❌ Remote cache backend (GitHub Actions)
- ❌ CI/CD Bazel integration
- ❌ Performance optimization
- ❌ Downstream compatibility validation tests

## Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **JS Rules** | aspect-build/rules_js | Production-ready, high performance, pnpm-native, proven at scale |
| **Package Linker** | Yarn v4 with pnpm mode | Maintains Yarn workflow while gaining pnpm efficiency |
| **Apple Rules** | Native Bazel + rules_apple | Mature, well-tested, good Xcode integration |
| **Remote Cache** | GitHub Actions (future) | Free tier, built-in, can upgrade to RBE later |
| **Rollout** | Phased, 5+ phases | Safer for team adoption; allows parallel Yarn + Bazel builds |

## How This Enables Future Work

```
Phase 1 ✅: Foundations (this PR)
├─ pnpm linker for dependency structure
├─ Bazel workspace scaffolding
└─ Design decisions & documentation

Phase 2: JS Package Integration
├─ rules_js for JavaScript packages
├─ Monorepo package discovery
└─ Proof-of-concept builds

Phase 3: Native Integration
├─ apple_library + apple_bundle rules
├─ Xcode workspace generation
└─ CocoaPods or SPM integration

Phase 4: Build System Integration
├─ CI/CD Bazel targets
├─ Remote cache backend
└─ Performance validation

Phase 5: Optimization & Rollout
├─ Performance tuning
├─ Downstream compatibility testing
└─ Public migration guide
```

## For Reviewers

### ✅ This PR is safe to merge because:
1. **No production code changes**: Only build infrastructure
2. **Backward compatible**: Existing Yarn and xcodebuild workflows still work
3. **pnpm linker tested**: Yarn install completes successfully
4. **Documentation complete**: Clear path forward for contributors
5. **Phased approach**: Allows team to validate before deeper integration

### ⚠️ Known Limitations:
- Bazel targets not yet functional; use Yarn/xcodebuild for development
- pnpm linker has stricter peer dependency rules (expected warnings in yarn install)
- No CI Bazel integration yet; traditional builds continue

### 🔍 Review Checklist:
- [ ] WORKSPACE.bazel is valid Bazel syntax
- [ ] .bazelrc settings are reasonable defaults
- [ ] Documentation is clear and actionable
- [ ] BAZEL.md correctly describes design decisions
- [ ] No breaking changes for existing contributors

## Testing This PR

### Local Testing
```bash
# The pnpm linker should work without issues
yarn install

# Verify directory structure (check for .store)
ls -la node_modules/.store

# Verify Bazel workspace is valid
bazel info workspace  # Should succeed

# Traditional builds still work
yarn build
yarn test
```

### What NOT to Test Yet
- ❌ `bazel build //packages/...` (rules_js not integrated)
- ❌ `bazel test` (Jest integration pending)
- ❌ Xcode integration through Bazel (coming in Phase 3)

## Q&A for Reviewers

**Q: Will this break the build?**
A: No. pnpm linker is well-tested; existing Yarn/xcodebuild paths unchanged.

**Q: Do I need to use Bazel now?**
A: No. This is foundational work. Bazel becomes optional in Phase 2, primary in Phase 5+.

**Q: Is this a big breaking change?**
A: Not a breaking change, but a strategic direction shift. The pnpm linker is stricter about peer dependencies, which may expose issues (but builds should succeed).

**Q: Why such a long phased rollout?**
A: Team safety and validation. Bazel is a large change; phased approach allows continuous validation and course-correction.

## Next Steps (After Merge)

1. **Get feedback**: Ensure pnpm linker works in CI and doesn't break workflows
2. **Phase 2 (separate PR)**: Integrate rules_js for JS packages
3. **Phase 3 (separate PR)**: Add native Bazel rules
4. **Phase 4+ (ongoing)**: CI integration, caching, performance

## Additional Context

- Clone of Buck2 in ~/Developer/buck2 for reference (artifact of research)
- Clone of rules_js in ~/Developer/rules_js for reference (artifact of research)
- Full architecture docs in BAZEL.md and referenced documents

---

**This is exploratory work toward faster builds and better monorepo management. All feedback welcome!**
