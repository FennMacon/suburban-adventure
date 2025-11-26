// animation.js - Animation loop and time-based updates
import * as THREE from 'three';
import { updateNightSky } from './nightsky.js';
import { updateSkybox } from './skybox.js';
import { createWireframeMaterial } from './utils.js';

// Animation variables
export let time = 0;
let lastTime = 0;

// Get average frequency (simplified - no audio)
const getAverageFrequency = (start, end) => {
    return 0;
};

// Animate neon signs and lights
export const animateNeonSigns = (streetElements) => {
    time += 0.05;
    
    // Animate the KARAOKE sign letters with alternating colors
    if (streetElements.karaokeSigns) {
        streetElements.karaokeSigns.children.forEach((letter, index) => {
            const blinkSpeed = 0.5 + index * 0.1;
            const brightness = Math.sin(time * blinkSpeed) * 0.5 + 0.5;
            const baseColor = index % 2 === 0 ? 0xff0000 : 0x00ffff;
            
            const r = (baseColor >> 16) & 255;
            const g = (baseColor >> 8) & 255;
            const b = baseColor & 255;
            
            letter.material.color.setRGB(
                r / 255 * brightness,
                g / 255 * brightness,
                b / 255 * brightness
            );
        });
    }
    
    // Animate street lamp lights
    if (streetElements.streetLamps) {
        streetElements.streetLamps.forEach((lamp, index) => {
            const lightMesh = lamp.children[4];
            const pointLight = lamp.children[5];
            
            const baseIntensity = 0.8;
            const flickerSpeed = 0.1;
            const flickerAmount = 0.15;
            const flicker = baseIntensity + (Math.sin(time * flickerSpeed + index * 2.1) * flickerAmount) +
                           (Math.sin(time * flickerSpeed * 2.7 + index * 1.3) * flickerAmount * 0.5);
            
            const color = new THREE.Color(0xFF8C00);
            color.multiplyScalar(flicker);
            lightMesh.material.color.copy(color);
            pointLight.intensity = flicker;
        });
    }
    
    // Animate the bar building exterior walls with slow color changes
    if (streetElements.walls) {
        const slowTime = time * 0.05;
        
        const r = 0.25 + 0.25 * Math.sin(slowTime);
        const g = 0.25 + 0.25 * Math.sin(slowTime + Math.PI/2);
        const b = 0.6 + 0.3 * Math.sin(slowTime + Math.PI);
        
        streetElements.walls.forEach(wallSegment => {
            if (!wallSegment) return;
            
            wallSegment.traverse(child => {
                if (child.isMesh && child.material) {
                    if (child.material.wireframe && child.material.color) {
                        if (!child.userData.originalColor && child.material.color.clone) {
                            child.userData.originalColor = child.material.color.clone();
                        }
                        child.material.color.setRGB(r, g, b);
                    }
                }
            });
        });
        
        if (streetElements.glowGroup) {
            const glowR = b;
            const glowG = r;
            const glowB = g;
            
            streetElements.glowGroup.traverse(child => {
                if (child.isMesh && child.material && child.material.wireframe && child.material.color) {
                    child.material.color.setRGB(glowR, glowG, glowB);
                    
                    if (child.material.transparent) {
                        const opacity = 0.4 + 0.2 * Math.sin(slowTime * 1.5);
                        child.material.opacity = opacity;
                    }
                }
            });
        }
    }
};

