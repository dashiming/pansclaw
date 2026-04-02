# Startup Core Guard Skill

技能名称：`startup-core-guard`

用于快速检查、运行并在升级 OpenClaw 核心后验证 `startup` 内置命令是否仍可用。

## 触发条件

当用户提出以下需求时触发：

- "检查 startup 是否内置"
- "运行 startup --check-only"
- "升级后确认功能没丢"
- "本地仓和远端对比 startup 功能"

## 目标

1. 确认命令是否存在：`pnpm openclaw startup --help`
2. 确认命令是否可执行：`pnpm openclaw startup --check-only`
3. 升级核心后做防回归验证
4. 输出清晰结论：可用/不可用、原因、下一步动作

## 一键执行

优先使用可执行脚本：

```bash
pnpm startup:check
```

脚本位置：`scripts/pansclaw-startup-check.sh`

## 标准流程

### 1. 基础可用性检查

```bash
pnpm openclaw startup --help
pnpm openclaw startup --check-only
```

若遇到状态目录版本门禁（例如配置由更高版本写入），使用临时状态目录重试：

```bash
export OPENCLAW_STATE_DIR=/tmp/openclaw-help-check
pnpm openclaw startup --help
pnpm openclaw startup --check-only
```

### 2. 确认命令是否已注册（源码侧）

应存在以下三个位置：

- `src/commands/startup.ts`
- `src/cli/program/register.maintenance.ts`
- `src/cli/program/command-registry.ts`

### 3. 升级核心后的防回归检查

升级/同步核心后，必须重新执行：

```bash
pnpm openclaw startup --help
pnpm openclaw startup --check-only
```

并检查分支差异，确认本地功能提交仍在：

```bash
git log --oneline origin/main..main
git diff --name-only origin/main..main
```

## 结论模板

- 命令可用：`startup` 已内置并可执行。
- 命令不可用：说明是“未注册/状态目录门禁/全局命令不存在”中的哪一类。
- 补救动作：
  1. 使用 `pnpm openclaw ...` 代替全局命令
  2. 必要时设置临时 `OPENCLAW_STATE_DIR`
  3. 升级后按上述两条命令做回归验证

## 注意事项

- 当前环境下可能没有全局 `openclaw`，这是正常情况，优先使用 `pnpm openclaw`。
- 不要用覆盖式 Git 操作（如硬重置）处理升级，否则可能丢本地功能提交。
- 该技能只做“检查与验证流程固化”，不自动重写业务代码。
