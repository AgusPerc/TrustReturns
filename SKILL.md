# Apple Glass Dashboard Design Skill

## Overview
This skill generates beautiful, modern HTML dashboards with Apple-inspired glassmorphism design. It creates fully functional, single-file HTML applications with dark/light themes, smooth animations, and professional styling using Tailwind CSS and Lucide icons.

**Key Features:**
- 🎨 Glassmorphism effects for cards, sidebars, and inputs
- 🌓 Dark/Light theme toggle with localStorage persistence
- ✨ Smooth animations (fade-in, slide-up, slide-left, slide-right)
- 🎯 Icon containers with hover effects
- 📱 Fully responsive design
- 🎭 Custom scrollbars
- 🔤 Inter font family
- 🎬 Transition effects on all interactive elements

## When to Use This Skill
Use this skill when you need to create:
- Project tracking dashboards
- Analytics interfaces
- Task management apps
- Data visualization tools
- Admin panels
- Portfolio showcases
- Any modern web application requiring professional aesthetics

**Do NOT use for:**
- Static websites without interactivity
- Simple landing pages
- Text-heavy documentation sites

## Core Design Elements

### 1. Glass Cards
```css
/* Dark Mode */
background: rgba(30, 30, 30, 0.8);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

/* Light Mode */
background: rgba(255, 255, 255, 0.9);
border: 1px solid rgba(0, 0, 0, 0.1);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Hover Effect */
transform: translateY(-2px);
box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
```

### 2. Icon Containers
- Rounded containers with glass effect
- Hover scale animation (1.05)
- Smooth color transitions
- Used for: stat cards, buttons, feature highlights

### 3. Animations
- **fade-in**: 0.6s smooth fade
- **slide-up**: 0.8s upward slide with scale
- **slide-in-left**: 0.6s from left
- **slide-in-right**: 0.6s from right
- All use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for smooth easing

### 4. Input Fields
- Glass background with subtle blur
- Border highlights on focus (blue glow)
- Smooth transitions (0.3s)
- Rounded corners (xl/2xl)

## Available Components

When generating a dashboard, you can include these predefined components:

### Layout Components
1. **sidebar**: Fixed sidebar with navigation links and glass effect
2. **header**: Top header with logo, title, and action buttons
3. **footer**: Optional footer with links or info

### Data Display Components
4. **statsCards**: Grid of stat cards with icons, numbers, and labels
5. **dataTable**: Sortable table with glass styling and hover effects
6. **chartContainer**: Container for charts (placeholder for Chart.js integration)

### Interactive Components
7. **kanbanBoard**: Drag-and-drop board with columns and cards
8. **timeline**: Vertical timeline with events and dates
9. **calendar**: Monthly calendar view with events
10. **progressBars**: Progress indicators with percentages

### Form Components
11. **formSection**: Glass-styled forms with inputs, selects, textareas
12. **searchBar**: Search input with icon and glass effect

### Content Components
13. **emptyState**: Beautiful empty state with icon and call-to-action
14. **notificationPanel**: Notification list with icons and timestamps

## Usage Instructions

When a user asks you to create a dashboard or app with this design style, follow these steps:

### Step 1: Understand Requirements
Ask clarifying questions if needed:
- What type of app? (project tracker, analytics, etc.)
- Which components needed? (sidebar, stats, table, etc.)
- Initial theme preference? (dark/light)
- Any specific color accents?

### Step 2: Generate the HTML Structure
Create a complete HTML file with:
```html
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[App Name]</title>
  
  <!-- Inter Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { darkMode: 'class' }
  </script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  
  <style>
    /* Include all glass styles, animations, and theme overrides */
  </style>
</head>
<body>
  <!-- App content -->
</body>
</html>
```

### Step 3: Add Core Styles
Always include these essential styles:

```css
/* Body and Font */
body {
  font-family: 'Inter', sans-serif;
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { 
  background: rgba(255, 255, 255, 0.3); 
  border-radius: 3px; 
}
::-webkit-scrollbar-thumb:hover { 
  background: rgba(255, 255, 255, 0.4); 
}

/* Glass Cards - Dark Mode */
.glass-card {
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Glass Sidebar */
.glass-sidebar {
  background: rgba(30, 30, 30, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

/* Glass Input */
.glass-input {
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.glass-input:focus-within {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

/* Icon Container */
.icon-container {
  background: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.icon-container:hover {
  background: rgba(50, 50, 50, 0.9);
  transform: scale(1.05);
}

/* Animations */
@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slide-up {
  0% { opacity: 0; transform: translateY(30px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes slide-in-left {
  0% { opacity: 0; transform: translateX(-40px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-right {
  0% { opacity: 0; transform: translateX(40px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-fade-in { 
  animation: fade-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; 
}
.animate-slide-up { 
  animation: slide-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; 
}
.animate-slide-left { 
  animation: slide-in-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; 
}
.animate-slide-right { 
  animation: slide-in-right 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; 
}

/* Light Mode Overrides */
html:not(.dark) .glass-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

html:not(.dark) .glass-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.15);
}

html:not(.dark) .glass-sidebar {
  background: rgba(255, 255, 255, 0.9);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

html:not(.dark) .glass-input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

html:not(.dark) .icon-container {
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.15);
}

html:not(.dark) ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
}
```

