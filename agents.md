# SmartCalendar - 重复日程日历 App

> **⚠️ 项目状态**：当前项目处于**规划设计阶段**，仅有本文档。尚未执行 `react-native init` 或任何代码初始化。所有源码、配置文件、构建脚本均需后续创建。

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
- [关键设计决策](#关键设计决策)
- [不做的事情](#不做的事情明确排除)
- [附录：边界情况与注意事项](#附录边界情况与注意事项)

## 项目定位

个人安卓日历 App，**核心**是重复性日程 + 提醒，参考飞书日历交互。
MVP 阶段只做月视图，后续再扩展。

- **飞书重复日程参考**：https://www.feishu.cn/hc/zh-CN/articles/375632052987-创建及使用重复性日程
- **飞书日历API参考**：https://open.feishu.cn/document/server-docs/calendar-v4/overview（重复规则用RFC5545格式，我们用自定义JSON简化；提醒/例外处理思路一致）

- **平台**：仅 Android
- **框架**：React Native 0.74+ CLI（非 Expo）
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

> 注：飞书日历API的重复规则用 RFC5545 RRULE 格式（如 `FREQ=DAILY;INTERVAL=1`），
> 我们用自定义 JSON 简化，避免引入完整 RRULE 解析器。
> 关键约束与 RRULE 一致：COUNT 和 UNTIL 不能共存（我们的 endType 三选一天然满足）。

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

**例外操作的数据变更示例：**

假设有一条重复日程 `event_A`（每周一重复，从 2026-05-04 开始），用户想"仅编辑 2026-05-18 这一次"：

```
操作前：
  event_A: { id: "event_A", recurrenceRule: { frequency: "weekly", byDay: [1], ... }, ... }

操作后：
  event_A: { id: "event_A", recurrenceRule: { frequency: "weekly", byDay: [1], ... }, ... }  ← 不变
  event_A_0518: { id: "event_A_0518", originalEventId: "event_A", title: "修改后的标题", startAt: "2026-05-18T10:00:00", ... }  ← 新建独立日程
```

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
 * @param rule 重复规则
 * @param startAt 日程起始时间（ISO字符串）
 * @param rangeStart 查询范围开始（ISO日期）
 * @param rangeEnd 查询范围结束（ISO日期）
 * @returns 实例日期时间数组 [{date: '2026-05-01', isException: false}, ...]
 */
function getOccurrences(
  rule: RecurrenceRule,
  startAt: string,
  rangeStart: string,
  rangeEnd: string
): Array<{ date: string; time: string; isException: boolean }>
```

**算法逻辑：**

1. **每天**：从 startAt 日期开始，每次 +interval 天，直到超出 rangeEnd 或触发结束条件
2. **每周**：
   - 确定起始日期对应的那一周
   - 对 byDay 中每个星期几，计算该周对应的日期
   - 每次循环 +interval 周
3. **每月**：
   - byMonthDay 模式：从 startAt 的日期开始，每次 +interval 月，取对应日期（注意月末处理，如1月31日+1月=2月28日）
   - bySetPos 模式：找到该月第 bySetPos 个 byDay 对应的日期（如"第二个周二"=找到该月第一个周二，加7天×(bySetPos-1)）
4. **每年**：类似每月，按 byMonthDay 或 bySetPos 计算
5. **结束条件处理**：
   - `never`：最多返回 range 内的日期（限制最大100个防止死循环）
   - `count`：累计计数，达到 count 停止
   - `until`：日期超过 until 停止
6. **例外日期**：结果中标记 isException=true，UI 可选择隐藏

**关键边界处理（RecurrenceEngine 实现要点）：**

```typescript
// 月末日期处理：1月31日 + 1个月 → 2月28日（非闰年）或2月29日（闰年）
function addMonthsKeepDay(date: Date, months: number): Date {
  const originalDay = date.getDate();
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  // 如果月份加了之后日期回退（如3月31日→4月30日→设成31日会跳到5月1日）
  // 取当月最后一天
  if (newDate.getDate() !== originalDay) {
    newDate.setDate(0); // 设为上月最后一天 = 当月最后一天
  }
  return newDate;
}

// bySetPos 负数处理：找到当月最后一个匹配的星期几
// bySetPos = -1 表示最后一个，例如2026年5月最后一个周一
function findNthWeekday(year: number, month: number, weekday: number, pos: number): Date | null {
  if (pos > 0) {
    // 正数：从该月1日起找第pos个weekday
    const firstDay = new Date(year, month - 1, 1);
    const daysUntilFirst = (weekday - firstDay.getDay() + 7) % 7;
    const firstMatch = new Date(year, month - 1, 1 + daysUntilFirst + (pos - 1) * 7);
    return firstMatch.getMonth() === month - 1 ? firstMatch : null;
  } else {
    // 负数：从月末往前找，pos=-1=最后一个，pos=-2=倒数第二个
    const lastDay = new Date(year, month, 0); // 当月最后一天
    const daysUntilLast = (lastDay.getDay() - weekday + 7) % 7;
    const lastMatch = new Date(year, month - 1, lastDay.getDate() - daysUntilLast + (pos + 1) * 7);
    return lastMatch.getMonth() === month - 1 ? lastMatch : null;
  }
}
```

**重复实例的 ID 与定位策略：**
- 重复日程展开的实例是**虚拟的**，不存入数据库
- 虚拟实例用 `母日程ID + 日期` 组合定位（如 `event_abc:2026-05-15`），不需要生成独立 UUID
- 仅当用户"仅编辑某次"时，才创建独立日程（存入数据库），设 `originalEventId` 指向母日程
- "跳过某次"只需将日期加入母日程 `exceptions` 数组，不创建新记录
- "编辑此后所有"：截断母日程 + 新建一条重复日程，和当前文档 3.3 一致

**辅助函数：**

```typescript
// 获取下次触发时间（用于提醒调度）
function getNextOccurrence(rule, startAt, afterDate): string | null

// 判断某日期是否为例外
function isExceptionDate(rule, date): boolean

// 生成人类可读的重复规则描述（如"每周一、三、五重复，共10次"）
function getRuleDescription(rule): string
```

**月视图数据准备流程：**
```
当前显示月份 → CalendarService.getEventsForMonth(month)
  → 查 AsyncStorage 所有母日程
  → 对每个有 recurrenceRule 的日程，调用 RecurrenceEngine.getOccurrences(rule, startAt, monthStart, monthEnd)
  → 合并所有实例（含独立编辑的例外实例）
  → 生成 markedDates 给日历组件
```

### 4. 全天日程

- 全天日程 `isAllDay=true`，`startAt` 存当天 00:00，`endAt` 存次日 00:00
- 日程列表中全天日程置顶显示，时间位置显示"全天"
- 月视图色点同样标记
- 全天日程不受时区影响

**时区处理策略：**

> **MVP 简化方案**：所有时间以**设备本地时区**存储和显示，不做时区转换。
> - `startAt` / `endAt` 存储格式：`'2026-05-01T09:00:00'`（不含时区偏移）
> - 使用 `date-fns` 的本地时间函数解析，不引入 `date-fns-tz`
> - 提醒计算同样基于设备本地时间
>
> **局限性**：用户跨时区旅行时，日程时间不会自动调整（如北京9点的会议，到了上海还是9点，不会变成8点）。
>
> **后续扩展**：如需支持时区，存储时改用 UTC 时间（`'2026-05-01T01:00:00Z'`），显示时通过 `date-fns-tz` 转换到设备时区。

### 5. 提醒（核心，MVP 简化版）

#### MVP 方案（App 前台时触发）

- 使用 `react-native-push-notification` 库触发本地通知
- App 在前台/后台时，通过 `setTimeout` + 本地通知触发
- App 被杀后提醒不触发（MVP 接受这个限制）
- 每次打开 App 时，扫描未来24小时的日程，重新设置提醒定时器

> **⚠️ setTimeout 限制**：React Native 的 `setTimeout` 在 Android 上最大可靠延迟约 60 分钟。超过此时间的定时器可能被系统回收（App 进入后台后 JS 线程暂停）。MVP 方案仅扫描未来 24 小时，但建议将扫描范围缩小至 **未来 1 小时** 内即将触发的提醒，其余的等用户下次打开 App 时再扫描。
>
> **替代方案（MVP 后）**：使用 Android `AlarmManager` 设置精确闹钟，即使 App 被杀也能触发。`react-native-push-notification` 的 `scheduleLocalNotification` 在部分 Android 版本上依赖 AlarmManager，但行为不一致，需用原生模块封装。

#### 提醒设置选项

| 选项 | 提前时间（分钟） |
|------|----------------|
| 不提醒 | - |
| 准时 | 0 |
| 提前5分钟 | 5 |
| 提前15分钟 | 15 |
| 提前30分钟 | 30 |
| 提前1小时 | 60 |
| 提前1天 | 1440 |

存为 `reminderMinutes: number | null`，null 表示不提醒。

#### 提醒调度逻辑

```typescript
// App 启动时调用
function scheduleAllReminders(events) {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  events.forEach(event => {
    if (!event.reminderMinutes && event.reminderMinutes !== 0) return;

    const eventTime = new Date(event.startAt);
    const reminderTime = new Date(eventTime.getTime() - event.reminderMinutes * 60000);

    // 只处理未来24小时内且还没过的提醒
    if (reminderTime > now && reminderTime <= next24h) {
      const delay = reminderTime.getTime() - now.getTime();
      setTimeout(() => {
        PushNotification.localNotification({
          title: event.title,
          message: `开始于 ${format(eventTime, 'HH:mm')}`,
        });
      }, delay);
    }
  });
}
```

#### 后续扩展（非 MVP）

- Android AlarmManager 精确闹钟（保证 App 被杀后触发）
- BroadcastReceiver 接收闹钟广播
- BootBroadcastReceiver 重启手机后恢复闹钟
- 重复日程每次触发后自动调度下一次

### 6. 导航结构

```
StackNavigator
├── CalendarScreen（月视图，首页）
│   ├── 点击日期 → 同页下半区展示 DayEventsList
│   ├── 点击日程 → EventScreen
│   └── 右上角 "+" → EventEditScreen（新建）
├── EventScreen（日程详情）
│   ├── 编辑按钮 → EventEditScreen（编辑模式）
│   └── 删除按钮 → 弹窗确认
├── EventEditScreen（创建/编辑日程，同一页面复用）
│   ├── 重复规则 → BottomSheet: RecurrencePicker
│   ├── 提醒设置 → BottomSheet: ReminderPicker
│   └── 颜色选择 → BottomSheet: 预设色盘
└── SettingsScreen（设置，从 CalendarScreen 左上角齿轮进入）
    ├── 默认提醒时间
    ├── 默认日程颜色
    └── 关于
```

**导航参数类型定义（src/types/navigation.ts）：**

```typescript
import { CalendarEvent, RecurrenceRule } from './index';

export type RootStackParamList = {
  Calendar: undefined;
  Event: {
    eventId: string;
    date?: string;           // 重复日程的实例日期，用于"仅查看此次"
    isExceptionInstance?: boolean; // 是否为独立编辑的实例
  };
  EventEdit: {
    eventId?: string;        // 编辑时传入，新建时不传
    selectedDate?: string;   // 从月视图点击日期创建时，预填日期
    baseEvent?: CalendarEvent; // 编辑时传入原始日程（用于重复日程"编辑此后所有"）
    instanceDate?: string;    // 重复日程的实例日期
    editScope?: 'this' | 'future' | 'all'; // 重复日程编辑范围
  };
  Settings: undefined;
};

// 在导航中使用：
// navigation.navigate('EventEdit', { eventId: 'abc123' });
// navigation.navigate('Event', { eventId: 'abc123', date: '2026-05-15' });
```

### 7. 空状态

| 场景 | 显示 |
|------|------|
| 首次安装，无任何日程 | 月视图正常显示，点击日期下半区提示"暂无日程，点击 + 创建" |
| 某日无日程 | 下半区显示"暂无日程" |

---

## 技术架构

### 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| 框架 | React Native CLI | 0.74+ |
| 语言 | TypeScript | 5.x |
| 状态管理 | Zustand | ^4.x，轻量，无 boilerplate |
| 导航 | React Navigation 6 | @react-navigation/native + stack |
| 日历视图 | react-native-calendars | ^1.x，提供月视图 Calendar 组件 |
| 日期处理 | date-fns | ^3.x，轻量，tree-shakeable |
| 本地通知 | @react-native-community/push-notification-ios + react-native-push-notification | MVP 提醒方案（后续可迁移至 notifee） |
| 存储 | @react-native-async-storage/async-storage | 日程数据持久化 |
| BottomSheet | @gorhom/bottom-sheet | ^5.x，用于重复规则/提醒/颜色选择器 |
| ID 生成 | uuid | ^9.x，生成日程唯一 ID |
| 构建 | GitHub Actions | ubuntu-latest |
| 图标 | react-native-vector-icons | 可选，用于重复/提醒等图标 |

### 依赖清单（package.json 核心）

```json
{
  "name": "smartcalendar",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.74.x",
    "zustand": "^4.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-calendars": "^1.x",
    "date-fns": "^3.x",
    "react-native-push-notification": "^8.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@gorhom/bottom-sheet": "^5.x",
    "uuid": "^9.x",
    "react-native-vector-icons": "^10.x"
  },
  "devDependencies": {
    "@types/react": "^18.2.x",
    "@types/uuid": "^9.x",
    "typescript": "^5.x",
    "@babel/core": "^7.x",
    "eslint": "^8.x"
  }
}
```

> **注意**：`react-native-push-notification` 在 Android 上需要额外配置 `AndroidManifest.xml` 和创建一个 `PushNotificationHelper.java` 模块。MVP 阶段也可考虑使用 [`notifee`](https://notifee.app/) 作为更现代的替代方案，但 `notifee` 在 iOS 上需要付费许可证。

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

> **⚠️ AsyncStorage 注意事项**：
> 1. **数据大小限制**：AsyncStorage 在 Android 上基于 SQLite，理论上限约 6MB（某些设备上可能更少）。个人日历数据量（假设每天10个日程 × 365天 × 3年 ≈ 11,000条）序列化后约 5-10MB，接近上限。
> 2. **性能问题**：将所有日程存入单个 `events` key，当数据量大时：
>    - `getAllEvents()` 需要解析整个 JSON（可能阻塞 JS 线程几百毫秒）
>    - 每次 `saveEvent` 都序列化并写入全部日程
> 3. **MVP 解决方案**：个人使用场景下数据量有限，单 key 方案足够。后续优化方案：
>    - 按年月分片存储：key 格式 `events_2026_05`、`events_2026_06`
>    - 使用 `react-native-mmkv` 替代 AsyncStorage（同步读写，更快）
> 4. **数据迁移**：若后续更换存储方案，需编写迁移函数：
> ```typescript
> async function migrateEventsFormat() {
>   const oldEvents = await AsyncStorage.getItem('events');
>   if (oldEvents) {
>     // 迁移到新格式...
>     await AsyncStorage.removeItem('events'); // 迁移完成后删除旧数据
>   }
> }
> ```

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

**eventStore.ts（日程状态）：**

```typescript
import { create } from 'zustand';
import { CalendarEvent } from '../types';
import * as eventRepo from './eventRepo';

interface EventState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;

  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string, scope?: 'this' | 'future' | 'all', instanceDate?: string) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsForMonth: (year: number, month: number) => Promise<CalendarEvent[]>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  loadEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await eventRepo.getAllEvents();
      set({ events, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addEvent: async (event) => {
    await eventRepo.saveEvent(event);
    set(state => ({ events: [...state.events, event] }));
  },

  updateEvent: async (event) => {
    await eventRepo.saveEvent(event);
    set(state => ({
      events: state.events.map(e => e.id === event.id ? event : e)
    }));
  },

  deleteEvent: async (id, scope, instanceDate) => {
    // 根据 scope 处理重复日程删除（见 3.3 例外处理）
    // ...
  },

  getEventById: (id) => get().events.find(e => e.id === id),

  getEventsForMonth: async (year, month) => {
    const { events } = get();
    // 调用 CalendarService 展开重复日程
    // ...
    return [];
  },
}));
```

**uiStore.ts（UI 状态）：**

```typescript
import { create } from 'zustand';

