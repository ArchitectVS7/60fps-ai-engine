/**
 * Terminal Visualization
 * Blessed.js-based UI for watching agents in real-time
 */

import blessed from 'blessed';

export class TerminalViz {
  constructor(engine) {
    this.engine = engine;
    this.screen = null;
    this.widgets = {};
    this.agentTrails = new Map(); // Track agent movement trails
  }

  /**
   * Initialize the terminal UI
   */
  init() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: '60 FPS AI Engine Observatory',
      fullUnicode: true
    });

    // Main world view (hex grid)
    this.widgets.worldView = blessed.box({
      top: 0,
      left: 0,
      width: '70%',
      height: '60%',
      label: ' 🎮 World View ',
      border: { type: 'line' },
      style: {
        border: { fg: 'magenta' }
      },
      tags: true
    });

    // Agent list (right sidebar)
    this.widgets.agentList = blessed.list({
      top: 0,
      right: 0,
      width: '30%',
      height: '60%',
      label: ' 🤖 Agents ',
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        selected: { bg: 'blue', fg: 'white' }
      },
      keys: true,
      vi: true,
      interactive: false
    });

    // Stats panel
    this.widgets.statsPanel = blessed.box({
      top: '60%',
      left: 0,
      width: '70%',
      height: '15%',
      label: ' 📊 Stats ',
      border: { type: 'line' },
      style: {
        border: { fg: 'yellow' }
      },
      tags: true
    });

    // Frame log (bottom)
    this.widgets.frameLog = blessed.log({
      bottom: 0,
      left: 0,
      width: '100%',
      height: '25%',
      label: ' 📝 Frame Log ',
      border: { type: 'line' },
      style: {
        border: { fg: 'green' }
      },
      scrollable: true,
      scrollbar: {
        ch: ' ',
        bg: 'green'
      },
      tags: true
    });

    // Help text
    this.widgets.help = blessed.box({
      top: '60%',
      right: 0,
      width: '30%',
      height: '15%',
      label: ' ⌨️  Controls ',
      border: { type: 'line' },
      style: {
        border: { fg: 'white' }
      },
      content: [
        '{cyan-fg}Q{/} - Quit',
        '{cyan-fg}Space{/} - Pause/Resume',
        '{cyan-fg}R{/} - Reset',
        '{cyan-fg}+/-{/} - Adjust FPS'
      ].join('\n'),
      tags: true
    });

    // Append all widgets
    this.screen.append(this.widgets.worldView);
    this.screen.append(this.widgets.agentList);
    this.screen.append(this.widgets.statsPanel);
    this.screen.append(this.widgets.frameLog);
    this.screen.append(this.widgets.help);

    // Key bindings
    this.screen.key(['q', 'C-c'], () => {
      this.engine.stop();
      process.exit(0);
    });

    this.screen.key('space', () => {
      if (this.engine.running) {
        this.engine.stop();
        this.log('{yellow-fg}⏸  Paused{/}');
      } else {
        this.engine.start();
        this.log('{green-fg}▶  Resumed{/}');
      }
    });

    this.screen.key('r', () => {
      this.log('{red-fg}🔄 Reset not implemented yet{/}');
    });

    // Subscribe to engine events
    this.engine.on('frameUpdate', (data) => {
      this.updateDisplay(data);
    });

    this.engine.on('frameDrop', (data) => {
      this.log(`{red-fg}⚠️  Frame drop: ${data.actualTime.toFixed(2)}ms (expected ${data.expectedTime.toFixed(2)}ms){/}`);
    });

    this.engine.on('agentStateChange', (data) => {
      // Log significant state changes only (not every frame)
      if (data.frame % 60 === 0) { // Log every second
        this.log(`{cyan-fg}${data.agentId}{/} → {yellow-fg}${data.action.type}{/} @ ${data.state.position.map(v => v.toFixed(1)).join(',')}`);
      }
    });

    // Initial render
    this.screen.render();
  }

  /**
   * Update the display for this frame
   */
  updateDisplay(data) {
    // Update world view
    this.renderWorldView(data.agents);

    // Update agent list
    const agentItems = data.agents.map(agent => 
      `${agent.id.padEnd(12)} {cyan-fg}${agent.intent.padEnd(10)}{/} ${agent.pos.join(',').padEnd(15)} {yellow-fg}${agent.tokens}t{/}`
    );
    this.widgets.agentList.setItems(agentItems);

    // Update stats
    const stats = this.engine.getStats();
    this.widgets.statsPanel.setContent([
      `{green-fg}FPS:{/} ${stats.fps.toFixed(1)} / ${stats.targetFPS}`,
      `{yellow-fg}Frame:{/} ${stats.frame}`,
      `{red-fg}Drops:{/} ${stats.frameDrops}`,
      `{cyan-fg}Avg Frame Time:{/} ${stats.avgFrameTime}ms`,
      `{magenta-fg}Tokens:{/} ${stats.totalTokens}`,
      `{blue-fg}Agents:{/} ${stats.agents}`
    ].join('  |  '));

    // Render
    this.screen.render();
  }

  /**
   * Render the hex grid world view
   */
  renderWorldView(agents) {
    const width = this.widgets.worldView.width - 4;
    const height = this.widgets.worldView.height - 3;
    
    // Create grid
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = ' ';
      }
    }

    // Convert world coordinates to screen coordinates
    const worldToScreen = (worldPos) => {
      const scale = Math.min(width, height) / 120; // World is -50 to +50
      const x = Math.floor((worldPos[0] + 50) * scale);
      const y = Math.floor((worldPos[1] + 50) * scale);
      return [x, y];
    };

    // Draw hex grid pattern
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 6) {
        if (x < width && y < height) {
          grid[y][x] = '{gray-fg}·{/}';
        }
      }
    }

    // Draw agents
    for (const agent of agents) {
      const [x, y] = worldToScreen(agent.pos);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Agent representation based on intent
        let symbol;
        let color;
        
        switch (agent.intent) {
          case 'PATROL':
            symbol = '○';
            color = 'green';
            break;
          case 'SCANNING':
            symbol = '◎';
            color = 'yellow';
            break;
          case 'IDLE':
            symbol = '◌';
            color = 'gray';
            break;
          default:
            symbol = '●';
            color = 'cyan';
        }
        
        grid[y][x] = `{${color}-fg}${symbol}{/}`;
        
        // Draw agent ID nearby
        if (x + 1 < width) {
          const idLabel = agent.id.substring(0, 3);
          for (let i = 0; i < idLabel.length && x + 1 + i < width; i++) {
            grid[y][x + 1 + i] = `{${color}-fg}${idLabel[i]}{/}`;
          }
        }
        
        // Track trail
        if (!this.agentTrails.has(agent.id)) {
          this.agentTrails.set(agent.id, []);
        }
        const trail = this.agentTrails.get(agent.id);
        trail.push([x, y]);
        if (trail.length > 10) trail.shift();
        
        // Draw trail
        for (let i = 0; i < trail.length - 1; i++) {
          const [tx, ty] = trail[i];
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
            if (grid[ty][tx] === ' ' || grid[ty][tx].includes('·')) {
              grid[ty][tx] = `{${color}-fg}·{/}`;
            }
          }
        }
      }
    }

    // Convert grid to string
    const content = grid.map(row => row.join('')).join('\n');
    this.widgets.worldView.setContent(content);
  }

  /**
   * Log a message to the frame log
   */
  log(message) {
    this.widgets.frameLog.log(message);
  }

  /**
   * Destroy the UI
   */
  destroy() {
    if (this.screen) {
      this.screen.destroy();
    }
  }
}
