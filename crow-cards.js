// 乌鸦牌效果定义 - 按照Excel表格实现
// 乌鸦牌效果定义 - 完整实现Excel表格所有乌鸦牌
const crowCards = {
    // ========== 积分系 - 提高单子积分 ==========
    '0001': {
        id: '0001',
        name: '瘦弱乌鸦',
        icon: '🐦',
        description: '为每枚消除棋子收益增加5分。',
        price: 100,
        type: 'crow',
        subtype: 'score',
        rarity: 1,
        elimination: function(game, data) {
            return {
                scoreModifiers: [{
                    type: 'addition_per_piece',
                    value: 5,
                    description: '瘦弱乌鸦: 每子+5分'
                }]
            };
        }
    },
    
    '0002': {
        id: '0002',
        name: '普通乌鸦',
        icon: '🐦',
        description: '为每枚消除棋子收益增加10分。',
        price: 150,
        type: 'crow',
        subtype: 'score',
        rarity: 1,
        elimination: function(game, data) {
            return {
                scoreModifiers: [{
                    type: 'addition_per_piece',
                    value: 10,
                    description: '普通乌鸦: 每子+10分'
                }]
            };
        }
    },
    
    '0003': {
        id: '0003',
        name: '强壮乌鸦',
        icon: '🐦',
        description: '为每枚消除棋子收益增加15分。',
        price: 150,
        type: 'crow',
        subtype: 'score',
        rarity: 1,
        elimination: function(game, data) {
            return {
                scoreModifiers: [{
                    type: 'addition_per_piece',
                    value: 15,
                    description: '强壮乌鸦: 每子+15分'
                }]
            };
        }
    },
    
    '0004': {
        id: '0004',
        name: '累加乌鸦',
        icon: '📈',
        description: '为每枚消除棋子收益增加5分。每次成功消除后，此加成+5分（上限+25分）。若一回合内未触发消除，加成重置为5分。',
        price: 200,
        type: 'crow',
        subtype: 'score',
        rarity: 2,
        elimination: function(game, data) {
            if (!this.stack) this.stack = 5;
            
            const addition = this.stack;
            this.stack = Math.min(this.stack + 5, 25);
            
            return {
                scoreModifiers: [{
                    type: 'addition_per_piece',
                    value: addition,
                    description: `累加乌鸦: 每子+${addition}分`
                }]
            };
        },
        turnEnd: function(game) {
            if (!game.lastTurnHadElimination) {
                this.stack = 5;
            }
            game.lastTurnHadElimination = false;
        }
    },
    
    '0005': {
        id: '0005',
        name: '累乘乌鸦',
        icon: '✖️',
        description: '为每枚消除棋子收益增加2分。每次触发消除时，有30%概率使此加成翻倍（2→4→8...），失败则重置为2分。',
        price: 200,
        type: 'crow',
        subtype: 'score',
        rarity: 2,
        probability: 0.3,
        elimination: function(game, data) {
            if (!this.stack) this.stack = 2;
            
            if (Math.random() < this.probability) {
                this.stack *= 2;
            } else {
                this.stack = 2;
            }
            
            return {
                scoreModifiers: [{
                    type: 'addition_per_piece',
                    value: this.stack,
                    description: `累乘乌鸦: 每子+${this.stack}分`
                }]
            };
        }
    },
    
    '0006': {
        id: '0006',
        name: '反哺乌鸦',
        icon: '🔄',
        description: '当一张其他"提高单子积分"的乌鸦牌生效时，使其本次提供的积分加成额外增加5分。',
        price: 150,
        type: 'crow',
        subtype: 'score',
        rarity: 2,
        onOtherCrowActivate: function(game, activatedCrow, effectValue) {
            if (activatedCrow.subtype === 'score' && activatedCrow.id !== this.id) {
                return {
                    scoreModifiers: [{
                        type: 'addition',
                        value: 5,
                        description: '反哺乌鸦: 额外+5分'
                    }]
                };
            }
            return null;
        }
    },
    
    // ========== 积分系 - 提高消除棋子数 ==========
    '0007': {
        id: '0007',
        name: '膨胀乌鸦',
        icon: '🎈',
        description: '消除时，额外将1枚与被消除棋子相邻（8方向）的我方同色棋子计入消除（若存在）。',
        price: 100,
        type: 'crow',
        subtype: 'elimination_count',
        rarity: 1,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            const additionalCells = this.findAdjacentPlayerPieces(game, eliminatedCells);
            
            if (additionalCells.length > 0) {
                return {
                    additionalEliminations: additionalCells,
                    description: `膨胀乌鸦: 额外消除${additionalCells.length}子`
                };
            }
            return null;
        },
        findAdjacentPlayerPieces: function(game, eliminatedCells) {
            const additional = [];
            const checked = new Set(eliminatedCells);
            
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1], [0, 1],
                    [1, -1], [1, 0], [1, 1]
                ];
                
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    const newPos = `${newRow},${newCol}`;
                    
                    if (!checked.has(newPos) && 
                        game.isValidPosition(newRow, newCol) &&
                        game.board[newRow][newCol].type === 'player') {
                        additional.push(newPos);
                        checked.add(newPos);
                        break;
                    }
                }
                
                if (additional.length > 0) break;
            }
            
            return additional;
        }
    },
    
    '0008': {
        id: '0008',
        name: '引力乌鸦',
        icon: '🌀',
        description: '消除时，额外将1枚与被消除棋子相邻（8方向）的敌方棋子转化为我方棋子并计入消除（若存在）。',
        price: 150,
        type: 'crow',
        subtype: 'elimination_count',
        rarity: 2,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            const converted = this.convertAdjacentAIPieces(game, eliminatedCells);
            
            if (converted.length > 0) {
                return {
                    additionalEliminations: converted,
                    description: `引力乌鸦: 转化消除${converted.length}子`
                };
            }
            return null;
        },
        convertAdjacentAIPieces: function(game, eliminatedCells) {
            const converted = [];
            
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                
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
                        converted.push(`${newRow},${newCol}`);
                        break;
                    }
                }
                
                if (converted.length > 0) break;
            }
            
            return converted;
        }
    },
    
    '0009': {
        id: '0009',
        name: '连锁乌鸦',
        icon: '⛓️',
        description: '若本次消除棋子数≥7，则额外消除紧邻格内的所有敌方棋子。',
        price: 200,
        type: 'crow',
        subtype: 'elimination_count',
        rarity: 2,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            
            if (eliminatedCells.size >= 7) {
                const additional = this.eliminateAllAdjacentAI(game, eliminatedCells);
                
                if (additional.length > 0) {
                    return {
                        additionalEliminations: additional,
                        description: `连锁乌鸦: 连锁消除${additional.length}子`
                    };
                }
            }
            return null;
        },
        eliminateAllAdjacentAI: function(game, eliminatedCells) {
            const additional = [];
            const checked = new Set(eliminatedCells);
            
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1], [0, 1],
                    [1, -1], [1, 0], [1, 1]
                ];
                
                for (const [dx, dy] of directions) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    const newPos = `${newRow},${newCol}`;
                    
                    if (!checked.has(newPos) && 
                        game.isValidPosition(newRow, newCol) &&
                        game.board[newRow][newCol].type === 'ai') {
                        additional.push(newPos);
                        checked.add(newPos);
                    }
                }
            }
            
            return additional;
        }
    },
    
    // ========== 积分系 - 阵型提升 ==========
    '0010': {
        id: '0010',
        name: '方阵乌鸦',
        icon: '🟦',
        description: '每次消除使阵型等级+0.1（向下取整，每局首次消除必定+1）。',
        price: 100,
        type: 'crow',
        subtype: 'formation',
        rarity: 1,
        elimination: function(game, data) {
            const { formationType } = data;
            
            if (!this.firstEliminationDone) {
                this.firstEliminationDone = true;
                return {
                    formationModifiers: [{
                        formation: formationType,
                        value: 1,
                        description: '方阵乌鸦: 首次消除+1级'
                    }]
                };
            } else {
                if (!this.fraction) this.fraction = 0;
                this.fraction += 0.1;
                
                if (this.fraction >= 1) {
                    const increase = Math.floor(this.fraction);
                    this.fraction -= increase;
                    
                    return {
                        formationModifiers: [{
                            formation: formationType,
                            value: increase,
                            description: '方阵乌鸦: 累计消除+1级'
                        }]
                    };
                }
            }
            return null;
        },
        gameStart: function(game) {
            this.firstEliminationDone = false;
            this.fraction = 0;
        }
    },
    
    '0011': {
        id: '0011',
        name: '军阵乌鸦',
        icon: '⚔️',
        description: '若消除的棋子全部为横向或竖向，阵型等级额外+0.3。',
        price: 150,
        type: 'crow',
        subtype: 'formation',
        rarity: 2,
        elimination: function(game, data) {
            const { formationType, eliminatedCells } = data;
            
            if (formationType === 'horizontal' || formationType === 'vertical') {
                if (!this.fraction) this.fraction = 0;
                this.fraction += 0.3;
                
                if (this.fraction >= 1) {
                    const increase = Math.floor(this.fraction);
                    this.fraction -= increase;
                    
                    return {
                        formationModifiers: [{
                            formation: formationType,
                            value: increase,
                            description: '军阵乌鸦: 横竖阵型额外升级'
                        }]
                    };
                }
            }
            return null;
        }
    },
    
    '0012': {
        id: '0012',
        name: '雁行乌鸦',
        icon: '🏹',
        description: '若消除的棋子全部为斜向，阵型等级额外+0.4。',
        price: 150,
        type: 'crow',
        subtype: 'formation',
        rarity: 2,
        elimination: function(game, data) {
            const { formationType, eliminatedCells } = data;
            
            if (formationType === 'diagonalLeft' || formationType === 'diagonalRight') {
                if (!this.fraction) this.fraction = 0;
                this.fraction += 0.4;
                
                if (this.fraction >= 1) {
                    const increase = Math.floor(this.fraction);
                    this.fraction -= increase;
                    
                    return {
                        formationModifiers: [{
                            formation: formationType,
                            value: increase,
                            description: '雁行乌鸦: 斜向阵型额外升级'
                        }]
                    };
                }
            }
            return null;
        }
    },
    
    // ========== 积分系 - 提高比例系数 ==========
    '0013': {
        id: '0013',
        name: '倍率乌鸦',
        icon: '📊',
        description: '本次消除结算积分时，最终积分乘以1.2倍。',
        price: 150,
        type: 'crow',
        subtype: 'score_multiplier',
        rarity: 2,
        elimination: function(game, data) {
            return {
                scoreModifiers: [{
                    type: 'multiplier',
                    value: 1.2,
                    description: '倍率乌鸦: 积分×1.2'
                }]
            };
        }
    },
    
    '0014': {
        id: '0014',
        name: '双倍乌鸦',
        icon: '2️⃣',
        description: '若阵型等级≥5，本次消除结算积分翻倍。',
        price: 250,
        type: 'crow',
        subtype: 'score_multiplier',
        rarity: 3,
        elimination: function(game, data) {
            const { formationType } = data;
            const formationLevel = game.formations[formationType];
            
            if (formationLevel >= 5) {
                return {
                    scoreModifiers: [{
                        type: 'multiplier',
                        value: 2.0,
                        description: '双倍乌鸦: 阵型≥5级，积分翻倍'
                    }]
                };
            }
            return null;
        }
    },
    
    '0015': {
        id: '0015',
        name: '递增进乌鸦',
        icon: '📈',
        description: '本局每触发过5次消除，所有消除的最终积分系数永久+0.1（上限+1.0）。',
        price: 150,
        type: 'crow',
        subtype: 'score_multiplier',
        rarity: 2,
        gameStart: function(game) {
            this.eliminationCount = 0;
            this.bonusMultiplier = 0;
        },
        elimination: function(game, data) {
            this.eliminationCount++;
            
            if (this.eliminationCount % 5 === 0 && this.bonusMultiplier < 1.0) {
                this.bonusMultiplier += 0.1;
                return {
                    scoreModifiers: [{
                        type: 'multiplier',
                        value: 1 + this.bonusMultiplier,
                        description: `递增进乌鸦: 永久积分系数+0.1 (当前+${this.bonusMultiplier})`
                    }]
                };
            }
            return null;
        }
    },
    
    // ========== 积分系 - 额外加数 ==========
    '0016': {
        id: '0016',
        name: '额外积分乌鸦',
        icon: '➕',
        description: '每次消除额外获得20积分。',
        price: 100,
        type: 'crow',
        subtype: 'score_bonus',
        rarity: 1,
        elimination: function(game, data) {
            return {
                scoreModifiers: [{
                    type: 'addition',
                    value: 20,
                    description: '额外积分乌鸦: +20分'
                }]
            };
        }
    },
    
    '0017': {
        id: '0017',
        name: '成就乌鸦',
        icon: '🏆',
        description: '若一次性消除棋子数≥10，额外获得100积分。',
        price: 150,
        type: 'crow',
        subtype: 'score_bonus',
        rarity: 2,
        elimination: function(game, data) {
            const { pieceCount } = data;
            
            if (pieceCount >= 10) {
                return {
                    scoreModifiers: [{
                        type: 'addition',
                        value: 100,
                        description: '成就乌鸦: 消除≥10子，额外+100分'
                    }]
                };
            }
            return null;
        }
    },
    
    '0018': {
        id: '0018',
        name: '连胜奖励乌鸦',
        icon: '🔥',
        description: '每连续两回合触发消除，本次消除额外获得30积分。',
        price: 150,
        type: 'crow',
        subtype: 'score_bonus',
        rarity: 2,
        elimination: function(game, data) {
            if (!game.consecutiveEliminationTurns) game.consecutiveEliminationTurns = 0;
            game.consecutiveEliminationTurns++;
            
            if (game.consecutiveEliminationTurns >= 2) {
                return {
                    scoreModifiers: [{
                        type: 'addition',
                        value: 30,
                        description: '连胜奖励乌鸦: 连续消除额外+30分'
                    }]
                };
            }
            return null;
        },
        turnEnd: function(game) {
            if (!game.lastTurnHadElimination) {
                game.consecutiveEliminationTurns = 0;
            }
            game.lastTurnHadElimination = false;
        }
    },
    
    // ========== 货币系 - 新的货币计算机制 ==========
    '0019': {
        id: '0019',
        name: '银币乌鸦',
        icon: '🪙',
        description: '过关奖金额外增加（本局获得总积分的5%）。',
        price: 150,
        type: 'crow',
        subtype: 'money',
        rarity: 2,
        gameWin: function(game, data) {
            const bonus = Math.floor(game.currentScore * 0.05);
            return {
                moneyModifiers: [{
                    type: 'addition',
                    value: bonus,
                    description: `银币乌鸦: 积分5%奖金+${bonus}`
                }]
            };
        }
    },
    
    '0020': {
        id: '0020',
        name: '金币乌鸦',
        icon: '💰',
        description: '过关奖金计算公式中的"剩余棋子数x"改为"剩余棋子数 * 1.5"。',
        price: 250,
        type: 'crow',
        subtype: 'money',
        rarity: 3,
        constant: true
    },
    
    '0021': {
        id: '0021',
        name: '股息乌鸦',
        icon: '📈',
        description: '商店阶段，获得当前持有金币总数的2%作为额外金币。',
        price: 200,
        type: 'crow',
        subtype: 'money',
        rarity: 3,
        shopPhase: function(game) {
            const bonus = Math.floor(game.money * 0.02);
            return {
                moneyModifiers: [{
                    type: 'addition',
                    value: bonus,
                    description: `股息乌鸦: 持有金币2%+${bonus}`
                }]
            };
        }
    },
    
    '0022': {
        id: '0022',
        name: '红包乌鸦',
        icon: '🧧',
        description: '过关后额外获得80金币。',
        price: 100,
        type: 'crow',
        subtype: 'money',
        rarity: 1,
        gameWin: function(game, data) {
            return {
                moneyModifiers: [{
                    type: 'addition',
                    value: 80,
                    description: '红包乌鸦: 过关额外+80金币'
                }]
            };
        }
    },
    
    '0023': {
        id: '0023',
        name: '财神乌鸦',
        icon: '👑',
        description: '每次消除有20%概率获得20金币。',
        price: 150,
        type: 'crow',
        subtype: 'money',
        rarity: 2,
        probability: 0.2,
        elimination: function(game, data) {
            if (Math.random() < this.probability) {
                return {
                    moneyModifiers: [{
                        type: 'addition',
                        value: 20,
                        description: '财神乌鸦: 概率获得20金币'
                    }]
                };
            }
            return null;
        }
    },
    
    '0024': {
        id: '0024',
        name: '赏金乌鸦',
        icon: '🎯',
        description: '玩家落子后，若该落子直接阻止了AI形成一个4连（即AI在此处落子即连5），则获得150金币。',
        price: 200,
        type: 'crow',
        subtype: 'money',
        rarity: 3,
        playerMove: function(game, data) {
            const { row, col } = data;
            
            // 检查是否阻止了AI的4连
            game.board[row][col].type = 'ai';
            const aiLines = game.checkLines(row, col, 'ai', 5);
            game.board[row][col].type = 'empty';
            
            if (aiLines.length > 0) {
                return {
                    moneyModifiers: [{
                        type: 'addition',
                        value: 150,
                        description: '赏金乌鸦: 阻止AI4连获得150金币'
                    }]
                };
            }
            return null;
        }
    },
    
    // ========== 货币系 - 减少扣钱 ==========
    '0025': {
        id: '0025',
        name: '节俭乌鸦',
        icon: '💸',
        description: '商店所有商品价格永久降低15%。',
        price: 100,
        type: 'crow',
        subtype: 'money',
        rarity: 1,
        constant: true,
        shopDiscount: 0.85
    },
    
    '0026': {
        id: '0026',
        name: '砍价乌鸦',
        icon: '🤝',
        description: '购买技能牌时，有25%概率价格减半。',
        price: 150,
        type: 'crow',
        subtype: 'money',
        rarity: 2,
        probability: 0.25,
        beforeShopPurchase: function(game, item, price) {
            if (Math.random() < this.probability && item.type === 'crow') {
                return {
                    priceModifier: 0.5,
                    description: '砍价乌鸦: 价格减半'
                };
            }
            return null;
        }
    },
    
    '0027': {
        id: '0027',
        name: '免单乌鸦',
        icon: '🆓',
        description: '每局首次购买任意商品免费。',
        price: 200,
        type: 'crow',
        subtype: 'money',
        rarity: 3,
        gameStart: function(game) {
            this.firstPurchaseFree = true;
        },
        beforeShopPurchase: function(game, item, price) {
            if (this.firstPurchaseFree) {
                this.firstPurchaseFree = false;
                return {
                    priceModifier: 0,
                    description: '免单乌鸦: 首次购买免费'
                };
            }
            return null;
        }
    },
    
    // ========== 商品系 - 重抽商品 ==========
    '0028': {
        id: '0028',
        name: '刷新乌鸦',
        icon: '🔄',
        description: '每局限一次，可以免费重抽商店。',
        price: 100,
        type: 'crow',
        subtype: 'shop',
        rarity: 1,
        gameStart: function(game) {
            this.freeRerollUsed = false;
        },
        beforeShopReroll: function(game, price) {
            if (!this.freeRerollUsed) {
                this.freeRerollUsed = true;
                return {
                    priceModifier: 0,
                    description: '刷新乌鸦: 免费重抽'
                };
            }
            return null;
        }
    },
    
    '0029': {
        id: '0029',
        name: '洗牌乌鸦',
        icon: '🎴',
        description: '重抽商店时，有50%概率不消耗金币。',
        price: 150,
        type: 'crow',
        subtype: 'shop',
        rarity: 2,
        probability: 0.5,
        beforeShopReroll: function(game, price) {
            if (Math.random() < this.probability) {
                return {
                    priceModifier: 0,
                    description: '洗牌乌鸦: 概率免费重抽'
                };
            }
            return null;
        }
    },
    
    '0030': {
        id: '0030',
        name: '锁池乌鸦',
        icon: '🔒',
        description: '商店刷新时，可以锁定其中1个商品槽不被刷新。',
        price: 200,
        type: 'crow',
        subtype: 'shop',
        rarity: 3,
        constant: true
    },
    
    // ========== 战斗子类 - 攻击系 ==========
    '0031': {
        id: '0031',
        name: '破防乌鸦',
        icon: '⚔️',
        description: '我方棋子形成消除所需的数量-1（最低为4）。',
        price: 100,
        type: 'crow',
        subtype: 'combat',
        rarity: 1,
        constant: true,
        gameStart: function(game) {
            game.playerWinRequirement = 4;
            return {
                specialModifiers: [{
                    type: 'reduce_win_requirement',
                    value: 1,
                    description: '破防乌鸦: 我方只需4子获胜'
                }]
            };
        }
    },
    
    '0032': {
        id: '0032',
        name: '穿透乌鸦',
        icon: '🎯',
        description: '若本次落子位置与上回合我方落子位置距离≥4格，则本回合我方消除所需数量临时-1。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        playerMove: function(game, data) {
            const { row, col } = data;
            
            if (game.lastPlayerMove) {
                const [lastRow, lastCol] = game.lastPlayerMove;
                const distance = Math.sqrt(Math.pow(row - lastRow, 2) + Math.pow(col - lastCol, 2));
                
                if (distance >= 4) {
                    game.temporaryWinRequirement = 4;
                    return {
                        specialModifiers: [{
                            type: 'temporary_reduce_win_requirement',
                            value: 1,
                            description: '穿透乌鸦: 距离≥4格，本回合只需4子'
                        }]
                    };
                }
            }
            
            game.lastPlayerMove = [row, col];
            return null;
        }
    },
    
    '0033': {
        id: '0033',
        name: '瓦解乌鸦',
        icon: '💥',
        description: '每当我方在一行/一列/一斜线上已有4枚棋子时，在此线上落子可立即消除这5枚棋子（视为达成条件）。',
        price: 200,
        type: 'crow',
        subtype: 'combat',
        rarity: 3,
        playerMove: function(game, data) {
            const { row, col } = data;
            
            // 检查四个方向
            const directions = [
                [0, 1], [1, 0], [1, 1], [1, -1]
            ];
            
            for (const [dx, dy] of directions) {
                let playerCount = 1; // 当前位置
                let lineCells = [[row, col]];
                
                // 正向检查
                for (let i = 1; i < 5; i++) {
                    const newRow = row + i * dx;
                    const newCol = col + i * dy;
                    
                    if (game.isValidPosition(newRow, newCol) && 
                        game.board[newRow][newCol].type === 'player') {
                        playerCount++;
                        lineCells.push([newRow, newCol]);
                    } else {
                        break;
                    }
                }
                
                // 反向检查
                for (let i = 1; i < 5; i++) {
                    const newRow = row - i * dx;
                    const newCol = col - i * dy;
                    
                    if (game.isValidPosition(newRow, newCol) && 
                        game.board[newRow][newCol].type === 'player') {
                        playerCount++;
                        lineCells.push([newRow, newCol]);
                    } else {
                        break;
                    }
                }
                
                if (playerCount >= 5) {
                    // 触发消除
                    return {
                        immediateElimination: lineCells.slice(0, 5),
                        description: '瓦解乌鸦: 4子时落子立即消除'
                    };
                }
            }
            
            return null;
        }
    },
    
    '0034': {
        id: '0034',
        name: '同化乌鸦',
        icon: '🔄',
        description: '每回合可以把随机一枚夹在我方棋子中间的敌方棋子转化为我方棋子，发动后进入1回合冷却。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        cooldown: 0,
        turnStart: function(game) {
            if (this.cooldown > 0) {
                this.cooldown--;
                return null;
            }
            
            const converted = this.convertTrappedAI(game);
            if (converted) {
                this.cooldown = 1;
                return {
                    specialModifiers: [{
                        type: 'piece_conversion',
                        position: converted,
                        description: '同化乌鸦: 转化被困AI棋子'
                    }]
                };
            }
            return null;
        },
        convertTrappedAI: function(game) {
            for (let row = 0; row < game.boardSize; row++) {
                for (let col = 0; col < game.boardSize; col++) {
                    if (game.board[row][col].type === 'ai') {
                        let trapped = true;
                        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
                        
                        for (const [dx, dy] of directions) {
                            const newRow = row + dx;
                            const newCol = col + dy;
                            
                            if (game.isValidPosition(newRow, newCol)) {
                                if (game.board[newRow][newCol].type !== 'player') {
                                    trapped = false;
                                    break;
                                }
                            } else {
                                trapped = false;
                                break;
                            }
                        }
                        
                        if (trapped) {
                            return [row, col];
                        }
                    }
                }
            }
            return null;
        }
    },
    
    '0035': {
        id: '0035',
        name: '跳跃乌鸦',
        icon: '🐇',
        description: '落子时，可将棋子放在一个空格上，并将此格相邻的一枚敌方棋子推开一格（若方向有空位）。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        playerMove: function(game, data) {
            const { row, col } = data;
            
            // 检查周围是否有AI棋子可以推开
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            
            for (const [dx, dy] of directions) {
                const aiRow = row + dx;
                const aiCol = col + dy;
                const pushRow = aiRow + dx;
                const pushCol = aiCol + dy;
                
                if (game.isValidPosition(aiRow, aiCol) && 
                    game.board[aiRow][aiCol].type === 'ai' &&
                    game.isValidPosition(pushRow, pushCol) && 
                    game.board[pushRow][pushCol].type === 'empty') {
                    
                    // 推开AI棋子
                    return {
                        specialModifiers: [{
                            type: 'push_ai_piece',
                            from: [aiRow, aiCol],
                            to: [pushRow, pushCol],
                            description: '跳跃乌鸦: 推开相邻AI棋子'
                        }]
                    };
                }
            }
            
            return null;
        }
    },
    
    '0036': {
        id: '0036',
        name: '置换乌鸦',
        icon: '🔄',
        description: '每3回合，可以选择交换棋盘上任意两枚棋子的位置（敌我皆可）。',
        price: 200,
        type: 'crow',
        subtype: 'combat',
        rarity: 3,
        cooldown: 0,
        turnStart: function(game) {
            if (this.cooldown > 0) {
                this.cooldown--;
                return null;
            }
            
            this.cooldown = 3;
            game.showMessage('置换乌鸦可用: 请选择两个要交换的棋子位置');
            game.isSelectingSwap = true;
            game.swapSelection = [];
            return null;
        }
    },
    
    '0037': {
        id: '0037',
        name: '围墙乌鸦',
        icon: '🧱',
        description: '玩家落子后，若该子与另两枚我方棋子构成一个等腰直角三角形，则立即消除这个三角形区域内的所有棋子（敌我皆可）。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        playerMove: function(game, data) {
            const { row, col } = data;
            
            // 检查可能的等腰直角三角形
            const patterns = [
                // 直角在(row, col)
                [[0, 1], [1, 0], [1, 1]],  // 右下
                [[0, 1], [-1, 0], [-1, 1]], // 右上
                [[0, -1], [1, 0], [1, -1]], // 左下
                [[0, -1], [-1, 0], [-1, -1]],// 左上
                
                // 直角在其他位置
                [[1, 0], [0, 1], [1, 1]],  // 直角在右下
                [[-1, 0], [0, 1], [-1, 1]], // 直角在右上
                [[1, 0], [0, -1], [1, -1]], // 直角在左下
                [[-1, 0], [0, -1], [-1, -1]] // 直角在左上
            ];
            
            for (const pattern of patterns) {
                const [p1, p2, p3] = pattern;
                const positions = [
                    [row + p1[0], col + p1[1]],
                    [row + p2[0], col + p2[1]],
                    [row + p3[0], col + p3[1]]
                ];
                
                let allValid = true;
                let playerCount = 0;
                
                for (const [r, c] of positions) {
                    if (!game.isValidPosition(r, c)) {
                        allValid = false;
                        break;
                    }
                    if (game.board[r][c].type === 'player') {
                        playerCount++;
                    }
                }
                
                if (allValid && playerCount >= 2) {
                    // 找到等腰直角三角形，消除区域内所有棋子
                    const eliminationCells = [
                        `${row},${col}`,
                        ...positions.map(([r, c]) => `${r},${c}`)
                    ];
                    
                    return {
                        immediateElimination: eliminationCells,
                        description: '围墙乌鸦: 等腰直角三角形消除'
                    };
                }
            }
            
            return null;
        }
    },
    
    '0038': {
        id: '0038',
        name: '徘徊乌鸦',
        icon: '👻',
        description: '触发消除的每枚玩家棋子有20%概率不被消除，保留在棋盘上。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        probability: 0.2,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            const preservedCells = [];
            
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                if (game.board[row][col].type === 'player' && Math.random() < this.probability) {
                    preservedCells.push(pos);
                }
            }
            
            if (preservedCells.length > 0) {
                return {
                    preservedCells: preservedCells,
                    description: `徘徊乌鸦: ${preservedCells.length}子保留`
                };
            }
            return null;
        }
    },
    
    '0039': {
        id: '0039',
        name: '掉帧乌鸦',
        icon: '💫',
        description: '触发消除的棋子不会立即消失，而是在接下来的3回合内，每回合随机消失其中2枚。期间这些棋子仍可被其他效果互动。',
        price: 100,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            
            if (!game.delayedEliminations) {
                game.delayedEliminations = [];
            }
            
            game.delayedEliminations.push({
                cells: Array.from(eliminatedCells),
                turns: 3,
                description: '掉帧乌鸦: 延迟消除'
            });
            
            return {
                specialModifiers: [{
                    type: 'delayed_elimination',
                    cells: Array.from(eliminatedCells),
                    description: '掉帧乌鸦: 棋子延迟3回合消除'
                }]
            };
        }
    },
    
    '0040': {
        id: '0040',
        name: '道具联动乌鸦',
        icon: '🔗',
        description: '每当一张道具牌生效时，随机一张我方技能牌的冷却时间减少1回合。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        itemUse: function(game, data) {
            // 查找有冷却的乌鸦牌
            const crowsWithCooldown = [];
            for (let i = 0; i < game.crowSlots.length; i++) {
                const crow = game.crowSlots[i];
                if (crow && crow.cooldown && crow.cooldown > 0) {
                    crowsWithCooldown.push(i);
                }
            }
            
            if (crowsWithCooldown.length > 0) {
                const randomIndex = crowsWithCooldown[Math.floor(Math.random() * crowsWithCooldown.length)];
                const crow = game.crowSlots[randomIndex];
                crow.cooldown = Math.max(0, crow.cooldown - 1);
                
                return {
                    specialModifiers: [{
                        type: 'reduce_cooldown',
                        target: 'crow',
                        index: randomIndex,
                        description: `道具联动乌鸦: ${crow.name}冷却-1`
                    }]
                };
            }
            return null;
        }
    },
    
    '0041': {
        id: '0041',
        name: '电镀联动乌鸦',
        icon: '✨',
        description: '一张电镀牌生效时，其目标相邻的另一个位置也获得相同的电镀效果。',
        price: 200,
        type: 'crow',
        subtype: 'combat',
        rarity: 3,
        constant: true
    },
    
    '0042': {
        id: '0042',
        name: '整蛊联动乌鸦',
        icon: '🎭',
        description: '整蛊牌生效时，其持续时间增加1回合。',
        price: 150,
        type: 'crow',
        subtype: 'combat',
        rarity: 2,
        itemUse: function(game, data) {
            if (data.item && data.item.subtype === 'trap') {
                // 增加情绪持续时间
                if (game.emotionTurns) {
                    game.emotionTurns += 1;
                    return {
                        specialModifiers: [{
                            type: 'extend_emotion',
                            turns: 1,
                            description: '整蛊联动乌鸦: 情绪效果+1回合'
                        }]
                    };
                }
            }
            return null;
        }
    },
    
    // ========== 战斗子类 - 防御系 ==========
    '0043': {
        id: '0043',
        name: '加固乌鸦',
        icon: '🛡️',
        description: 'AI连成五子所需棋子数+1（即需要6子）。',
        price: 100,
        type: 'crow',
        subtype: 'defense',
        rarity: 1,
        constant: true,
        gameStart: function(game) {
            game.aiWinRequirement = 6;
            return {
                specialModifiers: [{
                    type: 'ai_win_requirement',
                    value: 6,
                    description: '加固乌鸦: AI需要6子获胜'
                }]
            };
        }
    },
    
    '0044': {
        id: '0044',
        name: '迷雾乌鸦',
        icon: '🌫️',
        description: 'AI每回合有30%概率其落子位置随机偏移1格（若偏移后位置被占则无效）。',
        price: 150,
        type: 'crow',
        subtype: 'defense',
        rarity: 2,
        probability: 0.3,
        aiMove: function(game, data) {
            if (Math.random() < this.probability) {
                return {
                    specialModifiers: [{
                        type: 'ai_offset',
                        description: '迷雾乌鸦: AI落子位置偏移'
                    }]
                };
            }
            return null;
        }
    },
    
    '0045': {
        id: '0045',
        name: '干扰乌鸦',
        icon: '📡',
        description: 'AI回合开始时，有25%概率其本回合不能在最长的连子路径上落子。',
        price: 150,
        type: 'crow',
        subtype: 'defense',
        rarity: 2,
        probability: 0.25,
        turnStart: function(game) {
            if (!game.isPlayerTurn && Math.random() < this.probability) {
                game.aiBlockedFromLongestLine = true;
                return {
                    specialModifiers: [{
                        type: 'block_ai_longest',
                        description: '干扰乌鸦: AI不能在最长连子路径落子'
                    }]
                };
            }
            return null;
        }
    },
    
    '0046': {
        id: '0046',
        name: '禁锢乌鸦',
        icon: '🔒',
        description: 'AI不能将棋子放在与我方棋子相邻（8方向）的位置。',
        price: 100,
        type: 'crow',
        subtype: 'defense',
        rarity: 1,
        constant: true,
        aiMove: function(game, data) {
            // 在AI策略中处理
            return null;
        }
    },
    
    '0047': {
        id: '0047',
        name: '流放乌鸦',
        icon: '🚫',
        description: 'AI每3回合，必须有一子落在棋盘最外一圈的边缘格上。',
        price: 150,
        type: 'crow',
        subtype: 'defense',
        rarity: 2,
        constant: true,
        turnStart: function(game) {
            if (!game.isPlayerTurn && game.round % 3 === 0) {
                game.aiMustPlaceOnEdge = true;
                return {
                    specialModifiers: [{
                        type: 'force_ai_edge',
                        description: '流放乌鸦: AI必须在边缘落子'
                    }]
                };
            }
            return null;
        }
    },
    
    '0048': {
        id: '0048',
        name: '枷锁乌鸦',
        icon: '⛓️',
        description: 'AI不能连续两回合在同一行或同一列落子。',
        price: 200,
        type: 'crow',
        subtype: 'defense',
        rarity: 3,
        constant: true
    },
    
    '0049': {
        id: '0049',
        name: '积分减压乌鸦',
        icon: '📉',
        description: '本局通关所需积分减少20%。',
        price: 100,
        type: 'crow',
        subtype: 'defense',
        rarity: 1,
        gameStart: function(game) {
            game.targetScore = Math.floor(game.targetScore * 0.8);
            return {
                specialModifiers: [{
                    type: 'requirement_reduce',
                    value: 20,
                    description: '积分减压乌鸦: 目标积分-20%'
                }]
            };
        }
    },
    
    '0050': {
        id: '0050',
        name: '积分赦免乌鸦',
        icon: '🙏',
        description: '每当我方棋子被消耗（消除或自然耗尽）累计10枚，通关所需积分减少5%。',
        price: 150,
        type: 'crow',
        subtype: 'defense',
        rarity: 2,
        gameStart: function(game) {
            this.consumedCount = 0;
        },
        elimination: function(game, data) {
            this.consumedCount += data.pieceCount;
            
            if (this.consumedCount >= 10) {
                const reduction = Math.floor(game.targetScore * 0.05);
                game.targetScore = Math.max(1, game.targetScore - reduction);
                this.consumedCount = 0;
                
                return {
                    specialModifiers: [{
                        type: 'requirement_reduce',
                        value: 5,
                        description: '积分赦免乌鸦: 消耗10子，目标积分-5%'
                    }]
                };
            }
            return null;
        },
        pieceUsed: function(game) {
            this.consumedCount++;
            
            if (this.consumedCount >= 10) {
                const reduction = Math.floor(game.targetScore * 0.05);
                game.targetScore = Math.max(1, game.targetScore - reduction);
                this.consumedCount = 0;
                
                return {
                    specialModifiers: [{
                        type: 'requirement_reduce',
                        value: 5,
                        description: '积分赦免乌鸦: 消耗10子，目标积分-5%'
                    }]
                };
            }
            return null;
        }
    },
    
    '0051': {
        id: '0051',
        name: '积分缓释乌鸦',
        icon: '⏳',
        description: '每回合，通关所需积分减少1点。',
        price: 200,
        type: 'crow',
        subtype: 'defense',
        rarity: 3,
        turnEnd: function(game) {
            game.targetScore = Math.max(1, game.targetScore - 1);
            return {
                specialModifiers: [{
                    type: 'requirement_reduce_per_turn',
                    value: 1,
                    description: '积分缓释乌鸦: 每回合目标积分-1'
                }]
            };
        }
    },
    
    // ========== 战斗子类 - 生命系 ==========
    '0052': {
        id: '0052',
        name: '免死金牌乌鸦',
        icon: '🛡️',
        description: '当AI即将连成五子导致游戏失败时，阻止其一次，并随机清除AI 3枚棋子。每局限一次。',
        price: 300,
        type: 'crow',
        subtype: 'life',
        rarity: 3,
        gameStart: function(game) {
            this.used = false;
        },
        beforeGameLose: function(game) {
            if (!this.used) {
                this.used = true;
                
                // 随机清除AI 3枚棋子
                const aiCells = [];
                for (let row = 0; row < game.boardSize; row++) {
                    for (let col = 0; col < game.boardSize; col++) {
                        if (game.board[row][col].type === 'ai') {
                            aiCells.push([row, col]);
                        }
                    }
                }
                
                const cellsToRemove = [];
                for (let i = 0; i < Math.min(3, aiCells.length); i++) {
                    const randomIndex = Math.floor(Math.random() * aiCells.length);
                    cellsToRemove.push(aiCells[randomIndex]);
                    aiCells.splice(randomIndex, 1);
                }
                
                return {
                    preventLose: true,
                    removeAICells: cellsToRemove,
                    description: '免死金牌乌鸦: 阻止失败并清除AI棋子'
                };
            }
            return null;
        }
    },
    
    '0053': {
        id: '0053',
        name: '复活乌鸦',
        icon: '💫',
        description: '当我方棋子耗尽时，立即补充10枚棋子，但本局之后所有消除积分减少20%。',
        price: 200,
        type: 'crow',
        subtype: 'life',
        rarity: 2,
        beforeGameLose: function(game) {
            if (game.usedPieces >= game.playerPieces) {
                game.playerPieces += 10;
                game.globalScoreMultiplier *= 0.8;
                
                return {
                    preventLose: true,
                    specialModifiers: [{
                        type: 'revive',
                        pieces: 10,
                        description: '复活乌鸦: 补充10棋子，但积分-20%'
                    }]
                };
            }
            return null;
        }
    },
    
    '0054': {
        id: '0054',
        name: '不朽乌鸦',
        icon: '♾️',
        description: '每局游戏可承受一次AI连成五子而不失败（清除那5子），但之后三局初始积分要求增加50%。',
        price: 250,
        type: 'crow',
        subtype: 'life',
        rarity: 3,
        gameStart: function(game) {
            this.used = false;
        },
        beforeGameLose: function(game) {
            if (!this.used) {
                this.used = true;
                game.nextThreeLevelsHarder = 3;
                
                return {
                    preventLose: true,
                    specialModifiers: [{
                        type: 'immortal',
                        description: '不朽乌鸦: 承受一次AI五子，但后续3关更难'
                    }]
                };
            }
            return null;
        }
    },
    
    '0055': {
        id: '0055',
        name: '治疗乌鸦',
        icon: '❤️',
        description: '每次成功消除，恢复1枚棋子。',
        price: 100,
        type: 'crow',
        subtype: 'life',
        rarity: 1,
        elimination: function(game, data) {
            return {
                pieceModifiers: [{
                    type: 'addition',
                    value: 1,
                    description: '治疗乌鸦: 恢复1棋子'
                }]
            };
        }
    },
    
    '0056': {
        id: '0056',
        name: '滋养乌鸦',
        icon: '🌱',
        description: '每回合开始时，若我方棋子数少于15，则恢复2枚棋子。',
        price: 150,
        type: 'crow',
        subtype: 'life',
        rarity: 2,
        turnStart: function(game) {
            const remainingPieces = game.playerPieces - game.usedPieces;
            
            if (remainingPieces < 15) {
                return {
                    pieceModifiers: [{
                        type: 'addition',
                        value: 2,
                        description: '滋养乌鸦: 棋子<15，恢复2棋子'
                    }]
                };
            }
            return null;
        }
    },
    
    '0057': {
        id: '0057',
        name: '吞噬恢复乌鸦',
        icon: '🦴',
        description: '每消除一枚由"同化乌鸦"或"引力乌鸦"等效果转化而来的敌方棋子，额外恢复3枚棋子。',
        price: 200,
        type: 'crow',
        subtype: 'life',
        rarity: 3,
        elimination: function(game, data) {
            const { eliminatedCells } = data;
            let convertedCount = 0;
            
            // 检查是否有转化效果触发的消除
            for (const pos of eliminatedCells) {
                const [row, col] = pos.split(',').map(Number);
                // 这里需要检查棋子的来源标记，简化实现
                if (game.board[row][col].wasAI) {
                    convertedCount++;
                }
            }
            
            if (convertedCount > 0) {
                const restoreCount = convertedCount * 3;
                return {
                    pieceModifiers: [{
                        type: 'addition',
                        value: restoreCount,
                        description: `吞噬恢复乌鸦: 转化消除${convertedCount}子，恢复${restoreCount}棋子`
                    }]
                };
            }
            return null;
        }
    },
    
    // ========== 特殊子类 ==========
    '0058': {
        id: '0058',
        name: '克隆乌鸦',
        icon: '👯',
        description: '每次玩家落子后，若右侧邻近位置存在除自己外的乌鸦牌，则复制该乌鸦牌的全部效果（不包括复制效果本身）并将其摧毁。最多可携带3张乌鸦牌效果。',
        price: 200,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        maxCopies: 3,
        playerMove: function(game, data) {
            const crowIndex = data.crowIndex;
            
            if (this.copiedEffects && this.copiedEffects.length >= this.maxCopies) {
                return null;
            }
            
            if (crowIndex < game.crowSlots.length - 1) {
                const rightCrow = game.crowSlots[crowIndex + 1];
                if (rightCrow && rightCrow.id !== this.id) {
                    if (!this.copiedEffects) this.copiedEffects = [];
                    this.copiedEffects.push({
                        id: rightCrow.id,
                        name: rightCrow.name,
                        effects: { ...rightCrow }
                    });
                    
                    return {
                        destroy: {
                            type: 'crow',
                            index: crowIndex + 1,
                            reason: '被克隆乌鸦复制'
                        },
                        description: `克隆乌鸦: 复制了${rightCrow.name}`
                    };
                }
            }
            return null;
        },
        getTriggerFunction: function(triggerType) {
            if (this.copiedEffects && this.copiedEffects.length > 0) {
                const mergedResult = {};
                this.copiedEffects.forEach(copied => {
                    if (copied.effects[triggerType]) {
                        const result = copied.effects[triggerType](game, data);
                        if (result) {
                            Object.assign(mergedResult, result);
                        }
                    }
                });
                return mergedResult;
            }
            return null;
        }
    },
    
    '0059': {
        id: '0059',
        name: '吞噬乌鸦',
        icon: '👹',
        description: '每次玩家落子后，若右侧邻近位置存在除自己外的乌鸦牌，则随机获得其一条效果描述（视为拥有），并将其摧毁。最多可携带2条效果。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        maxCopies: 2,
        playerMove: function(game, data) {
            const crowIndex = data.crowIndex;
            
            if (this.stolenEffects && this.stolenEffects.length >= this.maxCopies) {
                return null;
            }
            
            if (crowIndex < game.crowSlots.length - 1) {
                const rightCrow = game.crowSlots[crowIndex + 1];
                if (rightCrow && rightCrow.id !== this.id) {
                    if (!this.stolenEffects) this.stolenEffects = [];
                    
                    // 随机选择一个效果类型（如果有多个）
                    const effectTypes = ['elimination', 'turnStart', 'turnEnd', 'playerMove', 'gameStart', 'gameWin'];
                    const availableEffects = effectTypes.filter(type => rightCrow[type]);
                    
                    if (availableEffects.length > 0) {
                        const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
                        this.stolenEffects.push({
                            effectType: randomEffect,
                            fromCrow: rightCrow.name,
                            description: `从${rightCrow.name}获得: ${randomEffect}效果`
                        });
                        
                        return {
                            destroy: {
                                type: 'crow',
                                index: crowIndex + 1,
                                reason: '被吞噬乌鸦吞噬'
                            },
                            specialModifiers: [{
                                type: 'steal_effect',
                                description: `吞噬乌鸦: 获得${rightCrow.name}的${randomEffect}效果`
                            }]
                        };
                    }
                }
            }
            return null;
        }
    },
    
    '0060': {
        id: '0060',
        name: '迅疾乌鸦',
        icon: '⚡',
        description: '无限次数清除右侧相邻卡牌冷却时间。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        turnStart: function(game) {
            const crowIndex = this.currentIndex;
            if (crowIndex < game.crowSlots.length - 1) {
                const rightCrow = game.crowSlots[crowIndex + 1];
                if (rightCrow && rightCrow.cooldown && rightCrow.cooldown > 0) {
                    rightCrow.cooldown = Math.max(0, rightCrow.cooldown - 1);
                    
                    return {
                        specialModifiers: [{
                            type: 'reduce_cooldown_right',
                            description: `迅疾乌鸦: 右侧${rightCrow.name}冷却-1`
                        }]
                    };
                }
            }
            return null;
        }
    },
    
    '0061': {
        id: '0061',
        name: '加速乌鸦',
        icon: '🏃',
        description: '将获得本乌鸦牌后第一个进入冷却的乌鸦牌设为目标，为其立即清除1回合冷却。每回合限一次。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 1,
        gameStart: function(game) {
            this.targetCrow = null;
        },
        turnStart: function(game) {
            if (this.targetCrow && this.targetCrow.cooldown && this.targetCrow.cooldown > 0) {
                this.targetCrow.cooldown = Math.max(0, this.targetCrow.cooldown - 1);
                const result = {
                    specialModifiers: [{
                        type: 'reduce_target_cooldown',
                        description: `加速乌鸦: ${this.targetCrow.name}冷却-1`
                    }]
                };
                this.targetCrow = null;
                return result;
            }
            return null;
        },
        onCooldownStart: function(crow) {
            if (!this.targetCrow) {
                this.targetCrow = crow;
            }
        }
    },
    
    '0062': {
        id: '0062',
        name: '飞行乌鸦',
        icon: '🦅',
        description: '每回合有20%概率发动，立即清除所有我方卡牌1回合冷却。',
        price: 300,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        probability: 0.2,
        turnStart: function(game) {
            if (Math.random() < this.probability) {
                // 清除所有乌鸦牌冷却
                let reducedCount = 0;
                for (let i = 0; i < game.crowSlots.length; i++) {
                    const crow = game.crowSlots[i];
                    if (crow && crow.cooldown && crow.cooldown > 0) {
                        crow.cooldown = Math.max(0, crow.cooldown - 1);
                        reducedCount++;
                    }
                }
                
                // 清除所有道具牌冷却
                for (let i = 0; i < game.itemSlots.length; i++) {
                    const item = game.itemSlots[i];
                    if (item && item.cooldown && item.cooldown > 0) {
                        item.cooldown = Math.max(0, item.cooldown - 1);
                        reducedCount++;
                    }
                }
                
                return {
                    specialModifiers: [{
                        type: 'reduce_all_cooldown',
                        count: reducedCount,
                        description: '飞行乌鸦: 清除所有冷却1回合'
                    }]
                };
            }
            return null;
        }
    },
    
    '0063': {
        id: '0063',
        name: '独眼乌鸦',
        icon: '👁️',
        description: '允许玩家在回合开始时标记一枚棋子，本回合所有"概率生效"的效果，若目标为该棋子或包含该棋子，则概率变为100%。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 2,
        turnStart: function(game) {
            game.showMessage('请点击要标记的棋子（本回合概率效果必中）');
            game.isMarkingPiece = true;
            return null;
        }
    },
    
    '0064': {
        id: '0064',
        name: '幸运乌鸦',
        icon: '🍀',
        description: '场上所有"概率生效"的乌鸦牌，其概率值提高15%（加法，上限95%）。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 2,
        constant: true,
        gameStart: function(game) {
            // 增加所有乌鸦牌的概率
            for (const crow of game.crowSlots) {
                if (crow && crow.probability !== undefined) {
                    crow.probability = Math.min(0.95, crow.probability + 0.15);
                }
            }
            return {
                specialModifiers: [{
                    type: 'increase_probability',
                    value: 15,
                    description: '幸运乌鸦: 所有概率效果+15%'
                }]
            };
        }
    },
    
    '0065': {
        id: '0065',
        name: '厄运乌鸦',
        icon: '☠️',
        description: '场上所有"概率生效"的乌鸦牌，其概率值降低15%（加法，下限5%），但效果数值（如积分、金币）提升50%。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 2,
        constant: true,
        gameStart: function(game) {
            // 降低概率但增加效果
            for (const crow of game.crowSlots) {
                if (crow && crow.probability !== undefined) {
                    crow.probability = Math.max(0.05, crow.probability - 0.15);
                    crow.effectMultiplier = 1.5;
                }
            }
            return {
                specialModifiers: [{
                    type: 'tradeoff_probability',
                    description: '厄运乌鸦: 概率-15%但效果+50%'
                }]
            };
        }
    },
    
    '0066': {
        id: '0066',
        name: '救赎乌鸦',
        icon: '✝️',
        description: '当一张其他乌鸦牌生效并带来负面效果（如扣分、减少棋子）时，免除该负面效果，并使其正面效果提升30%。',
        price: 200,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        onNegativeEffect: function(game, crow, effect) {
            // 检查是否有负面效果
            if (effect && (effect.negative || effect.value < 0)) {
                return {
                    preventNegative: true,
                    boostPositive: 1.3,
                    description: `救赎乌鸦: 免除${crow.name}的负面效果，正面效果+30%`
                };
            }
            return null;
        }
    },
    
    '0067': {
        id: '0067',
        name: '%＃乌鸦',
        icon: '❓',
        description: '每局开始时，随机获得一个本局内生效的"提高单子积分"或"提高消除棋子数"的乌鸦牌效果（从已有卡池中选）。',
        price: 150,
        type: 'crow',
        subtype: 'special',
        rarity: 3,
        gameStart: function(game) {
            // 从已有的乌鸦牌中随机选择一个效果
            const scoreCrows = Object.values(crowCards).filter(crow => 
                crow.subtype === 'score' || crow.subtype === 'elimination_count'
            );
            
            if (scoreCrows.length > 0) {
                const randomCrow = scoreCrows[Math.floor(Math.random() * scoreCrows.length)];
                this.temporaryEffect = { ...randomCrow };
                
                return {
                    specialModifiers: [{
                        type: 'random_effect',
                        name: randomCrow.name,
                        description: `%＃乌鸦: 获得${randomCrow.name}的效果`
                    }]
                };
            }
            return null;
        },
        // 传递效果到其他触发点
        getTriggerFunction: function(triggerType) {
            if (this.temporaryEffect && this.temporaryEffect[triggerType]) {
                return this.temporaryEffect[triggerType];
            }
            return null;
        }
    }
};


