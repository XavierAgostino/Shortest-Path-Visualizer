// AlgorithmVisualizer.js
import React from 'react';

const AlgorithmVisualizer = ({ 
  algorithm, 
  nodes, 
  distanceArray, 
  minHeap, 
  iterationCount, 
  negativeCycleDetected 
}) => {
  return (
    <div className="absolute top-3 right-3 w-64 hidden lg:block">
      {algorithm === 'dijkstra' ? (
        <>
          {/* Distance Array */}
          <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200 mb-3">
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
                      <tr key={nodeId}>
                        <td className="p-1 border-b">{nodes[nodeId]?.label}</td>
                        <td className="p-1 border-b">
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
          <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200">
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
                      <tr key={i} className={i === 0 ? 'bg-orange-50' : ''}>
                        <td className="p-1 border-b">{nodes[item.id]?.label}</td>
                        <td className="p-1 border-b">{item.dist}</td>
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
          <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200 mb-3">
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
                      <tr key={nodeId}>
                        <td className="p-1 border-b">{nodes[nodeId]?.label}</td>
                        <td className="p-1 border-b">
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
          <div className="bg-white shadow-lg rounded-lg p-3 bg-opacity-95 border border-blue-200">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-blue-800">Current Iteration</h3>
              {negativeCycleDetected && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
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
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(iterationCount / Math.max(nodes.length, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlgorithmVisualizer;