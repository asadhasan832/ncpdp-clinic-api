module.exports = {


  friendlyName: 'Empower Clinic API Starter Kit',


  description: 'Downloads Empower Clinic API Client Starter Kit as a zip download.',

  inputs: {
      access: {
        description: 'A one time access token.',
        type: 'string'
      },
      apiKey: {
        description: 'A dedicated API key assigned to clinic to perform API transactions under.',
        type: 'string'
      },
      apiSecret: {
        description: 'A dedicated API secret assigned to clinic to perform API transactions under.',
        type: 'string'
      }
  },

  exits: {

    success: {
      //responseType: 'json',
      description: 'Empower Clinic API Client Starter Kit as a zip download.',
      statusCode: 200,
    },

    download: {
      //responseType: 'json',
      statusCode: 200,
      description: 'Empower Clinic API Client Starter Kit as a zip download.',
      responseType: 'zipdownload'
    },

    clinicAuthFailure: {
        statusCode: 401,
	      description: "Failed to authenticate clinic with the specified `apiKey` and `apiSecret`. Please contact Empower Pharmacy's clinic support for assistance."
    }

    /*redirect: {
      responseType: 'redirect',
      description: 'Requesting user is logged in, so redirect to the internal welcome page.'
    },*/

  },


  fn: async function (inputs, exits) {
    //var apiKey = req.header('api_key');
    //var apiSecret = req.header('api_secret');
    //console.log(apiKey);
    //console.log(inputs);
    //if (this.req.me) {
    //  throw {redirect:'/welcome'};
    //}
    //sails.log({apiKey: inputs.apiKey, apiSecret: inputs.apiSecret});
    var clinic;
    var secretdata;
    if(!_.isEmpty(inputs.apiKey) && !_.isEmpty(inputs.apiSecret)) {
      secretdata = await sails.createHMAC(inputs.apiSecret);
      clinic = await Clinic.findOne({apiKey: inputs.apiKey, apiSecret: secretdata.toString('hex'), deactivated: false});
    }

    if(!_.isEmpty(inputs.access)) {
      clinic = await Clinic.findOne({oneTimeAccessToken: inputs.access, accessTokenConsumed: false});
      if(_.isEmpty(clinic)) {
        return exits.clinicAuthFailure({
      	   "message": "The one time access token provided to acquire starter kit is either invalid or has been consumed already. Please contact Empower Pharmacy's clinic support for assistance."
      	});
      } else {
         await Clinic.update({id: clinic.id}).set({accessTokenConsumed: true}).fetch();
      }
    }

    if(_.isEmpty(clinic)) {
    	return exits.clinicAuthFailure({
    	   "message": "Failed to authenticate clinic with the specified `apiKey` and `apiSecret`. Please contact Empower Pharmacy's clinic support for assistance."
    	});
    } else {
      var clinic_secret_expired = (new Date()).getTime() > clinic.apiSecretDateSet+sails.config.custom.apiSecretExpiration;
      if(clinic_secret_expired) {
        return exits.clinicAuthFailure({
      	   "message": "Provided `apiSecret` has expired after being active for 90 days. Please contact Empower Pharmacy's clinic support for assistance."
      	});
      }
      var password = sails.generator.generate({
        length: 30,
        numbers: true
      });
      //Generate OWASP hard password.
      password = (sails.hat()+password).replace(/(.)(?=.*\1)/g, "");
      var data = await sails.createHMAC(password);
      await Clinic.update({id: clinic.id}).set({apiSecret: data.toString('hex'), apiSecretDateSet: (new Date()).getTime()}).fetch();
      //clinic['apiSecret'] = data.toString('hex');
    	//delete clinic.apiKey;
    	//delete clinic.apiSecret;
    	//delete clinic.id;
      var replaceKeys = function(fileContent) {
        return fileContent
                  .replace(/YOUR_API_KEY_GOES_HERE/g, clinic.apiKey)
                  .replace(/YOUR_API_SECRET_GOES_HERE/g, password)
                  .replace(/YOUR_CLINIC_NAME_GOES_HERE/g, clinic.clinicName)
                  .replace(/YOUR_CONTACT_NAME_GOES_HERE/g, clinic.contactName)
      };
      var replaceKeys_xml = function(fileContent) {
        return fileContent.replace('<From>YOUR_CLINIC_ID_GOES_HERE</From>', '<From>EMP-CLINIC:'+clinic.id+'</From>')
      };
      var guide_name = sails.shortid();
      var md_name = sails.shortid();
      var md_contents = replaceKeys(sails.fs.readFileSync(process.cwd()+'/implementation-guide.md').toString('utf8'));
      sails.fs.writeFileSync('tmp/'+md_name, md_contents);
      var child = sails.spawn('node_modules/.bin/md-to-pdf', ['--config-file', 'implementation-guide.json', 'tmp/'+md_name, 'tmp/'+guide_name]);
      child.on('close', function(code) {
        var zip = new sails.AdmZip();
        zip.addLocalFile(process.cwd()+'/tmp/'+guide_name, './', 'Clinic_Implementation_Guide.pdf');
        zip.addLocalFile(process.cwd()+"/client_examples/.gitignore");
        zip.addLocalFile(process.cwd()+"/client_examples/package.json");
        zip.addLocalFolder(process.cwd()+"/client_examples/sample_pdf_documents", './sample_pdf_documents');
        zip.addLocalFolder(process.cwd()+"/client_examples/sample_signatures", './sample_signatures');
        zip.addLocalFolder(process.cwd()+"/client_examples/sample_orders", './sample_orders');
        //zip.addLocalFolder(process.cwd()+"/client_examples/sample_xml_scripts", './sample_xml_scripts');
        zip.addLocalFolder(process.cwd()+"/client_examples/util", './util');
        zip.addLocalFolder(process.cwd()+"/client_examples/tmp", './tmp');
        zip.addLocalFolder(process.cwd()+"/client_examples/message_logs", './message_logs');
        zip.addLocalFolder(process.cwd()+"/client_examples/NCPDP_SCRIPT_Standard_Resources", './NCPDP_SCRIPT_Standard_Resources');

        var filecontent = replaceKeys(require("fs").readFileSync(process.cwd()+"/client_examples/config/credentials.json.sample").toString('utf8'));
        zip.addFile("config/credentials.json", Buffer.from(filecontent, 'utf8'), "API key and secret credentials.");

        filecontent = replaceKeys_xml(require("fs").readFileSync(process.cwd()+"/client_examples/sample_xml_scripts/sample_newrx_message.xml").toString('utf8'));
        zip.addFile("sample_xml_scripts/sample_newrx_message.xml", Buffer.from(filecontent, 'utf8'), "Sample NCPDP SCRIPT NewRx XML Message.");

        filecontent = replaceKeys_xml(require("fs").readFileSync(process.cwd()+"/client_examples/sample_xml_scripts/sample_newrx_message_exhaustive.xml").toString('utf8'));
        zip.addFile("sample_xml_scripts/sample_newrx_message_exhaustive.xml", Buffer.from(filecontent, 'utf8'), "Sample NCPDP SCRIPT NewRx XML Message Exhaustive with all possible fields.");

        filecontent = replaceKeys_xml(require("fs").readFileSync(process.cwd()+"/client_examples/sample_xml_scripts/sample_clinical_info_response.xml").toString('utf8'));
        zip.addFile("sample_xml_scripts/sample_clinical_info_response.xml", Buffer.from(filecontent, 'utf8'), "Sample NCPDP SCRIPT ClinicalInfoResponse XML Message.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/LISENCE.txt").toString('utf8');
        zip.addFile("LISENCE.txt", Buffer.from(filecontent, 'utf8'), "Software copyright license (MIT).");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/sendNewRx.js").toString('utf8');
        zip.addFile("sendNewRx.js", Buffer.from(filecontent, 'utf8'), "Example program to transmit a NCPDP SCRIPT XML NewRx message.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/sendNewRxAndRespondWithSCRIPTXMLRendering.js").toString('utf8');
        zip.addFile("sendNewRxAndRespondWithSCRIPTXMLRendering.js", Buffer.from(filecontent, 'utf8'), "Example program to transmit a NCPDP SCRIPT XML NewRx message.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/sendRefillRequestOrder.js").toString('utf8');
        zip.addFile("sendRefillRequestOrder.js", Buffer.from(filecontent, 'utf8'), "Example program to transmit a refill request order on a previous NewRx message request.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/sendClinicalInfoResponse.js").toString('utf8');
        zip.addFile("sendClinicalInfoResponse.js", Buffer.from(filecontent, 'utf8'), "Example program to transmit a NCPDP SCRIPT XML ClinicalInfoResponse in reply to a ClinicalInfoRequest message that is returned from a successful REST call to /newrx RPC endpoint.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/renderSCRIPTXMLtoPDFDocument.js").toString('utf8');
        zip.addFile("renderSCRIPTXMLtoPDFDocument.js", Buffer.from(filecontent, 'utf8'), "Example program to render NCPDP SCRIPT XML in to a human-readable PDF document.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/embedPDFDocumentInClinicalInfoResponse.js").toString('utf8');
        zip.addFile("embedPDFDocumentInClinicalInfoResponse.js", Buffer.from(filecontent, 'utf8'), "Example program to embed a PDF document in a NCPDP SCRIPT XML ClinicalInfoResponse message.");

        filecontent = require("fs").readFileSync(process.cwd()+"/client_examples/resetApiSecret.js").toString('utf8');
        zip.addFile("resetApiSecret.js", Buffer.from(filecontent, 'utf8'), "Example program to reset clinic facility API secret.");

        zipBuffer = zip.toBuffer();
        var filename = clinic.clinicName+" - starter-kit.zip";
        sails.rimraf.sync(process.cwd()+'/tmp/'+guide_name);
        sails.rimraf.sync(process.cwd()+'/tmp/'+md_name);
      	return exits.download({
          filename: filename,
          contentLength: zipBuffer.byteLength,
          zipBuffer: zipBuffer
        });
      });
    }

  }


};
