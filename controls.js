// controls.js - Desktop input only (keyboard, mouse)
// Mobile touch/joystick logic lives in mobile-controls.js
import * as THREE from 'three';
import { getMobileMovement, getMobileLook } from './mobile-controls.js';

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

// Mobile detection (used by main.js to branch desktop vs mobile init)
export let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize controls (desktop: keyboard + mouse; mobile: no-op, mobile-controls.js handles touch)
export const initializeControls = (camera, canvas, shouldRotate180) => {
    if (shouldRotate180) {
        yaw = Math.PI;
    }
    setupKeyboardControls();
    if (!isMobile) {
        setupMouseControls(canvas);
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

// Mouse controls (desktop only)
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

// Apply collision and height clamp (shared)
const applyCollisionAndBounds = (camera, PLAZA_CONFIG, streetElements) => {
    camera.position.y = Math.max(2, camera.position.y);
    if (PLAZA_CONFIG && PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.interiorBounds) {
        const bounds = streetElements.interiorBounds;
        camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
        camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
        camera.position.y = Math.max(bounds.minY, Math.min(bounds.maxY, camera.position.y));
    }
};

// Update camera - desktop path (keyboard only; mouse updates yaw/pitch in mousemove)
export const updateCameraPositionDesktop = (camera, PLAZA_CONFIG = null, streetElements = null) => {
    const speed = keyboard.shift ? moveSpeed * sprintMultiplier : moveSpeed;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2)).normalize();

    if (keyboard.w || keyboard.up) camera.position.addScaledVector(forward, -speed);
    if (keyboard.s || keyboard.down) camera.position.addScaledVector(forward, speed);
    if (keyboard.a || keyboard.left) camera.position.addScaledVector(right, -speed);
    if (keyboard.d || keyboard.right) camera.position.addScaledVector(right, speed);
    if (keyboard.q) camera.position.y -= speed;
    if (keyboard.e) camera.position.y += speed;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    applyCollisionAndBounds(camera, PLAZA_CONFIG, streetElements);
};

// Update camera - mobile path (touch joysticks)
export const updateCameraPositionMobile = (camera, PLAZA_CONFIG = null, streetElements = null) => {
    const speed = moveSpeed;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2)).normalize();

    const move = getMobileMovement();
    const look = getMobileLook();

    // Push up (screen Y decreases) => move.y negative => we want forward movement.
    // Desktop W uses addScaledVector(forward, -speed), so forward dir = -forward vector.
    // move.y negative (push up) => use positive coefficient for -forward => move.y * speed.
    camera.position.addScaledVector(forward, move.y * speed);
    camera.position.addScaledVector(right, move.x * speed);

    yaw -= look.x * 0.05;
    pitch -= look.y * 0.05;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    applyCollisionAndBounds(camera, PLAZA_CONFIG, streetElements);
};

// Unified entry - branches based on isMobile
export const updateCameraPosition = (camera, PLAZA_CONFIG = null, streetElements = null) => {
    if (isMobile) {
        updateCameraPositionMobile(camera, PLAZA_CONFIG, streetElements);
    } else {
        updateCameraPositionDesktop(camera, PLAZA_CONFIG, streetElements);
    }
};

// Export setters for external modification (used when restoring camera after scene switch)
export const setPitch = (value) => { pitch = value; };
export const setYaw = (value) => { yaw = value; };