interface UIState {
  currentMonth: string;           // '2026-05'
  selectedDate: string | null;     // '2026-05-15'
  theme: 'light' | 'dark';

  setCurrentMonth: (month: string) => void;
  setSelectedDate: (date: string | null) => void;
  goToToday: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentMonth: format(new Date(), 'yyyy-MM'),
  selectedDate: null,
  theme: 'light',

  setCurrentMonth: (month) => set({ currentMonth: month }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ currentMonth: format(new Date(), 'yyyy-MM'), selectedDate: format(new Date(), 'yyyy-MM-dd') }),
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));
```

### 设置数据结构

**settings key 存储内容：**

```typescript
interface AppSettings {
  defaultReminderMinutes: number | null;  // 默认提醒时间，新建日程时自动填入
  defaultEventColor: string;                // 默认日程颜色
  theme: 'light' | 'dark';                // 主题（预留，MVP 可不做）
  startWeekOn: 'sunday' | 'monday';       // 日历周起始日（预留）
}

// 默认值
const DEFAULT_SETTINGS: AppSettings = {
  defaultReminderMinutes: 15,
  defaultEventColor: '#ff0000',  // 预设8色第一个
  theme: 'light',
  startWeekOn: 'sunday',
};
```

### 存储读写（eventRepo.ts）

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = 'events';

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const events = await getAllEvents();
  const idx = events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    events[idx] = { ...event, updatedAt: new Date().toISOString() };
  } else {
    events.push({ ...event, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export async function deleteEvent(id: string): Promise<void> {
  const events = await getAllEvents();
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events.filter(e => e.id !== id)));
}

// 删除重复日程时的两种操作：
// 1. 仅删除此实例：将日期加入母日程的 exceptions 数组
// 2. 删除全部：直接删除母日程（及所有 originalEventId 指向它的子日程）
// 3. 删除此后所有：母日程 rule.endUntil = 该实例前一天；删除该日期后的子日程
```

