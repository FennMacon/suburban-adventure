// buildings.js - Building creation and management
import * as THREE from 'three';
import { createWireframeMaterial } from './utils.js';

export const INTERIOR_TARGET_SIZE = 50;
const INTERIOR_BASE_SIZE = 50;
const INTERIOR_SCALE = INTERIOR_TARGET_SIZE / INTERIOR_BASE_SIZE;

const applyInteriorScale = (group) => {
    if (!group) return;
    group.scale.set(INTERIOR_SCALE, 1, INTERIOR_SCALE);
};

const createInteriorBounds = (baseWidth, baseDepth, margin, wallHeight) => {
    const scaledWidth = baseWidth * INTERIOR_SCALE;
    const scaledDepth = baseDepth * INTERIOR_SCALE;
    return {
        minX: -scaledWidth / 2 + margin,
        maxX: scaledWidth / 2 - margin,
        minZ: -scaledDepth / 2 + margin,
        maxZ: scaledDepth / 2 - margin,
        minY: 0,
        maxY: wallHeight
    };
};

const compressInteriorToBounds = (group, storeWidth, storeDepth) => {
    if (!group) return;
    const halfWidth = storeWidth / 2 - 1;
    const halfDepth = storeDepth / 2 - 1;
    
    group.traverse((child) => {
        if (!child || !child.position) return;
        if (child.userData && child.userData.isStructural) return;
        if (child.userData && child.userData.keepPosition) return;
        
        const px = child.position.x;
        const pz = child.position.z;
        
        const xRatio = Math.abs(px) > halfWidth && Math.abs(px) > 0 ? halfWidth / Math.abs(px) : 1;
        const zRatio = Math.abs(pz) > halfDepth && Math.abs(pz) > 0 ? halfDepth / Math.abs(pz) : 1;
        const ratio = Math.min(xRatio, zRatio);
        
        if (ratio < 1) {
            child.position.x *= ratio;
            child.position.z *= ratio;
        }
    });
};

const markStructural = (object) => {
    if (!object) return;
    if (!object.userData) {
        object.userData = {};
    }
    object.userData.isStructural = true;
};

// Create a building facade with different styles
export const createBuildingFacade = (width, height, depth, style, signText, signColor = 0xFFFFFF) => {
    const buildingGroup = new THREE.Group();
    
    // Building dimensions
    const wallThickness = 0.3;
    
    // Base colors for different building types
    const buildingColors = {
        convenience: 0x888888,
        pizza: 0xFF6600,
        clothing: 0x9966CC,
        drycleaner: 0x4169E1,
        coffee: 0xD2691E,
        flowers: 0x228B22,
        groton_church: 0xF5F5DC,
        groton_townhall: 0x8B4513,
        groton_colonial: 0xDEB887,
        groton_house: 0xA0522D,
        hospital: 0xE6E6FA,
        graveyard: 0x2F4F4F
    };
    
    const roofColors = {
        groton_church: 0x708090,
        groton_townhall: 0x2F4F4F,
        groton_colonial: 0x8B4513,
        groton_house: 0x696969,
        default: 0x654321
    };
    
    const baseColor = buildingColors[style] || 0x888888;
    const roofColor = roofColors[style] || roofColors.default;

    // Special exterior treatment for the graveyard: no traditional facade, just grounds.
    if (style === 'graveyard') {
        buildingGroup.name = "GraveyardExterior";

        const halfWidth = width / 2;
        const halfDepth = depth / 2;

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(width, depth);
        const groundMaterial = createWireframeMaterial(0x2E5D30);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0.01, -halfDepth);
        buildingGroup.add(ground);

        // Central path
        const pathGeometry = new THREE.PlaneGeometry(width * 0.35, depth * 0.85);
        const pathMaterial = createWireframeMaterial(0x3E3A32);
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.02, -halfDepth * 0.85);
        buildingGroup.add(path);

        // Perimeter fence (low)
        const fenceMaterial = createWireframeMaterial(0x4A4A4A);
        const fenceHeight = 1.4;

        const createFenceSection = (w, h, x, z, orientation) => {
            const fenceGeometry = new THREE.BoxGeometry(w, 0.6, 0.12);
            const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
            fence.position.set(x, fenceHeight * 0.35, z);
            fence.rotation.y = orientation;
            return fence;
        };

        // Front fence pieces with gate gap
        const frontOffset = 0.4;
        const gateWidth = width * 0.35;
        const sideLength = (width - gateWidth) / 2 - 0.4;
        if (sideLength > 0) {
            const frontLeftFence = createFenceSection(sideLength, 0.6, -gateWidth / 2 - sideLength / 2 - frontOffset, 0.15, 0);
            buildingGroup.add(frontLeftFence);
            const frontRightFence = createFenceSection(sideLength, 0.6, gateWidth / 2 + sideLength / 2 + frontOffset, 0.15, 0);
            buildingGroup.add(frontRightFence);
        }

        // Back fence
        const backFence = createFenceSection(width - 0.6, 0.6, 0, -depth + 0.3, 0);
        buildingGroup.add(backFence);

        // Side fences
        const sideFenceGeometry = new THREE.BoxGeometry(depth - 0.6, 0.6, 0.12);
        const leftFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
        leftFence.rotation.y = Math.PI / 2;
        leftFence.position.set(-halfWidth + 0.3, fenceHeight * 0.35, -halfDepth);
        buildingGroup.add(leftFence);
        const rightFence = leftFence.clone();
        rightFence.position.x = halfWidth - 0.3;
        buildingGroup.add(rightFence);

        // Gate posts & arch
        const gateGroup = new THREE.Group();
        const gatePostGeometry = new THREE.BoxGeometry(0.4, 2.2, 0.4);
        const gatePostMaterial = createWireframeMaterial(0x5A5A5A);
        const leftGatePost = new THREE.Mesh(gatePostGeometry, gatePostMaterial);
        leftGatePost.position.set(-gateWidth / 2 + 0.4, 1.1, 0.15);
        gateGroup.add(leftGatePost);
        const rightGatePost = new THREE.Mesh(gatePostGeometry, gatePostMaterial);
        rightGatePost.position.set(gateWidth / 2 - 0.4, 1.1, 0.15);
        gateGroup.add(rightGatePost);
        const gateArchGeometry = new THREE.TorusGeometry(gateWidth / 2 - 0.4, 0.12, 8, 16, Math.PI);
        const gateArchMaterial = createWireframeMaterial(0x5A5A5A);
        const gateArch = new THREE.Mesh(gateArchGeometry, gateArchMaterial);
        gateArch.rotation.x = Math.PI / 2;
        gateArch.position.set(0, 2.35, 0.15);
        gateGroup.add(gateArch);
        buildingGroup.add(gateGroup);

        // Gravestones (artfully arranged clusters)
        const stoneMaterial = createWireframeMaterial(0x9C9C9C);
        const stoneGeometry = new THREE.BoxGeometry(0.6, 1.1, 0.2);
        const gravePositions = [
            { x: -width * 0.32, z: -halfDepth * 0.45 },
            { x: -width * 0.18, z: -halfDepth * 0.52 },
            { x: width * 0.22, z: -halfDepth * 0.48 },
            { x: width * 0.34, z: -halfDepth * 0.62 },
            { x: -width * 0.28, z: -halfDepth * 0.7 },
            { x: width * 0.12, z: -halfDepth * 0.68 },
            { x: -width * 0.05, z: -halfDepth * 0.36 },
            { x: width * 0.3, z: -halfDepth * 0.32 }
        ];

        gravePositions.forEach(({ x: gx, z: gz }, index) => {
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            stone.scale.y = 0.8 + (index % 3) * 0.2;
            stone.position.set(gx, stone.scale.y * 0.55, gz);
            stone.rotation.y = (Math.random() - 0.5) * 0.25;
            buildingGroup.add(stone);
        });

        // Central memorial
        const memorialBase = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.4, 2.4),
            createWireframeMaterial(0x7E6F5A)
        );
        memorialBase.position.set(0, 0.2, -halfDepth * 0.55);
        buildingGroup.add(memorialBase);

        const memorialColumn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8),
            createWireframeMaterial(0x8F7F6A)
        );
        memorialColumn.position.set(0, 1.1, -halfDepth * 0.55);
        buildingGroup.add(memorialColumn);

        const memorialGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            createGlowingWireframeMaterial(0xBBAAFF, 0.8, 0.6)
        );
        memorialGlow.position.set(0, 2.2, -halfDepth * 0.55);
        buildingGroup.add(memorialGlow);

        // Small trees for silhouette
        const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.2, 6);
        const foliageGeometry = new THREE.ConeGeometry(1.4, 3, 8);
        const trunkMaterial = createWireframeMaterial(0x5B3A29);
        const foliageMaterial = createWireframeMaterial(0x2F6B3A);

        const treePositions = [
            { x: -width * 0.42, z: -halfDepth * 0.82 },
            { x: width * 0.35, z: -halfDepth * 0.78 }
        ];
        treePositions.forEach(({ x: tx, z: tz }) => {
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(tx, 1.1, tz);
            buildingGroup.add(trunk);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(tx, 2.8, tz);
            buildingGroup.add(foliage);
        });

        return buildingGroup;
    }
    
    // Main building structure
    // Create front wall group
    const frontWallGroup = new THREE.Group();
    const wallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
    const wallMaterial = createWireframeMaterial(baseColor);
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, height/2, 0);
    frontWallGroup.add(frontWall);
    
    // Create side walls
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2, height/2, -depth/2);
    buildingGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2, height/2, -depth/2);
    buildingGroup.add(rightWall);
    
    // Create back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, height/2, -depth);
    buildingGroup.add(backWall);
    
    // Create windows (2 rows of 5 windows)
    const windowRows = 2;
    const windowCols = 5;
    const windowWidth = 1.2;
    const windowHeight = 1.4;
    const windowSpacing = width / (windowCols + 1);
    const rowSpacing = height / (windowRows + 1);
    
    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            // Skip center window on bottom row for door
            if (row === (windowRows - 1) && col === 2) continue;
            
            const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.1);
            const windowMaterial = createWireframeMaterial(0x87CEEB);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            const x = -width/2 + (col + 1) * windowSpacing;
            const y = height - (row + 1) * rowSpacing;
            window.position.set(x, y, wallThickness/2 + 0.05);
            frontWallGroup.add(window);
        }
    }
    
    // Add door in center bottom position
    let doorWidth = width * 0.12;
    let doorHeight = height * 0.25;
    
    // Scale door for far buildings - all far building styles get larger doors
    if (style === 'groton_church' || style === 'groton_townhall' || 
        style === 'groton_colonial' || style === 'groton_house' || 
        style === 'hospital' || style === 'graveyard' ||
        style === 'modern' || style === 'brick' || 
        style === 'shop' || style === 'industrial') {
        doorWidth = width * 0.15;
        doorHeight = height * 0.4;
    }
    
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.15);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight/2, wallThickness/2 + 0.08);
    frontWallGroup.add(door);
    
    // Door handle
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const handleMaterial = createWireframeMaterial(0xFFD700);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(doorWidth/3, doorHeight/2, wallThickness/2 + 0.12);
    frontWallGroup.add(handle);
    
    // Building-specific features
    if (style === 'groton_church') {
        // Church steeple
        const steepleBase = new THREE.BoxGeometry(width * 0.3, height * 0.6, depth * 0.3);
        const steepleBaseMaterial = createWireframeMaterial(baseColor);
        const steepleBaseMesh = new THREE.Mesh(steepleBase, steepleBaseMaterial);
        steepleBaseMesh.position.set(0, height + height * 0.3, -depth * 0.2);
        frontWallGroup.add(steepleBaseMesh);
        
        // Bell tower section
        const bellTower = new THREE.BoxGeometry(width * 0.25, height * 0.4, depth * 0.25);
        const bellTowerMaterial = createWireframeMaterial(baseColor);
        const bellTowerMesh = new THREE.Mesh(bellTower, bellTowerMaterial);
        bellTowerMesh.position.set(0, height + height * 0.6 + height * 0.2, -depth * 0.2);
        frontWallGroup.add(bellTowerMesh);
        
        // Tall spire
        const spire = new THREE.ConeGeometry(width * 0.1, height * 0.8, 8);
        const spireMaterial = createWireframeMaterial(roofColor);
        const spireMesh = new THREE.Mesh(spire, spireMaterial);
        spireMesh.position.set(0, height + height * 0.6 + height * 0.4 + height * 0.4, -depth * 0.2);
        frontWallGroup.add(spireMesh);
        
        // Cross on top
        const crossVertical = new THREE.BoxGeometry(0.1, 0.6, 0.1);
        const crossHorizontal = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const crossMaterial = createWireframeMaterial(0xFFD700);
        
        const crossV = new THREE.Mesh(crossVertical, crossMaterial);
        const crossH = new THREE.Mesh(crossHorizontal, crossMaterial);
        
        const crossHeight = height + height * 0.6 + height * 0.4 + height * 0.8 + 0.3;
        crossV.position.set(0, crossHeight, -depth * 0.2);
        crossH.position.set(0, crossHeight, -depth * 0.2);
        
        frontWallGroup.add(crossV);
        frontWallGroup.add(crossH);
    } else if (style === 'groton_townhall') {
        // Simple town hall with columns
        const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, height * 0.8, 8);
        const columnMaterial = createWireframeMaterial(0xF5F5F5);
        
        const leftColumn = new THREE.Mesh(columnGeometry, columnMaterial);
        leftColumn.position.set(-width * 0.25, height * 0.4, wallThickness/2 + 0.2);
        frontWallGroup.add(leftColumn);
        
        const rightColumn = new THREE.Mesh(columnGeometry, columnMaterial);
        rightColumn.position.set(width * 0.25, height * 0.4, wallThickness/2 + 0.2);
        frontWallGroup.add(rightColumn);
        
        // Town hall sign
        const signGeometry = new THREE.BoxGeometry(width * 0.6, 0.8, 0.1);
        const signMaterial = createWireframeMaterial(0xFFFFFF);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height * 0.9, wallThickness/2 + 0.05);
        frontWallGroup.add(sign);
    } else if (style === 'groton_colonial') {
        // Colonial house with gabled roof
        const roofHeight = height * 0.4;
        
        // Create gabled roof using custom geometry
        const roofGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            // Back sloped face (triangle)  
             width/2, 0, depth/2,   
            -width/2, 0, depth/2,   
             0, roofHeight, 0,       
            
            // Left sloped face
            -width/2, 0, -depth/2,  
            -width/2, 0, depth/2,   
             0, roofHeight, 0,       
            
            // Right sloped face
             width/2, 0, -depth/2,  
             0, roofHeight, 0,       
             width/2, 0, depth/2    
        ]);
        
        const indices = [
            0, 1, 2,    // back triangle  
            3, 4, 5,    // left sloped face
            6, 7, 8     // right sloped face
        ];
        
        roofGeometry.setIndex(indices);
        roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        roofGeometry.computeVertexNormals();
        
        const roofMaterial = createWireframeMaterial(roofColor);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height, -depth/2);
        frontWallGroup.add(roof);
        
        // Chimney
        const chimneyGeometry = new THREE.BoxGeometry(0.6, height * 0.6, 0.6);
        const chimneyMaterial = createWireframeMaterial(0x8B4513);
        const chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimneyMesh.position.set(width/4, height + (height * 0.6)/2, -depth/2);
        frontWallGroup.add(chimneyMesh);
    }
    
    // Add building sign
    if (signText) {
        const signGeometry = new THREE.BoxGeometry(Math.min(width * 0.8, 8), 1.2, 0.1);
        const signMaterial = createWireframeMaterial(signColor);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height - 0.5, 0.1);
        frontWallGroup.add(sign);
    }
    
    // Add front wall group to building group
    buildingGroup.add(frontWallGroup);
    
    return buildingGroup;
};

// Create karaoke bar interior elements
export const createKaraokeInterior = (frontShopsGroup) => {
    const interiorElements = {};
    
    // Bar counter
    const barGeometry = new THREE.BoxGeometry(8, 1.2, 2);
    const barMaterial = createWireframeMaterial(0x8B4513);
    const barCounter = new THREE.Mesh(barGeometry, barMaterial);
    barCounter.position.set(-8, 0.6, -8);
    frontShopsGroup.add(barCounter);
    interiorElements.barCounter = barCounter;
    
    // Bar stools
    const createBarStool = (x, z) => {
        const stoolGroup = new THREE.Group();
        
        const seatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
        const seatMaterial = createWireframeMaterial(0x654321);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 1;
        stoolGroup.add(seat);
        
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
        const legMaterial = createWireframeMaterial(0x654321);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.5;
        stoolGroup.add(leg);
        
        stoolGroup.position.set(x, 0, z);
        return stoolGroup;
    };
    
    const barStools = [];
    for (let i = 0; i < 4; i++) {
        const stool = createBarStool(-10 + i * 2, -6);
        frontShopsGroup.add(stool);
        barStools.push(stool);
    }
    interiorElements.barStools = barStools;
    
    // Stage
    const stageGeometry = new THREE.BoxGeometry(6, 0.5, 4);
    const stageMaterial = createWireframeMaterial(0x8B008B);
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.set(8, 0.25, -8);
    frontShopsGroup.add(stage);
    interiorElements.stage = stage;
    
    // Microphone stand
    const micStandGroup = new THREE.Group();
    const standGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    const standMaterial = createWireframeMaterial(0x696969);
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.y = 1;
    micStandGroup.add(stand);
    
    const micGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const micMaterial = createWireframeMaterial(0x000000);
    const mic = new THREE.Mesh(micGeometry, micMaterial);
    mic.position.y = 2.2;
    micStandGroup.add(mic);
    
    micStandGroup.position.set(8, 0.25, -8);
    frontShopsGroup.add(micStandGroup);
    interiorElements.micStandGroup = micStandGroup;
    
    // Tables and chairs
    const createTable = (x, z) => {
        const tableGroup = new THREE.Group();
        
        const topGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 8);
        const topMaterial = createWireframeMaterial(0x8B4513);
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1.5;
        tableGroup.add(top);
        
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
        const legMaterial = createWireframeMaterial(0x654321);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.75;
        tableGroup.add(leg);
        
        tableGroup.position.set(x, 0, z);
        return tableGroup;
    };
    
    const createChair = (x, z) => {
        const chairGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const seatMaterial = createWireframeMaterial(0x654321);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.8;
        chairGroup.add(seat);
        
        const backGeometry = new THREE.BoxGeometry(0.8, 1, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.3, -0.35);
        chairGroup.add(back);
        
        chairGroup.position.set(x, 0, z);
        return chairGroup;
    };
    
    // Add tables and chairs
    const tables = [];
    const chairs = [];
    
    const tablePositions = [
        [-4, -3], [4, -3], [-4, 3], [4, 3]
    ];
    
    tablePositions.forEach(([x, z]) => {
        const table = createTable(x, z);
        frontShopsGroup.add(table);
        tables.push(table);
        
        // Add chairs around each table
        const chairOffsets = [
            [0, 1.5], [1.5, 0], [0, -1.5], [-1.5, 0]
        ];
        
        chairOffsets.forEach(([dx, dz]) => {
            const chair = createChair(x + dx, z + dz);
            frontShopsGroup.add(chair);
            chairs.push(chair);
        });
    });
    
    interiorElements.tables = tables;
    interiorElements.chairs = chairs;
    
    return interiorElements;
};

// Create park elements for the forest suburban scene
export const createParkElements = (frontGroup) => {
    const parkElements = {};
    
    // Create a central gazebo/pavilion
    const createGazebo = (x, z) => {
        const gazeboGroup = new THREE.Group();
        
        // Gazebo platform
        const platformGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 8);
        const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x7A7A7A });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 0.1;
        gazeboGroup.add(platform);
        
        // Gazebo pillars - brighter white
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pillarX = Math.cos(angle) * 3.5;
            const pillarZ = Math.sin(angle) * 3.5;
            
            const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
            const pillarMaterial = createWireframeMaterial(0xBFBFBF); // Bright white
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pillarX, 1.7, pillarZ);
            gazeboGroup.add(pillar);
        }
        
        // Gazebo roof - dark grey/brown like real shingles
        const roofGeometry = new THREE.ConeGeometry(5, 2, 8);
        const roofMaterial = createWireframeMaterial(0x7A7A7A); // Dark grey
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4.2;
        gazeboGroup.add(roof);
        
        // Add a white cupola at the top (like the reference image)
        const cupolaGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
        const cupolaMaterial = createWireframeMaterial(0xDFDFDF); // White cupola
        const cupola = new THREE.Mesh(cupolaGeometry, cupolaMaterial);
        cupola.position.y = 5.3;
        gazeboGroup.add(cupola);
        
        // Small dark roof on top of cupola
        const cupolaRoofGeometry = new THREE.ConeGeometry(0.6, 0.4, 8);
        const cupolaRoofMaterial = createWireframeMaterial(0x7A7A7A); // Dark grey
        const cupolaRoof = new THREE.Mesh(cupolaRoofGeometry, cupolaRoofMaterial);
        cupolaRoof.position.y = 5.8;
        gazeboGroup.add(cupolaRoof);
        
        gazeboGroup.position.set(x, 0, z);
        return gazeboGroup;
    };
    
    // Create park benches
    const createParkBench = (x, z, rotation = 0) => {
        const benchGroup = new THREE.Group();
        
        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
        const seatMaterial = createWireframeMaterial(0x8B4513);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.8;
        benchGroup.add(seat);
        
        // Bench back
        const backGeometry = new THREE.BoxGeometry(2, 1, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.3, -0.25);
        benchGroup.add(back);
        
        // Bench legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
        const leftLeg = new THREE.Mesh(legGeometry, seatMaterial);
        const rightLeg = new THREE.Mesh(legGeometry, seatMaterial);
        leftLeg.position.set(-0.8, 0.4, 0);
        rightLeg.position.set(0.8, 0.4, 0);
        benchGroup.add(leftLeg);
        benchGroup.add(rightLeg);
        
        benchGroup.position.set(x, 0, z);
        benchGroup.rotation.y = rotation;
        return benchGroup;
    };
    
    // Create scattered trees for the park
    const createParkTree = (x, z, scale = 1) => {
        const treeGroup = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8);
        const trunkMaterial = createWireframeMaterial(0x8B4513);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5 * scale;
        treeGroup.add(trunk);
        
        // Tree foliage (multiple layers)
        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.SphereGeometry(1.5 * scale - i * 0.3, 8, 6);
            const foliageMaterial = createWireframeMaterial(0x228B22);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 2.5 * scale + i * 0.8;
            treeGroup.add(foliage);
        }
        
        treeGroup.position.set(x, 0, z);
        return treeGroup;
    };
    
    // Add central gazebo - moved back 20 units more, then forward 10 units
    const gazebo = createGazebo(0, -22);
    frontGroup.add(gazebo);
    parkElements.gazebo = gazebo;
    
    // Add park benches positioned individually around the gazebo
    const benches = [];
    
    // Position each bench explicitly with correct rotation to face gazebo (adjusted for new gazebo position at z=-22)
    const benchPositions = [
        { x: 0, z: -30, rotation: 0 },           // Front bench (facing north toward gazebo)
        { x: 5.5, z: -28, rotation: -Math.PI/6 },   // Front-right bench
        { x: 10, z: -24, rotation: -Math.PI/3 },     // Right-front bench
        { x: 10, z: -20, rotation: -2*Math.PI/3 },   // Right-back bench
        { x: 5.5, z: -16, rotation: -5*Math.PI/6 },   // Back-right bench
        { x: 0, z: -14, rotation: Math.PI },          // Back bench (facing south toward gazebo)
        { x: -5.5, z: -16, rotation: 5*Math.PI/6 },   // Back-left bench
        { x: -10, z: -20, rotation: 2*Math.PI/3 },   // Left-back bench
        { x: -10, z: -24, rotation: Math.PI/3 },     // Left-front bench
        { x: -5.5, z: -28, rotation: Math.PI/6 }    // Front-left bench
    ];
    
    benchPositions.forEach(({ x, z, rotation }) => {
        const bench = createParkBench(x, z, rotation);
        frontGroup.add(bench);
        benches.push(bench);
    });
    parkElements.benches = benches;
    
    // Add trees evenly distributed across park area, outside gazebo and benches
    const trees = [];
    const treePositions = [
        // Front area (z: 5 to -10) - outside bench perimeter
        [-30, 2], [-25, 0], [-20, -2], [-15, -4], [-10, -6], [-5, -8],
        [5, -8], [10, -6], [15, -4], [20, -2], [25, 0], [30, 2],
        
        // Middle area (z: -12 to -20) - around gazebo but outside benches
        [-32, -12], [-28, -14], [-24, -16], [-20, -18], [-16, -20],
        [16, -20], [20, -18], [24, -16], [28, -14], [32, -12],
        
        // Back area (z: -22 to -30) - behind gazebo and benches
        [-30, -22], [-26, -24], [-22, -26], [-18, -28], [-14, -30],
        [14, -30], [18, -28], [22, -26], [26, -24], [30, -22],
        
        // Far back area (z: -32 to -42) - extending towards stone wall
        [-28, -32], [-24, -34], [-20, -36], [-16, -38], [0, -40],
        [12, -40], [2, -38], [20, -36], [24, -34], [-2, -32],
        [-26, -42], [-22, -40], [-18, -38], [-4, -36], [-10, -34],
        [10, -34], [6, -36], [18, -38], [22, -40], [26, -42]
    ];
    
    treePositions.forEach(([x, z]) => {
        const tree = createParkTree(x, z, 0.8 + Math.random() * 0.4);
        frontGroup.add(tree);
        trees.push(tree);
    });
    parkElements.trees = trees;
    
    // Add grass scattered around the park (tiny dots, not under gazebo)
    // Grass only on the near side of the street, extending back to where the floor ends
    const grass = [];
    const grassCount = 800; // Adjusted for the smaller area
    for (let i = 0; i < grassCount; i++) {
        // Random position only on the near side of the street (negative Z values)
        // Extend back to where the floor ends (floor is 300x300, so Z goes to -150)
        let x = (Math.random() - 0.5) * 300; // -150 to 150 (full street width)
        let z = -150 + Math.random() * 140; // -150 to -10 (from floor edge to front shops)
        
        // Skip if too close to gazebo (gazebo is at 0, -22 with radius ~5)
        const distanceFromGazebo = Math.sqrt(x * x + (z + 22) * (z + 22));
        if (distanceFromGazebo < 6) continue; // Skip this grass blade
        
        // Skip if in the road area (street is at Z=11, 12 units deep)
        if (z >= 5 && z <= 17) continue; // Skip road area
        
        // Skip if in the near sidewalk area (near sidewalk is at Z=2, 6 units deep)
        if (z >= -1 && z <= 5) continue; // Skip near sidewalk area
        
        // Tiny grass dot
        const grassGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 3);
        const grassMaterial = createWireframeMaterial(0x228B22); // Forest green
        const grassBlade = new THREE.Mesh(grassGeometry, grassMaterial);
        grassBlade.position.set(x, 0.01, z);
        frontGroup.add(grassBlade);
        grass.push(grassBlade);
    }
    parkElements.grass = grass;
    
    // Add New England stone wall around the sides and back of the park
    const createParkStoneWall = (startX, startZ, endX, endZ, wallHeight = 1.2) => {
        const wallGroup = new THREE.Group();
        const stoneSize = 0.8;
        
        // Calculate wall direction and length
        const deltaX = endX - startX;
        const deltaZ = endZ - startZ;
        const wallLength = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
        const wallAngle = Math.atan2(deltaZ, deltaX);
        
        // Create stones along the wall length
        for (let i = 0; i < wallLength; i += stoneSize + Math.random() * 0.3) {
            const progress = i / wallLength;
            const stoneX = startX + deltaX * progress;
            const stoneZ = startZ + deltaZ * progress;
            
            // Create wall segment with stacked stones
            for (let y = 0; y < wallHeight; y += stoneSize * 0.7) {
                const stoneGeometry = new THREE.BoxGeometry(
                    stoneSize + Math.random() * 0.4,
                    stoneSize * 0.6 + Math.random() * 0.2,
                    stoneSize * 0.8 + Math.random() * 0.3
                );
                const stoneMaterial = createWireframeMaterial(0x696969); // Stone/brown color
                const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                stone.position.set(
                    stoneX + (Math.random() - 0.5) * 0.2,
                    y + stoneSize * 0.3,
                    stoneZ + (Math.random() - 0.5) * 0.2
                );
                
                // Slight rotation for natural look
                stone.rotation.y = wallAngle + (Math.random() - 0.5) * 0.3;
                wallGroup.add(stone);
            }
        }
        
        return wallGroup;
    };
    
    // Left side wall (facing east)
    const leftWall = createParkStoneWall(-38, 0, -38, -46);
    frontGroup.add(leftWall);
    
    // Right side wall (facing west) 
    const rightWall = createParkStoneWall(38, 0, 38, -46);
    frontGroup.add(rightWall);
    
    // Back wall (facing north)
    const backWall = createParkStoneWall(-38, -46, 38, -46);
    frontGroup.add(backWall);
    
    // Store wall elements
    parkElements.walls = [leftWall, rightWall, backWall];
    
    console.log("🌳 Created park elements for forest suburban scene");
    return parkElements;
};

