# **How to set up Google Workspace as a SAML identity provider with an Amazon Cognito user pool**

**Use these instructions to configure Google Workspace as a Security Assertion Markup Language 2.0 (SAML 2.0) identity provider (IdP) with an** [**Amazon Cognito user pool.**](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)

Amazon Cognito user pools allow sign-in through third party IdPs such as Google Workspace. For more information, see [Adding user pool sign-in through a third party](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation.html) and [adding SAML identity providers to a user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-saml-idp.html).

To set up Google Workspace as SAML IdP, you need an Amazon Cognito user pool and a Google Workspace account with an application.

## **Create an Amazon Cognito user pool**

For more information and instructions, see these articles:

- [Tutorial: creating a user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-user-pool.html)
- [Setting up the hosted UI with the Amazon Cognito Console](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html#cognito-user-pools-create-an-app-integration)
- [Adding a domain name for your user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-domain.html)

**Note:** When creating a user pool, the standard attribute **email** is selected by default. For more information about user pool attributes, see [Configuring user pool attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html).

## **Create a Google Workspace account**

For more information, see the [Google Workspace website,](https://workspace.google.com/) and create a account.
**Create Users and Groups in Google Workspace**
1) Create users in your Google Workspace account.
2) Follow the instrunction to create groups pet-app-admin and pet-app-user and assign users to these groups.
https://apps.google.com/supportwidget/articlehome?hl=en&article_url=https%3A%2F%2Fsu[…]roduct_context=9400082&product_name=UnuFlow&trigger_context=a

**Create a Google Workspace application**

1. Once you created users and assign them to groups, choose **Web and mobile app** under **Apps** on the left side of the page, and click the **Add custom SAML app** under **Add app**.

![alternative text](images/Picture1.png "Image Title")

2. Enter the App name and description and click continue.

3. Download IdP metadata as you will need it to configure Amazon Cognito and click Continue.

![alternative text](images/Picture2.png "Image Title")

4. Next you will have to enter the ACS URL and Entity ID that you can get from Cognito User pool setup and click Continue.
     **ACS (Consumer) URL** is correct ```https://<yourDomainPrefix>.auth.region.amazoncognito.com/saml2/idpresponse```

     **Entity ID** is correct ```urn:amazon:cognito:sp:\<yourUserPoolId\>```
5. Select EMAIL from the drop down menu for **Name ID Format**

6. Select Primary email from the drop down menu for **Name ID** and click Save
![alternative text](images/Picture3.png "Image Title")

7. Click Finish to complete.

![alternative text](images/Picture4.png "Image Title")
