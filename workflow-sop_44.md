---
type: sop
category: workflow
status: active
created: 2026-05-25
updated: 2026-05-25
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与维护机制，并完成多 AI 客户端的 skills 引用配置，确保知识沉淀、流程复用与跨工具调用一致可用。

## 适用场景
- 需要在 Windows 上部署 claude-obsidian 知识库
- 需要将原始资料自动整理为 concepts / entities / sources / sop 结构
- 希望基于资料状态自动识别并提示生成 SOP
- 需要让多个 AI 客户端共享同一套知识库能力
- 需要建立 SOP 的生成、更新、检查与回链机制

## 前置条件
- Windows 环境，具备 PowerShell 可执行权限
- 已安装 Git
- 本地可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定知识库根目录路径
- 当前用户对各 AI 客户端 skills 目录有写权限
- 了解目标客户端是否支持 hooks

## 标准步骤

### 1. 克隆仓库并确认知识库根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在多余嵌套目录，整理为统一 vault 根路径，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录。

### 2. 创建标准目录结构
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

目录用途：
- `.raw`：原始资料
- `wiki/sources`：处理后的来源笔记
- `wiki/concepts`：概念
- `wiki/entities`：实体
- `wiki/sop`：标准操作流程
- `_templates`：模板

**预期结果：** 目录结构完整且可供后续流程使用。

### 3. 写入 Obsidian 基础配置
补齐以下配置文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置，在不破坏原配置前提下增补 SOP 相关内容。

**预期结果：** Obsidian 可正常识别并展示知识库。

### 4. 为多 AI 客户端创建 skills 链接
使用 Windows Junction 将 vault 关联到各客户端 skills 目录：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

Cursor、Windsurf 按其实际 skills 路径创建链接。若父目录不存在，先创建父目录。

**预期结果：** 多个 AI 客户端可共享同一套技能与知识库路径。

### 5. 建立 SOP skill 定义文件
创建：

`skills/wiki-sop/SKILL.md`

至少包含以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

**预期结果：** AI 可依据统一规则生成、更新与检查 SOP。

### 6. 配置 hooks 自动检查机制
修改：

`hooks/hooks.json`

在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，也可在 `PostToolUse` 加入自动提交逻辑。

**预期结果：** 支持 hooks 的客户端可在会话启动时自动检查 SOP 候选。

### 7. 执行 Source 状态流转规范
采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 能被自动机制正确识别和分类。

### 8. 生成或更新 SOP 文档
在 `wiki/sop/` 下生成对应 SOP。要求：
- 聚焦单一主题
- 步骤可执行
- 包含命令、路径、判断标准
- 包含 checklist
- 建立 source 回链
- source 更新后优先更新既有 SOP

不支持 hooks 的客户端可手动触发，如输入“整理SOP”。

**预期结果：** SOP 文档已生成或更新，并与 sources 保持关联。

### 9. 执行知识库维护与质量检查
定期执行 `lint the wiki`，并检查：
- SOP 步骤是否仍可执行
- checklist 是否覆盖关键验收点
- source 与 SOP 的回链是否完整
- source 是否晚于 SOP
- 分类目录是否正确

建议在每批 source 导入后、每周例行维护时执行。

**预期结果：** 知识库结构清晰、流程有效、SOP 保持最新。

### 10. 按客户端能力选择自动或手动方式
客户端差异：
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常手动触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：通常可手动调用 skills，不支持自动 hooks

部署完成后，需逐一测试每个客户端是否能访问 vault 并调用 SOP 相关能力。

**预期结果：** 已明确每个客户端的能力边界并完成验证。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库
- [ ] 已创建标准目录结构
- [ ] 已补齐 Obsidian 基础配置
- [ ] 已创建各客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 中的 SOP AUTO-CHECK
- [ ] 已执行 source 状态流转规范
- [ ] 已完成至少一次 SOP 生成或更新测试
- [ ] 已验证客户端自动/手动触发方式
- [ ] 已执行一次知识库维护检查

## 最佳实践
- 使用统一 vault 路径，避免不同客户端指向不同目录
- SOP 只针对可复用流程，不将纯资料堆叠为 SOP
- 高价值经验总结优先标记 `sop-priority: high`
- source 更新后优先更新旧 SOP，不重复创建
- 在 SOP 中强制保留来源回链，确保可追溯
- 定期执行 lint 与人工抽查，防止流程老化

## 常见问题

### Q1. 为什么 SOP 不会自动生成？
因为 SOP 生成功能需要额外配置触发机制。若客户端不支持 hooks，则只能通过 skills 手动触发。

### Q2. 哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可在 SessionStart 自动检查。其他多数客户端通常仅支持手动触发 skills。

### Q3. 如何判断 source 是否应标记为 `sop-ready`？
当资料具有明确、可重复执行的步骤，或属于可复用最佳实践时，应标记为 `sop-ready`。

### Q4. source 和 SOP 更新不同步怎么办？
在 hooks 中加入“sources 比 SOP 新则提示更新”的规则，并在定期维护时检查差异。

### Q5. 为什么推荐使用 Junction？
因为多个 AI 客户端可共享同一份 skills/知识库配置，避免重复维护。

### Q6. 如果某个客户端目录不存在怎么办？
先创建父目录，再创建 junction；若工具目录规范不同，则按实际路径调整。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]