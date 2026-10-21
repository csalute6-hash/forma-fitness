# 数据模型 · schemaVersion 1

持久化根 key 为 `forma.app.v1`，根对象定义见下表。可导入样本为 [seed.json](../../fixtures/seed.json)。所有 ID 为非空字符串，长度 ≤128，类型内唯一；跨类型可独立，但引用必须存在。生产生成 ID 使用可用的可靠随机 UUID，不用数组下标或显示名称作为 ID。

## Root
| 字段 | 类型 | 不变量 |
|---|---|---|
| schemaVersion | integer | 精确为 1 |
| revision | nonnegative integer | 每次成功提交 +1，导入时基于当前 revision 分配新值 |
| initialized | boolean | 必须 true，包括用户清空后 |
| preferences | object | weightUnit: kg/lb，lengthUnit: cm/in，weeklyGoal: 1–14 integer |
| exercises | Exercise[] | P0 只读库，仍随备份导出以保持引用完整 |
| plans | Plan[] | 同 ID 不重复；有效动作引用 |
| activePlanId | string/null | 指向已有计划或 null |
| activeWorkout | ActiveWorkout/null | 至多一个 |
| workouts | CompletedWorkout[] | 最多 200 条，超限提示导出后删除；不自动删除 |
| bodyWeights | BodyWeight[] | 最多 730 条，本地日期唯一 |

未知顶层字段拒绝导入；单个自由文本不允许通过对象扩展混入脚本或配置。原型污染相关键拒绝。导入根 revision 不作为下一次提交依据。

## Exercise
`id, name, aliases: string[], muscleGroup, equipment, instructions: string[3], note`。枚举 muscleGroup：Chest / Back / Legs / Shoulders / Core / Full body；equipment：Barbell / Dumbbell / Bodyweight / Cable。名称 1–80，别名最多 10 个每项 80 字符，说明每条最多 300 字符，note 最多 300。库 1–200 项。history 快照保存名称与 exerciseId，便于审计。

## Plan
`id, name, description, isTemplate: boolean, days: string[], exercises: PlanExercise[]`。days 为 Mon/Tue/Wed/Thu/Fri/Sat/Sun 去重子集。最多 50 个计划；每个 1–30 动作。

PlanExercise：`id, exerciseId, targetSets, targetReps, targetWeightKg, restSeconds`。同计划允许重复 exerciseId，但行 id 必须唯一。顺序以数组顺序为准。模板可复制成新的自定义计划，复制生成新的计划和行 id。

## ActiveWorkout
`id, name, sourcePlanId: string|null, startedAt, exercises: WorkoutExercise[], rest: RestState|null`。sourcePlanId 是可失效的来源审计引用，源计划删除后可保留该 ID，不作为渲染依赖。开始时间必须合法 ISO UTC，不得在创建时晚于测试/系统当前时间。

WorkoutExercise：`id, exerciseId, name, muscleGroup, equipment, restSeconds, sets: WorkoutSet[]`；动作快照枚举合法且 exerciseId 必须可在根库解析。WorkoutSet：`id, weightKg, reps, completed: boolean`。活跃训练最多 30 动作，每动作最多 20 组，允许空动作数组或空组数组供编辑。全训练组 id 唯一。RestState：`durationSeconds, endsAt`。

## CompletedWorkout
`id, name, sourcePlanId, startedAt, completedAt, completedLocalDate, timeZone, exercises`，无 rest；每组 completed 必须 true。至少一动作、一完成组。completedAt >= startedAt，日期必须与 timeZone 下 completedAt 的本地日一致；timeZone 必须是可识别 IANA 时区。将总量与时长作为派生值，不重复存储，防止漂移。

## BodyWeight
`id, date: YYYY-MM-DD, weightKg`，20–350kg，日期不晚于验证时的当前本地日。最多 730 条，按日期升序用于图表。新增同日记录必须显式确认替换；替换保留该条 ID。

## 容量与安全边界
导入文件 ≤2 MiB；字符串、数组和嵌套层级受 schema 约束；无悬空 activePlanId、动作引用、重复 id、非法日期和非有限数。fixture 的 record 数量刻意很小。达到本地数据上限时不丢旧数据，提供清晰提示与导出；完成训练因 200 条上限失败时保持当前 active 可恢复。

实现容量澄清（D014）：除各实体数量最大值外，正常提交根对象的紧凑 JSON UTF-8 大小上限为 2 MiB，使 DATA-002 导出可按 DATA-003 原样导入。超过时明确拒绝本次提交并保留旧根/活跃训练；不裁剪或自动删除任何记录。
