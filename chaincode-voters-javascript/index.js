/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const voterRegister = require('./lib/voterRegister');

module.exports.AssetTransfer = voterRegister;
module.exports.contracts = [voterRegister];