---

## 目录结构

```
smartcalendar/
├── .github/
│   └── workflows/
│       ├── build-android.yml       # Debug 构建
│       └── release-android.yml     # Release 构建（打 tag 触发）
├── android/                        # RN CLI 自动生成
├── src/
│   ├── screens/
│   │   ├── CalendarScreen.tsx      # 月视图主页面
│   │   ├── EventEditScreen.tsx     # 创建/编辑日程
│   │   ├── EventScreen.tsx         # 日程详情
│   │   └── SettingsScreen.tsx      # 设置
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── MonthView.tsx       # 月视图（封装 react-native-calendars）
│   │   │   ├── CalendarHeader.tsx  # 顶部导航（月切换+今天按钮）
│   │   │   └── DayEventsList.tsx   # 点击日期后展开的当日日程列表
│   │   ├── event/
│   │   │   ├── EventCard.tsx       # 日程卡片
│   │   │   └── EventDetail.tsx     # 日程详情内容
│   │   ├── recurrence/
│   │   │   └── RecurrencePicker.tsx # 重复规则选择器
│   │   └── reminder/
│   │       └── ReminderPicker.tsx  # 提醒时间选择器
│   ├── stores/
│   │   ├── eventStore.ts           # 日程状态（zustand）
│   │   └── uiStore.ts             # UI 状态（当前月、主题等）
│   ├── services/
│   │   ├── RecurrenceEngine.ts     # 重复规则计算（纯逻辑，可独立测试）
│   │   ├── ReminderService.ts      # 提醒调度（MVP: setTimeout方案）
│   │   ├── CalendarService.ts      # 日历数据准备（合并日程+展开重复）
│   │   └── EventService.ts         # 日程 CRUD
│   ├── storage/
│   │   └── eventRepo.ts           # AsyncStorage 读写
│   ├── navigation/
│   │   └── AppNavigator.tsx        # 导航配置
│   ├── utils/
│   │   ├── dateUtils.ts           # 日期格式化（基于 date-fns）
│   │   └── idUtils.ts             # ID 生成（uuid）
│   └── types/
│       └── index.ts               # 所有 TypeScript 类型定义
├── App.tsx                         # 入口
├── package.json
├── tsconfig.json
└── agents.md                       # 本文档
```

