# aitools模块重构测试指南

本文档说明如何测试aitools模块的重构成果。

## 重构概述

本次重构完成了以下工作：

1. **创建统一配置管理器** - `aitools/shared/config-manager.js`
2. **移除硬编码API密钥** - 从chat.js、AIManager.js、english.js、japanese.js中移除
3. **重构AIManager.js** - 使用LLMClient统一封装，删除约150行重复代码
4. **统一配置接口** - 所有模块使用AIConfigManager

## 测试前准备

### 1. 配置AI服务

访问 `aitools/aichat/index.html`，配置您的AI服务：

- API URL: 例如 `https://api.5202030.xyz/v1`
- API Key: 您的API密钥
- Model: 例如 `gpt-3.5-turbo` 或 `deepseek/deepseek-v3.2-exp`

配置会自动保存到 `ai_config` 键（新统一键名）。

### 2. 配置迁移验证

如果您之前使用过aichat或chattavern：

1. 打开浏览器控制台（F12）
2. 检查localStorage中是否有旧配置：
   - `aichat_config`
   - `chattavern_ai_config`
3. 首次加载任何AI功能时，应该看到迁移日志：
   ```
   [AIConfigManager] 检测到aichat_config，自动迁移到ai_config
   ```

## 测试项目

### 测试1：aichat聊天室

**测试步骤**：
1. 访问 `aitools/aichat/index.html`
2. 点击⚙️设置图标
3. 确认API配置已加载
4. 发送测试消息："你好"
5. 验证AI回复正常

**预期结果**：
- 无硬编码API key加载
- 配置从ai_config正确读取
- 聊天功能正常
- 控制台显示：`[AIChatRoom] AI客户端初始化成功`

### 测试2：ChattaTavern角色对话

**测试步骤**：
1. 访问 `aitools/chattavern/chattavern.html`
2. 点击"配置AI"
3. 确认API配置已加载
4. 导入一个角色卡或使用内置角色
5. 与角色对话，发送消息："你好"

**预期结果**：
- AIManager正确初始化LLMClient
- 控制台显示：`[AIManager] 使用LLMClient统一封装`
- 角色对话功能正常
- 支持角色卡system prompt

### 测试3：英语学习模块AI助手

**测试步骤**：
1. 访问 `languagelearning/english/index.html`
2. 选择任意词汇书（如CET4）
3. 学习一个单词
4. 点击"相近释义及区别"按钮
5. 等待AI回复

**预期结果**：
- 无硬编码API key
- 配置从AIConfigManager读取
- 控制台显示：`[AIAssistant] AI客户端初始化成功（使用统一配置管理器）`
- AI助手功能正常
- 预生成数据加载正常

### 测试4：日语学习模块AI助手

**测试步骤**：
1. 访问 `languagelearning/japanese/index.html`
2. 选择词汇书
3. 学习一个单词
4. 点击AI查询按钮

**预期结果**：
- 与英语模块相同的行为
- 统一配置管理器正常工作

### 测试5：配置验证

**测试步骤**：
1. 清除所有AI配置：
   ```javascript
   localStorage.removeItem('ai_config');
   localStorage.removeItem('aichat_config');
   localStorage.removeItem('chattavern_ai_config');
   ```
2. 刷新任意AI功能页面
3. 尝试使用AI功能

**预期结果**：
- 显示配置提示："请先配置API信息"
- 不会使用硬编码的默认API key
- 引导用户前往配置页面

### 测试6：错误处理

**测试步骤**：
1. 配置错误的API URL
2. 尝试调用AI
3. 观察错误提示

**预期结果**：
- 友好的错误提示
- CORS错误有详细解决方案
- 控制台有详细的错误日志

### 测试7：性能和稳定性

**测试步骤**：
1. 连续发送多条消息
2. 测试超时处理（等待2分钟）
3. 测试网络中断恢复

**预期结果**：
- LLMClient的重试机制生效
- 超时后正确报错
- 网络恢复后可以继续使用

## 控制台日志验证

### AIManager重构验证

在ChattaTavern使用时，控制台应显示：

```
[AIManager] 开始获取AI回复
[AIManager] 使用提供商: custom
[AIManager] 模型: deepseek/deepseek-v3.2-exp
[AIManager] ========== API请求详情 ==========
[AIManager] 使用LLMClient统一封装
[AIManager] LLMClient已初始化
[LLMClient] 请求成功
[AIManager] 请求成功
[AIManager] 返回内容长度: 123
[AIManager] Chunks数量: 5
```

### 配置管理器验证

首次加载时，控制台应显示：

```
[AIConfigManager] 检测到aichat_config，自动迁移到ai_config
[AIConfigManager] 配置加载成功（来源：ai_config）
```

## 测试检查清单

- [ ] aichat聊天功能正常
- [ ] chattavern角色对话正常
- [ ] 英语学习AI助手正常
- [ ] 日语学习AI助手正常
- [ ] 配置迁移自动完成
- [ ] 无API key硬编码
- [ ] 配置验证正常工作
- [ ] 错误提示友好清晰
- [ ] LLMClient重试机制生效
- [ ] 控制台日志格式统一

## 已知变更

### 代码行数变化

- AIManager.js: 392行 → 318行（删除74行）
- chat.js: 硬编码API key已移除
- english.js: 配置加载逻辑简化
- japanese.js: 配置加载逻辑简化
- 新增: config-manager.js (164行)

### 性能提升

- AIManager现在拥有LLMClient的所有高级特性：
  - 自动重试（最多2次）
  - 超时控制（120秒）
  - 浏览器header模拟
  - 更好的错误处理

### 向后兼容性

- 旧的配置键名（aichat_config、chattavern_ai_config）会自动迁移
- 用户无需手动修改配置
- 配置迁移是透明的

## 测试完成后

如果所有测试通过：
1. ✅ 安全问题已解决（硬编码key已移除）
2. ✅ 代码重复已消除（约150行）
3. ✅ 架构更清晰（统一配置管理）
4. ✅ 功能更强大（LLMClient特性）
5. ✅ 维护成本降低（单一代码路径）

如果发现问题，请记录：
- 问题描述
- 复现步骤
- 控制台错误日志
- 浏览器和版本