### Step 4: Add Theme Toggle JavaScript
Always include this essential JavaScript for theme switching:

```javascript
// Theme Management
function initTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  updateBackground();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateBackground();
}

function updateBackground() {
  const isDark = document.documentElement.classList.contains('dark');
  const bgLayer = document.getElementById('bgLayer');
  if (bgLayer) {
    bgLayer.style.backgroundColor = isDark ? '#0a0a0a' : '#f5f5f5';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Initialize Lucide icons
  lucide.createIcons();
});
```

### Step 5: Build Component Templates

#### Stats Cards Example:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-slide-up">
  <!-- Card 1 -->
  <div class="glass-card rounded-2xl p-5 md:p-6">
    <div class="flex items-center justify-between mb-3">
      <div class="icon-container p-3 rounded-xl">
        <i data-lucide="users" class="w-6 h-6 text-blue-400"></i>
      </div>
      <span class="text-xs font-medium text-green-400">+12%</span>
    </div>
    <h3 class="text-2xl md:text-3xl font-bold mb-1">1,234</h3>
    <p class="text-xs md:text-sm text-gray-400 dark:text-gray-300">Total Users</p>
  </div>
  
  <!-- Repeat for more cards -->
</div>
```

#### Sidebar Example:
```html
<aside class="glass-sidebar fixed left-0 top-0 h-full w-64 p-6 flex flex-col animate-slide-left">
  <!-- Logo/Header -->
  <div class="flex items-center gap-3 mb-8">
    <div class="icon-container p-2 rounded-xl">
      <i data-lucide="layout-dashboard" class="w-6 h-6 text-blue-400"></i>
    </div>
    <h2 class="text-xl font-bold">Dashboard</h2>
  </div>
  
  <!-- Navigation Links -->
  <nav class="flex-1 space-y-2">
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl glass-card hover:scale-105 transition-all duration-200">
      <i data-lucide="home" class="w-5 h-5"></i>
      <span>Home</span>
    </a>
    <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200">
      <i data-lucide="bar-chart" class="w-5 h-5"></i>
      <span>Analytics</span>
    </a>
    <!-- More links -->
  </nav>
  
  <!-- Theme Toggle at Bottom -->
  <button id="themeToggle" class="glass-card p-3 rounded-xl hover:scale-105 transition-all duration-200 w-full flex items-center justify-center gap-2">
    <i data-lucide="moon" class="w-5 h-5 dark-icon hidden dark:block"></i>
    <i data-lucide="sun" class="w-5 h-5 light-icon block dark:hidden"></i>
    <span>Toggle Theme</span>
  </button>
</aside>
```

#### Data Table Example:
```html
<div class="glass-card rounded-2xl p-6 animate-slide-up">
  <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-700 dark:border-gray-200">
          <th class="text-left py-3 px-4 text-sm font-semibold">Name</th>
          <th class="text-left py-3 px-4 text-sm font-semibold">Status</th>
          <th class="text-left py-3 px-4 text-sm font-semibold">Date</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-800 dark:border-gray-100 hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 text-sm">John Doe</td>
          <td class="py-3 px-4">
            <span class="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Active</span>
          </td>
          <td class="py-3 px-4 text-sm text-gray-400">2025-01-15</td>
        </tr>
        <!-- More rows -->
      </tbody>
    </table>
  </div>
</div>
```

#### Empty State Example:
```html
<div id="emptyState" class="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
  <div class="glass-card rounded-3xl p-12 text-center max-w-md">
    <div class="icon-container w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <i data-lucide="inbox" class="w-10 h-10 text-blue-400"></i>
    </div>
    <h2 class="text-2xl font-bold mb-3">No Data Yet</h2>
    <p class="text-gray-400 mb-6">Get started by uploading your first file or creating a new project.</p>
    <button class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-medium hover:scale-105 transition-all duration-200">
      Get Started
    </button>
  </div>
