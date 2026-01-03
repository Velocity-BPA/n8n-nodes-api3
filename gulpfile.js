/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

const { src, dest, series } = require('gulp');
const path = require('path');

function copyIcons() {
  return src('nodes/**/*.svg')
    .pipe(dest('dist/nodes'));
}

function copyImages() {
  return src('nodes/**/*.png')
    .pipe(dest('dist/nodes'));
}

exports['build:icons'] = series(copyIcons, copyImages);
exports.default = exports['build:icons'];
