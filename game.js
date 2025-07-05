class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.score = 0;
        this.gameOver = false;
        
        // Player
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            width: 32,
            height: 32,
            speed: 4,
            health: 100,
            maxHealth: 100,
            attacking: false,
            attackCooldown: 0,
            direction: 'down'
        };
        
        // Enemies
        this.enemies = [];
        this.enemySpawnTimer = 0;
        
        // Projectiles
        this.projectiles = [];
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
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
        // Movement
        let dx = 0;
        let dy = 0;
        
        if (this.keys['w'] || this.keys['arrowup']) {
            dy = -this.player.speed;
            this.player.direction = 'up';
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            dy = this.player.speed;
            this.player.direction = 'down';
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            dx = -this.player.speed;
            this.player.direction = 'left';
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            dx = this.player.speed;
            this.player.direction = 'right';
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Update position
        this.player.x += dx;
        this.player.y += dy;
        
        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.height - this.player.height, this.player.y));
        
        // Attack
        if (this.keys[' '] && this.player.attackCooldown <= 0) {
            this.player.attacking = true;
            this.player.attackCooldown = 20;
            this.createProjectile();
        }
        
        // Update attack cooldown
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown--;
        }
        
        if (this.player.attackCooldown === 0) {
            this.player.attacking = false;
        }
    }
    
    createProjectile() {
        const projectile = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            width: 8,
            height: 8,
            speed: 8,
            direction: this.player.direction
        };
        
        // Set initial position based on direction
        switch (this.player.direction) {
            case 'up':
                projectile.y = this.player.y;
                break;
            case 'down':
                projectile.y = this.player.y + this.player.height;
                break;
            case 'left':
                projectile.x = this.player.x;
                break;
            case 'right':
                projectile.x = this.player.x + this.player.width;
                break;
        }
        
        this.projectiles.push(projectile);
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            switch (projectile.direction) {
                case 'up':
                    projectile.y -= projectile.speed;
                    break;
                case 'down':
                    projectile.y += projectile.speed;
                    break;
                case 'left':
                    projectile.x -= projectile.speed;
                    break;
                case 'right':
                    projectile.x += projectile.speed;
                    break;
            }
            
            // Remove if out of bounds
            if (projectile.x < 0 || projectile.x > this.width ||
                projectile.y < 0 || projectile.y > this.height) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(projectile, enemy)) {
                    this.enemies.splice(j, 1);
                    this.projectiles.splice(i, 1);
                    this.score += 10;
                    break;
                }
            }
        }
    }
    
    spawnEnemy() {
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= 120) { // Spawn every 2 seconds at 60fps
            this.enemySpawnTimer = 0;
            
            // Spawn enemy at random edge
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (side) {
                case 0: // Top
                    x = Math.random() * this.width;
                    y = -32;
                    break;
                case 1: // Right
                    x = this.width;
                    y = Math.random() * this.height;
                    break;
                case 2: // Bottom
                    x = Math.random() * this.width;
                    y = this.height;
                    break;
                case 3: // Left
                    x = -32;
                    y = Math.random() * this.height;
                    break;
            }
            
            this.enemies.push({
                x: x,
                y: y,
                width: 32,
                height: 32,
                speed: 1 + Math.random() * 2
            });
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Check collision with player
            if (this.checkCollision(enemy, this.player)) {
                this.player.health -= 1;
                this.enemies.splice(i, 1);
                
                if (this.player.health <= 0) {
                    this.gameOver = true;
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateUI() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercent + '%';
        document.getElementById('healthText').textContent = this.player.health;
        document.getElementById('scoreText').textContent = this.score;
    }
    
    drawPlayer() {
        this.ctx.fillStyle = this.player.attacking ? '#ffaa00' : '#4a90e2';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw direction indicator
        this.ctx.fillStyle = '#ffffff';
        switch (this.player.direction) {
            case 'up':
                this.ctx.fillRect(this.player.x + 12, this.player.y + 4, 8, 4);
                break;
            case 'down':
                this.ctx.fillRect(this.player.x + 12, this.player.y + 24, 8, 4);
                break;
            case 'left':
                this.ctx.fillRect(this.player.x + 4, this.player.y + 12, 4, 8);
                break;
            case 'right':
                this.ctx.fillRect(this.player.x + 24, this.player.y + 12, 4, 8);
                break;
        }
    }
    
    drawEnemies() {
        this.ctx.fillStyle = '#ff4444';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }
    
    drawProjectiles() {
        this.ctx.fillStyle = '#ffff00';
        this.projectiles.forEach(projectile => {
            this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        });
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
        this.ctx.fillText('Refresh to play again', this.width / 2, this.height / 2 + 50);
    }
    
    update() {
        if (this.gameOver) return;
        
        this.updatePlayer();
        this.updateProjectiles();
        this.spawnEnemy();
        this.updateEnemies();
        this.updateUI();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c5530';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw game objects
        this.drawProjectiles();
        this.drawEnemies();
        this.drawPlayer();
        
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
}); 