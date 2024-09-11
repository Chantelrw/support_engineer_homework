// --- consts for ids that will be generated in `make_card` ----
const userform = "userform-";
const label = "name-";
const input = "input-";
const button = "submit-";
const output = "output-";
const outputT = "output-table-";
const jsonD = "json-display-";

const wraper = document.getElementById("wraper");

// --- Dictionary used for dynamically generating HTML elements based on Key-Value pairs ---
const apiDictionary = {
    // -- For Javascript questions:
    "JS Report 1": {"label":"Organization Domain", "api":"/api/js/orgs?domain="},
    "JS Report 2": {"api":"/api/js/oldToNew"},
    "JS Report 3": {"api":"/api/js/cancelledOrgs"},
    "JS Report 4": {"label":"Organization Name", "api":"/api/js/orgs?orgName="},
    // -- For SQL questions:
    "SQL Query 1" : "/api/sql/no_account_plans",
    "SQL Query 2" : "/api/sql/mult_account_plans",
    "SQL Query 3" : "/api/sql/one_account_plan",
    "SQL Query 4" : "/api/sql/passwordless"
};

// ---------- Function meant to dynamically add an HTML "card" ----------
function make_card(key, value) {
    wraper.innerHTML += `<div id="app-container" class="app-container"> 
                            <div class="input">
                                <form id="${userform + key}">
                                    <h2>${key}</h2>
                                    ${value.label ? `<label for = "${label+key}"> ${value.label} </label>` : ''}
                                    ${value.label ? `<input type = "text" id ="${input+key}" name = ${label + key} required><br><br>`:''}
                                    <button id = "${button+key}" class = "submit-button" type = "submit"> Submit/Generate ${key} </button>
                                </form>
                                ${key!="JS Report 4" ? ` <div id="${output+key}" class="table-container"></div>`:`<pre id = "${jsonD + key}" width = "app-container"></pre>`}
                            </div>
                        </div>`;
}

// ------- Function meant to setup the form that was dynamically added using `make_card` -----------
function setupForm(key, value){
    const form = document.getElementById(`${userform + key}`);
    if (form){
        form.addEventListener('submit',function(event) {
            event.preventDefault();
            let input_value;
            let fetchApi = value;
           
            if(value.api){
                fetchApi = value.api;
            }

            if(value.label){
                input_value = document.getElementById(`${input + key}`).value.trim();
                fetchApi +=  encodeURIComponent(input_value);
                console.log(fetchApi);
            }
        
            fetch(fetchApi)
                .then(response => response.json())
                .then(data => {
                    if (key==="JS Report 4"){
                        const jsonDisplay = document.getElementById(`${jsonD + key}`);
                        
                        // Convert the JSON object to a formatted string
                        const formattedJSON = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation
                        
                        // Display the formatted JSON inside the <pre> tag
                        jsonDisplay.textContent = "Displaying Organization Details in JSON\n"+formattedJSON;
                    }else{
                        const outputElement = document.getElementById(`${output+key}`);
                        outputElement.innerHTML += `<table id="${ outputT + key}"></table>`
                        const table = document.getElementById(`${ outputT + key}`);
                        
                        if (data.data.length > 0) {
                            let thead = '<tr class="output">';
                            let tbody = '';
                            
                            // Using the first object to create headers for the table.
                            for (let header in data.data[0]){
                                if(data.data[0].hasOwnProperty(header)){
                                    thead += `<th>${header}</th>`;
                                }
                            };
                            thead += '</tr>';

                            data.data.forEach(org => {
                                let row='<tr class="output">';
                                for (let orgKey in org){
                                    if(org.hasOwnProperty(orgKey)){
                                        row += `<td>${org[orgKey]}</td>`;
                                    }
                                }
                                row += '</tr>';
                                tbody += row;
                                
                            });
                            table.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
                        } else {
                            table.innerHTML = '<tr><td colspan="2">No data found.</td></tr>';
                        }
                    }
                })
                .catch(err => {
                    document.getElementById(`${output+key}`).innerText = 'Failed to load orgs data from the backend.';
                });
        
        })
    }
    
}

for (let key in apiDictionary){
    make_card(key,apiDictionary[key]);

    setTimeout(() => {
        setupForm(key,apiDictionary[key]);
    }, 0);  // Adding a small delay to ensure DOM update
}