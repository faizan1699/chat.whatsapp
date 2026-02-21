# AI Agent Training Guide - Project Structure & UI/UX Patterns

## Overview

This document serves as a comprehensive training guide for AI agents working on the Video Calling App project. It outlines the project structure, design patterns, and development guidelines that must be followed.

## 📁 Project Structure

### Application Structure
```
nextjs-webrtc-app/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages group
│   │   ├── login/
│   │   └── register/
│   ├── chat/                     # Chat application pages
│   │   ├── page.tsx             # Main chat interface
│   │   └── clean/               # Clean chat variant
│   ├── legal/                   # Legal pages
│   │   ├── privacy-policy/
│   │   ├── user-agreement/
│   │   └── data-usage/
│   ├── api/                     # API routes
│   │   └── auth/               # Authentication endpoints
│   └── globals.css             # Global styles
├── components/                  # Reusable React components
│   ├── chat/                   # Chat-specific components
│   ├── global/                 # Global UI components
│   └── ui/                     # Base UI components
├── docs/                       # Documentation
│   ├── DESIGN_SYSTEM.md        # Design system reference
│   ├── CODE_STRUCTURE.md       # Code structure guide
│   └── AGENT_RULES.md          # Agent-specific rules
├── utils/                      # Utility functions
├── hooks/                      # Custom React hooks
├── services/                   # API service functions
├── store/                      # Redux store configuration
├── types/                      # TypeScript type definitions
└── tailwind.config.js          # Tailwind CSS configuration
```

## 🎨 Design System Implementation

### Color Usage Guidelines
- **Primary Green (`primary-500`)**: Main CTAs, primary actions, brand elements
- **Gray Scale**: Text, borders, backgrounds, secondary elements
- **Semantic Colors**: Success states, errors, warnings, info messages
- **White/Black**: Base colors for high contrast

### Typography Hierarchy
1. **Headings**: Use `font-bold` with appropriate size classes
2. **Body Text**: Use `font-normal` or `font-medium` with `text-gray-600/700`
3. **Labels**: Use `text-sm font-medium text-gray-700`
4. **Helper Text**: Use `text-xs text-gray-500`

### Spacing System
- Follow the 4px base spacing unit
- Use consistent padding: `p-4`, `p-6`, `p-8`
- Maintain consistent margins: `mb-4`, `mb-6`, `mb-8`
- Use responsive spacing with `sm:`, `md:`, `lg:` prefixes

## 🧩 Component Patterns

### 1. Form Components
```tsx
// Standard Input Field
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Icon className="h-5 w-5 text-gray-400" />
  </div>
  <input
    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
    placeholder="Placeholder text"
  />
</div>

// Error Display
{errors.field && (
  <p className="mt-2 text-sm text-semantic-error">{errors.field.message}</p>
)}
```

### 2. Button Components
```tsx
// Primary Button
<button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
  Button Text
</button>

// Secondary Button
<button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors">
  Button Text
</button>
```

### 3. Card Components
```tsx
<div className="bg-white rounded-2xl shadow-strong border border-gray-100 p-8">
  Card Content
</div>
```

### 4. Layout Components
```tsx
// Page Container
<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    Content
  </div>
</div>
```

## 🔄 Animation Patterns

### Entrance Animations
- Use `animate-fade-in` for smooth appearances
- Use `animate-slide-up` for upward slide effects
- Apply to page sections and form elements

### Loading States
```tsx
// Spinner
<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>

// Progress Bar
<div className="w-full bg-gray-200 rounded-full h-2">
  <div className="bg-primary-500 h-2 rounded-full animate-progress-indeterminate"></div>
</div>
```

## 📱 Responsive Design Principles

### Breakpoint Strategy
- **Mobile First**: Design for mobile, then enhance for larger screens
- **Tablet**: Use `md:` prefix for tablet adaptations
- **Desktop**: Use `lg:` and `xl:` prefixes for desktop layouts

