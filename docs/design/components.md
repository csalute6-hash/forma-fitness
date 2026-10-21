# 组件合同

| 组件 | 必需状态 / 行为 |
|---|---|
| AppShell | 桌面 / 手机导航、当前页语义、skip link、主内容 landmark |
| Button | primary / secondary / ghost / danger；loading 防重复；disabled 原因可见 |
| TextField / NumberField | label、hint、error、required、invalid；数字草稿和合法值分离 |
| Select / FilterChip | 选中、空、键盘操作；过滤组合清楚 |
| StatCard | label/value/unit/context；loading 与 empty 不伪装成数值 0 |
| PlanCard | Template/Custom、active、主要操作、只读模板限制 |
| ExercisePicker | 搜索、肌群与器械过滤、选择与取消、调用上下文返回 |
| SetRow | set number、weight、reps、completed、remove、行级错误 |
| RestTimer | idle / running / elapsed；跳过、重置；aria-live 不每秒播报 |
| Modal / ConfirmDialog | 标题、描述、Esc、焦点陷阱、关闭后焦点返回；写入中禁重复 |
| EmptyState | 说明与可执行 CTA；搜索空结果提供 Clear filters |
| ErrorState | 具体错误、重试、保留已有数据；存储错误持久呈现 |
| Toast | 成功状态 role=status；错误不只 toast；可关闭 |
| DataChart | 标题、单位、范围、tooltip 键盘可达、等值表格 |
| WorkoutList | 排序、过滤、空、行链接、删除独立操作不嵌套按钮 |

组件接收领域数据和回调，不自行读 localStorage。领域输入约束共享验证器，表单组件提供友好文案。避免巨型“万能组件”与重复页面私有按钮。删除按钮不得嵌套在整卡链接中；调整标记结构消除无效交互层级。

## 交互样例
完成组复选框的可访问名称：`Mark set 2 of Bench Press as complete`；重量输入：`Bench Press set 2 weight in kilograms`；删除组：`Remove set 2`。对话框展示替换动作影响时使用明确名称：`Replace Bench Press? Completed sets for this exercise will be removed.`。
