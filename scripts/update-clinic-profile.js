module.exports = {


  friendlyName: 'Activate clinic',

  /*inputs: {
    clinicID: {
      description: 'ID of clinic being deactivated.',
      type: 'number',
      defaultsTo: process.argv[4]
    }
  },*/

  description: '',


  fn: async function (inputs) {
    var audit = await sails.sendNativeQuery("select auditDisposition='START AUDITING' AS auditIsActive from audit_instatement_log ORDER BY `timestamp` DESC LIMIT 0,1;");
    audit = audit.rows;
    if(_.isUndefined(audit) || _.isUndefined(audit[0]) || _.isUndefined(audit[0].auditIsActive) || !audit[0].auditIsActive) {
      throw new Error('Database audit mechanism failure detected. Please see README.md on instating an audit.');
    }
    sails.log('Usage: sails run update-clinic-profile CLINIC_ID PATH_TO_CLINIC_PROFILE_JSON');
    if(_.isUndefined(process.argv[4]) || _.isUndefined(process.argv[5])) {
      throw new Error('Usage: sails run update-clinic-profile CLINIC_ID PATH_TO_CLINIC_PROFILE_JSON');
    } else {
      var clinic = require(process.cwd()+'/clinic_profiles/'+process.argv[5]+'.json');
      clinic["serverOSUser"] = require("os").userInfo().username;
      clinic['serverOSUserID'] = require("os").userInfo().uid;
      var c = await Clinic.update({id: process.argv[4]}).set(clinic).fetch();
      delete c.apiKey;
      delete c.apiSecret;
      sails.log(c);
    }
  }


};
