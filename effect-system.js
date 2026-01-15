// 效果系统框架 - 处理所有乌鸦牌、道具、饰品的触发和结算
class EffectSystem {
    constructor(game) {
        this.game = game;
        
        // 效果类型分类
        this.effectTypes = {
            ELIMINATION: 'elimination',      // 消除时
            TURN_START: 'turnStart',         // 回合开始时
            TURN_END: 'turnEnd',             // 回合结束时
            PLAYER_MOVE: 'playerMove',       // 玩家落子时
            AI_MOVE: 'aiMove',               // AI落子时
            GAME_START: 'gameStart',         // 游戏开始时
            GAME_WIN: 'gameWin',             // 游戏胜利时
            SHOP_PHASE: 'shopPhase',         // 商店阶段
            ITEM_USE: 'itemUse',             // 道具使用时
            CONSTANT: 'constant',            // 始终生效
            CONDITIONAL: 'conditional'       // 条件触发
        };
        
        // 效果处理器
        this.handlers = new Map();
        
        // 注册基础处理器
        this.registerHandlers();
    }
    
    // 注册效果处理器
    registerHandlers() {
        // 积分相关效果
        this.handlers.set('score_add_per_piece', this.handleScoreAddPerPiece.bind(this));
        this.handlers.set('score_multiply', this.handleScoreMultiply.bind(this));
        this.handlers.set('score_bonus', this.handleScoreBonus.bind(this));
        
        // 棋子数相关效果
        this.handlers.set('piece_add_on_elimination', this.handlePieceAddOnElimination.bind(this));
        this.handlers.set('piece_restore', this.handlePieceRestore.bind(this));
        this.handlers.set('piece_conversion', this.handlePieceConversion.bind(this));
        
        // 经济相关效果
        this.handlers.set('money_add', this.handleMoneyAdd.bind(this));
        this.handlers.set('money_multiply', this.handleMoneyMultiply.bind(this));
        this.handlers.set('shop_discount', this.handleShopDiscount.bind(this));
        
        // 战斗相关效果
        this.handlers.set('formation_upgrade', this.handleFormationUpgrade.bind(this));
        this.handlers.set('reduce_win_requirement', this.handleReduceWinRequirement.bind(this));
        this.handlers.set('ai_difficulty_change', this.handleAIDifficultyChange.bind(this));
        
        // 特殊效果
        this.handlers.set('copy_effect', this.handleCopyEffect.bind(this));
        this.handlers.set('cooldown_reduce', this.handleCooldownReduce.bind(this));
        this.handlers.set('probability_modify', this.handleProbabilityModify.bind(this));
    }
    
    // 触发所有效果（按照优先级）
    async triggerEffects(context) {
        const { triggerType, data } = context;
        
        // 重置当前效果
        this.resetCurrentEffects();
        
        // 按照优先级顺序触发效果
        const results = {
            scoreModifiers: [],
            pieceModifiers: [],
            moneyModifiers: [],
            formationModifiers: [],
            aiModifiers: [],
            specialModifiers: []
        };
        
        // 1. 道具牌效果（从左到右）
        for (let i = 0; i < this.game.itemSlots.length; i++) {
            const item = this.game.itemSlots[i];
            if (item && item[triggerType]) {
                const result = await this.processEffect(item, triggerType, data, 'item', i);
                this.mergeResults(results, result);
            }
        }
        
        // 2. 乌鸦牌效果（从左到右）
        for (let i = 0; i < this.game.crowSlots.length; i++) {
            const crow = this.game.crowSlots[i];
            if (crow && crow[triggerType]) {
                const result = await this.processEffect(crow, triggerType, data, 'crow', i);
                this.mergeResults(results, result);
            }
        }
        
        // 3. 饰品效果（先上后下）
        for (let i = 0; i < this.game.accessorySlots.length; i++) {
            const accessory = this.game.accessorySlots[i];
            if (accessory && accessory[triggerType]) {
                const result = await this.processEffect(accessory, triggerType, data, 'accessory', i);
                this.mergeResults(results, result);
            }
        }
        
        return results;
    }
    
