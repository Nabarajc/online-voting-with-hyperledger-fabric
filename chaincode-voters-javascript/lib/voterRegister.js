/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class VoterRegister extends Contract {

    // Constructor
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
    }
    
    // CreateVoter issues a new voter to the world state with given details.
    async CreateVoter(ctx, id, fname, mname, lname, dob, district, area_number) {
        const voter = {
            id: id,
            firstName: fname,
            middleName: mname,
            lastName: lname,
            dob: dob,
            district: district,
            areaNo: area_number,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(voter))));
        return JSON.stringify(voter);
    }

    // ReadVoter returns the voter stored in the world state with given id.
    async ReadVoter(ctx, id) {
        const voterJSON = await ctx.stub.getState(id); // get the voter from chaincode state
        if (!voterJSON || voterJSON.length === 0) {
            throw new Error(`The voter ${id} does not exist`);
        }
        return voterJSON.toString();
    }

    // VoterExists returns true when voter with given ID exists in world state.
    async VoterIDExists(ctx, id) {
        const voterJSON = await ctx.stub.getState(id);
        return voterJSON && voterJSON.length > 0;
    }

    async deleteVoter(ctx, recordId) {
        // Check if the record exists
        const recordExists = await this.VoterIDExists(ctx, recordId);
        if (!recordExists) {
          return false;
        }

        // Delete the record from the ledger
        await ctx.stub.deleteState(recordId);

        // Return a success message or any other response if needed
        return true;
    }

    // GetAllVoters returns all voters found in the world state.
    async GetAllVoters(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all voters in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = VoterRegister;