// 道具牌定义
// 道具牌效果定义 - 完整实现Excel表格所有道具牌
const itemCards = {
    // ========== 整蛊子类 ==========
    '1001': {
        id: '1001',
        name: '整蛊-激怒',
        icon: '😠',
        description: '使AI进入"愤怒"状态3回合：更积极进攻（易形成4连），但更容易忽视防守玩家的4连。',
        price: 200,
        type: 'item',
        subtype: 'trap',
        rarity: 1,
        onUse: function(game) {
            game.aiEmotion = '愤怒';
            game.emotionTurns = 3;
            game.aiDifficulty = 1;
            
            return {
                destroy: true,
                description: '激怒: AI进入愤怒状态3回合'
            };
        }
    },
    
    '1002': {
        id: '1002',
        name: '整蛊-恐吓',
        icon: '😨',
        description: '使AI进入"惊恐"状态3回合：更倾向于堵玩家棋子，自身连子速度变慢。',
        price: 200,
        type: 'item',
        subtype: 'trap',
        rarity: 1,
        onUse: function(game) {
            game.aiEmotion = '惊恐';
            game.emotionTurns = 3;
            game.aiDifficulty = -1;
            
            return {
                destroy: true,
                description: '恐吓: AI进入惊恐状态3回合'
            };
        }
    },
    
    '1003': {
        id: '1003',
        name: '整蛊-催眠',
        icon: '😴',
        description: '使AI进入"疲惫"状态3回合：落子随机性增加，有概率下出无意义位置。',
        price: 200,
        type: 'item',
        subtype: 'trap',
        rarity: 1,
        onUse: function(game) {
            game.aiEmotion = '疲惫';
            game.emotionTurns = 3;
            game.aiDifficulty = -1;
            
            return {
                destroy: true,
                description: '催眠: AI进入疲惫状态3回合'
            };
        }
    },
    
    // ========== 升级子类 ==========
    '1004': {
        id: '1004',
        name: '升级-横向',
        icon: '↔️',
        description: '立即为"横向"阵型提升3级。',
        price: 150,
        type: 'item',
        subtype: 'upgrade',
        rarity: 1,
        onUse: function(game) {
            game.formations.horizontal += 3;
            
            return {
                destroy: true,
                description: '横向升级: 横向阵型+3级'
            };
        }
    },
    
    '1005': {
        id: '1005',
        name: '升级-竖向',
        icon: '↕️',
        description: '立即为"竖向"阵型提升3级。',
        price: 150,
        type: 'item',
        subtype: 'upgrade',
        rarity: 1,
        onUse: function(game) {
            game.formations.vertical += 3;
            
            return {
                destroy: true,
                description: '竖向升级: 竖向阵型+3级'
            };
        }
    },
    
    '1006': {
        id: '1006',
        name: '升级-撇向',
        icon: '↖️',
        description: '立即为"撇向"（左上-右下）阵型提升3级。',
        price: 150,
        type: 'item',
        subtype: 'upgrade',
        rarity: 1,
        onUse: function(game) {
            game.formations.diagonalLeft += 3;
            
            return {
                destroy: true,
                description: '撇向升级: 撇向阵型+3级'
            };
        }
    },
    
    // ========== 法术子类 ==========
    '1007': {
        id: '1007',
        name: '法术-瞄准',
        icon: '🎯',
        description: '发动后，本回合下一次消除中，所有"概率生效"的效果必定生效。使用后销毁。',
        price: 150,
        type: 'item',
        subtype: 'spell',
        rarity: 2,
        onUse: function(game) {
            game.nextEliminationGuaranteed = true;
            
            return {
                destroy: true,
                description: '瞄准: 下次消除概率效果必中'
            };
        }
    },
    
    '1008': {
        id: '1008',
        name: '法术-冻结',
        icon: '❄️',
        description: '使AI下一回合不能落子。使用后销毁。',
        price: 150,
        type: 'item',
        subtype: 'spell',
        rarity: 2,
        onUse: function(game) {
            game.aiSkipNextTurn = true;
            
            return {
                destroy: true,
                description: '冻结: AI跳过下一回合'
            };
        }
    },
    
    '1009': {
        id: '1009',
        name: '法术-复制',
        icon: '📋',
        description: '复制你最近一次使用的道具牌效果，并立即再次生效。使用后销毁。',
        price: 200,
        type: 'item',
        subtype: 'spell',
        rarity: 3,
        onUse: function(game) {
            if (game.lastUsedItem) {
                // 复制最近使用的道具效果
                const lastItem = itemCards[game.lastUsedItem];
                if (lastItem && lastItem.onUse) {
                    // 触发原效果
                    return {
                        ...lastItem.onUse(game),
                        description: `法术-复制: 复制${lastItem.name}效果`
                    };
                }
            }
            
            return {
                destroy: true,
                description: '法术-复制: 没有可复制的道具'
            };
        }
    },
    
    // ========== 电镀子类 ==========
    '1010': {
        id: '1010',
        name: '电镀-积分增幅',
        icon: '⭐',
        description: '为目标棋子附加：此棋子参与消除时，该次消除总积分增加30%。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'piece',
                effect: 'score_multiplier',
                value: 1.3,
                description: '积分增幅: 消除积分+30%'
            };
            game.showMessage('请选择要附加效果的棋子');
            
            return {
                requiresTarget: true,
                description: '选择棋子附加积分增幅'
            };
        }
    },
    
    '1011': {
        id: '1011',
        name: '电镀-积分翻倍',
        icon: '✖️',
        description: '为目标技能牌附加：此技能牌下次生效时，其提供的积分效果翻倍。',
        price: 250,
        type: 'item',
        subtype: 'coating',
        rarity: 3,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'crow',
                effect: 'next_effect_double',
                value: 2.0,
                description: '积分翻倍: 下次效果翻倍'
            };
            game.showMessage('请选择要附加效果的乌鸦牌');
            
            return {
                requiresTarget: true,
                description: '选择乌鸦牌附加积分翻倍'
            };
        }
    },
    
    '1012': {
        id: '1012',
        name: '电镀-积分连锁',
        icon: '🔗',
        description: '为目标棋子附加：此棋子被消除时，紧邻的另1枚我方棋子也被一同消除（并正常结算积分）。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'piece',
                effect: 'chain_elimination',
                value: 1,
                description: '积分连锁: 消除时连锁消除相邻棋子'
            };
            game.showMessage('请选择要附加效果的棋子');
            
            return {
                requiresTarget: true,
                description: '选择棋子附加积分连锁'
            };
        }
    },
    
    '1013': {
        id: '1013',
        name: '电镀-金币增幅',
        icon: '💎',
        description: '为目标技能牌附加：此技能牌每次生效时，额外获得10金币。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'crow',
                effect: 'money_per_activation',
                value: 10,
                description: '金币增幅: 每次生效+10金币'
            };
            game.showMessage('请选择要附加效果的技能牌');
            
            return {
                requiresTarget: true,
                description: '选择技能牌附加金币增幅'
            };
        }
    },
    
    '1014': {
        id: '1014',
        name: '电镀-金币翻倍',
        icon: '💰',
        description: '为目标道具牌附加：下次使用此道具牌时，过关奖金结算翻倍。',
        price: 250,
        type: 'item',
        subtype: 'coating',
        rarity: 3,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'item',
                effect: 'money_double',
                value: 2.0,
                description: '金币翻倍: 过关奖金翻倍'
            };
            game.showMessage('请选择要附加效果的道具牌');
            
            return {
                requiresTarget: true,
                description: '选择道具牌附加金币翻倍'
            };
        }
    },
    
    '1015': {
        id: '1015',
        name: '电镀-商店折扣',
        icon: '🏪',
        description: '为目标饰品附加：镶嵌此饰品时，本局商店所有商品额外打8折。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'accessory',
                effect: 'shop_discount',
                value: 0.8,
                description: '商店折扣: 商店额外8折'
            };
            game.showMessage('请选择要附加效果的饰品');
            
            return {
                requiresTarget: true,
                description: '选择饰品附加商店折扣'
            };
        }
    },
    
    '1016': {
        id: '1016',
        name: '电镀-攻击强化',
        icon: '⚔️',
        description: '为目标棋子附加：此棋子参与消除时，额外清除1枚与之相邻的敌方棋子。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'piece',
                effect: 'extra_ai_elimination',
                value: 1,
                description: '攻击强化: 额外消除相邻AI棋子'
            };
            game.showMessage('请选择要附加效果的棋子');
            
            return {
                requiresTarget: true,
                description: '选择棋子附加攻击强化'
            };
        }
    },
    
    '1017': {
        id: '1017',
        name: '电镀-防御强化',
        icon: '🛡️',
        description: '为目标技能牌附加：此技能牌存在时，AI形成4连所需棋子数+1。',
        price: 150,
        type: 'item',
        subtype: 'coating',
        rarity: 2,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'crow',
                effect: 'ai_four_requirement',
                value: 1,
                description: '防御强化: AI形成4连+1子'
            };
            game.showMessage('请选择要附加效果的技能牌');
            
            return {
                requiresTarget: true,
                description: '选择技能牌附加防御强化'
            };
        }
    },
    
    '1018': {
        id: '1018',
        name: '电镀-生命强化',
        icon: '❤️',
        description: '为目标棋子附加：此棋子被消除时，为我方恢复5枚棋子。',
        price: 200,
        type: 'item',
        subtype: 'coating',
        rarity: 3,
        onUse: function(game) {
            game.isSelectingTarget = {
                type: 'piece',
                effect: 'restore_pieces',
                value: 5,
                description: '生命强化: 消除时恢复5棋子'
            };
            game.showMessage('请选择要附加效果的棋子');
            
            return {
                requiresTarget: true,
                description: '选择棋子附加生命强化'
            };
        }
    }
};

