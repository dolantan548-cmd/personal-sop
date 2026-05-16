---
type: sop
category: workflow
status: active
created: 2026-05-17
updated: 2026-05-17
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
本 SOP 用于在 Windows 环境中部署 claude-obsidian，建立标准知识库目录、Obsidian 配置、多 AI 客户端 skills 共享机制，以及 SOP 自动检查与生成流程，确保资料从摄取到 SOP 产出的全过程可重复、可维护、可扩展。

## 适用场景
- 在 Windows 上首次部署 claude-obsidian
- 为知识库启用 SOP 自动提醒或自动生成机制
- 让多个 AI 客户端共享同一个 vault 与同一套 skills
- 规范 source 的状态流转与 SOP 产出标准
- 建立长期知识维护与 SOP 更新机制

## 前置条件
- Windows 环境与 PowerShell 权限
- 已安装 Git
- 已确定 vault 安装目录
- 已安装至少一个可用 AI 客户端
- 具备创建目录、配置文件和 Junction 的权限

## 标准步骤

### 步骤 1：克隆项目并确认 vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，需整理到单一 vault 根目录。

**预期结果：** 已获得本地 vault 根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`。

---

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

目录说明：
- `.raw`：原始输入资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** 标准目录已创建完成。

---

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 下配置：
- `graph.json`：为不同目录设置图谱分组颜色，建议 `sop` 为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

如已有配置，请进行合并，不要破坏现有可用设置。

**预期结果：** Obsidian 能正常识别并使用该 vault，图谱与外观配置可生效。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
按实际使用的客户端创建链接：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

**预期结果：** 多个 AI 客户端可共享同一份 skills。

---

### 步骤 5：创建 wiki-sop skill
创建 `skills/wiki-sop/SKILL.md`，定义以下能力：
- 自动检查 `status: sop-ready` 的资料
- 支持按主题手动生成 SOP
- 当 sources 更新时提示更新 SOP
- 对生成的 SOP 做质量检查：步骤可执行、检查清单完整、回链完整

建议明确输入目录、输出目录、命名规范和回链要求。

**预期结果：** AI 可以调用专用 skill 处理 SOP 生成、更新与校验。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入类似逻辑：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `>= 3` 时提示生成 SOP
- `sop-priority: high` 时提示优先生成 SOP
- 若 source 比 SOP 更新，则提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话开始时自动发现 SOP 生成或更新机会。

---

### 步骤 7：建立 source 状态流转规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤流程资料 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议在 frontmatter 中统一维护：
- `status`
- `sop-priority`
- `topic`
- `updated_at`

**预期结果：** source 可被可靠分类，并能触发 SOP 生成逻辑。

---

### 步骤 8：按客户端差异选择触发方式
客户端差异：
- **Claude Code**：支持自动检查，适合依赖 hooks
- **Kimi Code**：支持 skills，通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常以手动触发为主

建议为不支持 hooks 的客户端统一人工触发口令，例如：
- “扫描 sop-ready 并生成 SOP”
- “根据最新 source 更新某主题 SOP”

**预期结果：** 不同客户端都能以适配方式参与同一流程。

---

### 步骤 9：执行首次端到端验证
验证流程：
1. 使用 `ingest` 导入一份资料
2. 检查资料是否进入正确目录
3. 为流程型资料添加 `status: sop-ready`
4. 满足条件后触发 SOP 生成
5. 将结果保存到 `wiki/sop/`
6. 使用 `query:` 验证 AI 能检索与引用 SOP
7. 运行 `lint the wiki` 进行整理与修复

**预期结果：** ingest、分类、SOP 生成、查询与维护的全链路验证通过。

---

### 步骤 10：执行日常维护
将以下动作纳入日常机制：
- 定期运行 `lint the wiki`
- 新资料导入后检查是否应标记 `sop-ready`
- 高价值资料增加 `sop-priority: high`
- source 更新后检查 SOP 是否过期
- 每份 SOP 保留来源回链
- 避免把纯参考资料转成 SOP

**预期结果：** 知识库与 SOP 库持续稳定、可用、可追溯。

## 检查清单
- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已完成所需 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查
- [ ] 已定义 source 状态规则
- [ ] 已确认各客户端的触发方式
- [ ] 已通过一次端到端验证
- [ ] 已建立日常维护节奏

## 最佳实践
- 优先将可复用流程与最佳实践标记为 `sop-ready`
- 使用 `sop-priority: high` 提升关键主题的产出优先级
- 保持 SOP 与 source 的双向回链
- 对不支持 hooks 的客户端，统一人工触发口令
- 定期运行 `lint the wiki` 保持结构健康

## 常见问题

### Q1：为什么没有自动生成 SOP？
通常是因为客户端不支持 hooks、source 未标记为 `sop-ready`、同主题数量不足，或未设置高优先级。

### Q2：哪些资料适合转成 SOP？
适合转成 SOP 的是包含明确步骤、可执行流程、最佳实践和可重复方法的资料。

### Q3：source 更新后如何处理旧 SOP？
应在自动检查或人工检查中比对更新时间；如 source 更新更晚，则更新 SOP，并保留来源回链。

### Q4：为什么要给多个客户端共享同一套 skills？
这样可以减少重复维护、保持规则一致，并让不同 AI 工具对同一知识库执行一致动作。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]