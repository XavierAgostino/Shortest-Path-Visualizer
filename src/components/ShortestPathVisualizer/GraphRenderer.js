import React from "react";

/**
 * A pure "presentational" component that draws nodes and edges in the SVG.
 * - `nodes` (array): list of node objects {id, x, y, label}
 * - `edges` (array): list of edge objects {id, source, target, weight, status}
 * - `distanceArray`: object of { nodeId: distanceValue }
 * - `visitedNodes`: Set of node IDs that are considered visited
 * - `selectedSourceNode` / `selectedDestNode`: highlight them differently
 * - `onNodeClick(nodeId)`: callback for node clicks
 * - `onEdgeClick(edgeId)`: callback for edge clicks
 */
function GraphRenderer({
  nodes,
  edges,
  distanceArray,
  visitedNodes,
  selectedSourceNode,
  selectedDestNode,
  onNodeClick,
  onEdgeClick,
}) {
  // Check if we're on mobile based on user agent
  // Note: This is a simple check and might not be perfect
  const isMobile =
    typeof window !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // RENDER EDGES
  const renderEdges = () => {
    return edges.map((edge) => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      if (!source || !target) return null;

      // Compute angle for arrow
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const angle = Math.atan2(dy, dx);

      // For node radius, arrow offset, etc.
      // Use slightly larger node radius on mobile for better touch targets
      const nodeRadius = isMobile ? 24 : 20;

      // Variables for path calculation
      let sourceX, sourceY, targetX, targetY;
      let pathD = null;

      // Adjust the path if this is part of a bidirectional pair
      if (edge.hasBidirectional) {
        // For bidirectional edges, create a curved path
        sourceX = source.x + nodeRadius * Math.cos(angle);
        sourceY = source.y + nodeRadius * Math.sin(angle);
        targetX = target.x - nodeRadius * Math.cos(angle);
        targetY = target.y - nodeRadius * Math.sin(angle);

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        // Create perpendicular offset for curved path
        const perpX = -dy * 0.2; // Perpendicular vector for curvature
        const perpY = dx * 0.2;

        // Create curved control point
        const ctrlX = midX + perpX;
        const ctrlY = midY + perpY;

        // Define curved path
        pathD = `M${sourceX},${sourceY} Q${ctrlX},${ctrlY} ${targetX},${targetY}`;
      } else {
        // For standard edges, use straight lines
        sourceX = source.x + nodeRadius * Math.cos(angle);
        sourceY = source.y + nodeRadius * Math.sin(angle);
        targetX = target.x - nodeRadius * Math.cos(angle);
        targetY = target.y - nodeRadius * Math.sin(angle);
      }

      // Arrow properties
      const arrowSize = isMobile ? 12 : 10; // Slightly larger on mobile
      const arrowAngle = Math.PI / 8;

      // Midpoint for label - adjusted based on if curved or not
      let midX, midY;
      if (edge.hasBidirectional) {
        // For curved paths, calculate point along the quadratic curve
        const t = 0.5; // Parameter for quadratic curve position (0-1)
        const perpX = -dy * 0.2; // Same perpendicular offset
        const perpY = dx * 0.2;
        // Quadratic bezier formula for t=0.5
        midX =
          (1 - t) * (1 - t) * sourceX +
          (2 * (1 - t) * t * (source.x + target.x)) / 2 +
          t * t * targetX +
          perpX;
        midY =
          (1 - t) * (1 - t) * sourceY +
          (2 * (1 - t) * t * (source.y + target.y)) / 2 +
          t * t * targetY +
          perpY;
      } else {
        // For straight lines, simple midpoint
        midX = (sourceX + targetX) / 2;
        midY = (sourceY + targetY) / 2;
      }

      // Perp offset for label
      const perpAngle = angle + Math.PI / 2;
      const offset = edge.hasBidirectional ? 18 : 12; // Bigger offset for bidirectional
      const labelX = midX + Math.cos(perpAngle) * offset;
      const labelY = midY + Math.sin(perpAngle) * offset;

      // Color logic
      let color = "#94a3b8"; // unvisited
      let strokeWidth = isMobile ? 3 : 2; // Thicker lines on mobile
      let strokeDasharray = "none";
      switch (edge.status) {
        case "candidate":
          color = "#fb923c"; // orange
          strokeWidth = isMobile ? 4 : 3;
          break;
        case "relaxed":
          color = "#22c55e"; // green
          strokeWidth = isMobile ? 4 : 3;
          break;
        case "excluded":
          color = "#ef4444"; // red
          strokeWidth = isMobile ? 2.5 : 1.5;
          break;
        case "included":
          color = "#22c55e"; // final included
          strokeWidth = isMobile ? 5 : 4;
          break;
        case "negativecycle":
          color = "#9333ea"; // purple
          strokeWidth = isMobile ? 5 : 4;
          strokeDasharray = "5,5";
          break;
        default:
          break;
      }

      return (
        <g
          key={edge.id}
          onClick={() => onEdgeClick(edge.id)}
          className="cursor-pointer"
          data-tooltip={`${nodes[edge.source]?.label} → ${
            nodes[edge.target]?.label
          } (${edge.weight})`}
        >
          {/* Main line or curve */}
          {edge.hasBidirectional ? (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
            />
          ) : (
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              className="transition-all duration-300 ease-in-out" // Add this class
            />
          )}

          {/* Arrow head */}
          <polygon
            points={`
              ${targetX},${targetY}
              ${targetX - arrowSize * Math.cos(angle - arrowAngle)},${
              targetY - arrowSize * Math.sin(angle - arrowAngle)
            }
              ${targetX - arrowSize * Math.cos(angle + arrowAngle)},${
              targetY - arrowSize * Math.sin(angle + arrowAngle)
            }
            `}
            fill={color}
          />

          {/* Weight label */}
          <rect
            x={labelX - (isMobile ? 15 : 12)}
            y={labelY - (isMobile ? 15 : 12)}
            width={isMobile ? 30 : 24}
            height={isMobile ? 30 : 24}
            fill="white"
            stroke={color}
            strokeWidth="1"
            rx="4"
            filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            fontSize={isMobile ? "14" : "12"}
          >
            {edge.weight}
          </text>
        </g>
      );
    });
  };

  // RENDER NODES
  const renderNodes = () => {
    return nodes.map((node) => {
      // Default color
      let fillColor = "#3b82f6";
      let strokeColor = "#2563eb";
      let strokeWidth = isMobile ? 3 : 2;
      let isAnimated = false;

      // Source node
      if (node.id === selectedSourceNode) {
        fillColor = "#22c55e";
        strokeColor = "#16a34a";
        strokeWidth = isMobile ? 4 : 3;
      }

      // Dest node
      if (node.id === selectedDestNode) {
        fillColor = "#f97316";
        strokeColor = "#ea580c";
        strokeWidth = isMobile ? 4 : 3;
      }

      // Visited
      if (visitedNodes.has(node.id)) {
        isAnimated = true;
      }

      // Distance label
      const dist = distanceArray[node.id];
      const distanceLabel =
        dist === undefined || dist === Infinity ? "∞" : dist;

      // Larger hit area for mobile
      const nodeRadius = isMobile ? 24 : 20;

      return (
        <g
          key={node.id}
          onClick={() => onNodeClick(node.id)}
          className="cursor-pointer"
        >
          {/* Invisible larger hit area for mobile */}
          {isMobile && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 15}
              fill="transparent"
              className="pointer-events-auto"
            />
          )}

          {/* Outer highlight if visited */}
          {isAnimated && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 4}
              fill="rgba(59, 130, 246, 0.2)"
              className="animate-pulse"
            />
          )}

          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.2))"
            className="transition-all duration-300 ease-out"
          />

          {/* Node label */}
          <text
            x={node.x}
            y={node.y + 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontWeight="bold"
            fontSize={isMobile ? "16" : "14"}
          >
            {node.label}
          </text>

          {/* Distance label (if known) */}
          {distanceArray && Object.keys(distanceArray).length > 0 && (
            <g>
              <circle
                cx={node.x}
                cy={node.y - (isMobile ? 35 : 30)}
                r={isMobile ? 16 : 14}
                fill="white"
                stroke={strokeColor}
                strokeWidth="1"
                filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
              />
              <text
                x={node.x}
                y={node.y - (isMobile ? 35 : 30)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isMobile ? "14" : "12"}
                fontWeight="bold"
                fill={distanceLabel === "∞" ? "#ef4444" : "#1e40af"}
              >
                {distanceLabel}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  return (
    <>
      <g>{renderEdges()}</g>
      <g>{renderNodes()}</g>
    </>
  );
}

export default GraphRenderer;
