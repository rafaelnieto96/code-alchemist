# Code Alchemist

A modern web application that uses AI to improve, debug, explain, and translate code across different programming languages.

## Features

- **Improve Code**: Make your code more efficient and readable
- **Debug Code**: Find and fix bugs in your code
- **Explain Code**: Get detailed explanations of how your code works
- **Translate Code**: Convert your code to different programming languages

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, P5.js
- **Backend**: Flask (Python)
- **AI**: Cohere's API

## Prerequisites

- Python 3.8 or higher
- A Cohere API key ([Get one here](https://cohere.ai/))

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/code-alchemist.git
   cd code-alchemist
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the root directory:
   ```
   cp env.example .env
   ```

6. Add your Cohere API key to the `.env` file:
   ```
   COHERE_API_KEY=your_api_key_here
   ```

## Running the App

1. Start the Flask server:
   ```
   flask run
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Deployment

This application can be deployed to PythonAnywhere for free hosting:

1. Create a PythonAnywhere account
2. Set up a new web app with Flask
3. Upload your code and set environment variables
4. Install dependencies from requirements.txt

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 