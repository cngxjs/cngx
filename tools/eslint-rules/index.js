'use strict';

const locGuard = require('./level-4-organism-loc-guard');
const configFieldReaderGuard = require('./config-field-reader-guard');

/**
 * Local ESLint plugin — registered in `eslint.config.js` as `local`.
 * Use rules via `local/<rule-name>` in flat-config rules blocks.
 *
 * @category eslint-rules
 */
module.exports = {
  rules: {
    'level-4-organism-loc-guard': locGuard,
    'config-field-reader-guard': configFieldReaderGuard,
  },
};
