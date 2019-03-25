import path from 'path'
import webpack from 'webpack'
import { WDS_PORT, isDev } from '../common'
const publicPath = `http://localhost:${WDS_PORT}/dist`;

export default {
    target: 'electron-renderer',
    devtool: isDev ? 'inline-source-map' : false,
    mode: 'development',
    entry: [
        'react-hot-loader/patch',
        './src/client/index.jsx',
    ],
    output: {
        path: path.resolve(__dirname, '..', '..', 'dist'),
        filename: "js/bundle.js",
        publicPath: isDev ? publicPath : '/static'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ],
    node: {
        __dirname: false,
        __filename: false
    },
    devServer: {
        port: WDS_PORT,
        compress: true,
        hot: true,
        headers: {
			'Access-Control-Allow-Origin': '*'
        }
    }
}
