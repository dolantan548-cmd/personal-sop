---
type: sop
category: workflow
status: active
created: 2026-05-16
updated: 2026-05-16
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中标准化部署 claude-obsidian 知识库，配置知识采集、分类整理、SOP 自动检测与生成机制，并为多个 AI 客户端建立统一的 skills 引用能力。

## 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端共用的 Obsidian 知识库
- 需要将 AI 采集的资料自动整理为 concepts、entities、sources 与 SOP
- 需要为 Claude Code 配置 SessionStart 自动检查 SOP 的机制
- 需要让 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套 skills
- 需要建立 source 到 SOP 的标准状态流转与维护流程

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 本地可访问并克隆 claude-obsidian 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装或可使用至少一个 AI 客户端
- 具备在用户目录下创建 Junction 链接的权限

## 标准步骤

### 1. 克隆项目并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库目录存在嵌套层级或不符合你的预期，请整理为统一的 vault 根目录，并记下完整路径，例如：

```text
D:\dolan_env\temp\project\personal\claude-obsidian
```

**预期结果：** 本地已成功克隆项目，且已确定唯一可用的 vault 根目录。

### 2. 创建知识库标准目录结构
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

**预期结果：** Vault 中已存在标准目录结构。

### 3. 写入 Obsidian 基础配置
补充或修改以下配置文件：

1. `.obsidian/graph.json`：设置知识图谱颜色分组，建议将 `sop` 分类设为黄色。
2. `.obsidian/app.json`：配置忽略或排除 AI 工作文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如已有配置，优先合并而非覆盖。

**预期结果：** Obsidian 已具备基础显示、过滤与分类能力。

### 4. 为多个 AI 客户端建立 skills Junction 链接
将项目 skills 链接到各客户端目录，目标示例：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

使用 PowerShell 的 `New-Item -ItemType Junction` 创建链接。先确认源路径存在，目标父目录已创建。

**预期结果：** 多个 AI 客户端可共用同一套 skills。

### 5. 创建 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：检查可执行性、检查清单、来源回链完整性

建议明确输入、触发条件、输出路径和文档结构。

**预期结果：** 存在可供客户端调用的 SOP skill。

### 6. 在 hooks 中配置 SOP 自动检查逻辑
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 等支持 hooks 的客户端会在会话启动时自动检查。

**预期结果：** 支持 hooks 的客户端会自动提示生成或更新 SOP。

### 7. 建立 source 到 SOP 的状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 状态统一，SOP 候选资料可被稳定识别。

### 8. 按客户端差异执行 SOP 触发方式
- **Claude Code**：支持自动检查与 hooks
- **Kimi Code**：支持 skills，通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：如支持 skills，引导为手动触发

**预期结果：** 团队明确哪些客户端可自动运行，哪些客户端需要手动指令。

### 9. 执行首次验证与测试
验证流程建议如下：

1. 通过 `ingest` 导入资料
2. 将至少 3 份同主题资料标记为 `status: sop-ready`
3. 启动支持 hooks 的客户端，检查是否收到生成或更新提示
4. 在不支持 hooks 的客户端手动输入“整理SOP”等指令
5. 检查 `wiki/sop/` 中是否成功输出 SOP，并确认其包含步骤、清单和来源回链

**预期结果：** 整个 SOP 生成链路验证通过。

### 10. 建立日常维护机制
日常维护建议：

- 定期运行或触发 `lint the wiki`
- 使用 `query:` 命令进行知识查询
- sources 更新后检查 SOP 是否过期
- 定期清理 `processed` 与 `archived` 资料
- 对生成失败、分类错误或回链缺失的 SOP 做人工抽检

**预期结果：** 知识库与 SOP 长期保持一致、可用、可维护。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 中的 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转规则
- [ ] 已明确不同客户端的触发方式
- [ ] 已完成端到端测试
- [ ] 已建立日常维护机制

## 常见问题

### Q1. 为什么有些客户端不会自动检查或生成 SOP？
因为并非所有客户端都支持 hooks。Claude Code 支持自动 hooks，其他多数客户端主要通过 skills 手动触发。

### Q2. 什么样的 source 应该标记为 `sop-ready`？
只要资料包含可复用的分步骤操作流程，就应标记为 `status: sop-ready`；若同时是最佳实践或经验总结，建议增加 `sop-priority: high`。

### Q3. 什么时候应该提示生成 SOP？
当同主题 `sop-ready` 资料达到 3 份及以上，或某条资料被标记为 `sop-priority: high` 时，应提示生成 SOP。

### Q4. 什么时候应该更新已有 SOP？
当 sources 比已有 SOP 更新，或 source 中新增关键步骤和限制条件时，应更新 SOP。

### Q5. 如果已有 Obsidian 配置文件，是否可以直接覆盖？
不建议。应合并必要配置，避免影响现有使用习惯和插件设置。

### Q6. Junction 创建失败怎么办？
检查目标父目录是否存在、源路径是否真实存在、目标是否已被占用，并确保 PowerShell 具备足够权限。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]