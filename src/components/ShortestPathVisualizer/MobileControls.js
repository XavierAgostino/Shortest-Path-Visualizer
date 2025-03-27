import React from "react";

const MobileControls = ({
  handleBackStep, 
  currentStep, 
  isRunning, 
  visualizationMode,
  handlePlayPause,
  isPaused,
  handleStep,
  handleShowAnswer,
  toggleVisualizationMode,
  resetGraph,
  resetGraphTransform,
  animationSpeed,
  handleSpeedChange,
  explanation
}) => {
  return (
    <div className="bg-white border-t border-slate-200 p-3">
      <div className="grid grid-cols-4 gap-2 mb-3">
        <button
          onClick={handleBackStep}
          disabled={
            currentStep === 0 || isRunning || visualizationMode === "view"
          }
          className="py-3 px-1 rounded-md flex flex-col items-center justify-center bg-slate-500 text-white disabled:opacity-50 disabled:bg-slate-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mb-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">Back</span>
        </button>

        <button
          onClick={handlePlayPause}
          disabled={visualizationMode === "view"}
          className={`py-3 px-1 rounded-md flex flex-col items-center justify-center ${
            isRunning && !isPaused ? "bg-amber-500" : "bg-green-500"
          } text-white disabled:opacity-50 disabled:bg-slate-300`}
        >
          {isRunning ? (
            isPaused ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mb-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Resume</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mb-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Pause</span>
              </>
            )
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mb-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs">Start</span>
            </>
          )}
        </button>

        <button
          onClick={handleStep}
          disabled={visualizationMode === "view"}
          className="py-3 px-1 rounded-md flex flex-col items-center justify-center bg-blue-500 text-white disabled:opacity-50 disabled:bg-slate-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mb-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">Step</span>
        </button>

        <button
          onClick={handleShowAnswer}
          className="py-3 px-1 rounded-md flex flex-col items-center justify-center bg-purple-500 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mb-1"
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
          <span className="text-xs">Paths</span>
        </button>
      </div>

      <div className="flex justify-between items-center mb-3 bg-slate-50 p-2 rounded-lg">
        <button
          onClick={toggleVisualizationMode}
          className={`py-2 px-3 rounded-md text-xs font-medium ${
            visualizationMode === "explore"
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "bg-purple-100 text-purple-700 border border-purple-200"
          }`}
        >
          {visualizationMode === "explore" ? "Explore Mode" : "View Mode"}
        </button>

        <button
          onClick={resetGraph}
          className="py-2 px-3 rounded-md text-xs font-medium bg-slate-200 text-slate-700"
        >
          Reset
        </button>

        <button
          onClick={resetGraphTransform}
          className="py-2 px-3 rounded-md text-xs font-medium bg-slate-200 text-slate-700"
        >
          Center
        </button>
      </div>

      <div className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-lg">
        <span className="text-xs text-slate-600">Speed:</span>
        <input
          type="range"
          min="1"
          max="5"
          value={(2200 - animationSpeed) / 400}
          onChange={handleSpeedChange}
          className="w-32 h-3 accent-blue-600"
          disabled={visualizationMode === "view"}
        />
        <div className="flex text-xs text-slate-600">
          <span>Slow</span>
          <span className="mx-1">|</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 min-h-16 max-h-32 overflow-y-auto">
        <div className="text-sm text-slate-700">{explanation}</div>
      </div>
    </div>
  );
};

export default MobileControls;