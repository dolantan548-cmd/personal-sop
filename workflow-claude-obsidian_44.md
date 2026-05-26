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

# SOP: claude-obsidian 知识库部署与 SOP 自动机制配置

## 目的
在 Windows 环境完成 claude-obsidian 知识库部署，并配置 SOP 自动生成与多 AI 客户端集成机制，实现 AI 驱动的知识沉淀与标准化流程输出。

## 适用场景
- 首次部署 claude-obsidian 知识库
- 配置跨 AI 客户端的 SOP 自动生成触发机制
- 新增 AI 客户端工具时配置 skills 链接集成

## 前置条件
- Windows 操作系统（PowerShell）
- Git 已安装并配置
- Obsidian 客户端（可选但推荐）
- 至少安装一个支持的 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）

## 操作步骤

### 1. 克隆项目与目录整理
在 PowerShell 中切换到目标父目录，执行 git clone 拉取项目，并检查是否存在嵌套目录（如出现 claude-obsidian/claude-obsidian 则移出内层文件）。
```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
# 检查并整理嵌套目录
```
**预期结果：** 项目代码完整拉取至本地，目录结构无嵌套重复，根路径为 claude-obsidian/。

### 2. 初始化知识库目录结构
定义 $VAULT 变量为项目根目录，批量创建 Obsidian 工作区、原始资料、知识分类及模板目录。
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
**预期结果：** 所有工作目录创建成功，形成完整的知识库骨架（wiki/{concepts,entities,sources,sop}, .raw, _templates, .obsidian/snippets）。

### 3. 写入 Obsidian 配置文件
向 .obsidian/ 目录写入三项核心配置：graph.json（知识图谱颜色分组，sop 节点为黄色）、app.json（排除 .raw/、.watchdog/ 等 AI 工作文件）、appearance.json（启用自定义 CSS 片段）。
**预期结果：** Obsidian 打开 vault 后，知识图谱正确分组，AI 工作文件被隐藏，CSS 片段生效。

### 4. 配置多 AI 客户端 Skills 链接
在各 AI 客户端 skills 目录创建 Junction（目录联接）指向 $VAULT，保持单一数据源。支持工具包括 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf。
示例（Claude Code）：
```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\claude-obsidian" -Target "$VAULT"
```
其余工具路径对应 ~/.kimi/skills/、~/.codex/skills/、~/.gemini/skills/、.cursor/skills/、.windsurf/skills/。
**预期结果：** 各 AI 客户端重启后可在 skills 列表中加载 claude-obsidian，命令如 ingest、lint the wiki、query: 可直接调用。

### 5. 创建 SOP 生成技能文件
创建 skills/wiki-sop/SKILL.md，定义四大核心功能：自动检查模式（扫描 status: sop-ready 资料）、手动生成模式（按主题聚合生成 SOP）、更新模式（source 新于 SOP 时提示更新）、质量检查（步骤可执行性、检查清单、回链完整性）。
**预期结果：** AI 客户端识别并加载 wiki-sop 技能，支持根据资料生成、更新与维护标准 SOP。

### 6. 配置会话钩子自动检查机制
修改 hooks/hooks.json，在 SessionStart 钩子中加入 SOP AUTO-CHECK 逻辑：扫描 wiki/sources/ 中 status: sop-ready 的笔记；若同主题≥3 个或存在 sop-priority: high，则提示生成 SOP；若 sources 比对应 SOP 新，则提示更新 SOP。
**预期结果：** 每次新会话启动时，AI 自动执行 SOP 检查并给出生成或更新提示。

### 7. 设定资料状态流转与自动标记规则
建立状态流转：ingest → raw → processed → archived 或 processed → sop-ready → synthesized。Auto-marking 规则：包含分步骤操作流程 → status: sop-ready；最佳实践/经验总结 → status: sop-ready + sop-priority: high；纯参考资料 → status: processed。
**预期结果：** AI 在 ingest 或整理笔记时自动标记资料状态，符合条件的笔记进入 SOP 生成候选池并触发后续合成。

## 检查清单
- [ ] 目录结构完整（wiki/{concepts,entities,sources,sop}, .raw, _templates, .obsidian/snippets）
- [ ] .obsidian 下 graph.json、app.json、appearance.json 已正确配置
- [ ] 至少一个 AI 客户端的 skills Junction 创建成功且客户端可识别
- [ ] skills/wiki-sop/SKILL.md 存在且包含四大功能定义
- [ ] hooks/hooks.json 包含 SOP AUTO-CHECK 配置
- [ ] 测试 ingest 命令能正常创建笔记并自动分类到对应子目录
- [ ] 测试 status: sop-ready 标记能被 AI 识别并触发 SOP 生成提示

## 常见问题
**Q: 为什么使用 Junction 而不是直接复制文件夹？**  
A: Junction（目录联接）保持单一数据源，更新知识库时所有 AI 客户端同步获取最新 skills，无需逐个手动复制，避免版本不一致。

**Q: Claude Code 与其他 AI 工具在自动检查上的差异是什么？**  
A: Claude Code 原生支持 hooks.json，可在 SessionStart 和 PostToolUse 等事件自动触发；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等目前需手动输入指令（如“整理SOP”）触发。

**Q: status: sop-ready 的自动标记规则是什么？**  
A: 笔记内容包含分步骤操作流程时标记为 sop-ready；最佳实践或经验总结额外标记 sop-priority: high；纯参考资料仅标记为 processed。

**Q: 如何验证 SOP 自动生成机制是否生效？**  
A: 创建 3 篇同主题且 Frontmatter 中包含 status: sop-ready 的资料，启动 AI 会话，检查是否收到“生成 SOP”的提示。

**Q: Windows 下创建 Junction 失败怎么办？**  
A: 确认目标路径存在且不为空；确保 PowerShell 具有足够权限；也可使用 cmd /c mklink /J "链接路径" "目标路径" 创建。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]