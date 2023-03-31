"use strict";
const AWS = require('aws-sdk');
Object.defineProperty(exports, "__esModule", { value: true });
AWS.config.update({ region: "us-east-1"});
 
/**
* get the name of the custom user pool attribute holding the mapped groups
*/
exports.getGroupsCustomAttributeName = () => process.env.GROUPS_ATTRIBUTE_CLAIM_NAME || "custom:groups";
 
exports.getIdAttributeName = () => process.env.ID_ATTRIBUTE_CLAIM_NAME || "email";
 
exports.isTenantInfoInDB = () => process.env.TENANT_INFO_IN_DB || "true";
 
exports.tenantsTableName = () => process.env.TABLE_NAME || "TenantInfo";
 
 
/**
* converts a string in the form of "[group1,group2,group3]"
*  into an array ["group1","group2","group3"]
*
* or a single value "group1" to an array ["group1"]
*
* @param groupsFromIdP
*/
exports.parseGroupsAttribute = (groupsFromIdP) => {
   
    console.log ( "parseGroupsAttribute called" + groupsFromIdP );
 
    if (groupsFromIdP) {
        if (groupsFromIdP.startsWith("[") && groupsFromIdP.endsWith("]")) {
            // this is how it is received from SAML mapping if we have more than one group
            // remove [ and ] chars. (we would use JSON.parse but the items in the list are not quoted)
            var output = groupsFromIdP
                .substring(1, groupsFromIdP.length - 1) // unwrap the [ and ]
                .split(/\s*,\s*/) // split and handle whitespace
                .filter(group => group.length > 0); // handle the case of "[]" input
           
            console.log ( "Output-1:" + output );
            return output;
        }
        else {
            // this is just one group, no [ or ] added
            var output = [groupsFromIdP];
            console.log ( "Output-2:" + output );
            return output;
        }
    }
    return [];
};
 
exports.parseIdAttribute = (emailId) => {
    //console.log ( "parseIdAttribute called" + emailId );
    var domainName = emailId.split("@") [1];
    return domainName;
};