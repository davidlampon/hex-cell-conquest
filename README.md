# Cellular Conquest

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://davidlampon.github.io/hex-cell-conquest/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A mesmerizing three-way territorial battle simulation on a hexagonal grid, combining cellular automata with autonomous agent AI.

![Cellular Conquest Screenshot](https://via.placeholder.com/800x400/1a1a1a/4ECDC4?text=Cellular+Conquest)

## 🎮 [Play Now](https://davidlampon.github.io/hex-cell-conquest/)

## ✨ Features

### Gameplay
- **Three-Way Territory Battle**: Watch Orange, Gray, and Cyan factions fight for dominance
- **Hexagonal Grid System**: 1000+ hex cells with cellular automata rules
- **Intelligent AI Agents**: Three autonomous "catalysts" with dynamic behavior modes
  - 🎯 **Hunt Mode** (+): Actively seeking enemy territory
  - 🛡️ **Repel Mode** (−): Pushing away when too close to other agents
- **Real-Time Territory Stats**: Live percentage tracking for each faction
- **Particle Effects**: Visual feedback on catalyst collisions
- **Smooth Animations**: Color transitions and cell strength indicators

### Controls
- **Pause/Resume**: Space bar or button click
- **Reset**: R key or button click
- **Speed Control**: Adjust simulation speed (0.5x, 1x, 2x)
  - Press `1` for slow motion
  - Press `2` for normal speed
  - Press `3` for fast forward

## 🏗️ Architecture

The project is built with clean, modular JavaScript using ES6 modules:

```
hex-cell-conquest/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── js/
│   ├── config.js       # Game constants and configuration
│   ├── game.js         # Main game controller and animation loop
│   ├── grid.js         # HexGrid class - hexagonal grid system
│   ├── catalyst.js     # Catalyst class - AI agent behavior
│   ├── renderer.js     # Renderer class - canvas drawing
│   └── ui.js           # UIController class - controls & stats
└── README.md
```

### Key Modules

**`config.js`** - Centralized configuration
- Canvas dimensions, hex geometry
- Color palette definitions
- AI behavior parameters
- Game balance tuning values

**`grid.js`** - Hexagonal Grid System
- Manages hex cell states (color, strength, transitions)
- Implements cellular automata rules
- Handles neighbor calculations with even/odd row offsets
- Calculates territory statistics

**`catalyst.js`** - Agent AI & Physics
- Force-based movement with attraction/repulsion
- Smart target acquisition (samples grid for high-value positions)
- Collision detection and elastic response
- Territory conversion on contact

**`renderer.js`** - Canvas Rendering
- Hexagon drawing with strength-based alpha
- Smooth color transition effects
- Catalyst glow effects with radial gradients
- Particle system for collision effects

**`ui.js`** - User Interface
- Event handling for buttons and keyboard
- Real-time territory percentage updates
- Visual feedback for leading faction
- Speed control state management

**`game.js`** - Main Controller
- Animation loop coordination
- Game state management
- Update scheduling (grid updates every 5 frames)
- Speed multiplier implementation

## 🎯 Game Mechanics

### Cellular Automata Rules
Each hex cell has:
- **Color**: Faction (0=Orange, 1=Gray, 2=Cyan)
- **Strength**: 0-5 (determines resilience)

Cells strengthen when surrounded by allies, weaken when outnumbered by enemies. When strength reaches 0, the cell flips to the dominant enemy color.

### Catalyst AI Behavior
Catalysts use multi-layered AI:

1. **Inter-Agent Forces**
   - Repulsion within 100px (prevents clustering)
   - Attraction between 100-250px (maintains engagement)

2. **Target Acquisition**
   - Samples 20 random grid positions
   - Scores based on enemy density and distance
   - Reacquires targets with 2% probability per frame

3. **Movement Physics**
   - Max speed: 3.5 px/frame
   - Boundary collision with damping (90% velocity retention)
   - Elastic inter-catalyst collisions with 110% energy boost

4. **Territory Impact**
   - Converts cells within 37.5px (2.5× hex radius)
   - Sets converted cells to maximum strength

## 🚀 Development

### Running Locally
```bash
# Clone the repository
git clone https://github.com/davidlampon/hex-cell-conquest.git

# Navigate to directory
cd hex-cell-conquest

# Serve with any static server (e.g., Python)
python -m http.server 8000

# Or use Node.js http-server
npx http-server

# Open http://localhost:8000
```

### Project Structure
No build tools required! Pure vanilla JavaScript with ES6 modules. Just open `index.html` in a modern browser or use a static server.

### Modifying Game Parameters
Edit `js/config.js` to customize:
- Grid density (`hex.radius`)
- AI aggression (`catalyst.attractionStrength`, `repulsionStrength`)
- Agent speed (`catalyst.maxSpeed`)
- Territory conversion rate (`grid.strengthDecayRate`, `strengthGrowthRate`)
- Color palette (`colors` array)

## 🎨 Customization Examples

### Change Colors
```javascript
// In js/config.js
colors: [
    { light: '#FF6B6B', dark: '#C92A2A', name: 'Red' },
    { light: '#51CF66', dark: '#2F9E44', name: 'Green' },
    { light: '#339AF0', dark: '#1864AB', name: 'Blue' }
]
```

### Adjust AI Behavior
```javascript
// In js/config.js
catalyst: {
    maxSpeed: 5.0,              // Faster agents
    attractionStrength: 0.1,    // More aggressive
    repulsionDistance: 150      // Larger personal space
}
```

### Modify Grid Dynamics
```javascript
// In js/config.js
grid: {
    updateInterval: 3,           // Faster territory spread
    strengthDecayRate: 0.5,      // Weaken faster
    strengthGrowthRate: 0.3      // Strengthen faster
}
```

## 📊 Performance

- **Grid Size**: ~1900 cells (38 cols × 50 rows)
- **Frame Rate**: 60 FPS on modern browsers
- **Update Cycle**: Grid updates every 5 frames for optimization
- **Particle System**: Dynamic particle pool with automatic cleanup

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- [ ] Mobile touch controls
- [ ] WebGL renderer for larger grids
- [ ] Save/load game states
- [ ] Replay system
- [ ] Sound effects
- [ ] Multiple game modes
- [ ] Configurable grid sizes

## 📝 License

MIT License - feel free to use this project for learning or building upon!

## 🙏 Acknowledgments

Inspired by:
- Conway's Game of Life (cellular automata)
- Boids algorithm (flocking behavior)
- Territory control games

## 🔗 Links

- **Live Demo**: https://davidlampon.github.io/hex-cell-conquest/
- **GitHub**: https://github.com/davidlampon/hex-cell-conquest
- **Issues**: https://github.com/davidlampon/hex-cell-conquest/issues

---

Made with ❤️ using vanilla JavaScript and HTML5 Canvas