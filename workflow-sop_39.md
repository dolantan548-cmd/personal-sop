---
type: sop
category: workflow
status: active
created: 2026-05-24
updated: 2026-05-24
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保资料可持续沉淀、检索与流程化复用。

## 适用场景
- 需要在 Windows 上搭建可供 AI 自动写笔记和整理知识的 Obsidian 知识库
- 需要将分散资料沉淀为 SOP 并建立自动触发机制
- 需要让多个 AI 客户端共享同一套知识库和 SOP 技能
- 需要通过 source 状态流转管理可复用流程资料

## 前置条件
- Windows 环境，支持 PowerShell
- 已安装 Git
- 可访问目标仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 本地已安装或准备使用 Obsidian
- 明确知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 如需多客户端共用，已安装对应 AI 工具（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）

## 标准步骤

### 1. 克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标父目录后克隆仓库，并确认最终 Vault 路径无多层嵌套。如果克隆后出现重复目录层级，需手动整理，保证后续 `.obsidian`、`wiki`、`skills`、`hooks` 等目录都位于同一根目录下。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

建议将 Vault 根目录统一设为：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，并可作为唯一 Vault 根路径使用。

### 2. 创建标准目录结构
在 Vault 根目录下创建 Obsidian 配置目录、原始资料目录、知识库分类目录、SOP 目录及模板目录，确保后续 ingest、整理、SOP 生成都能按固定结构运行。

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

**预期结果：** Vault 下已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 3. 写入 Obsidian 基础配置
在 `.obsidian` 目录中补齐基础配置文件，至少包括以下内容：
- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 类内容标记为黄色，便于在图谱中识别流程资产。
- `app.json`：排除 AI 运行产生的工作文件，避免噪声进入知识图谱与搜索。
- `appearance.json`：启用 CSS 片段，保证界面与分类展示符合项目预期。

如项目仓库已有这些文件，直接复用并检查路径；如无，则按项目约定创建。配置完成后，在 Obsidian 中重新加载 Vault 以生效。

**预期结果：** Obsidian 能正常打开 Vault，图谱分组、文件排除和外观片段设置可用。

### 4. 为多 AI 客户端创建 skills 链接
将项目 skills 目录通过 Windows Junction 链接到各 AI 客户端的 skills 路径，使多个客户端复用同一套知识库技能定义。根据实际安装的客户端逐个执行。

常见目标路径包括：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

对其他客户端重复同类操作，并根据实际目录调整 `-Path`。

**预期结果：** 目标 AI 客户端的 skills 目录中已出现指向 Vault skills 的链接，客户端可共享同一套技能定义。

### 5. 创建 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中建立 SOP 工作规范，至少覆盖以下能力：
- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：当用户指定主题时生成 SOP
- 更新模式：当 source 更新而 SOP 过旧时提示更新
- 质量检查：检查步骤可执行性、检查清单完整性、来源回链是否完整

建议在该 skill 中明确输入、触发条件、输出格式、命名规范和 SOP 质量要求，确保不同 AI 客户端在手动触发时能产出一致结果。

**预期结果：** Vault 中已存在 `skills/wiki-sop/SKILL.md`，且内容足以指导 AI 执行 SOP 检查、生成和更新。

### 6. 配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。建议至少包含以下规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 当同主题资料数量 ≥ 3 时，提示生成 SOP
- 当 `sop-priority: high` 时，优先提示生成 SOP
- 当 source 的更新时间晚于对应 SOP 时，提示更新 SOP

可加入说明文本，例如：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，还可在其他 hook 中补充自动提交或整理逻辑。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动检查 SOP 生成或更新机会。

### 7. 建立 Source 状态流转规则
统一 source 的处理状态，确保资料是否适合 SOP 化有明确判定标准。推荐采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含明确分步骤操作流程：标记为 `status: sop-ready`
- 属于最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 仅为参考资料、无直接流程复用价值：标记为 `status: processed`

需要在 source 元数据或整理流程中贯彻这些规则，避免 SOP 候选资料混乱。

**预期结果：** 新进入知识库的资料能够被一致地标记为 `processed`、`sop-ready`、`archived` 或 `synthesized` 等状态。

