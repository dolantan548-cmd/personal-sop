---
type: sop
category: workflow
status: active
created: 2026-05-20
updated: 2026-05-20
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: claude-obsidian 知识库部署与 SOP 自动机制配置

**类别:** workflow  
**版本:** 1.0  
**适用平台:** Windows (PowerShell)

---

## 目的

在 Windows 环境下标准化部署 claude-obsidian 知识库，配置 AI 自动笔记分类、SOP 自动生成与多 AI 客户端引用机制，实现笔记的自动流转与跨工具复用。

## 适用场景

- 首次部署 claude-obsidian 知识库项目
- 需要配置 AI 自动笔记分类与定期 SOP 生成
- 打通多 AI 客户端（Claude Code / Kimi Code / Codex CLI 等）与本地知识库
- 建立笔记状态流转规则与自动触发机制

## 前置条件

- Windows 环境，已安装 PowerShell 和 Git
- 已安装至少一个支持的 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）
- 确定知识库本地部署路径（示例：`D:\dolan_env\temp\project\personal`）
- 具备 GitHub 访问权限以克隆仓库

---

## 操作步骤

### 步骤 1：克隆仓库并整理目录结构

在目标父目录中执行 Git 克隆，若存在嵌套目录则整理为单层项目根目录。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
# 若出现双层嵌套，将内部目录上移，确保项目根目录为 claude-obsidian\
```

**预期结果：** 本地存在 `claude-obsidian` 目录，且为项目根目录（包含 `.git`、README、默认结构），无嵌套冗余。

### 步骤 2：创建标准目录结构

在项目根目录下创建 Obsidian、原始文件、Wiki 分类及模板目录。

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

**预期结果：** 目录树包含 `wiki/{concepts,entities,sources,sop}`、`_templates`、`.raw`、`.obsidian/snippets`，且 PowerShell 无报错。

### 步骤 3：写入 Obsidian 核心配置文件

在项目 `.obsidian` 下创建或覆盖三个配置文件：

- `.obsidian/graph.json`：定义知识图谱颜色分组（sop 节点为黄色）
- `.obsidian/app.json`：将 AI 工作文件（如 `.raw`、daemon 日志）加入排除列表
- `.obsidian/appearance.json`：启用 CSS 片段支持

**预期结果：** Obsidian 打开 vault 后，知识图谱中 sop 目录文件显示为黄色分组，AI 工作文件不在图谱和搜索中显示，CSS 片段已启用。

### 步骤 4：创建多 AI 客户端 Skills 链接

为各 AI 工具在项目外创建 Junction 目录链接，使其能读取 vault 中的 Skill 定义。

```powershell
# Claude Code
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\claude-obsidian" -Target "$VAULT"
# Kimi Code
New-Item -ItemType Junction -Path "$env:USERPROFILE\.kimi\skills\claude-obsidian" -Target "$VAULT"
# Codex CLI
New-Item -ItemType Junction -Path "$env:USERPROFILE\.codex\skills\claude-obsidian" -Target "$VAULT"
# Gemini CLI
New-Item -ItemType Junction -Path "$env:USERPROFILE\.gemini\skills\claude-obsidian" -Target "$VAULT"
# Cursor
New-Item -ItemType Junction -Path "$env:USERPROFILE\.cursor\skills\claude-obsidian" -Target "$VAULT"
# Windsurf
New-Item -ItemType Junction -Path "$env:USERPROFILE\.windsurf\skills\claude-obsidian" -Target "$VAULT"
```

**预期结果：** 各 AI 客户端配置目录下的 `skills/claude-obsidian` 指向本地 vault，客户端重启后可识别 Skill。

### 步骤 5：创建 SOP 自动化 Skill 文件

在 vault 内创建 `skills/wiki-sop/SKILL.md`，定义以下核心能力：

- **自动检查模式**：扫描 `status: sop-ready` 的资料
- **手动生成模式**：用户指定主题生成 SOP
- **更新模式**：当 sources 更新时提示更新 SOP
- **质量检查**：验证步骤可执行性、检查清单完整性、回链完整性

**预期结果：** AI 客户端可加载 wiki-sop Skill，支持通过自然语言指令执行自动扫描、手动生成与质量检查。

### 步骤 6：配置 SessionStart 自动检查钩子

修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP AUTO-CHECK 指令：

```
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** Claude Code 每次会话启动时自动执行扫描；其他客户端无 hooks 支持，需通过 Skill 手动触发。

### 步骤 7：建立 Source 状态流转与自动标记规则

在笔记处理流程中执行以下状态机，并由 AI 自动标记：

```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

**Auto-marking 规则：**
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 笔记按内容类型自动进入对应状态，高价值内容被标记为 sop-ready，满足聚合条件后触发 SOP 生成或更新。

---

## 检查清单

- [ ] Git 仓库已克隆到本地指定路径，且无嵌套目录
- [ ] wiki/{concepts,entities,sources,sop}、_templates、.raw、.obsidian/snippets 目录已创建
- [ ] .obsidian/graph.json、app.json、appearance.json 已正确配置并生效
- [ ] 至少一个 AI 客户端的 Skills 目录已建立 Junction 链接
- [ ] skills/wiki-sop/SKILL.md 已创建并包含自动检查/手动生成/更新/质量检查功能
- [ ] hooks/hooks.json 已配置 SessionStart SOP AUTO-CHECK（Claude Code）
- [ ] Source 状态流转规则已文档化，AI 可依据 Auto-marking 规则正确打标
- [ ] Obsidian 打开后，AI 工作文件未污染知识图谱

---

## 常见问题

**Q: 为什么只有 Claude Code 能自动检查 SOP，其他客户端不行？**  
A: 目前仅 Claude Code 支持 hooks.json 机制，可在 SessionStart 自动触发扫描。其他客户端（Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）虽支持 skills，但需用户手动说“整理SOP”或调用对应指令触发。

**Q: 如何确认 Junction 链接创建成功？**  
A: 在 PowerShell 中执行 `Get-Item "~\.claude\skills\claude-obsidian"`，查看 Target 属性是否指向正确 vault 路径；或在文件资源管理器中观察文件夹图标是否带有链接标记。

**Q: 笔记已被标记为 sop-ready，但没有自动生成 SOP？**  
A: 首先确认是否使用 Claude Code（仅其支持 hooks 自动触发）。若使用其他客户端，需手动调用 wiki-sop Skill。其次检查同主题 sop-ready 笔记是否 ≥3 条，或是否存在 `sop-priority: high` 标记。

**Q: 纯参考资料与 sop-ready 资料如何区分？**  
A: 若内容包含分步骤操作流程、最佳实践或经验总结，应标记为 `status: sop-ready`；若仅为信息参考、无复用价值，则标记为 `status: processed`。

**Q: Mac 或 Linux 如何执行此部署？**  
A: 目录结构完全一致，但需使用 `ln -s` 创建符号链接替代 PowerShell 的 `New-Item -ItemType Junction`，并将 Windows 路径修改为对应 Unix 路径。

---

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
