/**
 * zipdownload.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.zipdownload();
 *     // -or-
 *     return res.zipdownload(optionalData);
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       somethingHappened: {
 *         responseType: 'zipdownload'
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

module.exports = function zipdownload(optionalData) {
  //sails.log(optionalData);
  // Get access to `req` and `res`
  var req = this.req;
  var res = this.res;

  // res.set({"Pragma": "public"});
  // res.set({"Expires": "0"});
  // res.set({"Cache-Control": "must-revalidate, post-check=0, pre-check=0"});
  // res.set({"Cache-Control": "public"});
  // res.set({"Content-Description": "File Transfer"});
  res.set({"Content-type": "application/zip"});
  res.set({"Content-Disposition": "attachment; filename="+optionalData.filename});
  //note: filename is the name that will be downloaded
  res.set({"Content-Transfer-Encoding": "binary"});
  res.set({"Content-Length": optionalData.contentLength});

  // Define the status code to send in the response.
  //var statusCodeToSet = 200;
  //res.sendStatus(statusCodeToSet);
  res.end(optionalData.zipBuffer);

};
