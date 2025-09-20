// utils.js - Shared utility functions
import * as THREE from 'three';

// Create wireframe material with color and optional opacity
export const createWireframeMaterial = (color = 0xFFFFFF, opacity = 1.0) => {
    return new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: opacity < 1.0,
        opacity: opacity
    });
};

// Other utility functions can go here as needed
export const getRandomColor = () => {
    return Math.floor(Math.random() * 0xFFFFFF);
};

export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};
