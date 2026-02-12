/**
 * Vitest global setup file.
 * Loads English locale messages into i18n so that
 * translation calls return expected values in tests.
 */
import { i18n } from './src/plugin/i18n';

import en from './src/localization/en.json';

i18n.global.setLocaleMessage('en', en);
