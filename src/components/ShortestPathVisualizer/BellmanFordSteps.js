/**
 * Generate the step-by-step instructions (array of steps) for Bellman-Ford.
 * Return an array of step objects, and also set the final shortestPathResult in the parent.
 */
export function generateBellmanFordSteps({
  nodes,
  edges,
  selectedSourceNode,
  graphParams,
  setShortestPathResult,
}) {
  const sourceNodeId = selectedSourceNode != null ? selectedSourceNode : graphParams.sourceNode;
  const steps = [];
  const dist = {};
  const prev = {};
  let hasNegativeCycle = false;

  // Explanation snippet
  const bfStepsText = [
    "1. Initialize distances (source=0, others=∞)",
    "2. For i=1 to |V|-1: Relax all edges",
    "3. Check for negative cycles by a final pass",
  ];

  // Init
  for (let i = 0; i < nodes.length; i++) {
    dist[i] = i === sourceNodeId ? 0 : Infinity;
    prev[i] = null;
  }
  steps.push({
    explanation: `Distances init. Source ${nodes[sourceNodeId]?.label}=0, others=∞`,
    algorithmStep: bfStepsText[0],
    visitedNodes: [],
    distanceArray: { ...dist },
    iterationCount: 0,
    negativeCycleDetected: false,
    edgeUpdates: [],
    pathEdgeUpdates: [], // Added for path tracking
  });

  // Relax edges up to |V|-1 times
  for (let i = 1; i < nodes.length; i++) {
    let relaxedAnyEdge = false;
    steps.push({
      explanation: `Iteration ${i} of ${nodes.length - 1}`,
      algorithmStep: bfStepsText[1],
      visitedNodes: [],
      distanceArray: { ...dist },
      iterationCount: i,
      negativeCycleDetected: false,
      edgeUpdates: [],
      pathEdgeUpdates: [], // Added for path tracking
    });

    for (const edge of edges) {
      const { source, target, weight, id } = edge;
      // If dist[source] is ∞, skip
      if (dist[source] === Infinity) {
        steps.push({
          explanation: `Edge ${nodes[source]?.label}→${nodes[target]?.label} skip (unreachable)`,
          algorithmStep: bfStepsText[1],
          visitedNodes: [],
          distanceArray: { ...dist },
          iterationCount: i,
          negativeCycleDetected: false,
          edgeUpdates: [{ id, status: 'excluded' }],
          pathEdgeUpdates: [], // Added for path tracking
        });
        continue;
      }

      // Mark candidate
      steps.push({
        explanation: `Check edge ${nodes[source]?.label}→${nodes[target]?.label} (w=${weight})`,
        algorithmStep: bfStepsText[1],
        visitedNodes: [],
        distanceArray: { ...dist },
        iterationCount: i,
        negativeCycleDetected: false,
        edgeUpdates: [{ id, status: 'candidate' }],
        pathEdgeUpdates: [], // Added for path tracking
      });

      const newDist = dist[source] + weight;
      if (newDist < dist[target]) {
        const oldDist = dist[target];
        dist[target] = newDist;
        prev[target] = source;
        relaxedAnyEdge = true;

        steps.push({
          explanation: `Relaxed edge. Dist to ${nodes[target]?.label} from ${
            oldDist === Infinity ? '∞' : oldDist
          } → ${newDist}`,
          algorithmStep: bfStepsText[1],
          visitedNodes: [],
          distanceArray: { ...dist },
          iterationCount: i,
          negativeCycleDetected: false,
          edgeUpdates: [{ id, status: 'included' }], // Changed from 'relaxed' to 'included'
          pathEdgeUpdates: [id], // Added to track this edge in the path
        });
      } else {
        steps.push({
          explanation: `No improvement for ${nodes[target]?.label}. Dist remains ${dist[target]}`,
          algorithmStep: bfStepsText[1],
          visitedNodes: [],
          distanceArray: { ...dist },
          iterationCount: i,
          negativeCycleDetected: false,
          edgeUpdates: [{ id, status: 'excluded' }],
          pathEdgeUpdates: [], // Added for path tracking
        });
      }
    }

    if (!relaxedAnyEdge) {
      steps.push({
        explanation: `No edges relaxed in iteration ${i}. Early stop.`,
        algorithmStep: bfStepsText[1],
        visitedNodes: [],
        distanceArray: { ...dist },
        iterationCount: i,
        negativeCycleDetected: false,
        edgeUpdates: [],
        pathEdgeUpdates: [], // Added for path tracking
      });
      break;
    }
  }

  // Check negative cycles
  steps.push({
    explanation: `Check for negative cycles`,
    algorithmStep: bfStepsText[2],
    visitedNodes: [],
    distanceArray: { ...dist },
    iterationCount: nodes.length,
    negativeCycleDetected: false,
    edgeUpdates: [],
    pathEdgeUpdates: [], // Added for path tracking
  });

  for (const edge of edges) {
    const { source, target, weight, id } = edge;
    if (dist[source] !== Infinity && dist[source] + weight < dist[target]) {
      hasNegativeCycle = true;
      steps.push({
        explanation: `Negative cycle found via edge ${nodes[source]?.label}→${nodes[target]?.label}`,
        algorithmStep: bfStepsText[2],
        visitedNodes: [],
        distanceArray: { ...dist },
        iterationCount: nodes.length,
        negativeCycleDetected: true,
        edgeUpdates: [{ id, status: 'negativecycle' }],
        pathEdgeUpdates: [], // Added for path tracking
      });
      break;
    }
  }

  // Final step
  if (!hasNegativeCycle) {
    steps.push({
      explanation: `Bellman-Ford complete. No negative cycle.`,
      algorithmStep: 'Done',
      visitedNodes: [],
      distanceArray: { ...dist },
      iterationCount: nodes.length,
      negativeCycleDetected: false,
      edgeUpdates: [],
      pathEdgeUpdates: [], // Added for path tracking
    });

    // Build paths
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
    setShortestPathResult({ distances: dist, paths });
  } else {
    // Negative cycle => no definitive shortest path
    setShortestPathResult({ distances: dist, paths: {} });
  }

  return steps;
}