document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskSelect = document.getElementById('task-select');
    const languageSelectContainer = document.querySelector('.language-select-container');
    const languageSelect = document.getElementById('language-select');
    const codeInput = document.getElementById('code-input');
    const transformButton = document.getElementById('transform-button');
    const outputPanel = document.getElementById('output-panel');
    const loadingIndicator = document.getElementById('loading-indicator');
    const codeOutputContainer = document.getElementById('code-output');
    const copyButton = document.getElementById('copy-button');

    // Show/hide language select based on task
    taskSelect.addEventListener('change', () => {
        if (taskSelect.value === 'translate') {
            languageSelectContainer.style.display = 'block'; // Use block for vertical layout
        } else {
            languageSelectContainer.style.display = 'none';
        }
    });

    // Enhanced loading animation
    function startTypingAnimation() {
        // Create placeholder content for typing animation
        const placeholderContent = "Analyzing input...\nApplying transformation...\nGenerating result...";
        codeOutputContainer.innerHTML = '<code class="typing-effect"></code>';
        const typingElement = codeOutputContainer.querySelector('.typing-effect');

        let i = 0;
        const typingSpeed = 50; // ms per character
        const pauseDelay = 1500; // Pause for 1.5 seconds when all text is shown
        let pauseTimer = null;
        let isInPause = false;

        const typingInterval = setInterval(() => {
            if (isInPause) return;

            if (i < placeholderContent.length) {
                // Replace newlines with <br> tags for HTML display
                if (placeholderContent[i] === '\n') {
                    typingElement.innerHTML += '<br>';
                } else {
                    typingElement.innerHTML += placeholderContent[i];
                }
                i++;

                // If we've reached the end, pause before restarting
                if (i >= placeholderContent.length) {
                    isInPause = true;
                    pauseTimer = setTimeout(() => {
                        typingElement.innerHTML = '';
                        i = 0;
                        isInPause = false;
                    }, pauseDelay);
                }
            }
        }, typingSpeed);

        // Return both the interval and timer so they can be cleared later
        return {
            interval: typingInterval,
            clear: function () {
                clearInterval(typingInterval);
                if (pauseTimer) clearTimeout(pauseTimer);
            }
        };
    }

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

        if (taskSelect.value === 'translate') {
            data.language = languageSelect.value;
        }

        // Show loading indicator and prepare output panel
        outputPanel.classList.add('visible');
        loadingIndicator.classList.add('visible');
        codeOutputContainer.classList.add('loading');
        codeOutputContainer.innerHTML = '';
        copyButton.disabled = true;
        transformButton.disabled = true;

        // Start typing animation
        const typingAnimation = startTypingAnimation();

        try {
            const response = await fetch('/api/improve_code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            // Clear typing animation
            typingAnimation.clear();

            if (!response.ok) {
                throw new Error(result.error || `Server error (${response.status})`);
            }

            if (result.error) {
                throw new Error(result.error);
            }

            // Parse Markdown response and render as HTML into the DIV
            if (result.result) {
                // Add a small delay before showing result (feels more natural)
                setTimeout(() => {
                    const rawHtml = marked.parse(result.result);
                    codeOutputContainer.innerHTML = rawHtml;
                }, 300);
            } else {
                codeOutputContainer.innerHTML = '<code>// No result received from AI.</code>';
            }

            copyButton.disabled = false;

        } catch (error) {
            console.error('Error:', error);
            // Clear typing animation
            typingAnimation.clear();
            // Display error message wrapped in code tag inside the DIV
            codeOutputContainer.innerHTML = `<code>// Transformation failed:\n\nError: ${error.message}</code>`;
            copyButton.disabled = true;
        } finally {
            // Always remove the loading class from the DIV container
            codeOutputContainer.classList.remove('loading');

            // Hide loading indicator overlay
            setTimeout(() => {
                loadingIndicator.classList.remove('visible');
            }, 200);
            transformButton.disabled = false;
        }
    });

    // Copy button click handler
    copyButton.addEventListener('click', () => {
        // Target the container div for finding code blocks or getting text
        const codeBlocks = codeOutputContainer.querySelectorAll('pre code');
        let textToCopy = '';
        if (codeBlocks.length > 0) {
            codeBlocks.forEach(block => {
                // Get the original text content without HTML syntax highlighting
                textToCopy += block.textContent + '\n\n';
            });
            textToCopy = textToCopy.trim();
        } else {
            // Fallback to copying the text content of the container DIV
            textToCopy = codeOutputContainer.textContent;
        }

        if (!textToCopy || textToCopy.startsWith('// Transformation failed:')) {
            return;
        }
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.style.borderColor = 'var(--success-color, #22c55e)';
                copyButton.style.color = 'var(--success-color, #22c55e)';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.borderColor = '';
                    copyButton.style.color = '';
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