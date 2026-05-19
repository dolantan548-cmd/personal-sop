---
type: sop
category: workflow
status: active
created: 2026-05-19
updated: 2026-05-19
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian`，并建立从资料采集、知识整理到 SOP 生成的完整工作流。完成后，可实现：
- AI 自动写笔记与分类整理
- 多 AI 客户端共享同一套 skills
- 根据 source 状态自动识别 SOP 生成机会
- 统一维护 `wiki/sop/` 中的标准流程文档

## 2. 适用场景
- 需要在 Windows 上搭建本地知识库
- 需要把分散资料沉淀为可复用 SOP
- 需要让多个 AI 客户端访问同一个 vault
- 需要建立 source 到 SOP 的自动或半自动流转机制

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 路径
- 已安装至少一个支持 skills 的 AI 客户端
- 具备创建目录、文件和 Junction 的权限

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如目录层级不规范，先整理嵌套目录。然后定义根路径：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已具备仓库文件，且 vault 根目录明确。

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

**预期结果：** 所有标准目录均已创建。

### 步骤 3：写入基础 Obsidian 配置
创建或更新以下配置：
- `.obsidian/graph.json`：设置知识图谱颜色分组，`sop` 建议为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可正确显示结构、隐藏干扰文件并加载样式片段。

### 步骤 4：为多 AI 客户端创建共享 skills 链接
按客户端创建 Junction 到统一的 skills 目录。常见目标位置包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

**预期结果：** 一个或多个 AI 客户端可访问同一套 skills。

### 步骤 5：创建 SOP 技能定义文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：步骤可执行性、检查清单、回链完整性

**预期结果：** AI 客户端可基于统一规则执行 SOP 生成与检查。

### 步骤 6：配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 每次会话开始时，系统能自动发现待生成或待更新的 SOP。

### 步骤 7：实施 source 状态流转规范
采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 元数据一致，可被自动机制准确识别。

### 步骤 8：按客户端能力选择触发方式
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：一般需手动触发，如输入“整理SOP”

**预期结果：** 当前客户端的 SOP 工作方式与其能力相匹配。

### 步骤 9：验证完整链路
执行一次端到端测试：
1. 使用 `ingest` 导入资料
2. 检查是否自动整理到 `concepts/entities/sources`
3. 运行 `lint the wiki`
4. 使用 `query:` 检索内容
5. 将符合条件资料标记为 `status: sop-ready`
6. 触发自动检查或手动生成 SOP
7. 检查 `wiki/sop/` 输出结果与回链完整性

**预期结果：** 从入库到 SOP 生成的全链路可用。

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 检查逻辑
- [ ] 已实施 source 状态流转规范
- [ ] 已确认客户端采用自动或手动触发机制
- [ ] 已完成端到端测试
- [ ] 已确认 SOP 输出到 `wiki/sop/`

## 6. 最佳实践
- 优先保持一个统一 vault，避免多处复制知识库
- 统一 source 元数据字段，特别是 `status` 与 `sop-priority`
- 当同主题资料积累到 3 条以上时及时合成为 SOP，避免知识碎片化
- SOP 生成后保留回链，确保可追溯到原始 source
- 对支持 hooks 的客户端优先启用自动检查，减少人工漏检

## 7. 常见问题

### Q1：为什么项目本身支持笔记整理，但 SOP 没自动生成？
因为 SOP 生成依赖额外的技能定义和触发机制，默认能力并不等于默认自动触发。

### Q2：所有 AI 客户端都支持 hooks 吗？
不是。根据来源，Claude Code 支持 hooks；其他常见客户端多为手动触发。

### Q3：什么资料应该标记为 `sop-ready`？
任何包含明确步骤、可重复执行流程或高价值最佳实践的资料都应标记为 `sop-ready`。

### Q4：什么时候应该更新 SOP？
当 source 内容比现有 SOP 更新，或新增资料改变最佳实践时，应更新 SOP。

### Q5：为什么要使用 Junction？
Junction 能让多个 AI 客户端共享同一套 skills，减少重复配置并保证行为一致。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]