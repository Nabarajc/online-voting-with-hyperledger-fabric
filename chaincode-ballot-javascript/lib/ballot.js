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

class Voting extends Contract {

    // Constructor
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
    }

    // CreateVote issues a new vote to the world state with given details.
    async CreateVote(ctx, id, district, areaNo, ballot) {
        const voteData = {
            id: id,
            district: district,
            areaNumber: areaNo,
            ballot: ballot
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(voteData))));
        return ctx.stub.getTxID(); // Return the transaction ID, which is the generated unique ID
    }

    // ReadVote returns the vote stored in the world state with given id.
    async ReadVote(ctx, id) {
        const voteJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!voteJSON || voteJSON.length === 0) {
            throw new Error(`The vote with ID:${id} does not exist`);
        }
        return voteJSON.toString();
    }

    // DeleteVote deletes an given vote from the world state.
    async DeleteVote(ctx, id) {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote for id:${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // VoteExists returns true when asset with given ID exists in world state.
    async VoteExists(ctx, id) {
        const voteJSON = await ctx.stub.getState(id);
        return voteJSON && voteJSON.length > 0;
    }

    // GetAllVotes returns all votes found in the world state.
    async GetAllVotes(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all votes in the chaincode namespace.
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

module.exports = Voting;
