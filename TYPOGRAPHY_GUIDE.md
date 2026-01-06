# Qode App Typography Guide

## Font Families

### Playfair Display (Serif)
**Usage**: Headings, Logo, Titles
**Characteristics**: Elegant, sophisticated, high-contrast serif font
**Files**: Loaded via Expo Font in `app/_layout.tsx`

### Lato (Sans-serif)
**Usage**: Body text, Subheadings, Buttons, Inputs, Captions
**Characteristics**: Clean, modern, highly readable sans-serif font
**Files**: Loaded via Expo Font in `app/_layout.tsx`

---

## Typography Scale

### Playfair Display - Headings & Logo

#### Logo Styles
```tsx
// Large Logo (48px) - App launch, splash screens
<Text className={tw.logoLarge}>Qode</Text>

// Medium Logo (36px) - Main screens
<Text className={tw.logoMedium}>Qode</Text>

// Small Logo (24px) - Headers, compact views
<Text className={tw.logoSmall}>Qode</Text>
```

#### Heading Styles
```tsx
// H1 (36px / text-4xl) - Page titles
<Text className={tw.h1}>Portfolio Performance</Text>

// H2 (30px / text-3xl) - Section titles
<Text className={tw.h2}>Investment Strategies</Text>

// H3 (24px / text-2xl) - Card titles
<Text className={tw.h3}>Risk Management</Text>

// H4 (20px / text-xl) - Subsections
<Text className={tw.h4}>Monthly Reports</Text>
```

### Lato - Subheadings

```tsx
// Subheading (18px / text-lg) - Section subheadings
<Text className={tw.subheading}>Key Highlights</Text>

// Subheading Muted (16px / text-base) - Secondary subheadings
<Text className={tw.subheadingMuted}>Supporting Information</Text>
```

### Lato - Body Text

```tsx
// Body Large (18px / text-lg) - Emphasized body text
<Text className={tw.bodyLarge}>
  Important information that needs emphasis
</Text>

// Body (16px / text-base) - Primary body text
<Text className={tw.body}>
  This is the standard body text for all content
</Text>

// Body Muted (14px / text-sm) - Secondary text
<Text className={tw.bodyMuted}>
  Supporting details and metadata
</Text>

// Caption (12px / text-xs) - Helper text, footnotes
<Text className={tw.caption}>
  Additional context or legal disclaimers
</Text>
```

---

## Font Size Hierarchy

| Element | Font Family | Size | Tailwind Class | Usage |
|---------|-------------|------|----------------|-------|
| **Logo Large** | Playfair Display | 48px | `text-6xl` | Splash screen, app launch |
| **Logo Medium** | Playfair Display | 36px | `text-4xl` | Main screens, headers |
| **H1** | Playfair Display | 36px | `text-4xl` | Page titles |
| **H2** | Playfair Display | 30px | `text-3xl` | Section headings |
| **H3** | Playfair Display | 24px | `text-2xl` | Card titles |
| **Logo Small** | Playfair Display | 24px | `text-2xl` | Compact headers |
| **H4** | Playfair Display | 20px | `text-xl` | Subsection titles |
| **Body Large** | Lato | 18px | `text-lg` | Emphasized content |
| **Subheading** | Lato | 18px | `text-lg` | Section subheadings |
| **Body** | Lato | 16px | `text-base` | Standard body text |
| **Subheading Muted** | Lato | 16px | `text-base` | Secondary subheadings |
| **Body Muted** | Lato | 14px | `text-sm` | Secondary text |
| **Caption** | Lato | 12px | `text-xs` | Helper text |

---

## Font Weights

### Playfair Display Weights
- **Bold (700)**: Logo, H1 titles
- **Semibold (600)**: H2, H3 titles
- **Medium (500)**: H4 titles

### Lato Weights
- **Bold (700)**: Emphasized content
- **Semibold (600)**: Subheadings, important text
- **Medium (500)**: Subheadings muted, labels
- **Normal (400)**: Body text
- **Light (300)**: Optional for subtle text

---

## Usage Examples

### Page Header
```tsx
<View className="mb-8">
  <Text className={tw.h1}>Our Philosophy</Text>
  <Text className={tw.bodyMuted}>
    The foundation of how we approach investing
  </Text>
</View>
```

### Card with Title
```tsx
<View className={tw.card}>
  <Text className={tw.h3}>Evidence-Based Approach</Text>
  <Text className={tw.body}>
    Every investment decision is rooted in systematic analysis
  </Text>
</View>
```

### Section with Subheading
```tsx
<View>
  <Text className={tw.h2}>Investment Strategies</Text>
  <Text className={tw.subheading}>Our Four Core Strategies</Text>
  <Text className={tw.body}>
    We offer four distinct strategies to match different investor goals
  </Text>
</View>
```

### Logo in Header
```tsx
<View className="flex-row items-end">
  <Text className="font-playfair text-2xl font-semibold text-primary">
    my
  </Text>
  <Text className="font-playfair text-6xl font-bold text-primary">
    Qode
  </Text>
</View>
```

### Info Card with Caption
```tsx
<View className={tw.card}>
  <Text className={tw.h4}>Monthly Reports</Text>
  <Text className={tw.body}>
    Performance updates sent directly to your email
  </Text>
  <Text className={tw.caption}>
    Sent within 15 days of month end
  </Text>
</View>
```

---

## Design Principles

### 1. **Hierarchy Through Size**
- Use larger sizes for more important content
- Maintain clear visual hierarchy with proper size jumps
- Don't skip more than one level in the hierarchy

