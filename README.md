# Shortest Path Algorithm Visualizer

An interactive web application for visualizing Dijkstra's algorithm and the Bellman-Ford algorithm in action. Built to make graph algorithms more accessible and easier to understand through visual representation.

![Shortest Path Algorithm Visualizer](./screenshot.png)

**[🚀 Try it live: shortest-path-visualizer-pi.vercel.app](https://shortest-path-visualizer-pi.vercel.app)**


## Motivation

While studying for Harvard's COMPSCI 1240 (Design and Analysis of Algorithms) Midterm, I found myself struggling to fully understand the nuances of shortest path algorithms by just reading textbooks or watching lecture videos. I searched for interactive tools that could help me visualize these algorithms step-by-step, but couldn't find any that matched what I needed.

So I decided to build one myself! This project was born out of a genuine need to better understand these fundamental algorithms through visualization, and I'm sharing it in the hope that it can help other students facing similar challenges.

## Features

- **Interactive Graph Visualization**: Clearly see how algorithms traverse graphs to find shortest paths
- **Two Algorithm Implementations**:
  - Dijkstra's algorithm (for graphs with non-negative edge weights)
  - Bellman-Ford algorithm (handles negative edge weights and detects negative cycles)
- **Step-by-Step Execution**: Watch algorithms progress one step at a time with detailed explanations
- **Dynamic Data Structure Visualization**: 
  - See priority queues and distance arrays update in real-time
  - Visualize iterations and negative cycle detection for Bellman-Ford
- **Graph Creation Options**:
  - Auto-generate random graphs with configurable parameters
  - Manual mode for creating custom graphs from scratch
  - Control edge density, node count, and weight ranges
- **Educational Features**:
  - Algorithm reference guide with pseudocode
  - Color-coded edges and nodes to indicate algorithm state
  - Detailed explanations at each step

## Technologies Used

- React.js
- Tailwind CSS
- JavaScript (ES6+)
- Lodash

## Installation and Usage

### Live Demo
The easiest way to try the application is through the live demo:
**[shortest-path-visualizer-pi.vercel.app](https://shortest-path-visualizer-pi.vercel.app)**

### Local Setup
If you prefer to run the application locally:

### Prerequisites
- Node.js (v14.0 or higher)
- npm (v6.0 or higher)

### Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/shortest-path-visualizer.git
   cd shortest-path-visualizer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### How to Use

1. **Select an Algorithm**: Choose between Dijkstra's algorithm and Bellman-Ford
2. **Set Up a Graph**: 
   - Use auto-generate mode with custom parameters, or
   - Switch to manual mode to create your own graph
3. **Visualization Controls**:
   - Start: Begin the animation
   - Step: Move through the algorithm one step at a time
   - Reset: Clear the current execution
   - Show: Skip to the final result
4. **Learn**: Read the explanations for each step and refer to the algorithm reference

## Project Structure

```
src/
├── components/
│   └── ShortestPathVisualizer/
│       ├── ShortestPathVisualizer.js  # Main component
│       ├── GraphRenderer.js           # Renders nodes and edges
│       ├── AlgorithmVisualizer.js     # Shows algorithm state
│       ├── GraphGeneration.js         # Graph creation logic
│       ├── DijkstraSteps.js           # Dijkstra algorithm logic
│       └── BellmanFordSteps.js        # Bellman-Ford algorithm logic
└── App.js                           # Root component
```

## Contributing

I built this project as an educational tool, and I'd love for it to grow with contributions from the community. Whether you're fixing bugs, adding features, or improving documentation, all contributions are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- Additional algorithms (A*, Floyd-Warshall, etc.)
- More visualization options
- Performance improvements
- Mobile responsiveness enhancements
- Additional educational features
- Accessibility improvements

## About Me

I'm a junior at Harvard studying Computer Science with a passion for making complex topics more accessible through interactive tools. I believe visualization is a powerful way to understand algorithms and data structures, and I hope this project helps others in their learning journey.

Feel free to reach out with questions, suggestions, or just to connect!

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Thanks to all the professors and TFs in Harvard's CS department who've helped deepen my understanding of algorithms
- Inspired by various other algorithm visualization tools that have helped me learn
- Built with React and Tailwind CSS

---

Happy learning! 🍎
