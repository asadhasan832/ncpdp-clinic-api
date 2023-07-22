module.exports = {


  friendlyName: 'Empower Clinic API Welcome Message',


  description: 'Welcome message for Empower Clinic API as a JSON response.',

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
    	delete clinic.apiKey;
    	delete clinic.apiSecret;
      clinic.clinicFacilityID = clinic.id;
      delete clinic.id;
      delete clinic.oneTimeAccessToken;
      delete clinic.accessTokenConsumed;
      clinic.apiSecretExpiresOn = (new Date(clinic.apiSecretDateSet+sails.config.custom.apiSecretExpiration)).toString();
      delete clinic.apiSecretDateSet;

    	return exits.success({
		      "message": "Welcome to Empower Pharmacy's NCPDP SCRIPT Gateway API Service for receiving Clinic SCRIPT transmissions.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071",
		      "profile": clinic
    	});
    }

  }


};
