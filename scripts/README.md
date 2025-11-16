# 预生成数据集生成器

将单词书（txt格式）批量转换为预生成的AI内容JSON文件，支持完善的**中断恢复机制**。

## 功能特性

- **中断恢复**：任何时候中断（Ctrl+C、崩溃、网络故障），重启后自动从断点继续
- **进度保存**：每10个单词自动保存一次进度
- **速率控制**：自适应速率限制，避免触发API限制
- **指数退避**：遇到429错误时自动延长等待时间
- **部分完成**：单词的synonyms和phrases独立处理，一个失败不影响另一个
- **实时进度**：显示当前进度、预估剩余时间、token使用量、成本估算
- **优雅退出**：Ctrl+C安全退出，保存所有进度

## 安装依赖

本脚本需要Node.js 14+，无需额外安装npm包（使用Node.js内置模块）。

## 快速开始

### 1. 准备配置文件

复制配置示例：

```bash
cp config.example.json config.json
```

编辑`config.json`，填入你的API信息：

```json
{
  "apiKey": "你的API密钥",
  "apiUrl": "https://api.5202030.xyz/v1",
  "model": "deepseek/deepseek-v3.2-exp",
  "temperature": 0.7,
  "maxTokens": 2000,
  "rpm": 60
}
```

### 2. 准备单词书

单词书格式（txt文件）：

```
word [phonetic] definition
example [ɪɡˈzɑːmpl] 例子；榜样
```

每行一个单词，格式：`单词 [音标] 释义`

### 3. 运行生成脚本

```bash
node generate-pregenerated.js \
  --input ../languagelearning/english/wordlists/CET4_edited.txt \
  --output ../languagelearning/english/data/cet4_pregenerated.json \
  --bookId cet4 \
  --language english
```

## 命令行参数

### 必需参数

- `--input <path>` - 单词书文件路径
- `--output <path>` - 输出JSON文件路径
- `--bookId <id>` - 词汇书ID（如cet4、cet6、toefl）

### 可选参数

- `--language <lang>` - 语言（english/japanese，默认english）
- `--config <path>` - AI配置文件路径（默认使用内置配置）
- `--rpm <number>` - 每分钟请求数限制（默认60）
- `--batch-size <number>` - 批次保存大小（默认10）
- `--test-mode <number>` - 测试模式，只处理前N个单词
- `--force` - 强制从头开始，删除现有进度
- `--validate` - 只验证单词书格式，不生成
- `--dry-run` - 试运行，显示估算但不调用API

## 使用示例

### 基础用法

```bash
node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4
```

### 测试模式（只处理前10个单词）

```bash
node generate-pregenerated.js \
  --input wordlist.txt \
  --output output.json \
  --bookId cet4 \
  --test-mode 10
```

### 使用自定义配置

```bash
node generate-pregenerated.js \
  --input wordlist.txt \
  --output output.json \
  --bookId cet4 \
  --config my-config.json
```

### 验证单词书格式

```bash
node generate-pregenerated.js --input wordlist.txt --validate
```

### Dry-run（查看估算）

```bash
node generate-pregenerated.js \
  --input wordlist.txt \
  --output output.json \
  --bookId cet4 \
  --dry-run
```

输出示例：
```
[Dry-run模式] 估算信息:
  总单词数: 2200
  总查询数: 4400
  预估tokens: 6600000
  预估成本: $0.6600
  预估时间: 1小时13分
```

## 中断恢复机制

### 进度文件

脚本会自动创建`.progress.json`文件（例如`cet4_pregenerated.json.progress.json`），记录：

- 已完成的单词
- 失败的单词
- token使用量
- 成本估算

### 中断场景

支持以下所有中断场景的恢复：

1. **Ctrl+C手动中断** - 安全保存进度后退出
2. **网络故障** - 失败的查询会重试，超过重试次数后跳过
3. **API速率限制** - 自动延长等待时间
4. **系统崩溃** - 重启后从最后一次批次保存点继续
5. **脚本错误** - 重启后跳过已完成的单词

### 恢复方式

直接重新运行相同的命令，脚本会：

1. 检测到现有的`.progress.json`文件
2. 加载已完成的单词列表
3. 跳过已完成的单词
4. 从中断点继续处理

```bash
# 中断后，直接重新运行相同命令
node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4
```

输出示例：
```
[ProgressManager] 加载现有进度: 450/2200 单词已完成
待处理单词: 1750/2200
```

### 强制重新开始

如果需要完全重新开始：

```bash
node generate-pregenerated.js \
  --input wordlist.txt \
  --output output.json \
  --bookId cet4 \
  --force
```

## 输出文件格式

生成的JSON文件格式：

```json
{
  "example": {
    "synonyms": {
      "content": "## 同义词分析\n\n### 主要同义词\n\n1. **instance** [ˈɪnstəns]...",
      "generated": "2024-01-20T10:00:00Z"
    },
    "phrases": {
      "content": "## 常用短语\n\n1. **for example**...",
      "generated": "2024-01-20T10:00:00Z"
    }
  },
  "abandon": {
    "synonyms": { ... },
    "phrases": { ... }
  }
}
```

## 性能和成本

### 速度

- CET4（2200词）：约1-2小时（60 RPM）
- CET6（2800词）：约1.5-2.5小时（60 RPM）
- 使用本地模型：可设置更高RPM（如120），速度翻倍

### 成本估算

基于DeepSeek API（$0.0001/1K tokens）：

- 每个查询平均：1500 tokens
- 每个单词：2次查询 = 3000 tokens
- CET4（2200词）：6.6M tokens ≈ $0.66
- CET6（2800词）：8.4M tokens ≈ $0.84

**注意**：实际成本取决于具体的API定价��生成内容的详细程度。

### 优化建议

1. **使用本地模型**：成本为0，速度可能更快
2. **测试模式先验证**：用`--test-mode 10`先测试10个单词
3. **调整maxTokens**：根据需要的详细程度调整（默认2000）
4. **夜间运行**：对于大词库，建议夜间运行

## 故障排除

### Q: 提示"LLMClient导入失败"

A: 确保`aitools/aichat/llm-client.js`文件存在。检查相对路径是否正确。

### Q: 遇到429错误，脚本一直等待

A: 这是速率限制，脚本会自动处理。可以：
- 降低`--rpm`参数（如`--rpm 30`）
- 等待脚本自动恢复（使用指数退避策略）

### Q: 生成的内容被截断

A: 增加`maxTokens`：
```json
{
  "maxTokens": 3000
}
```

### Q: 如何查看失败的单词

A: 查看`.progress.json`文件的`failedWords`字段：

```bash
# Linux/macOS
cat cet4_pregenerated.json.progress.json | jq '.failedWords'

# Windows
type cet4_pregenerated.json.progress.json | findstr failedWords
```

### Q: 进度文件损坏

A: 删除进度文件，重新开始：

```bash
rm cet4_pregenerated.json.progress.json
```

或使用`--force`参数。

## 环境变量

可以通过环境变量配置（优先级高于配置文件）：

```bash
export LLM_API_KEY="your-api-key"
export LLM_API_URL="https://api.example.com/v1"
export LLM_MODEL="model-name"

node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4
```

## 文件说明

- `generate-pregenerated.js` - 主脚本
- `lib/progress-manager.js` - 进度管理器
- `lib/vocabulary-parser.js` - 单词书解析器
- `lib/rate-limiter.js` - 速率限制器
- `lib/generator.js` - AI内容生成器
- `config.example.json` - 配置示例
- `README.md` - 本文档

## 许可

MIT License

## 贡献

欢迎提交Issue和Pull Request！