// Animate cars
export const animateCars = (streetElements, createCar, getRandomCarColor) => {
    if (!streetElements.cars) return;
    
    const carPositions = {};
    
    // Move existing cars
    for (let i = streetElements.cars.length - 1; i >= 0; i--) {
        const car = streetElements.cars[i];
        const direction = car.userData.direction;
        const speed = direction === 'left' ? 0.05 : -0.05;
        const prevX = car.position.x;
        const newX = prevX + speed;
        
        // Remove cars that go off-screen
        if ((direction === 'left' && newX > 140) || 
            (direction === 'right' && newX < -140)) {
            streetElements.streetElementsGroup.remove(car);
            streetElements.cars.splice(i, 1);
            continue;
        }
        
        // Check for collisions
        let canMove = true;
        const carWidth = 2;
        const minSafeDistance = 3;
        
        Object.keys(carPositions).forEach(otherCarIndex => {
            if (parseInt(otherCarIndex) !== i) {
                const otherCarInfo = carPositions[otherCarIndex];
                const otherX = otherCarInfo.x;
                const otherZ = otherCarInfo.z;
                const otherDirection = otherCarInfo.direction;
                
                if (Math.abs(car.position.z - otherZ) < 1) {
                    if (direction === otherDirection) {
                        const distance = Math.abs(newX - otherX);
                        if (distance < minSafeDistance) {
                            canMove = false;
                        }
                    }
                }
            }
        });
        
        if (canMove) {
            car.position.x = newX;
        }
        
        carPositions[i] = {
            x: car.position.x,
            z: car.position.z,
            direction: direction
        };
    }
    
    // Spawn new cars
    const currentTime = time;
    const timeSinceLastSpawn = currentTime - (streetElements.lastCarSpawnTime || 0);
    const spawnInterval = 6 + Math.sin(time * 0.1) * 3;
    
    if (timeSinceLastSpawn > spawnInterval && streetElements.cars.length < 6) {
        const spawnLeft = !streetElements.lastSpawnedLeft;
        streetElements.lastSpawnedLeft = spawnLeft;
        
        let canSpawn = true;
        const spawnX = spawnLeft ? -140 : 140;
        const spawnZ = spawnLeft ? 2 : -2;
        
        Object.values(carPositions).forEach(carInfo => {
            const distance = Math.abs(carInfo.x - spawnX);
            if (Math.abs(carInfo.z - spawnZ) < 1 && distance < 10) {
                canSpawn = false;
            }
        });
        
        if (canSpawn) {
            const direction = spawnLeft ? 'left' : 'right';
            const newCar = createCar(spawnX, getRandomCarColor(), direction);
            newCar.position.z = spawnZ;
            streetElements.streetElementsGroup.add(newCar);
            streetElements.cars.push(newCar);
            streetElements.lastCarSpawnTime = currentTime;
        }
    }
};

