// 技能牌定义
const skillCards = {
    defenseField: {
        id: 'defenseField',
        name: '防御力场',
        icon: '🛡️',
        description: '当AI连成4子时，立即触发自动消耗一枚玩家棋子堵住AI棋子，不影响玩家下一回合正常操作。生效后本张技能牌立即销毁。',
        price: 150,
        type: 'skill',
        playerMove: function(game) {
            // 检查AI是否形成四子
            for (let row = 0; row < game.boardSize; row++) {
                for (let col = 0; col < game.boardSize; col++) {
                    if (game.board[row][col].type === 'ai') {
                        const aiStrategy = new AIStrategy(game);
                        const fourLines = aiStrategy.checkFour(row, col, 'ai');
                        if (fourLines.length > 0) {
                            // 触发防御力场
                            const line = fourLines[0];
                            const ends = this.findLineEnds(line, 'ai', game);
                            
                            // 在可用的位置放置玩家棋子
                            for (const [row, col] of ends) {
                                if (game.isValidPosition(row, col) && game.board[row][col].type === 'empty') {
                                    // 放置玩家棋子
                                    game.board[row][col].type = 'player';
                                    game.usedPieces++;
                                    
                                    // 更新棋盘显示
                                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                                    cellElement.classList.remove('empty');
                                    cellElement.classList.add('player');
                                    
                                    // 标记为禁止AI落子区域
                                    game.forbiddenCells.add(`${row},${col}`);
                                    
                                    // 播放音效
                                    game.playSound('place-piece-sound');
                                    
                                    // 返回销毁指令
                                    return {
                                        destroyItem: {
                                            type: 'skill',
                                            index: game.skillSlots.indexOf(this)
                                        },
                                        description: '防御力场触发'
                                    };
                                }
                            }
                        }
                    }
                }
            }
            return null;
        },
        findLineEnds: function(line, type, game) {
            const ends = [];
            const [r1, c1] = line[0];
            const [r2, c2] = line[line.length - 1];
            
            // 确定方向
            const dr = r2 - r1;
            const dc = c2 - c1;
            const dirRow = dr === 0 ? 0 : dr / Math.abs(dr);
            const dirCol = dc === 0 ? 0 : dc / Math.abs(dc);
            
            // 检查两端之外的位置
            const end1 = [r1 - dirRow, c1 - dirCol];
            const end2 = [r2 + dirRow, c2 + dirCol];
            
            if (game.isValidPosition(end1[0], end1[1])) ends.push(end1);
            if (game.isValidPosition(end2[0], end2[1])) ends.push(end2);
            
            return ends;
        }
    },
    
    continuousUpgrade: {
        id: 'continuousUpgrade',
        name: '连续升级',
        icon: '⬆️',
        description: '每连续使用横向阵型消除2次，自动为横向阵型提升1个等级，中断使用重新计次。',
        price: 150,
        type: 'skill'
    },
    
    deadRevival: {
        id: 'deadRevival',
        name: '死者复活',
        icon: '☠️',
        description: '在AI连成5子时自动生效，本局视为玩家胜利并进入下一局，生效后本张技能牌立即销毁。',
        price: 200,
        type: 'skill',
        onAIConnectFive: function(game) {
            // 当AI形成五子时触发
            // 直接视为玩家胜利，进入结算流程
            game.currentScore = game.targetScore; // 达到目标分数
            game.winGame(true); // 传递true表示是技能触发的胜利
            
            return {
                destroyItem: {
                    type: 'skill',
                    index: game.skillSlots.indexOf(this)
                },
                description: '死者复活触发'
            };
        }
    },
    
    copyMaster: {
        id: 'copyMaster',
        name: '复制大师',
        icon: '👯',
        description: '当本技能牌右侧有技能牌时，在玩家落子后立即发动，复制右侧技能牌能力并销毁右侧技能牌，之后进入一回合冷却，冷却结束后可再次进行复制，最多复制三张技能牌技能。',
        price: 250,
        type: 'skill',
        cooldown: 0,
        copies: 0,
        maxCopies: 3,
        onPlayerMove: function(game, skillIndex) {
            if (this.cooldown > 0) {
                this.cooldown--;
                return null;
            }
            
            if (this.copies >= this.maxCopies) return null;
            
            // 检查右侧是否有技能牌
            if (skillIndex < game.skillSlots.length - 1 && game.skillSlots[skillIndex + 1]) {
                const rightSkill = game.skillSlots[skillIndex + 1];
                
                // 复制右侧技能牌的效果
                const copiedSkill = { ...rightSkill };
                
                // 查找空槽位放置复制的技能
                for (let i = 0; i < game.skillSlots.length; i++) {
                    if (!game.skillSlots[i]) {
                        game.skillSlots[i] = copiedSkill;
                        break;
                    }
                }
                
                // 返回销毁指令
                return {
                    destroyItem: {
                        type: 'skill',
                        index: skillIndex + 1
                    },
                    description: `复制大师：已复制 ${rightSkill.name}`
                };
            }
            return null;
        }
    },
    
    ironChain: {
        id: 'ironChain',
        name: '铁索连环',
        icon: '⛓️',
        description: '玩家触发消除时，所有消除的玩家棋子紧邻的玩家棋子均被连带消除，效果可传导。横向纵向斜向紧邻均可。',
        price: 200,
        type: 'skill',
        onElimination: function(game, eliminatedCells) {
            const additionalEliminations = new Set();
            
            // 获取所有被消除的玩家棋子
            const playerCells = [];
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                if (game.board[row][col].type === 'player') {
                    playerCells.push([row, col]);
                }
            }
            
            // 使用队列进行传导消除
            const queue = [...playerCells];
            
            while (queue.length > 0) {
                const [row, col] = queue.shift();
                
                // 检查8个方向的相邻格子
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];
                
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    
                    if (game.isValidPosition(newRow, newCol) && 
                        game.board[newRow][newCol].type === 'player') {
                        
                        const pos = `${newRow},${newCol}`;
                        
                        // 如果还没被标记为要消除，且不在已消除列表中
                        if (!eliminatedCells.has(pos) && !additionalEliminations.has(pos)) {
                            additionalEliminations.add(pos);
                            queue.push([newRow, newCol]); // 继续传导
                        }
                    }
                }
            }
            
            return Array.from(additionalEliminations);
        }
    }
};

