# Pislaka Agent V2 更新交接说明

## 仓库地址

https://github.com/belindama8893-jpg/Pislaka-front

## 一、支付与 Plus 会员流程

- 新用户获得 7 天 Pislaka Plus 免费试用。
- 30 天优惠价为 PKR 100，原价 PKR 1,000。
- 一年价格为 PKR 10,000。
- 当前为一次性购买，不自动续费。
- 支持两种第三方支付方式：
  - Alfa (JazzCash)：1.2% online payment fee。
  - Alfa (Card)：2.4% online payment fee。
- Checkout 会根据套餐和支付方式自动计算支付手续费及最终总金额。
- 点击支付后跳转第三方支付平台。
- 支付返回后显示成功、失败或取消状态。
- 支付成功后成为 Plus 用户，只显示 `Usage remaining XX%`，不显示 Token 数量。
- Plus 状态卡显示到期日期。

## 二、Listing 发布流程

- 未发布房源显示 `Publish` 操作。
- 点击 `Publish` 后弹出确认窗口，发布目标显示为 `www.pislaka.com`。
- 发布成功后显示成功结果和公开访问地址。
- 已发布房源的标题可以直接点击，打开公开房源页面。
- 列表页和详情页均支持快速访问已发布房源。
- 详情页支持取消发布，操作前需要确认。
- 发布失败有对应的失败提示。
- 删除 Listing 前需要确认。
- 列表页操作已精简为图标按钮，悬停后显示说明。

## 三、首页调整

- 首页主标题改为 `Meet your AI team`。
- 删除原来的首页副标题。
- Listing、Marketing、Sales、Transaction、Team 五个选项均保留对应的能力快捷按钮。
- 调整了首页选项、快捷按钮和输入框的间距及整体位置。

## 四、其他统一调整

- Listing 和 Leads 的列表页、详情页操作样式已统一。
- Leads 列表保留 Ask Agent 和 Delete。
- PC 与 Mobile 均做了响应式适配。
- Demo 为前端交互原型，第三方支付和服务端回调目前使用模拟流程。

## 五、运行方式

下载或克隆仓库后，可以直接打开 `index.html`；也可以在仓库根目录运行：

```bash
python3 -m http.server 4180
```

然后访问：

```text
http://127.0.0.1:4180/
```

