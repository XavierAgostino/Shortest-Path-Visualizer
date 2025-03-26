/**
 * Generates a random directed graph with or without negative edges,
 * ensures connectivity from a chosen source node, etc.
 */
export function generateRandomGraph({ svgRef, graphParams, algorithm }) {
    const { nodeCount, density, minWeight, maxWeight, allowNegativeEdges } = graphParams;
  
    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;
  
    // Pick a random source node
    const sourceNodeIdx = Math.floor(Math.random() * nodeCount);
  
    // Create nodes in a circle layout
    const newNodes = [];
    let radius = Math.min(svgWidth, svgHeight) / 3 - 30;
    radius = Math.max(radius, 40);
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
  
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i * 2 * Math.PI) / nodeCount;
      const randomOffset = Math.random() * 20 - 10;
      const nodeRadius = radius + randomOffset;
      newNodes.push({
        id: i,
        x: centerX + nodeRadius * Math.cos(angle),
        y: centerY + nodeRadius * Math.sin(angle),
        label: String.fromCharCode(65 + i),
      });
    }
  
    // Potential edges (directed)
    const possibleEdges = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 0; j < nodeCount; j++) {
        if (i !== j) {
          const dist = Math.sqrt(
            (newNodes[j].x - newNodes[i].x) ** 2 + (newNodes[j].y - newNodes[i].y) ** 2
          );
          possibleEdges.push({ source: i, target: j, distance: dist });
        }
      }
    }
  
    // Sort by distance
    possibleEdges.sort((a, b) => a.distance - b.distance);
  
    // We want to ensure connectivity from source. We'll build a small "spanning tree" from the source.
    const connectedNodes = new Set([sourceNodeIdx]);
    const treeEdges = [];
    while (connectedNodes.size < nodeCount) {
      let bestEdge = null;
      let bestDist = Infinity;
      for (const e of possibleEdges) {
        if (connectedNodes.has(e.source) && !connectedNodes.has(e.target)) {
          if (e.distance < bestDist) {
            bestDist = e.distance;
            bestEdge = e;
          }
        }
      }
      if (!bestEdge) break;
      treeEdges.push(bestEdge);
      connectedNodes.add(bestEdge.target);
  
      // Remove from possibleEdges to avoid duplicates
      const idx = possibleEdges.findIndex(
        (x) => x.source === bestEdge.source && x.target === bestEdge.target
      );
      if (idx !== -1) possibleEdges.splice(idx, 1);
    }
  
    // Convert these tree edges to final edges
    const newEdges = [];
    const addEdge = (edge) => {
      let w = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
      // If negative edges allowed and it's Bellman-Ford, allow negative
      if (allowNegativeEdges && algorithm === 'bellmanford' && Math.random() < 0.3) {
        w = -Math.floor(Math.random() * Math.min(10, minWeight));
      }
      
      // Check if the opposite direction edge already exists
      const oppositeEdgeIndex = newEdges.findIndex(
        e => e.source === edge.target && e.target === edge.source
      );
      
      // If we have an edge in the opposite direction, set a flag so we can render differently
      const hasBidirectional = oppositeEdgeIndex !== -1;
      
      newEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        weight: w,
        status: 'unvisited',
        hasBidirectional: hasBidirectional // Add this flag
      });
      
      // Also update the opposite edge if it exists
      if (hasBidirectional) {
        newEdges[oppositeEdgeIndex].hasBidirectional = true;
      }
    };
    treeEdges.forEach((e) => addEdge(e));
  
    // Then fill up to the desired density
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const targetEdgeCount = Math.ceil(maxPossibleEdges * density);
    const remainingEdgeCount = Math.max(0, targetEdgeCount - treeEdges.length);
  
    // Shuffle possibleEdges
    const shuffled = [...possibleEdges].sort(() => Math.random() - 0.5);
    for (let i = 0; i < remainingEdgeCount && i < shuffled.length; i++) {
      addEdge(shuffled[i]);
    }
  
    // Possibly embed a negative cycle
    let hasNegativeCycle = false;
    if (algorithm === 'bellmanford' && allowNegativeEdges && Math.random() < 0.3) {
      // Create a simple negative cycle of 3-4 nodes
      const cycleSize = Math.floor(Math.random() * 2) + 3; // 3 or 4
      const cycleNodes = Array.from({ length: cycleSize }, () => 
        Math.floor(Math.random() * nodeCount)
      );
      
      // Add edges to form a cycle
      let totalWeight = 0;
      for (let i = 0; i < cycleSize; i++) {
        const source = cycleNodes[i];
        const target = cycleNodes[(i + 1) % cycleSize];
        
        // Check if this edge already exists
        const existingEdgeIndex = newEdges.findIndex(e => 
          e.source === source && e.target === target
        );
        
        let weight = Math.floor(Math.random() * 10) + 1;
        totalWeight += weight;
        
        if (existingEdgeIndex !== -1) {
          newEdges[existingEdgeIndex].weight = weight;
        } else {
          newEdges.push({
            id: `${source}-${target}`,
            source,
            target,
            weight,
            status: 'unvisited',
            hasBidirectional: false
          });
          
          // Check and update bidirectional status
          const oppositeEdgeIndex = newEdges.findIndex(e => 
            e.source === target && e.target === source
          );
          if (oppositeEdgeIndex !== -1) {
            newEdges[newEdges.length - 1].hasBidirectional = true;
            newEdges[oppositeEdgeIndex].hasBidirectional = true;
          }
        }
      }
      
      // Make the cycle negative by making one edge large negative
      if (totalWeight > 0) {
        const randomEdgeIndex = Math.floor(Math.random() * cycleSize);
        const source = cycleNodes[randomEdgeIndex];
        const target = cycleNodes[(randomEdgeIndex + 1) % cycleSize];
        
        const edgeIndex = newEdges.findIndex(e => 
          e.source === source && e.target === target
        );
        
        if (edgeIndex !== -1) {
          newEdges[edgeIndex].weight = -(totalWeight + Math.floor(Math.random() * 5) + 1);
          hasNegativeCycle = true;
        }
      }
    }
  
    const newParams = {
      ...graphParams,
      sourceNode: sourceNodeIdx,
      hasNegativeCycle,
    };
  
    return { newNodes, newEdges, newParams };
  }