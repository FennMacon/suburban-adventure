// phone-ui.js - Retro flip phone UI for songs and items

import { getUnlockedSongs, getEncounteredItems, hasActiveConversation, resetGameProgress } from './dialogue.js';

let phoneUI = null;
let phoneButton = null;
let isPhoneOpen = false;

// Debug info state
let debugInfo = {
    scene: 'Loading...',
    time: '00:00',
    fps: 60,
    cameraPosition: { x: 0, y: 0, z: 0 },
    cameraSpeed: 0
};

// Create retro flip phone UI
export const initializePhoneUI = () => {
    // Create phone container
    phoneUI = document.createElement('div');
    phoneUI.id = 'phone-ui';
    phoneUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 400px;
        height: 600px;
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-radius: 20px;
        border: 8px solid #0a0a0a;
        box-shadow: 
            0 0 0 4px #3a3a3a,
            0 20px 40px rgba(0, 0, 0, 0.8),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        pointer-events: none;
        font-family: 'Courier New', monospace;
    `;
    
    // Create screen bezel
    const screenBezel = document.createElement('div');
    screenBezel.style.cssText = `
        flex: 1;
        margin: 20px;
        background: #000;
        border-radius: 8px;
        border: 4px solid #1a1a1a;
        box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            0 0 0 2px #3a3a3a;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    // Create screen header
    const screenHeader = document.createElement('div');
    screenHeader.style.cssText = `
        background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
        padding: 12px;
        border-bottom: 2px solid #3a3a3a;
        text-align: center;
        color: #88FFE6;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;
    screenHeader.textContent = 'SUBURBAN ADVENTURE';
    screenBezel.appendChild(screenHeader);
    
    // Create scrollable content area
    const contentArea = document.createElement('div');
    contentArea.id = 'phone-content';
    contentArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        color: #CCFFFF;
        font-size: 12px;
        line-height: 1.6;
    `;
    
    // Custom scrollbar styling
    contentArea.style.scrollbarWidth = 'thin';
    contentArea.style.scrollbarColor = '#3a3a3a #1a1a1a';
    
    // Webkit scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        #phone-content::-webkit-scrollbar {
            width: 8px;
        }
        #phone-content::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        #phone-content::-webkit-scrollbar-thumb {
            background: #3a3a3a;
            border-radius: 4px;
        }
        #phone-content::-webkit-scrollbar-thumb:hover {
            background: #4a4a4a;
        }
    `;
    document.head.appendChild(style);
    
    screenBezel.appendChild(contentArea);
    phoneUI.appendChild(screenBezel);
    
    // Create button area (bottom of phone)
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
        padding: 16px;
        display: flex;
        justify-content: center;
        gap: 12px;
        border-top: 2px solid #3a3a3a;
        background: linear-gradient(to top, #1a1a1a, #0a0a0a);
    `;
    
    // Create reset button (styled as retro phone button)
    const resetButton = document.createElement('button');
    resetButton.textContent = 'RESET';
    resetButton.style.cssText = `
        padding: 12px 24px;
        background: linear-gradient(to bottom, #4a2a2a, #3a1a1a);
        border: 2px solid #2a1a1a;
        border-radius: 8px;
        color: #FF8888;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
    
    resetButton.addEventListener('mouseenter', () => {
        resetButton.style.background = 'linear-gradient(to bottom, #5a3a3a, #4a2a2a)';
        resetButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
    });
    
    resetButton.addEventListener('mouseleave', () => {
        resetButton.style.background = 'linear-gradient(to bottom, #4a2a2a, #3a1a1a)';
        resetButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
    });
    
    resetButton.addEventListener('click', () => {
        // Confirm reset action
        if (confirm('Reset all unlocked songs and items? This cannot be undone.')) {
            resetGameProgress();
            updatePhoneContent();
            // Remove focus to prevent space bar from triggering the button
            resetButton.blur();
        }
    });
    
    // Create close button (styled as retro phone button)
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';
    closeButton.style.cssText = `
        padding: 12px 24px;
        background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
        border: 2px solid #1a1a1a;
        border-radius: 8px;
        color: #88FFE6;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'linear-gradient(to bottom, #4a4a4a, #3a3a3a)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'linear-gradient(to bottom, #3a3a3a, #2a2a2a)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
    });
    
    closeButton.addEventListener('click', () => {
        togglePhone();
        // Remove focus to prevent space bar from triggering the button
        closeButton.blur();
    });
    
    buttonArea.appendChild(resetButton);
    buttonArea.appendChild(closeButton);
    phoneUI.appendChild(buttonArea);
    
    document.body.appendChild(phoneUI);
    
    // Create on-screen toggle button (bottom-right corner)
    phoneButton = document.createElement('button');
    phoneButton.id = 'phone-toggle-button';
    // Create phone outline SVG icon
    phoneButton.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" style="stroke: white; fill: none; stroke-width: 2;">
            <rect x="8" y="4" width="16" height="24" rx="2" ry="2"/>
            <rect x="12" y="6" width="8" height="1" rx="0.5"/>
            <circle cx="16" cy="24" r="1.5"/>
        </svg>
    `;
    phoneButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        cursor: pointer;
        z-index: 1500;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
    `;
    
    phoneButton.addEventListener('mouseenter', () => {

        phoneButton.style.opacity = '0.8';
    });
    
    phoneButton.addEventListener('mouseleave', () => {

        phoneButton.style.opacity = '1';
    });
    
    phoneButton.addEventListener('click', () => {
        togglePhone();
        // Remove focus to prevent space bar from triggering the button
        phoneButton.blur();
    });
    
    document.body.appendChild(phoneButton);
    
    // Initialize content
    updatePhoneContent();
};

