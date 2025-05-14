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
  newDiv.classList.add("notification-message");

  newDiv.classList.add("info");
  newDiv.textContent = "Working on input fields...";
  document.getElementById("notification-box").appendChild(newDiv);
  newDiv.timeOut = setTimeout(() => {
    newDiv.remove();
  }, 4000);
  const inputs = Array.from(document.querySelectorAll("input")).filter(
    (input) =>
      input.id &&
      ["text", "email", "password", "number", "date", "tel"].includes(
        input.type
      )
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
  const newDiv = document.createElement("div");
  newDiv.classList.add("notification-message");

  newDiv.classList.add("info");
  newDiv.textContent = "Working on select fields...";
  document.getElementById("notification-box").appendChild(newDiv);
  newDiv.timeOut = setTimeout(() => {
    newDiv.remove();
  }, 4000);
  const selects = Array.from(document.querySelectorAll("select")).filter(
    (select) => select.id
  );
  const selectIds = new Set(selects.map((select) => select.id));
  const labels = Array.from(document.querySelectorAll("label"))
    .filter((label) => label.htmlFor && selectIds.has(label.htmlFor))
    .reduce((acc, label) => {
      acc[label.htmlFor] = label.innerText.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      return acc;
    }, {});

  return selects.map((select) => {
    return {
      id: select.id,
      question: (labels[select.id] || select.id) + "?",
      options: Array.from(select.options).map((option) => ({
        inner_text: option.textContent,
        value: option.value,
      })),
    };
  });
}
// excute form filler script

function fillInputForm(results) {
  if (results && results.length > 0 && results[0].result) {
    // Send the input IDs to the backend
    fetch("https://autoformfillerapi.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: results[0].result }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Execute a script on the active tab to populate the form
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting
            .executeScript({
              target: { tabId: tabs[0].id },
              func: (data) => {
                for (const key in data) {
                  if (data[key] && data[key].length > 0) {
                    const element = document.getElementById(key);
                    if (
                      ["text", "email", "password", "tel"].includes(
                        element.type
                      )
                    )
                      element.value = data[key];
                    else if (element.type == "number")
                      element.value = parseInt(data[key]) || 0;
                    else if (element.type == "date") element.value = data[key];
                  } 
                }

                const newDiv = document.createElement("div");
                newDiv.classList.add("notification-message");

                newDiv.classList.add("success");
                newDiv.textContent = "The input fields have been filled!";
                document.getElementById("notification-box").appendChild(newDiv);
                newDiv.timeOut = setTimeout(() => {
                  newDiv.remove();
                }, 4000);
              },
              args: [data.parsedResponse], // Pass the parsed response data
            })
            .catch((err) => document.getElementsByClassName('warning')[0].textContent = "Error !");
        });
      })
      .catch((error) => {
        document.getElementsByClassName('warning')[0].textContent = "Error !";
      });
  } else {
    document.getElementsByClassName('warning')[0].textContent = "Failed to execute script !";
  }
}

function fillSelectForm(results) {
  if (results && results.length > 0 && results[0].result) {
    // Send the input IDs to the backend
    fetch("https://autoformfillerapi.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: results[0].result }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Execute a script on the active tab to populate the form
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting
            .executeScript({
              target: { tabId: tabs[0].id },
              func: (data) => {
                for (const key in data) {
                  if (data[key] && data[key].length > 0) {
                    const element = document.getElementById(key);
                    element.value = data[key];
                  }
                }
                const newDiv = document.createElement("div");
                newDiv.classList.add("notification-message");

                newDiv.classList.add("success");
                newDiv.textContent = "The select fields have been filled!";
                document.getElementById("notification-box").appendChild(newDiv);
                newDiv.timeOut = setTimeout(() => {
                  newDiv.remove();
                }, 4000);
              },
              args: [data.parsedResponse], // Pass the parsed response data
            })
            .then(() => {
            })
            .catch((err) => {
              document.getElementsByClassName('warning')[0].textContent = "Error !"
            });
        });
        const newDiv = document.createElement("div");
        newDiv.classList.add("notification-message");

        newDiv.classList.add("Success");
        newDiv.textContent = "The select fields have been filled";
        document.getElementById("notification-box").appendChild(newDiv);
        newDiv.timeOut = setTimeout(() => {
          newDiv.remove();
        }, 4000);
      }).then(()=> {})
      .catch((error) => {
      });
  } else {
        document.getElementsByClassName('warning')[0].textContent = "Failed to execute script !"
  }
}
// executeScriptOnSelect
function executeScriptOnInput(tabId, extractInputFormElements, fillInputForm) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: extractInputFormElements,
    })
    .then((results) => fillInputForm(results))
    .catch((err) => document.getElementsByClassName('warning')[0].textContent = "Error !");
}

function executeScriptOnSelect(tabId,extractSelectFormElements,fillSelectForm) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: extractSelectFormElements,
    })
    .then((results) => fillSelectForm(results))
    .catch((err) => document.getElementsByClassName('warning')[0].textContent = "Error !");
}

function executeScriptOnTab(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => {
        if (!document.getElementById("notification-box")) {
          const newDiv = document.createElement("div");
          newDiv.id = "notification-box";
          document.body.appendChild(newDiv);
        }
      },
    })
    .then(() => {
      executeScriptOnInput(tabId, extractInputFormElements, fillInputForm);
      executeScriptOnSelect(tabId, extractSelectFormElements, fillSelectForm);
    })
    .catch((error) => document.getElementsByClassName('warning')[0].textContent = "Error !");
}

// Main Execution Flow
document.getElementsByClassName('start-btn')[0].addEventListener("click", () =>
  getActiveTab((tabId) => {
    executeScriptOnTab(tabId);
  })
);
