// AlgorithmVisualizer.js
import React from 'react';

const AlgorithmVisualizer = ({ 
  algorithm, 
  nodes, 
  distanceArray, 
  minHeap, 
  iterationCount, 
  negativeCycleDetected,
  currentStep, // New prop to know which step we're on
  steps, // All steps for highlighting the correct pseudocode line
  visitedNodes, // To highlight visited nodes in the table
  currentAlgorithmStep, // To highlight the current algorithm step
}) => {
  // Function to determine distance cell background color based on value
  const getDistanceColor = (distance, nodeId) => {
    if (distance === Infinity) return 'bg-slate-50'; // Default for infinity
    
    // Highlight source node
    if (distance === 0) return 'bg-green-100';
    
    // Scale color based on distance value (normalize between 0-1)
    const maxDist = Math.max(...Object.values(distanceArray).filter(d => d !== Infinity));
    const normalizedDist = maxDist ? distance / maxDist : 0;
    
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

  return (
    <div className="absolute top-3 right-3 w-72 hidden lg:block">
      {/* Visualization Mode Indicator - Moved here from the main component */}
      <div className="bg-white/80 shadow-lg rounded-lg p-2 backdrop-blur-sm border border-blue-200/50 mb-2">
        <div className="flex justify-between items-center">
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

      {algorithm === 'dijkstra' ? (
        <>
          {/* Distance Array */}
          <div className="bg-white/80 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 mb-2">
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
                        className={`${visitedNodes.has(Number(nodeId)) ? 'font-medium' : ''}`}
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
                          {distanceArray[nodeId] === Infinity ? '∞' : distanceArray[nodeId]}
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
          <div className="bg-white/80 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 mb-2">
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
          <div className="bg-white/80 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 mb-2">
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
                        className={`${visitedNodes.has(Number(nodeId)) ? 'font-medium' : ''}`}
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
                          {distanceArray[nodeId] === Infinity ? '∞' : distanceArray[nodeId]}
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
          <div className="bg-white/80 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 mb-2">
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
                <div className="w-32 bg-gray-200 rounded-full h-2.5">
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
      
      {/* Pseudocode Section - Enhanced with current line highlighting */}
      <div className="bg-white/80 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-blue-200/50">
        <h3 className="text-sm font-bold mb-2 text-blue-800">Algorithm Pseudocode</h3>
        <div className="bg-slate-50 p-2 rounded overflow-x-auto">
          {renderPseudocode()}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmVisualizer;