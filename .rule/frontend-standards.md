# 舟舟与小羊 · 前端编码规范

> 版本 v1.0 · 技术栈：Vue 3 + TypeScript + Uni-app + Tailwind CSS

---

## 一、目录结构

```
src/
├── pages/
│   ├── index/          # 首页（倒计时、相册、歌单）
│   ├── restaurant/     # 小餐馆
│   ├── tavern/         # 小酒馆
│   ├── clinic/         # 小诊所
│   └── museum/         # 纪念博物馆
├── components/
│   ├── GlassCard.vue          # 通用毛玻璃卡片
│   ├── FloatingMusicPlayer.vue # 全局悬浮播放器
│   ├── UploadDialog.vue       # 创作者模式上传弹窗
│   └── CountdownTimer.vue     # 防抖动倒计时
├── composables/
│   ├── useRecipes.ts
│   ├── useCycleRecord.ts
│   ├── useMilestones.ts
│   └── usePlayerStore.ts
├── stores/
│   ├── useClinicStore.ts
│   ├── useRestaurantStore.ts
│   ├── useMuseumStore.ts
│   └── usePlayerStore.ts
├── utils/
│   ├── auth.ts         # 暗号解锁逻辑
│   ├── upload.ts       # 文件上传工具
│   └── date.ts         # 日期处理工具
└── styles/
    ├── variables.css   # CSS 变量（颜色、动效、字体）
    └── components.css  # 毛玻璃等通用组件样式
```

---

## 二、命名规范

### 2.1 文件与组件

- 页面组件：`PascalCase`，文件名与组件名一致，如 `RecipeCard.vue`
- Composable 文件：`use` 前缀 + `camelCase`，如 `useRecipes.ts`
- 工具函数文件：`camelCase`，如 `dateHelper.ts`
- 样式文件：`kebab-case`，如 `glass-panel.css`

### 2.2 变量与函数

```typescript
// ✓ 变量和函数：camelCase
const cycleDay = ref(0)
async function fetchRecipes() { ... }

// ✓ 组件和类：PascalCase
const UserCard = defineComponent({ ... })

// ✓ 常量：SCREAMING_SNAKE_CASE
const MAX_UPLOAD_SIZE_MB = 10
const API_BASE_URL = 'https://api.example.com'

// ✓ 布尔值以 is / has / should 开头
const isLoading = ref(false)
const hasPermission = ref(false)

// ✓ 事件处理函数以 handle 开头，Props 回调以 on 开头
const handleSubmit = () => { ... }
// Props: onSave: () => void
```

---

## 三、Vue 3 组件规范

### 3.1 使用 `<script setup lang="ts">`

所有组件必须使用组合式 API，禁止 Options API：

```vue
<!-- ✓ 推荐 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
const cycleDay = ref(0)
const phase = computed(() => cycleDay.value < 14 ? '卵泡期' : '黄体期')
</script>

<!-- ✗ 禁止 -->
<script>
export default {
  data() { return { cycleDay: 0 } }
}
</script>
```

### 3.2 Props 使用泛型类型声明

```typescript
// ✓ 推荐：泛型写法，提供完整类型检查
interface RecipeCardProps {
  title: string
  imageUrl: string
  rating: 1 | 2 | 3 | 4 | 5
  isHomemade?: boolean
}
const props = defineProps<RecipeCardProps>()
const { title, rating, isHomemade = false } = toRefs(props)

// ✗ 禁止：运行时声明，无类型安全
const props = defineProps({
  title: String,
  rating: Number
})
```

### 3.3 Emits 声明类型签名

```typescript
// ✓ 推荐
const emit = defineEmits<{
  addMilestone: [date: string, content: string, imageUrl?: string]
  deleteMilestone: [id: string]
}>()

// ✗ 禁止
const emit = defineEmits(['addMilestone', 'deleteMilestone'])
```

### 3.4 组件单一职责

组件内容超过以下任一阈值时，拆分为子组件或 composable：

- 超过 3 个独立的 `useState` + `useEffect` 协同逻辑
- 模板超过 150 行
- 同时负责数据获取和复杂 UI 渲染

```vue
<!-- ✓ 容器组件只负责数据 -->
<script setup lang="ts">
const { recipes, loading } = useRecipes()
</script>
<template>
  <RecipeList :recipes="recipes" :loading="loading" />
</template>

<!-- ✗ 一个组件做所有事 -->
<!-- fetch + filter + sort + modal + upload... -->
```

