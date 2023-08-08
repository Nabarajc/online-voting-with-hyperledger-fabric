const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const walletManager = require('./walletManger');
const encryption = require('./encryption');
const https = require('https');
const fs = require('fs');
const constants = require('crypto').constants;
const app = express();
const port = 443;

// Read the SSL/TLS certificates
const privateKey = fs.readFileSync(path.join(__dirname, 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'cert.pem'), 'utf8');
const credentials = { 
  key: privateKey, 
  cert: certificate, 
  passphrase: '123456',
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 //| constants.SSL_OP_NO_TLSv1_1
};

// Create the HTTPS server
const httpsServer = https.createServer(credentials, app);

// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Set the static files directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route to render the EJS template
app.get('/', async(req, res) => {
    res.render('vote');
  });

// Define a route to render the EJS template
app.get('/register', async (req, res) => {
    res.render('register',{ type: '', message: '' });
});


// Endpoint to create a voter
app.post('/register', async (req, res) => {
  data = await walletManager.createUser(req);
  const resultJSON = JSON.parse(data.toString()); 
  const isSuccess = resultJSON && resultJSON.id !== undefined ? 'success' :  'error';
  const message = isSuccess=='success' ? `Successfully registered for voting. Your digital voting id is ${resultJSON.id}` : 'Failed to register'
  res.render('register', { type: 'success', message: message });
});

  // Define a route to render the EJS template
  app.get('/vote', (req, res) => {
    res.render('vote');
  });

  // Define a route to render the EJS template
  app.post('/vote', async(req, res) => {
    const voterExists = await walletManager.voterExists(req.body.id, req.body.voter_id);
    if(!voterExists) {
      res.render('vote', {type: 'error', message: 'Your voting id doesn\'t exists!'});
      return;
    }
    const voteExists = await walletManager.voteExists(req.body.id, req.body.voter_id);
    if(voteExists) {
      res.render('vote', {type: 'error', message: 'You\'ve already voted!'});
      return;
    }
    
    const data = await walletManager.castVote(req);
    res.render('vote', data);

  });

 // Define a route to render the EJS template
 app.get('/results', async(req, res) => {
  const tabulation = await walletManager.voteTabulation(); 
  res.render('results', {
    tabulation: tabulation,
  });
});

 // Define a route to render the EJS template
 app.get('/verify', async(req, res) => {
  res.render('verify', {
    appName: 'My App',
    currentDate: new Date().toDateString()
  });
});

  // Define a route to render the EJS template
  app.post('/verify', async(req, res) => {
    const voterExists = await walletManager.voterExists(req.body.id, req.body.voter_id);
    if(!voterExists) {
      res.render('verify', {type: 'error', message: 'Your voting id doesn\'t exists!'});
      return;
    }
    const voteExists = await walletManager.voteExists(req.body.id, req.body.voter_id);
    if(!voteExists) {
      res.render('verify', {type: 'error', message: 'You\'ve not voted yet!'});
      return;
    }
    
    const message = await walletManager.verifyVote(req);
    res.render('verify', {type: message ? 'success' : 'error', message: message ? message : 'Vote couldn\'t be verified!'});
  });

// Start the server
httpsServer.listen(port, () => {
  console.log('Server is running on port 443');
});
