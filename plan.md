# Styli — AI-Powered Fashion Recommendation Platform: Complete Product Document

## Context
The user is designing a greenfield startup product: a web app that uses camera-based computer vision to estimate body/style parameters (body proportions, skin tone, face shape) and recommends personalized clothing styles. The app also manages personal wardrobes, allows adding items via ecommerce URLs or images, integrates with affiliate programs for monetization, and pairs recommendations with existing wardrobe items. This document is the comprehensive product design and architecture, grounded in published research.

---

## A. Executive Summary

**Styli** is an AI-powered personal styling platform that transforms how people discover clothing that genuinely suits them. Users stand in front of their device camera; our CV pipeline estimates their body proportions (FFIT body shape classification, 90% accuracy — Simmons/Istook/Devarajan 2004), face shape (hybrid CNN + 468-point landmark geometry, 90-99% accuracy), and skin tone (ITA angle in CIE L\*a\*b\* mapped to the Monk 10-tone scale, with mandatory user confirmation due to lighting sensitivity). These signals feed a multi-stage recommendation engine that scores clothing across five dimensions: color harmony (validated by Perrett & Sprengelmeyer 2021), body-fit compatibility (FFIT rules), outfit compatibility (CLIP-based, evolving to Cross-Attention Tensor Networks per RecSys 2021), user preference alignment, and wardrobe gap analysis (capsule wardrobe logic per Hsiao CVPR 2018).

Users build a digital wardrobe by pasting ecommerce URLs (metadata extracted via Schema.org JSON-LD + Open Graph) or uploading photos (attributes extracted via CLIP zero-shot classification, upgrading to fine-tuned EfficientNet-B3 on DeepFashion2 in V2). Recommendations incorporate existing wardrobe items so suggestions are practical — "this blazer pairs with 4 items you already own."

Monetization is via affiliate commissions (5-20% per sale) through ShareASale, CJ Affiliate, and Rakuten, with server-to-server click tracking immune to ad blockers. Privacy is taken seriously: no raw camera frames are stored, facial geometry is encrypted at rest with per-user keys (AWS KMS), BIPA-compliant written consent is collected before any biometric processing, and users can view, correct, or delete all derived data.

**Target**: MVP launch in 14 weeks with 2-3 engineers. V2 adds outfit intelligence and multi-network affiliates at week 26. V3 adds virtual try-on, social features, and native mobile at week 42.

---

## B. Product Scope

### In Scope (MVP)
- Camera-based body proportion estimation (relative ratios via MediaPipe Pose, 33 landmarks)
- Face shape classification (MediaPipe FaceMesh 468 landmarks + geometric rules)
- Skin tone estimation (ITA angle → Monk 10-tone scale) with mandatory user confirmation
- Body shape classification (FFIT 9-shape system)
- Color season derivation (12-season system from confirmed skin tone + undertone)
- Personal wardrobe management (CRUD, add via URL or manual entry)
- URL-based metadata extraction (Schema.org JSON-LD → Open Graph → HTML scraping)
- Rule-based recommendation engine (color harmony + body fit + preference scoring)
- Single affiliate network integration (ShareASale)
- Click tracking and basic conversion attribution
- BIPA/GDPR/CCPA consent flow
- Responsive web app (mobile-first)

### In Scope (V2)
- Outfit compatibility model (fine-tuned CLIP on Polyvore Outfits dataset)
- Wardrobe gap analysis (capsule wardrobe logic)
- Image-only wardrobe addition (trained EfficientNet-B3 multi-head classifier)
- Multi-affiliate network support (CJ Affiliate, Rakuten)
- Collaborative filtering (once 10K+ users)
- Outfit calendar with weather integration
- A/B testing framework
- CNN-based face shape model (MobileNetV3-Small fine-tuned)

### In Scope (V3)
- Virtual try-on (DressCode / StableVITON)
- Social features (share outfits, follow profiles, community voting)
- Native mobile apps (React Native or Swift/Kotlin)
- LTK/RewardStyle integration
- 3D body mesh (SPIN/HMR)
- Stylist marketplace (premium tier)
- White-label B2B API
- International expansion (multi-currency, localized affiliates)

### Out of Scope (all phases)
- Physical retail integration / in-store kiosks
- Direct ecommerce (selling clothing ourselves)
- Laundry/care management
- Alterations/tailoring services
- Augmented reality clothing overlay in real-world environments
- Emotion recognition, social scoring, or any prohibited use under EU AI Act

---

## C. User Journeys

### Journey 1: First-Time User — "What suits me?"
1. User lands on Styli → signs up (Google OAuth or email)
2. Onboarding quiz: gender identity, height (for scale calibration), general style preferences, budget range
3. **Consent screen**: Clear explanation of biometric data processing (facial geometry, body proportions). Checkbox + "I Agree" button (BIPA two-step consent). Link to full privacy policy.
4. **Camera scan**: User faces camera. Real-time skeletal overlay guides them ("Step back a bit", "Stand straight, arms slightly away from body"). Quality gate ensures 33 pose landmarks visible with >0.7 confidence.
5. 5 frames captured → sent to CV pipeline → body shape, face shape, skin tone estimated
6. **Confirmation screen**: "We detected Monk tone 4, warm undertone — does this look right?" User confirms or adjusts via visual picker.
7. Style profile generated → recommendations displayed with explanations ("The V-neck flatters your oval face shape", "This emerald green is perfect for your Bright Spring palette")
8. User saves items to wardrobe wish-list or clicks through to merchant site (affiliate link opens in new tab)

### Journey 2: Returning User — "What should I wear today?"
1. User opens app → sees daily outfit suggestion assembled from existing wardrobe items
2. Suggestion includes weather-appropriate choices (V2)
3. User can regenerate with different constraints ("more casual", "meeting today")
4. User marks outfit as "worn" → wear count updates → future suggestions avoid recently-worn items

### Journey 3: Wardrobe Building — "Add a new purchase"
1. User pastes ecommerce URL → system extracts product name, image, brand, price, color, category from Schema.org/OG metadata
2. System fills gaps via CLIP zero-shot classification (color, pattern, material)
3. User confirms/edits extracted attributes
4. Item added to wardrobe → immediately eligible for outfit pairing
5. Deduplication check: perceptual hash prevents adding the same item twice

