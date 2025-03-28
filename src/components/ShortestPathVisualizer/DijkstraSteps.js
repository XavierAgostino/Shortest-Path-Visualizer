/**
 * Generate the step-by-step instructions (array of steps) for Dijkstra's algorithm.
 * Return an array of step objects, and also set the final shortestPathResult in the parent.
 */
export function generateDijkstraSteps({
  nodes,
  edges,
  selectedSourceNode,
  graphParams,
  setShortestPathResult,
}) {
  const sourceNodeId = selectedSourceNode != null ? selectedSourceNode : graphParams.sourceNode;

  const steps = [];
  const visited = new Set();
  const dist = {};
  const prev = {};
  let pq = [];

  // Explanation snippet
  const dijkstraStepsText = [
    "1. Initialize distances (source=0, others=∞)",
    "2. Push source into priority queue",
    "3. While queue not empty, pop min-dist node, mark visited",
    "4. Relax all outgoing edges if it improves distance",
  ];

  // Initialize
  for (let i = 0; i < nodes.length; i++) {
    dist[i] = i === sourceNodeId ? 0 : Infinity;
    prev[i] = null;
  }
  steps.push({
    explanation: `Distances initialized. Source ${nodes[sourceNodeId]?.label} = 0, rest = ∞`,
    algorithmStep: dijkstraStepsText[0],
    visitedNodes: [...visited],
    minHeap: [],
    distanceArray: { ...dist },
    edgeUpdates: [],
    pathEdgeUpdates: [], // Added for path tracking
    updatedDistances: [sourceNodeId], // Mark source node as initially updated
    currentEdgeBeingRelaxed: null,
  });

  // Put source in PQ
  pq.push({ id: sourceNodeId, dist: 0 });
  steps.push({
    explanation: `Source ${nodes[sourceNodeId]?.label} added to priority queue.`,
    algorithmStep: dijkstraStepsText[1],
    visitedNodes: [...visited],
    minHeap: [...pq],
    distanceArray: { ...dist },
    edgeUpdates: [],
    pathEdgeUpdates: [], // Added for path tracking
    updatedDistances: [], // No distances updated in this step
    currentEdgeBeingRelaxed: null,
  });

  // Main loop
  while (pq.length > 0) {
    // Sort PQ
    pq.sort((a, b) => a.dist - b.dist);
    const current = pq.shift();
    const currentId = current.id;

    // If visited, skip
    if (visited.has(currentId)) {
      steps.push({
        explanation: `Node ${nodes[currentId]?.label} already visited, skipping.`,
        algorithmStep: dijkstraStepsText[2],
        visitedNodes: [...visited],
        minHeap: [...pq],
        distanceArray: { ...dist },
        edgeUpdates: [],
        pathEdgeUpdates: [], // Added for path tracking
        updatedDistances: [],
        currentEdgeBeingRelaxed: null,
      });
      continue;
    }

    // Mark visited
    visited.add(currentId);
    steps.push({
      explanation: `Extracted node ${nodes[currentId]?.label}, distance=${dist[currentId]}. Mark visited.`,
      algorithmStep: dijkstraStepsText[2],
      visitedNodes: [...visited],
      minHeap: [...pq],
      distanceArray: { ...dist },
      edgeUpdates: [],
      pathEdgeUpdates: [], // Added for path tracking
      updatedDistances: [],
      currentEdgeBeingRelaxed: null,
    });

    // Outgoing edges
    const outgoing = edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      const { target, weight, id } = edge;
      // If negative weight, skip for Dijkstra
      if (weight < 0) {
        steps.push({
          explanation: `Edge ${nodes[currentId]?.label}→${nodes[target]?.label} is negative. Skipping.`,
          algorithmStep: dijkstraStepsText[3],
          visitedNodes: [...visited],
          minHeap: [...pq],
          distanceArray: { ...dist },
          edgeUpdates: [{ id, status: 'excluded' }],
          pathEdgeUpdates: [], // Added for path tracking
          updatedDistances: [],
          currentEdgeBeingRelaxed: id, // Track current edge even if skipped
        });
        continue;
      }

      // Mark candidate
      steps.push({
        explanation: `Check edge ${nodes[currentId]?.label}→${nodes[target]?.label}, weight=${weight}.`,
        algorithmStep: dijkstraStepsText[3],
        visitedNodes: [...visited],
        minHeap: [...pq],
        distanceArray: { ...dist },
        edgeUpdates: [{ id, status: 'candidate' }],
        pathEdgeUpdates: [], // Added for path tracking
        updatedDistances: [],
        currentEdgeBeingRelaxed: id, // Track this edge as the one being considered
      });

      // Relax
      const newDist = dist[currentId] + weight;
      if (newDist < dist[target]) {
        const oldDist = dist[target];
        dist[target] = newDist;
        prev[target] = currentId;

        // Update or push in PQ
        const idx = pq.findIndex((x) => x.id === target);
        if (idx >= 0) {
          pq[idx].dist = newDist;
        } else {
          pq.push({ id: target, dist: newDist });
        }

        steps.push({
          explanation: `Relaxed edge. Distance to ${nodes[target]?.label} updated from ${
            oldDist === Infinity ? '∞' : oldDist
          } to ${newDist}.`,
          algorithmStep: dijkstraStepsText[3],
          visitedNodes: [...visited],
          minHeap: [...pq],
          distanceArray: { ...dist },
          edgeUpdates: [{ id, status: 'included' }], // Changed from 'relaxed' to 'included'
          pathEdgeUpdates: [id], // Added to track this edge in the path
          updatedDistances: [target], // Track this node as having an updated distance
          currentEdgeBeingRelaxed: id, // Keep tracking the current edge
        });
      } else {
        steps.push({
          explanation: `No improvement. Dist to ${nodes[target]?.label} remains ${dist[target]}.`,
          algorithmStep: dijkstraStepsText[3],
          visitedNodes: [...visited],
          minHeap: [...pq],
          distanceArray: { ...dist },
          edgeUpdates: [{ id, status: 'excluded' }],
          pathEdgeUpdates: [], // Added for path tracking
          updatedDistances: [], // No distances updated
          currentEdgeBeingRelaxed: id, // Still track this edge
        });
      }
    }
  }

  // Final step
  steps.push({
    explanation: "Dijkstra complete. Distances finalized.",
    algorithmStep: "Done",
    visitedNodes: [...visited],
    minHeap: [],
    distanceArray: { ...dist },
    edgeUpdates: [],
    pathEdgeUpdates: [], // Added for path tracking
    updatedDistances: [],
    currentEdgeBeingRelaxed: null,
  });

  // Build final paths
  const paths = {};
  for (let i = 0; i < nodes.length; i++) {
    if (i !== sourceNodeId && dist[i] !== Infinity) {
      const path = [];
      let curr = i;
      while (curr !== null) {
        path.unshift(curr);
        curr = prev[curr];
      }
      paths[i] = path;
    }
  }

  // Let the parent store final results
  setShortestPathResult({ distances: dist, paths });
  return steps;
}