// Animate campfire coals and smoke
export const animateCampfire = (streetElements) => {
    if (!streetElements.campfire) return;
    
    const campfire = streetElements.campfire;
    let smokeCount = 0;
    
    // Animate embers with glowing effect
    campfire.traverse((child) => {
        if (child.userData.isEmber && child.material) {
            const glowIntensity = 0.5 + 0.5 * Math.sin(time * 2 + child.position.x * 0.5);
            const redComponent = 0xFF * glowIntensity;
            const greenComponent = 0x45 * glowIntensity;
            const blueComponent = 0x00;
            
            child.material.color.setRGB(
                redComponent / 255,
                greenComponent / 255,
                blueComponent / 255
            );
        }
        
        // Animate smoke particles with realistic behavior
        if (child.userData.isSmoke && child.material) {
            smokeCount++;
            // Initialize smoke properties if not set
            if (!child.userData.smokeProperties) {
                child.userData.smokeProperties = {
                    initialSize: child.scale.x,
                    initialOpacity: child.material.opacity,
                    riseSpeed: 0.015 + Math.random() * 0.01, // Vary rise speed
                    driftSpeed: 0.005 + Math.random() * 0.005, // Vary drift speed
                    maxHeight: 12 + Math.random() * 4, // Vary max height
                    age: 0,
                    resetDelay: Math.random() * 8 // Stagger reset timing (0-8 seconds delay)
                };
            }
            
            const props = child.userData.smokeProperties;
            props.age += 0.016; // Increment age (assuming 60fps)
            
            // Rise upward with varying speed
            child.position.y += props.riseSpeed;
            
            // Add wind drift (more pronounced at higher altitudes)
            const windStrength = Math.min(child.position.y / 8, 1); // Wind increases with height
            child.position.x += (Math.sin(time * 0.3 + child.position.y * 0.1) * props.driftSpeed * windStrength);
            child.position.z += (Math.cos(time * 0.4 + child.position.y * 0.15) * props.driftSpeed * windStrength);
            
            // Calculate fade progress based on height and age
            const heightProgress = Math.min(child.position.y / props.maxHeight, 1);
            const ageProgress = Math.min(props.age / 8, 1); // Fade over 8 seconds
            const fadeProgress = Math.max(heightProgress, ageProgress);
            
            // Fade opacity as smoke rises and ages
            child.material.opacity = props.initialOpacity * (1 - fadeProgress);
            
            // Shrink size as smoke rises and disperses
            const shrinkProgress = fadeProgress;
            const currentSize = props.initialSize * (1 + shrinkProgress * 0.5); // Actually grows slightly as it disperses
            child.scale.setScalar(currentSize);
            
            // Reset when fully faded or too high - use staggered timing for consistent smoke
            const shouldReset = child.position.y > props.maxHeight * 0.7 || 
                               child.material.opacity <= 0.03 || 
                               (props.age > (8 + props.resetDelay));
            
            if (shouldReset) {
                // Reset to bottom with new random properties
                child.position.y = 1 + Math.random() * 0.5;
                child.position.x = (Math.random() - 0.5) * 1.5;
                child.position.z = (Math.random() - 0.5) * 1.5;
                
                // Reset properties with proper initial size
                props.initialSize = 0.4 + Math.random() * 0.3; // Start with proper size
                props.initialOpacity = 0.2 + Math.random() * 0.2;
                props.riseSpeed = 0.015 + Math.random() * 0.01;
                props.driftSpeed = 0.005 + Math.random() * 0.005;
                props.maxHeight = 12 + Math.random() * 4;
                props.age = 0;
                props.resetDelay = Math.random() * 8; // New random delay for next reset
                
                // Apply new properties
                child.scale.setScalar(props.initialSize);
                child.material.opacity = props.initialOpacity;
            }
        }
    });
    
};

// Animate pond mist particles
export const animatePondMist = (streetElements) => {
    if (!streetElements.pond) return;
    
    const pond = streetElements.pond;
    
    // Animate mist particles with gentle floating behavior
    pond.traverse((child) => {
        if (child.userData.isMist && child.material) {
            // Initialize mist properties if not set
            if (!child.userData.mistProperties) {
                child.userData.mistProperties = {
                    initialSize: child.scale.x,
                    initialOpacity: child.material.opacity,
                    floatSpeed: 0.003 + Math.random() * 0.002, // Gentle floating speed
                    driftSpeed: 0.002 + Math.random() * 0.002, // Slow drift
                    maxHeight: 8 + Math.random() * 3, // Lower max height than smoke
                    age: Math.random() * 10, // Start with random age to stagger timing
                    resetDelay: Math.random() * 15 // Longer reset delay for slower pace
                };
            }
            
            const props = child.userData.mistProperties;
            props.age += 0.016; // Increment age (assuming 60fps)
            
            // Gentle floating upward
            child.position.y += props.floatSpeed;
            
            // Add subtle drift
            child.position.x += (Math.sin(time * 0.2 + child.position.y * 0.05) * props.driftSpeed);
            child.position.z += (Math.cos(time * 0.25 + child.position.y * 0.03) * props.driftSpeed);
            
            // Calculate fade progress based on height and age
            const heightProgress = Math.min(child.position.y / props.maxHeight, 1);
            const ageProgress = Math.min(props.age / 12, 1); // Fade over 12 seconds
            const fadeProgress = Math.max(heightProgress, ageProgress);
            
            // Fade opacity as mist rises and ages
            child.material.opacity = props.initialOpacity * (1 - fadeProgress); // Keep some opacity
            
            // Slightly grow as mist disperses
            const currentSize = props.initialSize * (1 + fadeProgress * 0.3);
            child.scale.setScalar(currentSize);
            
            // Reset when fully faded or too high - use staggered timing for consistent mist
            const shouldReset = child.position.y > props.maxHeight * 0.7 || 
                               child.material.opacity <= 0.0 || // Only reset when almost completely transparent
                               (props.age > (15 + props.resetDelay));
            
            if (shouldReset) {
                // Reset to bottom with new random properties - spread around pond perimeter
                child.position.y = 0.3 + Math.random() * 0.5;
                const resetAngle = Math.random() * Math.PI * 2;
                const resetDistance = 10 + Math.random() * 8;
                child.position.x = Math.cos(resetAngle) * resetDistance;
                child.position.z = Math.sin(resetAngle) * resetDistance;
                
                // Reset properties with proper initial size
                props.initialSize = 0.4 + Math.random() * 0.4; // Start with proper size (0.4-0.8)
                props.initialOpacity = 0.3 + Math.random() * 0.2;
                props.floatSpeed = 0.003 + Math.random() * 0.002;
                props.driftSpeed = 0.002 + Math.random() * 0.002;
                props.maxHeight = 8 + Math.random() * 3;
                props.age = 0;
                props.resetDelay = Math.random() * 12; // New random delay for next reset
                
                // Apply new properties
                child.scale.setScalar(props.initialSize);
                child.material.opacity = props.initialOpacity;
            }
        }
    });
};

