# PansClaw — 产品文档

> 版本参考：2026.3.13 及 Unreleased（截至 2026-03-16）
> 官方文档：https://docs.openclaw.ai · 官网：https://openclaw.ai

---

## 目录

1. [产品概述](#1-产品概述)
2. [核心架构](#2-核心架构)
3. [安装与上手](#3-安装与上手)
4. [消息渠道（Channels）](#4-消息渠道channels)
5. [AI 模型与提供商](#5-ai-模型与提供商)
6. [Agent（智能体）运行时](#6-agent智能体运行时)
7. [会话管理](#7-会话管理)
8. [工具与自动化](#8-工具与自动化)
9. [技能（Skills）与插件（Plugins）](#9-技能skills与插件plugins)
10. [多 Agent 路由](#10-多-agent-路由)
11. [平台伴侣应用](#11-平台伴侣应用)
12. [安全模型](#12-安全模型)
13. [运维与部署](#13-运维与部署)
14. [开发者指南](#14-开发者指南)

---

## 1. 产品概述

**PansClaw** 是一款运行在用户自己设备上的**个人 AI 助手**。它的目标是：

- 在用户已经在使用的消息渠道中提供 AI 回复（WhatsApp、Telegram、Slack、Discord 等 25+ 渠道）；
- 能在 macOS/iOS/Android 上说话和聆听；
- 可渲染一个由用户控制的实时 Canvas；
- 本地优先（local-first），数据不强制上传第三方。

口号：**"EXFOLIATE! EXFOLIATE!"**

### 产品定位

| 维度 | 描述 |
|------|------|
| 用户群 | 希望获得本地化、快速、常驻个人 AI 的个人用户 |
| 核心价值 | 自托管、多渠道、可扩展、隐私安全 |
| 开源协议 | MIT |
| 语言/运行时 | TypeScript (ESM) / Node ≥22 |

### 赞助商

OpenAI · Vercel · Blacksmith · Convex

---

## 2. 核心架构

### 整体拓扑

```
消息渠道 (WhatsApp / Telegram / Slack / Discord / ...)
          │
          ▼
┌──────────────────────────────────────────┐
│              Gateway（控制平面）           │
│         ws://127.0.0.1:18789             │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Pi Agent │  │ Sessions │  │ Cron   │ │
│  │  (RPC)   │  │  Store   │  │Webhooks│ │
│  └──────────┘  └──────────┘  └────────┘ │
└───────┬──────────────────────────────────┘
        │
        ├── CLI (openclaw ...)
        ├── macOS 菜单栏应用
        ├── WebChat UI (http://127.0.0.1:18789/)
        ├── iOS / Android Node
        └── Canvas Host (/__openclaw__/canvas/)
```

### 关键组件

| 组件 | 说明 |
|------|------|
| **Gateway** | 长驻服务进程，持有全部消息渠道连接，通过 WebSocket 对外提供控制平面 API |
| **Pi Agent** | 内嵌推理运行时（基于 pi-mono），负责 LLM 调用、工具执行、流式输出 |
| **Sessions Store** | 每个 Agent 独立的会话 JSONL 记录，位于 `~/.openclaw/agents/<agentId>/sessions/` |
| **Nodes** | macOS/iOS/Android 设备以 `role:node` 接入 Gateway，暴露 camera/canvas/screen 等设备能力 |
| **Canvas Host** | Gateway 内嵌 HTTP 服务，提供 Agent 可编辑的实时可视化工作区 |
| **Control UI** | 浏览器端管理界面，通过 `openclaw dashboard` 打开 |

### 通信协议

- 传输层：WebSocket，JSON 文本帧
- 第一帧必须为 `connect`（含设备身份 + 可选 token 认证）
- 请求/响应：`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
- 服务端推送：`{type:"event", event, payload, seq?}`
- 幂等 key 机制：`send`/`agent` 等副作用方法必须带 idempotency key 以支持安全重试

---

## 3. 安装与上手

### 系统要求

- **Node ≥22**（推荐 Node 24）
- 操作系统：macOS、Linux、Windows（强烈推荐通过 WSL2）

### 推荐安装方式（安装脚本）

```bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash

# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

脚本会自动检测 Node、安装 CLI、并启动引导向导。

### npm / pnpm 安装

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest

openclaw onboard --install-daemon
```

### 快速开始

```bash
# 1. 引导向导（配置 Auth、Gateway、渠道）
openclaw onboard --install-daemon

# 2. 检查 Gateway 状态
openclaw gateway status

# 3. 打开 Control UI
openclaw dashboard

# 4. 用 Agent 处理任务
openclaw agent --message "帮我写一份项目清单" --thinking high

# 5. 发送消息到指定目标
openclaw message send --target +1234567890 --message "Hello from PansClaw"
```

### 发布渠道

| 渠道 | npm dist-tag | 说明 |
|------|-------------|------|
| stable | `latest` | 正式标签（`vYYYY.M.D`） |
| beta | `beta` | 预发布标签（`vYYYY.M.D-beta.N`） |
| dev | `dev` | main 分支最新（不定期发布） |

切换渠道：`openclaw update --channel stable|beta|dev`

---

## 4. 消息渠道（Channels）

PansClaw 支持 **25+ 消息渠道**，以及内嵌 WebChat：

| 渠道 | 底层库 | 备注 |
|------|--------|------|
| **WhatsApp** | Baileys（Web） | 扫码登录，多账号 |
| **Telegram** | grammY | Bot token |
| **Slack** | Bolt | Bot/Webhook |
| **Discord** | discord.js | Bot token |
| **Google Chat** | Chat API | Service account |
| **Signal** | signal-cli | 需本地安装 signal-cli |
| **BlueBubbles** | iMessage | 推荐 iMessage 接入方式 |
| **iMessage（遗留）** | imsg | 仅 macOS |
| **IRC** | — | — |
| **Microsoft Teams** | — | — |
| **Matrix** | — | — |
| **Feishu（飞书）** | — | 卡片消息、流式渲染 |
| **LINE** | — | — |
| **Mattermost** | — | — |
| **Nextcloud Talk** | — | — |
| **Nostr** | — | — |
| **Synology Chat** | — | — |
| **Tlon** | — | — |
| **Twitch** | — | — |
| **Zalo** | — | — |
| **Zalo Personal** | — | — |
| **WebChat** | 内嵌 | 随 Gateway 启动 |

### DM 安全策略

默认所有陌生发件人需先完成**配对（Pairing）**才能触发 Agent 回复：

```bash
# 查看待确认配对
openclaw pairing list

# 批准配对
openclaw pairing approve <channel> <code>
```

开放策略（接受所有人）：在配置中设 `dmPolicy: "open"` 并将 `"*"` 加入 `allowFrom`。

跑 `openclaw doctor` 检测潜在的 DM 策略风险。

### 群组路由

- 支持 mention gating（仅被 @ 才回复）
- 每渠道独立 chunking/routing 配置
- 群组按渠道 + 房间 ID 独立隔离会话

---

## 5. AI 模型与提供商

### 模型选择顺序

1. `agents.defaults.model.primary`（主模型）
2. `agents.defaults.model.fallbacks`（依序降级）
3. Provider 内部 Auth failover（轮换授权后重试）

### 支持的模型提供商（内置 + 插件）

| 提供商 | 验证方式 |
|--------|---------|
| **OpenAI** / GPT-5.x | API Key 或 OAuth（ChatGPT 订阅） |
| **Anthropic** / Claude 4.x | API Key 或 `claude setup-token` |
| **OpenAI Codex** | OAuth（Codex 订阅） |
| **GitHub Copilot** | OAuth token exchange |
| **OpenRouter** | API Key，支持透传任意模型 |
| **Ollama** | 本地 HTTP |
| **Z.AI / GLM** | API Key |
| **MiniMax / Moonshot / Qianfan / BytePlus / VolcEngine** | API Key |
| **Mistral / Together / Venice / vLLM / SGLang** | API Key / Local |
| **NVIDIA / HuggingFace** | API Key |
| **Cloudflare AI Gateway / Vercel AI Gateway** | 代理网关 |
| **ModelStudio（阿里）** | API Key |
| **Kimi Coding / OpenCode / Kilocode** | 插件 |

### 配置示例

```json5
// ~/.openclaw/openclaw.json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-5",
        "fallbacks": ["anthropic/claude-opus-4-6", "openrouter/auto"]
      }
    }
  }
}
```

```bash
# CLI 快捷操作
openclaw models list
openclaw models set openai/gpt-5
openclaw models scan      # 探测可用模型（tools/images 能力）
```

---

## 6. Agent（智能体）运行时

### 工作空间（Workspace）

Agent 使用单一工作目录（`agents.defaults.workspace`，默认 `~/.openclaw/workspace`）作为上下文基准。

**引导文件**（启动时注入系统提示）：

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 操作指令 + "记忆" |
| `SOUL.md` | 人格、边界、语调 |
| `TOOLS.md` | 工具使用笔记（用户维护） |
| `BOOTSTRAP.md` | 首次启动仪式（完成后删除） |
| `IDENTITY.md` | 代理昵称/表情 |
| `USER.md` | 用户档案 + 称呼偏好 |

空文件跳过注入；超大文件自动截断并附标记。

### 内置工具（Pi Agent 工具集）

- **文件操作**：read / write / edit（apply_patch）
- **Shell 执行**：`system.run`（受执行策略管控）
- **浏览器控制**：tab/snapshot/actions（见第 8 节）
- **Canvas 操作**：present / navigate / eval / snapshot / a2ui
- **设备能力**：camera.snap / screen.record / location.get / system.notify
- **定时任务**：cron（在线调度）
- **子 Agent**：subagents.create / subagents.send

### 思考模式（Thinking）

通过 `--thinking low|high` 控制推理深度（对支持 extended thinking 的模型有效）。

### 会话压缩（Compaction）

当上下文接近模型限制时，Gateway 自动触发上下文压缩，保留关键信息并释放 token 空间。可通过 `agents.defaults.compaction` 配置策略。

---

## 7. 会话管理

### 会话 DM 隔离模式（`session.dmScope`）

| 模式 | 说明 |
|------|------|
| `main`（默认） | 所有 DM 共享主会话（适合单用户）|
| `per-peer` | 按发件人 ID 隔离 |
| `per-channel-peer` | 按渠道 + 发件人隔离（推荐多用户） |
| `per-account-channel-peer` | 按账号 + 渠道 + 发件人隔离（推荐多账号） |

> **安全警告**：多用户场景强烈建议设 `dmScope: "per-channel-peer"`，防止上下文跨用户泄露。

### 存储位置

- 会话索引：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 对话记录：`~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

### 会话维护

Gateway 定期清理过期会话和记录，可通过 `session.maintenance` 配置触发模式（`warn` / `auto`）和保留策略。

---

## 8. 工具与自动化

### 浏览器控制（Browser）

PansClaw 管理独立的 Chrome/Chromium/Brave 配置文件（与个人浏览器完全隔离）：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

三种内置 Profile：
- `openclaw`：隔离的 Agent 专用浏览器
- `user`：附加到已登录的真实 Chrome 会话
- `chrome-relay`：通过 Chrome 扩展 relay 到系统浏览器

### 定时任务（Cron）

内置 Gateway 调度器，任务持久化于 `~/.openclaw/cron/`：

```bash
# 一次性提醒
openclaw cron add \
  --name "Reminder" \
  --at "2026-04-01T09:00:00Z" \
  --session main \
  --system-event "提醒：检查项目进度" \
  --wake now \
  --delete-after-run

# 每日定时任务
openclaw cron add \
  --name "Morning Brief" \
  --cron "0 8 * * *" \
  --tz "Asia/Shanghai" \
  --isolated

openclaw cron list
openclaw cron run <job-id>
```

### Webhook

Gateway 内置 HTTP Webhook 接收器，可从外部系统触发 Agent 任务。每条 webhook 路由独立授权和 body 限制。

### Gmail Pub/Sub

通过 Google Pub/Sub 接收 Gmail 邮件推送并触发 Agent 响应，详见 `docs/automation/gmail-pubsub.md`。

### Hooks（自定义钩子）

在 Agent 响应生命周期各节点注入自定义逻辑（收到消息前/后、回复前/后等），配置于 `gateway.hooks`。

---

## 9. 技能（Skills）与插件（Plugins）

### 技能（Skills）

技能是 AgentSkills 兼容的目录，包含 `SKILL.md` 文件，教 Agent 如何使用特定工具或遵守特定工作流。

**加载优先级**（从高到低）：
1. `<workspace>/skills/`（工作区技能）
2. `~/.openclaw/skills/`（全局托管技能）
3. 内置技能（随安装包发布）
4. `skills.load.extraDirs`（额外目录，最低优先级）

**ClawHub**：公共技能注册中心，位于 [clawhub.ai](https://clawhub.ai)：

```bash
clawhub install <skill-slug>    # 安装技能
clawhub update --all            # 更新全部
clawhub sync --all              # 扫描并发布更新
```

### 插件（Plugins）

插件通过 `openclaw.plugin.json` 描述，支持以下能力：

- **模型提供商插件**：注入模型目录、包装推理请求、管理 auth token 交换
- **渠道插件**：实现消息收发、pairing、webhook 接收
- **工具插件**：向 Agent 暴露新工具
- **记忆插件**（memory slot）：每次只能激活一个，目前内置 `memory-core`（文件）和 `memory-lancedb`（向量）

```bash
openclaw plugins list
openclaw plugins install <plugin-name>
```

**MCP 支持**：通过 `mcporter` 桥接 MCP 服务器，不内置于核心。

---

## 10. 多 Agent 路由

在同一个 Gateway 进程内运行多个完全隔离的 Agent：

```
agents:
  main     → workspace-main / agentDir-main   → WhatsApp #1, Telegram
  work     → workspace-work / agentDir-work   → Slack, Discord
  private  → workspace-private / agentDir-private → Signal
```

每个 Agent 拥有：
- **独立工作区**（文件、AGENTS.md、会话）
- **独立 agentDir**（auth profiles、model registry、per-agent config）
- **独立会话存储**

路由绑定通过 `agents.list[].bindings` 配置，将渠道/账号/对等 ID 映射到指定 Agent。

```bash
# 添加新 Agent
openclaw setup --agent <agentId>
```

---

## 11. 平台伴侣应用

### macOS 菜单栏应用

- **菜单栏控制平面**：显示状态、管理 Gateway 生命周期
- **TCC 权限管理**：通知、辅助功能、录屏、麦克风、语音识别
- **Voice Wake / PTT**：唤醒词触发 Agent
- **Talk Mode 浮窗**：持续语音对话覆盖层
- **Canvas 窗口**：实时可视化工作区（A2UI）
- **WebChat**：内嵌浏览器访问 Gateway
- **Local / Remote 模式**：本机或通过 SSH/Tailscale 连接远端 Gateway

### iOS Node

- Canvas / Voice Wake / Talk Mode
- 摄像头访问、录屏
- Bonjour 设备发现 + 设备配对

### Android Node

- Connect（二维码/手动连接）
- 聊天会话 + 语音 Tab + Canvas
- 设备命令：通知、位置、短信、照片、通讯录、日历、运动传感器、应用更新、通话记录

---

## 12. 安全模型

### 默认安全策略

| 场景 | 默认行为 |
|------|---------|
| 陌生 DM | 配对（pairing）验证，未通过则不处理 |
| 开放 DM | 需显式设置 `dmPolicy: "open"` + `allowFrom: ["*"]` |
| 浏览器 SSRF | 私有网络访问需显式启用 `ssrfPolicy.dangerouslyAllowPrivateNetwork` |
| Shell 执行 | 受 `tools.exec` 策略管控，可配置审批流 |
| Webhook body | 认证前限制 body size + 超时 |
| Subagents | 仅允许控制者会话发送指令给其创建的子 Agent |

### 设备配对与信任

- 所有 WS 客户端（运营方 + 节点）需在 `connect` 帧中提供设备身份
- 新设备 ID 需手动批准；批准后颁发设备 token
- 本地回环地址可配置为自动信任

### 凭据安全

- 凭据存储于 `~/.openclaw/credentials/`
- Gateway 配置快照会自动剥离 URL 中的嵌入凭据
- 沙箱模式（`agents.defaults.sandbox`）对非主会话启用独立工作区隔离

### 安全审计

```bash
openclaw security audit    # 检查 DM 策略、allowlist 等配置风险
openclaw doctor            # 全局健康检查（配置、迁移、服务状态）
```

---

## 13. 运维与部署

### 常用运维命令

```bash
# 启动 Gateway（前台，用于调试）
openclaw gateway --port 18789 --verbose

# 安装系统服务（launchd/systemd）
openclaw gateway install

# 服务状态
openclaw gateway status
openclaw gateway status --deep          # 含探针检测
openclaw gateway status --deep --require-rpc  # RPC 失败也返回非 0

# 配置诊断
openclaw doctor
openclaw doctor --fix    # 自动修复已知迁移问题
```

### 部署平台

| 平台 | 文档 |
|------|------|
| Raspberry Pi | `docs/platforms/raspberry-pi.md` |
| Linux VPS | `docs/platforms/linux.md` |
| Docker | `docker-compose.yml` + `docs/install/docker` |
| DigitalOcean | `docs/platforms/digitalocean.md` |
| Oracle Cloud | `docs/platforms/oracle.md` |
| Fly.io | `fly.toml` |
| Windows (WSL2) | `docs/platforms/windows.md` |

### Remote Gateway

通过 SSH tunnel 或 Tailscale Serve/Funnel 将 Gateway 暴露给远端客户端，配合 token/password 认证。

### Docker

```bash
# 快速启动
docker-compose up -d

# 设置时区
OPENCLAW_TZ=Asia/Shanghai docker-compose up -d
```

---

## 14. 开发者指南

### 技术栈

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript (ESM, strict) |
| 运行时 | Node 22+（生产），Bun（开发/脚本） |
| 包管理 | pnpm（主要），Bun（可选） |
| 构建 | tsdown → `dist/` |
| Lint/Format | Oxlint + Oxfmt |
| 测试 | Vitest，V8 coverage（70% 阈值） |
| CLI 框架 | Commander + @clack/prompts |

### 目录结构

```
src/
  cli/          CLI 入口与 option 配置
  commands/     各子命令实现
  agents/       Agent 运行时逻辑
  gateway/      Gateway WebSocket 服务
  channels/     渠道路由与通用逻辑
  sessions/     会话存储
  providers/    模型提供商适配
  browser/      浏览器控制服务
  canvas-host/  Canvas / A2UI 服务
  media/        媒体管道（图片/音频/视频）
  terminal/     终端输出（表格/主题/进度）
  infra/        基础工具（时间格式化等）

extensions/     渠道插件 + 模型插件（workspace packages）
apps/
  macos/        macOS SwiftUI 应用
  ios/          iOS SwiftUI 应用
  android/      Android 应用
  shared/       跨平台共享代码
docs/           Mintlify 文档源文件
```

### 开发工作流

```bash
pnpm install

# 开发模式（自动重载）
pnpm gateway:watch

# 运行 CLI（TypeScript 直接执行）
pnpm openclaw ...

# 构建
pnpm build

# 类型检查
pnpm tsgo

# Lint + Format 检查
pnpm check

# Format 修复
pnpm format:fix

# 运行测试
pnpm test

# 覆盖率
pnpm test:coverage
```

### 代码规范要点

- 严格 TypeScript，禁止 `any`，禁止 `@ts-nocheck`
- 文件建议保持 700 LOC 以内；超出时抽取 helper
- 不通过 prototype mutation 共享行为，使用显式继承/组合
- 动态 `import()` 和静态 `import` 同一模块不混用
- 终端输出使用 `src/terminal/palette.ts`，不硬编码颜色
- 时间格式化使用 `src/infra/format-time`，不重复造轮子
- 进度条使用 `src/cli/progress.ts`（osc-progress + @clack/prompts）

### 插件开发

扩展以 workspace package 形式存放于 `extensions/<name>/`：

- 运行时依赖放 `dependencies`，不用 `workspace:*`
- 通过 `openclaw.plugin.json` 声明能力（skills、channels、providers 等）
- 运行时通过 jiti 别名解析 `openclaw/plugin-sdk`

### 提交规范

- 使用 `scripts/committer "<msg>" <file...>` 创建提交（范围化暂存）
- 提交信息格式：`<模块>: <动作>` 例如 `CLI: add verbose flag to send`
- 一个 PR 对应一个 issue/话题，不打包无关变更

---

*本文档由 GitHub Copilot 根据代码库自动分析生成，最后更新：2026-03-16。*
