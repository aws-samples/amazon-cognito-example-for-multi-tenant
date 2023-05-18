import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import {HttpAPIService} from "./service/APIService";
import Amplify, {API, Auth} from 'aws-amplify';
import amplifyConfig from './config/amplifyConfig';

const REST_API_NAME = "main";
const TENANT_API_NAME = "tenantAPI";

(async () => {
try{
    const getConfigResponse = await fetch('./uiConfig.json');
    const autoGenConfig = await getConfigResponse.json();

    const amplifyConfig = {
      Auth: {

        // REQUIRED - Amazon Cognito Region
        region: autoGenConfig.region,
    
        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: autoGenConfig.cognitoUserPoolId,
    
        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: autoGenConfig.cognitoUserPoolAppClientId,
    
        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        // mandatorySignIn: false,
    
        oauth: {
    
          domain: autoGenConfig.cognitoDomain,
    
          scope: ['phone', 'email', 'openid', 'profile'],
    
          redirectSignIn: autoGenConfig.appUrl,
    
          redirectSignOut: autoGenConfig.appUrl,
    
          responseType: 'code', // or token
    
          // optional, for Cognito hosted ui specified options
          options: {
            // Indicates if the data collection is enabled to support Cognito advanced security features. By default, this flag is set to true.
            AdvancedSecurityDataCollectionFlag: true
          }
        }
      },
    
      API: {
        endpoints: [
          {
            name: REST_API_NAME,
            endpoint: autoGenConfig.apiUrl 
          },
          {
            name: TENANT_API_NAME ,
            endpoint: autoGenConfig.tenantApiUrl
          }
        ]
      }
    };

    Amplify.configure(amplifyConfig);
  } catch(error) {
    console.error(error);
  }})();

const apiService = new HttpAPIService(API, Auth);


ReactDOM.render(<App apiService={apiService} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
