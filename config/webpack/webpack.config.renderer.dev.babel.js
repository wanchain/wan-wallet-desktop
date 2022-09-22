import webpack from 'webpack';
import { spawn } from 'child_process';
import { WDS_PORT } from '../common';
import merge from 'webpack-merge';
import common from './webpack.config.renderer.common.babel'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const publicPath = `http://127.0.0.1:${WDS_PORT}/dist/`;

common.entry.unshift('react-hot-loader/patch');

export default merge(common, {
  target: 'electron-renderer',
  devtool: 'eval-cheap-module-source-map',
  mode: 'development',
  output: {
    publicPath: publicPath
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    // new BundleAnalyzerPlugin()
  ],
  devServer: {
    overlay: true,
    stats: {
      children: false,
      modules: false,
      warnings: false
    },
    clientLogLevel: "none",
    port: WDS_PORT,
    compress: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    disableHostCheck: true,
    publicPath: publicPath,
    host: "127.0.0.1"
    /** TODO */
    // after: function () {
    //   if (process.env.NODE_ENV === 'development') {
    //     spawn('npm', ['run', 'dev:main'], {
    //       shell: true,
    //       env: process.env,
    //       stdio: 'inherit'
    //     })
    //       .on('close', code => process.exit(code))
    //       .on('error', spawnError => console.error(spawnError));
    //   }
    // }
  }
});
