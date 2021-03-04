'use strict';
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const PRODUCTION = 'production';

module.exports = () => {
  const config = {
    entry: {
      index: ['babel-polyfill', './src/js/index.js', './src/scss/index.scss'],
      main: ['babel-polyfill', './src/js/main.js', './src/scss/main.scss']
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'sample.[name].js',
      library: '[name]',
      libraryExport: 'default',
      libraryTarget: 'umd',
    },
    devtool: 'cheap-eval-source-map',
    devServer: {
      publicPath: '/dist/',
      compress: true,
      port: 9000
    },
    module: {
      rules: [
        {
          // SCSS
          test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[local]'
                },
              }
            },
            {
              loader: 'resolve-url-loader',
              options: {
                sourceMap: true,
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
              }
            }
          ]
        },
        {
          // ESLint
          enforce: 'pre',
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'eslint-loader',
          options: { failOnError: true }
        },
        {
          // ES6
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: '/node_modules/'
        },
        {
          test: /\.(svg|mp3)$/,
          loader: 'file-loader',
          options: {
            esModule: false,
          }
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'sample.[name].css'
      })
    ]
  };

  return config;
};
