// AlgorithmVisualizer.js
import React, { useState, useEffect } from 'react';

const AlgorithmVisualizer = ({ 
  algorithm, 
  nodes, 
  edges, // New prop for edge data
  distanceArray, 
  minHeap, 
  iterationCount, 
  negativeCycleDetected,
  currentStep, 
  steps, 
  visitedNodes, 
  currentAlgorithmStep,
  currentEdge, // New prop for current edge being relaxed
  recentlyUpdatedDistances, // New prop for tracking updated distances
}) => {
  // State for visibility toggle
  const [isVisible, setIsVisible] = useState(true);
  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // In the AlgorithmVisualizer component
  useEffect(() => {
    const checkMobile = () => {
      // Use lg breakpoint (1024px) to match your existing "lg:hidden" classes
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Load visibility preference from localStorage on mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem('algorithmPanelVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);
  
  // Save visibility preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('algorithmPanelVisible', isVisible);
  }, [isVisible]);
  
  // Toggle function
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  // Function to determine distance cell background color based on value
  const getDistanceColor = (distance, nodeId) => {
    // Check if this distance was recently updated
    if (recentlyUpdatedDistances && recentlyUpdatedDistances.includes(Number(nodeId))) {
      return 'bg-yellow-200 animate-pulse-fast'; // New animation class for updated distances
    }
    
    if (distance === Infinity) return 'bg-slate-50'; // Default for infinity
    
    // Highlight source node
    if (distance === 0) return 'bg-green-100';
    
    // Recently updated distance gets a more prominent highlight
    if (visitedNodes.has(Number(nodeId))) {
      // Pulse animation for most recently visited node
      const recentlyVisited = Array.from(visitedNodes).pop() === Number(nodeId);
      if (recentlyVisited) {
        return 'bg-blue-100 animate-pulse';
      }
      return 'bg-blue-50';
    }
    
    // Return gradient color based on distance
    return `bg-slate-50`;
  };

  // Function to highlight the corresponding line in pseudocode
  const highlightPseudocodeLine = (step) => {
    if (!step) return null;
    
    // Map algorithm steps to pseudocode line numbers
    const stepToLineMap = {
      'Initialize': algorithm === 'dijkstra' ? 1 : 1,
      'Push source': 2,
      'Extract Min': algorithm === 'dijkstra' ? 4 : null,
      'Relax': algorithm === 'dijkstra' ? 6 : 4,
      'Check Negative Cycles': algorithm === 'dijkstra' ? null : 6,
      'Early Exit': algorithm === 'dijkstra' ? null : 3,
      'Done': algorithm === 'dijkstra' ? 7 : 6,
    };
    
    return stepToLineMap[step];
  };
  
  const pseudocodeHighlightLine = highlightPseudocodeLine(currentAlgorithmStep);

  // Function to render the pseudocode with the current line highlighted
  const renderPseudocode = () => {
    const dijkstraCode = [
      "1. Initialize distance to source as 0",
      "2. Priority queue ← all nodes",
      "3. while queue not empty:",
      "4.   u ← node with min distance",
      "5.   for each neighbor v of u:",
      "6.     if distance[v] > distance[u] + weight(u,v):",
      "7.       update distance[v]"
    ];
    
    const bellmanFordCode = [
      "1. Initialize distance to source as 0",
      "2. for i from 1 to |V|-1:",
      "3.   for each edge (u, v):",
      "4.     if distance[v] > distance[u] + weight(u,v):",
      "5.       update distance[v]",
      "6. Check for negative cycles"
    ];
    
    const code = algorithm === 'dijkstra' ? dijkstraCode : bellmanFordCode;
    
    return (
      <div className="font-mono text-xs space-y-0.5">
        {code.map((line, index) => (
          <div 
            key={index} 
            className={`p-1 rounded ${pseudocodeHighlightLine === index + 1 
              ? 'bg-yellow-100 border-l-4 border-yellow-500 pl-2' 
              : ''}`}
          >
            {line}
          </div>
        ))}
      </div>
    );
  };

  // NEW: Function to render the current edge relaxation visualization
  const renderEdgeRelaxation = () => {
    if (!currentEdge) return null;
    
    const edge = edges.find(e => e.id === currentEdge);
    if (!edge) return null;
    
    const sourceNode = nodes[edge.source];
    const targetNode = nodes[edge.target];
    if (!sourceNode || !targetNode) return null;
    
    const sourceDistance = distanceArray[edge.source] || Infinity;
    const targetDistance = distanceArray[edge.target] || Infinity;
    const newDistance = sourceDistance + edge.weight;
    const isImprovement = newDistance < targetDistance;
    
    return (
      <div className="mt-2 p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
        <h4 className="text-xs font-bold text-indigo-800 mb-1.5">Edge Relaxation:</h4>
        <div className="flex items-center justify-center mb-2">
          {/* Source Node */}
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {sourceNode.label}
          </div>
          
          {/* Arrow with weight */}
          <div className="mx-1 flex flex-col items-center">
            <div className="w-14 h-0.5 bg-orange-400 relative">
              <div className="absolute -top-4 left-3 bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-medium">
                {edge.weight}
              </div>
              <div className="absolute top-0 right-0 w-0 h-0 border-t-4 border-r-4 border-b-4 border-t-transparent border-r-orange-400 border-b-transparent"></div>
            </div>
          </div>
          
          {/* Target Node */}
          <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {targetNode.label}
          </div>
        </div>
        
        {/* Calculation */}
        <div className="text-xs bg-white p-2 rounded border border-slate-200">
          <div className="flex justify-between mb-1">
            <span className="font-medium">Current distance to {sourceNode.label}:</span>
            <span>{sourceDistance === Infinity ? '∞' : sourceDistance}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-medium">Current distance to {targetNode.label}:</span>
            <span>{targetDistance === Infinity ? '∞' : targetDistance}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>New potential distance ({sourceNode.label} → {targetNode.label}):</span>
            <span>{sourceDistance === Infinity ? '∞' : sourceDistance} + {edge.weight} = {sourceDistance === Infinity ? '∞' : newDistance}</span>
          </div>
          <div className={`mt-1.5 p-1 rounded text-center font-bold ${isImprovement ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {isImprovement ? `Update! ${targetDistance} → ${newDistance}` : 'No improvement needed'}
          </div>
        </div>
      </div>
    );
  };

  // Skip rendering completely on mobile since there's already a visualization
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* Toggle button - positioned at the top of the panel but not overlapping text */}
      <button 
        onClick={toggleVisibility}
        className="absolute top-3 left-3 z-30 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
        title={isVisible ? "Hide Details" : "Show Details"}
      >
        {isVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
        )}
      </button>
      
      {/* Main overlay panel - positioned with absolute to overlay the graph */}
      {isVisible && (
        <div className="absolute top-0 left-0 z-20 w-72 max-h-full overflow-y-auto bg-black bg-opacity-5 h-full">
          <div className="p-3 space-y-2">
            {/* Current Step with improved header layout */}
            <div className="bg-white/95 shadow-lg rounded-lg p-2 backdrop-blur-sm border border-blue-200/50">
              <div className="flex justify-between items-center pl-8">
                <h3 className="text-sm font-bold text-blue-800">Current Step</h3>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                  {currentStep}/{steps?.length || 0}
                </div>
              </div>
              {currentAlgorithmStep && (
                <div className="mt-1 p-1.5 bg-blue-50 rounded text-xs">
                  <span className="font-medium">Action:</span> {currentAlgorithmStep}
                </div>
              )}
            </div>
            
            {/* NEW: Edge Relaxation Visualization */}
            {currentAlgorithmStep === 'Relax' && (
              <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
                <h3 className="text-sm font-bold mb-1 text-blue-800">Current Edge Relaxation</h3>
                {renderEdgeRelaxation()}
              </div>
            )}

            {algorithm === 'dijkstra' ? (
              <>
                {/* Distance Array */}
                <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
                  <h3 className="text-sm font-bold mb-1 text-blue-800">Distances from Source</h3>
                  <div className="border border-slate-200 rounded bg-white overflow-hidden">
                    {Object.keys(distanceArray).length > 0 ? (
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-1 text-left border-b">Node</th>
                            <th className="p-1 text-left border-b">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(distanceArray).sort().map((nodeId) => (
                            <tr 
                              key={nodeId} 
                              className={`${visitedNodes.has(Number(nodeId)) ? 'font-medium' : ''} ${
                                recentlyUpdatedDistances && recentlyUpdatedDistances.includes(Number(nodeId)) 
                                  ? 'bg-yellow-50' 
                                  : ''
                              }`}
                            >
                              <td className={`p-1 border-b ${visitedNodes.has(Number(nodeId)) ? 'text-blue-800' : ''}`}>
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full mr-1.5 inline-flex items-center justify-center text-xs 
                                    ${visitedNodes.has(Number(nodeId)) 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-slate-200 text-slate-600'}`}>
                                    {nodes[nodeId]?.label}
                                  </div>
                                </div>
                              </td>
                              <td className={`p-1 border-b transition-colors duration-300 ${getDistanceColor(distanceArray[nodeId], nodeId)}`}>
                                {distanceArray[nodeId] === Infinity ? '∞' : (
                                  <span className={
                                    recentlyUpdatedDistances && recentlyUpdatedDistances.includes(Number(nodeId)) 
                                      ? 'relative inline-block transition-transform animate-bounce-once' 
                                      : ''
                                  }>
                                    {distanceArray[nodeId]}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-slate-500 text-center py-3 px-2">No data yet</div>
                    )}
                  </div>
                </div>
                
                {/* Min Heap */}
                <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
                  <h3 className="text-sm font-bold mb-1 text-blue-800">Priority Queue (Min Heap)</h3>
                  <div className="border border-slate-200 rounded bg-white overflow-hidden">
                    {minHeap && minHeap.length > 0 ? (
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-1 text-left border-b">Node</th>
                            <th className="p-1 text-left border-b">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {minHeap.map((item, i) => (
                            <tr key={i} className={i === 0 ? 'bg-orange-100 font-medium' : ''}>
                              <td className="p-1 border-b">
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full mr-1.5 inline-flex items-center justify-center text-xs 
                                    ${i === 0 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-slate-200 text-slate-600'}`}>
                                    {nodes[item.id]?.label}
                                  </div>
                                </div>
                              </td>
                              <td className="p-1 border-b">
                                <span className={i === 0 ? 'font-medium' : ''}>{item.dist}</span>
                                {i === 0 && <span className="ml-1 text-xs text-orange-600">← next</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-slate-500 text-center py-3 px-2">Empty</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Distance Array (Bellman-Ford) */}
                <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
                  <h3 className="text-sm font-bold mb-1 text-blue-800">Distances from Source</h3>
                  <div className="border border-slate-200 rounded bg-white overflow-hidden">
                    {Object.keys(distanceArray).length > 0 ? (
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-1 text-left border-b">Node</th>
                            <th className="p-1 text-left border-b">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(distanceArray).sort().map((nodeId) => (
                            <tr 
                              key={nodeId} 
                              className={`${visitedNodes.has(Number(nodeId)) ? 'font-medium' : ''} ${
                                recentlyUpdatedDistances && recentlyUpdatedDistances.includes(Number(nodeId)) 
                                  ? 'bg-yellow-50' 
                                  : ''
                              }`}
                            >
                              <td className={`p-1 border-b ${visitedNodes.has(Number(nodeId)) ? 'text-blue-800' : ''}`}>
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full mr-1.5 inline-flex items-center justify-center text-xs 
                                    ${distanceArray[nodeId] < Infinity  
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-slate-200 text-slate-600'}`}>
                                    {nodes[nodeId]?.label}
                                  </div>
                                </div>
                              </td>
                              <td className={`p-1 border-b transition-colors duration-300 ${getDistanceColor(distanceArray[nodeId], nodeId)}`}>
                                {distanceArray[nodeId] === Infinity ? '∞' : (
                                  <span className={
                                    recentlyUpdatedDistances && recentlyUpdatedDistances.includes(Number(nodeId)) 
                                      ? 'relative inline-block transition-transform animate-bounce-once' 
                                      : ''
                                  }>
                                    {distanceArray[nodeId]}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-slate-500 text-center py-3 px-2">No data yet</div>
                    )}
                  </div>
                </div>
                
                {/* Iteration Count */}
                <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-blue-800">Current Iteration</h3>
                    {negativeCycleDetected && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full animate-pulse">
                        Negative Cycle!
                      </span>
                    )}
                  </div>
                  <div className="border border-slate-200 p-2 rounded bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {iterationCount} of {nodes.length}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${(iterationCount / Math.max(nodes.length, 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Pseudocode Section */}
            <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
              <h3 className="text-sm font-bold mb-2 text-blue-800">Algorithm Pseudocode</h3>
              <div className="bg-slate-50 p-2 rounded overflow-x-auto">
                {renderPseudocode()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlgorithmVisualizer;