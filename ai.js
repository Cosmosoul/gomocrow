// AI策略模块 - 按照新情绪系统重构
class AIStrategy {
    constructor(game) {
        this.game = game;
        this.board = game.board;
        this.boardSize = game.boardSize;
        
        // 获取当前AI情绪和难度
        this.emotion = game.aiEmotion || '得意';
        this.difficulty = game.aiDifficulty || 0;
        
        // 情绪对应的行为模式
        this.emotionBehaviors = {
            '得意': { 
                aggression: 0.7, 
                defense: 0.3, 
                randomness: 0.1,
                searchDepth: 2,
                searchWidth: 10
            },
            '专注': { 
                aggression: 0.5, 
                defense: 0.5, 
                randomness: 0.05,
                searchDepth: 4,
                searchWidth: 15
            },
            '愤怒': { 
                aggression: 0.9, 
                defense: 0.1, 
                randomness: 0.05,
                searchDepth: 3,
                searchWidth: 12
            },
            '惊恐': { 
                aggression: 0.2, 
                defense: 0.8, 
                randomness: 0.3,
                searchDepth: 1,
                searchWidth: 8
            },
            '疲惫': { 
                aggression: 0.3, 
                defense: 0.3, 
                randomness: 0.4,
                searchDepth: 1,
                searchWidth: 5
            }
        };
    }
    
    // 评估函数 - 评估当前棋局对AI的有利程度
    evaluateBoard() {
        let aiScore = 0;
        let playerScore = 0;
        
        // 获取当前情绪行为
        const behavior = this.emotionBehaviors[this.emotion] || this.emotionBehaviors['得意'];
        
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
        
        // 根据情绪调整权重
        const aiWeight = behavior.aggression;
        const playerWeight = behavior.defense;
        
        return aiScore * aiWeight - playerScore * playerWeight;
    }
    
    // 评估单个位置的影响力
    evaluatePosition(row, col, type) {
        let score = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
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
        if (count >= 5) return 100000;
        
        if (count === 4) {
            if (openEnds === 2) return 10000;
            if (openEnds === 1) return 1000;
            return 0;
        }
        if (count === 3) {
            if (openEnds === 2) return 1000;
            if (openEnds === 1) return 100;
            return 0;
        }
        if (count === 2) {
            if (openEnds === 2) return 100;
            if (openEnds === 1) return 10;
            return 0;
        }
        if (count === 1 && openEnds === 2) return 10;
        
        return 0;
    }
    
