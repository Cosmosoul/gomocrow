// 游戏状态管理
class Game {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.playerPieces = 30;
        this.usedPieces = 0;
        this.currentScore = 0;
        this.targetScore = 70;
        this.money = 0;
        this.round = 0;
        this.level = 1;
        this.maxLevel = 15;
        this.currentGame = 1;
        
        // 阵型等级
        this.formations = {
            horizontal: 1,
            vertical: 1,
            diagonalLeft: 1,
            diagonalRight: 1
        };
        
        // 槽位
        this.skillSlots = Array(6).fill(null);
        this.itemSlots = Array(4).fill(null);
        this.accessorySlots = Array(2).fill(null);
        
        // AI状态
        this.aiDifficulty = 0;
        this.aiEmotion = '得意';
        this.emotionTurns = 0;
        this.emotionEffects = {
            '得意': { difficulty: 0, color: '#4fc3f7' },
            '专注': { difficulty: 1, color: '#4caf50' },
            '愤怒': { difficulty: 1, color: '#f44336' },
            '惊恐': { difficulty: -1, color: '#9c27b0' },
            '疲惫': { difficulty: -1, color: '#795548' }
        };
        
        // 游戏状态
        this.isPlayerTurn = true;
        this.gameActive = false;
        this.forbiddenCells = new Set();
        
        // 特效系统
        this.effects = [];
        
        // 商店自动弹出标志
        this.shouldShowShopAfterWin = false;
        this.isShopFromVictory = false;
        
        // 拖拽状态
        this.draggingItem = null;
        
        // 连续消除计数（用于连续升级技能）
        this.consecutiveEliminations = {
            horizontal: 0,
            vertical: 0,
            diagonalLeft: 0,
            diagonalRight: 0
        };
        
        // 当前回合效果
        this.currentTurnEffects = {
            singlePieceModifiers: [],  // 单个棋子积分修改
            totalScoreModifiers: []    // 总积分修改
        };
        
