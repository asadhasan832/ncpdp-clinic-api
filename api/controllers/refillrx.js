module.exports = {


  friendlyName: 'Empower Clinic API REST Refill Rx order request receiving RPC endpoint.',


  description: 'Empower Clinic API REST Refill Rx order request receiving RPC endpoint.',

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
        description: 'A pre-negotiated MessageID attained from /negotiate-message or /negotiate-messages RPC endpoints.'
      },
      originalRXMessageID: {
        type: 'string',
        required: true,
        description: 'MessageID of the original NCPDP SCRIPT Standard compliant NewRx XML Message the refill request is being made for.'
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
      description: 'Standard JSON response.',
      statusCode: 200,
    },
    clinicAuthFailure: {
        statusCode: 401,
	      description: "Failed to authenticate clinic with the specified `apiKey` and `apiSecret`. Please contact Empower Pharmacy's clinic support for assistance."
    },
    MessageIDValidationFailure: {
        statusCode: 403,
	      description: "Provided pre-negotiated message id is invalid or expired."
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
    	var negotiation = await Negotiation.findOne({messageID: inputs.negotiatedMessageID});
      sails.log(negotiation);
      if(_.isEmpty(negotiation) || negotiation.status !== 'Initialized' || negotiation.transmittingClinic !== clinic.id || (new Date()).getTime() > negotiation.createdAt+18000000) {
        await Negotiation.update({id: negotiation.id}).set({status: "Failed"}).fetch();
        //originalRXMessageID must be validated against the clinic.id to confirm.
        return exits.MessageIDValidationFailure({
          "message": "Provided pre-negotiated message id is either invalid or expired for transmission (Message IDs expire 5 hour after negotiation)."
        });
      } else {
        var orig_negotiation = await Negotiation.findOne({messageID: inputs.originalRXMessageID});
        if(_.isEmpty(orig_negotiation) ||  orig_negotiation.status !== 'Received' || orig_negotiation.transmittingClinic !== clinic.id) {
          return exits.MessageIDValidationFailure({
            "message": "Provided original Rx message id is invalid, hence the refill order request failed."
          });
        }
        try {
        var message = await RefillRXMessage.create({
          messageID: inputs.negotiatedMessageID,
          transmittingClinic: negotiation.transmittingClinic,
          originalRXMessageID: inputs.originalRXMessageID,
          orderMemo: inputs.orderMemo,
          deliveryAddressLine1: inputs.deliveryAddressLine1,
          deliveryAddressLine2: inputs.deliveryAddressLine2,
          deliveryCity: inputs.deliveryCity,
          deliveryState: inputs.deliveryState,
          deliveryZipCode: inputs.deliveryZipCode,
          shippingMethod: inputs.shippingMethod
        });
        //sails.log(message);
        //if(message) {
          var received = await Negotiation.update({id: negotiation.id}).set({status: "Received"}).fetch();
        	return exits.success({
    		      "message": "Refill order request was submited successfully.",
    		      "messageID": inputs.negotiatedMessageID,
              "originalRXMessageID": inputs.originalRXMessageID,
              "receivedAt": received[0].updatedAt,
              "transmittingClinicFacilityID": negotiation.transmittingClinic
        	});
        } catch(e) {
          await Negotiation.update({id: negotiation.id}).set({status: "Failed"}).fetch();
          return exits.transmissionFailure({
            "message": "An error occured while submiting refill order request."
          });
        }
      }
    }

  }


};
