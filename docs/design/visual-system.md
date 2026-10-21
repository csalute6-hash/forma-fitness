# 视觉系统 · White / Flat / Confident

## 视觉意图
像高质量个人训练工具，结构清晰、留白充分、信息准确。主画面以白色和微灰为主，深色文字构成层级；仅主要按钮和趋势强调使用绿色。避免大面积渐变、玻璃模糊、厚重投影、拟物卡片、霓虹与花哨健身海报。桌面首屏内容围绕真实训练操作。

## Tokens
| Token | Value | Usage |
|---|---|---|
| color.canvas | #FFFFFF | 主背景 |
| color.surface | #FFFFFF | 面板 |
| color.surfaceMuted | #F6F7F8 | 二级区域与选中底色 |
| color.text | #17211B | 主文字 |
| color.textSecondary | #55615A | 次级说明 |
| color.border | #DCE2DE | 装饰分割线；不单独承担输入轮廓 |
| color.controlBorder | #7A8980 | 输入边界与关键非文本控件 |
| color.accent | #1D6B46 | 主操作、关键数据 |
| color.accentHover | #155235 | 按钮悬停 |
| color.accentSoft | #EAF4EE | 激活底色 |
| color.danger | #B42318 | 错误与危险确认 |
| color.focus | #1D4ED8 | 2px 焦点轮廓，2px offset |
| radius.control | 8px | 输入与按钮 |
| radius.panel | 12px | 卡片与弹窗 |
| border.default | 1px solid color.border | 扁平分隔 |
| spacing | 4, 8, 12, 16, 24, 32, 48, 64px | 只使用此序列，必要例外记录原因 |

这些颜色是初始 token，不等同已验证的所有对比组合。实际文本、图表线与交互边界组合必须由对比度工具验证；失败需调 token 并同步截图基线。

## 字体
无需外部字体下载。使用 `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`；若未提供本地 Inter，则系统字体是正式回退方案。字号：页面标题 32/40，分区标题 20/28，正文 16/24，辅助 14/20，数据大字 32/40，表格数字 16/24。小屏标题 28/36。标题字重 600，正文 400，控件 500。金额类样式不适用；训练数字使用 tabular-nums。必要的说明不低于 14px。

## 布局
桌面 ≥1024px：左侧栏 232px，内容左右 padding 40px，主内容最大宽 1280px；外层自动居中或由壳体控制。页头下距 32px。统计卡 3 列、间距 24px；主要内容 2:1 两列。768–1023px：紧凑导航，内容 padding 24px，统计可保持 3 列但不得压缩数字。<768px：顶部栏和菜单，内容 padding 16px，统计纵排或合适的单列，所有双列内容改一列。没有横向裁掉的操作按钮。

## 控件与图标
按钮默认高度 44px，主操作深绿底白字，次操作白底深字及实线边框，危险确认红底白字。不得每个卡片都塞一个主按钮。输入高度 44px，独立 label，错误提示跟随字段。图标 20 或 24px、统一线宽，无 Emoji。只有图标的按钮必须有英文可访问名称与 tooltip。图标点击区至少 44×44px。

## 表格与图表
训练组行高至少 56px，数字对齐，完成状态使用图标加文本语义；不要用颜色作为唯一线索。图表不使用 3D、装饰网格或虚假平滑；基线与单位清晰，空数据使用说明而不是随机线。8 周图表必须可读取同值表格。强调线色用 accent，网格用 border；刻度文本用 textSecondary。

## 动效
交互过渡 120–180ms，opacity/transform 为主；动画不阻塞录入。prefers-reduced-motion 时取消非必要动效。禁止每秒闪烁数字、循环庆祝、全屏粒子。

## 视觉验收底线
全部主要页面保持一致的页头、间距、按钮和输入样式；无一页切换到黑色主题；白色为主不代表边界不可见；首屏有真实操作与数据层级。截图评审见 [视觉检查](../testing/visual-review.md)。
