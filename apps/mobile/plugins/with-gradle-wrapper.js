const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Expo 57 requires Gradle >= 9.4.1; the prebuild template ships an older wrapper.
const GRADLE_DIST_URL = 'https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip';

module.exports = function withGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const file = path.join(
        modConfig.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties',
      );
      const contents = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(
        file,
        contents.replace(/^distributionUrl=.*$/m, `distributionUrl=${GRADLE_DIST_URL}`),
      );
      return modConfig;
    },
  ]);
};
