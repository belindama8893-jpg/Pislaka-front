# Team V1 Organization Setup · Demo 与技术交接

## 实现与演示

本次沿用现有静态 HTML、青绿色主色、圆角卡片、浅色/深色主题、移动导航。无构建依赖，无真实后端请求。

启动：在仓库目录运行 `python3 -m http.server 4180`，访问 `http://127.0.0.1:4180/#team`。也可从左侧 Team 或首页 Team 专家按钮进入。

1. 当前登录用户沿用 Demo 的 Ayesha Khan，不引入账号类型或 Team Account。
2. 点击 Set up Organization；填名称、国家/地区、IANA 时区。
3. 创建者自动成为 Owner，包含 Admin 配置权限；默认 Business Role 为 Agent，可以在 Members 改为 Manager。
4. 选择 Simple Team、Teams & Branches 或 Custom Structure。模板仅在空结构出现；已有结构通过 Add Organization Unit 增加。支持 Team / Branch / Region / Department / Other、父节点、重命名及移动父节点；禁止循环。可以不建任何单元，直接把成员放在组织根节点。
5. 添加 mock 成员，选择归属单元、Business Role、Organization Access。当前 Owner 固定；其他成员可为 Admin 或 Member。Owner 转移不在本次原型范围。
6. Manager 必须至少选择一个管理范围；每个范围单独设置 Include sub-units。关闭后只包含该节点直接归属的成员。切回 Agent 后清除管理范围。
7. Review 可返回修改详情、结构和成员；Complete 后进入 Team Agent，展示组织、成员数、Manager 数及三条可点击管理问题。
8. Organization Settings 可修改 Details、Structure、Members、Roles & Access。表单 Save 后保存，Cancel 不提交。被成员、子节点或管理范围引用的单元不能删除。
9. 刷新保留数据，未完成设置可 Save & exit 后继续；Reset demo 经确认后只清除此 Team Demo 数据。

存储：浏览器 localStorage `pislaka.team-v1.v1`。无真实邀请、拖拽、多组织切换、自定义权限、真实业务查询或 MCP。示例回答明确标为演示，组织统计来自当前本地数据，业务表现不虚构为真实结果。网络共享、并发编辑、生产授权均不在 Demo 范围。

## 主要文件

- `index.html`：左侧 Team 入口、首页 Team 专家入口、现有 showView 导航对接。
- `team-v1.css`：独立作用域样式，复用现有颜色变量和字体，支持窄屏及深色主题。
- `team-v1.js`：组织状态、设置步骤、树编辑、成员/范围编辑、Review、首页、Settings、本地保存与重置。

## 技术底层对象（建议，待产品确认）

| 对象 | 主要字段 | 关键约束 |
| --- | --- | --- |
| Account | id, display_name, identity_reference | 全局用户身份；无 Team Account 类型 |
| Organization | id, name, country_code, timezone, owner_account_id, setup_status, version | 创建事务同时产生 Owner Membership；IANA 时区；Owner 必须是有效成员 |
| OrganizationUnit | id, organization_id, parent_id, name, type, status, version | 父节点同组织；无环；根用空 parent；建议同父节点名称唯一 |
| OrganizationMembership | id, organization_id, account_id, home_unit_id, organization_access, business_role, status | 同组织同账号唯一；归属组织根可用空 home_unit_id；access=Owner/Admin/Member；role=Manager/Agent |
| ManagementScope | id, membership_id, unit_id, include_sub_units | 仅 Manager；可多选；根范围单独编码；同一成员同一节点唯一；重叠范围取并集并去重 |
| AuditEvent | id, organization_id, actor_id, action, target_type, target_id, before, after, occurred_at | 记录结构、访问角色、范围等写入；避免敏感字段无节制入日志 |
| Business ownership / assignment | organization_id, assigned_membership_id, related_listing/lead/deal_id | 业务记录必须具备可用于范围过滤的组织和责任成员关联 |

Demo 使用 `org` 标识根节点，技术实现应映射到明确的组织级范围或空 unit_id；不得把该字符串直接作为生产外键。Demo 把创建者信息嵌入本地状态；生产由登录身份提供。Mock 新成员没有真实 Account，不代表邀请或注册流程已实现。

## 权限语义与服务端规则

Organization Access 管“谁能配置组织”；Business Role 管“是否承担业务管理”；Management Scope 管“能看哪些业务”。Owner 包含 Admin 配置能力，不需要同时存储两条互相可能冲突的角色值。Admin 本身不自动授予全组织业务访问。

