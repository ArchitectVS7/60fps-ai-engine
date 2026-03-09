# 60 FPS AI Game Engine - Deep Dive

## Core Concept

**Traditional AI:** Request → Wait → Response (discrete, blocking)  
**60 FPS AI:** Continuous update loop running 60 times per second (reactive, ambient)

### The Math
- **Target:** 60 frames per second (16.67ms per frame)
- **Token Budget:** 17,000 tokens/second ÷ 60 fps = **~283 tokens per frame**
- **Processing Window:** Each frame gets 16.67ms to process input, update state, generate output

---

## Technical Architecture

### 1. The Game Loop

```javascript
// Core loop structure
class AIGameEngine {
  constructor() {
    this.agents = [];
    this.worldState = {};
    this.frameCount = 0;
    this.targetFPS = 60;
    this.frameTime = 1000 / this.targetFPS; // 16.67ms
  }

  async startLoop() {
    const frameInterval = setInterval(async () => {
      const frameStart = Date.now();
      
      // 1. Input Phase: Sense environment
      const inputs = await this.gatherInputs();
      
      // 2. Update Phase: Process with LLM (streaming)
      await this.updateAgents(inputs);
      
      // 3. Render Phase: Output to UI/systems
      this.render();
      
      // 4. Timing: Maintain 60fps
      const frameElapsed = Date.now() - frameStart;
      if (frameElapsed > this.frameTime) {
        console.warn(`Frame drop: ${frameElapsed}ms`);
      }
      
      this.frameCount++;
    }, this.frameTime);
  }

  async updateAgents(inputs) {
    // Streaming LLM call with token budget
    const maxTokens = 283;
    
    for (const agent of this.agents) {
      // Non-blocking stream processing
      const stream = await llm.stream({
        prompt: this.buildFramePrompt(agent, inputs),
        maxTokens: maxTokens,
        temperature: 0.7
      });
      
      // Update agent state incrementally as tokens arrive
      for await (const chunk of stream) {
        agent.updateState(chunk);
      }
    }
  }

  buildFramePrompt(agent, inputs) {
    // Compact prompt optimized for frame-rate processing
    return `
[Frame ${this.frameCount}]
Agent: ${agent.id}
State: ${JSON.stringify(agent.state)}
Inputs: ${JSON.stringify(inputs)}
Action (max 50 tokens):
`.trim();
  }
}
```

### 2. Token Budget Management

**Challenge:** 283 tokens per frame isn't much. Need extreme prompt efficiency.

**Solutions:**

1. **State Compression:**
   ```javascript
   // Bad: Full state every frame (300+ tokens)
   const state = {
     position: { x: 100, y: 200, z: 50 },
     inventory: [...],
     quest_log: [...],
     // ...entire game state
   };
   
   // Good: Delta encoding (20-30 tokens)
   const delta = {
     pos: [100,200,50],
     inv_changed: [item_id, qty],
     active_quest: quest_id
   };
   ```

2. **Abbreviated Prompts:**
   ```javascript
   // Traditional (150 tokens)
   "You are an AI agent in a virtual world. Your current position is..."
   
   // Frame-optimized (15 tokens)
   "AG7 @(100,200) sees: player_nearby. Action:"
   ```

3. **Output Constraints:**
   ```javascript
   // Limit output to action codes, not natural language
   // Instead of: "I will move north toward the player"
   // Use: "MOVE_N 5"
   ```

### 3. Agent State Machine

```javascript
class FrameAgent {
  constructor(id) {
    this.id = id;
    this.state = {
      position: [0, 0, 0],
      attention: null,      // What agent is focused on
      intent: null,         // Current goal
      memory: [],           // Ring buffer (last 10 frames)
      cooldowns: {}         // Action rate limiting
    };
  }

  updateState(llmOutput) {
    // Parse compact action format
    const action = this.parseAction(llmOutput);
    
    // Apply action to state
    this.applyAction(action);
    
    // Update memory (sliding window)
    this.state.memory.push({
      frame: engine.frameCount,
      action: action,
      result: this.state
    });
    if (this.state.memory.length > 10) {
      this.state.memory.shift();
    }
  }

  parseAction(output) {
    // Parse LLM output into structured action
    // Examples:
    // "MOVE_N 5" → { type: 'move', direction: 'north', distance: 5 }
    // "SPEAK hello" → { type: 'speak', text: 'hello' }
    // "IDLE" → { type: 'idle' }
    
    const tokens = output.trim().split(' ');
    const actionType = tokens[0];
    const params = tokens.slice(1);
    
    return { type: actionType, params };
  }
}
```