---

## GitHub Actions 构建

### build-android.yml（Debug 构建）

```yaml
name: Build Android Debug
on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm ci

      - name: Build debug APK
        run: cd android && ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: smartcalendar-debug-${{ github.sha }}
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

### release-android.yml（Release 构建，需配置 Secrets）

```yaml
name: Build Android Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/my-release-key.keystore

      - name: Create gradle properties
        run: |
          cat >> android/gradle.properties <<EOF
          MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
          MYAPP_RELEASE_KEY_ALIAS=${{ secrets.KEY_ALIAS }}
          MYAPP_RELEASE_STORE_PASSWORD=${{ secrets.KEYSTORE_PASSWORD }}
          MYAPP_RELEASE_KEY_PASSWORD=${{ secrets.KEY_PASSWORD }}
          EOF

      - name: Install dependencies
        run: npm ci

      - name: Build release APK
        run: cd android && ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: smartcalendar-release-${{ github.ref_name }}
          path: android/app/build/outputs/apk/release/app-release.apk
```

### GitHub Secrets 配置

在仓库 Settings → Secrets and variables → Actions → New repository secret：

| Secret 名 | 值 |
|-----------|-----|
| `KEYSTORE_BASE64` | 本地执行 `base64 my-release-key.keystore` 的输出 |
| `KEYSTORE_PASSWORD` | keystore 密码 |
| `KEY_ALIAS` | 密钥别名（如 `my-key-alias`） |
| `KEY_PASSWORD` | 密钥密码 |

生成 keystore 命令（一次性，任意机器执行）：
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

---

## 开发流程

### 初始化（首次）

```bash
# 1. 初始化 React Native CLI 项目
npx react-native@0.74.x init SmartCalendar --skip-install
cd SmartCalendar