服务端统一计算用户上下文，所有 API/MCP 调用都使用已认证主体，验证组织成员关系、访问权限、业务范围。不能信任前端传入的组织 ID、actor ID 或范围。Agent 的个人业务权限沿用现有规则；Manager 的范围由服务端按组织树计算，Include sub-units 应涵盖未来新增后代节点。成员调整归属、组织树移动会影响有效范围，需要可审计、可预览。

组织创建与 Owner 初始化应为原子事务；关键写入支持版本校验和幂等，防止重复创建或覆盖他人修改。删除有引用的单元需拒绝或提供明确迁移步骤。最后一个 Owner 不可被删除或降级。原型不包含生产 Owner 转移流程。

## 建议 MCP 清单（本次未实现）

页面设置可以调用普通应用 API，共享同一套领域服务；不要求为了页面先建设 MCP。下表是后续让 Agent 使用这些能力时的候选工具，名字是建议契约。

| 工具 | 输入 / 输出重点 | 权限及目的 |
| --- | --- | --- |
| get_organization_context | 当前主体 → organization, membership, access, business_role, effective_scope, setup_status | 所有 Team 对话开始时建立服务端可信上下文 |
| get_organization_structure | organization → 可见单元树、版本 | 读取配置与可见范围；不得泄露无权结构 |
| list_organization_members | unit/filter/page → 成员、角色、分页 | 配置者用于组织管理；业务用途仅返回授权范围和必要字段 |
| preview_management_scope | membership, proposed scopes → 有效单元/人数、影响摘要 | 配置者写入前预览；服务端计算，避免越权和意外扩权 |
| create_organization | name, country, timezone, idempotency_key → organization + Owner membership | 普通登录用户可创建；事务初始化 |
| upsert_organization_unit | organization, unit, parent, type, version → 更新结果 | Owner/Admin；同组织、无环、版本约束 |
| update_organization_member | membership, home_unit, access, role, version → 更新结果 | Owner/Admin，具体可授予角色上限需定稿 |
| set_management_scope | membership, scopes, version → 范围及影响 | Owner/Admin；Manager 才可有范围；审计 |
| complete_organization_setup | organization, version → 状态 | 校验 Owner、引用和 Manager 范围 |
| get_team_priorities | period, filters → 事项、负责人、来源记录、统计口径 | Manager 且按 effective_scope 过滤 |
| get_agent_followup_summary | period, unit → 逾期、未跟进、后续动作及来源 | Manager 且按 effective_scope 过滤 |
| get_unit_performance | period, units, metrics → 同口径对比、空数据说明 | Manager；服务端过滤；明确归属及时间口径 |

如将删除、组织详情修改暴露给 Agent，再增设对应工具，复用 API 规则。邀请与多组织切换暂不列入 V1 必做清单。工具写操作应返回结构化结果与变更摘要，模型不能直接执行 SQL 或自行判断权限。

## 下一轮需要定稿

- Admin 是否可授予其他成员 Admin，Owner 专属操作的边界。
- Manager 是否可兼具个人经纪业务能力；本原型按用户给定的单选 Manager/Agent 实现。
- 团队管理正式版本是否仅 Manager 可进入业务查询；原型 Owner 的首页为可演示入口，所有示例回答均不访问业务数据。
- 成员调动后，历史业务按当前归属还是事发时归属统计。
- 初期规模上限、组织层级上限和真实邀请/离职流程。

## 本次验证记录

- JavaScript 语法检查、Git diff 空白检查通过。
- 真实浏览器：Team 空状态 → 创建 → Teams & Branches → 添加 Manager → 未选范围校验 → 选择分公司/Include sub-units → Review → Complete → 示例问题。
- Settings：单位重命名后成员路径/范围同步；阻止删除被引用节点；父节点选择排除自身和后代；新增 Department 到第三层；Organization Access 可独立改为 Admin。
- 刷新恢复已完成组织；Save & exit 后重新进入保留未完成步骤。
- 不建任何单元、不增加成员的最简路径可以完成，首页显示 1 成员 / 0 Manager。
- 首页原有 Team 专家入口可以进入新工作区。
- 桌面与 390×844 手机视口视觉检查通过；窄屏深层树提供横向滚动，页面卡片及按钮可用。
- 浏览器未出现 error/warn。深色样式复用既有主题变量，未新增主题切换控件；本次未单独进行深色主题视觉验收。
