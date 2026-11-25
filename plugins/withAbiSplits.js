const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'FOX_PLANNER_ABI_SPLITS';

/**
 * Pure helper exposed for testing and Gradle modification.
 * Enables per-ABI APK splits only when `-PsplitApks=true` is passed to Gradle,
 * keeping standard EAS APK/AAB builds conflict-free.
 */
function injectAbiSplitsGradle(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }
  const splitsBlock = `    // ${MARKER}
    splits {
        abi {
            reset()
            enable project.hasProperty("splitApks")
            universalApk true
            include "armeabi-v7a", "arm64-v8a", "x86_64"
        }
    }`;
  return contents.replace(/(android\s*\{)/, `$1\n${splitsBlock}`);
}

function withAbiSplits(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = injectAbiSplitsGradle(mod.modResults.contents);
    return mod;
  });
}

module.exports = withAbiSplits;
module.exports.injectAbiSplitsGradle = injectAbiSplitsGradle;
