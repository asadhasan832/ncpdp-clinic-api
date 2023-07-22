/**
 * Negotiation.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  clinicFacilityPermissions: [
    'SELECT',
    'INSERT',
    'UPDATE'
  ],
  pharmacyClerkPermissions: [
    'SELECT'
  ],
  pharmacyTechPermissions: [
    'SELECT'
  ],
  pharmacistPermissions: [
    'SELECT'
  ],
  attributes: {
    messageID: {
      type: 'string',
      unique: true,
      required: true
    },
    status: {
      type: 'string',
      description: "Negotiated id status varies from Initialized, Transmitting, Received, Failed."
    },
    transmittingClinic: {
      model: "clinic"
    }
  },

};
