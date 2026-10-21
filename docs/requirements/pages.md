# 页面与交互合同

## 全局壳与路由
| 路由 | 标题 | 主要操作 |
|---|---|---|
| `/` | Dashboard | Start workout / Resume workout |
| `/workouts` | Workouts | Start workout |
| `/workouts/active` | Current workout | Finish workout |
| `/workouts/:id` | Workout details | Delete workout |
| `/plans` | Plans | Create plan |
| `/plans/:id` | Plan details | Start workout / Use plan |
| `/plans/new` | Create plan | Save plan |
| `/plans/:id/edit` | Edit plan | Save changes |
| `/exercises` | Exercises | Search exercises |
| `/exercises/:id` | Exercise details | 只读详情；选择上下文使用 Select exercise |
| `/progress` | Progress | Log weight |
| `/settings` | Settings | Export data |

路由静态段优先于 `:id`；不存在的 ID 显示 “This item could not be found.” 和回列表操作。刷新深层路由必须工作。应用启动时仓储未就绪显示骨架；读完才渲染数据，禁止闪现假零值。

## Dashboard
页头：Dashboard / “Make every session count.”。右侧主按钮为当前有效操作。下方三张统计卡：Workouts this week（分子 / 目标）、Training volume（单位明确）、Training time。第二行左侧 Active plan 或 Choose a plan，右侧 Weekly activity。第三行 Recent workouts 最多 5 条，点击打开详情。无完成训练显示 “Your first workout starts here.”。有活跃训练始终展示恢复条，不能悄悄创建第二场。

## Workouts 与记录器
列表页：标题、搜索、时间过滤、结果数和训练行；每行包含标题、完成日期、时长、动作数、容量。筛选条件反映在可分享的 query 中；刷新保留条件。详情展示快照、完成组、总量与删除按钮。

记录器：训练名称、总时长、动作区、底部 Finish workout。桌面每动作表格列为 Set / Weight (kg或lb) / Reps / Done；手机纵向适配但同组字段仍相邻。输入聚焦时不得自动格式化打断键入。新增组复制上组合法的重量与次数作为未完成值，无上组时重量 0、次数 8。首组和后续组都可删除，动作无组时显示 Add set；最后一个动作也可移除，保留 Add exercise 入口。

勾选 Done 前验证该组合法；勾选成功启动或重启休息计时；取消完成不自动重启计时。编辑已完成组的合法值保留完成状态；非法草稿暂停该组完成资格，并阻止 Finish，直到修正或取消该草稿。结束摘要说明未完成组会被排除；只有保存成功才跳转历史。放弃使用次要危险操作并确认。

## Plans
列表使用干净卡片，展示名称、标签、动作数和 Template / Custom 标识。预置模板只能 Copy plan。编辑器可改名称、说明、每周训练日标签（Mon–Sun 多选；只做标签）、动作顺序、目标组数、次数、重量、休息秒数。重排提供上移 / 下移键盘按钮；拖拽仅可作为增强。Save 按钮对非法表单 disabled 并提供字段提示。

激活计划只改变 Dashboard 默认入口，不自动开始训练。可从任意合法计划开始。删除活跃自定义计划会清除 activePlanId；已开始的训练快照保留。空计划只能留在编辑表单，不能持久化为可开始计划。

## Exercises
搜索框固定有标签，肌群与器械过滤支持 All。动作条目用一致的线性图标或简洁字母占位，不依赖照片。详情含英文动作说明和提示。添加 / 替换通过带标题的选择弹窗，保留调用方草稿；取消不改动原数据。动作库 P0 只读。

## Progress
8 周柱状或折线趋势附同值表格，可切换 Workouts / Volume。纪录按动作聚合；不推算 1RM 或训练热量。体重区展示记录表与趋势，提供日期和数值表单；同日更新需确认。曲线不连接虚构数据，不以 0 填充缺失体重，只有训练周统计空周补零。

## Settings
单位、周目标；本地数据说明；Export data、Import data 和 Clear personal data。导入先验证再展示实体数量、活跃训练情况与替换警告；确认后替换整个数据集。清除弹窗必须输入 DELETE，默认焦点放在安全操作。无登录头像、通知或升级按钮。

## 通用交互
按钮有 hover/focus/active/disabled 状态；异步写入时防重复点击。成功反馈以 aria-live 提示；错误显示在相关字段或页面，不仅 toast。删除后焦点返回合理位置。离开存在草稿的表单显示站内确认；浏览器关闭使用平台允许的原生未保存提示，不依赖自定义文案能被浏览器显示。
