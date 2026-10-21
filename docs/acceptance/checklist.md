# 最终逐项验收表

执行版本：`9442ba34b3d9916f`；环境：macOS / Node 24.19.0 / Chromium 155 / WebKit 26；执行者：Codex 自动测试与截图审查；日期：2026-10-18 Asia/Shanghai。详细结果见 [最终报告](../../evidence/final-report.md)。

- [x] **AC-01 / NAV-001 — 页面导航**：导航逐个点击；直接打开详情及未知地址。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#nav-001)。
- [x] **AC-02 / NAV-002 — 响应式**：360、390、768、1024、1440、1920px 检查。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#nav-002)。
- [x] **AC-03 / DASH-001 — 动态本周统计**：用固定 fixture 时钟核对精确汇总。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#dash-001)。
- [x] **AC-04 / DASH-002 — 快速开始**：激活计划、开始训练、返回 Dashboard。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#dash-002)。
- [x] **AC-05 / PLAN-001 — 计划浏览**：逐个查看三个模板与 seed 一致。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#plan-001)。
- [x] **AC-06 / PLAN-002 — 计划编辑**：空名、超长、无动作均拒绝；合法保存刷新后保留。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#plan-002)。
- [x] **AC-07 / PLAN-003 — 计划生命周期**：复制编辑、切换激活、取消删除、确认删除。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#plan-003)。
- [x] **AC-08 / WORK-001 — 开始训练**：开始后编辑源计划，活跃训练仍不变。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-001)。
- [x] **AC-09 / WORK-002 — 逐组记录**：键盘完成组；非法数值、零重量边界与重新编辑。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-002)。
- [x] **AC-10 / WORK-003 — 调整动作**：替换取消保留原值，确认后新动作无完成组。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-003)。
- [x] **AC-11 / WORK-004 — 恢复训练**：记录后刷新与重开，读取相同训练 ID。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-004)。
- [x] **AC-12 / WORK-005 — 休息计时**：模拟超过截止时间，显示 Rest complete。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-005)。
- [x] **AC-13 / WORK-006 — 完成训练**：含未完成组结束并确认；历史只包含完成组。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-006)。
- [x] **AC-14 / WORK-007 — 放弃训练**：取消和确认分别检查存储。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#work-007)。
- [x] **AC-15 / HIST-001 — 历史列表**：跨窗口边界和同时间戳排序验证。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#hist-001)。
- [x] **AC-16 / HIST-002 — 历史删除**：删除最高纪录训练，重新求出剩余最高纪录。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#hist-002)。
- [x] **AC-17 / EX-001 — 动作检索**：大小写、空白、无结果和组合过滤。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#ex-001)。
- [x] **AC-18 / EX-002 — 动作详情**：从计划和训练选择动作，返回位置与数据保留。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#ex-002)。
- [x] **AC-19 / PROG-001 — 趋势图表**：固定时钟验证周边界与空周。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#prog-001)。
- [x] **AC-20 / PROG-002 — 个人纪录**：同值按最近完成时间选中；活跃训练不计入。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#prog-002)。
- [x] **AC-21 / BODY-001 — 体重记录**：同日覆盖需提示；单位切换保持 canonical 值。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#body-001)。
- [x] **AC-22 / SET-001 — 单位与目标**：kg→lb→kg 对比底层数值。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#set-001)。
- [x] **AC-23 / DATA-001 — 持久化可靠性**：模拟 quota、安全限制、坏 JSON 与不支持版本。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#data-001)。
- [x] **AC-24 / DATA-002 — 数据导出**：重新解析下载文件并核对所有实体。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#data-002)。
- [x] **AC-25 / DATA-003 — 安全导入**：无效文件、取消、有效替换、写入失败四分支。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#data-003)。
- [x] **AC-26 / DATA-004 — 清除数据**：误输入、取消、确认及刷新。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#data-004)。
- [x] **AC-27 / UX-001 — 状态反馈**：各页空状态和故障注入检查。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#ux-001)。
- [ ] **AC-28 / A11Y-001 — 键盘与语义**：仅键盘完成一次训练与设置修改。 结果：PARTIAL；证据：[逐项实测](../../evidence/requirements.md#a11y-001)。
- [ ] **AC-29 / A11Y-002 — 可读与降动效**：对比度检查、200% 缩放、减少动态效果。 结果：PARTIAL；证据：[逐项实测](../../evidence/requirements.md#a11y-002)。
- [x] **AC-30 / VIS-001 — 视觉与英文**：六个主页面和训练详情截图审查。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#vis-001)。
- [x] **AC-31 / SEC-001 — 数据安全**：脚本样式名称作为纯文本显示，检查网络和源码。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#sec-001)。
- [x] **AC-32 / PERF-001 — 性能与资源**：按性能协议测生产构建与 200 条训练数据。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#perf-001)。
- [ ] **AC-33 / QA-001 — 可构建与证据**：全新依赖安装、构建、测试与最终报告核对。 结果：PARTIAL；证据：[逐项实测](../../evidence/requirements.md#qa-001)。
- [x] **AC-34 / DATA-005 — 多标签页冲突**：两个标签页分别修改同一训练后验证冲突提示。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#data-005)。
- [x] **AC-35 / UX-002 — 未保存输入保护**：输入非法值后切换页面，取消跳转保留输入。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#ux-002)。
- [x] **AC-36 / HIST-003 — 历史不可变**：编辑源计划后重开历史对比快照。 结果：PASS；证据：[逐项实测](../../evidence/requirements.md#hist-003)。

## 交付检查
- [x] 候选代码版本和 lockfile 已记录。
- [x] 新环境安装、启动、生产预览及深链接实测通过。
- [x] 全部约定脚本有真实结果与退出码。
- [x] 固定 fixture 的 2 / 3、4,940kg、75m 断言通过。
- [x] 完成 J01 后的 3 / 3、5,680kg、105m 断言通过。
- [x] 故障、取消、损坏数据、导入与多标签场景通过。
- [ ] 截图与视觉评分、无障碍手工记录完整。
- [x] 性能与第二引擎验证完整。
- [x] 没有未关闭 S0 / S1 / S2。
- [x] 最终报告与使用说明真实、完整。

## 结论
G01 PARTIAL；G02 PASS；G03 PASS；G04 PASS；G05 PARTIAL；G06 PASS；G07 PASS。

最终结论：**PARTIAL — 实现与自动验证已交付，实际读屏和 200% 浏览器缩放未完成人工验收**。见 [待测步骤](../../evidence/manual-checks.md)。
