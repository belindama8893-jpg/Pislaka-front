# Team V1 技术交接：邀请确认与账号级业务共享

本版延续 PR #1；静态前端 + localStorage。重点是实现 **邀请 → 本人接受并授权 → 按管理范围读取 → 退出停止共享**。本文替代旧版逐记录组织归属的建议。

## 1. 对照 Demo 实现什么

- 两步设置保持：Organization details → Organization & Members → Complete setup。创建组织时展示共享说明，创建按钮同时记录创建者授权。创建者仍为 Owner + Agent，不自动成为 Manager。
- 第二步和 Settings 复用左侧组织树、右侧成员列表；保留节点增删改、折叠、成员筛选、备注姓名、单元分配、配置权限、业务角色、树形管理范围。单元名称必填，类型可选。
- Invite member 只填写邮箱和拟配置；无论是否注册，都生成 Pending acceptance。不得查询全站账号并向邀请人展示姓名、公司或业务信息。备注姓名是邀请人自己填写的组织内称呼。
- Pending 不计入正式成员或有效 Manager；其角色和管理范围未生效，也看不到其业务数量、摘要。Pending 不阻碍完成设置。支持模拟重发、撤销，默认有效期七天。
- 被邀请模拟账号从 Team 看到邀请卡：组织、邀请人、单元、拟授予的 Organization Access / Business Role、Manager 管理范围、共享说明。Accept & Share Business Data 一次完成成员关系和授权，无二次弹窗；也可 Decline。
- 已加入成员详情显示 Business sharing: Active、Existing and future business data、Accepted at。普通成员可 Leave Organization & Stop Sharing；Admin 也可退出，Owner 保留保护不支持退出/移除。
- Team 首页三个卡片仍跳转联动设置（Managers 自动筛选）；业务区为最小只读预览。列表、详情、数量、Agent 示例摘要统一读取 `TeamSharing.visible()`，不另写业务统计。
- 现有 Leads、Listings、聊天入口保持原样；本轮少量测试记录只用于 Team 共享预览，不冒充接入了这些页面的真实数据。

## 2. 本人确认的内容

说明版本：`account-business-v1`，创建者和受邀成员采用相同范围。

> By joining or creating this organization, you agree to share all your existing and future leads, listings, and related business follow-up records in Pislaka with authorized managers at [organization] while you remain a member. This grants access; it does not transfer ownership.

中文含义：加入或创建组织即确认，在成员关系有效期间，组织内获得授权的管理者可查看本账号已有及新增的全部线索、房源和相关业务跟进记录；只授予访问权限，不转移归属、不复制数据。

只包含 `lead / listing / followup`。不包含私人聊天、完整 WhatsApp 会话、账号安全、个人账单、本账号无权再共享的数据；合同等后续类型必须另行明确授权。只读查看、分析和建议，不因本次授权增加删除、转派、代发消息等写权限。

退出提示：组织管理者将无法继续访问你的业务数据；你的 Pislaka 账号和原有业务记录不受影响。

## 3. 三种权限分开建模

| 字段 | 作用 | 不代表什么 |
| --- | --- | --- |
| Organization Access: Owner/Admin/Member | 组织配置权限，Owner 含 Admin 配置能力 | Owner/Admin 不直接获得业务读取权 |
| Business Role: Manager/Agent | Manager 可以在有效范围内查看已授权业务 | Manager 不能查看范围外成员 |
| Management Scope: unitId + includeSubUnits | 可选一个或多个中间节点；勾选包含后代则动态覆盖子树 | 本人所在单元不等于管理范围 |

组织树通过 `parentId` 表示父子关系；成员归属一个单元（或根组织）。管理范围取多个授权节点的并集，没有排除规则。范围覆盖成员当前所属单元，结合该成员账号有效共享授权，动态读取同一份账号业务。后续新增记录无需再次选择共享，历史记录也不需复制。

前端区分手动勾选和继承勾选；树形勾选只是编辑范围的表达。修改单元归属、父子关系或管理范围后，下一次查询按新关系计算，不缓存旧权限结论。

V1 同一账号同时只向一个组织启用业务共享；不做多组织切换、跨组织迁移、所有权转移和注销组织。正式记录级业务归属/项目级选择留待后续，当前仍以账号为数据所有者。

## 4. 后端最小数据表建议

可按现有项目命名调整；所有 ID 使用稳定主键，邮箱不能替代已认证 accountId。

