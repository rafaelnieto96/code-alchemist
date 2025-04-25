document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskSelect = document.getElementById('task-select');
    const languageSelectContainer = document.querySelector('.language-select-container');
    const languageSelect = document.getElementById('language-select');
    const codeInput = document.getElementById('code-input');
    const transformButton = document.getElementById('transform-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const codeOutput = document.getElementById('code-output').querySelector('code'); // Target the code element
    const copyButton = document.getElementById('copy-button');

    // Show/hide language select based on task
    taskSelect.addEventListener('change', () => {
        if (taskSelect.value === 'translate') {
            languageSelectContainer.style.display = 'flex';
        } else {
            languageSelectContainer.style.display = 'none';
        }
    });

    // Transform button click handler
    transformButton.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            alert('Please enter some code to transform.');
            return;
        }
        
        // Prepare data
        const data = {
            code: code,
            task: taskSelect.value
        };
        
        // Add language if translation is selected
        if (taskSelect.value === 'translate') {
            data.language = languageSelect.value;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        document.getElementById('code-output').style.visibility = 'hidden'; // Hide the parent pre element
        copyButton.disabled = true;
        codeOutput.textContent = ''; // Clear previous results
        
        try {
            // Send request to backend
            const response = await fetch('/api/improve_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Network response was not ok (${response.status})`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Display result - Sanitize or use appropriate methods if dealing with HTML
            codeOutput.textContent = result.result;
            copyButton.disabled = false;
            
        } catch (error) {
            console.error('Error:', error);
            codeOutput.textContent = `Error: ${error.message}`;
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            document.getElementById('code-output').style.visibility = 'visible'; // Show the parent pre element
        }
    });
    
    // Copy button click handler
    copyButton.addEventListener('click', () => {
        const text = codeOutput.textContent;
        if (!text || text === 'Results will appear here...') {
            return; // Do nothing if there's no result to copy
        }
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy to clipboard');
            });
    });

    // Initialize: Hide language select if the default task is not 'translate'
    if (taskSelect.value !== 'translate') {
        languageSelectContainer.style.display = 'none';
    }
}); 