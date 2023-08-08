//https://github.com/s0l0ist/node-seal/blob/main/USAGE.md
const SEAL = require('node-seal')
const fs = require('fs');
const { exit } = require('process');
const { isInt32Array } = require('util/types');

async function generateAndSaveKeys() {
  const seal = await SEAL()
  const keysFolderPath = './homomorphic_keys';
  const publicKeyPath = `${keysFolderPath}/publicKey`;
  const secretKeyPath = `${keysFolderPath}/secretKey`;

  // Check if the keys folder already exists
  if (!fs.existsSync(keysFolderPath)) {
    fs.mkdirSync(keysFolderPath);
  }

  // Check if the keys already exist, and return if they do
  if (fs.existsSync(publicKeyPath) && fs.existsSync(secretKeyPath)) {
    return;
  }

  const schemeType = seal.SchemeType.bfv
  const securityLevel = seal.SecurityLevel.tc128
  const polyModulusDegree = 4096
  const bitSizes = [36, 36, 37]
  const bitSize = 20

  const parms = seal.EncryptionParameters(schemeType)

  // Set the PolyModulusDegree
  parms.setPolyModulusDegree(polyModulusDegree)

  // Create a suitable set of CoeffModulus primes
  parms.setCoeffModulus(
    seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
  )

  // Set the PlainModulus to a prime of bitSize 20.
  parms.setPlainModulus(
    seal.PlainModulus.Batching(polyModulusDegree, bitSize)
  )

  const context = seal.Context(
    parms, // Encryption Parameters
    true, // ExpandModChain
    securityLevel // Enforce a security level
  )


  if (!context.parametersSet()) {
    throw new Error(
      'Could not set the parameters in the given context. Please try different encryption parameters.'
    )
  }
  // Generate the public and secret keys
  const keyGenerator = seal.KeyGenerator(context)
  const publicKey    = keyGenerator.createPublicKey(); 
  const secretKey    = keyGenerator.secretKey(); 

  // Save the keys to files
  fs.writeFileSync(publicKeyPath, publicKey.save());
  fs.writeFileSync(secretKeyPath, secretKey.save());

  console.log('Homomorphic keys generated and saved successfully.');
}


async function loadPublicKey() {
  await generateAndSaveKeys();
  const keysFolderPath = './homomorphic_keys';
  const publicKeyPath = `${keysFolderPath}/publicKey`;

  // Check if the keys folder and keys files exist
  if (!fs.existsSync(keysFolderPath) || !fs.existsSync(publicKeyPath)) {
    throw new Error('Homomorphic public key not found. ');
  }

  // Load the public key from files
  const publicKey =  fs.readFileSync(publicKeyPath, 'utf-8'); 

  return  publicKey;
}



async function loadPrivateKey() {
  await generateAndSaveKeys();
  const keysFolderPath = './homomorphic_keys';
  const secretKeyPath = `${keysFolderPath}/secretKey`;

  // Check if the keys folder and keys files exist
  if (!fs.existsSync(keysFolderPath) || !fs.existsSync(secretKeyPath)) {
    throw new Error('Homomorphic public key not found. ');
  }

  // Load the secret key from files
  const secretKey =  fs.readFileSync(secretKeyPath, 'utf-8'); 

  return  secretKey;
}


async function getTotalVoteFromEncryptedData(votes=[]) {
  const seal = await SEAL()
  const secretKey = await loadPrivateKey();
  const schemeType = seal.SchemeType.bfv
  const securityLevel = seal.SecurityLevel.tc128
  const polyModulusDegree = 4096
  const bitSizes = [36, 36, 37]
  const bitSize = 20

  const parms = seal.EncryptionParameters(schemeType)

  // Set the PolyModulusDegree
  parms.setPolyModulusDegree(polyModulusDegree)

  // Create a suitable set of CoeffModulus primes
  parms.setCoeffModulus(
    seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
  )

  // Set the PlainModulus to a prime of bitSize 20.
  parms.setPlainModulus(
    seal.PlainModulus.Batching(polyModulusDegree, bitSize)
  )

  const context = seal.Context(
    parms, // Encryption Parameters
    true, // ExpandModChain
    securityLevel // Enforce a security level
  )  
  
  // Create a BatchEncoder (only BFV SchemeType)
  const encoder = seal.BatchEncoder(context)

  const evaluator = seal.Evaluator(context)

  // Create an array to hold the ciphertexts after loading
  const ciphertexts = [];

  // Load the base64-encoded ciphertexts into the ciphertexts array
  for (let i = 0; i < votes.length; i++) {
    const loadedCipherText = seal.CipherText();
    loadedCipherText.load(context, Buffer.from(votes[i], 'base64'));
    ciphertexts.push(loadedCipherText);
  }

  let resultCiphertext = '';

  // Perform homomorphic addition on all ciphertexts in the array
  if(ciphertexts.length > 1) {
     // Create a new ciphertext to store the result of the addition
    resultCiphertext =  seal.CipherText()
    for (let i = 0; i < ciphertexts.length; i++) {
      // Add each loaded ciphertext to the resultCiphertext
      evaluator.add(ciphertexts[i],  i == 0 ? ciphertexts[1] : resultCiphertext, resultCiphertext);
      i = i == 0 ? 1 : i;
    }
  }
  else if(ciphertexts.length == 1) {
     resultCiphertext = ciphertexts[0];
  }
  else {
    return;
  }

  // Decrypt the final result ciphertext to obtain the plaintext
  const sealSecretKey = seal.SecretKey();
  sealSecretKey.load(context, secretKey);
  const decryptor = seal.Decryptor(context, sealSecretKey);
  const decryptedPlainText = decryptor.decrypt(resultCiphertext);

  const decoded = encoder.decode(
    decryptedPlainText,
    true // Can be omitted since this defaults to true.
  )

  return decoded;

}