### Journey 4: Shopping — "I need a new blazer"
1. Wardrobe gap analysis identifies user is missing a neutral blazer
2. Recommendations show affiliate products scored by color harmony, body fit, price range, and compatibility with existing wardrobe
3. User clicks "Buy" → server generates tracking token → redirected to merchant via affiliate link
4. If user doesn't purchase immediately, they save the item to a "Wishlist" in their wardrobe
5. Conversion tracked via server-to-server postback from affiliate network

---

## D. System Architecture (Textual Description)

### High-Level Service Topology

```
                          ┌─────────────────────┐
                          │   CloudFront CDN     │
                          │  (static + images)   │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Next.js 14 Frontend  │
                          │  (Vercel / ECS)       │
                          │  React 18 + TypeScript│
                          └──────────┬───────────┘
                                     │ HTTPS
                          ┌──────────▼───────────┐
                          │  API Gateway / ALB    │
                          │  (rate limit, auth)   │
                          └──────────┬───────────┘
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
          ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
          │ Core API     │  │ CV Pipeline  │  │ Affiliate    │
          │ (FastAPI)    │  │ Service      │  │ Service      │
          │ Python 3.12  │  │ (FastAPI)    │  │ (FastAPI)    │
          │              │  │ GPU-backed   │  │              │
          └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                 │                 │                  │
    ┌────────────┼─────────────────┼──────────────────┼──────┐
    │            ▼                 ▼                  ▼      │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
    │  │ PostgreSQL 16 │  │ Redis 7      │  │ S3           │  │
    │  │ (RDS)         │  │ (ElastiCache)│  │ (images)     │  │
    │  └──────────────┘  └──────────────┘  └──────────────┘  │
    │            │                                            │
    │  ┌──────────────┐  ┌──────────────┐                    │
    │  │ Pinecone     │  │ Celery +     │                    │
    │  │ (vectors)    │  │ Redis/SQS    │                    │
    │  └──────────────┘  │ (task queue) │                    │
    │                    └──────────────┘                    │
    └────────────────────────────────────────────────────────┘
```

### Service Boundaries

| Service | Responsibility | Scaling |
|---------|---------------|---------|
| **Core API** (FastAPI) | Auth, user profiles, wardrobe CRUD, recommendation orchestration, outfit management. REST + WebSocket for scan feedback | Horizontal behind ALB |
| **CV Pipeline Service** (FastAPI, GPU) | Frame ingestion, MediaPipe Pose (33 landmarks), FaceMesh (468 landmarks), skin tone extraction, FFIT classification, face shape classification. Returns structured `BodyProfile` JSON. Stateless. | Horizontal behind queue, GPU instances |
| **Recommendation Engine** (FastAPI) | Multi-stage pipeline: candidate generation → filtering → scoring → ranking → diversification. Color harmony, body fit, outfit compatibility, wardrobe gap analysis | Horizontal, CPU-only |
| **Affiliate Service** (FastAPI) | Product catalog ingestion from affiliate networks, URL metadata extraction, referral link generation, click redirect tracking, commission reconciliation via webhook/polling | Horizontal, CPU-only |
| **Background Worker** (Celery) | Async image processing, catalog refresh (daily), commission reconciliation (4-hourly), batch CLIP embedding generation, recommendation pre-computation | Scales with queue depth |

### Data Flow: Camera Scan → Recommendations

1. Browser captures frame via `getUserMedia` (720p, front-facing)
2. Client-side `@mediapipe/tasks-vision` WASM runs `PoseLandmarker` at 15fps for real-time pose overlay (guides user positioning)
3. Quality gate passes → client sends 5 best frames (JPEG, ~200KB each) to CV Pipeline Service
4. **CV Pipeline**:
   - MediaPipe Pose (`model_complexity=2`): 33 landmarks → averaged across 5 frames weighted by visibility → relative body proportions computed
   - MediaPipe FaceMesh (`refine_landmarks=True`): 468 landmarks → face length/width, forehead/jaw/cheekbone widths, jaw angle → geometric face shape classification
   - Skin patches extracted from forehead, left cheek, right cheek → BGR→L\*a\*b\* conversion → ITA angle → Monk tone mapping
   - FFIT rules applied to proportions → body shape classification with confidence score
   - Returns `BodyProfile` JSON
5. Core API stores `BodyProfile`, presents to user for confirmation (skin tone, undertone)
6. User confirms → `StyleProfile` generated (body shape + face shape + color season + preferences)
7. `StyleProfile` sent to Recommendation Engine → multi-stage pipeline executes → scored recommendations returned
8. Frontend displays recommendations with explanations

---

## E. Data Model and Schemas

### PostgreSQL Schema (SQLAlchemy 2.0 / Alembic)