# 2. 安装依赖
npm install

# 3. 安装额外依赖
npm install zustand @react-navigation/native @react-navigation/stack react-native-calendars date-fns \
  react-native-push-notification @react-native-async-storage/async-storage \
  @gorhom/bottom-sheet uuid react-native-vector-icons

# 4. 安装 react-native 依赖（自动链接）
cd ios && pod install && cd ..  # iOS（不做，但需执行以防报错）
npx react-native link  # 部分库需要

# 5. 将项目文件移到 smartcalendar 目录（若需要）
```

### 日常开发

```
1. 本地写代码（不需要跑起来，资源不足）
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

### 查看日志（重点）

由于采用 GitHub Actions 云端构建 + 真机安装的开发模式，**无法使用 Metro 热更新和 Chrome DevTools**，日志调试是发现问题的唯一手段。以下从简到繁列出多种方案：

#### 方案1：adb logcat（手机连电脑时）

```bash
# 查看所有 React Native / JS 日志
adb logcat *:S ReactNative:V ReactNativeJS:V

# 只看 JS 层 console.log / console.error 输出
adb logcat ReactNativeJS:V *:S

# 过滤本 App 标签的日志（推荐，最干净）
adb logcat | grep -E "SmartCalendar|ReactNativeJS"

# 保存日志到文件（方便后续分析）
adb logcat -d > ~/smartcalendar.log   # -d 导出当前缓存后退出
adb logcat > ~/smartcalendar-live.log  # 实时写入，Ctrl+C 停止
```

