// --- VISUAL LOGGER SETUP ---
const logBox = document.createElement('div');
logBox.style.position = 'fixed';
logBox.style.top = '10px';
logBox.style.right = '10px';
logBox.style.width = '350px';
logBox.style.height = '250px';
logBox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
logBox.style.color = '#00ff00'; 
logBox.style.fontFamily = 'Consolas, monospace';
logBox.style.fontSize = '12px';
logBox.style.padding = '10px';
logBox.style.zIndex = '999999';
logBox.style.overflowY = 'auto';
logBox.style.pointerEvents = 'none'; 
logBox.style.border = '1px solid #333';
document.body.appendChild(logBox);

function log(msg) {
    const line = document.createElement('div');
    const time = new Date().toLocaleTimeString().split(' ')[0];
    line.innerText = `[${time}] ${msg}`;
    line.style.borderBottom = '1px solid #222';
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

log("🚀 UPDATE LOADED: Rerun Fixer");

// --- CONFIGURATION ---
const processedErrors = new WeakSet();
let isProcessing = false; 

function scanForErrors() {
    if (isProcessing) return; 

    const errorElements = document.querySelectorAll('.model-error');
    
    if (errorElements.length === 0) return;

    errorElements.forEach((element) => {
        if (processedErrors.has(element)) return;

        const textContent = element.textContent || element.innerText;
        
        if (textContent.includes("An internal error has occurred")) {
            isProcessing = true;
            log("🚩 ERROR DETECTED!");
            
            element.style.border = "5px solid red";
            processedErrors.add(element);

            // 1. NUKE LAG (Keep this, it works!)
            requestAnimationFrame(() => {
                nukeLaggyText(element);
            });

            // 2. Wait for DOM
            log("⏳ Waiting 1s...");
            setTimeout(() => {
                attemptRecovery(element);
            }, 1000);
        }
    });
}

function nukeLaggyText(errorElement) {
    // Find the main chat row first
    const chatTurn = errorElement.closest('ms-chat-turn');
    if (!chatTurn) return;

    // Find the User Prompt inside this specific turn
    const userPrompt = chatTurn.querySelector('.user-prompt-container');

    if (userPrompt) {
        log("☢️ Nuking User Prompt inside this turn...");
        
        userPrompt.style.contain = "strict"; 
        userPrompt.style.height = "100px"; 
        userPrompt.style.overflow = "hidden";
        userPrompt.innerHTML = '<div style="color: magenta; padding: 20px;">(RAM CLEARED) - Hi</div>';
        userPrompt.style.border = "4px dashed magenta";
    }
}

function attemptRecovery(errorElement) {
    log("🔍 Locating Chat Row...");

    // STRATEGY CHANGE: 
    // Instead of looking for a generic container, we look for the Angular component 
    // that wraps the entire turn (User + Model + Buttons).
    // Based on your screenshot, this is <ms-chat-turn>.
    const chatRow = errorElement.closest('ms-chat-turn');

    if (chatRow) {
        log("✅ Found <ms-chat-turn> row.");
        chatRow.style.border = "2px dashed blue"; // Visual confirm

        // 1. Trigger Hover on the whole row to make buttons appear
        ['mouseenter', 'mouseover', 'mousemove'].forEach(evt => {
            chatRow.dispatchEvent(new MouseEvent(evt, { bubbles: true }));
        });

        // 2. Also trigger hover specifically on the actions container if it exists
        const actionsContainer = chatRow.querySelector('.actions-container');
        if (actionsContainer) {
            ['mouseenter', 'mouseover', 'mousemove'].forEach(evt => {
                actionsContainer.dispatchEvent(new MouseEvent(evt, { bubbles: true }));
            });
        }

        setTimeout(() => {
            clickButton(chatRow, errorElement);
        }, 500);
    } else {
        log("❌ Could not find <ms-chat-turn> parent.");
        isProcessing = false;
    }
}

function clickButton(container, errorElement) {
    // UPDATED SELECTORS based on your screenshot
    const selectors = [
        '.rerun-button',                        // The specific class from your screenshot
        'button[aria-label*="Rerun"]',          // fuzzy match: "Rerun this turn"
        'button[mattooltip*="Rerun"]'           // backup tooltip check
    ];

    let target = null;

    for (let sel of selectors) {
        const found = container.querySelector(sel);
        if (found) {
            log(`🎯 Target found via: ${sel}`);
            target = found;
            break;
        }
    }

    if (target) {
        log("⚡ CLICKING NOW...");
        
        // Highlight button so you see it happened
        target.style.border = "5px solid #00ff00";
        target.style.backgroundColor = "yellow";

        target.click();
        
        errorElement.style.border = "5px solid green";
        log("✅ SUCCESS. Button clicked.");
    } else {
        log("❌ Button STILL not found in this row.");
        // Debug: Print classes of all buttons found to help fix if this fails
        const buttons = container.querySelectorAll('button');
        log(`Found ${buttons.length} other buttons here.`);
    }
    
    isProcessing = false;
}

let timeout;
const observer = new MutationObserver((mutations) => {
    clearTimeout(timeout);
    timeout = setTimeout(scanForErrors, 800); 
});

observer.observe(document.body, { childList: true, subtree: true });