// Update phone content with current songs and items
const updatePhoneContent = () => {
    if (!phoneUI) return;
    
    const contentArea = phoneUI.querySelector('#phone-content');
    if (!contentArea) return;
    
    const songs = getUnlockedSongs();
    const items = getEncounteredItems();
    
    let html = '';
    
    // Info/Debug Section (at top)
    html += '<div style="margin-bottom: 24px;">';
    html += `<div style="color: #CCFFFF; margin-bottom: 6px;"><span style="color: #888;">Scene:</span> <span style="color: #00ff00; font-weight: bold;">${debugInfo.scene}</span></div>`;
    html += `<div style="color: #CCFFFF; margin-bottom: 6px;"><span style="color: #888;">Time:</span> <span style="color: #00ff00;">${debugInfo.time}</span></div>`;
    html += `<div style="color: #CCFFFF; margin-bottom: 6px;"><span style="color: #888;">FPS:</span> <span style="color: #00ff00;">${debugInfo.fps}</span></div>`;
    html += `<div style="color: #CCFFFF; margin-bottom: 6px;"><span style="color: #888;">Camera:</span> <span style="color: #00ff00; font-size: 10px;">${debugInfo.cameraPosition.x}, ${debugInfo.cameraPosition.y}, ${debugInfo.cameraPosition.z}</span></div>`;
    html += `<div style="color: #CCFFFF;"><span style="color: #888;">Speed:</span> <span style="color: #00ff00;">${debugInfo.cameraSpeed}</span> units/sec</div>`;
    html += '</div>';
    html += '</div>';
    
    // Songs Section
    html += '<div style="margin-bottom: 24px;">';
    
    if (songs.length === 0) {
        html += '<div style="color: #666; font-style: italic; padding: 16px 0;"></div>';
    } else {
        songs.forEach(song => {
            html += '<div style="margin-bottom: 12px; padding: 8px; background: rgba(58, 58, 58, 0.3); border-radius: 4px; border-left: 3px solid #88FFE6;">';
            html += `<div style="color: #CCFFFF; font-weight: bold; margin-bottom: 4px;">${song.unlockedBy} - ${song.name}</div>`;
            html += '</div>';
        });
    }
    
    html += '</div>';
    
    // Items Section
    html += '<div>';
    
    if (items.length === 0) {
        html += '<div style="color: #666; font-style: italic; padding: 16px 0;"></div>';
    } else {
        items.forEach(item => {
            html += '<div style="margin-bottom: 8px; padding: 8px; background: rgba(58, 58, 58, 0.3); border-radius: 4px; border-left: 3px solid #FFFF88;">';
            html += `<div style="color: #CCFFFF;">${item}</div>`;
            html += '</div>';
        });
    }
    
    html += '</div>';
    
    contentArea.innerHTML = html;
};

// Update debug info in phone UI
export const updatePhoneDebugInfo = (info) => {
    debugInfo = { ...debugInfo, ...info };
    // Only update content if phone is open (for performance)
    if (isPhoneOpen && phoneUI) {
        updatePhoneContent();
    }
};

// Get current debug info (for initial display)
export const getDebugInfo = () => {
    return { ...debugInfo };
};

// Toggle phone open/close
export const togglePhone = () => {
    // Don't open phone during active conversations
    if (!isPhoneOpen && hasActiveConversation()) {
        return;
    }
    
    isPhoneOpen = !isPhoneOpen;
    
    if (isPhoneOpen) {
        // Exit pointer lock to free the cursor
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Update content after opening (to ensure latest debug info is shown)
        updatePhoneContent();
        
        // Open phone
        phoneUI.style.pointerEvents = 'auto';
        phoneUI.style.transform = 'translate(-50%, -50%) scale(1)';
        phoneUI.style.opacity = '1';
        
        // Hide toggle button when phone is open
        if (phoneButton) {
            phoneButton.style.opacity = '0.5';
            phoneButton.style.pointerEvents = 'none';
        }
    } else {
        // Close phone
        phoneUI.style.transform = 'translate(-50%, -50%) scale(0)';
        phoneUI.style.opacity = '0';
        
        // Use setTimeout to disable pointer events after animation
        setTimeout(() => {
            phoneUI.style.pointerEvents = 'none';
        }, 300);
        
        // Show toggle button when phone is closed
        if (phoneButton) {
            phoneButton.style.opacity = '1';
            phoneButton.style.pointerEvents = 'auto';
        }
    }
};

// Initialize keyboard handler for '`' (backtick) key
export const initializePhoneKeyboard = () => {
    document.addEventListener('keydown', (event) => {
        // Only handle '`' (backtick) key
        if (event.key === '`' || event.key === 'Backquote') {
            // Don't toggle if typing in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            event.preventDefault();
            togglePhone();
        }
    });
};

// Export function to check if phone is open
export const getPhoneOpenState = () => {
    return isPhoneOpen;
};

