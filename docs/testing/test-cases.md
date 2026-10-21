# 主验收用例

共同前提：按用例加载隔离 fixture；除明确时钟边界外，使用 2026-10-18T04:00:00Z、Asia/Shanghai。每项执行记录实际数据、观察结果与证据路径；不得只勾选标题。故障注入只能在测试适配器中完成。

## TC-01 / AC-01 · NAV-001 页面导航

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：导航逐个点击；直接打开详情及未知地址。

预期：支持 Dashboard、Workouts、Plans、Exercises、Progress、Settings；当前导航可识别，未知 URL 有返回入口。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J08; visual routes; production deep links。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#nav-001)。

## TC-02 / AC-02 · NAV-002 响应式

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：360、390、768、1024、1440、1920px 检查。

预期：360–1920px 可用；桌面侧栏，窄屏紧凑顶部与可访问菜单；无页面级横向溢出。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：visual collection: 320, 360, 390, 768, 1024, 1440, 1920px。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#nav-002)。

## TC-03 / AC-03 · DASH-001 动态本周统计

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：用固定 fixture 时钟核对精确汇总。

预期：显示本周完成次数、训练容量、训练总时长；使用统一计算规则，不使用假数据。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：fixture calculations unit; J01 exact totals before/after。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#dash-001)。

## TC-04 / AC-04 · DASH-002 快速开始

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：激活计划、开始训练、返回 Dashboard。

预期：显示激活计划与近期完成训练；有活跃训练时首要操作为 Resume workout。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：StartButton and active-plan repository; J01/J03 restoration。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#dash-002)。

## TC-05 / AC-05 · PLAN-001 计划浏览

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：逐个查看三个模板与 seed 一致。

预期：展示三个预置模板，详情包含有序动作和目标组次、休息时间。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：visual Plans/detail; exact unchanged seed schema。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#plan-001)。

## TC-06 / AC-06 · PLAN-002 计划编辑

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：空名、超长、无动作均拒绝；合法保存刷新后保留。

预期：允许创建、复制、编辑自定义计划；名称必填且最多 60 字符，至少一个有效动作。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J03 editor validation/save/refresh; schema unit tests。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#plan-002)。

## TC-07 / AC-07 · PLAN-003 计划生命周期

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：复制编辑、切换激活、取消删除、确认删除。

预期：预置模板不可直接编辑或删除；可复制；激活最多一个计划；删除自定义计划需确认。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：custom plan deletion and snapshot test; J03 activation/copy。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#plan-003)。

## TC-08 / AC-08 · WORK-001 开始训练

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：开始后编辑源计划，活跃训练仍不变。

预期：从计划创建独立快照；一次仅一场活跃训练；重复开始导向恢复提示。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J03 source independence; createWorkout snapshot unit。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-001)。

## TC-09 / AC-09 · WORK-002 逐组记录

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：键盘完成组；非法数值、零重量边界与重新编辑。

预期：可输入重量和次数、标记完成与取消完成；新增删除组，输入按规则验证。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J01/J02; zero-load, set add/remove browser test; numeric boundary units; completed draft replacement guard and single-click add-after-blur regressions。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-002)。

## TC-10 / AC-10 · WORK-003 调整动作

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：替换取消保留原值，确认后新动作无完成组。

预期：活跃训练可添加、替换、移除动作；替换已记录动作须提示会清除该动作记录。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J02 cancel replacement; set add/remove/replacement/empty recorder browser test; replacing one row preserves unrelated invalid completed drafts。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-003)。

## TC-11 / AC-11 · WORK-004 恢复训练

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：记录后刷新与重开，读取相同训练 ID。

预期：所有合法字段更新、动作与组变更持久化；刷新后恢复开始时间、数据和休息状态。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J01 ID/start/inputs/reload and rest expiry。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-004)。

## TC-12 / AC-12 · WORK-005 休息计时

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：模拟超过截止时间，显示 Rest complete。

预期：支持启动、跳过、重置和预设秒数；后台恢复基于截止时间重算，不产生负值。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J01 elapsed deadline; rest restart/30s/skip browser test; custom 67-second rest expiry/restart/reload; isolated 30-minute timer component test。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-005)。

