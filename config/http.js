/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/
    poweredBy: false,
    order: [
      //'cookieParser',
      //'session',
      //'implyJSON',
      'bodyParser',
      'compress',
      'poweredBy',
      'auditCheck',
      'router',
      //'www',
      //'favicon',
    ],


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/
    /*implyJSON: (function() {
      return function (req,res,next) {
        req.wantsJSON = true;
        return next();
      };
    })(),*/
    auditCheck: (function() {
      return function (req,res,next) {
        sails.sendNativeQuery("select auditDisposition='START AUDITING' AS auditIsActive from audit_instatement_log ORDER BY `timestamp` DESC LIMIT 0,1;").then((r) => {
          r = r.rows;
          if(!_.isUndefined(r) && !_.isUndefined(r[0]) && !_.isUndefined(r[0].auditIsActive) && r[0].auditIsActive) {
            next();
          } else {
            res.status(500).send({
              "message": "Server failed to fullfill request due to auditing mechanism failure. If possible, please notify system administrator."
            });
          }
        }).catch((err) => {
          //console.log(err);
          res.status(500).send({
            "message": "Server failed to fullfill request due to an internal database error."
          });
        });
      };
    })(),
    //Alternative implementation, requires TRIGGER privilege, which is not always practical.
    /*auditCheck: (function() {
      return function (req,res,next) {
        //Build ORM-database audit trigger integrity check chart.
        var orm_tables = _.compact(_.map(global, (e,i) => {return e._adapter && i !== 'Archive' ? i.toLowerCase() : ''}));
        var required_triggers = _.flatten(_.map(orm_tables, (t) => {
          return [t+'_update', t+'_delete', t+'_insert'];
        }));
        //console.log(orm_tables);
        //var live_triggers  = (async ()=>{console.log(_.map((await sails.sendNativeQuery('SHOW TRIGGERS;')), (e) => {return _.map(e,(e)=>{return e.Trigger})})[0])})();
        //req.
        sails.sendNativeQuery('SHOW TRIGGERS;').then((r) => {
          //console.log(r);
          var live_triggers = _.map(r, (e) => {return _.map(e,(e)=>{return e.Trigger})})[0];
          //console.log(live_triggers);
          //console.log(required_triggers);
          if(_.difference(required_triggers, live_triggers).length === 0) {
            next();
          } else {
            res.status(500).send({
              "message": "Server failed to fullfill request due to auditing mechanism failure. If possible, please notify system administrator."
            });
          }
        }).catch((err) => {
          //console.log(err);
          res.status(500).send({
            "message": "Server failed to fullfill request due to an internal database error."
          });
        });
        //return next();
      };
    })(),*/

    bodyParser: (function _configureBodyParser(){
      var skipper = require('skipper');
      var middlewareFn = skipper({ strict: true, limit: '100mb' });
      return middlewareFn;
    })()

  }

};
