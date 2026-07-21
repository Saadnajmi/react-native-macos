#!/usr/bin/env node
import { $, echo, fs } from 'zx';
import { updateReactNativeArtifacts } from '../../scripts/releases/set-rn-artifacts-version.js';

// Step 1: Run changeset version to bump package.json files and update CHANGELOGs
echo('📦 Running changeset version...');
await $`pnpm exec changeset version`;

// Step 2: Update native artifacts to match the new react-native version
echo('\n🔄 Updating React Native native artifacts...');
const { version } = fs.readJsonSync('packages/react-native/package.json');
await updateReactNativeArtifacts(version);
echo('✅ Native artifacts updated');

// Step 3: Update pnpm-lock.yaml to reflect all changes
echo('\n🔒 Updating pnpm-lock.yaml...');
await $`pnpm install --lockfile-only`;

echo('\n✅ Version bump complete!');
