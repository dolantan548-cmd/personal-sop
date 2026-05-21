---
type: sop
category: workflow
status: active
created: 2026-05-21
updated: 2026-05-21
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中标准化部署 `claude-obsidian` 知识库，并配置 SOP 自动检查、生成与跨 AI 客户端复用机制。目标是实现以下能力：

- AI 自动写笔记
- 知识自动分类整理
- 定期维护与查询
- 基于 sources 自动识别 SOP 候选资料
- 在多个 AI 客户端共享同一套 skills 与 SOP 工作流

---

## 2. 适用场景

- 首次在 Windows 环境部署 `claude-obsidian`
- 需要把 AI 对话、操作经验、流程资料沉淀到知识库
- 希望通过 `status: sop-ready` 自动发现 SOP 候选主题
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 之间共享知识库能力
- 需要建立 source 到 SOP 的标准状态流转

---

## 3. 前提条件

- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定本地工作目录，例如：`D:\dolan_env\temp\project\personal`
- 已获取仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 具备创建本地目录 Junction 的权限

---

## 4. 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在多余嵌套目录，整理为统一的 vault 根目录。

**预期结果：** 本地存在 `D:\dolan_env\temp\project\personal\claude-obsidian` 目录。

---

### 步骤 2：初始化 Vault 目录结构

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

**预期结果：** Vault 具备标准目录结构，可承载原始资料、知识分类与 SOP 文档。

---

### 步骤 3：配置 Obsidian 基础文件

创建或更新以下配置文件：

- `.obsidian/graph.json`：知识图谱分组与颜色，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可正常识别图谱、过滤工作文件并启用样式片段。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

使用 `New-Item -ItemType Junction` 将同一份能力目录映射到不同客户端。

建议目标路径：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 多个 AI 客户端可共享同一份 skills 和知识库目录。

---

### 步骤 5：创建 SOP Skill 定义

创建文件：`skills/wiki-sop/SKILL.md`

Skill 至少应定义：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查：验证步骤、检查清单、回链

**预期结果：** AI 客户端具备一致的 SOP 检查与生成规范。

---

### 步骤 6：配置 hooks 自动检查逻辑

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

说明：

- Claude Code 支持 hooks，可自动触发
- 其他客户端通常只能手动触发 skills

**预期结果：** 支持 hooks 的客户端启动会话时可自动识别 SOP 候选资料。

---

### 步骤 7：建立 source 状态流转机制

统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

状态规则：

- 纯参考资料：`status: processed`
- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 已完成 SOP 合成：`synthesized`

**预期结果：** Source 的 SOP 候选状态清晰，便于自动扫描与后续合成。

---

### 步骤 8：验证各 AI 客户端能力

按客户端逐一验证：

- Claude Code：检查 `SessionStart` 自动扫描是否生效
- Kimi Code：手动输入“整理SOP”测试
- Codex CLI：手动触发 SOP 生成测试
- Gemini CLI：手动触发 skills 测试
- Cursor / Windsurf：验证 skills 路径能否访问并执行手动流程

建议准备一份测试 source，设为 `status: sop-ready`。

**预期结果：** 明确各客户端是自动模式还是手动模式，并至少有一个客户端可完整执行 SOP 工作流。

---

### 步骤 9：执行日常运行与维护

标准运行方式：

1. 使用 `ingest` 导入新资料
2. 自动或人工分类到 `concepts`、`entities`、`sources`
3. 定期执行 `lint the wiki`
4. 使用 `query:` 查询知识
5. 定期扫描 `sop-ready` 主题
6. 若 source 更新晚于 SOP，则执行更新

最佳实践：

- SOP 从已整理 source 生成，不直接从 raw 输出
- 一个 SOP 只覆盖一个清晰主题
- SOP 必须保留 source 回链
- 同主题 source 达到 3 份及以上时优先合成 SOP

**预期结果：** 知识库进入稳定运行状态，SOP 能持续生成、维护与复用。

---

## 5. 检查清单

- [ ] 已成功克隆仓库
- [ ] 已完成 Vault 目录初始化
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建多客户端 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已定义 source 状态流转规则
- [ ] 已准备 `status: sop-ready` 测试资料
- [ ] 已完成至少一个客户端验收
- [ ] 已建立日常维护流程

---

## 6. 常见问题

### Q1：claude-obsidian 是否原生支持 SOP 自动生成？

A：原生支持知识沉淀、分类和模板体系，但 SOP 自动生成通常需要补充 skill 与 hooks 配置才能稳定运行。

### Q2：哪些客户端能自动执行 SOP 检查？

A：来源中明确支持自动 hooks 的是 Claude Code。其他客户端一般支持 skills，但多为手动触发。

### Q3：什么情况下要标记为 `sop-ready`？

A：当资料包含明确步骤、可复用流程、最佳实践或经验总结时，应标记为 `sop-ready`。高价值资料应增加 `sop-priority: high`。

### Q4：如果 source 更新晚于 SOP 怎么办？

A：应提示更新 SOP，并基于最新 source 重新整理内容，确保 SOP 仍然准确可执行。

### Q5：为什么推荐使用 Junction？

A：因为多个客户端可以共享同一份 skills，降低维护成本，并避免不同客户端使用不同版本的 SOP 规则。

### Q6：SOP 可以直接从 raw 材料生成吗？

A：不建议。应先整理为 source，再进行 SOP 合成，以提高稳定性、可执行性和可追溯性。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
