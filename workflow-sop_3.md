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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制。目标是让知识库能够持续接收 AI 整理内容、自动识别可复用流程，并沉淀为统一格式的 SOP 文档。

## 2. 适用场景
- 需要在 Windows 本地搭建可供 AI 读写的 Obsidian 知识库
- 希望将 AI 处理结果沉淀到统一 wiki 结构中
- 需要从 sources 中定期提炼 SOP
- 希望多个 AI 客户端共享同一知识库和 SOP 能力

## 3. 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 已确认本地 vault 路径
- 可访问 claude-obsidian GitHub 仓库
- 已安装至少一个支持 skills 或本地目录引用的 AI 客户端
- 了解 Obsidian vault 的基础结构

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库存在嵌套目录，整理为单一 vault 根目录，并定义变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已获得项目文件，并明确唯一的 vault 路径。

### 步骤 2：创建标准目录结构
执行以下命令：

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

**预期结果：** vault 内标准目录已完整创建。

### 步骤 3：写入 Obsidian 基础配置
补充以下配置文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确展示和区分 SOP 等知识分类。

### 步骤 4：为多 AI 客户端创建 skills 链接
按客户端分别创建 Junction 链接，例如 Claude Code：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

可按需为以下客户端创建：
- Kimi Code
- Codex CLI
- Claude Code
- Gemini CLI
- Cursor
- Windsurf

**预期结果：** AI 客户端可访问同一套 vault/skills 内容。

### 步骤 5：建立 SOP 技能说明
创建 `skills/wiki-sop/SKILL.md`，定义以下能力：
- 自动检查 `status: sop-ready` 资料
- 手动按主题生成 SOP
- 当 source 更新时提示更新 SOP
- 检查步骤可执行性、清单完整性、来源回链完整性

**预期结果：** AI 可依据技能说明执行 SOP 检查、生成和更新。

### 步骤 6：配置 hooks 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥3 时提示生成 SOP
- `sop-priority: high` 时优先提示生成
- 当 sources 比 SOP 更新时提示刷新

**预期结果：** 支持 hooks 的客户端在会话开始时自动检查 SOP 候选项。

### 步骤 7：执行 Source 状态流转与自动标记
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** 可复用资料被清晰标记，为 SOP 提炼提供输入。

### 步骤 8：生成、更新并验证 SOP
在支持 hooks 的客户端中按提示生成；在其它客户端中手动输入如“整理SOP”进行触发。生成后保存至 `wiki/sop/`，并检查：
1. 步骤是否可执行
2. 是否包含检查清单
3. 是否包含来源回链
4. source 更新后是否同步更新 SOP
5. 必要时执行 `lint the wiki` 或使用 `query:` 检索验证

**预期结果：** `wiki/sop/` 中已有结构完整、可执行、可追溯的 SOP 文档。

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 Obsidian 基础配置文件
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已更新 `hooks/hooks.json`
- [ ] 已完成 source 状态标记
- [ ] 已生成至少一份 SOP 到 `wiki/sop/`
- [ ] 已验证步骤、清单与来源回链

## 6. 最佳实践
- 所有 AI 客户端尽量共享同一 vault，避免知识分裂
- 将高价值经验总结优先标记为 `sop-priority: high`
- 定期检查 sources 与 SOP 的更新时间差异
- 生成 SOP 后立即做可执行性审查，避免空泛描述
- 将 SOP 统一输出到 `wiki/sop/`，保持知识结构稳定

## 7. 常见问题

**Q1：哪些客户端支持自动 SOP 检查？**  
A：Claude Code 支持 hooks，可自动检查；其他客户端通常依赖 skills，需手动触发。

**Q2：什么内容适合标记为 `sop-ready`？**  
A：包含可重复执行步骤、流程规范、最佳实践、经验总结的资料最适合。

**Q3：source 更新后怎么处理旧 SOP？**  
A：如果 source 比 SOP 更新，应提示或立即重新生成，并重新核对步骤与清单。

**Q4：没有 hooks 时还能用吗？**  
A：可以，直接通过 skills 手动触发 SOP 整理即可。

**Q5：为什么要配置多个客户端的链接？**  
A：因为同一知识库可被不同 AI 工具复用，能提升检索、整理和 SOP 更新效率。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]