# Tamil AI Travel Planner - Architecture Documentation

## System Overview

The Tamil AI Travel Planner is a full-stack voice-enabled travel planning application built with a microservices architecture. It enables Tamil-speaking users to plan trips, generate itineraries, and book travel using natural language voice or text input.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Browser - localhost:3000)                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Voice Input  │  │ Text Input   │  │ Itinerary    │        │
│  │ (MediaRec.)  │  │ (Tamil/Eng)  │  │ Display      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Booking Form │  │ TTS Output   │  │ Elderly Mode │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND SERVICE (Next.js)                   │
│                       localhost:3000                            │
│                                                                 │
│  • React 18 Components                                          │
│  • Client-side state management                                │
│  • Browser APIs (MediaRecorder, SpeechSynthesis)               │
│  • API client (axios)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND SERVICE (Node.js/Express)              │
│                       localhost:3001                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Query        │  │ Voice        │  │ Booking      │        │
│  │ Processing   │  │ Processing   │  │ Management   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Travel       │  │ Itinerary    │  │ Audio        │        │
│  │ Service      │  │ Service      │  │ Service      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   NLP SERVICE (Flask)    │  │   DATABASE (SQLite)      │
│    localhost:5000        │  │   database/travel.db     │
│                          │  │                          │
│  • Intent Detection      │  │  • queries table         │
│  • Entity Extraction     │  │  • itineraries table     │
│  • Whisper Transcription │  │  • bookings table        │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Tech Stack Breakdown

### 1. Frontend Layer (Next.js + React)

**Technology:** Next.js 16.2.3, React 18.2.0

**Purpose:** User interface and client-side interactions

**Key Components:**
- `VoiceRecorder.js` - Voice recording using MediaRecorder API
- `BookingForm.js` - Travel booking interface
- `ItineraryDisplay.js` - Display generated itineraries
- `BookingConfirmation.js` - Booking confirmation display

**Browser APIs Used:**
- `MediaRecorder` - Record audio from microphone
- `SpeechSynthesis` - Text-to-speech for Tamil output
- `localStorage` - Store elderly mode preference

**Workflow:**
1. User opens browser → Next.js serves React application
2. User clicks microphone → MediaRecorder captures audio
3. Audio sent to backend `/voice` endpoint
4. Response displayed in ItineraryDisplay component
5. User clicks booking → BookingForm opens
6. Booking confirmation shown with PNR and booking ID

---

### 2. Backend Layer (Node.js + Express)

**Technology:** Node.js, Express 4.22.1, better-sqlite3 12.8.0

**Purpose:** REST API server, business logic orchestration, database operations

**Port:** 3001

**Key Dependencies:**
- `express` - Web framework
- `better-sqlite3` - SQLite database driver
- `multer` - File upload handling (audio files)
- `axios` - HTTP client for NLP service
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - API rate limiting (100 req/15min)

**Services Architecture:**

#### a) Audio Service (`services/audioService.js`)
**Function:** `forwardToWhisper(audioBuffer, filename)`
- Receives audio buffer from frontend
- Forwards to Flask NLP service `/transcribe` endpoint
- Returns transcription result

**Workflow:**
```
Audio Buffer → FormData → POST to Flask → Transcription JSON
```

#### b) Travel Service (`services/travelService.js`)
**Function:** `getTravelOptions(source, destination, budget)`
- Generates mock travel options (train, bus, flight)
- Returns route information and pricing
- Filters by budget (low/medium/high)

**Data Structure:**
```javascript
{
  source: "Chennai",
  destination: "Madurai",
  routeInfo: { distance: 461, highlight: "..." },
  options: {
    train: [{ name, duration, price, class }],
    bus: [{ name, duration, price, type }],
    flight: [{ name, duration, price, class }]
  }
}
```

#### c) Itinerary Service (`services/itineraryService.js`)
**Function:** `generateItinerary(nlpResult, travelOptions)`
- Takes NLP entities and travel options
- Generates Tamil-language itinerary text
- Creates day-by-day travel plan

**Output Format:**
```
🗺️ பயண திட்டம்: Chennai → Madurai
📅 தேதி: 2026-04-15
💰 பட்ஜெட்: Medium

நாள் 1: ...
நாள் 2: ...

🚆 பயண விருப்பங்கள்:
...
```

