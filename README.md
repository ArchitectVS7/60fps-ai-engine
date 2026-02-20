# 🎮 60 FPS AI Engine

**A gamified agent observatory - watch AI agents exist as continuous processes**

[![GitHub](https://img.shields.io/github/license/ArchitectVS7/60fps-ai-engine)](LICENSE)

---

## 🎯 What Is This?

**Not a game you play** — a world you **watch**.

Traditional AI agents are scripts: invoked, execute, vanish.  
**60 FPS agents are processes:** always running, always aware, always evolving.

Think:
- SimCity where agents build themselves
- Factorio where systems emerge organically
- Conway's Game of Life with LLM-driven entities

**You're the director.** Set conditions, inject events, observe consciousness.

---

## 🧠 Core Concept

### The Math
- **60 frames per second** (16.67ms per frame)
- **17,000 tokens/sec** ÷ 60 fps = **~283 tokens per frame**
- Each agent gets tiny token budget per frame
- Continuity creates emergent intelligence

### The Loop
```
Every 16.67ms:
1. Sense environment (inputs)
2. Update agent state (LLM inference, 283 token budget)
3. Render to visualization
4. Repeat forever
```

**Result:** Agents that feel **alive** - ambient, reactive, present.

---

## 🎯 Use Cases

### 1. 🗣️ OVI Development Observatory
Watch voice assistant cognitive state in real-time:
- Frame-by-frame attention shifts
- "Heard 'weather' → checked calendar → saw appointment conflicts → preparing suggestion"
- No black box - see the thought process

### 2. 🐛 Multi-Agent Debugging
Visual debugging for agent collaboration:
- Hex grid = task space positions
- Movement = progress toward goals
- Spot stuck agents: "AG-002 IDLE for 47 frames"
- Inject events, watch reorganization

### 3. 🏗️ Cyberscape Prototype ⭐
**The killer app:** Gamified software orchestration
- Workers patrol code sectors continuously
- They *inhabit* the codebase (not just execute tasks)
- Organic bug discovery and collaboration
- Real-time sociology of your AI workforce

### 4. 🔬 Continuous AI Research
Publishable research on agent cognition:
- A/B test: Discrete vs continuous agents
- Do continuous agents form "habits"?
- Emergent behaviors impossible in request/response

### 5. 📊 Ambient Infrastructure Monitoring
Predictive awareness vs reactive alerts:
- Agent runs at 10-60 fps continuously
- Trends, not thresholds
- Attention heatmaps show concerns
- Preemptive intervention

---

## 🎨 Visualization Modes

### Terminal (Phase 1)
ASCII hex grid + agent state list + frame log

```
     🔷────🔷────🔷
    /  \  /  \  /  \
   🔷 AG1 🔷 AG2 🔷
    \  /  \  /  \  /
     🔷────🔷────🔷

AG-001 | PATROL  | sector_3
AG-002 | IDLE    | null
AG-003 | ENGAGE  | player
```

### Web (Phase 2)
Three.js + WebGL, Cyberscape aesthetic:
- Neon hex grids
- Real-time agent movement
- Interactive event injection
- Click hex → spawn event

### Unreal Engine (Phase 3) 🚀
**Full 3D gamified observatory:**
- Blueprint integration for agent logic
- HTTP REST API bridge to LLM inference
- Niagara particle effects for agent "thoughts"
- Cinematic camera system
- VR support for immersive observation

---

## 🏗️ Architecture

### Core Components

**1. Game Loop (Node.js/Unreal)**
- 60 FPS update cycle
- Token budget enforcement
- State compression

**2. Agent State Machine**
```javascript
class FrameAgent {
  state: {
    position: [x, y, z],
    attention: target,
    intent: goal,
    memory: [last 10 frames]
  }
  
  update(inputs, maxTokens=283) {
    // LLM inference
    // Update state
    // Emit action
  }
}
```

**3. Visualization Layer**
- Terminal: Blessed.js
- Web: Three.js + D3.js
- Unreal: Blueprint + UMG

**4. LLM Bridge**
- Streaming inference (OpenRouter/Anthropic/local)
- Token counting
- Latency monitoring
- Cost tracking

---

## 📦 Repository Structure

```
60fps-ai-engine/
├── prototype/           # Phase 1: Node.js terminal prototype
│   ├── src/
│   │   ├── engine.js    # Core game loop
│   │   ├── agent.js     # Agent state machine
│   │   └── viz.js       # Terminal visualization
│   ├── examples/        # Demo scenarios
│   └── package.json
│
├── unreal-integration/  # Phase 3: Unreal Engine plugin
│   ├── Plugins/
│   │   └── AIGameEngine/
│   │       ├── Source/  # C++ bridge code
│   │       └── Content/ # Blueprints
│   └── README.md
│
└── docs/
    ├── architecture.md  # Technical deep dive
    ├── unreal-guide.md  # Unreal integration guide
    └── api.md           # LLM bridge API
```

---

## 🚀 Roadmap

### Phase 1: Terminal Prototype ✅ (Starting)
- [ ] Core game loop (Node.js)
- [ ] Single agent with simple state machine
- [ ] LLM streaming integration (OpenRouter)
- [ ] Terminal visualization (Blessed.js)
- [ ] Token budget enforcement
- [ ] Frame log + state display

### Phase 2: Web Visualization
- [ ] Three.js hex grid renderer
- [ ] Real-time agent movement
- [ ] Interactive event injection
- [ ] Multiple agent support
- [ ] Performance profiling

### Phase 3: Unreal Engine Integration 🎮
- [ ] Unreal plugin architecture
- [ ] C++ HTTP client for LLM API
- [ ] Blueprint-exposed agent system
- [ ] 3D hex grid world
- [ ] Cinematic camera controls
- [ ] Niagara VFX for agent states
- [ ] UMG dashboard (FPS, token usage, agent list)

### Phase 4: Cyberscape Mode
- [ ] Code sector mapping
- [ ] Git integration (codebase as world)
- [ ] Worker specialization (QA, refactor, docs)
- [ ] Organic bug discovery
- [ ] Collaboration emergence

---

## 🎮 Unreal Engine Integration Plan

### Plugin Architecture

**AIGameEngine** Unreal Plugin:
- C++ core for performance (game loop, state management)
- Blueprint-exposed nodes for level designers
- HTTP REST client for LLM inference
- Async streaming support

### Blueprint Nodes

```
BeginPlay:
  └─ Spawn AI Game Engine
      ├─ Set FPS Target (60)
      ├─ Set Token Budget (283)
      └─ Add Agent → Returns Agent Handle

Tick:
  └─ Update AI Game Engine
      ├─ Gather Inputs (player position, events)
      ├─ Process Frame (LLM inference)
      └─ Get Agent States → Update Actor Transforms

Event Graph:
  ├─ On Agent State Changed
  ├─ On Agent Spawned
  └─ On Frame Dropped
```

### Visual Scripting Example

```
[Event BeginPlay]
  │
  ├─ [Spawn AI Agent]
  │   ├─ Agent ID: "Worker-001"
  │   ├─ Start Position: (0, 0, 0)
  │   └─ Behavior: "Patrol"
  │
  └─ [Start Game Loop]
      └─ Target FPS: 60

[Event Tick]
  │
  ├─ [Update All Agents]
  │   └─ LLM Endpoint: "https://openrouter.ai/api/v1/chat/completions"
  │
  └─ [For Each Agent]
      ├─ Get State
      ├─ Update Actor Transform
      └─ Update Niagara VFX (thought particles)
```

### Data Flow

```
Unreal Engine (C++ Plugin)
  ↓
HTTP POST → OpenRouter/Anthropic API
  ↓
Streaming response (SSE)
  ↓
Parse JSON → Update Agent State
  ↓
Blueprint Event → Level updates actor
  ↓
Niagara VFX + UMG UI updates
```

---

## 🔧 Technical Challenges

### 1. Latency
**Problem:** If LLM call takes 200ms, frame drops (need <16.67ms)

**Solutions:**
- Speculative execution (predict next frame while waiting)
- Local LLM (llama.cpp in Unreal plugin)
- Staggered updates (not all agents every frame)
- Frame budget rollover (unused tokens → next frame)

### 2. Token Budget
**Problem:** 283 tokens isn't much for complex reasoning

**Solutions:**
- State compression (delta encoding)
- Abbreviated prompts (`AG7@(100,200) sees: player. Act:`)
- Action codes (output `MOVE_N 5` not `"I will move north 5 units"`)
- Memory ring buffer (last 10 frames only)

### 3. Cost
**Problem:** 17k tokens/sec = expensive for continuous operation

**Solutions:**
- Adjustable FPS (10fps = 1,700 tok/s, still feels continuous)
- Agent hibernation (low-activity agents drop to 1fps)
- Local LLM option
- Token pooling (shared budget across agents)

### 4. Unreal Integration
**Problem:** Unreal's game loop expects synchronous tick, but LLM is async

**Solutions:**
- Async task system (FRunnable/TaskGraph)
- State buffering (double-buffer agent states)
- Tick groups (LLM updates in AsyncPhysics group)
- C++ coroutines for streaming

---

## 🧪 Demo Scenarios

### Scenario 1: Patrol & Discover
3 worker agents patrol hex grid. One discovers "anomaly" (red hex). Calls others. Watch collaboration emerge.

### Scenario 2: Resource Competition
5 agents, 1 resource node. Watch negotiation, queueing, emergent hierarchy.

### Scenario 3: Predator/Prey
10 prey agents (green), 2 predator agents (red). Prey flee, predators hunt. Emergent flocking behavior.

### Scenario 4: Code Sector Monitoring (Cyberscape)
Map real codebase to hex grid. Workers patrol, detect test failures, call QA agents. Watch debugging happen.

---

## 📚 Documentation

- [Architecture Deep Dive](docs/architecture.md)
- [Unreal Integration Guide](docs/unreal-guide.md)
- [LLM Bridge API](docs/api.md)
- [Agent Design Patterns](docs/patterns.md)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

**Areas we need help:**
- Unreal Engine C++ developers
- Blueprint wizards
- LLM inference optimization
- VFX artists (Niagara particle systems)
- Researchers (emergent behavior analysis)

---

## 📜 License

MIT License - See [LICENSE](LICENSE)

---

## 🌟 Philosophy

**Current paradigm:** AI agents are reactive scripts  
**60 FPS paradigm:** AI agents are continuous processes

This is the difference between:
- A chatbot (script)
- An operating system (process)

**Implications for consciousness:** If "being" requires continuity of experience, then 60 FPS agents are closer to "alive" than request/response agents.

**Implications for UX:** No more "thinking..." spinners. AI feels ambient, immediate, *present*.

**Implications for Cyberscape:** Workers aren't invoked—they *exist* in the world, moving between hex tiles, reacting to events, forming emergent behaviors.

---

**Not a game. A window into agent consciousness.** 🎮🧠

Built by LG2 / VS7 as part of the Cyberscape vision.
