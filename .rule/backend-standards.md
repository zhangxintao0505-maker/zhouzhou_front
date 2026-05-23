# 舟舟与小羊 · 后端编码规范

> 版本 v1.0 · 技术栈：Node.js + uniCloud 云函数 + uniCloud 云数据库 + 云存储（OSS）

---

## 一、架构概览

```
uniCloud/
├── cloudfunctions/
│   ├── auth/               # 鉴权：暗号验证、Token 签发
│   ├── restaurant/         # 小餐馆：探店日记、私房菜谱
│   ├── tavern/             # 小酒馆：微醺图鉴、调酒配方
│   ├── clinic/             # 小诊所：生理期、用药记录
│   ├── museum/             # 纪念博物馆：时光轴节点
│   └── upload/             # 统一文件上传处理
└── database/
    └── db_init.json        # 数据库集合初始化配置
```

每个业务模块对应独立云函数，互不干扰，可单独部署。云函数内部再通过 `action` 字段路由到具体处理器。

---

## 二、云函数结构规范

### 2.1 目录分层

每个云函数内部按以下结构组织，禁止将业务逻辑写在 `index.js` 中：

```
clinic/
├── index.js          # 入口：参数校验 + action 路由，不含业务逻辑
├── handlers/
│   ├── cycleRecord.js   # 生理期记录的增删改查
│   └── medication.js    # 用药记录与提醒管理
└── utils/
    └── dateHelper.js    # 生理期预测算法、日期格式化
```

### 2.2 入口文件标准模板

```javascript
// clinic/index.js
'use strict'

const { ok, fail } = require('./utils/response')
const cycleRecord = require('./handlers/cycleRecord')
const medication = require('./handlers/medication')

const HANDLERS = {
  // 生理期
  saveCycleRecord:       cycleRecord.save,
  getCycleHistory:       cycleRecord.getHistory,
  deleteCycleRecord:     cycleRecord.remove,
  predictNextCycle:      cycleRecord.predict,
  // 用药
  saveMedication:        medication.save,
  getMedicationList:     medication.getList,
  updateMedicationStatus: medication.updateStatus,
}

exports.main = async (event, context) => {
  try {
    const { action, data } = event

    if (!action) return fail('缺少 action 参数', 400)

    const handler = HANDLERS[action]
    if (!handler) return fail(`未知操作: ${action}`, 404)

    return await handler(data, event, context)
  } catch (e) {
    // 区分已知业务错误和未知系统错误
    if (e.code && e.message) return e
    console.error(JSON.stringify({
      level: 'error',
      function: 'clinic',
      action: event.action,
      message: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    }))
    return fail('服务器开了个小差，请稍后重试', 500)
  }
}
```

### 2.3 统一响应格式

所有云函数返回值必须使用 `{ code, message, data }` 结构。前端只需判断 `code` 字段：

```javascript
// utils/response.js（每个云函数内均包含此文件）
'use strict'

const ok = (data = null, message = 'ok') => ({
  code: 0,
  message,
  data
})

const fail = (message = '操作失败', code = 500) => ({
  code,
  message,
  data: null
})

module.exports = { ok, fail }
```

```javascript
// 使用示例
return ok({ cycleDay: 14, phase: '排卵期' })
return ok(null, '删除成功')
return fail('日期格式不正确', 400)
return fail('无操作权限', 401)
return fail('记录不存在', 404)
```

**HTTP 风格错误码约定：**

| code | 含义 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 / 暗号错误 |
| 403 | 无权限执行该操作 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 三、数据库规范

### 3.1 集合命名

| 集合名 | 对应模块 | 说明 |
|--------|---------|------|
| `cycle-records` | 小诊所 | 生理期记录 |
| `medication-records` | 小诊所 | 用药记录 |
| `restaurant-diaries` | 小餐馆 | 探店日记 |
| `recipes` | 小餐馆 | 私房菜谱 |
| `tavern-diaries` | 小酒馆 | 微醺图鉴 |
| `cocktail-recipes` | 小酒馆 | 调酒配方字典 |
| `museum-milestones` | 博物馆 | 时光轴节点 |
| `songs` | 全局 | 歌单 |
| `app-config` | 系统 | 应用配置（含暗号哈希） |

