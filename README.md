# diary-rag

Local diary search in Node.js. It reads a flomo HTML export and Obsidian year notes, cuts them into dated entries, and lets you search or open “this day in earlier years” on your own machine.

本机的日记检索。程序读取 flomo 导出的 HTML，以及 Obsidian 里按年写在一起的日记，切成带日期的一条条记录。搜索和「去年今日」都在你自己的电脑上完成。

## 日记不在这个仓库里

这里只有代码和 `fixtures/` 里的虚构例句。你的原文留在原来的 Obsidian 和 flomo 导出里。导入结果写到 `data/`，`.env` 里是你自己的路径，这两处都不会被提交。

## 一篇日记怎么被认出来

Obsidian 的年文件里，只有整行都是下面这种标记时，才会切开。句子里面提到日期，或者 `1. 先写简历。` 这种列表，都还是正文。

```text
2026.11          月份，用来确定年份
11.16-11.22      这一周，记在后面每一天上面，本身不是一条日记
11.19            这一天，直到下一个标记之前都算这天的正文
```

文件名是 `2026.md`、但正文里没有 `2026.11` 时，年份从文件名来，日期标记为没那么确定。完全看不出年份的，仍会保留正文，只是没有日期。

flomo 的导出不用切。每一条 `.memo` 就是一条，日期用它自己的 `.time`。

## 使用

```bash
npm install
npm test
cp .env.example .env
```

在 `.env` 里填上你的 flomo 导出目录和 Obsidian 日记目录，然后：

```bash
npm run ingest
npm run search -- 面包
npm run on-this-day -- --month 11 --day 19
```

`ingest` 只打印条数和日期范围，不把正文打到终端里。搜索会打出命中的那一天和一小段原文，这只出现在你自己的屏幕上。

Postgres 用本机 Docker，数据不出电脑：

```bash
docker compose up -d
npm run db:load
```

连接串在 `.env.example` 里。表结构是 `sql/001_init.sql`，一行是一条日记，`day` 用来按日期取，`embedding` 留给下一步的语义搜索。

## 现在还没做的

关键词能找到写过那个词的日子。「去年今日」按月和日取。意思相近、但没用同一个词的内容，要等本机的千问嵌入模型写进 `embedding` 之后才能找。全年回顾也还没接上。`src/embed.ts` 里留了调用本机 Ollama 的函数。

这是给自己用的检索，也是后面接到地图应用上的日期索引。手机上的照片和日历仍然留在手机里。