> **前提**：手机通过 USB 连接电脑，开启「开发者选项 → USB 调试」。如果用 WiFi 安装 APK 而无 USB 连接，此方案不可用。

#### 方案2：App 内日志页面（推荐，无需电脑）

在 App 中内置一个**隐藏的日志查看页面**，这是本开发模式下最实用的调试手段：

```typescript
// src/stores/logStore.ts
import { create } from 'zustand';

interface LogEntry {
  timestamp: string;   // '2026-05-01 09:00:00'
  level: 'info' | 'warn' | 'error';
  tag: string;         // 模块名，如 'RecurrenceEngine', 'ReminderService'
  message: string;
}

interface LogState {
  logs: LogEntry[];
  maxEntries: number;  // 防止内存溢出，默认 500
  addLog: (level: LogEntry['level'], tag: string, message: string) => void;
  clearLogs: () => void;
  getLogsByTag: (tag: string) => LogEntry[];
  getErrors: () => LogEntry[];
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  maxEntries: 500,

  addLog: (level, tag, message) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      level,
      tag,
      message,
    };
    set(state => ({
      logs: [...state.logs.slice(-(state.maxEntries - 1)), entry],
    }));
  },

  clearLogs: () => set({ logs: [] }),
  getLogsByTag: (tag) => get().logs.filter(l => l.tag === tag),
  getErrors: () => get().logs.filter(l => l.level === 'error'),
}));
```

```typescript
// src/utils/logger.ts（替换原方案，接入 logStore）
import { useLogStore } from '../stores/logStore';

export const logger = {
  info: (tag: string, message: string) => {
    console.log(`[SmartCalendar][${tag}] ${message}`);
    useLogStore.getState().addLog('info', tag, message);
  },
  warn: (tag: string, message: string) => {
    console.warn(`[SmartCalendar][${tag}] ${message}`);
    useLogStore.getState().addLog('warn', tag, message);
  },
  error: (tag: string, message: string, error?: unknown) => {
    const detail = error instanceof Error ? `${message}: ${error.message}` : message;
    console.error(`[SmartCalendar][${tag}] ${detail}`);
    useLogStore.getState().addLog('error', tag, detail);
  },
};
```

```typescript
// src/screens/LogViewerScreen.tsx（日志查看页面）
// 功能：
// - 按时间倒序显示日志（最新在上）
// - 支持按 tag / level 过滤
// - 点击单条日志展开详情
// - "清空日志"按钮
// - "导出日志"按钮（将日志复制到剪贴板，方便分享到电脑）
// - 显示日志总数和 error 数量
```

**日志页面入口**：在 SettingsScreen 底部添加「调试日志」入口，或在 CalendarScreen 的版本号上连续点击5次开启（类似 Android 开发者选项）。

导航中增加：
```
SettingsScreen
└── 调试日志 → LogViewerScreen
```

#### 方案3：将日志写入文件（持久化，App 重启后仍可查看）

```typescript
// src/utils/fileLogger.ts
// 使用 react-native-fs 将日志写入设备存储
// 路径：DocumentDirectoryPath/logs/app_YYYYMMDD.log
// LogViewerScreen 可读取并展示文件日志
// 适合排查 App 崩溃/重启等场景
```

> **注意**：此方案需要额外安装 `react-native-fs`，MVP 阶段可不引入，方案1+2已够用。

#### 方案4：开发菜单（仅 Debug 构建可用）

Debug APK 摇一摇手机可唤出 React Native 开发菜单：
- **Reload**：重新加载 JS Bundle（Debug 模式下有效）
- **Debug**：连接 Chrome DevTools（需要手机和电脑在同一网络）
- **Show Perf Monitor**：显示性能指标

> **限制**：由于我们使用的是 Release 构建的 APK，开发菜单仅在使用 Debug APK（`assembleDebug`）时才可用。真机安装 Debug APK 后，可通过 `adb shell input keyevent 82` 或摇一摇唤出菜单。

