function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("No active tab found.");
      return;
    }
    callback(tabs[0].id);
  });
}

// extract script for elements 
function extractInputFormElements() {
  const newDiv = document.createElement("div");
  newDiv.textContent = "message";
  newDiv.style.backgroundColor = "transparent";
  newDiv.style.position = "fixed";
  newDiv.style.width = "100%";
  newDiv.style.zIndex = "99";
  newDiv.style.bottom = "10%";

  document.getElementById('notification').appendChild(newDiv);
  newDiv.timeOut = setTimeout(() => {
    newDiv.remove();
  }, 3000);
  const inputs = Array.from(document.querySelectorAll("input")).filter(
    (input) =>
      input.id && ["text", "email", "password", "number", "date", "tel"].includes(input.type)
  );

  const inputIds = new Set(inputs.map((input) => input.id)); // Faster lookup

  const labels = Array.from(document.querySelectorAll("label"))
    .filter((label) => label.htmlFor && inputIds.has(label.htmlFor))
    .reduce((acc, label) => {
      acc[label.htmlFor] = label.innerText.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      return acc;
    }, {}); // Store labels in an object for fast lookup

  return inputs.map((input) => ({
    id: input.id,
    question: (labels[input.id] || input.id) + "?",
  }));
}

function extractSelectFormElements() {
 const selects = Array.from(document.querySelectorAll("select")).filter( select => select.id);
 const selectIds = new Set(selects.map(select => select.id));
 const labels = Array.from(document.querySelectorAll("label")).filter(label => label.htmlFor && selectIds.has(label.htmlFor)).reduce((acc, label) => {
   acc[label.htmlFor] = label.innerText.replace(/[^a-zA-Z0-9 ]/g, "").trim();
   return acc;
 }, {});

 return selects.map(select => { 
   return {
     id: select.id,
     question: (labels[select.id] || select.id) + "?",
     options: Array.from(select.options).map(option => ({inner_text:option.textContent, value : option.value}))
   }
 });
}
// excute form filler script

function fillInputForm(results) {
  if (results && results.length > 0 && results[0].result) {
    // Send the input IDs to the backend
    fetch("http://localhost:3000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: results[0].result }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Parsed response:", data.parsedResponse);
        // Execute a script on the active tab to populate the form
        chrome.tabs.query(
          { active: true, currentWindow: true },                
          (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (data) => {
                  console.log("Data:", data);
                  for (const key in data) {

                    if (data[key] && data[key].length > 0) {
                      const element = document.getElementById(key);
                      if (["text", "email", "password", "tel"].includes(element.type))
                        element.value = data[key];
                      else if (element.type == "number")
                        element.value = parseInt(data[key]) || 0;
                      else if (element.type == "date")
                        element.value = data[key];
                    } else {
                      console.log(`No ${key} found`);
                    }
                  }
                },
                args: [data.parsedResponse], // Pass the parsed response data
              })
              .then(() => {
                document.querySelector("h3").innerHTML = "Working...";
              })
              .catch((err) => {
                document.querySelector("h3").innerHTML =
                  "Failed to execute script !";
              });
          }
        );
      })
      .catch((error) => {
        document.querySelector("h3").innerHTML = "Server Error Resolving ...";
      });
  } else {
    document.querySelector("h3").innerHTML = "Failed to execute script !";
  }
}

function fillSelectForm(results) {
  if (results && results.length > 0 && results[0].result) {
    // Send the input IDs to the backend
    fetch("http://localhost:3000/select", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: results[0].result }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Parsed response:", data.parsedResponse);
        // Execute a script on the active tab to populate the form
        chrome.tabs.query(
          { active: true, currentWindow: true },
          (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (data) => {
                  console.log("Data:", data);
                  for (const key in data) {

                    if (data[key] && data[key].length > 0) {
                      const element = document.getElementById(key);
                      element.value = data[key];
                    }
                  }
                },
                args: [data.parsedResponse], // Pass the parsed response data
              })
              .then(() => {
                document.querySelector("h3").innerHTML = "working... ";
              })
              .catch((err) => {
                document.querySelector("h3").innerHTML =
                  "Failed to execute script !";
              });
          }
        );
      })
      .catch((error) => {
        document.querySelector("h3").innerHTML = "Failed to execute script !";
      });
  } else {
    document.querySelector("h3").innerHTML = "Failed to execute script !";
  }
}
// executeScriptOnSelect
function executeScriptOnInput(tabId, extractInputFormElements, fillInputForm) {
    chrome.scripting
    .executeScript({
      target: { tabId },
      func: extractInputFormElements,
    })
    .then( results => fillInputForm(results))
    .catch((err) => console.log("Error", err));
}

function executeScriptOnSelect(tabId, extractSelectFormElements, fillSelectForm) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: extractSelectFormElements,
    })
    .then( results => fillSelectForm(results))
    .catch((err) => console.log("Error", err));
}

function executeScriptOnTab(tabId) {
      chrome.scripting.executeScript(
      {
        target:{tabId},
        func: () => {
          if(!document.getElementById('notification')){
          const newDiv = document.createElement("div");

          newDiv.id = "notification";
          newDiv.style.backgroundColor = "transparent";
          newDiv.style.position = "fixed";
          newDiv.style.width = "100%";
          newDiv.style.zIndex = "99";
          newDiv.style.bottom = "10%";
          document.body.appendChild(newDiv);
          }else{
            console.log('exist already')
          }
        }
      }
      ).then(() => {
        executeScriptOnInput(tabId, extractInputFormElements, fillInputForm);
        executeScriptOnSelect(tabId, extractSelectFormElements, fillSelectForm);
      }).catch(error => console.log(error));
}

// Main Execution Flow
document.addEventListener("DOMContentLoaded", () => getActiveTab((tabId) => {
  executeScriptOnTab(tabId);
}));
