//Security note:
//This program creates a temporary web server to render the SCRIPTXML in to a human-readable HTML and then PDF. This temporary web-server only listens on http://127.0.0.1:RANDOMPORT/, and serves the rendered Script HTML ONLY after receiving a HTTP GET nonce that is known only by the program itself and the package electron-pdf. To deploy this solution in a production environment, it needs to be confirmed that no other user on the same  operating system instance as this program can perform port scanning, ARP poisoning or packet capture attacks on the server/VMs local network interface. Since the temporary web server is only designed to listen on the local network interface, network agents outside of the machine would not be able to reach it directly.

const request = require("request");
const express = require('express');
const serve   = require('express-static');
const fp = require("find-free-port");
const app = express();
const spawn = require('child_process').spawn;
const HummusRecipe = require('hummus-recipe');
const pdf = require('pdf-parse');
const fs = require('fs');
const _ = require("lodash");
const dayjs = require("dayjs");
const timezones = require('./util/timezones.json');
const hat = require('hat');

if(_.isUndefined(process.argv[2]) || _.isUndefined(process.argv[3]) || _.isUndefined(process.argv[4])) {
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

    Usage syntax:
    node renderSCRIPTXMLtoPDFDocument.js NEGOTIATED_MESSAGE_ID_STAMP PATH_TO_SCRIPT_XML PATH_TO_OUTPUT_PDF [PATH_TO_TEMPORARY_HAND_SIGNATURE_FILE]

    Usage example (with vector hand-written signature):
    node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf sample_signatures/vector_signature.svg

    Usage example (with raster hand-written signature):
    node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf sample_signatures/raster_signature.jpg

    Usage example (with no hand-written signature):
    node renderSCRIPTXMLtoPDFDocument.js MESSAGE_ID_PLACE_HOLDER sample_xml_scripts/sample_newrx_message.xml tmp/sample_output.pdf

    `);
}

const creds = require('./config/credentials.json');

var payload = {
     "apiKey": creds.apiKey,
     "apiSecret": creds.apiSecret
}

if(process.argv[5] == 'undefined') {
  process.argv[5] = undefined;
}

var busy = true;
var clinicProfile;
request.post({
  uri: 'http://127.0.0.1:1337/',
  method: 'POST',
  json: payload
}, function (error, response, body) {
  busy = false;
  if (!error && response.statusCode == 200) {
    clinicProfile = body;

    if(_.isUndefined(clinicProfile) || !_.isObject(clinicProfile.profile)) {
      throw new Error('Could not download clinic profile form API.');
    }

    //Set timezone if missing from profile.
    clinicProfile.profile.timezone = clinicProfile.profile.timezone ? clinicProfile.profile.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;

    var token = '';
    var Username = '';
    var Nonce = '';
    var Created = '';
    var user;
    var nonce = hat();
    //console.log('Rendering Nonce: '+nonce);
    fp(3000, function(err, freePort) {
      if(err) throw err;
      var server = app.listen(freePort, '127.0.0.1', function() {
        console.log('HTML rendering service is running at port %s', server.address().port);
        var child = spawn('node', ['node_modules/electron-pdf/cli.js', '-m', '0', 'http://127.0.0.1:'+server.address().port+'/?nonce='+nonce, process.argv[4]]);

        //child.stdout.on('data', function(data) {
            //console.log('stdout: ' + data);
            //Here is where the output goes
        //});
        child.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
            //Here is where the error output goes
        });
        child.on('close', function(code) {
            //console.log('Generated PDF written to: ' + process.argv[4]);
            //pdfwrite({in: process.argv[5], out: process.argv[5], pageNumber:0})
            //.write(0, 0, token).end();
            //console.log('Numbering PDF pages');
            var pdfDoc = new HummusRecipe(process.argv[4], process.argv[4]);
            var dataBuffer = fs.readFileSync(process.argv[4]);
            var style1 = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                  width: 450
                }
            };
            var style1b = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                  width: 312
                }
            };
            var style1c = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                  textAlign: 'center',
                  width: 513
                }
            };
            var style2 = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                    width: 450
                    //lineHeight: 16,
                    //padding: [5, 15]
                }
            };
            var style3 = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                    width: 63,
                    textAlign: 'right'
                }
            };
            var style4 = {
                color: '000000',
                fontSize: 8,
                font: 'Courier New',
                textBox: {
                    width: 200,
                    textAlign: 'right'
                }
            };
            pdf(dataBuffer).then(function(data) {
              //console.log(data.numpages);
              var i = 1;
              while(i <= data.numpages) {
                pdfDoc
                .editPage(i)
                .text(('MessageID: '+token).substr(0,93), 40, 820, style1)
                .text(('MessageID: '+token).substr(0,93), 40, 15, style2)
                .text(('Prescriber\'s E-signature Username: '+Username).substr(0,93), 40, 25, style1b)
                .text(('E-signature Nonce: '+Nonce).substr(0,93), 40, 34, style1c)
                .text(('E-signature Date: '+Created).substr(0,93), 353, 25, style4)
                .text(('Page '+i+' of '+data.numpages), 450+40, 15, style3)
                .text(('Page '+i+' of '+data.numpages), 450+40, 820, style3)
                .endPage()
                i++;
              }
              pdfDoc.endPDF();
    	         console.log('Generated PDF written to: ' + process.argv[4]);
            });
            server.close();
        });
      });
    });

    app.get('/', function (req, res) {
      //res.send('GET request to the homepage')
      if(req.query.nonce === nonce) {
        console.log('Authenticated Rendering Nonce: '+nonce);
        var fs = require('fs');
        var xml2js = require('xml2js');
        var _ = require('lodash');
        var documentCSS = fs.readFileSync('./util/document_style.css');
        var output = `<html><head><link href="https://fonts.googleapis.com/css?family=Open+Sans:300" rel="stylesheet"><title>Message</title>
          <style>
            `+documentCSS+`
          </style></head><body><div class="message-body">`;

          //console.log(output);

        var colormap = [
          '#f7f7f7',
          '#e4e4e4',
          '#dcdada',
          '#d2d1d1',
          '#cacaca',
          '#bbbbbb',
          '#b1b1b1',
          '#abaaaa',
          '#9c9c9c',
          '#949393'
        ];

        function shadeColor(level) {
          return colormap[level]
          if(level > 9) {
            return '#d0d0d0';
          }
        }

        function formatLabel(label) {
          label = label.replace(/([A-Z]+)/g, " $1")
                        .replace(/([A-Za-z])(\d)/g, "$1 $2")
                        .replace(/([A-Z][a-z])/g, " $1")
                        .replace('_', ' ')
                        .replace(/\w\S*/g, function(txt){
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                         });
          if(label.indexOf('Npi') !== -1) {
            return label.toUpperCase();
          }
          return label;
        }

        function levelLimit(l) {
          return l > 4 ? 4 : l;
        }

        function renderDocument(jsdoc, level) {
          if(_.isArray(jsdoc) && _.isString(jsdoc[0])) {
            output += ':'+' '+jsdoc[0]+"<br />\n";
            //.repeat(--level)
            return;
          }
          for(var k in jsdoc) {
            if((k !== 'Document' && k !== '$') && (_.isObject(jsdoc[k]) || (_.isArray(jsdoc[k]) && _.isObject(jsdoc[k][0])))) {
              if((_.isArray(jsdoc[k]) && _.isObject(jsdoc[k][0]))) {
                output += "<div style=\"background: "+shadeColor(level)+";\">";
                output += '<h'+levelLimit(level+1)+'>'+formatLabel(k)+'</h'+levelLimit(level+1)+'>'+(level == 0 ? '\n' : '');
                output += "\n";
                renderDocument(jsdoc[k][0], ++level);
                output += "</div>";
              } else {
                output += "<div style=\"background: "+shadeColor(level)+";\">";
                if(level == 0) {
                  output += `<div class="header">`+(clinicProfile.profile.clinicLogo ? `<div class="logo"><img src="`+clinicProfile.profile.clinicLogo+`"></div>` : '')+`
                             <div class="letterhead"><h1>`+clinicProfile.profile.clinicName+`</h1>
                             <h3>`+clinicProfile.profile.clinicLineFirst+(clinicProfile.profile.clinicLineSecond ? ' '+clinicProfile.profile.clinicLineSecond : '')+', '+clinicProfile.profile.clinicCity+', '+clinicProfile.profile.clinicState+' '+clinicProfile.profile.clinicZip+`</h3>
                             <h4>Phone: `+clinicProfile.profile.contactNumber+`, Fax: `+clinicProfile.profile.contactFax+`</h4>
                             <h4>Date: `+dayjs().format('MM/DD/YYYY h:mm:ss A', { timeZone: clinicProfile.profile.timezone })+' ('+_.filter(timezones, (o)=>{return o.utc.indexOf(clinicProfile.profile.timezone) !== -1})[0].abbr+')'+`</h4>
                             </div></div>`+(level == 0 ? '\n' : '');
                } else {
                  output += '<strong>'+formatLabel(k)+'</strong>'+(level == 0 ? '\n' : '');
                }
                renderDocument(jsdoc[k], ++level);
                output += "</div>";
              }
            }
            --level;
          }
        }

        var parser = new xml2js.Parser();
        fs.readFile(__dirname + '/' + process.argv[3], function(err, data) {
            parser.parseString(data, function (err, result) {
                result.Message.Header[0].MessageID[0] = process.argv[2];
                renderDocument(result, 0);
                output += "</div>"+(process.argv[5] ? "<div class=\"message-signature\"><img src=\""+process.argv[5]+"\" /></div>" : '');
                output += "</body></html>";
                //console.log(output);
                //console.log('Done');
                token = _.has(result, 'Message.Header[0].MessageID[0]') ? result.Message.Header[0].MessageID[0] : 'MISSING_MessageID_DO_NOT_ACCEPT';
                Username = _.has(result, 'Message.Header[0].Security[0].UsernameToken[0].Username[0]') ? result.Message.Header[0].Security[0].UsernameToken[0].Username[0] : 'MISSING_Physician_Username_DO_NOT_ACCEPT';
                Nonce = _.has(result, 'Message.Header[0].Security[0].UsernameToken[0].Nonce[0]') ? result.Message.Header[0].Security[0].UsernameToken[0].Nonce[0] : 'MISSING_ESignature_Nonce_DO_NOT_ACCEPT';
                Created = _.has(result, 'Message.Header[0].Security[0].UsernameToken[0].Created[0]') ? result.Message.Header[0].Security[0].UsernameToken[0].Created[0] : 'MISSING_Created_DO_NOT_ACCEPT';

                res.send(output)
            });
        });
      } else {
        res.status(404).end();
      }
    });

    app.use(serve(__dirname + '/'));
  } else {
    throw new Error('Could not download clinic profile form API.');
  }
});
