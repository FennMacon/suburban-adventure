// renderer.js - Rendering setup and post-processing
import * as THREE from 'three';

// Renderer configuration
const pixelRatio = 1.0;
let renderer, renderTarget, postBufferA, postBufferB;
let postCamera, postMaterial, postQuad, postScene;

// Initialize renderer
export const initializeRenderer = () => {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    document.body.appendChild(renderer.domElement);
    
    return renderer;
};

// Initialize post-processing
export const initializePostProcessing = () => {
    const renderTargetWidth = Math.floor(window.innerWidth * pixelRatio);
    const renderTargetHeight = Math.floor(window.innerHeight * pixelRatio);
    
    renderTarget = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight);
    
    postBufferA = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter
    });
    
    postBufferB = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter
    });
    
    postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    postMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: null },
            resolution: { value: new THREE.Vector2(renderTargetWidth, renderTargetHeight) },
            pixelSize: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform float pixelSize;
            varying vec2 vUv;
            
            void main() {
                vec2 dxy = pixelSize / resolution;
                vec2 coord = dxy * floor(vUv / dxy);
                gl_FragColor = texture2D(tDiffuse, coord);
            }
        `
    });
    
    const postPlane = new THREE.PlaneGeometry(2, 2);
    postQuad = new THREE.Mesh(postPlane, postMaterial);
    postScene = new THREE.Scene();
    postScene.add(postQuad);
    
    return {
        renderTarget,
        postBufferA,
        postBufferB,
        postCamera,
        postMaterial,
        postQuad,
        postScene
    };
};

// Render scene with post-processing
export const renderScene = (scene, camera) => {
    if (!renderer || !postMaterial || !postCamera || !postScene) {
        console.error('Renderer not initialized');
        return;
    }
    
    // Render scene to render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // Apply post-processing
    postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
};

// Handle window resize
export const handleResize = () => {
    if (!renderer) return;
    
    const renderTargetWidth = Math.floor(window.innerWidth * pixelRatio);
    const renderTargetHeight = Math.floor(window.innerHeight * pixelRatio);
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (renderTarget) {
        renderTarget.setSize(renderTargetWidth, renderTargetHeight);
    }
    if (postBufferA) {
        postBufferA.setSize(renderTargetWidth, renderTargetHeight);
    }
    if (postBufferB) {
        postBufferB.setSize(renderTargetWidth, renderTargetHeight);
    }
    if (postMaterial) {
        postMaterial.uniforms.resolution.value.set(renderTargetWidth, renderTargetHeight);
    }
};

// Get renderer instance
export const getRenderer = () => renderer;

// Get render targets
export const getRenderTargets = () => ({
    renderTarget,
    postBufferA,
    postBufferB
});

// Get post-processing elements
export const getPostProcessing = () => ({
    postCamera,
    postMaterial,
    postQuad,
    postScene
});

