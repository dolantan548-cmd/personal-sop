---
title: "配置 Vercel 静态站点自动部署"
type: sop
category: deployment
status: active
created: 2026-05-12
updated: 2026-05-12
tags: [vercel, deployment, docsify, static-site]
related_sources:
  - 2026-05-12-deployment-configuration-session.md
---

# 配置 Vercel 静态站点自动部署

## 概述

将本地 Markdown 知识库通过 Vercel 部署为公网可访问的静态站点，使用 Docsify 自动渲染 Markdown 为网页。

## 前置条件

- Node.js 已安装（`node --version`）
- 已注册 Vercel 账号（建议用 GitHub 账号登录）
- 项目目录下有 Markdown 文件和 `index.html`（Docsify 入口）

## 步骤

### 1. 安装 Vercel CLI

```powershell
npm install -g vercel
```

### 2. 登录 Vercel

```powershell
vercel login
```

会打开浏览器授权，按提示完成。

### 3. 创建 Docsify 入口文件

在项目根目录创建 `index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Wiki</title>
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css">
</head>
<body>
  <div id="app">Loading...</div>
  <script>
    window.$docsify = {
      name: 'My Wiki',
      loadSidebar: true,
      subMaxLevel: 3
    }
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify@4/lib/docsify.min.js"></script>
</body>
</html>
```

### 4. 部署

```powershell
vercel --yes
```

首次部署会询问项目设置，后续直接执行即可。

### 5. 获取公网地址

部署完成后，CLI 会输出两个地址：
- **Production**: `https://项目名-xxx.vercel.app`（临时）
- **Aliased**: `https://项目名.vercel.app`（主域名）

### 6. 连接 GitHub 实现自动部署（可选）

1. 把代码推送到 GitHub
2. 进入 Vercel 项目设置 → Git
3. 连接 GitHub 仓库
4. 以后每次 `git push` 自动重新部署

## 验证

访问 `https://你的项目名.vercel.app`，确认 Markdown 文件正确渲染为网页。

## 故障排查

| 问题 | 解决 |
|------|------|
| 国内访问慢 | 多刷新几次，或等 DNS 生效 |
| 404 错误 | 检查 `vercel.json` 路由配置 |
| Markdown 不渲染 | 确认 `index.html` 中 Docsify 配置正确 |

## 相关配置

- `.watchdog/config.yaml` → `public.platform: "vercel"`
- `vercel.json` → 路由配置（如需要 SPA 支持）
