module.exports = {


  friendlyName: 'Gen clinic key',


  description: '',

  fn: async function (inputs) {
    var hat = require('hat');
    var generator = require('generate-password');
    var crypto = require('crypto');
    var createHMAC = function(message) {
      return new Promise((res, rej) => {
        var hmac = crypto.createHmac('sha256', sails.config.models.dataEncryptionKeys.default+hat());
        hmac.on('readable', () => {
          var data = hmac.read();
          return res(data);
        });
        hmac.write(message+hat());
        hmac.end();
      });
    }
    var audit = await sails.sendNativeQuery("select auditDisposition='START AUDITING' AS auditIsActive from audit_instatement_log ORDER BY `timestamp` DESC LIMIT 0,1;");
    audit = audit.rows;
    if(_.isUndefined(audit) || _.isUndefined(audit[0]) || _.isUndefined(audit[0].auditIsActive) || !audit[0].auditIsActive) {
      throw new Error('Database audit mechanism failure detected. Please see README.md on instating an audit.');
    }
    sails.log('Usage: sails run gen-clinic-key PATH_TO_CLINIC_PROFILE_JSON');
    if(_.isUndefined(process.argv[4])) {
      throw new Error('Usage: sails run gen-clinic-key PATH_TO_CLINIC_PROFILE_JSON');
    } else {
      var clinic = require(process.cwd()+'/clinic_profiles/'+process.argv[4]+'.json');
      //Create Clinic Nonce ID
      var data = await createHMAC(clinic.clinicName+clinic.email+hat());
      clinic['apiKey'] = data.toString('hex');
      var password = generator.generate({
        length: 30,
        numbers: true
      });
      //Generate OWASP hard password and hash it (however when each starter kit is downloaded a new secret is generated).
      password = await createHMAC((hat()+password).replace(/(.)(?=.*\1)/g, ""));
      clinic['apiSecret'] = password.toString('hex');
      //clinic['oneTimeAccessToken'] = d2.toString('hex');
      password = generator.generate({
        length: 30,
        numbers: true
      });
      password = await createHMAC(clinic.clinicName+clinic.email+hat()+password);
      clinic['oneTimeAccessToken'] = password.toString('hex');
      clinic['accessTokenConsumed'] = false;
      clinic['serverOSUser'] = require("os").userInfo().username;
      clinic['serverOSUserID'] = require("os").userInfo().uid;
      var c = await Clinic.create(clinic).fetch();
      delete c.apiKey;
      delete c.apiSecret;
      sails.log(c);
      sails.log('Clinic Starter Kit Link:');
      sails.log(sails.config.custom.baseUrl+'/starter-kit?access='+clinic['oneTimeAccessToken']);
    }
  }


};
