# QW1: React Router v6.4+ Upgrade

**Goal:** Migrate App.tsx from state-based navigation to React Router v6.4+, enabling share links (`/s/:type/:id`) without breaking existing deep-link functionality.

---

## Current State

**Navigation model:** Fully state-based in App.tsx
- `activeModule` state (ModuleId)
- Module tabs: `divinationTab`, `atelierTab`, `planetaryPanel`, etc.
- Options passed as state props (e.g., `gematriaPrefill`, `entryId`)
- Deep-linking via query params (e.g., `/?divinationTab=tarot`) — handled manually in React

**Entry points:**
- `main.tsx`: AuthProvider → App
- `App.tsx`: Contains all state + renderModule() switch
- No URL-based routing

**Challenges:**
1. Query params are fragile; not a true router
2. No support for clean share URLs (`/s/talisman/:id`)
3. History/back navigation relies on browser history + state sync

---

## Migration Strategy

### Phase 1: Setup React Router (Non-breaking)
1. Install React Router v6.4+ (`npm i react-router-dom`)
2. Wrap App with `<BrowserRouter>` in main.tsx
3. Create route definitions (routes stay the same, just declared)
4. Keep existing state-based nav working (parallel for now)

### Phase 2: Route-based Navigation (Gradual)
1. Create `/s/:type/:id` route for share links (new)
2. Create `/` route for sidebar modules (mirrors current state nav)
3. Migrate sidebar clicks to use React Router links
4. Test that deep-links still work (`/?divinationTab=tarot` → route query params)

### Phase 3: Remove Fallback State (Cleanup)
1. Remove state-based nav fallback
2. All navigation goes through React Router
3. Deep-links work via route paths + query params

---

## Implementation Details

### Step 1: Install Dependencies
```bash
cd client
npm install react-router-dom@latest
npm install --save-dev @types/react-router-dom
```

### Step 2: Create Route Definitions (new file: `client/src/routes.tsx`)
```typescript
import type { RouteObject } from 'react-router-dom';
import App from './App';
import SharePage from './components/SharePage'; // New component
import { ModuleId } from './components/Sidebar';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    // Preserve current SPA behavior for all non-API paths
    errorElement: <App />, // 404 → render App (let it handle routing)
  },
  {
    path: '/s/:type/:id',
    element: <SharePage />, // New: render public share view
  },
];
```

### Step 3: Update main.tsx
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes);

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
```

### Step 4: Create SharePage Component (new file: `client/src/components/SharePage.tsx`)
```typescript
import { useParams } from 'react-router-dom';
import TalismanShareView from './shares/TalismanShareView';
import CircleShareView from './shares/CircleShareView';
// ... other share views

export default function SharePage() {
  const { type, id } = useParams<{ type: string; id: string }>();

  switch (type) {
    case 'talisman':
      return <TalismanShareView designId={id!} />;
    case 'circle':
      return <CircleShareView circleId={id!} />;
    case 'ritual':
      return <RitualShareView layoutId={id!} />;
    case 'tree':
      return <TreeShareView noteId={id!} />;
    case 'opus':
      return <OpusShareView vesselId={id!} />;
    case 'practice':
      return <PracticeShareView vesselId={id!} />;
    default:
      return <div>Share type not found</div>;
  }
}
```

### Step 5: Update App.tsx (Keep state-based nav, wire to React Router)
Keep existing App.tsx mostly unchanged. For sidebar clicks, instead of `setActiveModule()`, call `navigate()`:

```typescript
import { useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();

  const navigateToModule = (module: ModuleId, opts?: AppNavigateOptions) => {
    // Convert opts to query params
    const params = new URLSearchParams();
    if (opts?.divinationTab) params.set('divinationTab', opts.divinationTab);
    if (opts?.atelierTab) params.set('atelierTab', opts.atelierTab);
    // ... add all other opts

    // Navigate via router
    navigate(`/?module=${module}&${params.toString()}`);
  };

  // On mount, parse router location to set state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const module = params.get('module') || 'dashboard';
    setActiveModule(module as ModuleId);
    // ... parse other params and set state
  }, []);

  // ... rest of App.tsx unchanged
}
```

### Step 6: Test Share Links
1. `npm run dev` 
2. Navigate normally via sidebar (should use react-router links now)
3. Test share URL: `http://localhost:5173/s/talisman/660f...` (should cold-load)
4. Test back button
5. Verify deep-links still work: `http://localhost:5173/?module=divination&divinationTab=tarot`

---

## Acceptance Criteria

- ✓ React Router v6.4+ installed
- ✓ Routes defined in `routes.tsx`
- ✓ SharePage component created (placeholder works)
- ✓ App.tsx wired to use `navigate()` for sidebar clicks
- ✓ Deep-links work: `/?module=divination&divinationTab=tarot` → correct module + tab
- ✓ Share URL cold-loads: `http://localhost:5173/s/talisman/:id` → SharePage
- ✓ No regressions: all existing nav still works
- ✓ Back button works correctly

---

## Risk & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Query param parsing breaks | Low | Write unit tests for param parsing logic |
| Mobile nav drawer broken | Low | Test drawer open/close on mobile |
| Deep-links lost during migration | Medium | Document all query param names; write test cases |
| Performance regression | Low | Measure Time to Interactive before & after |

---

## Next Steps After QW1
- QW2: JournalEntry schema audit (can start in parallel)
- QW3: Visibility enum (needs visibility field added)
- QW4: Public user DTO (can start in parallel)
- Phase 51 P2: URL routing unblocked → can write public read routes
