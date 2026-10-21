# 生产联网扩展 · 非 P0

本地 MVP 的存储、隐私与验收只覆盖当前设备。此页是下一阶段边界，不是已实现的后台或对任何云平台的推荐。联网前重新评审适用地区、数据类别与运营流程。

## 需要另行完成
- 认证与会话：真实登录、退出、会话失效、恢复；由可信身份服务或服务端完成，不能保存明文密码。
- 授权：所有记录按 owner 隔离，服务端独立检查，不能信任客户端 userId。
- 数据同步：服务端版本号或 ETag、冲突策略、幂等完成训练、离线队列与失败重试。
- 数据运维：数据库迁移、备份恢复、删除与导出机制、监控与审计；不得记录训练内容或体重到通用日志。
- 发布：HTTPS、部署环境变量、静态资源缓存、SPA fallback、错误告警、回滚方案。

## API 草案
| Method / path | 输入与结果 | 关键失败 |
|---|---|---|
| GET /api/v1/bootstrap | 当前用户配置、计划摘要及修订 | 401、503 |
| GET /api/v1/workouts?cursor=&limit= | 默认 limit 20，上限 100；稳定游标 | 400、401 |
| POST /api/v1/workouts | 完成训练快照，Idempotency-Key | 400、401、409、422 |
| DELETE /api/v1/workouts/:id | If-Match 修订；204 | 401、404、412 |
| POST /api/v1/plans | 合法自定义计划；201 | 401、422 |
| PATCH /api/v1/plans/:id | If-Match 与字段 patch | 401、404、412、422 |
| PUT /api/v1/active-workout | If-Match；唯一活跃训练 | 401、409、412 |
| POST /api/v1/body-weights | 本地日期、weightKg；同日冲突需显式策略 | 401、409、422 |
| GET /api/v1/export | 可下载当前用户完整数据 | 401、429 |

错误采用 `{ error: { code, message, fieldErrors?, requestId } }`；所有用户归属由服务端会话决定。响应不暴露堆栈。完成训练请求重复提交不得重复计数。删除跨用户 ID 返回一致的无资源响应。生产 API 的 schema、认证、分页与并发协议必须另补契约测试后才能替换本地 repository。