#### d) Booking Service (`services/bookingService.js`)
**Functions:**
- `createBooking(data)` - Create new booking with unique ID
- `getBooking(bookingId)` - Retrieve booking details
- `cancelBooking(bookingId)` - Cancel with refund policy
- `getAllBookings()` - List all bookings

**Booking ID Format:** `TN1001`, `TN1002`, etc.
**PNR Format:** `PNR` + 9 alphanumeric characters

**Cancellation Policy:**
- Within 1 hour: 100% refund
- 1-24 hours: 50% refund
- After 24 hours: No refund

**API Endpoints:**

| Method | Endpoint | Function | Request Body | Response |
|--------|----------|----------|--------------|----------|
| GET | `/health` | Health check | - | `{status: "ok"}` |
| GET | `/recent` | Last 10 queries | - | Array of queries + itineraries |
| POST | `/query` | Text query processing | `{text: "..."}` | Query result + itinerary |
| POST | `/voice` | Voice transcription + processing | FormData with audio file | Transcription + itinerary |
| POST | `/book` | Create booking | `{travelOption, passengers, contactPhone}` | Booking confirmation |
| GET | `/booking/:id` | Get booking details | - | Booking object |
| POST | `/booking/:id/cancel` | Cancel booking | - | Cancellation result + refund |
| GET | `/bookings` | List all bookings | - | Array of bookings |

**Request Flow for Text Query:**
```
1. POST /query {text: "Chennai to Madurai"}
2. callNlpService(text) → Flask NLP
3. Save query to database
4. getTravelOptions(source, dest, budget)
5. generateItinerary(nlpResult, travelOptions)
6. Save itinerary to database
7. Return combined result to frontend
```

**Request Flow for Voice Query:**
```
1. POST /voice (multipart audio file)
2. forwardToWhisper(audioBuffer) → Flask transcription
3. processQuery(transcribedText)
   ├─ callNlpService(text)
   ├─ Save query to DB
   ├─ getTravelOptions()
   ├─ generateItinerary()
   └─ Save itinerary to DB
4. Return transcription + itinerary to frontend
```

---

### 3. NLP Service Layer (Python Flask)

**Technology:** Python 3.10+, Flask 3.0.0, OpenAI Whisper

**Purpose:** Natural language processing and speech transcription

**Port:** 5000

**Key Dependencies:**
- `flask` - Web framework
- `openai-whisper` - Local speech-to-text (no API key needed)
- `ffmpeg-python` - Audio format conversion
- `pydub` - Audio manipulation

**Modules:**

#### a) Main NLP Module (`main.py`)
**Function:** `process_text(text)`
- Intent detection using regex patterns
- Entity extraction (source, destination, date, budget)
- Tamil keyword matching

**Intent Types:**
- `plan_trip` - General trip planning
- `get_routes` - Route information
- `get_budget_trip` - Budget-focused planning
- `get_places` - Tourist places information

**Entity Extraction:**
```python
{
  "source": "Chennai",
  "destination": "Madurai",
  "date": "2026-04-15",
  "budget": "medium"
}
```

**Tamil Keywords Detected:**
- பயணம் (travel), திட்டம் (plan)
- பட்ஜெட் (budget), குறைந்த விலை (low cost)
- இடங்கள் (places), சுற்றுலா (tourism)

#### b) Transcription Module (`transcribe.py`)
**Function:** `transcribe_from_bytes(audio_bytes, language, audio_format)`
- Loads Whisper model (base/small/medium)
- Converts audio to compatible format using ffmpeg
- Transcribes audio to text
- Returns text, language, confidence, duration

**Whisper Model Sizes:**
- `tiny` - 39M params, fastest
- `base` - 74M params (default)
- `small` - 244M params, better accuracy
- `medium` - 769M params, best accuracy

**Workflow:**
```
Audio bytes → Temp file → ffmpeg conversion → Whisper model → Transcription
```

**API Endpoints:**

| Method | Endpoint | Function | Request | Response |
|--------|----------|----------|---------|----------|
| GET | `/health` | Health check | - | `{status: "ok"}` |
| POST | `/nlp` | Text NLP processing | `{text: "..."}` | `{intent, entities}` |
| POST | `/transcribe` | Audio transcription | FormData with audio | `{text, language, confidence, duration}` |

