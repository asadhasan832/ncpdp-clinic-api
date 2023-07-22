module.exports = {


  friendlyName: 'Empower Clinic API NCPDP SCRIPT Message ID Negotiation Endpoint',


  description: 'NCPDP SCRIPT message negotiation endpoint that returns message ID tokens usable for new and refill RX messages.',

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
      count: {
        description: 'The number of message IDs being requested for transmission. Limit: 100.',
        type: 'number',
        defaultsTo: 1
      }
  },

  exits: {

  success: {
      //responseType: 'json',
      description: 'Welcome message for Empower Clinic API as a JSON response.',
      statusCode: 200,
  },

  clinicAuthFailure: {
        statusCode: 401,
	      description: "Failed to authenticate clinic with the specified `apiKey` and `apiSecret`. Please contact Empower Pharmacy's clinic support for assistance."
  },

  negotiationLimitExceeded: {
      statusCode: 403,
      description: "Count must be larger than 0 but less than 100 messages."
  },

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
    if(inputs.count <= 0 || inputs.count > 100) {
      return exits.negotiationLimitExceeded({
        "message": "Parameter `count` must be larger than 0 but less than 101 messages."
      })
    }
    var secretdata = await sails.createHMAC(inputs.apiSecret);
    var clinic = await Clinic.findOne({apiKey: inputs.apiKey, apiSecret: secretdata.toString('hex'), deactivated: false});
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
       var clinics = _.range(inputs.count).map(()=> {return {
         messageID: 'EP-'+sails.hat(),
         status: "Initialized",
         transmittingClinic: clinic.id
       }});
       clinics = await Negotiation.createEach(clinics).fetch();
       clinics.map((clinic) => {
         delete clinic.id;
         delete clinic.transmittingClinic;
         clinic.issuedAt = clinic.createdAt
         delete clinic.updatedAt;
         delete clinic.createdAt;
         return clinic;
       })
       return exits.success({
 		      "message": "Successfully negotiated "+inputs.count+" message"+(inputs.count>1?'s':'')+".",
 		      "messageIDs": clinics,
          "negotiatingClinicFacilityID": clinic.id
     	});
    }

  }


};
