class OptimizedZeldaRPG {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Optimize canvas for performance
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Use offscreen canvas for better performance
        this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // Game state
        this.gameState = 'playing';
        this.camera = { x: 0, y: 0 };
        this.worldWidth = 3200;
        this.worldHeight = 2400;
        this.hasWon = false;
        this.tileSize = 16;
        
        // Player
        this.player = {
            x: 400, y: 600, width: 16, height: 16, speed: 6,
            direction: 'down', health: 6, maxHealth: 6,
            rupees: 0, keys: 0, hasSword: true, hasShield: true, hasBomb: true,
            attacking: false, attackCooldown: 0, invulnerable: false, invulnerabilityTimer: 0,
            hasWood: false, boatRepaired: false, onBoat: false,
            inventory: [],
            hasCrossbow: false, arrows: 0, usingCrossbow: false
        };
        
        // Game objects
        this.enemies = [];
        this.items = [];
        this.worldMap = [];
        this.boat = { x: 0, y: 0, repaired: false };
        this.arrows = []; // Arrow projectiles
        this.enemyArrows = []; // Enemy archer arrows
        
        // Performance optimizations
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.dirtyRegions = new Set();
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Initialize
        this.createWorld();
        this.gameLoop();
    }
    
    setupInput() {
        const keyHandler = (e, pressed) => {
            this.keys[e.key.toLowerCase()] = pressed;
            if (pressed) e.preventDefault();
        };
        
        document.addEventListener('keydown', e => keyHandler(e, true));
        document.addEventListener('keyup', e => keyHandler(e, false));
    }
    
    createWorld() {
        // Create optimized world map
        const mapWidth = Math.floor(this.worldWidth / this.tileSize);
        const mapHeight = Math.floor(this.worldHeight / this.tileSize);
        
        // Initialize with water (tile type 1)
        this.worldMap = Array(mapHeight).fill().map(() => Array(mapWidth).fill(1));
        
        // Create multiple islands with expanded map
        this.createIsland(10, 10, 35, 25); // Top-left island (starting area)
        this.createIsland(55, 8, 35, 30); // Top-right island
        this.createIsland(5, 45, 40, 30); // Bottom-left island
        this.createIsland(55, 50, 35, 25); // Bottom-right island (treasure area)
        this.createIsland(25, 25, 30, 20); // Central island
        this.createIsland(100, 30, 25, 20); // Far right island
        this.createIsland(20, 80, 30, 25); // Far bottom island
        this.createIsland(80, 75, 25, 20); // Bottom-right far island
        
        // Boss island - COMPLETELY ISOLATED, far from all other islands
        this.createIsland(170, 10, 15, 10); // Bigger boss island (far top-right corner, completely isolated)
        
        // Create dock on boss island
        this.createDock(175, 19, 3, 2); // Dock on boss island for boat parking
        
        // Create bridges connecting main islands (NOT to boss island)
        this.createBridge(45, 20, 55, 20, true); // Top islands
        this.createBridge(25, 35, 25, 45, false); // Left to bottom
        this.createBridge(55, 35, 55, 50, false); // Right to bottom-right
        this.createBridge(45, 55, 55, 60, true); // Bottom islands
        this.createBridge(40, 30, 55, 25, true); // Central to right
        this.createBridge(90, 35, 100, 40, true); // To far right island
        this.createBridge(35, 65, 35, 80, false); // To far bottom island
        this.createBridge(80, 70, 80, 75, false); // To bottom-right far island
        
        // Place boat dock extending from starting island into water
        this.boat.x = 384; // Dock location - at water edge (ON DOCK TILES)
        this.boat.y = 576;
        this.boat.repaired = false;
        
        // Create dock tiles extending into water
        this.createDock(24, 35, 3, 4); // Dock extends from island into water
        
        // Add trees and obstacles on islands
        this.addTreesToIsland(15, 15, 30, 20); // Starting island trees
        this.addTreesToIsland(60, 15, 25, 20); // Top-right trees
        this.addTreesToIsland(10, 50, 30, 20); // Bottom-left trees
        this.addTreesToIsland(30, 30, 20, 15); // Central island trees
        this.addTreesToIsland(105, 35, 15, 10); // Far right island trees
        this.addTreesToIsland(25, 85, 20, 15); // Far bottom island trees
        this.addTreesToIsland(85, 80, 15, 10); // Bottom-right far island trees
        
        // Add houses on different islands
        this.addHouse(20, 20);
        this.addHouse(65, 25);
        this.addHouse(15, 55);
        this.addHouse(35, 35);
        this.addHouse(110, 40);
        this.addHouse(30, 90);
        this.addHouse(90, 85);
        
        // Initialize enemies across different islands
        this.enemies = [
            // Starting island (easy enemies)
            { x: 200, y: 200, health: 2, maxHealth: 2, speed: 2, type: 0 },
            { x: 350, y: 250, health: 2, maxHealth: 2, speed: 2, type: 0 },
            
            // Top-right island (medium enemies)
            { x: 950, y: 200, health: 3, maxHealth: 3, speed: 2.5, type: 1 },
            { x: 1100, y: 300, health: 3, maxHealth: 3, speed: 2.5, type: 1 },
            
            // Bottom-left island (medium enemies)
            { x: 200, y: 800, health: 3, maxHealth: 3, speed: 2.5, type: 1 },
            { x: 350, y: 900, health: 2, maxHealth: 2, speed: 3, type: 0 },
            
            // Central island (harder enemies)
            { x: 500, y: 500, health: 4, maxHealth: 4, speed: 3, type: 1 },
            { x: 600, y: 550, health: 4, maxHealth: 4, speed: 3, type: 1 },
            
            // Far right island (archer enemies)
            { x: 1700, y: 600, health: 4, maxHealth: 4, speed: 2, type: 3, shootCooldown: 0 },
            { x: 1800, y: 650, health: 4, maxHealth: 4, speed: 2, type: 3, shootCooldown: 0 },
            
            // Far bottom island (mixed enemies)
            { x: 400, y: 1400, health: 3, maxHealth: 3, speed: 2.5, type: 1 },
            { x: 500, y: 1450, health: 4, maxHealth: 4, speed: 2, type: 3, shootCooldown: 0 },
            
            // Bottom-right far island (archer enemies)
            { x: 1350, y: 1300, health: 4, maxHealth: 4, speed: 2, type: 3, shootCooldown: 0 },
            { x: 1450, y: 1350, health: 5, maxHealth: 5, speed: 2, type: 3, shootCooldown: 0 },
            
            // Boss island - FINAL BOSS (only accessible by boat)
            { x: 2750, y: 250, health: 10, maxHealth: 10, speed: 1.5, type: 2, isBoss: true }
        ];
        
        // Initialize items across different islands
        this.items = [
            // Starting island
            { x: 180, y: 180, type: 0, collected: false }, // rupee
            { x: 320, y: 280, type: 1, collected: false }, // heart
            { x: 280, y: 320, type: 7, collected: false }, // arrow
            
            // Top-right island
            { x: 980, y: 250, type: 0, collected: false }, // rupee
            { x: 1050, y: 200, type: 2, collected: false }, // bomb
            { x: 900, y: 180, type: 6, collected: false }, // crossbow
            { x: 1100, y: 250, type: 7, collected: false }, // arrow
            { x: 950, y: 300, type: 7, collected: false }, // arrow
            
            // Bottom-left island - PIECE OF WOOD
            { x: 250, y: 850, type: 5, collected: false }, // wood piece
            { x: 180, y: 950, type: 0, collected: false }, // rupee
            { x: 300, y: 900, type: 7, collected: false }, // arrow
            { x: 220, y: 800, type: 7, collected: false }, // arrow
            
            // Central island
            { x: 550, y: 480, type: 2, collected: false }, // bomb
            { x: 480, y: 520, type: 1, collected: false }, // heart
            { x: 520, y: 450, type: 7, collected: false }, // arrow
            { x: 600, y: 500, type: 7, collected: false }, // arrow
            
            // Far right island
            { x: 1750, y: 580, type: 1, collected: false }, // heart
            { x: 1650, y: 620, type: 7, collected: false }, // arrow
            { x: 1850, y: 600, type: 7, collected: false }, // arrow
            
            // Far bottom island
            { x: 450, y: 1380, type: 0, collected: false }, // rupee
            { x: 350, y: 1450, type: 7, collected: false }, // arrow
            { x: 550, y: 1420, type: 2, collected: false }, // bomb
            
            // Bottom-right far island
            { x: 1400, y: 1280, type: 1, collected: false }, // heart
            { x: 1300, y: 1350, type: 7, collected: false }, // arrow
            { x: 1500, y: 1320, type: 7, collected: false }, // arrow
            
            // Bottom-right island (treasure area)
            { x: 1200, y: 900, type: 4, collected: false, requiresKey: true }, // treasure
            { x: 1150, y: 950, type: 0, collected: false }, // rupee
            { x: 1250, y: 850, type: 7, collected: false }, // arrow
            { x: 1100, y: 920, type: 7, collected: false }, // arrow
            
            // Boss island - arrows scattered around
            { x: 2700, y: 200, type: 7, collected: false }, // arrow
            { x: 2800, y: 280, type: 7, collected: false }, // arrow
            { x: 2780, y: 220, type: 7, collected: false }, // arrow
            
            // ADDITIONAL HEARTS FOR BALANCE (10 more hearts across all islands)
            // Starting island - extra hearts
            { x: 250, y: 300, type: 1, collected: false }, // heart
            { x: 380, y: 200, type: 1, collected: false }, // heart
            
            // Top-right island - extra hearts
            { x: 1000, y: 350, type: 1, collected: false }, // heart
            { x: 1150, y: 180, type: 1, collected: false }, // heart
            
            // Bottom-left island - extra hearts
            { x: 150, y: 850, type: 1, collected: false }, // heart
            { x: 320, y: 950, type: 1, collected: false }, // heart
            
            // Central island - extra heart
            { x: 450, y: 480, type: 1, collected: false }, // heart
            
            // Far right island - extra heart
            { x: 1800, y: 550, type: 1, collected: false }, // heart
            
            // Far bottom island - extra heart
            { x: 400, y: 1450, type: 1, collected: false }, // heart
            
            // Bottom-right far island - extra heart
            { x: 1350, y: 1400, type: 1, collected: false }, // heart
            
            // Boss island - KEY (dropped by boss when defeated)
            // Key will be added dynamically when boss is defeated
        ];
    }
    
    createIsland(startX, startY, width, height) {
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                if (y >= 0 && y < this.worldMap.length && x >= 0 && x < this.worldMap[0].length) {
                    this.worldMap[y][x] = 0; // grass
                }
            }
        }
    }
    
    createBridge(x1, y1, x2, y2, horizontal) {
        if (horizontal) {
            const y = y1;
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);
            for (let x = startX; x <= endX; x++) {
                if (y >= 0 && y < this.worldMap.length && x >= 0 && x < this.worldMap[0].length) {
                    this.worldMap[y][x] = 2; // bridge
                    if (y - 1 >= 0) this.worldMap[y - 1][x] = 2;
                    if (y + 1 < this.worldMap.length) this.worldMap[y + 1][x] = 2;
                }
            }
        } else {
            const x = x1;
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);
            for (let y = startY; y <= endY; y++) {
                if (y >= 0 && y < this.worldMap.length && x >= 0 && x < this.worldMap[0].length) {
                    this.worldMap[y][x] = 2; // bridge
                    if (x - 1 >= 0) this.worldMap[y][x - 1] = 2;
                    if (x + 1 < this.worldMap[0].length) this.worldMap[y][x + 1] = 2;
                }
            }
        }
    }
    
    addTreesToIsland(startX, startY, width, height) {
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                if (this.worldMap[y] && this.worldMap[y][x] === 0) {
                    if ((x - startX) % 3 === 0 && (y - startY) % 3 === 0) {
                        if (Math.random() < 0.4) this.worldMap[y][x] = 3; // tree
                    } else if (Math.random() < 0.15) {
                        this.worldMap[y][x] = 3; // tree
                    }
                }
            }
        }
        
        // Ensure clear paths
        const midX = Math.floor(startX + width / 2);
        const midY = Math.floor(startY + height / 2);
        
        for (let x = startX; x < startX + width; x++) {
            if (this.worldMap[midY] && this.worldMap[midY][x] === 3) {
                this.worldMap[midY][x] = 0; // clear path
            }
        }
        
        for (let y = startY; y < startY + height; y++) {
            if (this.worldMap[y] && this.worldMap[y][midX] === 3) {
                this.worldMap[y][midX] = 0; // clear path
            }
        }
    }
    
    addHouse(x, y) {
        if (this.worldMap[y] && this.worldMap[y][x]) {
            this.worldMap[y][x] = 4;
            this.worldMap[y][x + 1] = 4;
            this.worldMap[y + 1][x] = 4;
            this.worldMap[y + 1][x + 1] = 4;
        }
    }
    
    createDock(x, y, width, height) {
        // Create wooden dock tiles
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (this.worldMap[y + dy] && this.worldMap[y + dy][x + dx] !== undefined) {
                    this.worldMap[y + dy][x + dx] = 5; // dock tile type
                }
            }
        }
    }
    

    
    updatePlayer() {
        let dx = 0, dy = 0;
        
        if (this.keys['arrowup']) { dy = -this.player.speed; this.player.direction = 'up'; }
        if (this.keys['arrowdown']) { dy = this.player.speed; this.player.direction = 'down'; }
        if (this.keys['arrowleft']) { dx = -this.player.speed; this.player.direction = 'left'; }
        if (this.keys['arrowright']) { dx = this.player.speed; this.player.direction = 'right'; }
        
        // Collision detection
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check if trying to access boss island without boat
        const tempX = this.player.x;
        const tempY = this.player.y;
        
        if (!this.checkCollision(newX, this.player.y)) {
            this.player.x = newX;
            // If trying to enter boss island without boat, revert
            if (!this.canAccessBossIsland()) {
                this.player.x = tempX;
            }
        }
        if (!this.checkCollision(this.player.x, newY)) {
            this.player.y = newY;
            // If trying to enter boss island without boat, revert
            if (!this.canAccessBossIsland()) {
                this.player.y = tempY;
            }
        }
        
        // Move boat with player when on boat
        if (this.player.onBoat) {
            this.boat.x = this.player.x;
            this.boat.y = this.player.y;
        }
        
        // Keep in bounds
        this.player.x = Math.max(16, Math.min(this.worldWidth - 32, this.player.x));
        this.player.y = Math.max(16, Math.min(this.worldHeight - 32, this.player.y));
        
        // Update camera
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.player.x - this.width / 2));
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.height, this.player.y - this.height / 2));
        
        // Attack
        if (this.keys[' '] && this.player.attackCooldown <= 0) {
            this.player.attacking = true;
            this.player.attackCooldown = 10;
            if (this.player.usingCrossbow) {
                this.shootArrow();
            } else {
                this.attackEnemies();
            }
        }
        
        // Weapon switching (Q key)
        if (this.keys['q'] && this.player.hasCrossbow) {
            this.player.usingCrossbow = !this.player.usingCrossbow;
            this.keys['q'] = false; // Prevent rapid switching
        }
        
        // Boat interaction
        if (this.keys['e'] && this.checkBoatInteraction()) {
            this.handleBoatInteraction();
        }
        
        // Update timers
        if (this.player.attackCooldown > 0) this.player.attackCooldown--;
        if (this.player.attackCooldown === 0) this.player.attacking = false;
        
        if (this.player.invulnerable) {
            this.player.invulnerabilityTimer--;
            if (this.player.invulnerabilityTimer <= 0) this.player.invulnerable = false;
        }
    }
    
    checkCollision(x, y) {
        // Check all four corners of the player
        const corners = [
            { x: x, y: y },
            { x: x + this.player.width - 1, y: y },
            { x: x, y: y + this.player.height - 1 },
            { x: x + this.player.width - 1, y: y + this.player.height - 1 }
        ];
        
        for (let corner of corners) {
            const tileX = Math.floor(corner.x / this.tileSize);
            const tileY = Math.floor(corner.y / this.tileSize);
            
            if (tileY < 0 || tileY >= this.worldMap.length || tileX < 0 || tileX >= this.worldMap[0].length) {
                return true;
            }
            
            const tile = this.worldMap[tileY][tileX];
            // If on boat, can move on water
            if (this.player.onBoat && tile === 1) {
                return false;
            }
            if (tile === 1 || tile === 3 || tile === 4) { // water, tree, house
                return true;
            }
        }
        
        return false;
    }
    
    checkBoatInteraction() {
        const dx = this.player.x - this.boat.x;
        const dy = this.player.y - this.boat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 30;
    }
    
    handleBoatInteraction() {
        if (!this.boat.repaired && this.player.hasWood) {
            // Repair boat with wood
            this.boat.repaired = true;
            this.player.boatRepaired = true;
            this.player.hasWood = false;
            this.removeFromInventory('wood');
        } else if (this.boat.repaired && !this.player.onBoat) {
            // Get on boat
            this.player.onBoat = true;
            this.player.x = this.boat.x;
            this.player.y = this.boat.y;
        } else if (this.player.onBoat) {
            // Get off boat (only on land, dock, or bridge)
            const tileX = Math.floor(this.player.x / this.tileSize);
            const tileY = Math.floor(this.player.y / this.tileSize);
            const tile = this.worldMap[tileY] && this.worldMap[tileY][tileX];
            if (tile === 0 || tile === 2 || tile === 5) { // grass, bridge, or dock
                this.player.onBoat = false;
                // Move boat to nearest dock tile to ensure it stays on dock
                this.moveBoatToDock();
            }
        }
    }
    
    moveBoatToDock() {
        // Find nearest dock tile to current position
        const currentTileX = Math.floor(this.boat.x / this.tileSize);
        const currentTileY = Math.floor(this.boat.y / this.tileSize);
        
        // Search for dock tiles nearby
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tileX = currentTileX + dx;
                const tileY = currentTileY + dy;
                
                if (tileY >= 0 && tileY < this.worldMap.length && 
                    tileX >= 0 && tileX < this.worldMap[0].length) {
                    const tile = this.worldMap[tileY][tileX];
                    
                    if (tile === 5) { // dock tile
                        this.boat.x = tileX * this.tileSize;
                        this.boat.y = tileY * this.tileSize;
                        return;
                    }
                }
            }
        }
        
        // If no dock found, keep boat at current position (fallback)
    }
    
    // Check if player is on boss island
    isOnBossIsland() {
        const tileX = Math.floor(this.player.x / this.tileSize);
        const tileY = Math.floor(this.player.y / this.tileSize);
        
        // Boss island coordinates (170, 10, 15, 10) = x: 170-185, y: 10-20
        return tileX >= 170 && tileX <= 185 && tileY >= 10 && tileY <= 20;
    }
    
    // Prevent accessing boss island without boat
    canAccessBossIsland() {
        return this.player.onBoat || !this.isOnBossIsland();
    }
    
    shootArrow() {
        if (this.player.arrows > 0) {
            this.player.arrows--;
            this.removeFromInventory('arrow');
            
            // Create arrow projectile
            const arrow = {
                x: this.player.x + 8,
                y: this.player.y + 8,
                direction: this.player.direction,
                speed: 12,
                damage: 2
            };
            
            this.arrows.push(arrow);
        }
    }
    
    updateArrows() {
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            
            // Move arrow
            switch (arrow.direction) {
                case 'up': arrow.y -= arrow.speed; break;
                case 'down': arrow.y += arrow.speed; break;
                case 'left': arrow.x -= arrow.speed; break;
                case 'right': arrow.x += arrow.speed; break;
            }
            
            // Check collision with enemies
            let hitEnemy = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = enemy.x - arrow.x;
                const dy = enemy.y - arrow.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    enemy.health -= arrow.damage;
                    hitEnemy = true;
                    
                    if (enemy.health <= 0) {
                        // Boss drops key, others drop random items
                        if (enemy.isBoss) {
                            this.items.push({
                                x: enemy.x + Math.random() * 8 - 4,
                                y: enemy.y + Math.random() * 8 - 4,
                                type: 3, // key
                                collected: false
                            });
                        } else {
                            // Always drop something when enemy dies
                            const dropType = Math.random();
                            let itemType;
                            
                            if (dropType < 0.6) {
                                itemType = 0; // 60% chance for rupee (money)
                            } else if (dropType < 0.9) {
                                itemType = 1; // 30% chance for heart (HP)
                            } else {
                                itemType = 2; // 10% chance for bomb
                            }
                            
                            this.items.push({
                                x: enemy.x + Math.random() * 8 - 4, // Slight random offset
                                y: enemy.y + Math.random() * 8 - 4,
                                type: itemType,
                                collected: false
                            });
                        }
                        
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
            
            // Remove arrow if it hit something or went out of bounds
            if (hitEnemy || arrow.x < 0 || arrow.x > this.worldWidth || 
                arrow.y < 0 || arrow.y > this.worldHeight ||
                this.checkArrowCollision(arrow.x, arrow.y)) {
                this.arrows.splice(i, 1);
            }
        }
    }
    
    checkArrowCollision(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileY >= 0 && tileY < this.worldMap.length && 
            tileX >= 0 && tileX < this.worldMap[0].length) {
            const tile = this.worldMap[tileY][tileX];
            // Arrows stop on trees and houses
            return tile === 3 || tile === 4;
        }
        return false;
    }
    
    attackEnemies() {
        const attackRange = 28;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < attackRange) {
                enemy.health--;
                if (enemy.health <= 0) {
                    // Boss drops key, others drop random items
                    if (enemy.isBoss) {
                        this.items.push({
                            x: enemy.x + Math.random() * 8 - 4,
                            y: enemy.y + Math.random() * 8 - 4,
                            type: 3, // key
                            collected: false
                        });
                    } else {
                        // Always drop something when enemy dies
                        const dropType = Math.random();
                        let itemType;
                        
                        if (dropType < 0.6) {
                            itemType = 0; // 60% chance for rupee (money)
                        } else if (dropType < 0.9) {
                            itemType = 1; // 30% chance for heart (HP)
                        } else {
                            itemType = 2; // 10% chance for bomb
                        }
                        
                        this.items.push({
                            x: enemy.x + Math.random() * 8 - 4, // Slight random offset
                            y: enemy.y + Math.random() * 8 - 4,
                            type: itemType,
                            collected: false
                        });
                    }
                    
                    this.enemies.splice(i, 1);
                }
            }
        }
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Archer enemies (type 3) behavior
            if (enemy.type === 3) {
                // Archers try to maintain distance and shoot arrows
                if (distance < 80) {
                    // Move away from player to maintain range
                    const moveX = -(dx / distance) * enemy.speed;
                    const moveY = -(dy / distance) * enemy.speed;
                    
                    const newX = enemy.x + moveX;
                    const newY = enemy.y + moveY;
                    
                    if (!this.checkEnemyWaterCollision(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                    }
                }
                
                // Shoot arrows at player
                if (distance < 150 && enemy.shootCooldown <= 0) {
                    this.enemyShootArrow(enemy, dx, dy, distance);
                    enemy.shootCooldown = 60; // 1 second cooldown
                }
                
                if (enemy.shootCooldown > 0) {
                    enemy.shootCooldown--;
                }
            } else {
                // Regular enemy behavior
                if (distance > 20 && distance < 120) {
                    const moveX = (dx / distance) * enemy.speed;
                    const moveY = (dy / distance) * enemy.speed;
                    
                    // Check if new position would be on water (enemies can't walk on water)
                    const newX = enemy.x + moveX;
                    const newY = enemy.y + moveY;
                    
                    if (!this.checkEnemyWaterCollision(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                    } else {
                        // If can't move directly toward player due to water, try alternative paths
                        // Try moving only horizontally
                        if (!this.checkEnemyWaterCollision(enemy.x + moveX, enemy.y)) {
                            enemy.x += moveX;
                        }
                        // Try moving only vertically
                        else if (!this.checkEnemyWaterCollision(enemy.x, enemy.y + moveY)) {
                            enemy.y += moveY;
                        }
                    }
                }
            }
            
            if (distance < 20 && !this.player.invulnerable) {
                this.player.health--;
                this.player.invulnerable = true;
                this.player.invulnerabilityTimer = 40;
                this.updateHealthUI();
                
                if (this.player.health <= 0) this.gameState = 'gameOver';
            }
        });
    }
    
    checkEnemyWaterCollision(x, y) {
        // Check all four corners of the enemy
        const size = 16;
        const corners = [
            { x: x, y: y },
            { x: x + size, y: y },
            { x: x, y: y + size },
            { x: x + size, y: y + size }
        ];
        
        for (const corner of corners) {
            const tileX = Math.floor(corner.x / this.tileSize);
            const tileY = Math.floor(corner.y / this.tileSize);
            
            if (tileY >= 0 && tileY < this.worldMap.length && 
                tileX >= 0 && tileX < this.worldMap[0].length) {
                const tile = this.worldMap[tileY][tileX];
                
                // Enemies can't walk on water (tile type 1)
                if (tile === 1) {
                    return true; // Collision detected
                }
            }
        }
        
        return false; // No water collision
    }
    
    enemyShootArrow(enemy, dx, dy, distance) {
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Create enemy arrow
        const enemyArrow = {
            x: enemy.x + 8, // Center of enemy
            y: enemy.y + 8,
            dx: dirX * 4, // Arrow speed
            dy: dirY * 4,
            life: 120 // Arrow lifetime (2 seconds)
        };
        
        this.enemyArrows.push(enemyArrow);
    }
    
    updateEnemyArrows() {
        this.enemyArrows = this.enemyArrows.filter(arrow => {
            arrow.x += arrow.dx;
            arrow.y += arrow.dy;
            arrow.life--;
            
            // Check collision with player
            const dx = arrow.x - (this.player.x + 8);
            const dy = arrow.y - (this.player.y + 8);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 12 && !this.player.invulnerable) {
                this.player.health--;
                this.player.invulnerable = true;
                this.player.invulnerabilityTimer = 40;
                this.updateHealthUI();
                
                if (this.player.health <= 0) this.gameState = 'gameOver';
                return false; // Remove arrow
            }
            
            // Check collision with world (walls, trees, etc.)
            if (this.checkArrowCollision(arrow.x, arrow.y)) {
                return false; // Remove arrow
            }
            
            return arrow.life > 0;
        });
    }
    
    updateItems() {
        this.items.forEach(item => {
            const dx = item.x - this.player.x;
            const dy = item.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!item.collected && distance < 20) {
                if (item.type === 4 && item.requiresKey) { // treasure
                    if (this.player.keys > 0) {
                        item.collected = true;
                        this.player.keys--;
                        this.removeFromInventory('key');
                        this.gameState = 'won';
                        this.updateUI();
                    }
                } else {
                    item.collected = true;
                    
                    switch (item.type) {
                        case 0: // rupee (money)
                            this.player.rupees += 5; 
                            break;
                        case 1: // heart (HP)
                            if (this.player.health < this.player.maxHealth) {
                                this.player.health++;
                                this.updateHealthUI();
                            }
                            break;
                        case 2: // bomb
                            this.player.hasBomb = true;
                            break;
                        case 3: // key
                            this.player.keys++;
                            this.addToInventory({ type: 'key', name: 'Golden Key', icon: '🗝️' });
                            break;
                        case 5: // wood piece
                            this.player.hasWood = true;
                            this.addToInventory({ type: 'wood', name: 'Wood Plank', icon: '🪵' });
                            break;
                        case 6: // crossbow
                            this.player.hasCrossbow = true;
                            this.addToInventory({ type: 'crossbow', name: 'Crossbow', icon: '🏹' });
                            break;
                        case 7: // arrow
                            this.player.arrows++;
                            this.addToInventory({ type: 'arrow', name: 'Arrow', icon: '➤' });
                            break;
                    }
                    this.updateUI();
                }
            }
        });
    }
    
    updateUI() {
        document.getElementById('rupeeCount').textContent = this.player.rupees;
        document.getElementById('keyCount').textContent = this.player.keys;
        this.updateInventoryDisplay();
        
        // Update weapon display
        const weaponDisplay = document.getElementById('weapon-display');
        if (!weaponDisplay) {
            const weaponDiv = document.createElement('div');
            weaponDiv.id = 'weapon-display';
            weaponDiv.style.cssText = 'color: #FFD700; font-family: "Press Start 2P"; font-size: 12px; margin-top: 10px;';
            document.querySelector('.ui-panel').appendChild(weaponDiv);
        }
        
        const currentWeapon = this.player.usingCrossbow ? 'CROSSBOW' : 'SWORD';
        const arrowCount = this.player.arrows > 0 ? ` (${this.player.arrows} arrows)` : '';
        document.getElementById('weapon-display').textContent = `WEAPON: ${currentWeapon}${arrowCount}`;
    }
    
    addToInventory(item) {
        // Check if item already exists (for stackable items)
        const existingItem = this.player.inventory.find(invItem => invItem.type === item.type);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            item.quantity = 1;
            this.player.inventory.push(item);
        }
        this.updateInventoryDisplay();
    }
    
    removeFromInventory(itemType) {
        const itemIndex = this.player.inventory.findIndex(item => item.type === itemType);
        if (itemIndex !== -1) {
            const item = this.player.inventory[itemIndex];
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.player.inventory.splice(itemIndex, 1);
            }
        }
        this.updateInventoryDisplay();
    }
    
    updateInventoryDisplay() {
        // Clear existing inventory slots
        for (let i = 1; i <= 12; i++) {
            const slot = document.getElementById(`inv-slot-${i}`);
            if (slot) {
                slot.innerHTML = '';
                slot.className = 'inventory-slot empty';
            }
        }
        
        // Fill inventory slots with items
        this.player.inventory.forEach((item, index) => {
            if (index < 12) { // Max 12 slots
                const slot = document.getElementById(`inv-slot-${index + 1}`);
                if (slot) {
                    slot.className = 'inventory-slot filled';
                    slot.innerHTML = `
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-quantity">${item.quantity > 1 ? item.quantity : ''}</div>
                        <div class="item-tooltip">${item.name}</div>
                    `;
                }
            }
        });
    }
    
    updateHealthUI() {
        for (let i = 1; i <= 6; i++) {
            const heart = document.getElementById(`heart${i}`);
            if (heart) {
                heart.className = i <= this.player.health ? 'heart full' : 'heart empty';
            }
        }
    }
    
    // Optimized rendering with color-based tiles
    drawTile(type, x, y) {
        const colors = ['#32CD32', '#4169E1', '#D2691E', '#228B22', '#654321', '#DEB887']; // grass, water, bridge, tree, house, dock
        this.ctx.fillStyle = colors[type] || colors[0];
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Add simple patterns for visual variety
        if (type === 1) { // water
            this.ctx.fillStyle = '#1E90FF';
            this.ctx.fillRect(x + 2, y + 2, 4, 4);
            this.ctx.fillRect(x + 10, y + 10, 4, 4);
        } else if (type === 3) { // tree
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + 6, y + 12, 4, 4);
        } else if (type === 5) { // dock
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, 2);
            this.ctx.fillRect(x + 2, y + 6, this.tileSize - 4, 2);
            this.ctx.fillRect(x + 2, y + 10, this.tileSize - 4, 2);
        }
    }
    
    drawWorld() {
        const startX = Math.floor(this.camera.x / this.tileSize);
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endX = Math.min(startX + Math.ceil(this.width / this.tileSize) + 1, this.worldMap[0].length);
        const endY = Math.min(startY + Math.ceil(this.height / this.tileSize) + 1, this.worldMap.length);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y >= 0 && y < this.worldMap.length && x >= 0 && x < this.worldMap[0].length) {
                    this.drawTile(this.worldMap[y][x], x * this.tileSize - this.camera.x, y * this.tileSize - this.camera.y);
                }
            }
        }
    }
    
    drawPlayer() {
        if (this.player.invulnerable && Math.floor(this.player.invulnerabilityTimer / 4) % 2) return;
        
        const x = this.player.x - this.camera.x;
        const y = this.player.y - this.camera.y;
        
        // Link body (different color if on boat)
        this.ctx.fillStyle = this.player.onBoat ? '#4169E1' : '#228B22'; // blue if on boat, green normally
        this.ctx.fillRect(x, y, 16, 16);
        
        // Link face
        this.ctx.fillStyle = '#FCE4A6'; // skin
        this.ctx.fillRect(x + 2, y + 2, 12, 8);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + 10, y + 4, 2, 2);
        
        // Direction indicator
        this.ctx.fillStyle = '#FFD700';
        switch (this.player.direction) {
            case 'up': this.ctx.fillRect(x + 6, y, 4, 2); break;
            case 'down': this.ctx.fillRect(x + 6, y + 14, 4, 2); break;
            case 'left': this.ctx.fillRect(x, y + 6, 2, 4); break;
            case 'right': this.ctx.fillRect(x + 14, y + 6, 2, 4); break;
        }
        
        // Weapon when attacking
        if (this.player.attacking) {
            if (this.player.usingCrossbow) {
                // Crossbow
                this.ctx.fillStyle = '#654321';
                switch (this.player.direction) {
                    case 'up': this.ctx.fillRect(x + 6, y - 8, 4, 12); break;
                    case 'down': this.ctx.fillRect(x + 6, y + 16, 4, 12); break;
                    case 'left': this.ctx.fillRect(x - 8, y + 6, 12, 4); break;
                    case 'right': this.ctx.fillRect(x + 16, y + 6, 12, 4); break;
                }
            } else {
                // Sword
                this.ctx.fillStyle = '#FFD700';
                switch (this.player.direction) {
                    case 'up': this.ctx.fillRect(x + 4, y - 12, 8, 16); break;
                    case 'down': this.ctx.fillRect(x + 4, y + 16, 8, 16); break;
                    case 'left': this.ctx.fillRect(x - 12, y + 4, 16, 8); break;
                    case 'right': this.ctx.fillRect(x + 16, y + 4, 16, 8); break;
                }
            }
        }
        
        // Show boat status
        if (this.player.onBoat) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ON BOAT', x + 8, y - 8);
        }
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const screenX = enemy.x - this.camera.x;
            const screenY = enemy.y - this.camera.y;
            
            // Draw enemy body
            const colors = ['#FF4500', '#8B0000', '#4B0082', '#9400D3']; // octorok, moblin, boss, archer
            this.ctx.fillStyle = colors[enemy.type] || colors[0];
            
            // Boss is larger
            const size = enemy.isBoss ? 24 : 16;
            this.ctx.fillRect(screenX, screenY, size, size);
            
            // Enemy eyes
            this.ctx.fillStyle = enemy.isBoss ? '#FF0000' : '#FFD700';
            if (enemy.isBoss) {
                // Boss has bigger, more menacing eyes
                this.ctx.fillRect(screenX + 4, screenY + 4, 4, 4);
                this.ctx.fillRect(screenX + 16, screenY + 4, 4, 4);
                // Boss crown/spikes
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(screenX + 8, screenY - 2, 8, 4);
                this.ctx.fillRect(screenX + 6, screenY - 4, 4, 4);
                this.ctx.fillRect(screenX + 14, screenY - 4, 4, 4);
            } else {
                // Regular enemy eyes
                this.ctx.fillRect(screenX + 3, screenY + 3, 2, 2);
                this.ctx.fillRect(screenX + 11, screenY + 3, 2, 2);
                
                // Draw bow for archer enemies
                if (enemy.type === 3) {
                    this.ctx.fillStyle = '#8B4513'; // brown bow
                    this.ctx.fillRect(screenX + 14, screenY + 6, 4, 4);
                    this.ctx.fillStyle = '#A0522D'; // lighter brown
                    this.ctx.fillRect(screenX + 15, screenY + 7, 2, 2);
                    // Bow string
                    this.ctx.fillStyle = '#DDD';
                    this.ctx.fillRect(screenX + 16, screenY + 5, 1, 6);
                }
            }
            
            // Draw health bar above enemy
            this.drawEnemyHealthBar(enemy, screenX, screenY);
        });
    }
    
    drawEnemyHealthBar(enemy, screenX, screenY) {
        const barWidth = 20;
        const barHeight = 4;
        const barX = screenX - 2; // Center the bar above the enemy
        const barY = screenY - 8; // Position above the enemy
        
        // Background (empty health)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health blocks
        const blockWidth = barWidth / enemy.maxHealth;
        
        for (let i = 0; i < enemy.maxHealth; i++) {
            const blockX = barX + (i * blockWidth);
            
            if (i < enemy.health) {
                // Filled health block
                if (enemy.health === enemy.maxHealth) {
                    this.ctx.fillStyle = '#32CD32'; // Green when full
                } else if (enemy.health > enemy.maxHealth / 2) {
                    this.ctx.fillStyle = '#FFD700'; // Yellow when medium
                } else {
                    this.ctx.fillStyle = '#FF4500'; // Red when low
                }
                this.ctx.fillRect(blockX + 1, barY + 1, blockWidth - 2, barHeight - 2);
            }
            
            // Draw block separators
            if (i > 0) {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(blockX, barY);
                this.ctx.lineTo(blockX, barY + barHeight);
                this.ctx.stroke();
            }
        }
    }
    
    drawItems() {
        const colors = ['#4169E1', '#FF1493', '#333', '#FFD700', '#FFD700', '#8B4513', '#654321', '#8B4513']; // rupee, heart, bomb, key, treasure, wood, crossbow, arrow
        
        this.items.forEach(item => {
            if (!item.collected) {
                const x = item.x - this.camera.x;
                const y = item.y - this.camera.y;
                
                this.ctx.fillStyle = colors[item.type];
                this.ctx.fillRect(x, y, 16, 16);
                
                // Special shapes for different items
                if (item.type === 0) { // rupee - diamond shape
                    this.ctx.fillStyle = '#1E90FF';
                    this.ctx.fillRect(x + 6, y + 2, 4, 12);
                    this.ctx.fillRect(x + 2, y + 6, 12, 4);
                } else if (item.type === 1) { // heart
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.fillRect(x + 4, y + 4, 8, 8);
                } else if (item.type === 3) { // key
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.fillRect(x + 4, y + 2, 8, 12);
                    this.ctx.fillRect(x + 2, y + 4, 4, 4);
                } else if (item.type === 4) { // treasure
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + 2, y + 2, 12, 12);
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(x + 4, y + 4, 8, 8);
                } else if (item.type === 5) { // wood piece - make it much more visible
                    this.ctx.fillStyle = '#8B4513'; // darker brown
                    this.ctx.fillRect(x + 1, y + 1, 14, 14);
                    this.ctx.fillStyle = '#A0522D'; // lighter brown
                    this.ctx.fillRect(x + 3, y + 3, 10, 10);
                    this.ctx.fillStyle = '#DEB887'; // light wood color
                    this.ctx.fillRect(x + 2, y + 6, 12, 2);
                    this.ctx.fillRect(x + 2, y + 9, 12, 2);
                    // Add wood grain lines
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + 4, y + 4, 8, 1);
                    this.ctx.fillRect(x + 4, y + 8, 8, 1);
                    this.ctx.fillRect(x + 4, y + 12, 8, 1);
                } else if (item.type === 6) { // crossbow
                    this.ctx.fillStyle = '#654321'; // dark brown
                    this.ctx.fillRect(x + 2, y + 6, 12, 4);
                    this.ctx.fillStyle = '#8B4513'; // lighter brown
                    this.ctx.fillRect(x + 4, y + 4, 8, 8);
                    this.ctx.fillStyle = '#A0522D'; // bow string
                    this.ctx.fillRect(x + 1, y + 7, 14, 2);
                } else if (item.type === 7) { // arrow
                    this.ctx.fillStyle = '#8B4513'; // brown shaft
                    this.ctx.fillRect(x + 6, y + 2, 4, 12);
                    this.ctx.fillStyle = '#C0C0C0'; // silver tip
                    this.ctx.fillRect(x + 6, y + 1, 4, 3);
                    this.ctx.fillStyle = '#228B22'; // green fletching
                    this.ctx.fillRect(x + 5, y + 12, 6, 3);
                }
            }
        });
    }
    
    drawArrows() {
        this.arrows.forEach(arrow => {
            const x = arrow.x - this.camera.x;
            const y = arrow.y - this.camera.y;
            
            this.ctx.fillStyle = '#8B4513'; // brown shaft
            this.ctx.fillStyle = '#C0C0C0'; // silver tip
            
            switch (arrow.direction) {
                case 'up':
                case 'down':
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + 2, y, 2, 8);
                    this.ctx.fillStyle = '#C0C0C0';
                    this.ctx.fillRect(x + 2, y, 2, 2);
                    break;
                case 'left':
                case 'right':
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x, y + 2, 8, 2);
                    this.ctx.fillStyle = '#C0C0C0';
                    this.ctx.fillRect(x, y + 2, 2, 2);
                    break;
            }
        });
    }
    
    drawEnemyArrows() {
        this.enemyArrows.forEach(arrow => {
            const x = arrow.x - this.camera.x;
            const y = arrow.y - this.camera.y;
            
            // Draw enemy arrows in red to distinguish from player arrows
            this.ctx.fillStyle = '#8B0000'; // dark red shaft
            this.ctx.fillRect(x - 2, y - 2, 4, 4);
            this.ctx.fillStyle = '#FF0000'; // bright red tip
            this.ctx.fillRect(x - 1, y - 1, 2, 2);
        });
    }
    
    drawBoat() {
        const x = this.boat.x - this.camera.x;
        const y = this.boat.y - this.camera.y;
        
        // Make boat much larger and more visible
        const boatWidth = 40;
        const boatHeight = 20;
        
        // Boat shadow for depth
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 18, y - 6, boatWidth + 2, boatHeight + 2);
        
        // Boat body - much bigger and more colorful
        this.ctx.fillStyle = this.boat.repaired ? '#8B4513' : '#654321';
        this.ctx.fillRect(x - 16, y - 4, boatWidth, boatHeight);
        
        // Boat rim/edge
        this.ctx.fillStyle = this.boat.repaired ? '#A0522D' : '#4A4A4A';
        this.ctx.fillRect(x - 14, y - 2, boatWidth - 4, 3);
        this.ctx.fillRect(x - 14, y + 13, boatWidth - 4, 3);
        
        // Boat interior
        this.ctx.fillStyle = this.boat.repaired ? '#DEB887' : '#2F2F2F';
        this.ctx.fillRect(x - 12, y + 2, boatWidth - 8, 10);
        
        // Boat planks/details
        this.ctx.fillStyle = this.boat.repaired ? '#8B4513' : '#555';
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(x - 12 + (i * 6), y + 1, 1, 12);
        }
        
        // Mast (if repaired)
        if (this.boat.repaired) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + 2, y - 20, 3, 24);
            // Sail
            this.ctx.fillStyle = '#F5F5DC';
            this.ctx.fillRect(x + 5, y - 18, 12, 16);
            // Sail details
            this.ctx.fillStyle = '#E0E0E0';
            this.ctx.fillRect(x + 6, y - 16, 10, 2);
            this.ctx.fillRect(x + 6, y - 10, 10, 2);
            this.ctx.fillRect(x + 6, y - 4, 10, 2);
        } else {
            // Broken mast stub
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(x + 2, y - 6, 3, 8);
        }
        
        // Boat outline for visibility
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 16, y - 4, boatWidth, boatHeight);
        
        // Show interaction prompt
        if (this.checkBoatInteraction()) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '10px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            let text = '';
            if (!this.boat.repaired && this.player.hasWood) {
                text = 'PRESS E TO REPAIR BOAT';
            } else if (this.boat.repaired && !this.player.onBoat) {
                text = 'PRESS E TO BOARD BOAT';
            } else if (this.player.onBoat) {
                text = 'PRESS E TO DISEMBARK';
            }
            this.ctx.fillText(text, x + 4, y - 30);
            
            // Add arrow pointing to boat
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x + 2, y - 24, 4, 2);
            this.ctx.fillRect(x + 4, y - 26, 2, 2);
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText(`RUPEES: ${this.player.rupees}`, this.width / 2, this.height / 2);
        this.ctx.fillText('PRESS F5 TO RESTART', this.width / 2, this.height / 2 + 50);
    }
    
    drawWinScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '32px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 80);
        
        this.ctx.font = '18px "Press Start 2P"';
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillText('TREASURE OPENED!', this.width / 2, this.height / 2 - 30);
        
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillText(`FINAL RUPEES: ${this.player.rupees}`, this.width / 2, this.height / 2 + 20);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('PRESS F5 TO PLAY AGAIN', this.width / 2, this.height / 2 + 70);
    }
    
    update() {
        if (this.gameState === 'gameOver' || this.gameState === 'won') return;
        
        this.updatePlayer();
        this.updateEnemies();
        this.updateItems();
        this.updateArrows();
        this.updateEnemyArrows();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawWorld();
        this.drawBoat();
        this.drawItems();
        this.drawEnemies();
        this.drawArrows();
        this.drawEnemyArrows();
        this.drawPlayer();
        
        if (this.gameState === 'gameOver') {
            this.drawGameOver();
        } else if (this.gameState === 'won') {
            this.drawWinScreen();
        }
    }
    
    gameLoop(currentTime) {
        // Performance monitoring
        if (currentTime - this.lastFrameTime >= 1000) {
            this.lastFrameTime = currentTime;
            this.frameCount = 0;
        }
        this.frameCount++;
        
        this.update();
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the optimized game
window.addEventListener('load', () => {
    new OptimizedZeldaRPG();
}); 