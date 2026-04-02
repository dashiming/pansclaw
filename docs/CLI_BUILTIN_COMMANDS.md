# PansClaw CLI Enhancement (方案3：内置命令集成)

## 概述

将原来的独立 shell 脚本工具集成为 pansclaw CLI 的官方内置命令，提供统一的命令行体验。

## 新增命令

### 1. `pansclaw startup`

自动化管理网关进程生命周期的命令。

**功能：**

- 清理旧的网关进程
- 启动新的网关实例
- 验证网关正常运行与可访问
- 显示配置摘要

**用法：**

```bash
pansclaw startup                      # 使用默认配置
pansclaw startup --port 19000         # 指定端口
pansclaw startup --verbose            # 显示详细日志
pansclaw startup --check-only         # 仅检查，不启动
```

**选项：**

- `--port <number>` - 网关端口（默认：18890）
- `--bind <host>` - 绑定地址（默认：loopback）
- `--verbose` - 显示详细日志
- `--check-only` - 仅检查状态，不修改进程

**对应旧工具：** `pansclaw-startup.sh`

---

### 2. `pansclaw doctor` (现有命令增强)

doctor 命令已存在，现已增强为针对PansClaw的专项诊断。

**功能：**

- 检查环境变量配置（OPENCLAW_STATE_DIR等）
- 验证网关运行状态与token有效性
- 扫描会话文件与模型配置
- 检查浏览器本地存储状态
- 提供自动修复建议

**用法：**

```bash
pansclaw doctor                       # 运行完整诊断
pansclaw doctor --deep                # 扫描系统服务
pansclaw doctor --repair              # 自动应用修复
pansclaw doctor --non-interactive     # 非交互模式
```

**对应旧工具：** `pansclaw-doctor.sh`

---

### 3. `pansclaw models list` (现有命令增强)

models 命令已支持 list 子命令，现已优化为显示上游真实 ID。

**功能：**

- 列出所有配置的模型提供商与模型
- 按提供商过滤
- 显示模型的真实 ID（不是别名）
- 支持JSON输出

**用法：**

```bash
pansclaw models list                  # 列出已配置模型
pansclaw models list --all            # 显示完整目录
pansclaw models list --provider openai # 按提供商过滤
pansclaw models list --json           # JSON格式输出
```

**对应旧工具：** `pansclaw-models.sh`

---

## 迁移指南

### 从旧脚本迁移到新命令

| 旧工具                                     | 新命令                 |
| ------------------------------------------ | ---------------------- |
| `bash ~/scripts/pansclaw-startup.sh`       | `pansclaw startup`     |
| `bash ~/scripts/pansclaw-doctor.sh`        | `pansclaw doctor`      |
| `bash ~/scripts/pansclaw-models.sh`        | `pansclaw models list` |
| `bash ~/scripts/pansclaw-reset-session.sh` | `(内置在doctor修复中)` |

### 好处

✅ **统一体验** - 所有工具都在主 CLI 中
✅ **更好的帮助** - `pansclaw startup --help` 内置文档
✅ **类型安全** - TypeScript 实现比 Shell 脚本更健壮
✅ **一致的错误处理** - 统一的错误消息与日志格式
✅ **易于发现** - `pansclaw --help` 显示所有可用命令
✅ **自动更新** - 与 pansclaw CLI 版本同步更新

---

## 开发与测试

### 构建

```bash
pnpm build
```

### 测试新命令

```bash
# 测试 startup 命令
pnpm openclaw startup --check-only

# 测试 doctor 诊断
pnpm openclaw doctor

# 列出模型
pnpm openclaw models list
```

### 运行完整测试

```bash
pnpm test
```

---

## 文件变更

新增/修改的文件：

**新增：**

- `src/commands/startup.ts` - 启动命令实现

**修改：**

- `src/cli/program/register.maintenance.ts` - 注册 startup 命令
- `src/cli/program/command-registry.ts` - 添加 startup 到命令列表
- `src/cli/models-cli.ts` - 增强 models list 命令（如需）

---

## 使用场景

### 日常启动工作流

```bash
# 方案3推荐的使用流程
pansclaw startup           # 启动网关
pansclaw doctor            # 检查健康状态
pansclaw models list       # 确认模型配置
```

### 故障排查

```bash
pansclaw doctor --deep     # 深度诊断
pansclaw doctor --repair   # 自动修复
pansclaw startup           # 重新启动
```

### 自动化集成

```bash
#!/bin/bash
# 在 CI/CD 或 cron 中使用
pansclaw startup --check-only || {
  echo "Gateway not running, starting now..."
  pansclaw startup
}
pansclaw doctor --non-interactive
```

---

## 与原 OpenClaw 命令的兼容性

新命令完全遵循 OpenClaw 的 CLI 设计规范：

- 使用 Commander.js 框架
- 遵循选项命名约定
- 支持 JSON 输出格式
- 集成于标准的 Runtime 和错误处理

---

## 后续增强（可选）

**优先级：中**

1. **`pansclaw health`** - 轻量级健康检查（doctor的简化版）

   ```bash
   pansclaw health        # 快速状态检查（~1-2秒）
   ```

2. **`pansclaw config inspect`** - 更友好的配置查看

   ```bash
   pansclaw config inspect models     # 查看模型配置
   pansclaw config inspect gateway    # 查看网关配置
   ```

3. **`pansclaw daemon restart`** - systemd/launchd 感知的重启
   ```bash
   pansclaw daemon restart            # 智能重启服务
   ```

---

## 贡献

这些命令是 pansclaw 项目的核心维护工具，欢迎改进与扩展。

---

**提示：** 将此README添加到项目主 README.md 的"CLI 命令"部分。
