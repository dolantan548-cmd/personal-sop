---
type: sop
category: workflow
status: active
created: 2026-05-14
updated: 2026-05-14
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置_1]]"
  - "[[2026-05-12-full-chat-session]]"
  - "[[2026-05-12-session-summary]]"
  - "[[claude-obsidian-ecosystem-research_1]]"
  - "[[example-docker-compose-setup]]"
  - "[[example-docker-deploy-guide]]"
  - "[[example-k8s-deploy-notes]]"
tags: [sop, workflow]
---

# SOP: 自动化知识库部署、资料摄入、SOP 生成与多端发布

## 1. 目的

本 SOP 用于标准化搭建和运行一个以 `claude-obsidian` 为核心的自动化知识库系统。该系统的目标是：

- 接收 `.raw/` 中的原始资料
- 自动或手动整理为 `wiki/sources/` 结构化笔记
- 将高复用价值的资料沉淀为 `wiki/sop/` 标准操作程序
- 在多个 AI 客户端中复用知识与 SOP
- 同步到 Git 仓库、Vercel 站点、飞书通知等外部系统

---

## 2. 适用场景

- 个人知识中台建设
- 多 AI 客户端共享同一知识库
- 原始资料持续摄入与结构化整理
- 流程知识标准化沉淀
- SOP 自动生成与统一发布
- 自动化备份、文档站点展示与通知联动

---

## 3. 前置条件

- 已准备本地工作目录，例如 `D:\dolan_env\temp\project\personal`
- 已安装 Git、Python，必要时安装 Node.js
- 可访问 `claude-obsidian` 项目仓库
- 已具备可用 AI API
- 已有 GitCode、GitHub、Vercel 账户
- 可选：飞书 Webhook 机器人
- 可选：SSH、Docker、Docker Compose、Kubernetes 环境
- 已明确以下目录结构：
  - `.raw/`
  - `wiki/sources/`
  - `wiki/sop/`
  - `wiki/concepts/`
  - `wiki/entities/`
  - `wiki/meta/`

---

## 4. 标准流程

### 步骤 1：初始化知识库目录与项目代码

在目标目录中克隆项目并完成知识库初始化。

**操作要点：**
- 克隆 `claude-obsidian` 项目
- 补齐基础目录结构
- Windows 环境下手动完成 `setup-vault.sh` 的等效初始化
- 配置 `.obsidian/graph.json`、`app.json`、`appearance.json`

**成功标准：**
- 本地目录结构完整
- Obsidian 可正常打开知识库
- 后续 ingest、query、lint 流程可继续配置

---

### 步骤 2：建立知识分类与状态流转规范

统一定义资料从输入到 SOP 的生命周期。

**推荐状态流转：**

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

**状态说明：**
- `raw`：原始资料
- `processed`：已整理为结构化笔记
- `archived`：归档资料
- `sop-ready`：具备 SOP 提炼价值
- `synthesized`：已生成 SOP

**自动标记规则：**
- 包含分步骤操作流程 → `status: sop-ready`
- 包含最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**成功标准：**
- 团队对何时进入 `sources`、何时生成 `SOP` 有统一规则

---

### 步骤 3：配置标准化笔记与 SOP 模板

为 sources 与 SOP 建立统一格式。

**source frontmatter 建议字段：**
- `title`
- `type`
- `created`
- `updated`
- `tags`
- `related_sources`
- `status`
- `sop_ready`

**SOP 模板建议字段：**
- `title`
- `purpose`
- `scenarios`
- `prerequisites`
- `steps`
- `checklist`
- `faq`
- `related_sources`

**还应维护：**
- `_templates/sop.md`
- `wiki/sop/_index.md`
- `wiki/sources/_index.md`
- `wiki/concepts/_index.md`

**成功标准：**
- 新文档结构统一，便于 AI 生成、检索、回链和发布

---

### 步骤 4：配置多 AI 客户端接入规则

在不同客户端中声明如何使用知识库。

