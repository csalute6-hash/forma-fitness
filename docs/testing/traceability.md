# 需求 → 测试 → 验收追踪矩阵

每条 P0 有唯一主验收用例 AC-xx；实现时在 Result/Evidence 填入实测信息。`NOT_RUN` 不是失败，也不是通过；正式交付不能有未测 P0。

| Requirement | Test ID | Acceptance | 验证摘要 | Result / Evidence |
|---|---|---|---|---|
| NAV-001 | TC-01 | AC-01 | 导航逐个点击；直接打开详情及未知地址。 | PASS / [actual evidence](../../evidence/requirements.md#nav-001) |
| NAV-002 | TC-02 | AC-02 | 360、390、768、1024、1440、1920px 检查。 | PASS / [actual evidence](../../evidence/requirements.md#nav-002) |
| DASH-001 | TC-03 | AC-03 | 用固定 fixture 时钟核对精确汇总。 | PASS / [actual evidence](../../evidence/requirements.md#dash-001) |
| DASH-002 | TC-04 | AC-04 | 激活计划、开始训练、返回 Dashboard。 | PASS / [actual evidence](../../evidence/requirements.md#dash-002) |
| PLAN-001 | TC-05 | AC-05 | 逐个查看三个模板与 seed 一致。 | PASS / [actual evidence](../../evidence/requirements.md#plan-001) |
| PLAN-002 | TC-06 | AC-06 | 空名、超长、无动作均拒绝；合法保存刷新后保留。 | PASS / [actual evidence](../../evidence/requirements.md#plan-002) |
| PLAN-003 | TC-07 | AC-07 | 复制编辑、切换激活、取消删除、确认删除。 | PASS / [actual evidence](../../evidence/requirements.md#plan-003) |
| WORK-001 | TC-08 | AC-08 | 开始后编辑源计划，活跃训练仍不变。 | PASS / [actual evidence](../../evidence/requirements.md#work-001) |
| WORK-002 | TC-09 | AC-09 | 键盘完成组；非法数值、零重量边界与重新编辑。 | PASS / [actual evidence](../../evidence/requirements.md#work-002) |
| WORK-003 | TC-10 | AC-10 | 替换取消保留原值，确认后新动作无完成组。 | PASS / [actual evidence](../../evidence/requirements.md#work-003) |
| WORK-004 | TC-11 | AC-11 | 记录后刷新与重开，读取相同训练 ID。 | PASS / [actual evidence](../../evidence/requirements.md#work-004) |
| WORK-005 | TC-12 | AC-12 | 模拟超过截止时间，显示 Rest complete。 | PASS / [actual evidence](../../evidence/requirements.md#work-005) |
| WORK-006 | TC-13 | AC-13 | 含未完成组结束并确认；历史只包含完成组。 | PASS / [actual evidence](../../evidence/requirements.md#work-006) |
| WORK-007 | TC-14 | AC-14 | 取消和确认分别检查存储。 | PASS / [actual evidence](../../evidence/requirements.md#work-007) |
| HIST-001 | TC-15 | AC-15 | 跨窗口边界和同时间戳排序验证。 | PASS / [actual evidence](../../evidence/requirements.md#hist-001) |
| HIST-002 | TC-16 | AC-16 | 删除最高纪录训练，重新求出剩余最高纪录。 | PASS / [actual evidence](../../evidence/requirements.md#hist-002) |
| EX-001 | TC-17 | AC-17 | 大小写、空白、无结果和组合过滤。 | PASS / [actual evidence](../../evidence/requirements.md#ex-001) |
| EX-002 | TC-18 | AC-18 | 从计划和训练选择动作，返回位置与数据保留。 | PASS / [actual evidence](../../evidence/requirements.md#ex-002) |
| PROG-001 | TC-19 | AC-19 | 固定时钟验证周边界与空周。 | PASS / [actual evidence](../../evidence/requirements.md#prog-001) |
| PROG-002 | TC-20 | AC-20 | 同值按最近完成时间选中；活跃训练不计入。 | PASS / [actual evidence](../../evidence/requirements.md#prog-002) |
| BODY-001 | TC-21 | AC-21 | 同日覆盖需提示；单位切换保持 canonical 值。 | PASS / [actual evidence](../../evidence/requirements.md#body-001) |
| SET-001 | TC-22 | AC-22 | kg→lb→kg 对比底层数值。 | PASS / [actual evidence](../../evidence/requirements.md#set-001) |
| DATA-001 | TC-23 | AC-23 | 模拟 quota、安全限制、坏 JSON 与不支持版本。 | PASS / [actual evidence](../../evidence/requirements.md#data-001) |
| DATA-002 | TC-24 | AC-24 | 重新解析下载文件并核对所有实体。 | PASS / [actual evidence](../../evidence/requirements.md#data-002) |
| DATA-003 | TC-25 | AC-25 | 无效文件、取消、有效替换、写入失败四分支。 | PASS / [actual evidence](../../evidence/requirements.md#data-003) |
| DATA-004 | TC-26 | AC-26 | 误输入、取消、确认及刷新。 | PASS / [actual evidence](../../evidence/requirements.md#data-004) |
| UX-001 | TC-27 | AC-27 | 各页空状态和故障注入检查。 | PASS / [actual evidence](../../evidence/requirements.md#ux-001) |
| A11Y-001 | TC-28 | AC-28 | 仅键盘完成一次训练与设置修改。 | PARTIAL / [actual evidence](../../evidence/requirements.md#a11y-001) |
| A11Y-002 | TC-29 | AC-29 | 对比度检查、200% 缩放、减少动态效果。 | PARTIAL / [actual evidence](../../evidence/requirements.md#a11y-002) |
| VIS-001 | TC-30 | AC-30 | 六个主页面和训练详情截图审查。 | PASS / [actual evidence](../../evidence/requirements.md#vis-001) |
| SEC-001 | TC-31 | AC-31 | 脚本样式名称作为纯文本显示，检查网络和源码。 | PASS / [actual evidence](../../evidence/requirements.md#sec-001) |
| PERF-001 | TC-32 | AC-32 | 按性能协议测生产构建与 200 条训练数据。 | PASS / [actual evidence](../../evidence/requirements.md#perf-001) |
| QA-001 | TC-33 | AC-33 | 全新依赖安装、构建、测试与最终报告核对。 | PARTIAL / [actual evidence](../../evidence/requirements.md#qa-001) |
| DATA-005 | TC-34 | AC-34 | 两个标签页分别修改同一训练后验证冲突提示。 | PASS / [actual evidence](../../evidence/requirements.md#data-005) |
| UX-002 | TC-35 | AC-35 | 输入非法值后切换页面，取消跳转保留输入。 | PASS / [actual evidence](../../evidence/requirements.md#ux-002) |
| HIST-003 | TC-36 | AC-36 | 编辑源计划后重开历史对比快照。 | PASS / [actual evidence](../../evidence/requirements.md#hist-003) |

Execution: 2026-10-18, Asia/Shanghai. Candidate `9442ba34b3d9916f`; [report](../../evidence/final-report.md). PARTIAL rows retain manual acceptance obligations.
