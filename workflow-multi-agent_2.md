---
type: sop
category: workflow
status: active
created: 2026-05-14
updated: 2026-05-14
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置多 AI 客户端的 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，建立标准目录结构、Obsidian 配置、skills 链接与 SOP 自动触发逻辑，从而实现资料沉淀、SOP 生成与跨 AI 客户端复用。

## 2. 适用场景
- 需要在 Windows 上搭建可共享的 AI 知识库
- 需要把原始资料整理成结构化 wiki
- 需要自动或半自动将 sources 转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具间复用同一套能力

## 3. 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已规划 Vault 路径
- 已安装至少一个 AI 客户端
- 拥有在用户目录下创建 Junction 的权限

## 4. 标准步骤

### 步骤 1：克隆项目并确认 Vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，整理为统一 Vault 根目录，并设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地存在统一的 claude-obsidian Vault 根目录。

### 步骤 2：创建标准目录结构
执行：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** 所有标准目录已创建完成。

### 步骤 3：写入基础 Obsidian 配置
配置以下文件：
- `.obsidian/graph.json`：知识图谱颜色分组，`sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置，按当前规则合并。

**预期结果：** Obsidian 能正确识别 Vault，并具备基础图谱与显示规则。

### 步骤 4：为多 AI 客户端创建 skills 链接
常见 skills 目标路径：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按需为各客户端创建链接。

**预期结果：** 多个 AI 客户端可共享同一套 skills。

### 步骤 5：创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

要求扫描 `status: sop-ready` 的 sources，支持指定主题生成 SOP，并检查步骤可执行性、检查清单与回链完整性。

**预期结果：** AI 客户端可识别 SOP 相关能力。

### 步骤 6：配置 hooks 自动检查逻辑
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 可进一步结合 PostToolUse 做自动提交或收尾动作。

**预期结果：** 会话启动时可自动发现待生成或待更新 SOP。

### 步骤 7：建立 Source 状态流转与标记规则
标准状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** sources 状态一致，可支持自动 SOP 检查。

### 步骤 8：按客户端差异执行验证
验证方式：
1. 在 `wiki/sources/` 中创建至少 3 条同主题 `sop-ready` 笔记
2. 启动客户端
3. 检查是否自动提示或可手动触发 SOP 生成
4. 修改 source 后验证是否提示 SOP 更新

客户端差异：
- Claude Code：支持自动 hooks 检查
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：通常仅支持 skills，需手动触发

**预期结果：** 已确认各客户端可用方式。

### 步骤 9：运行日常使用流程
标准日常流程：
1. 使用 `ingest` 导入资料
2. 整理到 `wiki/sources/`、`wiki/concepts/`、`wiki/entities/`
3. 标记可复用流程为 `status: sop-ready`
4. 触发自动或手动 SOP 检查
5. 将 SOP 保存到 `wiki/sop/`
6. 定期执行 `lint the wiki`
7. 使用 `query:` 做知识检索

**预期结果：** 知识库与 SOP 形成持续更新闭环。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian
- [ ] 已创建标准目录结构
- [ ] 已完成基础 Obsidian 配置
- [ ] 已创建至少一个客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已建立 source 状态字段规范
- [ ] 已完成至少一次 SOP 生成验证
- [ ] 已验证客户端支持差异
- [ ] 已建立日常维护流程

## 6. 常见问题

**Q1：为什么没有自动生成 SOP？**  
A：先确认客户端是否支持 hooks；若不支持，需要手动触发。再检查 source 是否具备 `status: sop-ready`，以及是否满足同主题数量或高优先级条件。

**Q2：为什么要用 Junction？**  
A：因为 Junction 可让多个客户端共享同一套 skills，避免重复维护。

**Q3：哪些 source 应标记为 `sop-ready`？**  
A：包含明确步骤、可重复执行、具备实践价值的资料都应标记为 `sop-ready`。

**Q4：什么时候更新 SOP？**  
A：当 source 比 SOP 更新，或新增了同主题高价值资料时，应更新。

**Q5：不支持 hooks 的客户端还能用吗？**  
A：可以，仍可通过 skills 手动触发 SOP 生成与整理。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]