/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
	'GET /':                   											{ action: 'welcome-msg' },
  'POST /':                   										{ action: 'welcome-msg' },
	'POST /reset-api-secret':												{ action: 'reset-secret' },
	'POST /negotiate-message':											{ action: 'negotiate-message' },
	'POST /negotiate-messages':											{ action: 'negotiate-message' },
	'POST /newrx':																	{ action: 'newrx' },
	'POST /refillrx':																{ action: 'refillrx' },
	'POST /clinicalinfo':														{ action: 'clinicalinfo' },
	'GET /starter-kit':															{ action: 'starter-kit' }
};
