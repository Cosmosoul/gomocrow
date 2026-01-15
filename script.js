// 游戏状态管理 - 按照新设计文档重构
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
        this.addViewportMeta();
        
        // 阵型等级
        this.formations = {
            horizontal: 1,
            vertical: 1,
            diagonalLeft: 1,
            diagonalRight: 1
        };
        
        // 乌鸦牌槽位（6个）
        this.crowSlots = Array(6).fill(null);
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
        
        // 连续消除计数
        this.consecutiveEliminations = {
            horizontal: 0,
            vertical: 0,
            diagonalLeft: 0,
            diagonalRight: 0
        };
        
        // 当前回合效果
        this.currentTurnEffects = {
            singlePieceModifiers: [],
            totalScoreModifiers: [],
            pieceModifiers: [],
            moneyModifiers: [],
            formationModifiers: []
        };
        
        // 全局效果
        this.globalScoreMultiplier = 1.0;
        this.aiWinRequirement = 5;
        this.nextEliminationGuaranteed = false;
        this.aiSkipNextTurn = false;
        
        // 状态标志
        this.isMarkingPiece = false;
        this.markedPiece = null;
        this.isSelectingTarget = null;
        this.lastTurnHadElimination = false;
        
        // 绑定事件
        this.bindEvents();
    }
    // 在Game类中添加方法
addViewportMeta() {
    // 确保视口设置正确
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        document.head.appendChild(metaViewport);
    }
    
    // 设置视口参数
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // 添加全屏支持
    this.enableFullScreen();
}

