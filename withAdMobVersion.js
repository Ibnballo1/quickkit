const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withAdMobVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const forceResolution = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-ads:23.6.0'
        }
    }
}
`;
    if (!buildGradle.includes("com.google.android.gms:play-services-ads")) {
      config.modResults.contents = buildGradle + forceResolution;
    }
    return config;
  });
};
