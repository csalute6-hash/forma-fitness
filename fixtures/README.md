# 确定性 Fixture

[seed.json](seed.json) 是 schemaVersion 1 的可导入完整备份；数据完全合成，非真实用户信息。[expected.json](expected.json) 存储固定验证数值，不能作为页面统计数据源。

## 固定测试环境
- Clock：2026-10-18T04:00:00Z；Time zone：Asia/Shanghai。
- 当前本地日：2026-10-18；本周 2026-10-12–2026-10-18。
- 9 个动作、3 个模板、2 场历史、2 条体重、无 active workout。
- 浏览器 E2E 必须在应用读取时间前注入 clock/时区；领域函数接受显式 clock。生产使用真实时钟。

## 数值来源
| Session | 组容量 | Total | Time |
|---|---|---|---|
| Upper Body A | Bench 2×40×10 + Row 3×30×12 + Press 2×20×10 | 2,280kg | 35m |
| Lower Body A | Squat 3×60×8 + RDL 2×50×10 + Lunge 1×22×10 | 2,660kg | 40m |
| Total | 两场相加 | 4,940kg | 75m |

J01 新训练仅完成 Bench 42.5×8 和 40×10，新增 740kg、30m，总计 5,680kg、105m。最大负重改为 42.5kg，但其 340kg 单组容量小于原有 400kg，因此容量纪录不变。

## 测试变体（实现者生成，勿污染 seed）
- Empty：按存储协议保留库和模板，清空个人数据且 initialized=true。
- Active：从模板创建训练，部分完成并保留 rest.endsAt。
- Corrupt：不可解析 JSON；Unknown version：schemaVersion=99。
- Invalid：重复 ID、悬空 exerciseId、非法 date、负重量、NaN 解析失败、危险键。
- Capacity：200 场历史、50 计划、200 动作、730 体重记录，用于预算与上限检查。

每个用例自建隔离环境；导入未来体重记录按当前时钟拒绝，所以在更早时间验证 seed 时要显式使用固定 clock。真实运行时不将旧 seed 日期平移成今天；当前周若没有记录，显示 0 是正确行为。
