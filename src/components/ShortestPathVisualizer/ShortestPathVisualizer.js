import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';

import GraphRenderer from './GraphRenderer';
import { generateRandomGraph } from './GraphGeneration';
import { generateDijkstraSteps } from './DijkstraSteps';
import { generateBellmanFordSteps } from './BellmanFordSteps';
import AlgorithmVisualizer from './AlgorithmVisualizer';

const ShortestPathVisualizer = () => {
  // =========================
  //       STATE
  // =========================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const [graphParams, setGraphParams] = useState({
    nodeCount: 6,
    density: 0.5,
    minWeight: 1,
    maxWeight: 20,
    allowNegativeEdges: false,
    sourceNode: 0,
    hasNegativeCycle: false,
  });

  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [explanation, setExplanation] = useState('');
  const [shortestPathResult, setShortestPathResult] = useState({ distances: {}, paths: {} });
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showLegend, setShowLegend] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Algorithm-specific data structures
  const [distanceArray, setDistanceArray] = useState({});
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [minHeap, setMinHeap] = useState([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [negativeCycleDetected, setNegativeCycleDetected] = useState(false);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState('');

  // Manual mode enhancements
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);
  const [tempNode, setTempNode] = useState(null);
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [selectedDestNode, setSelectedDestNode] = useState(null);
  const [isSelectingSource, setIsSelectingSource] = useState(false);
  const [isSelectingDest, setIsSelectingDest] = useState(false);

  // Refs
  const svgRef = useRef(null);
  const animationFrameId = useRef(null);

  // =========================
  //   TOGGLE LEGEND & SIDEBAR
  // =========================
  const toggleLegend = () => setShowLegend(!showLegend);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  // =========================
  //   CLEAR GRAPH
  // =========================
  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep('');
    setExplanation('Graph cleared. You can now build a new graph from scratch.');
    setSelectedSourceNode(null);
    setSelectedDestNode(null);

    // Reset all algorithm-related states
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
  };

  // =========================
  //   HANDLE SPEED CHANGE
  // =========================
  const handleSpeedChange = (e) => {
    const value = parseInt(e.target.value);
    // Convert slider value (1-5) to ms (2000ms to 200ms)
    const speed = 2200 - value * 400;
    setAnimationSpeed(speed);
  };

  // =========================
  //   GENERATE RANDOM GRAPH
  // =========================
  const handleGenerateRandomGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep('');
    setExplanation('Random graph generated. Select an algorithm and press "Start" to begin.');

    if (!svgRef.current) return; // If the ref is not ready

    const { newNodes, newEdges, newParams } = generateRandomGraph({
      svgRef,
      graphParams,
      algorithm,
    });

    // Store results
    setGraphParams(newParams);
    setNodes(newNodes);
    setEdges(newEdges);

    // Also update selected source/dest
    setSelectedSourceNode(newParams.sourceNode);
    setSelectedDestNode(null);
  };

  // =========================
  //   ALGORITHM CHANGE
  // =========================
  const handleAlgorithmChange = (e) => {
    const newAlg = e.target.value;
    setAlgorithm(newAlg);

    // If switching to Dijkstra with negative edges, disable them
    if (newAlg === 'dijkstra' && graphParams.allowNegativeEdges) {
      setGraphParams({ ...graphParams, allowNegativeEdges: false });
      setExplanation("Switched to Dijkstra. Negative edges disabled as Dijkstra's doesn't support them.");
    }

    // Reset
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    resetGraph();
  };

  // =========================
  //   RESET GRAPH
  // =========================
  const resetGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);

    const resetEdges = edges.map((edge) => ({ ...edge, status: 'unvisited' }));
    setEdges(resetEdges);

    // Reset algorithm data
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep('');

    setExplanation('Graph reset. Select an algorithm and press "Start" to begin.');
  };

  // =========================
  //   PLAY / PAUSE
  // =========================
  const handlePlayPause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      setIsRunning(true);
      setIsPaused(false);
      if (steps.length === 0) {
        // Generate steps
        const stepList =
          algorithm === 'dijkstra'
            ? generateDijkstraSteps({
                nodes,
                edges,
                selectedSourceNode,
                graphParams,
                setShortestPathResult,
              })
            : generateBellmanFordSteps({
                nodes,
                edges,
                selectedSourceNode,
                graphParams,
                setShortestPathResult,
              });
        setSteps(stepList);
      }
    }
  };

  // =========================
  //   STEP-BY-STEP
  // =========================
  const handleStep = () => {
    if (steps.length === 0) {
      const stepList =
        algorithm === 'dijkstra'
          ? generateDijkstraSteps({
              nodes,
              edges,
              selectedSourceNode,
              graphParams,
              setShortestPathResult,
            })
          : generateBellmanFordSteps({
              nodes,
              edges,
              selectedSourceNode,
              graphParams,
              setShortestPathResult,
            });
      setSteps(stepList);
    }
    if (currentStep < steps.length) {
      applyStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  // =========================
  //   APPLY STEP
  // =========================
  const applyStep = (stepIndex) => {
    if (stepIndex >= steps.length) return;
    const step = steps[stepIndex];

    setExplanation(step.explanation);
    setCurrentAlgorithmStep(step.algorithmStep || '');

    if (step.visitedNodes) setVisitedNodes(new Set(step.visitedNodes));
    if (step.minHeap) setMinHeap([...step.minHeap]);
    if (step.distanceArray) setDistanceArray({ ...step.distanceArray });
    if (step.iterationCount !== undefined) setIterationCount(step.iterationCount);
    if (step.negativeCycleDetected !== undefined) setNegativeCycleDetected(step.negativeCycleDetected);

    // Update edges
    const newEdges = [...edges];
    step.edgeUpdates.forEach((update) => {
      const idx = newEdges.findIndex((e) => e.id === update.id);
      if (idx !== -1) {
        newEdges[idx] = { ...newEdges[idx], status: update.status };
      }
    });
    setEdges(newEdges);
  };

  // =========================
  //   SHOW FINAL SHORTEST PATHS
  // =========================
  const handleShowAnswer = () => {
    // If no steps yet, generate them
    if (steps.length === 0) {
      const stepList =
        algorithm === 'dijkstra'
          ? generateDijkstraSteps({
              nodes,
              edges,
              selectedSourceNode,
              graphParams,
              setShortestPathResult,
            })
          : generateBellmanFordSteps({
              nodes,
              edges,
              selectedSourceNode,
              graphParams,
              setShortestPathResult,
            });
      setSteps(stepList);
    }

    // Mark edges
    const newEdges = edges.map((e) => ({ ...e, status: 'unvisited' }));

    if (!negativeCycleDetected) {
      // Mark shortest path edges
      const { paths } = shortestPathResult;
      const pathEdgeIds = new Set();

      // If a destination is selected, only highlight that path
      if (selectedDestNode !== null && paths[selectedDestNode]) {
        const path = paths[selectedDestNode];
        for (let i = 0; i < path.length - 1; i++) {
          pathEdgeIds.add(`${path[i]}-${path[i + 1]}`);
        }
      } else {
        // Otherwise, highlight all paths
        Object.values(paths).forEach((path) => {
          for (let i = 0; i < path.length - 1; i++) {
            pathEdgeIds.add(`${path[i]}-${path[i + 1]}`);
          }
        });
      }

      // Update statuses
      newEdges.forEach((edge, index) => {
        if (pathEdgeIds.has(edge.id)) {
          newEdges[index].status = 'included';
        }
      });
    } else {
      // Negative cycle detected
      const { distances } = shortestPathResult;
      const cycleCandidates = edges.filter((edge) => {
        const { source, target, weight } = edge;
        if (distances[source] === undefined || distances[source] === Infinity) return false;
        return distances[source] + weight < distances[target];
      });
      cycleCandidates.forEach((edge) => {
        const idx = newEdges.findIndex((e) => e.id === edge.id);
        if (idx !== -1) {
          newEdges[idx].status = 'negativecycle';
        }
      });
    }

    setEdges(newEdges);
    setShowAnswer(true);
    setIsRunning(false);
    setIsPaused(false);

    if (negativeCycleDetected) {
      setExplanation(`${algorithm === 'dijkstra' ? "Dijkstra's" : 'Bellman-Ford'} detected a negative cycle. No shortest paths exist.`);
    } else {
      setExplanation(`${algorithm === 'dijkstra' ? "Dijkstra's" : 'Bellman-Ford'} complete. Shortest distances from ${nodes[selectedSourceNode]?.label} shown.`);
    }
  };

  // =========================
  //   HANDLE PARAM CHANGES
  // =========================
  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : parseFloat(value);

    // If toggling negative edges in Dijkstra
    if (name === 'allowNegativeEdges' && newValue && algorithm === 'dijkstra') {
      setExplanation("Warning: Dijkstra doesn't support negative edges. Switch to Bellman-Ford.");
    }

    setGraphParams({ ...graphParams, [name]: newValue });
  };

  // =========================
  //   SWITCH AUTO / MANUAL
  // =========================
  const handleModeChange = (e) => {
    setMode(e.target.value);
    resetGraph();
  };

  // =========================
  //   NODE & EDGE EVENTS
  // =========================
  const handleAddNodeMode = () => {
    setIsAddingNode(!isAddingNode);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleAddEdgeMode = () => {
    setIsAddingEdge(!isAddingEdge);
    setIsAddingNode(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleDeleteNodeMode = () => {
    setIsDeletingNode(!isDeletingNode);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleDeleteEdgeMode = () => {
    setIsDeletingEdge(!isDeletingEdge);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleSelectSourceMode = () => {
    setIsSelectingSource(!isSelectingSource);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleSelectDestMode = () => {
    setIsSelectingDest(!isSelectingDest);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setTempNode(null);
  };

  // When clicking on the SVG in "Add Node" mode
  const handleSvgClick = (e) => {
    if (!isAddingNode) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    const newId = nodes.length;
    const newNode = {
      id: newId,
      x,
      y,
      label: String.fromCharCode(65 + newId),
    };
    setNodes([...nodes, newNode]);
    setIsAddingNode(false);
  };

  // When a node is clicked
  const handleNodeClick = (nodeId) => {
    if (mode !== 'manual') return;

    // Selecting source
    if (isSelectingSource) {
      setSelectedSourceNode(nodeId);
      setIsSelectingSource(false);
      setExplanation(`Set node ${nodes[nodeId]?.label} as the source node.`);
      return;
    }
    // Selecting dest
    if (isSelectingDest) {
      setSelectedDestNode(nodeId);
      setIsSelectingDest(false);
      setExplanation(`Set node ${nodes[nodeId]?.label} as the destination node.`);
      return;
    }
    // Deleting node
    if (isDeletingNode) {
      const filteredEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      const filteredNodes = nodes.filter((n) => n.id !== nodeId);
      if (selectedSourceNode === nodeId) setSelectedSourceNode(null);
      if (selectedDestNode === nodeId) setSelectedDestNode(null);

      setNodes(filteredNodes);
      setEdges(filteredEdges);
      setIsDeletingNode(false);
      return;
    }
    // Adding edge
    if (isAddingEdge) {
      if (tempNode === null) {
        setTempNode(nodeId);
      } else {
        if (tempNode !== nodeId) {
          const promptText =
            algorithm === 'bellmanford' && graphParams.allowNegativeEdges
              ? 'Enter edge weight (can be negative):'
              : 'Enter edge weight (1-99):';
          const weight = prompt(promptText, '10');
          if (weight !== null) {
            const weightNum = parseFloat(weight);
            let validWeight = true;
            let errorMsg = '';

            if (isNaN(weightNum)) {
              validWeight = false;
              errorMsg = 'Invalid weight. Must be a number.';
            } else if (algorithm === 'dijkstra' && weightNum < 0) {
              validWeight = false;
              errorMsg = "Dijkstra doesn't support negative edges.";
            }

            if (validWeight) {
              const edgeId = `${tempNode}-${nodeId}`;
              if (!edges.some((e) => e.id === edgeId)) {
                setEdges([
                  ...edges,
                  {
                    id: edgeId,
                    source: tempNode,
                    target: nodeId,
                    weight: weightNum,
                    status: 'unvisited',
                  },
                ]);
              }
            } else {
              alert(errorMsg);
            }
          }
        }
        setTempNode(null);
        setIsAddingEdge(false);
      }
    }
  };

  // When an edge is clicked
  const handleEdgeClick = (edgeId) => {
    if (!isDeletingEdge) return;
    const filtered = edges.filter((e) => e.id !== edgeId);
    setEdges(filtered);
    setIsDeletingEdge(false);
  };

  // =========================
  //   ANIMATION LOOP
  // =========================
  useEffect(() => {
    if (isRunning && !isPaused) {
      const animate = () => {
        if (currentStep < steps.length) {
          applyStep(currentStep);
          setCurrentStep((prev) => prev + 1);
          animationFrameId.current = setTimeout(animate, animationSpeed);
        } else {
          setIsRunning(false);
        }
      };
      animationFrameId.current = setTimeout(animate, animationSpeed);
    }
    return () => {
      if (animationFrameId.current) clearTimeout(animationFrameId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, currentStep, steps, animationSpeed]);

  // =========================
  //   INIT & RESIZE
  // =========================
  useEffect(() => {
    // Generate a random graph on first load
    handleGenerateRandomGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-generate on window resize if in auto mode
    const handleResize = () => {
      if (mode === 'auto') handleGenerateRandomGraph();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // =========================
  //   RENDER
  // =========================
  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* HEADER BAR */}
      <header className="bg-blue-600 text-white shadow-md py-3 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight">Shortest Path Algorithm Visualizer</h1>
            <button
              onClick={toggleLegend}
              className="ml-3 text-xs bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-full transition-colors"
            >
              {showLegend ? 'Hide Legend' : 'Show Legend'}
            </button>
          </div>

          <div className="flex gap-4 items-center">
            {/* Desktop Algorithm Selector */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="dijkstra"
                  name="algorithm"
                  value="dijkstra"
                  checked={algorithm === 'dijkstra'}
                  onChange={handleAlgorithmChange}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="dijkstra" className="ml-2 font-medium">
                  Dijkstra
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bellmanford"
                  name="algorithm"
                  value="bellmanford"
                  checked={algorithm === 'bellmanford'}
                  onChange={handleAlgorithmChange}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="bellmanford" className="ml-2 font-medium">
                  Bellman-Ford
                </label>
              </div>
            </div>

            {/* Sidebar toggle (mobile) */}
            <button
              className="sm:hidden rounded-full p-2 bg-blue-700 hover:bg-blue-800 transition-colors"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* LEGEND (Collapsible) */}
      {showLegend && (
        <div className="bg-white shadow-sm border-b border-slate-200 p-2 overflow-x-auto">
          {/* Example legend items */}
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center justify-center">
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-slate-400 mr-2 rounded" />
              <span className="text-xs">Unvisited</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-orange-400 mr-2 rounded" />
              <span className="text-xs">Candidate</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-green-500 mr-2 rounded" />
              <span className="text-xs">Relaxed/Included</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-red-500 mr-2 rounded" />
              <span className="text-xs">Excluded</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-purple-500 mr-2 rounded" />
              <span className="text-xs">Negative Cycle</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-5 h-5 bg-green-500 mr-2 rounded-full flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-xs">Source Node</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-5 h-5 bg-orange-500 mr-2 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
              <span className="text-xs">Destination Node</span>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE ALGORITHM SELECTOR */}
      <div className="sm:hidden bg-white shadow-sm border-b border-slate-200 p-2">
        <div className="flex justify-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="dijkstra-mobile"
              name="algorithm-mobile"
              value="dijkstra"
              checked={algorithm === 'dijkstra'}
              onChange={handleAlgorithmChange}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="dijkstra-mobile" className="ml-2 font-medium text-sm">
              Dijkstra
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="bellmanford-mobile"
              name="algorithm-mobile"
              value="bellmanford"
              checked={algorithm === 'bellmanford'}
              onChange={handleAlgorithmChange}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="bellmanford-mobile" className="ml-2 font-medium text-sm">
              Bellman-Ford
            </label>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 p-2 sm:p-4">
        {/* GRAPH AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white shadow-md rounded-lg overflow-hidden flex-1 flex flex-col">
            {/* SVG AREA */}
            <div className="flex-1 relative min-h-[300px]" ref={svgRef} onClick={handleSvgClick}>
            <svg width="100%" height="100%" className="bg-slate-50">
                <GraphRenderer
                nodes={nodes}
                edges={edges}
                distanceArray={distanceArray}
                visitedNodes={visitedNodes}
                selectedSourceNode={selectedSourceNode}
                selectedDestNode={selectedDestNode}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                />
            </svg>

            {/* Algorithm Visualization Overlay */}
            <AlgorithmVisualizer 
                algorithm={algorithm}
                nodes={nodes}
                distanceArray={distanceArray}
                minHeap={minHeap}
                iterationCount={iterationCount}
                negativeCycleDetected={negativeCycleDetected}
            />
            </div>

            {/* CONTROL PANEL */}
            <div className="bg-white border-t border-slate-200 p-3">
              <div className="flex justify-center flex-wrap gap-2 mb-3">
                {/* Start/Resume/Pause */}
                <button
                  onClick={handlePlayPause}
                  className={`py-2 px-4 rounded-md flex items-center justify-center ${
                    isRunning && !isPaused
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors shadow-sm`}
                >
                  {isRunning ? (
                    isPaused ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Resume
                    </>
                    ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Pause
                    </>
                    )
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Start
                    </>
                )}
                </button>

               {/* Step Button - Add Icon */}
                <button
                onClick={handleStep}
                disabled={showAnswer}
                className="py-2 px-4 rounded-md flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm disabled:bg-blue-300"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v1.5a1 1 0 001.555.832L12 9l-2.445-1.332a1 1 0 00-.2 0l-2.445 1.332A1 1 0 006 8.5V8a1 1 0 00-1-1h2.555a1 1 0 00-.2 0z" clipRule="evenodd" />
                </svg>
                Step
                </button>

                {/* Reset Button - Add Icon */}
                <button
                onClick={resetGraph}
                className="py-2 px-4 rounded-md flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white transition-colors shadow-sm"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
                </button>

                {/* Show Button - Add Icon */}
                <button
                onClick={handleShowAnswer}
                className="py-2 px-4 rounded-md flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white transition-colors shadow-sm"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Show
                </button>
              </div>

              {/* SPEED CONTROL */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                <span className="text-xs text-slate-600">Speed:</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={(2200 - animationSpeed) / 400}
                  onChange={handleSpeedChange}
                  className="w-24 h-2 accent-blue-600"
                />
                <div className="flex text-xs text-slate-600">
                  <span>Slow</span>
                  <span className="mx-1">|</span>
                  <span>Fast</span>
                </div>
              </div>
              {/* MOBILE ALGORITHM STATE DISPLAY */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {algorithm === 'dijkstra' ? (
                    <>
                    <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">Distances</h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                        {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                <th className="p-1 text-left border-b">Node</th>
                                <th className="p-1 text-left border-b">Dist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(distanceArray).sort().slice(0, 5).map((nodeId) => (
                                <tr key={nodeId}>
                                    <td className="p-1 border-b">{nodes[nodeId]?.label}</td>
                                    <td className="p-1 border-b">{distanceArray[nodeId] === Infinity ? '∞' : distanceArray[nodeId]}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">No data</div>
                        )}
                        </div>
                    </div>
                    <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">Priority Queue</h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                        {minHeap.length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                <th className="p-1 text-left border-b">Node</th>
                                <th className="p-1 text-left border-b">Dist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minHeap.slice(0, 5).map((item, i) => (
                                <tr key={i} className={i === 0 ? 'bg-orange-50' : ''}>
                                    <td className="p-1 border-b">{nodes[item.id]?.label}</td>
                                    <td className="p-1 border-b">{item.dist}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">Empty</div>
                        )}
                        </div>
                    </div>
                    </>
                ) : (
                    <>
                    <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">Distances</h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                        {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                <th className="p-1 text-left border-b">Node</th>
                                <th className="p-1 text-left border-b">Dist</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(distanceArray).sort().slice(0, 5).map((nodeId) => (
                                <tr key={nodeId}>
                                    <td className="p-1 border-b">{nodes[nodeId]?.label}</td>
                                    <td className="p-1 border-b">{distanceArray[nodeId] === Infinity ? '∞' : distanceArray[nodeId]}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">No data</div>
                        )}
                        </div>
                    </div>
                    <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-bold text-blue-800">Iteration</h3>
                        {negativeCycleDetected && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Negative Cycle!
                            </span>
                        )}
                        </div>
                        <div className="border border-slate-100 p-2 rounded bg-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                            {iterationCount} of {nodes.length}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(iterationCount / Math.max(nodes.length, 1)) * 100}%` }}
                            ></div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </>
                )}
                </div>
              {/* Explanation or Current Step could be shown here */}
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 min-h-16 max-h-32 overflow-y-auto">
                <h3 className="font-semibold text-blue-800 text-sm">Explanation:</h3>
                <div className="text-sm text-slate-700">{explanation}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        {showSidebar && (
          <div className="w-full md:w-72 xl:w-80 ml-3 overflow-auto bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">Graph Settings</h2>

            {/* Mode */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700">Mode</label>
              <select
                value={mode}
                onChange={handleModeChange}
                className="w-full rounded-md border border-slate-300 p-2 bg-white mt-1"
              >
                <option value="auto">Auto-Generate</option>
                <option value="manual">Manual Design</option>
              </select>
            </div>

            {/* Manual Mode Toolbar */}
            {mode === 'manual' && (
              <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-3 text-sm">
                <p className="font-medium text-amber-800 mb-2">Manual Mode Toolbar:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAddNodeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isAddingNode ? 'bg-green-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {isAddingNode ? 'Click Graph...' : 'Add Node'}
                  </button>
                  <button
                    onClick={handleAddEdgeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isAddingEdge ? 'bg-green-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {isAddingEdge ? 'Select Nodes...' : 'Add Edge'}
                  </button>
                  <button
                    onClick={handleDeleteNodeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isDeletingNode ? 'bg-red-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {isDeletingNode ? 'Click Node...' : 'Delete Node'}
                  </button>
                  <button
                    onClick={handleDeleteEdgeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isDeletingEdge ? 'bg-red-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {isDeletingEdge ? 'Click Edge...' : 'Delete Edge'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectSourceMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isSelectingSource ? 'bg-green-500 text-white' : 'bg-green-200 hover:bg-green-300'
                    }`}
                  >
                    {isSelectingSource ? 'Click Node...' : 'Set Source'}
                  </button>
                  <button
                    onClick={handleSelectDestMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isSelectingDest ? 'bg-orange-500 text-white' : 'bg-orange-200 hover:bg-orange-300'
                    }`}
                  >
                    {isSelectingDest ? 'Click Node...' : 'Set Destination'}
                  </button>
                </div>

                {/* Clear Graph */}
                <div className="mt-3">
                  <button
                    onClick={clearGraph}
                    className="w-full px-2 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Clear Graph
                  </button>
                </div>
              </div>
            )}

            {/* Auto Mode Controls */}
            {mode === 'auto' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">Number of Nodes</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      name="nodeCount"
                      min="3"
                      max="10"
                      value={graphParams.nodeCount}
                      onChange={handleParamChange}
                      className="w-full mt-1 accent-blue-600"
                    />
                    <span className="ml-2 text-slate-700 font-medium w-6 text-center">
                      {graphParams.nodeCount}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">Edge Density</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      name="density"
                      min="0.2"
                      max="0.8"
                      step="0.1"
                      value={graphParams.density}
                      onChange={handleParamChange}
                      className="w-full mt-1 accent-blue-600"
                    />
                    <span className="ml-2 text-slate-700 font-medium w-6 text-center">
                      {graphParams.density.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">Weight Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="minWeight"
                      min="1"
                      max="98"
                      value={graphParams.minWeight}
                      onChange={handleParamChange}
                      className="w-16 border border-slate-300 rounded p-1 text-center"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      name="maxWeight"
                      min="2"
                      max="99"
                      value={graphParams.maxWeight}
                      onChange={handleParamChange}
                      className="w-16 border border-slate-300 rounded p-1 text-center"
                    />
                  </div>
                </div>

                {/* Negative Edges (only for Bellman-Ford) */}
                {algorithm === 'bellmanford' && (
                  <div className="mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowNegativeEdges"
                        name="allowNegativeEdges"
                        checked={graphParams.allowNegativeEdges}
                        onChange={handleParamChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="allowNegativeEdges" className="ml-2 block text-sm text-slate-700">
                        Allow Negative Edges
                      </label>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 ml-6">
                      {graphParams.allowNegativeEdges
                        ? 'May generate negative cycles (Bellman-Ford can detect them).'
                        : 'All edge weights will be positive.'}
                    </div>
                  </div>
                )}

                {/* Generate New Graph */}
                <button
                  onClick={handleGenerateRandomGraph}
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  Generate New Graph
                </button>
                {/* Algorithm Reference */}
                <div className="mt-6 border-t pt-4 border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-2">Algorithm Reference</h3>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs font-mono overflow-y-auto max-h-60">
                    {algorithm === 'dijkstra' ? (
                    <div className="space-y-1 text-slate-700">
                        <h4 className="font-bold">Dijkstra's Algorithm:</h4>
                        <div className="ml-4 pl-4 border-l-2 border-slate-300 space-y-1">
                        <p><span className="text-blue-600 font-bold">1.</span> Initialize distances: source=0, others=∞</p>
                        <p><span className="text-blue-600 font-bold">2.</span> Add source to priority queue</p>
                        <p><span className="text-blue-600 font-bold">3.</span> While priority queue not empty:</p>
                        <p className="ml-4"><span className="text-blue-500">a.</span> Extract node with min distance</p>
                        <p className="ml-4"><span className="text-blue-500">b.</span> For each neighbor, relax if shorter path found</p>
                        <p className="ml-4"><span className="text-blue-500">c.</span> Add updated neighbors to queue</p>
                        </div>
                        <p className="mt-2 text-red-600 text-xs">Note: Does not work with negative weights</p>
                    </div>
                    ) : (
                    <div className="space-y-1 text-slate-700">
                        <h4 className="font-bold">Bellman-Ford Algorithm:</h4>
                        <div className="ml-4 pl-4 border-l-2 border-slate-300 space-y-1">
                        <p><span className="text-blue-600 font-bold">1.</span> Initialize distances: source=0, others=∞</p>
                        <p><span className="text-blue-600 font-bold">2.</span> Repeat |V|-1 times:</p>
                        <p className="ml-4"><span className="text-blue-500">a.</span> Relax all edges</p>
                        <p><span className="text-blue-600 font-bold">3.</span> Check for negative cycles</p>
                        </div>
                        <p className="mt-2 text-green-600 text-xs">Can handle negative weights & detect negative cycles</p>
                    </div>
                    )}
                </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortestPathVisualizer;
