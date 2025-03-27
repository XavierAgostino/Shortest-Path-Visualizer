import React from "react";

const MobileMetrics = ({
  visitedNodes,
  selectedDestNode,
  distanceArray,
  steps,
  animationSpeed
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-slate-200 mb-3">
      <div className="text-center">
        <div className="text-xs text-slate-500">Visited</div>
        <div className="text-lg font-bold text-blue-600">
          {visitedNodes.size}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500">Path Length</div>
        <div className="text-lg font-bold text-green-600">
          {selectedDestNode !== null &&
          distanceArray[selectedDestNode] !== Infinity
            ? distanceArray[selectedDestNode]
            : "-"}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500">Time</div>
        <div className="text-lg font-bold text-purple-600">
          {steps.length > 0
            ? (steps.length * animationSpeed) / 1000 + "s"
            : "-"}
        </div>
      </div>
    </div>
  );
};

export default MobileMetrics;