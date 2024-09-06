// main.js
// Copyright © 2024 Joel A Mussman. All rights reserved.
//

import { OktaAuth } from '@okta/okta-auth-js';
import 'dotenv/config';

// Wait for the page load, then set everything up.

window.addEventListener('load', async () => {

    // Establish the authentication client.

    const oktaAuthClientOptions = {
        issuer: process.env.ISSUER, 
        clientId: process.env.CLIENTID,
        responseType: 'code',
        scopes: [ 'openid', 'email', 'profile' ]
    };

    const authClient = new OktaAuth(oktaAuthClientOptions);

    // Attempt to process a callback from /authorize, if present.

    if (authClient.isLoginRedirect()) {

        try {
        
            await authClient.handleRedirect();
        }

        catch (e) {
            
            console.log(e);
        }
    }

    // The page content depends on authentication.

    const isAuthenticated = await authClient.isAuthenticated();

    if (isAuthenticated) {

        // Esablish the sign-out button.

        const authenticationLink = document.getElementById('authenticationLink');
        const blackdoggLink = document.getElementById('blackdoggLink');
        const greendragonLink = document.getElementById('greendragonLink');

        authenticationLink.innerHTML = 'Sign Out';
        authenticationLink.addEventListener('click', async () => {

            // The tokens should be marked for clear on page re-entry, but something funky is happening
            // in okta-auth-js:7.80 and they are still valid locally although revoked in the tenant. This
            // is evident because creating the authClient above on re-entry still has the tokens in the
            // tokenManager. Forcing a clear before redirect fixes this problem.

            await authClient.signOut({ clearTokensBeforeRedirect: true });
        });

        blackdoggLink.innerHTML = '';
        greendragonLink.innerHTML = '';

        // Get the tokens.

        try {

            // Get the  user information.

            const claims = authClient.token.decode(authClient.getIdToken()).payload;      // Raw claims (if possible).
            const userinfo = await authClient.getUser();

            // Put it all together and showt the results.

            const pageContents = document.getElementsByClassName('content');

            if (pageContents.length) {
                    
                pageContents[0].innerHTML = `
                    <h1>${claims.name ?? claims.email}</h1>

                    <h2>ID Token and Claims</h2>

                    <pre>${authClient.getIdToken()}</pre>
                    <pre>${JSON.stringify(claims, null, 4)}</pre>

                    <h2>Authentication API access token</h2>
                        
                    <pre>${authClient.getAccessToken()}</pre>

                    <h2>/userinfo from the Authentication Server</h2>

                    <pre>${JSON.stringify(userinfo, null, 4)}</pre>
                `;
            }
        }

        catch (e) {

            console.log(e);
        }

    } else {

        // Establish the sign-on and profile menu links.

        const authenticationHandler = async () => {

            await authClient.signInWithRedirect();
        };

        const blackdoggHandler = async () => {

            await authClient.signInWithRedirect({ extraParams: { target: 'blackdogg' }})
        }

        const greendragonHandler = async () => {

            await authClient.signInWithRedirect({ extraParams: { target: 'greendragon' }})
        }

        const authenticationLink = document.getElementById('authenticationLink');
        const blackdoggLink = document.getElementById('blackdoggLink');
        const greendragonLink = document.getElementById('greendragonLink');
        const profileLink = document.getElementById('profileLink');

        authenticationLink.innerHTML = 'Sign-On';
        authenticationLink.addEventListener('click', authenticationHandler);
        blackdoggLink.innerHTML = 'Black Dogg';
        blackdoggLink.addEventListener('click', blackdoggHandler);
        greendragonLink.innerHTML = 'Green Dragon';
        greendragonLink.addEventListener('click', greendragonHandler);
        profileLink.addEventListener('click', authenticationHandler);

        // The iconURL variable is simply to force Parcel to bundle the image so we can use it.

        const iconURL = new URL('../images/favicon.ico', import.meta.url);
        const pageContents = document.getElementsByClassName('content');

        if (pageContents.length) {
                
            pageContents[0].innerHTML = `           
                <h1>Welcome to the Pyrates of the Caribbean!</h1>
                <p class="welcome">
                    Here you can earn rewards for the treasure you report!
                    And, you can see how you stack up against the competition.
                </p>
                <p class="welcome">If you already have an account then come on board, you know how.
                    <img src="${iconURL}" /></p>
                <p class="welcome">If you want to join us, click on the Sign On link in the menu at the left,
                    and use the Sign up link on the login form to register a new account for our website.
                    Or, click the Sign On link and pick your favorite social media account to sign on and register in one step!</p>
            `;
        }
    }
});