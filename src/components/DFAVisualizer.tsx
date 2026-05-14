import { motion } from 'motion/react';
import { DFAState } from '../types';

interface Node {
  id: DFAState;
  x: number;
  y: number;
  label: string;
  type?: 'start' | 'accept' | 'blocked' | 'normal';
}

const NODES: Node[] = [
  { id: DFAState.Q0, x: 100, y: 100, label: 'q0: Start', type: 'start' },
  { id: DFAState.Q1, x: 250, y: 100, label: 'q1: Card In' },
  { id: DFAState.Q2, x: 400, y: 100, label: 'q2: Verify' },
  { id: DFAState.Q3, x: 550, y: 100, label: 'q3: Auth' },
  { id: DFAState.Q8, x: 400, y: 250, label: 'q8: Blocked', type: 'blocked' },
  { id: DFAState.Q4, x: 700, y: 100, label: 'q4: Menu' },
  { id: DFAState.Q5, x: 700, y: 250, label: 'q5: Process' },
  { id: DFAState.Q6, x: 850, y: 250, label: 'q6: Success', type: 'accept' },
  { id: DFAState.Q7, x: 550, y: 250, label: 'q7: Failed' },
];

const EDGES = [
  { from: DFAState.Q0, to: DFAState.Q1, label: 'c' },
  { from: DFAState.Q1, to: DFAState.Q2, label: 'p' },
  { from: DFAState.Q2, to: DFAState.Q3, label: 'v' },
  { from: DFAState.Q2, to: DFAState.Q2, label: 'i', loop: true },
  { from: DFAState.Q2, to: DFAState.Q8, label: 'fault' },
  { from: DFAState.Q3, to: DFAState.Q4, label: 't' },
  { from: DFAState.Q4, to: DFAState.Q5, label: 'w' },
  { from: DFAState.Q5, to: DFAState.Q6, label: 's' },
  { from: DFAState.Q5, to: DFAState.Q7, label: 'n' },
  { from: DFAState.Q7, to: DFAState.Q4, label: 't', curved: true },
  { from: DFAState.Q3, to: DFAState.Q0, label: 'x', curved: true },
  { from: DFAState.Q4, to: DFAState.Q0, label: 'x', curved: true },
  { from: DFAState.Q6, to: DFAState.Q0, label: 'x', curved: true },
  { from: DFAState.Q7, to: DFAState.Q0, label: 'x', curved: true },
  { from: DFAState.Q8, to: DFAState.Q0, label: 'x', curved: true },
];

export function DFAVisualizer({ currentState }: { currentState: DFAState }) {
  return (
    <div className="w-full h-[400px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
      <div className="absolute top-4 left-4 z-10">
         <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">DFA State Transition Model</h3>
      </div>
      
      <svg viewBox="0 0 1000 400" className="w-full h-full">
        {/* Draw Edges */}
        {EDGES.map((edge, i) => {
          const fromNode = NODES.find(n => n.id === edge.from)!;
          const toNode = NODES.find(n => n.id === edge.to)!;
          
          if (edge.loop) {
            return (
              <g key={`edge-${i}`}>
                <path
                  d={`M ${fromNode.x - 10} ${fromNode.y - 30} A 20 20 0 1 1 ${fromNode.x + 10} ${fromNode.y - 30}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text x={fromNode.x} y={fromNode.y - 65} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">{edge.label}</text>
              </g>
            );
          }

          if (edge.curved) {
             const midX = (fromNode.x + toNode.x) / 2;
             const midY = (fromNode.y + toNode.y) / 2 + 100;
             return (
                <g key={`edge-${i}`}>
                  <path
                    d={`M ${fromNode.x} ${fromNode.y + 30} Q ${midX} ${midY} ${toNode.x} ${toNode.y + 30}`}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead-light)"
                  />
                   <text x={midX} y={midY - 10} textAnchor="middle" className="text-[10px] fill-slate-300 font-mono">{edge.label}</text>
                </g>
             );
          }

          return (
            <g key={`edge-${i}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#cbd5e1"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text 
                x={(fromNode.x + toNode.x) / 2} 
                y={(fromNode.y + toNode.y) / 2 - 10} 
                textAnchor="middle" 
                className="text-[10px] fill-slate-400 font-mono font-bold"
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Draw Nodes */}
        {NODES.map((node) => {
          const isActive = currentState === node.id;
          const isAccept = node.type === 'accept';
          const isBlocked = node.type === 'blocked';
          const isStart = node.type === 'start';

          return (
            <g key={node.id}>
              {/* Node Circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="30"
                initial={false}
                animate={{
                  fill: isActive ? (isBlocked ? '#ef4444' : isAccept ? '#22c55e' : '#3b82f6') : '#ffffff',
                  stroke: isActive ? (isBlocked ? '#991b1b' : isAccept ? '#166534' : '#1d4ed8') : '#94a3b8',
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                strokeWidth={isActive ? '4' : '2'}
                className="cursor-help"
              />
              
              {/* Accept State Double Ring */}
              {isAccept && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="25"
                  fill="none"
                  stroke={isActive ? '#166534' : '#94a3b8'}
                  strokeWidth="1"
                />
              )}

              {/* Start State Indicator */}
              {isStart && (
                <path
                  d={`M ${node.x - 60} ${node.y} L ${node.x - 35} ${node.y}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              )}

              {/* Label */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className={`text-[10px] font-mono font-bold pointer-events-none transition-colors duration-200 ${isActive ? 'fill-white' : 'fill-slate-600'}`}
              >
                {node.id.toUpperCase()}
              </text>
              <text
                x={node.x}
                y={node.y + 45}
                textAnchor="middle"
                className={`text-[9px] font-mono uppercase tracking-tighter ${isActive ? 'fill-slate-800 font-bold' : 'fill-slate-400'}`}
              >
                {node.label.split(':')[1].trim()}
              </text>
            </g>
          );
        })}

        {/* Definitions for arrowheads */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
          <marker id="arrowhead-light" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