enableFullScreen() {
    // 添加全屏按钮
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 999;
        background: rgba(20, 40, 80, 0.8);
        color: white;
        border: 2px solid #2a4d8f;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
        cursor: pointer;
        display: none;
    `;
    
    document.body.appendChild(fullscreenBtn);
    
    // 检测是否为移动设备
    if (this.isMobileDevice()) {
        fullscreenBtn.style.display = 'block';
        
        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullScreen();
        });
    }
    
    // 监听全屏变化
    document.addEventListener('fullscreenchange', () => {
        fullscreenBtn.innerHTML = document.fullscreenElement ? 
            '<i class="fas fa-compress"></i>' : 
            '<i class="fas fa-expand"></i>';
    });
}

isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`全屏请求失败: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
    
    init() {
        this.createBoard();
        this.updateUI();
        
        // 显示初始乌鸦牌选择
        this.showInitialCrowSelection();
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
                this.board[row][col] = { type: 'empty', turns: 0, effects: [] };
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
        // 更新乌鸦牌槽位
        const crowSlotsElement = document.getElementById('crow-slots');
        crowSlotsElement.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = `slot ${this.crowSlots[i] ? 'filled' : 'empty'}`;
            slot.dataset.index = i;
            slot.dataset.type = 'crow';
            
            // 添加拖拽属性
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e, 'crow', i));
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', (e) => this.handleDrop(e, 'crow', i));
            slot.addEventListener('dragend', this.handleDragEnd.bind(this));
            slot.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            if (this.crowSlots[i]) {
                const crow = this.crowSlots[i];
                slot.innerHTML = `
                    <div class="slot-icon">${crow.icon}</div>
                    <div class="slot-name">${crow.name}</div>
                    ${crow.cooldown > 0 ? `<div class="slot-cooldown">${crow.cooldown}</div>` : ''}
                    ${crow.coatingEffects ? '<div class="coating-indicator">镀</div>' : ''}
                `;
                slot.title = crow.description;
            } else {
                slot.innerHTML = '<div class="empty-icon">+</div><div class="empty-text">空乌鸦槽</div>';
            }
            
            slot.addEventListener('click', () => this.showSlotDetail('crow', i));
            crowSlotsElement.appendChild(slot);
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
                
                if (this.shouldShowUseButton(item)) {
                    const useBtn = slot.querySelector('.slot-use-btn');
                    useBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.useItem(i);
                    });
                    
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
    
    shouldShowUseButton(item) {
        return item && (item.subtype === 'spell' || item.subtype === 'trap' || item.subtype === 'upgrade');
    }
    
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
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging', 'drag-over');
        e.currentTarget.style.opacity = '1';
    }
    
    handleDrop(e, targetType, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!dragData) return;
            
            const { type: sourceType, index: sourceIndex } = dragData;
            
            if (sourceType !== targetType) {
                this.showMessage('不同类型的卡牌不能互换位置！');
                return;
            }
            
            this.swapSlots(sourceType, sourceIndex, targetIndex);
            this.updateUI();
        } catch (error) {
            console.error('拖拽错误:', error);
        }
    }
    
    getSlotArray(type) {
        switch (type) {
            case 'crow':
                return this.crowSlots;
            case 'item':
                return this.itemSlots;
            case 'accessory':
                return this.accessorySlots;
            default:
                return null;
        }
    }
    
    swapSlots(type, index1, index2) {
        if (index1 === index2) return;
        
        const array = this.getSlotArray(type);
        if (!array) return;
        
        [array[index1], array[index2]] = [array[index2], array[index1]];
    }
    
    async handleCellClick(row, col) {
        if (!this.gameActive || !this.isPlayerTurn) return;
        
        // 检查是否在选择目标
        if (this.isSelectingTarget) {
            this.handleTargetSelection(row, col);
            return;
        }
        
        // 检查是否在标记棋子
        if (this.isMarkingPiece) {
            this.handlePieceMarking(row, col);
            return;
        }
        
        const cell = this.board[row][col];
        if (cell.type !== 'empty') return;
        
        // 1. 放置玩家棋子
        const success = this.placePiece(row, col, 'player');
        if (!success) return;
        
        this.usedPieces++;
        this.playSound('place-piece-sound');
        
        // 2. 触发移动前的效果（乌鸦牌）
        this.triggerCrowEffectsBeforeMove(row, col);
        
        // 3. 检查所有可触发的被动效果
        this.triggerAllPassiveEffects('playerMove', { row, col });
        
        // 4. 检查AI是否连成五子（失败条件优先）
        if (this.checkAIWin()) {
            // 检查死者复活效果
            if (!this.checkRevivalEffect()) {
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
            await this.eliminatePlayerLine(playerLines);
            
            // 7. 消除后检查是否胜利
            if (this.currentScore >= this.targetScore) {
                // 8. 结算经济产出效果
                this.triggerEconomicEffects();
                
                // 9. 结算阵型升级效果
                this.triggerFormationUpgradeEffects();
                
                this.winGame();
            } else {
                this.triggerEconomicEffects();
                this.triggerFormationUpgradeEffects();
                this.endPlayerTurn();
            }
        } else {
            this.triggerEconomicEffects();
            this.triggerFormationUpgradeEffects();
            this.endPlayerTurn();
        }
        
        this.updateUI();
    }
    
    // 触发乌鸦牌移动前效果
    triggerCrowEffectsBeforeMove(row, col) {
        for (let i = 0; i < this.crowSlots.length; i++) {
            const crow = this.crowSlots[i];
            if (crow && crow.onPlayerMove) {
                const result = crow.onPlayerMove(this, { row, col, crowIndex: i });
                if (result && result.destroy) {
                    this.crowSlots[i] = null;
                    this.showMessage(`${crow.name}已销毁: ${result.description}`);
                }
            }
        }
    }
    
    // 触发所有被动效果
    triggerAllPassiveEffects(triggerType, data = {}) {
        this.currentTurnEffects = {
            singlePieceModifiers: [],
            totalScoreModifiers: [],
            pieceModifiers: [],
            moneyModifiers: [],
            formationModifiers: []
        };
        
        // 按照优先级：道具牌 -> 乌鸦牌 -> 饰品
        // 道具牌（从左到右）
        for (let i = 0; i < this.itemSlots.length; i++) {
            const item = this.itemSlots[i];
            if (item && item[triggerType]) {
                const result = item[triggerType](this, data);
                this.processEffectResult(result, 'item', i);
            }
        }
        
        // 乌鸦牌（从左到右）
        for (let i = 0; i < this.crowSlots.length; i++) {
            const crow = this.crowSlots[i];
            if (crow && crow[triggerType]) {
                const result = crow[triggerType](this, data);
                this.processEffectResult(result, 'crow', i);
            }
        }
        
        // 饰品（先上后下）
        for (let i = 0; i < this.accessorySlots.length; i++) {
            const accessory = this.accessorySlots[i];
            if (accessory && accessory[triggerType]) {
                const result = accessory[triggerType](this, data);
                this.processEffectResult(result, 'accessory', i);
            }
        }
    }
    
    processEffectResult(result, effectType, index) {
        if (!result) return;
        
        if (result.scoreModifiers) {
            result.scoreModifiers.forEach(modifier => {
                if (modifier.type === 'addition_per_piece') {
                    this.currentTurnEffects.singlePieceModifiers.push({
                        source: effectType,
                        index: index,
                        value: modifier.value,
                        description: modifier.description
                    });
                } else if (modifier.type === 'addition') {
                    this.currentTurnEffects.totalScoreModifiers.push({
                        source: effectType,
                        index: index,
                        value: modifier.value,
                        description: modifier.description
                    });
                } else if (modifier.type === 'multiplier') {
                    this.currentTurnEffects.totalScoreModifiers.push({
                        source: effectType,
                        index: index,
                        value: modifier.value,
                        description: modifier.description,
                        isMultiplier: true
                    });
                }
            });
        }
        
        if (result.pieceModifiers) {
            result.pieceModifiers.forEach(modifier => {
                this.currentTurnEffects.pieceModifiers.push({
                    source: effectType,
                    index: index,
                    value: modifier.value,
                    description: modifier.description
                });
            });
        }
        
        if (result.moneyModifiers) {
            result.moneyModifiers.forEach(modifier => {
                this.currentTurnEffects.moneyModifiers.push({
                    source: effectType,
                    index: index,
                    value: modifier.value,
                    description: modifier.description
                });
            });
        }
        
        if (result.formationModifiers) {
            result.formationModifiers.forEach(modifier => {
                this.currentTurnEffects.formationModifiers.push({
                    source: effectType,
                    index: index,
                    formation: modifier.formation,
                    value: modifier.value,
                    description: modifier.description
                });
            });
        }
        
        if (result.destroy) {
            this.destroyItem(result.destroy.type, result.destroy.index, result.destroy.reason);
        }
    }
    
    checkRevivalEffect() {
        for (let i = 0; i < this.crowSlots.length; i++) {
            const crow = this.crowSlots[i];
            if (crow && crow.id === '0058') { // 死者复活乌鸦
                this.currentScore = this.targetScore;
                this.crowSlots[i] = null;
                this.showMessage('死者复活触发：本局视为胜利！');
                this.winGame(true);
                return true;
            }
        }
        return false;
    }
    
    // 修复版 eliminatePlayerLine 函数
async eliminatePlayerLine(lines) {
    const eliminatedCells = new Set();
    
    // 步骤1：收集所有要消除的棋子（基础五子）
    for (const line of lines) {
        for (const [row, col] of line) {
            eliminatedCells.add(`${row},${col}`);
        }
    }
    
    // 步骤2：添加紧邻的敌方棋子
    const adjacentCells = this.getAdjacentCells(lines);
    for (const [row, col] of adjacentCells) {
        if (this.board[row][col].type === 'ai') {
            eliminatedCells.add(`${row},${col}`);
        }
    }
    
    // 步骤3：确定阵型等级
    const formationLevel = this.getFormationLevelForLine(lines[0]);
    const formationType = this.getFormationTypeForLine(lines[0]);
    
    // 步骤4：播放消除音效
    this.playSound('eliminate-sound');
    
    // 步骤5：先触发消除效果，收集所有加成
    this.triggerAllPassiveEffects('elimination', {
        eliminatedCells: eliminatedCells,
        pieceCount: eliminatedCells.size,
        formationType: formationType
    });
    
    // 步骤6：计算单棋子基础积分
    let baseScorePerPiece = 10 * formationLevel;
    
    // 步骤7：应用单棋子加成（修正这里）
    this.currentTurnEffects.singlePieceModifiers.forEach(modifier => {
        // 强壮乌鸦的 modifier.value 应该是 15
        baseScorePerPiece += modifier.value;  // 每子增加固定分数
        console.log(`应用单棋子加成: ${modifier.description}, 值: ${modifier.value}, 新baseScorePerPiece: ${baseScorePerPiece}`);
    });
    
    // 步骤8：播放消除动画并计算基础积分
    const eliminatedArray = Array.from(eliminatedCells);
    let baseScore = 0;
    
    // 显示每个棋子的消除分数
    for (const pos of eliminatedArray) {
        const [row, col] = pos.split(',').map(Number);
        this.eliminateCell(row, col);
        
        // 显示单个棋子分数特效
        await this.showSinglePieceEffect(row, col, baseScorePerPiece);
        baseScore += baseScorePerPiece;
    }
    
    // 步骤9：应用总积分效果
    let finalScore = this.applyAllScoreEffects(baseScore, eliminatedArray.length);
    
    // 步骤10：更新连续消除计数
    this.updateConsecutiveEliminations(formationType);
    
    // 步骤11：累加积分
    this.currentScore += finalScore;
    
    // 步骤12：显示组合效果
    this.updateComboEffect(finalScore, this.scoreBreakdown);
    
    // 步骤13：应用消除后效果
    this.applyPostEliminationEffects();
    
    this.lastTurnHadElimination = true;
    
    // 步骤14：重置当前回合效果
    this.currentTurnEffects = {
        singlePieceModifiers: [],
        totalScoreModifiers: [],
        pieceModifiers: [],
        moneyModifiers: [],
        formationModifiers: []
    };
    
    return finalScore;
}

// 新增：显示单个棋子效果
async showSinglePieceEffect(row, col, score) {
    return new Promise((resolve) => {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const rect = cellElement.getBoundingClientRect();
        
        const effect = document.createElement('div');
        effect.className = 'single-piece-effect';
        effect.textContent = `+${score}`;
        effect.style.cssText = `
            position: absolute;
            left: ${rect.left + rect.width/2}px;
            top: ${rect.top}px;
            color: #ffd700;
            font-weight: bold;
            font-size: 18px;
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
            opacity: 0;
            transform: translate(-50%, 0);
            animation: floatUp 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
            resolve();
        }, 500);
    });
}
    
    getAdjacentAICells(positions) {
        const additional = new Set();
        const checked = new Set(positions);
        
        for (const pos of positions) {
            const [row, col] = pos.split(',').map(Number);
            
            // 检查8个方向
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                const newPos = `${newRow},${newCol}`;
                
                if (!checked.has(newPos) && !additional.has(newPos) &&
                    this.isValidPosition(newRow, newCol) &&
                    this.board[newRow][newCol].type === 'ai') {
                    additional.add(newPos);
                }
            }
        }
        
        return Array.from(additional);
    }
    
    // 在 applyAllScoreEffects 函数中添加调试信息
applyAllScoreEffects(baseScore, pieceCount) {
    let finalScore = baseScore;
    this.scoreBreakdown = `基础: ${pieceCount} × ${baseScore / pieceCount}`;
    
    console.log(`applyAllScoreEffects - 基础积分: ${baseScore}, 棋子数: ${pieceCount}`);
    
    // 应用总积分加成
    this.currentTurnEffects.totalScoreModifiers.forEach(modifier => {
        console.log(`处理加成: ${modifier.description}, 值: ${modifier.value}, 是否乘数: ${modifier.isMultiplier}`);
        
        if (modifier.isMultiplier) {
            const before = finalScore;
            finalScore = Math.floor(finalScore * modifier.value);
            const increase = finalScore - before;
            if (increase > 0) {
                this.scoreBreakdown += `\n${modifier.description}: ×${modifier.value} (+${increase})`;
            }
        } else {
            finalScore += modifier.value;
            this.scoreBreakdown += `\n${modifier.description}: +${modifier.value}`;
        }
    });
    
    // 应用全局倍数
    if (this.globalScoreMultiplier !== 1) {
        const beforeGlobal = finalScore;
        finalScore = Math.floor(finalScore * this.globalScoreMultiplier);
        const globalIncrease = finalScore - beforeGlobal;
        if (globalIncrease > 0) {
            this.scoreBreakdown += `\n全局效果: ×${this.globalScoreMultiplier} (+${globalIncrease})`;
        }
    }
    
    console.log(`最终积分: ${finalScore}`);
    return finalScore;
}
    
    applyPostEliminationEffects() {
        // 应用棋子恢复效果
        this.currentTurnEffects.pieceModifiers.forEach(modifier => {
            const restored = Math.min(modifier.value, 30 - this.playerPieces);
            this.playerPieces += restored;
            if (restored > 0) {
                this.showMessage(`${modifier.description}: 恢复${restored}棋子`);
            }
        });
        
        // 应用阵型升级效果
        this.currentTurnEffects.formationModifiers.forEach(modifier => {
            if (this.formations[modifier.formation]) {
                this.formations[modifier.formation] += modifier.value;
                this.showMessage(modifier.description);
            }
        });
        
        // 应用金钱效果
        this.currentTurnEffects.moneyModifiers.forEach(modifier => {
            this.money += modifier.value;
            this.showMessage(`${modifier.description}: +${modifier.value}金币`);
        });
    }
    
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
            
            cells.forEach((pos, index) => {
                const [row, col] = pos.split(',').map(Number);
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const rect = cellElement.getBoundingClientRect();
                
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
                            
                            this.updateComboEffect(totalScore, `基础: ${completedAnimations} × ${baseScorePerPiece}`);
                            
                            setTimeout(() => {
                                scoreEffect.remove();
                                
                                if (completedAnimations === cells.length) {
                                    effectsContainer.remove();
                                    resolve(totalScore);
                                }
                            }, 500);
                        }, 500);
                    }, 300);
                }, index * 100);
            });
        });
    }
    
    updateConsecutiveEliminations(formationType) {
        for (const key in this.consecutiveEliminations) {
            if (key !== formationType) {
                this.consecutiveEliminations[key] = 0;
            }
        }
        
        this.consecutiveEliminations[formationType]++;
    }
    
    checkContinuousUpgrade(formationType) {
        if (formationType === 'horizontal' && this.consecutiveEliminations.horizontal >= 2) {
            for (let i = 0; i < this.crowSlots.length; i++) {
                const crow = this.crowSlots[i];
                if (crow && crow.id === '0011') { // 连续升级乌鸦
                    this.formations.horizontal++;
                    this.consecutiveEliminations.horizontal = 0;
                    this.updateUI();
                    this.showMessage('连续升级触发：横向阵型等级+1！');
                    break;
                }
            }
        }
    }
    
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
    
    triggerFormationUpgradeEffects() {
        // 阵型升级效果已经在消除后应用
    }
    
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
        }, 500);
    }
    
    placePiece(row, col, type) {
        if (type === 'ai' && this.forbiddenCells.has(`${row},${col}`)) {
            return false;
        }
        
        this.board[row][col] = { type, turns: 0, effects: [] };
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.remove('player', 'ai', 'forbidden');
        cellElement.classList.add(type);
        
        if (type === 'player') {
            this.forbiddenCells.add(`${row},${col}`);
        }
        
        return true;
    }
    
    eliminateCell(row, col) {
        this.board[row][col] = { type: 'empty', turns: 0, effects: [] };
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.remove('player', 'ai');
        cellElement.classList.add('eliminated');
        
        setTimeout(() => {
            cellElement.classList.remove('eliminated');
        }, 500);
    }
    
    getAdjacentCells(line) {
        const adjacent = [];
        const lineSet = new Set(line.map(([r, c]) => `${r},${c}`));
        
        for (const [row, col] of line) {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                const pos = `${newRow},${newCol}`;
                
                if (this.isValidPosition(newRow, newCol) && 
                    !lineSet.has(pos) &&
                    !adjacent.some(([r, c]) => r === newRow && c === newCol)) {
                    adjacent.push([newRow, newCol]);
                }
            }
        }
        
        return adjacent;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    checkLines(row, col, type, requiredCount = 5) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        const lines = [];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            let cells = [[row, col]];
            
            // 正向检查
            for (let i = 1; i < requiredCount; i++) {
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
            for (let i = 1; i < requiredCount; i++) {
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
            
            if (count >= requiredCount) {
                lines.push(cells.slice(0, requiredCount));
            }
        }
        
        return lines;
    }
    
    getFormationLevelForLine(line) {
        const formationType = this.getFormationTypeForLine(line);
        return this.formations[formationType] || 1;
    }
    
    getFormationTypeForLine(line) {
        const [r1, c1] = line[0];
        const [r2, c2] = line[1];
        
        if (r1 === r2) return 'horizontal';
        if (c1 === c2) return 'vertical';
        if (r2 - r1 === c2 - c1) return 'diagonalLeft';
        return 'diagonalRight';
    }
    
    updateComboEffect(score, breakdown) {
        const comboText = document.getElementById('combo-text');
        const comboBreakdown = document.getElementById('combo-breakdown');
        
        comboText.textContent = `+${score}`;
        comboBreakdown.textContent = breakdown;
        
        const effect = document.getElementById('combo-effect');
        effect.style.animation = 'none';
        void effect.offsetWidth;
        effect.style.animation = 'comboFloat 2s ease-out forwards';
    }
    
    checkAIWin() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'ai') {
                    const aiLines = this.checkLines(row, col, 'ai', this.aiWinRequirement);
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
        }, 500);
    }
    
    updateForbiddenCells() {
        // 每3回合清空一次禁止格子
        if (this.round % 3 === 0) {
            this.forbiddenCells.clear();
            
            const cells = document.querySelectorAll('.board-cell.forbidden');
            cells.forEach(cell => {
                cell.classList.remove('forbidden');
            });
        }
    }
    
    aiMove() {
        // 检查是否被跳过
        if (this.aiSkipNextTurn) {
            this.aiSkipNextTurn = false;
            this.isPlayerTurn = true;
            this.updateUI();
            this.showMessage('AI被冻结，跳过一回合！');
            return;
        }
        
        const move = this.getAIMove();
        
        if (move) {
            const { row, col } = move;
            const success = this.placePiece(row, col, 'ai');
            
            if (!success) {
                this.aiMove();
                return;
            }
            
            // AI落子后检查
            if (this.checkAIWin()) {
                if (!this.checkRevivalEffect()) {
                    this.loseGame();
                }
                return;
            }
            
            // 切换回玩家回合
            this.isPlayerTurn = true;
            this.updateUI();
        }
    }
    
    getAIMove() {
        // 使用AI策略类
        const aiStrategy = new AIStrategy(this);
        const move = aiStrategy.getBestMove();
        
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
    
    useItem(index) {
        if (!this.isPlayerTurn || !this.gameActive) {
            this.showMessage('现在不能使用道具！');
            return;
        }
        
        const item = this.itemSlots[index];
        if (!item) return;
        
        if (this.shouldShowUseButton(item)) {
            if (item.onUse) {
                const result = item.onUse(this);
                if (result && result.destroy) {
                    this.itemSlots[index] = null;
                    this.updateUI();
                    this.showMessage(`已使用 ${item.name}: ${result.description}`);
                }
            } else {
                this.itemSlots[index] = null;
                this.updateUI();
                this.showMessage(`已使用 ${item.name}`);
            }
        } else {
            this.showMessage('这个道具不能主动使用！');
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
                const result = accessory.onGameWin(this);
                if (result && result.description) {
                    this.showMessage(result.description);
                }
            }
        }
        
        if (isSkillTriggered) {
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
        
        this.playSound('skill-sound');
        
        // 标记需要显示商店
        this.shouldShowShopAfterWin = true;
        this.isShopFromVictory = true;
    }
    
    loseGame() {
        this.gameActive = false;
        
        document.getElementById('game-over-title').textContent = '游戏结束';
        document.getElementById('game-over-message').textContent = 'AI形成了五子连线!';
        document.getElementById('final-score').textContent = this.currentScore;
        document.getElementById('final-money').textContent = 0;
        document.getElementById('final-pieces').textContent = this.playerPieces - this.usedPieces;
        
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
            this.showMessage('恭喜通关游戏!');
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
            totalScoreModifiers: [],
            pieceModifiers: [],
            moneyModifiers: [],
            formationModifiers: []
        };
        
        // 重置棋盘
        this.createBoard();
        
        // 触发饰品游戏开始效果
        for (const accessory of this.accessorySlots) {
            if (accessory && accessory.onGameStart) {
                const result = accessory.onGameStart(this);
                if (result && result.description) {
                    this.showMessage(result.description);
                }
            }
        }
        
        // 重置乌鸦牌的游戏开始效果
        for (const crow of this.crowSlots) {
            if (crow && crow.gameStart) {
                crow.gameStart(this);
            }
        }
        
        // 关闭所有模态框
        this.closeShop();
        this.closeGameOver();
        
        // 重置商店标志
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
        
        this.updateUI();
    }
    
    restartGame() {
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
            totalScoreModifiers: [],
            pieceModifiers: [],
            moneyModifiers: [],
            formationModifiers: []
        };
        
        // 清空槽位
        this.crowSlots = Array(6).fill(null);
        this.itemSlots = Array(4).fill(null);
        this.accessorySlots = Array(2).fill(null);
        
        // 重置棋盘
        this.createBoard();
        
        // 关闭模态框
        this.closeGameOver();
        this.closeShop();
        
        this.updateUI();
        
        document.getElementById('start-menu-modal').classList.remove('active');
        
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
        
        this.showInitialCrowSelection();
    }
    
    showInitialCrowSelection() {
        // 从乌鸦牌中随机选择3张
        const crowKeys = Object.keys(crowCards).filter(key => 
            ['0001', '0002', '0003', '0007', '0010', '0016'].includes(key)
        );
        
        const selectedCrows = [];
        while (selectedCrows.length < 3 && crowKeys.length > 0) {
            const randomIndex = Math.floor(Math.random() * crowKeys.length);
            const crowId = crowKeys.splice(randomIndex, 1)[0];
            selectedCrows.push(crowCards[crowId]);
        }
        
        const crowSelectElement = document.getElementById('crow-select-modal');
        const crowOptionsElement = document.getElementById('crow-options');
        
        crowOptionsElement.innerHTML = '';
        
        selectedCrows.forEach((crow, index) => {
            const crowElement = document.createElement('div');
            crowElement.className = 'crow-option';
            crowElement.dataset.index = index;
            
            crowElement.innerHTML = `
                <div class="crow-option-icon">${crow.icon}</div>
                <h4>${crow.name}</h4>
                <p class="crow-option-description">${crow.description}</p>
            `;
            
            crowElement.addEventListener('click', () => {
                this.selectInitialCrow(crow);
                document.getElementById('crow-select-modal').classList.remove('active');
            });
            
            crowOptionsElement.appendChild(crowElement);
        });
        
        crowSelectElement.classList.add('active');
    }
    
    selectInitialCrow(crow) {
        for (let i = 0; i < this.crowSlots.length; i++) {
            if (!this.crowSlots[i]) {
                this.crowSlots[i] = { ...crow };
                this.updateUI();
                break;
            }
        }
        
        this.gameActive = true;
        console.log(`已选择初始乌鸦牌: ${crow.name}`);
    }
    
    handleTargetSelection(row, col) {
        const target = this.isSelectingTarget;
        
        if (target.type === 'piece') {
            // 为棋子附加效果
            if (this.board[row][col] && this.board[row][col].type === 'player') {
                if (!this.board[row][col].effects) {
                    this.board[row][col].effects = [];
                }
                
                this.board[row][col].effects.push({
                    type: target.effect,
                    value: target.value,
                    description: target.description
                });
                
                this.showMessage(`已为棋子附加: ${target.description}`);
                
                // 销毁使用的道具
                for (let i = 0; i < this.itemSlots.length; i++) {
                    if (this.itemSlots[i] && this.itemSlots[i].onUse) {
                        this.itemSlots[i] = null;
                        break;
                    }
                }
            } else {
                this.showMessage('请选择己方棋子！');
                return;
            }
        } else if (target.type === 'crow') {
            // 为乌鸦牌附加效果
            this.showMessage('请点击要附加效果的乌鸦牌槽位');
            // 这里需要特殊处理，简化实现
        }
        
        this.isSelectingTarget = null;
        this.updateUI();
    }
    
    handlePieceMarking(row, col) {
        if (this.board[row][col].type !== 'player') {
            this.showMessage('请标记己方棋子！');
            return;
        }
        
        this.markedPiece = { row, col };
        this.isMarkingPiece = false;
        this.showMessage(`已标记棋子(${row},${col})，本回合概率效果必中`);
    }
    
    destroyItem(type, index, reason) {
        let slotArray;
        switch (type) {
            case 'crow':
                slotArray = this.crowSlots;
                break;
            case 'item':
                slotArray = this.itemSlots;
                break;
            case 'accessory':
                slotArray = this.accessorySlots;
                break;
        }
        
        if (slotArray && slotArray[index]) {
            const itemName = slotArray[index].name;
            slotArray[index] = null;
            
            if (reason) {
                this.showMessage(`${itemName} ${reason}`);
            }
            
            this.updateUI();
        }
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
        
        if (this.isShopFromVictory) {
            document.getElementById('shop-title').textContent = `第${this.level}关商店`;
        } else {
            document.getElementById('shop-title').textContent = '商店';
        }
        
        document.getElementById('shop-modal').classList.add('active');
        this.playSound('shop-sound');
        
        if (shop) {
            shop.render();
        }
    }
    
    closeShop() {
        document.getElementById('shop-modal').classList.remove('active');
        this.isShopFromVictory = false;
        this.shouldShowShopAfterWin = false;
    }
    
    showSlotDetail(type, index) {
        let item;
        let slotArray;
        
        switch (type) {
            case 'crow':
                slotArray = this.crowSlots;
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
        
        document.getElementById('detail-title').textContent = '详情';
        document.getElementById('detail-icon').textContent = item.icon;
        document.getElementById('detail-name').textContent = item.name;
        document.getElementById('detail-description').textContent = item.description;
        document.getElementById('detail-price').textContent = Math.floor(item.price * 0.7);
        document.getElementById('detail-type').textContent = 
            type === 'crow' ? '乌鸦牌' : 
            type === 'item' ? '道具牌' : '饰品';
        
        const buyBtn = document.getElementById('buy-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');
        
        buyBtn.style.display = 'none';
        sellBtn.style.display = 'block';
        
        sellBtn.onclick = () => {
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
    
    showMessage(message) {
        const messageElement = document.getElementById('game-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.animation = 'none';
            void messageElement.offsetWidth;
            messageElement.style.animation = 'pulse 2s infinite';
            
            setTimeout(() => {
                if (messageElement.textContent === message) {
                    messageElement.textContent = '还不够，我的朋友';
                }
            }, 300);
        }
    }

    handleResize() {
    // 重新调整UI
    this.updateUI();
    
    // 如果是竖屏且屏幕较小，显示提示
    if (window.innerHeight > window.innerWidth && window.innerWidth < 1000) {
        this.showOrientationMessage();
    }
}

showOrientationMessage() {
    const message = document.getElementById('game-message');
    if (message) {
        message.textContent = '请横屏以获得最佳体验';
        message.style.animation = 'pulse 1s infinite';
        
        setTimeout(() => {
            if (message.textContent === '请横屏以获得最佳体验') {
                message.textContent = '还不够，我的朋友';
            }
        }, 2000);
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
        
        // 游戏结束按钮
        document.getElementById('game-over-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-victory-btn') {
                this.closeGameOver();
                this.openShop();
            } else if (e.target.id === 'restart-btn' && !this.shouldShowShopAfterWin) {
                this.closeGameOver();
                document.getElementById('start-menu-modal').classList.add('active');
            }
        });
        
        // 商店中的下一关按钮
        document.getElementById('next-level-shop-btn').addEventListener('click', () => {
            this.closeShop();
            this.nextLevel();
        });
        
        // 全局拖拽事件
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });

        // 添加屏幕方向变化监听
    window.addEventListener('resize', () => {
        this.handleResize();
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            this.handleResize();
        }, 100);
    });

    }
}



// 初始化游戏
let game;
let shop;

function initGame() {
    game = new Game();
    shop = new Shop(game);
    
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
    
    document.getElementById('shop-modal').addEventListener('click', (e) => {
        if (e.target.id === 'shop-modal') {
            game.closeShop();
        }
    });
    
    document.getElementById('crow-select-modal').addEventListener('click', (e) => {
        if (e.target.id === 'crow-select-modal') {
            // 不允许关闭，必须选择乌鸦牌
        }
    });
    
    document.getElementById('buy-item-btn').addEventListener('click', () => {
        // 这个事件在shop.js中动态设置
    });
    
    console.log('技能五子棋游戏已初始化!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}