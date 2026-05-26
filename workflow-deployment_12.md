---
type: sop
category: workflow
status: active
created: 2026-05-26
updated: 2026-05-26
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中完成 claude-obsidian 的标准化部署，并配置 SOP 自动检查、手动生成与更新提醒机制，使知识库能够持续将可复用资料沉淀为标准操作流程。

## 2. 适用场景
- 在 Windows 上搭建 claude-obsidian 知识库
- 需要 AI 自动写入笔记并分类整理
- 需要将 source 资料转化为 SOP
- 需要多个 AI 客户端共用同一套 skills 与知识库
- 需要建立 SOP 自动检查与更新机制

## 3. 前置条件
- Windows 环境与 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 Vault 路径
- 已安装至少一个 AI 客户端
- 具备创建 Junction 的权限

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理后确认 Vault 根路径，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已获得可用的项目目录，并明确唯一 Vault 路径。

### 步骤 2：初始化标准目录结构
执行以下命令创建目录：

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

**预期结果：** Vault 已具备知识库运行所需的标准目录。

### 步骤 3：写入 Obsidian 基础配置
创建或补充以下文件：
- `.obsidian/graph.json`：设置图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 配置可支持图谱区分、文件过滤与样式启用。

### 步骤 4：建立多 AI 客户端 skills 链接
使用 `New-Item -ItemType Junction` 将 skills 目录链接至各客户端。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

可按需为以下客户端配置：
- Kimi Code
- Codex CLI
- Claude Code
- Gemini CLI
- Cursor
- Windsurf

**预期结果：** 多个客户端共享同一套 skills。

### 步骤 5：配置 SOP 专用 skill
在 `skills/wiki-sop/` 下创建 `SKILL.md`，定义以下能力：
- 自动检查 `status: sop-ready` 资料
- 手动按主题生成 SOP
- source 更新后提示 SOP 更新
- 检查步骤可执行性、清单完整性与回链关系

**预期结果：** 已具备 SOP 专用能力定义，可被客户端调用。

### 步骤 6：配置 hooks 实现自动检查
在 `hooks/hooks.json` 的 `SessionStart` 中加入 SOP 自动检查规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 支持 hooks 的客户端在会话开始时会自动提示生成或更新 SOP。

### 步骤 7：建立 source 状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

状态规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 可被自动识别并进入正确的 SOP 沉淀流程。

### 步骤 8：按客户端能力执行 SOP 生成策略
- Claude Code：支持自动检查
- 其他客户端：通常需手动输入“整理SOP”或指定主题触发

推荐流程：
1. 先 ingest 资料
2. 标注 source 状态
3. 自动或手动触发 SOP 生成
4. 将结果保存到 `wiki/sop/`
5. 建立 source 与 SOP 双向链接

**预期结果：** 任一客户端均可按统一流程完成 SOP 沉淀。

### 步骤 9：执行质量检查并维护 SOP
生成或更新 SOP 后，检查：
- 步骤是否可执行
- 是否包含前置条件、步骤、结果、清单、FAQ
- 是否有完整回链
- 是否需依据新增 source 更新 SOP
- 是否执行 `lint the wiki`

**预期结果：** SOP 内容完整、可执行、可追溯，知识库结构持续健康。

## 5. 检查清单
- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已建立所需客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已定义并使用 source 状态字段
- [ ] 已验证 SOP 生成流程可用
- [ ] 已将 SOP 保存至 `wiki/sop/`
- [ ] 已建立 SOP 与 source 的双向链接
- [ ] 已执行知识库维护检查

## 6. 最佳实践
- 优先通过状态字段驱动自动化，而不是依赖人工记忆
- 对高价值经验总结统一打上 `sop-priority: high`
- 所有客户端尽量通过 Junction 共享同一套 skills
- SOP 文件统一存放在 `wiki/sop/`，避免散落
- 每次 source 有新增或变更时，检查是否需要更新现有 SOP
- 定期执行 `lint the wiki` 保持知识库整洁

## 7. FAQ

**Q1：为什么系统没有自动生成 SOP？**  
A：可能是客户端不支持 hooks、source 未标记为 `sop-ready`，或同主题资料尚未达到触发条件。

**Q2：什么资料应标记为 `sop-ready`？**  
A：包含明确步骤、可复用流程、最佳实践或经验总结的资料。

**Q3：纯参考资料如何处理？**  
A：标记为 `status: processed`，不要直接进入 SOP 流程。

**Q4：为什么推荐 Junction？**  
A：因为可多客户端共用一套 skills，减少重复维护。

**Q5：什么时候应更新 SOP？**  
A：当 source 更新晚于 SOP，或新增关键经验与流程变化时。

**Q6：哪些客户端支持自动检查？**  
A：当前资料显示 Claude Code 支持；其他多数客户端需手动触发。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]