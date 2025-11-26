// controls.js - Input handling system (keyboard, mouse, touch)
import * as THREE from 'three';

// Keyboard state
export const keyboard = { 
    w: false, a: false, s: false, d: false, 
    shift: false, up: false, down: false, left: false, right: false,
    q: false, e: false
};

// Movement configuration
export const moveSpeed = 0.2;
export const sprintMultiplier = 2.0;

// Mouse controls
export let mouseX = 0, mouseY = 0;
export let pitch = 0, yaw = 0;
export const mouseSensitivity = 0.002;
export const maxPitch = Math.PI / 3;

// Pointer lock state
export let isPointerLocked = false;

// Mobile detection and touch controls
export let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export let touchControls = {
    joystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0, touchId: null },
    lookJoystick: { active: false, x: 0, y: 0, centerX: 0, centerY: 0, touchId: null }
};
export let activeTouches = new Map();
export let mobileActionButton = null;
export let currentAction = null;

// Initialize controls
export const initializeControls = (camera, canvas, shouldRotate180) => {
    // Apply 180° rotation if returning from bus travel
    if (shouldRotate180) {
        yaw = Math.PI;
    }
    
    setupKeyboardControls();
    setupMouseControls(canvas);
    
    if (isMobile) {
        setupTouchControls();
    }
};

// Keyboard controls
const setupKeyboardControls = () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'W') keyboard.w = true;
        if (e.key === 'a' || e.key === 'A') keyboard.a = true;
        if (e.key === 's' || e.key === 'S') keyboard.s = true;
        if (e.key === 'd' || e.key === 'D') keyboard.d = true;
        if (e.key === 'Shift') keyboard.shift = true;
        if (e.key === 'q' || e.key === 'Q') keyboard.q = true;
        if (e.key === 'e' || e.key === 'E') keyboard.e = true;
        if (e.key === 'ArrowUp') keyboard.up = true;
        if (e.key === 'ArrowDown') keyboard.down = true;
        if (e.key === 'ArrowLeft') keyboard.left = true;
        if (e.key === 'ArrowRight') keyboard.right = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'W') keyboard.w = false;
        if (e.key === 'a' || e.key === 'A') keyboard.a = false;
        if (e.key === 's' || e.key === 'S') keyboard.s = false;
        if (e.key === 'd' || e.key === 'D') keyboard.d = false;
        if (e.key === 'Shift') keyboard.shift = false;
        if (e.key === 'q' || e.key === 'Q') keyboard.q = false;
        if (e.key === 'e' || e.key === 'E') keyboard.e = false;
        if (e.key === 'ArrowUp') keyboard.up = false;
        if (e.key === 'ArrowDown') keyboard.down = false;
        if (e.key === 'ArrowLeft') keyboard.left = false;
        if (e.key === 'ArrowRight') keyboard.right = false;
    });
};