## TC-13 / AC-13 · WORK-006 完成训练

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：含未完成组结束并确认；历史只包含完成组。

预期：至少一组完成才可结束；完成时仅保留完成组，摘要确认，原子保存后无活跃训练。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J01 atomic completed-only save; J05 quota retry; empty/capacity/clock rollback units。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-006)。

## TC-14 / AC-14 · WORK-007 放弃训练

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：取消和确认分别检查存储。

预期：放弃需确认；确认后清除活跃训练且不创建历史；取消保持数据。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J02 cancel and confirmed discard preserves history。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#work-007)。

## TC-15 / AC-15 · HIST-001 历史列表

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：跨窗口边界和同时间戳排序验证。

预期：按完成时间倒序，支持标题搜索与最近 7 / 30 / All time 过滤；详情可直达。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J08 query persistence; history window endpoints/tie unit。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#hist-001)。

## TC-16 / AC-16 · HIST-002 历史删除

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：删除最高纪录训练，重新求出剩余最高纪录。

预期：删除已完成训练需确认；删除后看板、趋势与纪录重新计算。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：history deletion recomputes records browser test。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#hist-002)。

## TC-17 / AC-17 · EX-001 动作检索

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：大小写、空白、无结果和组合过滤。

预期：按名称或别名搜索，按肌群和器械组合过滤，清空过滤可恢复结果。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J08 search/combined filters/no-result/reset。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#ex-001)。

## TC-18 / AC-18 · EX-002 动作详情

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：从计划和训练选择动作，返回位置与数据保留。

预期：提供肌群、器械、三条说明和注意提示；选择动作能回到原编辑上下文。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：exercise picker details and selection; visual exercise details。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#ex-002)。

## TC-19 / AC-19 · PROG-001 趋势图表

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：固定时钟验证周边界与空周。

预期：最近 8 个自然周训练次数与容量；空周补零，提供同值的文字或表格。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：eight-week zero-fill exact units; visual chart and same-value table。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#prog-001)。

## TC-20 / AC-20 · PROG-002 个人纪录

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：同值按最近完成时间选中；活跃训练不计入。

预期：按动作显示最高外部负重及最大单组容量；只读取已完成训练。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：independent load/volume record units; J01; delete record recomputation。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#prog-002)。

## TC-21 / AC-21 · BODY-001 体重记录

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：同日覆盖需提示；单位切换保持 canonical 值。

预期：允许按日期新增、修改、删除体重；同日只有一条；日期不可在未来。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J07 overwrite cancel/confirm; date/duplicate/range validation units; unchanged canonical 350kg at lb display upper boundary。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#body-001)。

## TC-22 / AC-22 · SET-001 单位与目标

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：kg→lb→kg 对比底层数值。

预期：kg/lb、cm/in 展示切换和周目标 1–14 可持久化，历史不因切换反复舍入。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J07 canonical kg unit round-trip; J09 goal save; failed import explicit retry UI goal。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#set-001)。

## TC-23 / AC-23 · DATA-001 持久化可靠性

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：模拟 quota、安全限制、坏 JSON 与不支持版本。

预期：首次初始化与用户清空状态区分；写入失败或数据损坏时明确错误且不覆盖原数据。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：repository quota/corruption/version/read failure units; J05 browser recovery; simultaneous first-launch lock; blocked localStorage getter recovery。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#data-001)。

## TC-24 / AC-24 · DATA-002 数据导出

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：重新解析下载文件并核对所有实体。

预期：导出带 schemaVersion 的完整 JSON；不含 UI 临时状态；浏览器可下载。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J04 downloaded JSON deep equality including active workout; 2 MiB root guard/compact export unit。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#data-002)。

## TC-25 / AC-25 · DATA-003 安全导入

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：无效文件、取消、有效替换、写入失败四分支。

预期：最大 2 MiB，验证结构、范围与引用；只提供替换模式，显示摘要，确认后原子写入。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J04 cancel/restore; hostile imports; quota import retry; schema validation units。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#data-003)。

