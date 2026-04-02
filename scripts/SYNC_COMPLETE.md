# 📦 PansClaw 固定流程工具 - 仓库同步完成

## ✅ 同步状态

所有工具已成功同步到本地仓库 `/Users/dashi/Documents/pansclaw/scripts/`

```
仓库位置: /Users/dashi/Documents/pansclaw/scripts/
├─ pansclaw-startup.sh              (5.2 KB) ✓
├─ pansclaw-doctor.sh               (6.8 KB) ✓
├─ pansclaw-reset-session.sh        (2.3 KB) ✓
├─ pansclaw-models.sh               (4.1 KB) ✓
├─ README.md                        (6.5 KB) ✓ 工具包说明
├─ QUICK_START.md                   (4.8 KB) ✓ 快速参考
└─ IMPLEMENTATION_SUMMARY.md        (9.0 KB) ✓ 完整文档
```

**已提交到 git**: ✓ 7 个文件，1416 行代码

---

## 🚀 使用方式

### 方式 1：从仓库运行（推荐）

在仓库目录中：

```bash
cd /Users/dashi/Documents/pansclaw

# 启动网关
bash scripts/pansclaw-startup.sh

# 查询模型
bash scripts/pansclaw-models.sh

# 诊断系统
bash scripts/pansclaw-doctor.sh

# 重置会话
bash scripts/pansclaw-reset-session.sh
```

### 方式 2：使用快捷路径（已设置）

还可以继续用 `~/scripts/` 的快捷方式：

```bash
bash ~/scripts/pansclaw-startup.sh
```

两个位置的文件现在同步，都可以用。

---

## 📖 文件说明

### 执行脚本（4 个）

| 脚本                        | 大小 | 功能                |
| --------------------------- | ---- | ------------------- |
| `pansclaw-startup.sh`       | 5.2K | 启动网关 + 验证配置 |
| `pansclaw-doctor.sh`        | 6.8K | 7 点系统诊断        |
| `pansclaw-models.sh`        | 4.1K | 列出真实模型 ID     |
| `pansclaw-reset-session.sh` | 2.3K | 清除会话模型缓存    |

### 文档（3 个）

| 文档                        | 大小 | 说明                   |
| --------------------------- | ---- | ---------------------- |
| `README.md`                 | 6.5K | 工具包使用说明         |
| `QUICK_START.md`            | 4.8K | 快速参考卡，日常查看   |
| `IMPLEMENTATION_SUMMARY.md` | 9.0K | 完整实现文档，了解原理 |

---

## 📋 日常使用流程

### 开发前（早上）

```bash
cd /Users/dashi/Documents/pansclaw
bash scripts/pansclaw-startup.sh
```

**输出：**

```
✓ 网关已启动 (port 18890)
✓ Token 已加载: 25a7254b64889...
✓ 默认模型: vllm/claude-sonnet-4-5
```

### 选择模型时

```bash
bash scripts/pansclaw-models.sh
```

**只用列出的 ID（provider/model 格式），不用自定义别名**

### 遇到问题时

```bash
bash scripts/pansclaw-doctor.sh
```

**检查：环境、网关、token、配置、会话、浏览器、模型**

### 会话有旧模型时

```bash
bash scripts/pansclaw-reset-session.sh
```

**然后 F5 刷新浏览器**

---

## 🔧 配置检查

### 环境变量已设置

在 `~/.zshrc` 中：

```bash
export OPENCLAW_STATE_DIR="/Users/dashi/.openclaw-pansclaw"
```

验证：

```bash
source ~/.zshrc && echo $OPENCLAW_STATE_DIR
# 输出: /Users/dashi/.openclaw-pansclaw
```

### 脚本都可以执行

```bash
ls -l /Users/dashi/Documents/pansclaw/scripts/pansclaw-*.sh
# 所有 .sh 文件都有 rwx 权限
```

---

## 💡 可选：添加仓库别名

这样可以从仓库目录快速运行：

在 `~/.zshrc` 中添加：

```bash
# PansClaw 仓库快捷命令
alias ps-repo='cd /Users/dashi/Documents/pansclaw'
alias ps-start='bash /Users/dashi/Documents/pansclaw/scripts/pansclaw-startup.sh'
alias ps-doctor='bash /Users/dashi/Documents/pansclaw/scripts/pansclaw-doctor.sh'
alias ps-models='bash /Users/dashi/Documents/pansclaw/scripts/pansclaw-models.sh'
alias ps-reset='bash /Users/dashi/Documents/pansclaw/scripts/pansclaw-reset-session.sh'
```

然后：

```bash
source ~/.zshrc
ps-start   # 启动
ps-doctor  # 诊断
ps-models  # 查模型
ps-reset   # 重置
```

---

## 📍 路径对比

| 用途     | 路径                                                  |
| -------- | ----------------------------------------------------- |
| 快速进入 | `~/scripts/` (符号链接/复制)                          |
| 版本控制 | `/Users/dashi/Documents/pansclaw/scripts/` (仓库主体) |
| 环境变量 | `~/.zshrc` (全局配置)                                 |

两个位置都可以用，仓库中的是主副本。

---

## ✨ 现在可以

✅ 在仓库中版本控制脚本  
✅ 与其他开发者共享工具  
✅ CI/CD 中集成这些脚本  
✅ 复刻仓库时自动获得工具  
✅ 追踪工具的更新历史

---

## 🎯 快速命令速查

```bash
# 启动
bash scripts/pansclaw-startup.sh
bash ~/scripts/pansclaw-startup.sh    # 也可以用这个

# 诊断
bash scripts/pansclaw-doctor.sh

# 查模型
bash scripts/pansclaw-models.sh

# 重置会话
bash scripts/pansclaw-reset-session.sh

# 查看文档
cat scripts/README.md
cat scripts/QUICK_START.md
cat scripts/IMPLEMENTATION_SUMMARY.md
```

---

## 📞 查看帮助

```bash
# 工具包概览
cat scripts/README.md

# 快速参考
cat scripts/QUICK_START.md

# 完整实现说明
cat scripts/IMPLEMENTATION_SUMMARY.md

# 系统诊断
bash scripts/pansclaw-doctor.sh
```

---

## 🔄 下一步

现在你可以：

1. **在仓库中使用**：`bash scripts/pansclaw-startup.sh`
2. **在其他地方用**：`bash ~/scripts/pansclaw-startup.sh`（仍然可用）
3. **提交更改**：`git add scripts/` 后，任何脚本更新都会被版本控制
4. **分享团队**：其他人 clone 仓库后，直接在 scripts/ 中获得工具
5. **CI/CD 集成**：在构建流程中调用这些脚本

---

**同步完成时间**: 2026-04-02  
**同步文件数**: 7 个  
**总代码行数**: 1416 行  
**Git 提交**: ✓ 已保存到版本控制
