import path from 'path'
import dotenv from 'dotenv';
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

export default {
    externals: [nodeExternals()],

    target: 'electron-main',

    devtool: 'source-map',
    
    mode: "production",
    
    entry: {
        main: './src/main.dev.js',
        preload: './src/modules/preload/index.js'
    },
    
    output: {
        filename: '[name].js',
        path: path.join(__dirname, '..', '..', 'build'),
    },
    
    module: {
        // unknownContextCritical : false,
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
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    
    node: {
        __dirname: false,
        __filename: false
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
            ...dotenv.config().parsed
        })
    ]
}

