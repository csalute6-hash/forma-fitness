# 页面布局蓝图

以下是内容优先级，非像素截图。实现需遵循视觉 token，并完成真实交互。

## Desktop Dashboard · 1440×1000
- 左 232px 固定导航：FORMA 顶部；6 个导航项；底部显示 Local workspace。
- 内容页头：左侧 Dashboard 与一句副标题；右侧 Start workout。
- 第一行：3 张等宽指标卡，Workouts this week / Training volume / Training time。
- 第二行：左 2/3 Active plan（名称、动作数量、训练日标签、Start workout）；右 1/3 Weekly activity，列出 Mon–Sun 的完成情况。
- 第三行：Recent workouts 列表、日期、时长、容量；View all 链接到列表。
- 活跃训练存在时在页头下加入简洁恢复条，Start 主操作改 Resume。

## Workout recorder
页头左侧返回与训练名，中间或右侧总时长；动作面板按顺序纵向堆叠。每个面板：动作名、详情、替换/移除菜单；下方组表。Add set 位于该动作底部，Add exercise 位于所有动作底部。右侧可用窄休息面板；手机收为简洁内联条。Finish workout 在手机可 sticky bottom，但为内容预留完整高度和 safe-area，不能挡住最后一组。

## Plans / Exercises
统一顶部页头；筛选区和内容分开。计划为 3 列卡片，平板 2 列，手机 1 列。动作库可用列表或网格，但搜索与过滤不隐藏在装饰抽屉里。详情面板宽度控制，说明可扫描。

## Progress
页头附时间范围说明 Last 8 weeks。上方主要趋势图与切换控件；下方 Personal records 表；再下方 Body weight 趋势与记录列表。无数据的每个分区单独显示空状态，避免整页空白。

## Settings
单列最大 800px，按 Preferences / Local data / Danger zone 分区。危险区远离普通保存按钮；导出、导入、清除分别说明影响。清除默认不聚焦危险按钮。

## Mobile · 390×844
顶部 64px；菜单可用 sheet 并锁定焦点；内容 16px 边距；页头主操作可换行。禁止将 desktop table 等比例缩小成小字。详情返回不依赖浏览器手势。软键盘出现后当前字段应可见；粘性区域不得遮挡输入错误提示。
