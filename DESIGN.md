# DESIGN.md

> 让温润山系的手账画感，盛装每一个清新浪漫的时光故事。

## 1. Visual Theme & Atmosphere

**Style**: 高定温润山系手账画报风 (Jelu Warm Organic Style)
**Keywords**: 温润奶油、自然山系、法式浪漫、质朴手账、极简留白
**Tone**: 治愈、温馨、优雅 — NOT 酷炫、工业、冰冷、荧光极光
**Feel**: 像是清晨林间的一缕晨光，落在带有淡淡草木香的燕麦奶油色纸张上，伴着两片微微摇曳的薄荷叶，一切都在温柔地叙事。

**Interaction Tier**: L2 流畅交互 (Scroll Reveal, Float Parallax Elements, 3D Page Flip Clock)
**Dependencies**: CSS only + GSAP (3.12.2) + ScrollTrigger (3.12.2)

## 2. Color Palette & Roles

```css
:root {
  /* Backgrounds */
  --bg: #E6EFE5;                             /* 治愈系薄荷绿底色 (Jelu 经典底色) */
  --surface: #F4F7F3;                        /* 燕麦奶油白卡片表面 (纸张质感) */
  --surface-alt: #EAEFE8;                    /* 罗勒浅绿交替表面 */
  --surface-hover: #FFFFFF;                  /* 悬停态纯白高亮表面 */

  /* Borders */
  --border: rgba(255, 255, 255, 0.7);        /* 极致轻薄的柔白纸张描边 */
  --border-hover: #2D3E35;                   /* 悬停森林深绿虚线/实线边框 */

  /* Text */
  --text: #2D3E35;                           /* 经典森林深绿 (主标题、主文字) */
  --text-secondary: rgba(45, 62, 53, 0.85);  /* 清晰草木绿 (正文、描述文字) */
  --text-tertiary: #8EA485;                  /* 鼠尾草绿 (副标题、提示小字) */

  /* Accent */
  --accent: #E06D53;                         /* 温暖番茄红 (爱心、高亮重点、节日喜悦) */
  --accent-hover: #C5563D;

  /* RGB variants for rgba() */
  --bg-rgb: 230, 239, 229;
  --accent-rgb: 224, 109, 83;

  /* Semantic */
  --success: #6D8268;                        /* 罗勒清绿 (手账成功状态) */
  --error: #E06D53;                          /* 番茄暖红 (故障状态) */
  --warning: #C0A98F;                        /* 麦穗暖沙 (警告状态) */
}
```

**Color Rules:**
- 所有页面交互与组件颜色必须通过 CSS 变量或 Tailwind 自定义颜色（`primary`, `secondary`, `accent`, `cream`, `sageBg`）进行引用，**严禁硬编码 hex**。
- 全局使用柔和对比度，文字颜色应在深绿与暖褐色之间取得温润的平衡，不要使用刺眼的 `#000000` 或强对比度荧光色。
- 一屏内的强对比视觉落点（如番茄红 `#E06D53`）不超过 2 处，保持山系画风的克制 and 呼吸感。

## 3. Typography Rules

**Font Stack:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@300;400;500;700&display=swap');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1 | Fraunces, Noto Serif SC | 4xl - 7xl | 300 - 400 | 1.1 | -0.02em |
| Section H2 | Fraunces, Noto Serif SC | 3xl - 4xl | 400 | 1.2 | 0.05em |
| H3 / Card Title | Fraunces, Noto Serif SC | xl - 2xl | 500 | 1.3 | 0.02em |
| Body / Text | Plus Jakarta Sans, Noto Serif SC | sm - base | 300 - 400 | 1.7 | 0.02em |
| Label / Tag | Playfair Display, Noto Serif SC | 2xs - xs | 600 - 700 | 1.4 | 0.35em - 0.4em |
| Clock Numbers | Fraunces | 3xl - 5xl | 500 | 1.0 | 0 |

