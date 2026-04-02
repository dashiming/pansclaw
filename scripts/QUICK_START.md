# PansClaw 固定流程 - 快速参考卡

## 🎯 核心原则：避免状态漂移

为了防止模型 503 错误、并发配置冲突和 token 丢失，建立一套固定流程：

### ✅ 已配置的内容

1. **Shell 环境** (~/.zshrc)
   - `OPENCLAW_STATE_DIR=/Users/dashi/.openclaw-pansclaw` 已固定
   - 每次新 shell 自动应用

2. **启动工具** (~/scripts/)
   - `pansclaw-startup.sh` - 固定启动脚本
   - `pansclaw-doctor.sh` - 诊断和健康检查
   - `pansclaw-reset-session.sh` - 会话重置
   - `pansclaw-models.sh` - 模型查询

---

## 📋 日常工作流程

### 第一步：启动网关（每天一次）

```bash
bash ~/scripts/pansclaw-startup.sh
```

这个脚本会：

- 关闭旧网关进程
- 用固定的 OPENCLAW_STATE_DIR 启动新网关
- 验证网关运行和 token 加载
- 显示当前配置状态

**输出示例：**

```
✓ 网关已启动 (port 18890)
✓ Token 已加载: 25a7254b64889...
✓ 默认模型: vllm/claude-sonnet-4-5
```

---

### 第二步：打开 Control UI

1. **用固定浏览器 profile** 访问：

   ```
   http://127.0.0.1:18890
   ```

2. 若提示 "unauthorized: gateway token missing"：
   - 打开 Settings
   - 粘贴 token（脚本会显示）
   - 保存

3. **重点：同一时间只保留一个标签页**
   - 不要并行编辑配置
   - 改配置前先 F5 刷新

---

### 第三步：选择模型

1. **查看可用模型**

   ```bash
   bash ~/scripts/pansclaw-models.sh
   ```

2. **只用真实 ID 格式**
   - ✅ 正确：`vllm/claude-sonnet-4-5`（provider/model）
   - ❌ 错误：`claude middle`（自定义别名会 503）

3. **保存后重置会话**
   ```bash
   bash ~/scripts/pansclaw-reset-session.sh
   ```
   或在 UI 中开新会话，避免会话缓存旧模型

---

### 第四步：诊断和排查

**快速健康检查：**

```bash
bash ~/scripts/pansclaw-doctor.sh
```

输出示例：

```
✓ 网关运行中 (PID: 31234, Port: 18890)
✓ Token 已加载: 25a7254b64889...
✓ 默认模型: vllm/claude-sonnet-4-5
✓ 浏览器: 使用固定 profile，避免清缓存
```

---

## 🔧 常用故障排查

### 症状：模型选择显示 503

**原因：** 使用了自定义别名而非真实 ID

**解决：**

```bash
bash ~/scripts/pansclaw-models.sh vllm
# 查看 vllm 的所有真实模型 ID
# 只使用那些 ID（provider/model 格式）
```

---

### 症状："config changed since last load"

**原因：** 多个标签页并发修改配置

**解决：**

1. 只保留一个设置页标签
2. 刷新页面 (F5) 后再改配置
3. 若还是失败，诊断当前状态：
   ```bash
   bash ~/scripts/pansclaw-doctor.sh
   ```

---

### 症状："unauthorized: gateway token missing"

**原因：** 浏览器缓存被清或跨 profile 访问

**解决：**

1. 启动脚本会显示 token
2. 粘贴到 Settings → 保存
3. 使用固定浏览器 profile，不清这个站点的缓存

---

### 症状：会话显示旧模型

**原因：** 会话覆盖了默认模型，改默认模型后没有重置

**解决：**

```bash
bash ~/scripts/pansclaw-reset-session.sh
# 或改新会话
```

---

## 📁 文件位置参考

```
~/.zshrc
  └─ OPENCLAW_STATE_DIR=/Users/dashi/.openclaw-pansclaw

~/.openclaw-pansclaw/
  ├─ openclaw.json           (主配置，含 token)
  ├─ sessions.json           (会话状态)
  └─ ...

~/scripts/
  ├─ pansclaw-startup.sh     (固定启动)
  ├─ pansclaw-doctor.sh      (诊断)
  ├─ pansclaw-reset-session.sh (会话重置)
  ├─ pansclaw-models.sh      (模型列表)
  └─ QUICK_START.md          (本文件)

~/Documents/pansclaw/
  └─ dist/control-ui/        (UI 资产)
```

---

## 🚀 懒人一键脚本

将以下别名加到 ~/.zshrc 末尾：

```bash
# PansClaw 快捷命令
alias ps-start='bash ~/scripts/pansclaw-startup.sh'
alias ps-doctor='bash ~/scripts/pansclaw-doctor.sh'
alias ps-models='bash ~/scripts/pansclaw-models.sh'
alias ps-reset='bash ~/scripts/pansclaw-reset-session.sh'
```

然后使用：

```bash
source ~/.zshrc
ps-start    # 启动网关
ps-doctor   # 诊断
ps-models   # 查看模型
ps-reset    # 重置会话
```

---

## ✅ 预防清单

每周检查一次：

- [ ] OPENCLAW_STATE_DIR 指向固定位置 (ps-doctor)
- [ ] 网关用固定脚本启动 (ps-start)
- [ ] 模型只用真实 ID (ps-models)
- [ ] 浏览器用固定 profile，不清缓存
- [ ] 设置页只有一个标签
- [ ] 改默认模型后重置会话 (ps-reset)

---

## 📞 获取帮助

```bash
# 查看网关日志
tail -f /tmp/pansclaw-gateway.log

# 查看完整诊断
bash ~/scripts/pansclaw-doctor.sh

# 查看当前配置（需要网关运行）
bash ~/scripts/pansclaw-models.sh

# 重新应用 shell 配置
source ~/.zshrc && echo $OPENCLAW_STATE_DIR
```

---

**更新日期**: 2026-04-02  
**PansClaw 版本**: v2026.3.31  
**固定流程版本**: 1.0