// 道具牌定义
const itemCards = {
    // 整蛊牌
    angerTrap: {
        id: 'angerTrap',
        name: '火爆',
        icon: '🔥',
        description: '使AI进入2回合愤怒，之后进入4回合疲惫。',
        price: 100,
        type: 'item',
        subtype: 'trap',
        onUse: function(game) {
            game.aiEmotion = '愤怒';
            game.emotionTurns = 2;
            game.aiDifficulty = 1;
            
            // 2回合后变为疲惫
            setTimeout(() => {
                if (game.emotionTurns <= 0) {
                    game.aiEmotion = '疲惫';
                    game.emotionTurns = 4;
                    game.aiDifficulty = -1;
                }
            }, 2000);
            
            alert('AI进入愤怒状态！');
            return true;
        }
    },
    
    scareTrap: {
        id: 'scareTrap',
        name: '恫吓',
        icon: '👻',
        description: '使AI进入3回合惊恐，之后进入2回合专注。',
        price: 100,
        type: 'item',
        subtype: 'trap',
        onUse: function(game) {
            game.aiEmotion = '惊恐';
            game.emotionTurns = 3;
            game.aiDifficulty = -1;
            
            // 3回合后变为专注
            setTimeout(() => {
                if (game.emotionTurns <= 0) {
                    game.aiEmotion = '专注';
                    game.emotionTurns = 2;
                    game.aiDifficulty = 1;
                }
            }, 3000);
            
            alert('AI进入惊恐状态！');
            return true;
        }
    },
    
    // 升级牌
    upgradeHorizontal: {
        id: 'upgradeHorizontal',
        name: '横向升级',
        icon: '↔️',
        description: '为横型阵型升级一次。',
        price: 100,
        type: 'item',
        subtype: 'upgrade',
        onUse: function(game) {
            game.formations.horizontal++;
            game.updateUI();
            alert('横向阵型已升级！');
            return true;
        }
    },
    
    upgradeVertical: {
        id: 'upgradeVertical',
        name: '纵向升级',
        icon: '↕️',
        description: '为竖型阵型升级一次。',
        price: 100,
        type: 'item',
        subtype: 'upgrade',
        onUse: function(game) {
            game.formations.vertical++;
            game.updateUI();
            alert('纵向阵型已升级！');
            return true;
        }
    },
    
    upgradeDiagonalLeft: {
        id: 'upgradeDiagonalLeft',
        name: '撇向升级',
        icon: '↙️',
        description: '为撇型阵型升级一次。',
        price: 100,
        type: 'item',
        subtype: 'upgrade',
        onUse: function(game) {
            game.formations.diagonalLeft++;
            game.updateUI();
            alert('撇向阵型已升级！');
            return true;
        }
    },
    
    upgradeDiagonalRight: {
        id: 'upgradeDiagonalRight',
        name: '捺向升级',
        icon: '↘️',
        description: '为捺型阵型升级一次。',
        price: 100,
        type: 'item',
        subtype: 'upgrade',
        onUse: function(game) {
            game.formations.diagonalRight++;
            game.updateUI();
            alert('捺向阵型已升级！');
            return true;
        }
    },
    
    // 法术牌
    sandstorm: {
        id: 'sandstorm',
        name: '飞沙走石',
        icon: '🌪️',
        description: '清空场上全部棋子，但已消耗棋子数不变。',
        price: 300,
        type: 'item',
        subtype: 'spell',
        onUse: function(game) {
            // 清空所有棋子
            for (let row = 0; row < game.boardSize; row++) {
                for (let col = 0; col < game.boardSize; col++) {
                    if (game.board[row][col].type !== 'empty') {
                        game.board[row][col] = { type: 'empty', turns: 0 };
                        
                        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        cellElement.classList.remove('player', 'ai');
                    }
                }
            }
            
            game.forbiddenCells.clear();
            alert('场上所有棋子已被清除！');
            return true;
        }
    },
    
    // 电镀牌
    fundCoating: {
        id: 'fundCoating',
        name: '基金',
        icon: '💰',
        description: '还在场上时，每回合产出30元。',
        price: 200,
        type: 'item',
        subtype: 'coating',
        onTurnEnd: function(game) {
            return { money: 30 };
        }
    },
    
    towerCoating: {
        id: 'towerCoating',
        name: '方塔',
        icon: '🗼',
        description: '还在场上时，加入紧邻9格内有敌方棋子，每回合消除随机一颗。',
        price: 200,
        type: 'item',
        subtype: 'coating',
        onTurnEnd: function(game) {
            // 查找有相邻AI棋子的玩家棋子
            const playerCellsWithAdjacentAI = [];
            
            for (let row = 0; row < game.boardSize; row++) {
                for (let col = 0; col < game.boardSize; col++) {
                    if (game.board[row][col].type === 'player') {
                        // 检查9格范围内是否有AI棋子
                        let hasAdjacentAI = false;
                        
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                if (dr === 0 && dc === 0) continue;
                                
                                const newRow = row + dr;
                                const newCol = col + dc;
                                
                                if (game.isValidPosition(newRow, newCol) && 
                                    game.board[newRow][newCol].type === 'ai') {
                                    hasAdjacentAI = true;
                                    break;
                                }
                            }
                            if (hasAdjacentAI) break;
                        }
                        
                        if (hasAdjacentAI) {
                            playerCellsWithAdjacentAI.push([row, col]);
                        }
                    }
                }
            }
            
            // 随机消除一个符合条件的棋子
            if (playerCellsWithAdjacentAI.length > 0) {
                const [row, col] = playerCellsWithAdjacentAI[
                    Math.floor(Math.random() * playerCellsWithAdjacentAI.length)
                ];
                game.eliminateCell(row, col);
                return { description: '方塔效果：消除了一个敌方棋子' };
            }
            
            return null;
        }
    }
};

