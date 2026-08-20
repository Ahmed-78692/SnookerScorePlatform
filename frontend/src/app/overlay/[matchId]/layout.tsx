import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snooker Score - OBS Overlay',
};

/**
 * Overlay layout uses a fully transparent background.
 * When loaded as an OBS Browser Source, only the scoreboard elements are visible.
 *
 * OBS Settings:
 * - Width: 1920, Height: 1080
 * - Custom CSS: body { background-color: rgba(0, 0, 0, 0); margin: 0; }
 *
 * URL Parameters:
 * - ?layout=bottom|top|minimal|left|scorebug|lower-third
 * - ?theme=dark|green
 * - ?tournament=true|false
 */
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {children}
    </div>
  );
}
