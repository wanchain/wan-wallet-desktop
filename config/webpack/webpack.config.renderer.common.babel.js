import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

function resolve (dir) {
  return path.join(__dirname, '../../', dir)
}

export default {
  entry: [
      resolve('src/app/App.js')
  ],
  output: {
    path: resolve('build'),
    chunkFilename: '[name].bundle.js',
    filename: "renderer.js",
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
                loader: 'url-loader',
                options: {
                  limit: 50000
                }
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
      new HtmlWebpackPlugin({
        title: 'Wan Wallet',
        filename: 'index.html',
        template: resolve('src/app/index.html'),
        minify: {
          collapseWhitespace:  true
        }
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name].css',
        ignoreOrder: false,
      })
  ],
  node: {
      __dirname: false,
      __filename: false
  }
}
