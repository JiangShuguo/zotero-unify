# Zotero Unify（归一）

与 [Ethereal Style](https://github.com/MuiseDestiny/zotero-style) 配合使用的 Zotero 插件：规范期刊/会议名称，并辅助识别 USENIX 论文会场元数据，以便 Style 正确显示 CCF 等标签。

| 项目 | 说明 |
| --- | --- |
| 插件 ID | `unify@jsg.local` |
| 版本 | 1.0.0 |
| 作者 | jsg |
| 兼容 | Zotero 7.x – 10.* |
| 许可证 | MIT |

---

## 背景与动机

[Ethereal Style](https://github.com/MuiseDestiny/zotero-style) 可通过 easyscholar 等数据源，在 Zotero 列表中显示论文所属会议/期刊的分区信息（如 CCF、SCI、影响因子）。

在实际使用中，常遇到两类障碍：

1. **Style 本身需要按需配置**。默认设置往往更偏重 SCI 类指标；若未合理配置 Fields、Map、Sort By 与 Journal Aliases，计算机类会议论文很容易看不到 CCF 等期望标签。
2. **条目上的会场名与查询名不一致**。Crossref 或 PDF 导入得到的 `publicationTitle`、`proceedingsTitle`、`conferenceName` 常为带年份的长名或全称，而 easyscholar 通常只认固定短名（如 `SIGCOMM`、`INFOCOM`、`USENIX Security Symposium`）。名称对不上时，标签列为空或结果不全。此外，Zotero 导入 USENIX 论文 PDF 时，往往无法自动补全会议等会场元数据。

因此需要：（a）在 Ethereal Style 中配好标签相关选项与别名；（b）用 Unify 把条目会场字段规范为可查询的名称，并在可行时补全 USENIX 会场信息。**标签文字仍由 Ethereal Style 生成**，Unify 不直接写入 CCF 等标签。

---

## 功能说明

本插件只做两件事：

### 1. 转化期刊 / 会议名称

将条目中与标签查询相关的会场字段，规范为 Ethereal Style / easyscholar 更容易命中的名称。

- **可修改：** `conferenceName`、`proceedingsTitle`；期刊的 `publicationTitle`（仅在已有名称可规范缩短时）；必要时将类型调为 `conferencePaper`。
- **不修改：** 标题、作者、日期、DOI、URL、摘要等与正文相关的元数据。

### 2. 辅助识别 USENIX 会场元数据

Zotero 导入 USENIX 论文 PDF 时，常无法自动补全会议名等字段。Unify 可在导入后辅助填写 `conferenceName`、`proceedingsTitle`等（`publisher` 为空时可填 `USENIX Association`），以便 Style 显示标签。

**PDF 要求：** 拖入的 PDF 应带有 **USENIX 官方封面页**。该封面通常包含协会标识与名称、论文标题与作者、论文页面链接，以及明确的会场说明（例如“This paper is included in the Proceedings of the 35th USENIX Security Symposium”），并附有会议日期、地点与 ISBN 等信息。若仅导入无封面、仅含正文首页的 PDF（会场名以图形或无法被文本抽取），本插件通常无法可靠识别，Style 标签也可能不会出现。

建议从 [USENIX 官网](https://www.usenix.org/) 论文页面下载带封面的正式 PDF 后再导入 Zotero。

---

## Ethereal Style：期刊标签配置

在 Ethereal Style 中打开期刊标签设置。**Source** 选 `easyscholar`，**API Key** 在 Style 界面申请后填入。

参考文件：

- [`unify/STYLE_PUBLICATION_TAGS.txt`](unify/STYLE_PUBLICATION_TAGS.txt)（Fields / Map / Sort By）
- [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt)（Journal Aliases）

### Fields

```text
ccf, sciif, sci, sciUp, sciBase, eii
```

### Map

```text
北大中文核心=北核, SCIIF=IF, SCIIF(5)=IF(5), SCI基础版=中科院, SCI升级版=中科院, CCF=CCF, EI检索=EI
```

### Sort By

```text
ccf, sci, -sciif
```

### Journal Aliases

将 [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) 全部内容粘贴到 Style 的 Journal Aliases（或与现有别名合并）。每行一组 `A = B`；仅影响 Style 查询映射，**不会改变** Zotero 条目中的期刊/会议字段本身。

---

## 适用范围

优先面向**计算机**领域中与网络、系统、安全相关的常见会议与期刊，例如：

- 会议：USENIX Security、USENIX ATC、NSDI、OSDI、NDSS、CCS、S&P、SIGCOMM、INFOCOM、IMC、CoNEXT、MobiCom、SOSP、ASPLOS、EuroSys、ICNP、ICDCS、ICSE 等；
- 期刊：TON、JSAC、TDSC、TIFS、TOPS、Computers & Security、Computer Networks、TNSM、Cybersecurity 等。

未命中映射时，Unify 不修改原字段。

---

## 安装 Unify

1. 从 [Releases](https://github.com/JiangShuguo/zotero-unify/releases) 下载 `unify.xpi`，或本地执行：

```text
python unify/tools/inspect_and_build.py
```

（需要 Python 3.8+；输出 `unify/build/unify.xpi`。）

2. Zotero → 工具 → 插件 → 齿轮 → **从文件安装插件…** → 选择 `unify.xpi`。
3. 确认 **Unify** 已启用，重启 Zotero，并完成上文 Ethereal Style 配置。

---

## 仓库结构

```text
unify/
  bootstrap.js                 插件入口
  manifest.json
  src/                         源码
  tools/inspect_and_build.py   打包
  STYLE_PUBLICATION_TAGS.txt   Style：Fields / Map / Sort By
  JOURNAL_ALIASES.txt          Style：Journal Aliases
  updates.json
```

---

## 许可证

MIT