## TC-26 / AC-26 · DATA-004 清除数据

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：误输入、取消、确认及刷新。

预期：确认中输入 DELETE 才可清空；清空后仍是已初始化的空存储。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J04 typed DELETE and confirmed clear/refresh stays empty。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#data-004)。

## TC-27 / AC-27 · UX-001 状态反馈

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：各页空状态和故障注入检查。

预期：所有数据页具有适用的加载、空、无结果、错误与成功反馈；禁止不可用主操作。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：visual states; J05 recovery; hostile-import/empty/no-results paths。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#ux-001)。

## TC-28 / AC-28 · A11Y-001 键盘与语义

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：仅键盘完成一次训练与设置修改。

预期：完整键盘路径；可见焦点；表单标签；弹窗焦点陷阱与返回；语义 landmarks。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PARTIAL；实际结果：J09 keyboard/dialog return/trap and axe desktop/mobile; manual screen-reader spot-check NOT_RUN。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#a11y-001)。

## TC-29 / AC-29 · A11Y-002 可读与降动效

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：对比度检查、200% 缩放、减少动态效果。

预期：正文对比度至少 4.5:1，大字与关键非文本界面至少 3:1；尊重 reduced-motion。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PARTIAL；实际结果：axe contrast; reduced-motion and 320px reflow checks; actual browser 200% zoom NOT_RUN。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#a11y-002)。

## TC-30 / AC-30 · VIS-001 视觉与英文

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：六个主页面和训练详情截图审查。

预期：白色主导、扁平化；使用设计 token；所有产品 UI 英文，无表情符号替代图标。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：English shared tokens; visual-review.md 9/10; screenshots index。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#vis-001)。

## TC-31 / AC-31 · SEC-001 数据安全

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：脚本样式名称作为纯文本显示，检查网络和源码。

预期：导入与用户输入不作为 HTML 执行；无密钥；数据仅本机存储且风险有清晰英文说明。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：safe-import/XSS plain-text browser test; schema dangerous-key/size tests; source inspection。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#sec-001)。

## TC-32 / AC-32 · PERF-001 性能与资源

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：按性能协议测生产构建与 200 条训练数据。

预期：固定数据规模下操作及时；图表按需渲染；无外部图片或字体请求依赖。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：capacity in-page 20-sample browser test; production gzip; three Lighthouse mobile runs。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#perf-001)。

## TC-33 / AC-33 · QA-001 可构建与证据

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：全新依赖安装、构建、测试与最终报告核对。

预期：可按 README 在新环境安装启动；约定脚本可运行，P0 全有测试结果与证据。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PARTIAL；实际结果：clean frozen-lock install; lint/typecheck/unit/component/build/E2E logs; manual gate remains partial。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#qa-001)。

## TC-34 / AC-34 · DATA-005 多标签页冲突

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：两个标签页分别修改同一训练后验证冲突提示。

预期：新修订到来时停止旧标签写入并提示重载；落后修订不得静默覆盖。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J06 stale tab; IndexedDB fallback two-tab browser test; repository revision unit; concurrent first launch lock test。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#data-005)。

## TC-35 / AC-35 · UX-002 未保存输入保护

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：输入非法值后切换页面，取消跳转保留输入。

预期：非法或尚未提交的字段保留在编辑上下文并提示；导航前提示丢弃，不伪称保存。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J02 invalid draft guard; browser Back protection test; plan dirty-state and beforeunload implementation。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#ux-002)。

## TC-36 / AC-36 · HIST-003 历史不可变

前置：干净浏览器上下文，导入合法 seed，应用已启动。

操作：编辑源计划后重开历史对比快照。

预期：完成记录只读，P0 不提供修改；允许删除。源计划修改不改变既有训练。

证据：相关断言日志或截图；精确步骤参照页面/状态/存储合同。

状态：PASS；实际结果：J03 source independence; custom deletion/immutable snapshot browser test。执行：2026-10-18，macOS / Chromium 155 / WebKit 26；[实测证据](../../evidence/requirements.md#hist-003)。
