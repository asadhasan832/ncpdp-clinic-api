var fs = require('fs');
var _ = require('lodash');

if(_.isUndefined(process.argv[2]) || _.isUndefined(process.argv[3]) || _.isUndefined(process.argv[4]) || _.isUndefined(process.argv[5])) {
  /*********************************************** DISCLAIMER************************************
   * The signatures provided in this usage example are intended for the sole purpose of testing *
   * and evaluation only. An actual application using the code provided in this archive must    *
   * provide unique real signature data being streamed from a CFR. Title 21 Part 11 compliant         *
   * application/database backend.                                                              *
   * For more information please see:                                                           *
   * https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11          *
   * Sections pertaining to e-signatures:                                                       *
   * Sec. 11.50 Signature manifestations                                                        *
   * Sec. 11.70 Signature/record linking                                                        *
   * Sec. 11.200 Electronic signature components and controls.                                  *
   **********************************************************************************************/
  throw new Error(`
    *************************************************DISCLAIMER**********************************************
    * The signatures/tokens provided in the following usage examples are intended for the sole purpose      *
    * of testing and evaluation only. An actual application using the code provided in this archive         *
    * to prepare and send actual prescriptions for pharmacy use must provide unique real signatures/tokens  *
    * data being streamed/referenced from a CFR. Title 21 Part 11 compliant EHR/EMR application/database    *
    * backend.                                                                                              *
    *                                                                                                       *
    * For more information please see:                                                                      *
    * https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11                     *
    *                                                                                                       *
    * Sections pertaining to e-signatures:                                                                  *
    * Sec. 11.50 Signature manifestations                                                                   *
    * Sec. 11.70 Signature/record linking                                                                   *
    * Sec. 11.200 Electronic signature components and controls.                                             *
    *********************************************************************************************************

    ## Usage syntax: ##
    node embedPDFDocumentInClinicalInfoResponse.js CLINICAL_INFO_RESPONSE_INPUT_XML DOCUMENT_SOURCE PATH_TO_INPUT_PDF CLINICAL_INFO_RESPONSE_OUTPUT_XML

    # Usage example: ##
    node embedPDFDocumentInClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml SCAN sample_pdf_documents/physical_clinical_document.pdf tmp/sample_clinical_info_response.xml

    ## Usage example: ##
    node embedPDFDocumentInClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml NCPDP_SCRIPT_XML_Rendering tmp/sample_output.pdf tmp/sample_clinical_info_response.xml

    ## Transmit PDF Embedded ClinicalInfoResponse Message: ##
    node sendClinicalInfoResponse.js tmp/sample_clinical_info_response.xml message_logs/responses/EP-XXXXX.json

    `);
}

var docsource = process.argv[3];
//Load pdf in base64
var pdf = fs.readFileSync(process.argv[4]).toString('base64');
//Load xml in base64 and replace.
var xml = fs.readFileSync(process.argv[2]).toString('utf8')
              .replace(/(\<AttachmentSource\>)[^\<]+(\<\/AttachmentSource\>)/i, "$1"+docsource+"$2")
              .replace(/(\<AttachmentData\>)[^\<]+(\<\/AttachmentData\>)/i, "$1"+pdf+"$2")
              .replace(/(\<MIMEType\>)[^\<]+(\<\/MIMEType\>)/i, "$1"+"application/pdf"+"$2")
//Write embeded XML.
fs.writeFileSync(process.argv[5], xml);
console.log('SCRIPT XML Embedded with PDF Data written to: '+process.argv[5]);
