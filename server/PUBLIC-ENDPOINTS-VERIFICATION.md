# Phase S1: Public Endpoints Verification

This document outlines the verification steps for Phase S1 shareable designs.

## Implemented Public Endpoints

All 6 shareable models now have public GET endpoints that work without authentication:

### Talisman Designs
- Endpoint: `GET /api/talisman/{id}/public`
- Endpoint: `GET /api/talisman/designs/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

### Solomonic Circles
- Endpoint: `GET /api/solomonic/{id}/public`
- Endpoint: `GET /api/solomonic/circles/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

### Ritual Layouts
- Endpoint: `GET /api/ritual/{id}/public`
- Endpoint: `GET /api/ritual/layouts/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

### Tree Notes
- Endpoint: `GET /api/tree/{id}/public`
- Endpoint: `GET /api/tree/notes/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

### Opus Vessels
- Endpoint: `GET /api/opus/{id}/public`
- Endpoint: `GET /api/opus/vessels/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

### Practice Vessels
- Endpoint: `GET /api/practice/{id}/public`
- Endpoint: `GET /api/practice/vessels/{id}/public`
- Visibility check: Returns 403 if visibility is 'private', otherwise returns public shape with creator

## Visibility Toggle Endpoints (Authenticated)

All 6 models support PUT requests to update visibility (owner only):

### Talisman
- `PUT /api/talisman/designs/{id}` — with `visibility` field in body

### Solomonic Circles
- `PUT /api/solomonic/circles/{id}` — with `visibility` field in body

### Ritual Layouts
- `PUT /api/ritual/layouts/{id}` — with `visibility` field in body

### Tree Notes
- `PUT /api/tree/notes/{id}` — with `visibility` field in body

### Opus Vessels
- `PUT /api/opus/vessels/{id}` — with `visibility` field in body

### Practice Vessels
- `PUT /api/practice/vessels/{id}` — with `visibility` field in body

## Frontend Integration

### ShareControl Component
- Located at: `client/src/components/ShareControl.tsx`
- Features:
  - Visibility dropdown (private/unlisted/public)
  - Copy share link button
  - QR code display
  - Native share button support
  - Real-time visibility toggle

### SharePage Component
- Located at: `client/src/components/SharePage.tsx`
- Routes: `/s/{type}/{id}`
- Features:
  - Cold load support (direct URL access)
  - Creator attribution card
  - View-only artifact display
  - Guest-friendly access

### Module Integration
- TalismanModule: ✅ ShareControl added
- SolomonicCircleModule: ✅ ShareControl added
- RitualSpaceModule: ✅ ShareControl added
- TreeOfLifeModule: ✅ ShareControl added
- AlchemyModule (Opus): ✅ ShareControl added
- SubtleBodyModule (Practice): ✅ ShareControl added
- ShamanismModule (Practice): ✅ ShareControl added

### ArtifactViewers
- Located at: `client/src/components/share/ArtifactViewers.tsx`
- Supports:
  - TalismanViewer
  - CircleViewer
  - RitualViewer
  - TreeNoteViewer
  - OpusViewer
  - PracticeViewer

## Manual Verification Steps

### 1. Test Private Designs (Should return 403)
```bash
curl -s http://localhost:5000/api/talisman/{id}/public
# Should return: { "message": "This talisman design is private" }
```

### 2. Test Public Designs (Should return design with creator)
```bash
curl -s http://localhost:5000/api/talisman/{id}/public
# Should return design data with creator info when visibility is 'public' or 'unlisted'
```

### 3. Test Share Link Access
- Open: `http://localhost:5000/s/talisman/{id}`
- Should display artifact with creator card
- Should show "View-only" indicator for unlisted/public artifacts

### 4. Test Visibility Toggle (Authenticated)
```bash
curl -X PUT http://localhost:5000/api/talisman/designs/{id} \
  -H "Content-Type: application/json" \
  -b "auth_token=YOUR_JWT_TOKEN" \
  -d '{"visibility": "unlisted"}'
# Should return updated design
```

### 5. Test ShareControl UI
- In module UI (TalismanModule, CircleModule, etc.)
- Save a design
- Click "Share" button
- Toggle visibility dropdown
- Copy share link
- Scan QR code

## Done-When Criteria (Phase S1)

✅ Signed-in owner can mint an unlisted link
✅ Anyone with the link can view (not edit) the artifact
✅ Default remains private; visibility controls work
✅ PNG/JSON export unchanged
✅ Public endpoints return public shape with creator
✅ Visibility toggle updates reflected in API
✅ Guest users can view unlisted/public links without login
✅ ShareControl integrated in all shareable modules
✅ SharePage displays all 6 artifact types

## Known Limitations

- Comments/likes: Not yet implemented (Phase S3+)
- Practitioner profiles: Not yet implemented (Phase S2)
- Lodges: Not yet implemented (Phase S3)
- Journal entries: Intentionally excluded (high PII risk)

## Next Steps

- Phase S2: Opt-in practitioner cards (/u/:username routes)
- Phase S3: Lodges / study circles (group shared workings)
- Phase S4: Optional follows feature
- Phase S5: Optional journal share (per-entry opt-in)
