/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {
  //These users will not have their privileges removed when generating CFR. Title 21 Part 11 compliance audit sql scripts using command: sails run gen-audit-sql
  //MODIFY WITH EXTREME CAUTION. IF ANY USER IS BLOCKED IN THIS SECTION, IT MUST HAVE A VERY SECURE ORGANIZATIONALLY ROTATED PASSWORD, AND MUST NEVER BE USED TO MODIFY AN AUDIT TABLE.
  //IT IS THE SOLE RESPONSIBILITY OF DATABASE ADMINISTRATOR(S) TO GENERATE AND EXECUTE APPROPRIATE AUDITING SCIPT WITH THE CORRECT HUMAN-REPRESENTATIVE USERNAMES TO ENSURE CFR. TITLE 21 PART 11 COMPLIANCE.
  privilegedSQLUsers: ['root', 'EmpowerAdmin'],
  baseUrl: 'http://127.0.0.1:1337',
  apiSecretExpiration: 7776000000 //Provide apiSecret expiration lead time 
  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // mailgunDomain: 'transactional-mail.example.com',
  // mailgunSecret: 'key-testkeyb183848139913858e8abd9a3',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

};
