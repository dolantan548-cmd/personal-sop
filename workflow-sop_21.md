---
type: sop
category: workflow
status: active
created: 2026-05-18
updated: 2026-05-18
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制，以实现资料沉淀、流程化整理和跨客户端复用。

## 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动记笔记能力
- 需要将零散资料整理为可复用的 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库技能
- 需要建立 source 到 SOP 的自动状态流转与更新提醒机制

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装
- 具备创建目录、写入配置文件、创建 Junction 链接的权限

## 标准步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆项目仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后出现多层嵌套目录，手动整理，确保最终 Vault 根目录唯一且明确，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 项目目录，且 Vault 根路径清晰明确。

### 步骤 2：创建标准目录结构
执行以下命令创建知识库所需目录：

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

**预期结果：** Vault 内已具备标准目录结构，可用于资料摄取、分类和 SOP 产出。

### 步骤 3：写入 Obsidian 基础配置
补充以下配置文件：

1. `.obsidian/graph.json`：配置图谱颜色分组，建议将 `sop` 设为黄色
2. `.obsidian/app.json`：排除 AI 工作文件和临时文件
3. `.obsidian/appearance.json`：启用 CSS snippets

如团队已有模板，应统一复用模板内容。

**预期结果：** Obsidian 可以正确识别知识结构与视图配置，SOP 在图谱中可独立展示。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
按需为不同客户端创建技能链接：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

如使用 Cursor 或 Windsurf，也应在其对应 skills 目录中建立相同链接。

**预期结果：** 各 AI 客户端可共享同一套 Vault 与技能配置。

### 步骤 5：建立 SOP 技能说明文件
创建 `skills/wiki-sop/SKILL.md`，至少定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查模式：检查步骤可执行性、检查清单与回链完整性

建议补充命名规范、输出模板和触发提示词。

**预期结果：** AI 客户端可以根据技能说明执行 SOP 检查、生成和更新。

### 步骤 6：配置 hooks 自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 中加入以下逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `>= 3` 时，提示生成 SOP
- `sop-priority: high` 时，优先提示生成 SOP
- source 比 SOP 新时，提示更新 SOP

**预期结果：** 在支持 hooks 的客户端中，打开会话即可自动发现 SOP 生成或更新机会。

### 步骤 7：定义 Source 状态流转与自动标记规则
统一状态流转如下：

```text
ingest -> raw -> processed -> archived
              │
              └-> sop-ready -> synthesized
```

自动标记规则：
- 含明确分步骤操作流程：`status: sop-ready`
- 含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 进入 SOP 候选池的标准一致，便于自动化扫描。

### 步骤 8：按客户端能力执行自动或手动 SOP 生成
执行方式如下：

- **Claude Code**：支持 hooks，可自动检查 SOP 机会
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常不支持 hooks，需手动输入如“整理SOP”“生成这个主题的SOP”等指令触发

生成的 SOP 应写入 `wiki/sop/`。

**预期结果：** 无论客户端能力如何，都能稳定触发 SOP 生成流程。

### 步骤 9：验证知识库功能与 SOP 产出质量
完成部署后，依次验证：

1. `ingest` 是否可正常导入并分类资料
2. `query:` 是否可正常查询知识库
3. `lint the wiki` 是否可执行定期维护
4. `wiki/sop/` 中 SOP 是否包含明确步骤、可执行命令、检查清单、source 回链
5. 图谱中 SOP 是否被正确分类显示

如发现 SOP 质量不稳定，优先修订模板、技能说明与状态规则。

**预期结果：** 知识库基础能力可用，SOP 机制可持续运行并支持后续维护。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 项目并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置文件
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转与自动标记规则
- [ ] 已确认各客户端的触发方式
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 可用
- [ ] 已验证生成的 SOP 包含步骤、检查清单与回链

## 最佳实践
- 优先让 SOP 来源于多个同主题 source，而非单条零散笔记
- 对高复用、高价值经验总结加上 `sop-priority: high`
- 在 SOP 中保留与 source 的双向回链，便于追溯依据
- 将图谱颜色区分纳入标准配置，方便快速识别 SOP 节点
- 对不支持 hooks 的客户端，统一采用固定触发口令，减少操作偏差

## 常见问题

### 1. 哪些客户端支持 SOP 自动检查？
Claude Code 支持 `hooks.json`，可自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只支持 skills，需要手动触发。

### 2. 什么时候应该把 source 标记为 `sop-ready`？
当资料包含明确分步骤操作流程，或沉淀了可重复执行的最佳实践、经验总结时，应标记为 `sop-ready`。若价值较高，增加 `sop-priority: high`。

### 3. 什么情况下应该生成 SOP？
当同主题 `sop-ready` 资料达到 3 条及以上，或某条资料具备高优先级时，应生成 SOP。

### 4. 如何判断 SOP 需要更新？
当 source 的更新时间晚于对应 SOP，或 source 新增关键步骤、经验、风险控制项时，应更新 SOP。

### 5. Junction 创建失败怎么办？
先确认父目录存在，再以具备足够权限的 PowerShell 执行创建命令，并检查路径与同名目录冲突。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
