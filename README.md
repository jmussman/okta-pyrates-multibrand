[//]: # (README.md)
[//]: # (Copyright © 2024 Joel A Mussman. All rights reserved.)
[//]: #

![Banner Light](./.assets/banner-okta-pyrates-multibrand-light.png#gh-light-mode-only)
![banner Dark](./.assets/banner-okta-pyrates-multibrand-dark.png#gh-dark-mode-only)

# Okta-Pyrates-Multibrand

## Overview

This question has come up several times over the last couple of years: how may I rebrand my login page to
match the calling application, but still keep SSO across all of the applications?

The problem you hit is the session cookie; if are multiple custom domain names the session cookie is tied to the single domain name used for authorization
and SSO will not work across the other domains because the IdP session cookie does not cross these domains.
It is easy to point multiple domain names to a single brand, but not so easy to have SSO across multiple applications with different brands.

The solution is to have muliple applications use the same authorization server URL, but identify themselvs so
the authorization server can change the branding for each.
There are two parts to this: you have to do a little setup in the application for it to identify itself,
and a bit more serious programming in the custom login page in the Okta tenant.
This example is based on the [Okta-Pyrates-SPA](https://github.com/jmussman/okta-pyrates-spa) application, but stripped down further
to focus on the the branding aspect.

This is one of a series of Okta examples that may be used as a foundation for building
what you need.
Search GitHub for *jmussman/okta* and *jumussman/auth0* to find other examples in the series.

## Implementation

The trick is to pass an additional piece of information from the application to the Okta authorization server.
In this example the extra attribute is labeled "target".
When the user lands on the login page, the URL for the authorization server is present along with all the querystring values.
Of course the domain for the authorization server must be the same for all the applications, so it should be generic.
In this example, the authorization server is at the custom domain https://pid.pyrates.live.

Note: there is an alternative here, use the application clientID which is in each request instead of an extra querystring attribute.
While it eliminates the extra attribute it is not as clear to follow because the clientId is not as identifiable in the code, and there
must be multiple applications for each brand (this example is a single application that invokes different brands).

If you look at src/assets/script/main.js two additional menu items have been added under "Sign On":
"Black Dogg" and "Green Dragon".
These links will invoke alternate branding for the login page.
This is accomplished by adding the "target" querystring attribute to the link callback functions on lines 114 and 119 using
the "extraParams" attribute in the options object:

```
const authenticationHandler = async () => {

    await authClient.signInWithRedirect();
};

const blackdoggHandler = async () => {

    await authClient.signInWithRedirect({ extraParams: { target: 'blackdogg' }})
}

const greendragonHandler = async () => {

    await authClient.signInWithRedirect({ extraParams: { target: 'greendragon' }})
}
```

Since access to the HTML document for the login page is available, script may be added to the page that looks at the
querystring attribute and then decides what to do.
There are four items that need to be changed for the branding: the favicon, the page background, the logo, and the widget title.

Okta now sets an load policy on the page to forbid loading images from other sources.
Most browsers will still ignore this, but it could cause problems.
Unfortunately, Okta has not added a facility to manage a local CDN for custom login pages,
so the images are embedded as base64 here in the HTML page to avoid any load errors.
Yucky.
These embedded images were sourced from the src/assets/images folder in this project.
The variables are referenced in the selection of the branding below:

```
const pyrateBackground = 'data:image/jpeg;base64,/9j/4QBFRXhpZgAATU0AK...
const pyrateIcon = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAF...
const pyrateLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYA...
```

The customization has been placed at the top of the existing script block before the sign-in widget is created.
The favicon link is retrieved or created, the attribute from the querystring is loaded, and the div with the page background is located.
If the target attribute is null or undefined that is OK, it will hit the default case in the switch statement.
The switch statement sets the favicon and the div background, and then sets up the logo and the title to pass in the options during
sign-in widget rendering:

```
// Retrieve or establish the favicon element.

    var favicon = document.querySelector("link[rel~='icon']");

    if (!favicon) {

        favicon = document.createElement('link');
        favicon.rel = 'icon';
    }

    document.head.appendChild(favicon);

    // Retrieve the target element from the query string.

    let params = new URLSearchParams(document.location.search);
    let target = params.get('target');

    // Retrieve the div with the backround, and set up the logo and title for creating the sign-in widget.

    const loginBgImage = document.getElementById('login-bg-image-id');
    let logo;
    let title;
    
    switch (target) {

        case 'blackdogg':
            favicon.href = blackDoggIcon;
            loginBgImage.style.backgroundImage = `url('${blackDoggBackground}')`;
            logo = blackDoggLogo;
            title = 'Sign in to Black Dogg'
            break;

        case 'greendragon':
            favicon.href = greenDragonIcon;
            loginBgImage.style.backgroundImage = `url('${greenDragonBackground}')`;
            logo = greenDragonLogo;
            title = 'Sign in to Green Dragon'
            break;

        default:
            favicon.href = pyrateIcon;
            loginBgImage.style.backgroundImage = `url('${pyrateBackground}')`;
            logo = pyrateLogo;
            title = 'Pyrates Sign In'
            break;
    }

    //
    // This is the start of the original widget configuration. Note the addition of the logo and
    // i18n attributes in the options for rendering. i18n is used because it is the only way to
    // get to the title.
    //

    // "config" object contains default widget configuration
    // with any custom overrides defined in your admin settings.
    var config = OktaUtil.getSignInWidgetConfig();

    // Render the Okta Sign-In Widget
    var oktaSignIn = new OktaSignIn(config);
    oktaSignIn.renderEl({ el: '#okta-login-container', logo: logo, i18n: { 'en': { 'primaryauth.title': title }}},
    ...
```

## Configuration

This project is configured out of the box to work against the IdP at https://pid.pyrates.live (an Okta OIE tenant).
Because of the requirement for CORS on the Okta side, the demonstration tenant has been configured to allow http://localhost:3000.

If you want to run this against your own tenant you can change any of those settings.

Requirements: Node.js 18+.

### Run on your own computer

1. Clone this project to your local computer.
1. Run *npm install*.
1. In a terminal window launch the program with *npm run dev*.
1. Use the "Sign On", "Black Dogg", and "Green Dragon" authn links, see they have different branding.
1. If you want to test a sign-in, the users "calicojack@pyrates.live" and "blackbeard@pyrates.live" have the password "P!rates17".

### Use your own Okta stenant

1. Create a new single-page application integration in your Auth0 tenant, name it whatever you would like.
1. Set the callback and logout URIs, the default is http://localhost:3000.
1. Enable CORS for http://localhost:3000.
1. Configure a custom domain for the tenant (you cannot edit the sign-in page unless there is a custom domain).
1. Edit the sign-in page.
1. Select everything, delete it, and paste in the contents of Okta/sign-in-page.html.
1. Save the page and publish.
1. Edit the .env file and change the issuer to your custom domain, and the clientId to the applcation integration you created.
1. Run the application as above and check the results.

## License

The code is licensed under the MIT license. You may use and modify all or part of it as you choose, as long as attribution to the source is provided per the license. See the details in the [license file](./LICENSE.md) or at the [Open Source Initiative](https://opensource.org/licenses/MIT).


<hr>
Copyright © 2024 Joel A Mussman. All rights reserved.