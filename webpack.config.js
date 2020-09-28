const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = (env, argv) => {
    const serverConfig = {
        target: 'node',
        entry: {
            payment: './src/serverless-functions/payment.js',
            stripewebhook: './src/serverless-functions/stripewebhook.js'
        },
        output: {
            path: path.resolve(__dirname, 'custom-theme/functions/app.functions'),
            filename: '[name].js',
            libraryTarget: 'umd'
        },
        optimization: {
            minimize: false,
        },
        plugins: [
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