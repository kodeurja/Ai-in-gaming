/**
 * Puzzle Manager - Handles multiple puzzle types for the progression gates.
 */
const PuzzleManager = {
    type: null,
    missionId: null,
    container: null,
    state: {},

    init(type, step, puzzleData) {
        this.type = type;
        this.step = step;
        this.puzzleData = puzzleData;
        this.container = document.getElementById('puzzle-canvas-container');
        this.render();
    },

    render() {
        this.container.innerHTML = '';
        console.log("Rendering Puzzle Type:", this.type);

        // strictly enforce Tower of Hanoi as requested
        if (this.type === 'tower-of-hanoi') {
            this.initTowerOfHanoi();
        } else {
            // Fallback for any legacy data in DB
            this.initTowerOfHanoi();
        }
    },

    // --- 1. CIRCUIT PATH (Inspired by Pipe Mania) ---
    initCircuitPath() {
        // Title and desc are now handled by the template using puzzleData
        const size = 4;
        this.container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        this.container.classList.add('puzzle-grid');

        this.state.grid = [];
        this.state.size = size;

        // Types: 'I' (straight), 'L' (corner)
        for (let r = 0; r < size; r++) {
            this.state.grid[r] = [];
            for (let c = 0; c < size; c++) {
                const type = Math.random() > 0.4 ? 'L' : 'I';
                const rotation = Math.floor(Math.random() * 4) * 90;
                this.state.grid[r][c] = { type, rotation };
            }
        }

        this.renderCircuit();
    },

    renderCircuit() {
        this.container.innerHTML = '';
        const size = this.state.size;
        const isConnected = this.checkCircuit();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell circuit-cell';
                if (r === 0 && c === 0) cell.classList.add('source');
                if (r === size - 1 && c === size - 1) cell.classList.add('target');

                const node = this.state.grid[r][c];
                const segment = document.createElement('div');
                segment.className = `segment segment-${node.type}`;
                segment.style.transform = `rotate(${node.rotation}deg)`;

                if (isConnected.has(`${r},${c}`)) {
                    segment.classList.add('powered');
                }

                cell.appendChild(segment);

                if (r === 0 && c === 0 || r === size - 1 && c === size - 1) {
                    const label = document.createElement('span');
                    label.className = 'label';
                    label.innerText = (r === 0) ? 'S' : 'T';
                    cell.appendChild(label);
                }

                cell.onclick = () => {
                    node.rotation = (node.rotation + 90) % 360;
                    this.renderCircuit();
                };
                this.container.appendChild(cell);
            }
        }

        if (isConnected.has(`${size - 1},${size - 1}`)) {
            setTimeout(() => this.showSuccess(), 300);
        }
    },

    checkCircuit() {
        const size = this.state.size;
        const visited = new Set();
        const queue = [[0, 0]];
        const powered = new Set();

        const getConnections = (node) => {
            const rot = node.rotation;
            if (node.type === 'I') {
                return rot === 0 || rot === 180 ? ['L', 'R'] : ['U', 'D'];
            } else { // 'L'
                if (rot === 0) return ['R', 'D'];
                if (rot === 90) return ['D', 'L'];
                if (rot === 180) return ['L', 'U'];
                if (rot === 270) return ['U', 'R'];
            }
            return [];
        };

        const canConnect = (r1, c1, r2, c2, dir) => {
            if (r2 < 0 || r2 >= size || c2 < 0 || c2 >= size) return false;
            const n1 = this.state.grid[r1][c1];
            const n2 = this.state.grid[r2][c2];
            const conn1 = getConnections(n1);
            const conn2 = getConnections(n2);

            const opposite = { 'R': 'L', 'L': 'R', 'U': 'D', 'D': 'U' };
            return conn1.includes(dir) && conn2.includes(opposite[dir]);
        };

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            powered.add(key);

            const neighbors = [
                [r, c + 1, 'R'], [r, c - 1, 'L'],
                [r - 1, c, 'U'], [r + 1, c, 'D']
            ];

            for (const [nr, nc, dir] of neighbors) {
                if (canConnect(r, c, nr, nc, dir)) {
                    queue.push([nr, nc]);
                }
            }
        }
        return powered;
    },

    // --- 2. PATTERN MEMORY (Inspired by Simon Says) ---
    initPatternMemory() {
        const size = this.puzzleData.grid_size || 3;
        this.container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        this.container.classList.add('puzzle-grid');
        this.container.style.aspectRatio = "1/1";
        this.container.style.gap = "10px";

        this.state.sequence = [];
        this.state.userSequence = [];
        this.state.isPlaying = false;
        this.state.cells = [];

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell pattern-node';
            cell.dataset.index = i;
            cell.onclick = () => this.handlePatternClick(i);
            this.container.appendChild(cell);
            this.state.cells.push(cell);
        }

        setTimeout(() => this.startPatternSequence(), 1000);
    },

    startPatternSequence() {
        this.state.sequence = [];
        const length = this.puzzleData.sequence_length || 5;
        for (let i = 0; i < length; i++) {
            this.state.sequence.push(Math.floor(Math.random() * (this.state.size * this.state.size)));
        }
        this.playSequence();
    },

    async playSequence() {
        this.state.isPlaying = true;
        this.state.userSequence = [];

        for (const index of this.state.sequence) {
            await this.flashCell(index);
            await new Promise(r => setTimeout(r, 400));
        }
        this.state.isPlaying = false;
    },

    flashCell(index) {
        return new Promise(resolve => {
            const cell = this.state.cells[index];
            cell.classList.add('active');
            setTimeout(() => {
                cell.classList.remove('active');
                resolve();
            }, 600);
        });
    },

    handlePatternClick(index) {
        if (this.state.isPlaying) return;

        const cell = this.state.cells[index];
        cell.classList.add('active');
        setTimeout(() => cell.classList.remove('active'), 200);

        this.state.userSequence.push(index);
        const currentStep = this.state.userSequence.length - 1;

        if (this.state.userSequence[currentStep] !== this.state.sequence[currentStep]) {
            document.getElementById('puzzle-desc').innerText = "The echoes fade... Try again.";
            this.container.classList.add('shake');
            setTimeout(() => {
                this.container.classList.remove('shake');
                this.playSequence();
            }, 1000);
            return;
        }

        if (this.state.userSequence.length === this.state.sequence.length) {
            this.showSuccess();
        }
    },

    // --- 3. ADVANCED MEMORY (Mission 3 Overhaul) ---
    initTileMatching() {
        const symbols = ['🐚', '💎', '💠', '🌀', '🔱', '⚓', '🛰️', '🧬'];
        let bank = [...symbols, ...symbols];
        bank = bank.sort(() => Math.random() - 0.5);

        this.container.style.gridTemplateColumns = `repeat(4, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(4, 1fr)`;
        this.container.classList.add('puzzle-grid');

        this.state.matches = 0;
        this.state.selected = [];
        this.state.moves = 12;
        this.state.isChecking = false;

        bank.forEach((s, i) => {
            const tile = document.createElement('div');
            tile.className = 'cell tile memory-tile';
            tile.dataset.symbol = s;
            tile.dataset.index = i;

            tile.innerText = s;
            tile.classList.add('peek');

            tile.onclick = () => this.handleMemoryClick(tile);
            this.container.appendChild(tile);
        });

        setTimeout(() => {
            document.querySelectorAll('.memory-tile').forEach(t => {
                t.innerText = '?';
                t.classList.remove('peek');
            });
        }, 2500);
    },

    handleMemoryClick(tile) {
        if (this.state.isChecking || tile.classList.contains('matched') || tile.classList.contains('selected') || tile.classList.contains('peek')) return;

        tile.innerText = tile.dataset.symbol;
        tile.classList.add('selected');
        this.state.selected.push(tile);

        if (this.state.selected.length === 2) {
            this.state.moves--;
            document.getElementById('puzzle-desc').innerText = `Match all pairs. Moves remaining: ${this.state.moves}.`;
            this.state.isChecking = true;

            const [t1, t2] = this.state.selected;
            if (t1.dataset.symbol === t2.dataset.symbol) {
                t1.classList.add('matched');
                t2.classList.add('matched');
                this.state.matches++;
                this.state.selected = [];
                this.state.isChecking = false;
                if (this.state.matches === 8) this.showSuccess();
            } else {
                setTimeout(() => {
                    t1.innerText = '?';
                    t2.innerText = '?';
                    t1.classList.remove('selected');
                    t2.classList.remove('selected');
                    this.state.selected = [];
                    this.state.isChecking = false;
                    if (this.state.moves <= 0) {
                        alert("NEURAL LINK SEVERED. REBOOTING...");
                        location.reload();
                    }
                }, 800);
            }
        }
    },

    // --- 2. PATH FINDER (Gate 2) ---
    initPathFinder() {
        const layout = this.puzzleData.layout;
        const size = this.puzzleData.grid_size || 7;

        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';

        const gridBox = document.createElement('div');
        gridBox.className = 'maze-grid';
        gridBox.style.display = 'grid';
        gridBox.style.gridTemplateColumns = `repeat(${size}, 50px)`;
        gridBox.style.gridTemplateRows = `repeat(${size}, 50px)`;
        gridBox.style.gap = '2px';
        gridBox.style.margin = '20px';

        this.state.grid = layout;
        this.state.path = []; // List of coordinates [r, c]
        this.state.currentPos = null;
        this.state.endPos = null;
        this.state.finished = false;

        // Find Start and End
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (layout[r][c] === 'S') this.state.currentPos = [r, c];
                if (layout[r][c] === 'E') this.state.endPos = [r, c];
            }
        }

        if (this.state.currentPos) this.state.path.push(this.state.currentPos);

        // Render Grid
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                const type = layout[r][c];
                if (type === 1) cell.classList.add('maze-wall');
                else if (type === 'S') cell.classList.add('maze-start');
                else if (type === 'E') cell.classList.add('maze-end');
                else cell.classList.add('maze-path');

                // Interaction
                cell.onclick = () => this.handleMazeMove(r, c);

                gridBox.appendChild(cell);
            }
        }
        this.container.appendChild(gridBox);

        // Controls / Info
        const infoBox = document.createElement('div');
        infoBox.innerHTML = `
            <div style="color:var(--primary); margin-bottom:10px;">MOVES: <span id="maze-moves">0</span></div>
            <button class="retro-btn" onclick="state.puzzleManager.resetMaze()">RESET POSITION</button>
            <button class="retro-btn" onclick="state.puzzleManager.getMazeHint()" style="margin-left:10px;">AI HINT</button>
            <div id="maze-hint-text" style="color:#00ffaa; margin-top:10px; min-height:20px; font-size:0.9rem;"></div>
        `;
        this.container.appendChild(infoBox);

        this.updateMazeVisuals();
        document.getElementById('puzzle-desc').innerText = "Navigate the neural pathways. Avoid bad data blocks.";
    },

    handleMazeMove(r, c) {
        if (this.state.finished) return;

        const [currR, currC] = this.state.currentPos;

        // Check adjacency (orthogonal only)
        const dist = Math.abs(currR - r) + Math.abs(currC - c);
        if (dist !== 1) {
            this.flashMazeError("MOVE ORTHOGONAL ONLY");
            return;
        }

        // Check wall
        if (this.state.grid[r][c] === 1) {
            this.flashMazeError("DATA BLOCK CORRUPTED");
            return;
        }

        // Check if backtracking (clicking previous step)
        if (this.state.path.length > 1) {
            const prev = this.state.path[this.state.path.length - 2];
            if (prev[0] === r && prev[1] === c) {
                // Backtrack
                this.state.path.pop();
                this.state.currentPos = [r, c];
                this.updateMazeVisuals();
                return;
            }
        }

        // Move forward
        this.state.path.push([r, c]);
        this.state.currentPos = [r, c];
        this.updateMazeVisuals();

        // Check Win
        if (this.state.grid[r][c] === 'E') {
            this.state.finished = true;
            this.showSuccess();
        }
    },

    updateMazeVisuals() {
        // Clear old path classes
        document.querySelectorAll('.maze-cell.active-path').forEach(el => el.classList.remove('active-path'));
        document.querySelectorAll('.maze-cell.current-head').forEach(el => el.classList.remove('current-head'));

        // Draw path
        this.state.path.forEach(([r, c], idx) => {
            const cell = document.querySelector(`.maze-cell[data-r="${r}"][data-c="${c}"]`);
            if (cell) {
                cell.classList.add('active-path');
                if (idx === this.state.path.length - 1) cell.classList.add('current-head');
            }
        });

        document.getElementById('maze-moves').innerText = this.state.path.length - 1;
    },

    resetMaze() {
        // Find start again or use history 0
        const start = this.state.path[0];
        this.state.path = [start];
        this.state.currentPos = start;
        this.state.finished = false;
        this.updateMazeVisuals();
        document.getElementById('maze-hint-text').innerText = "";
    },

    getMazeHint() {
        const start = this.state.currentPos;
        const end = this.state.endPos;
        const size = this.puzzleData.grid_size;
        const grid = this.state.grid;

        const queue = [start];
        const cameFrom = {};
        cameFrom[start] = null;
        let found = false;

        while (queue.length > 0) {
            const current = queue.shift();
            const [r, c] = current;

            if (r === end[0] && c === end[1]) {
                found = true;
                break;
            }

            const deltas = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (let [dr, dc] of deltas) {
                const nr = r + dr, nc = c + dc;
                const nextPos = [nr, nc];
                if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
                    grid[nr][nc] !== 1) {
                    const key = nextPos.toString();
                    if (!(key in cameFrom)) {
                        queue.push(nextPos);
                        cameFrom[key] = current;
                    }
                }
            }
        }

        if (!found) {
            document.getElementById('maze-hint-text').innerText = "NO PATH DETECTED";
            return;
        }

        // Reconstruct path
        let curr = end;
        let path = [];
        while (curr && curr.toString() !== start.toString()) {
            path.push(curr);
            curr = cameFrom[curr.toString()];
        }
        path.reverse();

        if (path.length > 0) {
            const [nextR, nextC] = path[0];
            let hintDir = "";
            const [currR, currC] = start;

            if (nextR < currR) hintDir = "UP";
            else if (nextR > currR) hintDir = "DOWN";
            else if (nextC < currC) hintDir = "LEFT";
            else if (nextC > currC) hintDir = "RIGHT";

            document.getElementById('maze-hint-text').innerText = `ADVISORY: Proceed ${hintDir}`;
        }
    },

    flashMazeError(msg) {
        document.getElementById('maze-hint-text').innerText = `ERROR: ${msg}`;
        document.getElementById('maze-hint-text').style.color = '#ff0055';
        setTimeout(() => {
            document.getElementById('maze-hint-text').innerText = "";
            document.getElementById('maze-hint-text').style.color = '#00ffaa';
        }, 1500);
    },

    // --- 3. MECHANICAL LOCK (Gate 3) ---
    initMechanicalLock() {
        const bolts = this.puzzleData.bolts || ['red', 'blue', 'green'];
        const container = this.container;

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '20px';

        const lockContainer = document.createElement('div');
        lockContainer.style.display = 'flex';
        lockContainer.style.gap = '20px';
        lockContainer.style.background = 'rgba(0,0,0,0.5)';
        lockContainer.style.padding = '30px';
        lockContainer.style.borderRadius = '10px';
        lockContainer.style.border = '2px solid var(--primary-dim)';

        // Shuffle display order but keep solution order in state
        const displayBolts = [...bolts].sort(() => Math.random() - 0.5);

        this.state.sequence = bolts;
        this.state.currentStep = 0;
        this.state.unlocked = [];

        displayBolts.forEach(color => {
            const bolt = document.createElement('div');
            bolt.className = `bolt-mech bolt-${color}`;
            bolt.style.width = '60px';
            bolt.style.height = '60px';
            bolt.style.borderRadius = '50%';
            bolt.style.border = '4px solid #333';
            bolt.style.background = `radial-gradient(circle at 30% 30%, ${color}, #000)`;
            bolt.style.cursor = 'pointer';
            bolt.style.boxShadow = `0 4px 6px rgba(0,0,0,0.5)`;
            bolt.style.transition = 'transform 0.2s, box-shadow 0.2s';

            // Interaction
            bolt.onmousedown = () => {
                bolt.style.transform = 'scale(0.9) rotate(5deg)';
            }
            bolt.onmouseup = () => {
                bolt.style.transform = 'scale(1)';
                this.handleBoltClick(color, bolt);
            }

            lockContainer.appendChild(bolt);
        });

        container.appendChild(lockContainer);

        const feedback = document.createElement('div');
        feedback.id = 'mech-feedback';
        feedback.style.height = '20px';
        feedback.style.color = 'var(--primary)';
        container.appendChild(feedback);

        document.getElementById('puzzle-desc').innerText = "Unbind the sequence. Pattern required.";
    },

    handleBoltClick(color, element) {
        if (this.state.unlocked.includes(color)) return;

        const expected = this.state.sequence[this.state.currentStep];

        if (color === expected) {
            // Correct
            this.state.currentStep++;
            this.state.unlocked.push(color);
            element.style.opacity = '0.5';
            element.style.boxShadow = `0 0 15px ${color}`;
            element.style.borderColor = '#fff';

            document.getElementById('mech-feedback').innerText = "SEQUENCE ALIGNED...";

            if (this.state.currentStep >= this.state.sequence.length) {
                document.getElementById('mech-feedback').innerText = "MECHANISM RELEASED.";
                document.getElementById('mech-feedback').style.color = '#00ffaa';
                this.showSuccess();
            }
        } else {
            // Incorrect - Reset
            this.state.currentStep = 0;
            this.state.unlocked = [];

            document.getElementById('mech-feedback').innerText = "SEQUENCE FAIL. RESETTING.";
            document.getElementById('mech-feedback').style.color = '#ff0055';

            // Visual reset
            const allBolts = document.querySelectorAll('.bolt-mech');
            allBolts.forEach(b => {
                b.style.opacity = '1';
                b.style.borderColor = '#333';
                b.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
                b.classList.add('shake');
            });
            setTimeout(() => {
                allBolts.forEach(b => b.classList.remove('shake'));
                document.getElementById('mech-feedback').innerText = "";
                document.getElementById('mech-feedback').style.color = 'var(--primary)';
            }, 600);
        }
    },

    // --- 4. LASER REDIRECT (Inspired by Aargon) ---
    initLaserRedirect() {
        const size = 5;
        this.container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        this.container.classList.add('puzzle-grid');

        this.state.grid = Array.from({ length: size }, () => Array(size).fill(null));
        this.state.source = { r: 0, c: 0, dir: 'R' };
        this.state.target = { r: 4, c: 4 };

        const mirrorPos = [[0, 4], [4, 4], [4, 0], [2, 0], [2, 2]];
        mirrorPos.forEach(([r, c]) => {
            this.state.grid[r][c] = { type: Math.random() > 0.5 ? '/' : '\\' };
        });

        this.renderLaserGrid();
        this.updateLaser();
    },

    renderLaserGrid() {
        this.container.innerHTML = '';
        const size = 5;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell laser-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                if (r === this.state.source.r && c === this.state.source.c) {
                    cell.innerHTML = '<div class="laser-source">S</div>';
                } else if (r === this.state.target.r && c === this.state.target.c) {
                    cell.innerHTML = '<div class="laser-target">T</div>';
                }

                const mirror = this.state.grid[r][c];
                if (mirror) {
                    const mDiv = document.createElement('div');
                    mDiv.className = `mirror mirror-${mirror.type === '/' ? 'slash' : 'backslash'}`;
                    mDiv.innerText = mirror.type;
                    cell.appendChild(mDiv);
                    cell.onclick = () => {
                        mirror.type = mirror.type === '/' ? '\\' : '/';
                        this.updateLaser();
                    };
                }
                this.container.appendChild(cell);
            }
        }
    },

    updateLaser() {
        document.querySelectorAll('.laser-cell').forEach(c => c.classList.remove('laser-active'));

        let { r, c, dir } = this.state.source;
        const visited = new Set();

        while (r >= 0 && r < 5 && c >= 0 && c < 5) {
            const key = `${r},${c},${dir}`;
            if (visited.has(key)) break;
            visited.add(key);

            const cell = document.querySelector(`.laser-cell[data-r="${r}"][data-c="${c}"]`);
            if (cell) cell.classList.add('laser-active');

            if (r === this.state.target.r && c === this.state.target.c) {
                this.showSuccess();
                break;
            }

            const mirror = this.state.grid[r][c];
            if (mirror) {
                if (mirror.type === '/') {
                    if (dir === 'R') dir = 'U';
                    else if (dir === 'L') dir = 'D';
                    else if (dir === 'U') dir = 'R';
                    else if (dir === 'D') dir = 'L';
                } else {
                    if (dir === 'R') dir = 'D';
                    else if (dir === 'L') dir = 'U';
                    else if (dir === 'U') dir = 'L';
                    else if (dir === 'D') dir = 'R';
                }
            }

            if (dir === 'R') c++;
            else if (dir === 'L') c--;
            else if (dir === 'U') r--;
            else if (dir === 'D') r++;
        }

        document.querySelectorAll('.mirror').forEach((m) => {
            const r = parseInt(m.parentElement.dataset.r);
            const c = parseInt(m.parentElement.dataset.c);
            const mirror = this.state.grid[r][c];
            m.innerText = mirror.type;
            m.className = `mirror mirror-${mirror.type === '/' ? 'slash' : 'backslash'}`;
        });
    },

    // --- 5. BLOCK BLAST (Inspired by Block Blast) ---
    initBlockBlast() {
        const size = 6;
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.innerHTML = '';

        const gridEl = document.createElement('div');
        gridEl.className = 'puzzle-grid block-blast-grid';
        gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        gridEl.style.width = '400px';
        gridEl.style.height = '400px';
        this.container.appendChild(gridEl);

        const blocksEl = document.createElement('div');
        blocksEl.className = 'blocks-container';
        blocksEl.style.display = 'flex';
        blocksEl.style.gap = '20px';
        blocksEl.style.marginTop = '20px';
        this.container.appendChild(blocksEl);

        this.state.grid = Array.from({ length: size }, () => Array(size).fill(0));
        this.state.linesCleared = 0;
        this.state.selectedBlock = null;
        this.state.availableBlocks = [];
        this.state.gridEl = gridEl;
        this.state.blocksEl = blocksEl;

        this.renderBlastGrid();
        this.generateNewBlocks();
    },

    generateNewBlocks() {
        const shapes = [
            [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]], [[1, 1], [1, 1]], [[1, 0], [1, 1]], [[0, 1], [1, 1]]
        ];

        this.state.availableBlocks = [];
        for (let i = 0; i < 3; i++) {
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            this.state.availableBlocks.push({ shape, used: false });
        }
        this.renderAvailableBlocks();
    },

    renderBlastGrid() {
        this.state.gridEl.innerHTML = '';
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell blast-cell';
                if (this.state.grid[r][c]) cell.classList.add('filled');
                cell.onclick = () => this.handleBlastGridClick(r, c);
                this.state.gridEl.appendChild(cell);
            }
        }
    },

    renderAvailableBlocks() {
        this.state.blocksEl.innerHTML = '';
        this.state.availableBlocks.forEach((block, idx) => {
            if (block.used) return;

            const bDiv = document.createElement('div');
            bDiv.className = 'block-preview';
            if (this.state.selectedBlock === idx) bDiv.classList.add('selected');

            bDiv.style.display = 'grid';
            bDiv.style.gridTemplateColumns = `repeat(${block.shape[0].length}, 20px)`;
            bDiv.style.gridTemplateRows = `repeat(${block.shape.length}, 20px)`;

            block.shape.forEach(row => {
                row.forEach(cell => {
                    const cDiv = document.createElement('div');
                    if (cell) cDiv.className = 'block-mini-cell';
                    bDiv.appendChild(cDiv);
                });
            });

            bDiv.onclick = () => {
                this.state.selectedBlock = idx;
                this.renderAvailableBlocks();
            };
            this.state.blocksEl.appendChild(bDiv);
        });
    },

    handleBlastGridClick(r, c) {
        if (this.state.selectedBlock === null) return;

        const block = this.state.availableBlocks[this.state.selectedBlock];
        if (!block || block.used) return;

        const shape = block.shape;
        for (let br = 0; br < shape.length; br++) {
            for (let bc = 0; bc < shape[0].length; bc++) {
                if (shape[br][bc]) {
                    const gr = r + br;
                    const gc = c + bc;
                    if (gr >= 6 || gc >= 6 || this.state.grid[gr][gc]) {
                        this.state.gridEl.classList.add('shake');
                        setTimeout(() => this.state.gridEl.classList.remove('shake'), 500);
                        return;
                    }
                }
            }
        }

        for (let br = 0; br < shape.length; br++) {
            for (let bc = 0; bc < shape[0].length; bc++) {
                if (shape[br][bc]) {
                    this.state.grid[r + br][c + bc] = 1;
                }
            }
        }

        block.used = true;
        this.state.selectedBlock = null;
        this.checkBlastLines();
        this.renderBlastGrid();
        this.renderAvailableBlocks();

        if (this.state.availableBlocks.every(b => b.used)) {
            this.generateNewBlocks();
        }
    },

    checkBlastLines() {
        let rowsToClear = [];
        let colsToClear = [];

        for (let r = 0; r < 6; r++) {
            if (this.state.grid[r].every(cell => cell === 1)) rowsToClear.push(r);
        }

        for (let c = 0; c < 6; c++) {
            let full = true;
            for (let r = 0; r < 6; r++) {
                if (this.state.grid[r][c] === 0) {
                    full = false;
                    break;
                }
            }
            if (full) colsToClear.push(c);
        }

        rowsToClear.forEach(r => {
            for (let c = 0; c < 6; c++) this.state.grid[r][c] = 0;
            this.state.linesCleared++;
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < 6; r++) this.state.grid[r][c] = 0;
            this.state.linesCleared++;
        });

        if (this.state.linesCleared > 0) {
            document.getElementById('puzzle-desc').innerText = `Sectors Cleared: ${this.state.linesCleared} / 3`;
        }

        if (this.state.linesCleared >= 3) {
            this.showSuccess();
        }
    },

    // --- 6. FINAL ENCRYPTION (Mastermind style) ---
    initFinalEncryption() {
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.padding = '20px';

        this.state.targetCode = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        this.state.attempts = 0;

        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';
        inputRow.style.display = 'flex';
        inputRow.style.gap = '10px';
        inputRow.style.marginBottom = '20px';

        const inputs = [];
        for (let i = 0; i < 4; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 1;
            input.max = 6;
            input.style.width = '50px';
            input.style.height = '50px';
            input.style.fontSize = '24px';
            input.style.textAlign = 'center';
            input.style.background = 'rgba(0,0,0,0.5)';
            input.style.color = 'var(--primary)';
            input.style.border = '1px solid var(--primary)';
            inputRow.appendChild(input);
            inputs.push(input);
        }

        const submitBtn = document.createElement('button');
        submitBtn.innerText = "DECRYPT";
        submitBtn.className = 'btn-primary';
        submitBtn.onclick = () => {
            const guess = inputs.map(i => parseInt(i.value));
            if (guess.some(isNaN)) return;

            this.state.attempts++;
            const feedback = this.getFeedback(guess, this.state.targetCode);

            const resultRow = document.createElement('div');
            resultRow.style.display = 'flex';
            resultRow.style.gap = '5px';
            resultRow.style.marginBottom = '5px';

            guess.forEach((g, idx) => {
                const box = document.createElement('div');
                box.innerText = g;
                box.style.width = '30px';
                box.style.height = '30px';
                box.style.display = 'flex';
                box.style.justifyContent = 'center';
                box.style.alignItems = 'center';
                box.style.background = feedback[idx] === 'correct' ? '#00ffaa' : (feedback[idx] === 'present' ? '#ffcc00' : '#333');
                resultRow.appendChild(box);
            });

            this.container.insertBefore(resultRow, inputRow);

            if (feedback.every(f => f === 'correct')) {
                this.showSuccess();
            }
        };

        this.container.appendChild(inputRow);
        this.container.appendChild(submitBtn);
    },

    getFeedback(guess, target) {
        const feedback = new Array(4).fill('absent');
        const targetCopy = [...target];
        const guessCopy = [...guess];

        for (let i = 0; i < 4; i++) {
            if (guessCopy[i] === targetCopy[i]) {
                feedback[i] = 'correct';
                targetCopy[i] = null;
                guessCopy[i] = null;
            }
        }

        for (let i = 0; i < 4; i++) {
            if (guessCopy[i] !== null) {
                const targetIdx = targetCopy.indexOf(guessCopy[i]);
                if (targetIdx !== -1) {
                    feedback[i] = 'present';
                    targetCopy[targetIdx] = null;
                }
            }
        }
        return feedback;
    },

    // --- JIGSAW RECONSTITUTION ---
    initJigsawReconstitution() {
        const size = this.puzzleData.complexity || 3;
        const container = this.container;
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        container.classList.add('puzzle-grid');
        container.style.aspectRatio = "1/1";
        container.style.gap = "2px";

        const tiles = [];
        const correctOrder = [];
        for (let i = 0; i < size * size; i++) {
            correctOrder.push(i);
            tiles.push(i);
        }

        // Shuffle
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        this.state.tiles = tiles;
        this.state.size = size;
        this.state.correctOrder = correctOrder;
        this.state.draggingIdx = null;

        this.renderJigsaw();
    },

    renderJigsaw() {
        this.container.innerHTML = '';
        const size = this.state.size;

        this.state.tiles.forEach((tileIdx, currentPos) => {
            const tile = document.createElement('div');
            tile.className = 'jigsaw-tile';
            tile.draggable = true;

            // Image slice calculations
            const row = Math.floor(tileIdx / size);
            const col = tileIdx % size;

            // We use background-position to show the correct part of the image
            // With size 3, col 0 is 0%, col 1 is 50%, col 2 is 100%
            const percentX = size > 1 ? (col / (size - 1)) * 100 : 0;
            const percentY = size > 1 ? (row / (size - 1)) * 100 : 0;

            // Dynamic Animal Image with seed for uniqueness
            const animal = this.puzzleData.animal || 'animal';
            const seed = this.puzzleData.seed || Date.now();
            tile.style.backgroundImage = `url('https://loremflickr.com/600/600/${animal}?lock=${seed}')`;
            tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            tile.style.backgroundPosition = `${percentX}% ${percentY}%`;
            tile.style.border = '1px solid rgba(0, 243, 255, 0.2)';

            tile.dataset.index = currentPos;

            // Drag and Drop Logic
            tile.addEventListener('dragstart', (e) => {
                this.state.draggingIdx = currentPos;
                tile.classList.add('dragging');
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData('text/plain', currentPos);
            });

            tile.addEventListener('dragover', (e) => {
                e.preventDefault();
                tile.classList.add('drag-over');
            });

            tile.addEventListener('dragleave', () => {
                tile.classList.remove('drag-over');
            });

            tile.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = currentPos;
                this.swapTiles(fromIdx, toIdx);
            });

            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
                const allTiles = document.querySelectorAll('.jigsaw-tile');
                allTiles.forEach(t => t.classList.remove('drag-over'));
            });

            this.container.appendChild(tile);
        });
    },

    swapTiles(fromIdx, toIdx) {
        if (isNaN(fromIdx) || fromIdx === toIdx) return;

        const temp = this.state.tiles[fromIdx];
        this.state.tiles[fromIdx] = this.state.tiles[toIdx];
        this.state.tiles[toIdx] = temp;

        this.renderJigsaw();
        this.checkJigsawWin();
    },

    checkJigsawWin() {
        const isWin = this.state.tiles.every((val, index) => val === this.state.correctOrder[index]);
        if (isWin) {
            setTimeout(() => this.showSuccess(), 300);
        }
    },

    // --- 5. NEURAL FLOW (Gate 5) ---
    initFlowLink() {
        const size = this.puzzleData.grid_size || 5;
        // Generate pairs or use static for stability if not provided
        // Simple 5x5 layout with 4 pairs
        const colors = ['#f00', '#0f0', '#00f', '#ff0'];
        const layout = [
            [1, 0, 0, 0, 1],
            [2, 0, 0, 0, 2],
            [3, 0, 0, 0, 3],
            [4, 0, 0, 0, 4],
            [0, 0, 0, 0, 0]
        ];

        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';

        const gridBox = document.createElement('div');
        gridBox.className = 'flow-grid';
        gridBox.style.display = 'grid';
        gridBox.style.gridTemplateColumns = `repeat(${size}, 50px)`;
        gridBox.style.gridTemplateRows = `repeat(${size}, 50px)`;
        gridBox.style.gap = '2px';
        gridBox.style.padding = '10px';
        gridBox.style.background = 'rgba(0,0,0,0.5)';
        gridBox.style.border = '2px solid var(--primary-dim)';

        this.state.grid = Array.from({ length: size }, () => Array(size).fill(0));
        this.state.paths = {}; // colorIdx -> array of [r,c]
        this.state.isDrawing = false;
        this.state.activeColor = null;

        colors.forEach((c, i) => this.state.paths[i + 1] = []);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'flow-cell';
                cell.style.width = '50px';
                cell.style.height = '50px';
                cell.style.background = 'rgba(255,255,255,0.05)';
                cell.style.display = 'flex';
                cell.style.justifyContent = 'center';
                cell.style.alignItems = 'center';
                cell.style.cursor = 'pointer';
                cell.dataset.r = r;
                cell.dataset.c = c;

                const val = layout[r][c];
                if (val > 0) {
                    const dot = document.createElement('div');
                    dot.style.width = '30px';
                    dot.style.height = '30px';
                    dot.style.borderRadius = '50%';
                    dot.style.background = colors[val - 1];
                    dot.style.boxShadow = `0 0 10px ${colors[val - 1]}`;
                    cell.appendChild(dot);
                    cell.dataset.node = val;
                }

                // Events
                cell.onmousedown = (e) => this.startFlow(r, c, val, layout);
                cell.onmouseenter = (e) => this.continueFlow(r, c);
                cell.onmouseup = () => this.endFlow();

                gridBox.appendChild(cell);
            }
        }

        this.container.appendChild(gridBox);
        this.state.layout = layout;
        this.state.colors = colors;

        document.addEventListener('mouseup', () => this.endFlow());
        document.getElementById('puzzle-desc').innerText = "Connect matching nodes. Do not cross streams.";
    },

    startFlow(r, c, val, layout) {
        // Must start at a node or existing path end? 
        // For simplicity, must start at node or end of existing path of that color
        // Actually, let's just allow starting at a node.
        if (val > 0) {
            this.state.isDrawing = true;
            this.state.activeColor = val;
            this.state.paths[val] = [[r, c]];
            this.renderFlowGrid();
        }
    },

    continueFlow(r, c) {
        if (!this.state.isDrawing) return;

        const colorIdx = this.state.activeColor;
        const path = this.state.paths[colorIdx];
        const last = path[path.length - 1];

        // Check adjacency
        if (Math.abs(last[0] - r) + Math.abs(last[1] - c) !== 1) return;

        // Check if hitting another node
        const nodeVal = this.state.layout[r][c];
        if (nodeVal > 0 && nodeVal !== colorIdx) return; // Hit wrong node

        // Check self intersection (backtracking)
        const existingIdx = path.findIndex(p => p[0] === r && p[1] === c);
        if (existingIdx !== -1) {
            // Truncate path if backtracking
            this.state.paths[colorIdx] = path.slice(0, existingIdx + 1);
            this.renderFlowGrid();
            return;
        }

        // Check if cell occupied by OTHER path
        for (let k in this.state.paths) {
            if (parseInt(k) !== colorIdx) {
                if (this.state.paths[k].some(p => p[0] === r && p[1] === c)) return; // Occupied
            }
        }

        // Add to path
        path.push([r, c]);
        this.renderFlowGrid();

        // Check completion of this line
        if (nodeVal === colorIdx && path.length > 1) {
            this.state.isDrawing = false; // Finished this line
            this.checkFlowWin();
        }
    },

    endFlow() {
        this.state.isDrawing = false;
        this.state.activeColor = null;
    },

    renderFlowGrid() {
        // Clear previous path visuals (not nodes)
        // Actually simpler to just re-apply styles to cells
        const cells = this.container.querySelectorAll('.flow-cell');
        cells.forEach(cell => {
            // Keep nodes
            if (!cell.hasChildNodes()) cell.style.background = 'rgba(255,255,255,0.05)';
            else if (cell.querySelector('.flow-path-segment')) cell.removeChild(cell.querySelector('.flow-path-segment'));
        });

        // Draw paths
        for (let k in this.state.paths) {
            const path = this.state.paths[k];
            const color = this.state.colors[parseInt(k) - 1];

            path.forEach(pos => {
                const cell = this.container.querySelector(`.flow-cell[data-r="${pos[0]}"][data-c="${pos[1]}"]`);
                if (cell && !cell.dataset.node) {
                    const seg = document.createElement('div');
                    seg.className = 'flow-path-segment';
                    seg.style.width = '20px';
                    seg.style.height = '20px';
                    seg.style.background = color;
                    seg.style.borderRadius = '50%';
                    seg.style.boxShadow = `0 0 5px ${color}`;
                    cell.appendChild(seg);
                }
            });
        }
    },

    checkFlowWin() {
        // Win if all pairs connected
        // A pair is connected if path includes both nodes?
        // My logic allows starting at one node and ending at same? 
        // No, `continueFlow` prevents hitting wrong node.
        // And I stop if hitting correct node.
        // So I just need to check if every color's path connects two nodes.
        // Actually, just check if `this.state.paths[k]` starts and ends at a node of type k?
        // Or simplified: check if we have 4 completed paths?

        let completed = 0;
        for (let k in this.state.paths) {
            const path = this.state.paths[k];
            if (path.length < 2) continue;

            const start = path[0];
            const end = path[path.length - 1];

            const startNode = this.state.layout[start[0]][start[1]];
            const endNode = this.state.layout[end[0]][end[1]];

            if (startNode === parseInt(k) && endNode === parseInt(k)) {
                completed++;
            }
        }

        if (completed === 4) {
            this.showSuccess();
        }
    },

    // --- TOWER OF HANOI (Universal Gate Puzzle) ---
    initTowerOfHanoi() {
        const disks = this.puzzleData.disks || 3;
        const targetRod = 2; // Index 2 is the 3rd rod

        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="hanoi-stats">
                <div>MOVES: <span id="hanoi-moves">0</span></div>
                <div>MIN: ${this.puzzleData.min_moves || '?'}</div>
            </div>
            <div class="hanoi-container" id="hanoi-board"></div>
            <div class="hanoi-rules" style="margin-top: 30px; border-top: 1px solid var(--border); padding-top: 20px;">
                <div style="font-family: 'Orbitron', sans-serif; color: var(--primary); font-size: 0.9rem; margin-bottom: 10px; letter-spacing: 1px;">PROTOCOL RULES:</div>
                <ul style="color: var(--text-muted); font-size: 0.85rem; list-style: none; padding: 0; line-height: 1.6;">
                    <li>• MOVE ONE DISK AT A TIME.</li>
                    <li>• NO LARGER DISK ON SMALLER DISK.</li>
                    <li>• TRANSFER COMPLETE STACK TO FINAL ROD.</li>
                </ul>
            </div>
            <div id="hanoi-msg" style="text-align: center; margin-top: 10px; color: var(--accent); min-height: 20px;"></div>
        `;

        this.state = {
            rods: [[], [], []],
            moves: 0,
            selection: null, // rod index
            history: [],
            disks: disks
        };

        // Initialize disks on Rod 0 (Largest at bottom -> index 0)
        // Actually, let's store disks as just integers 1..N
        // [3, 2, 1] -> 3 is at bottom, 1 is top.
        for (let i = disks; i >= 1; i--) {
            this.state.rods[0].push(i);
        }

        this.renderHanoiBoard();
    },

    renderHanoiBoard() {
        console.log("Rendering Hanoi Board. State:", JSON.stringify(this.state));
        const board = document.getElementById('hanoi-board');
        if (!board) {
            console.error("Hanoi Board container not found!");
            return;
        }
        board.innerHTML = '';
        const msgEl = document.getElementById('hanoi-msg');
        if (msgEl) {
            msgEl.innerText = `[DEBUG] State: Rods=${this.state.rods.length}, Disks=${this.state.disks}`;
            msgEl.style.color = '#fff';
        }

        [0, 1, 2].forEach(rodIdx => {
            const rodEl = document.createElement('div');
            rodEl.className = 'hanoi-rod';
            if (this.state.selection === rodIdx) rodEl.classList.add('selected-rod');

            // Add click handler
            rodEl.onclick = () => this.handleRodClick(rodIdx);

            // Render disks
            this.state.rods[rodIdx].forEach(diskSize => {
                const disk = document.createElement('div');
                disk.className = 'hanoi-disk';
                // Width calc: base 40px + size * 20px
                disk.style.width = `${40 + (diskSize * 25)}px`;

                // Dynamic Color based on diskSize
                const colors = [
                    '#00f3ff', // 1: Cyan
                    '#00ff9d', // 2: Green
                    '#ffeb3b', // 3: Yellow
                    '#ff9800', // 4: Orange
                    '#ff0055', // 5: Red
                    '#bc13fe', // 6: Purple
                    '#2196f3'  // 7: Blue
                ];
                const color = colors[(diskSize - 1) % colors.length];
                disk.style.background = `linear-gradient(90deg, ${color}, #000)`;
                disk.style.boxShadow = `0 0 5px ${color}`;
                disk.style.border = `1px solid ${color}`;

                // If this is the top disk of selected rod, mark it
                if (this.state.selection === rodIdx &&
                    diskSize === this.state.rods[rodIdx][this.state.rods[rodIdx].length - 1]) {
                    disk.classList.add('selected');
                }

                rodEl.appendChild(disk);
            });

            board.appendChild(rodEl);
        });

        document.getElementById('hanoi-moves').innerText = this.state.moves;
    },

    handleRodClick(rodIdx) {
        const rods = this.state.rods;

        // Deselect if clicking same
        if (this.state.selection === rodIdx) {
            this.state.selection = null;
            this.renderHanoiBoard();
            this.showMessage("");
            return;
        }

        // Select source
        if (this.state.selection === null) {
            if (rods[rodIdx].length === 0) {
                this.showMessage("Rod is empty.");
                return;
            }
            this.state.selection = rodIdx;
            this.renderHanoiBoard();
            return;
        }

        // Move attempt
        const sourceIdx = this.state.selection;
        const targetIdx = rodIdx;

        const sourceDisk = rods[sourceIdx][rods[sourceIdx].length - 1];
        const targetDisk = rods[targetIdx].length > 0 ? rods[targetIdx][rods[targetIdx].length - 1] : 999;

        if (sourceDisk < targetDisk) {
            // Valid Move
            this.executeMove(sourceIdx, targetIdx);
        } else {
            this.showMessage("Invalid Move: Cannot place larger disk on smaller.");
        }
    },

    executeMove(from, to) {
        // Save history
        this.state.history.push(JSON.parse(JSON.stringify(this.state.rods)));

        const disk = this.state.rods[from].pop();
        this.state.rods[to].push(disk);
        this.state.moves++;
        this.state.selection = null;

        this.renderHanoiBoard();
        this.showMessage("");
        this.checkWin();
    },

    undoMove() {
        if (this.state.history.length === 0) return;
        this.state.rods = this.state.history.pop();
        this.state.moves--;
        this.state.selection = null;
        this.renderHanoiBoard();
        this.showMessage("Undo successful.");
    },

    resetHanoi() {
        // Just re-init
        this.initTowerOfHanoi();
        this.showMessage("Reset complete.");
    },

    checkWin() {
        const disks = this.state.disks;
        // Check if Rod 2 has all disks
        if (this.state.rods[2].length === disks) {
            this.showSuccess();
        }
    },

    showMessage(msg) {
        document.getElementById('hanoi-msg').innerText = msg;
    },

    getHanoiHint() {
        // calculate optimal move from current state
        // Algorithm: Recursive solution for N disks is Move(N-1, Src, Aux), Move(N, Src, Dst), Move(N-1, Aux, Dst)
        // But we are in an arbitrary state.
        // A simple heuristic for hint: "Move smallest available disk to legal spot that advances/doesn't regress"
        // Or better: Look at the standard recursive algorithm. 
        // Or simplified: Just simulate next step of optimal path? 
        // Since N is small <= 7, Breadth First Search for shortest path from current state is instant.

        this.showMessage("Calculating optimal path...");
        setTimeout(() => {
            const nextMove = this.calculateBFS(this.state.rods, 3, this.state.disks);
            if (nextMove) {
                this.showMessage(`Hint: Move disk from Rod ${nextMove.from + 1} to Rod ${nextMove.to + 1}`);
            } else {
                this.showMessage("You are on the optimal path or puzzle solved!");
            }
        }, 100);
    },

    calculateBFS(currentRods, numRods, numDisks) {
        const startState = JSON.stringify(currentRods);
        const targetRod = 2; // 0-indexed

        const queue = [[currentRods, []]]; // [state, path]
        const visited = new Set();
        visited.add(startState);

        // Safety Break
        let iterations = 0;

        while (queue.length > 0 && iterations < 5000) {
            iterations++;
            const [rods, path] = queue.shift();

            // Goal check
            if (rods[2].length === numDisks) {
                return path[0]; // Return first move of efficient path
            }

            // Generate moves
            for (let i = 0; i < 3; i++) {
                if (rods[i].length === 0) continue;
                const disk = rods[i][rods[i].length - 1];

                for (let j = 0; j < 3; j++) {
                    if (i === j) continue;
                    const top = rods[j].length > 0 ? rods[j][rods[j].length - 1] : 999;
                    if (disk < top) {
                        // Valid move
                        const newRods = JSON.parse(JSON.stringify(rods));
                        newRods[i].pop();
                        newRods[j].push(disk);
                        const s = JSON.stringify(newRods);
                        if (!visited.has(s)) {
                            visited.add(s);
                            const newPath = [...path, { from: i, to: j }];
                            queue.push([newRods, newPath]);
                        }
                    }
                }
            }
        }
        return null;
    },

    renderMatch3() {
        this.container.innerHTML = '';
        const size = this.state.size;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'match3-cell';
                cell.style.backgroundColor = this.state.grid[r][c].color;
                cell.style.boxShadow = `0 0 15px ${this.state.grid[r][c].color}88`;

                if (this.state.selected && this.state.selected.r === r && this.state.selected.c === c) {
                    cell.classList.add('selected');
                }

                cell.onclick = () => this.handleMatch3Click(r, c);
                this.container.appendChild(cell);
            }
        }
    },

    updateMatch3UI() {
        const desc = document.getElementById('puzzle-desc');
        desc.innerHTML = `Stability Score: <span class="highlight">${this.state.score}</span> / ${this.state.targetScore}`;
    },

    handleMatch3Click(r, c) {
        if (this.state.isProcessing) return;

        if (!this.state.selected) {
            this.state.selected = { r, c };
            this.renderMatch3();
        } else {
            const r2 = r;
            const c2 = c;
            const r1 = this.state.selected.r;
            const c1 = this.state.selected.c;

            const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);

            if (isAdjacent) {
                this.swapMatch3(r1, c1, r2, c2);
            } else {
                this.state.selected = { r, c };
                this.renderMatch3();
            }
        }
    },

    async swapMatch3(r1, c1, r2, c2) {
        this.state.isProcessing = true;
        this.state.selected = null;

        // Perform swap
        const temp = this.state.grid[r1][c1];
        this.state.grid[r1][c1] = this.state.grid[r2][c2];
        this.state.grid[r2][c2] = temp;

        this.renderMatch3();

        // Check for matches
        const matches = this.findMatches();
        if (matches.length > 0) {
            await this.processMatches();
        } else {
            // Swap back if no match
            setTimeout(() => {
                const temp2 = this.state.grid[r1][c1];
                this.state.grid[r1][c1] = this.state.grid[r2][c2];
                this.state.grid[r2][c2] = temp2;
                this.renderMatch3();
                this.state.isProcessing = false;
            }, 300);
            return;
        }

        this.state.isProcessing = false;
    },

    findMatches() {
        const size = this.state.size;
        const matches = [];

        // Horizontal
        for (let r = 0; r < size; r++) {
            let matchCount = 1;
            for (let c = 1; c < size; c++) {
                if (this.state.grid[r][c].color === this.state.grid[r][c - 1].color) {
                    matchCount++;
                } else {
                    if (matchCount >= 3) {
                        for (let k = 1; k <= matchCount; k++) matches.push({ r, c: c - k });
                    }
                    matchCount = 1;
                }
            }
            if (matchCount >= 3) {
                for (let k = 0; k < matchCount; k++) matches.push({ r, c: size - 1 - k });
            }
        }

        // Vertical
        for (let c = 0; c < size; c++) {
            let matchCount = 1;
            for (let r = 1; r < size; r++) {
                if (this.state.grid[r][c].color === this.state.grid[r - 1][c].color) {
                    matchCount++;
                } else {
                    if (matchCount >= 3) {
                        for (let k = 1; k <= matchCount; k++) matches.push({ r: r - k, c });
                    }
                    matchCount = 1;
                }
            }
            if (matchCount >= 3) {
                for (let k = 0; k < matchCount; k++) matches.push({ r: size - 1 - k, c });
            }
        }

        return matches;
    },

    async processMatches() {
        let matches = this.findMatches();
        while (matches.length > 0) {
            // Remove duplicates
            const uniqueMatches = Array.from(new Set(matches.map(m => `${m.r},${m.c}`))).map(s => {
                const [r, c] = s.split(',').map(Number);
                return { r, c };
            });

            this.state.score += uniqueMatches.length * 10;
            this.updateMatch3UI();

            // Indicate cleared
            uniqueMatches.forEach(m => {
                this.state.grid[m.r][m.c].cleared = true;
            });
            this.renderMatch3();
            await new Promise(r => setTimeout(r, 300));

            // Shift down
            for (let c = 0; c < this.state.size; c++) {
                let emptyRow = this.state.size - 1;
                for (let r = this.state.size - 1; r >= 0; r--) {
                    if (!this.state.grid[r][c].cleared) {
                        this.state.grid[emptyRow][c] = this.state.grid[r][c];
                        emptyRow--;
                    }
                }
                for (let r = emptyRow; r >= 0; r--) {
                    this.state.grid[r][c] = { color: this.state.colors[Math.floor(Math.random() * this.state.colors.length)] };
                }
            }

            this.renderMatch3();
            await new Promise(r => setTimeout(r, 300));

            if (this.state.score >= this.state.targetScore) {
                this.showSuccess();
                break;
            }

            matches = this.findMatches();
        }
    },

    showSuccess() {
        document.getElementById('puzzle-success-modal').style.display = 'block';
    }
};
