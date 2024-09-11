// ---- Importing the required modules and framework ---
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const bodyParser = require('body-parser'); // For parsing form data
const app = express();

// -- Assigning the port on which the webapp will run on --
const PORT = 3000;

// --- JSONs variables declartions to be used by the Javascript API endpoints below ---
let organizations;
let accounts;

/* --- Establishes connection to SQLite database ---
    In this process the database will be created if it doesn't exist and the outcome is logged.
*/
const db = new sqlite3.Database('./database.sqlite3', (err) => {
  if (err) {
    console.error('Error connecting to the database', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

/* ------ Initialization and setting up of tables in the database ------
    1) Checks for existence of tables and creates the tables if it doesn't exist and populates it with the data from the source.
    2) If the table exists, then it is re-populated with the latest data from the source, everytime the app is run. 
*/
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS organization (
        createdDate TEXT,
        updatedDate TEXT,
        deletedAt TEXT,
        id TEXT PRIMARY KEY,
        orgName VARCHAR(255),
        shopifyStoreId INTEGER,
        myShopifyDomain VARCHAR(255),
        numBillingRetries INTEGER,
        numFailedCyclesBeforeCancel INTEGER,
        delayBetweenRetries INTEGER,
        logo BLOB,
        billingTime TIME,
        billingTimezone TEXT,
        initialSubscriptionImportComplete BOOLEAN,
        monthly_fee INTEGER,
        per_transaction_fee INTEGER,
        per_transaction_percentage_fee INTEGER,
        billing_start_date TEXT,
        account JSON,
        alloyUserId TEXT,
        activeWorkflows JSON,
        setup JSON,
        outOfStockBehavior TEXT,
        cancellationMessage TEXT,
        hasVisitedRetention BOOLEAN,
        rewardsPointMeaningId TEXT,
        hasOTPEnabled BOOLEAN,
        instagramUserData JSON,
        lookerDashboardPrefix TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS account (
        createdDate TEXT,
        updatedDate TEXT,
        deletedAt TEXT,
        id TEXT PRIMARY KEY,
        shopifyId TEXT,
        uniqueShopifyId TEXT,
        receivedFromShopifyDate TEXT,
        shopifyUpdateDate TEXT,
        planName TEXT,
        status TEXT,
        approvedAt TEXT,
        trialDays INTEGER,
        usageLineItemShopifyId TEXT,
        planFee INTEGER,
        transactionFee INTEGER,
        percentageFee INTEGER,
        organizationId TEXT,
        features JSON,
        confirmationUrl TEXT,
        trialPeriodStart TEXT,
        trialPeriodEnd TEXT,
        reportUsageAt TEXT
        )
    `);


    // -- Populating organizations table with up-to-date data from the source
    db.get('SELECT COUNT(*) as count FROM organization', (err, row) => {
        if(row.count>0) {
            // Deleting "old" data from the table, to prepare it for population.
            db.run('DELETE FROM organization',(err)=>{
                if(err){
                    console.error(err.message);
                    return;
                }
            });
        }
        // -- function called to fetch data from source and populate the organizations table afresh.
        fetchOrganization();
    });

    // -- Populating account table with up-to-date data from the source
    db.get('SELECT COUNT(*) as count FROM account', (err, row) => {
        if(row.count>0) {
            // Deleting "old" data from the table, to prepare it for population.
            db.run('DELETE FROM account',(err)=>{
                if(err){
                    console.error(err.message);
                    return;
                }
            });
        }
        // -- function called to fetch data from source and populate the account table afresh.
        fetchAccount();
    });
});

/* ---- Helper function to convert nested array to JSON format----
    This function recieves a nested array as a parameter for conversion to JSON format.
    Parameter: a nested array where arr[0] is an array of "Keys" for the JSON, following items in arr are arrays of "values". 
    Returns: a JSON object.
*/
function arrayToJson(data){
    const headers = data[0];
    const jsonData = data.slice(1).map(row=>{
        let pairs = {};
        headers.forEach((header, index) =>{
            pairs[header] = row[index];
        });
        return pairs;
    });
    return jsonData;
}

// ---- Function to fetch organizations data from given google spreadsheet using google script webapp -----
async function fetchOrganization() {
    const OrganizationUrl = 'https://script.google.com/macros/s/AKfycbznKRzB_I-SplYy6RAs0fiwvgsHl6SSI2LlhlpPYd_kmF2U9QXqpCeI1HfrZgyoA8Zumw/exec?type=organization';
    
    try{
        const response = await fetch(OrganizationUrl);
        const data = await response.json();

        organizations=arrayToJson(data); // initializing the organizations JSON variable declared above.

        data.shift() // Removing the first row; All column names

        // Iterating through fetch-response and inserting each row into the organization table.
        data.forEach((row)=>{
            const [ createdDate, updatedDate, deletedAt, id, orgName, shopifyStoreId, myShopifyDomain, numBillingRetries, numFailedCyclesBeforeCancel, delayBetweenRetries, logo, billingTime, billingTimezone, initialSubscriptionImportComplete, monthly_fee, per_transaction_fee, per_transaction_percentage_fee, billing_start_date, account, alloyUserId, activeWorkflows, setup, outOfStockBehavior, cancellationMessage, hasVisitedRetention, rewardsPointMeaningId, hasOTPEnabled, instagramUserData, lookerDashboardPrefix]=row;
            db.run('INSERT INTO organization (createdDate, updatedDate, deletedAt, id, orgName, shopifyStoreId, myShopifyDomain, numBillingRetries, numFailedCyclesBeforeCancel, delayBetweenRetries, logo, billingTime, billingTimezone, initialSubscriptionImportComplete, monthly_fee, per_transaction_fee, per_transaction_percentage_fee, billing_start_date, account, alloyUserId, activeWorkflows, setup, outOfStockBehavior, cancellationMessage, hasVisitedRetention, rewardsPointMeaningId, hasOTPEnabled, instagramUserData, lookerDashboardPrefix) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ createdDate, updatedDate, deletedAt, id, orgName, shopifyStoreId, myShopifyDomain, numBillingRetries, numFailedCyclesBeforeCancel, delayBetweenRetries, logo, billingTime, billingTimezone, initialSubscriptionImportComplete, monthly_fee, per_transaction_fee, per_transaction_percentage_fee, billing_start_date, account, alloyUserId, activeWorkflows, setup, outOfStockBehavior, cancellationMessage, hasVisitedRetention, rewardsPointMeaningId, hasOTPEnabled, instagramUserData, lookerDashboardPrefix],function(err){
                if(err){
                    console.error("Organization - Error Inserting Data - ",err.message);
                }
            });
        });
        console.log("Organization Data Loaded");
    }catch (err){
        console.error("Error fetching organization data from Google App Script - ",err);
    }
}

// ---- Function to fetch accounts data from given google spreadsheet using google script webapp -----
async function fetchAccount() {
    const AccountUrl = 'https://script.google.com/macros/s/AKfycbznKRzB_I-SplYy6RAs0fiwvgsHl6SSI2LlhlpPYd_kmF2U9QXqpCeI1HfrZgyoA8Zumw/exec?type=account';
    
    try{
        const response = await fetch(AccountUrl);
        const data = await response.json();

        accounts = arrayToJson(data); // initializing the accounts JSON variable declared above.
        
        data.shift() // Removing the first row; All column names

        // Iterating through fetch-response and inserting each row into the account table.
        data.forEach((row)=>{
            const [ createdDate ,updatedDate ,deletedAt ,id ,shopifyId ,uniqueShopifyId ,receivedFromShopifyDate ,shopifyUpdateDate ,planName ,status ,approvedAt ,trialDays ,usageLineItemShopifyId ,planFee ,transactionFee ,percentageFee ,organizationId ,features ,confirmationUrl ,trialPeriodStart ,trialPeriodEnd ,reportUsageAt]=row;
            db.run('INSERT INTO account ( createdDate ,updatedDate ,deletedAt ,id ,shopifyId ,uniqueShopifyId ,receivedFromShopifyDate ,shopifyUpdateDate ,planName ,status ,approvedAt ,trialDays ,usageLineItemShopifyId ,planFee ,transactionFee ,percentageFee ,organizationId ,features ,confirmationUrl ,trialPeriodStart ,trialPeriodEnd ,reportUsageAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [  createdDate ,updatedDate ,deletedAt ,id ,shopifyId ,uniqueShopifyId ,receivedFromShopifyDate ,shopifyUpdateDate ,planName ,status ,approvedAt ,trialDays ,usageLineItemShopifyId ,planFee ,transactionFee ,percentageFee ,organizationId ,features ,confirmationUrl ,trialPeriodStart ,trialPeriodEnd ,reportUsageAt ],function(err){
                if(err){
                    console.error("Account - Error Inserting Data - ",err.message);
                }
            });
        });
        console.log("Accounts Data Loaded");
    }catch (err){
        console.error("Error fetching account data from Google App Script - ",err);
    }
}

/* --- Helper function to format ISO 8601 to DD/MM/YYYY ----
    Parameter : date in ISO 8601 formate
    Return : data in DD/MM/YYYY
    Example parameter expected for isoDate = 2023-01-20T04:07:20.185Z 
*/
function formatDate(isoDate){ 
    const date = new Date(isoDate);
    
    // Extract day, month, and year
    const day = String(date.getUTCDate()).padStart(2, '0'); // Ensures two digits
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getUTCFullYear();

    // Format the date as DD/MM/YYYY
    return `${day}/${month}/${year}`;
}

/* --- Helper function to convert JSON keys to upper case ----
    Parameter : jsonObject 
    Return : jsonObject with keys formatted in upper case
*/
function toUpper(jsonObject){
    const jsonUppercaseKeys = Object.keys(jsonObject).reduce((result, key) => {
        result[key.toUpperCase()] = jsonObject[key];
        return result;
      }, {});
    return jsonUppercaseKeys;
}

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// ---- NOTE: The strings that start with '/api/' used in used in SECTION 1 and 2, are referred to as endpoints.

// ---------------------------- SECTION 1 - Javascript Questions API ENDPOINTS -----------------------------

/* ----------------------------- Questions 1 and 4 - javascript ------------------------------
    Q1 - Takes the value of a `myShopifyDomain` field as an input and returns their `optimization` settings.
    Q4 - Takes the value of an `orgName` and returns the organization record in JSON format.

    Since both questions 1 and 4 need to generate a report based on inputs, one endpoint is used as the base and additional 
    key-values are added on to the endpoint argument as per the requirement.

    How it is used:
        - for Q1, the endpoint that will be called from the front-end: /api/js/orgs?domain=insert_organization_domain
        - for Q4, the endpoint that will be called from the front-end: /api/js/orgs?orgName=insert_organization_name

*/
app.get('/api/js/orgs',(req,res)=>{
    const domain = req.query.domain;
    const orgName = req.query.orgName;

    const orgsArray = Object.values(organizations); // generates an array of all the values in the organizations JSON, for ease in searching
    
    if(domain){ 
        // for Q1 
        const result = orgsArray.find(org=> org.myShopifyDomain === domain);
        const setup = JSON.parse(result.setup);
        res.json({ data: [toUpper(setup.optimization)] });
    }else if (orgName) { 
        // for Q4 
        const result = orgsArray.find(org=> org.orgName === orgName);
        res.json({"Organization Details": result });
    }else{
        res.status(500).json({ error: "Please specify the organization name or organization domain as per the usage and requirement." });
    }
});

/* ------------------ Question 2 - javascript -----------------
    Q2 - Loops through all organizations and shows the date they were created (DD/MM/YYYY), their `status`, and `planName` 
    sorted by oldest to newest.

    In addition to the date created on (DD/MM/YYYY), their `status`, and `planName`, the organization name will also be displayed.
*/
app.get('/api/js/oldToNew', (req, res) => {
    const accsArray = Object.values(accounts); // generates an array of all the values in the accounts JSON, for ease in searching
    let result=[];

    // Iterating through organizations and searching for an account in accounts ARRAY based on the organization's ID.
    organizations.forEach(org=>{
        const acc_found = accsArray.find(acc => acc.organizationId === org.id);
        // Initializing row object of columns that need to be displayed.
        let obj = {
            "ORG NAME" : org.orgName,
            "CREATED DATE": org.createdDate,
            "STATUS" : "NULL",
            "PLAN NAME" : "NULL"
        };

        // Updating row object items based on if an account was found for the organization.
        if(acc_found){  
            obj["STATUS"] = acc_found.status;
            obj["PLAN NAME"] = acc_found.planName;
        }

        result.push(obj);
    });

    result.sort((a, b) => new Date(a["CREATED DATE"]) - new Date(b["CREATED DATE"])); // sorting based on ISO date

    // Formatting ISO date to DD/MM/YYYY for ease in legibility. 
    result.forEach(obj =>{
        obj["CREATED DATE"] = formatDate(obj["CREATED DATE"]);
    })
      
    res.json({ data : result});
});

/* ----------------------- Question 3 - javascript -----------------------
    Q3 - Returns the list of organizations whose status is cancelled.

*/
app.get('/api/js/cancelledOrgs', (req, res) => {
    const accsArray = Object.values(accounts);
    
    let result=[];
    organizations.forEach(org=>{
        const acc_found = accsArray.find(acc => acc.organizationId === org.id && acc.status === "CANCELLED");
        if(acc_found){
            result.push({"ORGANIZATION NAME":org.orgName});
        }
    });

    // Returning list of organizations duly converted to JSON in order to display.
    res.json({ data : result});

});

// ---------------------------- SECTION 2 - SQL API ENDPOINTS -----------------------------

/* ------------Question 1 - sql -----------------
    Q1 - How many organizations do not have account plans? 
*/
app.get('/api/sql/no_account_plans', (req, res) => {
    db.get('SELECT COUNT(org.orgName) AS count FROM organization org LEFT JOIN account acc ON acc.organizationId = org.id WHERE acc.organizationId IS NULL', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ data: [{"ORGANIZATIONS WITHOUT ANY ACCOUNT PLANS" : row.count}]});
        }
    });
    
});

/* ------------Question 2 - sql -----------------
    Q2 - How many organizations have more than one account plan?
*/
app.get('/api/sql/mult_account_plans', (req, res) => {
    db.get('SELECT COUNT(org.orgName) as count FROM organization org INNER JOIN (SELECT organizationId FROM account GROUP BY organizationId HAVING COUNT(organizationId)>1) acc ON org.id = acc.organizationId', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ data: [{"ORGANIZATIONS WITH MORE THAN ONE ACCOUNT PLANS" : row.count}]});
        }
    });
    
});

/* ------------Question 3 - sql -----------------
    Q3 - List all organizations that have only one account plan.
*/
app.get('/api/sql/one_account_plan', (req, res) => {
    db.all('SELECT org.orgName AS "ORGANIZATIONS WITH ONLY ONE ACCOUNT PLAN" FROM organization org INNER JOIN (SELECT organizationId FROM account GROUP BY organizationId HAVING COUNT(organizationId)=1) acc ON org.id = acc.organizationId', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ data: rows});
        }
    });
    
});

/* ------------Question 4 - sql -----------------
    Q4 - List all organizations that have the PASSWORDLESS feature set to true.
*/
app.get('/api/sql/passwordless', (req, res) => {
    db.all(`SELECT org.orgName AS "PASSWORDLESS ORGANIZATIONS" FROM organization org INNER JOIN account acc ON org.id = acc.organizationId WHERE json_extract(acc.features,'$.PASSWORDLESS') = 1`, (err, rows) => {
            if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ data: rows});
        }
    });
    
});

// Fallback to serve index.html for non-API routes (SPA-style routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
