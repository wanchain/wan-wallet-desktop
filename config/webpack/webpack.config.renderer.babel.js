import path from 'path';
import webpack from 'webpack';
import { WDS_PORT, isDev } from '../common';
import { spawn } from 'child_process';
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const publicPath = `http://localhost:${WDS_PORT}/dist/`;

function resolve (dir) {
  return path.join(__dirname, '../../', dir)
}

export default {
    target: 'electron-renderer',
    devtool: isDev ? 'cheap-module-eval-source-map' : false,
    mode: 'development',
    entry: [
        'react-hot-loader/patch',
        './src/app/App.js',
    ],
    output: {
        path: resolve('dist'),
        filename: "js/bundle.js",
        publicPath: isDev ? publicPath : '/static'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                      cacheDirectory: true,
                      presets: ['@babel/preset-env'],
                      plugins: [
                        '@babel/transform-runtime',
                        ['import', {
                          libraryName: 'antd',
                          style: true
                        }]
                      ]
                    }
                }
            },
            {
              test: /\.(le|c)ss$/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    // only enable hot in development
                    hmr: process.env.NODE_ENV === 'development',
                    // if hmr does not work, this is a forceful method.
                    reloadAll: true,
                  },
                },
                // 'style-loader',
                {loader: 'css-loader', options: { importLoaders: 1 }},
                {loader: 'postcss-loader', options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes')
                  ],
                }},
                {
                  loader:'less-loader',
                  options: {
                    modules: false,
                    modifyVars: {
                        "@text-color": "#fff",
                        "@nav-left-bg": "#151625",
                        "@content-right-bg": "#1A1B2C",
                        "@table-header-color": "#fff",
                        "@table-row-hover-bg": "#1F2034"
                    }
                  }
                }
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
            {
              test:/\.(eot|woff2|woff|ttf)/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    name: '[path][hash:5].min.[ext]',
                    limit: 40000,
                  }
                }
              ],
            },
        ]
    },
    resolve: {
      symlinks: false,
      cacheWithContext: false,
      extensions: ['.js'],
      alias: {
        static: resolve('static/'),
        constants: resolve('src/app/constants/'),
        components: resolve('src/app/components/'),
        componentUtils: resolve('src/app/componentUtils/'),
        containers: resolve('src/app/containers/'),
        utils: resolve('src/app/utils/'),
        "react-dom": "@hot-loader/react-dom"
      }
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // new BundleAnalyzerPlugin()
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[id].css',
          ignoreOrder: false,
        }),
    ],
    node: {
        __dirname: false,
        __filename: false
    },
    devServer: {
        overlay: true,
        stats: {
          children: false,
          modules: false,
        },
        clientLogLevel: "none",
        port: WDS_PORT,
        compress: true,
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        disableHostCheck: true,
        /** TODO */
        // after: function() {
        //     if (process.env.NODE_ENV === 'development') {
        //         spawn('npm', ['run', 'dev:main'], {
        //             shell: true,
        //             env: process.env,
        //             stdio: 'inherit'
        //           })
        //             .on('close', code => process.exit(code))
        //             .on('error', spawnError => console.error(spawnError));
        //     }
        // }
    }
}
