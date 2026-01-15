// 商店系统 - 适配乌鸦牌系统
class Shop {
    constructor(game) {
        this.game = game;
        this.level = 1;
        this.rerollCount = 0;
        this.rerollPrice = 10;
        this.seed = this.generateSeed();
        this.items = [];
        
        // 商店配置
        this.config = {
            crowSlots: 3,
            itemSlots: 2,
            accessorySlots: 1,
            priceRange: { min: 100, max: 300 },
            discount: 0.7
        };
        
        this.generateItems();
    }
    
    generateSeed() {
        return Math.floor(Math.random() * 1000000).toString();
    }
    
    generateItems() {
        this.items = [];
        
        // 生成乌鸦牌（按稀有度）
        const crowPool = this.getWeightedCrowPool();
        for (let i = 0; i < this.config.crowSlots; i++) {
            if (crowPool.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * crowPool.length);
            const crow = { ...crowCards[crowPool[randomIndex]] };
            crow.price = this.getRandomPrice(crow.rarity);
            this.items.push(crow);
            
            crowPool.splice(randomIndex, 1);
        }
        
        // 生成道具牌
        const itemKeys = Object.keys(itemCards);
        const selectedItems = new Set();
        for (let i = 0; i < this.config.itemSlots; i++) {
            if (itemKeys.length === 0) break;
            
            let randomItem;
            do {
                randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            } while (selectedItems.has(randomItem) && selectedItems.size < itemKeys.length);
            
            selectedItems.add(randomItem);
            const item = { ...itemCards[randomItem] };
            item.price = this.getRandomPrice(item.rarity);
            this.items.push(item);
        }
        
        // 生成饰品（高等级商店才有）
        if (this.level >= 2) {
            const accessoryKeys = Object.keys(accessories);
            if (accessoryKeys.length > 0 && this.config.accessorySlots > 0) {
                const randomAccessory = accessoryKeys[Math.floor(Math.random() * accessoryKeys.length)];
                const accessory = { ...accessories[randomAccessory] };
                accessory.price = this.getRandomPrice(accessory.rarity);
                this.items.push(accessory);
            }
        }
    }
    
    // 按稀有度加权选择乌鸦牌
    getWeightedCrowPool() {
        const weights = { 1: 60, 2: 30, 3: 10 };
        const pool = [];
        
        Object.keys(crowCards).forEach(crowId => {
            const crow = crowCards[crowId];
            const weight = weights[crow.rarity] || 10;
            
            for (let i = 0; i < weight; i++) {
                pool.push(crowId);
            }
        });
        
        return pool;
    }
    
    getRandomPrice(rarity) {
        const { min, max } = this.config.priceRange;
        const basePrice = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const rarityMultiplier = { 1: 1.0, 2: 1.5, 3: 2.0 };
        return Math.floor(basePrice * (rarityMultiplier[rarity] || 1.0));
    }
    
    render() {
        const shopItemsElement = document.querySelector('.shop-items');
        if (!shopItemsElement) return;
        
        shopItemsElement.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            itemElement.dataset.index = index;
            
            const discountedPrice = Math.floor(item.price * this.config.discount);
            const rarityClass = `rarity-${item.rarity || 1}`;
            
            itemElement.innerHTML = `
                <div class="shop-item-icon ${rarityClass}">${item.icon}</div>
                <h4>${item.name}</h4>
                <p class="shop-item-price">${discountedPrice} 金币</p>
                <p class="shop-item-type">${this.getItemTypeName(item.type)}</p>
                <p class="shop-item-rarity">${this.getRarityName(item.rarity)}</p>
            `;
            
            itemElement.addEventListener('click', () => this.showItemDetail(item, index));
            shopItemsElement.appendChild(itemElement);
        });
        
        // 更新商店信息
        document.getElementById('shop-level').textContent = this.level;
        document.getElementById('reroll-price').textContent = this.rerollPrice;
        document.getElementById('seed-value').textContent = this.seed;
    }
    
    getItemTypeName(type) {
        switch (type) {
            case 'crow': return '乌鸦牌';
            case 'item': return '道具牌';
            case 'accessory': return '饰品';
            default: return '未知';
        }
    }
    
    getRarityName(rarity) {
        switch (rarity) {
            case 1: return '普通';
            case 2: return '稀有';
            case 3: return '史诗';
            default: return '普通';
        }
    }
    
    showItemDetail(item, index) {
        const discountedPrice = Math.floor(item.price * this.config.discount);
        
        document.getElementById('detail-title').textContent = '商店物品';
        document.getElementById('detail-icon').textContent = item.icon;
        document.getElementById('detail-name').textContent = item.name;
        document.getElementById('detail-description').textContent = item.description;
        document.getElementById('detail-price').textContent = discountedPrice;
        document.getElementById('detail-type').textContent = this.getItemTypeName(item.type);
        
        // 设置购买按钮
        const buyBtn = document.getElementById('buy-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');
        
        buyBtn.style.display = 'block';
        sellBtn.style.display = 'none';
        
        buyBtn.onclick = () => {
            this.buyItem(item, index, discountedPrice);
        };
        
        document.getElementById('detail-modal').classList.add('active');
    }
    
    buyItem(item, index, price) {
        if (this.game.money < price) {
            alert('金币不足!');
            return;
        }
        
        // 根据物品类型放入相应的槽位
        let slotArray, maxSlots, typeName;
        
        switch (item.type) {
            case 'crow':
                slotArray = this.game.crowSlots;
                maxSlots = 6;
                typeName = '乌鸦牌';
                break;
            case 'item':
                slotArray = this.game.itemSlots;
                maxSlots = 4;
                typeName = '道具牌';
                break;
            case 'accessory':
                slotArray = this.game.accessorySlots;
                maxSlots = 2;
                typeName = '饰品';
                break;
        }
        
        // 查找空槽位
        let emptyIndex = -1;
        for (let i = 0; i < maxSlots; i++) {
            if (!slotArray[i]) {
                emptyIndex = i;
                break;
            }
        }
        
        if (emptyIndex === -1) {
            alert(`${typeName}槽位已满!`);
            return;
        }
        
        // 扣除金币
        this.game.money -= price;
        
        // 复制物品到槽位
        slotArray[emptyIndex] = { ...item };
        
        // 从商店移除物品
        this.items.splice(index, 1);
        
        // 更新UI
        this.game.updateUI();
        this.render();
        this.closeDetail();
        
        alert(`成功购买 ${item.name}!`);
    }
    
    closeDetail() {
        document.getElementById('detail-modal').classList.remove('active');
    }
    
    reroll() {
        if (this.game.money < this.rerollPrice) {
            alert('金币不足!');
            return;
        }
        
        this.game.money -= this.rerollPrice;
        this.rerollCount++;
        this.rerollPrice = 10 * Math.pow(5, this.rerollCount - 1);
        this.seed = this.generateSeed();
        this.generateItems();
        this.render();
        this.game.updateUI();
        
        alert('商店已刷新!');
    }
    
    upgrade() {
        if (this.game.money < 200) {
            alert('金币不足!');
            return;
        }
        
        this.game.money -= 200;
        this.level++;
        
        // 升级商店，增加槽位
        this.config.crowSlots++;
        this.config.itemSlots++;
        
        // 如果达到3级，增加饰品槽位
        if (this.level >= 3 && this.config.accessorySlots < 2) {
            this.config.accessorySlots = 2;
        }
        
        // 生成新物品
        this.generateItems();
        this.render();
        this.game.updateUI();
        
        alert(`商店升级到 ${this.level} 级!`);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Shop };
}