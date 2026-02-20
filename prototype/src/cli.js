#!/usr/bin/env node

/**
 * CLI entry point for 60 FPS AI Engine
 */

import { Command } from 'commander';
import { AIGameEngine } from './engine.js';
import { TerminalViz } from './viz.js';

const program = new Command();

program
  .name('60fps')
  .description('🎮 60 FPS AI Engine - Gamified agent observatory')
  .version('0.1.0');

program
  .command('start')
  .description('Start the engine with terminal visualization')
  .option('-a, --agents <number>', 'Number of agents to spawn', '3')
  .option('-f, --fps <number>', 'Target FPS', '60')
  .option('--demo', 'Run demo scenario')
  .action(async (options) => {
    const numAgents = parseInt(options.agents);
    const fps = parseInt(options.fps);
    
    console.log('🎮 Initializing 60 FPS AI Engine...\n');
    
    // Create engine
    const engine = new AIGameEngine({ fps });
    
    // Spawn agents
    console.log(`Spawning ${numAgents} agents...\n`);
    for (let i = 0; i < numAgents; i++) {
      const id = `AG-${String(i + 1).padStart(3, '0')}`;
      const startPos = [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        0
      ];
      engine.addAgent(id, startPos);
    }
    
    // Initialize visualization
    console.log('Initializing terminal UI...\n');
    const viz = new TerminalViz(engine);
    viz.init();
    
    // Start logging
    viz.log('{green-fg}🚀 Engine started{/}');
    viz.log(`{cyan-fg}Agents:{/} ${numAgents}`);
    viz.log(`{yellow-fg}Target FPS:{/} ${fps}`);
    viz.log('{gray-fg}Press SPACE to pause, Q to quit{/}');
    viz.log('');
    
    // Start the engine
    engine.start();
    
    // Demo scenario
    if (options.demo) {
      viz.log('{magenta-fg}📖 Running demo scenario...{/}');
      
      // Inject events periodically
      setTimeout(() => {
        engine.injectEvent({
          type: 'anomaly',
          position: [10, 10, 0],
          severity: 'high'
        });
        viz.log('{red-fg}⚠️  Anomaly detected at (10, 10){/}');
      }, 5000);
      
      setTimeout(() => {
        engine.injectEvent({
          type: 'resource',
          position: [-15, 5, 0],
          amount: 100
        });
        viz.log('{green-fg}💎 Resource discovered at (-15, 5){/}');
      }, 10000);
    }
    
    // Handle cleanup
    process.on('SIGINT', () => {
      viz.log('{red-fg}🛑 Shutting down...{/}');
      engine.stop();
      viz.destroy();
      process.exit(0);
    });
  });

program
  .command('benchmark')
  .description('Run performance benchmark')
  .option('-d, --duration <seconds>', 'Duration in seconds', '60')
  .option('-a, --agents <number>', 'Number of agents', '10')
  .action(async (options) => {
    const duration = parseInt(options.duration);
    const numAgents = parseInt(options.agents);
    
    console.log('🏁 Running benchmark...');
    console.log(`Duration: ${duration}s, Agents: ${numAgents}\n`);
    
    const engine = new AIGameEngine({ fps: 60 });
    
    // Spawn agents
    for (let i = 0; i < numAgents; i++) {
      const id = `BENCH-${i}`;
      engine.addAgent(id, [Math.random() * 20, Math.random() * 20, 0]);
    }
    
    // Track performance
    let frameUpdateCount = 0;
    engine.on('frameUpdate', () => {
      frameUpdateCount++;
    });
    
    // Start
    engine.start();
    
    // Run for duration
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    // Stop and report
    engine.stop();
    
    const stats = engine.getStats();
    console.log('\n📊 Benchmark Results:');
    console.log(`Frames processed: ${stats.frame}`);
    console.log(`Frame drops: ${stats.frameDrops}`);
    console.log(`Average FPS: ${(stats.frame / duration).toFixed(2)}`);
    console.log(`Avg frame time: ${stats.avgFrameTime}ms`);
    console.log(`Max frame time: ${stats.maxFrameTime}ms`);
    console.log(`Total tokens: ${stats.totalTokens}`);
    
    process.exit(0);
  });

// Default command
if (process.argv.length === 2) {
  program.parse(['node', '60fps', 'start', '--demo']);
} else {
  program.parse();
}
