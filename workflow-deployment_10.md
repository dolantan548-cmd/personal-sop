---
type: sop
category: workflow
status: active
created: 2026-05-23
updated: 2026-05-23
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中完成 claude-obsidian 知识库部署、初始化目录与配置、接入多 AI 客户端 skills，并建立 SOP 自动检查与生成机制，以支持知识沉淀、流程复用和跨客户端引用。

## 适用场景
- 需要在 Windows 上部署 claude-obsidian 知识库
- 希望将 AI 对话或资料自动沉淀为结构化笔记
- 需要为知识库配置 SOP 自动生成或更新机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端共享同一套知识库能力
- 希望通过 source 状态流转筛选可复用流程并沉淀为 SOP

## 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 可访问 claude-obsidian GitHub 仓库
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 具备创建 Junction 链接的权限

## 标准步骤

### 1. 克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认最终 Vault 根目录无额外嵌套，并设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已有 claude-obsidian 项目目录，且 Vault 根路径明确。

### 2. 初始化目录结构
执行以下命令创建标准目录：

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

**预期结果：** Vault 下存在 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates`。

### 3. 写入基础 Obsidian 配置
补充以下配置文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，`sop` 使用黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

**预期结果：** Obsidian 可正确识别 Vault，图谱与界面配置符合知识库使用要求。

### 4. 为多 AI 客户端创建 skills 链接
根据已安装客户端，将项目 skills 目录通过 Junction 链接到对应目录。目标位置包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例命令格式：

```powershell
New-Item -ItemType Junction -Path "目标路径" -Target "源路径"
```

**预期结果：** 各客户端可识别 claude-obsidian 的 skills，至少支持手动调用。

### 5. 创建 SOP 专用 skill
在项目中创建 `skills/wiki-sop/SKILL.md`，至少定义以下能力：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：指定主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查：步骤可执行性、检查清单、回链完整性

**预期结果：** 已有专门用于 SOP 工作流的 skill 定义文件。

### 6. 配置 hooks 自动检查 SOP 机会
在 `hooks/hooks.json` 中为 `SessionStart` 添加 SOP 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如使用 Claude Code，可进一步利用 hooks 实现自动检查与后续整理动作。

**预期结果：** 支持 hooks 的客户端可在会话启动时自动发现 SOP 生成或更新机会。

### 7. 建立 Source 状态流转规则
采用以下标准流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：
- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** 资料在进入知识库后可按统一规则分类，并可识别 SOP 候选项。

### 8. 执行 SOP 生成与更新
当命中自动检查条件或用户手动指定主题时，在 `wiki/sop/` 中生成或更新 SOP。生成标准包括：

- 合并同主题 source 的共性流程
- 每一步均写成可执行动作
- 每一步带有预期结果
- 增加检查清单
- 增加 FAQ
- 保留对 source 的回链

**预期结果：** 已生成或更新结构完整、可执行、可追溯的 SOP。

### 9. 按客户端能力验证运行方式
验证不同客户端的工作方式：

- **Claude Code**：验证 `SessionStart` 自动检查是否生效
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：验证 skills 是否可手动触发，例如“整理SOP”

**预期结果：** 每个客户端至少具备手动 SOP 工作流；支持 hooks 的客户端具备自动检查能力。

### 10. 执行日常维护与质量检查
定期使用以下能力维护知识库：

- `ingest`
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`
- `query:`

SOP 质量检查重点：
- 步骤是否可执行
- 检查清单是否完整
- FAQ 是否覆盖常见问题
- 回链是否完整
- sources 更新后是否已同步 SOP

**预期结果：** 知识库持续整洁，SOP 与 sources 保持同步。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入基础 Obsidian 配置
- [ ] 已为至少一个 AI 客户端创建 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 SessionStart 的 SOP 自动检查逻辑
- [ ] 已建立 source 状态流转规则
- [ ] 已定义 `sop-ready` 和 `sop-priority: high` 标记规则
- [ ] 已生成或更新至少一个 SOP
- [ ] 已验证客户端触发方式
- [ ] 已建立定期维护机制

## 常见问题（FAQ）

### Q1：Windows 下没有 setup 脚本时如何初始化？
A：直接使用 PowerShell 创建标准目录，并补齐 `.obsidian` 配置文件即可，属于 setup 的等效实现。

### Q2：哪些客户端支持 SOP 自动检查？
A：来源中明确 Claude Code 支持 hooks 自动检查；其他客户端主要通过 skills 手动触发。

### Q3：什么样的 source 应标记为 `sop-ready`？
A：任何包含明确步骤流程、可复用操作方法的资料都应标记为 `status: sop-ready`。

### Q4：什么时候应生成或更新 SOP？
A：当同主题 `sop-ready` 资料达到 3 个及以上、出现 `sop-priority: high`、或 source 内容比现有 SOP 更新时，应生成或更新 SOP。

### Q5：如果客户端不支持 hooks，还能使用吗？
A：可以，只要支持 skills，就可以通过手动指令触发 SOP 生成流程。

### Q6：如何避免重复 SOP？
A：先检查 `wiki/sop/` 中是否已有同主题文档；如已有且 source 更新较新，应更新原文而不是重复新建。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]