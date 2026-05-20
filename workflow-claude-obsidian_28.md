---
type: sop
category: workflow
status: active
created: 2026-05-21
updated: 2026-05-21
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库，并配置 SOP 自动检查、生成、更新与多 AI 客户端复用机制。目标是让知识沉淀流程从资料摄取、整理、查询到 SOP 生成形成闭环。

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian
- 需要让 AI 自动写笔记、分类和查询知识
- 需要把可复用流程沉淀为 SOP
- 需要在多个 AI 客户端中共享同一套知识能力
- 需要通过状态流转管理 source 到 SOP 的生命周期

---

## 3. 前置条件

- Windows 环境与 PowerShell
- 已安装 Git
- 拥有目标路径读写权限
- 已确定 Vault 路径
- 已安装一个或多个 AI 客户端
- 可编辑 hooks 与配置文件

---

## 4. 标准步骤

### 步骤 1：克隆项目并确认 Vault 根目录

打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如项目目录存在嵌套结构，先整理为单一 Vault 根目录。

**预期结果：** 本地已成功克隆项目，并明确唯一 Vault 路径。

---

### 步骤 2：创建标准目录结构

执行：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** Vault 内已具备标准知识库目录结构。

---

### 步骤 3：写入基础 Obsidian 配置

创建或更新以下配置：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

建议使用统一团队模板，保证不同设备和用户的一致性。

**预期结果：** Obsidian 能正确加载 Vault 配置并识别 SOP 分组。

---

### 步骤 4：建立多 AI 客户端 skills 链接

使用 Windows Junction 将 skills 链接到各客户端。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

按需为以下客户端建立链接：

- Kimi Code
- Codex CLI
- Claude Code
- Gemini CLI
- Cursor
- Windsurf

如目录不存在，先创建上级目录。

**预期结果：** 各客户端可调用同一套 claude-obsidian skills。

---

### 步骤 5：创建 wiki-sop Skill

创建 `skills/wiki-sop/SKILL.md`，至少定义以下机制：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：验证步骤可执行、清单完整、来源回链齐全

建议同时定义命名规范、输出模板与更新策略。

**预期结果：** 已具备专门用于 SOP 生成与维护的 Skill。

---

### 步骤 6：配置 Hooks 自动检查 SOP 机会

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

- 扫描 `wiki/sources/` 下 `status: sop-ready` 的笔记
- 同主题资料数量 `≥3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- source 比 SOP 新时提示更新 SOP

Claude Code 可进一步结合 `PostToolUse` 执行自动维护动作。

**预期结果：** 支持 hooks 的客户端可在会话启动时自动发现 SOP 机会。

---

### 步骤 7：定义 Source 状态流转与自动标记规则

采用统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 含明确步骤流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

要求 AI 自动初判，人工可复核修正。

**预期结果：** source 文档具备统一状态，能稳定触发 SOP 生成逻辑。

---

### 步骤 8：执行知识摄取、整理与查询验证

验证以下能力：

- `ingest`：导入资料并自动记笔记
- 自动分类：进入 `concepts`、`entities`、`sources`
- `lint the wiki`：执行维护检查
- `query:`：执行知识检索

重点检查 source 文档是否包含正确的状态字段。

**预期结果：** 摄取、整理、维护、查询链路全部可用。

---

### 步骤 9：生成或更新 SOP 文档

当触发条件满足时：

1. 汇总同主题 `sop-ready` sources
2. 提炼共通步骤、前置条件、异常与检查项
3. 生成 SOP 到 `wiki/sop/`
4. 添加到 source 的回链
5. 如已存在 SOP，则执行更新而非重复创建

不支持 hooks 的客户端，可手动输入“整理SOP”或指定主题来触发。

**预期结果：** `wiki/sop/` 中形成结构完整、可执行、可追溯的 SOP。

---

### 步骤 10：按客户端能力建立维护节奏

建议运行方式：

- Claude Code：优先使用自动 hooks 检查
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：使用 skills 手动触发

建议维护节奏：

- 每次 ingest 后检查一次资料状态
- 定期运行 `lint the wiki`
- 优先处理 `sop-priority: high`
- source 更新后检查对应 SOP 是否需要同步更新

**预期结果：** 系统具备持续运行与持续更新能力。

---

## 5. 检查清单

- [ ] 已成功克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已建立目标客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已定义并使用 source 状态流转
- [ ] 已验证 ingest、lint、query 功能
- [ ] 已生成至少一份 SOP
- [ ] 已确认 SOP 含步骤、清单和来源回链

---

## 6. 最佳实践

- 统一使用一个 Vault，避免多份知识库分叉
- 使用 Junction 而非复制目录，减少维护成本
- 仅将可复用流程标记为 `sop-ready`
- 高价值经验内容应加 `sop-priority: high`
- 生成 SOP 前尽量汇总多个同主题 source，提高稳定性
- 每份 SOP 必须保留来源回链，确保可追溯
- 对不支持 hooks 的客户端，保持相同 Skill 规则，靠手动触发补齐自动化能力

---

## 7. 常见问题

**Q1：这个项目原生支持 SOP 自动生成吗？**  
A：具备模板与知识处理基础能力，但自动 SOP 检查和多客户端引用需要额外配置。

**Q2：Windows 没有 setup 怎么办？**  
A：直接用 PowerShell 创建目录和配置文件即可，效果等同。

**Q3：哪些客户端支持自动检查？**  
A：Claude Code 支持 hooks 自动检查；其他客户端通常需要手动触发 Skill。

**Q4：什么时候标记为 `sop-ready`？**  
A：当资料具备明确步骤或可复用实践时标记；纯参考资料保持 `processed`。

**Q5：为什么建议 3 份同主题资料再生成 SOP？**  
A：可提高 SOP 的完整性与可靠性，减少单一资料偏差。

**Q6：什么时候应更新 SOP？**  
A：当 source 比 SOP 更新，或 source 中新增关键步骤与约束时。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
