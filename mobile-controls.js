// mobile-controls.js - Dedicated mobile UI and touch input (joysticks, action button)
// Separated from controls.js so desktop changes don't break mobile

const JOYSTICK_MAX = 40;
const JOYSTICK_SIZE = 80;
const BOTTOM_OFFSET = 20;
const SIDE_OFFSET = 20;

// Touch state - exposed for camera updates
let touchControls = {
    joystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0, touchId: null },
    lookJoystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0, touchId: null }
};

let mobileActionButton = null;
let currentActionType = 'run';
let sprintHeld = false;

// Get movement joystick state (normalized -1 to 1)
export const getMobileMovement = () => ({
    x: touchControls.joystick.active ? touchControls.joystick.x / JOYSTICK_MAX : 0,
    y: touchControls.joystick.active ? touchControls.joystick.y / JOYSTICK_MAX : 0
});

// Get sprint state (true when RUN button is held)
export const getMobileSprint = () => sprintHeld;

// Get look joystick state (normalized -1 to 1)
export const getMobileLook = () => ({
    x: touchControls.lookJoystick.active ? touchControls.lookJoystick.x / JOYSTICK_MAX : 0,
    y: touchControls.lookJoystick.active ? touchControls.lookJoystick.y / JOYSTICK_MAX : 0
});

// Update mobile action button label and color
export const updateMobileActionButton = (actionType, actionText) => {
    if (!mobileActionButton) return;
    currentActionType = actionType;
    mobileActionButton.textContent = actionText;
    const colors = {
        talk: 'rgba(255,100,100,0.8)',
        enter: 'rgba(100,200,255,0.8)',
        travel: 'rgba(100,255,100,0.8)',
        continue: 'rgba(255,255,100,0.8)',
        run: 'rgba(128,128,128,0.8)'
    };
    mobileActionButton.style.background = colors[actionType] || colors.run;
};

export const getMobileActionButton = () => mobileActionButton;

/**
 * Initialize mobile controls. Call with { onAction: () => handleActionInput() }
 * Layout: movement left, action center, look right (all bottom row)
 */