**Transcription Flow:**
```
1. Receive audio file (webm/wav/mp3/ogg/m4a/flac)
2. Validate file size (max 10MB)
3. Write to temporary file
4. Load Whisper model (cached after first load)
5. Transcribe with language hint (Tamil)
6. Extract text, confidence, duration
7. Delete temporary file
8. Return JSON response
```

---

### 4. Database Layer (SQLite)

**Technology:** SQLite 3 via better-sqlite3

**Location:** `database/travel.db`

**Purpose:** Persistent storage for queries, itineraries, and bookings

**Schema:**

#### Table: `queries`
```sql
CREATE TABLE queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transcript TEXT NOT NULL,           -- User's original query
  intent TEXT,                        -- Detected intent
  entities TEXT,                      -- JSON string of extracted entities
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `itineraries`
```sql
CREATE TABLE itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id INTEGER NOT NULL,          -- Foreign key to queries.id
  itinerary_text TEXT NOT NULL,       -- Generated Tamil itinerary
  travel_options TEXT,                -- JSON string of travel options
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES queries(id)
);
```

#### Table: `bookings`
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT UNIQUE NOT NULL,    -- TN1001, TN1002, ...
  user_id TEXT NOT NULL,              -- User identifier
  travel_type TEXT NOT NULL,          -- train/bus/flight
  travel_name TEXT NOT NULL,          -- Name of service
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date TEXT,
  passengers INTEGER NOT NULL,
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  contact_phone TEXT NOT NULL,
  pnr TEXT NOT NULL,                  -- PNR + 9 alphanumeric
  status TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed/cancelled
  refund_amount INTEGER DEFAULT 0,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Database Operations:**

**Query Storage:**
```javascript
INSERT INTO queries (transcript, intent, entities) 
VALUES (?, ?, ?)
```

**Itinerary Storage:**
```javascript
INSERT INTO itineraries (query_id, itinerary_text, travel_options) 
VALUES (?, ?, ?)
```

**Recent Queries Retrieval:**
```javascript
SELECT q.*, i.* 
FROM queries q 
LEFT JOIN itineraries i ON i.query_id = q.id 
ORDER BY q.created_at DESC 
LIMIT 10
```

---

## Complete Workflow Examples

### Workflow 1: Text-Based Trip Planning

```
1. USER ACTION: Types "Chennai to Madurai trip plan" in text input
   ↓
2. FRONTEND: Sends POST /query {text: "Chennai to Madurai trip plan"}
   ↓
3. BACKEND: Receives request at /query endpoint
   ↓
4. BACKEND: Calls callNlpService(text)
   ↓
5. NLP SERVICE: Receives POST /nlp {text: "..."}
   ↓
6. NLP SERVICE: Runs process_text()
   - Detects intent: "plan_trip"
   - Extracts entities: {source: "Chennai", destination: "Madurai"}
   ↓
7. NLP SERVICE: Returns {intent, entities}
   ↓
8. BACKEND: Saves query to database (queries table)
   ↓
9. BACKEND: Calls getTravelOptions("Chennai", "Madurai", null)
   - Generates train options (Express, Superfast, Vande Bharat)
   - Generates bus options (TNSTC, AC Sleeper, Volvo)
   - Generates flight options (IndiGo, Air India)
   ↓
10. BACKEND: Calls generateItinerary(nlpResult, travelOptions)
    - Creates Tamil-language itinerary text
    - Includes day-by-day plan
    - Lists all travel options with prices
   ↓
11. BACKEND: Saves itinerary to database (itineraries table)
   ↓
12. BACKEND: Returns complete result to frontend
   ↓
13. FRONTEND: Displays itinerary in ItineraryDisplay component
   ↓
14. USER: Sees itinerary with travel options and booking buttons
```

### Workflow 2: Voice-Based Trip Planning

```
1. USER ACTION: Clicks microphone button
   ↓
2. FRONTEND: Requests microphone permission
   ↓
3. BROWSER: Shows permission dialog
   ↓
4. USER: Grants permission and speaks "Chennai இருந்து Madurai பயணம்"
   ↓
