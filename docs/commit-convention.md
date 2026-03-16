# Git Commit 提交规范（PansClaw）

> 目标：让提交信息清晰、可检索、可自动生成变更日志。

## 1) 基本格式

```text
type(scope): subject
```

- `type`：变更类型（必填）
- `scope`：影响范围（建议填）
- `subject`：一句话描述（必填，英文小写开头，使用祈使句）

示例：

```text
feat(memory): add knowledge-graph timeline and causal query tools
```

---

## 2) 常用 type

- `feat`：新增功能
- `fix`：修复缺陷
- `docs`：文档变更
- `refactor`：重构（不改功能）
- `perf`：性能优化
- `test`：测试相关
- `build`：构建系统/依赖
- `ci`：CI/CD 配置
- `chore`：杂项维护
- `revert`：回滚提交

---

## 3) scope 建议

按模块写，方便后续检索：

- `memory`
- `dashboard`
- `chrome-extension`
- `gateway`
- `ui`
- `docs`
- `release`

示例：

```text
fix(chrome-extension): show full footer logo without cropping
docs(readme): simplify sections and update install commands
release(v0.2.0): prepare memory brain 2.0 release notes
```

---

## 4) subject 写法建议

- 用动词开头：`add` / `fix` / `update` / `remove` / `rename`
- 不要写句号
- 不要过长（建议 ≤ 72 字符）
- 只描述“做了什么”，不写大段背景

推荐：

```text
feat(memory): add timeline query support
```

不推荐：

```text
feat: I changed lots of things in memory and dashboard and maybe fixed some issues.
```

---

## 5) 带正文的提交（可选）

当变更较大时，补充正文说明“为什么改、影响什么”。

```bash
git commit -m "feat(memory): add memory_timeline tool" \
  -m "Builds timeline events from MEMORY.md and memory/*.md." \
  -m "Adds subject/entity/date filters and returns newest-first results."
```

---

## 6) Breaking Change 写法（可选）

有不兼容变更时，用 `!` 或正文 `BREAKING CHANGE:`。

```text
feat(api)!: rename memory endpoint
```

或

```text
BREAKING CHANGE: memory_search response schema changed
```

---

## 7) 你当前项目可直接用的模板

### 新功能

```bash
git commit -m "feat(memory): add knowledge-graph timeline and causal query tools"
```

### 修复

```bash
git commit -m "fix(chrome-extension): show full footer logo without cropping"
```

### 文档

```bash
git commit -m "docs(readme): add Pan'sPower compute support section"
```

### 发布

```bash
git commit -m "chore(release): prepare PansClaw v0.2.0"
```
