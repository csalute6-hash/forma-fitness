# 状态机与不变量

## 应用初始化
`uninitialized → reading → ready | recovery`。缺少存储 key 才 seed；有 key 且坏数据则 recovery。已初始化且为空的数据是 ready。读取失败不能自动覆盖。恢复界面允许下载原始内容（若可读）、重试和用户明确确认后重置。

## 训练
`idle → active → finishing → completed`；`active → discard-confirm → idle`；确认取消返回 active。`finishing → active` 发生在取消或写入失败。完成后训练存在 history，activeWorkout 为 null；两者必须同一次根对象写入。

- 一次至多一个 activeWorkout；不可重复完成同一 ID。
- 创建时深拷贝计划快照；计划不再是训练的实时来源。
- 未完成组允许合法预填值，但不计入历史和任何统计。
- 已完成训练至少一动作且总共至少一完成组；排除无完成组动作。
- 完成按钮重复点击和同一事件重放，不得新增重复 history。
- active 数据每次合法变更提交；非法草稿仅留 UI，并清楚标示 Unsaved changes。
- 删除源计划、改变单位不会破坏活跃快照。

## 休息
`idle → running → elapsed`；running / elapsed 可 reset → running，running 可 skip → idle。存储 `endsAt` 和 `durationSeconds`；剩余秒 `max(0, ceil((endsAt-now)/1000))`。不存每秒递减的数；没有后台精度保证。elapsed 只显示 Rest complete，不持续弹通知、不自动勾选下一组。完成/放弃训练后移除休息状态。

## 写入
`clean → validating → committing → saved | error`。先校验、检查 revision，再写入；成功后发布新内存快照。错误保留旧持久数据与当前可修复草稿，显示重试或导出恢复路径。严禁乐观显示永久成功。

## 导入
`selecting → validating → preview → confirming → committing → success`，任意校验错误 → rejected；取消 preview 不产生写入。只提供全量替换，禁止隐式 merge。导入含活跃训练时在预览中明确说明；现有活跃训练会被替换。失败后旧根对象保持原值。

## 多标签页
storage event 读到更高 revision → conflicted；当前标签暂停编辑并展示 “Data changed in another tab. Reload to continue.”。有草稿允许先复制/导出可恢复内容；不得自动覆盖新数据。每次提交前重读根 revision，并通过 Web Locks（如环境支持）串行写入；不支持可靠写入互斥时进入单写标签模式，其余标签只读并提示。禁止宣称 localStorage 的读取比较本身具备跨标签原子性。

实现补充（D013/D014）：`uninitialized → reading → ready` 中的首次 seed 写入也取得排他锁并重读。正常提交若超过 2 MiB，走 `committing → error`，保留原持久化根与可修复输入，不进入 saved。完整导出使用满足相同字节上限的紧凑 JSON。