**Typography Rules:**
- 中文排版必须优先适配 `Noto Serif SC`（宋体/明体衬线），行高严格控制在 1.7 以上，保持松弛留白。
- 英文衬线选用 `Fraunces`（具有高定浪漫手写微弧度）与 `Playfair Display`（高雅华贵）。
- 英文字符与中文字符混排时，应保留合理的微小空格，提高画报的精细质质感。
- **NEVER use**: Arial, Impact, Comic Sans 或未定义的无衬线系统黑体作为标题。

**Text Decoration:**
- Hero Title / H1 标题: 拒绝生硬的高亮渐变，使用深林绿为主色，点缀词（如 "Windy Spring"）使用斜体 `Playfair Display` 配合 `text-secondary` 呈现。
- 标签采用全部大写 (Uppercase) + 宽字距，底部搭配虚线 (Dotted) 边框，复刻手账刻印痕迹。

## 4. Component Stylings

### Buttons
```css
/* Jelu 胶囊主按钮 */
.jelu-btn-primary {
  background-color: var(--text);
  color: var(--surface);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 0.875rem 1.75rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(45, 62, 53, 0.06);
}

.jelu-btn-primary:hover {
  background-color: var(--text-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(45, 62, 53, 0.12);
}

.jelu-btn-primary:active {
  transform: scale(0.95);
}

/* Jelu 复古手账虚线按钮 */
.jelu-dotted-btn {
  border-bottom: 2px dotted var(--text);
  color: var(--text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding-bottom: 0.25rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.jelu-dotted-btn:hover {
  border-bottom-style: solid;
  letter-spacing: 0.15em;
  color: var(--accent);
  border-bottom-color: var(--accent);
}
```

### Cards
```css
/* Jelu 极致大圆角软纸卡片 */
.jelu-card {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 15px 45px rgba(45, 62, 53, 0.03);
  border-radius: 2.5rem; /* 极致大圆角 */
  padding: 2.5rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.jelu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 25px 55px rgba(45, 62, 53, 0.06);
}
```

### Navigation
```css
/* Jelu 顶奢胶囊毛玻璃导航栏 */
.nav-pill {
  background: rgba(244, 247, 243, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 30px rgba(45, 62, 53, 0.04);
  transition: all 0.3s ease;
}
```

### Links
```css
.jelu-link {
  color: var(--text-tertiary);
  transition: color 0.3s ease;
  position: relative;
}

.jelu-link::after {
  content: '';
  position: absolute;
  width: 100%;
  transform: scaleX(0);
  height: 1px;
  bottom: -2px;
  left: 0;
  background-color: var(--accent);
  transform-origin: bottom right;
  transition: transform 0.25s ease-out;
}

.jelu-link:hover {
  color: var(--accent);
}

.jelu-link:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}
```

### Tags / Badges
```css
.jelu-tag {
  background-color: rgba(142, 164, 133, 0.15);
  color: var(--text);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  text-transform: uppercase;
}
```

## 5. Layout Principles

**Container:**
- Max width: 1200px (75rem)
- Padding: 1.5rem (24px)
- Narrow variant (text-heavy): 800px (50rem)

**Spacing Scale:**
- Section padding: 6rem (96px)
- Component gap: 2rem (32px)
- Card internal padding: 2.5rem (40px)

**Grid:**
```css
.jelu-grid-3 {
  display: grid;
  grid-template-cols: repeat(1, minmax(0, 1fr));
  gap: 2rem;
}
@media (min-width: 768px) {
  .jelu-grid-3 {
    grid-template-cols: repeat(3, minmax(0, 1fr));
  }
}
```

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 无阴影，纯粹的极简描边 | 内部微小卡片、静止输入框 |
| Subtle | `0 8px 25px rgba(45, 62, 53, 0.02)` | 静态大区域面板、微型便签 |
| Elevated | `0 15px 45px rgba(45, 62, 53, 0.03)` | 默认 Jelu 卡片状态 |
| High | `0 25px 55px rgba(45, 62, 53, 0.06)` | Hover 浮起状态、黑胶唱盘浮空底盘 |

## 7. Animation & Interaction

**Motion Philosophy**: 高保真柔和手感，杜绝粗暴的线性补间。所有核心动效必须通过 `transform` 或 `opacity` 在 GPU 线程中进行，减少 Reflow/Repaint 损耗。

