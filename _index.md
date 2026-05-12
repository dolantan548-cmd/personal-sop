# SOP 索引

本目录存放从原始资料提炼出的 **标准操作程序 (Standard Operating Procedures)**。

## 活跃 SOP

```dataviewjs
dv.table(
  ["名称", "分类", "状态", "更新日期"],
  dv.pages('"wiki/sop"')
    .where(p => p.type == "sop")
    .sort(p => p.updated, 'desc')
    .map(p => [p.file.link, p.category, p.status, p.updated])
)
```

## 按分类查看

- **dev**: 开发相关 SOP
- **writing**: 写作/内容创作 SOP
- **research**: 研究/调研 SOP
- **workflow**: 工作流程 SOP

## 创建新 SOP

1. 从 `wiki/sources/` 中识别可标准化的流程
2. 复制 `_templates/sop.md` 模板
3. 按模板填写并保存到 `wiki/sop/{category}-{name}.md`
4. 更新本索引

## SOP 生命周期

```
原始资料 → 提炼实践 → 形成SOP → 应用验证 → 定期回顾 → 更新或归档
   ↑___________________________________________________________↓
```