        // 绑定事件
        this.bindEvents();
    }
    
    init() {
        this.createBoard();
        this.updateUI();
        
        // 显示初始技能选择
        this.showInitialSkillSelection();
    }
    
    createBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                boardElement.appendChild(cell);
                this.board[row][col] = { type: 'empty', turns: 0 };
            }
        }
    }
    
    updateUI() {
        document.getElementById('current-round').textContent = this.round;
        document.getElementById('target-score').textContent = this.targetScore;
        document.getElementById('current-score').textContent = this.currentScore;
        document.getElementById('money').textContent = this.money;
        document.getElementById('pieces-used').textContent = this.usedPieces;
        document.getElementById('current-game').textContent = `${this.currentGame}/${this.maxLevel}`;
        
        // 更新阵型等级
        document.getElementById('formation-horizontal').innerHTML = 
            `<span class="level">${this.getFormationSymbol(this.formations.horizontal)}</span>`;
        document.getElementById('formation-vertical').innerHTML = 
            `<span class="level">${this.getFormationSymbol(this.formations.vertical)}</span>`;
        document.getElementById('formation-diagonal-left').innerHTML = 
            `<span class="level">${this.getFormationSymbol(this.formations.diagonalLeft)}</span>`;
        document.getElementById('formation-diagonal-right').innerHTML = 
            `<span class="level">${this.getFormationSymbol(this.formations.diagonalRight)}</span>`;
        
        // 更新AI状态
        this.updateAIEmotion();
        
        // 更新槽位
        this.updateSlots();
        
        // 更新商店按钮状态
        const shopBtn = document.getElementById('shop-btn');
        if (this.gameActive) {
            shopBtn.disabled = true;
            shopBtn.style.opacity = '0.5';
            shopBtn.style.cursor = 'not-allowed';
        } else {
            shopBtn.disabled = false;
            shopBtn.style.opacity = '1';
            shopBtn.style.cursor = 'pointer';
        }
        
        // 更新商店的下一关按钮
        const nextLevelShopBtn = document.getElementById('next-level-shop-btn');
        if (this.level < this.maxLevel) {
            nextLevelShopBtn.textContent = `下一关 (第${this.level + 1}关)`;
            nextLevelShopBtn.style.display = 'inline-block';
        } else {
            nextLevelShopBtn.textContent = '通关完成';
            nextLevelShopBtn.style.display = 'inline-block';
        }
    }
    
    // 新增更新AI情绪函数
    updateAIEmotion() {
        if (this.emotionTurns > 0) {
            this.emotionTurns--;
            if (this.emotionTurns === 0) {
                this.aiEmotion = '得意';
                this.aiDifficulty = 0;
            }
        }
        
        // 更新UI显示
        const emotionElement = document.getElementById('ai-emotion');
        if (emotionElement) {
            emotionElement.textContent = this.aiEmotion;
            const color = this.emotionEffects[this.aiEmotion]?.color || '#4fc3f7';
            emotionElement.style.color = color;
        }
        
        // 更新难度条
        const barWidth = ((this.aiDifficulty + 1) / 2) * 100;
        const barElement = document.getElementById('ai-difficulty-bar');
        if (barElement) {
            barElement.style.width = `${barWidth}%`;
            
            // 根据难度设置颜色
            if (this.aiDifficulty === 1) {
                barElement.style.background = 'linear-gradient(90deg, #4caf50, #ff9800, #f44336)';
            } else if (this.aiDifficulty === -1) {
                barElement.style.background = 'linear-gradient(90deg, #2196f3, #4fc3f7, #bbdefb)';
            } else {
                barElement.style.background = 'linear-gradient(90deg, #4caf50, #ff9800, #f44336)';
            }
        }
    }
    
    getFormationSymbol(level) {
        if (level <= 5) return 'I'.repeat(level);
        if (level <= 10) return 'V' + 'I'.repeat(level - 5);
        return 'X' + 'V'.repeat(Math.floor((level - 10) / 5)) + 'I'.repeat((level - 10) % 5);
    }
    
    updateSlots() {
        // 更新技能槽位
        const skillSlotsElement = document.getElementById('skill-slots');
        skillSlotsElement.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = `slot ${this.skillSlots[i] ? 'filled' : 'empty'}`;
            slot.dataset.index = i;
            slot.dataset.type = 'skill';
            
            // 添加拖拽属性
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'skill', i));
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', (e) => this.handleDrop(e, 'skill', i));
            slot.addEventListener('dragend', this.handleDragEnd.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            if (this.skillSlots[i]) {
                const skill = this.skillSlots[i];
                slot.innerHTML = `
                    <div class="slot-icon">${skill.icon}</div>
                    <div class="slot-name">${skill.name}</div>
                    ${skill.cooldown > 0 ? `<div class="slot-cooldown">${skill.cooldown}</div>` : ''}
                `;
                slot.title = skill.description;
            } else {
                slot.innerHTML = '<div class="empty-icon">+</div><div class="empty-text">空技能槽</div>';
            }
            
            slot.addEventListener('click', () => this.showSlotDetail('skill', i));
            skillSlotsElement.appendChild(slot);
        }
        
        // 更新道具槽位
        const itemSlotsElement = document.getElementById('item-slots');
        itemSlotsElement.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            const slot = document.createElement('div');
            slot.className = `slot ${this.itemSlots[i] ? 'filled' : 'empty'}`;
            slot.dataset.index = i;
            slot.dataset.type = 'item';
            
            // 添加拖拽属性
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'item', i));
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', (e) => this.handleDrop(e, 'item', i));
            slot.addEventListener('dragend', this.handleDragEnd.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            if (this.itemSlots[i]) {
                const item = this.itemSlots[i];
                slot.innerHTML = `
                    <div class="slot-icon">${item.icon}</div>
                    <div class="slot-name">${item.name}</div>
                    ${item.subtype === 'spell' ? '<div class="spell-indicator">法术</div>' : ''}
                    ${this.shouldShowUseButton(item) ? '<button class="slot-use-btn">使用</button>' : ''}
                `;
                slot.title = item.description;
                
                // 为可使用的道具添加点击事件
                if (this.shouldShowUseButton(item)) {
                    const useBtn = slot.querySelector('.slot-use-btn');
                    useBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.useItem(i);
                    });
                    
                    // 点击槽位其他区域显示详情
                    slot.addEventListener('click', (e) => {
                        if (e.target !== useBtn && !useBtn.contains(e.target)) {
                            this.showSlotDetail('item', i);
                        }
                    });
                } else {
                    slot.addEventListener('click', () => this.showSlotDetail('item', i));
                }
            } else {
                slot.innerHTML = '<div class="empty-icon">+</div><div class="empty-text">空道具槽</div>';
                slot.addEventListener('click', () => this.showSlotDetail('item', i));
            }
            
            itemSlotsElement.appendChild(slot);
        }
        
        // 更新饰品槽位
        const accessorySlotsElement = document.getElementById('accessory-slots');
        accessorySlotsElement.innerHTML = '';
        
        for (let i = 0; i < 2; i++) {
            const slot = document.createElement('div');
            slot.className = `slot ${this.accessorySlots[i] ? 'filled' : 'empty'}`;
            slot.dataset.index = i;
            slot.dataset.type = 'accessory';
            
            // 添加拖拽属性
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'accessory', i));
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', (e) => this.handleDrop(e, 'accessory', i));
            slot.addEventListener('dragend', this.handleDragEnd.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            if (this.accessorySlots[i]) {
                const accessory = this.accessorySlots[i];
                slot.innerHTML = `
                    <div class="slot-icon">${accessory.icon}</div>
                    <div class="slot-name">${accessory.name}</div>
                `;
                slot.title = accessory.description;
            } else {
                slot.innerHTML = '<div class="empty-icon">+</div><div class="empty-text">空饰品槽</div>';
            }
            
            slot.addEventListener('click', () => this.showSlotDetail('accessory', i));
            accessorySlotsElement.appendChild(slot);
        }
    }
    
    // 判断是否需要显示使用按钮
    shouldShowUseButton(item) {
        return item && (item.subtype === 'spell' || item.subtype === 'trap' || item.subtype === 'upgrade');
    }
    
    // 拖拽开始
    handleDragStart(e, type, index) {
        const slotArray = this.getSlotArray(type);
        if (!slotArray[index]) return;
        
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: type,
            index: index
        }));
        
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
        
        setTimeout(() => {
            e.currentTarget.style.opacity = '0.4';
        }, 0);
    }
    
    // 拖拽经过
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }
    
    // 拖拽离开
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    // 拖拽结束
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging', 'drag-over');
        e.currentTarget.style.opacity = '1';
    }
    
    // 放置
    handleDrop(e, targetType, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!dragData) return;
            
            const { type: sourceType, index: sourceIndex } = dragData;
            
            if (sourceType !== targetType) {
                alert('不同类型的卡牌不能互换位置！');
                return;
            }
            
            this.swapSlots(sourceType, sourceIndex, targetIndex);
            this.updateUI();
        } catch (error) {
            console.error('拖拽错误:', error);
        }
    }
    
    // 获取槽位数组
    getSlotArray(type) {
        switch (type) {
            case 'skill':
                return this.skillSlots;
            case 'item':
                return this.itemSlots;
            case 'accessory':
                return this.accessorySlots;
            default:
                return null;
        }
    }
    
    // 交换槽位
    swapSlots(type, index1, index2) {
        if (index1 === index2) return;
        
        const array = this.getSlotArray(type);
        if (!array) return;
        
        [array[index1], array[index2]] = [array[index2], array[index1]];
    }
    
    // 根据设计文档修改的handleCellClick函数
    handleCellClick(row, col) {
        if (!this.gameActive || !this.isPlayerTurn) return;
        
        const cell = this.board[row][col];
        if (cell.type !== 'empty') return;
        
        // 1. 放置玩家棋子
        const success = this.placePiece(row, col, 'player');
        if (!success) return;
        
        this.usedPieces++;
        this.playSound('place-piece-sound');
        
        // 2. 触发移动前的技能（如复制大师）
        this.triggerSkillsBeforeMove(row, col);
        
        // 3. 检查所有可触发的被动技能、道具、饰品（按照优先级）
        this.triggerAllPassiveEffects('playerMove');
        
        // 4. 检查AI是否连成五子（失败条件优先）
        if (this.checkAIWin()) {
            // 如果有死者复活技能，触发
            if (!this.checkDeadRevival()) {
                this.loseGame();
            }
            return;
        }
        
        // 5. 检查棋子是否耗尽（失败条件）
        if (this.usedPieces >= this.playerPieces) {
            this.loseGame();
            return;
        }
        
        // 6. 检查玩家是否连成五子
        const playerLines = this.checkLines(row, col, 'player');
        if (playerLines.length > 0) {
            // 玩家形成五子，进行消除流程
            this.eliminatePlayerLine(playerLines);
            
            // 7. 消除后检查是否胜利（积分达到目标）
            if (this.currentScore >= this.targetScore) {
                // 8. 结算经济产出效果（即使胜利也要结算）
                this.triggerEconomicEffects();
                
                // 9. 结算阵型升级效果（即使胜利也要结算）
                this.triggerFormationUpgradeEffects();
                
                this.winGame();
            } else {
                // 结算经济产出效果
                this.triggerEconomicEffects();
                
                // 结算阵型升级效果
                this.triggerFormationUpgradeEffects();
                
                // 结束玩家回合
                this.endPlayerTurn();
            }
        } else {
            // 没有形成五子，也要结算经济和阵型效果
            this.triggerEconomicEffects();
            this.triggerFormationUpgradeEffects();
            this.endPlayerTurn();
        }
        
        this.updateUI();
    }
    
    // 新增：触发所有被动效果（按照优先级顺序）
    triggerAllPassiveEffects(triggerType = 'turn') {
        // 重置当前回合效果
        this.currentTurnEffects = {
            singlePieceModifiers: [],
            totalScoreModifiers: []
        };
        
        // 按照优先级顺序：道具牌 -> 技能牌 -> 饰品
        // 道具牌（从左到右）
        for (let i = 0; i < this.itemSlots.length; i++) {
            const item = this.itemSlots[i];
            if (item && item[triggerType]) {
                const result = item[triggerType](this);
                this.processEffectResult(result, 'item');
            }
        }
        
        // 技能牌（从左到右）
        for (let i = 0; i < this.skillSlots.length; i++) {
            const skill = this.skillSlots[i];
            if (skill && skill[triggerType]) {
                const result = skill[triggerType](this);
                this.processEffectResult(result, 'skill');
            }
        }
        
        // 饰品（先上后下，即数组顺序）
        for (let i = 0; i < this.accessorySlots.length; i++) {
            const accessory = this.accessorySlots[i];
            if (accessory && accessory[triggerType]) {
                const result = accessory[triggerType](this);
                this.processEffectResult(result, 'accessory');
            }
        }
    }
    
    // 处理效果结果
    processEffectResult(result, effectType) {
        if (!result) return;
        
        if (result.singlePieceModifier) {
            this.currentTurnEffects.singlePieceModifiers.push({
                type: effectType,
                modifier: result.singlePieceModifier,
                description: result.description || ''
            });
        }
        
        if (result.totalScoreModifier) {
            this.currentTurnEffects.totalScoreModifiers.push({
                type: effectType,
                modifier: result.totalScoreModifier,
                description: result.description || ''
            });
        }
        
        if (result.destroyItem) {
            // 销毁物品的逻辑
            this.destroyItem(result.destroyItem.type, result.destroyItem.index);
        }
    }
    
    // 销毁物品
    destroyItem(type, index) {
        switch (type) {
            case 'skill':
                if (this.skillSlots[index]) {
                    const skillName = this.skillSlots[index].name;
                    this.skillSlots[index] = null;
                    this.updateUI();
                    alert(`${skillName}已销毁`);
                }
                break;
            case 'item':
                if (this.itemSlots[index]) {
                    const itemName = this.itemSlots[index].name;
                    this.itemSlots[index] = null;
                    this.updateUI();
                    alert(`${itemName}已销毁`);
                }
                break;
        }
    }
    
    // 检查防御力场技能
    checkDefenseField() {
        // 检查AI是否形成四子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'ai') {
                    const aiStrategy = new AIStrategy(this);
                    const fourLines = aiStrategy.checkFour(row, col, 'ai');
                    if (fourLines.length > 0) {
                        // 触发防御力场
                        this.triggerDefenseField(fourLines[0]);
                    }
                }
            }
        }
    }
    
    // 触发防御力场
    triggerDefenseField(fourLine) {
        for (let i = 0; i < this.skillSlots.length; i++) {
            const skill = this.skillSlots[i];
            if (skill && skill.id === 'defenseField' && skill.onTrigger) {
                const shouldDestroy = skill.onTrigger(this, [fourLine]);
                if (shouldDestroy) {
                    // 移除技能牌
                    this.skillSlots[i] = null;
                    this.updateUI();
                    alert('防御力场触发：已自动堵住AI四子！');
                }
                break;
            }
        }
    }
    
    // 检查死者复活技能
    checkDeadRevival() {
        // 检查AI是否形成五子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'ai') {
                    const aiLines = this.checkLines(row, col, 'ai');
                    if (aiLines.length > 0) {
                        // 触发死者复活
                        for (let i = 0; i < this.skillSlots.length; i++) {
                            const skill = this.skillSlots[i];
                            if (skill && skill.id === 'deadRevival' && skill.onAIConnectFive) {
                                const shouldDestroy = skill.onAIConnectFive(this);
                                if (shouldDestroy) {
                                    // 移除技能牌
                                    this.skillSlots[i] = null;
                                }
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    
    // 触发移动前的技能（如复制大师）
    triggerSkillsBeforeMove(row, col) {
        for (let i = 0; i < this.skillSlots.length; i++) {
            const skill = this.skillSlots[i];
            if (skill && skill.onPlayerMove) {
                skill.onPlayerMove(this, i);
            }
        }
    }
    
    placePiece(row, col, type) {
        // 如果是AI放置，检查是否被禁止
        if (type === 'ai' && this.forbiddenCells.has(`${row},${col}`)) {
            return false;
        }
        
        this.board[row][col] = { type, turns: 0 };
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.remove('player', 'ai', 'forbidden');
        cellElement.classList.add(type);
        
        // 如果是玩家棋子，添加禁止AI放置的标记（3回合）
        if (type === 'player') {
            this.forbiddenCells.add(`${row},${col}`);
        }
        
        return true;
    }
    
    checkLines(row, col, type) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线（左上到右下）
            [1, -1]   // 对角线（右上到左下）
        ];
        
        const lines = [];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];
            
            // 正向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                
                if (this.isValidPosition(newRow, newCol) && 
                    this.board[newRow][newCol].type === type) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i < 5; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                
                if (this.isValidPosition(newRow, newCol) && 
                    this.board[newRow][newCol].type === type) {
                    count++;
                    cells.push([newRow, newCol]);
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                lines.push(cells.slice(0, 5));
            }
        }
        
        return lines;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    // 新增特效显示函数
    async showEliminationEffect(cells, baseScorePerPiece) {
        return new Promise((resolve) => {
            const effectsContainer = document.createElement('div');
            effectsContainer.className = 'elimination-effects';
            effectsContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(effectsContainer);
            
            let totalScore = 0;
            let completedAnimations = 0;
            
            // 为每个消除的棋子显示分数特效
            cells.forEach((pos, index) => {
                const [row, col] = pos.split(',').map(Number);
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const rect = cellElement.getBoundingClientRect();
                
                // 创建单个棋子分数特效
                const scoreEffect = document.createElement('div');
                scoreEffect.className = 'single-score-effect';
                scoreEffect.style.cssText = `
                    position: absolute;
                    left: ${rect.left + rect.width / 2}px;
                    top: ${rect.top + rect.height / 2}px;
                    font-size: 24px;
                    font-weight: bold;
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
                    opacity: 0;
                    transform: translate(-50%, -50%);
                    transition: all 0.5s ease-out;
                    z-index: 1001;
                `;
                scoreEffect.textContent = `+${baseScorePerPiece}`;
                
                document.body.appendChild(scoreEffect);
                
                // 动画：从棋子位置飞到中间累加器
                setTimeout(() => {
                    scoreEffect.style.opacity = '1';
                    scoreEffect.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    
                    setTimeout(() => {
                        const centerX = window.innerWidth / 2;
                        const centerY = window.innerHeight / 2;
                        
                        scoreEffect.style.left = `${centerX}px`;
                        scoreEffect.style.top = `${centerY}px`;
                        scoreEffect.style.fontSize = '36px';
                        scoreEffect.style.color = '#4caf50';
                        
                        setTimeout(() => {
                            scoreEffect.style.opacity = '0';
                            scoreEffect.style.transform = 'translate(-50%, -50%) scale(2)';
                            
                            totalScore += baseScorePerPiece;
                            completedAnimations++;
                            
                            // 更新中间累加数字
                            this.updateComboEffect(totalScore, `基础: ${completedAnimations} × ${baseScorePerPiece}`);
                            
                            // 移除特效元素
                            setTimeout(() => {
                                scoreEffect.remove();
                                
                                // 所有动画完成后resolve
                                if (completedAnimations === cells.length) {
                                    effectsContainer.remove();
                                    resolve(totalScore);
                                }
                            }, 500);
                        }, 500);
                    }, 300);
                }, index * 100); // 错开动画开始时间
            });
        });
    }
    
    // 修改eliminatePlayerLine函数以符合正确流程
    async eliminatePlayerLine(lines) {
        const eliminatedCells = new Set();
        
        // 步骤1：收集所有要消除的棋子（基础五子）
        for (const line of lines) {
            for (const [row, col] of line) {
                eliminatedCells.add(`${row},${col}`);
            }
            
            // 步骤2：添加紧邻的敌方棋子
            const adjacentCells = this.getAdjacentCells(line);
            for (const [row, col] of adjacentCells) {
                if (this.board[row][col].type === 'ai') {
                    eliminatedCells.add(`${row},${col}`);
                }
            }
        }
        
        // 步骤3：触发铁索连环技能（影响消除范围的效果先行触发）
        this.triggerIronChain(eliminatedCells);
        
        // 步骤4：播放消除音效
        this.playSound('eliminate-sound');
        
        // 步骤5：确定阵型等级
        const formationLevel = this.getFormationLevelForLine(lines[0]);
        const baseScorePerPiece = 10 * formationLevel;
        
        // 步骤6：播放消除动画并计算基础积分
        const eliminatedArray = Array.from(eliminatedCells);
        for (const pos of eliminatedArray) {
            const [row, col] = pos.split(',').map(Number);
            this.eliminateCell(row, col);
        }
        
        // 步骤7：显示单个棋子消除分数特效
        let baseScore = await this.showEliminationEffect(eliminatedArray, baseScorePerPiece);
        
        // 步骤8：显示基础累加数字
        this.showComboEffect();
        let breakdown = `基础消除: ${eliminatedArray.length} × ${baseScorePerPiece}`;
        
        // 步骤9：应用对单个棋子积分有影响的效果
        let singlePieceScore = baseScorePerPiece;
        for (const modifier of this.currentTurnEffects.singlePieceModifiers) {
            const oldScore = singlePieceScore;
            singlePieceScore = modifier.modifier(singlePieceScore);
            const bonus = singlePieceScore - oldScore;
            if (bonus > 0) {
                breakdown += `\n${modifier.description}: +${bonus} × ${eliminatedArray.length}`;
                baseScore += bonus * eliminatedArray.length;
                
                // 显示效果特效
                this.showEffectBonus(modifier.type, modifier.description, bonus * eliminatedArray.length);
            }
        }
        
        // 步骤10：计算总积分（基础积分）
        let totalScore = baseScore;
        
        // 步骤11：应用对总积分有影响的效果
        for (const modifier of this.currentTurnEffects.totalScoreModifiers) {
            const oldScore = totalScore;
            totalScore = modifier.modifier(totalScore);
            const bonus = totalScore - oldScore;
            if (bonus > 0) {
                breakdown += `\n${modifier.description}: +${bonus}`;
                
                // 显示效果特效
                this.showEffectBonus(modifier.type, modifier.description, bonus);
            }
        }
        
        // 步骤12：更新最终累加数字
        this.updateComboEffect(totalScore, breakdown);
        
        // 步骤13：累加积分
        this.currentScore += totalScore;
        
        // 步骤14：更新连续消除计数
        const formationType = this.getFormationTypeForLine(lines[0]);
        this.updateConsecutiveEliminations(formationType);
        
        // 步骤15：触发连续升级技能检查
        this.checkContinuousUpgrade(formationType);
    }
    
    // 显示效果加成
    showEffectBonus(effectType, effectName, bonus) {
        const colors = {
            'skill': '#4fc3f7',
            'item': '#ff9800',
            'accessory': '#9c27b0'
        };
        
        const effect = document.createElement('div');
        effect.className = `${effectType}-effect`;
        effect.style.cssText = `
            position: fixed;
            top: ${40 + (Object.keys(this.currentTurnEffects).length * 30)}%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${colors[effectType]};
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(${parseInt(colors[effectType].slice(1, 3), 16)}, ${parseInt(colors[effectType].slice(3, 5), 16)}, ${parseInt(colors[effectType].slice(5, 7), 16)}, 0.8);
            opacity: 0;
            z-index: 1000;
            pointer-events: none;
            animation: floatUp 2s ease-out forwards;
        `;
        effect.textContent = `${effectName}: +${bonus}`;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }
    
    // 触发铁索连环技能
    triggerIronChain(eliminatedCells) {
        for (const skill of this.skillSlots) {
            if (skill && skill.id === 'ironChain' && skill.onElimination) {
                const additionalEliminations = skill.onElimination(this, eliminatedCells);
                // 将额外消除的棋子加入集合
                for (const pos of additionalEliminations) {
                    eliminatedCells.add(pos);
                }
                break;
            }
        }
    }
    
    // 更新连续消除计数
    updateConsecutiveEliminations(formationType) {
        // 重置其他类型的计数
        for (const key in this.consecutiveEliminations) {
            if (key !== formationType) {
                this.consecutiveEliminations[key] = 0;
            }
        }
        
        // 增加当前类型的计数
        this.consecutiveEliminations[formationType]++;
    }
    
    // 检查连续升级技能
    checkContinuousUpgrade(formationType) {
        if (formationType === 'horizontal' && this.consecutiveEliminations.horizontal >= 2) {
            for (let i = 0; i < this.skillSlots.length; i++) {
                const skill = this.skillSlots[i];
                if (skill && skill.id === 'continuousUpgrade') {
                    this.formations.horizontal++;
                    this.consecutiveEliminations.horizontal = 0;
                    this.updateUI();
                    alert('连续升级触发：横向阵型等级+1！');
                    break;
                }
            }
        }
    }
    
    // 结算经济产出效果
    triggerEconomicEffects() {
        let moneyGained = 0;
        
        // 电镀牌效果
        for (const item of this.itemSlots) {
            if (item && item.onTurnEnd) {
                const result = item.onTurnEnd(this);
                if (result && result.money) {
                    moneyGained += result.money;
                }
            }
        }
        
        // 饰品经济效果
        for (const accessory of this.accessorySlots) {
            if (accessory && accessory.onTurnEnd) {
                const result = accessory.onTurnEnd(this);
                if (result && result.money) {
                    moneyGained += result.money;
                }
            }
        }
        
        if (moneyGained > 0) {
            this.money += moneyGained;
            this.showMoneyEffect(moneyGained);
        }
    }
    
    // 显示金钱特效
    showMoneyEffect(amount) {
        const effect = document.createElement('div');
        effect.className = 'money-effect';
        effect.style.cssText = `
            position: fixed;
            top: 60%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
            opacity: 0;
            z-index: 1000;
            pointer-events: none;
            animation: floatUp 2s ease-out forwards;
        `;
        effect.textContent = `金币 +${amount}`;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }
    
    // 结算阵型升级效果
    triggerFormationUpgradeEffects() {
        // 这里可以添加其他阵型升级效果
        // 目前已经在checkContinuousUpgrade中处理了连续升级
    }
    
    eliminateCell(row, col) {
        this.board[row][col] = { type: 'empty', turns: 0 };
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.remove('player', 'ai');
        cellElement.classList.add('eliminated');
        
        // 动画结束后移除类
        setTimeout(() => {
            cellElement.classList.remove('eliminated');
        }, 500);
    }
    
    // 修复的getAdjacentCells函数
    getAdjacentCells(line) {
        const adjacent = [];
        
        for (const [row, col] of line) {
            // 检查所有8个方向
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                
                if (this.isValidPosition(newRow, newCol)) {
                    // 检查是否已经在line中
                    let inLine = false;
                    for (const [r, c] of line) {
                        if (r === newRow && c === newCol) {
                            inLine = true;
                            break;
                        }
                    }
                    
                    if (!inLine) {
                        // 检查是否已经在adjacent中
                        let alreadyAdded = false;
                        for (const [r, c] of adjacent) {
                            if (r === newRow && c === newCol) {
                                alreadyAdded = true;
                                break;
                            }
                        }
                        
                        if (!alreadyAdded) {
                            adjacent.push([newRow, newCol]);
                        }
                    }
                }
            }
        }
        
        return adjacent;
    }
    
    getFormationLevelForLine(line) {
        const formationType = this.getFormationTypeForLine(line);
        switch (formationType) {
            case 'horizontal':
                return this.formations.horizontal;
            case 'vertical':
                return this.formations.vertical;
            case 'diagonalLeft':
                return this.formations.diagonalLeft;
            case 'diagonalRight':
                return this.formations.diagonalRight;
            default:
                return 1;
        }
    }
    
    getFormationTypeForLine(line) {
        const [r1, c1] = line[0];
        const [r2, c2] = line[1];
        
        if (r1 === r2) return 'horizontal';
        if (c1 === c2) return 'vertical';
        if (r2 - r1 === c2 - c1) return 'diagonalLeft';
        return 'diagonalRight';
    }
    
    applyScoreModifiers(baseScore, eliminatedCount, lines) {
        let finalScore = baseScore;
        let breakdown = `基础: ${eliminatedCount} × ${10 * this.getFormationLevelForLine(lines[0])}`;
        
        // 应用技能牌效果
        for (const skill of this.skillSlots) {
            if (skill && skill.onScore) {
                const result = skill.onScore(finalScore, eliminatedCount, lines);
                finalScore = result.score;
                if (result.breakdown) {
                    breakdown += `\n${result.breakdown}`;
                }
            }
        }
        
        // 应用道具牌效果
        for (const item of this.itemSlots) {
            if (item && item.onScore) {
                const result = item.onScore(finalScore, eliminatedCount, lines);
                finalScore = result.score;
                if (result.breakdown) {
                    breakdown += `\n${result.breakdown}`;
                }
            }
        }
        
        // 应用饰品效果
        for (const accessory of this.accessorySlots) {
            if (accessory && accessory.onScore) {
                const result = accessory.onScore(finalScore, eliminatedCount, lines);
                finalScore = result.score;
                if (result.breakdown) {
                    breakdown += `\n${result.breakdown}`;
                }
            }
        }
        
        // 更新特效显示
        this.updateComboEffect(finalScore, breakdown);
        
        return finalScore;
    }
    
    showComboEffect() {
        const effect = document.getElementById('combo-effect');
        effect.style.display = 'block';
    }
    
    updateComboEffect(score, breakdown) {
        const comboText = document.getElementById('combo-text');
        const comboBreakdown = document.getElementById('combo-breakdown');
        
        comboText.textContent = `+${score}`;
        comboBreakdown.textContent = breakdown;
        
        // 重新触发动画
        const effect = document.getElementById('combo-effect');
        effect.style.animation = 'none';
        void effect.offsetWidth;
        effect.style.animation = 'comboFloat 2s ease-out forwards';
    }
    
    checkAIWin() {
        // 检查AI是否形成五子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'ai') {
                    const aiLines = this.checkLines(row, col, 'ai');
                    if (aiLines.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    endPlayerTurn() {
        this.isPlayerTurn = false;
        this.round++;
        
        // 减少禁止格子的回合计数
        this.updateForbiddenCells();
        
        // 更新回合显示
        this.updateUI();
        
        // AI回合
        setTimeout(() => {
            this.aiMove();
        }, 1000);
    }
    
    updateForbiddenCells() {
        // 每3回合清空一次禁止格子
        if (this.round % 3 === 0) {
            this.forbiddenCells.clear();
            
            // 更新棋盘显示
            const cells = document.querySelectorAll('.board-cell.forbidden');
            cells.forEach(cell => {
                cell.classList.remove('forbidden');
            });
        }
    }
    
    aiMove() {
        // 获取AI落子位置
        const move = this.getAIMove();
        
        if (move) {
            const { row, col } = move;
            const success = this.placePiece(row, col, 'ai');
            
            if (!success) {
                // 如果AI落子失败（被禁止），重新尝试
                this.aiMove();
                return;
            }
            
            // AI落子后检查流程
            // 1. 检查AI是否获胜
            if (this.checkAIWin()) {
                // 检查死者复活技能
                if (!this.checkDeadRevival()) {
                    this.loseGame();
                }
                return;
            }
            
            // 2. 检查防御力场（AI形成四子）
            this.checkDefenseField();
            
            // 3. 切换回玩家回合
            this.isPlayerTurn = true;
            this.updateUI();
        }
    }
    
    getAIMove() {
        // 使用AI策略类
        const aiStrategy = new AIStrategy(this);
        const move = aiStrategy.getBestMove(this.aiDifficulty);
        
        if (move) {
            return move;
        }
        
        // 如果没有找到移动，返回随机移动
        return this.getRandomMove();
    }
    
    getRandomMove() {
        const emptyCells = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'empty' && !this.forbiddenCells.has(`${row},${col}`)) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        return null;
    }
    
    // 使用道具
    useItem(index) {
        if (!this.isPlayerTurn || !this.gameActive) {
            alert('现在不能使用道具！');
            return;
        }
        
        const item = this.itemSlots[index];
        if (!item) return;
        
        // 检查道具类型
        if (this.shouldShowUseButton(item)) {
            if (item.onUse) {
                const shouldDestroy = item.onUse(this);
                if (shouldDestroy) {
                    this.itemSlots[index] = null;
                    this.updateUI();
                    alert(`已使用 ${item.name}`);
                }
            } else {
                // 默认销毁道具
                this.itemSlots[index] = null;
                this.updateUI();
                alert(`已使用 ${item.name}`);
            }
        } else {
            alert('这个道具不能主动使用！');
        }
    }
    
    winGame(isSkillTriggered = false) {
        this.gameActive = false;
        
        // 计算奖金
        const remainingPieces = this.playerPieces - this.usedPieces;
        const baseMoney = (20 - this.level) * 5 * 30 / (30 - remainingPieces);
        const finalMoney = Math.floor(baseMoney);
        
        this.money += finalMoney;
        
        // 触发饰品胜利效果
        for (const accessory of this.accessorySlots) {
            if (accessory && accessory.onGameWin) {
                accessory.onGameWin(this);
            }
        }
        
        if (isSkillTriggered) {
            // 技能触发的胜利，直接进入商店
            this.openShop();
            return;
        }
        
        // 正常胜利流程
        document.getElementById('game-over-title').textContent = '胜利!';
        document.getElementById('game-over-message').textContent = `恭喜通过第${this.level}关!`;
        document.getElementById('final-score').textContent = this.currentScore;
        document.getElementById('final-money').textContent = finalMoney;
        document.getElementById('final-pieces').textContent = remainingPieces;
        
        document.getElementById('next-level-btn').style.display = 'none';
        document.getElementById('restart-btn').style.display = 'block';
        document.getElementById('restart-btn').textContent = '确定';
        document.getElementById('restart-btn').id = 'confirm-victory-btn';
        
        document.getElementById('game-over-modal').classList.add('active');
        
        // 播放胜利音效
        this.playSound('skill-sound');
        
        // 标记需要显示商店
        this.shouldShowShopAfterWin = true;
        this.isShopFromVictory = true;
    }
    
    loseGame() {
        this.gameActive = false;
        
        // 显示失败模态框
        document.getElementById('game-over-title').textContent = '游戏结束';
        document.getElementById('game-over-message').textContent = 'AI形成了五子连线!';
        document.getElementById('final-score').textContent = this.currentScore;
        document.getElementById('final-money').textContent = 0;
        document.getElementById('final-pieces').textContent = this.playerPieces - this.usedPieces;
        
        // 显示重新开始按钮
        document.getElementById('next-level-btn').style.display = 'none';
        document.getElementById('restart-btn').style.display = 'block';
        document.getElementById('restart-btn').textContent = '重新开始';
        document.getElementById('restart-btn').id = 'restart-btn';
        
        document.getElementById('game-over-modal').classList.add('active');
    }
    
    nextLevel() {
        this.level++;
        this.currentGame++;
        
        if (this.level > this.maxLevel) {
            alert('恭喜通关游戏!');
            this.restartGame();
            return;
        }
        
        // 更新目标积分
        this.targetScore = 70 * Math.pow(2, this.level - 1);
        
        // 重置游戏状态但保留金钱和物品
        this.currentScore = 0;
        this.round = 0;
        this.usedPieces = 0;
        this.isPlayerTurn = true;
        this.gameActive = true;
        this.forbiddenCells.clear();
        
        // 重置连续消除计数
        this.consecutiveEliminations = {
            horizontal: 0,
            vertical: 0,
            diagonalLeft: 0,
            diagonalRight: 0
        };
        
        // 重置回合效果
        this.currentTurnEffects = {
            singlePieceModifiers: [],
            totalScoreModifiers: []
        };
        
        // 重置棋盘
        this.createBoard();
        
        // 触发饰品游戏开始效果
        for (const accessory of this.accessorySlots) {
            if (accessory && accessory.onGameStart) {
                accessory.onGameStart(this);
            }
        }
        
        // 关闭所有模态框
        this.closeShop();
        this.closeGameOver();
        
        // 重置商店标志
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
        
        // 更新UI
        this.updateUI();
    }
    
    restartGame() {
        // 重置游戏
        this.level = 1;
        this.currentGame = 1;
        this.targetScore = 70;
        this.currentScore = 0;
        this.money = 0;
        this.round = 0;
        this.usedPieces = 0;
        this.isPlayerTurn = true;
        this.gameActive = true;
        this.forbiddenCells.clear();
        
        // 重置阵型等级
        this.formations = {
            horizontal: 1,
            vertical: 1,
            diagonalLeft: 1,
            diagonalRight: 1
        };
        
        // 重置连续消除计数
        this.consecutiveEliminations = {
            horizontal: 0,
            vertical: 0,
            diagonalLeft: 0,
            diagonalRight: 0
        };
        
        // 重置回合效果
        this.currentTurnEffects = {
            singlePieceModifiers: [],
            totalScoreModifiers: []
        };
        
        // 清空槽位
        this.skillSlots = Array(6).fill(null);
        this.itemSlots = Array(4).fill(null);
        this.accessorySlots = Array(2).fill(null);
        
        // 重置棋盘
        this.createBoard();
        
        // 关闭模态框
        this.closeGameOver();
        this.closeShop();
        
        // 更新UI
        this.updateUI();
        
        // 隐藏开始菜单
        document.getElementById('start-menu-modal').classList.remove('active');
        
        // 重置商店标志
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
        
        // 重新抽取初始技能
        this.showInitialSkillSelection();
    }
    
    showInitialSkillSelection() {
        // 生成3张随机技能牌
        const skillKeys = Object.keys(skillCards);
        const selectedSkills = [];
        
        // 随机选择3个不同的技能
        while (selectedSkills.length < 3) {
            const randomKey = skillKeys[Math.floor(Math.random() * skillKeys.length)];
            if (!selectedSkills.includes(randomKey)) {
                selectedSkills.push(randomKey);
            }
        }
        
        // 显示技能选择模态框
        const skillSelectElement = document.getElementById('skill-select-modal');
        const skillOptionsElement = document.getElementById('skill-options');
        
        skillOptionsElement.innerHTML = '';
        
        selectedSkills.forEach((skillKey, index) => {
            const skill = skillCards[skillKey];
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-option';
            skillElement.dataset.index = index;
            
            skillElement.innerHTML = `
                <div class="skill-option-icon">${skill.icon}</div>
                <h4>${skill.name}</h4>
                <p class="skill-option-description">${skill.description}</p>
            `;
            
            skillElement.addEventListener('click', () => {
                this.selectInitialSkill(skill);
                document.getElementById('skill-select-modal').classList.remove('active');
            });
            
            skillOptionsElement.appendChild(skillElement);
        });
        
        skillSelectElement.classList.add('active');
    }
    
    selectInitialSkill(skill) {
        // 将选择的技能放入第一个空槽位
        for (let i = 0; i < this.skillSlots.length; i++) {
            if (!this.skillSlots[i]) {
                this.skillSlots[i] = { ...skill };
                this.updateUI();
                break;
            }
        }
        
        // 开始游戏
        this.gameActive = true;
        console.log(`已选择初始技能: ${skill.name}`);
    }
    
    showSettings() {
        alert('设置功能开发中...');
    }
    
    showHelp() {
        alert(`游戏规则：
        1. 五子棋规则下棋
        2. AI凑成5子游戏立即失败
        3. 玩家凑成5子，5子立即消除，消除的5子的紧邻格内如有敌方棋子一同消除并获得积分
        4. 在棋子（30枚）耗尽前达到积分要求，就能顺利过关`);
    }
    
    shareGame() {
        const seed = this.generateSeed();
        alert(`分享游戏种子: ${seed}\n复制此种子可以与朋友分享相同的游戏内容。`);
    }
    
    generateSeed() {
        return Math.floor(Math.random() * 1000000).toString();
    }
    
    exitGame() {
        if (confirm('确定要退出游戏吗？')) {
            window.close();
        }
    }
    
    openShop() {
        if (this.gameActive) {
            alert('游戏进行中不能进入商店！');
            return;
        }
        
        // 如果是胜利后打开商店，确保是从胜利模态框点击确定后进来的
        if (this.isShopFromVictory) {
            document.getElementById('shop-title').textContent = `第${this.level}关商店`;
        } else {
            document.getElementById('shop-title').textContent = '商店';
        }
        
        document.getElementById('shop-modal').classList.add('active');
        this.playSound('shop-sound');
        
        // 渲染商店商品
        if (shop) {
            shop.render();
        }
    }
    
    closeShop() {
        document.getElementById('shop-modal').classList.remove('active');
        
        // 如果商店是从胜利后打开的，关闭后不自动进入下一关
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
    }
    
    showSlotDetail(type, index) {
        let item;
        let slotArray;
        
        switch (type) {
            case 'skill':
                slotArray = this.skillSlots;
                break;
            case 'item':
                slotArray = this.itemSlots;
                break;
            case 'accessory':
                slotArray = this.accessorySlots;
                break;
        }
        
        item = slotArray[index];
        
        if (!item) {
            alert('空的槽位');
            return;
        }
        
        // 显示详情
        document.getElementById('detail-title').textContent = '详情';
        document.getElementById('detail-icon').textContent = item.icon;
        document.getElementById('detail-name').textContent = item.name;
        document.getElementById('detail-description').textContent = item.description;
        document.getElementById('detail-price').textContent = Math.floor(item.price * 0.7);
        document.getElementById('detail-type').textContent = 
            type === 'skill' ? '技能牌' : 
            type === 'item' ? '道具牌' : '饰品';
        
        // 设置按钮事件
        const buyBtn = document.getElementById('buy-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');
        
        buyBtn.style.display = 'none';
        sellBtn.style.display = 'block';
        
        sellBtn.onclick = () => {
            // 出售物品
            this.money += Math.floor(item.price * 0.7);
            slotArray[index] = null;
            this.updateUI();
            this.closeDetail();
            alert(`已出售 ${item.name}，获得 ${Math.floor(item.price * 0.7)} 金币`);
        };
        
        document.getElementById('detail-modal').classList.add('active');
    }
    
    closeDetail() {
        document.getElementById('detail-modal').classList.remove('active');
    }
    
    closeGameOver() {
        document.getElementById('game-over-modal').classList.remove('active');
        
        // 恢复按钮ID和文本
        const confirmBtn = document.getElementById('confirm-victory-btn');
        if (confirmBtn) {
            confirmBtn.id = 'restart-btn';
        }
    }
    
    playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('音频播放失败:', e));
        }
    }
    
    bindEvents() {
        // 开始菜单按钮
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('settings-menu-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('help-menu-btn').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.getElementById('exit-menu-btn').addEventListener('click', () => {
            this.exitGame();
        });
        
        // 按钮事件
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('share-btn').addEventListener('click', () => this.shareGame());
        document.getElementById('exit-btn').addEventListener('click', () => this.exitGame());
        
        // 商店事件
        document.getElementById('shop-btn').addEventListener('click', () => this.openShop());
        
        // 模态框关闭事件
        document.getElementById('close-shop').addEventListener('click', () => this.closeShop());
        document.getElementById('close-detail').addEventListener('click', () => this.closeDetail());
        document.getElementById('close-game-over').addEventListener('click', () => this.closeGameOver());
        
        // 游戏结束按钮 - 动态绑定
        document.getElementById('game-over-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-victory-btn') {
                // 胜利后点击确定，关闭结算弹窗，打开商店
                this.closeGameOver();
                this.openShop();
            } else if (e.target.id === 'restart-btn' && !this.shouldShowShopAfterWin) {
                // 失败后点击重新开始，返回开始菜单
                this.closeGameOver();
                document.getElementById('start-menu-modal').classList.add('active');
            }
        });
        
        // 商店中的下一关按钮
        document.getElementById('next-level-shop-btn').addEventListener('click', () => {
            this.closeShop();
            this.nextLevel();
        });
        
        // 添加全局拖拽事件阻止默认行为
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    }
}

