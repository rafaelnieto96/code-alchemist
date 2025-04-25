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

    // Función para copiar el contenido de un bloque de código
    function copyCodeBlock(codeElement, button) {
        const textToCopy = codeElement.textContent;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Cambiar apariencia del botón para feedback
                button.classList.add('copied');
                const originalText = button.textContent;
                button.textContent = 'Copied!';

                // Restaurar el botón después de un tiempo
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy to clipboard');
            });
    }

    // Añadir botones de copia a cada bloque de código
    function addCopyButtonsToCodeBlocks() {
        document.querySelectorAll('#code-output pre').forEach(block => {
            // Crear el botón de copia
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn';
            copyButton.textContent = 'Copy';

            // Posicionar el botón dentro del bloque de código
            block.appendChild(copyButton);

            // Agregar el evento click para copiar
            const codeElement = block.querySelector('code');
            copyButton.addEventListener('click', () => {
                if (codeElement) {
                    copyCodeBlock(codeElement, copyButton);
                }
            });
        });
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
                    // Convert markdown to HTML
                    const rawHtml = marked.parse(result.result);
                    codeOutputContainer.innerHTML = rawHtml;

                    // Format code explanation if present
                    if (taskSelect.value === 'explain') {
                        enhanceExplanation();
                    }

                    // Adjust code blocks to remove scrollbars
                    document.querySelectorAll('#code-output pre').forEach(block => {
                        block.classList.add('code-block');
                        // Eliminar cualquier estilo inline que pueda afectar
                        block.style.overflow = 'visible';
                        block.style.maxHeight = 'none';
                        block.style.height = 'auto';

                        // Asegurar que el código dentro también está ajustado
                        const codeElement = block.querySelector('code');
                        if (codeElement) {
                            codeElement.style.overflow = 'visible';
                            codeElement.style.maxHeight = 'none';
                            codeElement.style.height = 'auto';
                        }
                    });

                    // Añadir botones de copia a todos los bloques de código
                    addCopyButtonsToCodeBlocks();

                    // Scroll to top of the container
                    codeOutputContainer.scrollTop = 0;
                }, 300);
            } else {
                codeOutputContainer.innerHTML = '<code>// No result received from AI.</code>';
            }

        } catch (error) {
            console.error('Error:', error);
            // Clear typing animation
            typingAnimation.clear();
            // Display error message wrapped in code tag inside the DIV
            codeOutputContainer.innerHTML = `<code>// Transformation failed:\n\nError: ${error.message}</code>`;
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

    // Enhance explanation output with structure and classes
    function enhanceExplanation() {
        const codeSnippets = codeOutputContainer.querySelectorAll('code:not(pre code)');
        codeSnippets.forEach(snippet => {
            // Don't modify code blocks inside pre tags
            if (snippet.parentElement.tagName !== 'PRE') {
                const snippetText = snippet.textContent;
                const explanationText = snippet.nextSibling;

                if (explanationText && explanationText.nodeType === Node.TEXT_NODE) {
                    // Create a container for this snippet-explanation pair
                    const container = document.createElement('div');
                    container.className = 'explanation';

                    // Create elements for snippet and explanation
                    const snippetElement = document.createElement('div');
                    snippetElement.className = 'code-snippet';
                    snippetElement.textContent = snippetText;

                    const textElement = document.createElement('div');
                    textElement.className = 'explanation-text';
                    textElement.textContent = explanationText.textContent;

                    // Add to container and replace original elements
                    container.appendChild(snippetElement);
                    container.appendChild(textElement);

                    // Replace the original nodes with our new container
                    const parent = snippet.parentNode;
                    parent.insertBefore(container, snippet);
                    parent.removeChild(snippet);
                    parent.removeChild(explanationText);
                }
            }
        });
    }

    // Initialize: Hide language select if the default task is not 'translate'
    if (taskSelect.value !== 'translate') {
        languageSelectContainer.style.display = 'none';
    }
}); 