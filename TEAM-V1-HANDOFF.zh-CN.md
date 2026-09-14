# Team V1 Organization Setup · Demo 与技术交接

## 实现与演示（交互精简版）

保留现有主题与静态前端，导航顺序为 New chat → Listings → Leads → Team。

启动：在仓库目录运行 `python3 -m http.server 4180`，访问 `http://127.0.0.1:4180/#team`。也可从首页 Team 专家按钮进入。

1. 当前用户沿用 Ayesha Khan；创建组织只填名称和国家，国家默认 Pakistan。系统按国家填默认 IANA 时区，Settings → Details → Advanced settings 可修改时区。多时区国家后续应提供更精确的默认值与完整时区列表。
2. 创建者为 Owner，拥有 Admin 配置权限，业务角色默认 Agent。无 Team Account 类型。
3. 结构模板：Simple Team / Teams & Branches / Custom Structure。支持 Team、Branch、Region、Department、Other。树用缩进和连接线展示，不再用节点卡片外框。节点直接提供 Edit / 红色删除图标；删除需确认。有子节点、成员或已保存/待邀请的管理范围引用时阻止删除。根组织不能作为单元删除。
4. 添加成员以 Email 识别，输入完整邮箱匹配已有账号，选择匹配结果后 Add member；已有成员阻止重复添加。名字从账号读取。
5. 不存在的账号显示 Send invitation，保存为 Pending；支持 Resend / Revoke，同邮箱待处理邀请不能重复创建。Pending 不计入正式成员数或 Manager 数。
6. 访问权限默认 Member，可选 Admin；业务角色默认 Agent，可选 Manager。仅 Manager 展示 Management Scope，至少选一个节点，每节点单独 Include sub-units。
7. 无子单元时不显示成员归属字段，自动归属组织根；存在子单元时通过收起的 Assign to unit 可选设置。归属与管理范围分别保存。
8. Members → Complete setup → Team Agent；Settings 可编辑 Details、Structure、Members。浏览器刷新保留进度和邀请。
9. 页面不出现 Demo、mock、本地保存、权限解释和常驻成功提示；保留错误、删除确认、Pending 状态与短暂成功反馈。为方便反复演示，有组织时在 Team 页面底部提供 Reset organization；确认后仅清除本浏览器的组织、单元、成员、邀请和设置进度，返回创建起点。
10. 原生 select 已替换为页面内下拉；保留底层表单值，菜单跟随字段宽度，空间不足时向上展开，支持方向键、Home/End、Enter、Escape、Tab 和点击外部关闭。

### 演示邮箱与边界

本地账号库包含 `ayesha@pislaka.example`、`sara@pislaka.example`、`ali@pislaka.example`；用 `new.member@example.com` 可演示邀请分支。这些为保留域名下的演示标识，不代表真实账号。旧版成员缺少邮箱时会补充本地占位邮箱，不能迁移为真实账号凭证。

数据保存在浏览器 localStorage `pislaka.team-v1.v1`。不连接真实账号目录、不实际发邮件。邀请接受、过期及真实业务查询尚未实现。点击管理问题只展示当前组织数量或无活动数据状态，不生成虚假的业绩记录。页面采用正常产品文案，技术交接文档明确此边界。

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

Demo 使用 `org` 标识根节点，技术实现应映射到明确的组织级范围或空 unit_id；不得把该字符串直接作为生产外键。Demo 把创建者信息嵌入本地状态；生产由登录身份提供。本地账号目录及邀请记录只用于交互，不代表真实注册或发送。

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

如将删除、组织详情修改暴露给 Agent，再增设对应工具，复用 API 规则。多组织切换暂不列入 V1 必做清单。邀请交互已加入原型，生产接口见下节。工具写操作应返回结构化结果与变更摘要，模型不能直接执行 SQL 或自行判断权限。

## 下一轮需要定稿

- Admin 是否可授予其他成员 Admin，Owner 专属操作的边界。
- Manager 是否可兼具个人经纪业务能力；本原型按用户给定的单选 Manager/Agent 实现。
- 团队管理正式版本是否仅 Manager 可进入业务查询；原型 Owner 的首页为可演示入口，所有示例回答均不访问业务数据。
- 成员调动后，历史业务按当前归属还是事发时归属统计。
- 初期规模上限、组织层级上限和真实邀请/离职流程。

## 邮箱与邀请新增数据/接口建议

- Account：增加规范化邮箱键（大小写归一），精确匹配返回最少必要信息。生产端限制查询频率，避免提供可枚举的全站账号列表。
- OrganizationInvitation：id、organization_id、normalized_email、inviter_membership_id、proposed_access、proposed_business_role、home_unit_id、proposed_scopes、status、sent_at、expires_at、accepted_at、token_hash、version。
- 状态：Pending / Accepted / Revoked / Expired。待邀请角色和范围不生效，不计入正式成员。接受时校验登录邮箱、组织状态及邀请有效性，并以幂等事务创建 Membership/Scope。
- 待处理同组织同邮箱邀请唯一；重发需更新发送记录并按约定轮换令牌；撤销使令牌失效。角色与范围应在接受时再次验证，防止发送后的组织调整留下无效引用。
- 建议 API/MCP：`lookup_account_by_email`、`add_existing_organization_member`、`create_organization_invitation`、`list_organization_invitations`、`resend_organization_invitation`、`revoke_organization_invitation`。邀请接受用应用登录流程/API，通常无需暴露给管理 Agent。
- 所有成员与邀请写入由服务端检查 Owner/Admin 权限、角色授予上限和组织归属；不能信任前端传入的邮箱匹配结果。

## 本次验证记录

- JavaScript 语法、Git diff 检查通过。
- 真实浏览器完整设置流程；创建阶段不展示时区，UAE 默认 Asia/Dubai；Settings 改 Pakistan 后时区更新为 Asia/Karachi。
- 页面及成员弹窗下拉菜单与输入框对齐；390×844 手机视口检查通过；Escape 关闭菜单且不误关表单。
- 已有邮箱匹配、选中后添加、重复成员拦截；未知邮箱产生 Pending，刷新保留，重复待邀请拦截、重发和撤销通过。
- Manager 缺少范围阻止提交；无子单元隐藏归属字段，有子单元折叠显示 Assign to unit。
- 空单元删除确认通过；有子节点的单元删除受阻。
- 保留已有用户组织，交互测试在 localhost 独立存储中进行；浏览器未出现 error/warn。

## 操作入口统一

- Settings 仅保留 Details / Structure / Members；角色与管理范围在 Members 编辑。
- 添加单元及添加成员位于卡片外上方右侧，设置页与标签同排；设置向导同样放在卡片上方。
- 品牌色实底按钮使用白色文字和图标；浅色选中标签保留深色文字。
- 节点删除、成员移除及邀请撤销沿用 Listings 的红色垃圾桶按钮和悬停提示；危险操作确认使用红底白字。
- 成员列表提供 Edit / Remove member；移除只删除组织成员关系及管理范围，不删除账号。Owner 不显示移除入口，事件处理也拒绝移除 Owner。

设置流程仅为 Organization → Structure → Members。Members 点击 Complete setup 校验后直接进入首页；允许只有创建者和待接受邀请。旧版停在 Review 的未完成进度恢复到 Members，已完成组织不受影响。