</div>
```

## Common Lucide Icons to Use

**Navigation & Layout:**
- `layout-dashboard` - Dashboard icon
- `home` - Home
- `menu` - Hamburger menu
- `settings` - Settings
- `user` - User profile

**Data & Analytics:**
- `bar-chart` - Bar chart
- `line-chart` - Line chart
- `trending-up` - Trending up
- `trending-down` - Trending down
- `activity` - Activity

**Actions:**
- `plus` - Add/Create
- `edit` - Edit
- `trash` - Delete
- `search` - Search
- `filter` - Filter
- `download` - Download
- `upload` - Upload

**Status:**
- `check-circle` - Success
- `x-circle` - Error
- `alert-circle` - Warning
- `info` - Information

**Theme:**
- `moon` - Dark mode
- `sun` - Light mode

**Others:**
- `inbox` - Empty state
- `calendar` - Calendar
- `clock` - Time
- `users` - Users
- `folder` - Folder
- `file` - File

## Design Best Practices

1. **Spacing**: Use Tailwind's spacing scale consistently
   - Small screens: `px-3 py-2 gap-2`
   - Medium screens: `md:px-4 md:py-3 md:gap-3`
   - Large screens: `lg:px-6 lg:py-4 lg:gap-4`

2. **Responsive Design**: Always include responsive classes
   - Mobile first: `grid-cols-1`
   - Tablet: `md:grid-cols-2`
   - Desktop: `lg:grid-cols-4`

3. **Animation Timing**: 
   - Quick interactions: 0.2s
   - Card hovers: 0.3s
   - Page transitions: 0.6-0.8s

4. **Color Accents**: Use these for highlights
   - Blue: Primary actions (`text-blue-400`, `bg-blue-500`)
   - Purple: Secondary actions (`text-purple-400`)
   - Green: Success/Positive (`text-green-400`)
   - Red: Errors/Negative (`text-red-400`)
   - Yellow: Warnings (`text-yellow-400`)

5. **Glass Effect Layering**:
   - Background: Fixed colored layer (`#0a0a0a` dark, `#f5f5f5` light)
   - Cards: Semi-transparent with blur
   - Inputs: Slightly less opacity than cards
   - Modals: Higher opacity for emphasis

## Examples

### Example 1: Project Tracker Dashboard

**User Request:** "Create a project tracking dashboard with a task list, progress bars, and team member cards"

**Components to include:**
- Header with logo and theme toggle
- Sidebar with navigation
- Stats cards showing: Total Projects, Completed, In Progress, Team Members
- Progress bars for each project
- Data table with task list
- Team member cards with avatars

**Output:** Generate complete HTML file with all components styled using glass design.

### Example 2: Analytics Dashboard

**User Request:** "Build an analytics dashboard for monitoring website traffic"

**Components to include:**
- Header with date range selector
- Stats cards: Visitors, Page Views, Bounce Rate, Avg. Session
- Chart containers (placeholders for Chart.js)
- Data table with top pages
- Empty state when no data

### Example 3: Simple Task Manager

**User Request:** "Create a minimal task manager with categories"

**Components to include:**
- Kanban board with 3 columns: To Do, In Progress, Done
- Add task form
- Search bar
- Task cards with glass effect

## Important Notes

1. **Always generate single-file HTML** - Everything embedded (styles + scripts)
2. **Always include theme toggle** - It's a core feature
3. **Always initialize Lucide icons** - Call `lucide.createIcons()` after DOM loads
4. **Always use responsive classes** - Mobile-first approach
5. **Never include data logic** - Only UI/UX design
6. **Never add Chart.js** - Just create placeholder containers
7. **Test both themes** - Ensure light mode looks as good as dark mode

## Customization Options

When generating, ask users about:
- **Primary accent color** (default: blue/purple gradient)
- **Initial theme** (default: dark)
- **Sidebar position** (default: left, can be right)
- **Animation speed** (default: standard, can be slow/fast)
- **Border radius** (default: xl/2xl, can be lg/3xl)

## File Output

Always save the generated file to `/mnt/user-data/outputs/` with a descriptive name like:
- `project-tracker-dashboard.html`
- `analytics-dashboard.html`
- `task-manager-app.html`

Then provide a download link using the `computer://` protocol.

---

## Summary

This skill transforms user requests into beautiful, functional dashboard templates using Apple-inspired glassmorphism design. Focus on aesthetics, smooth interactions, and responsive layouts. Let the user handle data logic - you handle making it look stunning! ✨
