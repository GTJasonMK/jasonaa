/**
 * ChatTavern主类
 * 整合所有组件，提供完整的角色对话功能
 */
class ChatTavern {
    constructor() {
        // 核心组件
        this.pngReader = new PNGCardReader();
        this.pngWriter = new PNGCardWriter();

        // 当前状��
        this.currentCharacter = null;
        this.currentMemory = null;

        // 角色库
        this.characters = new Map();

        // AI管理器（可选，需要用户配置）
        this.aiManager = new AIManager();

        // 注意：init()是async函数，必须在外部await调用
    }

    /**
     * 初始化
     */
    async init() {
        await this.loadCharacters();
    }

    /**
     * 加载角色
     */
    async loadCharacters() {
        const saved = localStorage.getItem('chattavern_characters');
        console.log('[ChatTavern] 从localStorage加载角色数据:', saved ? `${saved.length}字符` : '无数据');

        if (saved) {
            try {
                const charsData = JSON.parse(saved);
                console.log('[ChatTavern] 解析到角色数量:', charsData.length);

                for (const charData of charsData) {
                    const char = CharacterCard.fromJSON(charData);
                    console.log('[ChatTavern] 加载角色:', char.id, char.name);
                    this.characters.set(char.id, char);
                }

                console.log('[ChatTavern] 总共加载角色:', this.characters.size);
            } catch (error) {
                console.error('[ChatTavern] 加载角色失败:', error);
            }
        }
    }

    /**
     * 导入PNG角色卡
     */
    async importPNGCard(file) {
        try {
            console.log('[ChatTavern] 开始导入PNG:', file.name, file.size, 'bytes');

            const characterData = await this.pngReader.readFromPNG(file);
            console.log('[ChatTavern] PNG解析成功，角色数据:', characterData);

            const character = CharacterCard.fromJSON(characterData);
            console.log('[ChatTavern] CharacterCard创建成功:', character.id, character.name);

            const validation = character.validate();
            if (!validation.valid) {
                throw new Error('角色卡数据无效: ' + validation.errors.join(', '));
            }

            this.characters.set(character.id, character);
            console.log('[ChatTavern] 角色已添加到Map，当前角色数:', this.characters.size);

            this.saveCharacters();
            console.log('[ChatTavern] 角色已保存到localStorage');

            return character;
        } catch (error) {
            console.error('[ChatTavern] 导入角色卡失败:', error);
            throw error;
        }
    }

    /**
     * 导出PNG角色卡
     */
    async exportPNGCard(characterId, imageFile) {
        const character = this.characters.get(characterId);
        if (!character) throw new Error('角色不存在');

        const pngBlob = await this.pngWriter.writeToPNG(
            character.toJSON(),
            imageFile
        );

        // 下载
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name}_card.png`;
        a.click();
        URL.revokeObjectURL(url);

        return pngBlob;
    }

    /**
     * 开始对话
     */
    async startChat(characterId) {
        console.log('[ChatTavern] 尝试开始对话，角色ID:', characterId);
        console.log('[ChatTavern] 当前Map中的所有角色ID:', Array.from(this.characters.keys()));

        const character = this.characters.get(characterId);
        if (!character) {
            console.error('[ChatTavern] 未找到角色！');
            console.error('[ChatTavern] 查找的ID:', characterId, '(类型:', typeof characterId, ')');
            console.error('[ChatTavern] Map中的ID:', Array.from(this.characters.keys()).map(id => `${id} (${typeof id})`));
            throw new Error('角色不存在');
        }

        console.log('[ChatTavern] 找到角色:', character.name);

        this.currentCharacter = character;
        this.currentMemory = new DialogueMemory(characterId);

        // 显示第一条消息
        const firstMessage = character.getFirstMessage();
        this.currentMemory.addMessage('assistant', firstMessage);

        return {
            character,
            firstMessage
        };
    }

    /**
     * 发送消息
     */
    async sendMessage(userMessage) {
        if (!this.currentCharacter || !this.currentMemory) {
            throw new Error('未选择角色');
        }

        // 添加用户消息
        this.currentMemory.addMessage('user', userMessage);

        // 获取回复（使用AI或对话树）
        let response;
        if (this.aiManager && await this.aiManager.isAvailable()) {
            try {
                const context = this.currentMemory.getContext(10);
                response = await this.aiManager.getResponse(
                    this.currentCharacter.id,
                    userMessage,
                    context,
                    this.currentCharacter  // 传递角色对象，用于获取system_prompt和参数
                );
            } catch (error) {
                console.error('[ChatTavern] AI调用失败，使用降级回复:', error);
                response = this.getSimpleResponse(userMessage) + '\n\n（AI调用失败: ' + error.message + '）';
            }
        } else {
            // 降级：简单回复
            response = this.getSimpleResponse(userMessage);
        }

        // 添加AI回复
        this.currentMemory.addMessage('assistant', response);

        return response;
    }

    /**
     * 简单回复（降级方案）
     */
    getSimpleResponse(userMessage) {
        const responses = [
            `我明白你的意思。`,
            `这很有趣，继续说吧。`,
            `我在听，请继续。`,
            `嗯，我懂了。`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * 保存所有角色
     */
    saveCharacters() {
        const data = Array.from(this.characters.values()).map(c => c.toJSON());
        console.log('[ChatTavern] 准备保存角色到localStorage:', data.length, '个');
        console.log('[ChatTavern] 第一个角色的保存格式:', data[0]);
        console.log('[ChatTavern] 第一个角色的ID:', data[0]?.data?.extensions?.chattavern?.id);

        localStorage.setItem('chattavern_characters', JSON.stringify(data));
        console.log('[ChatTavern] 已保存到localStorage');
    }

    /**
     * 删除角色
     */
    deleteCharacter(characterId) {
        this.characters.delete(characterId);
        this.saveCharacters();

        // 清除记忆
        localStorage.removeItem(`chattavern_memory_${characterId}`);
    }

    /**
     * 更新角色信息
     */
    updateCharacter(characterId, updates) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('角色不存在');
        }

        console.log('[ChatTavern] 更新角色:', characterId, updates);

        // 更新字段
        if (updates.name !== undefined) character.name = updates.name;
        if (updates.description !== undefined) character.description = updates.description;
        if (updates.personality !== undefined) character.personality = updates.personality;
        if (updates.scenario !== undefined) character.scenario = updates.scenario;
        if (updates.first_mes !== undefined) character.first_mes = updates.first_mes;
        if (updates.system_prompt !== undefined) character.system_prompt = updates.system_prompt;
        if (updates.temperature !== undefined) character.temperature = updates.temperature;
        if (updates.max_tokens !== undefined) character.max_tokens = updates.max_tokens;
        if (updates.tags !== undefined) character.tags = updates.tags;

        // 更新时间戳
        character.updatedAt = Date.now();

        // 保存到localStorage
        this.saveCharacters();

        console.log('[ChatTavern] 角色更新完成');
        return character;
    }

    /**
     * 获取所有角色列表
     */
    getCharacterList() {
        return Array.from(this.characters.values()).map(c => c.getSummary());
    }
}

// 全局实例
if (typeof window !== 'undefined') {
    window.ChatTavern = ChatTavern;
}
