/**
 * Production environment settings
 * (sails.config.*)
 *
 * What you see below is a quick outline of the built-in settings you need
 * to configure your Sails app for production.  The configuration in this file
 * is only used in your production environment, i.e. when you lift your app using:
 *
 * ```
 * NODE_ENV=production node app
 * ```
 *
 * > If you're using git as a version control solution for your Sails app,
 * > this file WILL BE COMMITTED to your repository by default, unless you add
 * > it to your .gitignore file.  If your repository will be publicly viewable,
 * > don't add private/sensitive data (like API secrets / db passwords) to this file!
 *
 * For more best practices and tips, see:
 * https://sailsjs.com/docs/concepts/deployment
 */

module.exports = {


  /**************************************************************************
  *                                                                         *
  * Tell Sails what database(s) it should use in production.                *
  *                                                                         *
  * (https://sailsjs.com/config/datastores)                                 *
  *                                                                         *
  **************************************************************************/
  datastores: {

    /***************************************************************************
    *                                                                          *
    * Configure your default production database.                              *
    *                                                                          *
    * 1. Choose an adapter:                                                    *
    *    https://sailsjs.com/plugins/databases                                 *
    *                                                                          *
    * 2. Install it as a dependency of your Sails app.                         *
    *    (For example:  npm install sails-mysql --save)                        *
    *                                                                          *
    * 3. Then set it here (`adapter`), along with a connection URL (`url`)     *
    *    and any other, adapter-specific customizations.                       *
    *    (See https://sailsjs.com/config/datastores for help.)                 *
    *                                                                          *
    ***************************************************************************/
    default: {

      /***************************************************************************
      *                                                                          *
      * Want to use a different database during development?                     *
      *                                                                          *
      * 1. Choose an adapter:                                                    *
      *    https://sailsjs.com/plugins/databases                                 *
      *                                                                          *
      * 2. Install it as a dependency of your Sails app.                         *
      *    (For example:  npm install sails-mysql --save)                        *
      *                                                                          *
      * 3. Then pass it in, along with a connection URL.                         *
      *    (See https://sailsjs.com/config/datastores for help.)                 *
      *                                                                          *
      ***************************************************************************/
      adapter: 'sails-mysql',
      url: 'mysqli://pharmacyClerk_SAMPLEEMPLOYEE:123456@localhost:3306/scriptserver',

    }

  }
};