---

## 四、TypeScript 规范

### 4.1 禁止使用 `any`，未知类型用 `unknown`

```typescript
// ✓ 推荐
function parseCloudResponse(input: unknown): Recipe {
  if (!isRecipe(input)) throw new Error('数据格式不正确')
  return input
}

// ✗ 禁止
function parseCloudResponse(input: any): any {
  return input as Recipe
}
```

### 4.2 导出函数必须标注返回类型

```typescript
// ✓ 推荐
export async function getNextCycleDate(records: CycleRecord[]): Promise<string> { ... }

// ✗ 禁止（返回类型由推断决定，接口不明确）
export async function getNextCycleDate(records: CycleRecord[]) { ... }
```

### 4.3 善用工具类型，避免重复定义

```typescript
// ✓ 推荐
type UpdateRecipeDto = Partial<Pick<Recipe, 'title' | 'ingredients' | 'steps'>>
type RecipePreview = Omit<Recipe, 'steps' | 'tips'>

// ✗ 禁止（手写重复结构，与源类型不同步）
type UpdateRecipeDto = {
  title?: string
  ingredients?: Ingredient[]
}
```

### 4.4 使用 `interface` 定义对象形状

```typescript
// ✓ 推荐
interface CycleRecord {
  id: string
  startDate: string
  duration: number
  painLevel: 1 | 2 | 3 | 4 | 5
  symptoms: string[]
  createdAt: string
}

// ✓ 联合类型用 type
type CyclePhase = '月经期' | '卵泡期' | '排卵期' | '黄体期'
```

---

## 五、样式规范

### 5.1 设计 Token 必须用 CSS 变量

所有颜色、间距、动效参数在 `styles/variables.css` 中定义，组件内只引用变量：

```css
/* styles/variables.css */
:root {
  /* 品牌色 */
  --color-mint: #10B981;
  --color-violet: #8B5CF6;

  /* 极光背景 */
  --aurora-bg: linear-gradient(135deg, #d1fae5, #f3e8ff, #e0f2fe);
  --aurora-duration: 15s;

  /* 毛玻璃 */
  --glass-bg: rgba(255, 255, 255, 0.4);
  --glass-blur: blur(16px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.3);

  /* 动效 */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ✗ 禁止在组件内硬编码 */
/* .title { color: #10B981; } */
```

### 5.2 毛玻璃效果用统一 class

```css
/* styles/components.css */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: 16px;
}

/* ✗ 禁止每个组件各写一遍 */
```

### 5.3 数字显示必须防抖动

倒计时、天数、生理期天数等数字区域必须设置：

```css
.countdown-digit {
  font-variant-numeric: tabular-nums;
  min-width: 5rem;    /* 固定宽度防位移 */
  text-align: center;
  font-feature-settings: "tnum";
}
```

### 5.4 响应式采用移动端优先

```css
/* ✓ 推荐：从移动端基础样式开始 */
.recipe-grid { grid-template-columns: 1fr; }

@media (min-width: 768px) {
  .recipe-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .recipe-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ✗ 禁止桌面优先再覆盖 */
```

---

## 六、状态管理规范

### 6.1 每个模块独立 Pinia store

```
stores/
  useClinicStore.ts      // 生理期记录、用药提醒
  useRestaurantStore.ts  // 探店日记、私房菜谱
  useMuseumStore.ts      // 时光轴节点
  usePlayerStore.ts      // 全局歌单播放状态
```

禁止将所有状态混入一个全局 store。

### 6.2 远程数据用 composable 封装

```typescript
// composables/useRecipes.ts
export function useRecipes() {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const res = await uniCloud.callFunction({ name: 'restaurant', data: { action: 'getRecipes' } })
      recipes.value = res.result.data
    } catch (e) {
      error.value = '加载失败，请重试'
    } finally {
      loading.value = false
    }
  }

  return { recipes, loading, error, fetchAll }
}
```

### 6.3 派生状态不存入 `ref`

```typescript
// ✓ 推荐：直接计算
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
const totalCalories = computed(() =>
  ingredients.value.reduce((sum, i) => sum + i.calories, 0)
)

// ✗ 禁止：用 watchEffect 同步派生状态
const fullName = ref('')
watchEffect(() => { fullName.value = `${firstName.value} ${lastName.value}` })
```

### 6.4 敏感数据存储规范