    // 获取所有可能的落子位置
    getPossibleMoves(searchWidth = 15) {
        const moves = [];
        const center = Math.floor(this.boardSize / 2);
        
        // 获取当前情绪行为
        const behavior = this.emotionBehaviors[this.emotion] || this.emotionBehaviors['得意'];
        
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
                    if (this.emotion === '愤怒') {
                        // 愤怒：更注重进攻
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 150;
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 30; // 降低防守权重
                        }
                    } else if (this.emotion === '惊恐') {
                        // 惊恐：更注重防守
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 50;
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 120;
                        }
                    } else {
                        // 默认：平衡
                        if (this.hasNeighbor(row, col, 1, 'ai')) {
                            priority += 100;
                        }
                        if (this.hasNeighbor(row, col, 1, 'player')) {
                            priority += 80;
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
                    if (this.emotion === '愤怒') {
                        priority += aiThreat * 2.0;
                        priority += playerThreat * 0.5;
                    } else if (this.emotion === '惊恐') {
                        priority += aiThreat * 0.8;
                        priority += playerThreat * 1.5;
                    } else {
                        priority += aiThreat * 1.5;
                        priority += playerThreat * 1.0;
                    }
                    
                    moves.push({ row, col, priority });
                }
            }
        }
        
        // 按优先级排序
        moves.sort((a, b) => b.priority - a.priority);
        
        // 根据情绪增加随机性
        if (Math.random() < behavior.randomness && moves.length > 3) {
            // 随机打乱前几个位置
            const shuffleCount = Math.min(3, Math.floor(moves.length * 0.3));
            for (let i = 0; i < shuffleCount; i++) {
                const j = i + Math.floor(Math.random() * (moves.length - i));
                [moves[i], moves[j]] = [moves[j], moves[i]];
            }
        }
        
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
                
                const dr = r2 - r1;
                const dc = c2 - c1;
                const dirRow = dr === 0 ? 0 : dr / Math.abs(dr);
                const dirCol = dc === 0 ? 0 : dc / Math.abs(dc);
                
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
    
    // 极小化极大算法
    minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }
        
        const possibleMoves = this.getPossibleMoves(10);
        
        if (possibleMoves.length === 0) {
            return { score: this.evaluateBoard() };
        }
        
        let bestMove = null;
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'ai';
                
                const evaluation = this.minimax(depth - 1, false, alpha, beta).score;
                
                this.board[move.row][move.col].type = 'empty';
                
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                
                const evaluation = this.minimax(depth - 1, true, alpha, beta).score;
                
                this.board[move.row][move.col].type = 'empty';
                
                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: minEval, move: bestMove };
        }
    }
    
    // 获取AI的最佳落子位置
    getBestMove() {
        const behavior = this.emotionBehaviors[this.emotion] || this.emotionBehaviors['得意'];
        
        // 惊恐和疲惫状态增加随机性
        if (Math.random() < behavior.randomness) {
            const randomMove = this.getRandomMove();
            if (randomMove) return randomMove;
        }
        
        // 获取可能移动
        const possibleMoves = this.getPossibleMoves(behavior.searchWidth);
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // 检查是否有立即获胜的机会
        for (const move of possibleMoves) {
            this.board[move.row][move.col].type = 'ai';
            const lines = this.checkLines(move.row, move.col, 'ai');
            this.board[move.row][move.col].type = 'empty';
            
            if (lines.length > 0) {
                return move;
            }
        }
        
        // 惊恐状态：优先防守
        if (this.emotion === '惊恐') {
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const lines = this.checkLines(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (lines.length > 0) {
                    return move;
                }
            }
            
            // 检查是否需要阻止玩家形成活四
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'player';
                const fours = this.checkFour(move.row, move.col, 'player');
                this.board[move.row][move.col].type = 'empty';
                
                if (fours.length > 0) {
                    return move;
                }
            }
        }
        
        // 愤怒状态：更注重进攻
        if (this.emotion === '愤怒') {
            // 检查自己是否有活四
            for (const move of possibleMoves) {
                this.board[move.row][move.col].type = 'ai';
                const fours = this.checkFour(move.row, move.col, 'ai');
                this.board[move.row][move.col].type = 'empty';
                
                if (fours.length > 0) {
                    return move;
                }
            }
        }
        
        // 专注状态使用完整策略
        if (this.emotion === '专注') {
            const result = this.minimax(behavior.searchDepth, true);
            if (result.move) {
                return result.move;
            }
        }
        
        // 使用评估函数选择最佳移动
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
            
            // 根据情绪调整权重
            let offensiveWeight, defensiveWeight;
            if (this.emotion === '愤怒') {
                offensiveWeight = 2.0;
                defensiveWeight = 0.3;
            } else if (this.emotion === '惊恐') {
                offensiveWeight = 0.5;
                defensiveWeight = 1.5;
            } else {
                offensiveWeight = 1.2;
                defensiveWeight = 1.0;
            }
            
            const totalScore = offensiveScore * offensiveWeight + defensiveScore * defensiveWeight + positionScore;
            
            return { move, score: totalScore };
        });
        
        scoredMoves.sort((a, b) => b.score - a.score);
        
        if (scoredMoves.length > 0) {
            // 根据情绪决定选择策略
            let selectionProbability = 0.8;
            if (this.emotion === '疲惫') selectionProbability = 0.5;
            if (this.emotion === '惊恐') selectionProbability = 0.7;
            
            if (Math.random() < selectionProbability) {
                return scoredMoves[0].move;
            } else if (scoredMoves.length > 1) {
                const topCount = Math.min(3, scoredMoves.length);
                const topMoves = scoredMoves.slice(0, topCount);
                return topMoves[Math.floor(Math.random() * topCount)].move;
            }
        }
        
        // 默认返回随机移动
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        
        return null;
    }
    
    getRandomMove() {
        const emptyCells = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col].type === 'empty' && !this.game.forbiddenCells.has(`${row},${col}`)) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        return null;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIStrategy };
}