# 技术与仓库合同

## 选择原则
已有项目遵循既有框架、包管理器和测试约定。全新项目默认 React + TypeScript + 轻量构建工具；安装时核对可用版本并生成 lockfile，记录于项目 README。路由库、图表库、图标库和 schema 工具按需选择，避免引入多个同用途依赖。本地 MVP 不需要后端或 API key。

## 推荐模块边界
- `src/app/`：入口、路由、Provider、错误边界与全局壳。
- `src/features/dashboard|workouts|plans|exercises|progress|settings/`：页面与功能组件。
- `src/domain/`：类型、纯计算、验证、状态迁移，不依赖 UI 框架和浏览器全局。
- `src/data/`：repository、schema、seed、migration、storage adapter、跨标签写入。
- `src/components/`：共享展示与交互组件。
- `src/styles/`：token 与基础样式。
- `tests/unit|component|e2e/`：按风险划分的验证。

以上为待实现的建议结构，不是包内已存在的源码路径。小项目可合并文件，但不可混淆领域、持久化与展示职责。

## 必需脚本合同
下列命令在新项目中必须落为真实 package scripts；现有项目可记录等价命令。脚本名是目标合同，包内并没有预置 package.json。

| 命令 | 必须执行 |
|---|---|
| `npm run dev` | 本地开发服务器，README 记录端口 |
| `npm run lint` | 静态规范检查 |
| `npm run typecheck` | 不输出产物的类型检查 |
| `npm run test:unit` | 领域与存储适配器测试，非 watch 模式 |
| `npm run test:component` | 表单与关键交互测试，非 watch 模式 |
| `npm run test:e2e` | 浏览器端到端测试 |
| `npm run build` | 生产构建 |
| `npm run preview` | 生产构建本地预览 |

应用 README 必须给出安装、运行、构建、测试、导入 fixture、清空数据与排错方式。安装依赖失败应报告环境阻塞，不能删除测试依赖伪造绿色状态。

## 非功能约束
strict 类型检查；领域层禁止 any 逃逸；数值和 schema 校验在运行时同样执行。依赖版本锁定；没有外部字体、图片或分析 SDK 的网络前提。页面支持错误边界；深层路由部署需要静态服务器 SPA fallback，生产构建预览必须验证。日期处理禁止手写固定 UTC 偏移替代日历语义。
