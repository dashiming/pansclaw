# PansClaw

<p align="center">
  <img src="image/1.png" alt="PansClaw" width="100">
</p>

<p align="center">
  <b>自托管 AI 网关 · 多模型统一接入 · 可扩展插件生态</b>
</p>

<p align="center">
  <img src="image/4.png" alt="Pan'sPower" width="120"><br>
  <sub>Pan'sPower 提供算力支持</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v0.3.1-blue" alt="version">
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen" alt="node">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="license">
</p>

---

## 目录

- [特性](#特性)
- [系统要求](#系统要求)
- [方式一：mac 本地一键安装（推荐）](#方式一mac-本地一键安装推荐)
- [方式二：Docker Compose 部署](#方式二docker-compose-部署)
- [方式三：全局 npm 安装](#方式三全局-npm-安装)
- [方式四：从源码构建](#方式四从源码构建)
- [配置 API 密钥](#配置-api-密钥)
- [启动与访问](#启动与访问)
- [使用教程](#使用教程)
- [更新](#更新)
- [常见问题](#常见问题)

---

## 特性

- **多模型统一接入**：OpenAI、Anthropic Claude、Google Gemini、OpenRouter 等，一个网关统一管理
- **Dashboard 可视化配置**：浏览器内完成模型选择、API Key 设置、.env 文件管理
- **自托管 / 私有化部署**：完整数据留本地，支持 Docker、VPS、树莓派等环境
- **多通道 AI 助手**：支持网页、移动端、浏览器扩展协同接入
- **可扩展插件生态**：矩阵、Slack、Discord、Telegram 等通道插件开箱可用
- **安全网关令牌**：通过随机 Token 鉴权，支持 LAN/loopback 绑定模式

---

## 系统要求

| 项目    | 要求                                                            |
| ------- | --------------------------------------------------------------- |
| Node.js | 22 LTS 或更高（推荐 24）                                        |
| Docker  | Docker Desktop 或 Docker Engine + Compose v2（Docker 部署必须） |
| 内存    | 建议 ≥ 2 GB（1 GB 主机镜像构建可能 OOM）                        |
| 网络    | 能访问所用模型服务商的 API 地址                                 |

---

## 方式一：mac 本地一键安装（推荐）

给普通用户最简单的方式：一条命令完成依赖安装、CLI 安装、网关初始化和本地启动。

```bash
curl -fsSL https://raw.githubusercontent.com/dashiming/pansclaw/main/scripts/install-macos-local.sh | bash
```

脚本会自动完成：

- 检查并安装 Homebrew（如缺失）
- 安装 Node.js 24（满足 Node 22.16+ 要求）
- 全局安装 `pansclaw@latest`
- 执行本地 onboarding（loopback + daemon）
- 输出 Dashboard 地址和登录 Token

适用场景：个人 Mac、本地开发机、希望不用 Docker 的用户。

---

## 方式二：Docker Compose 部署

Docker Compose 是生产环境和 VPS 部署的首选方式，配置最简单，开箱即用。

### 1. 克隆仓库

```bash
git clone https://github.com/dashiming/pansclaw.git
cd pansclaw
```

### 2. 复制环境变量模板

```bash
cp .env.example .env
```

### 3. 编辑 `.env` 文件

用文本编辑器打开 `.env`，**必填**以下两项：

```dotenv
# 网关访问令牌（建议使用 openssl rand -hex 32 生成）
OPENCLAW_GATEWAY_TOKEN=your-strong-random-token-here

# 至少填写一个模型 API 密钥，例如：
OPENAI_API_KEY=sk-...
# 或
ANTHROPIC_API_KEY=sk-ant-...
# 或
GEMINI_API_KEY=AIza...
```

其他可选配置（挂载目录等）保持默认即可。

### 4. 构建并启动

```bash
docker compose up -d --build
```

首次构建约需 3–5 分钟（取决于网络）。之后每次启动只需：

```bash
docker compose up -d
```

### 5. 验证运行状态

```bash
docker compose ps
# 应看到 openclaw-gateway 状态为 healthy
```

---

## 方式三：全局 npm 安装

适合在本机快速体验，无需 Docker。

```bash
# 安装（需要 Node 22+）
npm install -g pansclaw@latest
# 或使用 pnpm
pnpm add -g pansclaw@latest
```

安装完成后运行引导向导：

```bash
pansclaw onboard --install-daemon
```

向导将自动：

- 配置认证方式（API Key 或 Token）
- 设置网关绑定地址和端口
- 可选：安装为系统服务（后台自动启动）

引导完成后启动网关：

```bash
pansclaw gateway status      # 检查运行状态
pansclaw dashboard            # 在浏览器中打开控制台
```

---

## 方式四：从源码构建

适合开发者贡献代码或定制功能。

### 前置依赖

```bash
# 安装 pnpm（如果尚未安装）
npm install -g pnpm
```

### 构建步骤

```bash
git clone https://github.com/dashiming/pansclaw.git
cd pansclaw

# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式运行
pnpm dev
```

### 运行测试

```bash
pnpm test
```

---

## 配置 API 密钥

PansClaw 支持在 `.env` 文件中统一配置各模型提供商的 API 密钥：

```dotenv
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=AIza...

# OpenRouter（支持多个模型）
OPENROUTER_API_KEY=sk-or-...
```

**Docker 部署**：修改 `.env` 后，重启容器即可生效：

```bash
docker compose restart openclaw-gateway
```

**Dashboard 内设置**：也可直接在浏览器 Dashboard → _模型设置_ 页面中填写，无需手动编辑文件。

---

## 启动与访问

### Docker 部署

```bash
# 启动
docker compose up -d

# 查看日志
docker compose logs -f openclaw-gateway

# 停止
docker compose down
```

默认访问地址：

```
http://127.0.0.1:18789/
```

### npm 全局安装

```bash
# 启动网关（前台）
pansclaw gateway --port 18789

# 打开 Dashboard
pansclaw dashboard
```

---

## 使用教程

### 1. 打开 Dashboard

浏览器访问 `http://127.0.0.1:18789/`（或服务器 IP:18789）。  
首次访问需输入 `.env` 中设置的 `OPENCLAW_GATEWAY_TOKEN`。

### 2. 设置模型和 API Key

进入 **设置 → 模型设置**，可在界面中：

- 选择默认模型（GPT-4o、Claude 3.5 Sonnet、Gemini 2.0 等）
- 输入对应 API Key
- 点击 **保存** 自动写入 `.env`，无需重启

### 3. 开始对话

在聊天界面顶部：

1. 点击模型选择器，选择要使用的模型
2. 若该模型尚无 API Key，会出现输入框，填入后点击 **确定**
3. 在输入框中输入问题，按 Enter 发送

### 4. 发送消息（命令行）

```bash
# Docker 部署
docker compose exec openclaw-cli pansclaw message send \
  --target +15555550123 \
  --message "Hello from PansClaw"

# 本地安装
pansclaw message send --target +15555550123 --message "Hello"
```

### 5. 检查网关状态

```bash
# 本地
pansclaw gateway status

# Docker
docker compose exec openclaw-cli pansclaw gateway status
```

---

## 更新

### Docker 部署更新

```bash
git pull origin main
docker compose down
docker compose up -d --build
```

### npm 全局安装更新

```bash
npm install -g pansclaw@latest
pansclaw gateway restart
```

---

## 常见问题

**Q: 容器启动后 Dashboard 无法访问？**  
A: 检查 `docker compose ps` 中 `openclaw-gateway` 是否为 `healthy`；查看日志 `docker compose logs openclaw-gateway`。

**Q: API Key 填写后提示无效？**  
A: 确认密钥格式正确，且账户余额充足；OpenAI 密钥以 `sk-` 开头，Anthropic 以 `sk-ant-` 开头。

**Q: 忘记了 Gateway Token？**  
A: 查看 `.env` 文件中的 `OPENCLAW_GATEWAY_TOKEN` 值。

**Q: 如何在 VPS/服务器上部署？**  
A: 同 Docker 部署步骤，将 `docker-compose.yml` 中端口映射或用 Nginx 反向代理；建议绑定模式设置为 `lan`，并配置防火墙只开放必要端口。

**Q: 如何卸载？**  
A: Docker 部署执行 `docker compose down -v` 清除容器和卷；npm 安装执行 `npm uninstall -g pansclaw`。

---

<p align="center">
  Made with Pans Entertainment · <a href="https://github.com/dashiming/pansclaw/issues">反馈问题</a>
</p>
