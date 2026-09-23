# Implementation Plan: PayPal Fee Calculator (C++ Crow Backend + PayPal Themed Frontend)

Build a production-ready, clean, responsive web application for a PayPal Fee Calculator running on `localhost:8080`, featuring a modern C++20 backend using the Crow web framework and a pixel-perfect PayPal-branded frontend.

## Proposed Architecture & Structure

```
h:/Paypal_Calculator/
├── CMakeLists.txt
├── src/
│   └── main.cpp
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

### 1. Backend (`src/main.cpp` & `CMakeLists.txt`)
- **Language Standard**: C++20.
- **Framework**: Crow (`CrowCpp/Crow`) fetched via CMake `FetchContent` along with standalone Asio (`asio-1-30-2`), configured with `ASIO_STANDALONE` (no Boost dependency required).
- **Static File Serving**:
  - `GET /` -> Serves `public/index.html` with MIME type `text/html`.
  - `GET /<path>` (e.g. `/style.css`, `/script.js`, `/favicon.ico`) -> Serves files dynamically from the `public` directory with appropriate MIME types (`text/css`, `application/javascript`, `image/svg+xml`, etc.).
- **API Endpoint**:
  - `POST /api/calculate`
  - Accepts JSON payload: `{"amount": number}`.
  - Validates `amount > 0`. Returns HTTP 400 with `{"error": "..."}` on malformed input or negative amounts.
  - Calculates:
    - `fee = (amount * 0.034) + 0.30`
    - `total = amount + fee`
  - Returns JSON response:
    ```json
    {
      "amount": 100.00,
      "fee": 3.70,
      "total": 103.70
    }
    ```
- **Port & Concurrency**: Runs on `0.0.0.0:8080` (or `127.0.0.1:8080`) with multithreaded worker pool.

### 2. Frontend Design System (`public/style.css`)
- **Customizable `:root` Tokens**:
  - Brand colors: Primary Blue `#0070BA`, Dark Blue hover `#003087`, Background Accent `#F5F7FA`, Card Background `#FFFFFF`, Text Color `#2C2E2F`, Subdued Text `#6C7378`, Border Color `#E1E7EB`, Success Color `#107C41`, Accent Gold `#FFC439`.
  - Radii: Card radius `16px`, Input/Button radius `100px` (PayPal pill buttons) and `10px` for cards.
  - Shadows: Soft, modern elevation shadows.
  - Typography: `'PayPalSansSmall', 'Helvetica Neue', Arial, sans-serif`.
- **Layout & Responsiveness**:
  - Clean PayPal top navigation bar with official embedded double-P logo and wordmark SVG.
  - Centered hero calculator container with rounded elevated cards.
  - Interactive input group with currency symbol ($ USD), quick-preset buttons ($10, $50, $100, $250, $500, $1,000), and a dynamic fee breakdown card.
  - Visual summary card showing:
    - Transacted amount
    - PayPal transaction fee (3.4% + $0.30)
    - Total amount required / deductions
    - Net amount received
  - Toggle / reverse calculation mode ("You send" vs "You want to receive").
  - Subtle micro-animations, smooth transitions, copy-to-clipboard buttons for results, and feedback states.

### 3. Frontend Markup & Logic (`public/index.html` & `public/script.js`)
- **HTML**: Semantic structure, embedded crisp SVG PayPal logo, accessible inputs, clear metric badges.
- **JavaScript**:
  - Debounced dynamic calculation on typing (`input` event) and instant trigger on preset buttons or submit.
  - Calls `POST /api/calculate` via modern `fetch()` with error handling and loading indicators.
  - Real-time formatted currency output (`Intl.NumberFormat`).
  - Copy result to clipboard with visual toast indicator.

## Verification Plan

### Automated / Build Verification
1. Configure and build the C++ project using Visual Studio MSVC & CMake (`cmake -B build -G "Visual Studio 18 2026" -A x64` or `Ninja`).
2. Verify compilation succeeds without warnings.

### Functional Verification
1. Start the server on `http://127.0.0.1:8080`.
2. Test `GET /` serves `index.html`.
3. Test `GET /style.css` and `GET /script.js` serve correct assets with proper MIME types.
4. Test `POST /api/calculate` with `curl` or PowerShell `Invoke-RestMethod`:
   - Input: `{"amount": 100}` -> Verify response `{"amount": 100.0, "fee": 3.70, "total": 103.70}`.
   - Input: `{"amount": 50}` -> Verify response `{"amount": 50.0, "fee": 2.00, "total": 52.00}`.
   - Error cases: `{"amount": -5}`, malformed JSON.
5. Launch browser subagent to interactively verify the frontend:
   - Verify PayPal styling, responsiveness, fonts, and SVG branding.
   - Verify preset chips, input interactions, calculation results, and copy actions.