**建议配置文件：**
- `CLAUDE.md`
- `KIMI.md`
- `CODEX.md`
- `GEMINI.md`
- `.cursor/rules/claude-obsidian.mdc`
- `.windsurf/rules/claude-obsidian.md`

**配置内容至少包括：**
- 知识库位置
- ingest 方式
- SOP 查询方式
- 会话启动后的 SOP 检查要求
- 执行任务时优先引用类似 SOP

**成功标准：**
- 多个 AI 客户端可共享同一套知识与 SOP

---

### 步骤 5：实现 SOP 自动检查与生成触发机制

为知识库加入 SOP 候选扫描逻辑。

**建议文件：**
- `skills/wiki-sop/SKILL.md`
- `hooks/hooks.json`

**Skill 模式：**
- `Auto-Check`
- `Manual`
- `Update`
- `Lint`

**SessionStart 检查逻辑：**
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 若同主题资料数量 `>= 3`
- 或 `sop-priority: high`
- 则提示生成 SOP

**说明：**
- Claude Code 可原生执行 hooks
- 其他客户端需手动触发、重启加载或通过项目协议实现

**成功标准：**
- SOP 候选资料可被系统稳定识别

---

### 步骤 6：执行原始资料摄入

将新资料放入 `.raw/` 并转换为结构化笔记。

**自动模式：**
- 使用 ingest 命令或 daemon 自动生成 `wiki/sources/`

**手动模式：**
1. 阅读 `.raw/` 原文
2. 判断分类：`concepts` / `entities` / `sources` / `sop`
3. 创建结构化 Markdown 笔记
4. 补全 frontmatter
5. 建立 `[[wikilink]]`
6. 更新对应 `_index.md`

**成功标准：**
- 原始资料已整理为标准化 source 笔记

---

### 步骤 7：生成并维护 SOP

对 `sop-ready` 的 source 进行汇总提炼。

**提炼内容应包含：**
- 适用场景
- 前置条件
- 标准步骤
- 预期结果
- 验证方式
- 常见异常与处理
- 最佳实践

**输出要求：**
- 写入 `wiki/sop/`
- 更新 `wiki/sop/_index.md`
- 回链相关 source
- 将 source 标记为 `synthesized` 或补充双向引用

**成功标准：**
- 输出的 SOP 可被他人直接执行

---

### 步骤 8：配置 daemon 自动流程

在 API 可用时启用全流程自动化。

**示例命令：**

```bash
python scripts\daemon\auto_daemon.py --mode auto --once
```

**自动动作应包括：**
1. 扫描 `.raw/` 新文件
2. 调用 AI API 生成 `wiki/sources/`
3. 检查 `sop-ready` 并自动生成 SOP
4. 推送 Git 仓库
5. 发送飞书通知
6. 可选同步到服务器

**成功标准：**
- 单次执行可完成摄入、整理、生成、同步和通知

---

### 步骤 9：配置 Git 同步与敏感信息管理

建立远程备份并控制凭据泄露风险。

**要求：**
- 初始化或连接 GitCode / GitHub 仓库
- 首次提交并推送 `main` 分支
- 如需 SOP 独立站点，可单独同步 `wiki/sop/`
- 不得在 wiki 中明文写入 token、密码、完整 webhook

**成功标准：**
- 远程仓库可正常拉取与推送
- 敏感配置仅保存在安全位置

---

### 步骤 10：发布到 Vercel 或静态文档站点

提供知识库和 SOP 的 Web 访问入口。

**主 Wiki 发布建议：**
- 使用 Docsify 零构建模式
- 准备 `index.html`
- 准备 `wiki/_sidebar.md`

**SOP 独立站点建议：**
- 单独仓库或单独目录发布
- 仅暴露 `wiki/sop/`

**成功标准：**
- 公网地址可访问
- Markdown 内容渲染正常
- 导航与索引可用

---

### 步骤 11：配置飞书通知

在 SOP 生成与同步完成后发送消息。

**配置文件：**
- `.watchdog/config.yaml`

**示例结构：**

