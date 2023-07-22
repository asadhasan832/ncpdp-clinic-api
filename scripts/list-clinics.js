module.exports = {


  friendlyName: 'List clinics',


  description: '',


  fn: async function () {
    var audit = await sails.sendNativeQuery("select auditDisposition='START AUDITING' AS auditIsActive from audit_instatement_log ORDER BY `timestamp` DESC LIMIT 0,1;");
    audit = audit.rows;
    if(_.isUndefined(audit) || _.isUndefined(audit[0]) || _.isUndefined(audit[0].auditIsActive) || !audit[0].auditIsActive) {
      throw new Error('Database audit mechanism failure detected. Please see README.md on instating an audit.');
    }
    var clinics = await Clinic.find({});
    sails.log(clinics);
  }


};
