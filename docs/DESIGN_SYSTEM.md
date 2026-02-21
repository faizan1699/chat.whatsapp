# Design System Documentation

## Color Palette

### Primary Colors
- **Primary Green**: `#10B981` (emerald-500)
- **Primary Green Dark**: `#059669` (emerald-600)
- **Primary Green Light**: `#34D399` (emerald-400)

### Neutral Colors
- **White**: `#FFFFFF` (white)
- **Black**: `#000000` (black)
- **Gray 50**: `#F9FAFB` (gray-50)
- **Gray 100**: `#F3F4F6` (gray-100)
- **Gray 200**: `#E5E7EB` (gray-200)
- **Gray 300**: `#D1D5DB` (gray-300)
- **Gray 400**: `#9CA3AF` (gray-400)
- **Gray 500**: `#6B7280` (gray-500)
- **Gray 600**: `#4B5563` (gray-600)
- **Gray 700**: `#374151` (gray-700)
- **Gray 800**: `#1F2937` (gray-800)
- **Gray 900**: `#111827` (gray-900)

### Semantic Colors
- **Success**: `#10B981` (emerald-500)
- **Error**: `#EF4444` (red-500)
- **Warning**: `#F59E0B` (amber-500)
- **Info**: `#3B82F6` (blue-500)

## Typography

### Font Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)

### Font Weights
- **normal**: `400`
- **medium**: `500`
- **semibold**: `600`
- **bold**: `700`

## Spacing

### Base Spacing Unit: 0.25rem (4px)
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)

## Border Radius
- **sm**: `0.125rem` (2px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **full**: `9999px`

## Shadows
- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

## Component Patterns

### Buttons
```tsx
// Primary Button
<button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">
  Button Text
</button>

// Secondary Button
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors">
  Button Text
</button>

// Outline Button
<button className="border border-emerald-500 text-emerald-500 hover:bg-emerald-50 font-medium py-3 px-6 rounded-lg transition-colors">
  Button Text
</button>
```

### Form Inputs
```tsx
<input
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
  placeholder="Enter text"
/>
```

### Cards
```tsx
<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
  Card Content
</div>
```

### Layout Containers
```tsx
// Full width container
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>

// Centered container
<div className="min-h-screen flex items-center justify-center">
  Content
</div>
```

## Animation & Transitions
- **Transition Duration**: `150ms`, `300ms`, `500ms`
- **Transition Timing**: `ease-in-out`, `ease-out`, `ease-in`
- **Common Transitions**: `transition-colors`, `transition-transform`, `transition-all`

## Responsive Breakpoints
- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`
- **2xl**: `1536px`

## Usage Guidelines

### 1. Consistency
- Always use defined colors from the palette
- Maintain consistent spacing using the spacing scale
- Use consistent border radius for similar elements

### 2. Accessibility
- Ensure text has sufficient contrast (WCAG AA or better)
- Use semantic HTML elements
- Provide focus states for interactive elements

### 3. Performance
- Use Tailwind's purge configuration to remove unused CSS
- Prefer utility classes over custom CSS
- Use responsive prefixes for responsive design

### 4. Component Structure
- Follow the established component patterns
- Use consistent naming conventions
- Maintain proper component hierarchy

## Dark Mode Support
The design system supports dark mode with appropriate color variants:
- Use `dark:` prefix for dark mode styles
- Ensure proper contrast in both light and dark modes
- Test all components in both themes