// Animate campsite objects with warm glow and pulse
export const animateCampsiteGlow = (streetElements) => {
    if (!streetElements.campsiteObjects) return;
    
    const campsiteObjects = streetElements.campsiteObjects;
    
    campsiteObjects.forEach((obj, index) => {
        if (!obj) return;
        
        // Create pulsing effect based on proximity to campfire
        // Objects closer to campfire (lower index) glow faster and more intensely
        const pulseSpeed = 0.8 - (index * 0.03); // Closer objects pulse faster
        const baseIntensity = 0.5 - (index * 0.01); // Closer objects glow more intensely
        const pulseIntensity = baseIntensity + 0.2 * Math.sin(time * pulseSpeed + index * 0.5);
        
        // Traverse the object to find all meshes
        obj.traverse((child) => {
            if (child.isMesh && child.material && child.material.wireframe) {
                // Store original color if not already stored
                if (!child.userData.originalColor) {
                    child.userData.originalColor = child.material.color.clone();
                }
                
                // Create warm glow effect
                const originalColor = child.userData.originalColor;
                const glowMultiplier = 1.0 + pulseIntensity;
                
                // Add warm tones (more red/orange/yellow)
                const warmR = Math.min(1.0, originalColor.r * glowMultiplier + pulseIntensity * 0.2);
                const warmG = Math.min(1.0, originalColor.g * glowMultiplier + pulseIntensity * 0.1);
                const warmB = Math.min(1.0, originalColor.b * glowMultiplier);
                
                child.material.color.setRGB(warmR, warmG, warmB);
                
                // No scale changes - just color glow
            }
        });
    });
    
};

