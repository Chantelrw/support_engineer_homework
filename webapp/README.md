# Support Engineer Homework WebApp
---
#### *Author : Chantel Rose Walia*

Hi! Welcome to the Support Engineer Homework Webapp :)

This application is built using Javascript and SQL principles, deriving style inspiration from the actual Smartrr Website.

*Note: I opted to use a Google Script Webapp out of the available technologies in order to get the data from the given google spreadsheet, for the population of the local database, as I found it to be robust in its working and it does not require any credentials from the user for the operation of this application.*

## How To Run:
- **Please make sure you have Node.js and npm (Node Package Manager) installed on your machine.**
- Go into the `./support_engineer_homework/webapp` directory in your terminal.
- Run `npm install`. This will install the node dependencies from the package.json file, that the webapp uses.
- Run `node server.js`.
- Wait for messages "Organization Data Loaded" and "Accounts Data Loaded" displayed on console, and only thereafter proceed to the next step to use the webapp. 
- Open http://localhost:3000 in your browser or press ctrl and click on the link shown on your terminal to navigate to the webapp.

### Webapp Interface Brief:
- **Home**
    - Has 8 cards dynamically created and stacked vertically with buttons to generate the desired report or to view the output of the sql questions given in the challenge. It curbs the redundance of code while using minimal static HTML code.
    - There are 4 Reports and 4 SQL queries, 2 of the Reports are based on user input.
- **Real Website :)**
    - Link to go to the real Smartrr Website. (for funsies)
    
### Code:
- **server.js**
    - This is the back-end of the webapp.
    - The database connection and population is done here.
    - Contains all the API endpoints that the front-end uses.
    - Contents (Number of processes/functions):
        - 2 async fetch functions that use the Google Script Webapp to get data from the given google scpreadsheet.
        - 3 API endpoints using Javascript for the Report Generation.
        - 4 API endpoints for the SQL questions given in the challenge.
        - 3 Helper functions:
            - ArrayToJson : converts the array response in the async fetch functions to JSON for the js-based API endpoints.
            - FormatDate :  converts date from ISO 8601 to DD/MM/YYYY.
            - ToUpper : formats json keys to upper case.
- **./webapp/public**
    - Directory for the front-end of the webapp.
    - Contents:
        - index.html : HTML file for the UI.
        - script.js  : Dynamicallly adds HTML elements and the respective functionalities to the app-container in index.html.
        - styles.css : CSS file that describes the various style classes for the HTML elements used.