# SmartCalendar - 重复日程日历 App

> **项目状态**：MVP 开发中。代码已初始化，核心功能（月视图、日程CRUD、重复日程、提醒）已实现或正在实现。构建通过 GitHub Actions 云端完成（ubuntu-latest）。

## 目录

- [项目定位](#项目定位)
- [MVP 范围](#mvp-范围)
- [功能需求](#功能需求)
  - [月视图](#1-月视图mvp-唯一视图)
  - [日程基础操作](#2-日程基础操作)
  - [重复性日程](#3-重复性日程核心)
  - [全天日程](#4-全天日程)
  - [提醒](#5-提醒核心mvp-简化版)
  - [导航结构](#6-导航结构)
  - [空状态](#7-空状态)
- [技术架构](#技术架构)
  - [技术栈](#技术栈)
  - [架构分层](#架构分层)
- [数据存储设计](#数据存储设计)
- [目录结构](#目录结构)
- [GitHub Actions 构建](#github-actions-构建)
- [开发流程](#开发流程)
- [AI 驱动构建全流程](#ai-驱动构建全流程)
- [关键设计决策](#关键设计决策)
- [不做的事情](#不做的事情明确排除)
- [测试策略](#测试策略)
- [错误处理策略](#错误处理策略)
- [React Native 环境要求与已知问题](#react-native-环境要求与已知问题)
- [附录：边界情况与注意事项](#附录边界情况与注意事项)
- [开发优先级建议](#开发优先级建议)

## 项目定位

个人安卓日历 App，**核心**是重复性日程 + 提醒，参考飞书日历交互。
MVP 阶段只做月视图，后续再扩展。

- **飞书重复日程参考**：https://www.feishu.cn/hc/zh-CN/articles/375632052987-创建及使用重复性日程
- **飞书日历API参考**：https://open.feishu.cn/document/server-docs/calendar-v4/overview

- **平台**：仅 Android
- **框架**：React Native 0.74.7 CLI（非 Expo）
- **构建**：GitHub Actions 云端构建（ubuntu-latest）
- **调试**：写代码 → push → Actions 构建 APK → 真机安装测试 → 看日志改代码

---

## MVP 范围

| 模块 | MVP 是否包含 | 说明 |
|------|-------------|------|
| 月视图 | ✓ | 基于 react-native-calendars，参考飞书样式 |
| 创建/编辑日程 | ✓ | 标题、时间、重复规则、提醒 |
| 重复日程（核心） | ✓ | 每天/每周/每月/每年 + 结束条件 + 例外 |
| 提醒（核心） | ✓ | 本地通知，App 前台时触发即可（MVP 不做后台保活） |
| 日程详情/删除 | ✓ | 含重复日程的范围选择 |
| 周视图/日视图 | ✗ | MVP 后做 |
| 多日历 | ✗ | 不需要 |
| 与系统日历同步 | ✗ | 不开发 |
| 后台保活/AlarmManager | ✗ | MVP 不做，App 杀掉后提醒不触发，后续再做 |
| 农历/节假日 | ✗ | 不开发 |

---

## 功能需求

### 1. 月视图（MVP 唯一视图）

基于 `react-native-calendars` 的 `Calendar` 组件，参考飞书月视图样式：

- 网格显示当月日期，当前日期高亮
- 有日程的日期下方显示**色点**（dots）或**色条**
- 重复日程的日期同样显示色点
- 点击日期 → 下方展开该日日程列表
- 无日程的日期点击后显示空状态提示"暂无日程"
- 顶部导航：上月/下月切换、「今天」按钮
- 日程块显示：标题、时间、重复图标（↻）

**react-native-calendars 用法要点：**
```typescript
import { Calendar } from 'react-native-calendars';

<Calendar
  current={currentMonth}
  onMonthChange={(month) => setCurrentMonth(month)}
  markedDates={markedDates}  // 有日程的日期标记色点
  onDayPress={(day) => openDayEvents(day)}
  theme={{
    selectedDayBackgroundColor: '#00adf5',
    todayTextColor: '#00adf5',
    arrowColor: '#00adf5',
  }}
/>
```

`markedDates` 格式（每个日期可显示多个色点，代表不同日程）：
```typescript
{
  '2026-05-01': {
    dots: [
      { key: 'event-1', color: '#ff0000' },
      { key: 'event-2', color: '#00ff00' },
    ],
    marked: true,
    selected: true,          // 当前选中日期
    selectedColor: '#00adf5' // 选中日期背景色
  },
  '2026-05-03': { dots: [{ key: 'event-3', color: '#ff0000' }], marked: true },
}
```

> **注意**：`dots` 数组中每个 dot 需要唯一的 `key` 字段（react-native-calendars 要求），建议使用日程 ID。同一天有多个日程时，显示多个色点（最多显示3个，超出显示 `+N`）。

**月视图色点数据准备（CalendarService）：**
```typescript
function buildMarkedDates(events: CalendarEvent[], year: number, month: number) {
  const marked: Record<string, any> = {};
  const monthStart = `${year}-${String(month).padStart(2,'0')}-01`;
  const monthEnd = getMonthEndDate(year, month); // 如 2026-05-31

  events.forEach(event => {
    if (event.recurrenceRule) {
      // 重复日程：展开当月所有实例
      const occurrences = RecurrenceEngine.getOccurrences(
        event.recurrenceRule, event.startAt, monthStart, monthEnd
      );
      occurrences.forEach(occ => {
        if (!occ.isException) {
          addDot(marked, occ.date, event.id, event.color);
        }
      });
    } else {
      // 单次日程
      const date = event.startAt.slice(0, 10);
      if (date >= monthStart && date <= monthEnd) {
        addDot(marked, date, event.id, event.color);
      }
    }
  });
  return marked;
}

function addDot(marked: Record<string, any>, date: string, eventId: string, color: string) {
  if (!marked[date]) {
    marked[date] = { dots: [], marked: true };
  }
  if (marked[date].dots.length < 3) {
    marked[date].dots.push({ key: eventId, color });
  }
}
```

### 2. 日程基础操作

| 功能 | 说明 |
|------|------|
| 创建 | 标题（必填）、描述、地点、开始/结束时间、全天开关 |
| 表单验证 | 标题不能为空（去掉首尾空格后）；开始时间不能晚于结束时间；重复日程结束日期不能早于开始日期 |
| 编辑 | 修改以上信息；重复日程弹出范围选择 |
| 删除 | 单个日程直接删；重复日程弹窗选择：仅此一次 / 此后所有 / 全部 |
| 查看详情 | 点击日程 → 显示标题、时间、重复规则描述、提醒设置；全天日程显示"全天" |
| 颜色 | 每个日程一个颜色，月视图色点与之对应；预设8色（红/橙/黄/绿/蓝/紫/粉/灰），创建时默认取第一个 |

**颜色预设：**

```typescript
const EVENT_COLORS = [
  '#e74c3c', // 红
  '#e67e22', // 橙
  '#f1c40f', // 黄
  '#2ecc71', // 绿
  '#3498db', // 蓝
  '#9b59b6', // 紫
  '#e84393', // 粉
  '#95a5a6', // 灰
];
```

**颜色选择器 UI（ColorPicker BottomSheet）：**
- 使用 `@gorhom/bottom-sheet` 的 `BottomSheet` 组件
- 显示 8 色圆形色块，2行4列网格布局
- 当前选中色块显示白色对勾图标
- 点击色块立即回调选中颜色，可选自动关闭 BottomSheet
- 组件：`src/components/event/ColorPicker.tsx`

### 3. 重复性日程（核心）

#### 3.1 重复类型

| 类型 | 配置项 |
|------|--------|
| 每天 | 每 N 天（默认1） |
| 每周 | 每 N 周，选择周几（可多选，如每周一、三、五） |
| 每月 | 每 N 月，按日期（如15号）或按第几个星期几（如第二个周二） |
| 每年 | 每 N 年，按日期（如每年5月1日） |

快捷选项：每天 / 每周 / 每月 / 每年（间隔=1，无例外）
自定义：展开完整配置面板

#### 3.2 结束条件

| 方式 | 说明 |
|------|------|
| 永不结束 | 无限重复，查询时限制最大范围（如查未来1年） |
| 按次数 | 重复 N 次后停止（N≥1） |
| 按日期 | 到指定日期后不再重复 |

#### 3.3 例外处理

| 操作 | 行为 | 实现方式 |
|------|------|----------|
| 跳过某次 | 该次不显示、不提醒 | 日期加入 `exceptions` 数组 |
| 仅编辑某次 | 该次独立，后续重复不变 | 新建一条 `originalEventId` 指向母日程的独立日程 |
| 编辑此后所有 | 从该次起后续实例应用修改 | 原 rule 的结束日期设为该次前一日；新建一条从该次开始的重复日程 |
| 编辑全部 | 修改整个重复序列 | 直接修改母日程的 rule 和基本信息 |

#### 3.3.1 边界情况与处理规则

| 场景 | 处理方式 |
|------|----------|
| 月末日期（1月31日 +1月） | 取目标月最后一天（2月28/29日），不强制对齐到31日 |
| 闰年2月29日重复 | 非闰年时跳过2月29日（按当年2月最后一天处理） |
| bySetPos 负数（如 -1=最后一个） | 从该月最后一天往前找：找到最后一个匹配的星期几 |
| 重复开始日期在结束条件之后 | `getOccurrences` 返回空数组，不报错 |
| exceptions 中的日期不在重复序列中 | 静默忽略，不影响其他实例 |
| 重复日程编辑后 `startAt` 改变 | 重新计算所有实例；已独立编辑的子日程（`originalEventId`）不受影响 |
| 同一天多个日程 | 月视图显示多个色点（最多3个），日程列表按时间排序 |

#### 3.4 重复规则数据结构

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;           // ≥1，如每2周 → 2
  byDay?: number[];           // 周重复时：0=周日,1=周一,...,6=周六
  byMonthDay?: number;        // 月重复按日期：1-31
  bySetPos?: number;          // 月/年按第几个：1=第一个,2=第二个,-1=最后一个
  endType: 'never' | 'count' | 'until';
  endCount?: number;          // endType='count' 时有效，≥1
  endUntil?: string;          // endType='until' 时，ISO日期如 '2026-12-31'
  exceptions?: string[];      // 例外日期 ISO 列表，如 ['2026-05-01']
}
```

#### 3.5 RecurrenceEngine 算法细节

**文件**：`src/services/RecurrenceEngine.ts`

**核心函数：**

```typescript
/**
 * 计算指定范围内的所有重复实例
 */
function getOccurrences(
  rule: RecurrenceRule,
  startAt: string,
  rangeStart: string,
  rangeEnd: string
): Array<{ date: string; time: string; isException: boolean }>
```

---

## 技术架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React Native CLI | 0.74.7 |
| 语言 | TypeScript | ^5.3.3 |
| 状态管理 | Zustand | ^4.5.0 |
| 导航 | React Navigation 6 | @react-navigation/native ^6.1.12 + stack ^6.3.20 |
| 日历视图 | react-native-calendars | ^1.1309.0 |
| 日期处理 | date-fns | ^3.6.0 |
| 本地通知 | react-native-push-notification | ^8.1.1 |
| 存储 | @react-native-async-storage/async-storage | ^1.23.1 |
| BottomSheet | @gorhom/bottom-sheet | ^5.0.3 |
| 动画 | react-native-reanimated | ^3.10.1 |
| ID 生成 | uuid | ^9.0.1 |
| 构建 | GitHub Actions | ubuntu-latest |
| 图标 | react-native-vector-icons | ^10.1.0 |

### 实际依赖版本（package.json）

```json
{
  "name": "smartcalendar",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.74.7",
    "zustand": "^4.5.0",
    "@react-navigation/native": "^6.1.12",
    "@react-navigation/stack": "^6.3.20",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.10.1",
    "react-native-calendars": "^1.1309.0",
    "date-fns": "^3.6.0",
    "react-native-push-notification": "^8.1.1",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@gorhom/bottom-sheet": "^5.0.3",
    "react-native-reanimated": "^3.10.1",
    "uuid": "^9.0.1",
    "react-native-vector-icons": "^10.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/uuid": "^9.0.8",
    "typescript": "^5.3.3",
    "@babel/core": "^7.23.7",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "react-test-renderer": "18.2.0"
  }
}
```

### 架构分层

```
┌─────────────────────────────────────┐
│            UI Layer                 │
│  CalendarScreen / EventEditScreen   │
│  EventScreen / Components           │
├─────────────────────────────────────┤
│        State Management              │
│           Zustand Stores            │
├─────────────────────────────────────┤
│          Service Layer               │
│  RecurrenceEngine / ReminderService │
│  CalendarService / EventService     │
├─────────────────────────────────────┤
│          Storage Layer               │
│        AsyncStorage (eventRepo)     │
└─────────────────────────────────────┘
```

---

## 数据存储设计

### AsyncStorage Key 设计

| Key | 类型 | 说明 |
|-----|------|------|
| `events` | JSON string | 所有日程对象的数组 |
| `settings` | JSON string | 应用设置（主题、默认提醒等） |

### 日程数据结构

```typescript
interface CalendarEvent {
  id: string;                    // uuid
  title: string;                 // 标题（必填）
  description?: string;           // 描述
  location?: string;             // 地点
  startAt: string;               // 开始时间 ISO 8601，如 '2026-05-01T09:00:00'
  endAt: string;                 // 结束时间 ISO 8601
  isAllDay: boolean;             // 是否全天
  color: string;                 // 颜色，如 '#ff0000'
  recurrenceRule?: RecurrenceRule; // 重复规则，null/undefined=不重复
  originalEventId?: string;       // 独立编辑某次时，指向母日程ID
  reminderMinutes?: number | null; // 提前提醒分钟数，null=不提醒
  createdAt: string;             // 创建时间 ISO
  updatedAt: string;             // 更新时间 ISO
}
```

### Zustand Store 设计

| Store | 文件 | 说明 |
|-------|------|------|
| eventStore | `src/stores/eventStore.ts` | 日程状态：CRUD、加载、删除 |
| uiStore | `src/stores/uiStore.ts` | UI 状态：当前月、选中日期、主题 |
| logStore | `src/stores/logStore.ts` | 日志状态：App 内日志查看 |

---

## 目录结构

```
smartcalendar/
├── .github/
│   └── workflows/
│       └── build-android.yml       # Debug 构建（云端）
├── src/
│   ├── screens/
│   │   ├── CalendarScreen.tsx      # 月视图主页面
│   │   ├── EventEditScreen.tsx     # 创建/编辑日程
│   │   ├── EventScreen.tsx         # 日程详情
│   │   ├── LogViewerScreen.tsx     # 日志查看页面
│   │   └── SettingsScreen.tsx      # 设置
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarHeader.tsx  # 顶部导航
│   │   │   ├── DayEventsList.tsx   # 当日日程列表
│   │   │   └── MonthView.tsx       # 月视图封装
│   │   ├── event/
│   │   │   ├── ColorPicker.tsx     # 颜色选择器
│   │   │   ├── EventCard.tsx       # 日程卡片
│   │   │   └── EventDetail.tsx     # 日程详情内容
│   │   ├── recurrence/
│   │   │   └── RecurrencePicker.tsx # 重复规则选择器
│   │   └── reminder/
│   │       └── ReminderPicker.tsx  # 提醒时间选择器
│   ├── stores/
│   │   ├── eventStore.ts           # 日程状态
│   │   ├── logStore.ts             # 日志状态
│   │   └── uiStore.ts             # UI 状态
│   ├── services/
│   │   ├── CalendarService.ts      # 日历数据准备
│   │   ├── EventService.ts         # 日程 CRUD
│   │   ├── RecurrenceEngine.ts     # 重复规则计算
│   │   └── ReminderService.ts      # 提醒调度
│   ├── storage/
│   │   └── eventRepo.ts           # AsyncStorage 读写
│   ├── navigation/
│   │   └── AppNavigator.tsx        # 导航配置
│   ├── types/
│   │   ├── index.ts               # 类型定义
│   │   └── navigation.ts          # 导航参数类型
│   └── utils/
│       ├── dateUtils.ts           # 日期格式化
│       ├── idUtils.ts             # ID 生成
│       └── logger.ts              # 日志工具
├── App.tsx                         # 入口
├── app.json                        # RN 项目配置
├── babel.config.js                 # Babel 配置
├── index.js                        # RN 入口
├── package.json
├── tsconfig.json
└── agents.md                       # 本文档
```

> **注意**：`android/` 目录不提交到仓库，每次 CI 通过 `react-native init` 动态生成。

---

## GitHub Actions 构建

### build-android.yml（Debug 构建）

> 实际文件：`.github/workflows/build-android.yml`

```yaml
name: Build Android Debug

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm install

      - name: Generate android project (if missing)
        if: ${{ !hashFiles('android/build.gradle') }}
        run: |
          cd /tmp
          npx react-native@0.74.x init TempApp
          cp -r /tmp/TempApp/android "${{ github.workspace }}/android"
          rm -rf /tmp/TempApp

      - name: Verify android directory
        run: |
          if [ ! -f "android/build.gradle" ]; then
            echo "ERROR: android/build.gradle not found"
            exit 1
          fi

      - name: Build debug APK
        working-directory: android
        run: ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: smartcalendar-debug-${{ github.sha }}
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

> **说明**：
> - `android/` 不入库，CI 通过 `react-native init TempApp` 生成后复制到仓库
> - `react-native init` 不带 `--skip-install`，确保模板完整生成
> - 使用 `if: ${{ !hashFiles('android/build.gradle') }}` 条件判断是否需生成
> - Release 构建尚未配置（MVP 阶段仅需要 Debug APK）

---

## 开发流程

### 初始化（已完成）

项目已通过 `react-native init` 初始化，无需再次执行。

### 日常开发

```
1. 本地写代码
2. git add . && git commit -m "xxx" && git push
3. 等待 GitHub Actions 构建完成（约10-15分钟）
4. 下载 Artifacts 中的 app-debug.apk
5. 真机安装测试
6. 有问题 → 改代码 → 回到步骤2
```

### 真机安装方法

```bash
# 方法1：adb 安装（手机连电脑，开启 USB 调试）
adb install app-debug.apk

# 方法2：文件管理器安装
# 下载 APK → 在手机文件管理器中点击安装 → 允许"安装未知来源应用"
```

### 查看日志

#### 方案1：adb logcat（手机连电脑时）

```bash
adb logcat ReactNativeJS:V *:S
adb logcat | grep -E "SmartCalendar|ReactNativeJS"
```

#### 方案2：App 内日志页面（推荐，无需电脑）

`LogViewerScreen.tsx` 内置于 App 中，从 SettingsScreen 进入，支持：
- 按时间倒序显示日志
- 按 tag / level 过滤
- 清空日志、导出日志到剪贴板
- 显示日志总数和 error 数量

日志通过 `src/utils/logger.ts` 写入，同时输出到 `console` 和 `logStore`。

| 方案 | 需要电脑 | 需要 USB | 适用场景 |
|------|---------|---------|----------|
| adb logcat | 是 | 是 | 开发阶段有电脑时 |
| App 内日志页面 | 否 | 否 | 随时随地查看，**最推荐** |

---

## AI 驱动构建全流程

SmartCalendar 是一个**全流程 AI Coding 项目**，从 0 到 MVP 完全由 AI Agent 协作完成，非辅助式写代码，而是 AI 作为主导开发者端到端交付。

**协作模式**：采用多 Agent 架构（规划 Agent 负责技术选型、探索 Agent 负责影响面分析、执行 Agent 负责多文件联动编码、审查 Agent 负责边界检查），配合长链推理完成"用户意图 → 方案推理 → 多模块实现 → CI 调试修复"的完整闭环。

**交付成果**：累计生成 22 个 TypeScript 模块、约 3000 行代码，覆盖自研重复日程引擎、Zustand 状态管理、GitHub Actions 云端构建流水线、App 内日志系统。整条链路验证了"AI 主导开发"在中等复杂度移动应用上的可行性。

---

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 框架 | RN CLI 0.74.7 | 纯云端构建，Expo 还需 prebuild |
| 存储 | AsyncStorage | 个人数据量小，单个 `events` key 存全部 |
| 重复规则 | 自定义 JSON | 不引入 iCal RRULE 完整复杂度 |
| 月视图 | react-native-calendars | 社区成熟，直接可用 |
| 提醒 MVP | setTimeout + 本地通知 | 不做 AlarmManager，简化 MVP |
| 状态管理 | Zustand | 比 Redux 轻，比 Context 规范 |
| 构建 | GitHub Actions | 本地资源不足，纯云端 |

---

## 不做的事情（明确排除）

- 周视图 / 日视图（MVP 后做）
- 与系统日历同步
- 多日历 / 日历颜色分类
- 日程分享
- 农历 / 节假日
- iOS 支持
- Widget 桌面组件
- 日程参与者 / 邀请
- AlarmManager 后台保活（MVP 后做）
- 引导页 / 用户登录 / 云端同步

---

## 测试策略

### RecurrenceEngine 单元测试

由于 `RecurrenceEngine.ts` 是纯逻辑模块，可直接用 Jest 测试：

```typescript
import { getOccurrences } from '../RecurrenceEngine';

describe('RecurrenceEngine', () => {
  it('每天重复：基础场景', () => {
    const rule = { frequency: 'daily', interval: 1, endType: 'count', endCount: 3 };
    const result = getOccurrences(rule, '2026-05-01T09:00:00', '2026-05-01', '2026-05-10');
    expect(result.length).toBe(3);
    expect(result[0].date).toBe('2026-05-01');
    expect(result[1].date).toBe('2026-05-02');
    expect(result[2].date).toBe('2026-05-03');
  });

  it('每周重复：多选周几', () => {
    const rule = { frequency: 'weekly', interval: 1, byDay: [1, 3, 5], endType: 'count', endCount: 6 };
    const result = getOccurrences(rule, '2026-05-04T10:00:00', '2026-05-01', '2026-05-31');
    expect(result.length).toBe(6);
  });

  it('每月 byMonthDay：月末处理', () => {
    const rule = { frequency: 'monthly', interval: 1, byMonthDay: 31, endType: 'count', endCount: 3 };
    const result = getOccurrences(rule, '2026-01-31T00:00:00', '2026-01-01', '2026-12-31');
    expect(result[1].date).toBe('2026-02-28');
  });
});
```

### 手动测试清单（真机）

| 测试场景 | 验证点 |
|---------|--------|
| 创建单次日程 | 月视图色点显示，点击日期可见，详情页信息正确 |
| 创建每天重复日程 | 连续多天显示色点，结束条件（次数/日期）生效 |
| 创建每周重复日程 | 选定周几显示色点，间隔>1时正确跳过 |
| 跳过某次重复 | 该次日程不显示、不提醒，其他正常 |
| 仅编辑某次 | 该次独立显示，其他重复实例不变 |
| 提醒触发 | 提前N分钟弹出本地通知（App前台时） |
| 全天日程 | 置顶显示"全天"，月视图有色点 |
| 颜色选择 | 8色可选，月视图色点颜色匹配 |

---

## 错误处理策略

| 错误场景 | 处理方式 |
|---------|--------|
| AsyncStorage 读取失败 | 返回空数组，显示提示 |
| AsyncStorage 写入失败 | 显示 Toast "保存失败，请重试" |
| JSON 解析失败（数据损坏） | 备份损坏数据，重置为空白，提示用户 |
| RecurrenceEngine 异常输入 | 返回空数组，不崩溃，日志警告 |
| 提醒调度失败 | 静默失败，下次 App 启动时重新扫描 |

---

## React Native 环境要求与已知问题

### 开发环境（用于 GitHub Actions 云端构建）

| 工具 | 版本 |
|------|------|
| Node.js | 18.x（LTS） |
| Java | JDK 17（React Native 0.74+ 要求） |
| Android SDK | API Level 34 |

### Android 最低支持版本

- **minSdkVersion**: 24（Android 7.0）
- **targetSdkVersion**: 34

### 已知问题

| 问题 | 解决方案 |
|------|----------|
| `react-native-push-notification` 需要手动配置 AndroidManifest | 按文档配置；或考虑迁移到 `notifee` |
| `date-fns` 全量导入增大 bundle | 使用 tree-shaking 导入 |
| `@gorhom/bottom-sheet` 需要 `react-native-reanimated` | 已安装 reanimated v3，配置 babel plugin |
| 依赖版本冲突（react-test-renderer vs react） | `package.json` 中固定版本为 `"react-test-renderer": "18.2.0"` |

---

## 附录：边界情况与注意事项

### 重复日程边界情况汇总

| 场景 | 处理方式 |
|------|----------|
| 1月31日 +1月 | 取2月最后一天（28或29日） |
| 闰年2月29日重复 | 非闰年跳过2月29日 |
| bySetPos 负数（-1=最后一个） | 从月末往前找 |
| 重复开始日期在结束条件之后 | 返回空数组 |
| exceptions 日期不在重复序列中 | 静默忽略 |
| 修改重复日程 startAt | 重新计算实例；子日程不受影响 |
| 同一天多个日程 | 月视图最多显示3个色点 |

### 提醒注意事项

1. **setTimeout 最大可靠延迟**：Android 上约 60 分钟
2. **App 被杀后提醒**：MVP 不保证触发，用户需当天打开 App 重新调度
3. **重复日程提醒**：每次打开 App 全量扫描未来24小时

---

## 开发优先级建议

| 优先级 | 模块 | 原因 |
|--------|------|------|
| P0 | CalendarScreen 月视图 | 基础框架，能看见日历 |
| P0 | EventEditScreen 基础（标题、时间、保存） | 能创建单次日程 |
| P0 | EventScreen 详情 + 删除 | 能查看和删除 |
| P1 | RecurrenceEngine + 重复日程创建 | 核心功能 |
| P1 | 重复日程查看和例外处理 | 核心功能完整性 |
| P1 | 提醒功能 MVP | 核心功能 |
| P2 | 颜色选择 + 色点显示 | UI 完善 |
| P2 | 设置页面 + 日志查看 | 用户体验 |
| P3 | 重复日程"编辑此后所有" | 高级操作 |
