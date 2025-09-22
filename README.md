<<<<<<< HEAD

-----------------------------------------------
Running local WinkTouch against Azure DEV (web)
-----------------------------------------------

Connect to paloalto via Global Protect VPN
- You'll need Wissam's help getting credentials here
- Steps here for how to install Global Protect
  https://docs.google.com/document/d/1ErgCUANg73FfAe0EBmGkOEKm-lS7no3E/edit?usp=sharing&ouid=116255159056295542380&rtpof=true&sd=true

All connection URLs should be in the WinkTouch/envs folder. When running locally,
it should be picking up what you have in dev.json . It then writes those configs into
the main env.json file when it runs. Do not update env.json, it'll just overwrite your changes
when it runs anyway. Your dev.json should look like this:

    "REACT_APP_DEFAULT_HOST": "afd.dev.downloadwink.com",
    "REACT_APP_ECOMM_URI": "https://afd.dev.downloadwink.com/wink-ecomm",
    "REACT_APP_WEB_URI": "https://afd.dev.downloadwink.com/EHR-412/",
    "REACT_APP_RESTFUL_URI": "https://afd.dev.downloadwink.com/WinkRESTv6.00.12.03/",
    "REACT_APP_BUNDLEKEY": "fkne1zQ09K6MDAY6ccDzXzSkb4-fmp0WAMuBG",
    "REACT_APP_HOST": "localhost:8081"

If running for iPad, in package.json/package-lock.json files, remove following line: <br/>
"react-native-view-shot-with-web-support": "^3.1.2"

DO NOT COMMIT THIS. Package must be there for web, and cannot be there for iPad.

<b>TODO: When designing CICD for iPad, need way to remove package before CocoaPod install command.</b>

In the terminal to start up the local web, type: npm run web

That's it! Your web solution is running.

-----------------------------------------------
Running local WinkTouch against local WinkPMS
-----------------------------------------------

Swap the WEB_URI config above for this one: "REACT_APP_WEB_URI": "http://localhost:8080/EHR-412/"

In your backend project, edit your Tomcat configuration like below:

In the 'Server' tab,
- URL: http://localhost:8080/EHR-412/
- HTTP PORT: 8080
- jmx PORT: 1099

In the 'Deployment tab', make sure to include WinkPMS:war exploded with an application context of '/EHR-412'

Make sure to have the most up-to-date env.properties file in your PointOfView folder
and configure WinkPMS to the localhost url.

-----------------------------------------------
Running local WinkTouch against local WinkPMS AND WinkRESTfull
-----------------------------------------------

Swap the RESTFUL_URI config above for this one: "REACT_APP_RESTFUL_URI": "http://localhost:8082/WinkRESTv6.00.12.03/"

In your backend project, edit your Tomcat configuration like below:

In the 'Server' tab, 
- URL: http://localhost:8082/WinkRESTv6.00.12.03/
- HTTP PORT: 8082
- jmx PORT: 1098

In the 'Deployment' tab, make sure to include WinkRESTful:war exploded with an application context of '/WinkRESTv6.00.12.03'

Make sure to have the most up-to-date env.properties file in your PointOfView folder
and configure WinkRESTfull to the localhost url.

-----------------------------------------------

*Note* - If this is your first time running against Azure instead of AWS, dump your local storage.
There are some keys stored there that need to be cleared out in order to continue.
To view: type localStorage in browser dev tool console
To remove items: localStorage.removeItem("[key goes here]")

To login to portal:
- long click on the email address shown under "WINKemr login" if not already at first login screen.
- use one of our dev test logins such as: sam@downloadwink.com

-----------------------------------------------
CICD for WinkTouch
-----------------------------------------------
In GitHub Actions, there is a workflow setup via the dev.yml file in project. 
The workflow uses the "Environments" feature of GitHub to set up the relevant
storage account and azure connection.

This workflow will run the build and tests in project via 
npm run build:dev and npm test .

It will be triggered any time a PR is brought into the 'main' branch for now.
Team is still working through release/branching processes.
=======
# WINKTOUCH
Test the Code from my personal
>>>>>>> 82f3d0eb70e81eb33d06a8b368cec927674e8974
