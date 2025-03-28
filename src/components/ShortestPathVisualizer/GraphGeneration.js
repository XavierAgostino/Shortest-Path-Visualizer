/**
 * Generates a random directed graph with or without negative edges,
 * ensures connectivity from a chosen source node, etc.
 * Optimized for visual clarity and educational purpose.
 */
export function generateRandomGraph({ svgRef, graphParams, algorithm }) {
  // Adjust weight ranges based on algorithm type
  let { nodeCount, density, minWeight, maxWeight, allowNegativeEdges } = graphParams;
  
  // Algorithm-specific adjustments
  if (algorithm === 'dijkstra') {
    // Smaller weight range for Dijkstra (1-15)
    minWeight = 1;
    maxWeight = 15;
    
    // Slightly increase edge density for Dijkstra to show more path options
    density = Math.min(density * 1.15, 0.5);
  } else if (algorithm === 'bellmanford') {
    // Larger weight values for Bellman-Ford
    minWeight = Math.max(minWeight, 2);
    maxWeight = Math.max(maxWeight, 25);
  }

  const svgWidth = svgRef.current.clientWidth;
  const svgHeight = svgRef.current.clientHeight;
  
  // Check if we're on mobile based on user agent and viewport width
  const isMobile = 
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || 
     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
       navigator.userAgent
     ));

  // Pick a source node at random but preferably one with a "nice" position in the circle
  const sourceNodeIdx = Math.floor(Math.random() * nodeCount);
  
  // Initialize negative cycle detection flag
  let hasNegativeCycle = false;

  // Create nodes in a circle layout with optimized spacing
  const newNodes = [];
  
  // Calculate optimal radius based on screen size and node count
  // More nodes = slightly larger radius to avoid crowding
  const baseRadius = Math.min(svgWidth, svgHeight) / (isMobile ? 2.8 : 3.2);
  const scaleFactor = 1 + (nodeCount > 8 ? (nodeCount - 8) * 0.03 : 0);
  let radius = baseRadius * scaleFactor;
  radius = Math.max(radius, isMobile ? 120 : 150); // Enforce minimum radius
  
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Reduce randomness as node count increases to avoid overlaps
  const getNodePlacementVariance = (count) => {
    // Less variance with more nodes, scales down progressively
    if (count <= 5) return isMobile ? 15 : 20;       // Few nodes: more freedom
    if (count <= 8) return isMobile ? 10 : 15;       // Medium: moderate freedom
    if (count <= 12) return isMobile ? 7 : 10;       // Many: limited freedom
    return isMobile ? 4 : 6;                         // Lots: minimal freedom
  };

  // Calculate the radiusVariance based on node count
  const radiusVariance = getNodePlacementVariance(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    // Perfect division around the circle
    const angle = (i * 2 * Math.PI) / nodeCount;
    
    // Apply smaller random offset to radius for natural look
    // More nodes = less randomness
    const randomOffset = (Math.random() * 2 - 1) * radiusVariance;
    const nodeRadius = radius + randomOffset;
    
    // Apply very slight random offset to angle for natural look
    // More nodes = less angle variance to prevent overlaps
    const angleVariance = Math.PI / (180 * Math.max(1, nodeCount / 4)); // scales down as nodes increase
    const angleOffset = (Math.random() * 2 - 1) * angleVariance;
    const finalAngle = angle + angleOffset;
    
    newNodes.push({
      id: i,
      x: centerX + nodeRadius * Math.cos(finalAngle),
      y: centerY + nodeRadius * Math.sin(finalAngle),
      label: String.fromCharCode(65 + i),
    });
  }

  // Potential edges (directed)
  const possibleEdges = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (i !== j) {
        // Calculate distance and angular distance (how far around the circle)
        const dist = Math.sqrt(
          (newNodes[j].x - newNodes[i].x) ** 2 + (newNodes[j].y - newNodes[i].y) ** 2
        );
        
        // Calculate how far apart nodes are in the circle (0 to nodeCount/2)
        const circleDistance = Math.min(
          Math.abs(i - j),
          nodeCount - Math.abs(i - j)
        );
        
        // Modify edge preference based on algorithm
        let circleDistanceFactor;
        if (algorithm === 'dijkstra') {
          // For Dijkstra, emphasize more diverse path options with varying weights
          // Prefer a mix of short and medium-distance edges to showcase greedy selection
          circleDistanceFactor = 1 + (circleDistance * 0.15); // Less penalty for distance
        } else {
          // For Bellman-Ford, keep the original formula
          circleDistanceFactor = 1 + (circleDistance * 0.2);
        }
        
        // Adjusted distance that factors in both physical distance and circle position
        const adjustedDist = dist * circleDistanceFactor;
        
        possibleEdges.push({ 
          source: i, 
          target: j, 
          distance: dist,
          adjustedDistance: adjustedDist,
          circleDistance: circleDistance 
        });
      }
    }
  }

  // Sort by adjusted distance (which prioritizes "neighboring" nodes)
  possibleEdges.sort((a, b) => a.adjustedDistance - b.adjustedDistance);
  
  // We want to ensure connectivity from source using a more BFS-like approach
  // This creates a more organized "spanning tree" from the source
  const connectedNodes = new Set([sourceNodeIdx]);
  const treeEdges = [];
  
  // First, create a simple spanning structure that connects all nodes
  // in a way that looks more organized than purely shortest-distance
  
  // Queue-based approach (breadth-first-search style)
  let queue = [sourceNodeIdx];
  let processed = new Set([sourceNodeIdx]);
  
  while (connectedNodes.size < nodeCount) {
    if (queue.length === 0) {
      // If queue is empty but we haven't connected all nodes,
      // add a random connected node back to the queue
      const connectedArray = Array.from(connectedNodes);
      queue.push(connectedArray[Math.floor(Math.random() * connectedArray.length)]);
    }
    
    const currentNode = queue.shift();
    
    // Find nodes that are not yet connected, prioritizing closer ones
    const candidates = possibleEdges
      .filter(e => e.source === currentNode && !connectedNodes.has(e.target))
      .sort((a, b) => a.adjustedDistance - b.adjustedDistance);
    
    if (candidates.length > 0) {
      // Take the best candidate (closest with shortest adjusted distance)
      const bestEdge = candidates[0];
      treeEdges.push(bestEdge);
      connectedNodes.add(bestEdge.target);
      
      // Add the newly connected node to the queue
      if (!processed.has(bestEdge.target)) {
        queue.push(bestEdge.target);
        processed.add(bestEdge.target);
      }
    }
  }

  // Convert these tree edges to final edges
  const newEdges = [];
  const edgeSet = new Set(); // Track edges we've already added
  
  const addEdge = (edge) => {
    // Skip if we've already added this exact edge
    const edgeKey = `${edge.source}-${edge.target}`;
    if (edgeSet.has(edgeKey)) return;
    edgeSet.add(edgeKey);
    
    // Check if the opposite direction edge already exists
    const oppositeEdgeKey = `${edge.target}-${edge.source}`;
    const hasOppositeEdge = edgeSet.has(oppositeEdgeKey);
    
    // If we already have an edge in the opposite direction, 
    // consider skipping this one to avoid bidirectional edges
    // Skip with 80% probability to reduce bidirectional edges
    if (hasOppositeEdge && Math.random() < 0.8) {
      return;
    }
    
    // Generate weights with algorithm-specific range
    const weightRange = maxWeight - minWeight + 1;
    
    let w;
    
    if (algorithm === 'dijkstra') {
      // For Dijkstra: create a more varied distribution of weights
      // with some clustering to showcase the greedy selection better
      if (Math.random() < 0.3) {
        // Small weights (emphasize shorter paths)
        w = Math.floor(Math.random() * 5) + minWeight;
      } else if (Math.random() < 0.7) {
        // Medium weights (most common)
        w = Math.floor(Math.random() * 7) + minWeight + 4;
      } else {
        // Larger weights (few, to have some challenging paths)
        w = Math.floor(Math.random() * 5) + maxWeight - 4;
      }
    } else if (algorithm === 'bellmanford') {
      // For Bellman-Ford: more uniform distribution with occasional extremes
      if (Math.random() < 0.7) {
        // Standard weights
        w = Math.floor(Math.random() * weightRange) + minWeight;
      } else {
        // Occasional larger weights to emphasize algorithm's capability
        w = Math.floor(Math.random() * 10) + maxWeight - 9;
      }
      
      // Negative edges logic - only allow if using Bellman-Ford
      // Increase probability slightly to make them more prominent
      if (allowNegativeEdges && Math.random() < 0.25) {
        // More significant negative weights (-1 to -12)
        w = -Math.floor(Math.random() * 12 + 1);
      }
    } else {
      // Default weight calculation for any other algorithm
      w = Math.floor(Math.random() * weightRange) + minWeight;
    }
    
    // Add extra metadata for edges
    newEdges.push({
      id: edgeKey,
      source: edge.source,
      target: edge.target,
      weight: w,
      status: 'unvisited',
      hasBidirectional: false,
      circleDistance: edge.circleDistance,
      // Flag negative edges to style them differently
      isNegative: w < 0
    });
  };
  
  // Add all tree edges to ensure connectivity
  treeEdges.forEach((e) => addEdge(e));

  // Calculate a density that scales down as node count increases
  // to keep the graph readable
  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  
  // Adaptive density - reduces automatically for larger graphs
  // Density capped at 0.5 (50%) to prevent overcrowding
  const maxDensity = Math.min(0.5, 0.8 - (nodeCount * 0.04));
  
  // Adjust density for mobile to reduce edge clutter
  // For Dijkstra, allow slightly higher density to show more path options
  const densityMultiplier = algorithm === 'dijkstra' ? 1.05 : 1.0;
  const effectiveDensity = isMobile 
    ? Math.min(density * densityMultiplier, maxDensity * 0.7) 
    : Math.min(density * densityMultiplier, maxDensity);
  
  const targetEdgeCount = Math.ceil(maxPossibleEdges * effectiveDensity);
  const remainingEdgeCount = Math.max(0, targetEdgeCount - treeEdges.length);

  // Prioritize edges that create cleaner layouts
  // Prefer edges between nodes that are close in the circle
  // and avoid creating bidirectional edges or crossing the center
  const shuffled = [...possibleEdges].filter(edge => {
    // Skip edge if it would create a bidirectional edge (80% of the time)
    const oppositeEdgeKey = `${edge.target}-${edge.source}`;
    if (edgeSet.has(oppositeEdgeKey) && Math.random() < 0.8) {
      return false;
    }
    
    // Skip edges that cross directly through the center (50% of the time)
    // These are edges between almost opposite nodes on the circle
    const circleDistanceRatio = edge.circleDistance / (nodeCount / 2);
    
    // For Dijkstra, allow a few more long-distance edges to create 
    // interesting path choices that demonstrate greedy selection
    const skipProbability = algorithm === 'dijkstra' ? 0.4 : 0.5;
    if (circleDistanceRatio > 0.8 && Math.random() < skipProbability) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Factor in both geometric distance and position in the circle
    // with some randomness to avoid too regular patterns
    const aScore = a.adjustedDistance + Math.random() * 20;
    const bScore = b.adjustedDistance + Math.random() * 20;
    return aScore - bScore;
  });
  
  // Add additional edges up to target density
  for (let i = 0; i < remainingEdgeCount && i < shuffled.length; i++) {
    addEdge(shuffled[i]);
  }

  // Create a small negative cycle if appropriate
  if (algorithm === 'bellmanford' && allowNegativeEdges && Math.random() < 0.4) { // Increased probability
    // Create a small negative cycle using a sequence of distinct nodes
    const cycleSize = Math.min(3, Math.floor(nodeCount / 2)); // Keep cycle size reasonable 
    let startPos = Math.floor(Math.random() * nodeCount);
    
    // Create array of node indices for the cycle (no duplicate nodes)
    const cycleNodes = [];
    for (let i = 0; i < cycleSize; i++) {
      cycleNodes.push((startPos + i) % nodeCount);
    }
    
    // Add edges to form a cycle
    let totalWeight = 0;
    const cycleEdges = [];
    
    for (let i = 0; i < cycleSize; i++) {
      const source = cycleNodes[i];
      const target = cycleNodes[(i + 1) % cycleSize];
      
      // Ensure no bidirectional edges
      const oppositeKey = `${target}-${source}`;
      if (edgeSet.has(oppositeKey)) {
        // Remove the opposite edge if it exists
        const edgeToRemoveIndex = newEdges.findIndex(e => 
          e.source === target && e.target === source
        );
        if (edgeToRemoveIndex !== -1) {
          newEdges.splice(edgeToRemoveIndex, 1);
          edgeSet.delete(oppositeKey);
        }
      }
      
      // Check if this edge already exists
      const edgeKey = `${source}-${target}`;
      const existingEdgeIndex = newEdges.findIndex(e => 
        e.source === source && e.target === target
      );
      
      let weight = Math.floor(Math.random() * 10) + 1; // Slightly larger weights for cycle visualization
      totalWeight += weight;
      
      if (existingEdgeIndex !== -1) {
        newEdges[existingEdgeIndex].weight = weight;
        newEdges[existingEdgeIndex].inNegativeCycle = true; // Mark as part of a negative cycle
        cycleEdges.push(newEdges[existingEdgeIndex]);
      } else {
        const newEdge = {
          id: edgeKey,
          source,
          target,
          weight,
          status: 'unvisited',
          hasBidirectional: false,
          circleDistance: 1, // Adjacent nodes in cycle
          inNegativeCycle: true // Mark as part of a negative cycle
        };
        newEdges.push(newEdge);
        edgeSet.add(edgeKey);
        cycleEdges.push(newEdge);
      }
    }
    
    // Make the cycle negative by making one edge negative enough
    if (totalWeight > 0 && cycleEdges.length === cycleSize) {
      const edgeToMakeNegative = cycleEdges[cycleSize - 1];
      edgeToMakeNegative.weight = -(totalWeight + Math.floor(Math.random() * 3) + 1); // Slightly more negative
      edgeToMakeNegative.isNegative = true;
      hasNegativeCycle = true;
    }
  }

  const newParams = {
    ...graphParams,
    sourceNode: sourceNodeIdx,
    hasNegativeCycle,
    algorithm // Include algorithm type in params for reference
  };

  return { newNodes, newEdges, newParams };
}