import path from 'path';
import webpack from 'webpack';
const autoprefixer = require('autoprefixer');

function resolve (dir) {
    return path.join(__dirname, '../../', dir)
}

export default {
    target: 'electron-renderer',
    
    devtool: 'source-map',

    mode: 'production',
    
    entry: [
        // path.join(__dirname, '..', '..', 'src', 'app/App.js')
        path.join(__dirname, '..', '..', 'src', 'cases/app.js')
    ],
    output: {
        path: path.join(__dirname, '..', '..', 'build'),
        filename: "renderer.js",
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
    }
}