// Create glowing wireframe material
export const createGlowingWireframeMaterial = (color, opacity = 1.0, glowIntensity = 0.5) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(color) },
            opacity: { value: opacity },
            glowIntensity: { value: glowIntensity }
        },
        vertexShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vPosition = position;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            uniform float opacity;
            uniform float glowIntensity;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                float thickness = 0.05;
                vec3 fdx = vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z));
                vec3 fdy = vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z));
                vec3 normal = normalize(cross(fdx, fdy));
                
                float edgeFactor = abs(dot(normal, normalize(vNormal)));
                edgeFactor = step(1.0 - thickness, edgeFactor);
                
                vec3 finalColor = baseColor * (1.0 + glowIntensity);
                gl_FragColor = vec4(finalColor, opacity * (1.0 - edgeFactor));
            }
        `,
        wireframe: true,
        transparent: true,
        side: THREE.DoubleSide
    });
};

// Create full interior scene (updated version)
export const createInteriorScene = (frontShopsGroup) => {
    const interiorElements = {};
    
    // Bar counter - rotated to be along the left wall
    const barGeometry = new THREE.BoxGeometry(10, 1, 1.5, 2, 1, 1);
    const barMaterial = createWireframeMaterial(0xDA8A67);
    const barCounter = new THREE.Mesh(barGeometry, barMaterial);
    barCounter.rotation.y = Math.PI / 2;
    barCounter.position.set(-8, 1, -7.5);
    barCounter.scale.set(1.02, 1.02, 1.02);
    frontShopsGroup.add(barCounter);
    interiorElements.barCounter = barCounter;
    
    // Bar stools
    const createBarStool = (z) => {
        const stoolGroup = new THREE.Group();
        const seatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8, 1);
        const seatMaterial = createGlowingWireframeMaterial(0x88CCFF, 1.0, 0.3);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 1;
        stoolGroup.add(seat);
        
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 4, 1);
        const legMaterial = createWireframeMaterial(0x555555);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.5;
        stoolGroup.add(leg);
        
        stoolGroup.position.set(-6.6, 0, z);
        frontShopsGroup.add(stoolGroup);
        return stoolGroup;
    };
    
    interiorElements.barStools = [
        createBarStool(-4), createBarStool(-6), createBarStool(-8), 
        createBarStool(-10), createBarStool(-12)
    ];
    
    // Diner booth creation functions
    const createDinerBooth = (x, z) => {
        const boothGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, 0);
        boothGroup.add(seat);
        
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        backrest.position.set(0, 0.9, -0.4);
        boothGroup.add(backrest);
        
        const tableGeometry = new THREE.BoxGeometry(2, 0.1, 0.8, 3, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3);
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(0, 0.65, 0.8);
        boothGroup.add(table);
        
        const legGeometry = new THREE.BoxGeometry(0.08, 0.8, 0.08, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        ['frontLeft', 'frontRight', 'backLeft', 'backRight'].forEach((pos, i) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const xPos = i % 2 === 0 ? 0.85 : -0.85;
            const zPos = i < 2 ? 1.1 : 0.5;
            leg.position.set(xPos, 0.3, zPos);
            boothGroup.add(leg);
        });
        
        const condimentTrayGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.3, 1, 1, 1);
        const condimentTrayMaterial = createWireframeMaterial(0x666666);
        const condimentTray = new THREE.Mesh(condimentTrayGeometry, condimentTrayMaterial);
        condimentTray.position.set(0.7, 0.8, 0.8);
        boothGroup.add(condimentTray);
        
        const shakerGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6, 1);
        const saltShaker = new THREE.Mesh(shakerGeometry, createWireframeMaterial(0xFFFFFF));
        saltShaker.position.set(0.65, 0.87, 0.75);
        boothGroup.add(saltShaker);
        
        const pepperShaker = new THREE.Mesh(shakerGeometry, createWireframeMaterial(0x222222));
        pepperShaker.position.set(0.75, 0.87, 0.85);
        boothGroup.add(pepperShaker);
        
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup);
        return boothGroup;
    };
    
    const createOppositeBench = (x, z) => {
        const boothGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, -0.7);
        boothGroup.add(seat);
        
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        backrest.position.set(0, 0.9, -1.0);
        boothGroup.add(backrest);
        
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup);
        return boothGroup;
    };
    
    interiorElements.dinerBooths = [];
    const boothSpacing = 2.9;
    const rightWallX = 9.2;
    const startZ = -2;
    
    for (let i = 0; i < 5; i++) {
        const z = startZ - (i * boothSpacing);
        const firstBooth = createDinerBooth(rightWallX - 0.8, z - 0.5);
        firstBooth.rotation.y = 0;
        const secondBooth = createOppositeBench(rightWallX - 0.8, z + 0.5);
        secondBooth.rotation.y = Math.PI;
        interiorElements.dinerBooths.push(firstBooth, secondBooth);
    }
    
    // Tables and chairs
    const createTable = (x, z) => {
        const tableGroup = new THREE.Group();
        const tableGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5, 2, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3);
        const tableTop = new THREE.Mesh(tableGeometry, tableMaterial);
        tableTop.position.y = 0.75;
        tableGroup.add(tableTop);
        
        const legGeometry = new THREE.BoxGeometry(0.1, 0.75, 0.1, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        [[0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.375, z);
            tableGroup.add(leg);
        });
        
        tableGroup.position.set(x, 0, z);
        frontShopsGroup.add(tableGroup);
        return tableGroup;
    };
    
    const createChair = (x, z, rotation) => {
        const chairGroup = new THREE.Group();
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6, 2, 1, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.5;
        chairGroup.add(seat);
        
        const backGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1, 2, 2, 1);
        const backMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3);
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(0, 0.8, -0.25);
        chairGroup.add(back);
        
        const legGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x666666);
        
        [[0.25, 0.25], [0.25, -0.25], [-0.25, 0.25], [-0.25, -0.25]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.25, z);
            chairGroup.add(leg);
        });
        
        chairGroup.position.set(x, 0, z);
        chairGroup.rotation.y = rotation;
        frontShopsGroup.add(chairGroup);
        return chairGroup;
    };
    
    const centerTable = createTable(3, -5);
    interiorElements.tables = [centerTable];
    
    interiorElements.chairs = [
        createChair(3, -6, 0), createChair(3, -4, Math.PI),
        createChair(4, -5, -Math.PI / 2), createChair(2, -5, Math.PI / 2)
    ];
    
    const sideTable = createTable(-3, -3);
    interiorElements.tables.push(sideTable);
    interiorElements.chairs.push(
        createChair(-3, -4, 0), createChair(-3, -2, Math.PI),
        createChair(-2, -3, -Math.PI / 2), createChair(-4, -3, Math.PI / 2)
    );
    
    // Karaoke Stage
    const stageGeometry = new THREE.BoxGeometry(8, 0.3, 4, 2, 1, 2);
    const stageMaterial = createWireframeMaterial(0xBF8F00);
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.set(0, 0.15, -12.5);
    stage.scale.set(1.02, 1.02, 1.02);
    frontShopsGroup.add(stage);
    interiorElements.stage = stage;
    
    // Signup sheet
    const createSignupSheet = () => {
        const sheetGroup = new THREE.Group();
        const paperGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.4, 2, 1, 2);
        const paperMaterial = createWireframeMaterial(0xFFFFFF);
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        sheetGroup.add(paper);
        
        for (let i = 0; i < 4; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.25, 0.005, 0.01, 4, 1, 1);
            const lineMaterial = createWireframeMaterial(0x000000);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.z = -0.15 + i * 0.1;
            sheetGroup.add(line);
        }
        
        const penGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.15, 1, 1, 2);
        const penMaterial = createWireframeMaterial(0x0000FF);
        const pen = new THREE.Mesh(penGeometry, penMaterial);
        pen.position.set(0.15, 0.01, -0.1);
        pen.rotation.y = Math.PI / 4;
        sheetGroup.add(pen);
        
        return sheetGroup;
    };
    
    const signupSheet = createSignupSheet();
    signupSheet.position.set(-7.5, 1.52, -9.5);
    frontShopsGroup.add(signupSheet);
    interiorElements.signupSheet = signupSheet;
    
    // Beer cans
    const createBeerCan = (x, z, customY = null) => {
        const canGroup = new THREE.Group();
        const canGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6, 1);
        const canMaterial = createWireframeMaterial(0xCCCCCC);
        const can = new THREE.Mesh(canGeometry, canMaterial);
        canGroup.add(can);
        
        const labelGeometry = new THREE.CylinderGeometry(0.101, 0.101, 0.2, 6, 1);
        const labelMaterial = createWireframeMaterial(0xFF0000);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        canGroup.add(label);
        
        canGroup.position.set(x, customY !== null ? customY : 1.0, z);
        frontShopsGroup.add(canGroup);
        return canGroup;
    };
    
    interiorElements.beerCans = [
        createBeerCan(3.2, -5.2), createBeerCan(2.8, -4.8)
    ];
    
    interiorElements.boothBeers = [
        createBeerCan(8.6, -13.3, 1), createBeerCan(8.3, -13.1, 1)
    ];
    
    interiorElements.barBeers = [
        createBeerCan(-8.3, -6, 1.75), createBeerCan(-8.2, -8, 1.75), createBeerCan(-7.9, -12, 1.75)
    ];
    
    // TV/Screen
    const screenGeometry = new THREE.BoxGeometry(7, 2, 0.3, 6, 4, 1);
    const screenMaterial = createWireframeMaterial(0x00FFFF);
    const tvScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    tvScreen.position.set(0, 3.5, -14.9);
    tvScreen.rotation.y = Math.PI;
    frontShopsGroup.add(tvScreen);
    interiorElements.tvScreen = tvScreen;
    
    // Counter on stage
    const counterGeometry = new THREE.BoxGeometry(6, 1.2, 1.5, 4, 3, 2);
    const counterMaterial = createWireframeMaterial(0x8B4513);
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, -11.25);
    frontShopsGroup.add(counter);
    interiorElements.counter = counter;
    
    const counterTopGeometry = new THREE.BoxGeometry(6.2, 0.1, 1.7, 4, 1, 2);
    const counterTopMaterial = createWireframeMaterial(0xDEB887);
    const counterTop = new THREE.Mesh(counterTopGeometry, counterTopMaterial);
    counterTop.position.set(0, 1.25, -11.25);
    frontShopsGroup.add(counterTop);
    interiorElements.counterTop = counterTop;
    
    return interiorElements;
};

// Create pond scene elements - post-party campfire vibes
export const createPondElements = (frontGroup, PLAZA_CONFIG, scene) => {
    const pondElements = {};
    
    // The Pond - large oval water feature
    const pondGroup = new THREE.Group();
    
    // Create organic pond shape with multiple segments
    const pondSegments = [];
    
    // Main pond body (irregular oval)
    const mainPondGeometry = new THREE.CircleGeometry(18, 32);
    mainPondGeometry.scale(1.2, 0.7, 1); // More elongated
    const mainPondMaterial = createWireframeMaterial(0x1a3a52);
    const mainPond = new THREE.Mesh(mainPondGeometry, mainPondMaterial);
    mainPond.rotation.x = -Math.PI / 2;
    mainPond.position.y = -0.15;
    mainPond.position.x = 2; // Offset slightly
    pondGroup.add(mainPond);
    pondSegments.push({x: 2, z: 0, radius: 18, scaleX: 1.2, scaleZ: 0.7});
    
    // Jutting out sections
    const jut1Geometry = new THREE.CircleGeometry(8, 16);
    jut1Geometry.scale(0.8, 1.2, 1);
    const jut1Material = createWireframeMaterial(0x1a3a52);
    const jut1 = new THREE.Mesh(jut1Geometry, jut1Material);
    jut1.rotation.x = -Math.PI / 2;
    jut1.position.y = -0.15;
    jut1.position.set(-12, -0.15, 8); // Jut out to the left
    pondGroup.add(jut1);
    pondSegments.push({x: -12, z: 8, radius: 8, scaleX: 0.8, scaleZ: 1.2});
    
    const jut2Geometry = new THREE.CircleGeometry(6, 16);
    jut2Geometry.scale(1.3, 0.6, 1);
    const jut2Material = createWireframeMaterial(0x1a3a52);
    const jut2 = new THREE.Mesh(jut2Geometry, jut2Material);
    jut2.rotation.x = -Math.PI / 2;
    jut2.position.y = -0.15;
    jut2.position.set(15, -0.15, -5); // Jut out to the right
    pondGroup.add(jut2);
    pondSegments.push({x: 15, z: -5, radius: 6, scaleX: 1.3, scaleZ: 0.6});
    
    const jut3Geometry = new THREE.CircleGeometry(5, 16);
    jut3Geometry.scale(0.9, 1.1, 1);
    const jut3Material = createWireframeMaterial(0x1a3a52);
    const jut3 = new THREE.Mesh(jut3Geometry, jut3Material);
    jut3.rotation.x = -Math.PI / 2;
    jut3.position.y = -0.15;
    jut3.position.set(-8, -0.15, -12); // Jut out to the back-left
    pondGroup.add(jut3);
    pondSegments.push({x: -8, z: -12, radius: 5, scaleX: 0.9, scaleZ: 1.1});
    
    // Pond depth effect (follows main shape)
    const pondDepthGeometry = new THREE.CircleGeometry(16, 32);
    pondDepthGeometry.scale(1.2, 0.7, 1);
    const pondDepthMaterial = createWireframeMaterial(0x0d1f2d);
    const pondDepth = new THREE.Mesh(pondDepthGeometry, pondDepthMaterial);
    pondDepth.rotation.x = -Math.PI / 2;
    pondDepth.position.y = -0.2;
    pondDepth.position.x = 2;
    pondGroup.add(pondDepth);
    
    // Mist particles above pond
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const distance = 10 + Math.random() * 8;
        const mistGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 4, 4);
        const mistMaterial = createWireframeMaterial(0xCCCCCC, 0.3 + Math.random() * 0.2);
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        mist.position.set(
            Math.cos(angle) * distance,
            0.3 + Math.random() * 1.5,
            Math.sin(angle) * distance
        );
        mist.userData.isMist = true;
        pondGroup.add(mist);
    }
    
    pondGroup.position.set(0, 0, 150);
    frontGroup.add(pondGroup);
    pondElements.pond = pondGroup;
    
    // Walking path around pond
    const pathRadius = 22;
    const pathSegments = 64;
    for (let i = 0; i < pathSegments; i++) {
        const angle = (i / pathSegments) * Math.PI * 2;
        const nextAngle = ((i + 1) / pathSegments) * Math.PI * 2;
        
        const x1 = Math.cos(angle) * pathRadius;
        const z1 = Math.sin(angle) * pathRadius * 0.875;
        const x2 = Math.cos(nextAngle) * pathRadius;
        const z2 = Math.sin(nextAngle) * pathRadius * 0.875;
        
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        const segmentAngle = Math.atan2(dz, dx);
        
        const pathSegmentGeometry = new THREE.BoxGeometry(length, 0.05, 3);
        const pathSegmentMaterial = createWireframeMaterial(0x8B4513);
        const pathSegment = new THREE.Mesh(pathSegmentGeometry, pathSegmentMaterial);
        pathSegment.position.set(0 + (x1+x2)/2, -0.18, 150 + (z1+z2)/2);
        pathSegment.rotation.y = segmentAngle;
        frontGroup.add(pathSegment);
    }
    
    // Dying Campfire
    const campfireGroup = new THREE.Group();
    
    // Stone fire pit circle
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const stoneGeometry = new THREE.BoxGeometry(
            0.6 + Math.random() * 0.3, 0.4, 0.5 + Math.random() * 0.2
        );
        const stoneMaterial = createWireframeMaterial(0x696969);
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone.position.set(Math.cos(angle) * 2, 0.2, Math.sin(angle) * 2);
        stone.rotation.y = angle;
        campfireGroup.add(stone);
    }
    
    // Dying embers
    for (let i = 0; i < 8; i++) {
        const emberGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        const emberMaterial = createWireframeMaterial(0xFF4500, 1.0);
        const ember = new THREE.Mesh(emberGeometry, emberMaterial);
        ember.position.set((Math.random() - 0.5) * 2, 0.1, (Math.random() - 0.5) * 2);
        ember.userData.isEmber = true;
        campfireGroup.add(ember);
    }
    
    // Smoke/mist rising - create more particles for continuous smoke
    for (let i = 0; i < 8; i++) {
        const smokeGeometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 4, 4);
        const smokeMaterial = createWireframeMaterial(0x888888, 0.2 + Math.random() * 0.2);
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set((Math.random() - 0.5) * 1.5, 1 + i * 0.6, (Math.random() - 0.5) * 1.5);
        smoke.userData.isSmoke = true;
        campfireGroup.add(smoke);
    }
    
    campfireGroup.position.set(50, 0, -20);
    frontGroup.add(campfireGroup);
    pondElements.campfire = campfireGroup;
    
    // Log benches around fire
    const logBenches = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const logMaterial = createWireframeMaterial(0x8B4513);
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.z = Math.PI / 2;
        log.position.set(50 - Math.cos(angle) * 6, 0.3, -20 + Math.sin(angle) * 6); // Flipped horizontally by negating X offset
        
        // Flip all benches by 90 degrees to be perpendicular to radial lines
        log.rotation.y = angle + Math.PI / 2;
        
        frontGroup.add(log);
        logBenches.push(log);
    }
    pondElements.logBenches = logBenches;
    
    // Tent 1
    const tent1Group = new THREE.Group();
    const tent1Geometry = new THREE.ConeGeometry(2, 2.5, 4);
    const tent1Material = createWireframeMaterial(0x4cbf3a);
    const tent1 = new THREE.Mesh(tent1Geometry, tent1Material);
    tent1.position.y = 1.25;
    tent1.rotation.y = Math.PI / 4;
    tent1.scale.set(1.5, 1.5, 1.5);
    tent1Group.add(tent1);
    tent1Group.position.set(54, .5, -39);
    frontGroup.add(tent1Group);
    pondElements.tent1 = tent1Group;
    
    // Tent 2
    const tent2Group = new THREE.Group();
    const tent2Geometry = new THREE.ConeGeometry(2.2, 2.8, 4);
    const tent2Material = createWireframeMaterial(0xfb8463);
    const tent2 = new THREE.Mesh(tent2Geometry, tent2Material);
    tent2.position.y = 1.4;
    tent2.rotation.y = -Math.PI / 6;
    tent1.scale.set(1.6, 1.6, 1.6);
    tent2Group.add(tent2);
    tent2Group.position.set(70, 0, -32);
    frontGroup.add(tent2Group);
    pondElements.tent2 = tent2Group;
    
    // Picnic table
    const tableGroup = new THREE.Group();
    const tableTopGeometry = new THREE.BoxGeometry(4, 0.15, 2);
    const tableMaterial = createWireframeMaterial(0x8B7355);
    const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
    tableTop.position.y = 1;
    tableGroup.add(tableTop);
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);
    [[1.8, 0.8], [1.8, -0.8], [-1.8, 0.8], [-1.8, -0.8]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.position.set(x, 0.5, z);
        tableGroup.add(leg);
    });
    
    // Benches
    [-1.5, 1.5].forEach(zOffset => {
        const benchGeometry = new THREE.BoxGeometry(3.5, 0.12, 0.6);
        const bench = new THREE.Mesh(benchGeometry, tableMaterial);
        bench.position.set(0, 0.5, zOffset);
        tableGroup.add(bench);
    });
    
    tableGroup.position.set(40, 0, -10);
    frontGroup.add(tableGroup);
    pondElements.picnicTable = tableGroup;
    
    // Second picnic table
    const tableGroup2 = new THREE.Group();
    const tableTopGeometry2 = new THREE.BoxGeometry(4, 0.15, 2);
    const tableMaterial2 = createWireframeMaterial(0x8B7355);
    const tableTop2 = new THREE.Mesh(tableTopGeometry2, tableMaterial2);
    tableTop2.position.y = 1;
    tableGroup2.add(tableTop2);
    
    // Table legs
    const legGeometry2 = new THREE.BoxGeometry(0.15, 1, 0.15);
    [[1.8, 0.8], [1.8, -0.8], [-1.8, 0.8], [-1.8, -0.8]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry2, tableMaterial2);
        leg.position.set(x, 0.5, z);
        tableGroup2.add(leg);
    });
    
    // Benches
    [-1.5, 1.5].forEach(zOffset => {
        const benchGeometry = new THREE.BoxGeometry(3.5, 0.12, 0.6);
        const bench = new THREE.Mesh(benchGeometry, tableMaterial2);
        bench.position.set(0, 0.5, zOffset);
        tableGroup2.add(bench);
    });
    
    tableGroup2.position.set(65, 0, -20);
    tableGroup2.rotation.y = Math.PI / 2;
    frontGroup.add(tableGroup2);
    pondElements.picnicTable2 = tableGroup2;
    
    // Blankets
    const blankets = [];
    const blanketPositions = [
        {x: 41.5, z: -23, color: 0x8B0000, rotation: 0.3},   // Campsite area
        {x: 47, z: -12, color: 0x4169E1, rotation: -0.5},  // Campsite area
        {x: 58, z: -18, color: 0x9932CC, rotation: 0.8},   // Campsite area
        {x: 38, z: -25, color: 0xFF6347, rotation: -0.2}   // Campsite area
    ];
    
    blanketPositions.forEach(({x, z, color, rotation}) => {
        const blanketGeometry = new THREE.PlaneGeometry(2.5, 2);
        const blanketMaterial = createWireframeMaterial(color);
        const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
        blanket.rotation.x = -Math.PI / 2;
        blanket.rotation.z = rotation;
        blanket.position.set(x, 0.02, z);
        frontGroup.add(blanket);
        blankets.push(blanket);
    });
    pondElements.blankets = blankets;
    
    // Tree stumps
    const stumps = [];
    const stumpPositions = [
        {x: 53, z: -12}, {x: 44, z: -28}, {x: 55, z: -22},  // Campsite area
        {x: 41, z: -15}, {x: 50, z: -26}, {x: 46, z: -32}   // Campsite area
    ];
    
    stumpPositions.forEach(({x, z}) => {
        const stumpGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.6, 8);
        const stumpMaterial = createWireframeMaterial(0x654321);
        const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
        stump.position.set(x, 0.3, z);
        frontGroup.add(stump);
        stumps.push(stump);
    });
    pondElements.stumps = stumps;
    
    // Cooler
    const coolerGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.7);
    const coolerMaterial = createWireframeMaterial(0xFF0000);
    const cooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    cooler.position.set(43, 0.4, -22);
    frontGroup.add(cooler);
    
    const lidGeometry = new THREE.BoxGeometry(1.25, 0.1, 0.75);
    const lidMaterial = createWireframeMaterial(0xFFFFFF);
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(43, 0.9, -22);
    lid.rotation.z = 0.03;
    lid.rotation.y = 0.23;
    frontGroup.add(lid);
    
    // Red solo cups
    const cups = [];
    const cupPositions = [
        // All cups around campsite area
        {x: 48, z: -15, tipped: false}, {x: 46, z: -20, tipped: true},
        {x: 51, z: -25, tipped: false}, {x: 49, y: 0.1, z: -25, tipped: true},
        {x: 54, z: -23, tipped: false}, {x: 42, z: -26, tipped: true},
        {x: 52, z: -27, tipped: false}, {x: 44, z: -30, tipped: true},
        {x: 43, z: -15, tipped: false}, {x: 55, z: -17, tipped: true},
        {x: 41, z: -22, tipped: false}, {x: 57, z: -28, tipped: true}
    ];
    
    cupPositions.forEach(({x, z, tipped}) => {
        const cupGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.4, 8);
        const cupMaterial = createWireframeMaterial(0xFF0000);
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        
        if (tipped) {
            cup.rotation.z = Math.PI / 2;
            cup.position.set(x, 0.1, z);
        } else {
            cup.position.set(x, 0.2, z);
        }
        
        frontGroup.add(cup);
        cups.push(cup);
    });
    pondElements.cups = cups;
    
    // Left path to pond area (back)
    const leftPathGroup = new THREE.Group();
    
    // Add connecting segment from road to path start
    const roadToLeftPathGeometry = new THREE.PlaneGeometry(15, 4.0);
    const roadToLeftPathMaterial = createWireframeMaterial(0x8B4513);
    const roadToLeftPath = new THREE.Mesh(roadToLeftPathGeometry, roadToLeftPathMaterial);
    roadToLeftPath.rotation.x = -Math.PI / 2;
    roadToLeftPath.rotation.z = Math.PI / 2;
    roadToLeftPath.position.set(-10, -0.17, -5);
    leftPathGroup.add(roadToLeftPath);
    
    const leftPathPoints = [
        {x: -20, z: 0}, {x: -15, z: 20}, {x: -10, z: 40},
        {x: -5, z: 60}, {x: 0, z: 75}, {x: 0, z: 100},
        {x: 0, z: 120}
    ];
    
    for (let i = 0; i < leftPathPoints.length - 1; i++) {
        const p1 = leftPathPoints[i];
        const p2 = leftPathPoints[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        
        const pathSegmentGeometry = new THREE.PlaneGeometry(length, 4.0);
        const pathSegmentMaterial = createWireframeMaterial(0x8B4513);
        const pathSegment = new THREE.Mesh(pathSegmentGeometry, pathSegmentMaterial);
        pathSegment.rotation.x = -Math.PI / 2;
        pathSegment.rotation.z = angle;
        pathSegment.position.set((p1.x + p2.x) / 2, -0.17, (p1.z + p2.z) / 2);
        leftPathGroup.add(pathSegment);
    }
    
    frontGroup.add(leftPathGroup);
    pondElements.leftPath = leftPathGroup;
    
    // Right path to campsite area (front)
    const rightPathGroup = new THREE.Group();
    
    // Add connecting segment from road to path start
    const roadToRightPathGeometry = new THREE.PlaneGeometry(15, 4.0);
    const roadToRightPathMaterial = createWireframeMaterial(0x8B4513);
    const roadToRightPath = new THREE.Mesh(roadToRightPathGeometry, roadToRightPathMaterial);
    roadToRightPath.rotation.x = -Math.PI / 2;
    roadToRightPath.rotation.z = Math.PI / 2;
    roadToRightPath.position.set(35, -0.17, -5);
    rightPathGroup.add(roadToRightPath);
    
    const rightPathPoints = [
        {x: 20, z: 0}, {x: 25, z: -5}, {x: 30, z: -10},
        {x: 35, z: -15}, {x: 39, z: -18}, {x: 44, z: -19}
    ];
    
    for (let i = 0; i < rightPathPoints.length - 1; i++) {
        const p1 = rightPathPoints[i];
        const p2 = rightPathPoints[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        
        const pathSegmentGeometry = new THREE.PlaneGeometry(length, 3.0);
        const pathSegmentMaterial = createWireframeMaterial(0x8B4513);
        const pathSegment = new THREE.Mesh(pathSegmentGeometry, pathSegmentMaterial);
        pathSegment.rotation.x = -Math.PI / 2;
        pathSegment.rotation.z = angle;
        pathSegment.position.set((p1.x + p2.x) / 2, -0.17, (p1.z + p2.z) / 2);
        rightPathGroup.add(pathSegment);
    }
    
    frontGroup.add(rightPathGroup);
    pondElements.rightPath = rightPathGroup;
    
    // Collect all campsite objects for animation, ordered by proximity to campfire
    // Objects closer to campfire (index 0) will glow more intensely, further objects glow more gently
    const campsiteObjects = [
        campfireGroup, // Include the entire campfire group (rocks, base, etc.) - closest
        ...logBenches, // Log benches around the fire - very close
        ...stumps, // Tree stumps near the fire - close
        ...cups, // Cups scattered around fire area - close
        cooler, // Cooler near the fire - close
        lid, // Cooler lid - close
        ...blankets, // Blankets around fire area - medium distance
        tent2Group, // Tent 2 - medium distance
        tent1Group, // Tent 1 - medium distance
        tableGroup2, // Picnic table 2 - furthest away
        tableGroup, // Picnic table 1 - further away
        leftPathGroup, // Left path to pond - medium distance
        rightPathGroup, // Right path to campsite - medium distance
        pondGroup // Pond area - furthest away, gentle glow
    ];
    pondElements.campsiteObjects = campsiteObjects;
    
    // Create clouds for the pond scene
    const clouds = createClouds(scene);
    pondElements.clouds = clouds;
    
    console.log("🏕️ Created pond scene with post-party campfire vibes");
    return pondElements;
};

// Create clouds for pond scene - similar to endless-road implementation
const createClouds = (scene) => {
    const clouds = [];
    
    // Create several clouds at different positions
    const cloudCount = 250;
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Group();
        
        // Create multiple boxes for each cloud
        const particleCount = Math.floor(Math.random() * 3) + 2; // 2-5 particles
        for (let j = 0; j < particleCount; j++) {
            const width = Math.random() * 20 + 15;  // 15-35
            const height = Math.random() * 20 + 45;;    // 3-8
            const depth = Math.random() * 10 + 8;    // 8-18
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({
                color: 0xBFBFBF,
                transparent: true,
                opacity: 0.0 // Start at 0, will fade in
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Position each box slightly offset from center
            particle.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 15
            );
            
            // Slight random rotation for variety
            particle.rotation.z = (Math.random() - 0.5) * 0.2;
            
            cloud.add(particle);
        }
        
        // Position cloud in sky
        cloud.position.set(
            (Math.random() - 0.5) * 300,  // Spread clouds (x: -100 to 100)
            40 + Math.random() * 40,       // Height variation (y: 40-80)
            (Math.random() - 0.5) * 300   // Spread along z-axis (z: -100 to 100)
        );
        
        // Store movement properties and fade timing
        cloud.userData = {
            speed: 0.1 + Math.random() * 0.2,
            originalX: cloud.position.x,
            fadePhase: -Math.PI / 2 + (Math.random() - 0.5) * 0.5, // Start at 0 opacity with slight random offset for staggered fade
            fadeSpeed: 0.0001 + Math.random() * 0.0005, // Slower fade speeds (0.0001 to 0.0002) for longer fade cycles
            maxOpacity: 0.6 + Math.random() * 0.2 // Maximum opacity (0.6 to 0.8) - fades from 0.0 to this and back
        };
        
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    return clouds;
};

// =====================================================
// INTERIOR SCENE CREATION FUNCTIONS
// =====================================================

// Create Grumby's convenience store interior
export const createCumbysInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Grumby's Interior";
    
    // Store dimensions (scaled down from 100x100 to 75x75 in world space)
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    // Store interior bounds for collision detection
    const margin = 0.5; // Small margin to prevent getting stuck on walls
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - match store dimensions
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x888888);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const backWallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(leftWallGeometry, backWallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, backWallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    // Front wall (with door opening)
    const frontWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, backWallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling - match store dimensions
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFE4B5, // Moccasin - warm cream color
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Store counter at the back
    const counterGeometry = new THREE.BoxGeometry(8, 1.2, 2);
    const counterMaterial = warmGlow(0xFF4444); // Grumby's red with warm glow
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, -6);
    interiorGroup.add(counter);
    
    // Cash register on counter
    const registerGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.5);
    const registerMaterial = warmGlow(0x000000);
    const register = new THREE.Mesh(registerGeometry, registerMaterial);
    register.position.set(2, 1.2, -6);
    interiorGroup.add(register);
    
    // Store shelves - create aisles
    const shelfGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
    const shelfMaterial = warmGlow(0x8B4513);
    
    // Create multiple aisles - 5 aisles total
    const aislePositions = [-10, -5, 0, 5, 10]; // Spread across the store width
    const shelfZPositions = []; // Will store all shelf positions for product placement
    
    // Define checkout counter positions to avoid overlap
    const checkoutCounterZ = -6;
    const checkoutCounterWidth = 8; // Counter width
    const checkoutCounterDepth = 2; // Counter depth
    const checkoutCounterXPositions = [-8, 0, 8]; // Three counters at these x positions
    
    // Helper function to check if a shelf overlaps with checkout counters
    const shelfOverlapsCheckout = (shelfX, shelfZ) => {
        const shelfWidth = 1.5;
        const shelfDepth = 0.3;
        const shelfXMin = shelfX - shelfWidth / 2;
        const shelfXMax = shelfX + shelfWidth / 2;
        const shelfZMin = shelfZ - shelfDepth / 2;
        const shelfZMax = shelfZ + shelfDepth / 2;
        
        // Check if shelf z overlaps with checkout counter z range
        const counterZMin = checkoutCounterZ - checkoutCounterDepth / 2;
        const counterZMax = checkoutCounterZ + checkoutCounterDepth / 2;
        const zOverlaps = shelfZMax >= counterZMin && shelfZMin <= counterZMax;
        
        if (!zOverlaps) return false;
        
        // Check if shelf x overlaps with any checkout counter
        for (const counterX of checkoutCounterXPositions) {
            const counterXMin = counterX - checkoutCounterWidth / 2;
            const counterXMax = counterX + checkoutCounterWidth / 2;
            if (shelfXMax >= counterXMin && shelfXMin <= counterXMax) {
                return true;
            }
        }
        return false;
    };
    
    // Create shelves for each aisle
    aislePositions.forEach((xPos) => {
        // Each aisle has shelves running along the depth
        for (let i = 0; i < 6; i++) {
            const zPos = -storeDepth/2 + 8 + i * 4; // Space shelves along depth
            // Skip shelf if it overlaps with checkout counters
            if (shelfOverlapsCheckout(xPos, zPos)) {
                continue;
            }
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(xPos, 1, zPos);
            shelf.userData.isShelf = true; // Mark for product placement
            shelf.userData.isInteractive = true;
            shelf.userData.name = "Store Shelf";
            shelf.userData.itemName = "Snack"; // Item you get from this object
            shelf.userData.flavorText = [
                "A sturdy wooden shelf lined with products. The surface is smooth from years of use, and items are arranged in neat rows. Price tags hang from the front edge.",
                "This shelf holds a variety of convenience store essentials. Products are organized by type, with popular items at eye level. Some items have been shifted by customers browsing.",
                "The shelf is well-stocked, though you notice a few gaps where items have been purchased. The products are arranged with their labels facing forward, making it easy to see what's available.",
                "A standard store shelf, its wooden surface showing signs of wear. Products are stacked efficiently, maximizing the available space. You can see where items have been recently restocked.",
                "This shelf is part of the store's main shopping area. Items are arranged to catch your attention, with colorful packaging and clear pricing. The shelf itself is functional and unadorned."
            ];
            interiorGroup.add(shelf);
            shelfZPositions.push({ x: xPos, z: zPos });
        }
    });
    
    // Add double-sided shelves (shelves on both sides of each aisle)
    aislePositions.forEach((xPos, aisleIndex) => {
        if (aisleIndex < aislePositions.length - 1) {
            const aisleCenter = (xPos + aislePositions[aisleIndex + 1]) / 2;
            // Left side of aisle
            for (let i = 0; i < 6; i++) {
                const zPos = -storeDepth/2 + 8 + i * 4;
                // Skip shelf if it overlaps with checkout counters
                if (shelfOverlapsCheckout(aisleCenter - 1.5, zPos)) {
                    continue;
                }
                const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelf.position.set(aisleCenter - 1.5, 1, zPos);
                shelf.userData.isShelf = true;
                shelf.userData.isInteractive = true;
                shelf.userData.name = "Store Shelf";
                shelf.userData.itemName = "Snack"; // Item you get from this object
                shelf.userData.flavorText = [
                    "A sturdy wooden shelf lined with products. The surface is smooth from years of use, and items are arranged in neat rows. Price tags hang from the front edge.",
                    "This shelf holds a variety of convenience store essentials. Products are organized by type, with popular items at eye level. Some items have been shifted by customers browsing.",
                    "The shelf is well-stocked, though you notice a few gaps where items have been purchased. The products are arranged with their labels facing forward, making it easy to see what's available.",
                    "A standard store shelf, its wooden surface showing signs of wear. Products are stacked efficiently, maximizing the available space. You can see where items have been recently restocked.",
                    "This shelf is part of the store's main shopping area. Items are arranged to catch your attention, with colorful packaging and clear pricing. The shelf itself is functional and unadorned."
                ];
                interiorGroup.add(shelf);
                shelfZPositions.push({ x: aisleCenter - 1.5, z: zPos });
            }
            // Right side of aisle
            for (let i = 0; i < 6; i++) {
                const zPos = -storeDepth/2 + 8 + i * 4;
                // Skip shelf if it overlaps with checkout counters
                if (shelfOverlapsCheckout(aisleCenter + 1.5, zPos)) {
                    continue;
                }
                const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelf.position.set(aisleCenter + 1.5, 1, zPos);
                shelf.userData.isShelf = true;
                shelf.userData.isInteractive = true;
                shelf.userData.name = "Store Shelf";
                shelf.userData.itemName = "Snack"; // Item you get from this object
                shelf.userData.flavorText = [
                    "A sturdy wooden shelf lined with products. The surface is smooth from years of use, and items are arranged in neat rows. Price tags hang from the front edge.",
                    "This shelf holds a variety of convenience store essentials. Products are organized by type, with popular items at eye level. Some items have been shifted by customers browsing.",
                    "The shelf is well-stocked, though you notice a few gaps where items have been purchased. The products are arranged with their labels facing forward, making it easy to see what's available.",
                    "A standard store shelf, its wooden surface showing signs of wear. Products are stacked efficiently, maximizing the available space. You can see where items have been recently restocked.",
                    "This shelf is part of the store's main shopping area. Items are arranged to catch your attention, with colorful packaging and clear pricing. The shelf itself is functional and unadorned."
                ];
                interiorGroup.add(shelf);
                shelfZPositions.push({ x: aisleCenter + 1.5, z: zPos });
            }
        }
    });
    
    // Product items on shelves (simple boxes) - more variety
    const productGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const productColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0xFF8800, 0x8800FF, 0x00FFFF];
    
    // Add products to all shelves
    shelfZPositions.forEach(({ x, z }) => {
        // Add more products per shelf (6-8 items)
        const productCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < productCount; i++) {
            const product = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            product.position.set(
                x + (Math.random() - 0.5) * 1.2,
                1.3 + Math.random() * 0.4, // Vary height on shelf
                z + (Math.random() - 0.5) * 1.2
            );
            product.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
            interiorGroup.add(product);
        }
    });
    
    // Add some larger product displays (cereal boxes, etc.)
    const largeProductGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.2);
    const largeProductPositions = [
        { x: -10, z: -storeDepth/2 + 10 },
        { x: -5, z: -storeDepth/2 + 12 },
        { x: 0, z: -storeDepth/2 + 14 },
        { x: 5, z: -storeDepth/2 + 10 },
        { x: 10, z: -storeDepth/2 + 12 }
    ];
    largeProductPositions.forEach(({ x, z }) => {
        for (let i = 0; i < 3; i++) {
            const largeProduct = new THREE.Mesh(
                largeProductGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            largeProduct.position.set(x, 1.5, z + i * 0.3);
            interiorGroup.add(largeProduct);
        }
    });
    
    // Add snack displays
    const snackGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const snackPositions = [
        { x: -7.5, z: -storeDepth/2 + 6 },
        { x: -2.5, z: -storeDepth/2 + 8 },
        { x: 2.5, z: -storeDepth/2 + 6 },
        { x: 7.5, z: -storeDepth/2 + 8 }
    ];
    snackPositions.forEach(({ x, z }) => {
        for (let i = 0; i < 8; i++) {
            const snack = new THREE.Mesh(
                snackGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            snack.position.set(
                x + (Math.random() - 0.5) * 1.5,
                1.2 + Math.random() * 0.3,
                z + (Math.random() - 0.5) * 1.5
            );
            interiorGroup.add(snack);
        }
    });
    
    // Refrigerated sections along side walls - more fridges
    const fridgeGeometry = new THREE.BoxGeometry(3, 2.5, 1.5);
    const fridgeMaterial = warmGlow(0xFFFFFF);
    
    // Left wall fridges
    const leftFridgePositions = [-storeDepth/2 + 6, -storeDepth/2 + 10, -storeDepth/2 + 14, -storeDepth/2 + 18, -storeDepth/2 + 22, -storeDepth/2 + 26];
    leftFridgePositions.forEach((zPos) => {
        const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
        fridge.position.set(-storeWidth/2 + 1.5, 1.25, zPos);
        fridge.userData.isInteractive = true;
        fridge.userData.name = "Refrigerator";
        fridge.userData.itemName = "Milk"; // Item you get from this object
        fridge.userData.flavorText = [
            "A tall white refrigerator hums quietly. The glass door reveals shelves stacked with dairy products, deli meats, and fresh produce. Condensation forms on the inside of the glass.",
            "The refrigerator's fluorescent light flickers on as you imagine opening it. Rows of milk cartons, yogurt containers, and cheese packages fill the shelves. A small puddle has collected at the bottom.",
            "Cool air escapes when you think about opening this fridge. The shelves are organized by product type - dairy on top, meats in the middle, vegetables in the crisper drawers below.",
            "This refrigerator section is well-stocked with essentials. You can see various brands competing for space, some items pushed to the back, others prominently displayed at the front.",
            "The refrigerator door is slightly fogged from the temperature difference. Inside, products are arranged with expiration dates facing forward, though some items look like they've been there a while."
        ];
        interiorGroup.add(fridge);
    });
    
    // Right wall fridges
    const rightFridgePositions = [-storeDepth/2 + 6, -storeDepth/2 + 10, -storeDepth/2 + 14, -storeDepth/2 + 18, -storeDepth/2 + 22, -storeDepth/2 + 26];
    rightFridgePositions.forEach((zPos) => {
        const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
        fridge.position.set(storeWidth/2 - 1.5, 1.25, zPos);
        fridge.userData.isInteractive = true;
        fridge.userData.name = "Refrigerator";
        fridge.userData.itemName = "Milk"; // Item you get from this object
        fridge.userData.flavorText = [
            "A tall white refrigerator hums quietly. The glass door reveals shelves stacked with dairy products, deli meats, and fresh produce. Condensation forms on the inside of the glass.",
            "The refrigerator's fluorescent light flickers on as you imagine opening it. Rows of milk cartons, yogurt containers, and cheese packages fill the shelves. A small puddle has collected at the bottom.",
            "Cool air escapes when you think about opening this fridge. The shelves are organized by product type - dairy on top, meats in the middle, vegetables in the crisper drawers below.",
            "This refrigerator section is well-stocked with essentials. You can see various brands competing for space, some items pushed to the back, others prominently displayed at the front.",
            "The refrigerator door is slightly fogged from the temperature difference. Inside, products are arranged with expiration dates facing forward, though some items look like they've been there a while."
        ];
        interiorGroup.add(fridge);
    });
    
    // Beverage coolers near checkout
    const coolerGeometry = new THREE.BoxGeometry(4, 2, 1);
    const coolerMaterial = warmGlow(0xCCEEFF);
    
    // Left side cooler - rotated 90 degrees and moved down the wall
    const leftCooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    leftCooler.rotation.y = Math.PI / 2; // Rotate 90 degrees
    leftCooler.position.set(-storeWidth/2 + 0.5, 1, 10); // Moved further back along the wall
    leftCooler.userData.isInteractive = true;
    leftCooler.userData.name = "Ice Cream Cooler";
    leftCooler.userData.itemName = "Ice Cream"; // Item you get from this object
    leftCooler.userData.flavorText = [
        "A horizontal cooler filled with chilled ice cream. The glass top reveals rows of ice cream cones, ice cream sandwiches, and ice cream bars. The surface is cool to the touch.",
        "This cooler keeps ice cream at the perfect temperature. You can see condensation forming on the inside of the glass, and the ice cream is arranged by type - cones, sandwiches, and bars.",
        "The cooler hums softly, maintaining its cold temperature. Some ice cream cones have frost forming on their caps, suggesting they've been in there a while.",
        "A well-organized ice cream cooler with ice cream sorted by brand and type. The glass is slightly fogged, making it hard to see everything clearly, but you can make out the colorful labels.",
        "This cooler is positioned conveniently near the checkout area. The ice cream inside are perfectly chilled, and you notice a few empty spots where popular items used to be.",
        "Do they need two of these?"
    ];
    interiorGroup.add(leftCooler);
    
    // Right side cooler - rotated 90 degrees and moved down the wall
    const rightCooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    rightCooler.rotation.y = Math.PI / 2; // Rotate 90 degrees
    rightCooler.position.set(storeWidth/2 - 0.5, 1, 10); // Moved further back along the wall
    rightCooler.userData.isInteractive = true;
    rightCooler.userData.name = "Ice Cream Cooler";
    rightCooler.userData.itemName = "Ice Cream"; // Item you get from this object
    rightCooler.userData.flavorText = [
        "A horizontal cooler filled with chilled ice cream. The glass top reveals rows of ice cream cones, ice cream sandwiches, and ice cream bars. The surface is cool to the touch.",
        "This cooler keeps ice cream at the perfect temperature. You can see condensation forming on the inside of the glass, and the ice cream is arranged by type - cones, sandwiches, and bars.",
        "The cooler hums softly, maintaining its cold temperature. Some ice cream cones have frost forming on their caps, suggesting they've been in there a while.",
        "A well-organized ice cream cooler with ice cream sorted by brand and type. The glass is slightly fogged, making it hard to see everything clearly, but you can make out the colorful labels.",
        "This cooler is positioned conveniently near the checkout area. The ice cream inside are perfectly chilled, and you notice a few empty spots where popular items used to be."
    ];
    interiorGroup.add(rightCooler);
    
    // Magazine rack near front - moved back, rotated 90 degrees
    const magazineRackGeometry = new THREE.BoxGeometry(3, 1.5, 0.5);
    const magazineRackMaterial = warmGlow(0x8B4513);
    const magazineRack = new THREE.Mesh(magazineRackGeometry, magazineRackMaterial);
    magazineRack.rotation.y = Math.PI / 2; // Rotate 90 degrees
    magazineRack.position.set(-storeWidth/2 + 0.5, 0.75, storeDepth/2 - 8); // Adjusted x position for rotation
    magazineRack.userData.isInteractive = true;
    magazineRack.userData.name = "Magazine Rack";
    magazineRack.userData.itemName = "Magazine"; // Item you get from this object
    magazineRack.userData.flavorText = [
        "A wooden magazine rack displays an assortment of publications. Tabloids, lifestyle magazines, and local newspapers are arranged haphazardly. Some covers look slightly worn from browsing.",
        "The magazine rack is positioned near the checkout, perfect for impulse purchases. You can see celebrity gossip magazines, cooking publications, and a few local papers mixed together.",
        "Magazines are stacked in slots, their colorful covers catching your eye. Some issues are clearly older, their covers slightly faded from exposure to the fluorescent lights.",
        "A classic convenience store magazine rack. The publications range from news to entertainment, with some covers featuring bold headlines designed to grab attention.",
        "The rack holds a variety of reading material for customers waiting in line. Some magazines are perfectly aligned, while others are askew, suggesting recent browsing."
    ];
    interiorGroup.add(magazineRack);
    
    // Add some magazines
    const magazineGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.3);
    for (let i = 0; i < 12; i++) {
        const magazine = new THREE.Mesh(
            magazineGeometry,
            warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
        );
        magazine.position.set(
            -storeWidth/2 + 0.5 + (Math.random() - 0.5) * 0.3, // Adjusted for rotated rack
            0.9 + Math.random() * 0.3,
            storeDepth/2 - 8 + (Math.random() - 0.5) * 2.5 // Adjusted for rotated rack
        );
        interiorGroup.add(magazine);
    }
    
    // Candy displays - multiple displays wrapping around the corner from right wall to front wall
    const candyDisplayWidth = 3; // Width of display
    const candyDisplayHeight = 1.5;
    const candyDisplayDepth = 1.5;
    const candyDisplayGeometry = new THREE.BoxGeometry(candyDisplayWidth, candyDisplayHeight, candyDisplayDepth);
    const candyDisplayMaterial = warmGlow(0xFFB6C1);
    const candyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    
    // Helper function to create a candy display with items
    const createCandyDisplay = (x, z, rotation) => {
        const display = new THREE.Mesh(candyDisplayGeometry, candyDisplayMaterial);
        display.rotation.y = rotation;
        display.position.set(x, candyDisplayHeight / 2, z);
        display.userData.isInteractive = true;
        display.userData.name = "Candy Display";
        display.userData.itemName = "Candy Bar"; // Item you get from this object
        display.userData.flavorText = [
            "A colorful array of candy bars and snacks arranged in neat rows. The packaging glints under the fluorescent lights, promising sweet satisfaction. Some bars look slightly dusty, suggesting they've been here a while.",
            "Rows of brightly colored wrappers catch your eye. Chocolate bars, gummy candies, and sour treats are stacked neatly, though a few packages appear to have been opened and resealed.",
            "The candy display is a rainbow of temptation. Each wrapper promises something different - chocolate, fruit flavors, sour surprises. You notice some items are slightly askew, as if someone was browsing recently.",
            "An organized chaos of sweets stretches before you. The fluorescent lights make the colorful wrappers pop, but you can't help noticing a few empty spots where popular items used to be.",
            "The candy bars are arranged by type - chocolate on one side, fruity on the other. The display looks well-stocked, though some of the lower shelves have items that seem to have been there longer.",
            "A warm, glowing coffee machine sits humming quietly. The display shows various coffee options, though most of the buttons are worn smooth from years of use. A faint aroma of stale coffee grounds lingers in the air.",
            "The coffee machine's LED display flickers between different brew options. A small 'Out of Order' sign has been taped over one of the selections, but someone has scratched it off.",
            "Steam occasionally escapes from the machine's spout, and you can hear the gurgle of water heating inside. The selection buttons are sticky to the touch, suggesting frequent use.",
            "The machine hums with a low, steady vibration. Coffee stains mark the area around the spout, and a small puddle has collected on the counter beneath it.",
            "Various coffee options are displayed on a faded screen. The machine looks well-maintained, but the 'Decaf' button appears to be permanently stuck in the pressed position."
        ];
        interiorGroup.add(display);
        
        // Add candy items on the display
        const candySize = 0.15; // Size of candy geometry
        const candyHalfSize = candySize / 2; // Half size to account for bounds
        for (let i = 0; i < 15; i++) {
            const candy = new THREE.Mesh(
                candyGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            // Adjust positions based on rotation, accounting for candy size to prevent spillover
            if (rotation === Math.PI / 2) {
                // Rotated 90 degrees (along right/left wall) - width becomes depth
                // x constrained by depth, z constrained by width
                const maxXOffset = (candyDisplayDepth / 2) - candyHalfSize;
                const maxZOffset = (candyDisplayWidth / 2) - candyHalfSize;
                candy.position.set(
                    x + (Math.random() - 0.5) * maxXOffset * 2,
                    candyDisplayHeight / 2 + 0.1 + Math.random() * 0.3,
                    z + (Math.random() - 0.5) * maxZOffset * 2
                );
            } else {
                // Not rotated (along front/back wall)
                // x constrained by width, z constrained by depth
                const maxXOffset = (candyDisplayWidth / 2) - candyHalfSize;
                const maxZOffset = (candyDisplayDepth / 2) - candyHalfSize;
                candy.position.set(
                    x + (Math.random() - 0.5) * maxXOffset * 2,
                    candyDisplayHeight / 2 + 0.1 + Math.random() * 0.3,
                    z + (Math.random() - 0.5) * maxZOffset * 2
                );
            }
            interiorGroup.add(candy);
        }
        
        // Add coffee cups on top of the display - randomly and sparingly (25% chance per display)
        if (Math.random() < 0.45) {
            const cupGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8);
            const cupMaterial = warmGlow(0xFFFFFF);
            // Display is positioned at candyDisplayHeight/2, so top is at candyDisplayHeight
            const displayTopY = candyDisplayHeight + 0.15; // Top of display + half cup height
            const cupTopY = displayTopY + 0.15; // Top of cup (displayTopY + half cup height)
            
            const cup = new THREE.Mesh(cupGeometry, cupMaterial);
            let cupX, cupZ;
            if (rotation === Math.PI / 2) {
                // Rotated display - random position along z-axis (width becomes depth)
                cupZ = z - candyDisplayWidth / 2 + Math.random() * candyDisplayWidth;
                cupX = x + (Math.random() - 0.5) * 0.1; // Slight random offset
                cup.position.set(cupX, displayTopY, cupZ);
            } else {
                // Not rotated - random position along x-axis
                cupX = x - candyDisplayWidth / 2 + Math.random() * candyDisplayWidth;
                cupZ = z + (Math.random() - 0.5) * 0.1; // Slight random offset
                cup.position.set(cupX, displayTopY, cupZ);
            }
            interiorGroup.add(cup);
            
            // Add smaller steam particles rising from the cup (like Donut Galaxy mugs)
            const cupSteamParticles = [];
            const numCupSteamParticles = 1 + Math.floor(Math.random() * 2); // 1 to 2 particles
            
            // Create a group for the cup steam
            const cupSteamGroup = new THREE.Group();
            cupSteamGroup.position.set(cupX, cupTopY, cupZ); // Position at top of cup
            
            for (let i = 0; i < numCupSteamParticles; i++) {
                // Create smaller steam particles for cups
                const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // Same as other steam
                const steamGeometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 4); // Size 0.04-0.06
                const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
                const initialX = (Math.random() - 0.5) * 0.08; // Random x offset (relative to cup)
                const initialZ = (Math.random() - 0.5) * 0.08; // Random z offset (relative to cup)
                steamParticle.position.set(
                    initialX,
                    0, // Relative to cupSteamGroup position (starts at top of cup)
                    initialZ
                );
                steamParticle.userData.initialY = 0; // Start at group origin
                steamParticle.userData.initialX = initialX;
                steamParticle.userData.initialZ = initialZ;
                steamParticle.userData.speed = 0.04 + Math.random() * 0.02; // Speed 0.04-0.06
                steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
                steamParticle.userData.baseScale = 0.8 + Math.random() * 0.3; // Base scale for visibility
                cupSteamGroup.add(steamParticle);
                cupSteamParticles.push(steamParticle);
            }
            
            // Store steam particles in cupSteamGroup's userData for animation
            cupSteamGroup.userData.steamParticles = cupSteamParticles;
            cupSteamGroup.userData.isMugSteamGroup = true; // Mark as mug steam for animation
            interiorGroup.add(cupSteamGroup);
        }
        
        return { x, z, rotation }; // Return position info for tracking
    };
    
    // Coffee corner at the front-right corner (actually in the corner)
    const coffeeMachineWidth = 1.5;
    const coffeeMachineDepth = 1.5;
    // Position coffee corner flush with the corner walls
    const coffeeCornerX = storeWidth/2 - coffeeMachineWidth / 2; // Flush with right wall
    const coffeeCornerZ = storeDepth/2 - coffeeMachineDepth / 2; // Flush with front wall
    
    // Calculate coffee corner boundaries
    const coffeeCornerXStart = coffeeCornerX - coffeeMachineWidth / 2; // Left edge of coffee corner
    const coffeeCornerXEnd = coffeeCornerX + coffeeMachineWidth / 2; // Right edge (at wall)
    const coffeeCornerZStart = coffeeCornerZ - coffeeMachineDepth / 2; // Back edge of coffee corner
    const coffeeCornerZEnd = coffeeCornerZ + coffeeMachineDepth / 2; // Front edge (at wall)
    
    // Coffee machine
    const coffeeMachineGeometry = new THREE.BoxGeometry(coffeeMachineWidth, 1.5, coffeeMachineDepth);
    const coffeeMachineMaterial = warmGlow(0xFFB6C1);
    const coffeeMachine = new THREE.Mesh(coffeeMachineGeometry, coffeeMachineMaterial);
    coffeeMachine.position.set(coffeeCornerX, 0.75, coffeeCornerZ);
    coffeeMachine.userData.isInteractive = true;
    coffeeMachine.userData.name = "Coffee Machine";
    coffeeMachine.userData.itemName = "Coffee"; // Item you get from this object
    coffeeMachine.userData.flavorText = [
        "A warm, glowing coffee machine sits humming quietly. The display shows various coffee options, though most of the buttons are worn smooth from years of use. A faint aroma of stale coffee grounds lingers in the air.",
        "The coffee machine's LED display flickers between different brew options. A small 'Out of Order' sign has been taped over one of the selections, but someone has scratched it off.",
        "Steam occasionally escapes from the machine's spout, and you can hear the gurgle of water heating inside. The selection buttons are sticky to the touch, suggesting frequent use.",
        "The machine hums with a low, steady vibration. Coffee stains mark the area around the spout, and a small puddle has collected on the counter beneath it.",
        "Various coffee options are displayed on a faded screen. The machine looks well-maintained, but the 'Decaf' button appears to be permanently stuck in the pressed position."
    ];
    interiorGroup.add(coffeeMachine);
    
    // Coffee pot on top of coffee machine
    const coffeeMachineTopY = 0.5 + 1.5 / 2; // Top of coffee machine (y position + half height)
    const coffeePotGroup = new THREE.Group();
    
    // Coffee pot body (main cylinder)
    const potBodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
    const potMaterial = warmGlow(0x8B4513); // Brown coffee pot color
    const potBody = new THREE.Mesh(potBodyGeometry, potMaterial);
    potBody.position.y = 0.2; // Half height of pot body
    coffeePotGroup.add(potBody);
    
    // Coffee pot lid (smaller cylinder on top) - dark brown
    const potLidGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 8);
    const darkBrownMaterial = warmGlow(0x6A3A3A); // Dark brown (between black and brown) for lid and handle
    const potLid = new THREE.Mesh(potLidGeometry, darkBrownMaterial);
    potLid.position.y = 0.425; // On top of pot body
    coffeePotGroup.add(potLid);
    
    // Coffee pot handle (torus shape) - dark brown
    const handleGeometry = new THREE.TorusGeometry(0.12, 0.03, 6, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, darkBrownMaterial);
    handle.rotation.z = Math.PI / 2 + Math.PI + 0.2; // Rotate to be vertical, then 180 degrees
    handle.position.set(0.25, 0.2, 0); // To the right side of pot
    coffeePotGroup.add(handle);
    
    // Coffee pot spout (small box)
    const spoutGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const spout = new THREE.Mesh(spoutGeometry, potMaterial);
    spout.position.set(-0.25, 0.25, 0); // To the left side of pot, moved in closer, slightly higher
    coffeePotGroup.add(spout);
    
    // Steam particles rising from the pot
    const steamParticles = [];
    const numSteamParticles = 3 + Math.floor(Math.random() * 3); // 3 to 5 particles
    
    for (let i = 0; i < numSteamParticles; i++) {
        // Create a unique material instance for each particle so they can fade independently
        const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // White, semi-transparent
        const steamGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 6, 4);
        const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
        const initialX = (Math.random() - 0.5) * 0.15; // Random x offset
        const initialZ = (Math.random() - 0.5) * 0.15; // Random z offset
        steamParticle.position.set(
            initialX,
            0.5, // Start at top of pot
            initialZ
        );
        steamParticle.userData.initialY = 0.5;
        steamParticle.userData.initialX = initialX;
        steamParticle.userData.initialZ = initialZ;
        steamParticle.userData.speed = 0.05 + Math.random() * 0.03; // Much slower rise speed
        steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
        steamParticle.userData.baseScale = 0.8 + Math.random() * 0.4; // Varying size
        coffeePotGroup.add(steamParticle);
        steamParticles.push(steamParticle);
    }
    
    // Store steam particles in coffee pot group userData for animation
    coffeePotGroup.userData.steamParticles = steamParticles;
    
    // Position coffee pot on top of machine, centered
    coffeePotGroup.position.set(coffeeCornerX, coffeeMachineTopY + 0.2, coffeeCornerZ);
    coffeePotGroup.rotation.y = 325; // Rotate to face inward from the wall
    interiorGroup.add(coffeePotGroup);
    
    // Coffee corner sign/display - bigger, on the wall, higher up
    const coffeeSignGeometry = new THREE.BoxGeometry(4, 2.5, 2.5); // Bigger sign
    const coffeeSignMaterial = warmGlow(0xFFD700);
    const coffeeSign = new THREE.Mesh(coffeeSignGeometry, coffeeSignMaterial);
    coffeeSign.rotation.y = Math.PI / 2; // Rotate to face inward from the wall
    // When rotated, depth (0.4) becomes width along x-axis, so sign extends 0.2 units from center
    // Position flush against right wall: storeWidth/2 - 0.2 (half of depth)
    coffeeSign.position.set(storeWidth/2 - 0.2, 5, storeDepth/2 - 20); // Flush against right wall
    interiorGroup.add(coffeeSign);
    
    // Interactive marker under the coffee sign
    const coffeeSignAreaMarker = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1), // Very small, invisible
        warmGlow(0x000000, 0) // Completely transparent
    );
    coffeeSignAreaMarker.position.set(storeWidth/2 - 2, 1, storeDepth/2 - 20); // Under the sign
    coffeeSignAreaMarker.userData.isInteractive = true;
    coffeeSignAreaMarker.userData.name = "Coffee Corner";
    coffeeSignAreaMarker.userData.itemName = "Coffee"; // Item you get from this object
    coffeeSignAreaMarker.userData.flavorText = [
        "A large golden sign hangs on the wall above, marking this as the coffee corner. The area below is dedicated to coffee service, with the machine and supplies arranged neatly.",
        "You're standing beneath the coffee corner sign. The warm glow from the sign above casts a golden light on the coffee machine and cups below. The air carries a faint aroma of coffee.",
        "The coffee corner is clearly marked by the prominent sign overhead. This area feels like a small oasis in the store, dedicated entirely to caffeinated beverages and the ritual of coffee making.",
        "Beneath the glowing coffee sign, the corner is set up for self-service. The coffee machine sits ready, and you can see cups, lids, and condiments arranged for customer convenience.",
        "The coffee corner sign is impossible to miss - it's large, golden, and positioned high on the wall. The area below is organized for efficiency, with everything a customer needs within easy reach.",
        "Standing under the coffee sign, you notice how this corner has been designed to feel welcoming. The sign's warm glow invites you to pause and enjoy a hot beverage."
    ];
    interiorGroup.add(coffeeSignAreaMarker);
    
    // Candy displays along the right wall (rotated 90 degrees)
    // When rotated 90 degrees: width (3) becomes depth along z-axis, depth (1.5) becomes width along x-axis
    // Right cooler is at z=10, extends from z=8 to z=12 (4 units deep when rotated)
    const coolerZCenter = 10;
    const coolerDepth = 4; // When rotated, width becomes depth
    const coolerZStart = coolerZCenter - coolerDepth / 2; // z=8
    const coolerZEnd = coolerZCenter + coolerDepth / 2; // z=12
    
    // Position candy displays so their corners touch, wrapping around the coffee corner
    // The coffee corner is at the store corner, so candy displays should meet behind/left of it
    // Right wall display (rotated): front-right corner should be at the meeting point
    // Front wall display: front-right corner should be at the same meeting point
    // Meeting point should be: x = coffeeCornerXStart - candyDisplayWidth/2, z = coffeeCornerZStart - candyDisplayWidth/2
    // This ensures they wrap around the coffee corner and touch at their corners
    
    // Right wall displays - front corner touches front wall display's corner
    const meetingZ = coffeeCornerZStart - candyDisplayWidth / 2; // Where corners meet (behind coffee corner)
    const rightWallFirstZ = meetingZ; // First display center
    const rightWallEndZ = coolerZStart - candyDisplayWidth / 2; // Stop before cooler
    const numRightWallDisplays = Math.floor((rightWallFirstZ - rightWallEndZ) / candyDisplayWidth);
    
    for (let i = 0; i < numRightWallDisplays; i++) {
        const z = rightWallFirstZ - i * candyDisplayWidth;
        if (z - candyDisplayWidth / 2 > coolerZEnd) { // Make sure it doesn't overlap with cooler
            createCandyDisplay(storeWidth/2 - candyDisplayDepth / 2, z, Math.PI / 2);
        }
    }
    
    // Candy displays along the front wall (not rotated)
    // Right corner touches right wall display's corner
    const meetingX = coffeeCornerXStart - candyDisplayWidth / 2; // Where corners meet (left of coffee corner)
    const frontWallFirstX = meetingX; // First display center
    const numFrontWallDisplays = 4;
    for (let i = 0; i < numFrontWallDisplays; i++) {
        const x = frontWallFirstX - i * candyDisplayWidth; // Space by width (touching)
        createCandyDisplay(x, storeDepth/2 - candyDisplayDepth / 2, 0);
    }
    
    // Drink fridges along the back wall - attached together in a continuous row
    const drinkFridgeWidth = 2; // Width of each fridge unit
    const drinkFridgeHeight = 3;
    const drinkFridgeDepth = 1.5;
    const drinkFridgeGeometry = new THREE.BoxGeometry(drinkFridgeWidth, drinkFridgeHeight, drinkFridgeDepth);
    const drinkFridgeMaterial = warmGlow(0xCCEEFF); // Light blue for drink fridges
    
    // Calculate how many fridges fit across the back wall (leaving some margin)
    const totalFridgeWidth = storeWidth - 4; // Leave 2 units margin on each side
    const numFridges = Math.floor(totalFridgeWidth / drinkFridgeWidth);
    const startX = -totalFridgeWidth / 2 + drinkFridgeWidth / 2;
    const backWallZ = -storeDepth/2 + drinkFridgeDepth / 2; // Position against back wall
    
    // Create continuous row of attached fridges
    for (let i = 0; i < numFridges; i++) {
        const xPos = startX + i * drinkFridgeWidth;
        const drinkFridge = new THREE.Mesh(drinkFridgeGeometry, drinkFridgeMaterial);
        drinkFridge.position.set(xPos, drinkFridgeHeight / 2, backWallZ);
        drinkFridge.userData.isInteractive = true;
        drinkFridge.userData.name = "Drink Fridge";
        drinkFridge.userData.itemName = "Soda"; // Item you get from this object
        drinkFridge.userData.flavorText = [
            "A tall glass-fronted refrigerator filled with colorful bottles and cans. The cool air escapes in a gentle mist when you imagine opening it. Rows of energy drinks, sodas, and water bottles line the shelves, their labels bright and inviting.",
            "The fridge's glass door is slightly fogged, obscuring some of the drinks inside. Through the condensation, you can see rows of energy drinks, sodas, and water bottles arranged by type.",
            "Cool air radiates from the refrigerator. The bottles inside are organized by brand, with energy drinks on the top shelf and sodas below. A few bottles are missing, leaving gaps in the otherwise neat arrangement.",
            "The drink fridge hums quietly, keeping its contents chilled. Colorful labels catch your eye - bright blues, reds, and greens promising refreshment. Some bottles have condensation beading on their surfaces.",
            "Rows of drinks stretch from top to bottom. Energy drinks dominate the upper shelves, while sodas and water bottles fill the lower ones. The glass door reflects the store's fluorescent lighting, making it hard to see everything clearly.",
            "The refrigerator is well-stocked with an impressive variety. You notice some drinks are positioned with their labels facing forward, while others are turned sideways, suggesting recent restocking.",
            "A gentle mist escapes when you imagine opening the door. The drinks are organized by temperature zones, with the coldest items at the back. Some bottles have price stickers that don't quite match the shelf tags."
        ];
        interiorGroup.add(drinkFridge);
        
        // Each fridge gets 1, 2, or 3 base colors
        // Define color palettes - each fridge uses one palette with 1-3 colors
        const colorPalettes = [
            [0x0066CC, 0x004499], // Blue variants (Red Bull style) - 2 colors
            [0xCC0000], // Red (Coca-Cola style) - 1 color
            [0xCC0000, 0x0000FF], // Red + Blue - 2 colors
            [0x00CC00, 0x009900], // Green variants (Sprite style) - 2 colors
            [0xFF6600, 0xCC5500, 0xFF8800], // Orange variants (Fanta style) - 3 colors
            [0x9900CC, 0x7700AA], // Purple variants - 2 colors
            [0xFFFF00], // Yellow - 1 color
            [0x00CCCC, 0x009999, 0x00FFFF], // Cyan variants - 3 colors
            [0xFF0066, 0xCC0055], // Pink variants - 2 colors
            [0xFF0000, 0x00FF00, 0x0000FF], // Red + Green + Blue - 3 colors
            [0xFF8800, 0x00CCCC], // Orange + Cyan - 2 colors
            [0x9900CC, 0xFFFF00] // Purple + Yellow - 2 colors
        ];
        const palette = colorPalettes[i % colorPalettes.length];
        const numColors = palette.length; // 1, 2, or 3 colors
        
        // Add drink bottles inside each fridge (visible through glass)
        const drinkBottleGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        
        // Create multiple rows of bottles on shelves
        for (let shelf = 0; shelf < 5; shelf++) {
            const shelfY = 0.4 + shelf * 0.5;
            const bottlesPerShelf = 4; // Chunks of 2
            
            // Each shelf uses one of the colors from the palette, cycling through them
            const colorIndex = shelf % numColors;
            const shelfColor = palette[colorIndex];
            const baseOpacity = 0.7 + (shelf * 0.05); // Slightly different opacity per shelf
            
            // Calculate proper x positioning within fridge width (centered)
            const fridgeMargin = 0.2; // Margin from fridge edges
            const availableWidth = drinkFridgeWidth - (fridgeMargin * 2);
            const bottleWidth = 0.2; // Width of each bottle
            const spacingBetweenBottles = 0.15; // Fixed spacing between bottles
            
            // Calculate total width needed for all bottles with spacing
            const totalBottlesWidth = (bottlesPerShelf * bottleWidth) + ((bottlesPerShelf - 1) * spacingBetweenBottles);
            
            // Calculate offset from fridge center to start of bottle group (left edge)
            const bottlesGroupLeftEdge = -totalBottlesWidth / 2;
            
            for (let j = 0; j < bottlesPerShelf; j++) {
                // Random chance for item to be out of stock (15% chance)
                if (Math.random() < 0.15) {
                    continue; // Skip this bottle - out of stock
                }
                
                // Position bottles evenly spaced and centered within the fridge
                // xPos is the center of the fridge, so position relative to that
                // Start from left edge of group, then add spacing and bottle width to get each bottle's center
                const bottleX = xPos + bottlesGroupLeftEdge + (j * (bottleWidth + spacingBetweenBottles)) + (bottleWidth / 2);
                
                // Vary opacity slightly for visual interest (like regular vs sugar-free)
                const bottleOpacity = baseOpacity + (Math.random() - 0.5) * 0.15;
                const clampedOpacity = Math.max(0.5, Math.min(0.95, bottleOpacity));
                
                const bottle = new THREE.Mesh(
                    drinkBottleGeometry,
                    warmGlow(shelfColor, clampedOpacity)
                );
                bottle.position.set(
                    bottleX + (Math.random() - 0.5) * 0.05, // Small random offset
                    shelfY + (Math.random() - 0.5) * 0.1,
                    backWallZ + 0.4 + Math.random() * 0.2
                );
                interiorGroup.add(bottle);
            }
        }
    }
    
    // Add a top frame/lighting panel above the fridges
    // Calculate actual width of the fridge bank based on number of fridges
    const actualFridgeBankWidth = numFridges * drinkFridgeWidth;
    const fridgeBankCenterX = startX + (numFridges - 1) * drinkFridgeWidth / 2;
    const topPanelGeometry = new THREE.BoxGeometry(actualFridgeBankWidth, 0.3, drinkFridgeDepth + 0.2);
    const topPanelMaterial = warmGlow(0xFFFFFF, 0.9);
    const topPanel = new THREE.Mesh(topPanelGeometry, topPanelMaterial);
    topPanel.position.set(fridgeBankCenterX, drinkFridgeHeight + 0.15, backWallZ);
    interiorGroup.add(topPanel);
    
    // More checkout counters
    for (let i = 0; i < 3; i++) {
        const checkoutCounter = new THREE.Mesh(counterGeometry, counterMaterial);
        checkoutCounter.position.set(-8 + i * 8, 0.6, -6);
        checkoutCounter.userData.isInteractive = true;
        checkoutCounter.userData.name = "Checkout Counter";
        checkoutCounter.userData.itemName = "Receipt"; // Item you get from this object
        checkoutCounter.userData.flavorText = [
            "A checkout counter with a worn wooden surface. The cash register sits to one side, its display screen glowing dimly. A small conveyor belt runs along the front, ready for scanning items.",
            "This checkout lane has seen countless transactions. The counter surface is smooth from years of use, and there's a small area for bagging purchases. The register's buttons are worn smooth.",
            "A standard convenience store checkout counter. The cash register displays various function buttons, and there's space for impulse purchases like gum and batteries near the register.",
            "The checkout counter is positioned to face the store entrance. The cash register is an older model, its display showing the time and ready for the next transaction.",
            "This checkout lane is equipped with a scanner and cash register. A small divider separates this lane from the next, and there's a card reader positioned for easy access."
        ];
        interiorGroup.add(checkoutCounter);
        
        // Cash register on each counter
        const reg = new THREE.Mesh(registerGeometry, registerMaterial);
        reg.position.set(-8 + i * 8 + 2, 1.2, -6);
        interiorGroup.add(reg);
    }
    
    
    // Endcap displays at aisle ends - front ones moved back and rotated
    const endcapGeometry = new THREE.BoxGeometry(4, 1.8, 1);
    const endcapMaterial = warmGlow(0xFFD700);
    const endcapPositions = [
        { x: -7.5, z: -storeDepth/2 + 6, rotation: 0 }, // Back endcaps stay the same
        { x: -2.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: 2.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: 7.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: -7.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 }, // Front endcaps rotated 90 degrees
        { x: -2.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 },
        { x: 2.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 },
        { x: 7.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 }
    ];
    endcapPositions.forEach(({ x, z, rotation }) => {
        const endcap = new THREE.Mesh(endcapGeometry, endcapMaterial);
        endcap.rotation.y = rotation;
        endcap.position.set(x, 0.9, z);
        endcap.userData.isInteractive = true;
        endcap.userData.name = "Endcap Display";
        endcap.userData.itemName = "Snack"; // Item you get from this object
        endcap.userData.flavorText = [
            "A promotional endcap display showcasing featured products. Brightly colored items are arranged to catch your attention as you walk down the aisle. A small price tag dangles from the top.",
            "This endcap is strategically placed at the aisle end to maximize visibility. Products are stacked in an eye-catching pyramid formation, with the most popular items at eye level.",
            "An endcap display featuring this week's specials. The products are arranged with care, their labels facing outward. Some items have small promotional stickers attached.",
            "The endcap is a golden opportunity for impulse purchases. Products are displayed prominently, and you notice some items are positioned to create visual interest.",
            "This endcap display changes regularly to feature different products. Currently, it's showcasing a mix of snacks and convenience items, all arranged to maximize their appeal."
        ];
        interiorGroup.add(endcap);
        
        // Add products on endcap
        for (let i = 0; i < 6; i++) {
            const endcapProduct = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            endcapProduct.position.set(
                x + (Math.random() - 0.5) * 1.8,
                1.1 + Math.random() * 0.4,
                z + (Math.random() - 0.5) * 0.8
            );
            interiorGroup.add(endcapProduct);
        }
    });
    
    // Add some floor displays (promotional items) - front ones moved back
    const floorDisplayGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    const floorDisplayMaterial = warmGlow(0x888888);
    const floorDisplayPositions = [
        { x: -9, z: -storeDepth/2 + 12 }, // Back displays stay the same
        { x: -4, z: -storeDepth/2 + 16 },
        { x: 4, z: -storeDepth/2 + 12 },
        { x: 9, z: -storeDepth/2 + 16 },
        { x: -9, z: storeDepth/2 - 16 }, // Front displays moved back from -10 to -16
        { x: 9, z: storeDepth/2 - 16 }
    ];
    floorDisplayPositions.forEach(({ x, z }) => {
        const floorDisplay = new THREE.Mesh(floorDisplayGeometry, floorDisplayMaterial);
        floorDisplay.position.set(x, 0.15, z);
        floorDisplay.userData.isInteractive = true;
        floorDisplay.userData.name = "Floor Display";
        floorDisplay.userData.itemName = "Snack"; // Item you get from this object
        floorDisplay.userData.flavorText = [
            "A low promotional display sitting on the floor. Products are stacked in neat pyramids, creating an eye-catching arrangement. A small sign indicates these are on special.",
            "This floor display features bulk items or promotional products. The items are carefully arranged to look appealing, though some stacks have been disrupted by customers browsing.",
            "A floor display positioned to catch shoppers' attention. Products are stacked higher than usual, creating a sense of abundance. The display looks like it was recently restocked.",
            "This promotional floor display showcases items that are on sale. The products are arranged in an organized but casual way, suggesting they're meant to feel accessible.",
            "A low-profile floor display with products stacked in an attractive formation. Some items have fallen over, and you can see where customers have picked through the selection."
        ];
        interiorGroup.add(floorDisplay);
        
        // Stack products on display
        for (let i = 0; i < 4; i++) {
            const displayProduct = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            displayProduct.position.set(
                x + (Math.random() - 0.5) * 1.2,
                0.3 + i * 0.35,
                z + (Math.random() - 0.5) * 1.2
            );
            interiorGroup.add(displayProduct);
        }
    });
    
    // Exit door at the front (where player enters)
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    // Collect all interactive items for flavor text system
    const interactiveItems = [];
    interiorGroup.traverse((object) => {
        if (object.userData && object.userData.isInteractive) {
            interactiveItems.push(object);
        }
    });
    interiorGroup.userData.interactiveItems = interactiveItems;
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    
    console.log("🏪 Created Grumby's interior");
    return interiorGroup;
};

// Create a generic shop interior (template for other shops)
export const createShopInterior = (scene, interiorType, shopName, storeWidth = 15, storeDepth = 12) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = `${shopName} Interior`;
    
    // All interiors render at 100x100 base size and are scaled to 75x75 in world space
    storeWidth = INTERIOR_BASE_SIZE;
    storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    // Store interior bounds for collision detection
    const margin = 0.5; // Small margin to prevent getting stuck on walls
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - match store dimensions
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x888888);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    
    // Basic walls
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const backWallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    // Left and right walls
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, backWallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, backWallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    // Front wall (with door opening)
    const frontWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xDDA0DD, // Plum - soft purple
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Add furniture and details based on shop type
    switch(interiorType) {
        case 'pizza': // Grohos Pizza
            // Pizza oven at the back
            const ovenGeometry = new THREE.BoxGeometry(4, 3, 2);
            const ovenMaterial = warmGlow(0x333333);
            const oven = new THREE.Mesh(ovenGeometry, ovenMaterial);
            oven.position.set(0, 1.5, -storeDepth/2 + 1);
            interiorGroup.add(oven);
            
            // Counter/order area
            const pizzaCounterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
            const pizzaCounterMaterial = warmGlow(0xCC0000);
            const pizzaCounter = new THREE.Mesh(pizzaCounterGeometry, pizzaCounterMaterial);
            pizzaCounter.position.set(0, 0.6, 2);
            interiorGroup.add(pizzaCounter);
            
            // Table and chair geometries (defined once for reuse)
            const tableGeometry = new THREE.BoxGeometry(2, 0.8, 1.5);
            const tableMaterial = warmGlow(0x8B4513);
            const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
            const chairMaterial = warmGlow(0x654321);
            
            // Tables and chairs
            for (let i = 0; i < 3; i++) {
                const table = new THREE.Mesh(tableGeometry, tableMaterial);
                table.position.set(-8 + i * 8, 0.4, -4);
                interiorGroup.add(table);
                
                // Chairs around table
                for (let j = 0; j < 2; j++) {
                    const chair = new THREE.Mesh(chairGeometry, chairMaterial);
                    chair.position.set(-8 + i * 8 + (j === 0 ? -1.2 : 1.2), 0.5, -4);
                    interiorGroup.add(chair);
                }
            }
            
            // Display case with pizza slices
            const displayCaseGeometry = new THREE.BoxGeometry(4, 2, 1);
            const displayCaseMaterial = warmGlow(0xCCCCCC);
            const displayCase = new THREE.Mesh(displayCaseGeometry, displayCaseMaterial);
            displayCase.position.set(0, 1, 4);
            interiorGroup.add(displayCase);
            
            // Prep station
            const prepStationGeometry = new THREE.BoxGeometry(4, 1.5, 2);
            const prepStationMaterial = warmGlow(0xFFFFFF);
            const prepStation = new THREE.Mesh(prepStationGeometry, prepStationMaterial);
            prepStation.position.set(-storeWidth/2 + 2, 0.75, -storeDepth/2 + 3);
            interiorGroup.add(prepStation);
            
            // Storage shelves
            const pizzaStorageShelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
            const pizzaStorageShelfMaterial = warmGlow(0x8B4513);
            for (let i = 0; i < 4; i++) {
                const storageShelf = new THREE.Mesh(pizzaStorageShelfGeometry, pizzaStorageShelfMaterial);
                storageShelf.position.set(storeWidth/2 - 1.5, 1.5, -storeDepth/2 + 3 + i * 4);
                interiorGroup.add(storageShelf);
            }
            break;
            
        case 'clothing': // Clothing Store
            // Circular clothing racks (round racks - more realistic)
            const createCircularRack = (x, z) => {
                const rackGroup = new THREE.Group();
                
                // Central pole
                const poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
                const poleMaterial = warmGlow(0x696969);
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.y = 0.9;
                rackGroup.add(pole);
                
                // Circular bar at top
                const barRadius = 0.8;
                const barGeometry = new THREE.TorusGeometry(barRadius, 0.03, 8, 16);
                const barMaterial = warmGlow(0x8B4513);
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.y = 1.7;
                bar.rotation.x = Math.PI / 2;
                rackGroup.add(bar);
                
                // Base plate
                const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
                const baseMaterial = warmGlow(0x555555);
                const base = new THREE.Mesh(baseGeometry, baseMaterial);
                base.position.y = 0.05;
                rackGroup.add(base);
                
                rackGroup.position.set(x, 0, z);
                return rackGroup;
            };
            
            // Wall-mounted clothing racks
            const createWallRack = (x, z, rotation) => {
                const rackGroup = new THREE.Group();
                
                // Wall bracket
                const bracketGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
                const bracketMaterial = warmGlow(0x696969);
                const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
                bracket.position.set(0, 1.6, 0);
                rackGroup.add(bracket);
                
                // Horizontal bar
                const barGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 8);
                const barMaterial = warmGlow(0x8B4513);
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.set(0, 1.6, 0);
                bar.rotation.z = Math.PI / 2;
                rackGroup.add(bar);
                
                rackGroup.position.set(x, 0, z);
                rackGroup.rotation.y = rotation;
                return rackGroup;
            };
            
            // Mannequins for display
            const createMannequin = (x, z) => {
                const mannequinGroup = new THREE.Group();
                
                // Head
                const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const headMaterial = warmGlow(0xF5DEB3);
                const head = new THREE.Mesh(headGeometry, headMaterial);
                head.position.y = 1.5;
                mannequinGroup.add(head);
                
                // Torso
                const torsoGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
                const torsoMaterial = warmGlow(0xF5DEB3);
                const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
                torso.position.y = 1.1;
                mannequinGroup.add(torso);
                
                // Stand/base
                const standGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
                const standMaterial = warmGlow(0x444444);
                const stand = new THREE.Mesh(standGeometry, standMaterial);
                stand.position.y = 0.15;
                mannequinGroup.add(stand);
                
                mannequinGroup.position.set(x, 0, z);
                return mannequinGroup;
            };
            
            // Shelving units for folded clothes
            const createShelvingUnit = (x, z, width = 2) => {
                const shelfGroup = new THREE.Group();
                
                // Vertical supports
                const supportGeometry = new THREE.BoxGeometry(0.08, 1.5, 0.08);
                const supportMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 2; i++) {
                    const support = new THREE.Mesh(supportGeometry, supportMaterial);
                    support.position.set(-width/2 + i * width, 0.75, 0);
                    shelfGroup.add(support);
                }
                
                // Shelves (3 levels)
                const shelfGeometry = new THREE.BoxGeometry(width, 0.05, 0.4);
                const shelfMaterial = warmGlow(0xF5DEB3);
                for (let i = 0; i < 3; i++) {
                    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                    shelf.position.set(0, 0.3 + i * 0.5, 0);
                    shelfGroup.add(shelf);
                }
                
                shelfGroup.position.set(x, 0, z);
                return shelfGroup;
            };
            
            // Display tables with better styling
            const createDisplayTable = (x, z, width = 2.5) => {
                const tableGroup = new THREE.Group();
                
                // Table top
                const topGeometry = new THREE.BoxGeometry(width, 0.1, 1.2);
                const topMaterial = warmGlow(0xF5F5DC);
                const top = new THREE.Mesh(topGeometry, topMaterial);
                top.position.y = 0.8;
                tableGroup.add(top);
                
                // Table legs
                const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
                const legMaterial = warmGlow(0x8B4513);
                const legPositions = [
                    [-width/2 + 0.2, 0.4, -0.5],
                    [width/2 - 0.2, 0.4, -0.5],
                    [-width/2 + 0.2, 0.4, 0.5],
                    [width/2 - 0.2, 0.4, 0.5]
                ];
                legPositions.forEach(([px, py, pz]) => {
                    const leg = new THREE.Mesh(legGeometry, legMaterial);
                    leg.position.set(px, py, pz);
                    tableGroup.add(leg);
                });
                
                tableGroup.position.set(x, 0, z);
                return tableGroup;
            };
            
            // Circular racks throughout the store (main display area)
            const circularRackPositions = [
                { x: -storeWidth/2 + 3, z: -storeDepth/2 + 3 },
                { x: -storeWidth/2 + 3, z: -storeDepth/2 + 7 },
                { x: 0, z: -storeDepth/2 + 3 },
                { x: 0, z: -storeDepth/2 + 7 },
                { x: storeWidth/2 - 3, z: -storeDepth/2 + 3 },
                { x: storeWidth/2 - 3, z: -storeDepth/2 + 7 },
                { x: -storeWidth/2 + 3, z: 0 },
                { x: storeWidth/2 - 3, z: 0 },
                { x: -storeWidth/2 + 3, z: -2 },
                { x: 0, z: -2 },
                { x: storeWidth/2 - 3, z: -2 }
            ];
            circularRackPositions.forEach(({ x, z }) => {
                const rack = createCircularRack(x, z);
                interiorGroup.add(rack);
            });
            
            // Wall-mounted racks along side walls
            for (let i = 0; i < 5; i++) {
                const leftRack = createWallRack(-storeWidth/2 + 0.2, -storeDepth/2 + 2 + i * 2.5, 0);
                interiorGroup.add(leftRack);
                
                const rightRack = createWallRack(storeWidth/2 - 0.2, -storeDepth/2 + 2 + i * 2.5, Math.PI);
                interiorGroup.add(rightRack);
            }
            
            // Mannequins near entrance and display areas
            const mannequinPositions = [
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 2 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 2 },
                { x: -storeWidth/2 + 2, z: 0 },
                { x: storeWidth/2 - 2, z: 0 }
            ];
            mannequinPositions.forEach(({ x, z }) => {
                const mannequin = createMannequin(x, z);
                interiorGroup.add(mannequin);
            });
            
            // Shelving units for folded clothes
            const shelvingPositions = [
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 1, width: 2 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 1, width: 2 },
                { x: -storeWidth/2 + 1.5, z: storeDepth/2 - 1, width: 2 },
                { x: storeWidth/2 - 1.5, z: storeDepth/2 - 1, width: 2 }
            ];
            shelvingPositions.forEach(({ x, z, width }) => {
                const shelf = createShelvingUnit(x, z, width);
                interiorGroup.add(shelf);
            });
            
            // Display tables in center and near checkout
            const displayTablePositions = [
                { x: -3, z: 2, width: 2.5 },
                { x: 3, z: 2, width: 2.5 },
                { x: -3, z: -2, width: 2.5 },
                { x: 3, z: -2, width: 2.5 }
            ];
            displayTablePositions.forEach(({ x, z, width }) => {
                const table = createDisplayTable(x, z, width);
                interiorGroup.add(table);
            });
            
            // Large mirror area near fitting rooms
            const mirrorGeometry = new THREE.PlaneGeometry(4, 2.5);
            const mirrorMaterial = warmGlow(0xCCCCCC);
            const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
            mirror.position.set(storeWidth/2 - 1, 1.5, -storeDepth/2 + 2);
            mirror.rotation.y = Math.PI;
            interiorGroup.add(mirror);
            
            // Fitting rooms (improved design)
            const fittingRoomGeometry = new THREE.BoxGeometry(2, 2.5, 2);
            const fittingRoomMaterial = warmGlow(0xE0E0E0);
            for (let i = 0; i < 2; i++) {
                const fittingRoom = new THREE.Mesh(fittingRoomGeometry, fittingRoomMaterial);
                fittingRoom.position.set(storeWidth/2 - 1.5, 1.25, -storeDepth/2 + 5 + i * 3);
                interiorGroup.add(fittingRoom);
            }
            
            // Cash register counter (moved away from door, positioned more centrally)
            const cashRegisterCounterGeometry = new THREE.BoxGeometry(5, 1.2, 2);
            const cashRegisterCounterMaterial = warmGlow(0xF5F5DC);
            const cashRegisterCounter = new THREE.Mesh(cashRegisterCounterGeometry, cashRegisterCounterMaterial);
            cashRegisterCounter.position.set(0, 0.6, -storeDepth/2 + 4);
            interiorGroup.add(cashRegisterCounter);
            
            // Cash register on counter
            const cashRegisterGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
            const cashRegisterMaterial = warmGlow(0x333333);
            const cashRegister = new THREE.Mesh(cashRegisterGeometry, cashRegisterMaterial);
            cashRegister.position.set(1.5, 1.4, -storeDepth/2 + 4);
            interiorGroup.add(cashRegister);
            break;
            
        case 'drycleaner': // Dry Cleaners
            // Front counter
            const dryCleanerCounterGeometry = new THREE.BoxGeometry(8, 1.2, 1.5);
            const dryCleanerCounterMaterial = warmGlow(0x4682B4);
            const dryCleanerCounter = new THREE.Mesh(dryCleanerCounterGeometry, dryCleanerCounterMaterial);
            dryCleanerCounter.position.set(0, 0.6, storeDepth/2 - 8);
            dryCleanerCounter.userData.isInteractive = true;
            dryCleanerCounter.userData.name = "Service Counter";
            dryCleanerCounter.userData.flavorText = [
                "A blue service counter where customers drop off and pick up their dry cleaning. The surface is clean but shows signs of constant use.",
                "The counter has a small window where orders are passed through. Behind it, you can see the organized chaos of the dry cleaning operation."
            ];
            interiorGroup.add(dryCleanerCounter);
            
            // =====================================================
            // PILES OF LAUNDRY - Scattered throughout the shop
            // =====================================================
            const laundryColors = [0xFFFFFF, 0xE6E6FA, 0xF0F8FF, 0xFFF8DC, 0xF5F5DC, 0xFFE4E1, 0xF0E68C, 0xFFB6C1, 0xE0E0E0, 0xD3D3D3];
            
            // Create laundry pile helper - realistic piles of UNFOLDED clothing
            const createLaundryPile = (x, z, size = 'medium') => {
                const pileGroup = new THREE.Group();
                // Increased item counts for denser piles
                const itemCount = size === 'small' ? 15 : size === 'large' ? 35 : 25;
                // Reduced radius for denser packing
                const pileRadius = size === 'small' ? 0.6 : size === 'large' ? 1.0 : 0.8;
                
                let currentHeight = 0;
                
                // Create various clothing items - ALL UNFOLDED
                for (let i = 0; i < itemCount; i++) {
                    const itemType = Math.random();
                    const color = laundryColors[Math.floor(Math.random() * laundryColors.length)];
                    const material = warmGlow(color, 0.2 + Math.random() * 0.2);
                    
                    let item;
                    let itemHeight = 0;
                    
                    if (itemType < 0.4) {
                        // Unfolded shirt (always unfolded)
                        const shirtGroup = new THREE.Group();
                        // Body
                        const body = new THREE.Mesh(
                            new THREE.BoxGeometry(0.6 + Math.random() * 0.2, 0.1, 0.4 + Math.random() * 0.2, 1, 1, 1),
                            material
                        );
                        shirtGroup.add(body);
                        // Sleeves
                        const sleeve1 = new THREE.Mesh(
                            new THREE.BoxGeometry(0.3, 0.08, 0.15, 1, 1, 1),
                            material
                        );
                        sleeve1.position.set(0.3, 0, 0);
                        shirtGroup.add(sleeve1);
                        const sleeve2 = new THREE.Mesh(
                            new THREE.BoxGeometry(0.3, 0.08, 0.15, 1, 1, 1),
                            material
                        );
                        sleeve2.position.set(-0.3, 0, 0);
                        shirtGroup.add(sleeve2);
                        item = shirtGroup;
                        itemHeight = 0.1;
                    } else if (itemType < 0.7) {
                        // Unfolded pants (always unfolded/hanging)
                        const pantsGroup = new THREE.Group();
                        const leg1 = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.08, 0.08, 0.4 + Math.random() * 0.2, 8),
                            material
                        );
                        leg1.position.set(0.15, 0.2, 0);
                        leg1.rotation.z = Math.PI / 2;
                        pantsGroup.add(leg1);
                        const leg2 = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.08, 0.08, 0.4 + Math.random() * 0.2, 8),
                            material
                        );
                        leg2.position.set(-0.15, 0.2, 0);
                        leg2.rotation.z = Math.PI / 2;
                        pantsGroup.add(leg2);
                        const waist = new THREE.Mesh(
                            new THREE.BoxGeometry(0.3, 0.1, 0.1, 1, 1, 1),
                            material
                        );
                        waist.position.y = 0.4;
                        pantsGroup.add(waist);
                        item = pantsGroup;
                        itemHeight = 0.5;
                    } else if (itemType < 0.9) {
                        // Socks - pairs or singles
                        const sockGroup = new THREE.Group();
                        const sockCount = Math.random() > 0.5 ? 2 : 1;
                        for (let s = 0; s < sockCount; s++) {
                            const sock = new THREE.Mesh(
                                new THREE.CylinderGeometry(0.06, 0.08, 0.2 + Math.random() * 0.1, 8),
                                material
                            );
                            sock.position.set((s - 0.5) * 0.15, 0.1, 0);
                            sock.rotation.x = Math.PI / 2;
                            sockGroup.add(sock);
                        }
                        item = sockGroup;
                        itemHeight = 0.2;
                    } else {
                        // Unfolded towels or other items (more 3D)
                        const towelGroup = new THREE.Group();
                        // Main towel body
                        const towelBody = new THREE.Mesh(
                            new THREE.BoxGeometry(0.5 + Math.random() * 0.3, 0.08, 0.4 + Math.random() * 0.2, 1, 1, 1),
                            material
                        );
                        towelGroup.add(towelBody);
                        // Add some folds/wrinkles
                        for (let f = 0; f < 2; f++) {
                            const fold = new THREE.Mesh(
                                new THREE.BoxGeometry(0.1, 0.1, 0.3, 1, 1, 1),
                                material
                            );
                            fold.position.set((Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.2);
                            fold.rotation.z = (Math.random() - 0.5) * 0.3;
                            towelGroup.add(fold);
                        }
                        item = towelGroup;
                        itemHeight = 0.1;
                    }
                    
                    // Position item in pile shape (wider at bottom, narrower at top)
                    // Calculate radius based on height - lower items spread out more
                    const heightRatio = currentHeight / (itemCount * 0.15); // Normalize height
                    const maxRadius = pileRadius;
                    const minRadius = pileRadius * 0.3; // Top of pile is narrower
                    // Lower items get full radius, higher items get smaller radius
                    const currentRadius = maxRadius - (maxRadius - minRadius) * Math.min(heightRatio, 1);
                    
                    // Use weighted random distribution (more items towards center)
                    const randomValue = Math.random();
                    const radius = currentRadius * Math.sqrt(randomValue); // Square root for more center clustering
                    const angle = Math.random() * Math.PI * 2;
                    
                    const itemX = Math.cos(angle) * radius;
                    const itemZ = Math.sin(angle) * radius;
                    
                    // Random rotation (more chaotic for unfolded items)
                    item.rotation.x = (Math.random() - 0.5) * 0.8;
                    item.rotation.y = Math.random() * Math.PI * 2;
                    item.rotation.z = (Math.random() - 0.5) * 0.8;
                    
                    // Position item - items can settle on top of each other
                    item.position.set(itemX, currentHeight + itemHeight / 2, itemZ);
                    pileGroup.add(item);
                    
                    // Update height for next item (very compact stacking - items settle)
                    // Items can overlap/rest on each other, so height increases slowly
                    currentHeight += itemHeight * (0.05 + Math.random() * 0.15);
                }
                
                pileGroup.position.set(x, 0.1, z);
                pileGroup.rotation.y = Math.random() * Math.PI * 2;
                return pileGroup;
            };
            
            // Scatter laundry piles throughout the shop
            const laundryPilePositions = [
                // Front area
                { x: -6, z: 10, size: 'medium' },
                { x: -3, z: 12, size: 'large' },
                { x: 3, z: 10, size: 'small' },
                { x: 6, z: 12, size: 'medium' },
                // Middle area
                { x: -8, z: 0, size: 'large' },
                { x: -4, z: -2, size: 'small' },
                { x: 0, z: 2, size: 'medium' },
                { x: 4, z: -1, size: 'medium' },
                { x: 8, z: 1, size: 'small' },
                // Back area (around rotating system)
                { x: -10, z: -15, size: 'medium' },
                { x: -5, z: -18, size: 'large' },
                { x: 0, z: -16, size: 'medium' },
                { x: 5, z: -19, size: 'small' },
                { x: 10, z: -17, size: 'medium' },
                // Side areas
                { x: -18, z: 5, size: 'medium' },
                { x: -20, z: -5, size: 'small' },
                { x: 18, z: 3, size: 'large' },
                { x: 20, z: -8, size: 'medium' }
            ];
            
            laundryPilePositions.forEach(({ x, z, size }) => {
                const pile = createLaundryPile(x, z, size);
                interiorGroup.add(pile);
            });
            
            // =====================================================
            // ROTATING HANGER SYSTEM - Back of shop
            // =====================================================
            const rotatingHangerSystem = new THREE.Group();
            rotatingHangerSystem.position.set(0, 0, -storeDepth/2 + 14);
            rotatingHangerSystem.userData.isRotatingHangerSystem = true;
            rotatingHangerSystem.userData.rotationSpeed = 0.9; // Slow rotation
            rotatingHangerSystem.userData.keepPosition = true;
            
            // Central pole
            const centralPoleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 12);
            const centralPoleMaterial = warmGlow(0x696969, 0.9);
            const centralPole = new THREE.Mesh(centralPoleGeometry, centralPoleMaterial);
            centralPole.position.y = 4;
            rotatingHangerSystem.add(centralPole);
            
            // Rotating arms (4 arms extending from center)
            const armCount = 4;
            const armLength = 12;
            const armGeometry = new THREE.BoxGeometry(0.1, 0.1, armLength);
            const armMaterial = warmGlow(0x808080, 0.8);
            
            for (let i = 0; i < armCount; i++) {
                const angle = (i / armCount) * Math.PI * 2;
                const arm = new THREE.Mesh(armGeometry, armMaterial);
                arm.position.set(
                    Math.cos(angle) * armLength / 2,
                    4,
                    Math.sin(angle) * armLength / 2
                );
                arm.rotation.y = angle + Math.PI / 2;
                rotatingHangerSystem.add(arm);
                
                // Hangers along each arm
                const hangersPerArm = 8;
                for (let j = 0; j < hangersPerArm; j++) {
                    const hangerOffset = -armLength / 2 + 1 + (j * (armLength - 2) / (hangersPerArm - 1));
                    
                    // Hanger hook
                    const hookGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
                    const hookMaterial = warmGlow(0xC0C0C0, 0.9);
                    const hook = new THREE.Mesh(hookGeometry, hookMaterial);
                    hook.position.set(
                        Math.cos(angle) * hangerOffset,
                        4.2,
                        Math.sin(angle) * hangerOffset
                    );
                    hook.rotation.x = Math.PI / 2;
                    rotatingHangerSystem.add(hook);
                    
                    // Hanger body (triangle shape)
                    const hangerBodyGeometry = new THREE.ConeGeometry(0.2, 0.4, 3);
                    const hangerBodyMaterial = warmGlow(0xD3D3D3, 0.8);
                    const hangerBody = new THREE.Mesh(hangerBodyGeometry, hangerBodyMaterial);
                    hangerBody.position.set(
                        Math.cos(angle) * hangerOffset,
                        3.8,
                        Math.sin(angle) * hangerOffset
                    );
                    hangerBody.rotation.z = Math.PI;
                    rotatingHangerSystem.add(hangerBody);
                    
                    // Garment on hanger (random colors)
                    const garmentGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.1);
                    const garmentColor = laundryColors[Math.floor(Math.random() * laundryColors.length)];
                    const garmentMaterial = warmGlow(garmentColor, 0.7);
                    const garment = new THREE.Mesh(garmentGeometry, garmentMaterial);
                    garment.position.set(
                        Math.cos(angle) * hangerOffset,
                        3.2,
                        Math.sin(angle) * hangerOffset
                    );
                    garment.rotation.y = angle + Math.PI / 2;
                    rotatingHangerSystem.add(garment);
                }
            }
            
            // Base platform
            const platformGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
            const platformMaterial = warmGlow(0x555555, 0.9);
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.y = 0.1;
            rotatingHangerSystem.add(platform);
            
            interiorGroup.add(rotatingHangerSystem);
            
            // Store reference for animation
            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.rotatingHangerSystems) {
                scene.userData.rotatingHangerSystems = [];
            }
            scene.userData.rotatingHangerSystems.push(rotatingHangerSystem);
            
            // Cleaning machines along side wall
            const machineGeometry = new THREE.BoxGeometry(2, 2, 2);
            const machineMaterial = warmGlow(0x708090);
            for (let i = 0; i < 4; i++) {
                const machine = new THREE.Mesh(machineGeometry, machineMaterial);
                machine.position.set(storeWidth/2 - 1.5, 1, -storeDepth/2 + 5 + i * 10);
                interiorGroup.add(machine);
            }
            
            // Pressing table
            const pressingTableGeometry = new THREE.BoxGeometry(3, 1.2, 2);
            const pressingTableMaterial = warmGlow(0xFFFFFF);
            const pressingTable = new THREE.Mesh(pressingTableGeometry, pressingTableMaterial);
            pressingTable.position.set(-storeWidth/2 + 2, 0.6, -storeDepth/2 + 8);
            pressingTable.userData.isInteractive = true;
            pressingTable.userData.name = "Pressing Table";
            pressingTable.userData.flavorText = [
                "A large pressing table where garments are ironed and steamed. The surface is covered in a clean white fabric, ready for the next item.",
                "This is where the final touches are put on cleaned garments - removing wrinkles and ensuring everything looks perfect before pickup."
            ];
            interiorGroup.add(pressingTable);
            break;
            
        case 'coffee': // Donut Galaxy
            // Coffee counter/barista area - moved forward from back wall
            const coffeeCounterGeometry = new THREE.BoxGeometry(10, 1.2, 2);
            const coffeeCounterMaterial = warmGlow(0xFF4500); // Donut Galaxy signature orange
            const coffeeCounter = new THREE.Mesh(coffeeCounterGeometry, coffeeCounterMaterial);
            coffeeCounter.position.set(0, 0.6, -storeDepth/2 + 10);
            coffeeCounter.userData.isInteractive = true;
            coffeeCounter.userData.name = "Coffee Counter";
            coffeeCounter.userData.flavorText = [
                "The vibrant orange counter glows warmly in the shop's light. This is where the magic happens - where baristas craft cosmic coffee creations and serve up fresh donuts. The surface is clean but shows signs of constant use.",
                "The counter stretches across the front of the shop, separating customers from the workspace behind. It's the perfect height for placing orders and watching your drink being made. The orange color matches Donut Galaxy's signature aesthetic.",
                "A well-worn counter that's seen countless morning rushes and late-night coffee runs. The orange finish catches the light, making the whole area feel warm and inviting. You can almost smell the coffee brewing."
            ];
            interiorGroup.add(coffeeCounter);
            
            // Coffee machines on counter
            const coffeeMachineGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
            const coffeeMachineMaterial = warmGlow(0x000000);
            for (let i = 0; i < 2; i++) {
                const coffeeMachine = new THREE.Mesh(coffeeMachineGeometry, coffeeMachineMaterial);
                coffeeMachine.position.set(-3 + i * 6, 1.35, -storeDepth/2 + 10);
                coffeeMachine.userData.isInteractive = true;
                coffeeMachine.userData.name = "Espresso Machine";
                coffeeMachine.userData.itemName = "Coffee";
                coffeeMachine.userData.flavorText = [
                    "A sleek black espresso machine hums quietly, ready to brew. Steam occasionally escapes from the wand, and the display shows various coffee options. The machine looks well-maintained and professional.",
                    "The espresso machine's buttons are worn smooth from constant use. You can hear the gurgle of water heating inside, and a faint aroma of coffee grounds lingers in the air. This is clearly the heart of the operation.",
                    "Two identical espresso machines stand ready on the counter. Their polished black surfaces reflect the warm shop lights. The machines look capable of handling even the busiest morning rush."
                ];
                interiorGroup.add(coffeeMachine);
            }
            
            // Display case for donuts - moved forward with counter
            const donutCaseGeometry = new THREE.BoxGeometry(6, 1.5, 1);
            const donutCaseMaterial = warmGlow(0xFFFFFF);
            const donutCase = new THREE.Mesh(donutCaseGeometry, donutCaseMaterial);
            donutCase.position.set(0, 0.75, -storeDepth/2 + 10);
            donutCase.userData.isInteractive = true;
            donutCase.userData.name = "Donut Display Case";
            donutCase.userData.itemName = "Donut";
            donutCase.userData.flavorText = [
                "A pristine glass display case showcases an array of colorful donuts. Each one looks perfectly glazed and decorated, arranged in neat rows. The glass is spotless, allowing you to see every sprinkle and swirl of frosting.",
                "The display case glows with warm light, making the donuts inside look even more tempting. You can see various flavors - chocolate, vanilla, strawberry, and some with colorful sprinkles. They're arranged like jewels in a case.",
                "This is where the day's fresh donuts are displayed for customers. The case keeps them at the perfect temperature and protects them while still showing off their beautiful decorations. Some look like they were just made."
            ];
            interiorGroup.add(donutCase);

            // Countertop details - moved forward with counter
            const registerGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
            const registerMaterial = warmGlow(0x2F2F2F, 0.9);
            const register = new THREE.Mesh(registerGeometry, registerMaterial);
            register.position.set(-1.6, 1.0, -storeDepth/2 + 9.7);
            register.userData.isInteractive = true;
            register.userData.name = "Cash Register";
            register.userData.flavorText = [
                "A modern cash register sits on the counter, its dark surface contrasting with the bright orange countertop. The screen glows with a soft cyan light, ready to ring up orders.",
                "The register's buttons are well-worn from constant use. You can see various function keys for different payment methods and order types. It looks like it's seen thousands of transactions.",
                "This is where customers pay for their cosmic coffee and donuts. The register screen displays the time and is ready for the next order. A small card reader sits nearby for contactless payments."
            ];
            interiorGroup.add(register);

            const registerScreenGeometry = new THREE.PlaneGeometry(0.7, 0.45);
            const registerScreen = new THREE.Mesh(registerScreenGeometry, warmGlow(0x66FFCC, 0.7));
            registerScreen.position.set(-1.6, 1.15, -storeDepth/2 + 9.31);
            registerScreen.rotation.x = -Math.PI / 8;
            interiorGroup.add(registerScreen);

            const tipJarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 10);
            const tipJarMaterial = warmGlow(0x7FFFD4, 0.3);
            const tipJar = new THREE.Mesh(tipJarGeometry, tipJarMaterial);
            tipJar.position.set(-0.5, 0.95, -storeDepth/2 + 9.7);
            tipJar.userData.isInteractive = true;
            tipJar.userData.name = "Tip Jar";
            tipJar.userData.flavorText = [
                "A translucent tip jar sits on the counter, glowing softly with an aquamarine light. You can see a few coins and bills inside, left by appreciative customers.",
                "The tip jar has a simple design - just a clear cylinder with a small opening at the top. A handwritten 'Thank you!' note is taped to the side. It's positioned where customers naturally see it.",
                "Baristas rely on tips to supplement their income, and this jar is a way for customers to show appreciation. It's about half full with various denominations, suggesting the staff is well-liked."
            ];
            interiorGroup.add(tipJar);

            const strawDispenserGeometry = new THREE.BoxGeometry(0.35, 0.45, 0.35);
            const strawDispenser = new THREE.Mesh(strawDispenserGeometry, warmGlow(0xFFA07A, 0.8));
            strawDispenser.position.set(1.8, 0.95, -storeDepth/2 + 9.7);
            strawDispenser.userData.isInteractive = true;
            strawDispenser.userData.name = "Straw Dispenser";
            strawDispenser.userData.flavorText = [
                "A small dispenser holds white plastic straws, ready for customers who want to stir their drinks. The dispenser has a warm salmon-colored glow that matches the shop's aesthetic.",
                "The straw dispenser is positioned conveniently near the drink preparation area. A few straws stick out at various angles, suggesting customers have been helping themselves.",
                "Simple but essential - this dispenser ensures every iced coffee and cold drink gets a straw. The warm glow makes it easy to spot even in the busy shop environment."
            ];
            interiorGroup.add(strawDispenser);

            const strawBundleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
            for (let s = 0; s < 5; s++) {
                const straw = new THREE.Mesh(strawBundleGeometry, warmGlow(0xFFFFFF, 0.9));
                straw.position.set(1.8 + (Math.random() - 0.5) * 0.25, 1.1 + Math.random() * 0.05, -storeDepth/2 + 9.7 + (Math.random() - 0.5) * 0.2);
                straw.rotation.x = (Math.random() - 0.5) * 0.4;
                interiorGroup.add(straw);
            }

            const cupStackGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.9, 12);
            const cupStackColors = [0xFFFFFF, 0xFFA500, 0xFF69B4];
            for (let c = 0; c < 3; c++) {
                const cupStackMaterial = warmGlow(cupStackColors[c], 0.8);
                const cupStack = new THREE.Mesh(cupStackGeometry, cupStackMaterial);
                cupStack.position.set(-2.6 + c * 0.9, 1.05, -storeDepth/2 + 9.7);
                cupStack.userData.isInteractive = true;
                cupStack.userData.name = "Cup Stack";
                cupStack.userData.flavorText = [
                    `A neat stack of ${cupStackColors[c] === 0xFFFFFF ? 'white' : cupStackColors[c] === 0xFFA500 ? 'orange' : 'pink'} coffee cups, ready to be filled with hot beverages. The cups are nested perfectly, showing the baristas' attention to organization.`,
                    "These cup stacks are positioned for easy access during the morning rush. Each stack represents a different size or style, allowing baristas to quickly grab the right cup for each order.",
                    "The cups glow softly with their respective colors, making them easy to identify even in a hurry. They're stacked high enough to be convenient but not so high that they'll topple over."
                ];
                interiorGroup.add(cupStack);
            }

            const syrupBottleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12);
            const syrupColors = [0xFFB347, 0xD2691E, 0xFFD700];
            const syrupNames = ["Vanilla", "Caramel", "Hazelnut"];
            for (let b = 0; b < 3; b++) {
                const bottle = new THREE.Mesh(syrupBottleGeometry, warmGlow(syrupColors[b], 0.6));
                bottle.position.set(2.8 - b * 0.5, 1.0, -storeDepth/2 + 9.6);
                bottle.userData.isInteractive = true;
                bottle.userData.name = `${syrupNames[b]} Syrup`;
                bottle.userData.flavorText = [
                    `A bottle of ${syrupNames[b].toLowerCase()} flavored syrup sits on the counter. The ${syrupColors[b] === 0xFFB347 ? 'warm orange' : syrupColors[b] === 0xD2691E ? 'rich brown' : 'golden'} liquid inside catches the light, promising sweet flavor.`,
                    `Baristas use this ${syrupNames[b].toLowerCase()} syrup to customize drinks. A pump on top makes it easy to add just the right amount to each cup. The bottle is positioned within easy reach.`,
                    `The ${syrupNames[b].toLowerCase()} syrup is a popular choice for adding sweetness and flavor to coffee drinks. The bottle's label shows it's a professional-grade product, designed for coffee shops.`
                ];
                interiorGroup.add(bottle);
            }

            // Donut and baked goods rack at the back wall (behind cashier)
            const rackWidth = 12;
            const rackDepth = 1.5;
            const rackHeight = 4;
            
            // Rack frame
            const rackFrameGeometry = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
            const rackFrameMaterial = warmGlow(0x8B4513, 0.8); // Brown wood
            const rackFrame = new THREE.Mesh(rackFrameGeometry, rackFrameMaterial);
            rackFrame.position.set(0, rackHeight / 2, -storeDepth/2 + 1);
            rackFrame.userData.isInteractive = true;
            rackFrame.userData.name = "Donut Rack";
            rackFrame.userData.itemName = "Donut";
            rackFrame.userData.flavorText = [
                "A massive wooden rack stretches across the back wall, displaying rows upon rows of fresh donuts and baked goods. The warm brown wood glows softly, creating a beautiful backdrop for the colorful treats.",
                "This is Donut Galaxy's main display - a three-tiered rack filled with every variety of donut imaginable. Each shelf is carefully organized, with donuts arranged by flavor and decoration. The rack dominates the back wall, making it impossible to miss.",
                "The donut rack is the centerpiece of the shop's visual appeal. Behind the cashier, it showcases the day's fresh offerings - glazed donuts, frosted varieties, and other baked goods. Customers can point to exactly what they want.",
                "A beautifully crafted wooden rack holds dozens of donuts at various heights. The warm lighting makes each donut look like a work of art. You can see sprinkles, frosting, and glazes glistening in the light.",
                "This rack is where the magic of Donut Galaxy is on full display. Three shelves are packed with fresh donuts, each one perfectly decorated. The top shelf also features muffins and croissants for customers who want something different."
            ];
            interiorGroup.add(rackFrame);
            
            // Shelves inside rack
            const shelfGeometry = new THREE.BoxGeometry(rackWidth - 0.2, 0.1, rackDepth - 0.2);
            const shelfMaterial = warmGlow(0xD2691E, 0.9);
            for (let shelf = 0; shelf < 3; shelf++) {
                const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelfMesh.position.set(0, 1 + shelf * 1.2, -storeDepth/2 + 1);
                interiorGroup.add(shelfMesh);
            }
            
            // Donuts on the rack
            const rackDonutGeometry = new THREE.TorusGeometry(0.4, 0.12, 12, 16);
            const rackDonutBaseColors = [0xF4A460, 0xEEC085, 0xD29062];
            const rackFrostingColors = [0xFFC0CB, 0xFFF8DC, 0xFF8C69, 0xE6E6FA, 0xFFB347];
            
            for (let shelf = 0; shelf < 3; shelf++) {
                const donutsPerShelf = 8;
                const shelfY = 1 + shelf * 1.2;
                for (let d = 0; d < donutsPerShelf; d++) {
                    const donutX = -rackWidth/2 + 0.8 + (d * (rackWidth - 1.6) / (donutsPerShelf - 1));
                    const donutZ = -storeDepth/2 + 0.5 + Math.random() * 0.5;
                    
                    // Base donut
                    const donutMaterial = warmGlow(rackDonutBaseColors[Math.floor(Math.random() * rackDonutBaseColors.length)]);
                    const donut = new THREE.Mesh(rackDonutGeometry, donutMaterial);
                    donut.rotation.x = Math.PI / 2;
                    donut.position.set(donutX, shelfY, donutZ);
                    interiorGroup.add(donut);
                    
                    // Frosting
                    const rackFrostingGeometry = new THREE.TorusGeometry(0.2, 0.12, 12, 16);
                    const frostingMaterial = warmGlow(rackFrostingColors[Math.floor(Math.random() * rackFrostingColors.length)], 0.9);
                    const frosting = new THREE.Mesh(rackFrostingGeometry, frostingMaterial);
                    frosting.rotation.x = Math.PI / 2;
                    frosting.position.set(donutX, shelfY + 0.05, donutZ);
                    interiorGroup.add(frosting);
                }
            }
            
            // Baked goods (muffins, croissants) on top shelf
            const muffinGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 12);
            const croissantGeometry = new THREE.TorusKnotGeometry(0.3, 0.1, 32, 8);
            
            for (let b = 0; b < 6; b++) {
                const bakedX = -rackWidth/2 + 1 + (b * (rackWidth - 2) / 5);
                const bakedZ = -storeDepth/2 + 0.5 + Math.random() * 0.5;
                const topShelfY = 1 + 2 * 1.2;
                
                if (Math.random() > 0.5) {
                    // Muffin
                    const muffinMaterial = warmGlow(0xD2691E, 0.9);
                    const muffin = new THREE.Mesh(muffinGeometry, muffinMaterial);
                    muffin.position.set(bakedX, topShelfY + 0.2, bakedZ);
                    interiorGroup.add(muffin);
                } else {
                    // Croissant
                    const croissantMaterial = warmGlow(0xFFD700, 0.9);
                    const croissant = new THREE.Mesh(croissantGeometry, croissantMaterial);
                    croissant.rotation.x = Math.PI / 2;
                    croissant.position.set(bakedX, topShelfY + 0.15, bakedZ);
                    interiorGroup.add(croissant);
                }
            }

            // Menu board and signage
            const menuBoardGeometry = new THREE.BoxGeometry(10, 5.2, 0.2, 3, 4, 3);
            const menuBoard = new THREE.Mesh(menuBoardGeometry, warmGlow(0x1E1E1E, 0.8));
            menuBoard.position.set(0, 6.9, -storeDepth/2 + 0.2);
            menuBoard.userData.isInteractive = true;
            menuBoard.userData.name = "Menu Board";
            menuBoard.userData.flavorText = [
                "A large black menu board hangs high on the wall, displaying Donut Galaxy's offerings. Golden lines divide the board into sections, showing various coffee drinks, donut flavors, and prices.",
                "The menu board is positioned so customers can see it while waiting in line. The dark background makes the golden text lines stand out clearly. It's clearly been updated recently, as everything looks fresh and readable.",
                "This menu board lists all of Donut Galaxy's cosmic coffee creations and donut varieties. The golden lines suggest different categories - perhaps hot drinks, iced drinks, and specialty items. It's the first thing you notice when entering.",
                "A professional menu board showcases the shop's offerings. The design is clean and easy to read, with golden accent lines that match the shop's warm aesthetic. It helps customers decide what to order before reaching the counter.",
                "The menu board glows softly against the wall, its dark surface contrasting with the bright shop interior. Golden lines create a grid pattern, suggesting different menu sections. It's positioned at the perfect height for reading while standing."
            ];
            interiorGroup.add(menuBoard);

            const menuLineGeometry = new THREE.BoxGeometry(9.6, 0.05, 0.04);
            for (let line = 0; line < 14; line++) {
                const menuLine = new THREE.Mesh(menuLineGeometry, warmGlow(0xDF9327, 0.4));
                menuLine.position.set(0, 8.45 + 0.7 - line * 0.35, -storeDepth/2 + 0.25);
                interiorGroup.add(menuLine);
            }

            // Menu text - coffee shop items in white
            const textMaterial = warmGlow(0xFFFFFF, 0.95);
            
            // Helper function to create text-like rectangular shapes (multiple boxes per item to simulate letters)
            const createMenuItem = (x, y, letterCount = 8) => {
                const letterWidth = 0.12;
                const letterSpacing = 0.15;
                const startX = x - (letterCount * letterSpacing) / 2;
                
                for (let i = 0; i < letterCount; i++) {
                    const letter = new THREE.Mesh(
                        new THREE.BoxGeometry(letterWidth, 0.15, 0.02, 1, 1, 1),
                        textMaterial
                    );
                    letter.position.set(startX + i * letterSpacing, y, -storeDepth/2 + 0.22);
                    interiorGroup.add(letter);
                }
            };
            
            // Coffee drinks - left column (letterCount approximates word length)
            createMenuItem(-3.5, 9.0, 10); // CAPPUCCINO
            createMenuItem(-3.5, 8.5, 5); // LATTE
            createMenuItem(-3.5, 8.0, 5); // MOCHA
            createMenuItem(-3.5, 7.5, 9); // AMERICANO
            createMenuItem(-3.5, 7.0, 9); // MACCHIATO
            createMenuItem(-3.5, 6.5, 11); // FRAPPUCCINO
            createMenuItem(-3.5, 6.0, 10); // ICED COFFEE
            createMenuItem(-3.5, 5.5, 8); // COLD BREW
            createMenuItem(-3.5, 5.0, 11); // MATCHA LATTE
            
            // Baked goods - right column
            createMenuItem(1.5, 9.0, 7); // MUFFINS
            createMenuItem(1.5, 8.5, 9); // CROISSANTS
            createMenuItem(1.5, 8.0, 6); // BAGELS
            createMenuItem(1.5, 7.5, 7); // COOKIES
            createMenuItem(1.5, 6.0, 6); // SCONES
            createMenuItem(1.5, 5.5, 8); // PASTRIES
            createMenuItem(1.5, 5.0, 10); // DONUTS
            
            // Prices - right side (multiple boxes to simulate price text)
            const createPrice = (x, y) => {
                // Create 4-5 boxes to simulate a price like "$3.50"
                const priceBoxWidth = 0.1;
                const priceSpacing = 0.12;
                const priceStartX = x - 0.2;
                
                for (let i = 0; i < 5; i++) {
                    const priceBox = new THREE.Mesh(
                        new THREE.BoxGeometry(priceBoxWidth, 0.12, 0.02, 1, 1, 1),
                        textMaterial
                    );
                    priceBox.position.set(priceStartX + i * priceSpacing, y, -storeDepth/2 + 0.22);
                    interiorGroup.add(priceBox);
                }
            };
            
            // Prices for coffee drinks
            createPrice(-1.2, 9.0);
            createPrice(-1.2, 8.5);
            createPrice(-1.2, 8.0);
            createPrice(-1.2, 7.5);
            createPrice(-1.2, 7.0);
            createPrice(-1.2, 6.5);
            createPrice(-1.2, 6.0);
            createPrice(-1.2, 5.5);
            createPrice(-1.2, 5.0);
            
            // Prices for baked goods
            createPrice(4.0, 9.0);
            createPrice(4.0, 8.5);
            createPrice(4.0, 8.0);
            createPrice(4.0, 7.5);
            createPrice(4.0, 6.0);
            createPrice(4.0, 5.5);
            createPrice(4.0, 5.0);

            // Floating donut circle feature
            const donutCircleGroup = new THREE.Group();
            donutCircleGroup.name = "Floating Donut Circle";
            donutCircleGroup.position.set(0, 0, 0);

            const donutGeometry = new THREE.TorusGeometry(0.7, 0.22, 10, 20);
            const frostingGeometry = new THREE.TorusGeometry(0.34, 0.22, 10, 20);
            const sprinkleGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.28);

            const donutBaseColors = [0xF4A460, 0xEEC085, 0xD29062];
            const frostingColors = [0xFFC0CB, 0xFFF8DC, 0xFF8C69, 0xE6E6FA];
            const sprinkleColors = [0xFF69B4, 0x87CEEB, 0x98FB98, 0xFFD700, 0xFFA500];

            const donutCount = 24;
            const baseRadius = 50; // Inner radius for galaxy-like distribution
            const maxRadius = 110; // Outer radius within 50x50 room
            const baseHeight = 8;
            const spiralTurns = 1.75; // Number of spiral turns
            const ringCount = 3;
            const ringSpinDirections = Array.from({ length: ringCount }, () => (Math.random() > 0.5 ? 1 : -1));
            const ringSpinAxes = ['y', 'x', 'z'];
            donutCircleGroup.userData.ringSpinDirections = ringSpinDirections;
            donutCircleGroup.userData.ringSpinAxes = ringSpinAxes;
            donutCircleGroup.userData.keepPosition = true;

            for (let i = 0; i < donutCount; i++) {
                const baseAngle = (i / donutCount) * Math.PI * 2;
                const radiusOffset = (Math.random() - 0.5) * 0.8;
                const heightOffset = (Math.random() - 0.5) * 0.4;
                const spiralProgress = i / donutCount;
                const spiralAngle = baseAngle + spiralTurns * Math.PI * 2 * spiralProgress;
                const radialRange = baseRadius + (maxRadius - baseRadius) * spiralProgress;
                const ringIndex = i % ringCount;
                const ringRadius = radialRange + radiusOffset;
                const ringHeight = baseHeight + ringIndex * 0.8 + heightOffset;

                const donutMaterial = warmGlow(donutBaseColors[Math.floor(Math.random() * donutBaseColors.length)]);
                const donut = new THREE.Mesh(donutGeometry, donutMaterial);
                donut.rotation.x = Math.PI / 2;

                const frostingMaterial = warmGlow(
                    frostingColors[Math.floor(Math.random() * frostingColors.length)],
                    0.85
                );
                const frosting = new THREE.Mesh(frostingGeometry, frostingMaterial);
                frosting.rotation.x = Math.PI / 2;
                frosting.position.y = 0.08;
                frosting.userData = {
                    frostingSpin: {
                        speed: (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.4),
                        axis: ['x', 'y'][Math.floor(Math.random() * 3)]
                    }
                };
                donut.add(frosting);

                const sprinkleCount = 6 + Math.floor(Math.random() * 4);
                for (let s = 0; s < sprinkleCount; s++) {
                    const sprinkleMaterial = warmGlow(
                        sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
                        0.9
                    );
                    const sprinkle = new THREE.Mesh(sprinkleGeometry, sprinkleMaterial);
                    sprinkle.position.set(
                        (Math.random() - 0.5) * 1.2,
                        0.1 + (Math.random() - 0.5) * 0.12,
                        (Math.random() - 0.5) * 1.2
                    );
                    sprinkle.rotation.set(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    );
                    sprinkle.userData = {
                        sprinkleSpin: {
                            speed: (Math.random() > 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.6),
                            axis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)]
                        }
                    };
                    donut.add(sprinkle);
                }

                donut.userData.floatingDonut = {
                    orbitAngle: baseAngle,
                    radius: ringRadius,
                    height: ringHeight,
                    orbitSpeed: (Math.random() > 0.2 ? 1 : -1) * (0.01 + Math.random() * 0.1),
                    floatAmplitude: 0.1 + Math.random() * 0.08,
                    floatFrequency: 0.2 + Math.random() * 0.05,
                    floatPhase: Math.random() * Math.PI * 2,
                    spinSpeed: ringSpinDirections[ringIndex] * (0.55 + Math.random() * 0.55),
                    spinAxis: ringSpinAxes[ringIndex % ringSpinAxes.length],
                    ringIndex
                };

                donut.position.set(
                    Math.cos(spiralAngle) * ringRadius,
                    ringHeight,
                    Math.sin(spiralAngle) * ringRadius
                );

                donutCircleGroup.add(donut);
            }

            donutCircleGroup.userData.isFloatingDonutCircle = true;
            donutCircleGroup.userData.isInteractive = true;
            donutCircleGroup.userData.name = "Floating Donut Galaxy";
            donutCircleGroup.userData.flavorText = [
                "Above you, donuts float in a mesmerizing spiral pattern, creating a galaxy of treats. They orbit slowly, spinning and bobbing gently in the air. This is Donut Galaxy's signature feature - a cosmic display that gives the shop its name.",
                "The floating donuts form three distinct rings, each rotating at its own pace. Some spin clockwise, others counter-clockwise, creating a hypnotic dance. Sprinkles and frosting catch the light as they rotate, making the whole display sparkle.",
                "This is unlike anything you've seen in a coffee shop. Twenty-four donuts float overhead in a spiral galaxy formation, each one decorated with colorful frosting and sprinkles. They move slowly, creating a sense of wonder and magic.",
                "The floating donut galaxy is the centerpiece of Donut Galaxy's atmosphere. The donuts orbit in elegant spirals, some higher, some lower, creating depth and movement. It's both beautiful and slightly surreal - like a dream made real.",
                "You look up at the cosmic display of floating donuts. They drift in graceful orbits, their frosting glistening in the shop's warm light. The spiral pattern reminds you of a galaxy, which is exactly what the shop's name promises."
            ];
            interiorGroup.add(donutCircleGroup);

            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.floatingDonutGroups) {
                scene.userData.floatingDonutGroups = [];
            }
            scene.userData.floatingDonutGroups.push(donutCircleGroup);

            // =====================================================
            // SEATING AREA - Front of shop
            // =====================================================
            
            // Coffee shop tables and chairs
            const donutGalaxyTableGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 12);
            const donutGalaxyTableMaterial = warmGlow(0x8B4513, 0.9); // Brown wood
            const donutGalaxyChairGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            const donutGalaxyChairMaterial = warmGlow(0xFF8C00, 0.8); // Orange chairs
            const donutGalaxyChairBackGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
            
            // Create table with chairs helper
            const createTableWithChairs = (x, z, rotation = 0) => {
                const tableGroup = new THREE.Group();
                
                // Table
                const table = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                table.position.y = 0.75;
                tableGroup.add(table);
                
                // Chairs around table (4 chairs)
                const chairPositions = [
                    { x: 0, z: 1.2, rot: 0 },      // North
                    { x: 0, z: -1.2, rot: Math.PI }, // South
                    { x: 1.2, z: 0, rot: -Math.PI / 2 }, // East
                    { x: -1.2, z: 0, rot: Math.PI / 2 }  // West
                ];
                
                chairPositions.forEach(({ x: cx, z: cz, rot }) => {
                    const chair = new THREE.Mesh(donutGalaxyChairGeometry, donutGalaxyChairMaterial);
                    chair.position.set(cx, 0.6, cz);
                    chair.rotation.y = rot;
                    tableGroup.add(chair);
                    
                    const back = new THREE.Mesh(donutGalaxyChairBackGeometry, donutGalaxyChairMaterial);
                    back.position.set(cx, 1.0, cz + (cz > 0 ? 0.3 : -0.3));
                    back.rotation.y = rot;
                    tableGroup.add(back);
                });
                
                tableGroup.position.set(x, 0, z);
                tableGroup.rotation.y = rotation;
                return tableGroup;
            };
            
            // Add tables in the front area (customer seating)
            const tablePositions = [
                { x: -8, z: 8, rot: 0 },
                { x: 0, z: 10, rot: 0 },
                { x: 8, z: 8, rot: 0 },
                { x: -8, z: 18, rot: 0 },
                { x: 0, z: 18, rot: 0 },
                { x: 8, z: 18, rot: 0 }
            ];
            
            tablePositions.forEach(({ x, z, rot }) => {
                const tableGroup = createTableWithChairs(x, z, rot);
                interiorGroup.add(tableGroup);
            });
            
            // Window seating along side walls
            const windowSeatGeometry = new THREE.BoxGeometry(8, 0.8, 1.5);
            const windowSeatMaterial = warmGlow(0xFF8C00, 0.7); // Orange bench
            const windowSeatCushionGeometry = new THREE.BoxGeometry(7.5, 0.2, 1.3);
            const windowSeatCushionMaterial = warmGlow(0xFF4500, 0.6); // Bright orange cushion
            
            // Left wall window seating
            for (let i = 0; i < 3; i++) {
                const seatZ = -storeDepth/2 + 5 + i * 8;
                const windowSeat = new THREE.Mesh(windowSeatGeometry, windowSeatMaterial);
                windowSeat.position.set(-storeWidth/2 + 0.75, 0.4, seatZ);
                interiorGroup.add(windowSeat);
                
                const cushion = new THREE.Mesh(windowSeatCushionGeometry, windowSeatCushionMaterial);
                cushion.position.set(-storeWidth/2 + 0.75, 0.8, seatZ);
                interiorGroup.add(cushion);
                
                // Small tables in front of window seats
                const windowTable = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                windowTable.scale.set(0.7, 1, 0.7);
                windowTable.position.set(-storeWidth/2 + 2.5, 0.75, seatZ);
                interiorGroup.add(windowTable);
            }
            
            // Right wall window seating
            for (let i = 0; i < 3; i++) {
                const seatZ = -storeDepth/2 + 5 + i * 8;
                const windowSeat = new THREE.Mesh(windowSeatGeometry, windowSeatMaterial);
                windowSeat.position.set(storeWidth/2 - 0.75, 0.4, seatZ);
                interiorGroup.add(windowSeat);
                
                const cushion = new THREE.Mesh(windowSeatCushionGeometry, windowSeatCushionMaterial);
                cushion.position.set(storeWidth/2 - 0.75, 0.8, seatZ);
                interiorGroup.add(cushion);
                
                // Small tables in front of window seats
                const windowTable = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                windowTable.scale.set(0.7, 1, 0.7);
                windowTable.position.set(storeWidth/2 - 2.5, 0.75, seatZ);
                interiorGroup.add(windowTable);
            }
            
            // =====================================================
            // CONDIMENT STATION - Between counter and seating
            // =====================================================
            const coffeeCondimentStationGeometry = new THREE.BoxGeometry(4, 1, 1.5);
            const coffeeCondimentStationMaterial = warmGlow(0xFFFFFF, 0.9);
            const coffeeCondimentStation = new THREE.Mesh(coffeeCondimentStationGeometry, coffeeCondimentStationMaterial);
            coffeeCondimentStation.position.set(0, 0.5, -storeDepth/2 + 15);
            coffeeCondimentStation.userData.isInteractive = true;
            coffeeCondimentStation.userData.name = "Condiment Station";
            coffeeCondimentStation.userData.flavorText = [
                "A self-serve condiment station with everything you need to customize your drink. Sugar packets, creamers, stirrers, and napkins are neatly organized. The white surface is kept clean and well-stocked.",
                "This station is positioned perfectly between the counter and seating area, making it easy for customers to grab what they need after ordering. Everything is within easy reach.",
                "The condiment station has compartments for different items - sweeteners on one side, creamers in the middle, and napkins and stirrers on the other. It's clearly designed for efficiency."
            ];
            interiorGroup.add(coffeeCondimentStation);
            
            // Condiment containers
            const condimentContainerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12);
            const condimentPositions = [
                { x: -1.5, z: 0, color: 0xFFFFFF }, // Sugar
                { x: -0.5, z: 0, color: 0xFFF8DC }, // Creamer
                { x: 0.5, z: 0, color: 0xFFE4B5 }, // Half & half
                { x: 1.5, z: 0, color: 0xFFFFFF }  // More sugar
            ];
            
            condimentPositions.forEach(({ x, z, color }) => {
                const container = new THREE.Mesh(condimentContainerGeometry, warmGlow(color, 0.8));
                container.position.set(x, 1.0, -storeDepth/2 + 15 + z);
                interiorGroup.add(container);
            });
            
            // Napkin dispenser
            const napkinDispenserGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
            const napkinDispenser = new THREE.Mesh(napkinDispenserGeometry, warmGlow(0xFFFFFF, 0.9));
            napkinDispenser.position.set(-2, 0.8, -storeDepth/2 + 15);
            interiorGroup.add(napkinDispenser);
            
            // =====================================================
            // TRASH AND RECYCLING BINS
            // =====================================================
            const trashBinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
            const trashBinMaterial = warmGlow(0x2F2F2F, 0.8);
            const recyclingBinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
            const recyclingBinMaterial = warmGlow(0x228B22, 0.8);
            
            const trashBin = new THREE.Mesh(trashBinGeometry, trashBinMaterial);
            trashBin.position.set(-storeWidth/2 + 3, 0.6, -storeDepth/2 + 15);
            trashBin.userData.isInteractive = true;
            trashBin.userData.name = "Trash Bin";
            trashBin.userData.flavorText = [
                "A standard trash bin for disposing of cups, napkins, and other waste. It's positioned conveniently near the seating area.",
                "The bin has a foot pedal (though you can't see it) and a lid to keep odors contained. It's clearly marked for trash only."
            ];
            interiorGroup.add(trashBin);
            
            const recyclingBin = new THREE.Mesh(recyclingBinGeometry, recyclingBinMaterial);
            recyclingBin.position.set(-storeWidth/2 + 4.5, 0.6, -storeDepth/2 + 15);
            recyclingBin.userData.isInteractive = true;
            recyclingBin.userData.name = "Recycling Bin";
            recyclingBin.userData.flavorText = [
                "A green recycling bin for plastic cups and other recyclables. Donut Galaxy is committed to being environmentally friendly.",
                "The bin is clearly labeled with recycling symbols. It sits next to the trash bin, making it easy for customers to sort their waste."
            ];
            interiorGroup.add(recyclingBin);
            
            // =====================================================
            // PLANTS AND DECORATIONS
            // =====================================================
            const coffeePlantPotGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 12);
            const coffeePlantPotMaterial = warmGlow(0x8B4513, 0.8);
            const coffeePlantLeafGeometry = new THREE.ConeGeometry(0.25, 0.8, 8);
            const coffeePlantLeafMaterial = warmGlow(0x228B22, 0.7);
            
            // Plants on tables
            const plantPositions = [
                { x: -8, z: 8 },
                { x: 0, z: 10 },
                { x: 8, z: 8 }
            ];
            
            plantPositions.forEach(({ x, z }) => {
                const plantGroup = new THREE.Group();
                
                const pot = new THREE.Mesh(coffeePlantPotGeometry, coffeePlantPotMaterial);
                pot.position.y = 0.2;
                plantGroup.add(pot);
                
                // Leaves
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const leaf = new THREE.Mesh(coffeePlantLeafGeometry, coffeePlantLeafMaterial);
                    leaf.position.set(Math.cos(angle) * 0.15, 0.5, Math.sin(angle) * 0.15);
                    leaf.rotation.z = (Math.random() - 0.5) * 0.3;
                    plantGroup.add(leaf);
                }
                
                plantGroup.position.set(x, 0.75, z);
                interiorGroup.add(plantGroup);
            });
            
            // Large decorative plant near entrance
            const largePlantPot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 0.6, 12),
                coffeePlantPotMaterial
            );
            largePlantPot.position.set(storeWidth/2 - 2, 0.3, storeDepth/2 - 3);
            interiorGroup.add(largePlantPot);
            
            const largePlantLeaves = new THREE.Mesh(
                new THREE.ConeGeometry(0.6, 1.5, 10),
                coffeePlantLeafMaterial
            );
            largePlantLeaves.position.set(storeWidth/2 - 2, 1.2, storeDepth/2 - 3);
            interiorGroup.add(largePlantLeaves);
            
            // =====================================================
            // WALL DECORATIONS
            // =====================================================
            // Artwork frames on walls
            const frameGeometry = new THREE.BoxGeometry(3, 2, 0.1);
            const frameMaterial = warmGlow(0x8B4513, 0.8);
            const artworkGeometry = new THREE.PlaneGeometry(2.7, 1.7);
            const artworkMaterial = warmGlow(0xFFD700, 0.6); // Golden artwork
            
            // Artwork on side walls
            const artworkPositions = [
                { x: -storeWidth/2 + 0.2, z: 5, rot: Math.PI / 2 },
                { x: -storeWidth/2 + 0.2, z: 15, rot: Math.PI / 2 },
                { x: storeWidth/2 - 0.2, z: 5, rot: -Math.PI / 2 },
                { x: storeWidth/2 - 0.2, z: 15, rot: -Math.PI / 2 }
            ];
            
            artworkPositions.forEach(({ x, z, rot }) => {
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.position.set(x, 3, z);
                frame.rotation.y = rot;
                interiorGroup.add(frame);
                
                const artwork = new THREE.Mesh(artworkGeometry, artworkMaterial);
                artwork.position.set(x, 3, z + (rot > 0 ? 0.06 : -0.06));
                artwork.rotation.y = rot;
                interiorGroup.add(artwork);
            });
            
            // Shelving units for pastries, beans, and merch
            const shelfUnitGeometry = new THREE.BoxGeometry(4, 3.2, 0.6);
            const shelfUnitMaterial = warmGlow(0x8B4513);
            const shelfDividerGeometry = new THREE.BoxGeometry(3.6, 0.12, 0.5);
            const pastryTrayGeometry = new THREE.BoxGeometry(3.5, 0.2, 0.45);
            const pastryColors = [0xF5DEB3, 0xFFE4B5, 0xFFDEAD, 0xFFF2CC];
            const coffeeBagGeometry = new THREE.BoxGeometry(0.6, 1, 0.4);
            const coffeeBagColors = [0x6B4226, 0x8B5A2B, 0xA0522D];
            const jarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
            const jarLidGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12);
            const mugDisplayGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.35, 12);
            const mugHandleGeometry = new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI);
            const tumblerGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12);
            const merchBoxGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.5);
            const coffeeCanisterGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16);
            const shelfSignGeometry = new THREE.PlaneGeometry(2.8, 0.6);
            const shelfSignColors = [0xFF7F50, 0xFFD700, 0x87CEFA, 0x98FB98];
            
            const createShelfContents = (shelf, baseY, variantIndex = 0) => {
                const variant = variantIndex % 4;
                const levelSpacing = 1.05;
                
                for (let level = 0; level < 3; level++) {
                    const levelY = baseY + level * levelSpacing;
                    const divider = new THREE.Mesh(shelfDividerGeometry, warmGlow(0xB8860B, 0.6));
                    divider.position.set(0, levelY, 0);
                    shelf.add(divider);
                    
                    switch (variant) {
                        case 0: { // classic pastry trays
                            const tray = new THREE.Mesh(
                                pastryTrayGeometry,
                                warmGlow(pastryColors[Math.floor(Math.random() * pastryColors.length)], 0.7)
                            );
                            tray.position.set(0, levelY + 0.1, 0.1);
                            shelf.add(tray);
                            
                            for (let p = 0; p < 5; p++) {
                                const pastry = new THREE.Mesh(
                                    new THREE.BoxGeometry(0.5, 0.3, 0.4),
                                    warmGlow(pastryColors[(p + level) % pastryColors.length])
                                );
                                pastry.position.set(-1.5 + p * 0.75, levelY + 0.25, (Math.random() - 0.5) * 0.15);
                                shelf.add(pastry);
                            }
                            break;
                        }
                        case 1: { // coffee bean jars
                            for (let j = 0; j < 3; j++) {
                                const jar = new THREE.Mesh(jarGeometry, warmGlow(0x654321, 0.4));
                                jar.position.set(-1.2 + j * 1.2, levelY + 0.3, 0.05);
                                shelf.add(jar);
                                
                                const lid = new THREE.Mesh(jarLidGeometry, warmGlow(0xD2B48C, 0.8));
                                lid.position.set(-1.2 + j * 1.2, levelY + 0.63, 0.05);
                                shelf.add(lid);
                                
                                const scoop = new THREE.Mesh(
                                    new THREE.BoxGeometry(0.2, 0.05, 0.4),
                                    warmGlow(0xC0C0C0, 0.7)
                                );
                                scoop.position.set(-1.2 + j * 1.2, levelY + 0.7, 0.25);
                                scoop.rotation.x = Math.PI / 6;
                                shelf.add(scoop);
                            }
                            break;
                        }
                        case 2: { // branded mugs and tumblers
                            for (let m = 0; m < 4; m++) {
                                if (m % 2 === 0) {
                                    const mug = new THREE.Mesh(mugDisplayGeometry, warmGlow(0xFFFFFF, 0.8));
                                    mug.position.set(-1.4 + m * 0.9, levelY + 0.2, 0.05);
                                    shelf.add(mug);
                                    
                                    const handle = new THREE.Mesh(mugHandleGeometry, warmGlow(0xFFA500, 0.9));
                                    handle.position.set(-1.1 + m * 0.9, levelY + 0.2, 0.05);
                                    handle.rotation.y = Math.PI / 2;
                                    mug.add(handle);
                                } else {
                                    const tumbler = new THREE.Mesh(tumblerGeometry, warmGlow(0x87CEEB, 0.6));
                                    tumbler.position.set(-1.4 + m * 0.9, levelY + 0.3, 0.05);
                                    shelf.add(tumbler);
                                }
                            }
                            break;
                        }
                        default: { // boxed coffee and canisters
                            for (let b = 0; b < 4; b++) {
                                const box = new THREE.Mesh(
                                    merchBoxGeometry,
                                    warmGlow(0xCD853F + b * 0x111111, 0.6)
                                );
                                box.position.set(-1.5 + b * 1.0, levelY + 0.25, 0.05);
                                shelf.add(box);
                            }
                            
                            const canister = new THREE.Mesh(coffeeCanisterGeometry, warmGlow(0x708090, 0.5));
                            canister.position.set(0, levelY + 0.45, 0.2);
                            shelf.add(canister);
                            break;
                        }
                    }
                }
                
                const sign = new THREE.Mesh(
                    shelfSignGeometry,
                    warmGlow(shelfSignColors[variant], 0.4)
                );
                sign.position.set(0, baseY + 3.9, 0.25);
                shelf.add(sign);
                
                for (let b = 0; b < 4; b++) {
                    const bag = new THREE.Mesh(
                        coffeeBagGeometry,
                        warmGlow(coffeeBagColors[(b + variant) % coffeeBagColors.length])
                    );
                    bag.position.set(-1.2 + b * 0.8, baseY + 3.6, -0.05 - (variant * 0.02));
                    shelf.add(bag);
                }
            };

            const shelfPositions = [
                { x: -storeWidth / 2 + 5, z: storeDepth / 2 - 10, rotationY: 0 },
                { x: -storeWidth / 2 + 6, z: 0, rotationY: 0 },
                { x: storeWidth / 2 - 6, z: -storeDepth / 2 + 12, rotationY: Math.PI },
                { x: storeWidth / 2 - 5, z: storeDepth / 2 - 14, rotationY: Math.PI }
            ];

            shelfPositions.forEach(({ x, z, rotationY }, index) => {
                const shelfUnit = new THREE.Mesh(shelfUnitGeometry, shelfUnitMaterial);
                shelfUnit.position.set(x, 1.6, z);
                shelfUnit.rotation.y = rotationY;
                createShelfContents(shelfUnit, -1.4, index);
                interiorGroup.add(shelfUnit);
            });
            
            // Coffee table and chair geometries (defined once for reuse)
            const coffeeTableGeometry = new THREE.BoxGeometry(1.6, 0.8, 1.6);
            const coffeeTableMaterial = warmGlow(0x8B4513);
            const coffeeChairGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const coffeeChairMaterial = warmGlow(0x654321);
            const plushChairBackGeometry = new THREE.BoxGeometry(0.55, 0.6, 0.1);
            const mugGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 12);
            const mugHandleSmallGeometry = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
            const plateGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 14);
            const miniDonutGeometry = new THREE.TorusGeometry(0.28, 0.09, 12, 16);
            const pastryBoxGeometry = new THREE.BoxGeometry(0.9, 0.35, 0.7);
            const napkinGeometry = new THREE.PlaneGeometry(0.6, 0.6);
            const laptopBaseGeometry = new THREE.BoxGeometry(1.1, 0.05, 0.8);
            const laptopScreenGeometry = new THREE.BoxGeometry(1.1, 0.7, 0.05);
            const plantPotGeometry = new THREE.CylinderGeometry(0.2, 0.28, 0.3, 8);
            const plantLeafGeometry = new THREE.ConeGeometry(0.16, 0.6, 6);
            
            const seatingLayouts = [
                {
                    position: { x: -20, z: 16 },
                    rotation: Math.PI / 12,
                    chairs: [
                        { x: -1.1, z: 0.2, rotation: Math.PI / 2 },
                        { x: 1.1, z: -0.1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'soloDonut'
                },
                {
                    position: { x: 18, z: 14 },
                    rotation: -Math.PI / 5,
                    chairs: [
                        { x: -1.3, z: 0.7, rotation: Math.PI / 3 },
                        { x: 1.3, z: 0.7, rotation: -Math.PI / 3 },
                        { x: 0, z: -1.2, rotation: Math.PI }
                    ],
                    decor: 'trioCatchUp'
                },
                {
                    position: { x: -24, z: -12 },
                    rotation: -Math.PI / 9,
                    chairs: [
                        { x: -1.2, z: 0.8, rotation: Math.PI / 1.4 },
                        { x: 1.2, z: 0.8, rotation: -Math.PI / 1.4 },
                        { x: 0, z: -1.1, rotation: Math.PI }
                    ],
                    decor: 'coffeeAndLaptop'
                },
                {
                    position: { x: 0, z: -18 },
                    rotation: Math.PI / 2,
                    chairs: [
                        { x: -1.1, z: 1, rotation: Math.PI / 2 },
                        { x: 1.1, z: 1, rotation: -Math.PI / 2 },
                        { x: -1.1, z: -1, rotation: Math.PI / 2 },
                        { x: 1.1, z: -1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'familyTreat'
                },
                {
                    position: { x: 22, z: 0 },
                    rotation: -Math.PI / 4,
                    chairs: [
                        { x: -1.2, z: 0.1, rotation: Math.PI / 2 },
                        { x: 1.2, z: -0.1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'studySession'
                }
            ];
            
            const addMug = (group, offsetX, offsetZ, color = 0xFFFFFF) => {
                const mug = new THREE.Mesh(mugGeometry, warmGlow(color, 0.85));
                mug.position.set(offsetX, 0.58, offsetZ);
                group.add(mug);
                
                const handle = new THREE.Mesh(mugHandleSmallGeometry, warmGlow(0xFFA500, 0.9));
                handle.position.set(offsetX + 0.18, 0.58, offsetZ);
                handle.rotation.y = Math.PI / 2;
                group.add(handle);
                
                // Add smaller steam particles rising from the mug (smaller version of coffee pot steam)
                const mugSteamParticles = [];
                const numMugSteamParticles = 1 + Math.floor(Math.random() * 2); // 1 to 2 particles (smaller than pot)
                
                // Create a group for the mug steam (similar to coffee pot group structure)
                const mugSteamGroup = new THREE.Group();
                const mugTopY = 0.58 + 0.35 / 2; // Top of mug
                mugSteamGroup.position.set(offsetX, mugTopY, offsetZ); // Position at top of mug
                
                for (let i = 0; i < numMugSteamParticles; i++) {
                    // Create smaller steam particles for mugs - use same material as coffee pot but smaller
                    const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // Same opacity as pot for visibility
                    const steamGeometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 4); // Size 0.04-0.06 (smaller than pot's 0.05-0.08)
                    const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
                    const initialX = (Math.random() - 0.5) * 0.08; // Smaller random x offset (relative to mug)
                    const initialZ = (Math.random() - 0.5) * 0.08; // Smaller random z offset (relative to mug)
                    steamParticle.position.set(
                        initialX,
                        0, // Relative to mugSteamGroup position (starts at top of mug)
                        initialZ
                    );
                    steamParticle.userData.initialY = 0; // Start at group origin
                    steamParticle.userData.initialX = initialX;
                    steamParticle.userData.initialZ = initialZ;
                    steamParticle.userData.speed = 0.04 + Math.random() * 0.02; // Slightly faster than before (0.04-0.06)
                    steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
                    steamParticle.userData.baseScale = 0.8 + Math.random() * 0.3; // Larger base scale for visibility
                    mugSteamGroup.add(steamParticle);
                    mugSteamParticles.push(steamParticle);
                }
                
                // Store steam particles in mugSteamGroup's userData for animation (like coffee pot)
                mugSteamGroup.userData.steamParticles = mugSteamParticles;
                mugSteamGroup.userData.isMugSteamGroup = true; // Mark as mug steam for animation
                group.add(mugSteamGroup);
            };
            
            const addDonutOnPlate = (group, offsetX, offsetZ, frostingColor) => {
                const plate = new THREE.Mesh(plateGeometry, warmGlow(0xF8F8FF, 0.7));
                plate.position.set(offsetX, 0.52, offsetZ);
                plate.rotation.x = -Math.PI / 2;
                group.add(plate);
                
                const donut = new THREE.Mesh(miniDonutGeometry, warmGlow(0xC68642, 0.9));
                donut.position.set(offsetX, 0.55, offsetZ);
                donut.rotation.x = Math.PI / 2;
                group.add(donut);
                
                const frosting = new THREE.Mesh(miniDonutGeometry, warmGlow(frostingColor, 0.8));
                frosting.scale.set(0.9, 0.4, 0.9);
                frosting.position.set(offsetX, 0.57, offsetZ);
                frosting.rotation.x = Math.PI / 2;
                group.add(frosting);
            };
            
            const addNapkin = (group, offsetX, offsetZ) => {
                const napkin = new THREE.Mesh(napkinGeometry, warmGlow(0xFFF5EE, 0.5));
                napkin.position.set(offsetX, 0.51, offsetZ);
                napkin.rotation.x = -Math.PI / 2;
                napkin.rotation.z = Math.PI / 4;
                group.add(napkin);
            };
            
            const addPlant = (group, offsetX, offsetZ) => {
                const pot = new THREE.Mesh(plantPotGeometry, warmGlow(0x8B4513, 0.8));
                pot.position.set(offsetX, 0.5, offsetZ);
                group.add(pot);
                
                const leaf = new THREE.Mesh(plantLeafGeometry, warmGlow(0x3CB371, 0.7));
                leaf.position.set(offsetX, 0.9, offsetZ);
                group.add(leaf);
            };
            
            const decorateTableSetting = (group, variant) => {
                switch (variant) {
                    case 'soloDonut':
                        addMug(group, -0.2, -0.2, 0xFFFFFF);
                        addDonutOnPlate(group, 0.3, 0.15, 0xFFC0CB);
                        addNapkin(group, 0.35, -0.25);
                        break;
                    case 'trioCatchUp':
                        addMug(group, -0.4, 0.2, 0xFFD700);
                        addMug(group, 0.4, 0.2, 0xFF69B4);
                        addDonutOnPlate(group, 0, -0.35, 0x87CEEB);
                        break;
                    case 'coffeeAndLaptop': {
                        addMug(group, -0.5, 0.25, 0xFFFFFF);
                        const laptopBase = new THREE.Mesh(laptopBaseGeometry, warmGlow(0xC0C0C0, 0.7));
                        laptopBase.position.set(0.3, 0.52, -0.1);
                        laptopBase.rotation.y = Math.PI / 6;
                        group.add(laptopBase);
                        
                        const laptopScreen = new THREE.Mesh(laptopScreenGeometry, warmGlow(0x1E1E1E, 0.8));
                        laptopScreen.position.set(0.3, 0.85, -0.45);
                        laptopScreen.rotation.y = Math.PI / 6;
                        laptopScreen.rotation.x = Math.PI / 9;
                        group.add(laptopScreen);
                        
                        addNapkin(group, 0.6, 0.2);
                        break;
                    }
                    case 'familyTreat':
                        addDonutOnPlate(group, -0.45, 0.25, 0xFF8C69);
                        addDonutOnPlate(group, 0.45, 0.25, 0xFFF8DC);
                        const pastryBox = new THREE.Mesh(pastryBoxGeometry, warmGlow(0xFFF5EE, 0.6));
                        pastryBox.position.set(0, 0.62, -0.35);
                        group.add(pastryBox);
                        addMug(group, -0.2, -0.4, 0x87CEEB);
                        addMug(group, 0.2, -0.4, 0xFFA500);
                        break;
                    default:
                        addMug(group, -0.4, 0.1, 0xFFFFFF);
                        addMug(group, 0.35, 0.1, 0xFFFFFF);
                        addPlant(group, 0, -0.3);
                        addNapkin(group, -0.05, 0.35);
                        break;
                }
            };
            
            seatingLayouts.forEach((layout) => {
                const cluster = new THREE.Group();
                
                const table = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
                table.position.y = 0.4;
                cluster.add(table);
                
                layout.chairs.forEach(({ x, z, rotation }) => {
                    const chair = new THREE.Mesh(coffeeChairGeometry, coffeeChairMaterial);
                    chair.position.set(x, 0.5, z);
                    chair.rotation.y = rotation || 0;
                    
                    const backrest = new THREE.Mesh(plushChairBackGeometry, warmGlow(0x8B4513, 0.7));
                    backrest.position.set(0, 0.75, -0.25);
                    chair.add(backrest);
                    
                    cluster.add(chair);
                });
                
                decorateTableSetting(cluster, layout.decor);
                
                cluster.position.set(layout.position.x, 0, layout.position.z);
                cluster.rotation.y = layout.rotation || 0;
                interiorGroup.add(cluster);
            });
            
            // Brew station behind the counter
            const brewingStation = new THREE.Group();
            brewingStation.position.set(12, 0, -storeDepth/2 + 1.5);
            
            const brewerCounterGeometry = new THREE.BoxGeometry(9, 0.4, 1.6);
            const brewerCounter = new THREE.Mesh(brewerCounterGeometry, warmGlow(0x2F4F4F, 0.7));
            brewerCounter.position.y = 0.55;
            brewingStation.add(brewerCounter);
            
            const urnGeometry = new THREE.CylinderGeometry(0.9, 0.8, 2.4, 16);
            const urnLidGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.15, 16);
            const urnSpoutGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.7);
            const urnPositions = [-3, 0, 3];
            urnPositions.forEach((xOffset, index) => {
                const urn = new THREE.Mesh(urnGeometry, warmGlow(0x4B4B4B + index * 0x050505, 0.8));
                urn.position.set(xOffset, 1.8, 0);
                brewingStation.add(urn);
                
                const lid = new THREE.Mesh(urnLidGeometry, warmGlow(0xA9A9A9, 0.9));
                lid.position.set(xOffset, 3, 0);
                brewingStation.add(lid);
                
                const spout = new THREE.Mesh(urnSpoutGeometry, warmGlow(0x2F4F4F, 0.9));
                spout.position.set(xOffset, 1.1, 0.85);
                spout.rotation.y = Math.PI / 2;
                brewingStation.add(spout);
            });
            
            const milkPitcherGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 12);
            const milkPitcher = new THREE.Mesh(milkPitcherGeometry, warmGlow(0xD3D3D3, 0.8));
            milkPitcher.position.set(-4, 1, 0.3);
            brewingStation.add(milkPitcher);
            
            const flavorPumpGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 10);
            const pumpColors = [0xFF7F50, 0xB0E0E6, 0xFFEBCD];
            pumpColors.forEach((color, idx) => {
                const pump = new THREE.Mesh(flavorPumpGeometry, warmGlow(color, 0.6));
                pump.position.set(4 - idx * 0.6, 1.3, 0.25);
                brewingStation.add(pump);
            });
            
            interiorGroup.add(brewingStation);
            
            // High-top counter with stools along the window
            const highTopGroup = new THREE.Group();
            highTopGroup.position.set(-24, 0, 10);
            highTopGroup.rotation.y = Math.PI / 6;
            
            const highTopSurfaceGeometry = new THREE.BoxGeometry(6.5, 0.2, 1.4);
            const highTopSurface = new THREE.Mesh(highTopSurfaceGeometry, warmGlow(0xA0522D, 0.8));
            highTopSurface.position.y = 1.1;
            highTopGroup.add(highTopSurface);
            
            const highTopBaseGeometry = new THREE.BoxGeometry(6.5, 0.15, 1.2);
            const highTopBase = new THREE.Mesh(highTopBaseGeometry, warmGlow(0x2F4F4F, 0.7));
            highTopBase.position.y = 0.6;
            highTopGroup.add(highTopBase);
            
            const stoolSeatGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.18, 12);
            const stoolLegGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8);
            const stoolPositions = [-2.2, 0, 2.2];
            stoolPositions.forEach((offset, idx) => {
                const stoolGroup = new THREE.Group();
                const leg = new THREE.Mesh(stoolLegGeometry, warmGlow(0x2F4F4F, 0.7));
                leg.position.y = 0.55;
                stoolGroup.add(leg);
                
                const seat = new THREE.Mesh(stoolSeatGeometry, warmGlow(idx % 2 === 0 ? 0xFF7F50 : 0xFFD700, 0.85));
                seat.position.y = 1.1;
                stoolGroup.add(seat);
                
                stoolGroup.position.set(offset, 0, 0.4);
                highTopGroup.add(stoolGroup);
            });
            
            const highTopMug = new THREE.Mesh(mugGeometry, warmGlow(0xFFFFFF, 0.8));
            highTopMug.position.set(-1.2, 1.25, 0.25);
            highTopGroup.add(highTopMug);
            
            const highTopNapkin = new THREE.Mesh(napkinGeometry, warmGlow(0xFDF5E6, 0.5));
            highTopNapkin.position.set(1.4, 1.2, 0.2);
            highTopNapkin.rotation.x = -Math.PI / 2;
            highTopGroup.add(highTopNapkin);
            
            interiorGroup.add(highTopGroup);
            
            // Self-serve condiment station
            const condimentStation = new THREE.Group();
            condimentStation.position.set(24, 0, -10);
            const condimentCounterGeometry = new THREE.BoxGeometry(4, 0.6, 1.2);
            const condimentCounter = new THREE.Mesh(condimentCounterGeometry, warmGlow(0x8B4513, 0.8));
            condimentCounter.position.y = 0.3;
            condimentStation.add(condimentCounter);
            
            const sugarJar = new THREE.Mesh(jarGeometry, warmGlow(0xFFF8DC, 0.6));
            sugarJar.position.set(-1.1, 0.75, 0.2);
            condimentStation.add(sugarJar);
            
            const stirStickHolder = new THREE.Mesh(strawBundleGeometry, warmGlow(0x8B4513, 0.7));
            stirStickHolder.scale.set(3, 1, 3);
            stirStickHolder.position.set(0, 0.9, 0.15);
            condimentStation.add(stirStickHolder);
            
            const lidStack = new THREE.Mesh(plateGeometry, warmGlow(0xE0E0E0, 0.6));
            lidStack.scale.set(1.2, 1.2, 1.2);
            lidStack.position.set(1.1, 0.75, 0.2);
            condimentStation.add(lidStack);
            
            interiorGroup.add(condimentStation);
            
            // Storage shelves with curated supplies
            const coffeeStorageShelfGeometry = new THREE.BoxGeometry(2.2, 3.2, 0.6);
            const coffeeStorageShelfMaterial = warmGlow(0x7F4F24, 0.8);
            const burlapSackGeometry = new THREE.CylinderGeometry(0.45, 0.5, 1.0, 8);
            const trayStackGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.9);
            const cleaningBottleGeometry = new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8);
            const filterBoxGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.7);
            const storagePositions = [
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 4 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 8 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 12 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 16 }
            ];
            
            const decorateStorageShelf = (shelf, variantIndex) => {
                const variant = variantIndex % 4;
                switch (variant) {
                    case 0: { // burlap bean sacks
                        for (let s = 0; s < 3; s++) {
                            const sack = new THREE.Mesh(burlapSackGeometry, warmGlow(0xCD853F, 0.6));
                            sack.position.set(-0.5 + s * 0.5, 0.7, 0);
                            shelf.add(sack);
                        }
                        break;
                    }
                    case 1: { // tray stacks and liners
                        for (let t = 0; t < 2; t++) {
                            const trayStack = new THREE.Mesh(trayStackGeometry, warmGlow(0xD2B48C, 0.7));
                            trayStack.position.set(-0.4 + t * 0.8, 0.8, 0);
                            shelf.add(trayStack);
                        }
                        const linerRoll = new THREE.Mesh(flavorPumpGeometry, warmGlow(0xFFFFFF, 0.5));
                        linerRoll.scale.set(0.4, 0.4, 0.4);
                        linerRoll.position.set(0, 1.5, 0.1);
                        shelf.add(linerRoll);
                        break;
                    }
                    case 2: { // cleaning supplies
                        for (let b = 0; b < 3; b++) {
                            const bottle = new THREE.Mesh(cleaningBottleGeometry, warmGlow(0x87CEEB + b * 0x111100, 0.7));
                            bottle.position.set(-0.6 + b * 0.6, 0.9, 0.05);
                            shelf.add(bottle);
                        }
                        const towelStack = new THREE.Mesh(pastryTrayGeometry, warmGlow(0xF5F5F5, 0.6));
                        towelStack.scale.set(0.3, 0.2, 0.6);
                        towelStack.position.set(0, 0.6, 0.05);
                        shelf.add(towelStack);
                        break;
                    }
                    default: { // cup and lid refills
                        for (let c = 0; c < 3; c++) {
                            const stack = new THREE.Mesh(cupStackGeometry, warmGlow(cupStackColors[c] || 0xFFFFFF, 0.8));
                            stack.scale.set(0.6, 0.8, 0.6);
                            stack.position.set(-0.6 + c * 0.6, 0.9, 0);
                            shelf.add(stack);
                        }
                        const filters = new THREE.Mesh(filterBoxGeometry, warmGlow(0xEEE8AA, 0.6));
                        filters.position.set(0, 1.5, 0.05);
                        shelf.add(filters);
                        break;
                    }
                }
            };
            
            storagePositions.forEach((pos, index) => {
                const storageShelf = new THREE.Mesh(coffeeStorageShelfGeometry, coffeeStorageShelfMaterial);
                storageShelf.position.set(pos.x, 1.6, pos.z);
                decorateStorageShelf(storageShelf, index);
                interiorGroup.add(storageShelf);
            });
            break;
            
        case 'flowers': // Flower Shop
            // Flower table and vase geometries (defined once for reuse)
            const flowerTableGeometry = new THREE.BoxGeometry(3, 1, 1.5);
            const flowerTableMaterial = warmGlow(0xF5F5DC);
            const vaseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
            const vaseMaterial = warmGlow(0x87CEEB);
            
            // Multiple flower geometries for variety
            const flowerSphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const flowerConeGeometry = new THREE.ConeGeometry(0.25, 0.4, 8);
            const flowerTorusGeometry = new THREE.TorusGeometry(0.2, 0.1, 8, 16);
            const flowerOctahedronGeometry = new THREE.OctahedronGeometry(0.25);
            
            // Expanded flower color palette
            const flowerColors = [
                0xFF1493, 0xFF69B4, 0xFFB6C1, 0x98FB98, 0x90EE90, 0x32CD32,
                0xFFD700, 0xFFA500, 0xFF6347, 0xFF4500, 0xDA70D6, 0xBA55D3,
                0x9370DB, 0x8A2BE2, 0xFF00FF, 0xFF1493, 0x00CED1, 0x00BFFF,
                0x1E90FF, 0x4169E1, 0xFF69B4, 0xFF1493, 0xFFC0CB, 0xFFB6C1
            ];
            
            // Helper function to create a flower with random shape and color
            const createFlower = (x, y, z) => {
                const flowerGroup = new THREE.Group();
                const flowerType = Math.floor(Math.random() * 4);
                const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                
                let flowerMesh;
                switch(flowerType) {
                    case 0: // Sphere flower
                        flowerMesh = new THREE.Mesh(flowerSphereGeometry, warmGlow(color));
                        break;
                    case 1: // Cone flower (tulip-like)
                        flowerMesh = new THREE.Mesh(flowerConeGeometry, warmGlow(color));
                        break;
                    case 2: // Torus flower (ring-shaped)
                        flowerMesh = new THREE.Mesh(flowerTorusGeometry, warmGlow(color));
                        flowerMesh.rotation.x = Math.PI / 2;
                        break;
                    case 3: // Octahedron flower (star-shaped)
                        flowerMesh = new THREE.Mesh(flowerOctahedronGeometry, warmGlow(color));
                        break;
                }
                
                flowerGroup.add(flowerMesh);
                flowerGroup.position.set(x, y, z);
                return flowerGroup;
            };
            
            // Helper function to create potted plant
            const createPottedPlant = (x, z, size = 1.0) => {
                const plantGroup = new THREE.Group();
                const potSize = 0.3 * size;
                const potGeometry = new THREE.CylinderGeometry(potSize * 0.8, potSize, 0.4 * size, 8);
                const potMaterial = warmGlow(0x8B4513);
                const pot = new THREE.Mesh(potGeometry, potMaterial);
                pot.position.y = 0.2 * size;
                plantGroup.add(pot);
                
                // Multiple leaves/stems
                const leafCount = 3 + Math.floor(Math.random() * 4);
                for (let i = 0; i < leafCount; i++) {
                    const leafGeometry = new THREE.ConeGeometry(0.15 * size, 0.6 * size, 6);
                    const leafColor = [0x228B22, 0x32CD32, 0x90EE90, 0x98FB98][Math.floor(Math.random() * 4)];
                    const leaf = new THREE.Mesh(leafGeometry, warmGlow(leafColor));
                    const angle = (i / leafCount) * Math.PI * 2;
                    leaf.position.set(
                        Math.cos(angle) * 0.2 * size,
                        0.5 * size,
                        Math.sin(angle) * 0.2 * size
                    );
                    leaf.rotation.z = Math.random() * 0.5 - 0.25;
                    plantGroup.add(leaf);
                }
                
                plantGroup.position.set(x, 0, z);
                return plantGroup;
            };
            
            // Helper function to create hanging plant
            const createHangingPlant = (x, z, height) => {
                const hangingGroup = new THREE.Group();
                
                // Chain/rope
                const chainGeometry = new THREE.CylinderGeometry(0.02, 0.02, height - 1.5, 4);
                const chainMaterial = warmGlow(0x696969);
                const chain = new THREE.Mesh(chainGeometry, chainMaterial);
                chain.position.y = -(height - 1.5) / 2;
                hangingGroup.add(chain);
                
                // Hanging pot
                const hangingPotGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.3, 8);
                const hangingPotMaterial = warmGlow(0x8B4513);
                const hangingPot = new THREE.Mesh(hangingPotGeometry, hangingPotMaterial);
                hangingPot.position.y = -(height - 1.2);
                hangingGroup.add(hangingPot);
                
                // Trailing leaves
                const trailingLeafCount = 4 + Math.floor(Math.random() * 3);
                for (let i = 0; i < trailingLeafCount; i++) {
                    const leafGeometry = new THREE.ConeGeometry(0.1, 0.4, 6);
                    const leafColor = [0x228B22, 0x32CD32, 0x90EE90][Math.floor(Math.random() * 3)];
                    const leaf = new THREE.Mesh(leafGeometry, warmGlow(leafColor));
                    const angle = (i / trailingLeafCount) * Math.PI * 2;
                    leaf.position.set(
                        Math.cos(angle) * 0.15,
                        -(height - 1.5) - 0.1 * i,
                        Math.sin(angle) * 0.15
                    );
                    leaf.rotation.z = Math.random() * 0.3;
                    hangingGroup.add(leaf);
                }
                
                hangingGroup.position.set(x, height, z);
                return hangingGroup;
            };
            
            // AISLE SYSTEM LAYOUT
            // Define aisle structure: 4 aisles running front to back (along Z axis)
            // Aisle 1: Left side (x = -18 to -12)
            // Aisle 2: Left-center (x = -8 to -2) - HANGING PLANTS AISLE
            // Aisle 3: Right-center (x = 2 to 8) - HANGING PLANTS AISLE
            // Aisle 4: Right side (x = 12 to 18)
            // Walkways between aisles at x = -10, 0, 10
            
            const aisleWidth = 6; // Width of each aisle
            const walkwayWidth = 4; // Width of walkways between aisles
            const aisle1CenterX = -15; // Left aisle
            const aisle2CenterX = -5;  // Left-center aisle (hanging plants)
            const aisle3CenterX = 5;   // Right-center aisle (hanging plants)
            const aisle4CenterX = 15;   // Right aisle
            
            // Counter at front with flowers on top
            const flowerCounterGeometry = new THREE.BoxGeometry(5.3, 1.2, 1.5);
            const flowerCounterMaterial = warmGlow(0x90EE90, 0.8);
            const flowerCounter = new THREE.Mesh(flowerCounterGeometry, flowerCounterMaterial);
            flowerCounter.position.set(0, 0.5, storeDepth/2 - 60);
            interiorGroup.add(flowerCounter);
            
            // Flowers on counter (store for animation)
            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.counterFlowers) {
                scene.userData.counterFlowers = [];
            }
            for (let i = 0; i < 5; i++) {
                const counterFlower = createFlower(-2.5 + i * 1.275, 2.3, storeDepth/2 - 60);
                interiorGroup.add(counterFlower);
                // Store reference for animation
                scene.userData.counterFlowers.push(counterFlower);
            }
            
            // Refrigerated display cases along side walls
            const fridgeGeometry = new THREE.BoxGeometry(4, 2, 1);
            const fridgeMaterial = warmGlow(0xFFFFFF);
            const fridgePositions = [
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 8 },
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 14 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 8 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 14 }
            ];
            fridgePositions.forEach(({ x, z }) => {
                const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
                fridge.position.set(x, 1, z);
                interiorGroup.add(fridge);
            });
            
            // Window display areas with flowers (front of shop)
            const windowDisplayPositions = [
                { x: -storeWidth/2 + 1, z: storeDepth/2 + 2.5 },
                { x: storeWidth/2 - 1, z: storeDepth/2 + 2.5 }
            ];
            windowDisplayPositions.forEach(({ x, z }) => {
                const windowTable = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                windowTable.scale.set(1.5, 1, 1);
                windowTable.position.set(x, 0.5, z);
                interiorGroup.add(windowTable);
                
                for (let w = 0; w < 5; w++) {
                    const windowVase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    windowVase.position.set(x - 1.5 + w * 0.75, 0.75, z);
                    interiorGroup.add(windowVase);
                    
                    const windowFlower = createFlower(x - 1.5 + w * 0.75, 1.1, z);
                    interiorGroup.add(windowFlower);
                }
            });
            
            // Helper function to create aisle displays (tables with flowers)
            const createAisleDisplay = (centerX, startZ, endZ, tableSpacing = 4) => {
                const displays = [];
                for (let z = startZ; z <= endZ; z += tableSpacing) {
                    displays.push({ x: centerX, z: z });
                }
                return displays;
            };
            
            // AISLE 1: Left side aisle - Flower displays
            const aisle1Displays = createAisleDisplay(aisle1CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 4);
            aisle1Displays.forEach(({ x, z }) => {
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                // 3-4 vases per table
                const vaseCount = 3 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 3);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
            });
            
            // AISLE 2: Left-center aisle - HANGING PLANTS AISLE
            const aisle2Displays = createAisleDisplay(aisle2CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 3);
            aisle2Displays.forEach(({ x, z }) => {
                // Tables with flowers
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                const vaseCount = 2 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 2);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
                
                // Hanging plants above tables (every other display)
                if (Math.random() > 0.3) {
                    const hangingHeight = 3 + Math.random() * 0.5;
                    const hangingPlant = createHangingPlant(x, z, hangingHeight);
                    interiorGroup.add(hangingPlant);
                }
            });
            
            // AISLE 3: Right-center aisle - HANGING PLANTS AISLE
            const aisle3Displays = createAisleDisplay(aisle3CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 3);
            aisle3Displays.forEach(({ x, z }) => {
                // Tables with flowers
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                const vaseCount = 2 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 2);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
                
                // Hanging plants above tables (every other display)
                if (Math.random() > 0.3) {
                    const hangingHeight = 3 + Math.random() * 0.5;
                    const hangingPlant = createHangingPlant(x, z, hangingHeight);
                    interiorGroup.add(hangingPlant);
                }
            });
            
            // AISLE 4: Right side aisle - Flower displays
            const aisle4Displays = createAisleDisplay(aisle4CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 4);
            aisle4Displays.forEach(({ x, z }) => {
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                // 3-4 vases per table
                const vaseCount = 3 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 3);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
            });
            
            // Additional hanging plants in the two hanging plant aisles (more concentrated)
            const extraHangingPositions = [
                // Aisle 2 (left-center) - extra hanging plants
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 7 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 7 },
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 13 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 13 },
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 19 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 19 },
                { x: aisle2CenterX, z: -storeDepth/2 + 10 },
                { x: aisle2CenterX, z: -storeDepth/2 + 16 },
                // Aisle 3 (right-center) - extra hanging plants
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 7 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 7 },
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 13 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 13 },
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 19 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 19 },
                { x: aisle3CenterX, z: -storeDepth/2 + 10 },
                { x: aisle3CenterX, z: -storeDepth/2 + 16 }
            ];
            extraHangingPositions.forEach(({ x, z }) => {
                const hangingHeight = 3 + Math.random() * 0.5;
                const hangingPlant = createHangingPlant(x, z, hangingHeight);
                interiorGroup.add(hangingPlant);
            });
            
            // Potted plants at aisle ends and corners
            const pottedPlantPositions = [
                // Front corners
                { x: aisle1CenterX, z: storeDepth/2 - 4 },
                { x: aisle4CenterX, z: storeDepth/2 - 4 },
                // Back corners
                { x: aisle1CenterX, z: -storeDepth/2 + 2 },
                { x: aisle4CenterX, z: -storeDepth/2 + 2 },
                // Side walls near aisles
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 8 },
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 14 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 8 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 14 },
                // Walkway intersections
                { x: -10, z: -storeDepth/2 + 6 },
                { x: 0, z: -storeDepth/2 + 6 },
                { x: 10, z: -storeDepth/2 + 6 },
                { x: -10, z: storeDepth/2 - 8 },
                { x: 10, z: storeDepth/2 - 8 }
            ];
            pottedPlantPositions.forEach(({ x, z }) => {
                const plant = createPottedPlant(x, z, 0.8 + Math.random() * 0.4);
                interiorGroup.add(plant);
            });
            
            // Large center display arrangement (against left wall)
            const centerTable = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
            centerTable.scale.set(2, 1.2, 2);
            centerTable.position.set(-storeWidth/2 + 3, 0.6, -storeDepth/2 + 10);
            interiorGroup.add(centerTable);
            
            for (let c = 0; c < 8; c++) {
                const angle = (c / 8) * Math.PI * 2;
                const radius = 1.2;
                const centerVase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                centerVase.scale.set(1.2, 1.2, 1.2);
                centerVase.position.set(
                    -storeWidth/2 + 3 + Math.cos(angle) * radius,
                    0.9,
                    -storeDepth/2 + 10 + Math.sin(angle) * radius
                );
                interiorGroup.add(centerVase);
                
                const centerFlower = createFlower(
                    -storeWidth/2 + 3 + Math.cos(angle) * radius,
                    1.3,
                    -storeDepth/2 + 10 + Math.sin(angle) * radius
                );
                centerFlower.scale.set(1.3, 1.3, 1.3);
                interiorGroup.add(centerFlower);
            }
            break;
            
        default:
            // Generic shop - add basic shelves
            const genericShelfGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
            const genericShelfMaterial = warmGlow(0x8B4513);
            for (let i = 0; i < 3; i++) {
                const shelf = new THREE.Mesh(genericShelfGeometry, genericShelfMaterial);
                shelf.position.set(-4 + i * 4, 1, -storeDepth/2 + 3);
                interiorGroup.add(shelf);
            }
            break;
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    // Collect all interactive items for flavor text system
    const interactiveItems = [];
    interiorGroup.traverse((object) => {
        if (object.userData && object.userData.isInteractive) {
            interactiveItems.push(object);
        }
    });
    interiorGroup.userData.interactiveItems = interactiveItems;
    console.log(`📦 Collected ${interactiveItems.length} interactive items for ${shopName}`);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    
    console.log(`🏪 Created ${shopName} interior`);
    return interiorGroup;
};