| 表/对象 | 必要字段及约束 |
| --- | --- |
| Account（复用） | id、规范化邮箱、用户姓名；身份来自认证会话 |
| Organization | id、name、country、timezone、ownerMembershipId、createdAt |
| OrganizationUnit | id、organizationId、parentId、name、type 可空；禁止循环、跨组织父节点 |
| Invitation | id、organizationId、targetEmail、可选 targetAccountId、invitedByAccountId、displayName、unitId、proposedAccess、proposedRole、proposedScopes、status、sentAt、expiresAt、acceptedAt 可空、membershipId 可空 |
| Membership | id、organizationId、accountId、unitId、displayName、access、role、joinedAt、endedAt、endedReason；只在本人接受/创建组织后有效 |
| ManagementScope | membershipId、unitId、includeSubUnits；与有效成员关系关联，不能用 Pending 范围授权 |
| BusinessSharingGrant | id、membershipId、organizationId、accountId、active、types、existingAndFuture=true、consentVersion、acceptedAt、terminatedAt、terminationReason |
| Lead / Listing / FollowUp（复用） | id、ownerAccountId、业务字段；明确是否允许再次共享，跟进记录关联业务对象；不在接受邀请时拷贝数据或改 owner |

Demo 直接在邀请内保存拟配置，成员内保存 scopes，授权数组关联 membershipId；离开后的成员移入 terminatedMembers，保留授权终止记录。

正式数据库：为有效成员关系、有效单组织授权、同组织同邮箱 Pending 邀请建立唯一性约束（可采用条件索引/事务锁）。接受邀请应在同一事务中锁定邀请，校验身份/状态/有效期/单组织限制，建立成员和授权并标记已接受。重复提交返回既有结果；退出后重复旧请求不得恢复关系。拒绝、撤销、过期不可接受。

## 5. 需要哪些应用 API

以下是正式实现建议，Demo 未调用这些接口。

| API | 输入/输出要点与授权 |
| --- | --- |
| POST /organizations | 名称、国家、说明版本；事务创建 Owner+Agent、本人授权和组织 |
| GET/PATCH /organizations/:id | Details；配置写入仅 Owner/Admin |
| GET/POST/PATCH/DELETE /organizations/:id/units | 组织树；写入校验 Owner/Admin、父子关系、引用约束 |
| GET /organizations/:id/members | unit、role、status、search、cursor；配置视图仅组织管理员，Pending 与 Active 区分 |
| POST /organizations/:id/invitations | 邮箱、备注、单元、拟权限/角色/范围；仅 Pending，不返回全站账号资料 |
| POST /invitations/:id/resend 或 /revoke | 仅组织配置管理员；重发不等于接受 |
| GET /me/invitations | 只返回当前已认证账号邮箱对应的邀请，不信任客户端 accountId |
| POST /invitations/:id/accept | consentVersion + 幂等键；本人、有效邀请、单组织检查；事务写成员和授权 |
| POST /invitations/:id/decline | 本人拒绝有效 Pending |
| POST /organizations/:id/sharing-consent | 已有 Owner 本人补确认旧数据的授权，幂等；不能为他人确认 |
| PATCH /memberships/:id | 修改单元、备注、access、role、scopes；仅配置管理员；Owner 保护 |
| GET /memberships/:id/sharing | 本人或组织配置管理员查看授权范围、版本、时间，不包含业务内容 |
| POST /memberships/:id/leave | 本人退出；同时终止授权，Owner 拒绝 |
| DELETE /memberships/:id | 管理员移除；同时终止授权，Owner 拒绝 |
| GET /organizations/:id/business | type、cursor；只返回当前有效管理范围内已授权记录 |
| GET /organizations/:id/business/:type/:recordId | 每次重新检查；禁止依赖之前列表已授权 |
| GET /organizations/:id/business-summary | 统计使用与列表相同的授权数据集 |
| POST /organizations/:id/agent-summary | 只将同一授权查询结果交给模型；输出不允许混入未授权缓存 |

**每次读取业务必须在服务端检查：已认证身份、有效成员关系、有效共享授权、业务操作权限、管理范围。** 本版 Demo 还要求管理者自己的成员/共享关系有效。读取目标记录也必须属于有效授权账号和明确许可类型。

普通成员不能相互读取全部业务；Owner/Admin 仅配置身份不能读取。列表、详情、统计、Agent 上下文和摘要均执行同样检查；不能先读取全部再只在前端隐藏。

退出/移除在事务内终止成员和授权。权限或范围变化需要使业务缓存失效，前端清空旧详情、统计和回答并重取；不删除或改归属业务记录。正式并发请求与流式 Agent 响应也需处理权限变更后的输出取消/重新校验。

## 6. MCP 如何配置

