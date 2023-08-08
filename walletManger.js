/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');
const crypto = require('crypto');
const homomorphicEncryption = require('./encryption');
const { exit } = require('process');
const { count } = require('console');

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

// Generate a unique voter ID
async function generateVoterID() {
	let uniqueId = '';
	const characters = '0123456789'; // List of digits

	for (let i = 0; i < 16; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		uniqueId += characters.charAt(randomIndex);
	}

	return uniqueId;
}

async function getCandidates() {
	const candidates = {
		'kathmandu' : {
			'area_1' : {
				'101' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'102' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'103' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'104' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_2' : {
				'201' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'202' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'203' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'204' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_3' : {
				'301' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'302' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'303' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'304' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			}
		},
		'lalitpur' : {
			'area_1' : {
				'101' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'102' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'103' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'104' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_2' : {
				'201' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'202' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'203' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'204' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_3' : {
				'301' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'302' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'303' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'304' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			}
		},
		'bhaktapur' : {
			'area_1' : {
				'101' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'102' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'103' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'104' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_2' : {
				'201' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'202' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'203' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'204' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			},
			'area_3' : {
				'301' : {'name' : 'RSP', 'vote_count' : 0, 'logo' : '/images/testimonial/member-01.jpeg'},
				'302' : {'name' : 'CPN (UML)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-02.png'},
				'303' : {'name' : 'Nepali Congress', 'vote_count' : 0, 'logo' : '/images/testimonial/member-03.png'},
				'304' : {'name' : 'CPN (Maoist Centre)', 'vote_count' : 0, 'logo' : '/images/testimonial/member-04.png'},
			}
		}
	}

	return candidates;
}

async function getBallot() {

	const ballot = {
		'kathmandu' : {
			'area_1' : [],
			'area_2' : [],
			'area_3' : []
		},
		'lalitpur' : {
			'area_1' : [],
			'area_2' : [],
			'area_3' : []
		},
		'bhaktapur' : {
			'area_1' : [],
			'area_2' : [],
			'area_3' : []
		}
	}

	return ballot;
}


async function getAllVoters() {
	try{

		const userId =  'admin';

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {

			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('voters');

			// Get the contract from the network.
			const contract = network.getContract('voters');

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: GetAllVoters, get all voter');
			return await contract.submitTransaction('GetAllVoters');
		} 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);
	}

}

async function createUser(req) {
	try {

        const userId =  crypto.createHash('sha256').update(req.body.id).digest('hex');

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com'); 

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
        // const affiliation = req.body.district.toLowerCase()+'.a'+req.body.area_number; console.log(affiliation)
		
		await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('voters');

			// Get the contract from the network.
			const contract = network.getContract('voters');

			const voterId = await generateVoterID();
			const data = req.body; 

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: CreateVote, creates new voter');
			return await contract.submitTransaction('CreateVoter',
				voterId,
				data.first_name,   
				data.middle_name,
				data.last_name,
				data.dob,
				data.district,
				data.area_number,
			);

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);
	}
}

async function voterExists(id, voterId) { 
	try{ console.log(id); console.log(voterId);
		const userId =  crypto.createHash('sha256').update(id).digest('hex');

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {

			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('voters');

			// Get the contract from the network.
			const contract = network.getContract('voters');

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: VoterIDExists, get all voter');
			const voter = await contract.submitTransaction('VoterIDExists', voterId);
			const voterExists = voter.toString();
			return voterExists == 'true' ? true : false;
		} 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`Failed to run voter exists: ${error}`);
		process.exit(1);
	}
}


async function voteExists(id, voterId) { 
	try{ 
		const userId =  crypto.createHash('sha256').update(id).digest('hex');

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {

			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('ballot');

			// Get the contract from the network.
			const contract = network.getContract('ballot');

			console.log('\n--> Submit Transaction: VoteExists, get all voter');
			const voteExists = await contract.submitTransaction('VoteExists', voterId);
			const voteCheck = voteExists.toString();
			return voteCheck == 'true' ? true : false;
		} 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`Failed to run vote exists: ${error}`);
		process.exit(1);
	}
}