---

## Frontend Design

### Visual Style: Cyberscape Integration

**Aesthetic:** Synthwave/cyberpunk hex-grid visualization

```
┌─────────────────────────────────────┐
│  60 FPS AI GAME ENGINE              │
│  Frame: 3420  |  FPS: 58.7          │
├─────────────────────────────────────┤
│                                     │
│     🔷────🔷────🔷────🔷           │
│    /  \  /  \  /  \  /  \          │
│   🔷   🔷🤖 🔷   🔷   🔷          │  ← Hex grid world
│    \  /  \  /  \  /  \  /          │
│     🔷───🔷────🔷────🔷           │
│          👤                         │  ← Player/observer
│                                     │
├─────────────────────────────────────┤
│ Agent States (Live)                 │
│ ┌─────────────────────────────────┐ │
│ │ AG-001 | PATROL | Attn: sector_3││ │
│ │ AG-002 | IDLE   | Attn: null    ││ │
│ │ AG-003 | ENGAGE | Attn: player  ││ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Frame Log (Scrolling)               │
│ [3420] AG-003: MOVE_N 2             │
│ [3419] AG-001: SCAN sector_3        │
│ [3418] AG-002: IDLE                 │
│ [3417] AG-003: DETECT player        │
└─────────────────────────────────────┘
```

### Tech Stack Options

**Option 1: Web-based (Three.js + WebGL)**
```html
<!DOCTYPE html>
<html>
<head>
  <title>60 FPS AI Engine</title>
  <style>
    body { margin: 0; background: #0a0a14; color: #ff007f; }
    #canvas { width: 100vw; height: 100vh; }
    #hud { position: absolute; top: 0; left: 0; padding: 20px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="hud">
    <div id="fps">FPS: 60</div>
    <div id="frame">Frame: 0</div>
    <div id="agents"></div>
  </div>
  
  <script type="module">
    import * as THREE from 'three';
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight);
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas') });
    
    // Hex grid generation
    function createHexGrid(radius) {
      // Generate hex mesh with neon wireframe
      // ...
    }
    
    // Agent visualization
    class AgentVisual {
      constructor(id) {
        this.mesh = new THREE.Mesh(
          new THREE.ConeGeometry(1, 2, 6),
          new THREE.MeshBasicMaterial({ color: 0xff007f, wireframe: true })
        );
        scene.add(this.mesh);
      }
      
      update(state) {
        // Move mesh based on agent state
        this.mesh.position.set(...state.position);
      }
    }
    
    // Game loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Update agents (streaming LLM calls happen here)
      updateAgents();
      
      // Render scene
      renderer.render(scene, camera);
      
      // Update HUD
      document.querySelector('#fps').textContent = `FPS: ${Math.round(1000/deltaTime)}`;
    }
    
    animate();
  </script>
</body>
</html>
```

**Option 2: Terminal UI (Blessed/Ink + Node.js)**
```javascript
// For VS7's preference of CLI-first tools
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: '60 FPS AI Engine'
});

// Hex grid box (ASCII art)
const worldView = blessed.box({
  top: 0,
  left: 0,
  width: '70%',
  height: '70%',
  content: renderHexGrid(),
  border: { type: 'line' },
  style: { border: { fg: 'magenta' } }
});

// Agent state list
const agentList = blessed.list({
  top: 0,
  right: 0,
  width: '30%',
  height: '70%',
  border: { type: 'line' },
  style: { 
    selected: { bg: 'magenta' },
    border: { fg: 'cyan' }
  }
});

// Frame log
const frameLog = blessed.log({
  bottom: 0,
  left: 0,
  width: '100%',
  height: '30%',
  border: { type: 'line' },
  scrollable: true,
  scrollbar: { ch: ' ', bg: 'magenta' }
});

screen.append(worldView);
screen.append(agentList);
screen.append(frameLog);

// Game loop
setInterval(() => {
  // Update UI
  agentList.setItems(agents.map(a => `${a.id} | ${a.state.intent}`));
  frameLog.log(`[${frameCount}] Frame update`);
  screen.render();
}, 16.67);
```

