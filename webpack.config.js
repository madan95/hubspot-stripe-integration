const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = () => {
    const serverConfig = {
        target: 'node',
        entry: {
            stripewebhook: '.src/serverless-functions/stripewebhook.js'
        },
        output: {
            path: path.resolve(__dirname, 'custom-theme/functions/app.functions'),
            filename: '[name].js',
            libraryTraget: 'umd'
        },
        optimization: {
            minimize: false,
        },
        plugin: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'src/serverless-functions/serverless.json',
                        to: 'serverless.json'
                    }
                ]
            })
        ]
    };
    return [serverConfig];
}