### 2. **Font Pairing**
- **Playfair Display**: Use for visual impact and branding
- **Lato**: Use for readability and accessibility
- Never mix fonts within the same text element

### 3. **Consistency**
- Always use design system classes (`tw.h1`, `tw.body`, etc.)
- Don't create custom font sizes outside the system
- Maintain consistent spacing between text elements

### 4. **Readability**
- Body text: `leading-relaxed` (1.75 line height)
- Keep line length between 45-75 characters
- Ensure sufficient contrast between text and background

### 5. **Accessibility**
- Minimum font size: 12px (caption text)
- Primary body text: 16px for comfortable reading
- High contrast ratios for text colors

---

## Color Combinations

### Primary Text Colors
```tsx
// Dark text on light background
text-foreground         // hsl(163.1, 100%, 6.3%) - #002017
text-primary            // hsl(158.4, 94.1%, 13.3%) - #02422b

// Muted/Secondary text
text-muted-foreground   // hsl(163.1, 30%, 28%)

// Accent text
text-accent             // hsl(49.3, 68.6%, 53.7%) - #DABD38
```

### Text on Colored Backgrounds
```tsx
// Text on primary background
text-primary-foreground // hsl(49.4, 73.9%, 95.5%) - Cream

// Text on accent background
text-accent-foreground  // hsl(163.1, 100%, 6.3%) - Dark green
```

---

## Common Patterns

### Page Layout
```tsx
<Container className={tw.contentContainer}>
  {/* Page Title */}
  <View className="mb-8">
    <Text className={tw.h1}>Page Title</Text>
    <Text className={tw.bodyMuted}>Page description</Text>
  </View>

  {/* Section */}
  <View className="mb-8">
    <Text className={tw.h2}>Section Title</Text>
    <View className="gap-6">
      {/* Cards */}
    </View>
  </View>
</Container>
```

### Info Card
```tsx
<View className={tw.card}>
  <View className="flex-row items-center gap-3 mb-4">
    <Icon />
    <Text className={tw.h3 + " flex-1 mb-0"}>Card Title</Text>
  </View>
  <Text className={tw.body}>Card content here</Text>
  <Text className={tw.caption}>Additional info</Text>
</View>
```

### List Item
```tsx
<View className={tw.listItem}>
  <Text className={tw.subheading}>Item Title</Text>
  <Text className={tw.body}>Item description</Text>
  <Text className={tw.bodyMuted}>Metadata</Text>
</View>
```

---

## Font Loading

Fonts are loaded in `app/_layout.tsx`:

```tsx
const [loaded] = useFonts({
  Lato: require('../assets/fonts/Lato-Regular.ttf'),
  'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
  PlayfairDisplay: require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
  'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
});
```

Configured in `tailwind.config.js`:

```js
fontFamily: {
  sans: ['Lato', 'System'],
  serif: ['PlayfairDisplay', 'System'],
}
```

---

## Don't Do This

❌ **Custom font sizes**
```tsx
<Text className="text-[17px]">Don't use arbitrary values</Text>
```

❌ **Mixing font families**
```tsx
<Text className="font-playfair">Text with <Text className="font-lato">mixed</Text> fonts</Text>
```

❌ **Skipping hierarchy levels**
```tsx
<Text className={tw.h1}>Title</Text>
<Text className={tw.h4}>Don't skip H2 and H3</Text>
```

❌ **Hardcoded styles**
```tsx
<Text style={{ fontSize: 18, fontFamily: 'Lato' }}>Use design system</Text>
```

---

## Do This Instead

✅ **Use design system classes**
```tsx
<Text className={tw.body}>Consistent, maintainable text</Text>
```

✅ **Maintain hierarchy**
```tsx
<Text className={tw.h1}>Title</Text>
<Text className={tw.h2}>Section</Text>
<Text className={tw.h3}>Subsection</Text>
<Text className={tw.body}>Content</Text>
```

✅ **Combine with spacing**
```tsx
<View className="gap-2">
  <Text className={tw.h3}>Title</Text>
  <Text className={tw.body}>Description</Text>
</View>
```

✅ **Use semantic classes**
```tsx
<Text className={tw.caption}>Helper text in proper size</Text>
```

---

## Testing Checklist

- [ ] All headings use Playfair Display
- [ ] All body text uses Lato
- [ ] Font sizes follow the hierarchy (12px → 48px)
- [ ] Proper spacing between text elements
- [ ] Text is readable on all backgrounds
- [ ] Fonts load correctly on iOS and Android
- [ ] Line heights are appropriate (relaxed for body)
- [ ] Text colors meet accessibility standards

---

## Quick Reference Card

```tsx
// HEADINGS (Playfair Display)
tw.h1        // 36px - Page titles
tw.h2        // 30px - Sections
tw.h3        // 24px - Cards
tw.h4        // 20px - Subsections

// LOGO (Playfair Display)
tw.logoLarge   // 48px
tw.logoMedium  // 36px
tw.logoSmall   // 24px

// SUBHEADINGS (Lato)
tw.subheading       // 18px - Bold subheadings
tw.subheadingMuted  // 16px - Secondary subheadings

// BODY (Lato)
tw.bodyLarge  // 18px - Emphasized
tw.body       // 16px - Standard
tw.bodyMuted  // 14px - Secondary
tw.caption    // 12px - Helper text
```

---

*For more design system details, see `constants/designSystem.ts`*
