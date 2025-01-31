document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        // Extract all input IDs from the active page
        return Array.from(document.querySelectorAll("input"))
          .map(input => input.id)
          .filter(id => id); // Exclude empty IDs
      }
    }).then((results) => {
      if (results && results.length > 0 && results[0].result) {
        // Send the input IDs to the backend
        fetch("http://localhost:3000", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: results[0].result })
        })
        .then(response => response.json())
        .then(data => {
          console.log("Parsed response:", data.parsedResponse);
          // Execute a script on the active tab to populate the form
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (data) => {
              console.log("Data:", data);
              for (const key in data) {
                if (data[key] && data[key].length > 0) {
                  const element = document.getElementById(key);
                  if(element.type == "text" || element.type == "email" || element.type == "password")  
                   element.value = data[key];
                  else if(element.type == "number") 
                    element.value = parseInt(data[key]);
                  else if(element.type == "date")
                    element.value = data[key];
                } else {
                  console.log(`No ${key} found`);
                }
              }
            },
            args: [data.parsedResponse] // Pass the parsed response data
          }).then(() => {
            document.querySelector("h3").innerHTML = "successful !" ;
          }).catch(err => {
            document.querySelector("h3").innerHTML = "Failed to execute script !" ;
          })});
        })
        .catch(error => {
          document.querySelector("h3").innerHTML = "Error !" ;
        });
      } else {
        document.querySelector("h3").innerHTML = "No input IDs found !";
      }
    }).catch((error) => {
      document.querySelector("h3").innerHTML = "Failed to get input IDs !";
    });
  });
});