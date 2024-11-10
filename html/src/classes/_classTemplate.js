import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import database from '../repository/database.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {}

    _data = {};

    _methods = {};
}