```yaml
feishu:
  enabled: true
  webhook: "https://open.feishu.cn/open-apis/bot/v2/hook/..."
```

**建议动作：**
- 先发送测试消息
- 再接入 daemon 自动通知
- 通知内容可包含 SOP 名称、来源、发布时间、链接

**成功标准：**
- 飞书群可收到自动消息

---

### 步骤 12：执行质量检查、部署验证与持续维护

持续保证知识质量与自动化可靠性。

**知识库检查：**
- 运行 wiki lint
- 检查步骤是否可执行
- 检查 frontmatter 是否完整
- 检查索引是否更新
- 检查回链与 wikilink 是否存在

**Docker 最佳实践：**
- 使用多阶段构建
- 使用 git 短哈希做镜像版本标签
- 使用 `/health` 健康检查
- 启用 BuildKit 缓存

**Docker Compose 建议：**
- 使用 `restart: unless-stopped`
- 使用 `healthcheck`
- 使用命名卷持久化
- 使用 Docker secrets 管理密码

**Docker Compose 验证命令：**

```bash
docker-compose ps
docker-compose logs -f --tail=100 app
docker stats
```

**Kubernetes 建议：**
- 使用 `RollingUpdate`
- 配置 `readinessProbe` 与 `livenessProbe`
- 配置 resources requests/limits

**Kubernetes 验证命令：**

```bash
kubectl rollout status deployment/myapp
kubectl get pods -l app=myapp
kubectl get svc myapp
kubectl rollout undo deployment/myapp
```

**成功标准：**
- 文档质量稳定
- 部署链路可验证、可监控、可回滚

---

## 5. 检查清单

- [ ] 已完成本地知识库初始化
- [ ] 已建立标准目录结构
- [ ] 已定义状态流转规则
- [ ] 已配置 source 与 SOP 模板
- [ ] 已接入至少一个 AI 客户端
- [ ] 已配置 SOP 自动检查机制
- [ ] 已成功 ingest 至少一份 `.raw/` 资料
- [ ] 已生成至少一份 SOP
- [ ] 已更新所有必要索引
- [ ] 已完成 Git 远程同步
- [ ] 已完成站点发布验证
- [ ] 已完成飞书通知测试
- [ ] 已确认敏感信息未公开泄露
- [ ] 已建立 lint 与验证机制

---

## 6. 常见问题

### Q1：AI ingest 返回 403，怎么办？
应检查 API key 是否支持通用调用。某些面向特定产品的 key 不能直接用于知识整理接口，应更换为平台正式 API key。

### Q2：哪些客户端支持自动 SOP 检查？
Claude Code 原生支持 `hooks.json`。其他客户端通常仅支持 skills 自动发现，需要手动或半自动补足。

### Q3：API 不可用时还可以继续整理吗？
可以，按手动流程处理 `.raw/` 资料，并人工生成结构化笔记和 SOP。

### Q4：哪些资料应该标记为 `sop-ready`？
凡是包含可复用流程、明确步骤、最佳实践、经验总结、异常处理方法的资料，都应考虑标记为 `sop-ready`。

### Q5：如何避免凭据泄露？
不要在 wiki、公开仓库或 SOP 中明文保存 token、密码或完整 webhook。应使用本地安全配置、环境变量或密钥管理机制。

### Q6：如果服务器 SSH 同步失败怎么办？
先切换到 Vercel 作为主发布链路，再排查 `authorized_keys` 权限、SSH 配置和本地工具链问题。

### Q7：容器化部署后的最小验证动作是什么？
Compose 至少检查服务状态、日志和资源；Kubernetes 至少检查 rollout 状态、Pod Ready 状态和 Service 可用性，并保留回滚命令。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置_1]]
- [[2026-05-12-full-chat-session]]
- [[2026-05-12-session-summary]]
- [[claude-obsidian-ecosystem-research_1]]
- [[example-docker-compose-setup]]
- [[example-docker-deploy-guide]]
- [[example-k8s-deploy-notes]]
