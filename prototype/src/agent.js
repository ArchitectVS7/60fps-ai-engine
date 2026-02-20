/**
 * Frame Agent - AI agent optimized for 60 FPS continuous execution
 */

export class FrameAgent {
  constructor(id, startPosition = [0, 0, 0]) {
    this.id = id;
    this.state = {
      position: startPosition,
      velocity: [0, 0, 0],
      attention: null,      // What agent is focused on
      intent: 'IDLE',       // Current goal
      memory: [],           // Ring buffer (last 10 frames)
      health: 100,
      energy: 100
    };
    
    this.tokenBudget = 283; // Per frame
    this.tokensUsed = 0;
  }

  /**
   * Build compact prompt for this frame
   */
  buildPrompt(worldState, frameCount) {
    // Ultra-compact format to fit in token budget
    const nearbyAgents = worldState.agents
      .filter(a => a.id !== this.id)
      .filter(a => this.distance(a.state.position) < 5)
      .map(a => `${a.id}@${a.state.position.join(',')}`);
    
    const recentMemory = this.state.memory.slice(-3)
      .map((m, i) => `F${frameCount - 3 + i}:${m.action}`)
      .join(' ');
    
    return [
      `F${frameCount}`,
      `AG:${this.id}`,
      `POS:${this.state.position.join(',')}`,
      `INT:${this.state.intent}`,
      `ATT:${this.state.attention || 'null'}`,
      nearbyAgents.length > 0 ? `NEAR:${nearbyAgents.join(' ')}` : '',
      recentMemory ? `MEM:${recentMemory}` : '',
      `ACT:`
    ].filter(Boolean).join(' | ') + '\n';
  }

  /**
   * Calculate distance to another position
   */
  distance(otherPos) {
    const dx = this.state.position[0] - otherPos[0];
    const dy = this.state.position[1] - otherPos[1];
    const dz = this.state.position[2] - otherPos[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  /**
   * Parse LLM output into action
   */
  parseAction(output) {
    // Expected format: "MOVE_N 5" or "SCAN" or "IDLE" etc.
    const tokens = output.trim().toUpperCase().split(/\s+/);
    const actionType = tokens[0];
    const params = tokens.slice(1);
    
    return { type: actionType, params };
  }

  /**
   * Apply action to state
   */
  applyAction(action) {
    const { type, params } = action;
    
    switch (type) {
      case 'MOVE_N':
      case 'MOVE_NORTH':
        this.state.position[1] += parseFloat(params[0] || 1);
        break;
      
      case 'MOVE_S':
      case 'MOVE_SOUTH':
        this.state.position[1] -= parseFloat(params[0] || 1);
        break;
      
      case 'MOVE_E':
      case 'MOVE_EAST':
        this.state.position[0] += parseFloat(params[0] || 1);
        break;
      
      case 'MOVE_W':
      case 'MOVE_WEST':
        this.state.position[0] -= parseFloat(params[0] || 1);
        break;
      
      case 'SCAN':
        this.state.attention = params[0] || 'area';
        this.state.intent = 'SCANNING';
        break;
      
      case 'PATROL':
        this.state.intent = 'PATROL';
        break;
      
      case 'IDLE':
        this.state.intent = 'IDLE';
        this.state.velocity = [0, 0, 0];
        break;
      
      default:
        // Unknown action, stay idle
        this.state.intent = 'IDLE';
    }
    
    // Clamp position to bounds
    this.state.position = this.state.position.map(v => 
      Math.max(-50, Math.min(50, v))
    );
  }

  /**
   * Update agent state for this frame
   */
  async update(worldState, frameCount, llmInference) {
    // Build compact prompt
    const prompt = this.buildPrompt(worldState, frameCount);
    
    // For Phase 1, we'll use simple rule-based behavior
    // (LLM inference added in Phase 1.5)
    let action;
    
    if (llmInference && typeof llmInference === 'function') {
      // Call LLM with token budget
      const response = await llmInference(prompt, this.tokenBudget);
      this.tokensUsed = response.tokensUsed || 0;
      action = this.parseAction(response.text);
    } else {
      // Fallback: Simple patrol behavior
      action = this.simplePatrolBehavior(frameCount);
    }
    
    // Apply action to state
    this.applyAction(action);
    
    // Add to memory
    this.state.memory.push({
      frame: frameCount,
      action: action.type,
      position: [...this.state.position]
    });
    
    // Keep memory ring buffer at 10 frames
    if (this.state.memory.length > 10) {
      this.state.memory.shift();
    }
    
    return action;
  }

  /**
   * Simple rule-based patrol (for demo without LLM)
   */
  simplePatrolBehavior(frameCount) {
    // Move in a circle pattern
    const angle = (frameCount % 360) * (Math.PI / 180);
    const radius = 10;
    
    const targetX = Math.cos(angle) * radius;
    const targetY = Math.sin(angle) * radius;
    
    const dx = targetX - this.state.position[0];
    const dy = targetY - this.state.position[1];
    
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > 1) {
      // Move toward target
      const moveX = (dx / distance) * 0.5;
      const moveY = (dy / distance) * 0.5;
      
      this.state.position[0] += moveX;
      this.state.position[1] += moveY;
      
      return { type: 'PATROL', params: [] };
    } else {
      return { type: 'IDLE', params: [] };
    }
  }

  /**
   * Get compact state representation for display
   */
  getDisplayState() {
    return {
      id: this.id,
      pos: this.state.position.map(v => v.toFixed(1)),
      intent: this.state.intent,
      attention: this.state.attention,
      tokens: this.tokensUsed
    };
  }
}
