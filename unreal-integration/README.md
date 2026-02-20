# Unreal Engine Integration Guide

**Status:** Phase 3 (Planned)

This directory will contain the Unreal Engine plugin for 60 FPS AI agents.

---

## Architecture Overview

### Plugin Structure

```
Plugins/AIGameEngine/
├── Source/
│   ├── AIGameEngine/
│   │   ├── Private/
│   │   │   ├── AIGameEngineSubsystem.cpp
│   │   │   ├── FrameAgent.cpp
│   │   │   ├── LLMBridge.cpp
│   │   │   └── AgentWorldState.cpp
│   │   ├── Public/
│   │   │   ├── AIGameEngineSubsystem.h
│   │   │   ├── FrameAgent.h
│   │   │   ├── LLMBridge.h
│   │   │   └── AgentWorldState.h
│   │   └── AIGameEngine.Build.cs
│   └── AIGameEngineEditor/
│       └── (Editor customizations)
├── Content/
│   ├── Blueprints/
│   │   ├── BP_AgentPawn.uasset
│   │   ├── BP_GameLoop.uasset
│   │   └── BP_HexWorld.uasset
│   ├── Materials/
│   │   ├── M_HexGrid.uasset
│   │   └── M_AgentTrail.uasset
│   └── Niagara/
│       ├── NS_AgentThoughts.uasset
│       └── NS_ConnectionTrails.uasset
└── Resources/
    └── Icon128.png
```

---

## Core Components

### 1. AIGameEngineSubsystem (C++)

**Purpose:** Global game loop running at 60 FPS

**Key Methods:**
```cpp
class UAIGameEngineSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
public:
    // Spawn a new agent
    UFUNCTION(BlueprintCallable, Category = "AI Game Engine")
    UFrameAgent* SpawnAgent(FString AgentID, FVector StartPosition);
    
    // Set target FPS
    UFUNCTION(BlueprintCallable, Category = "AI Game Engine")
    void SetTargetFPS(int32 FPS);
    
    // Get current stats
    UFUNCTION(BlueprintPure, Category = "AI Game Engine")
    FEngineStats GetStats() const;
    
    // Tick implementation (runs every frame)
    virtual void Tick(float DeltaTime) override;
    
private:
    TArray<UFrameAgent*> Agents;
    FAgentWorldState WorldState;
    int32 FrameCount;
    float TargetFrameTime;
};
```

### 2. FrameAgent (C++)

**Purpose:** Individual agent state and behavior

**Key Methods:**
```cpp
class UFrameAgent : public UObject
{
public:
    // Update agent for this frame
    UFUNCTION(BlueprintCallable, Category = "Frame Agent")
    void UpdateFrame(const FAgentWorldState& WorldState, int32 FrameCount);
    
    // Get compact display state
    UFUNCTION(BlueprintPure, Category = "Frame Agent")
    FAgentDisplayState GetDisplayState() const;
    
    // Agent state variables
    UPROPERTY(BlueprintReadOnly, Category = "State")
    FVector Position;
    
    UPROPERTY(BlueprintReadOnly, Category = "State")
    FString Intent;
    
    UPROPERTY(BlueprintReadOnly, Category = "State")
    FString Attention;
    
    UPROPERTY(BlueprintReadOnly, Category = "State")
    int32 TokensUsed;
    
private:
    TArray<FAgentMemoryFrame> Memory;
    int32 TokenBudget;
};
```

### 3. LLMBridge (C++)

**Purpose:** HTTP client for LLM inference

**Implementation:**
```cpp
class FLLMBridge
{
public:
    // Async LLM inference
    TFuture<FLLMResponse> InferAsync(
        const FString& Prompt,
        int32 MaxTokens,
        float Temperature = 0.7f
    );
    
    // Streaming inference (for real-time updates)
    void InferStreaming(
        const FString& Prompt,
        int32 MaxTokens,
        TFunction<void(FString)> OnChunk,
        TFunction<void(FLLMResponse)> OnComplete
    );
    
private:
    FString APIEndpoint;
    FString APIKey;
    TSharedPtr<IHttpRequest> CreateRequest();
    void ParseStreamingResponse(FString Data);
};
```