5. FRONTEND: MediaRecorder captures audio as webm blob
   ↓
6. USER: Clicks stop button
   ↓
7. FRONTEND: Creates FormData with audio file
   ↓
8. FRONTEND: Sends POST /voice (multipart/form-data)
   ↓
9. BACKEND: Receives audio file via multer middleware
   ↓
10. BACKEND: Calls forwardToWhisper(audioBuffer, filename)
   ↓
11. BACKEND: Sends POST /transcribe to Flask service
   ↓
12. NLP SERVICE: Receives audio file
   ↓
13. NLP SERVICE: Validates file size (max 10MB)
   ↓
14. NLP SERVICE: Writes audio to temporary file
   ↓
15. NLP SERVICE: Loads Whisper model (cached)
   ↓
16. NLP SERVICE: Transcribes audio
    - Detects language: Tamil
    - Extracts text: "Chennai இருந்து Madurai பயணம்"
    - Calculates confidence: 0.95
   ↓
17. NLP SERVICE: Returns {text, language, confidence, duration}
   ↓
18. BACKEND: Receives transcription
   ↓
19. BACKEND: Calls processQuery(transcribedText)
    [Same flow as text query from step 4-11 above]
   ↓
20. BACKEND: Returns transcription + itinerary to frontend
   ↓
21. FRONTEND: Displays transcription and itinerary
   ↓
22. FRONTEND: Optionally reads itinerary aloud using SpeechSynthesis
   ↓
23. USER: Hears itinerary in Tamil voice
```

### Workflow 3: Booking a Travel Option

```
1. USER ACTION: Clicks "🎫 பதிவு செய்" button on a travel option
   ↓
2. FRONTEND: Opens BookingForm modal
   ↓
3. USER: Enters passengers (1-6) and phone number (10 digits)
   ↓
4. USER: Clicks "✓ உறுதி செய்யுங்கள்" (Confirm)
   ↓
5. FRONTEND: Validates input
   - Passengers: 1-6
   - Phone: 10 digits
   ↓
6. FRONTEND: Sends POST /book
   {
     travelOption: {name, type, price, ...},
     passengers: 2,
     contactPhone: "9876543210",
     source: "Chennai",
     destination: "Madurai",
     travelDate: "2026-04-15"
   }
   ↓
7. BACKEND: Receives booking request
   ↓
8. BACKEND: Calls createBooking(data)
   ↓
9. BOOKING SERVICE: Generates unique booking ID (TN1001)
   ↓
10. BOOKING SERVICE: Generates PNR (PNR + 9 random chars)
   ↓
11. BOOKING SERVICE: Calculates total price (price × passengers)
   ↓
12. BOOKING SERVICE: Inserts into bookings table
   ↓
13. BOOKING SERVICE: Returns booking object
   ↓
14. BACKEND: Returns success response with booking details
   ↓
15. FRONTEND: Displays BookingConfirmation component
    - Shows booking ID: TN1001
    - Shows PNR: PNRABC123XYZ
    - Shows total price: ₹800
    - Shows cancellation policy
   ↓
16. USER: Sees confirmation message in Tamil
```

### Workflow 4: Cancelling a Booking

```
1. USER ACTION: Clicks cancel button on a booking
   ↓
2. FRONTEND: Sends POST /booking/:id/cancel
   ↓
3. BACKEND: Receives cancellation request
   ↓
4. BACKEND: Calls cancelBooking(bookingId)
   ↓
5. BOOKING SERVICE: Retrieves booking from database
   ↓
6. BOOKING SERVICE: Checks booking status
   - If already cancelled → Return error
   ↓
7. BOOKING SERVICE: Checks travel date
   - If travel date passed → Return error "Cannot cancel"
   ↓
8. BOOKING SERVICE: Calculates time since booking
   - Within 1 hour → 100% refund
   - 1-24 hours → 50% refund
   - After 24 hours → 0% refund
   ↓
9. BOOKING SERVICE: Updates booking record
   - status = 'cancelled'
   - refund_amount = calculated amount
   - cancelled_at = current timestamp
   ↓
10. BOOKING SERVICE: Returns cancellation result
   ↓
11. BACKEND: Returns response to frontend
   ↓