// Animate clouds - similar to endless-road implementation
export const animateClouds = (streetElements, camera) => {
    if (!streetElements.pondElements || !streetElements.pondElements.clouds) return;
    
    const clouds = streetElements.pondElements.clouds;
    
    clouds.forEach(cloud => {
        if (!cloud || !cloud.userData) return;
        
        // Move cloud forward slowly (relative to camera movement)
        // In this environment, clouds move slowly relative to camera
        cloud.position.z += 0.01; // Slow forward movement
        
        // Gentle sideways drift using sine wave
        cloud.position.x = cloud.userData.originalX + Math.sin(Date.now() * 0.0001) * 10;
        
        // Check bounds BEFORE calculating opacity to prevent full-opacity flash
        let wasReset = false;
        
        // Constrain cloud to bounds (-100 to 100 on x and z relative to camera)
        const relativeZ = cloud.position.z - camera.position.z;
        if (relativeZ < -100 || relativeZ > 100) {
            // Reset to be ahead of camera but within -100 to 100 range relative to camera
            cloud.position.z = camera.position.z - 100 + Math.random() * 50; // Ahead of camera, within bounds
            cloud.userData.originalX = (Math.random() - 0.5) * 200; // Match initial bounds (-100 to 100)
            cloud.position.x = cloud.userData.originalX;
            
            // Reset fade phase to start at 0 opacity (sin(-π/2) = -1, which gives fadeValue = 0)
            // Add random offset for staggered timing, but ensure it starts near 0 opacity
            cloud.userData.fadePhase = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Start near -π/2 for 0 opacity
            wasReset = true;
        }
        
        // Also constrain x position to stay within bounds
        const relativeX = cloud.position.x;
        if (relativeX < -100 || relativeX > 100) {
            cloud.userData.originalX = (Math.random() - 0.5) * 200;
            cloud.position.x = cloud.userData.originalX;
            
            // Reset fade phase to start at 0 opacity when repositioning
            cloud.userData.fadePhase = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Start near -π/2 for 0 opacity
            wasReset = true;
        }
        
        // Animate opacity fade in/out with varying speeds for staggered effect
        // Fade from 0.0 to maxOpacity and back to 0.0
        // Only increment fadePhase if cloud wasn't just reset (to prevent jump)
        if (!wasReset) {
            cloud.userData.fadePhase += cloud.userData.fadeSpeed;
        }
        const fadeValue = (Math.sin(cloud.userData.fadePhase) + 1) / 2; // 0 to 1
        const opacity = cloud.userData.maxOpacity * fadeValue; // Fade from 0.0 to maxOpacity and back to 0.0
        
        // Apply opacity to all particles in the cloud
        cloud.children.forEach(particle => {
            if (particle.material) {
                particle.material.opacity = opacity;
            }
        });
    });
};

// Animate floating donut circles inside interiors
const animateFloatingDonuts = (scene, deltaTime) => {
    if (!scene || !scene.userData || !scene.userData.floatingDonutGroups) return;
    
    const groups = scene.userData.floatingDonutGroups.filter(group => group && group.parent);
    scene.userData.floatingDonutGroups = groups;
    
    groups.forEach((group) => {
        group.children.forEach((child) => {
            const donutData = child.userData && child.userData.floatingDonut;
            if (!donutData) return;
            
            const orbitSpeed = donutData.orbitSpeed || 0;
            const spinSpeed = donutData.spinSpeed || 0;
            const spinAxis = donutData.spinAxis || 'y';
            const floatFrequency = donutData.floatFrequency || 1;
            const floatAmplitude = donutData.floatAmplitude || 0;
            const floatPhase = donutData.floatPhase || 0;
            const radius = donutData.radius || 4;
            const baseHeight = donutData.height || 2;
            
            const deltaAngle = orbitSpeed * (deltaTime || 0);
            donutData.orbitAngle = (donutData.orbitAngle || 0) + deltaAngle;
            
            child.position.x = Math.cos(donutData.orbitAngle) * radius;
            child.position.z = Math.sin(donutData.orbitAngle) * radius;
            child.position.y = baseHeight + Math.sin(time * floatFrequency + floatPhase) * floatAmplitude;
            
            const spinDelta = spinSpeed * (deltaTime || 0);
            if (spinAxis === 'x') {
                child.rotation.x += spinDelta;
            } else if (spinAxis === 'y') {
                child.rotation.y += spinDelta;
            } else if (spinAxis === 'z') {
                child.rotation.z += spinDelta;
            } else {
                child.rotation.y += spinDelta;
            }

            child.children.forEach((subChild) => {
                const frostingData = subChild.userData && subChild.userData.frostingSpin;
                if (frostingData) {
                    const frostingDelta = frostingData.speed * (deltaTime || 0);
                    switch (frostingData.axis) {
                        case 'x':
                            subChild.rotation.x += frostingDelta;
                            break;
                        case 'y':
                            subChild.rotation.y += frostingDelta;
                            break;
                        case 'z':
                            subChild.rotation.z += frostingDelta;
                            break;
                        default:
                            subChild.rotation.y += frostingDelta;
                            break;
                    }
                }

                const sprinkleData = subChild.userData && subChild.userData.sprinkleSpin;
                if (sprinkleData) {
                    const sprinkleDelta = sprinkleData.speed * (deltaTime || 0);
                    switch (sprinkleData.axis) {
                        case 'x':
                            subChild.rotation.x += sprinkleDelta;
                            break;
                        case 'y':
                            subChild.rotation.y += sprinkleDelta;
                            break;
                        case 'z':
                            subChild.rotation.z += sprinkleDelta;
                            break;
                        default:
                            subChild.rotation.z += sprinkleDelta;
                            break;
                    }
                }
            });
        });
    });
};

