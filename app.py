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

# Define complete prompts for each task
improve_prompt_template = """
Format your response using Markdown. Use appropriate headings (like ## Title) for sections.

You are an expert in programming and code optimization.
You must improve the provided code, making it more efficient, readable, and following best practices.
Your response must follow EXACTLY the following structure and format:

## ANALYSIS
In this section, explain the improvements made to the original code, including efficiency optimizations, readability improvements, and adoption of best practices. Be specific about the changes made and why they contribute to better code.

## IMPROVED CODE
```
[IMPROVED CODE HERE]
```

Example of expected output:

## ANALYSIS
In the improved code, I organized the HTML structure to follow a more logical format, made stylistic improvements, and included meta tags for better browser rendering.

I separated CSS styles into external files (styles.css and ai-background.css) and JavaScript into ai-background.js file to improve code maintainability and follow web development best practices.

## IMPROVED CODE
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Alchemist - AI Code Transformation</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
    <!-- Rest of the improved code -->
</head>
```

IMPORTANT:
- DO NOT include introductory phrases like "Here's the improved code:" or "Certainly! Here's the improved version..."
- DO NOT include conclusions, questions, or offers like "Do you have any questions?" or "If you have any questions..."
- Start your response DIRECTLY with the ## ANALYSIS heading without any preceding text
- Your response must include ONLY the specified sections, with no additional text at the beginning or end

ORIGINAL CODE:
```
{}
```
"""

translate_prompt_template = """
Format your response using Markdown. Use appropriate headings (like ## Title) for sections.

You are an expert in multiple programming languages.
You must translate the provided code to the target language, maintaining the same functionality and using idiomatic patterns of the destination language.
Your response must follow EXACTLY the following structure and format:

## TRANSLATION NOTES
In this section, briefly explain the key considerations in the translation, including idiomatic differences between languages, specific patterns used, and any adaptations necessary to maintain functionality.

## TRANSLATED CODE
```
[TRANSLATED CODE HERE]
```

Example of expected output:

## TRANSLATION NOTES
When translating from JavaScript to Python, I converted arrow functions to regular Python functions, replaced array methods with Python equivalents, and adapted object handling syntax to Python dictionaries.

## TRANSLATED CODE
```python
def calculate_total(items):
    return sum(item['price'] for item in items)
    
# Rest of the translated code
```

IMPORTANT:
- DO NOT include introductory phrases like "Here's the translation:" or "Here's the translation..."
- DO NOT include conclusions, questions, or offers like "Do you have any questions?" or "If you have any questions..."
- Start your response DIRECTLY with the ## TRANSLATION NOTES heading without any preceding text
- Your response must include ONLY the specified sections, with no additional text at the beginning or end

ORIGINAL CODE:
```
{}
```

TARGET LANGUAGE: {}
"""

debug_prompt_template = """
Format your response using Markdown. Use appropriate headings (like ## Title) for sections.

You are an expert in debugging and code analysis.
You must identify and correct errors, vulnerabilities, and potential problems in the provided code.
Your response must follow EXACTLY the following structure and format:

## ISSUES DETECTED
In this section, list all problems found in the original code, classifying them by type (syntax errors, logical bugs, security vulnerabilities, etc.) and explaining why they are problematic.

## DEBUGGED CODE
```
[CORRECTED CODE HERE]
```

Example of expected output:

## ISSUES DETECTED
1. **Syntax error**: Missing closing parenthesis on line 15
2. **Logical bug**: The condition in the while loop is never met, resulting in an infinite loop
3. **Security vulnerability**: SQL injection possible on line 27 due to direct variable concatenation

## DEBUGGED CODE
```python
def process_data(user_input):
    # Corrected code here
    # With comments indicating each correction
```

IMPORTANT:
- DO NOT include introductory phrases like "Here's the analysis:" or "I've analyzed the code..."
- DO NOT include conclusions, questions, or offers like "Do you have any questions?" or "If you have any questions..."
- Start your response DIRECTLY with the ## ISSUES DETECTED heading without any preceding text
- Your response must include ONLY the specified sections, with no additional text at the beginning or end

CODE TO DEBUG:
```
{}
```
"""

