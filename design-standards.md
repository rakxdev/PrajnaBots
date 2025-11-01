# PrajnaBots CSS Architecture & Implementation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [CSS Variables Reference](#css-variables-reference)
3. [CSS File Organization](#css-file-organization)
4. [CSS Loading Order](#css-loading-order)
5. [Page Structure Template](#page-structure-template)
6. [Reusable Component Classes](#reusable-component-classes)
7. [Layout Patterns](#layout-patterns)
8. [Responsive Guidelines](#responsive-guidelines)
9. [Naming Conventions](#naming-conventions)
10. [Creating a New Page](#creating-a-new-page)

---

## Introduction

This guide provides the CSS architecture for implementing any page in the PrajnaBots platform. Follow these patterns when creating dashboards, admin panels, or new pages to maintain consistency.

**Key Principle**: Use existing shared CSS and components whenever possible. Only create new CSS for truly unique page sections.

---

## CSS Variables Reference

All design tokens are in `css/shared/variables.css`. Always use these variables instead of hardcoded values.

### Essential Variables

**Colors**:
- `--primary-blue`, `--electric-blue`, `--bright-cyan`, `--solar-orange`
- `--charcoal`, `--slate-gray`, `--light-gray`, `--white`
- `--success-green`, `--warning-amber`, `--error-red`

**Typography**:
- `--font-primary` (Inter), `--font-secondary` (Poppins)
- `--text-xs` through `--text-7xl` (12px to 64px)
- `--font-weight-regular` through `--font-weight-extrabold` (400 to 800)

**Spacing** (8-point grid):
- `--spacing-xs` (4px) through `--spacing-3xl` (64px)

**Others**:
- `--radius-sm` through `--radius-full` (4px to 9999px)
- `--shadow-sm` through `--shadow-xl`
- `--transition-fast`, `--transition-base`, `--transition-slow`
- `--z-base` through `--z-modal` (1 to 500)

---

## CSS File Organization

```
css/
├── shared/              # Load these on every page
│   ├── reset.css
│   ├── variables.css
│   ├── typography.css
│   ├── utilities.css
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   ├── animations.css
│   └── responsive.css
│
├── components/          # Reusable components
│   ├── navbar.css
│   ├── footer.css
│   └── modal.css
│
└── [page-name]/         # Page-specific styles only
    └── [page].css
```

**Rule**: Create new CSS files only when existing shared/component styles don't cover your needs.

---

## CSS Loading Order

Load in this exact order:

```html
<!-- 1. Reset & Variables -->
<link rel="stylesheet" href="css/shared/reset.css" />
<link rel="stylesheet" href="css/shared/variables.css" />

<!-- 2. Typography & Utilities -->
<link rel="stylesheet" href="css/shared/typography.css" />
<link rel="stylesheet" href="css/shared/utilities.css" />

<!-- 3. Core Components -->
<link rel="stylesheet" href="css/shared/buttons.css" />
<link rel="stylesheet" href="css/shared/forms.css" />
<link rel="stylesheet" href="css/shared/cards.css" />
<link rel="stylesheet" href="css/shared/animations.css" />
<link rel="stylesheet" href="css/shared/responsive.css" />

<!-- 4. Global Components -->
<link rel="stylesheet" href="css/components/navbar.css" />
<link rel="stylesheet" href="css/components/footer.css" />

<!-- 5. Page-Specific (last for override capability) -->
<link rel="stylesheet" href="css/[page-name]/[page].css" />
```

---

## Page Structure Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Title | PrajnaBots</title>
    
    <!-- CSS files in correct order -->
  </head>
  
  <body>
    <!-- Navbar Component -->
    <header id="site-navbar" data-component="navbar"></header>

    <!-- Main Content -->
    <main id="main-content">
      
      <!-- Section Pattern -->
      <section id="section-name" class="section-class" aria-labelledby="section-title">
        <div class="container">
          <header class="section-header">
            <span class="section-eyebrow">Label</span>
            <h2 id="section-title">Section Heading</h2>
            <p class="section-description">Description</p>
          </header>
          
          <div class="content-grid-or-flex">
            <!-- Content -->
          </div>
        </div>
      </section>

    </main>

    <!-- Footer Component -->
    <footer id="site-footer" data-component="footer"></footer>
  </body>
</html>
```

---

## Reusable Component Classes

### Button Classes

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Sizes -->
<button class="btn btn-sm btn-primary">Small</button>
<button class="btn btn-lg btn-primary">Large</button>
```

### Card Classes

```html
<div class="card">
  <div class="card-header">
    <h3>Title</h3>
  </div>
  <div class="card-body">
    Content
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Feature Card Pattern

```html
<article class="feature-card">
  <div class="feature-icon">📊</div>
  <h3 class="feature-title">Feature Name</h3>
  <p class="feature-description">Description</p>
  <button class="btn btn-outline">Learn More</button>
</article>
```

### Stats Card Pattern

```html
<div class="stat-card">
  <span class="stat-icon">💡</span>
  <span class="stat-number">95%</span>
  <span class="stat-label">Accuracy</span>
</div>
```

### Hero Section Pattern

```html
<section class="hero-section">
  <div class="container hero-container">
    <div class="hero-content">
      <h1 class="hero-title">Headline</h1>
      <p class="hero-subtitle">Subtext</p>
      <div class="hero-cta-group">
        <a href="#" class="btn btn-lg btn-primary">Primary</a>
        <a href="#" class="btn btn-lg btn-secondary">Secondary</a>
      </div>
    </div>
    <div class="hero-visual">
      <!-- Image -->
    </div>
  </div>
</section>
```

### Section Header Pattern

```html
<header class="section-header">
  <span class="section-eyebrow">Category</span>
  <h2>Section Title</h2>
  <p class="section-description">Description text</p>
</header>
```

---

## Layout Patterns

### Container Wrapper

```html
<div class="container">        <!-- Max-width: 1280px -->
<div class="container-sm">     <!-- Max-width: 640px -->
<div class="container-md">     <!-- Max-width: 768px -->
```

### Grid Layouts

```html
<!-- 2-column grid (desktop), stacks on mobile -->
<div class="grid-cols-2">
  <div>Col 1</div>
  <div>Col 2</div>
</div>

<!-- Feature grid (responsive 3-4 columns) -->
<div class="features-grid">
  <article class="feature-card">...</article>
  <article class="feature-card">...</article>
</div>

<!-- Stats grid (4 columns responsive) -->
<div class="stats-grid">
  <div class="stat-card">...</div>
  <div class="stat-card">...</div>
</div>
```

### Flexbox Utilities

```html
<div class="flex items-center justify-center">Centered</div>
<div class="flex justify-between items-center">Space Between</div>
<div class="flex flex-column">Column Direction</div>
```

### Spacing Utilities

```html
<!-- Margin: m-{size}, mt-{size}, mb-{size}, ml-{size}, mr-{size} -->
<div class="mt-4">Margin-top: 24px</div>

<!-- Padding: p-{size}, pt-{size}, pb-{size}, pl-{size}, pr-{size} -->
<div class="p-3">Padding: 16px</div>

<!-- Sizes: 0 (0px), 1 (4px), 2 (8px), 3 (16px), 4 (24px), 5 (32px) -->
```

---

## Responsive Guidelines

### Breakpoints

```css
/* Mobile: Default styles (320px - 767px) */
/* Tablet: @media (min-width: 768px) */
/* Desktop: @media (min-width: 1024px) */
/* Wide: @media (min-width: 1440px) */
```

### Mobile-First Pattern

```css
/* Mobile (default) */
.my-element {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
  .my-element {
    flex-direction: row;
    gap: var(--spacing-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .my-element {
    gap: var(--spacing-xl);
  }
}
```

### Responsive Typography

```css
/* Use clamp() for fluid sizing */
.hero-title {
  font-size: clamp(2rem, 3.5vw + 0.5rem, 3rem);
}
```

---

## Naming Conventions

### Class Naming Rules

**Format**: Use kebab-case

**Component Classes** (BEM-inspired):
- Block: `.card`, `.navbar`, `.hero-section`
- Element: `.card__header`, `.navbar__logo`
- Modifier: `.card--elevated`, `.btn--large`

**State Classes** (prefixed):
- `.is-active`, `.is-visible`, `.is-loading`
- `.has-error`, `.has-success`

**Utility Classes**:
- `.flex`, `.grid`, `.block`, `.hidden`
- `.text-center`, `.font-bold`, `.text-primary`
- `.mt-3`, `.p-4`, `.rounded-lg`

### When to Use Each

- **Component classes**: Structured components (`.hero-section`, `.feature-card`)
- **State classes**: Dynamic states (`.is-active`, `.has-error`)
- **Utility classes**: One-off styling (`.mt-4`, `.flex`, `.text-center`)

---

## Creating a New Page

### Step 1: Copy This HTML Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Page | PrajnaBots</title>
    
    <!-- Shared CSS (copy from existing page) -->
    <link rel="stylesheet" href="css/shared/reset.css" />
    <link rel="stylesheet" href="css/shared/variables.css" />
    <link rel="stylesheet" href="css/shared/typography.css" />
    <link rel="stylesheet" href="css/shared/utilities.css" />
    <link rel="stylesheet" href="css/shared/buttons.css" />
    <link rel="stylesheet" href="css/shared/forms.css" />
    <link rel="stylesheet" href="css/shared/cards.css" />
    <link rel="stylesheet" href="css/shared/animations.css" />
    <link rel="stylesheet" href="css/shared/responsive.css" />
    
    <!-- Components -->
    <link rel="stylesheet" href="css/components/navbar.css" />
    <link rel="stylesheet" href="css/components/footer.css" />
    
    <!-- Your page-specific CSS -->
    <link rel="stylesheet" href="css/your-page/your-page.css" />
  </head>
  
  <body>
    <header id="site-navbar" data-component="navbar"></header>
    
    <main id="main-content">
      <!-- Build your sections here using component patterns above -->
    </main>
    
    <footer id="site-footer" data-component="footer"></footer>
    
    <!-- Scripts (copy from existing page) -->
    <script src="js/components/component-loader.js"></script>
    <script src="js/shared/utils.js" defer></script>
  </body>
</html>
```

### Step 2: Create Page-Specific CSS (Only if Needed)

Create `css/your-page/your-page.css`:

```css
/* Only add styles NOT covered by shared CSS */

.your-unique-section {
  padding: var(--spacing-2xl) 0;
  background: var(--light-gray);
}

.your-custom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 1024px) {
  .your-custom-grid {
    grid-template-columns: 280px 1fr;
  }
}
```

### Step 3: Reuse Existing Components

**✅ DO**:
- Use `.btn`, `.card`, `.feature-card` classes
- Use utility classes (`.flex`, `.mt-4`, etc.)
- Reference CSS variables
- Follow existing section patterns

**❌ DON'T**:
- Hardcode colors, sizes, or spacing
- Duplicate styles from shared CSS
- Create new button/card variants without reason
- Break the established grid/spacing system

---

## Quick Reference Checklist

When creating a new page:

- [ ] Load all shared CSS files in correct order
- [ ] Use `data-component="navbar"` for navbar
- [ ] Use `data-component="footer"` for footer  
- [ ] Wrap content in `.container`
- [ ] Use section headers with `.section-header`
- [ ] Reuse button classes (`.btn .btn-primary`)
- [ ] Reuse card classes (`.card`, `.feature-card`, `.stat-card`)
- [ ] Use CSS variables for all colors/spacing
- [ ] Follow mobile-first responsive approach
- [ ] Use semantic HTML with ARIA labels
- [ ] Create page-specific CSS only for unique elements

---

## Summary

**The Golden Rule**: Maximize reuse, minimize new CSS.

Your pages should look visually similar because they use the same shared components, variables, and patterns. Only create custom CSS for genuinely unique page-specific elements that can't be achieved with existing classes.

This approach ensures:
- Visual consistency across all pages
- Faster development time
- Easier maintenance
- Smaller CSS footprint

---

**Document Version**: 2.0  
**Last Updated**: November 2025  
**Focus**: CSS Architecture & Implementation
