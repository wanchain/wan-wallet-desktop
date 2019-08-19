import webpack from 'webpack';
import merge from 'webpack-merge';
import common from './webpack.config.renderer.common.babel'

export default merge(common, {
    // devtool: 'source-map',
    stats: {
      children: false,
      modules: false,
    },
    mode: 'production',

    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: 'production'
      })
    ]
});