```typescript
// ✓ 生理期、用药记录 → 存云端，不存本地
await uniCloud.callFunction({ name: 'clinic', data: { action: 'saveCycleRecord', ...data } })

// ✓ 暗号解锁状态 → 只存 sessionStorage（关闭标签页失效）
sessionStorage.setItem('creator_unlocked', '1')

// ✗ 禁止：敏感数据明文存本地
// uni.setStorageSync('cycle_data', JSON.stringify(sensitiveData))

// ✗ 禁止：解锁状态持久化
// localStorage.setItem('creator_unlocked', 'true')
```

---

## 七、音频规范

### 7.1 必须提供双格式回退

```vue
<template>
  <audio ref="bgmRef" loop preload="metadata">
    <source :src="currentSong.mp3Url" type="audio/mpeg">
    <source :src="currentSong.m4aUrl" type="audio/mp4">
  </audio>
</template>
```

禁止使用 `.wav` 格式（文件过大）和 `autoplay` 属性。

### 7.2 通过用户首次交互触发播放

```typescript
// ✓ 推荐：监听首次点击触发
const handleFirstInteraction = () => {
  bgmRef.value?.play().catch(() => {})
  document.removeEventListener('click', handleFirstInteraction)
}

onMounted(() => {
  document.addEventListener('click', handleFirstInteraction, { once: true })
})
```

### 7.3 歌单统一管理，支持自动顺播

```typescript
// stores/usePlayerStore.ts
const songs = ref<Song[]>([])
const currentIndex = ref(0)
const isPlaying = ref(false)

function playNext() {
  currentIndex.value = (currentIndex.value + 1) % songs.value.length
}

// 监听播放结束自动切歌
onMounted(() => {
  audioEl.addEventListener('ended', playNext)
})
```

---

## 八、安全规范

### 8.1 暗号验证不在前端做

```typescript
// ✓ 推荐：调用云函数验证，前端不存暗号
async function verifySecret(input: string): Promise<boolean> {
  const res = await uniCloud.callFunction({
    name: 'auth',
    data: { action: 'verifySecret', secret: input }
  })
  return res.result.code === 0
}

// ✗ 禁止：前端硬编码暗号
const SECRET = 'zhouzhou520'
if (input === SECRET) unlock()
```

### 8.2 图片上传前端校验

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_SIZE_MB = 10

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return '只支持 JPG / PNG / WebP 格式'
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `图片不能超过 ${MAX_SIZE_MB}MB`
  return null
}
```

---

## 九、错误处理规范

### 9.1 用户可见错误统一用 Toast 展示

不允许使用原生 `alert()`，所有用户提示通过统一的 Toast 组件展示，区分成功、警告、错误三种类型：

```typescript
// utils/toast.ts
export const toast = {
  success: (msg: string) => uni.showToast({ title: msg, icon: 'success', duration: 2000 }),
  error: (msg: string) => uni.showToast({ title: msg, icon: 'error', duration: 2500 }),
  info: (msg: string) => uni.showToast({ title: msg, icon: 'none', duration: 2000 })
}

// 使用
toast.error('图片上传失败，请重试')
toast.success('纪念节点已添加 🎉')
```

### 9.2 网络请求必须处理三种状态

所有云函数调用的组件必须在模板中明确处理 loading / error / 空数据三种状态，不能只处理成功情况：

```vue
<template>
  <!-- loading 状态 -->
  <div v-if="loading" class="flex justify-center py-12">
    <LoadingSpinner />
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="text-center py-12">
    <p class="text-gray-500">{{ error }}</p>
    <button @click="fetchAll" class="mt-4 btn-ghost">重新加载</button>
  </div>

  <!-- 空数据状态 -->
  <div v-else-if="recipes.length === 0" class="text-center py-12">
    <p class="text-gray-400">还没有菜谱，快去添加第一道吧 🍳</p>
  </div>

  <!-- 正常数据 -->
  <RecipeList v-else :recipes="recipes" />
</template>
```

### 9.3 图片加载失败提供兜底图

```vue
<template>
  <img
    :src="imageUrl"
    :alt="title"
    @error="handleImageError"
    class="w-full h-48 object-cover"
  />
</template>

<script setup lang="ts">
const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/static/images/placeholder.png'
}
</script>
```

---

## 十、性能规范

### 10.1 图片懒加载

所有列表中的图片必须开启懒加载，Uni-app 中使用 `lazy-load` 属性：

```vue
<!-- ✓ 推荐 -->
<image
  :src="recipe.coverUrl"
  lazy-load
  mode="aspectFill"
  class="w-full h-48"