async function encryptVote(data=[]) {
    const seal = await SEAL()
    const publicKey = await loadPublicKey();  
    const schemeType = seal.SchemeType.bfv
    const securityLevel = seal.SecurityLevel.tc128
    const polyModulusDegree = 4096
    const bitSizes = [36, 36, 37]
    const bitSize = 20

    const parms = seal.EncryptionParameters(schemeType)

    // Set the PolyModulusDegree
    parms.setPolyModulusDegree(polyModulusDegree)

    // Create a suitable set of CoeffModulus primes
    parms.setCoeffModulus(
      seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
    )

    // Set the PlainModulus to a prime of bitSize 20.
    parms.setPlainModulus(
      seal.PlainModulus.Batching(polyModulusDegree, bitSize)
    )

    const context = seal.Context(
      parms, // Encryption Parameters
      true, // ExpandModChain
      securityLevel // Enforce a security level
    )


    const sealPublicKey = seal.PublicKey();
    sealPublicKey.load(context, publicKey);
    
    const encryptor = seal.Encryptor(context, sealPublicKey);
    const batchEncoder = seal.BatchEncoder(context)

    // Encode data to a PlainText
    const plainText = batchEncoder.encode(
      Int32Array.from(data) // This could also be a Uint32Array
    ); 

    // // Encrypt the PlainText
    const ciphertext = encryptor.encrypt(plainText)

    // Convert the ciphertext object to a Buffer
    const bufferData = Buffer.from(ciphertext.save());

    // Encode the Buffer to a base64 string
    const base64Ciphertext = bufferData.toString('base64');
    
    return base64Ciphertext;
  }

  async function decrypt(cipherText) {
    const seal = await SEAL()
    const secretKey = await loadPrivateKey(); 

    const schemeType = seal.SchemeType.bfv
    const securityLevel = seal.SecurityLevel.tc128
    const polyModulusDegree = 4096
    const bitSizes = [36, 36, 37]
    const bitSize = 20

    const parms = seal.EncryptionParameters(schemeType)

    // Set the PolyModulusDegree
    parms.setPolyModulusDegree(polyModulusDegree)

    // Create a suitable set of CoeffModulus primes
    parms.setCoeffModulus(
      seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
    )

    // Set the PlainModulus to a prime of bitSize 20.
    parms.setPlainModulus(
      seal.PlainModulus.Batching(polyModulusDegree, bitSize)
    )

    const context = seal.Context(
      parms, // Encryption Parameters
      true, // ExpandModChain
      securityLevel // Enforce a security level
    )

    const sealSecretKey = seal.SecretKey();
    sealSecretKey.load(context, secretKey);

    // Create a BatchEncoder (only BFV SchemeType)
    const batchEncoder = seal.BatchEncoder(context)

    // Create a Decryptor to decrypt CipherTexts
    const decryptor = seal.Decryptor(context, sealSecretKey)

    const loadedCipherText = seal.CipherText();
    loadedCipherText.load(context, Buffer.from(cipherText, 'base64'));

    // Decrypt a CipherText
    const plainText = decryptor.decrypt(loadedCipherText)

    // `signed` defaults to 'true' if not specified and will return an Int32Array.
    // If you have encrypted a Uint32Array and wish to decrypt it, set
    // this to false.
    const decoded = batchEncoder.decode(
      plainText,
      true // Can be omitted since this defaults to true.
    )
    
    
    return decoded;
  }

  
module.exports = {
	encryptVote,
  getTotalVoteFromEncryptedData,
  decrypt
};