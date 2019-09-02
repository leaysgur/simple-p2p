/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = config =>
  config.set({
    // logLevel: config.LOG_DEBUG,
    logLevel: config.LOG_WARN,
    singleRun: true,
    reporters: ["mocha"],
    browsers: ["Chrome", "Firefox", "Safari"],
    frameworks: ["jasmine"],
    files: [{ pattern: "__tests__/**/*.test.js", watched: false }],
    preprocessors: {
      "./__tests__/**/*.test.js": ["rollup"]
    },
    rollupPreprocessor: {
      plugins: [
        require("rollup-plugin-node-resolve")({ browser: true }),
        require("rollup-plugin-commonjs")()
      ],
      output: {
        format: "iife",
        sourcemap: "inline"
      }
    }
  });
