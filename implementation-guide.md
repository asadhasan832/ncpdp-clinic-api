<center><img width="340" height="86" src="https://www.empowerpharmacy.com/themes/empower_pharmacy_theme/logo.svg" /></center>

<div class="title"><h1>Clinic API Implementation Guide</h1></div>

**Document Prepared For:** YOUR_CLINIC_NAME_GOES_HERE

**Contact Person:** YOUR_CONTACT_NAME_GOES_HERE

**Clinic API Key:** YOUR_API_KEY_GOES_HERE

**Clinic API Secret:** YOUR_API_SECRET_GOES_HERE (Please reset prior to production use and every 90 days via the `/reset-api-secret` RPC endpoint.)

## Table of Contents
1. [About this Guide](#introduction)
2. [API Security, API Authentication, Data Validation and MessageID Integrity Checks](#auth)
3. [E-signatures, Digital Signatures and Legal Disclaimer](#disclaimer)
4. [Software Copyright License (MIT)](#license)
5. [Clinic API NewRx Message and Currently Supported Flows](#interface)
6. [Clinic Starter Kit Guide](#start-guide)
    1. [Attaining the Clinic Starter Kit Zip Archive](#attain-kit)
    2. [Clinic Starter Kit Archive Anatomy](#archive-anatomy)
    3. [Installing Pre-requisites on Server / Development Workstation](#install-prereqs)
    4. [Installing Example Project Dependencies](#install-proj)
    5. [Running Message Transmission and Utility CLI Examples](#run-cli)
7. [Clinic API REST Documentation](#api-doc)

<a name="introduction"></a>
## 1. About this Guide
The purpose of this document is to overview Empower Pharmacy's Clinic API. Clinic API implements the NCPDP SCRIPT XML Standard (Current Server VERSION 2018071) in an HTTP RESTful JSON envelope to provide a mechanism for secure SCRIPT XML message exchange accompanying relevant transactional order data to integrate clinical practices with Empower Pharmacy's dispensing and shipping process.

Through the course of this guide we will cover the Clinic API's security, authentication paradigms, request data validation, MessageID integrity checks and provide an overview of the Clinic Starter Kit bundled with example integration code to allow clinical institutions an opportunity to provide a deeper integration between pharmacy processes and clinical workflows, to reduce human error and drive efficiency and cost savings to patients.

We conclude this guide with the Clinic API REST documentation of current RPC end points, while keeping it as a living document that will evolve as we work together on better integrating our systems for patient convenience.

<a name="auth"></a>
## 2. API Security, Authentication, Data Validation and MessageID Integrity Checks
The Clinic API is a JSON based RESTFul API that is served through SSL encryption at https://api.clinic.empowerpharmacy.com/, bringing a simplistic security model that already secures most of the modern web integrations to encapsulate and transmit/exchange NCPDP SCRIPT XML Standard complaint messages.

Clinic API is delivered from a HIPAA, SOC 1, 2 and 3 compliant Azure cloud architecture where data is housed in an encrypted fashion and served from a Microsoft managed server-less container model to ensure patient privacy at all times.

Each participating clinic facility is assigned a unique `apiKey` and `apiSecret` that can be used to make HTTP JSON **POST** requests to all RPC endpoints served by the Clinic API server. The `apiKey` and `apiSecret` are only accessible via a one-time downloadable link, which if intercepted and accessed, would not be accessible by the intended recipient party, prompting a revocation and reissue to avoid any data forgery. Clinic facility must reset `apiSecret` each time prior to the 90 day expiration period using the `/reset-api-secret` RPC endpoint.

All HTTP REST requests are authenticated via the `apiKey` and `apiSecret` REST request parameters. These credentials are delivered to the clinic by a pharmacy representative via a one-time access Clinic Starter Kit download secure link. If the one-time access only link is hypothetically intercepted, the clinic will not be able to access the Clinic Starter Kit on their attempt to download, hence contacting the pharmacy will result in revocation of the compromised credentials immediately and prompt the issuance of a new download link. Only Some RPC endpoints such as `/newrx` and `/clinicalinfo` require a `SCRIPTXMLMessage` REST request parameter that can be used to send NCPDP SCRIPT Standard compliant messages to the pharmacy. Every request with a `SCRIPTXMLMessage` REST request parameter is validated against the NCPDP SCRIPT XML Standard VERSION 2018071 before it can be processed, hence any resulting validation errors are returned to the clinical EHR/EMR system making the request with an explanation of schema violation as a `schema_error` REST response field with an HTTP status code of `403`. Other RPC endpoints like `/refillrx` do not handle the HTTP `SCRIPTXMLMessage` REST request parameter, but only accept order level parameters such as patient delivery information.

`MessageID` is an important attribute of an NCPDP SCRIPT Standard XML message header. `MessageID` is essential for auditing and tracing a message and corresponding e-signature back to its origin. Negotiation is a pre-requisite step to sending any NCPDP SCRIPT Standard XML message to the Clinic API servers. This is initiated by the sender by making a REST call to `/negotiate-message` or `/negotiate-messages` (for bulk) RPC endpoints that issue system-wide unique `MessageID` tokens against the sending clinic facility's credentials which are to be stored by the pharmacy forever for the purposes of performing message trace operations and audits.

The Clinic Starter Kit comes bundled with resources pertaining to the latest NCPDP SCRIPT XML Standard such as Guides, Documentation and Schema Definitions located under the folder `./NCPDP_SCRIPT_Standard_Resources/`. You may explore the NCPDP XML format in a visual navigable format and generate message samples by opening `./NCPDP_SCRIPT_Standard_Resources/Schema_Definations/transport.xsd` using a tool called [Oxygen XML Editor](https://www.oxygenxml.com/xml_editor/download_oxygenxml_editor.html). Information on individual tags is present in `./NCPDP_SCRIPT_Standard_Resources/Documentation/NCPDP-XML-Standard-v2018071.pdf`.

Please see <a href="#api-doc">Clinic API Rest Documentation</a> section to find REST request parameter and response JSON field details.

<a name="disclaimer"></a>
## 3. E-signatures, Digital Signatures and Legal Disclaimer
* Clinic API server rejects any NCPDP SCRIPT XML NewRx messages sent to the server without a Security header that contains a Nonce, which is expected to be a clinical EHR/EMR system wide unique ciphertext that can be used to trace and audit the prescriber's electronic signature for the transmitted prescription. By sending any NewRx message to Clinic API server, your organization is agreeing to provide a valid Nonce that represents an e-signature signed and executed by the prescriber of that prescription from the clinical facility's CFR. Title 21 Part 11 compliant EHR/EMR system.

* For electronic prescribing of non-controlled substances, an electronic signature
as defined by the E-Sign Act and/or state board of pharmacy rules is required, however electronic prescribing of controlled substances, more specific digital signature
requirements are defined by the DEA regulations. Currently the Clinic API only supports electronic signature and non-controlled substances, but work is underway to support clinic-pharmacy workflows for all dispensable compounds. Please see `./NCPDP_SCRIPT_Standard_Resources/Documentation/NCPDPElectronicSignatureGuidanceFinal.pdf` to learn the difference between electronic signature and digital signature.

* All e-signature, hand-signatures, tokens, documents, prescriptions and example code provided in this archive are intended for the sole purposes of testing and evaluation only. An actual application using the code provided in this archive to prepare and send actual prescriptions for pharmacy use must provide unique real signatures/tokens data being streamed/referenced from a CFR. Title 21 Part 11 compliant EHR/EMR application/database backend.

* For more information please see:
   * `./NCPDP_SCRIPT_Standard_Resources/Documentation/NCPDPElectronicSignatureGuidanceFinal.pdf`
   * https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?CFRPart=11

* Sections pertaining to e-signatures:
    * Sec. 11.50 Signature manifestations
    * Sec. 11.70 Signature/record linking                                             
    * Sec. 11.200 Electronic signature components and controls

<a name="license"></a>
## 4. Software Copyright License (MIT)

Copyright 2018 Empower Pharmacy

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

<a name="interface"></a>
## 5. Clinic API NewRx Message and Currently Supported Flows
After an NCPDP SCRIPT XML Standard NewRx message is sent to the Clinic API server at `/newrx` RPC endpoint, it responds with an NCPDP SCRIPT XML Standard ClinicalInfoRequest message. This can prompt clinic side EHR/EMR system to optionally reply with an NCPDP SCRIPT XML Standard ClinicalInfoResponse message to the `/clinicalinfo` RPC endpoint. Bundled CLI examples demonstrate this Rx and related clinical document(s) send-receive flow and the relating of messages to each other with relevant NCPDP SCRIPT XML Standard attributes such as `RelatesToMessageID` and REST parameters such as `clinicalInfoRequestMessageID` for `/clinicalinfo` and `originalRXMessageID` for `/refillrx` RPC endpoints respectively. If NCPDP SCRIPT XML Standard `RelatesToMessageID` is provided, matching REST parameters for `clinicalInfoRequestMessageID` and `originalRXMessageID` are expected by the Clinic API server as an integrity check between the JSON envelope and NCPDP SCRIPT XML Standard compliant message string in the REST.

<a name="start-guide"></a>
## 6. Clinic Starter Kit Guide
This section will cover downloading and accessing a custom starter kit that is only available via a one-time download link. Once the link content is downloaded as a zip file, and extracted, the API key and API secret can be found in `./Clinic_Implementation_Guide.pdf` and `./config/credentials.json`. These are the credentials required to access the API in order to make transactional HTTP REST requests and to send and receive NCPDP SCRIPT XML Standard compliant messages.

<a name="attain-kit"></a>
### 6.1. Attaining the Clinic Starter Kit Zip Archive
You can may download the latest version of the Clinic Starter Kit with up-to-date documentation at https://api.clinic.empowerpharmacy.com/starter-kit?apiKey=YOUR_API_KEY_GOES_HERE&apiSecret=YOUR_API_SECRET_GOES_HERE (use incognito mode in your browser to avoid caching `apiKey` / `apiSecret` in the history to prevent message forgery by malicious individuals using the same computer as the developer). Once downloaded, **please keep the contents of this archive safe**, as it contains sensitive information that can be used to send clinic facility level authenticated messages to the pharmacy. These cryptographic keys are never released to anyone, except via the one-time download only link that is made available to the Clinic's qualified I.T. staff. If the API credentials are misplaced or stolen, please notify Empower Pharmacy clinic support at support@empowerpharmacy.com immediately to prompt a revocation and reissue.

<a name="archive-anatomy"></a>
### 6.2. Clinic Starter Kit Archive Anatomy

```
Clinic Starter Kit (plain directory tree)
├── Clinic_Implementation_Guide.pdf
├── LISENCE.txt
├── NCPDP_SCRIPT_Standard_Resources
|  ├── Documentation
|  |  ├── NCPDP-XML-Standard-v2018071.pdf
|  |  ├── NCPDPElectronicSignatureGuidanceFinal.pdf
|  |  ├── SCRIPT-Imp-Guide-v2018071.pdf
|  |  └── V2018071SCRIPT-Standard-Examples-Guide-v10.pdf
|  ├── Schema_Definations
|  |  ├── Schema Modifications for 2018071v1.docx
|  |  ├── datatypes.xsd
|  |  ├── ecl.xsd
|  |  ├── samples.xsd
|  |  ├── script.xsd
|  |  ├── specialized.xsd
|  |  ├── structures.xsd
|  |  └── transport.xsd
|  └── Unit_of_Measure_Terminology
|     ├── NCPDP.txt
|     ├── NCPDP.xls
|     ├── NCPDP.xlsx
|     └── README.txt
├── config
|  └── credentials.json
├── message_logs
|  ├── renderings
|  ├── requests
|  └── responses
├── package.json
├── sample_orders
|  ├── sample_order.json
|  └── sample_order_fedex.json
├── sample_pdf_documents
|  └── physical_clinical_document.pdf
├── sample_signatures
|  ├── DISCLAIMER.md
|  ├── raster_signature.jpg
|  └── vector_signature.svg
├── sample_xml_scripts
|  ├── sample_clinical_info_response.xml
|  ├── sample_newrx_message.xml
|  └── sample_newrx_message_exhaustive.xml
├── sendNewRx.js
├── sendRefillRequestOrder.js
├── sendClinicalInfoResponse.js
├── renderSCRIPTXMLtoPDFDocument.js
├── embedPDFDocumentInClinicalInfoResponse.js
├── sendNewRxAndRespondWithSCRIPTXMLRendering.js
├── tmp
├── tree.txt
└── util
   ├── document_style.css
   └── timezones.json

Clinic Starter Kit (directory tree with comments)
├── LISENCE.txt - Software copyright license (MIT).
├── Clinic_Implementation_Guide.pdf - Generated implementation guide with one-time issued Clinic API credentials.
├── NCPDP_SCRIPT_Standard_Resources/ - Resources released by NCPDP pertaining to the NCPDP SCRIPT XML Standard.
|  ├── Documentation/ - Official NCPDP Standard documentation, e-signature and digital signature guidance.
|  |  ├── NCPDP-XML-Standard-v2018071.pdf
|  |  ├── NCPDPElectronicSignatureGuidanceFinal.pdf
|  |  ├── SCRIPT-Imp-Guide-v2018071.pdf
|  |  └── V2018071SCRIPT-Standard-Examples-Guide-v10.pdf
|  ├── Schema_Definations/ - Schema definitions used by the Clinic API server for data validation.
|  |  ├── Schema Modifications for 2018071v1.docx
|  |  ├── datatypes.xsd
|  |  ├── ecl.xsd
|  |  ├── samples.xsd
|  |  ├── script.xsd
|  |  ├── specialized.xsd
|  |  ├── structures.xsd
|  |  └── transport.xsd
|  └── Unit_of_Measure_Terminology/ - List of NewRx message 'MedicationPrescribed > QuantityUnitOfMeasure > Code' field.
|     ├── NCPDP.txt
|     ├── NCPDP.xls
|     ├── NCPDP.xlsx
|     └── README.txt
├── config/ - THIS FOLDER MUST BE KEPT SECURE AT ALL TIMES.
|  └── credentials.json - One-time issued pre-populated API credentials to execute REST requests on the Clinic API server on behalf of a clinic.
├── package.json - Package file pointing to all source code dependencies to run the CLI examples. Install project with command 'npm i'.
├── sendNewRx.js - CLI example to send an NCPDP SCRIPT Standard compliant NewRx message.
├── sendRefillRequestOrder.js - CLI example to send a JSON refill request order given a successful server response JSON file from a previous NewRx message transaction.
├── sendClinicalInfoResponse.js - CLI example to respond to a ClinicalInfoRequest SCRIPTXMLMessage that is returned from the server when a NewRx message is received.
├── renderSCRIPTXMLtoPDFDocument.js - CLI example utility tool to render an NCPDP SCRIPT Standard compliant NewRx message in to a human readable PDF document.
├── embedPDFDocumentInClinicalInfoResponse.js - CLI example utility tool to embed a PDF document in to a ClinicalInfoResponse SCRIPTXMLMessage.
├── sendNewRxAndRespondWithSCRIPTXMLRendering.js - CLI example to send an NCPDP SCRIPT Standard compliant NewRx message, and then to the returning ClinicalInfoRequest (from pharmacy) respond with a PDF rendering of the SCRIPTXML as an attachment in a ClinicalInfoResponse message (from clinic facility).
├── message_logs/ - Log all requests and responses to the Clinic API server as JSON files. Also archive all PDF renderings done by the sendNewRxAndRespondWithSCRIPTXMLRendering.js CLI example. THIS FOLDER MUST BE KEPT SECURE AT ALL TIMES.
|  ├── renderings/
|  ├── requests/
|  └── responses/
├── sample_xml_scripts/ - Example NCPDP SCRIPT XML Standard based prescription and clinical response messages. Please see files for XML for inline documentation.
|  ├── sample_clinical_info_response.xml
|  ├── sample_newrx_message.xml
|  └── sample_newrx_message_exhaustive.xml
├── sample_orders/ - Sample JSON order object that is sent along side the SCRIPTXMLMessage REST attribute for a /newrx request or by itself for a /refillrx request.
|  ├── sample_order.json
|  └── sample_order_fedex.json
├── sample_pdf_documents/ - Example PDF documents for testing.
|  └── physical_clinical_document.pdf
├── sample_signatures/ - Example PDF hand-written signature data for testing.
|  ├── DISCLAIMER.md
|  ├── raster_signature.jpg - High DPI bitmap signature.
|  └── vector_signature.svg - Path based vector signature.
├── tmp/ - Used for rendering request SCRIPTXMLMessage in to PDF. THIS FOLDER MUST BE KEPT SECURE AT ALL TIMES.
└── util/
  ├── document_style.css - SCRIPTXML Rendering cascading style sheet to be customized to the clinic facility's branding based theme.
  └── timezones.json - Used by current renderSCRIPTXMLtoPDFDocument.js implementation to generate header time from the Clinic API clinic facility profile timezone.
```

<a name="install-prereqs"></a>
### 6.3. Installing Pre-requisites on Server / Development Workstation
The example software provided in this archive should be able to run on Linux, Windows or Mac. The main dependency of the example software in this archive is the Node.js run-time (v10.15.0 LTS) which MUST be installed and available in the command line `$PATH` variable before proceeding with the commands outlined in this guide. However, the server itself is built on a RESTful paradigm, which is platform independent, and can be integrated with using any programming language. Please see <a href="#api-doc">Clinic API REST Documentation</a> as a resource for building custom integrations in the programming language most compatible with the integrating health care organization's existing clinical system's backend.

For Windows and Mac, you may download the latest version of the run-time or source code to compile from: https://nodejs.org/en/download/

For a production server, you may want to compile from source, use the package manager to get the latest LTS version from the developer community, or use the packages provided by your cloud provider. The long term support version at this time is v10.15.0 LTS, hence all example code has been tested against that version.

PDF generation uses `npm` package `electron` which should run natively on a GPU powered Windows, Mac or X11 Linux instance but can run headless in a production Linux environment with the use of the software `xvfb`.

**Node.js v10.x Binary Package Installation Instructions**:

```sh
# Using Ubuntu
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using Debian, as root
curl -sL https://deb.nodesource.com/setup_10.x | bash -
apt-get install -y nodejs
```

**Node.js v10.x Source Compilation Instructions**:

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04

<a name="install-proj"></a>
### 6.4. Installing Example Project Dependencies
After attaining the starter kit, extract it completely in to a new folder. Once done, start a terminal/command line and ensure that the `node` command is available, by running `node -v` to view the installed version. If you get an error while running the `node` or `npm` command, you may contact Empower Pharmacy's I.T. support for assistance.

Execute the following command to navigate to the extracted Clinic Starter Kit archive:

```sh
cd /path/to/extracted/folder
```

Execute the following commands to install the project depencies:

```sh
npm i

```

Wait for all software dependencies to install and upon completion you may run the following provided CLI commands given below with their usage syntax and examples.

<a name="run-cli"></a>
### 6.5. Running Message Transmission and Utility CLI Examples
```sh
#CLI example to reset clinic facility apiSecret, which expires every 90 days.
node resetApiSecret.js

## Usage syntax: ##
node resetApiSecret.js STRONG_OWASP_NEW_API_SECRET|"GENERATE"

## Usage example (With new OWASP test compatible secret): ##
node resetApiSecret.js c285d7941evVlqWgz06HuwbmDpo3tfayP

## Usage example (With generated OWASP test compatible secret): ##
node resetApiSecret.js "GENERATE"
```
```sh
#CLI example to send an NCPDP SCRIPT Standard compliant NewRx message.
node sendNewRx.js

## Usage syntax: ##
node sendNewRx.js PATH_TO_NEW_RX_SCRIPTXML PATH_TO_ORDER_JSON

## Usage example (USPS): ##
node sendNewRx.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json

## Usage example (FedEx):
node sendNewRx.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order_fedex.json
```

```sh
#CLI example to send a JSON refill request order given a successful server response JSON file from a previous NewRx message transaction.
node sendRefillRequestOrder.js

## Usage syntax: ##
node sendRefillRequestOrder.js ORIGINAL_NEW_RX_RESPONSE_JSON PATH_TO_ORDER_JSON

## Usage example (USPS): ##
node sendRefillRequestOrder.js message_logs/responses/EP-XXXXX.json sample_orders/sample_order.json

## Usage example (FedEx): ##
node sendRefillRequestOrder.js message_logs/responses/EP-XXXXX.json sample_orders/sample_order_fedex.json
```

```sh
#CLI example to respond to a ClinicalInfoRequest SCRIPTXMLMessage that is returned from the server when a NewRx message is received.
node sendClinicalInfoResponse.js

## Usage syntax: ##
node sendClinicalInfoResponse.js CLINICAL_INFO_RESPONSE_XML CLINICAL_INFO_REQUEST_RETURNING_NEW_RX_RESPONSE_JSON

## Usage example (ClinicalInfoResponse XML message must have the same Patient, Pharmacy and Prescriber tags as the ClinicalInfoRequest message that was returned from the server upon transmitting a NewRx message): ##
node sendClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml message_logs/responses/EP-XXXXX.json
```
<div class="secnote"><center><h3>Security Note</h3></center><strong>The following example makes use of renderSCRIPTXMLtoPDFDocument.js:</strong><br />
  This example creates a temporary web server to render the SCRIPTXML in to a human-readable HTML and then PDF. This temporary web-server only listens on http://127.0.0.1:RANDOMPORT/, and serves the rendered NCPDP SCRIPT HTML ONLY after receiving a HTTP GET nonce that is known only by the program itself and the package electron-pdf. To deploy this solution in a production environment, it needs to be confirmed that no other user on the same  operating system instance as this program can perform port scanning, ARP poisoning or packet capture attacks on the server/VMs local network interface. Since the temporary web server is only designed to listen on the local network interface, network agents outside of the machine would not be able to reach it directly.</div>

```sh
#CLI example utility tool to render an NCPDP SCRIPT Standard compliant NewRx message in to a human readable PDF document. ##
node renderXMLSCRIPTtoPDFDocument.js

## Usage syntax:
node renderSCRIPTXMLtoPDFDocument.js NEGOTIATED_MESSAGE_ID_STAMP PATH_TO_SCRIPT_XML PATH_TO_OUTPUT_PDF [PATH_TO_TEMPORARY_HAND_SIGNATURE_FILE]

## Usage example (with vector hand-written signature): ##
node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf sample_signatures/vector_signature.svg

## Usage example (with raster hand-written signature): ##
node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf sample_signatures/raster_signature.jpg

## Usage example (with no hand-written signature): ##
node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf

## Rendered document style can be modified by editing renderSCRIPTXMLtoPDFDocument.js and util/document_style.css (cascading style sheet to be customized to the clinic''s branding theme.) ##
```

```sh
#CLI example utility tool to embed a PDF document in to a ClinicalInfoResponse SCRIPTXMLMessage.
node embedPDFDocumentInClinicalInfoResponse.js

## Usage syntax: ##
node embedPDFDocumentInClinicalInfoResponse.js CLINICAL_INFO_RESPONSE_INPUT_XML DOCUMENT_SOURCE PATH_TO_INPUT_PDF CLINICAL_INFO_RESPONSE_OUTPUT_XML

# Usage example: ##
node embedPDFDocumentInClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml SCAN sample_pdf_documents/physical_clinical_document.pdf tmp/sample_clinical_info_response.xml

## Usage example: ##
node embedPDFDocumentInClinicalInfoResponse.js sample_xml_scripts/sample_clinical_info_response.xml NCPDP_SCRIPT_XML_Rendering tmp/sample_output.pdf tmp/sample_clinical_info_response.xml

## Transmit PDF Embedded ClinicalInfoResponse message: ##
node sendClinicalInfoResponse.js tmp/sample_clinical_info_response.xml message_logs/responses/EP-XXXXX.json
```

<div class="secnote"><center><h3>Security Note</h3></center><strong>The following example makes use of sendNewRxAndRespondWithSCRIPTXMLRendering.js, which invokes renderSCRIPTXMLtoPDFDocument.js:</strong><br />
  This example creates a temporary web server to render the SCRIPTXML in to a human-readable HTML and then PDF. This temporary web-server only listens on http://127.0.0.1:RANDOMPORT/, and serves the rendered NCPDP SCRIPT HTML ONLY after receiving a HTTP GET nonce that is known only by the program itself and the package electron-pdf. To deploy this solution in a production environment, it needs to be confirmed that no other user on the same  operating system instance as this program can perform port scanning, ARP poisoning or packet capture attacks on the server/VMs local network interface. Since the temporary web server is only designed to listen on the local network interface, network agents outside of the machine would not be able to reach it directly.</div>

```sh
#CLI example to send an NCPDP SCRIPT Standard compliant NewRx message, and then to the returning ClinicalInfoRequest (from pharmacy) respond with a PDF rendering of the SCRIPTXML as an attachment in a ClinicalInfoResponse (from clinic) message.
node sendNewRxAndRespondWithSCRIPTXMLRendering.js

## Usage syntax: ##
node sendNewRxAndRespondWithSCRIPTXMLRendering.js PATH_TO_NEW_RX_SCRIPTXML PATH_TO_ORDER_JSON CLINICAL_INFO_RESPONSE_INPUT_XML [PATH_TO_TEMPORARY_HAND_SIGNATURE_FILE]

## Usage example (with vector hand-written signature): ##
node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml sample_signatures/vector_signature.svg

## Usage example (with raster hand-written signature): ##
node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml sample_signatures/raster_signature.jpg

## Usage example (with no hand-written signature): ##
node sendNewRxAndRespondWithSCRIPTXMLRendering.js sample_xml_scripts/sample_newrx_message.xml sample_orders/sample_order.json sample_xml_scripts/sample_clinical_info_response.xml
```


<a name="api-doc"></a>
## 7. Clinic API REST Documentation
Clinic API embraces the RESTful approach by responding to all successful requests with an HTTP status code of 200 and other distinct codes in the event of failures. All responses have JSON HTTP body with a `message` field explaining the successful or erroneous outcome. Any request with a SCRIPTXMLMessage field failing validation against the NCPDP SCRIPT XML Standard Version 2018071, are responded to with a status code other than 200 along with an explanation to the clinical software with the schema violation in `schema_error` and `message` REST JSON response fields.

A MessageID negotiation or transmission may fail due to many reasons, including but not limited to:
  * Missing required REST field.
  * Failure of validation of the NCPDP SCRIPTXMLMessage against the standard version 2018071 (You may explore the NCPDP XML format in a visual navigable format and generate samples by opening `./NCPDP_SCRIPT_Standard_Resources/Schema_Definations/transport.xsd` using a tool called [Oxygen XML Editor](https://www.oxygenxml.com/xml_editor/download_oxygenxml_editor.html).
  * Missing NCPDP SCRIPTXMLMessage XML Message Security header or a prescriber e-signature in the child Nonce field.
  * MessageID mismatch between the REST JSON envelope and the embedded NCPDP SCRIPTXMLMessage XML.
  * Failure to negotiate MessageID due to cryptographic entropy pollution.

It is the responsibility of the implementing code to record all Clinic API response statuses and payloads, and retry a message sufficient times with a reasonable interval when a HTTP status code of 200 is not received, before contacting the pharmacy. If an abnormal amount of transmission failures are encountered, please contact Empower Pharmacy's I.T. support for assistance.

<table>
<tbody><tr><th>RPC</th><th>Description</th></tr>
<tr><td>GET /</td><td>Info and clinic facility profile.</td></tr>
<tr><td>POST /</td><td>Info and clinic facility profile.</td></tr>
<tr><td>POST /reset-api-secret</td><td>RPC endpoint to reset clinic facility apiSecret reset. <strong>Must be done every 90 days to avoid account lock-out.</strong></td></tr>
<tr><td>POST /negotiate-message</td><td>NCPDP SCRIPT unique cipher MessageID negotiation RPC endpoint.</td></tr>
<tr><td>POST /negotiate-messages</td><td>NCPDP SCRIPT unique cipher MessageID negotiation RPC endpoint.</td></tr>
<tr><td>POST /newrx</td><td>Order and NCPDP SCRIPT Standard compliant NewRx XML Message receiving RPC endpoint.</td></tr>
<tr><td>POST /refillrx</td><td>Refill Rx Order request receiving RPC.</td></tr>
<tr><td>POST /clinicalinfo</td><td>ClinicalInfoResponse SCRIPTXMLMessage receiving RPC.</td></tr>
<tr><td>GET /starter-kit</td><td>Clinic Starter Kit download link. <strong>Accessing each time will set a new apiSecret for the clinic facility.</strong></td></tr>
</tbody></table>

* Fields with * (asterisk) are required.
* Each request is limited to a 100mb in size.

<table>
  <tbody><tr><th>RPC</th><th>Input JSON/urlencoded Fields</th><th>Sucess HTTP JSON Response Fields</th></tr>
  <tr><td>GET /</td><td><ul>
    <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
    <li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
  </ul></td><td>
    <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li><li><strong>NCPDP_SCRIPT_STANDARD_VERSION</strong> - Current version of the NCPDP SCRIPT XML Standard on the server.</li>
      <li><strong>profile</strong> - Currently stored clinic facility profile.</li></ul>
    </td></tr>
    <tr><td>POST /</td><td><ul>
      <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
      <li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
    </ul></td><td>
      <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li><li><strong>NCPDP_SCRIPT_STANDARD_VERSION</strong> - Current version of the NCPDP SCRIPT XML Standard on the server.</li>
        <li><strong>profile</strong> - Currently stored clinic facility profile.</li></ul>
      </td></tr>
      <tr><td>POST /reset-api-secret</td><td><ul>
        <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
        <li><strong>apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
      <li><strong>newApiSecret*</strong> - A newly requested API secret to be assigned to clinic facility to perform API transactions under. <strong>Must pass an OWASP strength test.</strong> Please see: <a href="https://www.npmjs.com/package/owasp-password-strength-test">OWASP Password Strength Test NPM package</a></li></ul></td><td>
        <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction or a list of OWASP based strength test errors.</li>
          </ul>
        </td></tr><tr><td>POST /negotiate-message</td><td><ul>
        <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
        <li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
      </ul></td><td>
        <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li><li><strong>messageIDs</strong> - A JSON Array of negotiated unique MessageIDs.</li>
          <li><strong>negotiatingClinicFacilityID</strong> - Clinic facility id that initiated the negotiation of MessageID.</li></ul>
        </td></tr>

<tr><td>POST /negotiate-messages</td><td><ul>
          <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>

<li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
        <li><strong>count*</strong> - The number of MessageIDs being requested for transmission. Limit: 100.</li></ul></td><td>
          <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li><li><strong>messageIDs</strong> - A JSON Array of negotiated unique MessageIDs.</li>
          <li><strong>negotiatingClinicFacilityID</strong> - Clinic facility id that initiated the negotiation of MessageID.</li></ul>
          </td></tr><tr><td>POST /newrx</td><td><ul><li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
<li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
<li><strong> negotiatedMessageID*</strong> - A pre-negotiated MessageID attained from /negotiate-message or /negotiate-messages RPC endpoints.</li>
<li><strong> SCRIPTXMLMessage*</strong> - NCPDP SCRIPT Standard compliant NewRx XML Message to go accompany the REST order request.</li>
<li><strong>orderMemo</strong></li>
<li><strong>deliveryAddressLine1</strong></li>
<li><strong>deliveryAddressLine2</strong></li>
<li><strong>deliveryCity</strong></li>
<li><strong>deliveryState</strong></li>
<li><strong>deliveryZipCode</strong></li>
<li><strong>shippingMethod: </strong>"usps" | "fedex"</li>
</ul></td><td>
          <ul>
    <li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li>
<li><strong> messageID</strong> - a pre-negotiated MessageID of the NewRx message that was successfully submitted.</li>
<li><strong> responseMessageID</strong> - MessageID of the ClinicalInfoRequest NCPDP Standard XML Message that is returned with the SCRIPTXMLMessage in the same response.</li>
<li><strong>transmittingClinicFacilityID</strong> - Clinic facility id that initiated the transmission.</li><li><strong> receivedAt</strong> - The date/time at which the message was received.</li>
</ul>
          </td></tr>
<tr><td>POST /refillrx</td><td><ul>
          <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
<li><strong>apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
<li><strong>negotiatedMessageID*</strong> - A pre-negotiated MessageID attained from /negotiate-message or /negotiate-messages RPC endpoints.</li>
<li><strong>originalRXMessageID*</strong> - MessageID of the original NCPDP SCRIPT Standard compliant NewRx XML Message the refill request is being made for.</li>
<li><strong>orderMemo</strong></li>
<li><strong>deliveryAddressLine1</strong></li>
<li><strong>deliveryAddressLine2</strong></li>
<li><strong>deliveryCity</strong></li>
<li><strong>deliveryState</strong></li>
<li><strong>deliveryZipCode</strong></li>
<li><strong>shippingMethod: </strong>"usps" | "fedex"</li>
        </ul></td><td>
          <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li>
<li><strong>messageID</strong> - A pre-negotiated MessageID of the NewRx message that was successfully submitted.</li>
<li><strong>originalRXMessageID</strong> - MessageID of the original NCPDP SCRIPT Standard compliant NewRx XML Message the refill request is being made for.</li>
<li><strong>transmittingClinicFacilityID</strong> - Clinic facility id that initiated the transmission.</li><li><strong>receivedAt</strong> - The date/time at which the message was received.</li>
<span style="visibility: hidden;">
<li></li>
<li></li>
<li></li>
<li></li>
<li></li>
<li></li>
<li></li>
</span>
</ul>
          </td></tr>
<tr><td>POST /clinicalinfo</td><td><ul><li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
<li><strong>apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
<li><strong>negotiatedMessageID*</strong> - A pre-negotiated MessageID attained from /negotiate-message or /negotiate-messages RPC endpoints.</li>
<li><strong>clinicalInfoRequestMessageID*</strong> - MessageID of the NCPDP SCRIPT Standard compliant ClinicalInfoRequest XML Message that originated from the pharmacy.</li>
<li><strong>SCRIPTXMLMessage*</strong> - NCPDP SCRIPT Standard compliant ClinicalInfoResponse XML Message being sent in response to the ClinicalInfoRequest XML Message that originated from the pharmacy.</li>
        </ul></td><td>
          <ul><li><strong>message</strong> - Human readable message explaining the outcome of the successful transaction.</li>
<li><strong>messageID</strong> - A pre-negotiated MessageID of the NewRx message that was successfully submitted.</li>
<li><strong>clinicalInfoRequestMessageID</strong> - MessageID of the NCPDP SCRIPT Standard compliant ClinicalInfoRequest XML Message that originated from the pharmacy.</li>
<li><strong>transmittingClinicFacilityID</strong> - Clinic facility id that initiated the transmission.</li><li><strong>receivedAt</strong> - The date/time at which the message was received.</li>
</ul>
          </td></tr><tr><td>GET /starter-kit</td><td><ul>
    <li><strong>apiKey*</strong> - A dedicated API key assigned to clinic facility to perform API transactions under.</li>
    <li><strong> apiSecret*</strong> - A dedicated API secret assigned to clinic facility to perform API transactions under.</li>
  </ul></td><td>
          <ul><li><strong>Binary Zip File Response</strong></li>



</ul>
          </td></tr>
        </tbody></table>

* **Clinic facility profile fields:** clinicFacilityID, clinicName, clinicLogo, email, contactName, contactNumber, contactFax, contactEmail, ccLastFour, ccExpDate, clinicLineFirst, clinicLineSecond, clinicCity, clinicState, clinicZip, shipLineFirst, shipLineSecond, shipCity, shipState, shipZip
