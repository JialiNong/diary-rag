[English](README.md) · **中文**

# diary-rag

用 Node.js 在本机检索日记。它读取 flomo 导出的 HTML 和 Obsidian 里按年写在一起的笔记，切成带日期的记录，并打开一个只在你电脑上的页面。搜索之后能看到那一天的全文。

日记原文不在这个仓库里。`fixtures/` 是虚构例句。导入结果在 `data/`，你自己的路径在 `.env`。这两处都不会被提交。

## 一天是怎么认出来的

在 Obsidian 的年笔记里，只有整行都是下面这种标记时，才会新开一条记录。句子里提到的日期，以及 `1. 先写简历。` 这种列表，都还是正文。

```text
2026.11          月份，用来确定年份
11.16-11.22      这一周，记在后面每一天上面
11.19            这一天，直到下一个标记之前
```

文件名是 `2026.md`、正文里却没有 `2026.11` 时，年份从文件名来，并标成没那么确定。完全看不出年份的文字会保留，只是没有日期。

flomo 的导出不用切。每一条 `.memo` 就是一条，日期用它自己的 `.time`。

## 使用

```bash
npm install
npm test
cp .env.example .env
```

在 `.env` 里填上 flomo 导出目录和 Obsidian 日记目录，然后：

```bash
npm run ingest
npm run dev
```

打开 http://127.0.0.1:4173 。页面只在这台电脑上。搜索结果是整篇正文。

命令行也可以：

```bash
npm run search -- 面包
npm run on-this-day -- --month 11 --day 19
```

`ingest` 只打印条数和日期范围，不打印日记正文。

## 意思相近

按原词搜索不需要模型。想找到没写下那些词、但意思相近的日子，在本机装一个嵌入模型。大约 639MB。日记在这台 Mac 上转成向量，不会发到别人的接口。

```bash
brew install ollama
brew services start ollama
ollama pull qwen3-embedding:0.6b
npm run embed
```

如果没有 `brew services`，打开 Ollama 应用，或在另一个终端运行 `ollama serve`。然后在页面上选择 **意思相近**。

用来写全年回顾的对话模型是后面的事。试搜索不需要它。

## Postgres

可选。页面读的是 `data/entries.jsonl`，不用先开 Docker。

```bash
docker compose up -d
npm run db:load
```

`sql/001_init.sql` 里一行是一条日记。`day` 用来按日期取。`embedding` 留给以后把向量索引放进数据库。现在页面是在 `npm run embed` 之后，用 Node 做相似度排序。

## 还没做的

全年回顾的成文，以及把某一天接到地图应用上，都还没有。照片和日历仍然留在手机上。
