# Zotero Unify

与 [Ethereal Style](https://github.com/MuiseDestiny/zotero-style) 配合使用的 [Zotero](https://www.zotero.org/) 插件。将期刊/会议会场字段改写为 easyscholar 可查询的名称，在 PDF 封面文本可用时补全 USENIX 会场字段，并可通过条目右键菜单重新执行 Zotero 元数据识别。

CCF 等分区标签仍由 Ethereal Style 生成与显示，Unify 不写入这些标签。

[English](README.md)

| 项目 | 说明 |
| --- | --- |
| 版本 | 1.3.0 |
| 作者 | jsg |
| 兼容 | Zotero 7.x – 10.* |
| 许可证 | MIT |

---

## 用途

Ethereal Style 可通过 easyscholar 在条目列表中显示会场分区（CCF、SCI、影响因子等）。标签出现需要同时满足：

1. Style 已按需求配置 Fields / Map / Sort By / Journal Aliases（默认更偏 SCI 类字段；计算机会议的 CCF 标签通常需要额外配置）。
2. 条目上的会场字符串能对应 easyscholar 的查询名（例如 `SIGCOMM`、`INFOCOM`、`USENIX Security Symposium`）。导入结果里 `publicationTitle`、`proceedingsTitle`、`conferenceName` 常是带年份的长名，导致标签列为空。
3. 条目具备可用的会场元数据。PDF 识别失败，或 USENIX PDF 未填会议字段时，Style 没有可查询的名称。

Unify 处理上述第 2、3 点；第 1 点与标签展示仍由 Style 负责。

---

## 行为说明

### 会场名称规范

将可识别的会场字符串映射为 Style / easyscholar 使用的固定查询名。

| | |
| --- | --- |
| 可能修改 | `conferenceName`、`proceedingsTitle`；期刊 `publicationTitle`（已有名称命中已知会场时）；必要时将条目类型设为 `conferencePaper`。会场字段皆空时，也可经 Crossref 填写空的 `DOI` / `date` / `url` |
| 不修改 | 标题、作者、摘要等正文相关字段；已有非空的 DOI/会场/日期/URL 不会被覆盖 |
| 触发时机 | 新条目加入（`add` 通知）；选中条目后右键 **Unify** |
| 未命中映射 | 保持原字段不变 |

### 空会场补全顺序

当 `conferenceName` / `proceedingsTitle` / `publicationTitle` 均为空时：

1. 本地 USENIX 线索（题名 / URL / 文件名）
2. Crossref 题名检索（仅高置信度题名匹配）
3. 单次读取 PDF 文本（USENIX 封面或其他已映射会议）

### USENIX 会场字段

对 USENIX 论文，可根据本地线索或封面页文本填写 `conferenceName` / `proceedingsTitle`；若 `publisher` 为空，可填 `USENIX Association`。

依赖 PDF 含有 **USENIX 官方封面页**（协会标识、题名作者、论文链接，以及类似 “This paper is included in the Proceedings of the 35th USENIX Security Symposium” 的会场说明）。仅有正文首页、封面文本无法抽取时，通常无法仅靠 PDF 补全。建议从 [USENIX](https://www.usenix.org/) 论文页下载官方 PDF。

### 右键菜单：Unify

对选中的一个或多个条目依次：

1. 按 Zotero 原生流程重新识别 PDF/文档元数据；
2. 规范会场/期刊名称（含上述空会场补全）。

---

## Ethereal Style 配置

在 Ethereal Style 的期刊标签设置中：**Source** 选 `easyscholar`，填入 Style 界面提供的 **API Key**。

仓库内参考文件：

- [`unify/STYLE_PUBLICATION_TAGS.txt`](unify/STYLE_PUBLICATION_TAGS.txt) — Fields / Map / Sort By
- [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) — Journal Aliases

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

将 [`unify/JOURNAL_ALIASES.txt`](unify/JOURNAL_ALIASES.txt) 全文粘贴到 Style 的 Journal Aliases。每行格式为：`规范名 = 规范名`。Unify 先把导入时的多种写法改成该规范名，再由 Style 查询 easyscholar。

---

## 覆盖范围

以计算机领域中网络、系统、安全相关的常见会场为主，例如：

- 会议：USENIX Security、USENIX ATC、NSDI、OSDI、NDSS、CCS、S&P、SIGCOMM、INFOCOM、IMC、CoNEXT、IWQoS、ICC、NOSSDAV、ISCC、IPCCC、ICNP、ICDCS 以及映射表中的其他会议
- 期刊：TON、JSAC、TDSC、TIFS、TPDS、TMC、TSC、TC、IEEE Network、Computer Networks、Computers & Security 以及映射表中的其他期刊

Style 别名完整列表见 `JOURNAL_ALIASES.txt`；匹配规则见 `unify/src/venue-map.js`。

---

## 安装

1. 从 [Releases](https://github.com/JiangShuguo/zotero-unify/releases) 下载 `unify.xpi`，或本地构建：

```text
python unify/tools/inspect_and_build.py
```

需要 Python 3.8+。输出：`unify/build/unify.xpi`。

2. Zotero → 工具 → 插件 → 齿轮 → **从文件安装插件…** → 选择 `unify.xpi`。
3. 启用 **Unify**，重启 Zotero，再按上文配置 Ethereal Style。

---

## 仓库结构

```text
unify/
  bootstrap.js                   插件入口
  manifest.json
  src/                           venue-map、crossref、normalizer、usenix、unify
  tools/inspect_and_build.py     打包 XPI
  tools/validate_aliases.py      用 easyscholar 校验规范名
  JOURNAL_ALIASES.txt            Style Journal Aliases
  STYLE_PUBLICATION_TAGS.txt     Style Fields / Map / Sort By
  updates.json
```

---

## 许可证

MIT
