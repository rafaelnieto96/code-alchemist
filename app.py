from flask import Flask, request, jsonify, render_template
import cohere
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize Cohere client
try:
    co = cohere.Client(os.getenv('COHERE_API_KEY'))
except Exception as e:
    print(f"Error initializing Cohere client: {e}")
    co = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/improve_code', methods=['POST'])
def improve_code():
    if not co:
        return jsonify({"error": "Cohere API client not initialized"}), 500
    
    data = request.json
    code = data.get('code', '')
    task = data.get('task', 'improve')  # Options: improve, translate, debug, explain
    language = data.get('language', '')
    
    # Define base instruction for Markdown output
    markdown_instruction = "Format your response using Markdown. Use appropriate headings (like ## Title) for sections."

    # Create the prompt based on the task
    if task == 'improve':
        prompt = f"{markdown_instruction}\n\n## Analysis\nAnalyze the following code and provide suggestions for improvement regarding efficiency, readability, and best practices.\n\n```\n{code}\n```\n\n## Improved Code\nProvide the improved version of the code below:"
    elif task == 'translate' and language:
        prompt = f"{markdown_instruction}\n\n## Original Code\n```\n{code}\n```\n\n## Translation to {language}\nTranslate the code above to {language} and provide the result below:"
    elif task == 'debug':
        prompt = f"{markdown_instruction}\n\n## Code Analysis\nAnalyze the following code for bugs, potential errors, and vulnerabilities.\n\n```\n{code}\n```\n\n## Debugged Code\nProvide the corrected code (if bugs were found) or confirm it looks okay:"
    elif task == 'explain':
        prompt = f"{markdown_instruction}\n\n## Code Snippet\n```\n{code}\n```\n\n## Explanation\nExplain the functionality, logic, and key parts of the code above in detail:"
    else: # Default fallback if task is unknown
        prompt = f"{markdown_instruction}\n\n## Code Analysis\nAnalyze the following code:\n\n```\n{code}\n```\n\n## Result\nProvide the analysis result below:"
    
    try:
        # Generate response from Cohere
        response = co.generate(
            prompt=prompt,
            max_tokens=1000,
            temperature=0.7,
            k=0,
            stop_sequences=[],
            return_likelihoods="NONE"
        )
        return jsonify({"result": response.generations[0].text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 