```sql
-- Core user identity
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 VARCHAR(255) UNIQUE NOT NULL,
    password_hash         VARCHAR(255),
    oauth_provider        VARCHAR(50),
    oauth_sub             VARCHAR(255),
    display_name          VARCHAR(100) NOT NULL,
    gender_identity       VARCHAR(20),        -- 'female','male','non-binary','prefer-not-to-say'
    date_of_birth         DATE,
    height_cm             DECIMAL(5,1),       -- user-provided (scale calibration)
    weight_kg             DECIMAL(5,1),       -- optional
    consent_biometric     BOOLEAN NOT NULL DEFAULT FALSE,
    consent_biometric_at  TIMESTAMPTZ,
    consent_version       VARCHAR(10),
    preferred_locale      VARCHAR(10) DEFAULT 'en-US',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ         -- soft delete for GDPR
);

-- One active body profile per user, history retained for re-scans
CREATE TABLE body_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    pose_landmarks          JSONB,            -- 33 MediaPipe points (encrypted at rest)
    -- Computed proportions (all ratios, unitless)
    shoulder_width_ratio    DECIMAL(4,3),     -- shoulder / hip
    hip_width_ratio         DECIMAL(4,3),
    torso_leg_ratio         DECIMAL(4,3),
    waist_hip_ratio         DECIMAL(4,3),
    bust_waist_ratio        DECIMAL(4,3),
    inseam_height_ratio     DECIMAL(4,3),
    arm_span_height_ratio   DECIMAL(4,3),
    -- FFIT body shape
    body_shape              VARCHAR(30),      -- 'hourglass','pear','apple','rectangle',
                                              -- 'inverted_triangle','spoon','diamond','oval','athletic'
    body_shape_confidence   DECIMAL(3,2),
    -- Face
    face_shape              VARCHAR(20),      -- 'oval','round','square','heart','oblong','diamond','triangle'
    face_shape_confidence   DECIMAL(3,2),
    face_landmarks          JSONB,            -- 468 FaceMesh points (encrypted at rest via KMS)
    -- Skin tone
    skin_ita_angle          DECIMAL(5,2),
    skin_monk_tone          INTEGER CHECK (skin_monk_tone BETWEEN 1 AND 10),
    skin_tone_confirmed     BOOLEAN DEFAULT FALSE,
    skin_undertone          VARCHAR(10),      -- 'warm','cool','neutral' (user-selected)
    color_season            VARCHAR(20),      -- 'bright_spring','soft_summer', etc.
    -- Quality metadata
    scan_quality_score      DECIMAL(3,2),
    source_frames           INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-editable style preferences (separate from computed profile)
CREATE TABLE style_preferences (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_styles  JSONB,              -- ['minimalist','classic','streetwear',...]
    avoided_styles    JSONB,
    preferred_colors  JSONB,
    avoided_colors    JSONB,
    budget_tier       VARCHAR(20),        -- 'budget','mid','premium','luxury'
    budget_min_usd    INTEGER,
    budget_max_usd    INTEGER,
    preferred_brands  JSONB,
    avoided_brands    JSONB,
    size_top          VARCHAR(10),
    size_bottom       VARCHAR(10),
    size_shoe         VARCHAR(10),
    shoe_width        VARCHAR(5),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wardrobe items (user's actual clothing)
CREATE TABLE wardrobe_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category                VARCHAR(50) NOT NULL,   -- 'tops','bottoms','dresses','outerwear','shoes','accessories','bags'
    subcategory             VARCHAR(50),
    primary_color           VARCHAR(30),
    primary_color_hex       VARCHAR(7),
    secondary_color         VARCHAR(30),
    secondary_color_hex     VARCHAR(7),
    pattern                 VARCHAR(30),            -- 'solid','stripes','plaid','floral','polka_dot','geometric'
    material                VARCHAR(50),
    formality_level         INTEGER CHECK (formality_level BETWEEN 1 AND 5),
    season_tags             JSONB,
    occasion_tags           JSONB,
    brand                   VARCHAR(100),
    product_name            VARCHAR(255),
    product_url             TEXT,
    price_usd               DECIMAL(10,2),
    image_urls              JSONB,                  -- S3 URLs
    thumbnail_url           TEXT,
    extraction_source       VARCHAR(20),            -- 'url_og','url_schema','url_scrape','image_cnn','manual'
    extraction_confidence   DECIMAL(3,2),
    last_worn_at            TIMESTAMPTZ,
    wear_count              INTEGER DEFAULT 0,
    is_favorite             BOOLEAN DEFAULT FALSE,
    fingerprint             VARCHAR(64),            -- perceptual hash for dedup
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

-- Outfits (user-created or AI-generated)
CREATE TABLE outfits (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                  VARCHAR(255),
    source                VARCHAR(20) NOT NULL,   -- 'ai_generated','user_created','ai_suggested'
    occasion              VARCHAR(50),
    season                VARCHAR(20),
    formality_level       INTEGER,
    overall_score         DECIMAL(3,2),
    color_harmony_score   DECIMAL(3,2),
    body_fit_score        DECIMAL(3,2),
    is_saved              BOOLEAN DEFAULT FALSE,
    worn_count            INTEGER DEFAULT 0,
    last_worn_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE outfit_items (
    outfit_id        UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
    wardrobe_item_id UUID NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
    slot             VARCHAR(30) NOT NULL,    -- 'top','bottom','shoes','outerwear','accessory_1','bag'
    PRIMARY KEY (outfit_id, slot)
);

-- Affiliate product catalog (ingested from networks)
CREATE TABLE affiliate_products (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id           VARCHAR(255) NOT NULL,
    affiliate_network     VARCHAR(50) NOT NULL,
    merchant_id           VARCHAR(100) NOT NULL,
    merchant_name         VARCHAR(255),
    product_name          VARCHAR(500) NOT NULL,
    product_url           TEXT NOT NULL,
    image_url             TEXT,
    thumbnail_url         TEXT,
    price_usd             DECIMAL(10,2),
    sale_price_usd        DECIMAL(10,2),
    currency              VARCHAR(3) DEFAULT 'USD',
    in_stock              BOOLEAN DEFAULT TRUE,
    category              VARCHAR(50),
    subcategory           VARCHAR(50),
    primary_color         VARCHAR(30),
    primary_color_hex     VARCHAR(7),
    pattern               VARCHAR(30),
    material              VARCHAR(50),
    formality_level       INTEGER,
    season_tags           JSONB,
    occasion_tags         JSONB,
    brand                 VARCHAR(100),
    gender_target         VARCHAR(20),
    sizes_available       JSONB,
    embedding_vector_id   VARCHAR(100),
    commission_rate       DECIMAL(5,4),
    commission_type       VARCHAR(20),
    last_synced_at        TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (affiliate_network, external_id)
);

-- Click and conversion tracking
CREATE TABLE affiliate_clicks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id),
    product_id        UUID NOT NULL REFERENCES affiliate_products(id),
    recommendation_id UUID,
    click_context     VARCHAR(50),          -- 'recommendation','wardrobe_gap','similar_item','outfit_complete'
    affiliate_url     TEXT NOT NULL,
    tracking_token    VARCHAR(100) UNIQUE NOT NULL,
    clicked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted         BOOLEAN DEFAULT FALSE,
    order_id          VARCHAR(255),
    order_amount_usd  DECIMAL(10,2),
    commission_usd    DECIMAL(10,2),
    conversion_at     TIMESTAMPTZ,
    reconciled        BOOLEAN DEFAULT FALSE,
    reconciled_at     TIMESTAMPTZ
);

-- Recommendation audit log (for analytics + model training)
CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    rec_type        VARCHAR(30) NOT NULL,
    input_context   JSONB,
    items           JSONB,                  -- [{product_id, score, rank, reason}]
    model_version   VARCHAR(50),
    latency_ms      INTEGER,
    user_action     VARCHAR(20),            -- 'viewed','clicked','saved','dismissed'
    feedback_score  INTEGER,                -- 1-5 explicit rating
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Redis Data Structures
```
session:{session_id}              → JSON user context (TTL 24h)
ratelimit:cv:{user_id}            → counter (5 scans/hour)
ratelimit:api:{user_id}           → counter (100 req/min)
scan:{scan_id}:status             → 'processing'|'pose_done'|'face_done'|'complete'|'error'
scan:{scan_id}:result             → JSON BodyProfile (TTL 1h, then persisted to PG)
rec:{user_id}:{context_hash}      → JSON recommendations (TTL 6h)
product:{product_id}              → JSON product summary (TTL 1h)
```

### Pinecone Vector Index
```
Index: "styli-products"
Dimension: 512 (CLIP ViT-B/32 embeddings)
Metric: cosine
Namespace: by affiliate_network
Filterable metadata: category, subcategory, primary_color, formality_level,
                     price_usd, gender_target, in_stock, season_tags
