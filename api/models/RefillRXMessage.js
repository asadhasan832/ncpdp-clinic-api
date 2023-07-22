/**
 * RefillRXMessage.js
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
    transmittingClinic: {
      model: "clinic",
      required: true
    },
    orderMemo: {
      type: 'string',
      columnType: 'longtext'
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

};