// Create Church Interior
export const createChurchInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Church Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 16; // Taller for church
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x8B4513);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB, // Sky blue - heavenly
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    
    // Pews (rows of benches)
    const pewGeometry = new THREE.BoxGeometry(storeWidth - 4, 0.8, 1.5);
    const pewMaterial = warmGlow(0x654321);
    for (let i = 0; i < 6; i++) {
        const pew = new THREE.Mesh(pewGeometry, pewMaterial);
        pew.position.set(0, 0.4, -storeDepth/2 + 4 + i * 4);
        interiorGroup.add(pew);
    }
    
    // Altar at the front
    const altarGeometry = new THREE.BoxGeometry(6, 2, 2);
    const altarMaterial = warmGlow(0xF5DEB3);
    const altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 1, -storeDepth/2 + 2);
    interiorGroup.add(altar);
    
    // Stained glass windows (decorative)
    const windowGeometry = new THREE.PlaneGeometry(3, 4);
    const windowMaterial = warmGlow(0x4169E1);
    for (let i = 0; i < 4; i++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-storeWidth/2 + 2 + i * 4, wallHeight/2, -storeDepth/2 + 0.2);
        interiorGroup.add(window);
    }
    
    // More pews throughout
    for (let i = 6; i < 15; i++) {
        const extraPew = new THREE.Mesh(pewGeometry, pewMaterial);
        extraPew.position.set(0, 0.4, -storeDepth/2 + 4 + i * 3);
        interiorGroup.add(extraPew);
    }
    
    // Candles on altar
    const candleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const candleMaterial = warmGlow(0xFFD700);
    for (let i = 0; i < 5; i++) {
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candle.position.set(-2 + i * 1, 2.4, -storeDepth/2 + 2);
        interiorGroup.add(candle);
    }
    
    // Organ/piano area
    const organGeometry = new THREE.BoxGeometry(4, 3, 1.5);
    const organMaterial = warmGlow(0x000000);
    const organ = new THREE.Mesh(organGeometry, organMaterial);
    organ.position.set(-storeWidth/2 + 2, 1.5, -storeDepth/2 + 8);
    interiorGroup.add(organ);
    
    // Decorative columns
    const columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, wallHeight - 2, 8);
    const columnMaterial = warmGlow(0xF5DEB3);
    const columnPositions = [
        -storeWidth/2 + 4,
        -storeWidth/2 + 12,
        -4,
        4,
        storeWidth/2 - 12,
        storeWidth/2 - 4
    ];
    columnPositions.forEach((xPos) => {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(xPos, (wallHeight - 2)/2, -storeDepth/2 + 12);
        interiorGroup.add(column);
    });
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("⛪ Created Church interior");
    return interiorGroup;
};