```

---

## F. AI/CV Pipeline Design

### Step 0: Client-Side Pre-processing
- **Library**: `@mediapipe/tasks-vision` WASM (~4MB)
- Camera via `navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })`
- `PoseLandmarker` runs at 15fps for real-time skeletal overlay (guides user to stand correctly)
- Quality gate: all 33 landmarks visibility > 0.7, face detected, shoulder-to-shoulder > 15% of frame width
- Captures 5 frames at ~1s intervals → sends as JPEG (quality 85, ~150-200KB each) to CV Pipeline Service

### Step 1: Pose Estimation (Server)
- **Library**: `mediapipe 0.10.x` Python, `static_image_mode=True, model_complexity=2`
- Process all 5 frames, extract 33 landmarks per frame
- Average landmarks across frames weighted by per-landmark visibility score
- Compute proportions (all as unitless ratios normalized by estimated height):
  - `shoulder_width`: landmarks 11↔12
  - `hip_width`: landmarks 23↔24
  - `torso_length`: avg(11→23, 12→24)
  - `leg_length`: avg(23→27→31, 24→28→32)
  - `arm_length`: avg(11→13→15, 12→14→16)
- If user provided `height_cm`, multiply ratios to get absolute cm measurements

### Step 2: FFIT Body Shape Classification
- **Method**: Rule-based classifier on computed ratios per Simmons/Istook/Devarajan 2004
- Key decision boundaries based on bust-hip difference, shoulder-hip ratio, waist definition
- 9 shape categories: hourglass, top hourglass, bottom hourglass, pear, apple, rectangle, inverted triangle, spoon, diamond
- Returns shape + confidence score (0-1)

### Step 3: Face Shape Classification
- **Library**: MediaPipe FaceMesh (468 landmarks, `refine_landmarks=True`)
- Geometric ratios computed:
  - Face length (landmark 10→152) / face width (234↔454)
  - Forehead width (70↔300) vs jaw width (172↔397) vs cheekbone width (234↔454)
  - Jaw angle at landmarks 172-152-397
- Decision tree: ratio > 1.3 + equal forehead/jaw → oblong; ratio < 1.1 + wide jaw angle → round; etc.
- 7 categories: oval, round, square, heart, oblong, diamond, triangle
- **V2 upgrade**: MobileNetV3-Small fine-tuned on ~10K labeled images → 95%+ accuracy

### Step 4: Skin Tone Extraction
- Extract 3 skin patches (forehead, left cheek, right cheek) using FaceMesh landmark ROIs
- Convert BGR → CIE L\*a\*b\* → compute ITA angle = arctan2(L\* - 50, b\*)
- Map ITA to Monk 10-tone scale via empirical boundaries
- **Always flag `needs_confirmation = true`** — lighting variability makes this unreliable without user input
- Research basis: ITA method per Jung et al. 2024; Monk scale preferred over Fitzpatrick per Nature npj Digital Medicine 2025

### Step 5: Color Season Derivation
- Requires confirmed Monk tone + user-selected undertone (warm/cool/neutral)
- Maps to 12-season system: e.g., Monk 4-5 + warm → Bright Spring; Monk 8-10 + cool → Deep Winter
- Season determines recommended color palette (set of hex codes) and avoid palette
- **Evidence level**: Partial — Perrett & Sprengelmeyer 2021 validates warm/cool matching empirically (77% observer agreement). Full 12-season system lacks comprehensive peer review but has partial empirical support. Clearly communicated to users as "guidance" not "rules."

### Step 6: Style Profile Assembly
Unified `StyleProfile` combining all signals:
- body_shape, face_shape, color_season, monk_tone, undertone
- proportions dict (all computed ratios)
- recommended_silhouettes (derived from body shape)
- recommended_necklines (derived from face shape)
- recommended_color_palette + avoid_color_palette (from season)
- user_preferences (from style_preferences table)

---

## G. Recommendation Engine Design

### Multi-Stage Pipeline

```
Stage 1: Candidate Generation (→ 200-500 items)
    ├── Path A: Vector similarity via Pinecone (CLIP embeddings, top 200)
    ├── Path B: Attribute matching via PostgreSQL (season colors, formality, budget, size)
    └── Path C: Collaborative filtering [V2] (ALS on click/save data)
         ↓ merge + deduplicate
Stage 2: Hard Filters (→ 100-200)
    - Remove: out of stock, wrong size, avoided brands/styles, already in wardrobe (fingerprint), over budget, duplicate merchants (keep highest commission)
         ↓
Stage 3: Multi-Signal Scoring (5 dimensions, each 0.0-1.0)
    ├── Color Harmony Score (0.25 weight)
    │   Delta E 2000 distance to nearest season palette color. Penalty if near avoid palette.
    ├── Body Fit Score (0.25 weight)
    │   FFIT rules: preferred/avoided silhouettes per body shape. Neckline bonus from face shape.
    ├── Outfit Compatibility Score (0.20 weight)
    │   MVP: average pairwise CLIP cosine similarity with existing outfit items.
    │   V2: Cross-Attention Tensor Network (RecSys 2021).
    ├── Preference Alignment Score (0.20 weight)
    │   Brand affinity, occasion match, price sweet-spot bonus.
    └── Commission Score (0.10 weight)
        Normalized commission rate. Kept low to preserve user trust.
         ↓
Stage 4: Ranking + Re-ranking (→ top 30)
    final_score = Σ(score_i × weight_i)
         ↓
Stage 5: Diversification + Explanation (→ 10-15 shown)
    - Max 4 items from same subcategory in top 10
    - Max 2 items from same brand in top 10
    - At least 1 item from each price tercile
    - Per-item explanation template: "Great match for your {season} palette" / "The A-line flatters your {shape}"
