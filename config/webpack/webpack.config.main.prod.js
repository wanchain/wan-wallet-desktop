const path = require('path');
const nodeExternals = require('webpack-node-externals');

const config = {
    externals: [nodeExternals()],

    target: 'electron-main',

    devtool: 'source-map',
    
    mode: "production",
    
    entry: './src/main.dev.js',
    
    output: {
        filename: 'main.prod.js',
        path: path.join(__dirname, '..', '..', 'dist')
    },
    
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                    }
                }
            }
        ]
    },
    
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.node']
    },
    
    node: {
        __dirname: false,
        __filename: false
    }
}

module.exports = config;