---

## Blueprint Integration

### Example Level Blueprint

```
BeginPlay:
  ├─ Get AIGameEngine Subsystem
  │   └─ Set Target FPS: 60
  │
  ├─ Spawn Agent (x3)
  │   ├─ Agent ID: "Worker-001"
  │   ├─ Start Position: (0, 0, 0)
  │   └─ Save Agent Reference
  │
  └─ Bind Events
      ├─ On Frame Update → Update UI
      └─ On Agent State Changed → Update Actor Transform

Tick:
  ├─ Get Engine Stats
  │   ├─ FPS: float
  │   ├─ Frame Count: int
  │   └─ Token Usage: int
  │
  └─ For Each Agent
      ├─ Get Display State
      ├─ Find Agent Actor in World
      └─ Update Transform + VFX
```

### Example Agent Pawn Blueprint

**BP_AgentPawn** (Actor):
- **Components:**
  - Static Mesh (cone/pyramid for agent body)
  - Niagara System (thought particles)
  - Arrow Component (direction indicator)
  - Widget Component (floating HUD)
  
- **Variables:**
  - Agent Reference (UFrameAgent*)
  - Trail Positions (TArray<FVector>)
  - Current Intent (String)
  
- **Functions:**
  - UpdateFromAgent(AgentState)
  - SpawnTrailEffect()
  - UpdateThoughtParticles(Intent)

---

## Data Flow

```
Unreal Game Thread
  │
  ├─ AIGameEngineSubsystem::Tick() [Every frame]
  │   │
  │   ├─ Gather World State
  │   │   ├─ Agent positions
  │   │   ├─ Recent events
  │   │   └─ Frame count
  │   │
  │   ├─ For Each Agent
  │   │   │
  │   │   ├─ Build Compact Prompt
  │   │   │
  │   │   ├─ Call LLMBridge::InferAsync()
  │   │   │   │
  │   │   │   └─ HTTP Request (Async Task)
  │   │   │       │
  │   │   │       ├─ POST to OpenRouter API
  │   │   │       │
  │   │   │       └─ Response (JSON)
  │   │   │           ├─ Parse action
  │   │   │           └─ Token count
  │   │   │
  │   │   └─ Update Agent State
  │   │       ├─ Apply action (move, scan, etc.)
  │   │       ├─ Update memory
  │   │       └─ Fire OnAgentStateChanged event
  │   │
  │   └─ Emit OnFrameUpdate event
  │
  └─ Blueprint Event Graph
      │
      ├─ Receive OnAgentStateChanged
      │   └─ Update Actor Transform
      │       ├─ Smooth interpolation
      │       ├─ Update Niagara particles
      │       └─ Update widget text
      │
      └─ Receive OnFrameUpdate
          └─ Update HUD
              ├─ FPS counter
              ├─ Agent list
              └─ Frame log
```

---

## Handling Latency

**Problem:** LLM API calls can take 100-500ms, but we need 16.67ms frames.

### Solution 1: Async Update with State Buffering

```cpp
void UFrameAgent::UpdateFrame(const FAgentWorldState& WorldState, int32 FrameCount)
{
    // If previous LLM call still pending, use predicted state
    if (bLLMCallInProgress)
    {
        // Use last known velocity to predict position
        Position += Velocity * DeltaTime;
        return;
    }
    
    // Start new async LLM call
    bLLMCallInProgress = true;
    
    FString Prompt = BuildPrompt(WorldState, FrameCount);
    
    LLMBridge->InferAsync(Prompt, TokenBudget)
        .Then([this](FLLMResponse Response) {
            // Parse and apply action
            FAction Action = ParseAction(Response.Text);
            ApplyAction(Action);
            
            bLLMCallInProgress = false;
        });
}
```

### Solution 2: Staggered Updates

Not all agents update every frame. Stagger updates across frames:

