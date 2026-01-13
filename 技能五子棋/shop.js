// 商店系统
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
            skillSlots: 3,
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
        
        // 生成技能牌
        const skillKeys = Object.keys(skillCards);
        const selectedSkills = new Set();
        for (let i = 0; i < this.config.skillSlots; i++) {
            if (skillKeys.length === 0) break;
            
            let randomSkill;
            do {
                randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
            } while (selectedSkills.has(randomSkill) && selectedSkills.size < skillKeys.length);
            
            selectedSkills.add(randomSkill);
            const skill = { ...skillCards[randomSkill] };
            skill.price = this.getRandomPrice();
            this.items.push(skill);
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
            item.price = this.getRandomPrice();
            this.items.push(item);
        }
        
        // 生成饰品
        const accessoryKeys = Object.keys(accessories);
        if (accessoryKeys.length > 0 && this.config.accessorySlots > 0) {
            const randomAccessory = accessoryKeys[Math.floor(Math.random() * accessoryKeys.length)];
            const accessory = { ...accessories[randomAccessory] };
            accessory.price = this.getRandomPrice();
            this.items.push(accessory);
        }
    }
    
    getRandomPrice() {
        const { min, max } = this.config.priceRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
            
            itemElement.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <h4>${item.name}</h4>
                <p class="shop-item-price">${discountedPrice} 金币</p>
                <p class="shop-item-type">${this.getItemTypeName(item.type)}</p>
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
            case 'skill': return '技能牌';
            case 'item': return '道具牌';
            case 'accessory': return '饰品';
            default: return '未知';
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
        let slotArray;
        let maxSlots;
        
        switch (item.type) {
            case 'skill':
                slotArray = this.game.skillSlots;
                maxSlots = 6;
                break;
            case 'item':
                slotArray = this.game.itemSlots;
                maxSlots = 4;
                break;
            case 'accessory':
                slotArray = this.game.accessorySlots;
                maxSlots = 2;
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
            alert('槽位已满!');
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
        this.config.skillSlots++;
        this.config.itemSlots++;
        
        // 生成新物品
        this.generateItems();
        this.render();
        this.game.updateUI();
        
        alert(`商店升级到 ${this.level} 级!`);
    }
}

// 初始化商店
// 导出商店类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Shop };
}