// Animate rotating hanger systems in dry cleaners
const animateRotatingHangerSystems = (scene, deltaTime) => {
    if (!scene || !scene.userData || !scene.userData.rotatingHangerSystems) return;
    
    const systems = scene.userData.rotatingHangerSystems.filter(system => system && system.parent);
    scene.userData.rotatingHangerSystems = systems;
    
    systems.forEach((system) => {
        const rotationSpeed = system.userData.rotationSpeed || 0.5;
        system.rotation.y += rotationSpeed * (deltaTime || 0.016);
    });
};

// Animate spinning counter flowers in flower shop
export const animateCounterFlowers = (scene, deltaTime) => {
    if (!scene || !scene.userData || !scene.userData.counterFlowers) return;
    
    const flowers = scene.userData.counterFlowers.filter(flower => flower && flower.parent);
    scene.userData.counterFlowers = flowers;
    
    flowers.forEach((flower) => {
        // Store rotation speed and axis in userData if not already set (so it doesn't change every frame)
        // Each flower gets a completely random speed between 0.5 and 2.0 rotations per second
        if (!flower.userData.rotationSpeed) {
            flower.userData.rotationSpeed = 0.5 + Math.random() * 1.5;
        }
        // Randomly select rotation axis (x, y, or z) for each flower
        if (!flower.userData.rotationAxis) {
            const axes = ['x', 'y', 'z'];
            flower.userData.rotationAxis = axes[Math.floor(Math.random() * 3)];
        }
        
        // Rotate around the selected axis
        const rotationDelta = flower.userData.rotationSpeed * (deltaTime || 0.016);
        if (flower.userData.rotationAxis === 'x') {
            flower.rotation.x += rotationDelta;
        } else if (flower.userData.rotationAxis === 'y') {
            flower.rotation.y += rotationDelta;
        } else if (flower.userData.rotationAxis === 'z') {
            flower.rotation.z += rotationDelta;
        }
    });
};

