const processedErrors = new WeakSet();
let debounceTimer;

// Main entry point: Watch the page for changes
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    // Slight delay to ensure DOM is ready and prevent browser freezing
    debounceTimer = setTimeout(scanAndFix, 800);
});

observer.observe(document.body, { childList: true, subtree: true });

function scanAndFix() {
    // Query for the old error class AND the feedback container shown in your screenshot
    const potentialErrors = document.querySelectorAll('.model-error, ms-prompt-feedback');
    
    potentialErrors.forEach(errorEl => {
        // Skip if we've already handled this specific error element
        if (processedErrors.has(errorEl)) return;

        // Get text and check for either error type
        const text = errorEl.textContent || errorEl.innerText || "";
        const isInternalError = text.includes("An internal error has occurred");
        const isOutputError = text.includes("Output error");

        // If neither error is found, ignore and move on
        if (!isInternalError && !isOutputError) return;

        // Mark as processed immediately so we don't try again
        processedErrors.add(errorEl);

        // Find the main container row (holds both the prompt and the error)
        const chatRow = errorEl.closest('ms-chat-turn');
        
        if (chatRow) {
            // 1. Reduce Lag (The "Nuclear Option")
            // We replace the huge wall of text with "Hi" to free up RAM
            requestAnimationFrame(() => {
                const userPrompt = chatRow.querySelector('.user-prompt-container');
                if (userPrompt) {
                    userPrompt.style.contain = "strict";
                    userPrompt.style.height = "100px";
                    userPrompt.style.overflow = "hidden";
                    // Using innerHTML destroys the heavy DOM nodes instantly
                    userPrompt.innerHTML = '<div style="padding: 20px; color: #ccc;">(Text cleared to fix lag) - Hi</div>';
                }
            });

            // 2. Trigger the Rerun (Wait 1s for browser to recover from lag)
            setTimeout(() => {
                triggerRerun(chatRow);
            }, 1000);
        }
    });
}

function triggerRerun(chatRow) {
    // Simulate hover events to force the "Rerun" button to appear
    ['mouseenter', 'mouseover', 'mousemove'].forEach(evt => {
        chatRow.dispatchEvent(new MouseEvent(evt, { bubbles: true }));
    });

    // Specifically target the actions container if found
    const actionsContainer = chatRow.querySelector('.actions-container');
    if (actionsContainer) {
        actionsContainer.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }

    // Wait 500ms for the button to render, then click
    setTimeout(() => {
        // Try specific class first (fastest), then fuzzy label search
        const rerunBtn = chatRow.querySelector('.rerun-button') || 
                         chatRow.querySelector('button[aria-label*="Rerun"]');
        
        if (rerunBtn) {
            rerunBtn.click();
        }
    }, 500);
}