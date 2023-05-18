import Amplify, { Auth, Cache, API } from 'aws-amplify';
import axios from 'axios';
import { TENANT_API_NAME } from "../config/amplifyConfig";


export async function initiate(email: string): Promise<void> {
    console.log("initiate");

    try {

        console.log("email: " + email + " " );
        
        API.get(TENANT_API_NAME, "/tenantmatch?email=" + email, {})
            .then(function (response: any) {
	     if(response){
                console.log("API response: " + JSON.stringify(response));
                console.log("initiate done");
                if(response.Item && response.Item.idpID) {
                	Auth.federatedSignIn({ customProvider: response.Item.idpID });
		}else {
                   throw new Error("Invalid User domain");  
             	}
             } else {
                throw new Error("Invalid User domain");
             }
                //return true;
            })
           // .catch(function (error: any) {
           //     console.error(error);
           // })
            .finally(function () {
                console.log("api done");
            });
    } catch (err) {
        console.error('Unable to initialize amplify auth.', err);
        //return false;
    }
}

const setCache = (event: any) => {
    Cache.setItem("region", event.region);
    Cache.setItem("cognitoUserPoolId", event.userPoolId);
    Cache.setItem("cognitoDomain", event.domain);
    Cache.setItem("cognitoUserPoolAppClientId", event.appClientId);
    Cache.setItem("appUrl", event.appUrl);
    Cache.setItem("apiUrl", event.apiGatewayUrl);
};