explain_prompt_template = """
Format your response using Markdown. Use appropriate headings (like ## Title) for sections.

You are an expert in explaining code and algorithms.
You must analyze the provided code and explain its operation, logic, and key parts clearly and in detail.
Your response must follow EXACTLY the following structure and format:

## CODE OVERVIEW
In this section, provide a concise summary of the general purpose of the code, its structure, and main functionality.

## DETAILED EXPLANATION
In this section, explain in detail how the code works, dividing your explanation into logical subsections:

### Main Components
Explain the fundamental parts of the code.

### Execution Flow
Detail the order in which operations are executed.

### Critical Points
Identify noteworthy algorithms, patterns, or techniques used.

Example of expected output:

## CODE OVERVIEW
This code implements a quicksort algorithm with an optimization for small data sets using insertion sort. The implementation is designed to be efficient in memory and execution time.

## DETAILED EXPLANATION

### Main Components
The `quicksort` function acts as the entry point for the algorithm, while `partition` is responsible for dividing the array around a pivot.

### Execution Flow
1. It checks if the array size is less than a threshold (10 elements)
2. For small arrays, insertion sort is used for its efficiency
3. For large arrays, a pivot is selected and the array is partitioned
4. Recursion is applied to the sub-partitions

### Critical Points
The pivot selection uses the "median of three" strategy, comparing the first, middle, and last elements to minimize the worst case in partially ordered sequences.

IMPORTANT:
- DO NOT include introductory phrases like "Here's the explanation:" or "Let me explain this code..."
- DO NOT include conclusions, questions, or offers like "Do you have any questions?" or "If you have any questions..."
- Start your response DIRECTLY with the ## CODE OVERVIEW heading without any preceding text
- Your response must include ONLY the specified sections, with no additional text at the beginning or end

CODE TO EXPLAIN:
```
{}
```
"""

default_prompt_template = """
Format your response using Markdown. Use appropriate headings (like ## Title) for sections.

You are an expert in code analysis and review.
You must analyze the provided code from different perspectives: efficiency, readability, best practices, and potential problems.
Your response must follow EXACTLY the following structure and format:

## CODE ASSESSMENT
In this section, provide a general evaluation of the code, highlighting its strengths and areas for improvement.

## RECOMMENDATIONS
In this section, list specific recommendations to improve the code, organized by categories:

### Efficiency
Suggestions to optimize performance.

### Readability
Proposals to make the code easier to understand.

### Best Practices
Recommendations to adhere to industry standards.

### Security
Tips to mitigate potential vulnerabilities.

Example of expected output:

## CODE ASSESSMENT
The code correctly implements the required functionality, but has efficiency problems in handling large data sets and lacks adequate documentation. The overall organization is good, although there are specific areas that could be improved by following more established design patterns.

## RECOMMENDATIONS

### Efficiency
1. Replace the sequential search algorithm with an indexed data structure
2. Implement cache for frequent results
3. Use lazy loading techniques for heavy resources

### Readability
1. Add explanatory comments for complex functions
2. Improve variable names to reflect their purpose
3. Restructure deeply nested blocks

### Best Practices
1. Implement consistent error handling
2. Separate business logic from the user interface
3. Add unit tests for critical functionalities

### Security
1. Validate all user inputs
2. Use parameterized queries for data access
3. Implement principle of least privilege

IMPORTANT:
- DO NOT include introductory phrases like "Here's my analysis:" or "Here's my assessment..."
- DO NOT include conclusions, questions, or offers like "Do you have any questions?" or "If you have any questions..."
- Start your response DIRECTLY with the ## CODE ASSESSMENT heading without any preceding text
- Your response must include ONLY the specified sections, with no additional text at the beginning or end

CODE TO ANALYZE:
```
{}
```
"""

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
    
    # Select and fill the appropriate prompt template
    if task == 'improve':
        prompt = improve_prompt_template.format(code)
    elif task == 'translate' and language:
        prompt = translate_prompt_template.format(code, language, language)
    elif task == 'debug':
        prompt = debug_prompt_template.format(code)
    elif task == 'explain':
        prompt = explain_prompt_template.format(code)
    else:  # Default fallback if task is unknown
        prompt = default_prompt_template.format(code)
    
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