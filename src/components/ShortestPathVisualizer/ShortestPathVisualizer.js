import React, { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import _ from "lodash";

import GraphRenderer from "./GraphRenderer";
import { generateRandomGraph } from "./GraphGeneration";
import { generateDijkstraSteps } from "./DijkstraSteps";
import { generateBellmanFordSteps } from "./BellmanFordSteps";
import AlgorithmVisualizer from "./AlgorithmVisualizer";

// Import mobile components
import CollapsibleSection from "./CollapsibleSection";
import MobileTabBar from "./MobileTabBar";
import MobileSettings from "./MobileSettings";
import MobileCompare from "./MobileCompare";
import MobileControls from "./MobileControls";
import MobileMetrics from "./MobileMetrics";

const ShortestPathVisualizer = () => {
  // =========================
  //       STATE
  // =========================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentRelaxingEdge, setCurrentRelaxingEdge] = useState(null);
  const [recentlyUpdatedDistances, setRecentlyUpdatedDistances] = useState([]);

  // Track confirmed shortest path edges
  const [confirmedPathEdges, setConfirmedPathEdges] = useState(new Set());

  const [graphParams, setGraphParams] = useState({
    nodeCount: 6,
    density: 0.5,
    minWeight: 1,
    maxWeight: 20,
    allowNegativeEdges: false,
    sourceNode: 0,
    hasNegativeCycle: false,
  });

  const [mode, setMode] = useState("auto"); // 'auto' or 'manual'
  const [explanation, setExplanation] = useState("");
  const [shortestPathResult, setShortestPathResult] = useState({
    distances: {},
    paths: {},
  });
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showLegend, setShowLegend] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Algorithm-specific data structures
  const [distanceArray, setDistanceArray] = useState({});
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [minHeap, setMinHeap] = useState([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [negativeCycleDetected, setNegativeCycleDetected] = useState(false);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState("");

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

  // Visualization mode
  const [visualizationMode, setVisualizationMode] = useState("explore"); // 'explore' or 'view'

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("visualization"); // 'visualization', 'settings', 'compare'
  const [graphTransform, setGraphTransform] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartInfo, setTouchStartInfo] = useState(null);

  // Refs
  const svgRef = useRef(null);
  const animationFrameId = useRef(null);

  // =========================
  //   MOBILE DETECTION
  // =========================
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);

      // If switching to mobile, ensure sidebar is closed by default
      if (isMobileView && showSidebar) {
        setShowSidebar(false);
      }
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [showSidebar]);

  // =========================
  //   TOUCH HANDLING FOR GRAPH
  // =========================
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setTouchStartInfo({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        transform: { ...graphTransform },
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchStartInfo({
        dist,
        transform: { ...graphTransform },
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartInfo) return;

    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartInfo.x;
      const deltaY = e.touches[0].clientY - touchStartInfo.y;

      setGraphTransform({
        ...graphTransform,
        x: touchStartInfo.transform.x + deltaX / graphTransform.scale,
        y: touchStartInfo.transform.y + deltaY / graphTransform.scale,
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const newScale =
        touchStartInfo.transform.scale * (dist / touchStartInfo.dist);
      // Limit scale between 0.5 and 3
      const clampedScale = Math.max(0.5, Math.min(newScale, 3));

      setGraphTransform({
        ...graphTransform,
        scale: clampedScale,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartInfo(null);
  };

  const resetGraphTransform = () => {
    setGraphTransform({ scale: 1, x: 0, y: 0 });
  };

  // =========================
  //   TOGGLE LEGEND & SIDEBAR
  // =========================
  const toggleLegend = () => setShowLegend(!showLegend);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  // =========================
  //   TOGGLE VISUALIZATION MODE
  // =========================
  const toggleVisualizationMode = () => {
    if (visualizationMode === "explore") {
      setVisualizationMode("view");
      setExplanation(
        "Switched to View mode. You can now examine the paths without modifying the algorithm state."
      );
    } else {
      setVisualizationMode("explore");
      setExplanation(
        "Switched to Explore mode. You can now step through the algorithm execution."
      );
    }
  };

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
    setCurrentAlgorithmStep("");
    setExplanation(
      "Graph cleared. You can now build a new graph from scratch."
    );
    setSelectedSourceNode(null);
    setSelectedDestNode(null);
    setConfirmedPathEdges(new Set());

    // Reset all algorithm-related states
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setVisualizationMode("explore");

    // Reset graph transform for mobile
    resetGraphTransform();
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
    setCurrentAlgorithmStep("");
    setConfirmedPathEdges(new Set());
    setExplanation(
      'Random graph generated. Select an algorithm and press "Start" to begin.'
    );
    setVisualizationMode("explore");

    // Reset graph transform for mobile
    resetGraphTransform();

    if (!svgRef.current) return; // If the ref is not ready

    // For mobile, reduce node count to avoid overcrowding
    let adjustedParams = { ...graphParams };
    if (isMobile && graphParams.nodeCount > 6) {
      adjustedParams.nodeCount = 6;
    }

    const { newNodes, newEdges, newParams } = generateRandomGraph({
      svgRef,
      graphParams: adjustedParams,
      algorithm,
    });

    // Store results
    setGraphParams(newParams);
    setNodes(newNodes);
    setEdges(newEdges);

    // Also update selected source/dest
    setSelectedSourceNode(newParams.sourceNode);
    setSelectedDestNode(null);

    // If in mobile mode, switch to visualization tab after generating
    if (isMobile) {
      setActiveTab("visualization");
    }
  };

  // =========================
  //   ALGORITHM CHANGE
  // =========================
  const handleAlgorithmChange = (e) => {
    const newAlg = typeof e === "string" ? e : e.target.value;
    setAlgorithm(newAlg);

    // If switching to Dijkstra with negative edges, disable them
    if (newAlg === "dijkstra" && graphParams.allowNegativeEdges) {
      setGraphParams({ ...graphParams, allowNegativeEdges: false });
      setExplanation(
        "Switched to Dijkstra. Negative edges disabled as Dijkstra's doesn't support them."
      );
    }

    // Reset
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setConfirmedPathEdges(new Set());
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
    setConfirmedPathEdges(new Set());
    setVisualizationMode("explore");

    const resetEdges = edges.map((edge) => ({ ...edge, status: "unvisited" }));
    setEdges(resetEdges);

    // Reset algorithm data
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");

    setExplanation(
      'Graph reset. Select an algorithm and press "Start" to begin.'
    );
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
          algorithm === "dijkstra"
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
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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

  const handleBackStep = () => {
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1;

      // Need to reset confirmed path edges when stepping back
      if (newStep === 0) {
        setConfirmedPathEdges(new Set());
      } else {
        // Recompute confirmed path edges based on all previous steps
        const updatedConfirmedEdges = new Set();
        for (let i = 0; i < newStep; i++) {
          const step = steps[i];
          if (step.pathEdgeUpdates) {
            step.pathEdgeUpdates.forEach((edgeId) => {
              updatedConfirmedEdges.add(edgeId);
            });
          }
        }
        setConfirmedPathEdges(updatedConfirmedEdges);
      }

      applyStep(newStep);
      setCurrentStep(newStep);
    }
  };

  // Forward actually advances to the next significant event
  const handleForwardStep = () => {
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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

    // Skip ahead to the next significant event (path update, node visit, etc.)
    if (currentStep < steps.length) {
      let significantStepFound = false;
      let nextStep = currentStep;

      while (nextStep < steps.length && !significantStepFound) {
        const step = steps[nextStep];

        // Check if this step contains a significant event
        if (
          (step.pathEdgeUpdates && step.pathEdgeUpdates.length > 0) || // New edge in path
          (step.visitedNodes && step.visitedNodes.size > visitedNodes.size) || // New node visited
          step.negativeCycleDetected // Negative cycle found
        ) {
          significantStepFound = true;
        } else {
          nextStep++;
        }
      }

      // Apply all steps up to the significant one
      for (let i = currentStep; i <= nextStep; i++) {
        if (i < steps.length) {
          applyStep(i);
        }
      }

      setCurrentStep(Math.min(nextStep + 1, steps.length));

      if (nextStep >= steps.length) {
        setExplanation("Reached the end of the algorithm execution.");
      }
    }
  };

  // =========================
  //   APPLY STEP
  // =========================
  const applyStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
  
    // Start with edges that have unvisited status, but preserve confirmed path edges
    const resetEdges = edges.map((e) => {
      // If this edge is part of a confirmed path, keep its status
      if (confirmedPathEdges.has(e.id)) {
        return { ...e, status: "included" };
      }
      return { ...e, status: "unvisited" };
    });
  
    // Apply step changes
    const newEdges = [...resetEdges];
    step.edgeUpdates.forEach((update) => {
      const idx = newEdges.findIndex((e) => e.id === update.id);
      if (idx !== -1) {
        newEdges[idx] = { ...newEdges[idx], status: update.status };
      }
    });
  
    // NEW: Track edge being relaxed
    setCurrentRelaxingEdge(step.currentEdgeBeingRelaxed || null);
    
    // NEW: Track distance updates
    setRecentlyUpdatedDistances(step.updatedDistances || []);
  
    // Update confirmed path edges if this step adds to the path
    if (step.pathEdgeUpdates && step.pathEdgeUpdates.length > 0) {
      const newConfirmedEdges = new Set(confirmedPathEdges);
      step.pathEdgeUpdates.forEach((edgeId) => {
        newConfirmedEdges.add(edgeId);
  
        // Also update the edge status to 'included'
        const idx = newEdges.findIndex((e) => e.id === edgeId);
        if (idx !== -1) {
          newEdges[idx] = { ...newEdges[idx], status: "included" };
        }
      });
      setConfirmedPathEdges(newConfirmedEdges);
    }
  
    // Update all states
    setEdges(newEdges);
    setExplanation(step.explanation);
    setCurrentAlgorithmStep(step.algorithmStep || "");
    setVisitedNodes(new Set(step.visitedNodes || []));
    setMinHeap([...(step.minHeap || [])]);
    setDistanceArray({ ...(step.distanceArray || {}) });
    setIterationCount(step.iterationCount || 0);
    setNegativeCycleDetected(step.negativeCycleDetected || false);
  };

  // =========================
  //   SHOW FINAL SHORTEST PATHS
  // =========================
  const handleShowAnswer = () => {
    // If no steps yet, generate them
    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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
    const newEdges = edges.map((e) => ({ ...e, status: "unvisited" }));

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
          newEdges[index].status = "included";
        }
      });

      // Save these path edges as confirmed
      setConfirmedPathEdges(pathEdgeIds);
    } else {
      // Negative cycle detected
      const { distances } = shortestPathResult;
      const cycleCandidates = edges.filter((edge) => {
        const { source, target, weight } = edge;
        if (distances[source] === undefined || distances[source] === Infinity)
          return false;
        return distances[source] + weight < distances[target];
      });
      cycleCandidates.forEach((edge) => {
        const idx = newEdges.findIndex((e) => e.id === edge.id);
        if (idx !== -1) {
          newEdges[idx].status = "negativecycle";
        }
      });
    }

    setEdges(newEdges);
    setShowAnswer(true);
    setIsRunning(false);
    setIsPaused(false);
    setVisualizationMode("view");

    if (negativeCycleDetected) {
      setExplanation(
        `${
          algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"
        } detected a negative cycle. No shortest paths exist.`
      );
    } else {
      setExplanation(
        `${
          algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"
        } complete. Shortest distances from ${
          nodes[selectedSourceNode]?.label
        } shown.`
      );
    }
  };

  // =========================
  //   HANDLE PARAM CHANGES
  // =========================
  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : parseFloat(value);

    // If toggling negative edges in Dijkstra
    if (name === "allowNegativeEdges" && newValue && algorithm === "dijkstra") {
      setExplanation(
        "Warning: Dijkstra doesn't support negative edges. Switch to Bellman-Ford."
      );
    }

    setGraphParams({ ...graphParams, [name]: newValue });
  };

  // =========================
  //   SWITCH AUTO / MANUAL
  // =========================
  const handleModeChange = (e) => {
    const newMode = typeof e === "string" ? e : e.target.value;
    setMode(newMode);
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

    // Get the SVG coordinates, accounting for scale and pan
    const svgRect = svgRef.current.getBoundingClientRect();
    const x =
      (e.clientX - svgRect.left - graphTransform.x * graphTransform.scale) /
      graphTransform.scale;
    const y =
      (e.clientY - svgRect.top - graphTransform.y * graphTransform.scale) /
      graphTransform.scale;

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
    if (mode !== "manual") return;

    // Selecting source
    if (isSelectingSource) {
      setSelectedSourceNode(nodeId);
      setIsSelectingSource(false);
      setExplanation(`Set node ${nodes[nodeId]?.label} as the source node.`);
      // When changing source, reset the visualization
      setShowAnswer(false);
      setVisualizationMode("explore");
      setConfirmedPathEdges(new Set());
      return;
    }

    // Selecting dest
    if (isSelectingDest) {
      setSelectedDestNode(nodeId);
      setIsSelectingDest(false);
      setExplanation(
        `Set node ${nodes[nodeId]?.label} as the destination node.`
      );

      // If we're in view mode, update the path highlighting
      if (visualizationMode === "view") {
        handleShowAnswer();
      }
      return;
    }

    // Deleting node
    if (isDeletingNode) {
      const filteredEdges = edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
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
            algorithm === "bellmanford" && graphParams.allowNegativeEdges
              ? "Enter edge weight (can be negative):"
              : "Enter edge weight (1-99):";
          const weight = prompt(promptText, "10");
          if (weight !== null) {
            const weightNum = parseFloat(weight);
            let validWeight = true;
            let errorMsg = "";

            if (isNaN(weightNum)) {
              validWeight = false;
              errorMsg = "Invalid weight. Must be a number.";
            } else if (algorithm === "dijkstra" && weightNum < 0) {
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
                    status: "unvisited",
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
    if (isRunning && !isPaused && visualizationMode === "explore") {
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
  }, [
    isRunning,
    isPaused,
    currentStep,
    steps,
    animationSpeed,
    visualizationMode,
  ]);

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
      if (mode === "auto") handleGenerateRandomGraph();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // =========================
  //   RENDER
  // =========================

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* HEADER BAR */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md py-3 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Shortest Path Visualizer
            </h1>
            <div className="hidden md:flex space-x-1 text-xs">
              <span className="px-2 py-1 bg-blue-500/30 backdrop-blur-sm rounded">
                Educational Tool
              </span>
              <span className="px-2 py-1 bg-blue-500/30 backdrop-blur-sm rounded">
                Interactive
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1 sm:mt-0">
            <button
              onClick={toggleLegend}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors backdrop-blur-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="whitespace-nowrap">{showLegend ? "Hide Legend" : "Show Legend"}</span>
            </button>

            <div className="hidden md:flex bg-white/10 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setAlgorithm("dijkstra")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  algorithm === "dijkstra"
                    ? "bg-white text-blue-700"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Dijkstra's
              </button>
              <button
                onClick={() => setAlgorithm("bellmanford")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  algorithm === "bellmanford"
                    ? "bg-white text-blue-700"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Bellman-Ford
              </button>
            </div>

            {/* Toggle sidebar on larger screens */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex text-xs bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors backdrop-blur-sm items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="whitespace-nowrap">{showSidebar ? "Hide Sidebar" : "Show Sidebar"}</span>
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
              <span className="text-xs">Shortest Path</span>
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

      {/* MOBILE ALGORITHM SELECTOR (Only visible on xs screens) */}
      <div className="sm:hidden bg-white shadow-sm border-b border-slate-200 p-2">
        <div className="flex justify-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="dijkstra-mobile"
              name="algorithm-mobile"
              value="dijkstra"
              checked={algorithm === "dijkstra"}
              onChange={handleAlgorithmChange}
              className="w-4 h-4 text-blue-600"
            />
            <label
              htmlFor="dijkstra-mobile"
              className="ml-2 font-medium text-sm"
            >
              Dijkstra
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="bellmanford-mobile"
              name="algorithm-mobile"
              value="bellmanford"
              checked={algorithm === "bellmanford"}
              onChange={handleAlgorithmChange}
              className="w-4 h-4 text-blue-600"
            />
            <label
              htmlFor="bellmanford-mobile"
              className="ml-2 font-medium text-sm"
            >
              Bellman-Ford
            </label>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 p-2 sm:p-4">
        {/* GRAPH AREA */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            isMobile && activeTab !== "visualization" ? "hidden" : ""
          }`}
        >
          <div className="bg-white shadow-md rounded-lg overflow-hidden flex-1 flex flex-col">
            {/* SVG AREA */}
            <div
              className="flex-1 relative min-h-[300px]"
              ref={svgRef}
              onClick={handleSvgClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <svg width="100%" height="100%" className="bg-slate-50">
                {/* Add this group with transform for mobile pinch-zoom/pan */}
                <g
                  transform={`translate(${graphTransform.x}, ${graphTransform.y}) scale(${graphTransform.scale})`}
                >
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
                </g>
              </svg>

              {/* Mobile pinch/zoom indicator */}
              {isMobile && (
                <div className="absolute top-3 right-3 z-10 bg-white/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-700 shadow-sm">
                  {Math.round(graphTransform.scale * 100)}%
                </div>
              )}

              {/* Mini Tutorial Button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowTutorial(true)}
                  className="bg-white/90 hover:bg-white text-blue-600 flex items-center rounded-full px-3 py-1.5 shadow-md text-xs font-medium transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  How It Works
                </button>
              </div>

              {/* Tutorial Modal */}
              {showTutorial && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-800">
                          How to Use This Visualizer
                        </h2>
                        <button
                          onClick={() => setShowTutorial(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-lg bg-blue-50 p-4 border-l-4 border-blue-500">
                          <h3 className="font-semibold text-blue-700 mb-2">
                            Getting Started
                          </h3>
                          <ol className="list-decimal ml-5 space-y-2 text-gray-700">
                            <li>
                              Select either{" "}
                              <span className="font-medium">Dijkstra's</span> or{" "}
                              <span className="font-medium">Bellman-Ford</span>{" "}
                              algorithm from the top bar
                            </li>
                            <li>
                              A random graph is auto-generated when you load the
                              page
                            </li>
                            <li>
                              The green node is the{" "}
                              <span className="text-green-600 font-medium">
                                source node
                              </span>{" "}
                              where the algorithm starts
                            </li>
                            <li>
                              You can set an orange{" "}
                              <span className="text-orange-600 font-medium">
                                destination node
                              </span>{" "}
                              to focus on a specific path
                            </li>
                          </ol>
                        </div>

                        <div className="rounded-lg bg-purple-50 p-4 border-l-4 border-purple-500">
                          <h3 className="font-semibold text-purple-700 mb-2">
                            Understanding the Controls
                          </h3>
                          <ul className="space-y-2 text-gray-700">
                            <li>
                              <strong>Start:</strong> Run the algorithm
                              automatically
                            </li>
                            <li>
                              <strong>Step:</strong> Execute a single algorithm
                              operation
                            </li>
                            <li>
                              <strong>Skip to Event:</strong> Jump to the next
                              significant event (path update, node visit)
                            </li>
                            <li>
                              <strong>View Paths/Explore Steps:</strong> Toggle
                              between exploration and viewing modes
                            </li>
                            <li>
                              <strong>Reset:</strong> Clear all algorithm
                              progress
                            </li>
                            <li>
                              <strong>Show All Paths:</strong> Display the final
                              shortest paths
                            </li>
                          </ul>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-4 border-l-4 border-amber-500">
                          <h3 className="font-semibold text-amber-700 mb-2">
                            Mobile Features
                          </h3>
                          <ul className="space-y-2 text-gray-700">
                            <li>
                              <strong>Pinch to Zoom:</strong> Use two fingers to
                              zoom in/out on the graph
                            </li>
                            <li>
                              <strong>Pan:</strong> Drag with one finger to move
                              around the graph
                            </li>
                            <li>
                              <strong>Tab Navigation:</strong> Switch between
                              Graph, Settings, and Compare views
                            </li>
                            <li>
                              <strong>Touch Friendliness:</strong> Larger
                              buttons and controls for easier mobile interaction
                            </li>
                            <li>
                              <strong>Double Tap:</strong> Reset the zoom and
                              pan on the graph
                            </li>
                          </ul>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4 border-l-4 border-green-500">
                          <h3 className="font-semibold text-green-700 mb-2">
                            Educational Features
                          </h3>
                          <ul className="space-y-2 text-gray-700">
                            <li>
                              Watch how the algorithm{" "}
                              <strong>builds paths incrementally</strong>
                            </li>
                            <li>
                              Observe the <strong>data structures</strong>{" "}
                              (distances, priority queue)
                            </li>
                            <li>
                              Follow the <strong>highlighted pseudocode</strong>{" "}
                              to understand each step
                            </li>
                            <li>
                              <strong>Compare algorithms</strong> to understand
                              their strengths and limitations
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setShowTutorial(false)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Algorithm Visualization Overlay */}
              <AlgorithmVisualizer
                algorithm={algorithm}
                nodes={nodes}
                distanceArray={distanceArray}
                minHeap={minHeap}
                iterationCount={iterationCount}
                negativeCycleDetected={negativeCycleDetected}
                currentStep={currentStep}
                steps={steps}
                visitedNodes={visitedNodes}
                currentAlgorithmStep={currentAlgorithmStep}
              />

              {/* Visualization Mode Indicator */}
              <div className="absolute bottom-3 right-3 z-10">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                    visualizationMode === "explore"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-purple-100 text-purple-800 border border-purple-300"
                  }`}
                >
                  {visualizationMode === "explore"
                    ? "Explore Mode"
                    : "View Mode"}
                </div>
              </div>
            </div>

            {/* CONTROL PANEL - Desktop version hidden on mobile */}
            <div className={`${isMobile ? "hidden" : "block"}`}>
              <div className="bg-white border-t border-slate-200 p-3">
                <div className="flex justify-center flex-wrap gap-2 mb-3">
                  {/* Step Progress Indicator */}
                  {steps.length > 0 && (
                    <div className="w-full max-w-md flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs text-slate-700">
                        {currentStep} of {steps.length}
                      </span>
                      <div className="h-2 bg-slate-200 rounded-full flex-1">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{
                            width: `${(currentStep / steps.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center flex-wrap gap-2">
                    {/* Back Step Button with tooltip */}
                    <div className="relative group">
                      <button
                        onClick={handleBackStep}
                        disabled={currentStep === 0 || isRunning}
                        className="py-2 px-4 rounded-md flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Go back one step in the algorithm execution"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Back
                      </button>
                      {visualizationMode === "view" && (
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 w-40 bg-black text--white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Switch to Explore mode to use
                        </div>
                      )}
                    </div>

                    {/* Start/Resume/Pause with tooltip */}
                    <div className="relative group">
                      <button
                        onClick={handlePlayPause}
                        disabled={visualizationMode === "view"}
                        className={`py-2 px-4 rounded-md flex items-center justify-center ${
                          isRunning && !isPaused
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-green-500 hover:bg-green-600"
                        } text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={
                          isRunning
                            ? isPaused
                              ? "Resume animation"
                              : "Pause animation"
                            : "Start animation"
                        }
                      >
                        {isRunning ? (
                          isPaused ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Resume
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Pause
                            </>
                          )
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Start
                          </>
                        )}
                      </button>
                      {visualizationMode === "view" && (
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 w-40 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Switch to Explore mode to use
                        </div>
                      )}
                    </div>

                    {/* Step Button with tooltip */}
                    <div className="relative group">
                      <button
                        onClick={handleStep}
                        disabled={visualizationMode === "view"}
                        className="py-2 px-4 rounded-md flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Execute one single step of the algorithm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Step
                      </button>
                      {visualizationMode === "view" && (
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 w-40 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Switch to Explore mode to use
                        </div>
                      )}
                    </div>

                    {/* Forward Step Button with tooltip */}
                    <div className="relative group">
                      <button
                        onClick={handleForwardStep}
                        disabled={
                          currentStep >= steps.length ||
                          isRunning ||
                          visualizationMode === "view"
                        }
                        className="py-2 px-4 rounded-md flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Skip to the next significant algorithm event (path update, node visit)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Skip to Event
                      </button>
                      {visualizationMode === "view" && (
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 w-40 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Switch to Explore mode to use
                        </div>
                      )}
                    </div>

                    {/* Mode Toggle Button */}
                    <button
                      onClick={toggleVisualizationMode}
                      className={`py-2 px-4 rounded-md flex items-center justify-center ${
                        visualizationMode === "explore"
                          ? "bg-purple-500 hover:bg-purple-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white transition-colors shadow-sm`}
                      title={
                        visualizationMode === "explore"
                          ? "Switch to View mode"
                          : "Switch to Explore mode"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {visualizationMode === "explore"
                        ? "View Paths"
                        : "Explore Steps"}
                    </button>

                    {/* Reset Button */}
                    <button
                      onClick={resetGraph}
                      className="py-2 px-4 rounded-md flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white transition-colors shadow-sm"
                      title="Reset the graph and algorithm state"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reset
                    </button>

                    {/* Show Button */}
                    <button
                      onClick={handleShowAnswer}
                      className="py-2 px-4 rounded-md flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white transition-colors shadow-sm"
                      title="Show the final shortest paths"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Show All Paths
                    </button>
                  </div>
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
                    disabled={visualizationMode === "view"}
                    title={
                      visualizationMode === "view"
                        ? "Animation speed (disabled in View mode)"
                        : "Animation speed"
                    }
                  />
                  <div className="flex text-xs text-slate-600">
                    <span>Slow</span>
                    <span className="mx-1">|</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* MOBILE ALGORITHM STATE DISPLAY */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {algorithm === "dijkstra" ? (
                    <>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(distanceArray)
                                  .sort()
                                  .slice(0, 5)
                                  .map((nodeId) => (
                                    <tr key={nodeId}>
                                      <td className="p-1 border-b">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Priority Queue
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {minHeap.length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {minHeap.slice(0, 5).map((item, i) => (
                                  <tr
                                    key={i}
                                    className={i === 0 ? "bg-orange-50" : ""}
                                  >
                                    <td className="p-1 border-b">
                                      {nodes[item.id]?.label}
                                    </td>
                                    <td className="p-1 border-b">
                                      {item.dist}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              Empty
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(distanceArray)
                                  .sort()
                                  .slice(0, 5)
                                  .map((nodeId) => (
                                    <tr key={nodeId}>
                                      <td className="p-1 border-b">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-xs font-bold text-blue-800">
                            Iteration
                          </h3>
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
                                style={{
                                  width: `${
                                    (iterationCount /
                                      Math.max(nodes.length, 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <MobileMetrics 
                  visitedNodes={visitedNodes}
                  selectedDestNode={selectedDestNode}
                  distanceArray={distanceArray}
                  steps={steps}
                  animationSpeed={animationSpeed}
                />

                {/* Explanation area */}
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 min-h-16 max-h-32 overflow-y-auto">
                  <h3 className="font-semibold text-blue-800 text-sm">
                    Explanation:
                  </h3>
                  <div className="text-sm text-slate-700">{explanation}</div>
                </div>
              </div>
            </div>

            {/* MOBILE CONTROLS - Only visible on mobile */}
            {isMobile && (
              <MobileControls 
                handleBackStep={handleBackStep}
                currentStep={currentStep}
                isRunning={isRunning}
                visualizationMode={visualizationMode}
                handlePlayPause={handlePlayPause}
                isPaused={isPaused}
                handleStep={handleStep}
                handleShowAnswer={handleShowAnswer}
                toggleVisualizationMode={toggleVisualizationMode}
                resetGraph={resetGraph}
                resetGraphTransform={resetGraphTransform}
                animationSpeed={animationSpeed}
                handleSpeedChange={handleSpeedChange}
                explanation={explanation}
              />
            )}
          </div>
        </div>

        {/* MOBILE TABS - show settings or compare tab content */}
        {isMobile && activeTab === "settings" && (
          <div className="fixed inset-0 pt-14 pb-16 px-2 z-10 bg-slate-100 overflow-y-auto">
            <MobileSettings 
              algorithm={algorithm}
              handleAlgorithmChange={handleAlgorithmChange}
              handleModeChange={handleModeChange}
              mode={mode}
              graphParams={graphParams}
              handleParamChange={handleParamChange}
              handleGenerateRandomGraph={handleGenerateRandomGraph}
              clearGraph={clearGraph}
              handleAddNodeMode={handleAddNodeMode}
              isAddingNode={isAddingNode}
              handleAddEdgeMode={handleAddEdgeMode}
              isAddingEdge={isAddingEdge}
              handleDeleteNodeMode={handleDeleteNodeMode}
              isDeletingNode={isDeletingNode}
              handleDeleteEdgeMode={handleDeleteEdgeMode}
              isDeletingEdge={isDeletingEdge}
              handleSelectSourceMode={handleSelectSourceMode}
              isSelectingSource={isSelectingSource}
              handleSelectDestMode={handleSelectDestMode}
              isSelectingDest={isSelectingDest}
            />
          </div>
        )}

        {isMobile && activeTab === "compare" && (
          <div className="fixed inset-0 pt-14 pb-16 px-2 z-10 bg-slate-100 overflow-y-auto">
            <MobileCompare />
          </div>
        )}

        {/* SIDEBAR - Only visible on desktop when showSidebar is true */}
        {showSidebar && !isMobile && (
          <div className="w-full md:w-72 xl:w-80 ml-3 overflow-auto bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">
              Graph Settings
            </h2>

            {/* Mode */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Mode
              </label>
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
            {mode === "manual" && (
              <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-3 text-sm">
                <p className="font-medium text-amber-800 mb-2">
                  Manual Mode Toolbar:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAddNodeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isAddingNode
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {isAddingNode ? "Click Graph..." : "Add Node"}
                  </button>
                  <button
                    onClick={handleAddEdgeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isAddingEdge
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {isAddingEdge ? "Select Nodes..." : "Add Edge"}
                  </button>
                  <button
                    onClick={handleDeleteNodeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isDeletingNode
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {isDeletingNode ? "Click Node..." : "Delete Node"}
                  </button>
                  <button
                    onClick={handleDeleteEdgeMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isDeletingEdge
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  >
                    {isDeletingEdge ? "Click Edge..." : "Delete Edge"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectSourceMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isSelectingSource
                        ? "bg-green-500 text-white"
                        : "bg-green-200 hover:bg-green-300"
                    }`}
                  >
                    {isSelectingSource ? "Click Node..." : "Set Source"}
                  </button>
                  <button
                    onClick={handleSelectDestMode}
                    className={`px-2 py-1 rounded text-sm ${
                      isSelectingDest
                        ? "bg-orange-500 text-white"
                        : "bg-orange-200 hover:bg-orange-300"
                    }`}
                  >
                    {isSelectingDest ? "Click Node..." : "Set Destination"}
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
            {mode === "auto" && (
              <>
                {/* Number of Nodes - Enhanced slider */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Nodes
                    </label>
                    <span className="text-blue-600 font-medium">
                      {graphParams.nodeCount}
                    </span>
                  </div>
                  <input
                    type="range"
                    name="nodeCount"
                    min="3"
                    max="10"
                    value={graphParams.nodeCount}
                    onChange={handleParamChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Edge Density - Enhanced slider */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Edge Density
                    </label>
                    <span className="text-blue-600 font-medium">
                      {graphParams.density.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    name="density"
                    min="0.2"
                    max="0.8"
                    step="0.1"
                    value={graphParams.density}
                    onChange={handleParamChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Weight Range */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      name="minWeight"
                      min="1"
                      max="98"
                      value={graphParams.minWeight}
                      onChange={handleParamChange}
                      className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      name="maxWeight"
                      min="2"
                      max="99"
                      value={graphParams.maxWeight}
                      onChange={handleParamChange}
                      className="w-full border border-gray-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Negative Edges (only for Bellman-Ford) */}
                {algorithm === "bellmanford" && (
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowNegativeEdges"
                        name="allowNegativeEdges"
                        checked={graphParams.allowNegativeEdges}
                        onChange={handleParamChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label
                        htmlFor="allowNegativeEdges"
                        className="ml-2 block text-sm text-slate-700"
                      >
                        Allow Negative Edges
                      </label>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 ml-6">
                      {graphParams.allowNegativeEdges
                        ? "May generate negative cycles (Bellman-Ford can detect them)."
                        : "All edge weights will be positive."}
                    </div>
                  </div>
                )}

                {/* Generate New Graph - Enhanced button */}
                <button
                  onClick={handleGenerateRandomGraph}
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-md transition-colors shadow-sm flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generate New Graph
                </button>

                {/* Algorithm comparison - new educational component */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">
                      Compare Algorithms
                    </h3>
                    <span className="text-xs text-gray-500">
                      Key differences
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="flex">
                      <div className="w-1/2 pr-2 border-r border-gray-200">
                        <h4 className="font-bold text-blue-700 mb-1">
                          Dijkstra's
                        </h4>
                        <ul className="space-y-1 text-gray-600">
                          <li className="flex items-start">
                            <span className="text-green-500 mr-1">✓</span>{" "}
                            Faster for sparse graphs
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-1">✓</span>{" "}
                            Priority queue optimized
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-1">✗</span> No
                            negative weights
                          </li>
                        </ul>
                      </div>
                      <div className="w-1/2 pl-2">
                        <h4 className="font-bold text-blue-700 mb-1">
                          Bellman-Ford
                        </h4>
                        <ul className="space-y-1 text-gray-600">
                          <li className="flex items-start">
                            <span className="text-green-500 mr-1">✓</span>{" "}
                            Handles negative weights
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-1">✓</span>{" "}
                            Detects negative cycles
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-1">✗</span> Slower
                            (checks all edges)
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-500 border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span>Time Complexity:</span>
                        <span>
                          {algorithm === "dijkstra"
                            ? "O((V+E)log V)"
                            : "O(V⋅E)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MOBILE TAB NAVIGATION BAR */}
      {isMobile && (
        <MobileTabBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          toggleSidebar={toggleSidebar}
        />
      )}

      {/* SPACING DIV FOR MOBILE - to ensure content isn't hidden behind tab bar */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
};

export default ShortestPathVisualizer;