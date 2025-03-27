import React from "react";

const MobileCompare = () => {
  return (
    <div className="p-4 pb-20">
      <h2 className="text-lg font-semibold mb-4 text-blue-800">
        Algorithm Comparison
      </h2>

      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="bg-blue-50 p-3 border-b border-blue-100">
          <h3 className="font-semibold text-blue-800">Dijkstra's Algorithm</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">
            Finds the shortest paths from a source node to all other nodes in a
            graph with non-negative edge weights.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-green-50 p-2 rounded-lg border border-green-100">
              <h4 className="font-medium text-sm text-green-800 mb-1">
                Advantages
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Very efficient
                  for sparse graphs
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Uses priority
                  queue for optimization
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Common in
                  GPS/navigation systems
                </li>
              </ul>
            </div>
            <div className="bg-red-50 p-2 rounded-lg border border-red-100">
              <h4 className="font-medium text-sm text-red-800 mb-1">
                Limitations
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Cannot handle
                  negative edges
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> More complex to
                  implement
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Slower on
                  complete graphs
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded p-2 flex justify-between text-xs">
            <span className="font-medium">Time Complexity:</span>
            <span className="font-mono">O((V + E) log V)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="bg-purple-50 p-3 border-b border-purple-100">
          <h3 className="font-semibold text-purple-800">
            Bellman-Ford Algorithm
          </h3>
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">
            A versatile algorithm that finds shortest paths and can handle
            negative edge weights and detect negative cycles.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-green-50 p-2 rounded-lg border border-green-100">
              <h4 className="font-medium text-sm text-green-800 mb-1">
                Advantages
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Handles
                  negative edge weights
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Detects
                  negative cycles
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Simpler
                  implementation
                </li>
              </ul>
            </div>
            <div className="bg-red-50 p-2 rounded-lg border border-red-100">
              <h4 className="font-medium text-sm text-red-800 mb-1">
                Limitations
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Slower than
                  Dijkstra's
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Must process all
                  edges in each pass
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Less efficient
                  for sparse graphs
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-purple-50 rounded p-2 flex justify-between text-xs">
            <span className="font-medium">Time Complexity:</span>
            <span className="font-mono">O(V × E)</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">
          When to Use Each Algorithm?
        </h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">→</span>
            <span>
              Use <strong>Dijkstra's</strong> when you have a graph with only
              positive weights and need maximum efficiency
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-blue-600 mr-2">→</span>
            <span>
              Use <strong>Bellman-Ford</strong> when your graph might have
              negative weights or you need to detect negative cycles
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MobileCompare;