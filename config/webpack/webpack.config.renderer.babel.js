import path from 'path';
import { spawn } from 'child_process';
import webpack from 'webpack';
import { WDS_PORT, isDev } from '../common';
const autoprefixer = require('autoprefixer');
const publicPath = `http://localhost:${WDS_PORT}/dist`;


function resolve (dir) {
  return path.join(__dirname, '../../', dir)
}

export default {
    target: 'electron-renderer',
    devtool: isDev ? 'inline-source-map' : false,
    mode: 'development',
    entry: [
        'react-hot-loader/patch',
        './src/app/App.js',
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
                use: {
                    loader: "babel-loader",
                    options: {
                      plugins: [
                        ['import', {
                          libraryName: 'antd',
                          style: true
                        }]
                      ]
                    }
                }
            },
            {
              test: /\.less$/,
              use: [
                'style-loader',
                {loader: 'css-loader', options: { importLoaders: 1 }},
                {loader: 'postcss-loader', options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9',
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                }},
                {
                  loader:'less-loader',
                  options: {
                    modules: false,
                    modifyVars: {
                        "@text-color": "#fff",
                        "@table-header-bg": "#1A1B2C",
                        "@table-header-color": "#fff",
                        "@table-row-hover-bg": "#1F2034"
                    }
                  }
                }
              ]
            },
            {
              test: /\.css$/,
              use: [
                'style-loader',
                { loader: 'css-loader', options: { importLoaders: 1 } },
                {loader: 'postcss-loader', options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9',
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                }},
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
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        static: resolve('static/'),
        constants: resolve('src/app/constants/'),
        components: resolve('src/app/components/'),
        containers: resolve('src/app/containers/'),
        utils: resolve('src/app/utils/')
      }
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