// 饰品定义
const accessories = {
    pharaohCurse: {
        id: 'pharaohCurse',
        name: '法老王的诅咒',
        icon: '⚰️',
        description: '佩戴饰品后下一场对局目标积分上涨20%，顺利通过该局后本饰品效果永久改变为每次获得积分额外获得5%。',
        price: 100,
        type: 'accessory',
        isCursed: true,
        isBlessed: false,
        onGameStart: function(game) {
            if (this.isCursed) {
                game.targetScore = Math.floor(game.targetScore * 1.2);
                game.updateUI();
                return { description: '法老的诅咒：目标积分+20%' };
            }
            return null;
        },
        onGameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '每次获得积分额外获得5%。';
                alert('法老王的诅咒已转变为祝福！');
                return { description: '法老的诅咒转变为祝福' };
            }
            return null;
        },
        playerMove: function(game) {
            if (this.isBlessed) {
                return {
                    totalScoreModifier: (score) => Math.floor(score * 1.05),
                    description: '法老的祝福：积分+5%'
                };
            }
            return null;
        }
    },
    
    zeusBlessing: {
        id: 'zeusBlessing',
        name: '宙斯的祝福',
        icon: '⚡',
        description: '每回合额外产出20元。',
        price: 100,
        type: 'accessory',
        onTurnEnd: function(game) {
            return { money: 20 };
        }
    },
    
    mysteryAccessory: {
        id: 'mysteryAccessory',
        name: '神秘饰品',
        icon: '❓',
        description: '带来随机效果，每局效果自动变化一次。',
        price: 150,
        type: 'accessory',
        currentEffect: null,
        onGameStart: function(game) {
            // 随机选择一个效果
            const effects = [
                { 
                    name: '幸运金币', 
                    onTurnEnd: () => ({ money: 50 }),
                    description: '每回合获得50金币'
                },
                { 
                    name: '双倍积分', 
                    playerMove: () => ({
                        totalScoreModifier: (score) => score * 2,
                        description: '神秘效果：双倍积分'
                    }),
                    description: '获得双倍积分'
                },
                { 
                    name: '额外棋子', 
                    onGameStart: (g) => { 
                        g.playerPieces += 5;
                        return { description: '获得额外5枚棋子' };
                    },
                    description: '获得额外5枚棋子'
                },
                { 
                    name: '快速消除', 
                    onElimination: (g, cells) => {
                        const aiCells = [];
                        for (let row = 0; row < g.boardSize; row++) {
                            for (let col = 0; col < g.boardSize; col++) {
                                if (g.board[row][col].type === 'ai') {
                                    aiCells.push([row, col]);
                                }
                            }
                        }
                        
                        if (aiCells.length > 0) {
                            const [row, col] = aiCells[Math.floor(Math.random() * aiCells.length)];
                            cells.add(`${row},${col}`);
                            return 1;
                        }
                        return 0;
                    },
                    description: '消除时额外消灭一个随机AI棋子'
                }
            ];
            
            this.currentEffect = effects[Math.floor(Math.random() * effects.length)];
            this.description = `神秘效果: ${this.currentEffect.description}`;
            
            if (this.currentEffect.onGameStart) {
                return this.currentEffect.onGameStart(game);
            }
            
            alert(`神秘饰品效果：${this.currentEffect.name}`);
            return { description: `神秘饰品：${this.currentEffect.name}` };
        },
        playerMove: function(game) {
            if (this.currentEffect && this.currentEffect.playerMove) {
                return this.currentEffect.playerMove();
            }
            return null;
        },
        onTurnEnd: function(game) {
            if (this.currentEffect && this.currentEffect.onTurnEnd) {
                return this.currentEffect.onTurnEnd();
            }
            return null;
        }
    }
};

// 导出所有卡片
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { skillCards, itemCards, accessories };
}