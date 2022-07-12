var path = require("path");

module.exports = {
    entry: "./src/main.js",
    output: {
        path: path.resolve(__dirname, "dist/"),
        filename: "bundle.js",
        clean: true,
    },
    mode: "development",
    devtool: "source-map",
};