/>

<!-- ✗ 禁止：列表中不做懒加载，首屏加载几十张图 -->
<image :src="recipe.coverUrl" mode="aspectFill" />
```

### 10.2 列表渲染提供稳定唯一的 key

```vue
<!-- ✓ 用业务 ID 作为 key -->
<RecipeCard
  v-for="recipe in recipes"
  :key="recipe.id"
  :recipe="recipe"
/>

<!-- ✗ 禁止用 index，排序或增删时导致 DOM 复用错误 -->
<RecipeCard
  v-for="(recipe, index) in recipes"
  :key="index"
/>
```

### 10.3 谨慎使用 `watchEffect` 和 `watch`，避免无限循环

```typescript
// ✓ 明确指定依赖，避免宽泛监听
watch(() => cycleStore.records, (newRecords) => {
  updateCalendar(newRecords)
}, { deep: false })  // 仅监听引用变化

// ✗ 禁止：watchEffect 内修改被监听的响应式变量
watchEffect(() => {
  loading.value = true          // 触发 watchEffect 重新执行
  fetchData(loading.value)      // 无限循环
})
```

### 10.4 时光轴动画使用 GSAP ScrollTrigger，禁止 JS 计时器模拟

```typescript
// ✓ 推荐：GSAP 硬件加速，性能好
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  gsap.from('.timeline-node', {
    opacity: 0,
    y: 40,
    duration: 0.6,
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.timeline-container',
      start: 'top 80%'
    }
  })
})

// ✗ 禁止：setTimeout 模拟动画，掉帧且不精准
setTimeout(() => { node.style.opacity = '1' }, 300 * index)
```

---

## 十一、可访问性规范（a11y）

### 11.1 图片必须提供 alt 文本

```vue
<!-- ✓ 推荐：有意义的 alt -->
<image :alt="`${recipe.title}的菜品照片`" :src="recipe.coverUrl" />

<!-- 装饰性图片 alt 设为空字符串 -->
<image alt="" :src="decorativeIcon" />

<!-- ✗ 禁止：省略 alt -->
<image :src="recipe.coverUrl" />
```

### 11.2 交互元素必须可通过键盘操作

```vue
<!-- ✓ 暗号解锁触发器：同时支持点击和键盘 Enter -->
<div
  role="button"
  tabindex="0"
  @click="startSecretUnlock"
  @keydown.enter="startSecretUnlock"
  aria-label="长按解锁创作者模式"
>
  <img src="/static/logo.png" alt="舟舟与小羊 Logo" />
</div>
```

### 11.3 弹窗打开时焦点应移入弹窗，关闭时还原

```typescript
// UploadDialog.vue
const dialogRef = ref<HTMLElement>()

watch(isOpen, (open) => {
  if (open) {
    nextTick(() => dialogRef.value?.focus())
  } else {
    triggerRef.value?.focus()  // 还原焦点到触发元素
  }
})
```

---

## 十二、代码格式

### 12.1 工具配置

项目根目录必须包含以下配置文件，所有成员使用相同配置：

```
.eslintrc.cjs       # ESLint 规则
.prettierrc         # Prettier 格式化
tsconfig.json       # TypeScript 配置
.editorconfig       # 编辑器基础配置
```

### 12.2 格式规则

| 项目 | 规则 |
|------|------|
| 缩进 | 2 个空格 |
| 字符串 | 单引号 `'` |
| 语句末分号 | 不加 |
| 最大行宽 | 100 字符 |
| 尾随逗号 | `'es5'`（对象、数组最后一项加逗号） |
| Vue 属性超过 3 个 | 每个属性单独一行 |

### 12.3 Vue 文件结构顺序

```vue
<!-- 固定顺序：script → template → style -->
<script setup lang="ts">
// 1. 外部 import
// 2. Props / Emits 声明
// 3. Store / Composable 调用
// 4. 响应式状态
// 5. 计算属性
// 6. 方法
// 7. 生命周期
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 组件私有样式 */
</style>
```

### 12.4 提交信息规范（Conventional Commits）

```
feat(museum): 新增时光轴节点动画效果
fix(clinic): 修复生理期预测日期偏差一天的问题
style(restaurant): 调整菜谱卡片圆角与阴影
refactor(player): 将歌单逻辑提取为 usePlayerStore
chore: 升级 Tailwind CSS 至 v3.4
```

---

*设计视觉细节参见《设计需求文档》，接口与数据库结构参见《后端编码规范》。*
