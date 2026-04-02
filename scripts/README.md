# PansClaw 固定流程工具包

这个目录包含了完整的 PansClaw 状态稳定流程工具，用于预防常见的状态漂移、并发冲突和 token 丢失问题。

## 📁 文件说明

| 脚本                          | 功能               | 何时使用               |
| ----------------------------- | ------------------ | ---------------------- |
| **pansclaw-startup.sh**       | 统一启动网关       | 每天启动时运行（必须） |
| **pansclaw-doctor.sh**        | 系统诊断和健康检查 | 排查问题或定期检查     |
| **pansclaw-reset-session.sh** | 清除会话模型覆盖   | 会话显示旧模型时       |
| **pansclaw-models.sh**        | 查询可用模型列表   | 选择模型前查看真实 ID  |
| **QUICK_START.md**            | 快速参考卡         | 日常使用时参考         |
| **IMPLEMENTATION_SUMMARY.md** | 完整实现文档       | 了解工具设计和原理     |

---

## 🚀 快速开始

### 1. 配置环境（一次性）

在 `~/.zshrc` 中添加：

```bash
export OPENCLAW_STATE_DIR="/Users/dashi/.openclaw-pansclaw"
```

然后重新加载配置：

```bash
source ~/.zshrc
```

### 2. 使用脚本

所有脚本都可以在仓库中运行：

**启动网关：**

```bash
bash scripts/pansclaw-startup.sh
# 或从仓库根目录相对路径
bash ./scripts/pansclaw-startup.sh
```

**查看模型：**

```bash
bash scripts/pansclaw-models.sh
```

**诊断系统：**

```bash
bash scripts/pansclaw-doctor.sh
```

**重置会话：**

```bash
bash scripts/pansclaw-reset-session.sh
```

---

## 📖 工具使用流程

### 日常启动

```bash
# 第一步：启动网关
bash scripts/pansclaw-startup.sh

# 输出应该显示：
# ✓ 网关已启动 (port 18890)
# ✓ Token 已加载
# ✓ 默认模型: vllm/claude-sonnet-4-5
```

### 选择模型

```bash
# 查看所有可用的真实模型 ID
bash scripts/pansclaw-models.sh

# 输出例:
# 提供商: vllm (4 个模型)
#   → vllm/claude-sonnet-4-5
#   → vllm/MiniMax-M2.7
#   ...

# ✅ 只用这些 ID，不用自定义别名
```

### 遇到问题

```bash
# 诊断系统状态
bash scripts/pansclaw-doctor.sh

# 检查 7 点：环境、网关、token、配置、会话、浏览器、模型
```

### 会话有旧模型

```bash
# 重置会话，清除旧缓存
bash scripts/pansclaw-reset-session.sh

# 然后刷新浏览器 F5
```

---

## 🔍 故障排查

| 症状          | 命令                                     | 说明                        |
| ------------- | ---------------------------------------- | --------------------------- |
| 网关不运行    | `bash scripts/pansclaw-startup.sh`       | 自动关闭旧进程并启动新的    |
| Token 丢失    | `bash scripts/pansclaw-doctor.sh`        | 检查浏览器和文件系统的状态  |
| 模型 503 错误 | `bash scripts/pansclaw-models.sh`        | 查看真实 ID，不用自定义别名 |
| 配置冲突      | 关闭其他标签页，F5 刷新                  | 避免并发写冲突              |
| 会话旧模型    | `bash scripts/pansclaw-reset-session.sh` | 清除会话覆盖                |
| 全面检查      | `bash scripts/pansclaw-doctor.sh`        | 完整的系统健康检查          |

---

## 📝 预防措施清单

✅ **固定状态目录** - 在 ~/.zshrc 中设置 OPENCLAW_STATE_DIR  
✅ **统一启动方式** - 用 pansclaw-startup.sh 启动  
✅ **单标签页操作** - 改配置时只保留一个 Control UI 标签  
✅ **真实模型 ID** - 用 pansclaw-models.sh 查看后才选择  
✅ **会话重置** - 默认模型改后执行 pansclaw-reset-session.sh  
✅ **浏览器隔离** - 用固定 profile，不清这个站点的缓存

---

## 🛠️ 快速参考

### 常用命令别名（可选）

在 ~/.zshrc 中添加以加快使用：

```bash
# PansClaw 快捷命令
alias ps-start='bash ~/scripts/pansclaw-startup.sh'
alias ps-doctor='bash ~/scripts/pansclaw-doctor.sh'
alias ps-models='bash ~/scripts/pansclaw-models.sh'
alias ps-reset='bash ~/scripts/pansclaw-reset-session.sh'
```

然后使用：

```bash
ps-start   # 启动
ps-doctor  # 诊断
ps-models  # 查模型
ps-reset   # 重置会话
```

### 查看完整文档

```bash
# 快速参考卡（日常查看）
cat scripts/QUICK_START.md

# 完整实现文档（了解原理）
cat scripts/IMPLEMENTATION_SUMMARY.md
```

### 查看日志

```bash
# 网关日志（实时）
tail -f /tmp/pansclaw-gateway.log

# 最后 50 行
tail -n 50 /tmp/pansclaw-gateway.log
```

---

## 🎯 核心原则

这套工具的设计目标是**预防状态漂移**，通过以下方式实现：

1. **环境隔离** - 固定状态目录，不混用多个配置源
2. **流程标准化** - 统一启动脚本，避免混用全局/本地入口
3. **冲突预防** - 诊断工具检查并发问题
4. **操作规范** - 指导用户只用真实模型 ID、单标签页操作
5. **快速恢复** - 提供会话重置和诊断工具

---

## 📱 使用场景

### 场景 1：日常开发

```bash
# 早上启动
bash scripts/pansclaw-startup.sh

# 工作中遇到问题
bash scripts/pansclaw-doctor.sh

# 想换模型
bash scripts/pansclaw-models.sh
# 选择合适的 ID，填入 UI
```

### 场景 2：会话出问题

```bash
# 会话显示旧模型
bash scripts/pansclaw-reset-session.sh
# 或开新会话
```

### 场景 3：排查故障

```bash
# 完整诊断
bash scripts/pansclaw-doctor.sh

# 根据输出的建议处理
# 例如：检查浏览器缓存、重启网关等
```

---

## ❓ FAQ

**Q: 为什么要用 pansclaw-startup.sh 而不是直接启动?**  
A: 脚本自动处理：旧进程清理→新网关启动→token 验证→配置检查，避免混乱。

**Q: 模型选择前必须运行 pansclaw-models.sh 吗?**  
A: 强烈建议。这样能看到所有真实 ID，避免用自定义别名导致的 503 错误。

**Q: 什么时候需要 pansclaw-reset-session.sh?**  
A: 当改了默认模型但会话还显示旧模型时。或者当出现"模型选择不生效"的情况时。

**Q: pansclaw-doctor.sh 多久运行一次?**  
A: 可以每天检查一次，或遇到问题时运行。它会检查 7 个关键项，快速定位问题。

**Q: 可以在仓库之外的地方启动脚本吗?**  
A: 可以，但需要提供完整路径。例如：`bash /Users/dashi/Documents/pansclaw/scripts/pansclaw-startup.sh`

---

## 📞 需要帮助

```bash
# 查看这个文件
cat scripts/README.md

# 查看快速参考
cat scripts/QUICK_START.md

# 诊断系统
bash scripts/pansclaw-doctor.sh

# 查看网关日志
tail -f /tmp/pansclaw-gateway.log
```

---

**最后更新**: 2026-04-02  
**PansClaw 版本**: v2026.3.31  
**工具包版本**: 1.0
