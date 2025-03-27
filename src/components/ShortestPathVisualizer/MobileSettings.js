import React from "react";
import CollapsibleSection from "./CollapsibleSection";

const MobileSettings = ({
  algorithm,
  handleAlgorithmChange,
  handleModeChange,
  mode,
  graphParams,
  handleParamChange,
  handleGenerateRandomGraph,
  clearGraph,
  handleAddNodeMode,
  isAddingNode,
  handleAddEdgeMode,
  isAddingEdge,
  handleDeleteNodeMode,
  isDeletingNode,
  handleDeleteEdgeMode,
  isDeletingEdge,
  handleSelectSourceMode,
  isSelectingSource,
  handleSelectDestMode,
  isSelectingDest
}) => {
  return (
    <div className="p-4 pb-20">
      <h2 className="text-lg font-semibold mb-4 text-blue-800">
        Graph Settings
      </h2>

      <CollapsibleSection title="Algorithm Selection" initiallyOpen={true}>
        <div className="bg-white rounded-lg py-2 flex flex-col">
          <div className="flex items-center p-2 mb-2">
            <input
              type="radio"
              id="dijkstra-mobile"
              name="algorithm-mobile"
              value="dijkstra"
              checked={algorithm === "dijkstra"}
              onChange={() => handleAlgorithmChange("dijkstra")}
              className="w-5 h-5 text-blue-600"
            />
            <label htmlFor="dijkstra-mobile" className="ml-3 font-medium">
              Dijkstra's Algorithm
            </label>
          </div>
          <div className="flex items-center p-2">
            <input
              type="radio"
              id="bellmanford-mobile"
              name="algorithm-mobile"
              value="bellmanford"
              checked={algorithm === "bellmanford"}
              onChange={() => handleAlgorithmChange("bellmanford")}
              className="w-5 h-5 text-blue-600"
            />
            <label htmlFor="bellmanford-mobile" className="ml-3 font-medium">
              Bellman-Ford Algorithm
            </label>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Graph Generation Mode" initiallyOpen={true}>
        <div className="bg-slate-100 rounded-lg p-1 flex mb-4">
          <button
            onClick={() => handleModeChange("auto")}
            className={`flex-1 py-3 rounded-md text-center ${
              mode === "auto"
                ? "bg-white shadow text-blue-700 font-medium"
                : "text-slate-600"
            }`}
          >
            Auto-Generate
          </button>
          <button
            onClick={() => handleModeChange("manual")}
            className={`flex-1 py-3 rounded-md text-center ${
              mode === "manual"
                ? "bg-white shadow text-blue-700 font-medium"
                : "text-slate-600"
            }`}
          >
            Manual Design
          </button>
        </div>
      </CollapsibleSection>

      {mode === "auto" && (
        <>
          <CollapsibleSection title="Graph Parameters" initiallyOpen={true}>
            <div className="space-y-6">
              {/* Node Count */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
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
                  className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Edge Density */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
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
                  className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Weight Range */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Weight Range
                  </label>
                  <span className="text-blue-600 font-medium">
                    {graphParams.minWeight} to {graphParams.maxWeight}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">Min</span>
                    <input
                      type="number"
                      name="minWeight"
                      min="1"
                      max="98"
                      value={graphParams.minWeight}
                      onChange={handleParamChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-lg"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs text-gray-500 mb-1">Max</span>
                    <input
                      type="number"
                      name="maxWeight"
                      min="2"
                      max="99"
                      value={graphParams.maxWeight}
                      onChange={handleParamChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Negative Edges (only for Bellman-Ford) */}
              {algorithm === "bellmanford" && (
                <div className="flex items-center">
                  <div className="relative inline-block w-12 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="mobile-allowNegativeEdges"
                      name="allowNegativeEdges"
                      checked={graphParams.allowNegativeEdges}
                      onChange={handleParamChange}
                      className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-500"
                    />
                    <label
                      htmlFor="mobile-allowNegativeEdges"
                      className={`block overflow-hidden h-6 rounded-full ${
                        graphParams.allowNegativeEdges
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      } cursor-pointer`}
                    ></label>
                  </div>
                  <label
                    htmlFor="mobile-allowNegativeEdges"
                    className="text-sm font-medium text-gray-700"
                  >
                    Allow Negative Edges
                  </label>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Generate Button */}
          <button
            onClick={handleGenerateRandomGraph}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-4 rounded-lg transition-colors shadow-sm text-lg font-medium"
          >
            Generate New Graph
          </button>
        </>
      )}

      {mode === "manual" && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
          <p className="font-medium text-amber-800 mb-3">Manual Mode Tools</p>

          {/* Grid of large buttons for mobile */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddNodeMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isAddingNode
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              {isAddingNode ? "Tap Graph..." : "Add Node"}
            </button>
            <button
              onClick={handleAddEdgeMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isAddingEdge
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              {isAddingEdge ? "Tap Nodes..." : "Add Edge"}
            </button>
            <button
              onClick={handleDeleteNodeMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isDeletingNode
                  ? "bg-red-500 text-white"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              {isDeletingNode ? "Tap Node..." : "Delete Node"}
            </button>
            <button
              onClick={handleDeleteEdgeMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isDeletingEdge
                  ? "bg-red-500 text-white"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              {isDeletingEdge ? "Tap Edge..." : "Delete Edge"}
            </button>
            <button
              onClick={handleSelectSourceMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isSelectingSource
                  ? "bg-green-500 text-white"
                  : "bg-green-200 hover:bg-green-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {isSelectingSource ? "Tap Node..." : "Set Source"}
            </button>
            <button
              onClick={handleSelectDestMode}
              className={`rounded-lg p-4 text-sm flex flex-col items-center ${
                isSelectingDest
                  ? "bg-orange-500 text-white"
                  : "bg-orange-200 hover:bg-orange-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {isSelectingDest ? "Tap Node..." : "Set Destination"}
            </button>
          </div>

          <button
            onClick={clearGraph}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors shadow-sm"
          >
            Clear Graph
          </button>
        </div>
      )}

      <CollapsibleSection title="Learn About Algorithms" initiallyOpen={false}>
        <div className="bg-gray-50 rounded-lg p-3 text-xs">
          <div className="flex">
            <div className="w-1/2 pr-2 border-r border-gray-200">
              <h4 className="font-bold text-blue-700 mb-1">Dijkstra's</h4>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Faster for
                  sparse graphs
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Priority queue
                  optimized
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> No negative
                  weights
                </li>
              </ul>
            </div>
            <div className="w-1/2 pl-2">
              <h4 className="font-bold text-blue-700 mb-1">Bellman-Ford</h4>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Handles
                  negative weights
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span> Detects
                  negative cycles
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-1">✗</span> Slower (checks
                  all edges)
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-2 text-gray-500 border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span>Time Complexity:</span>
              <span>
                {algorithm === "dijkstra" ? "O((V+E)log V)" : "O(V⋅E)"}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default MobileSettings;