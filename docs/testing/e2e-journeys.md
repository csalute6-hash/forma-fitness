# E2E 场景脚本

## J01 · 从计划到历史
1. 固定时钟加载 seed，打开 `/`；断言 2 / 3、4,940 kg、75m。
2. 打开 Plans → Upper Body A → Start workout；断言 active ID 唯一、开始时间固定。
3. Bench Press 第一组填写 42.5kg、8 reps，勾选 Done；第二组 40kg、10 reps，勾选 Done。
4. 刷新，断言训练 ID/数值/开始时间相同；休息由 endsAt 重算。
5. 推进测试时钟 30 分钟，Finish → 摘要提示只保留完成组 → 确认。
6. 断言 history +1、active=null、该训练容量 740kg、时长 30m。
7. Dashboard 断言 3 / 3、5,680kg、105m；PR Bench Press 42.5kg，最大单组容量仍为 400kg。

## J02 · 取消、修改与边界
开始自定义计划；非法次数 0、1.5、101 均显示错误且无法 Done。重量 0 合法，自重组完成容量为 0。已完成动作替换弹窗取消不变，确认清除该动作记录。放弃取消保持 active；确认清除 active，history 数量不变。

## J03 · 计划快照
复制 Upper Body A，改名为 Evening strength，新增动作，激活。开始训练后回到源计划编辑；活跃训练保持开始时内容。完成后再次修改计划；历史详情仍保持完成快照。模板编辑和删除入口不可用。

## J04 · 备份 round-trip
记录体重并留一场 active；导出 JSON；保存其 normalized 领域数据（忽略 revision）。清除个人数据后刷新，确认未恢复 demo。导入备份预览并确认，比较领域实体深等值；derived 数值一致。导入取消、错误文件与 setItem 失败均不改当前根。

## J05 · 故障与恢复
注入 quota 写失败，完成训练应留在 active 并显示错误，history 不增加。恢复可写后重试只生成一条历史。写入坏 JSON 重开应用，应出现恢复界面且原值未改。未知版本显示专用提示。缺 key 与空 initialized 根的启动表现不同。

## J06 · 多标签页
同一浏览器上下文打开 A、B；A 完成一次合法编辑；B 接收更新并暂停写入，显示 reload。模拟 B 提交旧 revision 必须拒绝。验证无互斥能力的环境进入单写/只读模式。不得用简单延迟碰运气通过测试。

## J07 · 日历 / 时区 / 单位
固定周一 00:00 与周日 23:59 的本地完成日期测试周归属；在 America/New_York 夏令时周复验。kg→lb→kg，底层 weightKg 不变；以 lb 合法输入后 canonical 转换正确。UTC 夜间对应本地次日时体重日期不偏移。

## J08 · 空与导航
清空个人记录，Dashboard/Workouts/Progress 显示适用空状态。Exercises 输入无结果，Clear filters 恢复。直接加载详情、无效 ID、未知 URL；刷新可正常展示或友好 404。带非法草稿跳转，取消继续编辑，确认才丢弃。

## J09 · 键盘与手机
在 390px 使用键盘完成一场训练、编辑计划、导出数据；弹窗焦点返回；菜单可关闭。检查 360px、200% 缩放与 320 CSS px 回流；底部 Finish 不遮挡输入。
