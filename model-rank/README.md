# ScanSci 科研模型排行榜原型

直接用浏览器打开 `index.html`。数据是公开来源的快照，不同基准使用独立榜单，不跨基准混排。AstaBench 仅展示智能体名称为 ReAct 且明确标注底层模型的提交，模型为主标题，保留配置和北京时间的提交时间；原始记录的代码版本、运行参数及测试时间仍可能不同，不应把成绩视作脱离配置的纯模型测评。未标注底层模型的条目仍保留在数据快照中，不计入页面排行榜。

页面优先显示原榜公布的更新、评测或论文发布时间。ScienceAgentBench 显示所列模型运行记录文件在原始存储库最近一次提交时间；ChartMimic 显示对应数据文件的 Git 提交时间（核对部署文件与仓库数据一致），两个时间都不表示一定产生了新测评。刷新采集不会产生新评测。ScienceAgentBench 在原榜标注 2026/10/05 成本与 token 计数可能被重复计算，不同条目影响程度不同，其成本及斩杀线仅供参考。

常见模型标识统一为可读名称，版本、推理等级和来源中模型快照的日期予以保留；无法可靠识别的标识原样展示。鼠标悬停模型名称可查看原始标识，搜索同时支持原始标识和展示名称；数据快照与来源链接保持不变。

数据来源与刷新：

- [AIHOT 综合榜](https://aihot.news/leaderboard)：`python -B update_overall.py` 从原榜公开页面读取综合评分、模型上线日期和评测覆盖率，沿用原始名次；AIHOT 的标准化综合分不是百分比，原榜当前只列前 30 个模型。
- AIHOT 斩杀线使用原榜显示的人民币缓存命中、输入和输出价格，按 7∶2∶1 计算每百万 Token 的近似折算价，再与页面展示的综合评分比较；价格或评分的展示精度可能影响接近边界的模型，缺价格的模型不进入图表。DeepSeek V4.1 Flash 1017 采用原榜非高峰价，实际费用取决于用量和服务商定价。
- [Arena 文本榜](https://arena.ai/leaderboard/chat/text)：同一更新脚本读取 [Arena 官方开放数据集](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset)的 `text_style_control` / `latest` / `overall`，展示原始名次、真人偏好评分与投票数。数据按 CC BY 4.0 提供；评分与 AIHOT 分数分开呈现。使用本机已安装的 `pyarrow` 读取官方 Parquet 快照，缺少时回退 Hugging Face 数据集查询接口；各来源更新失败时保留上次有效数据。
- Princeton HAL ScienceAgentBench：`python -B update_data.py`，保留 SAB Self-Debug 配置和原榜 token 总成本。
- [INSPIRE 2026 年预印本](https://arxiv.org/html/2609.33233v1#S4.T2)：`python -B update_inspire.py`，读取论文表 2 的模型排名。该表是固定论文结果，来源抓取不代表新模型已被测评；任务限计算机科学。
- [Ai2 AstaBench 1.0.0](https://huggingface.co/datasets/allenai/asta-bench-results)：`python -B update_asta.py`，使用 test 测试集各基准的主要指标，每行链接对应原始 JSON，0–1 原始分数显示为 0–100，排序使用原始精度。
- [ChartMimic](https://chartmimic.github.io/)：`python -B update_chart.py`，读取 Direct Mimic 和 Customized Mimic 两组官方榜单，分开展示综合分和代码执行率。该基准评估参考图表的代码生成与复现，不代表所有科研绘图任务。
- [SciConBench](https://sciconbench.cs.princeton.edu/)：最新评测月份的医学系统综述证据综合 F1，展示每个模型的覆盖篇数；文献检索和学术写作页面中是相关能力参考。
- [SWE-bench Science](https://swescience.github.io/)：科学软件问题修复的完成率，反映模型与编程智能体组合，不能直接等同于数据分析能力。
- [Terminal-Bench Science / Vals AI](https://vals-ai.com/benchmarks/terminal-bench-science)：Vals AI 对 70 项多学科研究工作流的评测，筛选 Mini-SWE-agent 配置，涵盖数据处理和建模，但不限于数据分析。
- [PaperBench Science](https://pipelinelab.ai/blog/paperbench-expanded/)：93 项论文复现任务的部分复现分，成绩由评测方论文公布，不等同完整复现率。
- [SciFigure2Code](https://arxiv.org/abs/2609.08155)：2026/09/08 论文固定结果，分别列出纯图和带图注的绘图代码复现；并非持续更新的榜单。
- [AI Writing Benchmark](https://aiwritingbenchmark.com/leaderboard/)：一般英文写作综合成绩，AI 评审分，不直接评估学术准确性或引文。上述六个来源由 `python -B update_recent.py` 刷新；某个来源失败时保留其上一次数据并在页面提示。

运行 `python -B update_all.py` 可逐个更新六组数据；也可只更新某个来源，例如 `python -B update_all.py overall`。各来源独立更新，失败时保留该来源上一次有效快照，并将状态写入 `update-status.js`；页面每五分钟检查本地快照。AstaBench 必须成功读取全部来源文件且各组数据通过检查后才替换快照。

GitHub Actions 的 `model-rank-update.yml` 每天北京时间 03:17 尝试更新并请求 GitHub Pages 重新构建；来源不可用时保留该来源的上次有效快照并显示失败状态。GitHub 的定时任务可能延迟；源站没有新评测时，刷新也不会产生新排名。

ScanSci 图标来自官网 AI 比价页面。厂商标识来自 ScanSci 现有 `src/scansci_html/web/provider-icons/`，其 README 记录为 Cherry Studio 素材副本；官方来源和商标使用授权需发布前核实。
Meta、xAI、StepFun 图标来自 AIHOT 模型榜的厂商标识素材；发布前同样需要核实其来源及商标使用授权。