#### 各方案对比

| 方案 | 需要电脑 | 需要 USB | 持久化 | 适用场景 |
|------|---------|---------|--------|---------|
| adb logcat | 是 | 是 | 否 | 开发阶段有电脑时 |
| App 内日志页面 | 否 | 否 | App 运行期间 | 随时随地查看，**最推荐** |
| 文件日志 | 否 | 否 | 是 | 崩溃重启后查看（MVP 后） |
| 开发菜单 | 是 | 否 | 否 | 需要 DevTools 调试时 |

> **⚠️ Debug APK vs Release APK**：开发阶段务必使用 Debug APK（`assembleDebug`），它包含开发者菜单和更详细的错误信息。Release APK 会移除所有调试工具，且 `console.log` 不输出。

---

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 框架 | RN CLI | 纯云端构建，Expo 还需 prebuild |
| 存储 | AsyncStorage | 个人数据量小，单个 `events` key 存全部 |
| 重复规则 | 自定义 JSON | 不引入 iCal RRULE 完整复杂度 |
| 月视图 | react-native-calendars | 社区成熟，直接可用 |
| 提醒 MVP | setTimeout + 本地通知 | 不做 AlarmManager，简化 MVP |
| 周/日视图 | MVP 不做 | 只做月视图，减少工作量 |
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

由于 `RecurrenceEngine.ts` 是纯逻辑模块（不依赖 React Native 环境），可直接用 Jest 测试：

```typescript
// src/services/__tests__/RecurrenceEngine.test.ts
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
    // 5月4日(周一)、5月6日(周三)、5月8日(周五)、5月11日(周一)...
    expect(result.length).toBe(6);
  });

  it('每月 byMonthDay：月末处理', () => {
    const rule = { frequency: 'monthly', interval: 1, byMonthDay: 31, endType: 'count', endCount: 3 };
    const result = getOccurrences(rule, '2026-01-31T00:00:00', '2026-01-01', '2026-12-31');
    // 1月31日、2月28日(非闰年)、3月31日
    expect(result[1].date).toBe('2026-02-28');
  });

  it('例外日期处理', () => {
    const rule = { frequency: 'daily', interval: 1, endType: 'count', endCount: 5, exceptions: ['2026-05-03'] };
    const result = getOccurrences(rule, '2026-05-01T09:00:00', '2026-05-01', '2026-05-10');
    expect(result.length).toBe(5);
    expect(result.find(r => r.date === '2026-05-03')?.isException).toBe(true);
  });
});
```

### 手动测试清单（真机）

| 测试场景 | 验证点 |
|---------|--------|
| 创建单次日程 | 月视图色点显示，点击日期可见，详情页信息正确 |
| 创建每天重复日程 | 连续多天显示色点，结束条件（次数/日期）生效 |
| 创建每周重复日程 | 选定周几显示色点，间隔>1时正确跳过 |
| 创建每月/每年重复 | 按日期和按第几个星期几都正确 |
| 跳过某次重复 | 该次日程不显示、不提醒，其他正常 |
| 仅编辑某次 | 该次独立显示，其他重复实例不变 |
| 编辑此后所有 | 原序列在该次前结束，新序列从该次开始 |
| 删除重复日程（全部） | 所有实例消失 |
| 提醒触发 | 提前N分钟弹出本地通知（App前台时） |
| 全天日程 | 置顶显示"全天"，月视图有色点 |
| 颜色选择 | 8色可选，月视图色点颜色匹配 |
| 边界：2月29日重复 | 非闰年不显示2月29日 |
| 边界：月末日期 | 1月31日重复，2月显示28/29日 |
| 无日程空状态 | 点击日期显示"暂无日程" |

---

## 错误处理策略

| 错误场景 | 处理方式 |
|---------|--------|
| AsyncStorage 读取失败 | 返回空数组，显示 Toast 提示"数据加载失败，请重启应用" |
| AsyncStorage 写入失败 | 显示 Toast "保存失败，请重试"，不丢失用户正在编辑的数据（保留在表单 state 中） |
| JSON 解析失败（数据损坏） | 备份损坏数据到 `events_backup_YYYYMMDD`，重置为空白数据，提示用户 |
| RecurrenceEngine 异常输入 | 返回空数组，不崩溃，日志警告 |
| 提醒调度失败 | 静默失败，不影响其他提醒；下次 App 启动时重新扫描 |
| 网络请求（若有） | MVP 无网络请求，暂不处理 |

**错误日志工具函数（src/utils/logger.ts）：**