// Create Town Hall Interior
export const createTownHallInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Town Hall Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 12;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xD3D3D3);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xF0E68C, // Khaki - warm yellow
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    const layoutScale = storeWidth / 100;
    
    // Office desks
    const deskGeometry = new THREE.BoxGeometry(3, 1.2, 1.5);
    const deskMaterial = warmGlow(0x8B4513);
    const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const chairMaterial = warmGlow(0x654321);
    
    for (let i = 0; i < 3; i++) {
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(-6 + i * 6, 0.6, -storeDepth/2 + 3);
        interiorGroup.add(desk);
        
        // Chair behind desk
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        chair.position.set(-6 + i * 6, 0.5, -storeDepth/2 + 4);
        interiorGroup.add(chair);
    }
    
    // Filing cabinets
    const cabinetGeometry = new THREE.BoxGeometry(1, 2, 1);
    const cabinetMaterial = warmGlow(0x696969);
    for (let i = 0; i < 4; i++) {
        const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
        cabinet.position.set(-storeWidth/2 + 1.5, 1, -storeDepth/2 + 2 + i * 2);
        interiorGroup.add(cabinet);
    }
    
    // Meeting table in center
    const tableGeometry = new THREE.BoxGeometry(8, 0.8, 3);
    const tableMaterial = warmGlow(0xF5DEB3);
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 0.4, 4);
    interiorGroup.add(table);
    
    // More desks throughout
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            const extraDesk = new THREE.Mesh(deskGeometry, deskMaterial);
            const xPos = (-40 + i * 16) * layoutScale;
            const zPos = (-20 + j * 12) * layoutScale;
            extraDesk.position.set(xPos, 0.6, zPos);
            interiorGroup.add(extraDesk);
            
            const extraChair = new THREE.Mesh(chairGeometry, chairMaterial);
            extraChair.position.set(xPos, 0.5, zPos + 1.2);
            interiorGroup.add(extraChair);
        }
    }
    
    // More filing cabinets
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const extraCabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
            extraCabinet.position.set((-35 + i * 18) * layoutScale, 1, (-15 + j * 18) * layoutScale);
            interiorGroup.add(extraCabinet);
        }
    }
    
    // Waiting area with chairs
    const waitingChairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const waitingChairMaterial = warmGlow(0x4682B4);
    for (let i = 0; i < 6; i++) {
        const waitingChair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        waitingChair.position.set((-25 + i * 10) * layoutScale, 0.5, storeDepth/2 - 3);
        interiorGroup.add(waitingChair);
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🏛️ Created Town Hall interior");
    return interiorGroup;
};

