/**
 * Clinic.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  clinicFacilityPermissions: [
    'SELECT',
    'UPDATE'
  ],
  pharmacyClerkPermissions: [
    'SELECT',
    'UPDATE',
    'INSERT'
  ],
  pharmacyTechPermissions: [
    'SELECT',
    'UPDATE',
    'INSERT'
  ],
  pharmacistPermissions: [
    'SELECT',
    'UPDATE',
    'INSERT'
  ],
  attributes: {
    apiKey: {
	     type: 'string',
       required: true,
       unique: true
    },
    apiSecret: {
	     type: 'string',
       required: true
    },
    apiSecretDateSet: {
      type: 'number',
      autoCreatedAt: true
    },
    oneTimeAccessToken: {
	     type: 'string',
       required: true,
       unique: true
    },
    accessTokenConsumed: {
       type: 'boolean',
       defaultsTo: true
    },
    deactivated: {
       type: 'boolean',
       defaultsTo: false
    },
    serverOSUser: {
      type: 'string'
    },
    serverOSUserID: {
      type: 'string'
    },
    clinicName: {
        type: 'string',
        required: true
    },
    clinicLogo: {
        type: 'string',
        required: true
    },
    email: {
        type: 'string',
        required: true,
        isEmail: true,
        unique: true
    },
    contactName: {
        type: 'string',
        required: false
    },
    contactNumber: {
          type: 'string',
          required: false
    },
    contactFax: {
          type: 'string',
          required: false
    },
    contactEmail: {
          type: 'string',
          required: false,
          isEmail: true
    },
    ccLastFour: {
          type: 'string',
          required: false
    },
    ccExpDate: {
          type: 'string',
          required: false
    },
    clinicLineFirst: {
        type: 'string',
        required: false
    },
    clinicLineSecond: {
        type: 'string',
        required: false
    },
    clinicCity: {
        type: 'string',
        required: false
    },
    clinicState: {
        type: 'string',
        required: false
    },
    clinicZip: {
        type: 'string',
        required: false
    },
    shipLineFirst: {
        type: 'string',
        required: false
    },
    shipLineSecond: {
        type: 'string',
        required: false
    },
    shipCity: {
        type: 'string',
        required: false
    },
    shipState: {
        type: 'string',
        required: false
    },
    shipZip: {
        type: 'string',
        required: false
    }
  }
};
