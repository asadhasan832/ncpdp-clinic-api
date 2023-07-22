const fs = require("fs");
const request = require("request");
const _ = require("lodash");
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
const shortid = require('shortid');

if(_.isUndefined(process.argv[2]) || _.isUndefined(process.argv[3]) || _.isUndefined(process.argv[4])) {
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
    node sendNewRxAndRespondWithSCRIPTXMLRendering.js PATH_TO_NEW_RX_SCRIPTXML PATH_TO_ORDER_JSON CLINICAL_INFO_RESPONSE_INPUT_XML [PATH_TO_TEMPORARY_HAND_SIGNATURE_FILE]

    Usage example (with vector hand-written signature):
    node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml sample_signatures/vector_signature.svg

    Usage example (with raster hand-written signature):
    node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml sample_signatures/raster_signature.jpg

    Usage example (with no hand-written signature):
    node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml

  `);
}
const scriptXML = process.argv[2];
const clinicalInfoResponseXML = process.argv[4];
const signature_graphic = process.argv[5]
const inputJSONOrder = JSON.parse(fs.readFileSync(process.argv[3]));

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
         "SCRIPTXMLMessage": fs.readFileSync(scriptXML).toString('utf8')
                       //Dynamicaly insert negotiated MessageID in to Script
                       .replace(/(\<MessageID\>)[^\<]+(\<\/MessageID\>)/i, "$1"+body.messageIDs[0].messageID+"$2")
    }, inputJSONOrder);

    //Render SCRIPTXML
    var child = spawn('node', ['renderSCRIPTXMLtoPDFDocument.js', payload.negotiatedMessageID, scriptXML, './message_logs/renderings/'+payload.negotiatedMessageID+'.pdf', signature_graphic ? signature_graphic : undefined]);
    child.stderr.on('data', function(data) {
      console.error('renderSCRIPTXMLtoPDFDocument.js ERROR: ' + data);
      //Here is where the error output goes
    });
    child.stdout.on('data', function(data) {
      console.log('renderSCRIPTXMLtoPDFDocument.js OUTPUT: ' + data);
      //Here is where the stdout output goes
    });
    child.on('close', function(code) {
      if(code == 0) {
        console.log('SCRIPTXML PDF rendering written to :'+'message_logs/renderings/'+payload.negotiatedMessageID+'.pdf');
        request.post({
          uri: 'http://127.0.0.1:1337/newrx',
          method: 'POST',
          json: payload
        }, function (error, response, body) {
            if(error) throw error;
            console.log('--------- API Server Response ---------');
            //console.log(response);
            console.log(body);
            fs.writeFileSync('message_logs/responses/'+payload.negotiatedMessageID+'.json', JSON.stringify(body, null, 2));
            console.log('Response payload written to: '+'message_logs/responses/'+payload.negotiatedMessageID+'.json');

            var tmp_document = 'tmp/'+shortid()+'.xml';
            var embed_child = spawn('node', ['embedPDFDocumentInClinicalInfoResponse.js', clinicalInfoResponseXML, 'NCPDP_SCRIPT_XML_Rendering', 'message_logs/renderings/'+payload.negotiatedMessageID+'.pdf', tmp_document]);
            embed_child.stderr.on('data', function(data) {
              console.log('embedPDFDocumentInClinicalInfoResponse.js ERROR: ' + data);
              //Here is where the error output goes
            });
            embed_child.stdout.on('data', function(data) {
              console.log('embedPDFDocumentInClinicalInfoResponse.js OUTPUT: ' + data);
              //Here is where the stdout output goes
            });
            embed_child.on('close', function(code) {
              if(code == 0) {
                console.log('PDF Embedded ClinicalInfoResponseXML message written to: '+tmp_document);
                //node sendClinicalInfoResponse.js tmp/sample_clinical_info_response.xml message_logs/responses/EP-XXXXX.json
                console.log(['sendClinicalInfoResponse.js', tmp_document, 'message_logs/responses/'+payload.negotiatedMessageID+'.json']);
                var sendresp_child = spawn('node', ['sendClinicalInfoResponse.js', tmp_document, 'message_logs/responses/'+payload.negotiatedMessageID+'.json']);
                sendresp_child.stderr.on('data', function(data) {
                  console.log('sendClinicalInfoResponse.js: ' + data);
                  //Here is where the error output goes
                });
                sendresp_child.stdout.on('data', function(data) {
                  console.log('sendClinicalInfoResponse.js: ' + data);
                  //Here is where the stdout output goes
                });
                sendresp_child.on('close', function(code) {
                  if(code != 0) {
                    console.error('There was an error transmitting the ClinicalInfoResponseXML.');
                  }
                  rimraf.sync(tmp_document);
                  console.log('Removed temporary ClinicalInfoResponseXML document: '+tmp_document);
                });
              } else {
                console.error('There was an error embedding the SCRIPTXML Rendered PDF in to a temporary ClinicalInfoResponseXML document.');
                rimraf.sync(tmp_document);
                console.log('Removed temporary ClinicalInfoResponseXML document: '+tmp_document);
                process.exit(1);
              }
           });
        });

        console.log('--------- API Server Request ---------');
        console.log(payload);
        fs.writeFileSync('message_logs/requests/'+payload.negotiatedMessageID+'.json', JSON.stringify(payload, null, 2));
        console.log('Request payload written to: '+'message_logs/requests/'+payload.negotiatedMessageID+'.json');
      } else {
        console.error('There was an error rendering the SCRIPTXML to PDF');
        process.exit(1);
      }
    });
  } else {
    if(error) throw error;
    console.error(body);
  }
});
