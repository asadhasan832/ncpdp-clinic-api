/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function() {
  sails.crypto = require('crypto');
  sails.hat = require('hat');
  sails.AdmZip = require('adm-zip');
  sails.shortid = require('shortid');
  sails.spawn = require('child_process').spawn;
  sails.rimraf = require('rimraf');
  sails.fs = require('fs');

  var xsd_validator = require('xsd-schema-validator');
  sails.xsd_validator = function(xml, schema) {
    return new Promise((res, rej) => {
      xsd_validator.validateXML(xml, schema, function(err, result) {
        //console.log(err);
        //console.log(result);
        if (err) return rej(err);
        return res(result);
      });
    });
   }

   var xml2js = require('xml2js');
   sails.xml2js = function(data) {
     return new Promise((res, rej) => {
       var parser = new xml2js.Parser();
       parser.parseString(data, function (err, result) {
         if (err) return rej(err);
         return res(result);
       });
     });
   }

   sails.xml2jsBuilder = xml2js.Builder;

   sails.createHMAC = function(message) {
     return new Promise((res, rej) => {
       var hmac = sails.crypto.createHmac('sha256', sails.config.models.dataEncryptionKeys.default);
       hmac.on('readable', () => {
         var data = hmac.read();
         return res(data);
       });
       hmac.write(message);
       hmac.end();
     });
   }

   sails.owasp = require('owasp-password-strength-test');
   sails.generator = require('generate-password');
  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

};
