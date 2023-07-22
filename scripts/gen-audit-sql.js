//MODIFY WITH EXTREME CAUTION. IF ANY USER IS BLOCKED IN ./config/custom.js UNDER privilegedSQLUsers, IT MUST HAVE A VERY SECURE ORGANIZATIONALLY ROTATED PASSWORD, AND MUST NEVER BE USED TO MODIFY AN AUDIT TABLE.
//IT IS THE SOLE RESPONSIBILITY OF DATABASE ADMINISTRATOR(S) TO GENERATE AND EXECUTE APPROPRIATE AUDITING SCIPT WITH THE CORRECT HUMAN-REPRESENTATIVE USERNAMES TO ENSURE CFR. TITLE 21 PART 11 COMPLIANCE.
module.exports = {

  friendlyName: 'Audit',

  description: 'Generate 21 CFR. Part 11 compliance audit trail SQL on a new with all privileges database.',

  /*
  Who Attributes:
  clinic -> serverOSUser
  clinicalinforequest -> receivingClinic

  clinicalinforesponse -> transmittingClinic
  negotiation -> transmittingClinic
  newrxmessage -> transmittingClinic
  refillrxmessage -> transmittingClinic
  */

  fn: async function (inputs) {
    var computeSQLUserPermissions = function(dbName, tableName, userString, tablesDefs) {
      var tableDefKey, permHooks;
      if(tablesDefs[tableName]) {
        for(tableDefKey in tablesDefs[tableName]) {
          permHooks = /(.+)(Permissions)/.exec(tableDefKey);
          if(permHooks !== null && userString.indexOf('\''+permHooks[1]+'_') === 0) {
            return `GRANT `+tablesDefs[tableName][permHooks[0]].join(',')+` ON `+dbName+'.'+tableName+` TO `+userString+`;
  `;
          }
        }
      }

      return '';
    }
    //var done = {};
    var dbName = sails.config.datastores.default.url.split('/').splice(3).join('');
    var trigger = `use `+dbName+`;
    SET autocommit = 0;
    START TRANSACTION;
`;
    var perms = trigger;
    var tablesDefs = {};
    var tables = _.compact(_.map(global, (e,i) => {
      if(e._adapter && i !== 'Archive') {
        //console.log(__dirname.replace('/scripts', '')+'/api/models/'+i+'.js');
        var module = {};
        var file = require('fs').readFileSync(__dirname.replace('/scripts', '')+'/api/models/'+i+'.js').toString('utf8');
        eval(file);
        tablesDefs[i.toLowerCase()] = module.exports;
        return i.toLowerCase();
      }
      return '';
    }));
    var tablesAll = _.compact(_.map(global, (e,i) => {return e._adapter ? i.toLowerCase() : ''}));
    var connStrings = [];
    var connPriv = [];
    var SQLUsers = await sails.sendNativeQuery(`SELECT user, host FROM mysql.db WHERE db = '`+dbName+`'`);
    //console.log(SQLUsers);
    _.each(SQLUsers.rows, (r) => {
      if(!_.include(sails.config.custom.privilegedSQLUsers, r.user)) {
        var host = "'"+r.user+"'@'"+r.host+"'";
        connStrings.push(host);
        connPriv.push('ALL PRIVILEGES');
        for(var tp in tablesAll) {
          //Give access to ORM databases;
          //hosts.push(host);
          //done[host+'-'+tp] = true;
          if(tp == 0) {
            perms += `REVOKE ALL PRIVILEGES ON `+dbName+`.* FROM `+host+`;
`;
            trigger += `REVOKE ALL PRIVILEGES ON `+dbName+`.* FROM `+host+`;
`;
          }
          //perms += `GRANT `+computeSQLUserPermissions(dbName, tablesAll[tp], host, tablesDefs)+` ON `+dbName+'.'+tablesAll[tp]+` TO `+host+`;
//`;
          //trigger += `GRANT `+computeSQLUserPermissions(dbName, tablesAll[tp], host, tablesDefs)+` ON `+dbName+'.'+tablesAll[tp]+` TO `+host+`;
//`;
        }
        //connStrings.push(host);
      }
    });
    var currentGrants = await sails.sendNativeQuery(`SELECT user, host, table_name, table_priv FROM mysql.tables_priv WHERE db = '`+dbName+`'`);
    //console.log(currentGrants);
    //var done = [];
    _.each(currentGrants.rows, (g) => {
      var host = "'"+g.user+"'@'"+g.host+"'";
      if(g.table_priv && !connStrings[host]) {
        //Revoke all current user privileges
        perms += `REVOKE `+g.table_priv+` ON `+dbName+`.`+g.table_name+` FROM `+host+`;
  `;
        trigger += `REVOKE `+g.table_priv+` ON `+dbName+`.`+g.table_name+` FROM `+host+`;
  `;
        connStrings.push(host);
        connPriv.push(g.table_priv);
      }
    });

    //console.log(connStrings);
    //console.log(connPriv);
    var done = [];
    _.each(connStrings, (h, i) => {
      //if(!done[h]) {
        for(var tp in tablesAll) {
          //if(i == tp && connPriv[i] !== 'ALL PRIVILEGES' || !done[h+'-'+tp]) {
            /*perms += `GRANT `+computeSQLUserPermissions(dbName, tablesAll[tp], connStrings[i], tablesDefs)+` ON `+dbName+'.'+tablesAll[tp]+` TO `+connStrings[i]+`;
  `;
            trigger += `GRANT `++` ON `+dbName+'.'+tablesAll[tp]+` TO `+connStrings[i]+`;
  `;*/

            var grant = computeSQLUserPermissions(dbName, tablesAll[tp], connStrings[i], tablesDefs);
            if(!done[grant]) {
              done[grant] = true;
              perms += grant;
              trigger += grant;
            }
          //}
        }
        //done[h] = true;
      //}
    });

    // for(var hst in hosts) {
    //   console.log(hst);
    //   var grants = await sails.sendNativeQuery(`SHOW GRANTS FOR `+hst);
    //   _.each(grants, (grant) => {
    //     console.log(grant);
    //   })
    // }
    // console.log(SQLHosts);

    trigger += `
    CREATE TABLE IF NOT EXISTS audit_instatement_log (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      auditDisposition varchar(255) CHARACTER SET latin1 DEFAULT NULL,
      auditedSchema longtext CHARACTER SET latin1,
      \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      softwareGitRevisionID varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
      scriptGeneratingOSUser varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
      instatingSQLServerUser varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `;
    _.each(_.uniq(connStrings), (h) => {
      perms += `GRANT SELECT ON `+dbName+'.audit_instatement_log'+` TO `+h+`;
`
      trigger += `GRANT SELECT ON `+dbName+'.audit_instatement_log'+` TO `+h+`;
`
    });
    var stop_triggers = `use `+dbName+`;
    SET autocommit = 0;
    START TRANSACTION;
`;
    //Iterate ORM models to generate triggers in order to meet 21 cfr part 11 compliance.
    var schema = {};
    for(var t in tables) {
      //sails.log(tables[t]);
      var table = await sails.sendNativeQuery('DESC '+tables[t]);
      schema[tables[t]] = table;
      //console.log(table.rows[f]);
      stop_triggers += `DROP TRIGGER IF EXISTS `+tables[t]+`_update;
      DROP TRIGGER IF EXISTS `+tables[t]+`_delete;
      DROP TRIGGER IF EXISTS `+tables[t]+`_insert;
      `;
      trigger += `DROP TRIGGER IF EXISTS `+tables[t]+`_update;
      DROP TRIGGER IF EXISTS `+tables[t]+`_delete;
      DROP TRIGGER IF EXISTS `+tables[t]+`_insert;

      CREATE TABLE IF NOT EXISTS `+tables[t]+`_audit`+` (
        id int(10) unsigned NOT NULL AUTO_INCREMENT,
        operation varchar(15) CHARACTER SET latin1 DEFAULT NULL,
        modelName varchar(255) CHARACTER SET latin1 DEFAULT NULL,
        uniqueIdentifierField varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        uniqueIdentifier varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        modelID int(10) unsigned NOT NULL,
        columnName varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        oldValue longtext CHARACTER SET latin1,
        newValue longtext CHARACTER SET latin1,
        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operatingUserField varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        operatingUserID varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        operatingUserName varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        theoreticalOperationSource varchar(1024) CHARACTER SET latin1 DEFAULT NULL,
        SQLUser varchar(255) CHARACTER SET latin1 DEFAULT NULL,
        PRIMARY KEY (id),
        KEY search (modelName,modelID,columnName(767))`+
        (tables[t] == 'clinic' ? ',\nKEY clinic_secret_index (columnName, uniqueIdentifierField, uniqueIdentifier)\n' : '')
      +`) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`
      _.each(_.uniq(connStrings), (h) => {
        var grant;
        if(tables[t] == 'clinic') {
          grant = `GRANT SELECT,INSERT ON `+dbName+'.'+tables[t]+`_audit TO `+h+`;
`
        } else {
          grant = `GRANT INSERT ON `+dbName+'.'+tables[t]+`_audit TO `+h+`;
`
        }
        perms += grant;
        trigger += grant;
      });

      trigger += `DELIMITER |
      create trigger `+tables[t]+`_update
                    before update on `+tables[t]+`
                    for each row
                    begin

                    `;
      for(var f in table.rows) {
        var fields = `operation,
        modelName,
        modelID,
        columnName,
        oldValue,
        newValue,
        \`timestamp\``
        /*,
        transmittingClinic,
        receivingClinic,
        serverOSUser`;*/

        var values = `'UPDATE',
        '`+tables[t]+`',
        new.id,
        '`+table.rows[f].Field+`',
        old.`+table.rows[f].Field+`,
        new.`+table.rows[f].Field+`,
        now()`;

        if(tables[t] == 'clinic') {
          trigger += `SELECT contactName INTO @operatingUserName FROM clinic WHERE id = new.id;
`;
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'apiKey', new.apiKey, 'transmittingClinic', new.id, @operatingUserName, 'HTTP REST API', USER()`;
        } else if(tables[t] == 'clinicalinforequest') {
          trigger += `SELECT contactName INTO @operatingUserName FROM clinic WHERE id = new.receivingClinic;
`;
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', new.messageID, 'receivingClinic', new.receivingClinic, @operatingUserName, 'HTTP REST API', USER()`;
        } else {
          trigger += `SELECT contactName INTO @operatingUserName FROM clinic WHERE id = new.transmittingClinic;
`;
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', new.messageID, 'transmittingClinic', new.transmittingClinic, @operatingUserName, 'HTTP REST API', USER()`;
        }

        trigger += `if (old.`+table.rows[f].Field+` <> new.`+table.rows[f].Field+`) then
          insert into `+tables[t]+`_audit
            (
                `+fields+`
            )
            values
            (
                `+values+`
            );
         end if;

         `;
      }
      trigger += `end
|
DELIMITER ;
`;
      trigger += `DELIMITER |
      create trigger `+tables[t]+`_delete
                    before delete on `+tables[t]+`
                    for each row
                    begin

                    `;
      for(var f in table.rows) {
        var fields = `operation,
        modelName,
        modelID,
        columnName,
        oldValue,
        newValue,
        \`timestamp\``
        /*,
        transmittingClinic,
        receivingClinic,
        serverOSUser`;*/

        var values = `'DELETE',
        '`+tables[t]+`',\
        old.id,
        '`+table.rows[f].Field+`',
        old.`+table.rows[f].Field+`,
        null,
        now()`;

        if(tables[t] == 'clinic') {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'apiKey', old.apiKey, null, null, null, 'Illegal Operation; Occured but Not Defined in Code', USER()`;
        } else if(tables[t] == 'clinicalinforequest') {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', old.messageID, null, null, null, 'Illegal Operation; Occured but Not Defined in Code', USER()`;
        } else {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', old.messageID, null, null, null, 'Illegal Operation; Occured but Not Defined in Code', USER()`;
        }

        /*if(tables[t] == 'clinic') {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource';
          values += `, 'apiKey', old.apiKey, 'serverOSUser', old.serverOSUser, 'Illegal Operation; Occured but Not Defined in Code'`;
        } else if(tables[t] == 'clinicalinforequest') {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource';
          values += `, 'messageID', old.messageID, 'receivingClinic', old.receivingClinic, 'Illegal Operation; Occured but Not Defined in Code'`;
        } else {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource';
          values += `, 'messageID', old.messageID, 'transmittingClinic', old.transmittingClinic, 'Illegal Operation; Occured but Not Defined in Code'`;
        }*/

        trigger += `
          insert into `+tables[t]+`_audit
            (
                `+fields+`
            )
            values
            (
                `+values+`
            );
         `;
      }
      trigger += `end
|
DELIMITER ;
`;

      trigger += `DELIMITER |
      create trigger `+tables[t]+`_insert
                    before insert on `+tables[t]+`
                    for each row
                    begin

                    `;
      for(var f in table.rows) {
        var fields = `operation,
        modelName,
        modelID,
        columnName,
        oldValue,
        newValue,
        \`timestamp\``
        /*,
        transmittingClinic,
        receivingClinic,
        serverOSUser`;*/

        var values = `'INSERT',
        '`+tables[t]+`',
        new.id,
        '`+table.rows[f].Field+`',
        null,
        new.`+table.rows[f].Field+`,
        now()`;

        if(tables[t] == 'clinic') {
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'apiKey', new.apiKey, 'serverOSUser', new.serverOSUserID, new.serverOSUser, 'Administrative Shell Script', USER()`;
        } else if(tables[t] == 'clinicalinforequest') {
          trigger += `SELECT contactName INTO @operatingUserName FROM clinic WHERE id = new.receivingClinic;
`;
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', new.messageID, 'receivingClinic', new.receivingClinic, @operatingUserName, 'HTTP REST API', USER()`;
        } else {
          trigger += `SELECT contactName INTO @operatingUserName FROM clinic WHERE id = new.transmittingClinic;
`;
          fields += ', uniqueIdentifierField , uniqueIdentifier , operatingUserField , operatingUserID , operatingUserName, theoreticalOperationSource, SQLUser';
          values += `, 'messageID', new.messageID, 'transmittingClinic', new.transmittingClinic, @operatingUserName, 'HTTP REST API', USER()`;
        }

        trigger += `
          insert into `+tables[t]+`_audit
            (
                `+fields+`
            )
            values
            (
                `+values+`
            );

         `;
      }
      trigger += `end
|
DELIMITER ;
`;
    }
    perms += `COMMIT;
`
    var exec = require('child_process').execSync;
    var gitRevisionID = exec('git rev-parse HEAD');
    trigger += `INSERT INTO audit_instatement_log(auditDisposition, auditedSchema, \`timestamp\`, softwareGitRevisionID, scriptGeneratingOSUser, instatingSQLServerUser) values ('START AUDITING', '`+JSON.stringify(schema)+`', NOW(), '`+_.trim(gitRevisionID)+`', '`+require("os").userInfo().username+`', CURRENT_USER());
    COMMIT;
`
    //await sails.sendNativeQuery(trigger);
    stop_triggers += `INSERT INTO audit_instatement_log(auditDisposition, auditedSchema, \`timestamp\`, softwareGitRevisionID, scriptGeneratingOSUser, instatingSQLServerUser) values ('STOP AUDITING', '`+JSON.stringify(schema)+`', NOW(), '`+_.trim(gitRevisionID)+`', '`+require("os").userInfo().username+`', CURRENT_USER());
    COMMIT;
`
    require('fs').writeFileSync('audit_setup_sql/audit_start.sql', trigger);
    require('fs').writeFileSync('audit_setup_sql/audit_stop.sql', stop_triggers);
    require('fs').writeFileSync('audit_setup_sql/protect_perm.sql', perms);
    console.log('Audit start statements written to: ./audit_setup_sql/audit_start.sql');
    console.log('Audit stop statements written to: ./audit_setup_sql/audit_stop.sql');
    console.log('User permission statements written to (Also present in audit_start.sql): ./audit_setup_sql/protect_perm.sql');
    console.log('Please execute on database under an audited administrastive user.');
  }
}