```

### Wardrobe Gap Analysis
- Compare user's wardrobe against capsule wardrobe targets (e.g., 8 tops, 5 bottoms, 4 shoes minimum)
- Check color coverage: identify missing neutrals (black, white, navy, gray, beige) and missing season colors
- Check subcategory coverage: e.g., has 3 t-shirts but no blouses
- Prioritize gaps: empty category = high priority; below minimum = medium
- Gap recommendations use same scoring pipeline but constrain candidates to gap category/attributes

### Outfit Generation
- Slot-based: each outfit has slots (top, bottom, shoes, outerwear, accessory)
- Fill slots greedily: highest compatibility pair for top+bottom, then add shoes maximizing 3-way compatibility
- Constraint satisfaction: occasion consistency, season consistency, formality level within ±1 across items
- V2: Transformer-based generation (POG architecture, Alibaba KDD 2019) for more coherent multi-item outfits

---

## H. Wardrobe Management and Pairing Logic

### Item Addition Pipeline
1. **URL-based**: Fetch page → extract Schema.org JSON-LD (tier 1) → Open Graph (tier 2) → HTML scraping (tier 3) → download product image → compute perceptual hash → check dedup → CLIP zero-shot classification for missing attributes → merge metadata + CNN attrs → upload image to S3 → save to DB → generate CLIP embedding → upsert to Pinecone
2. **Image upload**: User uploads photo → compute perceptual hash → dedup check → CLIP zero-shot classification (category, color, pattern, material) → user confirms/edits → save to DB + Pinecone
3. **Manual entry**: Form-based with autocomplete on brand, category, color

### Metadata Extraction from URLs
- **Tier 1 (Schema.org JSON-LD)**: Parse `<script type="application/ld+json">` for `@type: "Product"`. Extracts: name, brand, price, image, color, material, category. ~40% of ecommerce sites support this.
- **Tier 2 (Open Graph)**: `og:title`, `og:image`, `product:price:amount`. Less structured but widely supported.
- **Tier 3 (HTML scraping)**: Fall back to `<h1>` text, largest product image, CSS selector heuristics. Site-specific adapters for major retailers.

### Attribute Extraction from Images
- **MVP**: CLIP zero-shot classification (OpenCLIP ViT-B/32, laion2b). Accuracy 75-85%. No training needed.
- **V2**: Fine-tuned EfficientNet-B3 multi-head on DeepFashion2. Heads: category (13 classes, ~93%), color (20 bins, ~88%), pattern (8 classes, ~82%), material (10 classes, ~75%).

### Deduplication
- Perceptual hash (pHash) computed on product image → stored as `fingerprint`
- On add: query `SELECT id FROM wardrobe_items WHERE user_id = :uid AND fingerprint = :hash`
- Hamming distance < 5 = likely duplicate → prompt user "Is this the same as {existing item}?"

### Pairing Logic with Recommendations
- When generating recommendations, load user's full wardrobe CLIP embeddings
- For "complete the outfit" recs: compute compatibility between candidate and each existing item in the partial outfit
- Surface "pairs with N items in your wardrobe" count as a recommendation signal
- Avoid recommending items too similar to already-owned items (cosine similarity > 0.92 = too similar)

---

## I. Ecommerce Affiliate Integration

### Architecture
- **Adapter pattern**: Abstract `AffiliateAdapter` base class with implementations per network
- Each adapter handles: product feed fetching, affiliate URL generation, transaction/conversion fetching
- Unified ingestion pipeline normalizes all products to common schema, extracts missing attributes via CLIP, generates embeddings

### Supported Networks (phased)
| Network | Phase | Commission Range | Strengths |
|---------|-------|-----------------|-----------|
| ShareASale | MVP | 5-20% | 15.2K merchants, good for mid-market fashion |
| CJ Affiliate | V2 | 5-15% | 3K merchants, premium brands |
| Rakuten | V2 | 5-20% | Luxury + fashion focus |
| LTK/RewardStyle | V3 | 5-20% | Influencer-focused, high-fashion |

### Click Tracking Flow (Server-to-Server)
1. User clicks "Buy" → Frontend `POST /api/affiliate/click { product_id, context }`
2. Backend generates `tracking_token` (UUID), inserts `affiliate_clicks` row
3. Backend calls `adapter.generate_affiliate_url(product_url, tracking_token)` → returns redirect URL
4. Frontend opens redirect URL in new tab (302 → merchant)
5. **Conversion**: Affiliate network calls postback URL `GET /api/affiliate/postback?token={tracking_token}&order_id=...&amount=...` OR Celery job polls `fetch_transactions()` every 4 hours
6. Update `affiliate_clicks` row with conversion data

### Product Catalog Refresh
- Celery beat job: daily at 2 AM UTC
- Per adapter: paginate product feed → normalize → extract missing attributes via CLIP → generate embeddings → upsert PG + Pinecone
- Mark products not seen in sync as potentially out-of-stock
- Circuit breaker per adapter: if API fails 3x consecutively, back off and alert

### Monetization Model
- **Revenue**: Affiliate commission on completed purchases (typically 5-20% of sale price)
- **Average commission estimate**: ~8% on $75 average order = $6 per conversion
- **Target**: 3-5% of recommended items clicked, 2-4% of clicks convert
- **Unit economics at 10K MAU**: ~500 clicks/month × 3% conversion × $6 = ~$90/month (early stage). Scales with catalog quality and user trust.
- **V3**: Premium subscription tier ($9.99/month) for advanced features (unlimited scans, stylist access, outfit calendar)

---

## J. Privacy, Ethics, and Compliance

### Biometric Data Handling

| Regulation | Requirement | Our Implementation |
|-----------|------------|-------------------|
| **BIPA (Illinois)** | Written consent before collecting facial geometry. $5K/violation private right of action. | Two-step consent: checkbox + "I Agree" button. Consent timestamp, IP, version stored. No raw face images stored. Annual legal review. |
| **GDPR** | Explicit consent for special category data. Right to erasure. DPO if at scale. | Consent captured before scan. CASCADE DELETE on user deletion wipes all data. Face/pose landmarks encrypted at rest (AES-256-GCM, per-user key via AWS KMS). 30-day audit log retention. |
| **CCPA/CPRA** | Disclosure of biometric data collection. Right to know, delete, opt-out of sale. | Privacy policy discloses all data categories. "Do Not Sell" toggle. Deletion endpoint purges all user data. |
| **EU AI Act** | Prohibits biometric categorization by race/religion. Transparency requirements. Full compliance by August 2026. | No race/ethnicity inference. Skin tone used exclusively for color matching. Users can view and correct all derived data. No emotion recognition. |

### Key Design Decisions
- **Raw camera frames**: NEVER stored. Processed in-memory, discarded after pipeline completes.
- **Face landmarks (JSONB)**: Encrypted at rest (AES-256-GCM, per-user key via AWS KMS). Deletable on demand.
- **Derived classifications** (body_shape, face_shape, color_season): Retained as non-biometric profile data (geometric categories, not raw biometric templates).
- **Consent withdrawal**: Soft-delete body_profiles. Hard-delete face_landmarks and pose_landmarks JSONB fields. Retain aggregated classifications.
- **Data residency**: EU users' data stored in eu-west-1; US users in us-east-1 (configurable).

### Bias and Fairness Mitigation
- **Skin tone**: Use Monk 10-tone scale (more inclusive than Fitzpatrick's 6, per Google/Monk research). Always require user confirmation — never auto-assign.
- **Body diversity**: FFIT system trained on limited demographics (253 North Carolina females). Supplement with FFIT Plus Size extension (University of Oregon). Test accuracy across body sizes and demographics before launch.
- **Lighting bias**: Document that skin tone estimation degrades under non-standard lighting (error increases 2-3x per Efficient Skin Detection research). Quality gate rejects poor-lighting frames.
- **Gender-inclusive design**: Gender identity is self-reported, optional, and separate from recommendation logic. Recommendations can be filtered by any gender category or "show all."
- **Regular audits**: Quarterly accuracy review by demographic segment (Gender Shades methodology per Buolamwini & Gebru 2018). Publish fairness metrics.

### Transparency
- Users see: "Here's what we detected — does this look right?"
- Users can: view all stored data, correct any attribute, delete their profile and all biometric data, export their data (GDPR portability)
- Confidence scores displayed: "We're 87% confident in this body shape classification"

---

## K. MVP and Phased Roadmap

### MVP (V1) — "Prove the core loop works"
**Timeline**: 14 weeks | **Team**: 2 full-stack + 1 ML engineer

| Weeks | Milestone |
|-------|-----------|
| 1-2 | Project scaffolding: Next.js 14 + FastAPI + PostgreSQL schema + Supabase Auth + CI/CD |
| 3-4 | Camera capture UI, client-side MediaPipe pose overlay, frame quality gate |
| 5-6 | Server CV pipeline: pose estimation, FFIT body shape, face shape (geometric), skin tone (ITA+Monk) |
| 7-8 | Style profile generation, user confirmation/correction UI for skin tone + undertone |
| 9-10 | Wardrobe management: manual add, URL extraction (OG + schema.org), CLIP zero-shot attributes |
| 11-12 | Recommendation engine V1: attribute matching + color harmony + body fit scoring. Display with explanations |
| 13-14 | ShareASale affiliate integration, click tracking, consent flow, privacy policy, beta launch |

### V2 — "Intelligent recommendations + monetization"
**Timeline**: 12 weeks after MVP | **Team**: +1 ML engineer, +1 frontend (total 4-5)

- Outfit compatibility model (CLIP fine-tuned on Polyvore Outfits)
- Wardrobe gap analysis (capsule wardrobe logic)
- Image-only wardrobe addition (EfficientNet-B3 on DeepFashion2)
- Multi-network affiliates (CJ + Rakuten)
- Outfit calendar + weather integration
- A/B testing framework
- CNN face shape model
- Push notifications ("Your daily outfit is ready")

### V3 — "Platform + social + scale"
**Timeline**: 16 weeks after V2 | **Team**: 6-8 engineers + 1 designer

- Virtual try-on (DressCode / StableVITON)
- Social features (share outfits, follow profiles)
- Native mobile apps
- LTK/RewardStyle integration
- 3D body mesh (SPIN/HMR)
- Premium subscription tier ($9.99/month)
- Stylist marketplace
- White-label B2B API
- International (multi-currency, i18n)

---

## L. Metrics and Experimentation Plan

### KPIs by Category

**Recommendation Quality**
| Metric | Definition | Target (MVP) | Target (V2) |
|--------|-----------|-------------|-------------|
| Click-through rate (CTR) | Clicks on recommended items / impressions | 3-5% | 8-12% |
| Save rate | Items saved to wardrobe / impressions | 2-3% | 5-8% |
| Outfit acceptance rate | AI outfits saved or worn / AI outfits generated | 15-20% | 30-40% |
| Recommendation diversity | Unique categories in top-10 / 5 target categories | >0.6 | >0.8 |
| Explanation helpfulness | Thumbs-up on explanations / total shown | >50% | >65% |

**Conversion & Revenue**
| Metric | Definition | Target |
|--------|-----------|--------|
| Click-to-purchase rate | Purchases / affiliate clicks | 2-4% |
| Revenue per user per month (RPUPM) | Total affiliate commission / MAU | $0.50 (MVP) → $2.00 (V2) |
| Average order value (AOV) | Total order value / number of orders | $60-80 |
| Commission rate optimization | Weighted avg commission across sales | >8% |

**Retention & Engagement**
| Metric | Definition | Target |
|--------|-----------|--------|
| Day-7 retention | Users active 7 days after signup / signups | >25% |
| Day-30 retention | Users active 30 days / signups | >15% |
| DAU/MAU ratio | Daily active / monthly active | >15% |
| Wardrobe items per user | Avg items added within 30 days | >5 |
| Scans completed | % of signups who complete camera scan | >40% |
| Return visit with scan | Users who re-scan after 30+ days | >10% |

**Wardrobe Utilization**
| Metric | Definition | Target |
|--------|-----------|--------|
| Wardrobe coverage | Categories with ≥1 item / total categories | >60% within 60 days |
| Item utilization | Items used in ≥1 outfit / total items | >70% |
| Capsule completeness | User meets capsule minimum counts / total categories | 40% of users by V2 |

### A/B Testing Plan

| Test | Hypothesis | Metric | Phase |
|------|-----------|--------|-------|
| Commission weight (0.10 vs 0.15 vs 0.05) | Higher commission weight increases revenue without hurting CTR | CTR, RPUPM, user satisfaction | MVP |
| Explanation style (template vs LLM-generated) | Richer explanations increase save rate | Save rate, time on recommendation page | MVP |
| Skin tone confirmation UX (picker vs swatches vs skip) | Swatch comparison increases confirmation rate + accuracy | Confirmation rate, subsequent satisfaction score | MVP |
| Onboarding depth (quick 3-question vs detailed 10-question) | Longer onboarding improves first-session recommendations | D7 retention, first-session CTR | V2 |
| Outfit vs item recommendations (outfit-first vs item-first) | Outfit context increases purchase intent | Click-to-purchase, items per cart | V2 |
| Wardrobe gap prompts (proactive vs on-demand) | Proactive gap notifications increase wardrobe adds + purchases | Items added per week, affiliate clicks | V2 |

### Offline Evaluation (Before Online A/B)
- **Outfit compatibility**: AUC on held-out Polyvore Outfits test set (baseline: random 0.5, target: >0.75)
- **Color harmony**: Perceptual study with 50 users rating AI-suggested vs random color pairings (target: >70% preference for AI)
- **Body fit rules**: Expert stylist review of FFIT rule mappings (target: >85% agreement)
- **Attribute extraction**: Accuracy on DeepFashion2 test set (target: category >90%, color >85%, pattern >80%)

---

## M. Risks and Mitigations

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Camera quality varies wildly on mobile | High | Medium | Quality gate with landmark visibility thresholds. User instructions ("good lighting, stand 6ft from camera"). Retry with specific feedback. |
| Skin tone inaccurate under artificial lighting | High | High | **Always** require user confirmation. Show Monk scale picker. Never auto-assign. White-balance normalization heuristic in V2. |
| FFIT body shape accuracy limited for diverse body types | Medium | Medium | Supplement with Plus Size FFIT extension. Allow user override. Track accuracy by demographic. |
| Scale ambiguity without depth sensor | High | Medium | Require user to provide height. Use as baseline for all proportion-to-cm conversions. Note circumference measurements are unreliable. |
| CLIP zero-shot attribute extraction accuracy insufficient | Medium | Low | 75-85% is acceptable for MVP with user confirmation. Upgrade to fine-tuned model in V2. |

### Legal/Compliance Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| BIPA class-action lawsuit | Medium | Critical | Written two-step consent. No raw biometric storage. Per-user encryption. Annual legal review. Geo-block Illinois if needed as last resort. |
| GDPR enforcement action | Low | High | Explicit consent. Right to erasure cascade. Data residency per region. DPA in place. |
| EU AI Act non-compliance | Low | High | No prohibited use cases. Transparency by design. No race/emotion inference. Compliance review by August 2026. |

### Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low wardrobe adoption (users don't add items) | High | High | "Quick start" flow: ask top brands/budget, recommend from affiliate catalog first. Gamification ("add 5 items to unlock full analysis"). One-click URL paste. |
| Recommendation quality with small catalog | Medium | High | Start with fashion-focused ShareASale merchants. Manual curation of initial 500 high-quality products. Quality > quantity for MVP. |
| User trust in AI styling advice | Medium | High | Cite evidence ("based on color science research"). Show confidence levels. Allow manual overrides. Let users rate and retrain. |
| Affiliate network API instability | Medium | Medium | Adapter pattern isolates changes. Circuit breaker per adapter. Cached catalog serves stale for 24h. |
| Low conversion from recommendations to purchases | High | High | Focus on wardrobe utility first (users stay for wardrobe management, purchase later). Track "save for later" as intermediate conversion. |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Affiliate commission rates decline | Medium | Medium | Diversify across networks. Build direct brand partnerships at scale. Premium subscription as secondary revenue. |
| Competitor with more data (Stitch Fix, Amazon) | High | Medium | Differentiate on transparency (show your data), privacy-first approach, open science (publish methodology). Target underserved segments. |

---

## N. Open Questions Requiring Founder Decisions

1. **Gender scope for MVP**: Support all gender identities from day 1, or focus on one to build initial training data/rules? (Recommendation: support all, but be transparent where data is limited)
2. **Geography for launch**: US-only (simpler affiliate integration, BIPA focus) or include EU (GDPR compliance needed from day 1)?
3. **Skin tone confirmation UX**: Is a Monk-scale picker sufficient, or should we add a photo-comparison swatch system?
4. **Commission weight ethics**: How aggressively should we weight commission in ranking? (Our proposal: 10%, never more than 15%, always disclose "sponsored" items)
5. **Wardrobe data portability**: Should users be able to export their wardrobe to other apps? (GDPR requires data portability for personal data)
6. **Body measurement accuracy claims**: How do we communicate accuracy? (Recommendation: never claim "accurate measurements" — instead say "style guidance based on proportional analysis")
7. **Premium tier timing**: Launch paid tier in V2 or V3? What features gate it?
8. **Open-source strategy**: Publish FFIT body shape classifier + skin tone tooling as open source for trust/community?

---

## O. References Table

| # | Title | Year | Source | Why It Matters |
|---|-------|------|--------|---------------|
| 1 | End-to-end Recovery of Human Shape and Pose (HMR) | 2018 | Kanazawa et al., CVPR | Foundation for 3D body mesh recovery from single RGB image (V3 capability) |
| 2 | Learning to Reconstruct 3D Human Pose and Shape via Model-fitting in the Loop (SPIN) | 2019 | Kolotouros et al., ICCV | Improved body mesh accuracy for future 3D body model feature |
| 3 | MediaPipe Pose documentation | 2023 | Google AI Edge | Our primary pose estimation library (33 landmarks, real-time WASM) |
| 4 | Female Figure Identification Technique (FFIT) for Apparel | 2004 | Simmons, Istook, Devarajan | Core body shape classification system (9 shapes, 90% accuracy). Our primary classification method. |
| 5 | Modification of FFIT to Include Plus Size Bodies | 2020 | University of Oregon | Extends FFIT to diverse body sizes. Critical for inclusive recommendations. |
| 6 | Clothing Aesthetics: Consistent Colour Choices to Match Skin Tones | 2021 | Perrett & Sprengelmeyer, i-Perception 12(6) | Empirical validation of warm/cool color matching (77% observer agreement). Evidence basis for our color recommendations. |
| 7 | Skin Tone Analysis Through Skin Tone Map Generation | 2024 | Jung et al., Skin Research & Technology | ITA angle method for skin tone quantification. Basis for our detection approach. |
| 8 | Beyond Fitzpatrick: Automated AI Skin Tone Analysis | 2025 | Nature npj Digital Medicine | Validates Monk scale over Fitzpatrick for inclusive skin tone classification. |
| 9 | Evaluating Skin Tone Scales for Dataset Labeling | 2025 | Nature npj Digital Medicine | Comparative study showing Monk 10-tone scale's superior inclusivity. |
| 10 | Skin Tone in The Wild (STW) Dataset | 2025 | ArXiv | 42,313 images, 3,564 individuals, Monk scale labels. Potential training data. |
| 11 | Gender Shades: Intersectional Accuracy Disparities | 2018 | Buolamwini & Gebru, FAT\* | Foundational bias audit methodology. Error rates 0.8% (light males) vs 34.7% (dark females). Guides our fairness testing. |
| 12 | POG: Personalized Outfit Generation (Alibaba iFashion) | 2019 | Chen et al., KDD | Transformer-based outfit generation with 70% CTR improvement in production. V2 architecture reference. |
| 13 | Learning Type-Aware Embeddings for Fashion Compatibility | 2018 | Vasileva et al., ECCV | Type-specific embedding subspaces for flexible compatibility. Informs our embedding strategy. |
| 14 | Learning Fashion Compatibility with Bidirectional LSTMs | 2017 | Han et al., ACM MM | Introduced Bi-LSTM compatibility prediction on Polyvore dataset. Baseline approach reference. |
| 15 | Tops, Bottoms, and Shoes: Capsule Wardrobes via Cross-Attention Tensor Network | 2021 | RecSys (ACM) | State-of-the-art capsule wardrobe generation. V2 recommendation model target architecture. |
| 16 | Creating Capsule Wardrobes from Fashion Images | 2018 | Hsiao, CVPR | Academic capsule wardrobe framework. Basis for our wardrobe gap analysis. |
| 17 | Semi-Supervised Visual Representation Learning for Fashion | 2021 | Revanur et al., RecSys | Leverages unlabeled fashion data. Relevant for scaling with limited labeled data. |
| 18 | A Review of Modern Fashion Recommender Systems | 2024 | ACM Computing Surveys | Comprehensive survey of fashion RecSys approaches. Architecture validation. |
| 19 | DeepFashion: Powering Robust Clothes Recognition | 2016 | Liu et al., CVPR | 800K+ images, 50 categories, 1000 attributes. Foundation training dataset for V2 attribute model. |
| 20 | DeepFashion2: Detection, Pose, Segmentation | 2019 | Ge et al., CVPR | 491K images, 13 categories, 801K items. V2 fine-tuning dataset. |
| 21 | An Empirical Study of Monocular Body Measurement Under Weak Calibration | 2026 | ArXiv | Documents scale ambiguity limitations. Validates our decision to require user-provided height. |
| 22 | Applicability of Complementary Colors in Skin Tone Correction | 2024 | PMC | Vein analysis achieves 80% undertone classification. Potential V3 feature. |
| 23 | Efficient Skin Detection Under Severe Illumination Changes | 2011 | HAL Archives | Documents lighting sensitivity of skin detection. Basis for our "always confirm" policy. |
| 24 | Fast Facial Landmark Detection and Applications: A Survey | 2021 | ArXiv | NME of 3.3-4.1% on standard benchmarks. Validates our landmark accuracy expectations. |
| 25 | Research on Intelligent Clothing Personalized Customization System | 2026 | Nature Scientific Reports | 87.4% style matching accuracy. End-to-end system validation. |
| 26 | Personalized Capsule Wardrobe Creation with Garment and User Modeling | - | Dong et al. | Two-component scoring: user-garment + garment-garment compatibility. Wardrobe gap methodology. |

### Evidence Confidence Levels
- **High confidence**: Body shape classification (FFIT), face landmark detection, outfit compatibility ML, wardrobe attribute extraction (DeepFashion)
- **Medium confidence**: Warm/cool color matching (single empirical study), FFIT on diverse populations (needs extension), capsule wardrobe minimum counts
- **Low confidence**: Full 12-season color system (no comprehensive peer review), precise skin tone from uncalibrated camera, material detection from images (~75% accuracy)
- **Assumptions stated**: Commission weight of 10% is a starting hypothesis to A/B test. Capsule wardrobe minimum counts are based on industry convention, not research. Monk-to-season mapping is our creation, not a published standard.

---

## Verification Plan
1. **CV Pipeline**: Unit test each step against known images with labeled ground truth. Integration test full pipeline end-to-end.
2. **Recommendation Engine**: Offline evaluation on Polyvore test set for compatibility AUC. Expert stylist review of top-10 recommendations for 50 synthetic user profiles.
3. **Wardrobe Extraction**: Test URL extraction against 20 major ecommerce sites. Measure attribute accuracy against manual labels.
4. **Privacy/Consent**: Legal review of consent flow text. Verify deletion cascade removes all biometric data. Pen-test biometric data access.
5. **Affiliate Integration**: End-to-end test: click → redirect → simulate postback → verify conversion recorded.
6. **Full User Journey**: Manual QA of all 4 user journeys described in Section C. Test on 3 device types (desktop Chrome, iOS Safari, Android Chrome).

---

## Tech Stack Summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 14, React 18, TypeScript 5.4, Tailwind + shadcn/ui | SSR for SEO, RSC for perf, accessible components |
| Client CV | `@mediapipe/tasks-vision` WASM | Real-time pose overlay without server round-trip |
| State | Zustand + TanStack Query 5 | Lightweight, no Redux boilerplate |
| Backend | FastAPI, Python 3.12, Pydantic 2.x | Async-native, ML ecosystem interop |
| Auth | Supabase Auth (MVP) | OAuth2, magic link, JWT. Migrate if needed. |
| ORM | SQLAlchemy 2.0 + Alembic | Async support, mature migrations |
| DB | PostgreSQL 16 (Supabase or RDS) | JSONB, pg_trgm, battle-tested |
| Cache | Redis 7 (Upstash or ElastiCache) | Session, rate limit, scan status, rec cache |
| Storage | AWS S3 + CloudFront | Wardrobe images, thumbnails, model artifacts |
| Vector DB | Pinecone Serverless | Managed cosine similarity, metadata filtering |
| Task Queue | Celery 5.4 + Redis | Catalog ingestion, commission reconciliation |
| ML | MediaPipe 0.10.x, OpenCLIP ViT-B/32, PyTorch 2.2 | Pose/face, embeddings, classification |
| ML Serving | ONNX Runtime (CPU) + GPU for batch CLIP | Cost-efficient inference |
| Monitoring | Sentry + PostHog + Prometheus/Grafana | Errors, product analytics, infra |
| CI/CD | GitHub Actions → Docker → ECS Fargate (or Fly.io for MVP) | Containerized, auto-scaling |
| IaC | Pulumi (Python) | Matches backend language |
| Monorepo | Turborepo | Shared types, single PR for cross-cutting changes |

**Estimated cloud cost (MVP, ~1K DAU)**: ~$335/month
