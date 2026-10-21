"use client";

import { useEffect, useRef } from "react";

export default function NursingGame() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | undefined;

    const launch = async () => {
      await document.fonts.ready;
      const PhaserModule = await import("phaser");
      const { CaseBriefScene } = await import("./CaseBriefScene");
      if (disposed || !stageRef.current) return;

      game = new PhaserModule.default.Game({
        type: PhaserModule.AUTO,
        parent: stageRef.current,
        width: 1728,
        height: 1152,
        backgroundColor: "#30221a",
        scale: {
          mode: PhaserModule.Scale.RESIZE,
          autoCenter: PhaserModule.Scale.CENTER_BOTH,
        },
        render: {
          antialias: true,
          pixelArt: false,
          roundPixels: true,
        },
        scene: [CaseBriefScene],
      });
    };

    void launch();

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="phaser-game-shell">
      <div ref={stageRef} className="phaser-stage" aria-label="ฉากจำลองการพยาบาล" />
    </main>
  );
}