// Animate bus
// Animate coffee pot steam
export const animateCoffeeSteam = (scene, deltaTime) => {
    scene.traverse((object) => {
        if (object.userData && object.userData.steamParticles) {
            const steamParticles = object.userData.steamParticles;
            const time = getTime();
            
            steamParticles.forEach((particle) => {
                // Calculate rise based on time and speed (looping)
                // Use smaller maxHeight for mug steam (check if this is a mug steam group)
                const isMugSteam = object.userData && object.userData.isMugSteamGroup;
                const maxHeight = isMugSteam ? 1.0 : 2; // Smaller max height for mug steam
                const riseAmount = (time * particle.userData.speed + particle.userData.offset) % maxHeight;
                particle.position.y = particle.userData.initialY + riseAmount;
                
                // Reset x/z to initial position when looping (to prevent drift)
                if (riseAmount < 0.05) {
                    particle.position.x = particle.userData.initialX || (Math.random() - 0.5) * 0.15;
                    particle.position.z = particle.userData.initialZ || (Math.random() - 0.5) * 0.15;
                    if (!particle.userData.initialX) {
                        particle.userData.initialX = particle.position.x;
                        particle.userData.initialZ = particle.position.z;
                    }
                }
                
                // Gradual fade out as it rises - properly calculated based on maxHeight
                // heightRatio represents how far along the maxHeight the particle has traveled (0 to 1)
                const heightRatio = riseAmount / maxHeight;
                
                // Start fading at 40% of maxHeight, fully faded by 100% of maxHeight
                const fadeStartRatio = 0.4; // Start fading at 40% of max height
                const maxOpacity = 0.3; // Maximum opacity at the start
                
                let opacity = maxOpacity;
                if (heightRatio > fadeStartRatio) {
                    // Smooth fade from fadeStartRatio to 1.0
                    // fadeProgress goes from 0 (at fadeStartRatio) to 1 (at maxHeight)
                    const fadeProgress = (heightRatio - fadeStartRatio) / (1.0 - fadeStartRatio);
                    // Opacity decreases smoothly from maxOpacity to 0
                    opacity = maxOpacity * (1 - fadeProgress);
                }
                opacity = Math.max(0, Math.min(maxOpacity, opacity)); // Clamp between 0 and maxOpacity
                
                if (particle.material) {
                    // Update the uniform value for shader materials
                    if (particle.material.uniforms && particle.material.uniforms.opacity) {
                        particle.material.uniforms.opacity.value = opacity;
                    } else {
                        // Fallback for non-shader materials
                        particle.material.opacity = opacity;
                    }
                    particle.material.transparent = true;
                }
                
                // Scale up slightly as it rises
                const scale = particle.userData.baseScale * (1 + heightRatio * 0.5);
                particle.scale.set(scale, scale, scale);
                
                // Slight horizontal drift (wispy movement)
                if (particle.userData.initialX !== undefined) {
                    particle.position.x = particle.userData.initialX + Math.sin(time * 0.5 + particle.userData.offset) * 0.05 * heightRatio;
                    particle.position.z = particle.userData.initialZ + Math.cos(time * 0.5 + particle.userData.offset) * 0.05 * heightRatio;
                }
            });
        }
    });
};

export const animateBus = (streetElements) => {
    if (!streetElements.bus) return;
    
    const bus = streetElements.bus;
    const speed = bus.userData.speed || 0.03;
    
    if (bus.userData.direction === 'left') {
        bus.position.x += speed;
        if (bus.position.x > 140) bus.position.x = -140;
    } else {
        bus.position.x -= speed;
        if (bus.position.x < -140) bus.position.x = 140;
        
        // Stop briefly at bus stop
        const busStopX = -15;
        if (Math.abs(bus.position.x - busStopX) < 1) {
            bus.userData.speed = 0.005;
        } else {
            bus.userData.speed = 0.03;
        }
    }
};

// Main animation loop
export const createAnimationLoop = (
    scene, 
    camera, 
    renderer, 
    renderTarget,
    postMaterial,
    postScene,
    postCamera,
    streetElements,
    updateCameraPosition,
    checkNearbyNPCs,
    checkNearbyItems,
    checkBusStopProximity,
    updateMobileActionButton,
    createCar,
    getRandomCarColor,
    updateDebugInfo
) => {
    
    const animate = (currentTime) => {
        requestAnimationFrame(animate);
        
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        time += 0.05;
        
        // Update camera and controls
        updateCameraPosition();
        
        // Update debug info
        if (updateDebugInfo) {
            updateDebugInfo(camera, null);
        }
        
        // Check interactions
        checkNearbyNPCs();
        if (checkNearbyItems) {
            checkNearbyItems();
        }
        checkBusStopProximity();
        updateMobileActionButton();
        
        // Update animations
        animateFloatingDonuts(scene, deltaTime);
        animateRotatingHangerSystems(scene, deltaTime);
        animateCounterFlowers(scene, deltaTime);
        animateNeonSigns(streetElements);
        animateCars(streetElements, createCar, getRandomCarColor);
        animateBus(streetElements);
        animateCampfire(streetElements);
        animatePondMist(streetElements);
        animateCampsiteGlow(streetElements);
        animateClouds(streetElements, camera);
        animateCoffeeSteam(scene, deltaTime);
        updateNightSky(scene, time);
        updateSkybox(scene, time);
        
        // Render with post-processing (simple pixelation effect)
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        
        // Apply pixelation effect
        postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
        
        // Render to screen
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);
    };
    
    return animate;
};

// Export time getter
export const getTime = () => time;

