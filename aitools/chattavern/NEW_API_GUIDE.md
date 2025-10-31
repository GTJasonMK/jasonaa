# ChatTavern 使用 New API 完整指南

## 目录
1. [问题修复说明](#问题修复说明)
2. [New API 配置步骤](#new-api-配置步骤)
3. [CORS 跨域问题解决](#cors-跨域问题解决)
4. [测试步骤](#测试步骤)
5. [常见问题排查](#常见问题排查)

---

## 问题修复说明

### 已修复的问题

#### 1. URL 自动补全功能 ✅
**问题**：用户需要填写完整的endpoint URL很麻烦

**解决方案**：现在支持智能URL补全
- 输入 `http://192.168.1.100:3000` → 自动补全为 `http://192.168.1.100:3000/v1/chat/completions`
- 输入 `http://api.example.com/v1` → 自动补全为 `http://api.example.com/v1/chat/completions`
- 输入完整URL → 直接使用不修改

#### 2. 详细的错误日志 ✅
**新增功能**：
- 请求前打印完整的API配置信息
- 请求URL、模型名称、参数详情
- 响应状态码和错误详情
- 帮助快速定位问题

**查看方法**：
打开浏览器开发者工具（F12） → Console标签页

#### 3. CORS 错误友好提示 ✅
**问题**：CORS错误信息不明确

**解决方案**：
- 自动检测CORS错误
- 提供清晰的错误说明
- 给出具体的解决方案（包含New API配置命令）

#### 4. CORS 模式支持 ✅
**技术改进**：
- fetch请求添加 `mode: 'cors'`
- 明确指定跨域请求模式
- 提高兼容性

---

## New API 配置步骤

### 步骤1：部署 New API 服务器

#### 方式A：Docker 快速部署（推荐）

```bash
# 基础部署（使用SQLite）
docker run --name new-api -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -e ALLOWED_ORIGIN="*" \
  -v /path/to/data:/data \
  calciumion/new-api:latest
```

**重要**：`ALLOWED_ORIGIN="*"` 环境变量是解决CORS问题的关键！

#### 方式B：使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3'
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - TZ=Asia/Shanghai
      - ALLOWED_ORIGIN=*  # 允许所有来源的跨域请求
    volumes:
      - ./data:/data
```

启动：
```bash
docker-compose up -d
```

### 步骤2：配置 New API

1. **访问管理界面**
   ```
   http://localhost:3000
   或
   http://你的服务器IP:3000
   ```

2. **登录**
   - 默认用户名：`root`
   - 默认密码：`123456`
   - **立即修改密码！**

3. **添加渠道**
   - 进入"渠道管理"
   - 点击"添加渠道"
   - 配置你的AI服务：
     ```
     名称：OpenAI
     类型：OpenAI
     Base URL：https://api.openai.com/v1
     密钥：sk-你的OpenAI密钥
     模型：gpt-3.5-turbo, gpt-4
     ```

4. **创建令牌**
   - 进入"令牌管理"
   - 点击"添加令牌"
   - 复制生成的令牌（格式：`sk-xxxxxx`）

### 步骤3：在 ChatTavern 中配置

1. **打开 ChatTavern**
   ```
   http://localhost:8080/games/chattavern/chattavern.html
   ```

2. **打开 AI 配置**
   - 点击右上角"⋮"菜单按钮

3. **配置自定义API**
   ```
   ☑ 启用AI对话

   AI提供商: [自定义API ▼]

   API Key: sk-xxxxxx  (New API生成的令牌)

   模型: gpt-3.5-turbo
   (或New API后台配置的任何模型)

   自定义API地址: http://你的服务器IP:3000
   (注意：只需填base URL，系统会自动补全)

   Temperature: 0.9
   Max Tokens: 2000
   ```

4. **测试连接**
   - 点击"测试连接"按钮
   - 应该显示"✅ API连接成功！"

5. **保存配置**
   - 点击"保存配置"

---

## CORS 跨域问题解决

### 什么是 CORS？

CORS（Cross-Origin Resource Sharing）是浏览器的安全机制。当你的网页从一个域名（如 `http://localhost:8080`）请求另一个域名（如 `http://192.168.1.100:3000`）的资源时，浏览器会检查是否允许跨域访问。

### CORS 错误特征

**浏览器控制台错误信息**：
```
Access to fetch at 'http://xxx:3000/v1/chat/completions'
from origin 'http://localhost:8080' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**ChatTavern 错误提示**：
```
❌ 网络请求失败（CORS跨域问题）

可能的原因：
1. API服务器未配置CORS允许跨域访问
2. 请求的URL：http://xxx:3000/v1/chat/completions

🔧 New API解决方案：
在docker run命令中添加环境变量：
-e ALLOWED_ORIGIN="*"
```

### 解决方案

#### 方案1：配置 New API 允许跨域（推荐）

**如果使用 docker run**：
```bash
# 停止旧容器
docker stop new-api
docker rm new-api

# 重新启动，添加ALLOWED_ORIGIN环境变量
docker run --name new-api -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -e ALLOWED_ORIGIN="*" \
  -v /path/to/data:/data \
  calciumion/new-api:latest
```

**如果使用环境变量文件**：
创建 `.env` 文件：
```env
ALLOWED_ORIGIN=*
```

**如果使用 Docker Compose**：
在 `docker-compose.yml` 中添加：
```yaml
environment:
  - ALLOWED_ORIGIN=*
```

**安全性考虑**：
- 生产环境建议指定具体域名：
  ```
  ALLOWED_ORIGIN=http://your-domain.com,http://localhost:8080
  ```

#### 方案2：使用 Nginx 反向代理

如果无法修改New API配置，可以使用Nginx做反向代理并添加CORS头：

```nginx
server {
    listen 8081;

    location /api/ {
        # 添加CORS头
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';

        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        # 代理到New API
        proxy_pass http://localhost:3000/;
    }
}
```

ChatTavern配置：
```
自定义API地址: http://localhost:8081/api
```

#### 方案3：浏览器临时禁用CORS（仅开发测试）

**Chrome**：
```bash
# Windows
chrome.exe --user-data-dir="C:/Chrome-dev" --disable-web-security

# macOS
open -n -a "Google Chrome" --args --user-data-dir="/tmp/chrome-dev" --disable-web-security

# Linux
google-chrome --user-data-dir="/tmp/chrome-dev" --disable-web-security
```

**警告**：仅用于本地开发测试，不要在此模式下浏览其他网站！

---

## 测试步骤

### 1. 检查 New API 是否运行

```bash
# 检查容器状态
docker ps | grep new-api

# 应该看到：
# CONTAINER ID   IMAGE                           STATUS
# xxxxx         calciumion/new-api:latest       Up 5 minutes
```

### 2. 测试 New API 直接访问

```bash
# 使用curl测试（替换YOUR_TOKEN为你的令牌）
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

**预期结果**：返回JSON响应，包含AI回复

### 3. 测试 ChatTavern 连接

1. 打开 ChatTavern
2. 打开浏览器开发者工具（F12）
3. 切换到 Console 标签页
4. 在 ChatTavern 中点击"测试连接"
5. 观察控制台输出

**成功的日志示例**：
```
[AIManager] ========== API请求详情 ==========
[AIManager] 请求URL: http://192.168.1.100:3000/v1/chat/completions
[AIManager] 请求模型: gpt-3.5-turbo
[AIManager] 消息数量: 2
[AIManager] Temperature: 0.9
[AIManager] Max Tokens: 100
[AIManager] API Key前缀: sk-xxxxxx...
[AIManager] 响应状态: 200 OK
[AIManager] 请求成功，返回内容长度: 15
```

**失败的日志示例（CORS错误）**：
```
[AIManager] ========== 请求失败详情 ==========
[AIManager] 错误类型: TypeError
[AIManager] 错误信息: Failed to fetch
```

### 4. 测试对话功能

1. 导入或创建一个角色
2. 开始对话
3. 发送消息："你好"
4. 观察是否收到AI回复

---

## 常见问题排查

### Q1: 提示"网络请求失败（CORS跨域问题）"

**原因**：New API未配置CORS

**解决**：
1. 检查New API启动命令是否包含 `-e ALLOWED_ORIGIN="*"`
2. 重启New API容器
3. 清除浏览器缓存后重试

**验证CORS配置**：
```bash
# 检查容器环境变量
docker inspect new-api | grep ALLOWED_ORIGIN

# 应该看到：
# "ALLOWED_ORIGIN=*"
```

### Q2: 提示"API错误 (404)"

**可能原因**：
1. URL路径不正确
2. New API服务未运行
3. 端口映射错误

**排查步骤**：
1. 检查控制台日志中的"请求URL"是否正确
2. 确认URL应该是：`http://IP:端口/v1/chat/completions`
3. 测试New API是否可访问：`curl http://localhost:3000/`

### Q3: 提示"API错误 (401) / Unauthorized"

**原因**：API Key无效

**解决**：
1. 检查New API令牌是否正确
2. 在New API管理界面重新生成令牌
3. 在ChatTavern中更新API Key

### Q4: 提示"API错误 (500)"

**原因**：New API后端配置问题

**排查**：
1. 检查New API日志：
   ```bash
   docker logs new-api
   ```
2. 确认New API后台是否正确配置了渠道
3. 确认后端API密钥是否有效

### Q5: URL自动补全不正确

**当前补全规则**：
- `http://server:3000` → `http://server:3000/v1/chat/completions`
- `http://server:3000/v1` → `http://server:3000/v1/chat/completions`
- `http://server:3000/v1/chat/completions` → 不修改

**如果补全错误**：
直接填写完整URL，系统会识别并跳过补全

### Q6: 测试成功但对话失败

**可能原因**：
1. 测试使用的token少，对话使用token多，配额不足
2. 模型名称在测试和对话中不一致

**解决**：
1. 检查New API令牌配额
2. 确认模型名称与New API后台配置一致

---

## 调试技巧

### 1. 查看完整的请求信息

打开浏览器开发者工具 → Console标签页 → 观察带有 `[AIManager]` 前缀的日志

### 2. 查看网络请求详情

开发者工具 → Network标签页 → 找到 `/chat/completions` 请求 → 查看：
- Request Headers（请求头）
- Request Payload（请求体）
- Response（响应）

### 3. 检查 New API 日志

```bash
# 实时查看日志
docker logs -f new-api

# 查看最近100行
docker logs --tail 100 new-api
```

### 4. 使用 curl 直接测试

绕过浏览器，直接测试New API：
```bash
curl -v -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}]}'
```

---

## 配置示例

### 示例1：本地开发环境

```
New API部署：
http://localhost:3000

ChatTavern配置：
AI提供商: 自定义API
API Key: sk-local-test-token-123456
模型: gpt-3.5-turbo
自定义API地址: http://localhost:3000
```

### 示例2：局域网服务器

```
New API部署：
http://192.168.1.100:3000

ChatTavern配置：
AI提供商: 自定义API
API Key: sk-home-server-token-654321
模型: deepseek-chat
自定义API地址: http://192.168.1.100:3000
```

### 示例3：公网域名

```
New API部署：
https://api.yourdomain.com

ChatTavern配置：
AI提供商: 自定义API
API Key: sk-prod-token-abcdef
模型: gpt-4
自定义API地址: https://api.yourdomain.com
```

---

## 总结

### 关键配置要点

1. ✅ **ALLOWED_ORIGIN=\*** - 解决CORS问题
2. ✅ **只需填base URL** - 系统自动补全endpoint
3. ✅ **使用New API令牌** - 不是原始AI服务的API Key
4. ✅ **模型名称要匹配** - 与New API后台配置一致

### 如果还有问题

1. 检查浏览器控制台的详细错误日志
2. 检查New API容器日志
3. 使用curl直接测试New API
4. 确认防火墙没有阻止端口3000

---

## 更新日志

### 2025-01-XX - v1.0
- ✅ 添加URL自动补全功能
- ✅ 改进错误处理和日志
- ✅ 添加CORS错误检测
- ✅ 支持New API完整配置流程