// 饰品定义 - 完整实现Excel表格所有饰品
const accessories = {
    // ========== 诅咒子类 ==========
    '2001': {
        id: '2001',
        name: '孔斯的诅咒',
        icon: '☥',
        description: '诅咒：本局所有消除积分减少40%。转化：成功过关后，变为"孔斯的祝福"：永久使所有消除积分+10%。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 3,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.globalScoreMultiplier *= 0.6; // 减少40%
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'score_reduce',
                        value: 40,
                        description: '孔斯的诅咒: 积分-40%'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '永久使所有消除积分+10%。';
                this.icon = '☀️';
                game.permanentScoreMultiplier = (game.permanentScoreMultiplier || 1) * 1.1; // 永久加成
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '孔斯的诅咒转化为祝福: 永久积分+10%'
                    }]
                };
            }
            return null;
        }
    },
    
    '2002': {
        id: '2002',
        name: '玉藻前的诅咒',
        icon: '🦊',
        description: '诅咒：本局阵型等级无法提升。转化：成功过关后，变为"玉藻前的祝福"：阵型等级初始值+2。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 2,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.formationLocked = true;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'formation_lock',
                        description: '玉藻前的诅咒: 阵型等级无法提升'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '阵型等级初始值+2。';
                this.icon = '🌸';
                game.permanentFormationBonus = 2;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '玉藻前的诅咒转化为祝福: 阵型初始等级+2'
                    }]
                };
            }
            return null;
        }
    },
    
    '2003': {
        id: '2003',
        name: '哈迪斯的诅咒',
        icon: '⚰️',
        description: '诅咒：本局每回合开始时，扣除10积分。转化：成功过关后，变为"哈迪斯的祝福"：每回合开始时，获得10积分。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 3,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'score_per_turn',
                        value: -10,
                        description: '哈迪斯的诅咒: 每回合-10积分'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '每回合开始时，获得10积分。';
                this.icon = '🌌';
                game.permanentScorePerTurn = 10;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '哈迪斯的诅咒转化为祝福: 每回合+10积分'
                    }]
                };
            }
            return null;
        }
    },
    
    '2004': {
        id: '2004',
        name: '阎罗的诅咒',
        icon: '👹',
        description: '诅咒：本局商店所有商品价格翻倍。转化：成功过关后，变为"阎罗的祝福"：商店所有商品价格永久9折。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 2,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.shopPriceMultiplier = (game.shopPriceMultiplier || 1) * 2;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'shop_price_double',
                        description: '阎罗的诅咒: 商店价格翻倍'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '商店所有商品价格永久9折。';
                this.icon = '👑';
                game.permanentShopDiscount = 0.9;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '阎罗的诅咒转化为祝福: 商店永久9折'
                    }]
                };
            }
            return null;
        }
    },
    
    '2005': {
        id: '2005',
        name: '芬里尔的诅咒',
        icon: '🐺',
        description: '诅咒：本局无法获得任何过关奖金。转化：成功过关后，变为"芬里尔的祝福"：每次过关奖金额外+100金币。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 3,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.noVictoryMoney = true;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'no_victory_money',
                        description: '芬里尔的诅咒: 无法获得过关奖金'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '每次过关奖金额外+100金币。';
                this.icon = '🐕';
                game.permanentVictoryBonus = (game.permanentVictoryBonus || 0) + 100;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '芬里尔的诅咒转化为祝福: 过关额外+100金币'
                    }]
                };
            }
            return null;
        }
    },
    
    '2006': {
        id: '2006',
        name: '维列斯的诅咒',
        icon: '🌿',
        description: '诅咒：本局重抽商店费用变为5倍。转化：成功过关后，变为"维列斯的祝福"：永久免费重抽商店第一次。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 2,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.rerollMultiplier = (game.rerollMultiplier || 1) * 5;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'reroll_cost_multiply',
                        value: 5,
                        description: '维列斯的诅咒: 重抽费用5倍'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '永久免费重抽商店第一次。';
                this.icon = '🍃';
                game.freeFirstReroll = true;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '维列斯的诅咒转化为祝福: 首次重抽免费'
                    }]
                };
            }
            return null;
        }
    },
    
    '2007': {
        id: '2007',
        name: '路西法的诅咒',
        icon: '😈',
        description: '诅咒：本局AI连成五子所需棋子数-1（只需4子）。转化：成功过关后，变为"路西法的祝福"：AI连成五子所需棋子数永久+1（需6子）。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 3,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.aiWinRequirement = 4;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'ai_easier_win',
                        value: 4,
                        description: '路西法的诅咒: AI只需4子获胜'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = 'AI连成五子所需棋子数永久+1（需6子）。';
                this.icon = '😇';
                game.permanentAIRequirement = 6;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '路西法的诅咒转化为祝福: AI需要6子获胜'
                    }]
                };
            }
            return null;
        }
    },
    
    '2008': {
        id: '2008',
        name: '涅尔伽的诅咒',
        icon: '🔥',
        description: '诅咒：本局我方棋子数上限减半（15枚）。转化：成功过关后，变为"涅尔伽的祝福"：我方棋子数上限增加10枚（40枚）。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 2,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.playerPieces = 15;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'piece_limit_half',
                        description: '涅尔伽的诅咒: 棋子上限减半(15枚)'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '我方棋子数上限增加10枚（40枚）。';
                this.icon = '🌋';
                game.permanentPieceBonus = 10;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '涅尔伽的诅咒转化为祝福: 棋子上限+10(40枚)'
                    }]
                };
            }
            return null;
        }
    },
    
    '2009': {
        id: '2009',
        name: '湿婆的诅咒',
        icon: '🕉️',
        description: '诅咒：本局所有技能牌冷却时间+1回合。转化：成功过关后，变为"湿婆的祝福"：所有技能牌冷却时间-1回合（最低0）。',
        price: 0,
        type: 'accessory',
        subtype: 'curse',
        rarity: 3,
        isCursed: true,
        isBlessed: false,
        gameStart: function(game) {
            if (this.isCursed) {
                game.cooldownPenalty = 1;
                return {
                    specialModifiers: [{
                        type: 'curse',
                        effect: 'cooldown_increase',
                        value: 1,
                        description: '湿婆的诅咒: 冷却时间+1回合'
                    }]
                };
            }
            return null;
        },
        gameWin: function(game) {
            if (this.isCursed) {
                this.isCursed = false;
                this.isBlessed = true;
                this.description = '所有技能牌冷却时间-1回合（最低0）。';
                this.icon = '🙏';
                game.permanentCooldownReduction = 1;
                
                return {
                    specialModifiers: [{
                        type: 'curse_transform',
                        description: '湿婆的诅咒转化为祝福: 冷却时间-1回合'
                    }]
                };
            }
            return null;
        }
    },
    
    // ========== 祝福子类 ==========
    '2010': {
        id: '2010',
        name: '宙斯的祝福',
        icon: '⚡',
        description: '所有消除积分+20%。',
        price: 300,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 2,
        gameStart: function(game) {
            game.globalScoreMultiplier *= 1.2;
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'score_increase',
                    value: 20,
                    description: '宙斯的祝福: 积分+20%'
                }]
            };
        }
    },
    
    '2011': {
        id: '2011',
        name: '索尔的祝福',
        icon: '🔨',
        description: '阵型等级提升速度+100%。',
        price: 400,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 3,
        gameStart: function(game) {
            game.formationGrowthMultiplier = 2.0;
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'formation_growth',
                    value: 100,
                    description: '索尔的祝福: 阵型提升速度+100%'
                }]
            };
        }
    },
    
    '2012': {
        id: '2012',
        name: '三清的祝福',
        icon: '☯️',
        description: '每次消除时，额外获得消除棋子数*2的积分。',
        price: 350,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 3,
        elimination: function(game, data) {
            const { pieceCount } = data;
            const bonus = pieceCount * 2;
            
            return {
                scoreModifiers: [{
                    type: 'addition',
                    value: bonus,
                    description: '三清的祝福: 消除额外+' + bonus + '分'
                }]
            };
        }
    },
    
    '2013': {
        id: '2013',
        name: '佩龙的祝福',
        icon: '🐉',
        description: '商店所有商品价格永久8折。',
        price: 250,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 2,
        gameStart: function(game) {
            game.shopDiscountMultiplier = 0.8;
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'shop_discount',
                    value: 20,
                    description: '佩龙的祝福: 商店价格8折'
                }]
            };
        }
    },
    
    '2014': {
        id: '2014',
        name: '加百列的祝福',
        icon: '👼',
        description: '每次过关时，额外获得200金币。',
        price: 400,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 3,
        gameWin: function(game) {
            return {
                moneyModifiers: [{
                    type: 'addition',
                    value: 200,
                    description: '加百列的祝福: 过关额外+200金币'
                }]
            };
        }
    },
    
    '2015': {
        id: '2015',
        name: '阿努比斯的祝福',
        icon: '🐺',
        description: '重抽商店费用减半。',
        price: 300,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 2,
        gameStart: function(game) {
            game.rerollDiscount = 0.5;
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'reroll_discount',
                    value: 50,
                    description: '阿努比斯的祝福: 重抽费用减半'
                }]
            };
        }
    },
    
    '2016': {
        id: '2016',
        name: '纳姆的祝福',
        icon: '🌊',
        description: 'AI形成4连所需棋子数+1。',
        price: 350,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 3,
        constant: true,
        gameStart: function(game) {
            game.aiFourRequirement = 5; // AI需要5子形成4连
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'ai_four_requirement',
                    value: 1,
                    description: '纳姆的祝福: AI形成4连需要+1子'
                }]
            };
        }
    },
    
    '2017': {
        id: '2017',
        name: '梵天的祝福',
        icon: '🕉️',
        description: '我方消除所需棋子数-1（最低4）。',
        price: 300,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 2,
        gameStart: function(game) {
            game.playerWinRequirement = 4;
            return {
                specialModifiers: [{
                    type: 'blessing',
                    effect: 'player_win_requirement',
                    value: 4,
                    description: '梵天的祝福: 我方只需4子获胜'
                }]
            };
        }
    },
    
    '2018': {
        id: '2018',
        name: '天狗的祝福',
        icon: '🐕',
        description: '每回合开始时，有50%概率随机一张冷却中的技能牌立即冷却完毕。',
        price: 400,
        type: 'accessory',
        subtype: 'blessing',
        rarity: 3,
        probability: 0.5,
        turnStart: function(game) {
            if (Math.random() < this.probability) {
                // 查找有冷却的乌鸦牌
                const crowsWithCooldown = [];
                for (let i = 0; i < game.crowSlots.length; i++) {
                    const crow = game.crowSlots[i];
                    if (crow && crow.cooldown && crow.cooldown > 0) {
                        crowsWithCooldown.push({ index: i, crow });
                    }
                }
                
                if (crowsWithCooldown.length > 0) {
                    const randomCrow = crowsWithCooldown[Math.floor(Math.random() * crowsWithCooldown.length)];
                    randomCrow.crow.cooldown = 0;
                    
                    return {
                        specialModifiers: [{
                            type: 'random_cooldown_reset',
                            name: randomCrow.crow.name,
                            description: `天狗的祝福: ${randomCrow.crow.name}冷却完毕`
                        }]
                    };
                }
            }
            return null;
        }
    },
    
    // ========== 随机子类 ==========
    '2019': {
        id: '2019',
        name: '古神的#$%',
        icon: '❓',
        description: '每局开始时，随机变为一个已知的诅咒或祝福饰品（效果持续本局）。',
        price: 500,
        type: 'accessory',
        subtype: 'random',
        rarity: 3,
        gameStart: function(game) {
            // 随机选择一个已知饰品（排除自己）
            const accessoryKeys = Object.keys(accessories).filter(key => key !== '2019');
            if (accessoryKeys.length > 0) {
                const randomKey = accessoryKeys[Math.floor(Math.random() * accessoryKeys.length)];
                const randomAccessory = accessories[randomKey];
                
                // 临时应用效果
                this.currentEffect = {
                    id: randomAccessory.id,
                    name: randomAccessory.name,
                    description: randomAccessory.description,
                    icon: randomAccessory.icon
                };
                
                // 复制效果函数
                if (randomAccessory.gameStart) {
                    const result = randomAccessory.gameStart(game);
                    if (result) {
                        result.description = `古神变为${randomAccessory.name}: ${result.description}`;
                        return result;
                    }
                }
            }
            return null;
        },
        // 传递效果到其他触发点
        getTriggerFunction: function(triggerType) {
            if (this.currentEffect) {
                const accessory = accessories[this.currentEffect.id];
                if (accessory && accessory[triggerType]) {
                    return accessory[triggerType];
                }
            }
            return null;
        }
    },
    
    '2020': {
        id: '2020',
        name: '混沌的赠礼',
        icon: '🌀',
        description: '每局开始时，随机获得一个本局内生效的乌鸦牌效果（从所有乌鸦牌中随机选择）。',
        price: 600,
        type: 'accessory',
        subtype: 'random',
        rarity: 3,
        gameStart: function(game) {
            // 从所有乌鸦牌中随机选择一个
            const crowKeys = Object.keys(crowCards);
            if (crowKeys.length > 0) {
                const randomKey = crowKeys[Math.floor(Math.random() * crowKeys.length)];
                const randomCrow = crowCards[randomKey];
                
                // 存储随机效果
                this.randomCrowEffect = { ...randomCrow };
                
                return {
                    specialModifiers: [{
                        type: 'random_crow_effect',
                        name: randomCrow.name,
                        description: `混沌的赠礼: 获得${randomCrow.name}的效果`
                    }]
                };
            }
            return null;
        },
        // 传递效果到其他触发点
        getTriggerFunction: function(triggerType) {
            if (this.randomCrowEffect && this.randomCrowEffect[triggerType]) {
                return this.randomCrowEffect[triggerType];
            }
            return null;
        }
    }
};


// 效果工厂 - 动态创建效果对象
class EffectFactory {
    static createCrowEffect(crowId, config) {
        const baseEffect = crowCards[crowId];
        if (!baseEffect) return null;
        
        return {
            ...baseEffect,
            ...config,
            // 添加通用方法
            checkProbability: function() {
                if (this.probability !== undefined) {
                    return Math.random() < (game.nextEliminationGuaranteed ? 1 : this.probability);
                }
                return true;
            },
            
            trigger: function(triggerType, game, data) {
                if (this[triggerType]) {
                    return this[triggerType](game, data);
                }
                return null;
            }
        };
    }
    
    static createItemEffect(itemId, config) {
        const baseEffect = itemCards[itemId];
        if (!baseEffect) return null;
        
        return {
            ...baseEffect,
            ...config
        };
    }
    
    static createAccessoryEffect(accessoryId, config) {
        const baseEffect = accessories[accessoryId];
        if (!baseEffect) return null;
        
        return {
            ...baseEffect,
            ...config
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        crowCards, 
        itemCards, 
        accessories, 
        EffectFactory 
    };
}