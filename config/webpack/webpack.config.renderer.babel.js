import path from 'path'
import { spawn } from 'child_process'
import webpack from 'webpack'
import { WDS_PORT, isDev } from '../common'
const publicPath = `http://localhost:${WDS_PORT}/dist`;

export default {
    target: 'electron-renderer',
    devtool: isDev ? 'inline-source-map' : false,
    mode: 'development',
    entry: [
        'react-hot-loader/patch',
        './src/app/index.js',
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
            },
            {
              test: /\.css$/,
              use: [
                { loader: "style-loader" },
                { loader: "css-loader" }
              ]
            },
            {
              test: /\.(png|jpg|gif)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {},
                }
              ]
            },
        ]
    },
    resolve: {
      alias: {
        static: path.resolve(__dirname, '../../static/'),
        components: path.resolve(__dirname, '../../src/app/components/')
      },
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
        headers: { 'Access-Control-Allow-Origin': '*' },
        after: function() {
            if (process.env.NODE_ENV === 'development') {
                spawn('npm', ['run', 'dev:main'], {
                    shell: true,
                    env: process.env,
                    stdio: 'inherit'
                  })
                    .on('close', code => process.exit(code))
                    .on('error', spawnError => console.error(spawnError));
            }
        }
    }
}