### 8. 按客户端能力执行 SOP 生成与维护
根据客户端支持差异决定自动或手动触发方式：
- **Claude Code**：支持 `hooks.json`，可在 `SessionStart` 自动检查 SOP 机会，并结合其他 hooks 完成自动化维护
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，不支持 hooks，需要通过明确指令手动触发，例如“整理SOP”或指定主题生成 SOP

标准维护动作包括：
1. 定期 ingest 新资料
2. 将可复用流程资料标记为 `sop-ready`
3. 在自动检查或人工发现触发条件后生成 SOP
4. 当 sources 更新时同步更新 SOP
5. 运行知识库维护操作（如 `lint the wiki`）保持结构整洁

**预期结果：** 无论使用哪种客户端，都能按统一规则发现、生成并更新 SOP。

### 9. 验证知识库、SOP 与引用链是否可用
完成部署后执行一次端到端验证：
- 使用 ingest 导入一条测试资料，确认其进入标准目录
- 将测试资料标记为 `status: sop-ready`
- 在支持 hooks 的客户端重启会话，确认出现 SOP 检查提示；或在仅支持 skills 的客户端手动触发生成
- 检查 `wiki/sop/` 是否成功生成 SOP
- 确认 SOP 内含步骤、检查清单及来源回链
- 使用 `query:` 或 Obsidian 搜索确认 SOP 可被检索和引用
- 如有维护命令，执行 `lint the wiki` 检查结构问题

**预期结果：** 测试资料可被整理并转化为 SOP，且 SOP 能在知识库中被稳定检索、引用和更新。

## 检查清单
- [ ] 已在 Windows 上成功克隆 claude-obsidian 项目
- [ ] Vault 根目录结构已包含 `.obsidian`、`.raw`、`wiki`、`_templates` 等标准目录
- [ ] Obsidian 基础配置文件已创建或校验完成
- [ ] 至少一个 AI 客户端已正确链接到共享 skills 目录
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已定义并开始使用 source 状态流转规则
- [ ] 已确认客户端支持方式：自动 hooks 或手动 skills
- [ ] 已完成一次从 source 到 SOP 的端到端验证
- [ ] 已确认 SOP 可检索、可回链、可更新

## 最佳实践
- 将 `wiki/sop/` 作为标准 SOP 输出目录，避免与 concepts、entities、sources 混放
- 对高价值流程资料统一增加 `sop-priority: high`，提升自动发现效率
- 保持 source 元数据规范，避免后续同主题聚合失败
- 优先在支持 hooks 的客户端中进行自动检查，在其他客户端中保留同名 skill 供手动触发
- 每次 source 有新增或更新后，检查对应 SOP 是否过期
- 定期执行 `lint the wiki`，减少结构漂移和引用失效

## 常见问题

### 1. 为什么已经部署了 claude-obsidian，但没有自动生成 SOP？
因为 SOP 生成功能不是完全默认开启的。项目原生支持笔记整理与模板能力，但需要额外配置 `skills/wiki-sop/SKILL.md` 和 hooks 触发规则，或在不支持 hooks 的客户端中手动触发。

### 2. 哪些客户端可以自动检查 SOP 生成机会？
根据来源信息，Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只支持 skills，需要人工输入指令触发。

### 3. 什么样的 source 应标记为 `sop-ready`？
凡是包含明确分步骤操作流程、可重复执行的方法、最佳实践或经验总结的资料，都应标记为 `sop-ready`。其中高复用价值内容建议额外标记 `sop-priority: high`。

### 4. 什么时候应该生成或更新 SOP？
当同主题 `sop-ready` 资料达到 3 条及以上、某条资料被标记为 `sop-priority: high`、或 source 的更新时间晚于现有 SOP 时，应生成或更新 SOP。

### 5. 如果目录结构克隆后有嵌套问题怎么办？
需要先整理仓库目录，确保 `.obsidian`、`wiki`、`skills`、`hooks` 等目录位于同一个 Vault 根目录下。否则 Obsidian、skills 链接和 hooks 配置都可能失效。

### 6. 如何确认多 AI 客户端确实共享了同一套 skills？
检查各客户端 skills 目录中的 Junction 是否指向同一个 Vault `skills` 路径，并在不同客户端中尝试调用同名 skill，确认输出规则一致。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]