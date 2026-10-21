# Agent Working Agreement

## 任务
实现 FORMA：英文 UI、白色为主、平面化的健身 Web App。先完成真实训练闭环，再做装饰。此工程包只规定目标与验收，不等同实现结果。

## 阅读顺序与权威
1. 用户当前的明确要求、目标项目已有的上级规则。
2. 本文件及 [产品需求](docs/requirements/prd.md)、[需求目录](docs/requirements/catalog.md)。
3. [状态机](docs/requirements/state-machines.md)、[计算规则](docs/requirements/calculations.md)、[数据模型](docs/architecture/data-model.md)。
4. [视觉系统](docs/design/visual-system.md)、[页面规范](docs/requirements/pages.md)、[验收门槛](docs/acceptance/final-gate.md)。

测试不得放宽需求；需求冲突应写入决策记录并标出受影响条目。涉及数据删除、生产账户、外部发布或新的付费依赖的范围变更，需要项目负责人授权。实现已在范围内的可逆功能不需要逐项询问。

## 开发循环
- 先检查现有项目结构、脚本和约束，保留已有有效代码与用户改动。
- 维护一个当前任务，按 [执行循环](docs/execution/agent-loop.md) 进行：观察 → 最小计划 → 实现 → 验证 → 留证 → 更新状态。
- 新项目默认 React + TypeScript；路由、构建与测试库按项目环境选择并锁定版本。不要仅凭文档宣称某版本是最新。
- 禁止假按钮、随机统计、写死“已同步”、假加载、虚构测试结果、把 seed 数值当实时汇总。
- 所有用户可见文案为英文；文档、代码注释可用中文或英文。
- 所有数据通过 repository 边界读写；不得让页面各自维护同一训练的副本。
- 训练计时以时间戳重算；完成训练必须原子落盘；存储失败不得显示成功。
- 没有可执行环境时保留具体验证步骤并标为 BLOCKED，不得将“静态看起来正确”当 PASS。
- 严禁提交真实个人数据、密钥、账号、访问令牌。示例数据必须是合成数据。
- 每个阶段完成后运行针对性检查；修复后重跑受影响测试。保持差异可审阅，避免无关重构。

## 完成定义
[全部 P0 需求](docs/requirements/catalog.md) 都有实现证据与实测结果；类型、构建、领域、组件、端到端、视觉及无障碍检查符合 [最终门槛](docs/acceptance/final-gate.md)。填写报告，列出命令、退出码、截图路径、未解决风险及运行说明。未满足时明确报告 PARTIAL / BLOCKED，不能声明“全部完成”。
