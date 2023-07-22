const fs = require("fs");
const request = require("request");
const _ = require("lodash");

if(_.isUndefined(process.argv[2]) || _.isUndefined(process.argv[3])) {
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
    node sendClinicalInfoResponse.js CLINICAL_INFO_RESPONSE_XML CLINICAL_INFO_REQUEST_RETURNING_NEW_RX_RESPONSE_JSON

    Usage example (ClinicalInfoResponse XML Message must have the same Patient, Pharmacy and Prescriber tags as the ClinicalInfoRequest Message that was returned from the server upon transmitting a NewRx Message):
    node sendClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml message_logs/responses/EP-XXXXX.json

  `);
}
const clinicalInfoResponseXML = process.argv[2];
const originalRXResponse = JSON.parse(fs.readFileSync(process.argv[3]));

if(!originalRXResponse.responseMessageID) {
  throw new Error('Provided CLINICAL_INFO_REQUEST_RETURNING_NEW_RX_RESPONSE_JSON does not contain a responseMessageID.');
}

const creds = require('./config/credentials.json');

var payload = {
     "apiKey": creds.apiKey,
     "apiSecret": creds.apiSecret
}

request.post({
  uri: 'http://127.0.0.1:1337/negotiate-message',
  method: 'POST',
  json: payload
}, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    _.extend(payload, {
         "negotiatedMessageID": body.messageIDs[0].messageID,
         "clinicalInfoRequestMessageID": originalRXResponse.responseMessageID,
         "SCRIPTXMLMessage": fs.readFileSync(clinicalInfoResponseXML).toString('utf8')
                       //Dynamicaly insert negotiated MessageID in to Script
                       .replace(/(\<MessageID\>)[^\<]+(\<\/MessageID\>)/i, "$1"+body.messageIDs[0].messageID+"$2")
                       .replace(/(\<RelatesToMessageID\>)[^\<]+(\<\/RelatesToMessageID\>)/i, "$1"+originalRXResponse.responseMessageID+"$2")
    });
    console.log('--------- API Server Request ---------');
    console.log(payload);
    fs.writeFileSync('message_logs/requests/'+payload.negotiatedMessageID+'.json', JSON.stringify(payload, null, 2));
    console.log('Request payload written to: '+'message_logs/requests/'+payload.negotiatedMessageID+'.json');
    request.post({
      uri: 'http://127.0.0.1:1337/clinicalinfo',
      method: 'POST',
      json: payload
    }, function (error, response, body) {
        if(error) throw error;
        console.log('--------- API Server Response ---------');
        //console.log(response);
        console.log(body);
        fs.writeFileSync('message_logs/responses/'+payload.negotiatedMessageID+'.json', JSON.stringify(body, null, 2));
        console.log('Response payload written to: '+'message_logs/responses/'+payload.negotiatedMessageID+'.json');
    });
  } else {
    if(error) throw error;
    console.error(body);
  }
});
