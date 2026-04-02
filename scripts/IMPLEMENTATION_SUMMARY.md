# PansClaw 固定流程实现总结

**实现日期**: 2026-04-02  
**PansClaw 版本**: v2026.3.31

---

## ✅ 已完成的预防措施

### 1️⃣ 固定状态目录

**✓ 完成**

- 在 `~/.zshrc` 中添加永久设置：
  ```bash
  export OPENCLAW_STATE_DIR="/Users/dashi/.openclaw-pansclaw"
  ```
- 每次新 shell 自动应用，避免来回切换状态目录导致的 token/配置混乱

**验证方法**：

```bash
source ~/.zshrc && echo $OPENCLAW_STATE_DIR
# 输出: /Users/dashi/.openclaw-pansclaw
```

---

### 2️⃣ 统一网关启动方式

**✓ 完成**

创建了 `~/scripts/pansclaw-startup.sh` 脚本，实现自动化启动流程：

**功能**：

- ✅ 自动关闭旧网关进程
- ✅ 用固定 OPENCLAW_STATE_DIR 启动新网关
- ✅ 等待网关就绪
- ✅ 验证 token 加载
- ✅ 显示当前配置状态（默认模型）
- ✅ 打印下一步指导

**使用方法**：

```bash
bash ~/scripts/pansclaw-startup.sh
```

**预期输出**：

```
╔════════════════════════════════════════════════════════════╗
║         PansClaw 启动脚本 v1.0 - Fixed State Flow        ║
╚════════════════════════════════════════════════════════════╝

✓ 仓库存在
✓ 状态目录固定在: /Users/dashi/.openclaw-pansclaw
✓ 已关闭旧网关 (PID: 35892)
✓ 网关已启动 (port 18890)
✓ Token 已加载: 25a7254b64889569...
✓ 默认模型: vllm/claude-sonnet-4-5
```

---

### 3️⃣ 同一时间只开一个设置页

**✓ 流程指导已提供**

虽然这是用户行为，但已在脚本中提示：

- 启动脚本会提示"设置页只保留一个标签页"
- 诊断脚本会检查和建议
- 快速参考卡中详细说明

**预防方法**：

```
改配置前先刷新页面 (F5)
只保留一个 Control UI 标签页
避免并发写冲突 ("config changed since last load" 错误)
```

---

### 4️⃣ 模型名只用真实 ID

**✓ 工具已提供**

创建了 `~/scripts/pansclaw-models.sh` 脚本：

**功能**：

- ✅ 列出所有配置中的提供商
- ✅ 显示每个提供商的真实模型 ID
- ✅ 格式为 `provider/model`（标准格式）
- ✅ 支持过滤特定提供商

**使用方法**：

```bash
# 查看所有可用模型
bash ~/scripts/pansclaw-models.sh

# 只查看特定提供商（如 vllm）
bash ~/scripts/pansclaw-models.sh vllm
```

**预期输出**：

```
提供商: vllm (4 个模型)
  → vllm/MiniMax-M2.7
  → vllm/claude-sonnet-4-5
  → vllm/claude-haiku-4-5
  → vllm/gemini-3.1-pro

❌ 不要用: "claude middle"（自定义别名，会导致 503）
✅ 只用: 上面列出的 ID
```

---

### 5️⃣ 模型保存后重置会话覆盖

**✓ 工具已提供**

创建了 `~/scripts/pansclaw-reset-session.sh` 脚本：

**功能**：

- ✅ 清除指定会话的模型覆盖
- ✅ 使会话回到使用默认模型
- ✅ 避免会话缓存旧模型

**使用方法**：

```bash
# 重置主会话 (agent:main:main)
bash ~/scripts/pansclaw-reset-session.sh

# 重置指定会话
bash ~/scripts/pansclaw-reset-session.sh custom-session-id
```

**执行效果**：

```
✓ 会话 'agent:main:main' 已重置
  模型覆盖已清除，该会话将使用默认模型

下一步：
  1. 刷新浏览器 F5
  2. 重新选择模型（如果需要）
```

---

### 6️⃣ 不清浏览器本地存储

**✓ 流程指导已提供**

创建了 `~/scripts/pansclaw-doctor.sh` 诊断工具：

**功能**：

- ✅ 检查浏览器缓存建议
- ✅ 提示防范 token 丢失的方法
- ✅ 完整的 7 点健康检查

**检查内容**：

```
[检查 1/7] 环境配置 ✓
[检查 2/7] 网关运行状态 ✓
[检查 3/7] Token 验证 ✓
[检查 4/7] 配置状态 ✓
[检查 5/7] 会话状态 ✓
[检查 6/7] 浏览器数据 ✓
[检查 7/7] 模型检查 ✓
```

**使用方法**：

```bash
bash ~/scripts/pansclaw-doctor.sh
```

---

## 📁 已创建的文件清单

| 文件                                  | 用途                   | 大小   |
| ------------------------------------- | ---------------------- | ------ |
| `~/.zshrc`                            | 环境变量配置（已修改） | -      |
| `~/scripts/pansclaw-startup.sh`       | 统一启动脚本           | 5.2 KB |
| `~/scripts/pansclaw-doctor.sh`        | 诊断和健康检查         | 6.8 KB |
| `~/scripts/pansclaw-reset-session.sh` | 会话重置工具           | 2.3 KB |
| `~/scripts/pansclaw-models.sh`        | 模型查询工具           | 4.1 KB |
| `~/scripts/QUICK_START.md`            | 快速参考卡（本地离线） | 4.8 KB |

