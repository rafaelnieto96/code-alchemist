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

    // Function to copy code block content
    function copyCodeBlock(codeElement, button) {
        const textToCopy = codeElement.textContent;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Change button appearance for feedback
                button.classList.add('copied');
                const originalText = button.textContent;
                button.textContent = 'Copied!';

                // Restore button after a delay
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

    // Add copy buttons to each code block
    function addCopyButtonsToCodeBlocks() {
        document.querySelectorAll('#code-output pre').forEach(block => {
            const codeElement = block.querySelector('code');

            // Only add button if it contains actual code (not just text)
            if (codeElement && codeElement.textContent.trim().length > 0) {
                // Check if content looks like code (contains special characters, keywords, etc)
                const content = codeElement.textContent;
                const hasCodeSyntax = /[{}\[\]()=;:<>\/\\.|&!*+\-#@]/.test(content) ||
                    /\b(function|var|let|const|if|else|for|while|class|import|export|return)\b/.test(content);

                if (hasCodeSyntax) {
                    // Create copy button
                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-code-btn';
                    copyButton.textContent = 'Copy';

                    // Position button inside code block
                    block.appendChild(copyButton);

                    // Add click event to copy
                    copyButton.addEventListener('click', () => {
                        copyCodeBlock(codeElement, copyButton);
                    });
                }
            }
        });
    }

    // Transform button click handler
    transformButton.addEventListener('click', async () => {
        const code = codeInput.value.trim();

        if (!code) {
            alert('Please enter some code to transform.');
            return;
        }

        const data = {
            code: code,
            task: taskSelect.value
        };

        if (taskSelect.value === 'translate') {
            data.language = languageSelect.value;
        }

        outputPanel.classList.add('visible');
        loadingIndicator.classList.add('visible');
        codeOutputContainer.classList.add('loading');
        codeOutputContainer.innerHTML = '';
        transformButton.disabled = true;

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
            typingAnimation.clear();

            if (!response.ok) {
                throw new Error(result.error || `Service unavailable. Please try again later.`);
            }

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.result) {
                setTimeout(() => {
                    const rawHtml = marked.parse(result.result);
                    codeOutputContainer.innerHTML = rawHtml;

                    if (taskSelect.value === 'explain') {
                        enhanceExplanation();
                    }

                    document.querySelectorAll('#code-output pre').forEach(block => {
                        block.classList.add('code-block');
                        block.style.overflow = 'visible';
                        block.style.maxHeight = 'none';
                        block.style.height = 'auto';

                        const codeElement = block.querySelector('code');
                        if (codeElement) {
                            codeElement.style.overflow = 'visible';
                            codeElement.style.maxHeight = 'none';
                            codeElement.style.height = 'auto';
                        }
                    });

                    addCopyButtonsToCodeBlocks();
                    codeOutputContainer.scrollTop = 0;
                }, 300);
            } else {
                codeOutputContainer.innerHTML = '<code>// No result received from AI.</code>';
            }

        } catch (error) {
            console.error('Error:', error);
            typingAnimation.clear();

            codeOutputContainer.innerHTML = `<div class="error-message">
     <code>// Oops! Something went wrong.
  
 Sorry about that! It seems we encountered an issue while transforming your code. Please try again later or try with a different code snippet.</code>
 </div>`
        } finally {
            codeOutputContainer.classList.remove('loading');

            setTimeout(() => {
                loadingIndicator.classList.remove('visible');
            }, 200);
            transformButton.disabled = false;
        }
    });

    // Enhance explanation output with structure and classes
    function enhanceExplanation() {
        // Handle code elements in paragraphs and other inline contexts
        const codeSnippets = codeOutputContainer.querySelectorAll('code:not(pre code)');
        codeSnippets.forEach(snippet => {
            if (snippet.parentElement.tagName !== 'PRE') {
                const snippetText = snippet.textContent.trim();
                const explanationText = snippet.nextSibling;

                if (explanationText && explanationText.nodeType === Node.TEXT_NODE) {
                    const container = document.createElement('div');
                    container.className = 'explanation';

                    const snippetElement = document.createElement('div');
                    snippetElement.className = 'code-snippet';
                    snippetElement.textContent = snippetText;

                    const textElement = document.createElement('div');
                    textElement.className = 'explanation-text';
                    // Trim any whitespace from the explanation text
                    textElement.textContent = explanationText.textContent.replace(/^\s+/, '').trim();

                    container.appendChild(snippetElement);
                    container.appendChild(textElement);

                    const parent = snippet.parentNode;
                    parent.insertBefore(container, snippet);
                    parent.removeChild(snippet);
                    parent.removeChild(explanationText);
                }
            }
        });

        // Special handling for list items containing code elements
        document.querySelectorAll('#code-output li').forEach(li => {
            const codeElement = li.querySelector('code:not(pre code)');
            if (codeElement && li.childNodes.length > 1) {
                // There's a code element and other content in this list item
                const snippetText = codeElement.textContent.trim();
                
                // Get all text after the code element
                let explanationText = '';
                let foundCode = false;
                let nodesToRemove = [];
                
                li.childNodes.forEach(node => {
                    if (foundCode && node.nodeType === Node.TEXT_NODE) {
                        explanationText += node.textContent;
                        nodesToRemove.push(node);
                    }
                    if (node === codeElement) {
                        foundCode = true;
                        nodesToRemove.push(node);
                    }
                });
                
                if (explanationText.trim()) {
                    const container = document.createElement('div');
                    container.className = 'explanation';

                    const snippetElement = document.createElement('div');
                    snippetElement.className = 'code-snippet';
                    snippetElement.textContent = snippetText;

                    const textElement = document.createElement('div');
                    textElement.className = 'explanation-text';
                    textElement.textContent = explanationText.replace(/^\s+/, '').trim();

                    // Remove the nodes we processed
                    nodesToRemove.forEach(node => li.removeChild(node));
                    
                    // Add the elements to the container
                    container.appendChild(snippetElement);
                    container.appendChild(textElement);
                    
                    // Insert our structured explanation
                    li.appendChild(container);
                }
            }
        });
        
        // Clean up any empty text nodes in the output
        cleanupWhitespace(codeOutputContainer);
    }

    // Helper function to remove unnecessary whitespace nodes
    function cleanupWhitespace(element) {
        const treeWalker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            { acceptNode: node => /^\s*$/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
        );
        
        const nodesToRemove = [];
        let currentNode;
        
        while (currentNode = treeWalker.nextNode()) {
            nodesToRemove.push(currentNode);
        }
        
        nodesToRemove.forEach(node => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
    }

    // Initialize: Hide language select if the default task is not 'translate'
    if (taskSelect.value !== 'translate') {
        languageSelectContainer.style.display = 'none';
    }

    taskSelect.addEventListener('mouseover', function () {
        this.style.cursor = 'pointer';
    });

    // Function to create custom select
    function createCustomSelect(originalSelect, wrapperClass = '') {
        const selectLabel = document.querySelector(`label[for="${originalSelect.id}"]`);
        const selectContainer = selectLabel.parentElement;

        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select-wrapper ' + wrapperClass;
        customSelect.innerHTML = `
            <div class="custom-select">
                <div class="custom-select-trigger">${originalSelect.options[originalSelect.selectedIndex].text}</div>
                <div class="custom-options">
                    ${Array.from(originalSelect.options).map(option =>
            `<span class="custom-option ${option.selected ? 'selection' : ''}" data-value="${option.value}">${option.text}</span>`
        ).join('')}
                </div>
            </div>
        `;

        originalSelect.style.display = 'none';
        selectContainer.insertBefore(customSelect, originalSelect.nextSibling);

        const customSelectTrigger = customSelect.querySelector('.custom-select-trigger');
        const customOptions = customSelect.querySelector('.custom-options');
        const customOptionElements = customSelect.querySelectorAll('.custom-option');

        customSelectTrigger.addEventListener('click', function () {
            this.parentNode.classList.toggle('opened');
        });

        customOptionElements.forEach(option => {
            option.addEventListener('click', function () {
                customSelectTrigger.textContent = this.textContent;

                originalSelect.value = this.getAttribute('data-value');

                const changeEvent = new Event('change');
                originalSelect.dispatchEvent(changeEvent);

                customSelect.querySelector('.custom-option.selection')?.classList.remove('selection');
                this.classList.add('selection');

                this.closest('.custom-select').classList.remove('opened');
            });
        });

        document.addEventListener('click', function (e) {
            if (!customSelect.contains(e.target)) {
                customSelect.querySelector('.custom-select').classList.remove('opened');
            }
        });

        return customSelect;
    }

    createCustomSelect(taskSelect, 'task-select-wrapper');
    createCustomSelect(languageSelect, 'language-select-wrapper');
}); 