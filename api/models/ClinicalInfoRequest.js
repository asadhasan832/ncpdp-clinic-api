/**
 * ClinicalInfoRequest.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  clinicFacilityPermissions: [
    //'SELECT',
    'INSERT'
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
    originalRXMessageID: {
      type: 'string',
      required: true
    },
    receivingClinic: {
      model: "clinic",
      required: true
    },
    SCRIPTXMLMessage: {
      type: 'string',
      columnType: 'longtext'
    }
  },

};