12. FRONTEND: Displays cancellation confirmation
    - Shows refund amount
    - Shows refund policy applied
   ↓
13. USER: Sees cancellation message in Tamil
```

---

## Data Flow Summary

### Text Query Flow
```
User Input → Frontend → Backend /query → NLP Service /nlp → 
Backend (Travel + Itinerary Services) → Database → Backend Response → 
Frontend Display
```

### Voice Query Flow
```
User Voice → MediaRecorder → Frontend → Backend /voice → 
NLP Service /transcribe (Whisper) → Backend /query flow → 
Frontend Display + TTS
```

### Booking Flow
```
User Selection → Frontend Form → Backend /book → 
Booking Service → Database → Backend Response → 
Frontend Confirmation
```

---

## Technology Integration Points

### Frontend ↔ Backend
- **Protocol:** HTTP REST API
- **Format:** JSON
- **Authentication:** None (currently)
- **Rate Limiting:** 100 requests per 15 minutes

### Backend ↔ NLP Service
- **Protocol:** HTTP REST API
- **Format:** JSON (text), multipart/form-data (audio)
- **Timeout:** 10 seconds for NLP, 30 seconds for transcription
- **Fallback:** Default intent if NLP service fails

### Backend ↔ Database
- **Driver:** better-sqlite3 (synchronous)
- **Connection:** Single file-based connection
- **Transactions:** Auto-commit mode
- **Prepared Statements:** Used for all queries

### Frontend ↔ Browser APIs
- **MediaRecorder:** Audio capture (webm format)
- **SpeechSynthesis:** Text-to-speech output
- **localStorage:** Elderly mode preference persistence

---

## Performance Characteristics

### Response Times (Typical)
- Text query: 200-500ms
- Voice transcription: 2-5 seconds (depends on audio length)
- Booking creation: 50-100ms
- Recent queries: 20-50ms

### Resource Usage
- Whisper model (base): ~74MB RAM
- SQLite database: <10MB disk space
- Backend memory: ~50-100MB
- Frontend bundle: ~500KB

### Scalability Limits (Current)
- SQLite: Single-writer, suitable for <100 concurrent users
- No horizontal scaling (single instance)
- No caching layer
- No CDN for static assets

---

## Security Considerations

### Current Implementation
- CORS enabled for all origins
- Rate limiting: 100 req/15min per IP
- No authentication/authorization
- No input sanitization for SQL (uses prepared statements)
- No encryption for data at rest
- No HTTPS (development only)

### Production Requirements
- Add user authentication (JWT/OAuth)
- Implement HTTPS/TLS
- Add input validation and sanitization
- Encrypt sensitive data (phone numbers, PNR)
- Add API key authentication between services
- Implement proper CORS policy
- Add request logging and monitoring

---

## Deployment Architecture

### Current (Development)
```
localhost:3000 (Frontend) → localhost:3001 (Backend) → localhost:5000 (NLP)
                                ↓
                        database/travel.db
```

### Recommended (Production)
```
CDN → Load Balancer → Frontend Servers (Next.js)
                           ↓
                      API Gateway
                           ↓
                   Backend Cluster (Node.js)
                      ↓         ↓
              NLP Service    Database
              (Flask)        (PostgreSQL + Redis)
```

---

## Future Enhancements

### Planned Improvements
1. **Real API Integration:** IRCTC, RedBus, flight booking APIs
2. **Payment Gateway:** Razorpay/PayU integration
3. **User Authentication:** JWT-based auth system
4. **Advanced NLP:** IndicBERT or mBERT for better Tamil understanding
5. **Offline Support:** PWA with service workers
6. **Multi-modal:** WhatsApp bot, SMS integration
7. **Scalability:** PostgreSQL, Redis caching, horizontal scaling

---

## Conclusion

This architecture provides a solid foundation for a voice-enabled Tamil travel planning system. The microservices approach allows independent scaling and maintenance of each component. The use of local Whisper ensures privacy and eliminates API costs, while the SQLite database keeps deployment simple for MVP stage.

The system successfully demonstrates:
- Voice input/output in Tamil
- Natural language understanding
- Itinerary generation
- Booking management with refund policies
- Elderly-friendly UI modes

Future iterations should focus on real API integrations, scalability improvements, and production-grade security measures.
