# Team V1 · 组织与成员联动原型

## 运行与演示

在仓库运行 `python3 -m http.server 4180`，访问 `http://127.0.0.1:4180/#team`。左侧导航顺序为 New chat → Listings → Leads → Team，首页 Team 专家入口也进入此工作区。

首次设置：**Organization details → Organization & Members → Complete setup**。

- 创建组织填写名称、国家；默认 Pakistan，自动设置默认时区。时区在 Settings → Details → Advanced settings 修改。多时区国家的完整处理留给生产版本。
- 创建者自动成为 Owner，拥有 Admin 配置能力，业务角色默认 Agent。无需 Team Account 或更换账号。
- 设置进度、本地组织、成员和 Pending 邀请保留在 localStorage。旧版 Structure / Members / Review 草稿统一恢复到第二步；已完成组织不受影响。
- 只有创建者、没有下级单元或仍有 Pending 邀请也可完成。完成时校验 Owner、成员归属和 Manager 范围。
- 页面底部 Reset organization 经过确认后只清除 Team 的本地组织数据，回到空状态，便于反复演示。

## 最终页面与交互

### 统一组织与成员管理页

Settings 只保留 **Details / Organization & Members**。不再保留独立 Structure、Members 页面或成员侧栏。第二步设置也复用同一个联动工作区。

桌面左侧组织树，右侧成员列表；窄屏上下排列，组织树在上。节点选择、展开状态、列表筛选为当前视图状态，不写入业务权限。

### 左侧组织树

- 根节点与子单元用缩进、横向短线和纵向连接线展示层级，末尾分支连线终止。
- 点击名称选中节点并更新右侧。名称旁的成员图标与人数常显，表示直接正式成员数，不包含后代或 Pending 邀请。
- 名称旁提供 ＋、编辑、删除；桌面悬停或键盘聚焦整行时显示，触屏常显。不再使用更多菜单。
- 有子单元的节点提供展开/收起箭头；叶节点保持对齐。默认展开，新增或移动单元后自动展开对应父级及祖先。
- 从节点添加子单元自动设置父级，只填名称和类型。类型支持 Team / Branch / Region / Department / Other。
- 编辑单元可调整父级，排除自身和后代，避免循环。删除需要确认；仍被子单元、成员或已保存/待邀请范围引用时拒绝删除。根组织不能作为单元删除。
- 空结构保留 Simple Team / Teams & Branches / Custom Structure 快捷模板。

### 右侧成员列表及筛选

- 根组织默认开启 Include sub-units，查看全部成员；选择非根节点默认只看直接成员，可开启 Include sub-units 查看后代。
- 筛选：姓名/邮箱搜索、Business Role（All / Agent / Manager）、Status（All / Active / Pending）。多个条件取交集。
- 节点切换保留搜索、角色、状态条件，重新设置该节点的 Include sub-units 默认值。结果数量包含当前匹配的正式成员与 Pending 邀请；两者分区显示。
- Include sub-units 在列表中仅控制查看范围，不会修改任何人的 Management Scope。
- Add member 只在右侧成员区域。Email 下方常驻 Organization Unit，默认当前选中节点，可修改；无子单元时仍明确显示组织根。
- 输入完整邮箱，匹配已有账号后选中并 Add member；未知邮箱显示 Send invitation。已有成员和 Pending 邀请阻止重复创建。
- 编辑成员可调整归属、组织访问角色、业务角色和管理范围。成员调动后，左侧直接人数与右侧筛选结果立即同步。
- 移除成员需要确认，只移出组织，不删除账号；Owner 不提供移除入口且事件处理拒绝移除 Owner。
- Pending 邀请支持 Resend / Revoke；不计入首页正式成员或 Manager 数量。

### 首页卡片

Organization、Members、Managers 卡片均可点击。前两者进入联动页并选择根组织、查看全部成员；Managers 自动筛选 Business Role=Manager、Status=Active。Organization Settings 也进入联动页。Details 单独编辑组织基础信息。

### 视觉与表单

复用网站品牌色、浅色/深色主题变量和 Listings 按钮风格；品牌色实底按钮为白字，危险操作确认按钮为红底白字。组织操作保持轻量，不添加说明性横幅。

下拉使用页面内组件，紧贴字段、同宽、底部不足时向上展开，支持方向键、Home/End、Enter、Escape、Tab 和点击外部关闭。删除图标带可访问名称，节点支持键盘聚焦与折叠按钮的 aria-expanded 状态。

## 权限模型与继承

三个维度独立保存：

| 维度 | 含义 |
| --- | --- |
| Organization Access | Owner / Admin / Member；谁能配置组织及成员 |
| Business Role | Manager / Agent；业务职责 |
| Management Scope | 哪些单元的业务可被 Manager 管理 |

成员归属单元只表示属于哪里，不自动授予对应管理范围。Admin 不自动获得全组织业务访问能力。Owner 包含 Admin 配置能力，不需要并列保存两条冲突角色。