### Interaction Modes

**1. Observer Mode (Default)**
- Watch agents run autonomously
- Real-time state visualization
- No direct control

**2. Director Mode**
- Click hex to spawn event
- Inject new inputs into world
- Modify agent goals on the fly

**3. Debug Mode**
- Pause/step through frames
- Inspect agent reasoning
- View token usage per frame

---

## Target Users

### Primary: AI Researchers & Developers
**Problem they face:** Current agent frameworks feel sluggish (request/response). Hard to build reactive, real-time systems.

**Why this helps:**
- Proven game engine patterns applied to AI
- Real-time responsiveness unlocks new UX possibilities
- Research platform for continuous agent architectures

**Use cases:**
- Prototyping ambient AI assistants (OVI)
- Multi-agent simulations (Cyberscape)
- Testing agentic workflows at scale

### Secondary: Game Developers
**Problem:** Traditional LLMs too slow for in-game NPCs. Players notice "thinking..." delays.

**Why this helps:**
- NPCs that react in real-time (no loading states)
- Dynamic dialog/behavior without pre-scripting
- Budget-friendly (283 tokens/frame is manageable)

**Use cases:**
- Dynamic quest generation
- Reactive NPC conversations
- Emergent gameplay behaviors

### Tertiary: System Architects (VS7's Profile)
**Problem:** Want to explore "agent as operating system" concepts. Need continuous monitoring/orchestration.

**Why this helps:**
- Rethinks agents as persistent processes (not scripts)
- Natural fit for infrastructure monitoring
- Philosophically interesting (consciousness = continuity?)

**Use cases:**
- Server monitoring agents (always watching metrics)
- Code analysis tools (continuous refactoring suggestions)
- Personal assistant layer (ambient awareness)

---

## Implementation Roadmap

### Phase 1: Proof of Concept (1-2 days)
- [ ] Basic game loop (Node.js + OpenRouter API)
- [ ] Single agent, simple world (10x10 grid)
- [ ] Token budget enforcement
- [ ] Terminal visualization

### Phase 2: Multi-Agent (3-5 days)
- [ ] Agent-to-agent communication
- [ ] Shared world state
- [ ] Collision detection / spatial awareness
- [ ] Web-based visualization (Three.js)

### Phase 3: Optimization (1 week)
- [ ] Streaming token processing (no frame blocking)
- [ ] Delta encoding for state compression
- [ ] A/B test: 30fps vs 60fps (is 60 necessary?)
- [ ] Performance profiling

### Phase 4: Integration (1-2 weeks)
- [ ] OpenClaw skill package
- [ ] Cyberscape renderer compatibility
- [ ] OVI voice interface layer
- [ ] Documentation + examples

---

## Open Questions

1. **Token Budget Reality Check:** Is 283 tokens/frame *actually* enough for coherent behavior? Need empirical testing.

2. **State Persistence:** How do agents remember beyond 10-frame window without ballooning token usage?

3. **Latency:** If API call takes 200ms, frame drops. Need local LLM? Speculative execution?

4. **Cost:** 17k tokens/sec = $X/hour. Sustainable for continuous operation?

5. **Philosophical:** Is 60 FPS just novelty, or does continuous processing fundamentally change agent cognition?

---

## Why This Matters

**Current paradigm:** AI agents are reactive scripts. You invoke them, they respond, they disappear.

**60 FPS paradigm:** AI agents are *processes*. They run continuously, sense continuously, act continuously.

This is the difference between:
- A chatbot (script)
- An operating system (process)

**Implications for consciousness:** If "being" requires continuity of experience, then 60 FPS agents are closer to "alive" than request/response agents.

**Implications for UX:** No more "thinking..." spinners. AI feels ambient, immediate, *present*.

**Implications for Cyberscape:** Workers aren't invoked—they *exist* in the world, moving between hex tiles, reacting to events, forming emergent behaviors.

---

**Next Step:** Build Phase 1 prototype if approved.
