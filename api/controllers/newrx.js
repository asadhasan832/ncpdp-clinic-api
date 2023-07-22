module.exports = {


  friendlyName: 'Empower Clinic API NewRx REST order and NCPDP SCRIPT Standard compliant NewRx XML Message receiving RPC endpoint.',


  description: 'Empower Clinic API NewRx REST order and NCPDP SCRIPT Standard compliant NewRx XML Message receiving RPC endpoint.',

  inputs: {
      apiKey: {
        description: 'A dedicated API key assigned to clinic to perform API transactions under.',
        type: 'string',
        required: true
      },
      apiSecret: {
        description: 'A dedicated API secret assigned to clinic to perform API transactions under.',
        type: 'string',
        required: true
      },
      negotiatedMessageID: {
        type: 'string',
        required: true,
        description: 'A pre-negotiated MessageID attained from /negotiate-message or /negotiate-messages RPC endpoints.',
      },
      SCRIPTXMLMessage: {
        type: 'string',
        required: true,
        description: 'NCPDP SCRIPT Standard compliant NewRx XML Message to go accompany the REST order request.'
      },
      orderMemo: {
        type: 'string'
      },
      deliveryAddressLine1: {
        type: 'string'
      },
      deliveryAddressLine2: {
        type: 'string'
      },
      deliveryCity: {
        type: 'string'
      },
      deliveryState: {
        type: 'string'
      },
      deliveryZipCode: {
        type: 'string'
      },
      shippingMethod: {
        type: 'string'
      }
  },

  exits: {

    success: {
      //responseType: 'json',
      description: 'Welcome message for Empower Clinic API as a JSON response.',
      statusCode: 200
    },

    clinicAuthFailure: {
        statusCode: 401,
	      description: "Failed to authenticate clinic with the specified `apiKey` and `apiSecret`. Please contact Empower Pharmacy's clinic support for assistance."
    },

    MessageIDValidationFailure: {
        statusCode: 403,
	      description: "Provided pre-negotiated message id is invalid or expired."
    },
    NCPDPSCRIPTStandardFailure: {
        statusCode: 403,
	      description: "Provided data in the SCRIPTXMLMessage REST attribute does not comply with the NCPDP Script Standard VERSION 2018071."
    },
    transmissionFailure: {
        statusCode: 403,
	      description: "An error occured while transmitting message."
    }

    /*redirect: {
      responseType: 'redirect',
      description: 'Requesting user is logged in, so redirect to the internal welcome page.'
    },*/

  },


  fn: async function (inputs, exits) {
    //Lookup Clinic
    var secretdata = await sails.createHMAC(inputs.apiSecret);
    var clinic = await Clinic.findOne({apiKey: inputs.apiKey, apiSecret: secretdata.toString('hex'), deactivated: false});
    //console.log(clinic);
    if(!clinic) {
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
      //Validate SCRIPTXMLMessage against NCPDP SCRIPT Standard 2018071 SCHEMA Definations.
      var tmpfile = sails.shortid();
      sails.fs.writeFileSync('tmp/'+tmpfile, inputs.SCRIPTXMLMessage);
      try {
        var validation = await sails.xsd_validator({file: 'tmp/'+tmpfile}, 'ncpdp_script_standard/v20180711/transport.xsd');
        sails.rimraf.sync('tmp/'+tmpfile);
      } catch(e) {
        //console.log(e);
        //console.log(JSON.stringify(e));
        sails.rimraf.sync('tmp/'+tmpfile);
        return exits.NCPDPSCRIPTStandardFailure({
           "message": "Provided data in the SCRIPTXMLMessage REST attribute does not comply with the NCPDP Script Standard VERSION 2018071.",
           "schema_error": e.message,
           "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
         });
      }
      if(!validation.valid) {
         return exits.NCPDPSCRIPTStandardFailure({
           "message": "Provided data in the SCRIPTXMLMessage REST attribute does not comply with the NCPDP Script Standard VERSION 2018071.",
           "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
         });
      }
      //Authenticate Message ID againsts creds.
      var negotiation = await Negotiation.findOne({messageID: inputs.negotiatedMessageID});
      sails.log(negotiation);
      if(_.isEmpty(negotiation) || negotiation.status !== 'Initialized' || negotiation.transmittingClinic !== clinic.id || (new Date()).getTime() > negotiation.createdAt+18000000) {
        await Negotiation.update({id: negotiation.id}).set({status: "Failed"}).fetch();
        return exits.MessageIDValidationFailure({
          "message": "Provided pre-negotiated message id is either invalid or expired for transmission (Message IDs expire 5 hour after negotiation)."
        });
      } else {
        await Negotiation.update({id: negotiation.id}).set({status: "Transmitting"}).fetch();
      }
      sails.log(negotiation);

      //Perform Parsing and field validation on the NCPDP XML SCRIPT.
      var parsedSCRIPTXMLMessage = await sails.xml2js(inputs.SCRIPTXMLMessage);
      var empower_ncpdp = 'NCPDPID:5906017:NPI:1730449299';
      var builder = new sails.xml2jsBuilder({ 'pretty': false, 'indent': ' ', 'newline': '\n' });
      var patientXML = '';
      var prescriberXML = '';
      //Ensure Matching MessageID in Rest and XML.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].MessageID[0]') || parsedSCRIPTXMLMessage.Message.Header[0].MessageID[0] !== inputs.negotiatedMessageID) {
        return exits.MessageIDValidationFailure({
             "message": "MessageID in the embeded NCPDP SCRIPT XML document does not match the negotiatedMessageID REST request parameter."
        });
      }

      //Ensure message is directed towards Empower's NCPDP and NPI number.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].To[0]') && parsedSCRIPTXMLMessage.Message.Header[0].To[0] !== empower_ncpdp) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with 'Message > Header > To' field set to '"+empower_ncpdp+"'. The message provided had the XML 'Message > Header > To' field set to '"+parsedSCRIPTXMLMessage.Message.Header[0].To[0]+"', hence we could not accept it.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Ensure message is comming from the same clinic id as the authenticated one.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].From[0]') && parsedSCRIPTXMLMessage.Message.Header[0].From[0] !== 'EMP-CLINIC:'+clinic.id) {
        return exits.clinicAuthFailure({
          "message": "Failed to authenticate the NewRx SCRIPT XML 'Message > Header > From' field to the apiKey and apiSecret provided in the REST request. The only allowed value for the XML 'Message > Header > From' field with the current apiKey and apiSecret is: '"+'EMP-CLINIC:'+clinic.id+"'",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Ensure NCPDP XML SCRIPT is of type NewRx.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Body[0].NewRx[0]')) {
        return exits.clinicAuthFailure({
          "message": "Could not locate NewRx XML tag in the provided REST SCRIPTXMLMessage attribute. Only NewRx NCPDP SCRIPT XML messages are accepted through /newrx API RPC endpoint.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Ensure valid Prescriber e-signature on NewRx Messages.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].Security[0]')) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with the XML 'Message > Header > Security' containing e-signature data from the prescriber that signed and executed the NewRx SCRIPT XML message.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }

      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].Security[0].UsernameToken[0]')) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with the XML 'Message > Header > Security > UsernameToken' containing e-signature data from the prescriber that signed and executed the NewRx SCRIPT XML message.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }

      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].Security[0].UsernameToken[0].Username[0]')) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with the XML 'Message > Header > Security > UsernameToken > username' containing clinic facility's CFR. Title 21 Part 11 compliant system's user name of the prescriber that signed and executed the NewRx SCRIPT XML message.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }

      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].Security[0].UsernameToken[0].Nonce[0]')) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with the XML 'Message > Header > Security > UsernameToken > Nonce' containing a cryptographic ciphertext that can be used to trace the prescriber's e-signature on the sending clinic facility's CFR. Title 21 Part 11 compliant system.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }

      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].Security[0].UsernameToken[0].Created[0]')) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept NewRx SCRIPT XML Messages with the XML 'Message > Header > Security > UsernameToken > Created' containing the date and time at which prescriber signed and executed the NewRx SCRIPT XML message.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Remove Patient substance use before sending back in a ClinicalInfoRequest to comply with standard.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Body[0].NewRx[0].Patient[0]')) {
        if(_.has(parsedSCRIPTXMLMessage, 'Message.Body[0].NewRx[0].Patient[0].HumanPatient[0].SubstanceUse')) {
          delete parsedSCRIPTXMLMessage.Message.Body[0].NewRx[0].Patient[0].HumanPatient[0].SubstanceUse;
        }
        patientXML = builder.buildObject({'Patient': parsedSCRIPTXMLMessage.Message.Body[0].NewRx[0].Patient[0] }).replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '')
      }
      //Send back Prescriber as-is with a ClinicalInfoRequest Message in the response.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Body[0].NewRx[0].Prescriber[0]')) {
        prescriberXML = builder.buildObject({'Prescriber': parsedSCRIPTXMLMessage.Message.Body[0].NewRx[0].Prescriber[0] }).replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '')
      }

      try {
        //Generate ClinicalInfoRequest as a response to the NewRx message.
        var responseMessageID = 'EP-'+sails.hat();
        var SCRIPTXMLMessageResponse = await sails.helpers.renderclinicalinforequest(clinic.id, empower_ncpdp, responseMessageID, inputs.negotiatedMessageID, patientXML, prescriberXML);

        //Accept and save message.
        var message = await NewRXMessage.create({
          messageID: inputs.negotiatedMessageID,
          transmittingClinic: negotiation.transmittingClinic,
          SCRIPTXMLMessage: inputs.SCRIPTXMLMessage,
          orderMemo: inputs.orderMemo,
          responseMessageID: responseMessageID,
          deliveryAddressLine1: inputs.deliveryAddressLine1,
          deliveryAddressLine2: inputs.deliveryAddressLine2,
          deliveryCity: inputs.deliveryCity,
          deliveryState: inputs.deliveryState,
          deliveryZipCode: inputs.deliveryZipCode,
          shippingMethod: inputs.shippingMethod
        });
        //sails.log(message);
        //if(message) {
          //console.log(SCRIPTXMLMessageResponse);
          var received = await Negotiation.update({id: negotiation.id}).set({status: "Received"}).fetch();
          //Save response for records.
          await ClinicalInfoRequest.create({
            messageID: responseMessageID,
            originalRXMessageID: inputs.negotiatedMessageID,
            receivingClinic: negotiation.transmittingClinic,
            SCRIPTXMLMessage: SCRIPTXMLMessageResponse
          });

          console.log(await Negotiation.create({
            messageID: responseMessageID,
            status: "Sent",
            transmittingClinic: clinic.id
          }).fetch());

          //console.log(SCRIPTXMLMessageResponse);
        	return exits.success({
    		      "message": "NewRx message transmitted successfully.",
    		      "messageID": inputs.negotiatedMessageID,
              "responseMessageID": responseMessageID,
              "receivedAt": received[0].updatedAt,
              "SCRIPTXMLMessage": SCRIPTXMLMessageResponse,
              "transmittingClinicFacilityID": negotiation.transmittingClinic
        	});
    } catch(e) {
          await Negotiation.update({id: negotiation.id}).set({status: "Failed"}).fetch();
          return exits.transmissionFailure({
            "message": "An error occured while transmitting message."
          });
    }
  }
 }
};