### Common Responsive Patterns
```tsx
// Responsive Container
<div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">

// Responsive Typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Responsive Spacing
<div className="p-4 md:p-6 lg:p-8">
```

## 🔐 Authentication Flow Patterns

### Page Structure
1. **Logo Section**: Brand identity with icon and title
2. **Form Card**: White card with shadow and border
3. **Form Fields**: Consistent input styling with icons
4. **Error Handling**: Inline error messages with red accent
5. **CTA Button**: Full-width primary button
6. **Footer Links**: Navigation to alternative auth pages

### Form Validation
- Use `react-hook-form` for form management
- Implement real-time validation
- Show inline error messages
- Provide clear success feedback

## 🎯 UI/UX Best Practices

### 1. Consistency
- Use design tokens from Tailwind config
- Maintain consistent component patterns
- Follow established naming conventions

### 2. Accessibility
- Ensure proper color contrast (WCAG AA)
- Use semantic HTML elements
- Provide focus states for interactive elements
- Include ARIA labels where necessary

### 3. Performance
- Optimize images and assets
- Use lazy loading for heavy components
- Implement proper error boundaries
- Minimize bundle size

### 4. User Experience
- Provide loading states for async operations
- Include micro-interactions and transitions
- Offer clear feedback for user actions
- Implement proper error recovery

## 📋 Development Checklist

### Before Making Changes
1. **Read Documentation**: Check `DESIGN_SYSTEM.md` and `CODE_STRUCTURE.md`
2. **Understand Context**: Review existing components and patterns
3. **Plan Changes**: Ensure alignment with design system
4. **Test Responsiveness**: Verify across all breakpoints

### During Development
1. **Use Design Tokens**: Prefer Tailwind utilities over custom CSS
2. **Follow Patterns**: Use established component structures
3. **Maintain Consistency**: Keep styling consistent with existing code
4. **Add Transitions**: Include appropriate animations and transitions

### After Implementation
1. **Test Functionality**: Verify all features work correctly
2. **Check Responsiveness**: Test on different screen sizes
3. **Validate Accessibility**: Ensure proper contrast and focus states
4. **Update Documentation**: Keep docs current with changes

## 🚀 Common Tasks

### Adding New Pages
1. Create page in appropriate `app/` directory
2. Follow established layout patterns
3. Use design system colors and spacing
4. Include proper SEO metadata

### Creating Components
1. Place in appropriate `components/` subdirectory
2. Use TypeScript interfaces for props
3. Follow established naming conventions
4. Include proper error handling

### Styling Updates
1. Prefer Tailwind utilities over custom CSS
2. Use design system color palette
3. Maintain consistent spacing
4. Include responsive considerations

## 📚 Reference Materials

### Essential Reading
- `docs/DESIGN_SYSTEM.md` - Complete design system reference
- `docs/CODE_STRUCTURE.md` - Detailed code structure guide
- `tailwind.config.js` - Available design tokens

### Key Patterns to Study
- Authentication pages (`app/login/page.tsx`, `app/register/page.tsx`)
- Chat interface components
- Form validation patterns
- Responsive layout implementations

## ⚠️ Important Rules

1. **Never Hardcode Colors**: Always use design system color tokens
2. **Maintain Consistency**: Follow established patterns religiously
3. **Test Thoroughly**: Verify functionality across all breakpoints
4. **Document Changes**: Update relevant documentation when making changes
5. **Think Mobile First**: Design for mobile, then enhance for larger screens
6. **Prioritize Accessibility**: Ensure proper contrast and focus management
7. **Use Semantic HTML**: Choose appropriate HTML elements for structure
8. **Handle Errors Gracefully**: Provide clear error states and recovery options

## 🔄 Continuous Improvement

This guide should be updated as the project evolves. When implementing new patterns or making significant changes, update this document to maintain consistency across the team.

---

**Remember**: Consistency is key to a maintainable and scalable codebase. Always refer to this guide and the design system documentation before making changes.
