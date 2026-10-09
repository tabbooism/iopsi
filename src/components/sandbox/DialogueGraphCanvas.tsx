import React, { useRef, useEffect } from 'react';
import { DialogueNode } from '../../types';

interface DialogueGraphCanvasProps {
  dialogueTree: DialogueNode[];
  currentNodeId: string;
  onNodeClick: (nodeId: string) => void;
}

export const DialogueGraphCanvas: React.FC<DialogueGraphCanvasProps> = ({
  dialogueTree,
  currentNodeId,
  onNodeClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid dots
    ctx.fillStyle = '#1e293b';
    const gridSize = 24;
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    if (!dialogueTree || dialogueTree.length === 0) return;

    // Position calculation
    // Lay out nodes in columns or stages
    const nodeCoords = new Map<string, { x: number; y: number; label: string; active: boolean; isTerminal: boolean; speaker: string }>();
    const nodeCount = dialogueTree.length;

    dialogueTree.forEach((node, index) => {
      // Horizontal progressive layout
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 70 + col * ((width - 140) / 2);
      const y = 45 + row * 75;

      nodeCoords.set(node.id, {
        x: Math.min(width - 70, Math.max(70, x)),
        y: Math.min(height - 40, Math.max(40, y)),
        label: node.speakerName || node.id,
        active: node.id === currentNodeId,
        isTerminal: !!node.isTerminal,
        speaker: node.speaker
      });
    });

    // Draw connecting lines between nodes with options
    ctx.lineWidth = 1.5;
    dialogueTree.forEach(node => {
      const fromPos = nodeCoords.get(node.id);
      if (!fromPos) return;

      node.options?.forEach(opt => {
        const toPos = nodeCoords.get(opt.nextNodeId);
        if (toPos) {
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          // Curved bezier
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          ctx.quadraticCurveTo(midX, midY - 15, toPos.x, toPos.y);

          ctx.strokeStyle = opt.riskImpact === 'safe' 
            ? 'rgba(16, 185, 129, 0.4)' 
            : opt.riskImpact === 'fatal' 
            ? 'rgba(239, 68, 68, 0.4)' 
            : 'rgba(245, 158, 11, 0.4)';
          ctx.stroke();
        }
      });
    });

    // Draw node circles & text
    nodeCoords.forEach((pos, id) => {
      const isCurrent = pos.active;
      const radius = isCurrent ? 14 : 10;

      // Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

      if (pos.isTerminal) {
        ctx.fillStyle = isCurrent ? '#10b981' : '#334155';
      } else if (pos.speaker === 'scammer') {
        ctx.fillStyle = isCurrent ? '#f59e0b' : '#78350f';
      } else if (pos.speaker === 'accomplice') {
        ctx.fillStyle = isCurrent ? '#a855f7' : '#581c87';
      } else {
        ctx.fillStyle = isCurrent ? '#38bdf8' : '#0369a1';
      }
      ctx.fill();

      // Ring
      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#475569';
      ctx.stroke();

      // Label
      ctx.font = isCurrent ? 'bold 11px system-ui, sans-serif' : '10px system-ui, sans-serif';
      ctx.fillStyle = isCurrent ? '#f8fafc' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(pos.label.slice(0, 14), pos.x, pos.y + radius + 14);
    });

  }, [dialogueTree, currentNodeId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find nearest node within hit radius
    const width = rect.width;
    const height = rect.height;

    dialogueTree.forEach((node, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = Math.min(width - 70, Math.max(70, 70 + col * ((width - 140) / 2)));
      const y = Math.min(height - 40, Math.max(40, 45 + row * 75));

      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist <= 20) {
        onNodeClick(node.id);
      }
    });
  };

  return (
    <div className="relative w-full h-56 rounded-lg overflow-hidden border border-slate-800">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-pointer block"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Scammer</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Accomplice</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span> Target</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Exit</span>
      </div>
    </div>
  );
};