    // 处理单个效果
    async processEffect(item, triggerType, data, sourceType, index) {
        try {
            const result = await item[triggerType](this.game, data);
            
            // 添加来源信息
            if (result) {
                result.source = {
                    type: sourceType,
                    index: index,
                    name: item.name,
                    icon: item.icon
                };
                
                // 处理冷却时间
                if (item.cooldown && item.cooldown > 0) {
                    item.cooldown--;
                    if (item.cooldown === 0 && item.onCooldownEnd) {
                        item.onCooldownEnd(this.game);
                    }
                }
                
                // 处理销毁标记
                if (result.destroy) {
                    this.destroyItem(sourceType, index, result.destroyReason);
                }
            }
            
            return result;
        } catch (error) {
            console.error(`处理效果时出错: ${item.name}`, error);
            return null;
        }
    }
    
    // 合并结果
    mergeResults(target, source) {
        if (!source) return;
        
        for (const key in source) {
            if (Array.isArray(source[key])) {
                if (!target[key]) target[key] = [];
                target[key].push(...source[key]);
            } else if (typeof source[key] === 'object') {
                if (!target[key]) target[key] = {};
                Object.assign(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    // 重置当前效果
    resetCurrentEffects() {
        this.game.currentEffects = {
            score: { base: 0, multipliers: [], additions: [] },
            pieces: { base: 0, multipliers: [], additions: [] },
            money: { base: 0, multipliers: [], additions: [] },
            formation: [],
            ai: []
        };
    }
    
    // 应用积分效果
    applyScoreEffects(baseScore, pieceCount, formationType) {
        let finalScore = baseScore;
        const breakdown = [`基础: ${pieceCount} × ${baseScore / pieceCount}`];
        
        // 应用加法效果
        this.game.currentEffects.score.additions.forEach(effect => {
            const addition = effect.value || 0;
            finalScore += addition;
            breakdown.push(`${effect.name}: +${addition}`);
        });
        
        // 应用乘法效果
        this.game.currentEffects.score.multipliers.forEach(effect => {
            const multiplier = effect.value || 1;
            const before = finalScore;
            finalScore = Math.floor(finalScore * multiplier);
            const increase = finalScore - before;
            if (increase > 0) {
                breakdown.push(`${effect.name}: ×${multiplier} (+${increase})`);
            }
        });
        
        return { score: finalScore, breakdown: breakdown.join('\n') };
    }
    
    // 销毁物品
    destroyItem(type, index, reason = '') {
        let slotArray;
        switch (type) {
            case 'crow':
                slotArray = this.game.crowSlots;
                break;
            case 'item':
                slotArray = this.game.itemSlots;
                break;
            case 'accessory':
                slotArray = this.game.accessorySlots;
                break;
            default:
                return;
        }
        
        if (slotArray[index]) {
            const itemName = slotArray[index].name;
            slotArray[index] = null;
            
            // 显示销毁提示
            if (reason) {
                this.game.showMessage(`${itemName} ${reason}`);
            }
            
            this.game.updateUI();
        }
    }
    
    // ========== 效果处理器实现 ==========
    
    // 1. 每枚棋子增加积分
    handleScoreAddPerPiece(game, data) {
        const { pieceCount } = data;
        const addition = this.value * pieceCount; // this.value 从效果配置中读取
        
        return {
            scoreModifiers: [{
                type: 'addition',
                value: addition,
                description: `每枚棋子+${this.value}分`
            }]
        };
    }
    
    // 2. 积分倍数
    handleScoreMultiply(game, data) {
        return {
            scoreModifiers: [{
                type: 'multiplier',
                value: this.value,
                description: `积分×${this.value}`
            }]
        };
    }
    
    // 3. 额外积分奖励
    handleScoreBonus(game, data) {
        const condition = this.condition(game, data);
        if (condition.met) {
            return {
                scoreModifiers: [{
                    type: 'addition',
                    value: this.value,
                    description: `${condition.description}: +${this.value}分`
                }]
            };
        }
        return null;
    }
    
    // 4. 消除时恢复棋子
    handlePieceAddOnElimination(game, data) {
        const { pieceCount } = data;
        const addition = this.value * pieceCount;
        
        return {
            pieceModifiers: [{
                type: 'addition',
                value: addition,
                description: `消除恢复${this.value}棋子/个`
            }]
        };
    }
    
    // 5. 回合开始时恢复棋子
    handlePieceRestore(game, data) {
        if (game.playerPieces < this.threshold) {
            return {
                pieceModifiers: [{
                    type: 'addition',
                    value: this.value,
                    description: `棋子不足${this.threshold}，恢复${this.value}枚`
                }]
            };
        }
        return null;
    }
    
    // 6. 转化敌方棋子
    handlePieceConversion(game, data) {
        const { position } = data;
        const converted = this.convertPieces(game, position);
        
        return {
            specialModifiers: [{
                type: 'conversion',
                value: converted.length,
                description: `转化${converted.length}枚敌方棋子`,
                positions: converted
            }]
        };
    }
    
    // 7. 获得金钱
    handleMoneyAdd(game, data) {
        return {
            moneyModifiers: [{
                type: 'addition',
                value: this.value,
                description: `获得${this.value}金币`
            }]
        };
    }
    
    // 8. 金钱倍数
    handleMoneyMultiply(game, data) {
        return {
            moneyModifiers: [{
                type: 'multiplier',
                value: this.value,
                description: `金钱×${this.value}`
            }]
        };
    }
    
    // 9. 商店折扣
    handleShopDiscount(game, data) {
        return {
            shopModifiers: [{
                type: 'discount',
                value: this.value,
                description: `商店${this.value * 100}%折扣`
            }]
        };
    }
    
    // 10. 阵型升级
    handleFormationUpgrade(game, data) {
        const { formationType } = data;
        const upgradeAmount = this.calculateUpgrade(game, formationType);
        
        return {
            formationModifiers: [{
                type: 'upgrade',
                formation: formationType,
                value: upgradeAmount,
                description: `${formationType}阵型+${upgradeAmount}`
            }]
        };
    }
    
    // 11. 降低胜利要求
    handleReduceWinRequirement(game, data) {
        const reduction = this.calculateReduction(game);
        
        return {
            specialModifiers: [{
                type: 'requirement_reduce',
                value: reduction,
                description: `目标积分降低${reduction}%`
            }]
        };
    }
    
    // 12. AI难度变化
    handleAIDifficultyChange(game, data) {
        const { emotion, turns } = this.getAIEffect(game);
        
        return {
            aiModifiers: [{
                type: 'emotion_change',
                emotion: emotion,
                turns: turns,
                description: `AI进入${emotion}状态`
            }]
        };
    }
    
    // 13. 复制效果
    handleCopyEffect(game, data) {
        const { targetIndex, targetType } = this.findTargetToCopy(game);
        if (targetIndex !== -1) {
            return {
                specialModifiers: [{
                    type: 'copy',
                    sourceType: targetType,
                    sourceIndex: targetIndex,
                    description: `复制${targetType}槽位${targetIndex + 1}的效果`
                }]
            };
        }
        return null;
    }
    
    // 14. 冷却减少
    handleCooldownReduce(game, data) {
        const reduced = this.reduceCooldowns(game);
        
        return {
            specialModifiers: [{
                type: 'cooldown_reduce',
                count: reduced,
                description: `减少${reduced}个冷却`
            }]
        };
    }
    
    // 15. 概率修改
    handleProbabilityModify(game, data) {
        const probabilityChange = this.value;
        
        return {
            specialModifiers: [{
                type: 'probability_modify',
                value: probabilityChange,
                description: `概率${probabilityChange > 0 ? '增加' : '减少'}${Math.abs(probabilityChange) * 100}%`
            }]
        };
    }
    
    // ========== 辅助方法 ==========
    
    // 转换棋子
    convertPieces(game, position) {
        const [row, col] = position;
        const converted = [];
        
        // 检查8个方向
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            if (game.isValidPosition(newRow, newCol) && 
                game.board[newRow][newCol].type === 'ai') {
                // 转换棋子
                game.board[newRow][newCol].type = 'player';
                converted.push([newRow, newCol]);
                
                // 更新显示
                const cellElement = document.querySelector(
                    `[data-row="${newRow}"][data-col="${newCol}"]`
                );
                cellElement.classList.remove('ai');
                cellElement.classList.add('player');
            }
        }
        
        return converted;
    }
    
    // 计算升级量
    calculateUpgrade(game, formationType) {
        let base = this.baseValue || 1;
        
        // 根据条件调整
        if (this.condition) {
            const conditionResult = this.condition(game, { formationType });
            if (conditionResult.met) {
                base += conditionResult.bonus || 0;
            }
        }
        
        return base;
    }
    
    // 计算减少量
    calculateReduction(game) {
        let reduction = this.baseValue || 0;
        
        // 根据游戏状态调整
        if (this.scalesWith) {
            const scaleValue = this.getScaleValue(game);
            reduction += scaleValue * (this.scaleFactor || 1);
        }
        
        return Math.min(reduction, this.maxValue || 100);
    }
    
    // 获取AI效果
    getAIEffect(game) {
        return {
            emotion: this.emotion || '愤怒',
            turns: this.turns || 3,
            difficulty: this.difficulty || 1
        };
    }
    
    // 查找复制目标
    findTargetToCopy(game) {
        // 默认复制右侧的乌鸦牌
        const currentIndex = this.source?.index || 0;
        
        for (let i = currentIndex + 1; i < game.crowSlots.length; i++) {
            if (game.crowSlots[i]) {
                return { targetIndex: i, targetType: 'crow' };
            }
        }
        
        // 如果没有右侧的，找左侧的
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (game.crowSlots[i]) {
                return { targetIndex: i, targetType: 'crow' };
            }
        }
        
        return { targetIndex: -1, targetType: null };
    }
    
    // 减少冷却
    reduceCooldowns(game) {
        let reducedCount = 0;
        
        // 减少乌鸦牌冷却
        game.crowSlots.forEach((crow, index) => {
            if (crow && crow.cooldown && crow.cooldown > 0) {
                crow.cooldown = Math.max(0, crow.cooldown - 1);
                reducedCount++;
            }
        });
        
        // 减少道具牌冷却
        game.itemSlots.forEach((item, index) => {
            if (item && item.cooldown && item.cooldown > 0) {
                item.cooldown = Math.max(0, item.cooldown - 1);
                reducedCount++;
            }
        });
        
        return reducedCount;
    }
    
    // 获取缩放值
    getScaleValue(game) {
        switch (this.scalesWith) {
            case 'round':
                return game.round;
            case 'piecesUsed':
                return game.usedPieces;
            case 'score':
                return game.currentScore;
            case 'formationLevel':
                const formationType = this.formation || 'horizontal';
                return game.formations[formationType];
            default:
                return 0;
        }
    }
}

// 效果条件检查器
class ConditionChecker {
    static checkCondition(game, condition, data) {
        switch (condition.type) {
            case 'piece_count':
                return game.playerPieces - game.usedPieces <= condition.value;
                
            case 'formation_type':
                return data.formationType === condition.value;
                
            case 'elimination_count':
                return data.pieceCount >= condition.value;
                
            case 'consecutive_eliminations':
                const formationType = data.formationType;
                return game.consecutiveEliminations[formationType] >= condition.value;
                
            case 'probability':
                return Math.random() < condition.value;
                
            case 'round':
                return game.round % condition.value === 0;
                
            case 'has_item':
                return game[`${condition.itemType}Slots`].some(item => 
                    item && item.id === condition.itemId
                );
                
            default:
                return false;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EffectSystem, ConditionChecker };
}