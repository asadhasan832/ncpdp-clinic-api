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
      clinicalInfoRequestMessageID: {
        type: 'string',
        required: true,
        description: 'MessageID of the NCPDP SCRIPT Standard compliant ClinicalInfoRequest XML Message that originated from the pharmacy.'
      },
      SCRIPTXMLMessage: {
        type: 'string',
        required: true,
        description: 'NCPDP SCRIPT Standard compliant ClinicalInfoResponse XML Message being sent in response to the ClinicalInfoRequest XML Message that originated from the pharmacy.'
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

      var orig_negotiation = await Negotiation.findOne({messageID: inputs.clinicalInfoRequestMessageID});
      if(_.isEmpty(orig_negotiation) || orig_negotiation.status !== 'Sent' || orig_negotiation.transmittingClinic !== clinic.id) {
        return exits.MessageIDValidationFailure({
          "message": "Provided original Rx message id is invalid, hence the refill order request failed."
        });
      }

      //Perform Parsing and field validation on the NCPDP XML SCRIPT.
      var parsedSCRIPTXMLMessage = await sails.xml2js(inputs.SCRIPTXMLMessage);
      var empower_ncpdp = 'NCPDPID:5906017:NPI:1730449299';
      //Ensure Matching MessageID in Rest and XML.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].MessageID[0]') || parsedSCRIPTXMLMessage.Message.Header[0].MessageID[0] !== inputs.negotiatedMessageID) {
        return exits.MessageIDValidationFailure({
             "message": "MessageID in the embeded NCPDP SCRIPT XML document does not match the negotiatedMessageID REST request parameter."
        });
      }
      //Ensure Matching RelatesToMessageID in Rest and XML.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].RelatesToMessageID[0]') || parsedSCRIPTXMLMessage.Message.Header[0].RelatesToMessageID[0] !== inputs.clinicalInfoRequestMessageID) {
        return exits.MessageIDValidationFailure({
             "message": "RelatesToMessageID in the embeded NCPDP SCRIPT XML document does not match the clinicalInfoRequestMessageID REST request parameter."
        });
      }
      //Ensure message is directed towards Empower's NCPDP and NPI number.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].To[0]') && parsedSCRIPTXMLMessage.Message.Header[0].To[0] !== empower_ncpdp) {
        return exits.NCPDPSCRIPTStandardFailure({
          "message": "This server can only accept SCRIPTS with the XML 'Message > Header > To' field set to '"+empower_ncpdp+"'. The message provided had the XML 'Message > Header > To' field set to '"+parsedSCRIPTXMLMessage.Message.Header[0].To[0]+"', hence we could not accept it.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Ensure message is comming from the same clinic id as the authenticated one.
      if(_.has(parsedSCRIPTXMLMessage, 'Message.Header[0].From[0]') && parsedSCRIPTXMLMessage.Message.Header[0].From[0] !== 'EMP-CLINIC:'+clinic.id) {
        return exits.clinicAuthFailure({
          "message": "Failed to authenticate the SCRIPT with the XML 'Message > Header > From' field to the apiKey and apiSecret provided in the REST request. The only allowed value for the XML 'Message > Header > From' field with the current apiKey and apiSecret is: '"+'EMP-CLINIC:'+clinic.id+"'",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      //Ensure NCPDP SCRIPT XML is of type ClinicalInfoResponse.
      if(!_.has(parsedSCRIPTXMLMessage, 'Message.Body[0].ClinicalInfoResponse[0]')) {
        return exits.clinicAuthFailure({
          "message": "Could not locate ClinicalInfoResponse XML tag in the provided REST SCRIPTXMLMessage attribute. Only ClinicalInfoResponse NCPDP SCRIPT XML messages are accepted through the /clinicalinfo API RPC endpoint.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071"
        });
      }
      try {
        //Accept and save message.
        var message = await ClinicalInfoResponse.create({
          messageID: inputs.negotiatedMessageID,
          clinicalInfoRequestMessageID: inputs.clinicalInfoRequestMessageID,
          transmittingClinic: negotiation.transmittingClinic,
          SCRIPTXMLMessage: inputs.SCRIPTXMLMessage
        });
        //sails.log(message);
        //if(message) {
        //console.log(SCRIPTXMLMessageResponse);
        var received = await Negotiation.update({id: negotiation.id}).set({status: "Received"}).fetch();
        //console.log(SCRIPTXMLMessageResponse);
      	return exits.success({
  		      "message": "ClinicalInfoResponse message transmitted successfully.",
  		      "messageID": inputs.negotiatedMessageID,
            "clinicalInfoRequestMessageID": inputs.clinicalInfoRequestMessageID,
            "receivedAt": received[0].updatedAt,
            "transmittingClinicFacilityID": negotiation.transmittingClinic
        });
    } catch (e) {
        await Negotiation.update({id: negotiation.id}).set({status: "Failed"}).fetch();
        return exits.transmissionFailure({
          "message": "An error occured while transmitting message."
        });
    }
  }

 }


};