```typescript
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[SmartCalendar] ${context}: ${message}`);
  // MVP: 仅 console.error；后续可接入错误上报服务
}
```

---

## React Native 环境要求与已知问题

### 开发环境（用于 GitHub Actions 云端构建）

| 工具 | 版本 |
|------|------|
| Node.js | 18.x（LTS） |
| Java | JDK 17（React Native 0.74+ 要求） |
| Android SDK | API Level 34（compileSdkVersion 34） |
| npm | 9.x+（随 Node 18 自带） |

### Android 最低支持版本

- **minSdkVersion**: 24（Android 7.0，覆盖 98%+ 设备）
- **targetSdkVersion**: 34（最新稳定版）

### 已知 React Native 0.74 问题

| 问题 | 影响 | 解决方案 |
|------|------|----------|
| Android build 首次耗时较长（15-20分钟） | GitHub Actions 构建慢 | 使用 `actions/cache` 缓存 Gradle 依赖 |
| `react-native-push-notification` 需要手动配置 AndroidManifest | 通知不触发 | 按文档配置；或考虑迁移到 `notifee` |
| `date-fns` 直接导入全量包会增大 bundle | 包体积增大 | 使用 tree-shaking 导入：`import { format } from 'date-fns/format'` |
| `@gorhom/bottom-sheet` 需要 `react-native-reanimated` | 额外配置 | 按文档安装 reanimated v3，配置 babel plugin |

### Gradle 缓存配置（优化构建速度）

在 `build-android.yml` 中添加：

```yaml
      - name: Cache Gradle dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('android/**/*.gradle*', 'android/gradle/wrapper/gradle-wrapper.properties') }}
          restore-keys: ${{ runner.os }}-gradle-
```

---

## 附录：边界情况与注意事项

### 重复日程边界情况汇总

| 场景 | 处理方式 | 参考 |
|------|----------|------|
| 1月31日 +1月 | 取2月最后一天（28或29日） | RecurrenceEngine.addMonthsKeepDay() |
| 闰年2月29日重复 | 非闰年跳过2月29日 | 判断当年是否闰年 |
| bySetPos 负数（-1=最后一个） | 从月末往前找 | findNthWeekday() |
| 重复开始日期在结束条件之后 | 返回空数组 | getOccurrences() |
| exceptions 日期不在重复序列中 | 静默忽略 | 不报错 |
| 修改重复日程 startAt | 重新计算实例；子日程不受影响 | EventService |
| 同一天多个日程 | 月视图最多显示3个色点 | CalendarService |
| 重复日程未设置 byDay（周重复） | 默认使用 startAt 的星期几 | RecurrenceEngine 默认值 |

### 提醒注意事项

1. **setTimeout 最大可靠延迟**：Android 上约 60 分钟，超出的定时器可能被回收
2. **App 被杀后提醒**：MVP 不保证触发，用户需在当天打开 App 以重新调度
3. **跨天提醒**：如果日程在凌晨，用户前一天晚上打开 App 时，提醒应能正确调度
4. **重复日程提醒**：每次实例触发后，需调度下一次（MVP 简化：每次打开 App 全量扫描）

### 存储注意事项

1. **AsyncStorage 单 key 限制**：数据量大时影响读写性能，MVP 可接受
2. **JSON 序列化**：Date 对象会被序列化为字符串，重建时无需特殊处理（ISO 字符串可直接用 `new Date()` 解析）
3. **数据备份**：可引导用户导出数据为 JSON 文件（后续扩展）

### 性能优化建议（非 MVP）

- 月视图切换时，使用 `useMemo` 缓存 `markedDates` 计算
- `RecurrenceEngine.getOccurrences()` 结果可按 `(rule, month)` 缓存
- 日程列表长时，使用 `FlatList` 的 `getItemLayout` 优化滚动
- 大型日程列表考虑虚拟滚动（MVP 数据量小，不需要）

---

## 开发优先级建议

| 优先级 | 模块 | 原因 |
|--------|------|------|
| P0 | 项目初始化 + CalendarScreen 月视图 | 基础框架，能看见日历 |
| P0 | EventEditScreen 基础（标题、时间、保存） | 能创建单次日程 |
| P0 | EventScreen 详情 + 删除 | 能查看和删除 |
| P1 | RecurrenceEngine + 重复日程创建 | 核心功能 |
| P1 | 重复日程查看和例外处理 | 核心功能完整性 |
| P1 | 提醒功能 MVP | 核心功能 |
| P2 | 颜色选择 + 色点显示 | UI 完善 |
| P2 | 设置页面 | 用户体验 |
| P3 | 重复日程"编辑此后所有" | 高级操作 |
| P3 | 引导页、空状态优化 | 用户体验 |