// Mouse controls
const setupMouseControls = (canvas) => {
    const onMouseMove = (event) => {
        if (isPointerLocked) {
            yaw -= event.movementX * mouseSensitivity;
            pitch -= event.movementY * mouseSensitivity;
            pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
        }
    };

    const onPointerLockChange = () => {
        isPointerLocked = document.pointerLockElement === canvas;
    };

    const onPointerLockError = () => {
        console.error('Pointer lock error');
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    canvas.addEventListener('click', () => {
        if (!isPointerLocked) {
            canvas.requestPointerLock();
        }
    });
};

// Touch controls
const setupTouchControls = () => {
    // Create mobile UI elements
    const joystickBase = document.createElement('div');
    joystickBase.style.cssText = `
        position: fixed; bottom: 20px; left: 20px;
        width: 80px; height: 80px; background: rgba(255,255,255,0.3);
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

    // Look joystick
    const lookJoystickBase = document.createElement('div');
    lookJoystickBase.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        width: 80px; height: 80px; background: rgba(100,150,255,0.3);
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

    // Mobile action button
    mobileActionButton = document.createElement('button');
    mobileActionButton.textContent = 'RUN';
    mobileActionButton.style.cssText = `
        position: fixed; bottom: 120px; right: 20px;
        width: 80px; height: 80px; background: rgba(128,128,128,0.8);
        color: white; border: 2px solid white; border-radius: 50%;
        font-size: 14px; font-weight: bold; z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(mobileActionButton);

    const findControlForTouch = (touch) => {
        const rect1 = joystickBase.getBoundingClientRect();
        const rect2 = lookJoystickBase.getBoundingClientRect();
        const rect3 = mobileActionButton.getBoundingClientRect();

        if (touch.clientX >= rect1.left && touch.clientX <= rect1.right &&
            touch.clientY >= rect1.top && touch.clientY <= rect1.bottom) {
            return 'movement';
        }
        if (touch.clientX >= rect2.left && touch.clientX <= rect2.right &&
            touch.clientY >= rect2.top && touch.clientY <= rect2.bottom) {
            return 'look';
        }
        if (touch.clientX >= rect3.left && touch.clientX <= rect3.right &&
            touch.clientY >= rect3.top && touch.clientY <= rect3.bottom) {
            return 'action';
        }
        return null;
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const control = findControlForTouch(touch);
            
            if (control === 'movement') {
                touchControls.joystick.active = true;
                touchControls.joystick.touchId = touch.identifier;
                const rect = joystickBase.getBoundingClientRect();
                touchControls.joystick.centerX = rect.left + rect.width / 2;
                touchControls.joystick.centerY = rect.top + rect.height / 2;
                touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
                touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
                updateJoystickPosition(joystickKnob);
            } else if (control === 'look') {
                touchControls.lookJoystick.active = true;
                touchControls.lookJoystick.touchId = touch.identifier;
                const rect = lookJoystickBase.getBoundingClientRect();
                touchControls.lookJoystick.centerX = rect.left + rect.width / 2;
                touchControls.lookJoystick.centerY = rect.top + rect.height / 2;
                touchControls.lookJoystick.x = touch.clientX - touchControls.lookJoystick.centerX;
                touchControls.lookJoystick.y = touch.clientY - touchControls.lookJoystick.centerY;
                updateLookJoystickPosition(lookJoystickKnob);
            }
        }
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            
            if (touchControls.joystick.active && touch.identifier === touchControls.joystick.touchId) {
                touchControls.joystick.x = touch.clientX - touchControls.joystick.centerX;
                touchControls.joystick.y = touch.clientY - touchControls.joystick.centerY;
                updateJoystickPosition(joystickKnob);
            }
            
            if (touchControls.lookJoystick.active && touch.identifier === touchControls.lookJoystick.touchId) {
                touchControls.lookJoystick.x = touch.clientX - touchControls.lookJoystick.centerX;
                touchControls.lookJoystick.y = touch.clientY - touchControls.lookJoystick.centerY;
                updateLookJoystickPosition(lookJoystickKnob);
            }
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        
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
    };

    const updateJoystickPosition = (knob) => {
        const maxDistance = 40;
        const distance = Math.sqrt(
            touchControls.joystick.x ** 2 + 
            touchControls.joystick.y ** 2
        );
        
        if (distance > maxDistance) {
            const angle = Math.atan2(touchControls.joystick.y, touchControls.joystick.x);
            touchControls.joystick.x = Math.cos(angle) * maxDistance;
            touchControls.joystick.y = Math.sin(angle) * maxDistance;
        }
        
        knob.style.transform = `translate(calc(-50% + ${touchControls.joystick.x}px), calc(-50% + ${touchControls.joystick.y}px))`;
    };

    const updateLookJoystickPosition = (knob) => {
        const maxDistance = 40;
        const distance = Math.sqrt(
            touchControls.lookJoystick.x ** 2 + 
            touchControls.lookJoystick.y ** 2
        );
        
        if (distance > maxDistance) {
            const angle = Math.atan2(touchControls.lookJoystick.y, touchControls.lookJoystick.x);
            touchControls.lookJoystick.x = Math.cos(angle) * maxDistance;
            touchControls.lookJoystick.y = Math.sin(angle) * maxDistance;
        }
        
        knob.style.transform = `translate(calc(-50% + ${touchControls.lookJoystick.x}px), calc(-50% + ${touchControls.lookJoystick.y}px))`;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
};

// Update camera position based on controls
export const updateCameraPosition = (camera, PLAZA_CONFIG = null, streetElements = null) => {
    // Store previous position for collision detection
    const previousPosition = camera.position.clone();
    
    // Handle keyboard movement
    const speed = keyboard.shift ? moveSpeed * sprintMultiplier : moveSpeed;
    
    const forward = new THREE.Vector3(
        Math.sin(yaw),
        0,
        Math.cos(yaw)
    ).normalize();
    
    const right = new THREE.Vector3(
        Math.sin(yaw + Math.PI / 2),
        0,
        Math.cos(yaw + Math.PI / 2)
    ).normalize();
    
    if (keyboard.w || keyboard.up) camera.position.addScaledVector(forward, -speed);
    if (keyboard.s || keyboard.down) camera.position.addScaledVector(forward, speed);
    if (keyboard.a || keyboard.left) camera.position.addScaledVector(right, -speed);
    if (keyboard.d || keyboard.right) camera.position.addScaledVector(right, speed);
    
    // Vertical movement (Q = down, E = up)
    if (keyboard.q) camera.position.y -= speed;
    if (keyboard.e) camera.position.y += speed;
    
    // Handle touch movement
    if (touchControls.joystick.active) {
        const joyX = touchControls.joystick.x / 40;
        const joyY = touchControls.joystick.y / 40;
        
        camera.position.addScaledVector(forward, -joyY * speed);
        camera.position.addScaledVector(right, joyX * speed);
    }
    
    // Handle touch look
    if (touchControls.lookJoystick.active) {
        const lookX = touchControls.lookJoystick.x / 40;
        const lookY = touchControls.lookJoystick.y / 40;
        
        yaw -= lookX * 0.05;
        pitch -= lookY * 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
    }
    
    // Apply camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    
    // Keep camera at reasonable height
    camera.position.y = Math.max(2, camera.position.y);
    
    // Collision detection for interior scenes only
    if (PLAZA_CONFIG && PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.interiorBounds) {
        const bounds = streetElements.interiorBounds;
        
        // Clamp camera position to interior bounds (prevents walking through walls)
        // This allows sliding along walls when hitting corners
        if (camera.position.x < bounds.minX) {
            camera.position.x = bounds.minX;
        } else if (camera.position.x > bounds.maxX) {
            camera.position.x = bounds.maxX;
        }
        
        if (camera.position.z < bounds.minZ) {
            camera.position.z = bounds.minZ;
        } else if (camera.position.z > bounds.maxZ) {
            camera.position.z = bounds.maxZ;
        }
        
        // Keep Y within bounds (though this is less critical for interior scenes)
        if (camera.position.y < bounds.minY) {
            camera.position.y = bounds.minY;
        } else if (camera.position.y > bounds.maxY) {
            camera.position.y = bounds.maxY;
        }
    }
};

// Update mobile action button
export const updateMobileActionButton = (actionType, actionText) => {
    if (!mobileActionButton) return;
    
    currentAction = actionType;
    mobileActionButton.textContent = actionText;
    
    // Update button color based on action
    const colors = {
        talk: 'rgba(255,100,100,0.8)',
        travel: 'rgba(100,255,100,0.8)',
        continue: 'rgba(255,255,100,0.8)',
        run: 'rgba(128,128,128,0.8)'
    };
    
    mobileActionButton.style.background = colors[actionType] || colors.run;
};

// Get mobile action button for event listeners
export const getMobileActionButton = () => mobileActionButton;

// Export setters for external modification
export const setPitch = (value) => { pitch = value; };
export const setYaw = (value) => { yaw = value; };
export const setCurrentAction = (value) => { currentAction = value; };