// Create Colonial House Interior
export const createHouseInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Colonial House Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xD2691E);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xF5DEB3, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFB6C1, // Light pink - cozy
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Fireplace
    const fireplaceGeometry = new THREE.BoxGeometry(3, 3, 2);
    const fireplaceMaterial = warmGlow(0x696969);
    const fireplace = new THREE.Mesh(fireplaceGeometry, fireplaceMaterial);
    fireplace.position.set(0, 1.5, -storeDepth/2 + 1);
    interiorGroup.add(fireplace);
    
    // Sofa
    const sofaGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const sofaMaterial = warmGlow(0x8B4513);
    const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
    sofa.position.set(0, 0.6, 2);
    interiorGroup.add(sofa);
    
    // Coffee table
    const coffeeTableGeometry = new THREE.BoxGeometry(2, 0.6, 1.5);
    const coffeeTableMaterial = warmGlow(0x654321);
    const coffeeTable = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
    coffeeTable.position.set(0, 0.3, 4);
    interiorGroup.add(coffeeTable);
    
    // Dining table
    const diningTableGeometry = new THREE.BoxGeometry(4, 0.8, 2.5);
    const diningTableMaterial = warmGlow(0x8B4513);
    const diningTable = new THREE.Mesh(diningTableGeometry, diningTableMaterial);
    diningTable.position.set(-storeWidth/2 + 3, 0.4, -storeDepth/2 + 4);
    interiorGroup.add(diningTable);
    
    // Chairs around dining table
    const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const chairMaterial = warmGlow(0x654321);
    for (let i = 0; i < 4; i++) {
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        const angle = (i / 4) * Math.PI * 2;
        chair.position.set(-storeWidth/2 + 3 + Math.cos(angle) * 1.5, 0.5, -storeDepth/2 + 4 + Math.sin(angle) * 1.5);
        interiorGroup.add(chair);
    }
    
    // Kitchen area
    const kitchenCounterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
    const kitchenCounterMaterial = warmGlow(0xFFFFFF);
    const kitchenCounter = new THREE.Mesh(kitchenCounterGeometry, kitchenCounterMaterial);
    kitchenCounter.position.set(storeWidth/2 - 3, 0.6, -storeDepth/2 + 3);
    interiorGroup.add(kitchenCounter);
    
    // Stove
    const stoveGeometry = new THREE.BoxGeometry(2, 1.2, 1.5);
    const stoveMaterial = warmGlow(0x000000);
    const stove = new THREE.Mesh(stoveGeometry, stoveMaterial);
    stove.position.set(storeWidth/2 - 3, 0.6, -storeDepth/2 + 5);
    interiorGroup.add(stove);
    
    const layoutScaleHouse = storeWidth / 100;
    
    // More furniture throughout
    for (let i = 0; i < 4; i++) {
        const extraSofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        extraSofa.position.set((-30 + i * 20) * layoutScaleHouse, 0.6, (10 + Math.floor(i/2) * 15) * layoutScaleHouse);
        interiorGroup.add(extraSofa);
        
        const extraCoffeeTable = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
        extraCoffeeTable.position.set((-30 + i * 20) * layoutScaleHouse, 0.3, (12 + Math.floor(i/2) * 15) * layoutScaleHouse);
        interiorGroup.add(extraCoffeeTable);
    }
    
    // Bookshelves
    const bookshelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const bookshelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 6; i++) {
        const bookshelf = new THREE.Mesh(bookshelfGeometry, bookshelfMaterial);
        bookshelf.position.set((-40 + i * 16) * layoutScaleHouse, 1.5, -storeDepth/2 + 2);
        interiorGroup.add(bookshelf);
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🏠 Created Colonial House interior");
    return interiorGroup;
};