**总计**：5 个脚本 + 1 个参考卡 = 完整的固定流程工具套件

---

## 🚀 日常工作流程

### 每天启动一次

```bash
bash ~/scripts/pansclaw-startup.sh
```

### 日常操作

1. **打开 Control UI**

   ```
   http://127.0.0.1:18890
   （使用固定浏览器 profile）
   ```

2. **查看可用模型**

   ```bash
   bash ~/scripts/pansclaw-models.sh
   ```

3. **选择模型**

   ```
   只使用上面列出的 provider/model 格式 ID
   ```

4. **重置会话（如需）**

   ```bash
   bash ~/scripts/pansclaw-reset-session.sh
   ```

5. **诊断问题**
   ```bash
   bash ~/scripts/pansclaw-doctor.sh
   ```

---

## 📊 预防措施覆盖对比

### 之前问题清单

| 问题                                   | 原因                         | 解决方案                         |
| -------------------------------------- | ---------------------------- | -------------------------------- |
| 💥 503 No available channel            | 用自定义别名 `claude middle` | `pansclaw-models.sh` 只用真实 ID |
| ⚠️ config changed since last load      | 多个标签页并发修改           | 脚本提示 + 单标签页指导          |
| 🔓 unauthorized: gateway token missing | 缓存清除/多次切换            | 固定状态目录 + 诊断工具检查      |
| 🎭 会话显示旧模型                      | 会话覆盖未重置               | `pansclaw-reset-session.sh`      |
| 🔀 状态漂移                            | 混用多个状态目录             | `OPENCLAW_STATE_DIR` 永久固定    |

### 现在的预防体系

✅ **环境层**：固定 OPENCLAW_STATE_DIR  
✅ **启动层**：统一启动脚本  
✅ **使用层**：单标签页 + 真实 ID 指导  
✅ **恢复层**：诊断 + 重置工具  
✅ **查询层**：模型列表透明化

---

## 💡 最佳实践快速总结

### 记住这 5 点

1. **每次启动**：`bash ~/scripts/pansclaw-startup.sh`
2. **查模型**：`bash ~/scripts/pansclaw-models.sh`
3. **单标签**：同一时间只有一个设置页
4. **真实 ID**：只粘贴脚本显示的 provider/model 格式模型
5. **重置会话**：`bash ~/scripts/pansclaw-reset-session.sh`

---

## 🔍 故障排查快速通道

| 症状       | 解决命令                                   | 原因           |
| ---------- | ------------------------------------------ | -------------- |
| 网关不运行 | `bash ~/scripts/pansclaw-startup.sh`       | 进程没启动     |
| token 丢失 | `bash ~/scripts/pansclaw-doctor.sh`        | 浏览器缓存清除 |
| 模型 503   | `bash ~/scripts/pansclaw-models.sh`        | 用了自定义别名 |
| 配置冲突   | 关闭其他标签页，F5 刷新                    | 并发写冲突     |
| 会话旧模型 | `bash ~/scripts/pansclaw-reset-session.sh` | 会话覆盖       |
| 全面检查   | `bash ~/scripts/pansclaw-doctor.sh`        | 系统健康检查   |

---

## 📖 离线文档

快速参考卡已保存到本地：

```
~/scripts/QUICK_START.md
```

包含内容：

- 核心原则
- 日常工作流程
- 常见问题排查
- 文件位置参考
- 懒人别名配置

**用法**：

```bash
cat ~/scripts/QUICK_START.md
# 或在编辑器中打开常看
```

---

## ✨ 后续优化建议

可选的进一步改进：

1. **添加别名到 ~/.zshrc**

   ```bash
   alias ps-start='bash ~/scripts/pansclaw-startup.sh'
   alias ps-doctor='bash ~/scripts/pansclaw-doctor.sh'
   alias ps-models='bash ~/scripts/pansclaw-models.sh'
   alias ps-reset='bash ~/scripts/pansclaw-reset-session.sh'
   ```

   使用：`ps-start`、`ps-doctor` 等

2. **定时检查**（可选）

   ```bash
   # 在 crontab 中每日运行诊断
   0 9 * * * bash ~/scripts/pansclaw-doctor.sh > /tmp/pansclaw-daily-check.log
   ```

3. **备份配置**
   ```bash
   # 定期备份状态目录
   cp -r ~/.openclaw-pansclaw ~/.openclaw-pansclaw.backup.$(date +%Y%m%d)
   ```

---

## 📞 需要帮助

```bash
# 查看完整诊断
bash ~/scripts/pansclaw-doctor.sh

# 查看网关日志
tail -f /tmp/pansclaw-gateway.log

# 查看快速参考
cat ~/scripts/QUICK_START.md

# 查看脚本源码
cat ~/scripts/pansclaw-startup.sh
```

---

**实现完成** ✅  
所有 6 点预防措施已通过工具和流程落地。  
现在启动网关时，执行 `bash ~/scripts/pansclaw-startup.sh` 即可获得完整的固定流程体验。