// 初始化游戏
let game;
let shop;

// 游戏初始化函数
function initGame() {
    game = new Game();
    shop = new Shop(game);
    
    // 绑定商店事件
    document.getElementById('reroll-btn').addEventListener('click', () => {
        if (shop) shop.reroll();
    });
    
    document.getElementById('upgrade-shop-btn').addEventListener('click', () => {
        if (shop) shop.upgrade();
    });
    
    document.getElementById('copy-seed-btn').addEventListener('click', () => {
        if (shop) {
            navigator.clipboard.writeText(shop.seed)
                .then(() => alert('种子已复制到剪贴板!'))
                .catch(() => alert('复制失败，请手动复制: ' + shop.seed));
        }
    });
    
    // 添加商店背景点击关闭事件
    document.getElementById('shop-modal').addEventListener('click', (e) => {
        if (e.target.id === 'shop-modal') {
            game.closeShop();
        }
    });
    
    // 添加技能选择模态框背景点击关闭事件
    document.getElementById('skill-select-modal').addEventListener('click', (e) => {
        if (e.target.id === 'skill-select-modal') {
            // 不允许关闭，必须选择技能
        }
    });
    
    // 添加购买按钮事件
    document.getElementById('buy-item-btn').addEventListener('click', () => {
        // 这个事件在shop.js中动态设置
    });
    
    console.log('技能五子棋游戏已初始化!');
}

// 页面加载完成后初始化游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// 导出游戏实例供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}