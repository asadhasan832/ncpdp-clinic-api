const fs = require("fs");
const request = require("request");
const _ = require("lodash");
const hat = require('hat');
const generator = require('generate-password');

if(_.isUndefined(process.argv[2])) {
  throw new Error(`
    *************************************************DISCLAIMER**********************************************
    * The signatures/tokens provided in the following usage examples are intended for the sole purpose      *
    * of testing and evaluation only. An actual application using the code provided in this archive         *
    * to prepare and send actual prescriptions for pharmacy use must provide unique real signatures/tokens  *
    * data being streamed/referenced from a CFR. Title 21 Part 11 compliant EHR/EMR application/database    *
    * backend.                                                                                              *
    *                                                                                                       *
    * For more information please see:                                                                      *
    * https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11                     *
    *                                                                                                       *
    * Sections pertaining to e-signatures:                                                                  *
    * Sec. 11.50 Signature manifestations                                                                   *
    * Sec. 11.70 Signature/record linking                                                                   *
    * Sec. 11.200 Electronic signature components and controls.                                             *
    *********************************************************************************************************

    Usage syntax:
    node resetApiSecret.js STRONG_OWASP_NEW_API_SECRET|"GENERATE"

    Usage example:
    node resetApiSecret.js c285d7941evVlqWgz06HuwbmDpo3tfayP
    node resetApiSecret.js GENERATE

  `);
}
var password = generator.generate({
  length: 30,
  numbers: true
});
//Generate OWASP hard password.
var newApiSecret = process.argv[2];

if(newApiSecret == "GENERATE") {
  console.log('Generating new apiSecret');
  newApiSecret = (hat()+password).replace(/(.)(?=.*\1)/g, "");
  console.log('Newly generated secret will be stored in config/credentials.json after update.');
}

const creds = require('./config/credentials.json');

var payload = {
     "apiKey": creds.apiKey,
     "apiSecret": creds.apiSecret,
     "newApiSecret": newApiSecret
}
console.log('--------- API Server Request ---------');
console.log(payload);
request.post({
  uri: 'http://127.0.0.1:1337/reset-api-secret',
  method: 'POST',
  json: payload
}, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    fs.writeFileSync('config/credentials.json', JSON.stringify({
      "apiKey": creds.apiKey,
      "apiSecret": newApiSecret
    }, null, 2));
    console.log('New credentials updated successfully and written to: config/credentials.json');
  } else {
    if(error) throw error;
    console.error(body);
  }
});
