class ZeldaRPG {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Game state
        this.gameState = 'playing';
        this.camera = { x: 0, y: 0 };
        this.worldWidth = 1024;
        this.worldHeight = 768;
        this.hasWon = false;
        
        // Player (Link)
        this.player = {
            x: 256,
            y: 300,
            width: 16,
            height: 16,
            speed: 8,
            direction: 'down',
            health: 6,
            maxHealth: 6,
            rupees: 0,
            keys: 0,
            hasSword: true,
            hasShield: true,
            hasBomb: true,
            attacking: false,
            attackCooldown: 0,
            invulnerable: false,
            invulnerabilityTimer: 0,
            walkFrame: 0,
            walkTimer: 0
        };
        
        // Game objects
        this.enemies = [];
        this.projectiles = [];
        this.items = [];
        this.npcs = [];
        this.tiles = [];
        this.obstacles = [];
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Initialize sprites and world
        this.createSprites();
        this.createWorld();
        
        // Start game loop
        this.lastTime = 0;
        this.gameLoop();
    }
    
    createSprites() {
        // Enhanced Link sprites with better detail
        this.sprites = {};
        
        // Link Down (16x16)
        this.sprites.linkDown = this.createLinkSprite([
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,2,2,1,1,1,1,1,1,2,2,1,1,0],
            [1,1,1,2,2,1,1,1,1,1,1,2,2,1,1,1],
            [1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,3,3,3,3,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,0,5,5,4,4,4,4,4,4,5,5,0,0,0],
            [0,0,5,5,5,5,0,0,0,0,5,5,5,5,0,0],
            [0,5,5,5,5,0,0,0,0,0,0,5,5,5,5,0],
            [5,5,5,5,0,0,0,0,0,0,0,0,5,5,5,5]
        ]);
        
        // Create other directions by modifying the base sprite
        this.sprites.linkUp = this.createLinkSprite([
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,2,2,1,1,1,1,1,1,2,2,1,1,0],
            [1,1,1,2,2,1,1,1,1,1,1,2,2,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0],
            [0,0,0,5,5,4,4,4,4,4,4,5,5,0,0,0],
            [0,0,5,5,5,5,0,0,0,0,5,5,5,5,0,0],
            [0,5,5,5,5,0,0,0,0,0,0,5,5,5,5,0],
            [5,5,5,5,0,0,0,0,0,0,0,0,5,5,5,5]
        ]);
        
        // Terrain tiles
        this.sprites.grass = this.createTerrainTile('grass');
        this.sprites.stone = this.createTerrainTile('stone');
        this.sprites.water = this.createTerrainTile('water');
        this.sprites.tree = this.createTerrainTile('tree');
        this.sprites.house = this.createTerrainTile('house');
        this.sprites.rock = this.createTerrainTile('rock');
        this.sprites.bridge = this.createTerrainTile('bridge');
        
        // Enemies
        this.sprites.octorok = this.createEnemySprite('octorok');
        this.sprites.moblin = this.createEnemySprite('moblin');
        
        // Items
        this.sprites.rupee = this.createItemSprite('rupee');
        this.sprites.heart = this.createItemSprite('heart');
        this.sprites.bomb = this.createItemSprite('bomb');
        this.sprites.key = this.createItemSprite('key');
        this.sprites.treasure = this.createItemSprite('treasure');
        
        // Color palette (authentic Zelda colors)
        this.colors = {
            0: 'transparent',
            1: '#FCE4A6',  // Link's skin
            2: '#000000',  // Black (eyes)
            3: '#FF6B35',  // Orange (mouth)
            4: '#228B22',  // Green (tunic)
            5: '#8B4513',  // Brown (boots)
            6: '#32CD32',  // Light green (grass)
            7: '#228B22',  // Dark green (grass shadow)
            8: '#808080',  // Gray (stone)
            9: '#A0A0A0',  // Light gray (stone highlight)
            10: '#4169E1', // Blue (water/rupee)
            11: '#1E90FF', // Light blue (water highlight)
            12: '#8B4513', // Brown (tree trunk)
            13: '#228B22', // Green (tree leaves)
            14: '#FF1493', // Pink (heart)
            15: '#FFD700', // Gold (special items)
            16: '#654321', // Dark brown (house)
            17: '#D2691E', // Light brown (house/bridge)
            18: '#FF4500', // Red (enemy)
            19: '#FF6347'  // Light red (enemy highlight)
        };
    }
    
    createLinkSprite(data) {
        return data;
    }
    
    createTerrainTile(type) {
        const patterns = {
            grass: [
                [6,6,6,6,7,7,6,6,6,6,7,7,6,6,6,6],
                [6,7,7,6,6,6,6,7,7,6,6,6,6,7,7,6],
                [6,7,7,6,6,6,6,7,7,6,6,6,6,7,7,6],
                [6,6,6,6,7,7,6,6,6,6,7,7,6,6,6,6],
                [7,7,6,6,6,6,7,7,6,6,6,6,7,7,6,6],
                [6,6,6,7,7,6,6,6,6,7,7,6,6,6,6,7],
                [6,6,6,7,7,6,6,6,6,7,7,6,6,6,6,7],
                [7,7,6,6,6,6,7,7,6,6,6,6,7,7,6,6],
                [6,6,6,6,7,7,6,6,6,6,7,7,6,6,6,6],
                [6,7,7,6,6,6,6,7,7,6,6,6,6,7,7,6],
                [6,7,7,6,6,6,6,7,7,6,6,6,6,7,7,6],
                [6,6,6,6,7,7,6,6,6,6,7,7,6,6,6,6],
                [7,7,6,6,6,6,7,7,6,6,6,6,7,7,6,6],
                [6,6,6,7,7,6,6,6,6,7,7,6,6,6,6,7],
                [6,6,6,7,7,6,6,6,6,7,7,6,6,6,6,7],
                [7,7,6,6,6,6,7,7,6,6,6,6,7,7,6,6]
            ],
            stone: [
                [8,8,9,9,8,8,8,8,9,9,8,8,8,8,9,9],
                [8,9,9,8,8,9,9,8,8,9,9,8,8,9,9,8],
                [9,9,8,8,9,9,8,8,9,9,8,8,9,9,8,8],
                [9,8,8,9,9,8,8,9,9,8,8,9,9,8,8,9],
                [8,8,9,9,8,8,8,8,9,9,8,8,8,8,9,9],
                [8,9,9,8,8,9,9,8,8,9,9,8,8,9,9,8],
                [9,9,8,8,9,9,8,8,9,9,8,8,9,9,8,8],
                [9,8,8,9,9,8,8,9,9,8,8,9,9,8,8,9],
                [8,8,9,9,8,8,8,8,9,9,8,8,8,8,9,9],
                [8,9,9,8,8,9,9,8,8,9,9,8,8,9,9,8],
                [9,9,8,8,9,9,8,8,9,9,8,8,9,9,8,8],
                [9,8,8,9,9,8,8,9,9,8,8,9,9,8,8,9],
                [8,8,9,9,8,8,8,8,9,9,8,8,8,8,9,9],
                [8,9,9,8,8,9,9,8,8,9,9,8,8,9,9,8],
                [9,9,8,8,9,9,8,8,9,9,8,8,9,9,8,8],
                [9,8,8,9,9,8,8,9,9,8,8,9,9,8,8,9]
            ],
            water: [
                [10,10,11,11,10,10,10,10,11,11,10,10,10,10,11,11],
                [10,11,11,10,10,11,11,10,10,11,11,10,10,11,11,10],
                [11,11,10,10,11,11,10,10,11,11,10,10,11,11,10,10],
                [11,10,10,11,11,10,10,11,11,10,10,11,11,10,10,11],
                [10,10,11,11,10,10,10,10,11,11,10,10,10,10,11,11],
                [10,11,11,10,10,11,11,10,10,11,11,10,10,11,11,10],
                [11,11,10,10,11,11,10,10,11,11,10,10,11,11,10,10],
                [11,10,10,11,11,10,10,11,11,10,10,11,11,10,10,11],
                [10,10,11,11,10,10,10,10,11,11,10,10,10,10,11,11],
                [10,11,11,10,10,11,11,10,10,11,11,10,10,11,11,10],
                [11,11,10,10,11,11,10,10,11,11,10,10,11,11,10,10],
                [11,10,10,11,11,10,10,11,11,10,10,11,11,10,10,11],
                [10,10,11,11,10,10,10,10,11,11,10,10,10,10,11,11],
                [10,11,11,10,10,11,11,10,10,11,11,10,10,11,11,10],
                [11,11,10,10,11,11,10,10,11,11,10,10,11,11,10,10],
                [11,10,10,11,11,10,10,11,11,10,10,11,11,10,10,11]
            ],
            tree: Array(16).fill().map(() => Array(16).fill(13)),
            house: Array(16).fill().map(() => Array(16).fill(16)),
            rock: Array(16).fill().map(() => Array(16).fill(8)),
            bridge: [
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,9,9,17,17,9,9,17,17,9,9,17,17,9,9,17],
                [17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17]
            ]
        };
        return patterns[type] || patterns.grass;
    }
    
    createEnemySprite(type) {
        const patterns = {
            octorok: Array(16).fill().map(() => Array(16).fill(18)),
            moblin: Array(16).fill().map(() => Array(16).fill(19))
        };
        return patterns[type] || patterns.octorok;
    }
    
    createItemSprite(type) {
        const patterns = {
            rupee: Array(16).fill().map(() => Array(16).fill(10)),
            heart: Array(16).fill().map(() => Array(16).fill(14)),
            bomb: Array(16).fill().map(() => Array(16).fill(8)),
            key: [
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,15,15,15,15,15,15,0,0,0,0,0],
                [0,0,0,0,15,15,0,0,0,0,15,15,0,0,0,0],
                [0,0,0,0,15,15,0,0,0,0,15,15,0,0,0,0],
                [0,0,0,0,15,15,0,0,0,0,15,15,0,0,0,0],
                [0,0,0,0,15,15,15,15,15,15,15,15,0,0,0,0],
                [0,0,0,0,0,15,15,15,15,15,15,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,15,15,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,15,15,0,0,0,0],
                [0,0,0,0,0,0,15,15,15,15,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            treasure: [
                [0,0,16,16,16,16,16,16,16,16,16,16,16,16,0,0],
                [0,16,16,15,15,15,15,15,15,15,15,15,15,16,16,0],
                [16,16,15,15,15,15,15,15,15,15,15,15,15,16,16,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,15,15,15,15,15,15,15,15,15,15,15,15,15,15,16],
                [16,16,15,15,15,15,15,15,15,15,15,15,15,16,16,16],
                [0,16,16,15,15,15,15,15,15,15,15,15,15,16,16,0],
                [0,0,16,16,16,16,16,16,16,16,16,16,16,16,0,0]
            ]
        };
        return patterns[type] || patterns.rupee;
    }
    
    createWorld() {
        // Create overworld map with river and strategic pathways
        this.worldMap = [];
        const mapWidth = Math.floor(this.worldWidth / 16);
        const mapHeight = Math.floor(this.worldHeight / 16);
        
        // Initialize with grass
        for (let y = 0; y < mapHeight; y++) {
            this.worldMap[y] = [];
            for (let x = 0; x < mapWidth; x++) {
                this.worldMap[y][x] = 'grass';
            }
        }
        
        // Create water borders
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                if (y < 2 || y > mapHeight - 3 || x < 2 || x > mapWidth - 3) {
                    this.worldMap[y][x] = 'water';
                }
            }
        }
        
        // Create horizontal river through the middle
        const riverY = Math.floor(mapHeight / 2);
        for (let x = 0; x < mapWidth; x++) {
            this.worldMap[riverY - 1][x] = 'water';
            this.worldMap[riverY][x] = 'water';
            this.worldMap[riverY + 1][x] = 'water';
        }
        
        // Create two bridges across the river
        const bridge1X = Math.floor(mapWidth / 3);
        const bridge2X = Math.floor((mapWidth * 2) / 3);
        
        // Bridge 1
        for (let i = -1; i <= 1; i++) {
            this.worldMap[riverY + i][bridge1X] = 'bridge';
            this.worldMap[riverY + i][bridge1X + 1] = 'bridge';
        }
        
        // Bridge 2
        for (let i = -1; i <= 1; i++) {
            this.worldMap[riverY + i][bridge2X] = 'bridge';
            this.worldMap[riverY + i][bridge2X + 1] = 'bridge';
        }
        
        // Create tree barriers to force specific paths
        // Top section - create winding paths
        this.createTreeMaze(5, 5, bridge1X - 2, riverY - 3);
        this.createTreeMaze(bridge1X + 4, 5, bridge2X - 2, riverY - 3);
        this.createTreeMaze(bridge2X + 4, 5, mapWidth - 5, riverY - 3);
        
        // Bottom section - create winding paths
        this.createTreeMaze(5, riverY + 4, bridge1X - 2, mapHeight - 5);
        this.createTreeMaze(bridge1X + 4, riverY + 4, bridge2X - 2, mapHeight - 5);
        this.createTreeMaze(bridge2X + 4, riverY + 4, mapWidth - 5, mapHeight - 5);
        
        // Add some houses and rocks strategically
        this.worldMap[8][15] = 'house';
        this.worldMap[8][16] = 'house';
        this.worldMap[9][15] = 'house';
        this.worldMap[9][16] = 'house';
        
        this.worldMap[mapHeight - 8][mapWidth - 15] = 'house';
        this.worldMap[mapHeight - 8][mapWidth - 14] = 'house';
        this.worldMap[mapHeight - 7][mapWidth - 15] = 'house';
        this.worldMap[mapHeight - 7][mapWidth - 14] = 'house';
        
        // Add some strategic rocks
        for (let i = 0; i < 20; i++) {
            const x = 5 + Math.floor(Math.random() * (mapWidth - 10));
            const y = 5 + Math.floor(Math.random() * (mapHeight - 10));
            if (this.worldMap[y][x] === 'grass' && Math.random() < 0.3) {
                this.worldMap[y][x] = 'rock';
            }
        }
        
        // Position enemies strategically
        this.enemies = [
            { type: 'octorok', x: 150, y: 120, health: 2, speed: 3, direction: 'down' },
            { type: 'octorok', x: 350, y: 150, health: 2, speed: 3, direction: 'left' },
            { type: 'moblin', x: 500, y: 180, health: 3, speed: 2.5, direction: 'up' },
            { type: 'octorok', x: 200, y: 450, health: 2, speed: 3, direction: 'right' },
            { type: 'moblin', x: 600, y: 500, health: 3, speed: 2.5, direction: 'left' }
        ];
        
        // Place items strategically along paths
        this.items = [
            { type: 'rupee', x: 120, y: 100, collected: false },
            { type: 'heart', x: bridge1X * 16, y: (riverY - 5) * 16, collected: false },
            { type: 'bomb', x: bridge2X * 16, y: (riverY + 6) * 16, collected: false },
            { type: 'rupee', x: 450, y: 520, collected: false },
            { type: 'rupee', x: 300, y: 300, collected: false },
            { type: 'key', x: 180, y: 480, collected: false },
            { type: 'treasure', x: 600, y: 120, collected: false, requiresKey: true }
        ];
    }
    
    createTreeMaze(startX, startY, endX, endY) {
        // Create strategic tree placement to form pathways
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (this.worldMap[y] && this.worldMap[y][x] === 'grass') {
                    // Create tree clusters with gaps for pathways
                    if ((x - startX) % 4 === 0 || (y - startY) % 4 === 0) {
                        if (Math.random() < 0.7) {
                            this.worldMap[y][x] = 'tree';
                        }
                    } else if (Math.random() < 0.3) {
                        this.worldMap[y][x] = 'tree';
                    }
                }
            }
        }
        
        // Ensure there are clear pathways
        const midX = Math.floor((startX + endX) / 2);
        const midY = Math.floor((startY + endY) / 2);
        
        // Horizontal pathway
        for (let x = startX; x < endX; x++) {
            if (this.worldMap[midY] && this.worldMap[midY][x]) {
                this.worldMap[midY][x] = 'grass';
            }
        }
        
        // Vertical pathway
        for (let y = startY; y < endY; y++) {
            if (this.worldMap[y] && this.worldMap[y][midX]) {
                this.worldMap[y][midX] = 'grass';
            }
        }
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    updatePlayer() {
        let dx = 0, dy = 0, moving = false;
        
        if (this.keys['arrowup']) {
            dy = -this.player.speed;
            this.player.direction = 'up';
            moving = true;
        }
        if (this.keys['arrowdown']) {
            dy = this.player.speed;
            this.player.direction = 'down';
            moving = true;
        }
        if (this.keys['arrowleft']) {
            dx = -this.player.speed;
            this.player.direction = 'left';
            moving = true;
        }
        if (this.keys['arrowright']) {
            dx = this.player.speed;
            this.player.direction = 'right';
            moving = true;
        }
        
        // Update walk animation
        if (moving) {
            this.player.walkTimer++;
            if (this.player.walkTimer >= 2) {
                this.player.walkFrame = (this.player.walkFrame + 1) % 2;
                this.player.walkTimer = 0;
            }
        }
        
        // Check collision and move
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (!this.checkTerrainCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkTerrainCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
        
        // Keep player in world bounds
        this.player.x = Math.max(16, Math.min(this.worldWidth - 32, this.player.x));
        this.player.y = Math.max(16, Math.min(this.worldHeight - 32, this.player.y));
        
        // Update camera to follow player
        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = this.player.y - this.height / 2;
        
        // Keep camera in bounds
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.height, this.camera.y));
        
        // Attack
        if (this.keys[' '] && this.player.attackCooldown <= 0) {
            this.player.attacking = true;
            this.player.attackCooldown = 8;
            this.attackEnemies();
        }
        
        // Update cooldowns
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown--;
        }
        if (this.player.attackCooldown === 0) {
            this.player.attacking = false;
        }
        
        if (this.player.invulnerable) {
            this.player.invulnerabilityTimer--;
            if (this.player.invulnerabilityTimer <= 0) {
                this.player.invulnerable = false;
            }
        }
    }
    
    checkTerrainCollision(x, y) {
        const tileX = Math.floor(x / 16);
        const tileY = Math.floor(y / 16);
        
        if (tileY < 0 || tileY >= this.worldMap.length || 
            tileX < 0 || tileX >= this.worldMap[0].length) {
            return true; // Out of bounds
        }
        
        const tile = this.worldMap[tileY][tileX];
        return tile === 'water' || tile === 'tree' || tile === 'rock' || tile === 'house';
    }
    
    attackEnemies() {
        const attackRange = 24;
        this.enemies.forEach((enemy, index) => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < attackRange) {
                enemy.health--;
                if (enemy.health <= 0) {
                    // Drop item
                    if (Math.random() < 0.5) {
                        this.items.push({
                            type: Math.random() < 0.7 ? 'rupee' : 'heart',
                            x: enemy.x,
                            y: enemy.y,
                            collected: false
                        });
                    }
                    this.enemies.splice(index, 1);
                }
            }
        });
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            // Simple AI
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20 && distance < 100) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Check collision with player
            if (distance < 20 && !this.player.invulnerable) {
                this.player.health--;
                this.player.invulnerable = true;
                this.player.invulnerabilityTimer = 30;
                this.updateHealthUI();
                
                if (this.player.health <= 0) {
                    this.gameState = 'gameOver';
                }
            }
        });
    }
    
    updateItems() {
        this.items.forEach(item => {
            const dx = item.x - this.player.x;
            const dy = item.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!item.collected && distance < 20) {
                // Check if treasure requires key
                if (item.type === 'treasure' && item.requiresKey) {
                    if (this.player.keys > 0) {
                        item.collected = true;
                        this.player.keys--;
                        this.hasWon = true;
                        this.gameState = 'won';
                        this.updateUI();
                    }
                    // If no key, don't collect the treasure
                } else {
                    item.collected = true;
                    
                    switch (item.type) {
                        case 'rupee':
                            this.player.rupees += 5;
                            break;
                        case 'heart':
                            if (this.player.health < this.player.maxHealth) {
                                this.player.health++;
                            }
                            break;
                        case 'bomb':
                            this.player.hasBomb = true;
                            break;
                        case 'key':
                            this.player.keys++;
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
    }
    
    updateHealthUI() {
        for (let i = 1; i <= 6; i++) {
            const heart = document.getElementById(`heart${i}`);
            if (heart) {
                if (i <= this.player.health) {
                    heart.className = 'heart full';
                } else {
                    heart.className = 'heart empty';
                }
            }
        }
    }
    
    drawSprite(sprite, x, y) {
        for (let row = 0; row < 16; row++) {
            for (let col = 0; col < 16; col++) {
                const colorIndex = sprite[row][col];
                if (colorIndex !== 0) {
                    this.ctx.fillStyle = this.colors[colorIndex];
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }
    
    drawWorld() {
        const startX = Math.floor(this.camera.x / 16);
        const startY = Math.floor(this.camera.y / 16);
        const endX = Math.min(startX + Math.ceil(this.width / 16) + 1, this.worldMap[0].length);
        const endY = Math.min(startY + Math.ceil(this.height / 16) + 1, this.worldMap.length);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y >= 0 && y < this.worldMap.length && x >= 0 && x < this.worldMap[0].length) {
                    const tileType = this.worldMap[y][x];
                    const sprite = this.sprites[tileType] || this.sprites.grass;
                    this.drawSprite(sprite, x * 16 - this.camera.x, y * 16 - this.camera.y);
                }
            }
        }
    }
    
    drawPlayer() {
        if (this.player.invulnerable && Math.floor(this.player.invulnerabilityTimer / 4) % 2) {
            return;
        }
        
        const sprite = this.player.direction === 'up' ? this.sprites.linkUp : this.sprites.linkDown;
        this.drawSprite(sprite, this.player.x - this.camera.x, this.player.y - this.camera.y);
        
        if (this.player.attacking) {
            this.ctx.fillStyle = '#FFD700';
            const swordX = this.player.x - this.camera.x;
            const swordY = this.player.y - this.camera.y;
            
            switch (this.player.direction) {
                case 'up':
                    this.ctx.fillRect(swordX + 4, swordY - 12, 8, 16);
                    break;
                case 'down':
                    this.ctx.fillRect(swordX + 4, swordY + 16, 8, 16);
                    break;
                case 'left':
                    this.ctx.fillRect(swordX - 12, swordY + 4, 16, 8);
                    break;
                case 'right':
                    this.ctx.fillRect(swordX + 16, swordY + 4, 16, 8);
                    break;
            }
        }
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const sprite = this.sprites[enemy.type] || this.sprites.octorok;
            this.drawSprite(sprite, enemy.x - this.camera.x, enemy.y - this.camera.y);
        });
    }
    
    drawItems() {
        this.items.forEach(item => {
            if (!item.collected) {
                const sprite = this.sprites[item.type] || this.sprites.rupee;
                this.drawSprite(sprite, item.x - this.camera.x, item.y - this.camera.y);
            }
        });
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
        
        // Draw celebration background
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
        
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
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawWorld();
        this.drawItems();
        this.drawEnemies();
        this.drawPlayer();
        
        if (this.gameState === 'gameOver') {
            this.drawGameOver();
        } else if (this.gameState === 'won') {
            this.drawWinScreen();
        }
    }
    
    gameLoop(currentTime) {
        this.update();
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game
window.addEventListener('load', () => {
    new ZeldaRPG();
}); 