export const initializeMobileControls = (callbacks = {}) => {
    const { onAction } = callbacks;

    // Movement joystick - bottom-left
    const joystickBase = document.createElement('div');
    joystickBase.style.cssText = `
        position: fixed; bottom: ${BOTTOM_OFFSET}px; left: ${SIDE_OFFSET}px;
        width: ${JOYSTICK_SIZE}px; height: ${JOYSTICK_SIZE}px; background: rgba(255,255,255,0.3);
        border-radius: 50%; border: 2px solid white; z-index: 1000;
    `;
    document.body.appendChild(joystickBase);

    const joystickKnob = document.createElement('div');
    joystickKnob.style.cssText = `
        position: absolute; width: 40px; height: 40px;
        background: rgba(255,255,255,0.8); border-radius: 50%;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
    `;
    joystickBase.appendChild(joystickKnob);

    // Look joystick - bottom-right
    const lookJoystickBase = document.createElement('div');
    lookJoystickBase.style.cssText = `
        position: fixed; bottom: ${BOTTOM_OFFSET}px; right: ${SIDE_OFFSET}px;
        width: ${JOYSTICK_SIZE}px; height: ${JOYSTICK_SIZE}px; background: rgba(100,150,255,0.3);
        border-radius: 50%; border: 2px solid #6496FF; z-index: 1000;
    `;
    document.body.appendChild(lookJoystickBase);

    const lookJoystickKnob = document.createElement('div');
    lookJoystickKnob.style.cssText = `
        position: absolute; width: 40px; height: 40px;
        background: rgba(100,150,255,0.8); border-radius: 50%;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
    `;
    lookJoystickBase.appendChild(lookJoystickKnob);

    // Action button - center-bottom (between joysticks)
    mobileActionButton = document.createElement('button');
    mobileActionButton.textContent = 'RUN';
    mobileActionButton.style.cssText = `
        position: fixed; bottom: ${BOTTOM_OFFSET}px; left: 50%; transform: translateX(-50%);
        width: ${JOYSTICK_SIZE}px; height: ${JOYSTICK_SIZE}px; background: rgba(128,128,128,0.8);
        color: white; border: 2px solid white; border-radius: 50%;
        font-size: 14px; font-weight: bold; z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(mobileActionButton);

    if (onAction && typeof onAction === 'function') {
        let lastActionTime = 0;
        const fireAction = () => {
            const now = Date.now();
            if (now - lastActionTime < 350) return;
            lastActionTime = now;
            onAction();
            mobileActionButton.blur();
        };
        mobileActionButton.addEventListener('click', () => {
            if (currentActionType !== 'run') fireAction();
        });
        mobileActionButton.addEventListener('touchstart', (e) => {
            if (currentActionType === 'run') {
                sprintHeld = true;
                e.preventDefault();
            }
        }, { passive: false });
        mobileActionButton.addEventListener('touchend', (e) => {
            if (currentActionType === 'run') {
                sprintHeld = false;
            } else {
                fireAction();
            }
            e.preventDefault();
        }, { passive: false });
    }

    const findControlForTouch = (touch) => {
        const rect1 = joystickBase.getBoundingClientRect();
        const rect2 = lookJoystickBase.getBoundingClientRect();
        const rect3 = mobileActionButton.getBoundingClientRect();

        if (touch.clientX >= rect1.left && touch.clientX <= rect1.right &&
            touch.clientY >= rect1.top && touch.clientY <= rect1.bottom) return 'movement';
        if (touch.clientX >= rect2.left && touch.clientX <= rect2.right &&
            touch.clientY >= rect2.top && touch.clientY <= rect2.bottom) return 'look';
        if (touch.clientX >= rect3.left && touch.clientX <= rect3.right &&
            touch.clientY >= rect3.top && touch.clientY <= rect3.bottom) return 'action';
        return null;
    };

    const updateJoystickPosition = (knob, joystick) => {
        const distance = Math.sqrt(joystick.x ** 2 + joystick.y ** 2);
        if (distance > JOYSTICK_MAX) {
            const angle = Math.atan2(joystick.y, joystick.x);
            joystick.x = Math.cos(angle) * JOYSTICK_MAX;
            joystick.y = Math.sin(angle) * JOYSTICK_MAX;
        }
        knob.style.transform = `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))`;
    };

    const handleTouchStart = (e) => {
        let shouldPreventDefault = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const control = findControlForTouch(touch);

            if (control === 'movement') {
                shouldPreventDefault = true;
                touchControls.joystick.active = true;
                touchControls.joystick.touchId = touch.identifier;
                const rect = joystickBase.getBoundingClientRect();
                touchControls.joystick.centerX = rect.left + rect.width / 2;
                touchControls.joystick.centerY = rect.top + rect.height / 2;
                touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
                touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
                updateJoystickPosition(joystickKnob, touchControls.joystick);
            } else if (control === 'look') {
                shouldPreventDefault = true;
                touchControls.lookJoystick.active = true;
                touchControls.lookJoystick.touchId = touch.identifier;
                const rect = lookJoystickBase.getBoundingClientRect();
                touchControls.lookJoystick.centerX = rect.left + rect.width / 2;
                touchControls.lookJoystick.centerY = rect.top + rect.height / 2;
                touchControls.lookJoystick.x = touch.clientX - touchControls.lookJoystick.centerX;
                touchControls.lookJoystick.y = touch.clientY - touchControls.lookJoystick.centerY;
                updateJoystickPosition(lookJoystickKnob, touchControls.lookJoystick);
            }
        }
        if (shouldPreventDefault) e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (touchControls.joystick.active || touchControls.lookJoystick.active) e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touchControls.joystick.active && touch.identifier === touchControls.joystick.touchId) {
                touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
                touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
                updateJoystickPosition(joystickKnob, touchControls.joystick);
            }
            if (touchControls.lookJoystick.active && touch.identifier === touchControls.lookJoystick.touchId) {
                touchControls.lookJoystick.x = touch.clientX - touchControls.lookJoystick.centerX;
                touchControls.lookJoystick.y = touch.clientY - touchControls.lookJoystick.centerY;
                updateJoystickPosition(lookJoystickKnob, touchControls.lookJoystick);
            }
        }
    };

    const handleTouchEnd = (e) => {
        const hadJoystickActive = touchControls.joystick.active || touchControls.lookJoystick.active;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touchControls.joystick.active && touch.identifier === touchControls.joystick.touchId) {
                touchControls.joystick.active = false;
                touchControls.joystick.touchId = null;
                touchControls.joystick.x = 0;
                touchControls.joystick.y = 0;
                joystickKnob.style.transform = 'translate(-50%, -50%)';
            }
            if (touchControls.lookJoystick.active && touch.identifier === touchControls.lookJoystick.touchId) {
                touchControls.lookJoystick.active = false;
                touchControls.lookJoystick.touchId = null;
                touchControls.lookJoystick.x = 0;
                touchControls.lookJoystick.y = 0;
                lookJoystickKnob.style.transform = 'translate(-50%, -50%)';
            }
        }
        if (hadJoystickActive) e.preventDefault();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
};
