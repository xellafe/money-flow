# Testing Patterns

**Analysis Date:** 2025-01-29

## Test Framework

**Status:** No testing framework configured

The codebase currently has:
- No test files (*.test.*, *.spec.*)
- No test runner installed (Jest, Vitest, Mocha, etc.)
- No test configuration files (jest.config.*, vitest.config.*, karma.conf.*, etc.)
- No assertion libraries installed

**Current Setup:**
- Build tool: Vite 7.2.4
- Linter: ESLint 9.39.1 (only code quality tool)
- No `test` script in package.json

## Test Infrastructure Gaps

**What's Missing:**
1. **Test Runner** - No framework configured for unit/integration tests
2. **Test Files** - No test suite exists for components, utilities, or hooks
3. **Coverage Tools** - No coverage reporting configured
4. **Mocking Framework** - No mock library for API/module mocking

## Recommendations for Test Implementation

**Suggested Stack:**
- **Runner:** Vitest (aligned with Vite, faster than Jest)
- **Assertion:** Vitest built-in or Assert library
- **Component Testing:** React Testing Library or Vitest + jsdom
- **Mocking:** Vitest mock utilities or MSW for API mocking

**Setup Steps:**
1. Install testing dependencies:
   ```bash
   npm install -D vitest jsdom react-testing-library
   ```

2. Create `vitest.config.js`:
   ```javascript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
     }
   })
   ```

3. Add test script to `package.json`:
   ```json
   "scripts": {
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest --coverage"
   }
   ```

## Current Code Testing Approach

Since no formal tests exist, testing is currently manual through:

**Development Mode:**
- `npm run dev` - Runs Vite dev server with HMR
- Visual testing of React components during development
- Browser console for error checking

**Electron Application:**
- `npm run electron:dev` - Runs Electron with dev server
- Manual testing of IPC communication between main/renderer processes
- Manual testing of Google Drive integration

**Build Verification:**
- `npm run build` - Vite build with minification
- `npm run electron:build` - Electron builder for packaged app

## Test Patterns to Establish

### Unit Test Pattern

For utility functions like those in `src/utils/index.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { formatCurrency, parseDate, parseAmount, categorize } from '../utils';

describe('formatCurrency', () => {
  it('should format positive numbers as currency', () => {
    expect(formatCurrency(100)).toBe('100,00 €');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-50,00 €');
  });

  it('should format decimal amounts correctly', () => {
    expect(formatCurrency(123.456)).toBe('123,46 €');
  });
});

describe('parseAmount', () => {
  it('should parse numeric values', () => {
    expect(parseAmount(100)).toBe(100);
  });

  it('should parse string with Italian comma as decimal', () => {
    expect(parseAmount('100,50')).toBe(100.5);
  });

  it('should return 0 for invalid input', () => {
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
  });
});

describe('categorize', () => {
  const categories = {
    'Cibo': ['SUPERMERCATO', 'RISTORANTE'],
    'Trasporti': ['BENZINA', 'AUTOBUS'],
  };

  it('should categorize by keyword match', () => {
    expect(categorize('SUPERMERCATO COOP', categories)).toBe('Cibo');
  });

  it('should return Altro for no match', () => {
    expect(categorize('RANDOM TEXT', categories)).toBe('Altro');
  });
});
```

### Component Test Pattern

For React components like `src/components/StatCard.jsx`:

```javascript
import { render, screen } from 'react-testing-library';
import { describe, it, expect } from 'vitest';
import StatCard from '../StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('should render label and formatted value', () => {
    render(
      <StatCard 
        label="Total Income" 
        value={1000} 
        icon={TrendingUp}
        type="positive"
      />
    );
    
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('1.000,00 €')).toBeInTheDocument();
  });

  it('should apply correct CSS class for positive type', () => {
    const { container } = render(
      <StatCard 
        label="Expenses" 
        value={-500} 
        type="negative"
      />
    );
    
    expect(container.querySelector('.stat-card.negative')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(
      <StatCard 
        label="Test" 
        value={100} 
        icon={TrendingUp}
      />
    );
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

### Hook Test Pattern

For custom hooks like `src/hooks/useGoogleDrive.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from 'react-testing-library';
import { useGoogleDrive } from '../useGoogleDrive';

