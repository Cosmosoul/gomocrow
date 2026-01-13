
// AI策略模块
class AIStrategy {
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.boardSize = game.boardSize;
        // 获取当前AI难度
        this.difficulty = game.aiDifficulty || 0;
        this.emotion = game.aiEmotion || '得意';
    }
    
    // 评估函数 - 评估当前棋局对AI的有利程度
    evaluateBoard() {
        let aiScore = 0;
        let playerScore = 0;
        
        // 评估所有可能的连线
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'ai') {
                    aiScore += this.evaluatePosition(row, col, 'ai');
                } else if (this.board[row][col].type === 'player') {
                    playerScore += this.evaluatePosition(row, col, 'player');
                }
            }
        }
        
        // 根据情绪和难度调整权重
        let playerWeight = 1.0;
        let aiWeight = 1.0;
        
        if (this.emotion === '得意' || this.difficulty === 0) {
            // 正常难度/得意情绪：更注重进攻，降低防守权重
            playerWeight = 0.1;  // 大幅降低防守权重
            aiWeight = 1.5;      // 提高进攻权重
        } else if (this.emotion === '专注' || this.emotion === '愤怒') {
            // 高难度情绪：正常防守和进攻
            playerWeight = 1.0;
            aiWeight = 1.0;
        } else if (this.emotion === '惊恐' || this.emotion === '疲惫' || this.difficulty === -1) {
            // 低难度情绪：更注重防守，降低进攻
            playerWeight = 0.1;
            aiWeight = 0.5;
        }
        
        return aiScore * aiWeight - playerScore * playerWeight;
    }
    
    // 评估单个位置的影响力
    evaluatePosition(row, col, type) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dx, dy] of directions) {
            // 检查这个方向上的连续棋子
            let count = 1; // 包括当前位置
            let openEnds = 0;
            
            // 正向检查
            let forwardBlocked = false;
            for (let i = 1; i < 5; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;
                
                if (this.isValidPosition(newRow, newCol)) {
                    if (this.board[newRow][newCol].type === type) {
                        count++;
                    } else if (this.board[newRow][newCol].type === 'empty') {
                        if (!forwardBlocked) {
                            openEnds++;
                            forwardBlocked = true;
                        }
                    } else {
                        forwardBlocked = true;
                    }
                } else {
                    forwardBlocked = true;
                }
            }
            
            // 反向检查
            let backwardBlocked = false;
            for (let i = 1; i < 5; i++) {
                const newRow = row - i * dx;
                const newCol = col - i * dy;
                
                if (this.isValidPosition(newRow, newCol)) {
                    if (this.board[newRow][newCol].type === type) {
                        count++;
                    } else if (this.board[newRow][newCol].type === 'empty') {
                        if (!backwardBlocked) {
                            openEnds++;
                            backwardBlocked = true;
                        }
                    } else {
                        backwardBlocked = true;
                    }
                } else {
                    backwardBlocked = true;
                }
            }
            
            // 根据连子数量和开放度给分
            score += this.getLineScore(count, openEnds);
        }
        
        return score;
    }
    
    // 根据连子数量和开放度计算分数
    getLineScore(count, openEnds) {
        if (count >= 5) return 100000; // 五子连线
        
        if (count === 4) {
            if (openEnds === 2) return 10000;  // 活四
            if (openEnds === 1) return 1000;   // 冲四
            return 0;  // 死四
        }
        if (count === 3) {
            if (openEnds === 2) return 1000;   // 活三
            if (openEnds === 1) return 100;    // 冲三
            return 0;  // 死三
        }
        if (count === 2) {
            if (openEnds === 2) return 100;    // 活二
            if (openEnds === 1) return 10;     // 冲二
            return 0;  // 死二
        }
        if (count === 1 && openEnds === 2) return 10;  // 活一
        
        return 0;
    }
    
    // 获取所有可能的落子位置
    getPossibleMoves(searchWidth = 20) {
        const moves = [];
        const center = Math.floor(this.boardSize / 2);
        
        // 优先考虑棋盘中心和有棋子的周围
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'empty' && 
                    !this.game.forbiddenCells.has(`${row},${col}`)) {
                    
                    let priority = 0;
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(row - center, 2) + Math.pow(col - center, 2)
                    );
                    
                    // 距离中心越近，优先级越高
                    priority += (this.boardSize - distanceFromCenter) * 10;
                    
                    // 如果周围有棋子，增加优先级
                    if (this.hasNeighbor(row, col, 2)) {
                        priority += 100;
                    }
                    
                    // 根据情绪调整进攻/防守权重
                    if (this.emotion === '得意' || this.difficulty === 0) {
                        // 正常难度/得意情绪：更注重进攻
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 150; // 大幅提高AI进攻权重
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 50; // 适当降低防守权重
                        }
                    } else if (this.emotion === '专注' || this.emotion === '愤怒') {
                        // 高难度情绪：平衡进攻和防守
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 100;
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 80;
                        }
                    } else {
                        // 低难度情绪：更注重防守
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 50;
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 120;
                        }
                    }
                    
                    // 检查AI自己的威胁
                    this.board[row][col].type = 'ai';
                    const aiThreat = this.evaluatePosition(row, col, 'ai');
                    this.board[row][col].type = 'empty';
                    
                    // 检查玩家威胁
                    this.board[row][col].type = 'player';
                    const playerThreat = this.evaluatePosition(row, col, 'player');
                    this.board[row][col].type = 'empty';
                    
                    // 根据情绪调整威胁权重
                    if (this.emotion === '得意' || this.difficulty === 0) {
                        // 更注重进攻，降低防守
                        priority += aiThreat * 2.0;     // 提高AI进攻权重
                        priority += playerThreat * 0.5; // 大幅降低防守权重
                    } else if (this.emotion === '专注' || this.emotion === '愤怒') {
                        // 平衡
                        priority += aiThreat * 1.5;
                        priority += playerThreat * 1.0;
                    } else {
                        // 更注重防守
                        priority += aiThreat * 0.8;
                        priority += playerThreat * 1.2;
                    }
                    
                    moves.push({ row, col, priority });
                }
            }
        }
        
        // 按优先级排序
        moves.sort((a, b) => b.priority - a.priority);
        
        // 返回指定数量的最佳位置
        return moves.slice(0, searchWidth).map(move => ({ row: move.row, col: move.col }));
    }
    
    // 检查位置周围是否有棋子
    hasNeighbor(row, col, distance = 1, type = null) {
        for (let dr = -distance; dr <= distance; dr++) {
            for (let dc = -distance; dc <= distance; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (this.isValidPosition(newRow, newCol)) {
                    if (type) {
                        if (this.board[newRow][newCol].type === type) {
                            return true;
                        }
                    } else if (this.board[newRow][newCol].type !== 'empty') {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 检查是否形成连线
    checkLines(row, col, type) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
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
    
    // 检查是否形成四子
    checkFour(row, col, type) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        const fourLines = [];
        
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
            
            if (count === 4) {
                // 检查两端是否至少有一个空位（冲四）
                const [r1, c1] = cells[0];
                const [r2, c2] = cells[cells.length - 1];
                
                // 确定方向
                const dr = r2 - r1;
                const dc = c2 - c1;
                const dirRow = dr === 0 ? 0 : dr / Math.abs(dr);
                const dirCol = dc === 0 ? 0 : dc / Math.abs(dc);
                
                // 检查两端
                const end1 = [r1 - dirRow, c1 - dirCol];
                const end2 = [r2 + dirRow, c2 + dirCol];
                
                if ((this.isValidPosition(end1[0], end1[1]) && 
                     this.board[end1[0]][end1[1]].type === 'empty') ||
                    (this.isValidPosition(end2[0], end2[1]) && 
                     this.board[end2[0]][end2[1]].type === 'empty')) {
                    fourLines.push(cells);
                }
            }
        }
        
        return fourLines;
    }
    
    // 极小化极大算法 - 只在专注和愤怒情绪使用
    minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        // 终止条件：达到最大深度或游戏结束
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }
        
        const possibleMoves = this.getPossibleMoves(15); // 限制搜索宽度
        
        if (possibleMoves.length === 0) {
            return { score: this.evaluateBoard() };
        }
        
        let bestMove = null;
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            
            for (const move of possibleMoves) {
                // 模拟落子
                this.board[move.row][move.col].type = 'ai';
                
                const evaluation = this.minimax(depth - 1, false, alpha, beta).score;
                
                // 撤销落子
                this.board[move.row][move.col].type = 'empty';
                
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break; // β剪枝
                }
            }
            
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            
            for (const move of possibleMoves) {
                // 模拟落子
                this.board[move.row][move.col].type = 'player';
                
                const evaluation = this.minimax(depth - 1, true, alpha, beta).score;
                
                // 撤销落子
                this.board[move.row][move.col].type = 'empty';
                
                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break; // α剪枝
                }
            }
            
            return { score: minEval, move: bestMove };
        }
    }
    
    // 获取AI的最佳落子位置
    getBestMove() {
        let depth;
        let searchWidth;
        
        // 根据情绪设置搜索深度和宽度
        switch (this.emotion) {
            case '专注':
            case '愤怒':
                depth = 4;
                searchWidth = 20;
                break;
            case '惊恐':
            case '疲惫':
                depth = 1;
                searchWidth = 1;
                break;
            default: // 得意（正常难度）
                depth = 2;
                searchWidth = 6;
        }
        
        // 获取可能移动
        const possibleMoves = this.getPossibleMoves(searchWidth);
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // 检查是否有立即获胜的机会
        for (const move of possibleMoves) {
            // 模拟落子
            this.board[move.row][move.col].type = 'ai';
            const lines = this.checkLines(move.row, move.col, 'ai');
            this.board[move.row][move.col].type = 'empty';
            
            if (lines.length > 0) {
                return move; // 立即获胜
            }
        }
        
        // 根据情绪调整防守策略
        if (this.emotion === '得意') {
            // 得意情绪：只防守玩家的立即获胜和活四，忽略活三
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const lines = this.checkLines(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (lines.length > 0) {
                    return move; // 阻止玩家获胜
                }
            }
            
            // 检查是否需要阻止玩家形成活四
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const fours = this.checkFour(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (fours.length > 0) {
                    // 得意情绪：有30%概率忽略活四，继续进攻
                    if (Math.random() > 0.3) {
                        return move; // 阻止玩家形成活四
                    }
                }
            }
        } else if (this.emotion === '惊恐' || this.emotion === '疲惫') {
            // 惊恐/疲惫：加强防守
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const lines = this.checkLines(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (lines.length > 0) {
                    return move; // 阻止玩家获胜
                }
            }
            
            // 检查是否需要阻止玩家形成活四
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const fours = this.checkFour(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (fours.length > 0) {
                    return move; // 阻止玩家形成活四
                }
            }
            
            // 惊恐/疲惫：也防守活三
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const playerScore = this.evaluatePosition(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (playerScore >= 1000) { // 活三或以上
                    return move;
                }
            }
        } else {
            // 专注/愤怒：正常防守
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const lines = this.checkLines(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (lines.length > 0) {
                    return move; // 阻止玩家获胜
                }
            }
            
            // 检查是否需要阻止玩家形成活四
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const fours = this.checkFour(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (fours.length > 0) {
                    return move; // 阻止玩家形成活四
                }
            }
            
            // 专注/愤怒：也防守活三
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const playerScore = this.evaluatePosition(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (playerScore >= 1000) { // 活三或以上
                    // 有70%概率防守
                    if (Math.random() > 0.3) {
                        return move;
                    }
                }
            }
        }
        
        // 低难度情绪使用简化策略
        if (this.emotion === '惊恐' || this.emotion === '疲惫') {
            // 随机选择一个靠近中心的位置
            const centerMoves = possibleMoves.filter(move => {
                const center = Math.floor(this.boardSize / 2);
                const distance = Math.sqrt(
                    Math.pow(move.row - center, 2) + Math.pow(move.col - center, 2)
                );
                return distance < 5;
            });
            
            if (centerMoves.length > 0) {
                return centerMoves[Math.floor(Math.random() * centerMoves.length)];
            }
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        
        // 得意情绪（正常难度）使用进攻性策略
        if (this.emotion === '得意') {
            // 使用位置评估和威胁分析
            const scoredMoves = possibleMoves.map(move => {
                // 进攻得分
                let offensiveScore = 0;
                this.board[move.row][move.col].type = 'ai';
                offensiveScore = this.evaluatePosition(move.row, move.col, 'ai');
                
                // 防守得分（阻止玩家）- 得意情绪降低权重
                let defensiveScore = 0;
                this.board[move.row][move.col].type = 'player';
                defensiveScore = this.evaluatePosition(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                // 基础位置得分（中心优先）
                const center = Math.floor(this.boardSize / 2);
                const distance = Math.sqrt(
                    Math.pow(move.row - center, 2) + Math.pow(move.col - center, 2)
                );
                const positionScore = (this.boardSize - distance) * 5;
                
                // 得意情绪：进攻权重极高，防守权重很低
                const offensiveWeight = 3.0;
                const defensiveWeight = 0.3;
                
                const totalScore = offensiveScore * offensiveWeight + defensiveScore * defensiveWeight + positionScore;
                
                return { move, score: totalScore };
            });
            
            // 按得分排序
            scoredMoves.sort((a, b) => b.score - a.score);
            
            // 得意情绪：60%选择最佳进攻，40%随机（给玩家更多机会）
            if (Math.random() < 0.6 && scoredMoves.length > 0) {
                return scoredMoves[0].move;
            } else if (scoredMoves.length > 1) {
                // 从前5个中随机选择
                const top5 = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
                return top5[Math.floor(Math.random() * top5.length)].move;
            }
        }
        
        // 专注/愤怒情绪使用完整策略
        if (this.emotion === '专注' || this.emotion === '愤怒') {
            // 使用极小化极大算法
            const result = this.minimax(depth, true);
            if (result.move) {
                return result.move;
            }
            
            // 如果算法没找到，使用评估函数
            const scoredMoves = possibleMoves.map(move => {
                let offensiveScore = 0;
                this.board[move.row][move.col].type = 'ai';
                offensiveScore = this.evaluatePosition(move.row, move.col, 'ai');
                
                let defensiveScore = 0;
                this.board[move.row][move.col].type = 'player';
                defensiveScore = this.evaluatePosition(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                const center = Math.floor(this.boardSize / 2);
                const distance = Math.sqrt(
                    Math.pow(move.row - center, 2) + Math.pow(move.col - center, 2)
                );
                const positionScore = (this.boardSize - distance) * 5;
                
                // 专注/愤怒：平衡进攻和防守
                const offensiveWeight = 1.5;
                const defensiveWeight = 1.0;
                
                const totalScore = offensiveScore * offensiveWeight + defensiveScore * defensiveWeight + positionScore;
                
                return { move, score: totalScore };
            });
            
            scoredMoves.sort((a, b) => b.score - a.score);
            
            if (scoredMoves.length > 0) {
                // 专注/愤怒：80%选择最佳，20%随机
                if (Math.random() < 0.8) {
                    return scoredMoves[0].move;
                } else if (scoredMoves.length > 1) {
                    const top3 = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
                    return top3[Math.floor(Math.random() * top3.length)].move;
                }
            }
        }
        
        // 默认返回随机移动
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        
        return null;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
}

// 导出AI策略类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIStrategy };
}
