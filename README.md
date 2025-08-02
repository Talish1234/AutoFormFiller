# ⚡ Auto Form Filler (with Gemini AI)

This is a **Chrome Extension** that intelligently auto-fills web forms using Gemini AI. It collects input field IDs and their associated labels (questions), sends them to Gemini for context-aware answers, and automatically fills in the inputs with the returned responses.

## How It Works

1. The extension collects all `<input>` field IDs and their corresponding `<label>` text (question).
2. It sends this data to **Gemini AI** to generate context-appropriate answers.
3. The extension receives the AI-generated answers and maps them back to the respective input fields using their IDs.
4. It uses `chrome.scripting.executeScript` to fill each field automatically.

## Installation

1. Clone or download this repository:

   ```bash
   git clone https://github.com/Talish1234/auto-form-filler.git

## Tech Stack

- JavaScript
- Chrome Extension API (Manifest V3)
- Gemini API (Google Generative AI)
- DOM manipulation

## Features

-  Detects and parses form input fields
-  Uses Gemini AI for smart field completion
-  Lightweight and fast Chrome Extension
-  Works on most webpages with standard forms