**命名规则：** 集合名用小写 `kebab-case` 复数形式，不使用驼峰或下划线。

### 3.2 文档字段规范

所有集合的文档必须包含以下基础字段：

```javascript
{
  _id: String,          // uniCloud 自动生成
  createdAt: Date,      // 创建时间，必填
  updatedAt: Date,      // 最后更新时间，必填
  // 业务字段...
}
```

字段命名使用 `camelCase`，禁止使用下划线或大驼峰：

```javascript
// ✓ 推荐
{
  startDate: '2025-05-01',
  painLevel: 2,
  imageUrl: 'cloud://xxx.jpg'
}

// ✗ 禁止
{
  start_date: '2025-05-01',
  PainLevel: 2,
  ImageURL: 'cloud://xxx.jpg'
}
```

### 3.3 各集合文档结构

#### cycle-records（生理期记录）
```javascript
{
  _id: String,
  startDate: String,        // 'YYYY-MM-DD'，经期开始日期
  duration: Number,         // 持续天数，1–10
  painLevel: Number,        // 痛感等级 1–5
  symptoms: Array<String>,  // 症状标签，如 ['痛经', '情绪波动']
  notes: String,            // 备注（可选）
  createdAt: Date,
  updatedAt: Date
}
```

#### recipes（私房菜谱）
```javascript
{
  _id: String,
  title: String,            // 菜名
  coverUrl: String,         // 封面图云存储 fileID
  isHomemade: Boolean,      // 是否小羊手作
  difficulty: Number,       // 难度 1–3
  ingredients: Array<{
    name: String,
    amount: String,         // 如 '200g'、'2个'
  }>,
  steps: Array<{
    order: Number,
    description: String,
    imageUrl: String        // 步骤图（可选）
  }>,
  tips: {
    success: String,        // 成功秘诀
    failure: String         // 翻车注意事项
  },
  tags: Array<String>,      // 如 ['家常', '快手', '甜品']
  rating: Number,           // 1–5
  createdAt: Date,
  updatedAt: Date
}
```

#### museum-milestones（时光轴节点）
```javascript
{
  _id: String,
  date: String,             // 'YYYY-MM-DD'，节点日期
  type: String,             // 'confession' | 'gift' | 'concert' | 'travel'
  title: String,            // 节点标题，如「第一次牵手」
  story: String,            // 故事描述（支持多段）
  images: Array<String>,    // 照片 fileID 列表，最多 4 张
  location: {               // 旅行节点专用
    name: String,           // 地点名称
    lat: Number,
    lng: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### app-config（应用配置）
```javascript
{
  _id: 'secret',
  secretHash: String        // 暗号的 SHA-256 哈希值，禁止存明文
}
```

### 3.4 查询规范

**禁止在循环中查询数据库（N+1 问题）：**

```javascript
// ✓ 推荐：一次性批量查询
const { data: milestones } = await db
  .collection('museum-milestones')
  .orderBy('date', 'desc')
  .limit(50)
  .get()

// ✗ 禁止：循环内逐条查询
for (const id of ids) {
  const item = await db.collection('museum-milestones').doc(id).get()
}
```

**分页查询必须使用 skip + limit：**

```javascript
async function getPaginatedRecipes({ page = 1, pageSize = 10 }) {
  const skip = (page - 1) * pageSize
  const { data } = await db
    .collection('recipes')
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  return data
}
```

**禁止查询全量数据后在内存中过滤：**

```javascript
// ✓ 推荐：在数据库层面过滤
const { data } = await db
  .collection('cocktail-recipes')
  .where({ baseSpirit: 'gin' })
  .get()

