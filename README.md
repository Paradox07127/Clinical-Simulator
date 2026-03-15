# Clinical Simulator

Clinical Simulator is an interactive training platform for hands-on medical practice. It combines guided simulation, real-time AI coaching, and structured post-session review to help learners build clinical confidence through active repetition rather than passive study.

## Training Modules

### Clinical Interview

Practice patient encounters from first question to final diagnosis.

- **3 patient cases** across easy, medium, and hard difficulty
- Conduct history-taking via text or voice input
- AI patient responds naturally based on hidden clinical details, personality traits, and speech patterns
- Real-time coverage tracking shows how much of the clinical picture has been explored
- Clinical support tools available during the session: interviewing tips, critical gap alerts, and optional diagnosis reveal
- Submit a final diagnosis with clinical reasoning
- Receive a structured evaluation across 6 dimensions:
  - Information Gathering (25%) — completeness of history, PMH, drug history, social history, review of systems
  - Clinical Reasoning (25%) — hypothesis-driven questioning and differential diagnosis
  - Diagnostic Accuracy (20%) — correct diagnosis and clinical understanding
  - Communication (15%) — empathy, rapport, and patient-centered approach
  - Efficiency (10%) — information yield per turn, no redundant questions
  - Safety (5%) — red flag recognition and appropriate urgency
- Competency levels from Novice to Expert based on weighted score
- Beginner mode blocks early submission until 40% coverage is reached

### CPR Training

Practice emergency resuscitation with camera-based motion tracking and real-time feedback.

- **3 scenarios** with progressive difficulty:
  - Hands-Only CPR (Beginner) — continuous compressions, no protocol steps
  - Adult BLS Sequence (Intermediate) — full 30:2 protocol with scene safety, responsiveness check, 911 call, breathing check, compressions, and rescue breaths
  - Advanced Emergency Response (Advanced) — 30:2 under pressure with multi-cycle endurance
- Camera-centric layout: webcam feed occupies the primary view with pose skeleton overlay
- MediaPipe pose detection tracks 33 body landmarks at 30 fps
- Compression detection via wrist motion peak analysis with dynamic threshold and debounce
- BLS phase guidance: step-by-step overlays walk through Scene Safety, Check Response, Call 911, Check Breathing before compressions begin (Intermediate/Advanced only)
- Ventilation phase: confirm 2 rescue breaths between compression sets in 30:2 mode
- 2-minute cycle break with rescuer switch prompt and cycle statistics
- Real-time feedback on the camera overlay: timer, compression count, and coaching instruction bar
- ActionStatusCard shows live form assessment: hands visible, arms straight, hands centered, full recoil
- Metronome at 110 BPM and voice coach available during training
- Post-session evaluation across 7 dimensions:
  - Rhythm (35%) — compression rate adherence to 100-120 CPM target
  - Form (25%) — hand visibility, arm straightness, and centering
  - Depth Proxy (10%) — estimated compression depth from motion amplitude
  - Recoil (10%) — complete chest return between compressions
  - Compression Fraction (10%) — active compression time vs. total elapsed
  - Rate Consistency (5%) — stability of inter-compression timing
  - Readiness (5%) — BLS checklist completion

## Product Flow

1. **Select** a training module from the home screen
2. **Brief** — review the scenario, scoring criteria, and setup checklist
3. **Train** — live simulation with real-time cues and support
4. **Review** — structured evaluation with score breakdown, strengths, gaps, and next-step recommendations
5. **Repeat** — retry the same scenario or try a harder one

Session history is saved locally and displayed on the home screen for progress tracking.

## Design Principles

- Camera and conversation take center stage — controls stay minimal and peripheral
- Phase-based progression with clear visual indicators
- Strong guidance for first-time users, efficient for repeat practice
- All warnings and confirmations are inline UI elements, not browser dialogs
- Feedback is specific enough to improve the next attempt

## Who It Is For

- Medical students practicing clinical reasoning and patient interaction
- Healthcare trainees learning BLS/CPR procedural skills
- Simulation-based training programs looking for scalable practice tools
- Teams exploring AI-driven, multimodal clinical education

## Demo Setup

```bash
npm install
npm run dev
```

Requires a modern browser with webcam access for CPR training. AI features require API keys configured in the settings panel (Gemini or OpenAI).


##Links
飞书：https://my.feishu.cn/docx/R0DrdkDcqoJnxgx6RlxcudOyn3c?from=from_copylink