```cpp
void UAIGameEngineSubsystem::Tick(float DeltaTime)
{
    FrameCount++;
    
    // Update only agents whose ID hash matches frame modulo
    for (int32 i = 0; i < Agents.Num(); i++)
    {
        if (FrameCount % Agents.Num() == i)
        {
            Agents[i]->UpdateFrame(WorldState, FrameCount);
        }
    }
}
```

Result: 10 agents × 60 FPS = each agent updates 6 times per second (budget: 166ms per update)

### Solution 3: Local LLM

Run llama.cpp in a separate process, communicate via IPC:

```cpp
class FLocalLLMBridge
{
    // Use named pipes or TCP socket to local LLM server
    // Much lower latency (10-50ms)
    // No token costs
    // Runs on same machine
};
```

---

## Visualization Components

### 1. Hex Grid World (Blueprint)

**BP_HexWorld** Actor:
- Procedurally generated hex grid mesh
- Material: Neon wireframe, pulsing brightness
- Clickable hexes for event injection

### 2. Agent Trail VFX (Niagara)

**NS_AgentTrail:**
- Ribbon emitter following agent path
- Color based on agent intent
- Fades over time (last 10 positions)

### 3. Thought Particles (Niagara)

**NS_AgentThoughts:**
- Particles emanating from agent
- Burst when state changes
- Size based on token usage

### 4. HUD (UMG Widget)

**WBP_GameHUD:**
- FPS counter (top-left)
- Agent list (right sidebar)
- Frame log (bottom)
- Token usage graph (optional)

---

## Performance Optimization

### Token Budget Management

```cpp
// Dynamic token allocation
int32 CalculateTokenBudget(UFrameAgent* Agent, float AvailableTime)
{
    // More tokens if frame has extra time
    int32 BaseTokens = 283;
    
    if (AvailableTime > TargetFrameTime * 1.5f)
    {
        return BaseTokens * 2; // Double tokens if we're ahead
    }
    
    return BaseTokens;
}
```

### Culling Inactive Agents

```cpp
// Agents far from camera or idle for long periods drop to 1 FPS
if (Agent->FramesSinceLastAction > 300) // 5 seconds
{
    Agent->UpdateInterval = 60; // Update once per second
}
```

---

## Example Use Case: Cyberscape Mode

**Goal:** Visualize AI workers patrolling a codebase

**Setup:**
1. Parse codebase into modules
2. Create hex tile for each module
3. Spawn worker agents (one per module)
4. Color hexes based on code health (green = good, red = failing tests)
5. Workers patrol their sectors, call QA when issues found

**Blueprint Logic:**
```
BeginPlay:
  ├─ Parse Codebase (C++ or Python script)
  │   └─ Returns: Array of Modules
  │
  ├─ For Each Module:
  │   ├─ Spawn Hex Tile at Grid Position
  │   ├─ Set Material Color (Health → RGB)
  │   └─ Spawn Worker Agent
  │       ├─ Assign Patrol Zone
  │       └─ Set Behavior: "Monitor sector"
  │
  └─ Start Engine

Agent Update:
  ├─ LLM Prompt: "You are monitoring ${ModuleName}. Recent tests: ${TestResults}. Action?"
  ├─ Response: "CALL_QA module_auth" or "PATROL" or "SCAN dependencies"
  └─ Execute Action
      ├─ If CALL_QA → Spawn QA agent at position
      └─ If PATROL → Move to next hex in sector
```

---

## Next Steps

### Immediate (Phase 3 Start):
1. Create Unreal project boilerplate
2. Implement C++ plugin skeleton
3. Build LLMBridge HTTP client
4. Test async inference timing

### Short-term:
1. Blueprint-exposed agent spawning
2. Basic hex grid world
3. Agent pawn with movement
4. Simple HUD

### Long-term:
1. Niagara VFX polish
2. VR support
3. Cyberscape mode implementation
4. Performance profiling and optimization

---

**Status:** Ready for Phase 3 implementation when approved.