// Create Hospital Interior
export const createHospitalInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Hospital Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 12;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xE6E6FA);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xFFFFFF, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xB0E0E6, // Powder blue - clean medical
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    const layoutScaleHospital = storeWidth / 100;
    
    // Hospital beds
    const bedGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.5);
    const bedMaterial = warmGlow(0xFFFFFF);
    const equipmentGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const equipmentMaterial = warmGlow(0x4169E1);
    
    for (let i = 0; i < 4; i++) {
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(-6 + i * 4, 0.4, -storeDepth/2 + 3);
        interiorGroup.add(bed);
        
        // Medical equipment next to bed
        const equipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
        equipment.position.set(-6 + i * 4 + 1.5, 1, -storeDepth/2 + 3);
        interiorGroup.add(equipment);
    }
    
    // Waiting area chairs
    const waitingChairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const waitingChairMaterial = warmGlow(0x4682B4);
    for (let i = 0; i < 6; i++) {
        const chair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        chair.position.set(-6 + i * 2.4, 0.5, 6);
        interiorGroup.add(chair);
    }
    
    // Reception desk
    const deskGeometry = new THREE.BoxGeometry(6, 1.2, 1.5);
    const deskMaterial = warmGlow(0x708090);
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, 0.6, storeDepth/2 - 2);
    interiorGroup.add(desk);
    
    // More hospital beds throughout
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const extraBed = new THREE.Mesh(bedGeometry, bedMaterial);
            const xPos = (-21 + i * 14) * layoutScaleHospital;
            const zPos = (-12 + j * 14) * layoutScaleHospital;
            extraBed.position.set(xPos, 0.4, zPos);
            interiorGroup.add(extraBed);
            
            const extraEquipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
            extraEquipment.position.set(xPos + 1.2, 1, zPos);
            interiorGroup.add(extraEquipment);
        }
    }
    
    // Medical cabinets
    const medicalCabinetGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    const medicalCabinetMaterial = warmGlow(0x4169E1);
    for (let i = 0; i < 4; i++) {
        const medicalCabinet = new THREE.Mesh(medicalCabinetGeometry, medicalCabinetMaterial);
        medicalCabinet.position.set((-35 + i * 16) * layoutScaleHospital, 1.25, -storeDepth/2 + 2);
        interiorGroup.add(medicalCabinet);
    }
    
    // More waiting chairs
    for (let i = 0; i < 6; i++) {
        const extraWaitingChair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        extraWaitingChair.position.set((-18 + i * 6) * layoutScaleHospital, 0.5, storeDepth/2 - 4);
        interiorGroup.add(extraWaitingChair);
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🏥 Created Hospital interior");
    return interiorGroup;
};

