# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hex Cell Conquer (Cellular Conquest) is a standalone HTML5 canvas game featuring a three-way territorial battle on a hexagonal grid. The entire game is contained in a single self-contained HTML file with embedded CSS and JavaScript.

## Architecture

### Single-File Structure
The game is built as `hex-conquest-standalone.html` with three main sections:
- **CSS Styles** (lines 7-99): UI styling for dark theme, buttons, and canvas
- **HTML Structure** (lines 101-125): Canvas, controls, and legend display
- **JavaScript Game Logic** (lines 127-539): Complete game implementation

### Core Game Systems

**Hexagonal Grid System** (lines 141-221)
- Grid consists of hexagonal cells arranged in offset rows
- Hex dimensions calculated using `hexRadius` (15px) to derive `hexWidth` and `hexHeight`
- Function `getHexCenter(row, col)` calculates pixel coordinates for each hex
- Function `getNeighbors(row, col)` handles even/odd row offset logic for hexagonal adjacency

**Cell State Management** (lines 158-175, 262-304)
- Each grid cell has: `color` (0=orange, 1=white/gray, 2=blue), `strength` (0-5), `lastChanged` timestamp
- Grid updates every 5 frames using cellular automata rules
- Cells weaken when surrounded by different colors, flip when strength reaches 0
- Cells strengthen when surrounded by same color

**Catalyst/Agent System** (lines 177-213, 306-461)
- Three mobile agents (one per color) that move across the canvas
- Two behavioral modes: 'hunt' mode (attraction, marked with +) and 'repel' mode (pushing away, marked with −)
- Agents use force-based movement with attraction/repulsion dynamics
- Smart targeting system samples 20 random grid positions to find high-value enemy territory
- Direct contact with grid cells converts them immediately to agent's color at max strength
- Collision detection and elastic response between agents

**Rendering** (lines 240-260, 463-507)
- Canvas size: 1000x700 pixels
- Hex cells drawn with alpha blending based on strength
- Agents rendered with radial gradient glow effects
- Dark theme with color palette defined in `colors` array

**Animation Loop** (lines 509-522)
- `frameCount` tracks global time
- Grid updates throttled to every 5 frames for performance
- Catalyst updates run every frame

## Running the Game

Open `hex-conquest-standalone.html` directly in any modern web browser. No build step, server, or dependencies required.

## Game Controls

- **Pause/Resume button**: Toggles animation
- **Reset button**: Reinitializes grid and agents to starting positions

## Making Modifications

Key parameters to adjust game behavior:
- `hexRadius` (line 142): Changes grid density
- `attractionDistance`, `repulsionDistance`, `attractionStrength`, `repulsionStrength` (lines 307-310): Modify agent interaction dynamics
- `maxSpeed` (line 395): Controls agent movement speed
- `impactRadius` (line 413): Changes area of influence for agents
- Color definitions in `colors` array (lines 149-153)

When modifying the grid update logic, ensure changes are applied to `newGrid` and then copied back to `grid` to prevent mid-update contamination (lines 263, 299-303).