async function castVote(req) {
	try {

        const userId =  crypto.createHash('sha256').update(req.body.id).digest('hex');

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('ballot');

			// Get the contract from the network.
			const contract = network.getContract('ballot');

			const data = req.body; 

			const voterDistrictExists = await voterDistrictExists(data.voting_id)
			if(voterDistrictExists != 'true') {
				return {type: 'error', message: 'Your voting district or area number doesn\'nt match!'}
			}
	
			const party = data.party;
			const ballot = await homomorphicEncryption.encryptVote([
				party == 101 || party == 201 || party == 301 || party == 401 ? 1 : 0,
				party == 102 || party == 202 || party == 302 || party == 402 ? 1 : 0,
				party == 103 || party == 203 || party == 303 || party == 403 ? 1 : 0,
				party == 104 || party == 204 || party == 304 || party == 404 ? 1 : 0
			]);
			console.log('\n--> Submit Transaction: CreateVote, creates new vote');
			const voteCast = await contract.submitTransaction('CreateVote', data.voter_id, data.district, data.area_number, ballot);
			const voteId = voteCast.toString();
			return {type: 'success', message: `Voting was successfull. Your unique transaction ID is ${voteId}`}

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`Voting unsuccessfull: ${error}`);
		process.exit(1);
	}
}



async function verifyVote(req) {

	try{ 
		const userId =  crypto.createHash('sha256').update(req.body.id).digest('hex');

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {

			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('ballot');

			// Get the contract from the network.
			const contract = network.getContract('ballot');

			console.log('\n--> Submit Transaction: ReadVote, get all voter');
			const readVote = await contract.submitTransaction('ReadVote', req.body.voter_id);
			const voteData = JSON.parse(readVote.toString()); 
			if(typeof voteData.ballot != undefined) {
				const ballot = await homomorphicEncryption.decrypt(voteData.ballot);
				let voteIndex = -1;
				for(let i = 0; i < ballot.length; i++) {
					if(ballot[i] === 1) {
						voteIndex = i;
						break;
					}
				}
				const candidates = await getCandidates();
				const candidateNames = candidates[req.body.district];
				const keys = Object.keys(candidateNames['area_'+req.body.area_number]);
				const targetKey = keys[voteIndex]; 
				const candidateName = candidateNames['area_'+req.body.area_number][targetKey].name; 
				return `You\'ve voted for ${candidateName}`
 
			}
			return;
			
		} 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`Failed to run vote verify vote: ${error}`);
		process.exit(1);
	}}

async function voteTabulation() {
	try {

        const userId =  'admin';

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath); 

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: userId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork('ballot');

			// Get the contract from the network.
			const contract = network.getContract('ballot');

			
			console.log('\n--> Submit Transaction: GetAllVotes, get all votes');
			const votes = await contract.submitTransaction('GetAllVotes');
			const voteData = JSON.parse(votes.toString()); 
			const allCandidates = await getCandidates();
			const candidateLoop = await getCandidates();
			if(voteData) {
				const ballot = await getBallot();
				voteData.forEach(vote => {
					const district = vote.district;
					if(district != undefined && vote.areaNumber != undefined) {
						const areaNumber = 'area_'+vote.areaNumber;
						ballot[district][areaNumber].push(vote.ballot);
					}
				});
			
				if (ballot) {
					for(const district of Object.keys(candidateLoop)) {
					  for(const areaNumber of Object.keys(candidateLoop[district])) {
						const totalVote = await homomorphicEncryption.getTotalVoteFromEncryptedData(ballot[district][areaNumber]);
						if(totalVote != undefined) {
							let i = 0;
							for(const candidateID of Object.keys(candidateLoop[district][areaNumber])) {
								const voteCount = totalVote != undefined ? totalVote[i] : 0
								if(voteCount) {
									allCandidates[district][areaNumber][candidateID]['vote_count'] = voteCount
								}
								i++;
							}
						}
					  }
					}
				  }
			}
			return allCandidates;
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`Voting count unsuccessfull: ${error}`);
		process.exit(1);
	}
}
module.exports = {
	getAllVoters,
	voterExists,
	voteExists,
    createUser,
	castVote,
	verifyVote,
	voteTabulation
  };
  