**Tier**: L2 流畅交互

### Dependencies
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
```

### Entrance Animation
```css
/* 3D Parallax 绿叶漂浮微动效，完美利用 GPU 硬件加速 */
.animate-leaf-float-1 {
  animation: leafFloat1 18s ease-in-out infinite;
  will-change: transform;
}
.animate-leaf-float-2 {
  animation: leafFloat2 24s ease-in-out infinite;
  will-change: transform;
}
.animate-float {
  animation: float 6s ease-in-out infinite;
  will-change: transform;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}
@keyframes leafFloat1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(15px, -20px) rotate(25deg); }
}
@keyframes leafFloat2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-20px, -15px) rotate(-30deg); }
}
```

### Scroll Behavior
```js
// GSAP 滚动 reveal 机制
gsap.registerPlugin(ScrollTrigger);

// 首页卡片滚动缓动触发
gsap.from(".jelu-card", {
    scrollTrigger: {
        trigger: "#restaurant",
        start: "top 80%",
        toggleActions: "play none none reverse"
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power2.out"
});
```

### Hover & Focus States
- 所有的 Bento 卡片在 Hover 时必须具有完美的平滑上移（`translateY(-6px)`） and 阴影变深动效。
- 虚线分割线和文字等微小元素，Hover 时字距（`letter-spacing`）平滑拉开。

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .animate-leaf-float-1,
  .animate-leaf-float-2,
  .animate-float,
  .vinyl-spin {
    animation: none !important;
    transform: none !important;
  }
}
```

## 8. Do's and Don'ts

### Do
- 必须使用 `#E6EFE5` 作为全局温润薄荷绿底色。
- 所有大容器在 Hover 时，阴影必须采用极低饱和度的草木色过渡（如 `rgba(45, 62, 53, 0.04)`）。
- 倒计时 3D 折折牌必须采用上 `#3A5044` 下 `#2D3E35` 森林绿高定色，文字颜色强制为 `#F4F7F3`（奶油色）。
- 中文排版必须有松弛的间距，行高 `line-height` 强制 ≥ 1.7。
- 100% 保留留声机音频同步、信箱爆出、创作者长按解锁等全套原装逻辑。

### Don't
- ❌ 绝对不要使用荧光紫、荧光粉红或极光霓虹蓝渐变背景。
- ❌ 倒计牌中间绝对不能出现横切黑白粗分割线，以防视觉数字割裂。
- ❌ 不要在此页面应用任何大面积高饱和度色块。
- ❌ 不要在大面积滚动区域使用 `backdrop-filter: blur(>16px)`，防低配卡顿。
- ❌ 不要硬编码颜色 hex 值，一律使用定义好的 CSS 变量或 Tailwind 自定义色彩系统。
- ❌ 绿叶和番茄漂浮元素绝对不要设置 `filter: blur()`，改为直接用高清矢量图或半透明 SVG 进行轻度漂浮以避免 CPU 绘制瓶颈。
- ❌ 绝不能让漂浮元素挡住移动端的导航和点击按钮。
- ❌ 倒计时牌下方绝对不能存在数字残影和透光遮罩穿透。

## 9. Responsive Behavior

**Breakpoints:**
| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > 1024px | 左右非对称大排版，3D 绿叶与圆形时光舱完美展开，右侧沙拉爱意圆盘显示完整 |
| Tablet | 768px - 1024px | 双栏自适应，间距微调，圆形时光舱适当等比缩放 |
| Mobile | < 768px | 首屏降级为上下层级大单栏排版，绿叶粒子漂浮减少，防止误触，唱片机小挂件完美右下角浮空 |

**Touch Targets:** 至少 44×44px 宽度，间距适当拉大。
**Collapsing Strategy:** 导航栏在移动端完美折叠为高定植物风“汉堡包”按钮与温润白色拉出式滑盖侧边栏。

```css
@media (max-width: 767px) {
  body {
    background-image: radial-gradient(circle at 50% 20%, rgba(244, 247, 243, 0.8) 0%, transparent 60%);
  }
  .jelu-card {
    border-radius: 2rem;
    padding: 1.75rem;
  }
}
```
