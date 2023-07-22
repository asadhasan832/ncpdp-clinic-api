/**
 * forbidden.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.forbidden();
 *     // -or-
 *     return res.forbidden(optionalData);
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       somethingHappened: {
 *         responseType: 'forbidden'
 *       }
 *     }
 * ```
 *
 * ```
 *     throw 'somethingHappened';
 *     // -or-
 *     throw { somethingHappened: optionalData }
 * ```
 */

module.exports = function forbidden(optionalData) {

    // Get access to `req` and `res`
    var req = this.req;
    var res = this.res;

    // Define the status code to send in the response.
    var statusCodeToSet = 403;
    return res.status(statusCodeToSet).send({
      "message": "Requested server resource was not accessible."
    });
};