Manager 必须有至少一个范围。范围按组织树选择：选择节点仅覆盖直接归属业务；Include sub-units 覆盖所有后代，包括未来新增单元。下级显示继承选中及来源，不能直接取消；取消上级覆盖后，原有独立授权保留，纯继承勾选消失。跨分支可多选。独立授权与计算覆盖分开，继承结果不逐节点写入 Scope。切换 Agent 保存后清除管理范围。V1 不提供排除子节点等复杂例外规则。

## 数据对象建议

| 对象 | 主要字段与约束 |
| --- | --- |
| Account | id, display_name, normalized_email；全局身份、邮箱精确匹配 |
| Organization | id, name, country_code, timezone, owner_account_id, setup_status, version |
| OrganizationUnit | id, organization_id, parent_id, name, type, status, version；同组织父级、无环、建议同父级名称唯一 |
| OrganizationMembership | id, organization_id, account_id, home_unit_id, organization_access, business_role, status；同组织同账号唯一 |
| ManagementScope | id, membership_id, unit_id, include_sub_units；仅 Manager，多条范围取并集；保留独立授权 |
| OrganizationInvitation | id, organization_id, normalized_email, inviter_id, proposed_access, proposed_role, home_unit_id, proposed_scopes, status, sent_at, expires_at, accepted_at, token_hash, version |
| AuditEvent | actor, organization, action, target, before, after, occurred_at；组织与权限变更可审计 |
| Business assignment | organization_id, assigned_membership_id, related_listing/lead/deal_id；业务范围查询依据 |

Demo 用 `org` 表示根，生产应映射明确的组织级范围或空 unit_id，不直接拿字符串当外键。创建 Organization 与 Owner Membership 是原子事务。最后一个 Owner 不能删除/降级；Owner 转移不在原型范围。

邀请状态建议 Pending / Accepted / Revoked / Expired。同组织同邮箱待处理邀请唯一；重发记录发送时间并约定令牌轮换；撤销使令牌失效；接受时核验登录邮箱、有效期、角色和范围，并幂等创建 Membership / Scope。Pending 的角色与范围不生效。

## API / MCP 候选清单

页面可以直接调用应用 API，未来 MCP 与 API 复用领域服务，不必先为页面搭 MCP。

| 工具 | 用途 |
| --- | --- |
| get_organization_context | 当前登录主体对应的组织、成员身份、业务角色、有效范围、设置状态 |
| get_organization_structure | 可见组织树、直接成员数与版本 |
| list_organization_members | 节点、包含后代、搜索、角色、状态、分页；按授权返回结果 |
| lookup_account_by_email | 精确邮箱匹配，返回最少必要信息，限频防止全站枚举 |
| create_organization | 创建组织与 Owner，支持幂等 |
| upsert_organization_unit / delete_organization_unit | 单元新增、编辑、删除，校验父级、循环、引用、版本 |
| add_existing_organization_member | 已有账号加入组织，校验重复及权限上限 |
| update_organization_member / remove_organization_member | 调整归属、角色，移除组织关系；Owner 保护 |
| preview_management_scope / set_management_scope | 服务端计算范围与变更影响，保存独立授权 |
| create/list/resend/revoke_organization_invitation | 邀请生命周期管理；接受走应用登录/API 流程 |
| complete_organization_setup | 校验必要配置并完成设置 |
| get_team_priorities | 授权范围内的团队优先事项及来源 |
| get_agent_followup_summary | 授权范围内跟进情况与来源 |
| get_unit_performance | 同周期、同口径的授权单元业绩对比 |

服务端从已认证主体计算上下文，所有读写均校验组织成员关系、配置权限或业务范围；不信任前端组织 ID、邮箱匹配结果、actor、Scope。列表筛选不是安全边界。写入使用版本校验、幂等和审计。业务统计需定稿“成员调动后的历史业务归属口径”。Admin 可授予的角色上限也需定稿。

## 演示数据与实现边界

静态 HTML/CSS/JS，无构建依赖。本地键 `pislaka.team-v1.v1`。不连接真实账号目录，不实际发邮件，不访问真实业务数据或 MCP。

已有账号示例：`ayesha@pislaka.example`、`sara@pislaka.example`、`ali@pislaka.example`；未知邮箱如 `new.member@example.com` 演示邀请。旧版缺少邮箱的成员使用占位邮箱，不能据此迁移真实账号。邀请接受及过期不在此 Demo 中实现。管理问题只显示当前组织数量或无活动数据，避免伪造业务表现。

主要文件：`index.html` 导航整合；`team-v1.js` 状态、树、筛选、表单与本地存储；`team-v1.css` 独立界面样式。

## 本轮验证

- JavaScript 语法、Git diff 检查通过。
- 首页三个卡片跳转、Managers 的预置筛选、根组织与直接节点成员筛选。
- 搜索、键盘清空搜索、Active/Pending、角色筛选及空结果状态。
- 从当前节点添加邀请时归属常驻且自动带入；成员调动更新结果与节点人数。
- 子级筛选、折叠隐藏后代、新增子级自动展开父级；键盘可聚焦隐藏的节点操作。
- 桌面左右布局、390×844 窄屏上下布局及清晰树形连接线。
- 两步设置，无单元、只有创建者及 Pending 邀请均可完成，刷新后保持完成。
- 浏览器无 error/warn；使用 localhost 独立测试组织，保留用户 127.0.0.1 当前组织数据。