// Create Modern Building Interior (office space)
export const createModernInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Modern Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - modern polished
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xE0E0E0);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - modern white
    const wallMaterial = createWireframeMaterial(0xFFFFFF, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xE6E6FA, // Lavender - modern
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Modern office desks
    const deskGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const deskMaterial = warmGlow(0xD3D3D3);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.position.set(-40 + i * 16, 0.6, -40 + j * 20);
            interiorGroup.add(desk);
            
            // Office chairs
            const chairGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
            const chairMaterial = warmGlow(0x4682B4);
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(-40 + i * 16, 0.5, -40 + j * 20 + 1.5);
            interiorGroup.add(chair);
        }
    }
    
    // Conference table in center
    const conferenceTableGeometry = new THREE.BoxGeometry(12, 0.8, 6);
    const conferenceTableMaterial = warmGlow(0x8B4513);
    const conferenceTable = new THREE.Mesh(conferenceTableGeometry, conferenceTableMaterial);
    conferenceTable.position.set(0, 0.4, 0);
    interiorGroup.add(conferenceTable);
    
    // Conference chairs
    const conferenceChairGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
    const conferenceChairMaterial = warmGlow(0x2F4F4F);
    for (let i = 0; i < 8; i++) {
        const chair = new THREE.Mesh(conferenceChairGeometry, conferenceChairMaterial);
        const angle = (i / 8) * Math.PI * 2;
        chair.position.set(Math.cos(angle) * 4, 0.5, Math.sin(angle) * 2);
        interiorGroup.add(chair);
    }
    
    // Office partitions
    const partitionGeometry = new THREE.BoxGeometry(0.1, 1.5, 2);
    const partitionMaterial = warmGlow(0xD3D3D3);
    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 6; j++) {
            const partition = new THREE.Mesh(partitionGeometry, partitionMaterial);
            partition.position.set(-45 + i * 8, 0.75, -40 + j * 16);
            interiorGroup.add(partition);
        }
    }
    
    // Computer monitors on desks
    const monitorGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    const monitorMaterial = warmGlow(0x000000);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set(-40 + i * 16, 1.5, -40 + j * 20);
            interiorGroup.add(monitor);
        }
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🏢 Created Modern Building interior");
    return interiorGroup;
};

