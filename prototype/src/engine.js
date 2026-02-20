/**
 * 60 FPS AI Game Engine
 * Core loop that runs agents at 60 frames per second
 */

import { FrameAgent } from './agent.js';

export class AIGameEngine {
  constructor(options = {}) {
    this.targetFPS = options.fps || 60;
    this.frameTime = 1000 / this.targetFPS;
    this.agents = [];
    this.worldState = {
      agents: [],
      events: [],
      frameCount: 0,
      time: Date.now()
    };
    
    this.running = false;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.actualFPS = 0;
    this.frameDrops = 0;
    
    // Performance tracking
    this.perfStats = {
      avgFrameTime: 0,
      maxFrameTime: 0,
      totalTokensUsed: 0,
      framesProcessed: 0
    };
    
    // LLM inference function (can be set externally)
    this.llmInference = options.llmInference || null;
    
    // Event listeners
    this.listeners = {
      frameUpdate: [],
      agentStateChange: [],
      frameDrop: []
    };
  }

  /**
   * Add an agent to the world
   */
  addAgent(id, startPosition) {
    const agent = new FrameAgent(id, startPosition);
    this.agents.push(agent);
    this.worldState.agents.push(agent);
    return agent;
  }

  /**
   * Remove an agent
   */
  removeAgent(id) {
    this.agents = this.agents.filter(a => a.id !== id);
    this.worldState.agents = this.worldState.agents.filter(a => a.id !== id);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]) {
        callback(data);
      }
    }
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.running) {
      console.warn('Engine already running');
      return;
    }
    
    this.running = true;
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    
    console.log(`Starting 60 FPS AI Engine (target: ${this.targetFPS} FPS)`);
    
    // Use setInterval for consistent frame timing
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.frameTime);
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.running) return;
    
    this.running = false;
    clearInterval(this.intervalId);
    
    console.log('Engine stopped');
    console.log(`Stats: ${this.frameCount} frames, ${this.frameDrops} drops, avg FPS: ${this.actualFPS.toFixed(1)}`);
  }

  /**
   * Main tick function - runs every frame
   */
  async tick() {
    const frameStart = Date.now();
    
    // Update frame count
    this.frameCount++;
    this.worldState.frameCount = this.frameCount;
    this.worldState.time = frameStart;
    
    // Phase 1: Gather inputs (world state)
    const inputs = this.gatherInputs();
    
    // Phase 2: Update all agents
    await this.updateAgents(inputs);
    
    // Phase 3: Process events (collisions, interactions)
    this.processEvents();
    
    // Phase 4: Emit frame update event
    this.emit('frameUpdate', {
      frame: this.frameCount,
      agents: this.agents.map(a => a.getDisplayState()),
      fps: this.actualFPS,
      frameTime: Date.now() - frameStart
    });
    
    // Performance tracking
    const frameElapsed = Date.now() - frameStart;
    this.updatePerformanceStats(frameElapsed);
    
    // Check for frame drop
    if (frameElapsed > this.frameTime) {
      this.frameDrops++;
      this.emit('frameDrop', {
        frame: this.frameCount,
        expectedTime: this.frameTime,
        actualTime: frameElapsed
      });
    }
    
    // Calculate actual FPS
    const timeSinceLastFrame = frameStart - this.lastFrameTime;
    this.actualFPS = timeSinceLastFrame > 0 ? 1000 / timeSinceLastFrame : 0;
    this.lastFrameTime = frameStart;
  }

  /**
   * Gather inputs for this frame
   */
  gatherInputs() {
    return {
      agents: this.agents.map(a => ({
        id: a.id,
        position: a.state.position,
        intent: a.state.intent
      })),
      events: this.worldState.events,
      frameCount: this.frameCount
    };
  }

  /**
   * Update all agents for this frame
   */
  async updateAgents(inputs) {
    const updatePromises = this.agents.map(async (agent) => {
      try {
        const action = await agent.update(
          this.worldState,
          this.frameCount,
          this.llmInference
        );
        
        this.emit('agentStateChange', {
          agentId: agent.id,
          state: agent.state,
          action,
          frame: this.frameCount
        });
        
      } catch (err) {
        console.error(`Agent ${agent.id} update failed:`, err.message);
      }
    });
    
    // Wait for all agents to update
    await Promise.all(updatePromises);
  }

  /**
   * Process world events (collisions, interactions)
   */
  processEvents() {
    // Check for agent collisions
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const agentA = this.agents[i];
        const agentB = this.agents[j];
        
        const distance = agentA.distance(agentB.state.position);
        
        if (distance < 2) {
          // Collision detected
          this.worldState.events.push({
            type: 'collision',
            agents: [agentA.id, agentB.id],
            frame: this.frameCount
          });
        }
      }
    }
    
    // Clear old events (keep last 10 frames)
    this.worldState.events = this.worldState.events.slice(-10);
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(frameTime) {
    this.perfStats.framesProcessed++;
    this.perfStats.maxFrameTime = Math.max(this.perfStats.maxFrameTime, frameTime);
    
    // Running average
    const alpha = 0.1; // Smoothing factor
    this.perfStats.avgFrameTime = 
      alpha * frameTime + (1 - alpha) * this.perfStats.avgFrameTime;
    
    // Track total tokens
    this.perfStats.totalTokensUsed = this.agents.reduce(
      (sum, agent) => sum + agent.tokensUsed,
      0
    );
  }

  /**
   * Get current performance stats
   */
  getStats() {
    return {
      fps: this.actualFPS,
      targetFPS: this.targetFPS,
      frame: this.frameCount,
      frameDrops: this.frameDrops,
      avgFrameTime: this.perfStats.avgFrameTime.toFixed(2),
      maxFrameTime: this.perfStats.maxFrameTime.toFixed(2),
      totalTokens: this.perfStats.totalTokensUsed,
      agents: this.agents.length
    };
  }

  /**
   * Inject an event into the world
   */
  injectEvent(event) {
    this.worldState.events.push({
      ...event,
      frame: this.frameCount,
      timestamp: Date.now()
    });
  }
}
