"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const AWS = require('aws-sdk');
AWS.config.update({ region: "us-east-1"});
// noinspection JSUnusedGlobalSymbols
/**
* Converts a SAML mapped attribute, e.g. list of groups, to a cognito groups claim in the generated token
* (groups claims are included in both id tokens and access tokens, where custom attributes only show in the id token)
*
* E.g. from a string attribute named "custom:groups" to an array attribute named "cognito:groups":
* <pre>
* {
*  ...
*  "custom:groups": "[g1,g2]",
*  ...
* }
* </pre>
* to
*
* <pre>
* {
*  ...
*  "cognito:groups": ["g1","g2"],
*  ...
* }
* </pre>
*
* To be used with the Pre Token Generation hook in Cognito.
*
* <b>IMPORTANT</b>: the scope `aws.cognito.signin.user.admin` should NOT be enabled for any app client that uses this
* The reason is that with aws.cognito.signin.user.admin, users can modify their own attributes with their access token
*
* if you want to remove the temporary custom:groups attribute used as an intermediary from the token
*
* <code>
* event.response.claimsOverrideDetails.claimsToSuppress = [getGroupsCustomAttributeName()];
* </code>
*
* @param event Lambda event as described above,
* see here for details:
* https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html
*
* @returns {Promise<*>} Lambda event as described above
*/
exports.handler = async (event) => {
   
    var email = event.request.userAttributes[helpers_1.getIdAttributeName()]
    var domainName = helpers_1.parseIdAttribute(email)
    console.log("email " + email)
    console.log("email Domain " + domainName)
    if ( helpers_1.isTenantInfoInDB() ) {
         console.log ( "Retrieving Tenant Info from Database...");
         //Email
         var tableName = helpers_1.tenantsTableName();
         var tenantName = "";
         const ddb = new AWS.DynamoDB({ apiVersion: "2012-10-08"});
         const documentClient = new AWS.DynamoDB.DocumentClient({ region: "us-east-1"});
       
         const params = {
            TableName: tableName,
            Key: {
             emailDomain: domainName
            }
         }
        console.log("TableName  " + tableName)
         try {
            const data = await documentClient.get(params).promise();
            console.log(data);
            // parse json
            //var jsonParsed = JSON.parse(data);
            //console.log('JSON:' + jsonParsed);
            tenantName = data.Item.tenantName;
            console.log("TenantName:" + tenantName);
         } catch (err) {
            console.log(err);
         }
    }
   
    event.response.claimsOverrideDetails = {
        groupOverrideDetails: {
            groupsToOverride: [
                // any existing groups the user may belong to
                ...event.request.groupConfiguration.groupsToOverride,
                // groups from the IdP (parses a single value, e.g. "[g1,g2]" into a string array, e.g ["g1","g2"])
               ...helpers_1.parseGroupsAttribute(event.request.userAttributes[helpers_1.getGroupsCustomAttributeName()])
            ]
        },
        claimsToAddOrOverride: {
            "custom:domainName": domainName,
            "custom:tenantName": tenantName
        }
    };
    //console.log ("Email ID.." + event.request.userAttributes[helpers_1.getIdAttributeName()] ) ;
    return event;
};
 