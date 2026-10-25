# Translate & Search — Search Desk

先翻译，再搜索。设计首先解释只用母语搜索容易错过的信息，然后让用户直接尝试搜索词翻译。官网不承诺完整互联网、搜索排名或翻译准确率，不将搜索词翻译说成整页翻译。隐私说明必须区分网站的浏览器本机翻译、用户选择的 Google 在线翻译，以及扩展的 Bing/Google 在线流程。

## Visual foundations

`tokens.json` 是官网设计值的唯一来源，构建脚本将它输出为公开的 `assets/brand-tokens.css`。背景用 `bg`，工具用 `surface`，标题与正文用 `text`，辅助文字用 `muted`；主要按钮使用 `accent` 配白字。`brand-orange` 来自已确认的橙色品牌方向，仅作装饰，不作为白底小字。交互边界与键盘焦点使用 `focus`，`line` 仅作分隔。

保留原有系统字体方案，不增加外部字体请求。标题按 display/heading/subheading 层级，正文不小于 body，说明使用 caption。移动端 display 降为 40px，长标题允许自然换行。按钮和选择器最小触控高度为 44px。搜索工具用 `radius-lg`，字段与按钮用 `radius-sm`；正文页面不重复嵌套卡片，不使用大面积渐变、emoji 或左侧强调边框。

## Components

官网是原生 HTML/CSS，没有 React 组件库或可提取的运行时 bundle。本系统提供静态 HTML 使用规范：Button、Field、Panel；它们对应生产样式中的 `.button`、`.field`、`.panel`。交互由现有 `search.js` 提供，设计稿不伪造翻译结果。每个组件的调用方须提供真实标签、内容及状态。

## Iconography

生产网站继续引用已确认的 `assets/favicon-96.png`，不重新绘制或更换 App 图标。装饰性线条图标用简单描边 SVG 并加 `aria-hidden`；品牌名始终使用真实文本。素材导入工具不可用，本设计系统不伪造素材上传记录或图标副本，封面使用文字品牌。

## Source inventory

来源为独立网站仓库的 `_templates/`、`styles.css`、`search.js` 和已确认的品牌图标。旧版 8 个颜色变量为 bg #f6f7fb、surface #ffffff、surface-soft #f1f4fb、text #18212f、muted #5d6b82、line #d9e0ec、accent #316bff、accent-soft #eaf0ff；本次明确将其改为 tokens 中的 Search Desk 配色，并加入品牌装饰色及焦点色。清单包括 10 个颜色、7 个文字样式、8 级间距、3 种圆角、3 个静态组件规范。

Not synced: 无外部字体文件；已确认的 PNG 未导入设计编辑器素材库；没有运行时组件 bundle。当前会话缺少 design_system_check，不能声称专用卡片校验已通过。实际网站仍需通过构建、SEO、交互、对比度及浏览器检查后发布。
