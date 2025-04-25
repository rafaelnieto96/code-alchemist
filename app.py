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
    
    # Create the prompt based on the task
    if task == 'improve':
        prompt = f"Improve the following code to make it more efficient and readable:\n\n```\n{code}\n```"
    elif task == 'translate' and language:
        prompt = f"Translate the following code to {language}:\n\n```\n{code}\n```"
    elif task == 'debug':
        prompt = f"Find and fix bugs in the following code:\n\n```\n{code}\n```"
    elif task == 'explain':
        prompt = f"Explain the following code in detail:\n\n```\n{code}\n```"
    else:
        prompt = f"Analyze the following code:\n\n```\n{code}\n```"
    
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