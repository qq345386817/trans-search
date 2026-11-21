# Translate & Search — Search Desk

先翻译，再搜索。官网采用克制、明亮的桌面工具质感：首屏以分栏编辑排版搭配交互式浏览器搜索演示，随后通过吸顶三步引导过渡到真实可用的在线搜索词翻译工作台，再以交替节奏呈现核心理念、扩展实景演示、使用场景、隐私边界与浏览器扩展入口。

官网不承诺完整互联网、搜索排名或翻译准确率，不将搜索词翻译说成整页翻译，也不虚构用户评价或未上架平台。隐私说明严格区分网站的浏览器本机翻译、用户主动选择的 Google 在线翻译，以及扩展的 Bing/Google 在线流程。

## Visual foundations

`tokens.json` 是官网设计值的唯一来源，构建脚本将其输出为公开的 `assets/brand-tokens.css`。画布采用浅暖白 `bg`（`#fafaf8`）与轻交替色带 `bg-warm`，交互舞台与工作台采用纯白 `surface` 配细描边 `line` 与柔和多层阴影；文字使用高对比深墨绿 `text`（`#15231d`）和 `muted`（`#526059`）；主按钮与关键强调词使用朱砂红 `accent`（`#b83f16`）配白字；`brand-orange` 仅用于极柔和的环境光晕与装饰细节；键盘焦点与本机隐私提示使用 `focus`（`#205a43`）。

保留系统字体栈（含等宽字体栈 `--font-mono` 用于呈现搜索语法如 `"SwiftUI"` 与 `site:`），不增加外部字体请求。所有交互控件保持最小 44px 触控高度，支持 12 语言（含阿拉伯语 RTL）以及 `prefers-reduced-motion: reduce`。

## Interactive choreography & components

官网全部由原生 HTML、CSS 与零依赖脚本（`search.js`、`search-core.js`、`i18n.js`、`site-ui.js`）实现，渐进增强：关闭或未运行动效脚本时页面内容保持完全可见。

- **Floating Pill Header**：顶部自然贴合背景，向下滚动后收束为居中毛玻璃胶囊导航栏。
- **Hero Browser Stage**：呈现真实搜索词翻译链路的交互舞台，支持 3 组场景切换并一键载入下方真实工作台。
- **Sticky Try-It Duo**：左侧 01/02/03 吸顶步骤与右侧真实工作台状态联动。
- **Extension Action Simulator**：3 个可切换标签演示扩展的自动/手动控制、引号与 `site:` 语法保留、以及预览编辑与第二语言对照。
- **Scroll Progress Back-to-Top**：右下角圆环进度返回顶部控件。

## Iconography

生产网站继续引用已确认的 `assets/favicon-96.png` 与 `assets/apple-touch-icon-180.png`，不重绘 App 图标。界面辅助图标使用简洁描边内联 SVG 并标记 `aria-hidden="true"`；品牌名始终使用真实文本。