describe('useGoogleDrive', () => {
  beforeEach(() => {
    // Mock window.electronAPI
    window.electronAPI = {
      isElectron: true,
      googleDrive: {
        isAuthenticated: vi.fn().mockResolvedValue(false),
        getUserInfo: vi.fn().mockResolvedValue({ success: false }),
        getBackupInfo: vi.fn().mockResolvedValue({ success: false }),
      }
    };
  });

  it('should initialize with isElectron as false if not available', () => {
    delete window.electronAPI;
    
    const { result } = renderHook(() => useGoogleDrive());
    
    expect(result.current.isElectron).toBe(false);
  });

  it('should set authenticated state when auth succeeds', async () => {
    window.electronAPI.googleDrive.isAuthenticated.mockResolvedValue(true);
    
    const { result } = renderHook(() => useGoogleDrive());
    
    await act(async () => {
      await result.current.checkAuthStatus();
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Modal Component Test Pattern

For modals like `src/components/modals/ConfirmModal.jsx`:

```javascript
import { render, screen, fireEvent } from 'react-testing-library';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../modals/ConfirmModal';

describe('ConfirmModal', () => {
  it('should render title and message', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    render(
      <ConfirmModal 
        title="Confirm"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    render(
      <ConfirmModal 
        title="Confirm"
        message="Test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    render(
      <ConfirmModal 
        title="Confirm"
        message="Test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should close when clicking overlay', () => {
    const onCancel = vi.fn();
    
    const { container } = render(
      <ConfirmModal 
        title="Test"
        message="Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    
    fireEvent.click(container.querySelector('.modal-overlay'));
    
    expect(onCancel).toHaveBeenCalled();
  });
});
```

## What Should Be Tested (Priority Order)

**Critical Path (High Priority):**
1. **Utility Functions** - `src/utils/index.js`
   - `formatCurrency()` - Currency formatting logic
   - `parseDate()` - Date parsing from Excel format
   - `parseAmount()` - Amount parsing with Italian locale
   - `categorize()` - Auto-categorization logic
   - `findMatchingCategories()` - Category matching

2. **Data Processing** - `src/App.jsx` (extract to function)
   - `processRowsWithProfile()` - Excel row processing
   - `processImportedTransactions()` - Conflict detection

3. **Custom Hooks** - `src/hooks/useGoogleDrive.js`
   - Authentication state management
   - IPC communication with Electron

**Important Components (Medium Priority):**
4. **Modal Components** - `src/components/modals/`
   - `ImportWizard` - Profile configuration
   - `ConflictResolver` - Decision handling
   - `CategoryManager` - Category CRUD operations
   - `ConfirmModal` - User confirmation

5. **UI Components** - `src/components/`
   - `StatCard` - Rendering with icon and formatting
   - `Toast` - Toast notification display
   - `GoogleSignInButton` - Button state handling

**Lower Priority:**
6. Main App Component - `src/App.jsx` (Complex, consider breaking down)
7. Integration tests for Electron IPC

## Test File Organization

**Proposed Structure:**

```
src/
├── components/
│   ├── StatCard.jsx
│   ├── StatCard.test.jsx          # Co-located test
│   ├── Toast.jsx
│   ├── Toast.test.jsx
│   └── modals/
│       ├── ConfirmModal.jsx
│       ├── ConfirmModal.test.jsx
│       └── ...
├── utils/
│   ├── index.js
│   └── index.test.js              # Co-located test
├── hooks/
│   ├── useGoogleDrive.js
│   └── useGoogleDrive.test.js    # Co-located test
└── App.jsx
    └── App.test.jsx               # Co-located test

__tests__/                         # Optional: integration tests
├── App.integration.test.js
└── importFlow.integration.test.js
```

**Pattern:** Co-locate test files next to source files with `.test.jsx` suffix.

## Coverage Goals

**Target Coverage:**
- **Statements:** 70%+ minimum
- **Branches:** 60%+ minimum
- **Functions:** 80%+ minimum
- **Lines:** 75%+ minimum

**Focus Areas:**
- Critical path utilities (100% target)
- Data processing logic (90% target)
- UI component logic (70% target)

**Generate Coverage Report:**
```bash
npm run test:coverage
```

## Running Tests

**Proposed Commands:**

```bash
npm run test              # Run all tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI dashboard
npm run test:coverage    # Run with coverage report
npm run test -- --grep "pattern"  # Run specific tests
```

## Current Testing Reality

**Today's Testing:**
- Manual testing during development
- Visual regression testing through Vite HMR
- Manual Electron app testing for IPC functionality
- Manual testing of Google Drive integration via OAuth flow

**Risks Without Automated Tests:**
- Utility function regressions not caught
- Breaking changes in data processing logic
- Component rendering failures on state changes
- Modal behavior regressions

---

*Testing analysis: 2025-01-29*
