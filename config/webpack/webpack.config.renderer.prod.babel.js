import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals'

function resolve (dir) {
    return path.join(__dirname, '../../', dir)
}

const options = {
    // externals: [nodeExternals()],

    // target: 'electron-renderer',
    
    devtool: 'source-map',

    mode: 'production',
    
    entry: [
        path.join(__dirname, '..', '..', 'src', 'app/App.js')
    ],

    output: {
        path: path.join(__dirname, '..', '..', 'build'),
        filename: "renderer.js",
        // libraryTarget: 'commonjs2'
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
                },
                exclude: /node_modules/
            },
            {
              test: /\.less$/,
              use: [
                'style-loader',
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
                    require('postcss-flexbugs-fixes')
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
            {
              test:/\.(eot|woff2|woff|ttf)/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    name: '[path][hash:5].min.[ext]',
                    limit: 40000,
                    mimetype: 'application/octet-stream'
                  }
                }
              ],
            },
        ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        static: resolve('static/'),
        constants: resolve('src/app/constants/'),
        components: resolve('src/app/components/'),
        containers: resolve('src/app/containers/'),
        utils: resolve('src/app/utils/')
      }
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: 'production'
      }),
      new webpack.NamedModulesPlugin()
    ]
}

export default options