// ✗ 禁止：拉回所有数据再 filter
const { data: all } = await db.collection('cocktail-recipes').get()
const result = all.filter(r => r.baseSpirit === 'gin')
```

---

## 四、文件上传规范

### 4.1 流程

```
前端选择文件
  → 前端格式 + 大小校验（见前端规范）
    → 调用 uniCloud.uploadFile() 直传云存储
      → 获取 fileID 字符串
        → 调用云函数，只传入 fileID，不传文件内容
          → 云函数将 fileID 存入数据库
```

**禁止将文件内容（base64 或二进制）传入云函数或存入数据库。**

### 4.2 云存储路径规范

```javascript
// 路径格式：{模块}/{年月}/{时间戳}-{随机4位}.{ext}
const cloudPath = `restaurant/202505/1716883200000-a3f2.jpg`
const cloudPath = `museum/202505/1716883200000-b9c1.jpg`
const cloudPath = `clinic/202505/1716883200000-e5d4.png`
```

### 4.3 云函数侧二次校验

尽管前端已校验，云函数收到 fileID 后仍需校验扩展名：

```javascript
// upload/index.js
async function validateAndRegister({ fileID, module }) {
  const allowedModules = ['restaurant', 'tavern', 'clinic', 'museum']
  if (!allowedModules.includes(module)) {
    return fail('不支持的模块类型', 400)
  }

  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic']
  const ext = fileID.split('.').pop()?.toLowerCase()
  if (!ext || !allowedExts.includes(`.${ext}`)) {
    // 删除已上传的非法文件
    await uniCloud.deleteFile({ fileList: [fileID] })
    return fail('不支持的文件格式', 400)
  }

  return ok({ fileID })
}
```

---

## 五、鉴权规范

### 5.1 暗号验证流程

暗号以 SHA-256 哈希存储在 `app-config` 集合，明文永远不出现在代码或数据库中：

```javascript
// auth/handlers/secret.js
const crypto = require('crypto')
const { ok, fail } = require('../utils/response')
const db = uniCloud.database()

async function verifySecret({ secret }) {
  if (!secret || typeof secret !== 'string') {
    return fail('参数错误', 400)
  }

  // 加盐哈希，防彩虹表攻击
  const SALT = process.env.SECRET_SALT || 'zhouzhou-and-xiaoyang'
  const hash = crypto
    .createHash('sha256')
    .update(secret + SALT)
    .digest('hex')

  const { data } = await db.collection('app-config').doc('secret').get()

  if (!data || hash !== data.secretHash) {
    // 固定延迟，防止时序攻击
    await new Promise(r => setTimeout(r, 300))
    return fail('暗号错误', 401)
  }

  // 生成短效 Token（有效期 8 小时）
  const token = generateToken()
  return ok({ token, expiresIn: 8 * 60 * 60 })
}
```

### 5.2 Token 生成与校验

```javascript
// auth/utils/token.js
const crypto = require('crypto')

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'change-this-in-production'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000  // 8 小时