// Create Brick Building Interior (generic retail/office)
export const createBrickInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Brick Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xB8860B);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - brick colored
    const wallMaterial = createWireframeMaterial(0xCD853F, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFDAB9, // Peach puff - warm retail
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Retail shelves
    const shelfGeometry = new THREE.BoxGeometry(8, 3, 0.5);
    const shelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 5; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(-30 + i * 15, 1.5, -storeDepth/2 + 8);
        interiorGroup.add(shelf);
    }
    
    // Counter at front
    const counterGeometry = new THREE.BoxGeometry(12, 1.2, 2);
    const counterMaterial = warmGlow(0x654321);
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, storeDepth/2 - 4);
    interiorGroup.add(counter);
    
    // Tables for displays
    const tableGeometry = new THREE.BoxGeometry(4, 0.8, 2);
    const tableMaterial = warmGlow(0xF5DEB3);
    for (let i = 0; i < 4; i++) {
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-15 + i * 10, 0.4, 10);
        interiorGroup.add(table);
    }
    
    // More shelves throughout
    for (let i = 5; i < 12; i++) {
        for (let j = 0; j < 3; j++) {
            const extraShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            extraShelf.position.set(-40 + i * 7, 1.5, -30 + j * 15);
            interiorGroup.add(extraShelf);
        }
    }
    
    // More display tables
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            const extraTable = new THREE.Mesh(tableGeometry, tableMaterial);
            extraTable.position.set(-40 + i * 11, 0.4, -30 + j * 15);
            interiorGroup.add(extraTable);
        }
    }
    
    // Storage room area
    const storageShelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const storageShelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 6; i++) {
        const storageShelf = new THREE.Mesh(storageShelfGeometry, storageShelfMaterial);
        storageShelf.position.set(storeWidth/2 - 1.5, 1.5, -40 + i * 15);
        interiorGroup.add(storageShelf);
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🧱 Created Brick Building interior");
    return interiorGroup;
};

// Create Industrial Building Interior
export const createIndustrialInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Industrial Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 12; // Higher for industrial
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - concrete
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x808080);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - industrial gray
    const wallMaterial = createWireframeMaterial(0x696969, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xD3D3D3, // Light gray - industrial but lighter
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Industrial machinery/equipment
    const machineGeometry = new THREE.BoxGeometry(6, 4, 4);
    const machineMaterial = warmGlow(0x708090);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const machine = new THREE.Mesh(machineGeometry, machineMaterial);
            machine.position.set(-30 + i * 30, 2, -30 + j * 30);
            interiorGroup.add(machine);
        }
    }
    
    // Storage racks
    const rackGeometry = new THREE.BoxGeometry(0.2, 6, 0.2);
    const rackMaterial = warmGlow(0x2F4F4F);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(-40 + i * 26, 3, -40 + j * 80);
            interiorGroup.add(rack);
        }
    }
    
    // Workbenches
    const workbenchGeometry = new THREE.BoxGeometry(8, 1.5, 2);
    const workbenchMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 3; i++) {
        const workbench = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
        workbench.position.set(-20 + i * 20, 0.75, 30);
        interiorGroup.add(workbench);
    }
    
    // More machinery throughout
    for (let i = 3; i < 8; i++) {
        for (let j = 3; j < 8; j++) {
            const extraMachine = new THREE.Mesh(machineGeometry, machineMaterial);
            extraMachine.position.set(-40 + i * 11, 2, -40 + j * 11);
            interiorGroup.add(extraMachine);
        }
    }
    
    // More workbenches
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
            const extraWorkbench = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
            extraWorkbench.position.set(-40 + i * 16, 0.75, -30 + j * 40);
            interiorGroup.add(extraWorkbench);
        }
    }
    
    // More storage racks
    for (let i = 4; i < 10; i++) {
        for (let j = 0; j < 4; j++) {
            const extraRack = new THREE.Mesh(rackGeometry, rackMaterial);
            extraRack.position.set(-40 + i * 11, 3, -40 + j * 20);
            interiorGroup.add(extraRack);
        }
    }
    
    // Tool storage
    const toolBoxGeometry = new THREE.BoxGeometry(1.5, 1, 1);
    const toolBoxMaterial = warmGlow(0xFF4500);
    for (let i = 0; i < 8; i++) {
        const toolBox = new THREE.Mesh(toolBoxGeometry, toolBoxMaterial);
        toolBox.position.set(-40 + i * 11, 0.5, -storeDepth/2 + 2);
        interiorGroup.add(toolBox);
    }
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("🏭 Created Industrial Building interior");
    return interiorGroup;
};

// Create Graveyard Interior (open-air memorial)
export const createGraveyardInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Graveyard Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, 6);

    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Soft grass floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x2F4F2F, 0.6);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);

    // Stone path from entrance inward
    const pathGeometry = new THREE.PlaneGeometry(storeWidth * 0.35, storeDepth * 0.85);
    const path = new THREE.Mesh(pathGeometry, warmGlow(0x3B3B35, 0.65));
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, -storeDepth * 0.05);
    interiorGroup.add(path);

    // Low perimeter markers (stone edging)
    const edgingMaterial = warmGlow(0x5B4C43, 0.5);
    const edgingThickness = 0.2;
    const edgingHeight = 0.4;
    const createEdging = (width, x, z, orientation = 0) => {
        const edging = new THREE.Mesh(
            new THREE.BoxGeometry(width, edgingHeight, edgingThickness),
            edgingMaterial
        );
        edging.position.set(x, edgingHeight / 2, z);
        edging.rotation.y = orientation;
        interiorGroup.add(edging);
    };
    const halfW = storeWidth / 2;
    const halfD = storeDepth / 2;
    createEdging(storeWidth - 2, 0, -halfD + 1, 0);
    createEdging(storeWidth - 2, 0, halfD - 1.5, 0);
    createEdging(storeDepth - 2, -halfW + 1, -halfD + edgingThickness + 24.4, Math.PI / 2);
    createEdging(storeDepth - 2, halfW - 1, -halfD + edgingThickness + 24.4, Math.PI / 2);

    // Helper to create headstones
    const createHeadstone = (x, z, variant = 0) => {
        const stoneColor = variant % 2 === 0 ? 0xA8A8A8 : 0x8E8E8E;
        const stone = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1 + variant * 0.2, 0.2),
            warmGlow(stoneColor, 0.8)
        );
        stone.position.set(x, stone.geometry.parameters.height / 2, z);
        stone.rotation.y = (Math.random() - 0.5) * 0.2;
        interiorGroup.add(stone);
    };

    const graveClusters = [
        { x: -storeWidth * 0.3, z: -storeDepth * 0.45 },
        { x: -storeWidth * 0.18, z: -storeDepth * 0.55 },
        { x: storeWidth * 0.18, z: -storeDepth * 0.48 },
        { x: storeWidth * 0.32, z: -storeDepth * 0.62 },
        { x: -storeWidth * 0.04, z: -storeDepth * 0.3 },
        { x: storeWidth * 0.34, z: -storeDepth * 0.28 },
        { x: -storeWidth * 0.28, z: -storeDepth * 0.68 },
        { x: storeWidth * 0.05, z: -storeDepth * 0.68 }
    ];
    graveClusters.forEach((pos, idx) => createHeadstone(pos.x, pos.z, idx % 3));

    // Central memorial statue
    const memorialBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.5, 10),
        warmGlow(0x7E6F5A, 0.7)
    );
    memorialBase.position.set(0, 0.25, -storeDepth * 0.45);
    interiorGroup.add(memorialBase);

    const memorialObelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.6, 2.4, 8),
        warmGlow(0x8F7F6A, 0.85)
    );
    memorialObelisk.position.set(0, 1.45, -storeDepth * 0.45);
    interiorGroup.add(memorialObelisk);

    const memorialGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 10, 10),
        createGlowingWireframeMaterial(0xBBAAFF, 0.7, 0.55)
    );
    memorialGlow.position.set(0, 2.5, -storeDepth * 0.45);
    interiorGroup.add(memorialGlow);

    // Benches
    const benchGeometry = new THREE.BoxGeometry(2, 0.3, 0.6);
    const benchMaterial = warmGlow(0x6B4F3A, 0.7);
    const benchLeft = new THREE.Mesh(benchGeometry, benchMaterial);
    benchLeft.position.set(-storeWidth * 0.28, 0.35, -storeDepth * 0.2);
    interiorGroup.add(benchLeft);
    const benchRight = benchLeft.clone();
    benchRight.position.x = storeWidth * 0.28;
    interiorGroup.add(benchRight);

    // Lantern posts
    const lanternTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 2.6, 6),
        warmGlow(0x454545, 0.9)
    );
    const lanternLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        createGlowingWireframeMaterial(0xFFD37A, 0.85, 0.5)
    );
    const lanternPositions = [
        { x: -storeWidth * 0.32, z: -storeDepth * 0.1 },
        { x: storeWidth * 0.32, z: -storeDepth * 0.1 }
    ];
    lanternPositions.forEach(({ x, z }) => {
        const post = lanternTrunk.clone();
        post.position.set(x, 1.3, z);
        interiorGroup.add(post);
        const glow = lanternLight.clone();
        glow.position.set(x, 2.6, z);
        interiorGroup.add(glow);
    });

    // Small trees for ambience
    const treeTrunkGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6);
    const treeFoliageGeometry = new THREE.ConeGeometry(1.6, 3.4, 8);
    const treeTrunkMaterial = warmGlow(0x5B3A29, 0.8);
    const treeFoliageMaterial = warmGlow(0x2F6B3A, 0.75);
    const treePoints = [
        { x: -storeWidth * 0.38, z: -storeDepth * 0.7 },
        { x: storeWidth * 0.35, z: -storeDepth * 0.75 }
    ];
    treePoints.forEach(({ x, z }) => {
        const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
        trunk.position.set(x, 1.2, z);
        interiorGroup.add(trunk);
        const foliage = new THREE.Mesh(treeFoliageGeometry, treeFoliageMaterial);
        foliage.position.set(x, 3, z);
        interiorGroup.add(foliage);
    });

    // Exit portal arch (replaces door)
    const portalGroup = new THREE.Group();
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.6, 8);
    const postMaterial = warmGlow(0x6B5B4D, 0.85);
    const portalLeftPost = new THREE.Mesh(postGeometry, postMaterial);
    portalLeftPost.position.set(-1.5, 1.3, storeDepth / 2 - 4);
    portalGroup.add(portalLeftPost);
    const portalRightPost = portalLeftPost.clone();
    portalRightPost.position.x = 1.5;
    portalGroup.add(portalRightPost);

    const lintelGeometry = new THREE.BoxGeometry(3.2, 0.3, 0.2);
    const lintel = new THREE.Mesh(lintelGeometry, postMaterial);
    lintel.position.set(0, 2.6, storeDepth / 2 - 4);
    portalGroup.add(lintel);

    const portalPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.4),
        createGlowingWireframeMaterial(0x88FFE6, 0.75, 0.6)
    );
    portalPlane.position.set(0, 1.3, storeDepth / 2 - 4.01);
    portalPlane.rotation.y = Math.PI;
    portalPlane.userData.isExitPortal = true;
    portalPlane.userData.keepPosition = true;
    portalGroup.add(portalPlane);

    interiorGroup.add(portalGroup);

    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("⚰️ Created Graveyard interior");
    return interiorGroup;
};