MCP 是这些应用服务的另一入口，不新建独立权限规则。会话绑定已认证账号与组织上下文，模型传入的 accountId/scope 不能用来扩大权限。

| MCP tool 建议 | 复用服务 | V1 用途 |
| --- | --- | --- |
| team_get_context | 当前成员、角色、有效管理范围 | 判断当前用户可执行的能力 |
| team_list_units / team_list_members | 组织/成员查询 | 按调用者权限提供结构或成员信息 |
| team_list_business | 授权业务列表 | 只读检索线索、房源、跟进 |
| team_get_business | 授权详情 | 每次校验记录访问 |
| team_get_business_summary | 授权统计 | 给 Agent 生成分析/建议 |

设置类 API 优先保留页面交互；如未来暴露邀请、移除等 MCP 工具，仍复用同一服务权限和确认机制。**接受邀请/共享授权必须由本人明确确认，不能让管理员或 Agent 代为接受。** 本轮不接真实 MCP，不配置删除、转派、代发消息工具。

## 7. 本地兼容与演示

存储键仍为 `pislaka.team-v1.v1`，内容 version 升为 2。迁移前在 `.before-sharing` 备份一次原 version1 数据；不清空组织和单元。旧非 Owner 直接加入关系改为 Pending，保留原拟单元和权限，不编造接受时间。旧 Owner 保留身份但没有共享授权，需在首页本人补确认。授权新版本不能静默当作旧版已同意。

使用独立 origin 测试，例：仓库执行 `python3 -m http.server 4181 --bind 127.0.0.1`，打开 `http://127.0.0.1:4181/#team`。用户原 `4180` 数据不受影响。

演示顺序：
1. Ayesha 创建组织（旧组织先补确认）；编辑自己为 Manager，管理范围选择根组织并包含后代。她默认仍是 Agent，需要明确配置。
2. Invite member 填 `ahmed@pislaka.example`，可指定单元；也可邀请未知邮箱验证只生成 Pending。完成设置，业务预览为 0。
3. 展开 Demo controls 切换 Ahmed，点击 Accept & Share Business Data。
4. 切回 Ayesha，看到 Ahmed 的三条历史测试业务（线索、房源、跟进各一）；View 查看详情。
5. Demo controls 给 Ahmed 新增一条线索/房源；列表和统计同步增加，点击首页示例问题获得同源摘要。
6. Ahmed 为 Agent 时共享业务视图为 0；可同样邀请 Sara 为普通成员验证隔离。Admin 若未设 Manager 或 Manager 范围不覆盖 Ahmed 也不能查看。
7. Ahmed 点击 Leave Organization & Stop Sharing，或 Ayesha 在成员列表移除他；切回管理者业务为 0。记录仍保留，重新邀请必须重新接受。

Demo controls 用稳定 `accountId` 切换模拟身份，提供测试业务新增和 Pending 过期模拟。未知邮箱会作为测试身份进入该演示控件；这不是全站账号搜索或正式管理员代操作。账号切换仅影响 Team 模拟，原 Leads/Listings 的样例身份未重建。

Reset organization 需确认，只重置 Team 组织测试状态，保留测试业务记录。它不是生产注销组织能力。

## 8. 验证与交付记录

自动验证：`node --test tests/team-sharing.test.cjs`，12 项通过。覆盖 Pending 不授权、错误账号、拒绝/撤销/过期、重复接受、历史和新增动态共享、普通成员/无范围 Admin/范围外 Manager、后代范围、退出/移除/撤销范围、重新邀请、旧数据迁移、刷新序列化、单组织限制、Owner 保护、排除类型和不可再共享记录、未知邮箱。

浏览器实测（独立 4181 origin）：两步创建、Owner 角色/范围编辑、已有账号 Pending 且成员仍为 1、Pending 不阻挡完成、Ahmed 本人邀请卡、接受后历史业务 3 条、新增后 4 条且 Agent 统计一致、Agent 无管理业务、退出后 0 条、刷新仍为 0。另已验证未知邮箱 Pending、模拟重发/撤销、组织树模板新增、成员搜索空结果、原 Leads/Listings 页面正常打开。390px 窄屏时组织/成员容器单列排列，宽度 352px，页面无横向溢出（scrollWidth=clientWidth=390）。

待正式后端完成：真实认证及邮箱归属验证、事务/幂等与唯一约束、持久数据库、真实邀请通知、授权审计、实时失效/缓存隔离、业务表及不可再共享数据过滤、API 与 MCP 服务端统一授权、并发与安全测试。前端隐藏按钮、localStorage 和本地筛选仅为演示，不代表正式权限安全已实现。
