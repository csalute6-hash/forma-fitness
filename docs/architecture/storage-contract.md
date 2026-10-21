# Repository 与存储协议

## 对外接口（逻辑合同，语言实现可适配）
- `load(): Result<AppData, StorageError>`
- `commit(expectedRevision, mutation): Result<AppData, StorageError>`
- `subscribe(listener): unsubscribe`
- `exportBackup(): string`
- `validateImport(raw, clock): Result<ImportPreview, ValidationError[]>`
- `replaceAll(preview, expectedRevision): Result<AppData, StorageError>`

所有写操作通过 commit；mutation 是基于当前根对象的纯转换。返回错误应有稳定代码：READ_FAILED / CORRUPT_DATA / UNSUPPORTED_VERSION / QUOTA_EXCEEDED / CONFLICT / VALIDATION_FAILED / WRITE_FAILED。UI 根据代码显示英文文案，不展示原始堆栈给用户。

## 单次提交
1. 取得跨标签排他写锁或已验证的单写租约；无法保证时只读并提示。
2. 从持久层读取根对象，核对 expectedRevision。
3. 在独立副本上应用 mutation，进行完整 schema 与领域校验。
4. 分配 revision = current + 1，序列化根对象。
5. 单次替换 `forma.app.v1`；存储适配器故障时旧根仍有效；不得先删除旧 key。
6. 成功后更新统一内存状态并通知订阅者，随后释放锁。

localStorage 单次 setItem 可提供单 key 替换，但不提供多步骤事务锁；不能以“先读后写”代替步骤 1。使用 Web Locks 时特性检测；不支持时可实现可靠单写标签租约，也可保守限制第二标签只读，写清支持策略并验证。

## 自动保存与草稿
重量和次数输入使用本地字符串草稿。blur/Enter 提交合法值；点击 Done 必须先同步提交这一行全部合法输入；新增/删除/替换立即提交。导航离开时 flush 所有合法草稿；非法草稿需确认丢弃。不得仅在 1 秒 debounce 到期后才保存并宣称已存。浏览器刷新前未失焦草稿不保证被平台保存，UI 必须标记未保存；如希望承诺输入即恢复，需实现独立可验证的草稿机制，不改变已提交值语义。

## 首次启动 / 清空
无 key → seed → initialized=true revision=1；seed 写入失败应进入明确错误，不能展示持久化成功。Clear personal data 保留 preferences 默认值、只读 exercise 库、三个模板，清空自定义计划、history、bodyWeights、activeWorkout 和 activePlanId，initialized=true，revision+1。这里“清空”指个人记录；确认文案须说明保留内置动作与模板。下次启动不恢复 demo 历史。

## 损坏与版本
JSON 不可解析、schema 不合格或版本未知时进入 recovery，原字符串不覆盖。提供下载原始文件便于手动恢复；若读取本身失败则说明无法下载。v1 不猜测迁移未知版本；后续版本必须提供明确迁移、备份和失败回退测试。

## 导入导出
导出当前最后成功提交的根对象，包含 schemaVersion、preferences、库、计划、活跃训练、历史与体重，文件名 `forma-backup-YYYY-MM-DD.json`。不导出焦点、弹窗、搜索或非法草稿。导入先读取到隔离对象，拒绝未知字段和危险键，完整验证后展示计数；确认时再次核对 current revision，重新验证预览未过期，单次替换。文件内 revision 不受信任。取消与写失败均保留原数据。

## 实现澄清（D012–D014）

首次缺 key 的 seed 同样先取得排他写锁，并在锁内再次读取；若另一标签已初始化，则读取该根，不重新 seed。当前实现优先使用 Web Locks；降级使用同源 IndexedDB 的同一 object store 上的 readwrite 排他事务，在 request 回调内同步执行校验后的单 key 替换。IndexedDB 只协调排他调度，不保存训练，不声称提供跨存储回滚事务。两种互斥机制均不可用时拒绝写入。

正常提交根对象的 UTF-8 序列化大小不得超过 2 MiB，超限按可恢复写入失败处理，旧根与 active 保留。正常备份导出使用紧凑 JSON，以确保每份正常导出都满足既有导入字节上限。实体数量上限仍分别生效。恢复界面的原始损坏文件下载不构成可正常导入的备份承诺。
