// buildings.js - Building creation and management
import * as THREE from 'three';
import { createWireframeMaterial } from './utils.js';

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
    const doorMaterial = createWireframeMaterial(0x8B4513);
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
