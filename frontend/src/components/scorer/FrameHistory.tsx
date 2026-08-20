'use client';

interface CompletedFrame {
  frameNumber: number;
  player1Score: number;
  player2Score: number;
  winnerId: string;
}

interface FrameHistoryProps {
  frames: CompletedFrame[];
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
}

export default function FrameHistory({
  frames,
  player1Id,
  player2Id,
  player1Name,
  player2Name,
}: FrameHistoryProps) {
  if (frames.length === 0) return null;

  return (
    <div className="mt-3 px-3">
      <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        Frame History
      </h4>
      <div className="space-y-1">
        {frames.map((frame) => {
          const p1Won = frame.winnerId === player1Id;
          const p2Won = frame.winnerId === player2Id;

          return (
            <div
              key={frame.frameNumber}
              className="flex items-center justify-between bg-gray-900/60 rounded px-3 py-1.5 text-sm"
            >
              <span className="text-gray-500 w-8">F{frame.frameNumber}</span>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span
                  className={`score-num font-medium ${
                    p1Won ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  {frame.player1Score}
                </span>
                <span className="text-gray-600">-</span>
                <span
                  className={`score-num font-medium ${
                    p2Won ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  {frame.player2Score}
                </span>
              </div>
              <span className="text-xs text-gray-500 w-16 text-right truncate">
                {p1Won ? player1Name.split(' ').pop() : player2Name.split(' ').pop()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