function generateToken() {
  const payload = {
    role: 'creator',
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomBytes(8).toString('hex')
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64')
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex')
  return `${data}.${sig}`
}

function verifyToken(token) {
  if (!token) return false
  try {
    const [data, sig] = token.split('.')
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex')
    if (sig !== expected) return false

    const payload = JSON.parse(Buffer.from(data, 'base64').toString())
    if (Date.now() > payload.exp) return false

    return true
  } catch {
    return false
  }
}

module.exports = { generateToken, verifyToken }
```

### 5.3 写操作必须鉴权

所有新增、修改、删除操作的 handler 必须调用鉴权中间件，读操作（展示给访客）不需要：

```javascript
// utils/auth.js（每个云函数内）
const { verifyToken } = require('./token')
const { fail } = require('./response')

async function requireCreator(event) {
  const token = event.headers?.authorization?.replace('Bearer ', '')
  if (!verifyToken(token)) {
    throw fail('无编辑权限，请先解锁创作者模式', 401)
  }
}

module.exports = { requireCreator }

// 在 handler 中使用
async function saveMilestone(data, event) {
  await requireCreator(event)   // 写操作先鉴权
  // 业务逻辑...
}

async function getMilestones(data) {
  // 读操作无需鉴权，访客可见
}
```

---

## 六、参数校验规范

### 6.1 所有入参在 handler 中校验，不依赖前端

```javascript
// handlers/cycleRecord.js
const { ok, fail } = require('../utils/response')

async function save(data) {
  // 必填字段校验
  if (!data?.startDate) return fail('startDate 不能为空', 400)
  if (!data?.duration) return fail('duration 不能为空', 400)

  // 格式校验
  const dateReg = /^\d{4}-\d{2}-\d{2}$/
  if (!dateReg.test(data.startDate)) return fail('startDate 格式应为 YYYY-MM-DD', 400)

  // 范围校验
  const duration = Number(data.duration)
  if (isNaN(duration) || duration < 1 || duration > 15) {
    return fail('duration 应为 1–15 之间的整数', 400)
  }

  const painLevel = Number(data.painLevel ?? 1)
  if (![1,2,3,4,5].includes(painLevel)) return fail('painLevel 应为 1–5', 400)

  // 写入数据库
  const db = uniCloud.database()
  const res = await db.collection('cycle-records').add({
    startDate: data.startDate,
    duration,
    painLevel,
    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
    notes: String(data.notes ?? '').slice(0, 500),
    createdAt: new Date(),
    updatedAt: new Date()
  })

  return ok({ id: res.id }, '记录保存成功')
}
```

### 6.2 字符串长度限制，防止恶意超长输入

| 字段 | 最大长度 |
|------|---------|
| 菜谱标题 / 节点标题 | 50 字符 |
| 故事描述 / 备注 | 1000 字符 |
| 症状标签单项 | 20 字符 |
| 标签数组 | 最多 10 项 |
| 图片 fileID 列表 | 最多 4 项 |

---

## 七、生理期预测算法规范

预测逻辑封装在 `clinic/utils/dateHelper.js`，前端不参与计算：

```javascript
// clinic/utils/dateHelper.js
'use strict'

/**
 * 根据历史记录预测下次经期开始日期
 * @param {Array} records - 按 startDate 降序排列的历史记录，至少 2 条
 * @returns {string} 预测日期 'YYYY-MM-DD'，或 null（记录不足）
 */
function predictNextCycle(records) {
  if (!records || records.length < 2) return null

  // 计算相邻两次经期的间隔天数
  const intervals = []
  for (let i = 0; i < records.length - 1; i++) {
    const curr = new Date(records[i].startDate)
    const prev = new Date(records[i + 1].startDate)
    const days = Math.round((curr - prev) / (1000 * 60 * 60 * 24))
    if (days > 0 && days < 60) intervals.push(days)  // 过滤异常值
  }

  if (intervals.length === 0) return null

  // 加权平均：最近的记录权重更高
  const weightedAvg = intervals.reduce((sum, val, idx) => {
    const weight = intervals.length - idx
    return sum + val * weight
  }, 0) / intervals.reduce((sum, _, idx) => sum + (intervals.length - idx), 0)

  const avgCycle = Math.round(weightedAvg)

  // 在最近一次经期基础上加预测周期
  const lastStart = new Date(records[0].startDate)
  lastStart.setDate(lastStart.getDate() + avgCycle)

  return lastStart.toISOString().slice(0, 10)
}

/**
 * 计算距离预测经期的天数
 * @param {string} predictedDate - 'YYYY-MM-DD'
 * @returns {number} 正数表示距离天数，负数表示已过期多少天
 */
function daysUntilNextCycle(predictedDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(predictedDate)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

module.exports = { predictNextCycle, daysUntilNextCycle }
```

---

## 八、错误处理与日志规范

### 8.1 所有云函数入口必须全量 try/catch

见第二节「2.2 入口文件标准模板」，禁止裸露的 `async main` 不加 try/catch。

### 8.2 结构化日志

所有关键操作使用 JSON 格式记录，禁止字符串拼接：

```javascript
// ✓ 推荐：结构化，可被日志系统自动解析
console.log(JSON.stringify({
  level: 'info',
  function: 'museum',
  action: 'addMilestone',
  milestoneId: res.id,
  type: data.type,
  timestamp: new Date().toISOString()
}))

console.error(JSON.stringify({
  level: 'error',
  function: 'clinic',
  action: 'saveCycleRecord',
  message: e.message,
  timestamp: new Date().toISOString()
}))

// ✗ 禁止：字符串拼接，无法自动解析
console.log('新增节点成功 id=' + res.id + ' 时间=' + new Date())
```

### 8.3 已知业务异常与未知系统错误区分处理

```javascript
// 已知业务异常：return fail(...)，不打日志（正常分支）
if (!data.startDate) return fail('startDate 不能为空', 400)

// 未知系统错误：打 error 日志 + 返回通用提示（不暴露内部细节）
catch (e) {
  if (e.code && e.message) return e  // 已知业务异常冒泡
  console.error(JSON.stringify({ level: 'error', message: e.message, stack: e.stack }))
  return fail('服务器内部错误', 500)  // 通用提示，不暴露堆栈
}
```

---

## 九、数据安全规范

### 9.1 敏感配置使用环境变量

```javascript
// ✓ 推荐：在 uniCloud 云函数环境变量中配置
const TOKEN_SECRET = process.env.TOKEN_SECRET
const SECRET_SALT = process.env.SECRET_SALT

// ✗ 禁止：硬编码在源代码中
const TOKEN_SECRET = 'hardcoded-secret-abc123'
```

在 HBuilderX 云函数配置面板中设置环境变量，不要提交到 Git 仓库。

### 9.2 错误响应不暴露内部信息

```javascript
// ✓ 推荐：通用错误提示
return fail('服务器内部错误，请稍后重试', 500)

// ✗ 禁止：暴露数据库结构、文件路径、堆栈信息
return fail(`数据库查询失败：collection 'cycle-records' 连接超时：${e.stack}`, 500)
```

### 9.3 数据库访问控制

在 `uniCloud 控制台 → 云数据库 → 权限设置` 中配置：

| 集合 | 读权限 | 写权限 |
|------|--------|--------|
| `cycle-records` | 仅云函数 | 仅云函数 |
| `medication-records` | 仅云函数 | 仅云函数 |
| `museum-milestones` | 所有人（展示给访客） | 仅云函数 |
| `recipes` | 所有人 | 仅云函数 |
| `app-config` | 仅云函数 | 仅云函数 |

所有写操作通过云函数中间件鉴权，不允许客户端直接写入任何集合。

---

## 十、开发规范

### 10.1 本地调试

使用 HBuilderX 的本地云函数调试功能，禁止直接在生产环境调试：

```javascript
// 开发期间可添加调试日志，上线前必须删除
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG] 入参:', JSON.stringify(event, null, 2))
}
```

### 10.2 云函数依赖管理

每个云函数如需第三方依赖，在其目录下单独维护 `package.json`：

```json
// clinic/package.json
{
  "name": "clinic",
  "version": "1.0.0",
  "dependencies": {}
}
```

通用工具（`response.js`、`token.js`）在每个云函数目录内保留副本，不通过跨函数引用（uniCloud 不支持）。

### 10.3 命名规范速查

| 类型 | 规范 | 示例 |
|------|------|------|
| 云函数目录 | `kebab-case` | `clinic`、`restaurant` |
| 集合名 | `kebab-case` 复数 | `cycle-records`、`recipes` |
| 文档字段 | `camelCase` | `startDate`、`painLevel` |
| JS 函数 | `camelCase` | `saveCycleRecord`、`verifyToken` |
| 常量 | `SCREAMING_SNAKE_CASE` | `TOKEN_TTL_MS`、`MAX_IMAGES` |
| action 字段值 | `camelCase` 动词开头 | `saveCycleRecord`、`getMilestones` |

---

*前端调用方式参见《前端编码规范》，页面功能详细描述参见《设计需求文档》。*
