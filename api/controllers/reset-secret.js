module.exports = {


  friendlyName: 'Empower Clinic API Secret Reset',


  description: 'API Secret Reset for Empower Clinic API as a JSON response.',

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
      newApiSecret: {
        description: 'New key being set by the clinic facility.',
        type: 'string',
        required: true
      }
  },

  exits: {

    success: {
      //responseType: 'json',
      description: '`apiSecret` reset was completed sucessfully.',
      statusCode: 200,
    },

    clinicAuthFailure: {
        statusCode: 401,
	      description: "`apiSecret` reset failed. Please contact Empower Pharmacy's clinic support for assistance."
    },

    clinicKeyResetFailure: {
        statusCode: 451,
	      description: "`apiSecret` reset failed. Please contact Empower Pharmacy's clinic support for assistance."
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
      var pastKeys = await sails.sendNativeQuery("select newValue from clinic_audit WHERE columnName = 'apiSecret'\
                                                       AND uniqueIdentifierField = 'apiKey' AND uniqueIdentifier = $1\
                                                       ORDER BY `timestamp` DESC\
                                                       LIMIT 0,5;", [inputs.apiKey]);
      pastKeys = _.map(pastKeys.rows, function(r) {
        return r.newValue;
      });
      secretdata = (await sails.createHMAC(inputs.newApiSecret)).toString('hex');
      if(_.includes(pastKeys, secretdata)) {
        return exits.clinicKeyResetFailure({
          "message": "`newApiSecret` must be different than the last five `apiSecret` values set for the clinic facility. Please contact Empower Pharmacy's clinic support for assistance."
        });
      }

      var pass_strength = sails.owasp.test(inputs.newApiSecret);
      if(pass_strength.errors.length > 0) {
        return exits.clinicKeyResetFailure({
          "message": "`newApiSecret` failed to set as `apiSecret` due to the following issues:\n"+pass_strength.errors.join("\n")
        });
      }
      await Clinic.update({id: clinic.id}).set({apiSecret: secretdata, apiSecretDateSet: (new Date()).getTime()}).fetch();
    	//delete clinic.apiKey;
    	//delete clinic.apiSecret;
      clinic.clinicFacilityID = clinic.id;
      delete clinic.id;
      delete clinic.oneTimeAccessToken;
      delete clinic.accessTokenConsumed;
      clinic.apiSecretExpiresOn = (new Date(clinic.apiSecretDateSet+sails.config.custom.apiSecretExpiration)).toString();
      delete clinic.apiSecretDateSet;

    	return exits.success({
		      "message": "Clinic Facility `apiSecret` was reset successfully. Please find the new `apiSecret` in the `profile` attribute of this response.",
          "NCPDP_SCRIPT_STANDARD_VERSION": "2018071",
		      "profile": clinic
    	});
    }

  }


};
